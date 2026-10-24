-- 24/10/2026 CAVALLI DEL MANISCALCO: niente più eliminazioni di cavalli collegati
-- (caso Rio: Riccardo ha eliminato la sua scheda di un cavallo del proprietario e della scuderia senza che nessuno lo sapesse)
-- 1) cavalli collegati a un proprietario o a una scuderia: «Non lo seguo più» = richiesta che proprietario o scuderia confermano o rifiutano
-- 2) cavalli inseriti solo dal maniscalco: «Archivia» (si ripristinano), mai cancellati
-- 3) il database rifiuta l'eliminazione di una scheda collegata (salvo le unioni di schede doppie)
-- 4) profili certificati (TRUE) non modificabili da altri: scheda cliente collegata (nome e tipo dal profilo) e anagrafica dei cavalli
--    del proprietario o della scuderia; le schede create dal professionista (PENDING) restano modificabili finché il cliente non si collega
-- Si puo rieseguire senza danni.

alter table public.cavalli_clienti_mascalcia add column if not exists archiviato_il timestamptz;

create table if not exists public.cavalli_lasciati (
  id uuid primary key default gen_random_uuid(),
  cavallo_cliente_id uuid not null references public.cavalli_clienti_mascalcia(id) on delete cascade,
  maniscalco_id uuid not null references auth.users(id) on delete cascade,
  horse_id uuid,
  scuderia_cavallo_id uuid,
  stato text not null default 'in_attesa' check (stato in ('in_attesa', 'confermata', 'rifiutata', 'annullata')),
  motivo text check (motivo is null or length(motivo) <= 300),
  risposta_user_id uuid,
  risposta_ruolo text,
  risposta_il timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists cavalli_lasciati_una_aperta on public.cavalli_lasciati (cavallo_cliente_id) where stato = 'in_attesa';
alter table public.cavalli_lasciati enable row level security;
drop policy if exists cavalli_lasciati_sel on public.cavalli_lasciati;
create policy cavalli_lasciati_sel on public.cavalli_lasciati for select using (maniscalco_id = auth.uid());
revoke all on public.cavalli_lasciati from anon, authenticated;
grant select on public.cavalli_lasciati to authenticated;

-- chi puo rispondere a una richiesta: il proprietario del cavallo o un admin della scuderia dove sta
create or replace function public.equo_puo_rispondere_lasciato(p_uid uuid, l public.cavalli_lasciati) returns text
language sql stable security definer set search_path to 'public' as $fn$
  select case
    when exists (select 1 from horses h where h.id = l.horse_id and h.owner_id = p_uid) then 'proprietario'
    when exists (select 1 from scuderia_cavalli sc join scuderia_membri m on m.centro_id = sc.centro_id
                  where m.user_id = p_uid and m.ruolo = 'admin' and sc.uscito_il is null
                    and (sc.id = l.scuderia_cavallo_id or (l.horse_id is not null and sc.horse_id = l.horse_id))) then 'scuderia'
    else null end
$fn$;
revoke all on function public.equo_puo_rispondere_lasciato(uuid, public.cavalli_lasciati) from public, anon, authenticated;

-- messaggio in chat al proprietario e alla scuderia (schede collegate del maniscalco)
create or replace function public.equo_avvisa_lasciato(p_riga public.cavalli_clienti_mascalcia, p_testo text) returns void
language plpgsql security definer set search_path to 'public' as $fn$
declare v_owner uuid; v_card uuid; s record;
begin
  if p_riga.horse_id is not null then
    select owner_id into v_owner from horses where id = p_riga.horse_id;
    select id into v_card from clienti_mascalcia where maniscalco_id = p_riga.maniscalco_id and cliente_user_id = v_owner and centro_id is null and archiviato_il is null limit 1;
    if v_card is not null then
      insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
      values (p_riga.maniscalco_id, v_card, 'maniscalco', p_riga.maniscalco_id, 'testo', p_testo, false);
    end if;
  end if;
  for s in select distinct sc.centro_id from scuderia_cavalli sc
            where sc.uscito_il is null and (sc.id = p_riga.scuderia_cavallo_id or (p_riga.horse_id is not null and sc.horse_id = p_riga.horse_id))
  loop
    select id into v_card from clienti_mascalcia where maniscalco_id = p_riga.maniscalco_id and centro_id = s.centro_id and collegamento_stato = 'attivo' limit 1;
    if v_card is not null then
      perform set_config('equo.collegamento', 'on', true);
      insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
      values (p_riga.maniscalco_id, v_card, 'maniscalco', p_riga.maniscalco_id, 'testo', p_testo, false);
      perform set_config('equo.collegamento', '', true);
    end if;
  end loop;
end $fn$;
revoke all on function public.equo_avvisa_lasciato(public.cavalli_clienti_mascalcia, text) from public, anon, authenticated;

-- il maniscalco: «Non lo seguo più» (collegato) oppure «Archivia» (solo suo)
create or replace function public.pro_lascia_cavallo(p_riga uuid, p_motivo text default null) returns json
language plpgsql security definer set search_path to 'public' as $fn$
declare v_me uuid := auth.uid(); r cavalli_clienti_mascalcia; v_nome text;
begin
  if v_me is null then return json_build_object('ok', false, 'motivo', 'non_autenticato'); end if;
  select * into r from cavalli_clienti_mascalcia where id = p_riga and maniscalco_id = v_me;
  if r.id is null then return json_build_object('ok', false, 'motivo', 'non_trovato'); end if;
  if r.archiviato_il is not null then return json_build_object('ok', true, 'archiviato', true); end if;
  v_nome := equo_nome_profilo(v_me);
  if r.horse_id is null and r.scuderia_cavallo_id is null then
    update cavalli_clienti_mascalcia set archiviato_il = now() where id = r.id;
    insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values (r.codice_equo, null, null, r.id, 'archivio', 'Scheda archiviata dal maniscalco ' || v_nome || ' (storico conservato)', v_me, 'maniscalco', 'app');
    return json_build_object('ok', true, 'archiviato', true);
  end if;
  if exists (select 1 from cavalli_lasciati where cavallo_cliente_id = r.id and stato = 'in_attesa') then
    return json_build_object('ok', true, 'in_attesa', true);
  end if;
  insert into cavalli_lasciati (cavallo_cliente_id, maniscalco_id, horse_id, scuderia_cavallo_id, motivo)
  values (r.id, v_me, r.horse_id, r.scuderia_cavallo_id, nullif(trim(coalesce(p_motivo, '')), ''));
  insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
  values (r.codice_equo, r.horse_id, r.scuderia_cavallo_id, r.id, 'non_seguo_piu',
          'Il maniscalco ' || v_nome || ' chiede di non seguire più ' || r.nome || coalesce(' («' || nullif(trim(coalesce(p_motivo, '')), '') || '»)', '') || ': in attesa di conferma', v_me, 'maniscalco', 'app');
  perform equo_avvisa_lasciato(r, '🐴 Non seguirò più ' || r.nome || coalesce(' — ' || nullif(trim(coalesce(p_motivo, '')), ''), '') || '. Confermi? Trovi la richiesta in Equo, nella Home.');
  return json_build_object('ok', true, 'in_attesa', true);
end $fn$;
revoke all on function public.pro_lascia_cavallo(uuid, text) from public, anon;
grant execute on function public.pro_lascia_cavallo(uuid, text) to authenticated;

-- il maniscalco ci ripensa (richiesta in attesa) o ripristina una scheda archiviata
create or replace function public.pro_riprendi_cavallo(p_riga uuid) returns json
language plpgsql security definer set search_path to 'public' as $fn$
declare v_me uuid := auth.uid(); r cavalli_clienti_mascalcia;
begin
  select * into r from cavalli_clienti_mascalcia where id = p_riga and maniscalco_id = v_me;
  if r.id is null then return json_build_object('ok', false, 'motivo', 'non_trovato'); end if;
  update cavalli_lasciati set stato = 'annullata', risposta_il = now() where cavallo_cliente_id = r.id and stato = 'in_attesa';
  if r.archiviato_il is not null then
    update cavalli_clienti_mascalcia set archiviato_il = null where id = r.id;
    insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values (r.codice_equo, r.horse_id, r.scuderia_cavallo_id, r.id, 'archivio', 'Scheda ripristinata dal maniscalco ' || equo_nome_profilo(v_me), v_me, 'maniscalco', 'app');
  end if;
  return json_build_object('ok', true);
end $fn$;
revoke all on function public.pro_riprendi_cavallo(uuid) from public, anon;
grant execute on function public.pro_riprendi_cavallo(uuid) to authenticated;

-- proprietario o scuderia: richieste da confermare
create or replace function public.equo_richieste_lasciati() returns json
language plpgsql stable security definer set search_path to 'public' as $fn$
declare v_uid uuid := auth.uid(); l cavalli_lasciati; v_out jsonb := '[]'::jsonb; v_ruolo text; v_nome text;
begin
  if v_uid is null then return '[]'::json; end if;
  for l in select * from cavalli_lasciati where stato = 'in_attesa' order by created_at loop
    v_ruolo := equo_puo_rispondere_lasciato(v_uid, l);
    if v_ruolo is null then continue; end if;
    select coalesce(h.name, sc.nome, cv.nome) into v_nome from cavalli_clienti_mascalcia cv
      left join horses h on h.id = l.horse_id left join scuderia_cavalli sc on sc.id = l.scuderia_cavallo_id where cv.id = l.cavallo_cliente_id;
    v_out := v_out || jsonb_build_object('id', l.id, 'cavallo', v_nome, 'maniscalco', equo_nome_profilo(l.maniscalco_id), 'motivo', l.motivo,
      'creata', l.created_at, 'ruolo', v_ruolo);
  end loop;
  return v_out::json;
end $fn$;
revoke all on function public.equo_richieste_lasciati() from public, anon;
grant execute on function public.equo_richieste_lasciati() to authenticated;

create or replace function public.equo_rispondi_lasciato(p_id uuid, p_conferma boolean) returns json
language plpgsql security definer set search_path to 'public' as $fn$
declare v_uid uuid := auth.uid(); l cavalli_lasciati; r cavalli_clienti_mascalcia; v_ruolo text; v_chi text;
begin
  if v_uid is null then return json_build_object('ok', false, 'motivo', 'non_autenticato'); end if;
  select * into l from cavalli_lasciati where id = p_id for update;
  if l.id is null then return json_build_object('ok', false, 'motivo', 'non_trovata'); end if;
  if l.stato <> 'in_attesa' then return json_build_object('ok', true, 'gia', l.stato); end if;
  v_ruolo := equo_puo_rispondere_lasciato(v_uid, l);
  if v_ruolo is null then return json_build_object('ok', false, 'motivo', 'non_autorizzato'); end if;
  select * into r from cavalli_clienti_mascalcia where id = l.cavallo_cliente_id;
  v_chi := equo_nome_profilo(v_uid) || case when v_ruolo = 'scuderia' then ' (scuderia)' else ' (proprietario)' end;
  update cavalli_lasciati set stato = case when p_conferma then 'confermata' else 'rifiutata' end,
         risposta_user_id = v_uid, risposta_ruolo = v_ruolo, risposta_il = now() where id = l.id;
  if p_conferma then
    update cavalli_clienti_mascalcia set archiviato_il = now() where id = r.id;
    -- appuntamenti ancora da fare con quel maniscalco per quel cavallo: annullati
    update interventi_mascalcia set stato = 'annullato'
     where cavallo_cliente_id = r.id and maniscalco_id = r.maniscalco_id and stato in ('programmato', 'richiesto', 'proposto') and gruppo_id is null;
  end if;
  insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
  values (r.codice_equo, r.horse_id, r.scuderia_cavallo_id, r.id, 'non_seguo_piu',
          case when p_conferma then 'Il maniscalco ' || equo_nome_profilo(r.maniscalco_id) || ' non segue più ' || r.nome || ': confermato da ' || v_chi
               else 'Richiesta del maniscalco ' || equo_nome_profilo(r.maniscalco_id) || ' di non seguire più ' || r.nome || ' rifiutata da ' || v_chi end,
          v_uid, case when v_ruolo = 'scuderia' then 'scuderia' else 'proprietario' end, case when v_ruolo = 'scuderia' then 'scuderia' else 'app' end);
  return json_build_object('ok', true, 'stato', case when p_conferma then 'confermata' else 'rifiutata' end);
end $fn$;
revoke all on function public.equo_rispondi_lasciato(uuid, boolean) from public, anon;
grant execute on function public.equo_rispondi_lasciato(uuid, boolean) to authenticated;

-- 3) niente eliminazioni di schede collegate (le unioni di schede doppie restano permesse: il collegamento vive nell'altra scheda)
create or replace function public.cavalli_clienti_no_elimina_collegati() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
begin
  if auth.uid() is null or (old.horse_id is null and old.scuderia_cavallo_id is null)
     or coalesce(current_setting('equo.unisci_righe', true), '') = 'on' or coalesce(current_setting('equo.unisci_manuali', true), '') = 'on' then
    return old;
  end if;
  if exists (select 1 from cavalli_clienti_mascalcia x where x.id <> old.id and x.maniscalco_id = old.maniscalco_id
              and (old.horse_id is null or x.horse_id = old.horse_id)
              and (old.scuderia_cavallo_id is null or x.scuderia_cavallo_id = old.scuderia_cavallo_id)) then
    return old;
  end if;
  raise exception 'CAVALLO_COLLEGATO: questo cavallo è collegato al proprietario o alla scuderia. Usa «Non lo seguo più».';
end $fn$;
drop trigger if exists trg_cavalli_clienti_no_elimina on public.cavalli_clienti_mascalcia;
create trigger trg_cavalli_clienti_no_elimina before delete on public.cavalli_clienti_mascalcia
  for each row execute function public.cavalli_clienti_no_elimina_collegati();

-- 4) PROFILI CERTIFICATI (TRUE) E NON CERTI (PENDING)
--    TRUE = creato dalla persona stessa (proprietario o professionista che si registra, scuderia con Equo Scuderia):
--           nessun altro lo modifica. PENDING = scheda creata da un professionista per un cliente non ancora su Equo:
--           la modifica chi l'ha creata, finché il cliente non si collega (allora diventa TRUE).
-- 4a) scheda cliente collegata (TRUE): nome e tipo vengono dal profilo
--     account Equo -> nome del profilo, «proprietario» (tranne gli account dei gestori di struttura)
--     Equo Scuderia -> nome del centro, «struttura»
drop trigger if exists trg_clienti_mascalcia_tipo_bloccato on public.clienti_mascalcia;
drop function if exists public.clienti_mascalcia_tipo_bloccato();
create or replace function public.clienti_mascalcia_dati_certificati() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
declare v_nome text;
begin
  if new.centro_id is not null then
    new.tipo_cliente := 'struttura';
    select nullif(trim(nome), '') into v_nome from centri where id = new.centro_id;
  elsif new.cliente_user_id is not null then
    if not exists (select 1 from profiles p where p.id = new.cliente_user_id and 'gestore_struttura' in (p.ruolo, coalesce(p.ruolo_secondario, ''))) then
      new.tipo_cliente := 'proprietario';
    end if;
    v_nome := nullif(trim(coalesce(equo_nome_profilo(new.cliente_user_id), '')), '');
  end if;
  if v_nome is not null then
    new.nome := v_nome;
  elsif tg_op = 'UPDATE' and (old.cliente_user_id is not null or old.centro_id is not null) then
    new.nome := old.nome;
  end if;
  return new;
end $fn$;
drop trigger if exists trg_clienti_mascalcia_zz_certificati on public.clienti_mascalcia;
create trigger trg_clienti_mascalcia_zz_certificati before insert or update of nome, tipo_cliente, cliente_user_id, centro_id on public.clienti_mascalcia
  for each row execute function public.clienti_mascalcia_dati_certificati();

-- 4b) cavallo del proprietario (horse_id) o della scuderia (scuderia_cavallo_id) = TRUE:
--     il maniscalco non cambia nome, razza, microchip, anno di nascita e mantello (restano i suoi dati: altezza, peso, sesso,
--     disciplina, segni, ferratura, intervallo, prezzo). I cavalli inseriti da lui e non ancora accettati restano modificabili.
create or replace function public.cavalli_clienti_anagrafica_certificata() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
begin
  if auth.uid() is null or auth.uid() <> old.maniscalco_id or (old.horse_id is null and old.scuderia_cavallo_id is null)
     or coalesce(current_setting('equo.unisci_righe', true), '') = 'on' or coalesce(current_setting('equo.unisci_manuali', true), '') = 'on' then
    return new;
  end if;
  new.nome := old.nome; new.razza := old.razza; new.microchip := old.microchip;
  new.anno_nascita := old.anno_nascita; new.mantello := old.mantello;
  return new;
end $fn$;
drop trigger if exists trg_cavalli_clienti_anagrafica_certificata on public.cavalli_clienti_mascalcia;
create trigger trg_cavalli_clienti_anagrafica_certificata before update of nome, razza, microchip, anno_nascita, mantello on public.cavalli_clienti_mascalcia
  for each row execute function public.cavalli_clienti_anagrafica_certificata();

-- schede già collegate: nome e tipo dal profilo (la scheda di Riccardo per Simone torna «proprietario»,
-- la scheda della Scuderia Colleferro prende il nome del centro)
update public.clienti_mascalcia set nome = nome where cliente_user_id is not null or centro_id is not null;

-- controllo: atteso 1 | 1 | 4 | 3 | proprietario | Simone Lucchini | Scuderia Colleferro
select (select count(*) from information_schema.columns where table_name = 'cavalli_clienti_mascalcia' and column_name = 'archiviato_il') archivio,
       (select count(*) from information_schema.tables where table_name = 'cavalli_lasciati') richieste,
       (select count(*) from pg_proc where proname in ('pro_lascia_cavallo', 'pro_riprendi_cavallo', 'equo_richieste_lasciati', 'equo_rispondi_lasciato')) funzioni,
       (select count(*) from pg_trigger where tgname in ('trg_cavalli_clienti_no_elimina', 'trg_clienti_mascalcia_zz_certificati', 'trg_cavalli_clienti_anagrafica_certificata')) trigger,
       (select tipo_cliente from public.clienti_mascalcia where id = 'c399ca41-d243-4574-915b-0c771f2d66b9') scheda_simone,
       (select nome from public.clienti_mascalcia where id = 'c399ca41-d243-4574-915b-0c771f2d66b9') nome_simone,
       (select nome from public.clienti_mascalcia where id = '86623743-6117-4834-8c4d-e8fd90bbdf82') nome_scuderia;
