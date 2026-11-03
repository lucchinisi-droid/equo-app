-- Equo: ANAGRAFICA CLIENTI UNICA (3 novembre 2026) · SQL 37 · Fase 2 del piano di lavoro Scuderia
-- Ogni allievo, genitore e proprietario è un cliente vero, anche senza app:
--  · scuderia_clienti_dati = telefono, email, data di nascita, referente (per i minori), note, consenso privacy.
--    Tabella a parte, così i dati di contatto li vedono SOLO admin e livelli 2 e 3 (decisione di Simone, 3/11),
--    mentre nome e ruolo restano visibili a tutto lo staff come prima (scuderia_membri).
--  · un minore (meno di 18 anni) deve avere un referente adulto dello stesso centro.
--  · salva_cliente(...) crea o modifica un cliente (allievo o proprietario), anche senza account.
--  · pacchetti nuovi: il cliente (membro_id) è obbligatorio; i vecchi restano com'erano finché non si collegano.
--  · limite del team: allievi e proprietari sono clienti, non team (prima gli allievi consumavano i posti).
-- Rieseguibile. Il controllo finale deve dare 1 · 1 · 1 · 1 · false.

-- 1 · chi vede i dati dei clienti ----------------------------------------------------------------------
create or replace function public.puo_vedere_clienti(p_centro uuid) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select auth.uid() is not null and exists (select 1 from scuderia_membri m
    where m.centro_id = p_centro and m.user_id = auth.uid() and (m.ruolo = 'admin' or m.livello in ('admin', '2', '3')))
$$;
revoke all on function public.puo_vedere_clienti(uuid) from public, anon;
grant execute on function public.puo_vedere_clienti(uuid) to authenticated, service_role;

-- 2 · dati dei clienti --------------------------------------------------------------------------------
create table if not exists public.scuderia_clienti_dati (
  membro_id uuid primary key references public.scuderia_membri(id) on delete cascade,
  centro_id uuid not null references public.centri(id) on delete cascade,
  telefono text check (telefono is null or length(telefono) <= 30),
  email text check (email is null or (length(email) <= 120 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  data_nascita date check (data_nascita is null or data_nascita between date '1900-01-01' and current_date),
  referente_id uuid references public.scuderia_membri(id) on delete set null,
  note text check (note is null or length(note) <= 1000),
  consenso_privacy_il date,
  aggiornato_il timestamptz not null default now(),
  check (referente_id is null or referente_id <> membro_id)
);
create index if not exists scuderia_clienti_dati_centro_idx on public.scuderia_clienti_dati (centro_id);
create index if not exists scuderia_clienti_dati_referente_idx on public.scuderia_clienti_dati (referente_id);

alter table public.scuderia_clienti_dati enable row level security;
drop policy if exists clienti_dati_tutto on public.scuderia_clienti_dati;
create policy clienti_dati_tutto on public.scuderia_clienti_dati for all to authenticated
  using (public.puo_vedere_clienti(centro_id)) with check (public.puo_vedere_clienti(centro_id));

-- coerenza: stesso centro del membro e del referente; minore → referente obbligatorio
create or replace function public.clienti_dati_controlla() returns trigger
language plpgsql set search_path to 'public' as $$
begin
  if not exists (select 1 from scuderia_membri where id = new.membro_id and centro_id = new.centro_id) then
    raise exception 'CLIENTE_ALTRO_CENTRO'; end if;
  if new.referente_id is not null and not exists (select 1 from scuderia_membri where id = new.referente_id and centro_id = new.centro_id) then
    raise exception 'REFERENTE_ALTRO_CENTRO'; end if;
  if new.data_nascita is not null and new.data_nascita > (current_date - interval '18 years')::date and new.referente_id is null then
    raise exception 'MINORE_SENZA_REFERENTE'; end if;
  new.aggiornato_il := now();
  return new;
end $$;
drop trigger if exists trg_clienti_dati_controlla on public.scuderia_clienti_dati;
create trigger trg_clienti_dati_controlla before insert or update on public.scuderia_clienti_dati
  for each row execute function public.clienti_dati_controlla();

-- 3 · crea o modifica un cliente ----------------------------------------------------------------------
create or replace function public.salva_cliente(
  p_centro uuid, p_membro uuid, p_ruolo text, p_nome text,
  p_telefono text default null, p_email text default null, p_data_nascita date default null,
  p_referente uuid default null, p_note text default null, p_consenso boolean default false)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_id uuid := p_membro; v_ruolo text; v_consenso date;
begin
  if not puo_vedere_clienti(p_centro) then raise exception 'NON_AUTORIZZATO'; end if;
  if coalesce(trim(p_nome), '') = '' then raise exception 'NOME_MANCANTE'; end if;
  if v_id is null then
    if p_ruolo not in ('allievo', 'proprietario') then raise exception 'RUOLO_CLIENTE'; end if;
    insert into scuderia_membri (centro_id, user_id, ruolo, nome_visualizzato, livello, permessi)
    values (p_centro, null, p_ruolo, left(trim(p_nome), 80), '1', '{}'::jsonb) returning id into v_id;
  else
    select ruolo into v_ruolo from scuderia_membri where id = v_id and centro_id = p_centro;
    if v_ruolo is null then raise exception 'CLIENTE_NON_TROVATO'; end if;
    if v_ruolo not in ('allievo', 'proprietario') then raise exception 'NON_E_UN_CLIENTE'; end if;
    update scuderia_membri set nome_visualizzato = left(trim(p_nome), 80),
      ruolo = case when p_ruolo in ('allievo', 'proprietario') then p_ruolo else ruolo end
     where id = v_id;
  end if;
  select consenso_privacy_il into v_consenso from scuderia_clienti_dati where membro_id = v_id;
  insert into scuderia_clienti_dati (membro_id, centro_id, telefono, email, data_nascita, referente_id, note, consenso_privacy_il)
  values (v_id, p_centro, nullif(trim(p_telefono), ''), nullif(lower(trim(p_email)), ''), p_data_nascita, p_referente,
          nullif(trim(p_note), ''), case when p_consenso then coalesce(v_consenso, current_date) end)
  on conflict (membro_id) do update set telefono = excluded.telefono, email = excluded.email, data_nascita = excluded.data_nascita,
    referente_id = excluded.referente_id, note = excluded.note, consenso_privacy_il = excluded.consenso_privacy_il;
  return v_id;
end $$;
revoke all on function public.salva_cliente(uuid, uuid, text, text, text, text, date, uuid, text, boolean) from public, anon;
grant execute on function public.salva_cliente(uuid, uuid, text, text, text, text, date, uuid, text, boolean) to authenticated, service_role;

-- 4 · pacchetti nuovi: cliente obbligatorio e dello stesso centro --------------------------------------
create or replace function public.pacchetti_cliente_obbligatorio() returns trigger
language plpgsql set search_path to 'public' as $$
begin
  if new.membro_id is null then
    if tg_op = 'INSERT' or old.membro_id is not null then raise exception 'PACCHETTO_SENZA_CLIENTE'; end if;
  elsif not exists (select 1 from scuderia_membri where id = new.membro_id and centro_id = new.centro_id) then
    raise exception 'CLIENTE_ALTRO_CENTRO';
  end if;
  return new;
end $$;
drop trigger if exists trg_pacchetti_cliente on public.scuderia_pacchetti;
create trigger trg_pacchetti_cliente before insert or update of membro_id, centro_id on public.scuderia_pacchetti
  for each row execute function public.pacchetti_cliente_obbligatorio();

-- 5 · limite del team: allievi e proprietari non contano -----------------------------------------------
create or replace function public.limite_team() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare n bigint;
begin
  if new.ruolo in ('proprietario', 'allievo') then return new; end if;
  if tg_op = 'UPDATE' and old.ruolo not in ('proprietario', 'allievo') then return new; end if;
  select count(*) into n from scuderia_membri where centro_id = new.centro_id and ruolo not in ('proprietario', 'allievo') and id <> new.id;
  if centro_limite_supera(new.centro_id, 'team', n) then
    raise exception 'Il team di questo centro è al completo (% persone con il pacchetto attuale): serve il pacchetto %.', (centro_limiti(new.centro_id)->>'team'), nome_pacchetto_superiore(new.centro_id);
  end if;
  return new;
end $$;
revoke execute on function public.limite_team() from public, anon;
-- e nel riepilogo del pacchetto (centro_piano) lo stesso conteggio
do $$
declare v_def text;
begin
  v_def := pg_get_functiondef('public.centro_piano'::regproc);
  if position('ruolo not in (''proprietario'', ''allievo'')' in v_def) = 0 then
    v_def := replace(v_def, 'where centro_id = p_centro_id and ruolo <> ''proprietario''',
                            'where centro_id = p_centro_id and ruolo not in (''proprietario'', ''allievo'')');
    execute v_def;
  end if;
end $$;

-- controllo finale: deve dare 1 · 1 · 1 · 1 · false
select (select count(*) from pg_tables where schemaname = 'public' and tablename = 'scuderia_clienti_dati') as tabella,
       (select count(*) from pg_proc where proname = 'salva_cliente') as funzione,
       (select count(*) from pg_trigger where tgname = 'trg_pacchetti_cliente') as trigger_pacchetti,
       (select count(*) from pg_proc where proname = 'centro_piano' and pg_get_functiondef(oid) like '%ruolo not in (''proprietario'', ''allievo'')%') as piano_aggiornato,
       has_function_privilege('anon', 'public.salva_cliente(uuid, uuid, text, text, text, text, date, uuid, text, boolean)', 'EXECUTE') as aperta_a_anon;
