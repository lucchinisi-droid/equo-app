-- Equo · Trainer: agenda lezioni + chat con i proprietari collegati (17/10/2026)
-- Nessun dato esistente viene modificato: due tabelle nuove e alcune funzioni.
-- Si scrive solo con collegamenti ATTIVI (stesso consenso delle sedute). Se il proprietario revoca, lo storico resta leggibile ma non si scrive più.

-- 1) Lezioni dell'allenatore
create table if not exists public.trainer_lezioni (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references auth.users(id) on delete cascade,
  cavallo_id uuid references public.trainer_cavalli(id) on delete set null,
  horse_id uuid references public.horses(id) on delete set null,
  collegamento_id uuid references public.trainer_collegamenti(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  cavallo_nome text not null,
  tipo text not null default 'lezione' check (tipo in ('lezione','piano','salto','passeggiata','altro')),
  data date not null,
  ora time not null,
  durata_min int not null default 45 check (durata_min between 10 and 480),
  luogo text,
  ripeti text not null default 'mai' check (ripeti in ('mai','settimanale')),
  note text,
  stato text not null default 'solo_tua' check (stato in ('solo_tua','proposta','confermata','altro_orario','annullata')),
  seduta_id uuid references public.sedute(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists trainer_lezioni_trainer_data_idx on public.trainer_lezioni (trainer_id, data);
create index if not exists trainer_lezioni_owner_data_idx on public.trainer_lezioni (owner_id, data) where owner_id is not null;
alter table public.trainer_lezioni enable row level security;
drop policy if exists trainer_lezioni_sel on public.trainer_lezioni;
create policy trainer_lezioni_sel on public.trainer_lezioni for select
  using (trainer_id = auth.uid() or (owner_id = auth.uid() and stato <> 'solo_tua'));
-- scritture solo tramite le funzioni qui sotto (nessuna policy di insert/update/delete)

-- 2) Messaggi allenatore ↔ proprietario (legati al collegamento)
create table if not exists public.trainer_messaggi (
  id uuid primary key default gen_random_uuid(),
  collegamento_id uuid not null references public.trainer_collegamenti(id) on delete cascade,
  mittente_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null default 'testo' check (tipo in ('testo','seduta','lezione')),
  testo text,
  seduta_id uuid references public.sedute(id) on delete set null,
  lezione_id uuid references public.trainer_lezioni(id) on delete set null,
  letto boolean not null default false,
  created_at timestamptz not null default now(),
  check (tipo <> 'testo' or char_length(btrim(coalesce(testo, ''))) between 1 and 2000)
);
create index if not exists trainer_messaggi_coll_idx on public.trainer_messaggi (collegamento_id, created_at);
alter table public.trainer_messaggi enable row level security;
drop policy if exists trainer_messaggi_sel on public.trainer_messaggi;
create policy trainer_messaggi_sel on public.trainer_messaggi for select
  using (exists (select 1 from public.trainer_collegamenti c
                 where c.id = collegamento_id and (c.trainer_id = auth.uid() or c.owner_id = auth.uid())));

-- 3) Scrivere un messaggio (solo collegamento attivo)
create or replace function public.equo_chat_invia(p_coll uuid, p_testo text)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare c public.trainer_collegamenti%rowtype; v_id uuid;
begin
  if auth.uid() is null then raise exception 'Accedi di nuovo'; end if;
  select * into c from public.trainer_collegamenti where id = p_coll and (trainer_id = auth.uid() or owner_id = auth.uid());
  if not found then raise exception 'COLLEGAMENTO_NON_TROVATO'; end if;
  if c.stato <> 'attivo' then raise exception 'COLLEGAMENTO_NON_ATTIVO'; end if;
  if char_length(btrim(coalesce(p_testo, ''))) = 0 then raise exception 'MESSAGGIO_VUOTO'; end if;
  insert into public.trainer_messaggi (collegamento_id, mittente_id, tipo, testo)
  values (p_coll, auth.uid(), 'testo', left(btrim(p_testo), 2000)) returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end $function$;

-- 4) Segnare come letti i messaggi ricevuti
create or replace function public.equo_chat_letti(p_coll uuid)
 returns void language sql security definer set search_path to 'public'
as $function$
  update public.trainer_messaggi m set letto = true
   where m.collegamento_id = p_coll and m.mittente_id <> auth.uid() and m.letto = false
     and exists (select 1 from public.trainer_collegamenti c where c.id = p_coll and (c.trainer_id = auth.uid() or c.owner_id = auth.uid()));
$function$;

-- 5) Creare o modificare una lezione (l'allenatore). p_proponi = chiedere conferma al proprietario collegato.
create or replace function public.equo_lezione_salva(
  p_id uuid, p_cavallo uuid, p_data date, p_ora time, p_durata int, p_tipo text,
  p_luogo text, p_ripeti text, p_note text, p_proponi boolean, p_seduta uuid default null)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare
  cv public.trainer_cavalli%rowtype; col public.trainer_collegamenti%rowtype;
  old public.trainer_lezioni%rowtype; v_id uuid; v_stato text; v_cambiata boolean := false;
begin
  if auth.uid() is null then raise exception 'Accedi di nuovo'; end if;
  select * into cv from public.trainer_cavalli where id = p_cavallo and trainer_id = auth.uid();
  if not found then raise exception 'CAVALLO_NON_TROVATO'; end if;
  if p_seduta is not null and not exists (select 1 from public.sedute where id = p_seduta and trainer_id = auth.uid()) then
    raise exception 'SEDUTA_NON_VALIDA';
  end if;
  if cv.horse_id is not null then
    select * into col from public.trainer_collegamenti
     where trainer_id = auth.uid() and horse_id = cv.horse_id and stato = 'attivo' limit 1;
  end if;
  if p_proponi and col.id is null then raise exception 'NESSUN_PROPRIETARIO_COLLEGATO'; end if;

  if p_id is not null then
    select * into old from public.trainer_lezioni where id = p_id and trainer_id = auth.uid();
    if not found then raise exception 'LEZIONE_NON_TROVATA'; end if;
    if old.stato = 'annullata' then raise exception 'LEZIONE_ANNULLATA'; end if;
    v_cambiata := (old.data, old.ora, old.durata_min, coalesce(old.luogo,'')) is distinct from (p_data, p_ora, coalesce(p_durata, 45), coalesce(p_luogo,''));
    if col.id is not null and (p_proponi or old.stato <> 'solo_tua') then
      v_stato := case when v_cambiata or old.stato in ('proposta','altro_orario') then 'proposta' else old.stato end;
    else v_stato := 'solo_tua'; end if;
    update public.trainer_lezioni set
      cavallo_id = cv.id, horse_id = cv.horse_id, collegamento_id = col.id, owner_id = col.owner_id,
      cavallo_nome = cv.nome, tipo = p_tipo, data = p_data, ora = p_ora, durata_min = coalesce(p_durata, 45),
      luogo = nullif(btrim(coalesce(p_luogo,'')), ''), ripeti = coalesce(p_ripeti, 'mai'), note = nullif(btrim(coalesce(p_note,'')), ''),
      stato = v_stato, seduta_id = p_seduta, updated_at = now()
     where id = p_id returning id into v_id;
    if v_stato = 'proposta' and (old.stato <> 'proposta' or v_cambiata) then
      insert into public.trainer_messaggi (collegamento_id, mittente_id, tipo, lezione_id) values (col.id, auth.uid(), 'lezione', v_id);
    end if;
  else
    v_stato := case when col.id is not null and p_proponi then 'proposta' else 'solo_tua' end;
    insert into public.trainer_lezioni (trainer_id, cavallo_id, horse_id, collegamento_id, owner_id, cavallo_nome, tipo, data, ora, durata_min, luogo, ripeti, note, stato, seduta_id)
    values (auth.uid(), cv.id, cv.horse_id, col.id, col.owner_id, cv.nome, p_tipo, p_data, p_ora, coalesce(p_durata, 45),
            nullif(btrim(coalesce(p_luogo,'')), ''), coalesce(p_ripeti, 'mai'), nullif(btrim(coalesce(p_note,'')), ''), v_stato, p_seduta)
    returning id into v_id;
    if v_stato = 'proposta' then
      insert into public.trainer_messaggi (collegamento_id, mittente_id, tipo, lezione_id) values (col.id, auth.uid(), 'lezione', v_id);
    end if;
  end if;
  return jsonb_build_object('ok', true, 'id', v_id, 'stato', v_stato);
end $function$;

-- 6) Il proprietario conferma o chiede un altro orario
create or replace function public.equo_lezione_rispondi(p_id uuid, p_accetta boolean)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare l public.trainer_lezioni%rowtype; v_stato text; v_att boolean;
begin
  if auth.uid() is null then raise exception 'Accedi di nuovo'; end if;
  select * into l from public.trainer_lezioni where id = p_id and owner_id = auth.uid();
  if not found then raise exception 'LEZIONE_NON_TROVATA'; end if;
  if l.stato <> 'proposta' then raise exception 'LEZIONE_NON_IN_ATTESA'; end if;
  select (stato = 'attivo') into v_att from public.trainer_collegamenti where id = l.collegamento_id;
  if not coalesce(v_att, false) then raise exception 'COLLEGAMENTO_NON_ATTIVO'; end if;
  v_stato := case when p_accetta then 'confermata' else 'altro_orario' end;
  update public.trainer_lezioni set stato = v_stato, updated_at = now() where id = p_id;
  insert into public.trainer_messaggi (collegamento_id, mittente_id, tipo, testo)
  values (l.collegamento_id, auth.uid(), 'testo',
    case when p_accetta then 'Confermo la lezione di ' || to_char(l.data, 'DD/MM') || ' alle ' || to_char(l.ora, 'HH24:MI') || '.'
         else 'Vorrei un altro orario per la lezione di ' || to_char(l.data, 'DD/MM') || ' alle ' || to_char(l.ora, 'HH24:MI') || '. Possiamo sentirci qui?' end);
  return jsonb_build_object('ok', true, 'stato', v_stato);
end $function$;

-- 7) L'allenatore annulla una lezione (se era proposta al proprietario, lui lo vede in chat)
create or replace function public.equo_lezione_annulla(p_id uuid)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare l public.trainer_lezioni%rowtype; v_att boolean;
begin
  if auth.uid() is null then raise exception 'Accedi di nuovo'; end if;
  select * into l from public.trainer_lezioni where id = p_id and trainer_id = auth.uid();
  if not found then raise exception 'LEZIONE_NON_TROVATA'; end if;
  if l.stato = 'annullata' then return jsonb_build_object('ok', true, 'stato', 'annullata'); end if;
  update public.trainer_lezioni set stato = 'annullata', updated_at = now() where id = p_id;
  if l.stato <> 'solo_tua' and l.collegamento_id is not null then
    select (stato = 'attivo') into v_att from public.trainer_collegamenti where id = l.collegamento_id;
    if coalesce(v_att, false) then
      insert into public.trainer_messaggi (collegamento_id, mittente_id, tipo, testo)
      values (l.collegamento_id, auth.uid(), 'testo', 'Lezione del ' || to_char(l.data, 'DD/MM') || ' alle ' || to_char(l.ora, 'HH24:MI') || ' annullata.');
    end if;
  end if;
  return jsonb_build_object('ok', true, 'stato', 'annullata');
end $function$;

-- 8) Dopo l'invio di una seduta, compare come scheda nella chat dei proprietari collegati
create or replace function public.equo_chat_scheda_seduta(p_seduta uuid)
 returns int language plpgsql security definer set search_path to 'public'
as $function$
declare s public.sedute%rowtype; n int := 0; c record;
begin
  if auth.uid() is null then raise exception 'Accedi di nuovo'; end if;
  select * into s from public.sedute where id = p_seduta and trainer_id = auth.uid() and stato = 'inviata';
  if not found or s.horse_id is null then return 0; end if;
  for c in select id from public.trainer_collegamenti
            where trainer_id = auth.uid() and horse_id = s.horse_id and stato = 'attivo'
              and not exists (select 1 from public.trainer_messaggi m where m.collegamento_id = trainer_collegamenti.id and m.seduta_id = p_seduta)
  loop
    insert into public.trainer_messaggi (collegamento_id, mittente_id, tipo, seduta_id) values (c.id, auth.uid(), 'seduta', p_seduta);
    n := n + 1;
  end loop;
  return n;
end $function$;

-- 9) Lezioni viste dal proprietario (con il nome dell'istruttore)
create or replace function public.equo_lezioni_proprietario()
 returns jsonb language sql stable security definer set search_path to 'public'
as $function$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', l.id, 'data', l.data, 'ora', to_char(l.ora, 'HH24:MI'), 'durata_min', l.durata_min, 'tipo', l.tipo,
    'cavallo', l.cavallo_nome, 'luogo', l.luogo, 'stato', l.stato, 'collegamento_id', l.collegamento_id,
    'trainer', coalesce(nullif(trim(p.full_name), ''), 'Istruttore')) order by l.data, l.ora), '[]'::jsonb)
  from public.trainer_lezioni l
  left join public.profiles p on p.id = l.trainer_id
  where l.owner_id = auth.uid() and l.stato in ('proposta','confermata','altro_orario') and l.data >= current_date - 1;
$function$;

-- Solo utenti collegati: niente accesso anonimo
revoke all on function public.equo_chat_invia(uuid, text) from public, anon;
revoke all on function public.equo_chat_letti(uuid) from public, anon;
revoke all on function public.equo_lezione_salva(uuid, uuid, date, time, int, text, text, text, text, boolean, uuid) from public, anon;
revoke all on function public.equo_lezione_rispondi(uuid, boolean) from public, anon;
revoke all on function public.equo_lezione_annulla(uuid) from public, anon;
revoke all on function public.equo_chat_scheda_seduta(uuid) from public, anon;
revoke all on function public.equo_lezioni_proprietario() from public, anon;
grant execute on function public.equo_chat_invia(uuid, text) to authenticated;
grant execute on function public.equo_chat_letti(uuid) to authenticated;
grant execute on function public.equo_lezione_salva(uuid, uuid, date, time, int, text, text, text, text, boolean, uuid) to authenticated;
grant execute on function public.equo_lezione_rispondi(uuid, boolean) to authenticated;
grant execute on function public.equo_lezione_annulla(uuid) to authenticated;
grant execute on function public.equo_chat_scheda_seduta(uuid) to authenticated;
grant execute on function public.equo_lezioni_proprietario() to authenticated;
