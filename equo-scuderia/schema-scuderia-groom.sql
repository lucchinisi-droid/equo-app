begin;

-- ================= EQUO GROOM: personale di stalla senza account (QR + PIN) =================
create table if not exists public.scuderia_groom (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.centri(id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 60),
  lingua text not null default 'it' check (lingua in ('it','en','ro','hi','pa','bn','ar')),
  token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  pin_hash text,
  tentativi int not null default 0,
  attivo boolean not null default true,
  ultimo_accesso timestamptz,
  creato_da uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists scuderia_groom_centro_idx on public.scuderia_groom(centro_id);
alter table public.scuderia_groom enable row level security;
-- nessun accesso diretto alla tabella: si passa solo dalle funzioni qui sotto
revoke all on public.scuderia_groom from anon, authenticated;

-- le spunte fatte dal groom si riconoscono
alter table public.scuderia_box_attivita drop constraint if exists scuderia_box_attivita_fonte_check;
alter table public.scuderia_box_attivita add constraint scuderia_box_attivita_fonte_check
  check (fonte = any (array['manuale','display','gps','telecamera','sensore','groom']));

-- limite per pacchetto: START 0 · ADVANCE 3 · PREMIUM 10 · completo/enterprise 50
create or replace function public.groom_limite(p_centro_id uuid) returns int
language sql stable security definer set search_path = public as $$
  select case (centro_limiti(p_centro_id)->>'pacchetto') when 'start' then 0 when 'advance' then 3 when 'premium' then 10 else 50 end;
$$;

-- ---------------- lato gestionale ----------------
create or replace function public.groom_elenco(p_centro_id uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare gestisce boolean := can_gestire_box(p_centro_id);
begin
  if not gestisce and not exists (select 1 from scuderia_membri where centro_id = p_centro_id and user_id = auth.uid()) then
    raise exception 'Non autorizzato.'; end if;
  return jsonb_build_object('limite', groom_limite(p_centro_id), 'gestisce', gestisce,
    'groom', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'nome', nome, 'lingua', lingua, 'attivo', attivo,
        'pin_creato', pin_hash is not null, 'bloccato', tentativi >= 10, 'ultimo_accesso', ultimo_accesso, 'created_at', created_at,
        'token', case when gestisce and attivo then token end) order by attivo desc, nome)
      from scuderia_groom where centro_id = p_centro_id), '[]'::jsonb));
end $$;

create or replace function public.groom_crea(p_centro_id uuid, p_nome text, p_lingua text default 'it') returns jsonb
language plpgsql security definer set search_path = public as $$
declare lim int; n int; g scuderia_groom;
begin
  if not can_gestire_box(p_centro_id) then raise exception 'Solo l''amministratore o un membro di livello 2-3 può aggiungere groom.'; end if;
  lim := groom_limite(p_centro_id);
  if lim = 0 then raise exception 'L''app Groom è inclusa da ADVANCE.'; end if;
  select count(*) into n from scuderia_groom where centro_id = p_centro_id and attivo;
  if n >= lim then raise exception 'Hai già % groom attivi: è il massimo del tuo pacchetto%.', lim, case when lim < 10 then ' (con PREMIUM arrivi a 10)' else '' end; end if;
  insert into scuderia_groom (centro_id, nome, lingua) values (p_centro_id, trim(p_nome), coalesce(nullif(p_lingua, ''), 'it')) returning * into g;
  return jsonb_build_object('id', g.id, 'token', g.token);
end $$;

-- nuovo QR (telefono cambiato o PIN dimenticato): il vecchio link smette di funzionare, il PIN si sceglie di nuovo
create or replace function public.groom_nuovo_qr(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g scuderia_groom;
begin
  select * into g from scuderia_groom where id = p_id;
  if g.id is null or not can_gestire_box(g.centro_id) then raise exception 'Non autorizzato.'; end if;
  update scuderia_groom set token = encode(extensions.gen_random_bytes(18), 'hex'), pin_hash = null, tentativi = 0 where id = p_id returning * into g;
  return jsonb_build_object('id', g.id, 'token', g.token);
end $$;

create or replace function public.groom_attiva(p_id uuid, p_attivo boolean) returns void
language plpgsql security definer set search_path = public as $$
declare g scuderia_groom; n int;
begin
  select * into g from scuderia_groom where id = p_id;
  if g.id is null or not can_gestire_box(g.centro_id) then raise exception 'Non autorizzato.'; end if;
  if p_attivo and not g.attivo then
    select count(*) into n from scuderia_groom where centro_id = g.centro_id and attivo;
    if n >= groom_limite(g.centro_id) then raise exception 'Hai raggiunto il massimo di groom del tuo pacchetto.'; end if;
    update scuderia_groom set attivo = true, token = encode(extensions.gen_random_bytes(18), 'hex'), pin_hash = null, tentativi = 0 where id = p_id;
  elsif not p_attivo then
    update scuderia_groom set attivo = false, token = encode(extensions.gen_random_bytes(18), 'hex') where id = p_id;
  end if;
end $$;

create or replace function public.groom_elimina(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare g scuderia_groom;
begin
  select * into g from scuderia_groom where id = p_id;
  if g.id is null or not can_gestire_box(g.centro_id) then raise exception 'Non autorizzato.'; end if;
  delete from scuderia_groom where id = p_id;
end $$;

-- ---------------- lato app Groom (token del QR + PIN) ----------------
create or replace function public.groom_verifica(p_token text, p_pin text) returns scuderia_groom
language plpgsql security definer set search_path = public as $$
declare g scuderia_groom;
begin
  select * into g from scuderia_groom where token = p_token;
  if g.id is null or not g.attivo then raise exception 'GROOM_NON_VALIDO'; end if;
  if g.tentativi >= 10 then raise exception 'GROOM_BLOCCATO'; end if;
  if coalesce(p_pin, '') !~ '^[0-9]{4}$' then raise exception 'GROOM_PIN_ERRATO'; end if;
  if g.pin_hash is null then
    update scuderia_groom set pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf')), tentativi = 0, ultimo_accesso = now() where id = g.id returning * into g;
  elsif g.pin_hash = extensions.crypt(p_pin, g.pin_hash) then
    update scuderia_groom set tentativi = 0, ultimo_accesso = now() where id = g.id returning * into g;
  else
    update scuderia_groom set tentativi = tentativi + 1 where id = g.id;
    return null;
  end if;
  return g;
end $$;

create or replace function public.groom_info(p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select case when g.id is null or not g.attivo then jsonb_build_object('valido', false)
    else jsonb_build_object('valido', true, 'nome', g.nome, 'lingua', g.lingua, 'pin_da_creare', g.pin_hash is null, 'bloccato', g.tentativi >= 10,
      'centro', (select nome from centri where id = g.centro_id)) end
  from (select 1) x left join scuderia_groom g on g.token = p_token;
$$;

create or replace function public.groom_stalla(p_token text, p_pin text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g scuderia_groom; oggi date := (now() at time zone 'Europe/Rome')::date;
begin
  g := groom_verifica(p_token, p_pin);
  if g.id is null then return jsonb_build_object('errore', 'GROOM_PIN_ERRATO'); end if;
  return jsonb_build_object(
    'groom', g.nome, 'lingua', g.lingua, 'oggi', oggi,
    'centro', (select nome from centri where id = g.centro_id),
    'icone_extra', (select coalesce(to_jsonb(box_icone_extra), '[]'::jsonb) from centri where id = g.centro_id),
    'box', coalesce((select jsonb_agg(jsonb_build_object(
        'id', b.id, 'numero', b.numero, 'nome', b.nome, 'zona', b.zona, 'manutenzione', b.manutenzione, 'stato', b.stato_cavallo,
        'cavallo', c.nome, 'foto', c.foto_url, 'nota', c.nota_box,
        'fatte', coalesce((select jsonb_agg(jsonb_build_object('tipo', a.tipo, 'ora', to_char(a.fatto_il at time zone 'Europe/Rome', 'HH24:MI'), 'da', a.fatto_da_nome))
                  from scuderia_box_attivita a where a.giorno = oggi and a.cavallo_id = c.id), '[]'::jsonb)
      ) order by b.zona nulls first, b.numero) from scuderia_box b left join scuderia_cavalli c on c.id = b.cavallo_id where b.centro_id = g.centro_id), '[]'::jsonb));
end $$;

-- segna / toglie un'attività di oggi (p_quando: ora reale quando la spunta era in coda senza rete)
create or replace function public.groom_segna(p_token text, p_pin text, p_box uuid, p_tipo text, p_fatto boolean, p_quando timestamptz default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g scuderia_groom; b scuderia_box; oggi date := (now() at time zone 'Europe/Rome')::date; q timestamptz;
begin
  g := groom_verifica(p_token, p_pin);
  if g.id is null then return jsonb_build_object('errore', 'GROOM_PIN_ERRATO'); end if;
  select * into b from scuderia_box where id = p_box and centro_id = g.centro_id;
  if b.id is null or b.cavallo_id is null then return jsonb_build_object('errore', 'BOX_VUOTO'); end if;
  q := case when p_quando is not null and p_quando <= now() and (p_quando at time zone 'Europe/Rome')::date = oggi then p_quando else now() end;
  if p_fatto then
    insert into scuderia_box_attivita (centro_id, box_id, cavallo_id, tipo, giorno, fatto_il, fatto_da, fatto_da_nome, fonte)
    values (g.centro_id, b.id, b.cavallo_id, p_tipo, oggi, q, null, g.nome, 'groom')
    on conflict (cavallo_id, tipo, giorno) where cavallo_id is not null do nothing;
  else
    delete from scuderia_box_attivita where cavallo_id = b.cavallo_id and tipo = p_tipo and giorno = oggi;
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.groom_lingua(p_token text, p_pin text, p_lingua text) returns void
language plpgsql security definer set search_path = public as $$
declare g scuderia_groom;
begin
  g := groom_verifica(p_token, p_pin);
  if g.id is not null then update scuderia_groom set lingua = p_lingua where id = g.id; end if;
end $$;

revoke all on function public.groom_verifica(text, text) from public, anon, authenticated;
revoke all on function public.groom_elenco(uuid), public.groom_crea(uuid, text, text), public.groom_nuovo_qr(uuid), public.groom_attiva(uuid, boolean), public.groom_elimina(uuid), public.groom_limite(uuid) from public, anon;
grant execute on function public.groom_elenco(uuid), public.groom_crea(uuid, text, text), public.groom_nuovo_qr(uuid), public.groom_attiva(uuid, boolean), public.groom_elimina(uuid), public.groom_limite(uuid) to authenticated;
revoke all on function public.groom_info(text), public.groom_stalla(text, text), public.groom_segna(text, text, uuid, text, boolean, timestamptz), public.groom_lingua(text, text, text) from public;
grant execute on function public.groom_info(text), public.groom_stalla(text, text), public.groom_segna(text, text, uuid, text, boolean, timestamptz), public.groom_lingua(text, text, text) to anon, authenticated;

commit;

select 'groom pronto' as esito, count(*) as groom_presenti from public.scuderia_groom;
