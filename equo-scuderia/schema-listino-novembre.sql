-- Equo: LISTINO SCUDERIA DI NOVEMBRE NEL DATABASE (3 novembre 2026) · SQL 41 · decisioni di Simone del 3/11
--  · ADVANCE 39 €/mese · 390 €/anno + IVA (contratti nuovi; quelli esistenti non cambiano)
--  · clienti (allievi, genitori, proprietari): START 20 · ADVANCE 50 · PREMIUM 200
--  · veterinari collegati: START 1 · ADVANCE 3 · PREMIUM senza limite (il limite è pronto per quando si collegano)
--  · START: niente conferma delle lezioni dall'app, solo il promemoria in chat (conferma_lezioni_app = false)
--  · PREMIUM: Athena e Merlino inclusi, gli altri agenti si comprano
--  · Galeno disponibile: entra nelle prove gratuite (Ermes resta «in arrivo»)
-- Rieseguibile. Il controllo finale deve dare true · true · true · true · true.

-- 1 · limiti per pacchetto --------------------------------------------------------------------------
create or replace function public.centro_limiti(p_centro_id uuid)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare c centri%rowtype; pk text; sb boolean; r jsonb; agenti text[];
begin
  select * into c from centri where id = p_centro_id;
  if c.id is null then return null; end if;
  sb := centro_sbloccato(p_centro_id);
  pk := case when sb then 'completo' else c.pacchetto end;
  r := case pk
    when 'start' then jsonb_build_object('cavalli',10,'team',3,'clienti',20,'maniscalchi',1,'veterinari',1,'istruttori_lezioni',1,'athena_messaggi',30,'athena_proattiva',false,
      'conferma_lezioni_app',false,'pacchetti',false,'promemoria_auto',false,'magazzino',false,'magazzino_avanzato',false,'statistiche',false,'statistiche_complete',false,'radar',false,
      'store',true,'sdi',false,'livelli',false,'hard_reset',false,'agenti_acquistabili',false,'supporto_prioritario',false,'sedi',1)
    when 'advance' then jsonb_build_object('cavalli',30,'team',6,'clienti',50,'maniscalchi',3,'veterinari',3,'istruttori_lezioni',3,'athena_messaggi',100,'athena_proattiva',true,
      'conferma_lezioni_app',true,'pacchetti',true,'promemoria_auto',true,'magazzino',true,'magazzino_avanzato',false,'statistiche',true,'statistiche_complete',false,'radar',false,
      'store',true,'sdi',c.sdi_attivo,'livelli',true,'hard_reset',false,'agenti_acquistabili',true,'supporto_prioritario',false,'sedi',1)
    when 'premium' then jsonb_build_object('cavalli',80,'team',15,'clienti',200,'maniscalchi',null,'veterinari',null,'istruttori_lezioni',null,'athena_messaggi',500,'athena_proattiva',true,
      'conferma_lezioni_app',true,'pacchetti',true,'promemoria_auto',true,'magazzino',true,'magazzino_avanzato',true,'statistiche',true,'statistiche_complete',true,'radar',true,
      'store',true,'sdi',true,'livelli',true,'hard_reset',true,'agenti_acquistabili',true,'supporto_prioritario',true,'sedi',null)
    else jsonb_build_object('cavalli',null,'team',null,'clienti',null,'maniscalchi',null,'veterinari',null,'istruttori_lezioni',null,'athena_messaggi',case when sb then 2000 else 1000 end,'athena_proattiva',true,
      'conferma_lezioni_app',true,'pacchetti',true,'promemoria_auto',true,'magazzino',true,'magazzino_avanzato',true,'statistiche',true,'statistiche_complete',true,'radar',true,
      'store',true,'sdi',true,'livelli',true,'hard_reset',true,'agenti_acquistabili',true,'supporto_prioritario',true,'sedi',null)
  end;
  agenti := array['athena'];
  if sb then agenti := agenti || array['merlino','ermes','galeno','hammer','ares'];
  else
    -- PREMIUM (e ENTERPRISE): Merlino incluso di serie; agente_incluso resta valido per i contratti già fatti
    if pk in ('premium','enterprise') then agenti := agenti || array['merlino']; end if;
    if pk in ('premium','enterprise') and c.agente_incluso is not null then agenti := agenti || c.agente_incluso; end if;
    if pk <> 'start' then agenti := agenti || c.agenti_extra; end if;
  end if;
  return r || jsonb_build_object('pacchetto', pk, 'pacchetto_reale', c.pacchetto, 'sbloccato', sb, 'agente_incluso', c.agente_incluso,
    'agenti', to_jsonb(array(select distinct unnest(agenti))), 'merlino_messaggi', case when sb then 2000 else 300 end);
end $$;

-- nel riepilogo del pacchetto (centro_piano) anche quanti clienti ci sono
do $$
declare v_def text;
begin
  v_def := pg_get_functiondef('public.centro_piano'::regproc);
  if position('''clienti''' in v_def) = 0 then
    v_def := replace(v_def, '''maniscalchi'', (select',
      '''clienti'', (select count(*) from scuderia_membri where centro_id = p_centro_id and ruolo in (''proprietario'', ''allievo'')),
    ''maniscalchi'', (select');
    execute v_def;
  end if;
end $$;

-- 2 · limite dei clienti ------------------------------------------------------------------------------
create or replace function public.limite_clienti() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare n bigint;
begin
  if new.ruolo not in ('proprietario', 'allievo') then return new; end if;
  if tg_op = 'UPDATE' and old.ruolo in ('proprietario', 'allievo') then return new; end if;
  select count(*) into n from scuderia_membri where centro_id = new.centro_id and ruolo in ('proprietario', 'allievo') and id <> new.id;
  if centro_limite_supera(new.centro_id, 'clienti', n) then
    raise exception 'Questo centro ha già % clienti, il massimo del pacchetto attuale: serve il pacchetto %.', (centro_limiti(new.centro_id)->>'clienti'), nome_pacchetto_superiore(new.centro_id);
  end if;
  return new;
end $$;
revoke all on function public.limite_clienti() from public, anon, authenticated;
drop trigger if exists trg_limite_clienti on public.scuderia_membri;
create trigger trg_limite_clienti before insert or update of ruolo on public.scuderia_membri
  for each row execute function public.limite_clienti();

-- 3 · START: niente conferma delle lezioni dall'app ----------------------------------------------------
create or replace function public.equo_conferma_lezioni_app(p_centro uuid) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select coalesce((centro_limiti(p_centro)->>'conferma_lezioni_app')::boolean, true)
$$;
revoke all on function public.equo_conferma_lezioni_app(uuid) from public, anon;
grant execute on function public.equo_conferma_lezioni_app(uuid) to authenticated, service_role;

-- la notifica della lezione invita a confermare solo se la conferma è attiva
do $$
declare v_def text;
begin
  v_def := pg_get_functiondef('public.lezioni_notifica_proprietario'::regproc);
  if position('equo_conferma_lezioni_app' in v_def) = 0 then
    v_def := replace(v_def, '|| ''. Puoi confermarla dal Calendario di Equo.''',
      '|| case when equo_conferma_lezioni_app(new.centro_id) then ''. Puoi confermarla dal Calendario di Equo.'' else ''.'' end');
    v_def := replace(v_def, '|| ''). Puoi confermarla dal Calendario di Equo.''',
      '|| case when equo_conferma_lezioni_app(new.centro_id) then ''). Puoi confermarla dal Calendario di Equo.'' else '').'' end');
    execute v_def;
  end if;
end $$;

-- il proprietario non può confermare se il pacchetto non lo prevede
create or replace function public.accetta_lezione_scuderia(p_lezione_id uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare l record;
begin
  select l2.* into l from scuderia_lezioni l2
    join scuderia_membri m on m.id = l2.allievo_id and m.user_id = auth.uid()
   where l2.id = p_lezione_id;
  if l.id is null then return json_build_object('ok', false, 'errore', 'Lezione non trovata.'); end if;
  if not equo_conferma_lezioni_app(l.centro_id) then return json_build_object('ok', false, 'errore', 'La tua scuderia gestisce le conferme direttamente: se non puoi venire, scrivile in chat.'); end if;
  if l.stato = 'annullata' then return json_build_object('ok', false, 'errore', 'Questa lezione è stata annullata.'); end if;
  if l.stato in ('confermata','completata') then return json_build_object('ok', true, 'gia', true); end if;
  if l.data < current_date then return json_build_object('ok', false, 'errore', 'La lezione è già passata.'); end if;
  update scuderia_lezioni set stato = 'confermata' where id = l.id;
  insert into chat_messaggi (centro_id, membro_id, mittente_user_id, tipo, testo, letto)
  values (l.centro_id, l.allievo_id, auth.uid(), 'testo',
    '✅ Confermo la lezione: ' || equo_descr_lezione(l.data, l.ora_inizio, l.cavaliere, l.cavallo_id, l.istruttore_id) || '.', false);
  return json_build_object('ok', true);
end $$;

-- l'app del proprietario sa se mostrare il tasto «Accetta»
create or replace function public.mie_lezioni_scuderia()
returns json language sql stable security definer set search_path to 'public' as $$
  select coalesce(json_agg(x order by x.data, x.ora nulls last), '[]'::json) from (
    select l.id, l.data, to_char(l.ora_inizio, 'HH24:MI') as ora, l.stato, l.cavaliere,
           l.allievo_id as membro_id, l.centro_id,
           coalesce(nullif(trim(c.nome), ''), 'La tua scuderia') as scuderia,
           sc.nome as cavallo, i.nome_visualizzato as istruttore,
           equo_conferma_lezioni_app(l.centro_id) as conferma_app
    from scuderia_lezioni l
    join scuderia_membri m on m.id = l.allievo_id and m.user_id = auth.uid()
    join centri c on c.id = l.centro_id
    left join scuderia_cavalli sc on sc.id = l.cavallo_id
    left join scuderia_membri i on i.id = l.istruttore_id
    where l.data between current_date - 30 and current_date + 180
  ) x;
$$;

-- 4 · Galeno nelle prove gratuite ---------------------------------------------------------------------
do $$
declare v_def text;
begin
  v_def := pg_get_functiondef('public.agenti_prove_stato'::regproc);
  if position('''galeno''' in v_def) = 0 then
    execute replace(v_def, 'array[''merlino'',''hammer'',''ares'']', 'array[''merlino'',''hammer'',''ares'',''galeno'']');
  end if;
  v_def := pg_get_functiondef('public.agente_prova_avvia'::regproc);
  if position('''galeno''' in v_def) = 0 then
    execute replace(v_def, 'p_agente not in (''merlino'',''hammer'',''ares'')', 'p_agente not in (''merlino'',''hammer'',''ares'',''galeno'')');
  end if;
end $$;

-- 5 · contratti nuovi: ADVANCE a 39 € / 390 € -----------------------------------------------------------
do $$
declare v_def text;
begin
  v_def := pg_get_functiondef('public.imposta_contratto_centro'::regproc);
  if position('3900' in v_def) = 0 then
    execute replace(v_def, 'when ''advance''  then case p_ciclo when ''mensile'' then 2900  else 29000 end',
                           'when ''advance''  then case p_ciclo when ''mensile'' then 3900  else 39000 end');
  end if;
end $$;

-- controllo finale: deve dare true · true · true · true · true
select position('''clienti'',50' in pg_get_functiondef('public.centro_limiti'::regproc)) > 0 as clienti_advance_50,
       position('''conferma_lezioni_app'',false' in pg_get_functiondef('public.centro_limiti'::regproc)) > 0 as start_senza_conferma,
       position('equo_conferma_lezioni_app' in pg_get_functiondef('public.lezioni_notifica_proprietario'::regproc)) > 0 as notifica_aggiornata,
       position('3900' in pg_get_functiondef('public.imposta_contratto_centro'::regproc)) > 0 as contratto_advance_39,
       position('''galeno''' in pg_get_functiondef('public.agenti_prove_stato'::regproc)) > 0 as galeno_in_prova;
