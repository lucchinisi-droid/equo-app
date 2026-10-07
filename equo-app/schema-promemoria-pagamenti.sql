-- Equo: PROMEMORIA PAGAMENTI «DA SALDARE» al proprietario (7 ottobre 2026)
-- Intervento fatto + «Da saldare» + importo → una sola notifica in chat (la prima volta), poi in App proprietario
-- riquadro in Home e pallino su Chat ogni 5 giorni finché il maniscalco non segna «Saldato».
-- Il proprietario può toccare «Ho già pagato» (il maniscalco lo riceve in chat e i promemoria si fermano).
-- Solo proprietari collegati su Equo (non le scuderie). Il maniscalco può spegnerli in generale o per un cliente.

alter table public.profiles add column if not exists promemoria_pagamenti boolean not null default true;
alter table public.clienti_mascalcia add column if not exists promemoria_pagamenti boolean not null default true;

create table if not exists public.pagamenti_promemoria (
  intervento_id uuid primary key references public.interventi_mascalcia(id) on delete cascade,
  cliente_mascalcia_id uuid not null references public.clienti_mascalcia(id) on delete cascade,
  primo_avviso_il timestamptz not null default now(),
  visto_il timestamptz,
  segnalato_pagato_il timestamptz
);
create index if not exists pagamenti_promemoria_cliente_idx on public.pagamenti_promemoria (cliente_mascalcia_id);
alter table public.pagamenti_promemoria enable row level security;   -- solo tramite le funzioni qui sotto

-- 1) intervento diventato «fatto + da saldare» → registro il promemoria e, la prima volta, un messaggio in chat
create or replace function public.interventi_promemoria_pagamento()
returns trigger language plpgsql security definer set search_path = public as $$
declare c record; v_recente boolean; v_cav text;
begin
  if new.stato <> 'fatto' or coalesce(new.stato_pagamento, '') <> 'da_saldare' or coalesce(new.importo, 0) <= 0 or new.gruppo_id is not null then return null; end if;
  if tg_op = 'UPDATE' and old.stato = 'fatto' and coalesce(old.stato_pagamento, '') = 'da_saldare' and coalesce(old.importo, 0) > 0 then return null; end if;
  if new.data_intervento < current_date - 30 then return null; end if;   -- lavori vecchi registrati dopo: nessun avviso
  select cm.id, cm.cliente_user_id, cm.centro_id, cm.promemoria_pagamenti, coalesce(p.promemoria_pagamenti, true) as pro_on into c
    from clienti_mascalcia cm left join profiles p on p.id = cm.maniscalco_id where cm.id = new.cliente_mascalcia_id;
  if c.id is null or c.cliente_user_id is null or c.centro_id is not null or not c.promemoria_pagamenti or not c.pro_on then return null; end if;
  -- più cavalli salvati insieme: un solo messaggio
  select exists (select 1 from pagamenti_promemoria where cliente_mascalcia_id = c.id and primo_avviso_il > now() - interval '10 minutes') into v_recente;
  insert into pagamenti_promemoria (intervento_id, cliente_mascalcia_id) values (new.id, c.id) on conflict do nothing;
  if not found or v_recente then return null; end if;
  select nome into v_cav from cavalli_clienti_mascalcia where id = new.cavallo_cliente_id;
  perform set_config('equo.collegamento', 'on', true);
  insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
  values (new.maniscalco_id, c.id, 'maniscalco', new.maniscalco_id, 'testo',
          '💶 Promemoria automatico di Equo — da saldare: ' || equo_tipo_intervento(new.tipo_ferratura, new.tipo_altro)
          || coalesce(' di ' || nullif(trim(v_cav), ''), '') || ' del ' || to_char(new.data_intervento, 'DD/MM')
          || ' · € ' || replace(to_char(new.importo, 'FM999999990.00'), '.', ',')
          || '. Il riepilogo è in Home; se hai già pagato tocca «Ho già pagato».', false);
  perform set_config('equo.collegamento', '', true);
  return null;
end $$;
drop trigger if exists trg_interventi_promemoria_pagamento on public.interventi_mascalcia;
create trigger trg_interventi_promemoria_pagamento after insert or update of stato, stato_pagamento, importo on public.interventi_mascalcia
  for each row execute function public.interventi_promemoria_pagamento();

-- 2) App proprietario: cosa c'è da saldare (solo i promemoria ancora validi)
create or replace function public.prop_pagamenti_da_saldare()
returns json language sql stable security definer set search_path = public as $$
  with r as (
    select i.id, i.maniscalco_id, i.cliente_mascalcia_id, i.data_intervento, i.importo,
           equo_tipo_intervento(i.tipo_ferratura, i.tipo_altro) as tipo, cv.nome as cavallo,
           pp.visto_il, pp.segnalato_pagato_il, pp.primo_avviso_il,
           equo_nome_profilo(i.maniscalco_id) as maniscalco,
           nullif(trim(p.dati_pagamento_nome), '') as pag_nome, nullif(trim(p.dati_pagamento_iban), '') as iban, nullif(trim(p.dati_pagamento_paypal), '') as paypal
      from pagamenti_promemoria pp
      join interventi_mascalcia i on i.id = pp.intervento_id
      join clienti_mascalcia cm on cm.id = i.cliente_mascalcia_id
      left join cavalli_clienti_mascalcia cv on cv.id = i.cavallo_cliente_id
      left join profiles p on p.id = i.maniscalco_id
     where cm.cliente_user_id = auth.uid() and cm.centro_id is null and cm.promemoria_pagamenti
       and coalesce(p.promemoria_pagamenti, true)
       and i.stato = 'fatto' and i.stato_pagamento = 'da_saldare' and coalesce(i.importo, 0) > 0
  )
  select json_build_object(
    'righe', coalesce((select json_agg(json_build_object('id', id, 'maniscalco_id', maniscalco_id, 'cliente_mascalcia_id', cliente_mascalcia_id,
              'maniscalco', maniscalco, 'tipo', tipo, 'cavallo', cavallo, 'data', data_intervento, 'importo', importo,
              'segnalato', segnalato_pagato_il is not null, 'pag_nome', pag_nome, 'iban', iban, 'paypal', paypal) order by data_intervento) from r), '[]'::json),
    'da_ricordare', exists (select 1 from r where segnalato_pagato_il is null and (visto_il is null or visto_il < now() - interval '5 days'))
  );
$$;
grant execute on function public.prop_pagamenti_da_saldare() to authenticated;

-- 3) il proprietario ha visto il riquadro: il pallino torna tra 5 giorni
create or replace function public.prop_pagamenti_visti()
returns void language sql security definer set search_path = public as $$
  update pagamenti_promemoria pp set visto_il = now()
    from clienti_mascalcia cm
   where cm.id = pp.cliente_mascalcia_id and cm.cliente_user_id = auth.uid();
$$;
grant execute on function public.prop_pagamenti_visti() to authenticated;

-- 4) «Ho già pagato»: il maniscalco lo riceve in chat, i promemoria di quell'intervento si fermano
create or replace function public.prop_segnala_pagato(p_intervento uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v record;
begin
  select i.*, cm.cliente_user_id, cv.nome as cavallo into v
    from pagamenti_promemoria pp join interventi_mascalcia i on i.id = pp.intervento_id
    join clienti_mascalcia cm on cm.id = i.cliente_mascalcia_id
    left join cavalli_clienti_mascalcia cv on cv.id = i.cavallo_cliente_id
   where pp.intervento_id = p_intervento and cm.cliente_user_id = auth.uid();
  if v.id is null then return json_build_object('ok', false); end if;
  update pagamenti_promemoria set segnalato_pagato_il = now() where intervento_id = p_intervento and segnalato_pagato_il is null;
  if not found then return json_build_object('ok', true, 'gia', true); end if;
  insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
  values (v.maniscalco_id, v.cliente_mascalcia_id, 'cliente', auth.uid(), 'testo',
          '💶 Ho già pagato: ' || equo_tipo_intervento(v.tipo_ferratura, v.tipo_altro) || coalesce(' di ' || nullif(trim(v.cavallo), ''), '')
          || ' del ' || to_char(v.data_intervento, 'DD/MM') || ' · € ' || replace(to_char(v.importo, 'FM999999990.00'), '.', ',')
          || '. Puoi segnarlo «Saldato» in Equo.', false);
  return json_build_object('ok', true);
end $$;
grant execute on function public.prop_segnala_pagato(uuid) to authenticated;

-- 5) guide degli agenti AI
insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, attivo, verificato_il)
select 'proprietario', 'guida', 'Promemoria dei pagamenti da saldare al maniscalco',
'Dove: Home → riquadro "Da saldare" (e pallino su "Chat")
Passi:
1. Quando il maniscalco segna un lavoro "Da saldare" ricevi una notifica in chat (solo la prima volta).
2. In Home trovi il riquadro "Da saldare" con lavoro, cavallo, data, importo e totale.
3. Tocca "Come pagare" per vedere IBAN o PayPal del maniscalco (se li ha indicati).
4. Se hai già pagato tocca "Ho già pagato": il maniscalco lo riceve in chat e il promemoria si ferma.
Esempio: Riccardo segna "Da saldare" la ferratura di Rio (90 €): Simone vede il riquadro in Home, paga con bonifico e tocca "Ho già pagato".
Note: Il pallino sulla Chat ricompare ogni 5 giorni finché il maniscalco non segna "Saldato"; nessun''altra notifica sul telefono. Il riquadro sparisce quando il maniscalco segna il pagamento. Vale per i maniscalchi collegati su Equo; Equo non gestisce pagamenti, mostra solo i dati che il maniscalco ha inserito.
Parole chiave: da saldare, pagamento maniscalco, quanto devo, promemoria pagamento, ho già pagato, iban maniscalco, bonifico, pagare ferratura'
, true, current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Promemoria dei pagamenti da saldare al maniscalco');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, attivo, verificato_il)
select 'maniscalco', 'guida', 'Promemoria automatici dei pagamenti ai clienti',
'Dove: automatico quando segni un lavoro "Fatto" e "Da saldare"; impostazioni: menu profilo → "Promemoria pagamenti ai clienti" e Clienti → cliente → "Modifica"
Passi:
1. Segna il lavoro "Fatto" con importo e "Da saldare".
2. Se il cliente è collegato su Equo riceve una sola notifica in chat; poi nella sua Home resta il riquadro "Da saldare" e ogni 5 giorni un pallino discreto, finché non segni "Saldato".
3. Se il cliente tocca "Ho già pagato" ricevi in chat "💶 Ho già pagato: …": controlla e segna "Saldato" (Incassi o Modifica → Pagamento).
4. Per un cliente di fiducia togli la spunta "Promemoria pagamenti" in Modifica cliente; per tutti spegni l''interruttore nel menu profilo.
Esempio: Riccardo segna "Da saldare" la ferratura di Rio (90 €): Simone riceve il promemoria e la settimana dopo tocca "Ho già pagato".
Note: Niente promemoria per le scuderie, per i clienti non su Equo, per lavori senza importo o più vecchi di 30 giorni. Con più cavalli salvati insieme arriva un solo messaggio. Il cliente vede IBAN/PayPal solo se li hai inseriti in "Dati per i pagamenti".
Parole chiave: promemoria pagamento, sollecito, da saldare, cliente non ha pagato, ricordare pagamento, ho già pagato, crediti'
, true, current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Promemoria automatici dei pagamenti ai clienti');

-- controllo finale: deve dare 1 · 1 · 2
select (select count(*) from pg_trigger where tgname = 'trg_interventi_promemoria_pagamento') as trigger_promemoria,
       (select count(*) from information_schema.tables where table_name = 'pagamenti_promemoria') as tabella,
       (select count(*) from ai_conoscenze where titolo in ('Promemoria dei pagamenti da saldare al maniscalco','Promemoria automatici dei pagamenti ai clienti')) as guide;
