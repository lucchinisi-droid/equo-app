-- Equo: CODICE DEL CAVALLO A TRE LIVELLI (provvisorio, validato, certificato) - FASE 1 - 18 ottobre 2026
-- Regole (Simone, 18/10): il codice definitivo nasce al livello Validato; il Certificato aggiunge solo il bollino.
-- Validato = nome, razza, data di nascita + due conferme di due persone diverse, di cui UNA SEMPRE del proprietario
-- (1 persona = 1 conferma; la scuderia conta come una persona). Le conferme valgono per la VERSIONE dei dati
-- (nome, razza, data di nascita): se cambiano, le conferme degli altri decadono e chi ha modificato conferma da se'.
-- Certificato = Validato + microchip inserito e verificato.
-- FASE 1 = solo struttura e funzioni, NIENTE cambia per gli utenti: i codici attuali (codice_equo) e l'app non vengono toccati.
-- Il passaggio dei codici esistenti a ""provvisori"" (prefisso PRV-) e le schermate arrivano nelle fasi successive.
-- Da eseguire a BLOCCHI, uno alla volta, nel SQL Editor. Idempotente.

-- ===== BLOCCO 0 - CORREZIONE trigger storico cambi (trovato leggendo il database) =====
-- La funzione scriveva in cavalli_storico colonne che non esistono piu' (campo, valore_prima, valore_dopo):
-- cambiare nome o microchip a un cavallo del proprietario dava errore. Ora usa le colonne attuali.
create or replace function public.horses_storico_cambi() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
declare v_ruolo text := case when auth.uid() is not null and auth.uid() = new.owner_id then 'proprietario' else 'sistema' end;
begin
  if new.microchip is distinct from old.microchip then
    insert into cavalli_storico (codice_equo, horse_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values (new.codice_equo, new.id, 'cambio_dati',
      'Microchip: ' || coalesce(nullif(old.microchip, ''), '(vuoto)') || ' diventa ' || coalesce(nullif(new.microchip, ''), '(vuoto)'),
      auth.uid(), v_ruolo, 'equo');
    new.microchip_verificato := false;
  end if;
  if new.name is distinct from old.name then
    insert into cavalli_storico (codice_equo, horse_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values (new.codice_equo, new.id, 'cambio_dati',
      'Nome: ' || coalesce(old.name, '(vuoto)') || ' diventa ' || coalesce(new.name, '(vuoto)'),
      auth.uid(), v_ruolo, 'equo');
  end if;
  return new;
end
$fn$;

-- ===== BLOCCO 1 - colonne, sequenza, impronta dei dati =====
alter table public.horses
  add column if not exists codice_livello text not null default 'provvisorio' check (codice_livello in ('provvisorio', 'validato', 'certificato')),
  add column if not exists codice_definitivo text,
  add column if not exists numero_definitivo bigint,
  add column if not exists validato_il timestamptz,
  add column if not exists certificato_il timestamptz;

alter table public.scuderia_cavalli
  add column if not exists codice_livello text not null default 'provvisorio' check (codice_livello in ('provvisorio', 'validato', 'certificato')),
  add column if not exists codice_definitivo text,
  add column if not exists numero_definitivo bigint,
  add column if not exists validato_il timestamptz,
  add column if not exists certificato_il timestamptz;

create unique index if not exists horses_numero_definitivo_uq on public.horses (numero_definitivo) where numero_definitivo is not null;
create unique index if not exists scuderia_cavalli_numero_definitivo_uq on public.scuderia_cavalli (numero_definitivo) where numero_definitivo is not null;

create sequence if not exists public.equo_validati_seq start 1;

create or replace function public.equo_dati_chiave(p_nome text, p_razza text, p_nascita date) returns text
language sql stable set search_path to 'public' as $fn$
  select md5(coalesce(public.equo_norm(p_nome), '') || '|' || coalesce(public.equo_norm(p_razza), '') || '|' || coalesce(p_nascita::text, ''))
$fn$;

-- ===== BLOCCO 2 - tabella delle conferme =====
create table if not exists public.cavalli_conferme (
  id uuid primary key default gen_random_uuid(),
  horse_id uuid references public.horses(id) on delete cascade,
  scuderia_cavallo_id uuid references public.scuderia_cavalli(id) on delete cascade,
  persona text not null,
  ruolo text not null check (ruolo in ('proprietario', 'professionista')),
  user_id uuid,
  centro_id uuid,
  dati_chiave text not null,
  created_at timestamptz not null default now(),
  check ((horse_id is not null) <> (scuderia_cavallo_id is not null))
);
create unique index if not exists cavalli_conferme_uq on public.cavalli_conferme ((coalesce(horse_id, scuderia_cavallo_id)), persona);
alter table public.cavalli_conferme enable row level security;
revoke all on public.cavalli_conferme from anon, authenticated;

-- ===== BLOCCO 3 - chi puo' confermare un cavallo, e come =====
-- persona = 'u:<utente>' oppure 'c:<centro>' (la scuderia conta come UNA persona)
create or replace function public.equo_chi_conferma(p_uid uuid, p_horse uuid default null, p_sc uuid default null)
returns table (persona text, ruolo text)
language plpgsql stable security definer set search_path to 'public' as $fn$
declare v_owner uuid; v_centro uuid; v_propria boolean;
begin
  if p_uid is null then return; end if;
  if p_horse is not null then
    select h.owner_id into v_owner from horses h where h.id = p_horse;
    if v_owner is null then return; end if;
    if v_owner = p_uid then
      return query select 'u:' || p_uid::text, 'proprietario'::text; return;
    end if;
    if exists (select 1 from cavalli_clienti_mascalcia r where r.maniscalco_id = p_uid and r.horse_id = p_horse)
       or exists (select 1 from trainer_collegamenti t where t.trainer_id = p_uid and t.horse_id = p_horse and t.stato = 'attivo') then
      return query select 'u:' || p_uid::text, 'professionista'::text; return;
    end if;
    select sc.centro_id into v_centro from scuderia_cavalli sc
      join scuderia_membri m on m.centro_id = sc.centro_id
     where sc.horse_id = p_horse and m.user_id = p_uid and m.ruolo in ('admin', 'istruttore') limit 1;
    if v_centro is not null then
      return query select 'c:' || v_centro::text, 'professionista'::text;
    end if;
    return;
  end if;
  select sc.centro_id, (sc.proprietario_membro_id is null and sc.tipo_proprieta = 'proprieta')
    into v_centro, v_propria from scuderia_cavalli sc where sc.id = p_sc and sc.horse_id is null;
  if v_centro is null then return; end if;
  if exists (select 1 from scuderia_membri m where m.centro_id = v_centro and m.user_id = p_uid and m.ruolo in ('admin', 'istruttore')) then
    return query select 'c:' || v_centro::text, (case when v_propria then 'proprietario' else 'professionista' end)::text; return;
  end if;
  if exists (select 1 from cavalli_clienti_mascalcia r where r.maniscalco_id = p_uid and r.scuderia_cavallo_id = p_sc)
     or exists (select 1 from trainer_cavalli tc where tc.trainer_id = p_uid and tc.scuderia_cavallo_id = p_sc and tc.archiviato_il is null) then
    return query select 'u:' || p_uid::text, 'professionista'::text;
  end if;
end
$fn$;
revoke all on function public.equo_chi_conferma(uuid, uuid, uuid) from public, anon, authenticated;

-- ===== BLOCCO 4 - ricalcolo del livello =====
create or replace function public.equo_ricalcola_cavallo(p_horse uuid default null, p_sc uuid default null)
returns text
language plpgsql security definer set search_path to 'public' as $fn$
declare v_nome text; v_razza text; v_nasc date; v_chip text; v_chip_ok boolean := false;
  v_cod text; v_num bigint; v_liv text; v_chiave text; v_completo boolean; v_prop int; v_pers int; v_nuovo text;
begin
  if p_horse is not null then
    select h.name, h.breed, h.birth_date, h.microchip, coalesce(h.microchip_verificato, false), h.codice_definitivo, h.numero_definitivo, h.codice_livello
      into v_nome, v_razza, v_nasc, v_chip, v_chip_ok, v_cod, v_num, v_liv from horses h where h.id = p_horse;
  elsif p_sc is not null then
    select s.nome, s.razza, s.data_nascita, s.microchip, false, s.codice_definitivo, s.numero_definitivo, s.codice_livello
      into v_nome, v_razza, v_nasc, v_chip, v_chip_ok, v_cod, v_num, v_liv from scuderia_cavalli s where s.id = p_sc;
  else
    return null;
  end if;
  if not found then return null; end if;

  v_chiave := equo_dati_chiave(v_nome, v_razza, v_nasc);
  v_completo := nullif(trim(coalesce(v_nome, '')), '') is not null and nullif(trim(coalesce(v_razza, '')), '') is not null and v_nasc is not null;
  select count(*) filter (where c.ruolo = 'proprietario'), count(distinct c.persona)
    into v_prop, v_pers from cavalli_conferme c
   where coalesce(c.horse_id, c.scuderia_cavallo_id) = coalesce(p_horse, p_sc) and c.dati_chiave = v_chiave;

  v_nuovo := 'provvisorio';
  if v_completo and v_prop >= 1 and v_pers >= 2 then
    v_nuovo := case when equo_chip(v_chip) is not null and v_chip_ok then 'certificato' else 'validato' end;
    if v_cod is null then
      v_num := nextval('public.equo_validati_seq');
      v_cod := equo_formatta_codice(equo_sigla_razza(v_razza), v_num);
    end if;
  end if;

  if v_nuovo is distinct from v_liv then
    perform set_config('equo.livelli', 'on', true);
    if p_horse is not null then
      update horses set codice_livello = v_nuovo, codice_definitivo = v_cod, numero_definitivo = v_num,
        validato_il = case when v_nuovo <> 'provvisorio' then coalesce(validato_il, now()) else validato_il end,
        certificato_il = case when v_nuovo = 'certificato' then coalesce(certificato_il, now()) else null end
       where id = p_horse;
    else
      update scuderia_cavalli set codice_livello = v_nuovo, codice_definitivo = v_cod, numero_definitivo = v_num,
        validato_il = case when v_nuovo <> 'provvisorio' then coalesce(validato_il, now()) else validato_il end,
        certificato_il = case when v_nuovo = 'certificato' then coalesce(certificato_il, now()) else null end
       where id = p_sc;
    end if;
    perform set_config('equo.livelli', '', true);
    insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values (coalesce(v_cod, ''), p_horse, case when p_horse is null then p_sc end, 'livello_codice',
      'Livello del codice: da ' || coalesce(v_liv, '-') || ' a ' || v_nuovo || coalesce(' (' || v_cod || ')', ''),
      auth.uid(), 'sistema', 'equo');
  end if;
  return v_nuovo;
end
$fn$;
revoke all on function public.equo_ricalcola_cavallo(uuid, uuid) from public, anon, authenticated;

-- ===== BLOCCO 5 - conferma e stato (le due funzioni che usera' l'app) =====
create or replace function public.equo_conferma_cavallo(p_horse uuid default null, p_scuderia_cavallo uuid default null)
returns json
language plpgsql security definer set search_path to 'public' as $fn$
declare v_h uuid := p_horse; v_sc uuid := p_scuderia_cavallo; v_uid uuid := auth.uid();
  v_nome text; v_razza text; v_nasc date; v_chiave text; v_persona text; v_ruolo text; v_liv text; v_cod text; v_n int;
begin
  if v_uid is null then return json_build_object('ok', false, 'motivo', 'non_autenticato'); end if;
  if v_h is null and v_sc is not null then
    select s.horse_id into v_h from scuderia_cavalli s where s.id = v_sc;
    if v_h is not null then v_sc := null; end if;
  end if;
  if v_h is null and v_sc is null then return json_build_object('ok', false, 'motivo', 'cavallo_non_indicato'); end if;

  select c.persona, c.ruolo into v_persona, v_ruolo from equo_chi_conferma(v_uid, v_h, v_sc) c limit 1;
  if v_persona is null then return json_build_object('ok', false, 'motivo', 'non_autorizzato'); end if;

  if v_h is not null then
    select h.name, h.breed, h.birth_date into v_nome, v_razza, v_nasc from horses h where h.id = v_h;
  else
    select s.nome, s.razza, s.data_nascita into v_nome, v_razza, v_nasc from scuderia_cavalli s where s.id = v_sc;
  end if;
  if nullif(trim(coalesce(v_nome, '')), '') is null or nullif(trim(coalesce(v_razza, '')), '') is null or v_nasc is null then
    return json_build_object('ok', false, 'motivo', 'dati_incompleti');
  end if;
  v_chiave := equo_dati_chiave(v_nome, v_razza, v_nasc);

  insert into cavalli_conferme (horse_id, scuderia_cavallo_id, persona, ruolo, user_id, centro_id, dati_chiave)
  values (v_h, v_sc, v_persona, v_ruolo, case when left(v_persona, 2) = 'u:' then v_uid end,
    case when left(v_persona, 2) = 'c:' then substr(v_persona, 3)::uuid end, v_chiave)
  on conflict ((coalesce(horse_id, scuderia_cavallo_id)), persona)
  do update set dati_chiave = excluded.dati_chiave, ruolo = excluded.ruolo, created_at = now();

  perform equo_ricalcola_cavallo(v_h, v_sc);
  if v_h is not null then
    select h.codice_livello, h.codice_definitivo into v_liv, v_cod from horses h where h.id = v_h;
  else
    select s.codice_livello, s.codice_definitivo into v_liv, v_cod from scuderia_cavalli s where s.id = v_sc;
  end if;
  select count(*) into v_n from cavalli_conferme c
   where coalesce(c.horse_id, c.scuderia_cavallo_id) = coalesce(v_h, v_sc) and c.dati_chiave = v_chiave;
  return json_build_object('ok', true, 'livello', v_liv, 'codice_definitivo', v_cod, 'conferme', v_n);
end
$fn$;
revoke all on function public.equo_conferma_cavallo(uuid, uuid) from public, anon;
grant execute on function public.equo_conferma_cavallo(uuid, uuid) to authenticated;

create or replace function public.equo_stato_codice(p_horse uuid default null, p_scuderia_cavallo uuid default null)
returns json
language plpgsql stable security definer set search_path to 'public' as $fn$
declare v_h uuid := p_horse; v_sc uuid := p_scuderia_cavallo; v_uid uuid := auth.uid();
  v_nome text; v_razza text; v_nasc date; v_chip text; v_chip_ok boolean := false; v_liv text; v_cod text;
  v_chiave text; v_persona text; v_ruolo text; v_valide int; v_prop int; v_mia boolean;
begin
  if v_uid is null then return json_build_object('ok', false, 'motivo', 'non_autenticato'); end if;
  if v_h is null and v_sc is not null then
    select s.horse_id into v_h from scuderia_cavalli s where s.id = v_sc;
    if v_h is not null then v_sc := null; end if;
  end if;
  select c.persona, c.ruolo into v_persona, v_ruolo from equo_chi_conferma(v_uid, v_h, v_sc) c limit 1;
  if v_persona is null then return json_build_object('ok', false, 'motivo', 'non_autorizzato'); end if;

  if v_h is not null then
    select h.name, h.breed, h.birth_date, h.microchip, coalesce(h.microchip_verificato, false), h.codice_livello, h.codice_definitivo
      into v_nome, v_razza, v_nasc, v_chip, v_chip_ok, v_liv, v_cod from horses h where h.id = v_h;
  else
    select s.nome, s.razza, s.data_nascita, s.microchip, false, s.codice_livello, s.codice_definitivo
      into v_nome, v_razza, v_nasc, v_chip, v_chip_ok, v_liv, v_cod from scuderia_cavalli s where s.id = v_sc;
  end if;
  v_chiave := equo_dati_chiave(v_nome, v_razza, v_nasc);
  select count(*), count(*) filter (where c.ruolo = 'proprietario'), coalesce(bool_or(c.persona = v_persona), false)
    into v_valide, v_prop, v_mia from cavalli_conferme c
   where coalesce(c.horse_id, c.scuderia_cavallo_id) = coalesce(v_h, v_sc) and c.dati_chiave = v_chiave;
  return json_build_object('ok', true, 'livello', v_liv, 'codice_definitivo', v_cod,
    'nome', nullif(trim(coalesce(v_nome, '')), '') is not null,
    'razza', nullif(trim(coalesce(v_razza, '')), '') is not null,
    'nascita', v_nasc is not null,
    'conferme_valide', v_valide, 'conferma_proprietario', v_prop > 0, 'io_ho_confermato', v_mia, 'il_mio_ruolo', v_ruolo,
    'microchip', equo_chip(v_chip) is not null, 'microchip_verificato', v_chip_ok);
end
$fn$;
revoke all on function public.equo_stato_codice(uuid, uuid) from public, anon;
grant execute on function public.equo_stato_codice(uuid, uuid) to authenticated;

-- ===== BLOCCO 6 - quando i dati cambiano =====
-- Cavalli dei proprietari: se il proprietario cambia nome/razza/nascita (dati completi) conferma da se' la nuova versione;
-- le conferme degli altri decadono da sole (la loro impronta non coincide piu'). Poi il livello si ricalcola.
create or replace function public.equo_dati_cambiati_horses() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
declare v_nuova text := equo_dati_chiave(new.name, new.breed, new.birth_date);
begin
  if v_nuova is distinct from equo_dati_chiave(old.name, old.breed, old.birth_date)
     and auth.uid() is not null and auth.uid() = new.owner_id
     and nullif(trim(coalesce(new.name, '')), '') is not null and nullif(trim(coalesce(new.breed, '')), '') is not null and new.birth_date is not null then
    insert into cavalli_conferme (horse_id, persona, ruolo, user_id, dati_chiave)
    values (new.id, 'u:' || new.owner_id::text, 'proprietario', new.owner_id, v_nuova)
    on conflict ((coalesce(horse_id, scuderia_cavallo_id)), persona)
    do update set dati_chiave = excluded.dati_chiave, created_at = now();
  end if;
  perform equo_ricalcola_cavallo(new.id, null);
  return null;
end
$fn$;

drop trigger if exists trg_horses_dati_cambiati on public.horses;
create trigger trg_horses_dati_cambiati after update of name, breed, birth_date, microchip, microchip_verificato on public.horses
  for each row execute function public.equo_dati_cambiati_horses();

create or replace function public.equo_dati_cambiati_scuderia() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
begin
  if new.horse_id is null then perform equo_ricalcola_cavallo(null, new.id); end if;
  return null;
end
$fn$;

drop trigger if exists trg_scuderia_dati_cambiati on public.scuderia_cavalli;
create trigger trg_scuderia_dati_cambiati after update of nome, razza, data_nascita, microchip on public.scuderia_cavalli
  for each row execute function public.equo_dati_cambiati_scuderia();

-- ===== BLOCCO 7 - protezione: livello e codice definitivo li scrivono SOLO le funzioni =====
-- Chi usa l'app (utente collegato) non puo' dare a un cavallo un livello o un codice definitivo con una modifica diretta:
-- il valore torna quello di prima (in inserimento, provvisorio). Il SQL Editor e le funzioni non sono toccati.
create or replace function public.equo_proteggi_livelli() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
begin
  if auth.uid() is null or coalesce(current_setting('equo.livelli', true), '') = 'on' then return new; end if;
  if tg_op = 'INSERT' then
    new.codice_livello := 'provvisorio'; new.codice_definitivo := null; new.numero_definitivo := null;
    new.validato_il := null; new.certificato_il := null;
  else
    new.codice_livello := old.codice_livello; new.codice_definitivo := old.codice_definitivo; new.numero_definitivo := old.numero_definitivo;
    new.validato_il := old.validato_il; new.certificato_il := old.certificato_il;
  end if;
  return new;
end
$fn$;

drop trigger if exists trg_horses_livelli_protetti on public.horses;
create trigger trg_horses_livelli_protetti before insert or update on public.horses
  for each row execute function public.equo_proteggi_livelli();
drop trigger if exists trg_scuderia_livelli_protetti on public.scuderia_cavalli;
create trigger trg_scuderia_livelli_protetti before insert or update on public.scuderia_cavalli
  for each row execute function public.equo_proteggi_livelli();
