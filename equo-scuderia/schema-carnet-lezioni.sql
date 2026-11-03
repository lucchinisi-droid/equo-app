-- Equo: CARNET COLLEGATO ALLE LEZIONI (3 novembre 2026) · SQL 40 · Fase 3 del piano di lavoro Scuderia
-- Prima completare una lezione non scalava il carnet: il contatore si cambiava a mano. Ora lo fa il database:
--  · scuderia_lezioni.pacchetto_id = il carnet da cui scalare (se manca, alla lezione completata si sceglie da solo
--    il carnet valido dell'allievo o del suo referente che scade prima);
--  · scuderia_crediti_movimenti = ogni credito usato o restituito, con motivo (lezione, disdetta tardiva, restituito,
--    correzione, iniziale) e lezione collegata; scuderia_pacchetti.unita_usate = somma dei movimenti;
--  · «completata» scala 1 credito; tornare indietro lo restituisce; mai due scali per la stessa lezione;
--  · «annullata» entro centri.disdetta_ore ore dall'inizio (default 24) = disdetta tardiva: il credito si consuma;
--  · si parte da centri.scalo_dal (oggi): le lezioni prima di quella data non vengono toccate;
--  · correzioni a mano solo con motivo (correggi_crediti); promemoria in chat al cliente quando restano 2 lezioni e a 0.
-- Rieseguibile. Il controllo finale deve dare 1 · 1 · 1 · 0.

-- 1 · colonne e impostazioni --------------------------------------------------------------------------
alter table public.scuderia_lezioni add column if not exists pacchetto_id uuid references public.scuderia_pacchetti(id) on delete set null;
create index if not exists scuderia_lezioni_pacchetto_idx on public.scuderia_lezioni (pacchetto_id);
alter table public.centri add column if not exists disdetta_ore int not null default 24;
alter table public.centri add column if not exists scalo_dal date not null default current_date;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'centri_disdetta_ore_valide') then
    alter table public.centri add constraint centri_disdetta_ore_valide check (disdetta_ore between 0 and 168);
  end if;
end $$;

-- 2 · movimenti di credito ----------------------------------------------------------------------------
create table if not exists public.scuderia_crediti_movimenti (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.centri(id) on delete cascade,
  pacchetto_id uuid not null references public.scuderia_pacchetti(id) on delete cascade,
  lezione_id uuid references public.scuderia_lezioni(id) on delete set null,
  quantita int not null check (quantita between -999 and 999 and quantita <> 0),   -- + consuma, − restituisce
  motivo text not null check (motivo in ('lezione', 'disdetta_tardiva', 'restituito', 'correzione', 'iniziale')),
  nota text check (nota is null or length(nota) <= 200),
  creato_da uuid default auth.uid(),
  creato_il timestamptz not null default now()
);
create index if not exists crediti_mov_pacchetto_idx on public.scuderia_crediti_movimenti (pacchetto_id, creato_il);
create index if not exists crediti_mov_lezione_idx on public.scuderia_crediti_movimenti (lezione_id);
alter table public.scuderia_crediti_movimenti enable row level security;
drop policy if exists crediti_mov_leggi on public.scuderia_crediti_movimenti;
create policy crediti_mov_leggi on public.scuderia_crediti_movimenti for select to authenticated using (public.is_member_of_centro(centro_id));
-- niente scrittura diretta: scrivono i trigger e correggi_crediti

-- 3 · unita_usate segue i movimenti; ogni modifica a mano diventa una «correzione» ------------------------
create or replace function public.crediti_ricalcola(p_pacchetto uuid) returns void
language plpgsql security definer set search_path to 'public' as $$
declare v_usate int; v_tot int; v_membro uuid; v_user uuid; v_centro uuid; v_prima int;
begin
  select unita_usate, unita_totali, membro_id, centro_id into v_prima, v_tot, v_membro, v_centro from scuderia_pacchetti where id = p_pacchetto;
  select coalesce(sum(quantita), 0) into v_usate from scuderia_crediti_movimenti where pacchetto_id = p_pacchetto;
  perform set_config('equo.crediti', 'on', true);
  update scuderia_pacchetti set unita_usate = greatest(v_usate, 0) where id = p_pacchetto and unita_usate is distinct from greatest(v_usate, 0);
  perform set_config('equo.crediti', '', true);
  -- promemoria al cliente con l'app: restano 2 lezioni, oppure carnet finito
  if v_tot is not null and coalesce(v_prima, 0) < v_usate and (v_tot - v_usate) in (2, 0) then
    select user_id into v_user from scuderia_membri where id = v_membro and user_id is not null;
    if v_user is not null and v_user is distinct from auth.uid() then
      insert into chat_messaggi (centro_id, membro_id, mittente_user_id, tipo, testo, letto)
      values (v_centro, v_membro, coalesce(auth.uid(), v_user), 'testo',
        case when v_tot - v_usate = 2 then '🎟️ Nel tuo carnet restano 2 lezioni. Chiedi in scuderia per rinnovarlo.'
             else '🎟️ Il tuo carnet è finito: per le prossime lezioni chiedi in scuderia un nuovo carnet.' end, false);
    end if;
  end if;
end $$;
revoke all on function public.crediti_ricalcola(uuid) from public, anon, authenticated;

create or replace function public.crediti_mov_dopo() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  perform crediti_ricalcola(coalesce(new.pacchetto_id, old.pacchetto_id));
  return null;
end $$;
revoke all on function public.crediti_mov_dopo() from public, anon, authenticated;
drop trigger if exists trg_crediti_mov_dopo on public.scuderia_crediti_movimenti;
create trigger trg_crediti_mov_dopo after insert or delete on public.scuderia_crediti_movimenti
  for each row execute function public.crediti_mov_dopo();

create or replace function public.pacchetti_usate_come_movimento() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if coalesce(current_setting('equo.crediti', true), '') = 'on' then return null; end if;
  if tg_op = 'INSERT' then
    if coalesce(new.unita_usate, 0) <> 0 then
      insert into scuderia_crediti_movimenti (centro_id, pacchetto_id, quantita, motivo, nota)
      values (new.centro_id, new.id, new.unita_usate, 'iniziale', 'lezioni già usate quando è stato inserito');
    end if;
  elsif coalesce(new.unita_usate, 0) <> coalesce(old.unita_usate, 0) then
    insert into scuderia_crediti_movimenti (centro_id, pacchetto_id, quantita, motivo, nota)
    values (new.centro_id, new.id, coalesce(new.unita_usate, 0) - coalesce(old.unita_usate, 0), 'correzione', 'modifica a mano del pacchetto');
  end if;
  return null;
end $$;
revoke all on function public.pacchetti_usate_come_movimento() from public, anon, authenticated;
drop trigger if exists trg_pacchetti_usate on public.scuderia_pacchetti;
create trigger trg_pacchetti_usate after insert or update of unita_usate on public.scuderia_pacchetti
  for each row execute function public.pacchetti_usate_come_movimento();

-- 4 · il carnet da usare per una lezione ---------------------------------------------------------------
-- carnet valido dell'allievo o del suo referente (genitore), che scade prima, con lezioni rimaste
create or replace function public.carnet_per_lezione(p_centro uuid, p_allievo uuid, p_data date) returns uuid
language sql stable security definer set search_path to 'public' as $$
  select p.id from scuderia_pacchetti p
   where p.centro_id = p_centro and p.tipo = 'carnet'
     and (p.membro_id = p_allievo or p.membro_id = (select referente_id from scuderia_clienti_dati where membro_id = p_allievo))
     and (p.data_scadenza is null or p.data_scadenza >= p_data)
     and (p.data_inizio is null or p.data_inizio <= p_data)
     and (p.unita_totali is null or coalesce(p.unita_usate, 0) < p.unita_totali)
   order by p.data_scadenza nulls last, p.created_at
   limit 1
$$;
revoke all on function public.carnet_per_lezione(uuid, uuid, date) from public, anon;
grant execute on function public.carnet_per_lezione(uuid, uuid, date) to authenticated, service_role;

-- 5 · lo scalo: prima della scrittura sceglie il carnet, dopo scrive i movimenti --------------------------
create or replace function public.lezioni_carnet_prima() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if new.pacchetto_id is null and new.allievo_id is not null and new.stato = 'completata'
     and (tg_op = 'INSERT' or old.stato is distinct from 'completata')
     and new.data >= (select scalo_dal from centri where id = new.centro_id) then
    new.pacchetto_id := carnet_per_lezione(new.centro_id, new.allievo_id, new.data);
  end if;
  if new.pacchetto_id is not null and not exists (select 1 from scuderia_pacchetti where id = new.pacchetto_id and centro_id = new.centro_id) then
    raise exception 'CARNET_ALTRO_CENTRO';
  end if;
  return new;
end $$;
revoke all on function public.lezioni_carnet_prima() from public, anon, authenticated;
drop trigger if exists trg_lezioni_carnet_prima on public.scuderia_lezioni;
create trigger trg_lezioni_carnet_prima before insert or update on public.scuderia_lezioni
  for each row execute function public.lezioni_carnet_prima();

create or replace function public.lezioni_carnet_dopo() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare v_dal date; v_ore int; v_netto int; v_target int; v_inizio timestamptz; v_motivo text;
begin
  if tg_op = 'DELETE' then
    -- lezione cancellata: si restituisce quello che aveva consumato
    insert into scuderia_crediti_movimenti (centro_id, pacchetto_id, lezione_id, quantita, motivo, nota)
    select old.centro_id, m.pacchetto_id, null, -sum(m.quantita), 'restituito', 'lezione del ' || to_char(old.data, 'DD/MM') || ' cancellata'
      from scuderia_crediti_movimenti m where m.lezione_id = old.id group by m.pacchetto_id having sum(m.quantita) <> 0;
    return old;   -- trigger «prima della cancellazione»: restituire la riga, altrimenti la cancellazione si annulla
  end if;
  select scalo_dal, disdetta_ore into v_dal, v_ore from centri where id = new.centro_id;
  if new.data < v_dal then return null; end if;

  -- se il carnet è cambiato, il vecchio torna pari
  if tg_op = 'UPDATE' and old.pacchetto_id is distinct from new.pacchetto_id then
    insert into scuderia_crediti_movimenti (centro_id, pacchetto_id, lezione_id, quantita, motivo, nota)
    select new.centro_id, m.pacchetto_id, new.id, -sum(m.quantita), 'restituito', 'carnet cambiato sulla lezione'
      from scuderia_crediti_movimenti m where m.lezione_id = new.id and m.pacchetto_id is distinct from new.pacchetto_id
     group by m.pacchetto_id having sum(m.quantita) <> 0;
  end if;
  if new.pacchetto_id is null then return null; end if;
  if not exists (select 1 from scuderia_pacchetti where id = new.pacchetto_id and tipo = 'carnet') then return null; end if;

  select coalesce(sum(quantita), 0) into v_netto from scuderia_crediti_movimenti where lezione_id = new.id and pacchetto_id = new.pacchetto_id;
  v_inizio := ((new.data::text || ' ' || new.ora_inizio::text)::timestamp at time zone 'Europe/Rome');
  if new.stato = 'completata' then
    v_target := 1; v_motivo := 'lezione';
  elsif new.stato = 'annullata' and tg_op = 'UPDATE' and old.stato <> 'annullata' then
    -- disdetta: tardiva se arriva a meno di disdetta_ore dall'inizio (o dopo)
    if now() > v_inizio - make_interval(hours => v_ore) then v_target := 1; v_motivo := 'disdetta_tardiva';
    else v_target := 0; v_motivo := 'restituito'; end if;
  elsif new.stato = 'annullata' then
    v_target := v_netto; v_motivo := 'restituito';   -- già annullata: non si tocca
  else
    v_target := 0; v_motivo := 'restituito';
  end if;
  if v_target <> v_netto then
    insert into scuderia_crediti_movimenti (centro_id, pacchetto_id, lezione_id, quantita, motivo, nota)
    values (new.centro_id, new.pacchetto_id, new.id, v_target - v_netto,
            case when v_target > v_netto then v_motivo else 'restituito' end,
            'lezione del ' || to_char(new.data, 'DD/MM') || ' alle ' || to_char(new.ora_inizio, 'HH24:MI'));
  end if;
  return null;
end $$;
revoke all on function public.lezioni_carnet_dopo() from public, anon, authenticated;
drop trigger if exists trg_lezioni_carnet_dopo on public.scuderia_lezioni;
create trigger trg_lezioni_carnet_dopo after insert or update of stato, pacchetto_id, data, ora_inizio on public.scuderia_lezioni
  for each row execute function public.lezioni_carnet_dopo();
drop trigger if exists trg_lezioni_carnet_cancella on public.scuderia_lezioni;
create trigger trg_lezioni_carnet_cancella before delete on public.scuderia_lezioni
  for each row execute function public.lezioni_carnet_dopo();

-- 6 · correzione a mano, con motivo -------------------------------------------------------------------
create or replace function public.correggi_crediti(p_pacchetto uuid, p_quantita int, p_nota text)
returns int language plpgsql security definer set search_path to 'public' as $$
declare v_centro uuid;
begin
  select centro_id into v_centro from scuderia_pacchetti where id = p_pacchetto;
  if v_centro is null then raise exception 'PACCHETTO_NON_TROVATO'; end if;
  if not (is_admin_of_centro(v_centro) or member_can(v_centro, 'pacchetti')) then raise exception 'NON_AUTORIZZATO'; end if;
  if coalesce(trim(p_nota), '') = '' then raise exception 'MOTIVO_MANCANTE'; end if;
  if coalesce(p_quantita, 0) = 0 then return (select unita_usate from scuderia_pacchetti where id = p_pacchetto); end if;
  insert into scuderia_crediti_movimenti (centro_id, pacchetto_id, quantita, motivo, nota)
  values (v_centro, p_pacchetto, p_quantita, 'correzione', left(trim(p_nota), 200));
  return (select unita_usate from scuderia_pacchetti where id = p_pacchetto);
end $$;
revoke all on function public.correggi_crediti(uuid, int, text) from public, anon;
grant execute on function public.correggi_crediti(uuid, int, text) to authenticated, service_role;

-- 7 · i carnet che esistono già partono dal loro contatore attuale ----------------------------------------
do $$ begin
  perform set_config('equo.crediti', 'on', true);
  insert into scuderia_crediti_movimenti (centro_id, pacchetto_id, quantita, motivo, nota, creato_da)
  select p.centro_id, p.id, p.unita_usate, 'iniziale', 'contatore al ' || to_char(current_date, 'DD/MM/YYYY'), null
    from scuderia_pacchetti p
   where coalesce(p.unita_usate, 0) <> 0 and not exists (select 1 from scuderia_crediti_movimenti m where m.pacchetto_id = p.id);
  perform set_config('equo.crediti', '', true);
end $$;

-- controllo finale: deve dare 1 · 1 · 1 · 0
select (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'scuderia_lezioni' and column_name = 'pacchetto_id') as colonna,
       (select count(*) from pg_tables where schemaname = 'public' and tablename = 'scuderia_crediti_movimenti') as tabella,
       (select count(*) from pg_trigger where tgname = 'trg_lezioni_carnet_dopo') as trigger_scalo,
       (select count(*) from scuderia_pacchetti p where coalesce(p.unita_usate, 0) <> coalesce((select sum(quantita) from scuderia_crediti_movimenti m where m.pacchetto_id = p.id), 0)) as contatori_diversi;
