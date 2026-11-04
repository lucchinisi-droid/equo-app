-- Equo: CAVALLI ABBINATI AI PROFESSIONISTI DELLA SCUDERIA (4 novembre 2026) · SQL 43 · richiesta di Simone del 4/11
-- Prima un maniscalco collegato riceveva TUTTI i cavalli del centro (equo_sync_cavalli_struttura). Ora:
--  · la scuderia sceglie quali cavalli abbinare quando invita il professionista (o accetta la sua richiesta) e
--    li cambia quando vuole dalla scheda del professionista;
--  · se il cavallo ha un proprietario su Equo, l'abbinamento resta «da confermare» finché il proprietario non accetta
--    (messaggio in chat + riquadro nell'App Equo); se rifiuta, il cavallo non viene abbinato;
--  · il professionista riceve nella sua app solo i cavalli abbinati e confermati; un cavallo tolto viene archiviato
--    nella sua app («Non lo seguo più»): i lavori fatti restano nel suo storico;
--  · scuderia_pro_scheda = cavalli con lo stato dell'abbinamento, storico dei lavori con tutti i dettagli, documenti;
--  · i collegamenti esistenti tengono i cavalli che il professionista ha oggi nella sua app (non archiviati).
-- Rieseguibile. Il controllo finale deve dare 1 · true · true · true.

-- 1 · abbinamenti ------------------------------------------------------------------------------------
create table if not exists public.scuderia_cavalli_professionisti (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.centri(id) on delete cascade,
  scuderia_cavallo_id uuid not null references public.scuderia_cavalli(id) on delete cascade,
  cliente_mascalcia_id uuid not null references public.clienti_mascalcia(id) on delete cascade,
  stato text not null check (stato in ('attivo', 'da_confermare_proprietario', 'rifiutato')),
  proposto_da uuid default auth.uid(),
  proposto_il timestamptz not null default now(),
  risposto_da uuid,
  risposto_il timestamptz,
  unique (scuderia_cavallo_id, cliente_mascalcia_id)
);
create index if not exists scp_cliente_idx on public.scuderia_cavalli_professionisti (cliente_mascalcia_id, stato);
create index if not exists scp_centro_idx on public.scuderia_cavalli_professionisti (centro_id);
alter table public.scuderia_cavalli_professionisti enable row level security;
drop policy if exists scp_leggi on public.scuderia_cavalli_professionisti;
create policy scp_leggi on public.scuderia_cavalli_professionisti for select to authenticated using (public.is_member_of_centro(centro_id));
-- niente scrittura diretta: scrivono le funzioni qui sotto

-- proprietario su Equo di una scheda della scuderia: il membro collegato o il proprietario del cavallo nell'app
create or replace function public.equo_proprietario_scheda(p_scheda uuid) returns uuid
language sql stable security definer set search_path to 'public' as $$
  select coalesce(
    (select m.user_id from scuderia_cavalli sc join scuderia_membri m on m.id = sc.proprietario_membro_id where sc.id = p_scheda and m.user_id is not null),
    (select h.owner_id from scuderia_cavalli sc join horses h on h.id = sc.horse_id where sc.id = p_scheda))
$$;
revoke all on function public.equo_proprietario_scheda(uuid) from public, anon, authenticated;

-- 2 · i cavalli che arrivano nell'app del professionista: solo quelli abbinati e confermati -----------------
create or replace function public.equo_sync_cavalli_struttura(p_cliente_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare c record; r record; v_match uuid;
begin
  select id, maniscalco_id, centro_id into c from clienti_mascalcia
   where id = p_cliente_id and centro_id is not null and collegamento_stato = 'attivo';
  if c.id is null then return; end if;

  -- 1) abbina i cavalli inseriti a mano ai cavalli della scuderia abbinati e non ancora presenti
  for r in select sc.id, sc.nome, nullif(upper(trim(sc.microchip)), '') chip from scuderia_cavalli sc
            join scuderia_cavalli_professionisti a on a.scuderia_cavallo_id = sc.id and a.cliente_mascalcia_id = c.id and a.stato = 'attivo'
            where sc.centro_id = c.centro_id
              and not exists (select 1 from cavalli_clienti_mascalcia x where x.cliente_mascalcia_id = c.id and x.scuderia_cavallo_id = sc.id)
  loop
    v_match := null;
    if r.chip is not null then
      select x.id into v_match from cavalli_clienti_mascalcia x
       where x.cliente_mascalcia_id = c.id and x.scuderia_cavallo_id is null and upper(trim(x.microchip)) = r.chip limit 1;
    end if;
    if v_match is null then
      select min(x.id::text)::uuid into v_match from cavalli_clienti_mascalcia x
       where x.cliente_mascalcia_id = c.id and x.scuderia_cavallo_id is null and lower(trim(x.nome)) = lower(trim(r.nome))
      having count(*) = 1;
    end if;
    if v_match is not null then
      update cavalli_clienti_mascalcia set scuderia_cavallo_id = r.id, microchip = coalesce(nullif(trim(microchip), ''), r.chip) where id = v_match;
    end if;
  end loop;

  -- 2) aggiunge i cavalli abbinati che mancano; riporta in elenco quelli archiviati e di nuovo abbinati
  insert into cavalli_clienti_mascalcia (maniscalco_id, cliente_mascalcia_id, nome, microchip, scuderia_cavallo_id)
  select c.maniscalco_id, c.id, sc.nome, nullif(upper(trim(sc.microchip)), ''), sc.id
    from scuderia_cavalli sc
    join scuderia_cavalli_professionisti a on a.scuderia_cavallo_id = sc.id and a.cliente_mascalcia_id = c.id and a.stato = 'attivo'
   where sc.centro_id = c.centro_id
     and not exists (select 1 from cavalli_clienti_mascalcia x where x.cliente_mascalcia_id = c.id and x.scuderia_cavallo_id = sc.id);
  update cavalli_clienti_mascalcia x set archiviato_il = null
   where x.cliente_mascalcia_id = c.id and x.archiviato_il is not null
     and exists (select 1 from scuderia_cavalli_professionisti a where a.cliente_mascalcia_id = c.id and a.scuderia_cavallo_id = x.scuderia_cavallo_id and a.stato = 'attivo'
                  and greatest(a.proposto_il, coalesce(a.risposto_il, a.proposto_il)) >= x.archiviato_il);   -- se l'ha tolto il professionista, resta tolto finché la scuderia non lo riassegna

  -- 3) i cavalli della scuderia non più abbinati escono dall'elenco (archiviati: lo storico resta)
  update cavalli_clienti_mascalcia x set archiviato_il = now()
   where x.cliente_mascalcia_id = c.id and x.scuderia_cavallo_id is not null and x.archiviato_il is null
     and not exists (select 1 from scuderia_cavalli_professionisti a where a.cliente_mascalcia_id = c.id and a.scuderia_cavallo_id = x.scuderia_cavallo_id and a.stato = 'attivo');

  -- 4) nomi allineati alla scheda della scuderia
  update cavalli_clienti_mascalcia x set nome = sc.nome
    from scuderia_cavalli sc
   where x.cliente_mascalcia_id = c.id and x.scuderia_cavallo_id = sc.id and x.nome is distinct from sc.nome;
end $$;
revoke all on function public.equo_sync_cavalli_struttura(uuid) from public, anon, authenticated;

-- l'elenco per gli appuntamenti del professionista non mostra i cavalli archiviati
do $$
declare v_def text;
begin
  v_def := pg_get_functiondef('public.pro_cavalli_struttura'::regproc);
  if position('archiviato_il is null' in v_def) = 0 then
    execute replace(v_def, 'from cavalli_clienti_mascalcia cv where cv.cliente_mascalcia_id = p_cliente_id), ''[]''::json);',
                           'from cavalli_clienti_mascalcia cv where cv.cliente_mascalcia_id = p_cliente_id and cv.archiviato_il is null), ''[]''::json);');
  end if;
  v_def := pg_get_functiondef('public.scuderia_proponi_appuntamento'::regproc);
  if position('archiviato_il is null' in v_def) = 0 then
    execute replace(v_def, 'from cavalli_clienti_mascalcia cv where cv.cliente_mascalcia_id = c.id and cv.scuderia_cavallo_id = v_cav;',
                           'from cavalli_clienti_mascalcia cv where cv.cliente_mascalcia_id = c.id and cv.scuderia_cavallo_id = v_cav and cv.archiviato_il is null;');
  end if;
end $$;

-- 3 · imposta i cavalli di un professionista (cuore comune di invito, accettazione e scheda) ----------------
create or replace function public.equo_abbina_cavalli_pro(p_cliente_id uuid, p_cavalli uuid[])
returns json language plpgsql security definer set search_path to 'public' as $$
declare c record; v_cav uuid; v_own uuid; v_membro uuid; v_nome_cav text; v_pro text; v_centro text; n_att int := 0; n_conf int := 0; n_tolti int := 0;
begin
  select * into c from clienti_mascalcia where id = p_cliente_id and centro_id is not null;
  if c.id is null then return json_build_object('ok', false, 'errore', 'Collegamento non trovato.'); end if;
  v_pro := equo_nome_profilo(c.maniscalco_id);
  select coalesce(nullif(trim(nome), ''), 'La scuderia') into v_centro from centri where id = c.centro_id;
  p_cavalli := coalesce(p_cavalli, '{}');

  -- tolti
  with via as (delete from scuderia_cavalli_professionisti a
                where a.cliente_mascalcia_id = c.id and not (a.scuderia_cavallo_id = any(p_cavalli)) returning 1)
  select count(*) into n_tolti from via;

  -- aggiunti (o riproposti dopo un rifiuto)
  foreach v_cav in array p_cavalli loop
    continue when not exists (select 1 from scuderia_cavalli where id = v_cav and centro_id = c.centro_id);
    continue when exists (select 1 from scuderia_cavalli_professionisti where cliente_mascalcia_id = c.id and scuderia_cavallo_id = v_cav and stato <> 'rifiutato');
    v_own := equo_proprietario_scheda(v_cav);
    if v_own is null or v_own = auth.uid() then
      insert into scuderia_cavalli_professionisti (centro_id, scuderia_cavallo_id, cliente_mascalcia_id, stato, risposto_il)
      values (c.centro_id, v_cav, c.id, 'attivo', now())
      on conflict (scuderia_cavallo_id, cliente_mascalcia_id) do update set stato = 'attivo', proposto_il = now(), proposto_da = auth.uid(), risposto_il = now(), risposto_da = null;
      n_att := n_att + 1;
    else
      insert into scuderia_cavalli_professionisti (centro_id, scuderia_cavallo_id, cliente_mascalcia_id, stato)
      values (c.centro_id, v_cav, c.id, 'da_confermare_proprietario')
      on conflict (scuderia_cavallo_id, cliente_mascalcia_id) do update set stato = 'da_confermare_proprietario', proposto_il = now(), proposto_da = auth.uid(), risposto_il = null, risposto_da = null;
      n_conf := n_conf + 1;
      -- messaggio al proprietario nella chat con la scuderia (se è un membro del centro)
      select nome into v_nome_cav from scuderia_cavalli where id = v_cav;
      select m.id into v_membro from scuderia_membri m where m.centro_id = c.centro_id and m.user_id = v_own limit 1;
      if v_membro is not null then
        insert into chat_messaggi (centro_id, membro_id, mittente_user_id, tipo, testo, letto)
        values (c.centro_id, v_membro, auth.uid(), 'testo',
          '🐴 ' || v_centro || ' propone ' || v_pro || ' come ' || coalesce(nullif(c.professione, ''), 'maniscalco') || ' di ' || coalesce(v_nome_cav, 'il tuo cavallo')
          || '. Conferma o rifiuta dalla Home di Equo.', false);
      end if;
    end if;
  end loop;

  perform equo_sync_cavalli_struttura(c.id);
  return json_build_object('ok', true, 'attivi', n_att, 'da_confermare', n_conf, 'tolti', n_tolti);
end $$;
revoke all on function public.equo_abbina_cavalli_pro(uuid, uuid[]) from public, anon, authenticated;

-- dalla scheda del professionista
create or replace function public.scuderia_pro_imposta_cavalli(p_cliente_id uuid, p_cavalli uuid[])
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_centro uuid;
begin
  select centro_id into v_centro from clienti_mascalcia where id = p_cliente_id;
  if v_centro is null or not can_collegare_professionisti(v_centro) then
    return json_build_object('ok', false, 'errore', 'Solo l''amministratore o un membro di livello 2 o 3 può abbinare i cavalli.');
  end if;
  return equo_abbina_cavalli_pro(p_cliente_id, p_cavalli);
end $$;
revoke all on function public.scuderia_pro_imposta_cavalli(uuid, uuid[]) from public, anon;
grant execute on function public.scuderia_pro_imposta_cavalli(uuid, uuid[]) to authenticated, service_role;

-- 4 · invito e accettazione con i cavalli scelti -------------------------------------------------------
drop function if exists public.scuderia_aggiungi_maniscalco(uuid, text);
create or replace function public.scuderia_aggiungi_maniscalco(p_centro_id uuid, p_codice text, p_cavalli uuid[] default null)
returns json language plpgsql security definer set search_path to 'public' as $$
declare
  v_centro record; v_pro record; v_es record; v_id uuid; v_senza boolean;
begin
  if not can_collegare_professionisti(p_centro_id) then
    return json_build_object('ok', false, 'errore', 'Solo l''amministratore o un membro di livello 2 o 3 può collegare professionisti.');
  end if;
  select id, nome, telefono into v_centro from centri where id = p_centro_id;
  select id, ruolo, ruolo_secondario, dati_pagamento_piva_cf into v_pro from profiles
   where codice_professionista = equo_codice_trova(p_codice, 'profilo') limit 1;
  if v_pro.id is null then return json_build_object('ok', false, 'errore', 'Codice professionista non trovato. Controlla di averlo scritto bene.'); end if;
  if 'maniscalco' not in (coalesce(v_pro.ruolo, ''), coalesce(v_pro.ruolo_secondario, '')) then
    return json_build_object('ok', false, 'errore', 'Questo codice non è di un maniscalco. Veterinari e istruttori saranno collegabili a breve.');
  end if;
  v_senza := coalesce(trim(v_pro.dati_pagamento_piva_cf), '') = '';
  select * into v_es from clienti_mascalcia where maniscalco_id = v_pro.id and centro_id = p_centro_id;
  if v_es.id is not null then
    if p_cavalli is not null then perform equo_abbina_cavalli_pro(v_es.id, p_cavalli); end if;
    return json_build_object('ok', true, 'gia', true, 'stato', v_es.collegamento_stato, 'nome', equo_nome_profilo(v_pro.id), 'senza_piva', v_senza);
  end if;
  perform set_config('equo.collegamento', 'on', true);
  insert into clienti_mascalcia (maniscalco_id, nome, telefono, codice_invito, tipo_cliente, centro_id, collegamento_stato, collegamento_origine, collegamento_il)
  values (v_pro.id, coalesce(nullif(trim(v_centro.nome), ''), 'Struttura'), v_centro.telefono, equo_nuovo_codice_invito(), 'struttura',
          p_centro_id, 'da_confermare_pro', 'struttura', now())
  returning id into v_id;
  insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
  values (v_pro.id, v_id, 'cliente', auth.uid(), 'testo',
    '🤝 ' || coalesce(nullif(trim(v_centro.nome), ''), 'Una struttura') || ' vuole collegarti come maniscalco su Equo: chat e appuntamenti con la struttura in un posto solo. Accetta da Clienti → Strutture.'
    || case when v_senza then E'\n\nℹ️ Nel tuo profilo mancano P.IVA o codice fiscale: aggiungili da menu profilo → Dati per i pagamenti.' else '' end, false);
  if p_cavalli is not null then perform equo_abbina_cavalli_pro(v_id, p_cavalli); end if;
  return json_build_object('ok', true, 'nome', equo_nome_profilo(v_pro.id), 'senza_piva', v_senza);
end $$;
revoke all on function public.scuderia_aggiungi_maniscalco(uuid, text, uuid[]) from public, anon;
grant execute on function public.scuderia_aggiungi_maniscalco(uuid, text, uuid[]) to authenticated, service_role;

drop function if exists public.scuderia_rispondi_collegamento(uuid, boolean);
create or replace function public.scuderia_rispondi_collegamento(p_cliente_id uuid, p_accetta boolean, p_cavalli uuid[] default null)
returns json language plpgsql security definer set search_path to 'public' as $$
declare c record;
begin
  select * into c from clienti_mascalcia where id = p_cliente_id and collegamento_stato = 'da_confermare_struttura';
  if c.id is null then return json_build_object('ok', false, 'errore', 'Richiesta non trovata.'); end if;
  if not can_collegare_professionisti(c.centro_id) then
    return json_build_object('ok', false, 'errore', 'Solo l''amministratore o un membro di livello 2 o 3 può accettare i collegamenti.');
  end if;
  perform set_config('equo.collegamento', 'on', true);
  if p_accetta then
    update clienti_mascalcia set collegamento_stato = 'attivo', collegamento_il = now() where id = c.id;
    insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
    values (c.maniscalco_id, c.id, 'cliente', auth.uid(), 'testo', '✅ Collegamento accettato: da ora possiamo scriverci e fissare gli appuntamenti qui su Equo.', false);
    perform equo_abbina_cavalli_pro(c.id, coalesce(p_cavalli, '{}'));
  else
    update clienti_mascalcia set centro_id = null, collegamento_stato = null, collegamento_origine = null, collegamento_il = null where id = c.id;
    insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
    values (c.maniscalco_id, c.id, 'cliente', auth.uid(), 'testo', 'La struttura non ha accettato la richiesta di collegamento su Equo.', false);
  end if;
  return json_build_object('ok', true);
end $$;
revoke all on function public.scuderia_rispondi_collegamento(uuid, boolean, uuid[]) from public, anon;
grant execute on function public.scuderia_rispondi_collegamento(uuid, boolean, uuid[]) to authenticated, service_role;

-- il professionista accetta l'invito: riceve subito i cavalli abbinati (prima arrivavano tutti)
do $$
declare v_def text;
begin
  v_def := pg_get_functiondef('public.pro_rispondi_collegamento_struttura'::regproc);
  if position('equo_sync_cavalli_struttura' in v_def) = 0 then
    execute replace(v_def, 'update clienti_mascalcia set collegamento_stato = ''attivo'', collegamento_il = now() where id = c.id;',
      'update clienti_mascalcia set collegamento_stato = ''attivo'', collegamento_il = now() where id = c.id;
    perform equo_sync_cavalli_struttura(c.id);');
  end if;
end $$;

-- 5 · il proprietario conferma o rifiuta -------------------------------------------------------------
create or replace function public.mie_proposte_professionisti()
returns json language sql stable security definer set search_path to 'public' as $$
  select coalesce(json_agg(json_build_object('id', a.id, 'cavallo', sc.nome, 'horse_id', sc.horse_id,
      'scuderia', coalesce(nullif(trim(ce.nome), ''), 'La scuderia'), 'professionista', equo_nome_profilo(c.maniscalco_id),
      'professione', coalesce(nullif(c.professione, ''), 'maniscalco'), 'proposto_il', a.proposto_il) order by a.proposto_il desc), '[]'::json)
    from scuderia_cavalli_professionisti a
    join scuderia_cavalli sc on sc.id = a.scuderia_cavallo_id
    join clienti_mascalcia c on c.id = a.cliente_mascalcia_id
    join centri ce on ce.id = a.centro_id
   where a.stato = 'da_confermare_proprietario' and auth.uid() is not null and equo_proprietario_scheda(sc.id) = auth.uid()
$$;
revoke all on function public.mie_proposte_professionisti() from public, anon;
grant execute on function public.mie_proposte_professionisti() to authenticated, service_role;

create or replace function public.rispondi_proposta_professionista(p_id uuid, p_accetta boolean)
returns json language plpgsql security definer set search_path to 'public' as $$
declare a record; v_membro uuid; v_nome text; v_pro text;
begin
  select x.*, sc.nome as cavallo, c.maniscalco_id, c.professione into a
    from scuderia_cavalli_professionisti x join scuderia_cavalli sc on sc.id = x.scuderia_cavallo_id join clienti_mascalcia c on c.id = x.cliente_mascalcia_id
   where x.id = p_id and x.stato = 'da_confermare_proprietario';
  if a.id is null then return json_build_object('ok', false, 'errore', 'Proposta non trovata o già decisa.'); end if;
  if auth.uid() is null or equo_proprietario_scheda(a.scuderia_cavallo_id) is distinct from auth.uid() then
    return json_build_object('ok', false, 'errore', 'Solo il proprietario del cavallo può rispondere.');
  end if;
  update scuderia_cavalli_professionisti set stato = case when p_accetta then 'attivo' else 'rifiutato' end, risposto_il = now(), risposto_da = auth.uid() where id = a.id;
  v_pro := equo_nome_profilo(a.maniscalco_id);
  select m.id into v_membro from scuderia_membri m where m.centro_id = a.centro_id and m.user_id = auth.uid() limit 1;
  if v_membro is not null then
    insert into chat_messaggi (centro_id, membro_id, mittente_user_id, tipo, testo, letto)
    values (a.centro_id, v_membro, auth.uid(), 'testo',
      case when p_accetta then '✅ Confermo ' || v_pro || ' come ' || coalesce(nullif(a.professione, ''), 'maniscalco') || ' di ' || a.cavallo || '.'
           else '❌ Non confermo ' || v_pro || ' come ' || coalesce(nullif(a.professione, ''), 'maniscalco') || ' di ' || a.cavallo || '.' end, false);
  end if;
  if p_accetta then perform equo_sync_cavalli_struttura(a.cliente_mascalcia_id); end if;
  return json_build_object('ok', true);
end $$;
revoke all on function public.rispondi_proposta_professionista(uuid, boolean) from public, anon;
grant execute on function public.rispondi_proposta_professionista(uuid, boolean) to authenticated, service_role;

-- 6 · la scheda del professionista nel gestionale: cavalli, lavori, documenti ----------------------------
create or replace function public.scuderia_pro_scheda(p_cliente_id uuid)
returns json language plpgsql stable security definer set search_path to 'public' as $$
declare c record;
begin
  select * into c from clienti_mascalcia where id = p_cliente_id and centro_id is not null;
  if c.id is null or not is_member_of_centro(c.centro_id) then return json_build_object('errore', 'Non autorizzato'); end if;
  return json_build_object(
    'cavalli', coalesce((select json_agg(json_build_object('id', sc.id, 'nome', sc.nome, 'tipo', sc.tipo_proprieta,
        'ha_proprietario', equo_proprietario_scheda(sc.id) is not null,
        'stato', a.stato, 'risposto_il', a.risposto_il, 'uscito', sc.uscito_il is not null) order by sc.uscito_il is not null, sc.nome)
      from scuderia_cavalli sc left join scuderia_cavalli_professionisti a on a.scuderia_cavallo_id = sc.id and a.cliente_mascalcia_id = c.id
     where sc.centro_id = c.centro_id and (sc.uscito_il is null or a.id is not null)), '[]'::json),
    'lavori', coalesce((select json_agg(json_build_object('id', i.id, 'data', i.data_intervento, 'ora', to_char(i.ora, 'HH24:MI'),
        'cavallo', cv.nome, 'tipo', equo_tipo_intervento(i.tipo_ferratura, i.tipo_altro), 'stato', i.stato,
        'ferro', i.numero_ferro, 'misura', i.misura_sistema, 'quantita_ferri', i.quantita_ferri, 'ferri_nuovi', i.ferri_nuovi,
        'ferro_tipo', i.ferro_tipo, 'ferro_note', i.ferro_note, 'note', i.note, 'aiutante', i.aiutante_nome,
        'importo', i.importo, 'pagamento', i.stato_pagamento, 'saldato_il', i.saldato_il, 'prossima', i.prossima_scadenza)
        order by i.data_intervento desc, i.ora desc nulls last)
      from (select * from interventi_mascalcia where cliente_mascalcia_id = c.id order by data_intervento desc limit 300) i
      left join cavalli_clienti_mascalcia cv on cv.id = i.cavallo_cliente_id), '[]'::json),
    'documenti', coalesce((select json_agg(json_build_object('id', m.id, 'url', m.file_url, 'nome', m.file_nome, 'tipo', m.tipo,
        'da', case when m.mittente_tipo = 'maniscalco' then 'professionista' else 'scuderia' end, 'il', m.created_at) order by m.created_at desc)
      from messaggi_mascalcia m where m.cliente_mascalcia_id = c.id and m.file_url is not null), '[]'::json));
end $$;
revoke all on function public.scuderia_pro_scheda(uuid) from public, anon;
grant execute on function public.scuderia_pro_scheda(uuid) to authenticated, service_role;

-- 7 · collegamenti esistenti: tengono i cavalli che il professionista ha oggi nella sua app ------------------
insert into scuderia_cavalli_professionisti (centro_id, scuderia_cavallo_id, cliente_mascalcia_id, stato, proposto_da, risposto_il)
select c.centro_id, cv.scuderia_cavallo_id, c.id, 'attivo', null, now()
  from clienti_mascalcia c join cavalli_clienti_mascalcia cv on cv.cliente_mascalcia_id = c.id
 where c.centro_id is not null and c.collegamento_stato = 'attivo' and cv.scuderia_cavallo_id is not null and cv.archiviato_il is null
on conflict (scuderia_cavallo_id, cliente_mascalcia_id) do nothing;

-- cavalli da scegliere quando si invita o si accetta un professionista: chi chiederà conferma al proprietario
create or replace function public.scuderia_cavalli_per_abbinamento(p_centro_id uuid)
returns json language sql stable security definer set search_path to 'public' as $$
  select case when not is_member_of_centro(p_centro_id) then '[]'::json else
    coalesce((select json_agg(json_build_object('id', sc.id, 'nome', sc.nome,
        'chiede_conferma', coalesce(equo_proprietario_scheda(sc.id) <> auth.uid(), false)) order by sc.nome)
      from scuderia_cavalli sc where sc.centro_id = p_centro_id and sc.uscito_il is null), '[]'::json) end
$$;
revoke all on function public.scuderia_cavalli_per_abbinamento(uuid) from public, anon;
grant execute on function public.scuderia_cavalli_per_abbinamento(uuid) to authenticated;

-- controllo finale: deve dare 1 · true · true · true
select (select count(*) from pg_tables where schemaname = 'public' and tablename = 'scuderia_cavalli_professionisti') as tabella,
       position('scuderia_cavalli_professionisti' in pg_get_functiondef('public.equo_sync_cavalli_struttura'::regproc)) > 0 as sync_solo_abbinati,
       exists (select 1 from pg_proc where proname = 'scuderia_aggiungi_maniscalco' and pronargs = 3) as invito_con_cavalli,
       exists (select 1 from pg_proc where proname = 'rispondi_proposta_professionista') as conferma_proprietario;
