-- Equo · SQL 67 · Fase 4 del veterinario: scuderia, proprietario, maniscalco · 11/11/2026
-- Decisioni di Simone (11/11/2026, mockup «Fase 4»):
--  1. VETERINARIO ↔ SCUDERIA come il maniscalco: la scuderia aggiunge il codice EQUOMED…, il veterinario chiede con il codice
--     del centro, la scuderia può usare il QR della scheda «scuderia» del veterinario. Prima il database rifiutava i veterinari.
--     · FALLA CHIUSA: scuderia_usa_codice_invito accetta solo schede di maniscalchi e veterinari (prima non controllava il ruolo).
--  2. LIMITE DEL PACCHETTO unico: maniscalchi e veterinari contano insieme (Start 1+1 = 2, Advance 3+3 = 6, Premium senza limite).
--  3. INCARICHI per professione: il veterinario che segue un cavallo non toglie il maniscalco (e viceversa).
--     La pagina «Cavalli › Maniscalchi» della scuderia resta solo per i maniscalchi.
--  4. REFERTO al proprietario: il veterinario sceglie (acceso di serie). documenti.solo_autore = true → il proprietario
--     e la scuderia non vedono quel file; interventi_mascalcia.referto_proprietario ricorda la scelta della visita.
--  5. SCUDERIA: delle visite del veterinario vede solo data, tipo e veterinario (scuderia_visite_veterinario);
--     nelle schede del professionista le note dei veterinari non arrivano alla scuderia.
--  6. VETERINARIO ↔ MANISCALCO: nella chat tra colleghi si manda la scheda di un cavallo (messaggio tipo 'cavallo')
--     con le indicazioni e, se spuntati, i propri documenti (accesso «consulto»); chi la riceve la aggiunge ai suoi cavalli
--     o la collega a un cavallo che ha già. Il proprietario riceve un avviso in chat (scelta «Avvisa il proprietario»).
-- Le funzioni lunghe degli incarichi sono cambiate con piccole sostituzioni controllate (pg_temp.equo67_cambia):
-- se il pezzo da cambiare non c'è, il file si ferma con un errore e non cambia niente. Rieseguibile.

begin;

-- ============ 0. aiuto: la professione di una scheda cliente ============
create or replace function public.equo_prof_cliente(p_cliente uuid)
 returns text
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select coalesce(nullif(professione, ''), 'maniscalco') from clienti_mascalcia where id = p_cliente
$function$;

create or replace function pg_temp.equo67_cambia(p_fn text, p_vecchio text, p_nuovo text)
 returns void
 language plpgsql
as $f$
declare d text; n int;
begin
  d := pg_get_functiondef(p_fn::regproc);
  if position(p_nuovo in d) > 0 then return; end if;   -- già cambiata
  n := (length(d) - length(replace(d, p_vecchio, ''))) / greatest(length(p_vecchio), 1);
  if n <> 1 then raise exception 'SQL 67: in % il pezzo da cambiare compare % volte (atteso 1): %', p_fn, n, left(p_vecchio, 90); end if;
  execute replace(d, p_vecchio, p_nuovo);
end $f$;

-- ============ 1. colonne nuove ============
alter table public.documenti add column if not exists solo_autore boolean not null default false;
comment on column public.documenti.solo_autore is 'SQL 67: il professionista non lo condivide con il proprietario (né con la scuderia): lo vede solo l''autore e chi ha un accesso.';
alter table public.interventi_mascalcia add column if not exists referto_proprietario boolean not null default true;
comment on column public.interventi_mascalcia.referto_proprietario is 'SQL 67: scelta del veterinario per questa visita: il referto va al proprietario (true) o resta privato (false).';
alter table public.messaggi_proprietari add column if not exists dati jsonb;
alter table public.cavalli_clienti_mascalcia add column if not exists note_colleghi jsonb not null default '[]'::jsonb;
comment on column public.cavalli_clienti_mascalcia.note_colleghi is 'SQL 67: indicazioni ricevute da colleghi (veterinario ↔ maniscalco): [{da, professione, il, testo}].';
alter table public.messaggi_proprietari drop constraint if exists messaggi_proprietari_tipo_check;
alter table public.messaggi_proprietari add constraint messaggi_proprietari_tipo_check
  check (tipo = any (array['testo','audio','foto','video','documento','cavallo'])) not valid;

-- ============ 2. limite del pacchetto: maniscalchi e veterinari insieme ============
create or replace function public.limite_maniscalchi()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare n bigint; l jsonb; v_max int;
begin
  if new.centro_id is null or new.collegamento_stato is null then return new; end if;
  if tg_op = 'UPDATE' and old.collegamento_stato is not null and old.centro_id is not distinct from new.centro_id then return new; end if;
  l := centro_limiti(new.centro_id);
  if l is null or (l->>'maniscalchi') is null or (l->>'veterinari') is null then return new; end if;   -- senza limite
  v_max := (l->>'maniscalchi')::int + (l->>'veterinari')::int;
  select count(*) into n from clienti_mascalcia where centro_id = new.centro_id and collegamento_stato is not null and id <> new.id;
  if n >= v_max then
    raise exception 'La struttura ha già il numero massimo di professionisti collegabili con il suo pacchetto (% tra maniscalchi e veterinari).', v_max;
  end if;
  return new;
end $function$;

-- ============ 3. la scuderia aggiunge un maniscalco o un veterinario ============
create or replace function public.scuderia_aggiungi_maniscalco(p_centro_id uuid, p_codice text, p_cavalli uuid[] default null::uuid[])
 returns json
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_centro record; v_pro record; v_es record; v_id uuid; v_senza boolean; v_prof text;
begin
  if not can_collegare_professionisti(p_centro_id) then return json_build_object('ok', false, 'errore', 'Solo l''amministratore o un membro di livello 2 o 3 può collegare professionisti.'); end if;
  select id, nome, telefono into v_centro from centri where id = p_centro_id;
  select id, ruolo, ruolo_secondario, dati_pagamento_piva_cf into v_pro from profiles where codice_professionista = equo_codice_trova(p_codice, 'profilo') limit 1;
  if v_pro.id is null then return json_build_object('ok', false, 'errore', 'Codice professionista non trovato. Controlla di averlo scritto bene.'); end if;
  v_prof := equo_professione(v_pro.id);
  if v_prof is null or v_prof not in ('maniscalco', 'veterinario') then
    return json_build_object('ok', false, 'errore', 'Questo codice non è di un maniscalco o di un veterinario. Gli istruttori saranno collegabili a breve.');
  end if;
  v_senza := coalesce(trim(v_pro.dati_pagamento_piva_cf), '') = '';
  select * into v_es from clienti_mascalcia where maniscalco_id = v_pro.id and centro_id = p_centro_id;
  if v_es.id is not null then
    if p_cavalli is not null then perform equo_abbina_cavalli_pro(v_es.id, p_cavalli); end if;
    return json_build_object('ok', true, 'gia', true, 'stato', v_es.collegamento_stato, 'nome', equo_nome_profilo(v_pro.id), 'senza_piva', v_senza, 'professione', v_prof);
  end if;
  perform set_config('equo.collegamento', 'on', true);
  v_id := equo_struttura_esistente(v_pro.id, p_centro_id);   -- SQL 51: riusa la scheda che il professionista ha già
  if v_id is not null then
    update clienti_mascalcia set centro_id = p_centro_id, collegamento_stato = 'da_confermare_pro', collegamento_origine = 'struttura', collegamento_il = now(), tipo_cliente = 'struttura' where id = v_id;
  else
    insert into clienti_mascalcia (maniscalco_id, nome, telefono, codice_invito, tipo_cliente, centro_id, collegamento_stato, collegamento_origine, collegamento_il)
    values (v_pro.id, coalesce(nullif(trim(v_centro.nome), ''), 'Struttura'), v_centro.telefono, equo_nuovo_codice_invito(), 'struttura', p_centro_id, 'da_confermare_pro', 'struttura', now())
    returning id into v_id;
  end if;
  insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
  values (v_pro.id, v_id, 'cliente', auth.uid(), 'testo',
    '🤝 ' || coalesce(nullif(trim(v_centro.nome), ''), 'Una struttura') || ' vuole collegarti come ' || v_prof || ' su Equo: chat e appuntamenti con la struttura in un posto solo. Accetta da Clienti → Scuderie.'
    || case when v_senza then E'\n\nℹ️ Nel tuo profilo mancano P.IVA o codice fiscale: aggiungili da menu profilo → Dati per i pagamenti.' else '' end, false);
  if p_cavalli is not null then perform equo_abbina_cavalli_pro(v_id, p_cavalli); end if;
  return json_build_object('ok', true, 'nome', equo_nome_profilo(v_pro.id), 'senza_piva', v_senza, 'professione', v_prof);
end $function$;

-- ============ 4. il professionista chiede il collegamento con il codice del centro ============
create or replace function public.pro_richiedi_collegamento_struttura(p_codice text, p_cliente_id uuid default null::uuid)
 returns json
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_me uuid := auth.uid(); v_pro record; v_centro record; v_es record; v_id uuid; v_senza boolean; v_prof text;
begin
  if v_me is null then return json_build_object('ok', false, 'errore', 'Accedi di nuovo.'); end if;
  select ruolo, ruolo_secondario, dati_pagamento_piva_cf into v_pro from profiles where id = v_me;
  v_prof := equo_professione(v_me);
  if v_prof is null or v_prof not in ('maniscalco', 'veterinario') then
    return json_build_object('ok', false, 'errore', 'Per ora il collegamento con le strutture è disponibile per maniscalchi e veterinari.');
  end if;
  v_senza := coalesce(trim(v_pro.dati_pagamento_piva_cf), '') = '';
  select id, nome, telefono into v_centro from centri where join_code = equo_codice_trova(p_codice, 'centro') limit 1;
  if v_centro.id is null then return json_build_object('ok', false, 'errore', 'Codice struttura non trovato. Chiedilo alla struttura (lo trova in Equo Scuderia → Il tuo Centro).'); end if;
  select * into v_es from clienti_mascalcia where maniscalco_id = v_me and centro_id = v_centro.id;
  if v_es.id is not null then
    return json_build_object('ok', true, 'gia', true, 'stato', v_es.collegamento_stato, 'nome', v_centro.nome, 'cliente_id', v_es.id, 'senza_piva', v_senza);
  end if;
  perform set_config('equo.collegamento', 'on', true);
  if p_cliente_id is null then
    p_cliente_id := equo_struttura_esistente(v_me, v_centro.id);   -- SQL 51: riusa la scheda che ha già
  end if;
  if p_cliente_id is not null then
    update clienti_mascalcia
       set centro_id = v_centro.id, collegamento_stato = 'da_confermare_struttura', collegamento_origine = 'maniscalco',
           collegamento_il = now(), tipo_cliente = 'struttura'
     where id = p_cliente_id and maniscalco_id = v_me and centro_id is null
    returning id into v_id;
    if v_id is null then return json_build_object('ok', false, 'errore', 'Scheda cliente non valida.'); end if;
  else
    insert into clienti_mascalcia (maniscalco_id, nome, telefono, codice_invito, tipo_cliente, centro_id, collegamento_stato, collegamento_origine, collegamento_il)
    values (v_me, coalesce(nullif(trim(v_centro.nome), ''), 'Struttura'), v_centro.telefono, equo_nuovo_codice_invito(), 'struttura',
            v_centro.id, 'da_confermare_struttura', 'maniscalco', now())
    returning id into v_id;
  end if;
  insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
  values (v_me, v_id, 'maniscalco', v_me, 'testo',
    '🤝 ' || equo_nome_profilo(v_me) || ' chiede di collegarsi alla struttura come ' || v_prof || ' su Equo.', false);
  return json_build_object('ok', true, 'nome', v_centro.nome, 'cliente_id', v_id, 'senza_piva', v_senza);
end $function$;

-- ============ 5. QR della scheda «scuderia» del professionista: solo maniscalchi e veterinari (falla chiusa) ============
create or replace function public.scuderia_usa_codice_invito(p_centro uuid, p_codice text)
 returns json
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_cod text; r record; v_gia record; v_centro text; n_cav int; v_u json; v_prof text;
begin
  if not can_collegare_professionisti(p_centro) then
    return json_build_object('ok', false, 'errore', 'Solo l''amministratore o un membro di livello 2 o 3 può collegare i professionisti.');
  end if;
  v_cod := upper(coalesce(equo_codice_trova(p_codice, 'invito'), ''));
  if equo_codice_tipo(v_cod) in ('pro', 'med', 'tra', 'own') then return json_build_object('ok', false, 'errore_tipo', 'profilo'); end if;
  select * into r from clienti_mascalcia where upper(codice_invito) = v_cod limit 1;
  if r.id is null then return json_build_object('ok', false, 'errore', 'Codice non trovato: controlla di averlo scritto bene o chiedi al professionista di mostrarti di nuovo il QR.'); end if;
  -- 11/11/2026 (SQL 67): solo la scheda di un maniscalco o di un veterinario (prima il ruolo non si controllava)
  v_prof := equo_professione(r.maniscalco_id);
  if v_prof is null or v_prof not in ('maniscalco', 'veterinario') then
    return json_build_object('ok', false, 'errore', 'Questo codice non è di un maniscalco o di un veterinario.');
  end if;
  -- solo l'invito della scheda di una scuderia: quello di un cliente privato si usa nell'App Equo
  if r.cliente_user_id is not null or coalesce(r.tipo_cliente, '') <> 'struttura' then
    return json_build_object('ok', false, 'errore', 'Questo è l''invito di un cliente privato del ' || v_prof || ', non della tua scuderia. Chiedigli il QR della scheda della scuderia (oppure il suo codice personale ' || case when v_prof = 'veterinario' then 'EQUOMED' else 'EQUOPRO' end || '…).');
  end if;
  if r.centro_id = p_centro then
    return json_build_object('ok', true, 'gia', true, 'nome', equo_nome_profilo(r.maniscalco_id), 'cliente_id', r.id, 'professione', v_prof);
  end if;
  if r.centro_id is not null then
    return json_build_object('ok', false, 'errore', 'Questo codice è già stato usato da un''altra scuderia. Chiedi al ' || v_prof || ' di controllare la scheda della tua scuderia.');
  end if;
  select coalesce(nullif(trim(nome), ''), 'La scuderia') into v_centro from centri where id = p_centro;
  perform set_config('equo.collegamento', 'on', true);
  -- il professionista era già collegato a questa scuderia con un'altra scheda: si uniscono (niente doppioni)
  select * into v_gia from clienti_mascalcia where maniscalco_id = r.maniscalco_id and centro_id = p_centro;
  if v_gia.id is not null then
    v_u := equo_unisci_struttura(v_gia.id, r.id);
    if v_gia.collegamento_stato is distinct from 'attivo' then
      update clienti_mascalcia set collegamento_stato = 'attivo', collegamento_il = now() where id = v_gia.id;
    end if;
    perform equo_sync_cavalli_struttura(v_gia.id);
    perform set_config('equo.collegamento', '', true);
    return json_build_object('ok', true, 'gia', true, 'unita', true, 'nome', equo_nome_profilo(r.maniscalco_id), 'cliente_id', v_gia.id, 'professione', v_prof);
  end if;
  update clienti_mascalcia set centro_id = p_centro, collegamento_stato = 'attivo', collegamento_origine = 'invito', collegamento_il = now(),
         tipo_cliente = 'struttura', ex_centro_id = null
   where id = r.id;
  select count(*) into n_cav from cavalli_clienti_mascalcia where cliente_mascalcia_id = r.id and archiviato_il is null and scuderia_cavallo_id is null;
  insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
  values (r.maniscalco_id, r.id, 'cliente', auth.uid(), 'testo',
    '🤝 ' || v_centro || ' si è collegata a te su Equo con il tuo invito: da ora chat e appuntamenti passano da qui.'
    || case when n_cav > 0 then ' I ' || n_cav || ' cavalli che hai già inserito le arrivano da confermare: niente da ricopiare.' else '' end, false);
  perform equo_sync_cavalli_struttura(r.id);
  perform set_config('equo.collegamento', '', true);
  return json_build_object('ok', true, 'nome', equo_nome_profilo(r.maniscalco_id), 'cliente_id', r.id, 'cavalli', n_cav, 'professione', v_prof);
end $function$;

-- ============ 6. elenco dei professionisti della scuderia: in più quanti cavalli segue ============
create or replace function public.scuderia_lista_professionisti(p_centro_id uuid)
 returns json
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select case when not is_member_of_centro(p_centro_id) then '[]'::json else
  coalesce((select json_agg(x order by x.nome) from (
    select c.id as cliente_id, c.maniscalco_id as professionista_id, c.professione as categoria,
           equo_nome_profilo(c.maniscalco_id) as nome, p.avatar_url,
           coalesce(p.certificazione_stato = 'verificato', false) as certificato,
           coalesce(trim(p.dati_pagamento_piva_cf), '') = '' as senza_piva,
           c.collegamento_stato as stato, c.collegamento_origine as origine, c.collegamento_il, c.di_fiducia,
           (select count(*) from messaggi_mascalcia m
             where m.cliente_mascalcia_id = c.id and m.mittente_tipo = 'maniscalco' and not coalesce(m.letto, false)) as non_letti,
           (select count(distinct coalesce(i.gruppo_id, i.id)) from interventi_mascalcia i
             where i.cliente_mascalcia_id = c.id and i.stato = 'proposto') as da_confermare,
           (select count(distinct a.scuderia_cavallo_id) from scuderia_cavalli_professionisti a
             where a.cliente_mascalcia_id = c.id and a.stato = 'attivo') as cavalli,
           (select json_build_object('data', i.data_intervento, 'ora', to_char(i.ora, 'HH24:MI'), 'stato', i.stato,
                                     'tipo', equo_tipo_intervento(i.tipo_ferratura, i.tipo_altro))
              from interventi_mascalcia i
             where i.cliente_mascalcia_id = c.id and i.stato in ('richiesto','proposto','programmato') and i.data_intervento >= current_date
             order by i.data_intervento, i.ora nulls last limit 1) as prossimo
    from clienti_mascalcia c
    join profiles p on p.id = c.maniscalco_id
    where c.centro_id = p_centro_id and c.collegamento_stato is not null
  ) x), '[]'::json) end;
$function$;

-- ============ 7. incarichi per professione (piccole sostituzioni controllate) ============
select pg_temp.equo67_cambia('public.equo_incarico_assegna',
  $x$for v_id in select id from scuderia_cavalli_professionisti where scuderia_cavallo_id = p_cav and ruolo = p_ruolo$x$,
  $x$for v_id in select id from scuderia_cavalli_professionisti where scuderia_cavallo_id = p_cav and ruolo = p_ruolo and equo_prof_cliente(cliente_mascalcia_id) = equo_prof_cliente(p_cliente)$x$);
select pg_temp.equo67_cambia('public.equo_incarico_assegna',
  $x$(select id from scuderia_cavalli_professionisti where scuderia_cavallo_id = p_cav and ruolo = p_ruolo and stato = 'attivo' limit 1)$x$,
  $x$(select id from scuderia_cavalli_professionisti where scuderia_cavallo_id = p_cav and ruolo = p_ruolo and stato = 'attivo' and equo_prof_cliente(cliente_mascalcia_id) = equo_prof_cliente(p_cliente) limit 1)$x$);
select pg_temp.equo67_cambia('public.equo_incarico_assegna',
  $x$where x.scuderia_cavallo_id = p_cav and x.ruolo = p_ruolo and x.stato = 'attivo' limit 1$x$,
  $x$where x.scuderia_cavallo_id = p_cav and x.ruolo = p_ruolo and x.stato = 'attivo' and equo_prof_cliente(x.cliente_mascalcia_id) = equo_prof_cliente(p_cliente) limit 1$x$);
select pg_temp.equo67_cambia('public.equo_incarico_attiva',
  $x$where scuderia_cavallo_id = a.scuderia_cavallo_id and ruolo = a.ruolo and stato = 'attivo' and id <> a.id loop$x$,
  $x$where scuderia_cavallo_id = a.scuderia_cavallo_id and ruolo = a.ruolo and stato = 'attivo' and id <> a.id and equo_prof_cliente(cliente_mascalcia_id) = equo_prof_cliente(a.cliente_mascalcia_id) loop$x$);
select pg_temp.equo67_cambia('public.mie_proposte_professionisti',
  $x$and x.cliente_mascalcia_id <> a.cliente_mascalcia_id limit 1$x$,
  $x$and x.cliente_mascalcia_id <> a.cliente_mascalcia_id and equo_prof_cliente(x.cliente_mascalcia_id) = equo_prof_cliente(a.cliente_mascalcia_id) limit 1$x$);
select pg_temp.equo67_cambia('public.scuderia_proposta_rispondi',
  $x$select 1 from scuderia_cavalli_professionisti where scuderia_cavallo_id = v_scheda and ruolo = 'titolare'$x$,
  $x$select 1 from scuderia_cavalli_professionisti where scuderia_cavallo_id = v_scheda and ruolo = 'titolare' and equo_prof_cliente(cliente_mascalcia_id) = equo_prof_cliente(c.id)$x$);
-- «Revoca» senza professionista scelto (Cavalli › Maniscalchi): toglie solo i maniscalchi, non il veterinario
select pg_temp.equo67_cambia('public.scuderia_incarico_azione',
  $x$and (p_cliente is null or a.cliente_mascalcia_id = p_cliente) loop$x$,
  $x$and ((p_cliente is null and equo_prof_cliente(a.cliente_mascalcia_id) = 'maniscalco') or a.cliente_mascalcia_id = p_cliente) loop$x$);
-- la pagina «Cavalli › Maniscalchi» della scuderia: solo maniscalchi
select pg_temp.equo67_cambia('public.scuderia_incarichi',
  $x$from clienti_mascalcia c where c.centro_id = p_centro and c.collegamento_stato in$x$,
  $x$from clienti_mascalcia c where c.centro_id = p_centro and coalesce(nullif(c.professione, ''), 'maniscalco') = 'maniscalco' and c.collegamento_stato in$x$);
select pg_temp.equo67_cambia('public.scuderia_incarichi',
  $x$where a.scuderia_cavallo_id = sc.id and a.stato in ('attivo', 'da_confermare_proprietario', 'programmato')), '[]'::json)$x$,
  $x$where a.scuderia_cavallo_id = sc.id and a.stato in ('attivo', 'da_confermare_proprietario', 'programmato') and coalesce(nullif(c.professione, ''), 'maniscalco') = 'maniscalco'), '[]'::json)$x$);
select pg_temp.equo67_cambia('public.scuderia_incarichi',
  $x$where a.scuderia_cavallo_id = sc.id and a.stato = 'rifiutato'$x$,
  $x$where a.scuderia_cavallo_id = sc.id and a.stato = 'rifiutato' and coalesce(nullif(c.professione, ''), 'maniscalco') = 'maniscalco'$x$);
-- note dei veterinari: alla scuderia non arrivano (solo data e tipo)
select pg_temp.equo67_cambia('public.scuderia_pro_scheda',
  $x$'note', i.note,$x$,
  $x$'note', case when c.professione = 'veterinario' then null else i.note end,$x$);
select pg_temp.equo67_cambia('public.scuderia_appuntamenti_professionista',
  $x$min(i.note) as note$x$,
  $x$case when equo_prof_cliente(p_cliente_id) = 'veterinario' then null else min(i.note) end as note$x$);

-- ============ 8. referto non condiviso: lo vede solo l'autore (e chi ha un accesso) ============
create or replace function public.equo_doc_decide(p_doc uuid)
 returns text
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select case when coalesce((select solo_autore from documenti where id = p_doc), false) then 'autore'
              when equo_doc_owner(p_doc) is not null then 'proprietario'
              when equo_doc_centro(p_doc) is not null then 'struttura'
              else 'autore' end
$function$;

create or replace function public.equo_doc_puo_vedere(p_doc uuid)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select auth.uid() is not null and exists (
    select 1 from documenti d where d.id = p_doc and d.eliminato_il is null and (
      d.autore_user_id = auth.uid()
      or (not d.solo_autore and (
           auth.uid() = equo_doc_owner(d.id)
           or (equo_doc_decide(d.id) = 'struttura' and is_admin_of_centro(equo_doc_centro(d.id)))
           or (d.sanitario_obbligatorio and equo_doc_centro(d.id) is not null and is_member_of_centro(equo_doc_centro(d.id)))))
      or exists (select 1 from documenti_accessi a where a.documento_id = d.id and a.revocato_il is null
                   and (a.scade_il is null or a.scade_il > now())
                   and (a.user_id = auth.uid() or (a.centro_id is not null and is_member_of_centro(a.centro_id))))))
$function$;

-- ============ 9. scuderia: visite del veterinario su un cavallo (solo data, tipo, veterinario) ============
create or replace function public.scuderia_visite_veterinario(p_cavallo uuid)
 returns json
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select case when not exists (select 1 from scuderia_cavalli sc where sc.id = p_cavallo and is_member_of_centro(sc.centro_id)) then '[]'::json else
  coalesce((select json_agg(json_build_object('data', v.data_intervento, 'tipo', v.tipo, 'veterinario', v.vet, 'stato', v.stato) order by v.data_intervento desc, v.vet)
    from (select distinct on (i.id) i.id, i.data_intervento, i.stato, equo_nome_profilo(i.maniscalco_id) as vet,
                 equo_tipo_intervento(i.tipo_ferratura, case when i.tipo_altro = 'Da decidere sul posto' then null else i.tipo_altro end) as tipo
            from scuderia_cavalli sc
            join cavalli_clienti_mascalcia cv on cv.scuderia_cavallo_id = sc.id
                 or (sc.horse_id is not null and cv.horse_id = sc.horse_id
                     and exists (select 1 from horses h where h.id = sc.horse_id and coalesce(h.condiviso_ecosistema, true)))
            join interventi_mascalcia i on i.cavallo_cliente_id = cv.id
           where sc.id = p_cavallo and i.professione = 'veterinario' and i.stato in ('programmato', 'fatto')
             and i.data_intervento >= current_date - 730
           order by i.id) v), '[]'::json) end;
$function$;

-- ============ 10. veterinario ↔ maniscalco: la scheda di un cavallo nella chat tra colleghi ============
-- colleghi a cui mandarla; «segue» = segue già lo stesso proprietario, la stessa scuderia o lo stesso cavallo
create or replace function public.pro_colleghi_per_cavallo(p_riga uuid)
 returns json
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select coalesce(json_agg(x order by x.segue desc, x.nome), '[]'::json) from (
    select l.conversazione_id, l.altro_id as id, l.nome, l.ruolo, l.certificato,
           (exists (select 1 from clienti_mascalcia c2 where c2.maniscalco_id = l.altro_id and c2.archiviato_il is null
                      and ((cm.cliente_user_id is not null and c2.cliente_user_id = cm.cliente_user_id)
                        or (cm.centro_id is not null and c2.centro_id = cm.centro_id)))
            or exists (select 1 from cavalli_clienti_mascalcia x2 where x2.maniscalco_id = l.altro_id and x2.archiviato_il is null
                      and cv.horse_id is not null and x2.horse_id = cv.horse_id)) as segue
      from cavalli_clienti_mascalcia cv
      join clienti_mascalcia cm on cm.id = cv.cliente_mascalcia_id
      cross join lateral lista_colleghi() l
     where cv.id = p_riga and cv.maniscalco_id = auth.uid()
  ) x
$function$;

create or replace function public.pro_manda_cavallo_collega(p_conv uuid, p_riga uuid, p_indicazioni text default null, p_documenti uuid[] default null, p_avvisa boolean default true)
 returns json
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_me uuid := auth.uid(); cv record; cm record; conv record; v_altro uuid; v_prof text; v_prof_altro text; v_nome_altro text;
        d jsonb; docs jsonb := '[]'::jsonb; v_doc record; v_msg uuid; v_avvisato boolean := false; v_ind text := nullif(trim(coalesce(p_indicazioni, '')), '');
begin
  if v_me is null then return json_build_object('ok', false, 'errore', 'Accedi di nuovo.'); end if;
  select * into cv from cavalli_clienti_mascalcia where id = p_riga and maniscalco_id = v_me;
  if cv.id is null then return json_build_object('ok', false, 'errore', 'Cavallo non trovato.'); end if;
  select * into cm from clienti_mascalcia where id = cv.cliente_mascalcia_id;
  select * into conv from conversazioni_proprietari where id = p_conv and tipo = 'colleghi' and v_me in (proprietario_a_id, proprietario_b_id);
  if conv.id is null then return json_build_object('ok', false, 'errore', 'Chat con il collega non trovata.'); end if;
  v_altro := case when conv.proprietario_a_id = v_me then conv.proprietario_b_id else conv.proprietario_a_id end;
  v_prof := coalesce(equo_professione(v_me), 'maniscalco');
  v_prof_altro := coalesce(equo_professione(v_altro), 'professionista');
  v_nome_altro := coalesce(equo_nome_profilo(v_altro), 'un collega');
  if v_ind is not null then v_ind := left(v_ind, 2000); end if;
  -- documenti spuntati: solo i miei, di questo cavallo; il collega li vede per consulto (resta nello storico)
  if p_documenti is not null then
    for v_doc in select d0.id, d0.titolo, d0.mime from documenti d0
                  where d0.id = any(p_documenti) and d0.autore_user_id = v_me and d0.eliminato_il is null
                    and (d0.cavallo_cliente_id = cv.id or (cv.horse_id is not null and d0.horse_id = cv.horse_id)) loop
      if not exists (select 1 from documenti_accessi a where a.documento_id = v_doc.id and a.user_id = v_altro and a.revocato_il is null
                       and (a.scade_il is null or a.scade_il > now())) then
        insert into documenti_accessi (documento_id, user_id, motivo, concesso_da) values (v_doc.id, v_altro, 'consulto', v_me);
        insert into documenti_registro (documento_id, user_id, azione, verso_user, dettagli)
          values (v_doc.id, v_me, 'condiviso', v_altro, jsonb_build_object('motivo', 'consulto', 'con', 'scheda cavallo in chat'));
      end if;
      docs := docs || jsonb_build_array(jsonb_build_object('id', v_doc.id, 'titolo', v_doc.titolo, 'mime', v_doc.mime));
    end loop;
  end if;
  d := jsonb_build_object('riga', cv.id, 'nome', cv.nome, 'microchip', nullif(trim(coalesce(cv.microchip, '')), ''), 'codice_equo', cv.codice_equo,
         'horse_id', cv.horse_id, 'razza', cv.razza, 'sesso', cv.sesso, 'mantello', cv.mantello, 'anno_nascita', cv.anno_nascita,
         'cliente', cm.nome, 'tipo_cliente', coalesce(cm.tipo_cliente, 'proprietario'), 'cliente_user_id', cm.cliente_user_id, 'centro_id', cm.centro_id,
         'professione', v_prof, 'indicazioni', v_ind, 'documenti', docs);
  insert into messaggi_proprietari (conversazione_id, mittente_id, tipo, testo, dati)
  values (conv.id, v_me, 'cavallo', '🐴 ' || cv.nome || coalesce(' · ' || left(v_ind, 120), ''), d)
  returning id into v_msg;
  -- avviso al proprietario (o alla scuderia collegata) nella chat con chi manda la scheda
  if coalesce(p_avvisa, true) and (cm.cliente_user_id is not null or (cm.centro_id is not null and cm.collegamento_stato = 'attivo')) then
    perform set_config('equo.collegamento', 'on', true);
    insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
    values (v_me, cm.id, 'maniscalco', v_me, 'testo',
      'ℹ️ Ho condiviso la scheda di ' || cv.nome || ' con ' || v_nome_altro || ' (' || v_prof_altro || ')'
      || case when v_ind is not null then ', con le mie indicazioni' else '' end
      || case when jsonb_array_length(docs) = 1 then ' e 1 documento' when jsonb_array_length(docs) > 1 then ' e ' || jsonb_array_length(docs) || ' documenti' else '' end
      || ', per seguirlo insieme.', false);
    perform set_config('equo.collegamento', '', true);
    v_avvisato := true;
  end if;
  return json_build_object('ok', true, 'messaggio', v_msg, 'avvisato', v_avvisato, 'documenti', jsonb_array_length(docs), 'collega', v_nome_altro);
end $function$;

-- chi riceve: «Aggiungi ai miei cavalli» (p_riga vuoto) o «Ce l'ho già: collega» (p_riga = il suo cavallo)
create or replace function public.pro_ricevi_cavallo_collega(p_msg uuid, p_riga uuid default null)
 returns json
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_me uuid := auth.uid(); m record; d jsonb; v_cli uuid; v_riga uuid; v_nuovo_cli boolean := false; v_nuovo_cav boolean := false; v_nome_cli text;
begin
  if v_me is null then return json_build_object('ok', false, 'errore', 'Accedi di nuovo.'); end if;
  select mp.* into m from messaggi_proprietari mp join conversazioni_proprietari c on c.id = mp.conversazione_id
   where mp.id = p_msg and mp.tipo = 'cavallo' and c.tipo = 'colleghi' and v_me in (c.proprietario_a_id, c.proprietario_b_id) and mp.mittente_id <> v_me;
  if m.id is null then return json_build_object('ok', false, 'errore', 'Scheda non trovata.'); end if;
  d := coalesce(m.dati, '{}'::jsonb);
  if p_riga is not null then
    select id, cliente_mascalcia_id into v_riga, v_cli from cavalli_clienti_mascalcia where id = p_riga and maniscalco_id = v_me;
    if v_riga is null then return json_build_object('ok', false, 'errore', 'Cavallo non trovato tra i tuoi.'); end if;
  else
    -- lo stesso cavallo è già tra i miei: per cavallo Equo, microchip o codice
    select x.id, x.cliente_mascalcia_id into v_riga, v_cli from cavalli_clienti_mascalcia x
     where x.maniscalco_id = v_me and x.archiviato_il is null
       and ((d->>'horse_id' is not null and x.horse_id = (d->>'horse_id')::uuid)
         or (nullif(d->>'microchip', '') is not null and upper(trim(x.microchip)) = upper(trim(d->>'microchip')))
         or (nullif(d->>'codice_equo', '') is not null and x.codice_equo = d->>'codice_equo'))
     order by (d->>'horse_id' is not null and x.horse_id = (d->>'horse_id')::uuid) desc limit 1;
    if v_riga is null then
      -- il cliente: stesso account Equo o stessa scuderia, poi stesso nome
      select c.id into v_cli from clienti_mascalcia c where c.maniscalco_id = v_me and c.archiviato_il is null
         and ((d->>'cliente_user_id' is not null and c.cliente_user_id = (d->>'cliente_user_id')::uuid)
           or (d->>'centro_id' is not null and c.centro_id = (d->>'centro_id')::uuid))
       order by c.created_at limit 1;
      if v_cli is null then
        select c.id into v_cli from clienti_mascalcia c where c.maniscalco_id = v_me and c.archiviato_il is null
           and lower(trim(c.nome)) = lower(trim(coalesce(d->>'cliente', ''))) order by c.created_at limit 1;
      end if;
      if v_cli is null then
        insert into clienti_mascalcia (maniscalco_id, nome, codice_invito, tipo_cliente)
        values (v_me, coalesce(nullif(trim(d->>'cliente'), ''), 'Cliente'), equo_nuovo_codice_invito(),
                case when d->>'tipo_cliente' = 'struttura' then 'struttura' else 'proprietario' end)
        returning id into v_cli;
        v_nuovo_cli := true;
      end if;
      insert into cavalli_clienti_mascalcia (maniscalco_id, cliente_mascalcia_id, nome, microchip, razza, sesso, mantello, anno_nascita)
      values (v_me, v_cli, coalesce(nullif(trim(d->>'nome'), ''), 'Cavallo'), nullif(upper(trim(coalesce(d->>'microchip', ''))), ''),
              nullif(d->>'razza', ''), nullif(d->>'sesso', ''), nullif(d->>'mantello', ''), nullif(d->>'anno_nascita', '')::int)
      returning id into v_riga;
      v_nuovo_cav := true;
    end if;
  end if;
  if nullif(d->>'indicazioni', '') is not null
     and not exists (select 1 from cavalli_clienti_mascalcia x, jsonb_array_elements(x.note_colleghi) e where x.id = v_riga and e->>'messaggio' = m.id::text) then
    update cavalli_clienti_mascalcia
       set note_colleghi = coalesce(note_colleghi, '[]'::jsonb) || jsonb_build_array(jsonb_build_object('da', equo_nome_profilo(m.mittente_id),
             'professione', d->>'professione', 'il', m.created_at, 'testo', d->>'indicazioni', 'messaggio', m.id))
     where id = v_riga;
  end if;
  update messaggi_proprietari set dati = coalesce(dati, '{}'::jsonb) || jsonb_build_object('ricevuto', jsonb_build_object('il', now()))
   where id = m.id;
  select nome into v_nome_cli from clienti_mascalcia where id = v_cli;
  return json_build_object('ok', true, 'riga', v_riga, 'cliente_id', v_cli, 'cliente', v_nome_cli, 'nuovo_cliente', v_nuovo_cli, 'nuovo_cavallo', v_nuovo_cav);
end $function$;

grant execute on function public.equo_prof_cliente(uuid) to authenticated;
grant execute on function public.scuderia_visite_veterinario(uuid) to authenticated;
grant execute on function public.pro_colleghi_per_cavallo(uuid) to authenticated;
grant execute on function public.pro_manda_cavallo_collega(uuid, uuid, text, uuid[], boolean) to authenticated;
grant execute on function public.pro_ricevi_cavallo_collega(uuid, uuid) to authenticated;
revoke execute on function public.equo_prof_cliente(uuid) from anon;
revoke execute on function public.scuderia_visite_veterinario(uuid) from anon;
revoke execute on function public.pro_colleghi_per_cavallo(uuid) from anon;
revoke execute on function public.pro_manda_cavallo_collega(uuid, uuid, text, uuid[], boolean) from anon;
revoke execute on function public.pro_ricevi_cavallo_collega(uuid, uuid) from anon;

commit;

-- PROVA_OK: colonne, funzioni nuove e sostituzioni tutte al loro posto
select case when
      exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'documenti' and column_name = 'solo_autore')
  and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'interventi_mascalcia' and column_name = 'referto_proprietario')
  and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'messaggi_proprietari' and column_name = 'dati')
  and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cavalli_clienti_mascalcia' and column_name = 'note_colleghi')
  and pg_get_constraintdef((select oid from pg_constraint where conname = 'messaggi_proprietari_tipo_check')) like '%cavallo%'
  and pg_get_functiondef('public.scuderia_aggiungi_maniscalco'::regproc) like '%''veterinario''%'
  and pg_get_functiondef('public.pro_richiedi_collegamento_struttura'::regproc) like '%''veterinario''%'
  and pg_get_functiondef('public.scuderia_usa_codice_invito'::regproc) like '%SQL 67%'
  and pg_get_functiondef('public.limite_maniscalchi'::regproc) like '%veterinari%'
  and pg_get_functiondef('public.scuderia_lista_professionisti'::regproc) like '%as cavalli%'
  and pg_get_functiondef('public.equo_incarico_assegna'::regproc) like '%equo_prof_cliente%'
  and pg_get_functiondef('public.equo_incarico_attiva'::regproc) like '%equo_prof_cliente%'
  and pg_get_functiondef('public.mie_proposte_professionisti'::regproc) like '%equo_prof_cliente%'
  and pg_get_functiondef('public.scuderia_proposta_rispondi'::regproc) like '%equo_prof_cliente%'
  and pg_get_functiondef('public.scuderia_incarico_azione'::regproc) like '%equo_prof_cliente%'
  and pg_get_functiondef('public.scuderia_incarichi'::regproc) like '%c.professione%'
  and pg_get_functiondef('public.scuderia_pro_scheda'::regproc) like '%c.professione = ''veterinario''%'
  and pg_get_functiondef('public.scuderia_appuntamenti_professionista'::regproc) like '%equo_prof_cliente%'
  and pg_get_functiondef('public.equo_doc_puo_vedere'::regproc) like '%solo_autore%'
  and pg_get_functiondef('public.equo_doc_decide'::regproc) like '%solo_autore%'
  and to_regproc('public.scuderia_visite_veterinario') is not null
  and to_regproc('public.pro_colleghi_per_cavallo') is not null
  and to_regproc('public.pro_manda_cavallo_collega') is not null
  and to_regproc('public.pro_ricevi_cavallo_collega') is not null
then 'PROVA_OK' else 'PROBLEMA' end as esito;
