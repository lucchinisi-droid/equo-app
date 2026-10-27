-- Equo: PAGAMENTI IN PIÙ TRANCHE E RATE (27 ottobre 2026)
-- Un lavoro o un conto può essere pagato in più volte. Ogni pagamento ricevuto è una riga di incassi_tranche
-- (importo, giorno, modalità, nota). Lo stato del lavoro si calcola da solo:
--   nessuna tranche = Da saldare · qualche tranche = Acconto · somma = importo → Saldato (giorno del saldo = ultima tranche).
-- Un pagamento sul CONTO si divide da solo sui lavori del conto, dal più vecchio (stesso «gruppo»).
-- Rate facoltative (incassi_rate): numero e scadenze, solo promemoria, non vincolanti.
-- Il vecchio tasto «Saldato» continua a funzionare: chiude il lavoro e il resto conta come incassato quel giorno.
-- Il proprietario vede nella Home «Pagato 2 rate su 3» e la prossima scadenza.
-- Tabelle pensate per tutti i professionisti (ambito: mascalcia oggi; veterinario e trainer domani).

-- 1) pagamenti ricevuti
create table if not exists public.incassi_tranche (
  id uuid primary key default gen_random_uuid(),
  professionista_id uuid not null references auth.users(id) on delete cascade,
  ambito text not null default 'mascalcia' check (ambito in ('mascalcia','veterinario','trainer')),
  intervento_id uuid references public.interventi_mascalcia(id) on delete cascade,
  conto_id uuid references public.conti_mascalcia(id) on delete set null,
  gruppo uuid not null default gen_random_uuid(),
  importo numeric(10,2) not null check (importo > 0),
  pagato_il date not null default ((now() at time zone 'Europe/Rome')::date),
  modo text not null default 'contanti' check (modo in ('contanti','bonifico','pos','assegno','altro')),
  nota text,
  creato_il timestamptz not null default now(),
  check (ambito <> 'mascalcia' or intervento_id is not null)
);
create index if not exists incassi_tranche_pro_idx on public.incassi_tranche (professionista_id, pagato_il);
create index if not exists incassi_tranche_int_idx on public.incassi_tranche (intervento_id);
create index if not exists incassi_tranche_conto_idx on public.incassi_tranche (conto_id);
create index if not exists incassi_tranche_gruppo_idx on public.incassi_tranche (gruppo);

-- 2) piano rate (facoltativo) di un lavoro oppure di un conto
create table if not exists public.incassi_rate (
  id uuid primary key default gen_random_uuid(),
  professionista_id uuid not null references auth.users(id) on delete cascade,
  ambito text not null default 'mascalcia' check (ambito in ('mascalcia','veterinario','trainer')),
  intervento_id uuid references public.interventi_mascalcia(id) on delete cascade,
  conto_id uuid references public.conti_mascalcia(id) on delete cascade,
  n int not null check (n between 1 and 24),
  importo numeric(10,2) not null check (importo > 0),
  scadenza date not null,
  creato_il timestamptz not null default now(),
  check ((intervento_id is null) <> (conto_id is null))
);
create unique index if not exists incassi_rate_int_n on public.incassi_rate (intervento_id, n) where intervento_id is not null;
create unique index if not exists incassi_rate_conto_n on public.incassi_rate (conto_id, n) where conto_id is not null;
create index if not exists incassi_rate_pro_idx on public.incassi_rate (professionista_id, scadenza);

alter table public.incassi_tranche enable row level security;
alter table public.incassi_rate enable row level security;
drop policy if exists incassi_tranche_sel on public.incassi_tranche;
create policy incassi_tranche_sel on public.incassi_tranche for select to authenticated using (professionista_id = auth.uid());
drop policy if exists incassi_rate_sel on public.incassi_rate;
create policy incassi_rate_sel on public.incassi_rate for select to authenticated using (professionista_id = auth.uid());
-- scrittura solo tramite le funzioni qui sotto
revoke all on public.incassi_tranche, public.incassi_rate from anon, authenticated;
grant select on public.incassi_tranche, public.incassi_rate to authenticated;

-- 3) registra un pagamento ricevuto (su un lavoro OPPURE su un conto)
create or replace function public.equo_registra_pagamento(p_intervento uuid, p_conto uuid, p_importo numeric, p_data date, p_modo text, p_nota text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_data date := coalesce(p_data, (now() at time zone 'Europe/Rome')::date);
  v_modo text := lower(coalesce(nullif(trim(p_modo), ''), 'contanti'));
  v_nota text := nullif(trim(coalesce(p_nota, '')), '');
  v_imp numeric := round(coalesce(p_importo, 0), 2);
  v_gr uuid := gen_random_uuid();
  v_quando timestamptz;
  i record; c record; r record;
  v_pag numeric; v_res numeric; v_rest numeric; v_quota numeric; v_n int := 0;
begin
  if v_uid is null then raise exception 'non autenticato'; end if;
  if (p_intervento is null) = (p_conto is null) then raise exception 'indica un lavoro oppure un conto'; end if;
  if v_imp <= 0 then raise exception 'Scrivi un importo maggiore di zero.'; end if;
  if v_modo not in ('contanti','bonifico','pos','assegno','altro') then v_modo := 'altro'; end if;
  if v_data > (now() at time zone 'Europe/Rome')::date + 1 then raise exception 'Il giorno del pagamento è nel futuro.'; end if;
  v_quando := (v_data::timestamp + time '12:00') at time zone 'Europe/Rome';

  if p_intervento is not null then
    select * into i from interventi_mascalcia where id = p_intervento and maniscalco_id = v_uid for update;
    if not found then raise exception 'Lavoro non trovato.'; end if;
    if coalesce(i.importo, 0) <= 0 then raise exception 'Il lavoro non ha un importo: scrivilo prima.'; end if;
    if i.stato_pagamento = 'saldato' then raise exception 'Il lavoro è già saldato.'; end if;
    select coalesce(sum(importo), 0) into v_pag from incassi_tranche where intervento_id = p_intervento;
    v_res := i.importo - v_pag;
    if v_imp > v_res + 0.005 then raise exception 'L''importo supera quanto resta da pagare (€ %).', replace(to_char(v_res, 'FM999999990.00'), '.', ','); end if;
    insert into incassi_tranche (professionista_id, intervento_id, gruppo, importo, pagato_il, modo, nota)
    values (v_uid, p_intervento, v_gr, v_imp, v_data, v_modo, v_nota);
    if v_pag + v_imp >= i.importo - 0.005 then
      update interventi_mascalcia set stato_pagamento = 'saldato' where id = p_intervento;
      update interventi_mascalcia set saldato_il = v_quando where id = p_intervento;
    end if;
    return jsonb_build_object('ok', true, 'gruppo', v_gr, 'residuo', greatest(v_res - v_imp, 0), 'saldato', v_pag + v_imp >= i.importo - 0.005);
  end if;

  -- pagamento sul conto: si divide sui lavori del conto, dal più vecchio
  select * into c from conti_mascalcia where id = p_conto and maniscalco_id = v_uid for update;
  if not found then raise exception 'Conto non trovato.'; end if;
  if c.stato <> 'da_incassare' then raise exception 'Il conto non è più da incassare.'; end if;
  select coalesce(sum(greatest(cr.importo - coalesce((select sum(t.importo) from incassi_tranche t where t.intervento_id = cr.intervento_id), 0), 0)), 0)
    into v_res
    from conti_mascalcia_righe cr join interventi_mascalcia iv on iv.id = cr.intervento_id
   where cr.conto_id = p_conto and iv.stato_pagamento <> 'saldato';
  if v_imp > v_res + 0.005 then raise exception 'L''importo supera quanto resta del conto (€ %).', replace(to_char(v_res, 'FM999999990.00'), '.', ','); end if;
  v_rest := v_imp;
  for r in
    select cr.intervento_id,
           greatest(cr.importo - coalesce((select sum(t.importo) from incassi_tranche t where t.intervento_id = cr.intervento_id), 0), 0) as resto
      from conti_mascalcia_righe cr join interventi_mascalcia iv on iv.id = cr.intervento_id
     where cr.conto_id = p_conto and iv.stato_pagamento <> 'saldato' and iv.maniscalco_id = v_uid
     order by cr.data_intervento, cr.id
  loop
    exit when v_rest <= 0.005;
    continue when r.resto <= 0.005;
    v_quota := least(r.resto, v_rest);
    insert into incassi_tranche (professionista_id, intervento_id, conto_id, gruppo, importo, pagato_il, modo, nota)
    values (v_uid, r.intervento_id, p_conto, v_gr, v_quota, v_data, v_modo, v_nota);
    v_rest := v_rest - v_quota;
    v_n := v_n + 1;
    if v_quota >= r.resto - 0.005 then
      update interventi_mascalcia set stato_pagamento = 'saldato' where id = r.intervento_id;
      update interventi_mascalcia set saldato_il = v_quando where id = r.intervento_id;
    end if;
  end loop;
  -- tutti i lavori saldati: il conto è pagato
  if not exists (select 1 from conti_mascalcia_righe cr join interventi_mascalcia iv on iv.id = cr.intervento_id
                  where cr.conto_id = p_conto and iv.stato_pagamento <> 'saldato') then
    perform equo_conto_pagato(p_conto);
    update conti_mascalcia set pagato_il = v_quando where id = p_conto;
    return jsonb_build_object('ok', true, 'gruppo', v_gr, 'lavori', v_n, 'residuo', 0, 'saldato', true);
  end if;
  return jsonb_build_object('ok', true, 'gruppo', v_gr, 'lavori', v_n, 'residuo', greatest(v_res - v_imp, 0), 'saldato', false);
end $$;
revoke execute on function public.equo_registra_pagamento(uuid, uuid, numeric, date, text, text) from public, anon;
grant execute on function public.equo_registra_pagamento(uuid, uuid, numeric, date, text, text) to authenticated;

-- 4) elimina un pagamento registrato per sbaglio (tutto il gruppo): i lavori tornano con il resto da incassare
create or replace function public.equo_elimina_pagamento(p_gruppo uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_int uuid[]; v_conti uuid[];
begin
  if v_uid is null then raise exception 'non autenticato'; end if;
  select array_agg(distinct intervento_id), array_agg(distinct conto_id) filter (where conto_id is not null)
    into v_int, v_conti from incassi_tranche where gruppo = p_gruppo and professionista_id = v_uid;
  if v_int is null then raise exception 'Pagamento non trovato.'; end if;
  delete from incassi_tranche where gruppo = p_gruppo and professionista_id = v_uid;
  update interventi_mascalcia set stato_pagamento = 'da_saldare'
   where id = any(v_int) and maniscalco_id = v_uid and stato_pagamento = 'saldato';
  -- il conto che era pagato torna da incassare
  update conti_mascalcia c set stato = 'da_incassare', pagato_il = null
   where c.maniscalco_id = v_uid and c.stato = 'pagato'
     and exists (select 1 from conti_mascalcia_righe cr join interventi_mascalcia iv on iv.id = cr.intervento_id
                  where cr.conto_id = c.id and iv.stato_pagamento <> 'saldato')
     and (c.id = any(coalesce(v_conti, '{}')) or exists (select 1 from conti_mascalcia_righe cr where cr.conto_id = c.id and cr.intervento_id = any(v_int)));
  return jsonb_build_object('ok', true);
end $$;
revoke execute on function public.equo_elimina_pagamento(uuid) from public, anon;
grant execute on function public.equo_elimina_pagamento(uuid) to authenticated;

-- 5) salva (o toglie, con elenco vuoto) il piano rate di un lavoro o di un conto
--    p_rate: [{"importo": 200, "scadenza": "2026-11-10"}, …]
create or replace function public.equo_salva_rate(p_intervento uuid, p_conto uuid, p_rate jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); x jsonb; v_n int := 0;
begin
  if v_uid is null then raise exception 'non autenticato'; end if;
  if (p_intervento is null) = (p_conto is null) then raise exception 'indica un lavoro oppure un conto'; end if;
  if p_intervento is not null and not exists (select 1 from interventi_mascalcia where id = p_intervento and maniscalco_id = v_uid) then raise exception 'Lavoro non trovato.'; end if;
  if p_conto is not null and not exists (select 1 from conti_mascalcia where id = p_conto and maniscalco_id = v_uid) then raise exception 'Conto non trovato.'; end if;
  if p_rate is not null and jsonb_typeof(p_rate) = 'array' and jsonb_array_length(p_rate) > 24 then raise exception 'Al massimo 24 rate.'; end if;
  delete from incassi_rate where professionista_id = v_uid
    and ((p_intervento is not null and intervento_id = p_intervento) or (p_conto is not null and conto_id = p_conto));
  if p_rate is null or jsonb_typeof(p_rate) <> 'array' then return jsonb_build_object('ok', true, 'rate', 0); end if;
  for x in select value from jsonb_array_elements(p_rate) loop
    if coalesce((x->>'importo')::numeric, 0) <= 0 or (x->>'scadenza') is null then continue; end if;
    v_n := v_n + 1;
    insert into incassi_rate (professionista_id, intervento_id, conto_id, n, importo, scadenza)
    values (v_uid, p_intervento, p_conto, v_n, round((x->>'importo')::numeric, 2), (x->>'scadenza')::date);
  end loop;
  return jsonb_build_object('ok', true, 'rate', v_n);
end $$;
revoke execute on function public.equo_salva_rate(uuid, uuid, jsonb) from public, anon;
grant execute on function public.equo_salva_rate(uuid, uuid, jsonb) to authenticated;

-- 6) stato del piano rate (per il proprietario): quante rate coperte, prossima rata e scadenza
create or replace function public.equo_piano_rate(p_intervento uuid, p_conto uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  with pag as (
    select coalesce(sum(t.importo), 0) as v from incassi_tranche t
     where (p_intervento is not null and t.intervento_id = p_intervento)
        or (p_conto is not null and t.intervento_id in (select cr.intervento_id from conti_mascalcia_righe cr where cr.conto_id = p_conto))
  ), r as (
    select n, importo, scadenza, sum(importo) over (order by n) as cum from incassi_rate
     where (p_intervento is not null and intervento_id = p_intervento) or (p_conto is not null and conto_id = p_conto)
  ), prox as (
    select r.n, r.cum - pag.v as importo, r.scadenza from r, pag where r.cum > pag.v + 0.005 order by r.n limit 1
  )
  select case when not exists (select 1 from r) then null else jsonb_build_object(
    'rate', (select count(*) from r),
    'pagate', (select count(*) from r, pag where r.cum <= pag.v + 0.005),
    'pagato', (select v from pag),
    'totale', (select max(cum) from r),
    'prossima_n', (select n from prox),
    'prossima_importo', (select importo from prox),
    'prossima_scadenza', (select scadenza from prox),
    'elenco', (select jsonb_agg(jsonb_build_object('n', n, 'importo', importo, 'scadenza', scadenza) order by n) from r)) end;
$$;
revoke execute on function public.equo_piano_rate(uuid, uuid) from public, anon, authenticated;

-- 7) promemoria al cliente per una rata (tasto «Promemoria» in Incassi): messaggio in chat Equo
create or replace function public.equo_sollecita_rata(p_intervento uuid, p_conto uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_cli uuid; v_user uuid; v_piano jsonb; v_cosa text;
begin
  if v_uid is null then raise exception 'non autenticato'; end if;
  if p_intervento is not null then
    select i.cliente_mascalcia_id, equo_tipo_intervento(i.tipo_ferratura, i.tipo_altro) || coalesce(' di ' || nullif(trim(cv.nome), ''), '') || ' del ' || to_char(i.data_intervento, 'DD/MM')
      into v_cli, v_cosa
      from interventi_mascalcia i left join cavalli_clienti_mascalcia cv on cv.id = i.cavallo_cliente_id
     where i.id = p_intervento and i.maniscalco_id = v_uid;
  else
    select c.cliente_mascalcia_id, 'conto C-' || c.anno || '-' || lpad(c.numero::text, 3, '0') into v_cli, v_cosa
      from conti_mascalcia c where c.id = p_conto and c.maniscalco_id = v_uid;
  end if;
  if v_cli is null then raise exception 'Non trovato.'; end if;
  select cliente_user_id into v_user from clienti_mascalcia where id = v_cli;
  if v_user is null then return jsonb_build_object('ok', false, 'motivo', 'non_collegato'); end if;
  v_piano := equo_piano_rate(p_intervento, p_conto);
  perform set_config('equo.collegamento', 'on', true);
  insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
  values (v_uid, v_cli, 'maniscalco', v_uid, 'testo',
    '💶 Promemoria pagamento — ' || v_cosa ||
    case when v_piano is not null and (v_piano->>'prossima_n') is not null then
      ': rata ' || (v_piano->>'prossima_n') || ' di ' || (v_piano->>'rate') || ', € ' || replace(to_char((v_piano->>'prossima_importo')::numeric, 'FM999999990.00'), '.', ',')
      || ' entro il ' || to_char((v_piano->>'prossima_scadenza')::date, 'DD/MM') || '.'
    else '.' end || ' Il riepilogo è nella tua Home di Equo.', false);
  perform set_config('equo.collegamento', '', true);
  return jsonb_build_object('ok', true);
end $$;
revoke execute on function public.equo_sollecita_rata(uuid, uuid) from public, anon;
grant execute on function public.equo_sollecita_rata(uuid, uuid) to authenticated;

-- 8) App proprietario: il riquadro «Da saldare» mostra anche quanto è già pagato e le rate
create or replace function public.prop_pagamenti_da_saldare()
returns json language sql stable security definer set search_path = public as $$
  with r as (
    select i.id, i.maniscalco_id, i.cliente_mascalcia_id, i.data_intervento, i.importo,
           equo_tipo_intervento(i.tipo_ferratura, i.tipo_altro) as tipo, cv.nome as cavallo,
           pp.visto_il, pp.segnalato_pagato_il, pp.primo_avviso_il,
           equo_nome_profilo(i.maniscalco_id) as maniscalco,
           nullif(trim(p.dati_pagamento_nome), '') as pag_nome, nullif(trim(p.dati_pagamento_iban), '') as iban, nullif(trim(p.dati_pagamento_paypal), '') as paypal,
           (select coalesce(sum(t.importo), 0) from incassi_tranche t where t.intervento_id = i.id) as pagato,
           co.id as conto_id, co.codice as conto
      from pagamenti_promemoria pp
      join interventi_mascalcia i on i.id = pp.intervento_id
      join clienti_mascalcia cm on cm.id = i.cliente_mascalcia_id
      left join cavalli_clienti_mascalcia cv on cv.id = i.cavallo_cliente_id
      left join profiles p on p.id = i.maniscalco_id
      left join lateral (select c.id, 'C-' || c.anno || '-' || lpad(c.numero::text, 3, '0') as codice
                           from conti_mascalcia_righe cr join conti_mascalcia c on c.id = cr.conto_id
                          where cr.intervento_id = i.id and c.stato = 'da_incassare' limit 1) co on true
     where cm.cliente_user_id = auth.uid() and cm.centro_id is null and cm.promemoria_pagamenti
       and coalesce(p.promemoria_pagamenti, true)
       and i.stato = 'fatto' and i.stato_pagamento = 'da_saldare' and coalesce(i.importo, 0) > 0
  ), r2 as (
    select r.*, coalesce(equo_piano_rate(r.id, null), case when r.conto_id is not null then equo_piano_rate(null, r.conto_id) end) as piano,
           case when equo_piano_rate(r.id, null) is not null then 'lavoro' when r.conto_id is not null and equo_piano_rate(null, r.conto_id) is not null then 'conto' end as piano_di
      from r
  )
  select json_build_object(
    'righe', coalesce((select json_agg(json_build_object('id', id, 'maniscalco_id', maniscalco_id, 'cliente_mascalcia_id', cliente_mascalcia_id,
              'maniscalco', maniscalco, 'tipo', tipo, 'cavallo', cavallo, 'data', data_intervento, 'importo', importo,
              'pagato', pagato, 'conto', conto, 'conto_id', conto_id, 'piano', piano, 'piano_di', piano_di,
              'segnalato', segnalato_pagato_il is not null, 'pag_nome', pag_nome, 'iban', iban, 'paypal', paypal) order by data_intervento) from r2), '[]'::json),
    'da_ricordare', exists (select 1 from r2 where segnalato_pagato_il is null
                              and ((visto_il is null or visto_il < now() - interval '5 days')
                                   or ((piano->>'prossima_scadenza') is not null and (piano->>'prossima_scadenza')::date < current_date
                                       and visto_il < (piano->>'prossima_scadenza')::date + 1)))
  );
$$;
grant execute on function public.prop_pagamenti_da_saldare() to authenticated;

-- 9) guide degli agenti AI
insert into public.ai_conoscenze (ambito, categoria, attivo, titolo, contenuto, aggiornato_il, verificato_il)
select 'maniscalco', 'guida', true, 'Pagamenti in più volte: acconti e rate',
'Dove: barra in basso → "Incassi" → "Da incassare" (lavori e conti) · anche dal conto: Incassi o scheda cliente → conto → "Acconto o rate"
Passi:
1. Se il cliente paga tutto tocca "Saldato" come sempre.
2. Se paga solo una parte tocca "Acconto o rate": scrivi l''importo ricevuto (già compilato con quanto resta), il giorno, la modalità (contanti, bonifico, POS, assegno) e una nota se serve, poi "Registra".
3. Il lavoro passa a "Acconto": vedi la barra "Pagati 500 € di 1.500 €", quanto resta e lo storico dei pagamenti. Quando la somma arriva al totale diventa "Saldato" da solo.
4. Rate (facoltative): nella stessa finestra tocca "Dividi in rate", scegli quante (da 2 a 6) e correggi importi e scadenze. Le rate sono un promemoria, non un vincolo: se il cliente paga cifre diverse Equo ricalcola quanto manca.
5. Le rate in arrivo compaiono in "Da incassare" con la prossima scadenza; se una rata è scaduta appare in rosso con il tasto "Promemoria", che manda un messaggio in chat al cliente (solo se è su Equo).
6. Pagamento sul conto: si divide da solo sui lavori del conto, dal più vecchio; quando è tutto pagato il conto diventa "Pagato".
7. Pagamento registrato per sbaglio: nello storico del lavoro o del conto tocca la ✕ accanto al pagamento.
Esempio: Luca fa il conto alla Scuderia Le Querce (1.500 €): riceve 500 € con bonifico, tocca "Acconto o rate", registra 500 € e divide i 1.000 € restanti in 2 rate, 10 novembre e 10 dicembre.
Note: "Incassato" conta ogni pagamento nel giorno in cui arriva; "Da incassare" mostra solo quello che resta. Il proprietario collegato su Equo vede nella sua Home "Pagato 2 rate su 3" e la prossima scadenza.
Parole chiave: acconto, rate, rateizzare, pagamento parziale, tranche, pagato a metà, anticipo, dividere il pagamento, scadenza rata, quanto manca',
now(), current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Pagamenti in più volte: acconti e rate');

insert into public.ai_conoscenze (ambito, categoria, attivo, titolo, contenuto, aggiornato_il, verificato_il)
select 'proprietario', 'guida', true, 'Pagamenti a rate al maniscalco',
'Dove: Home → riquadro "Da saldare"
Passi:
1. Se il maniscalco registra un acconto vedi "Pagati 500 € di 1.500 €" e quanto resta.
2. Se ha impostato le rate vedi "Pagato 2 rate su 3", l''elenco delle rate con le date e la prossima scadenza.
3. Quando una rata scade ricompare il pallino sulla Chat; il maniscalco può anche mandarti un promemoria in chat.
4. Paghi come sempre (IBAN o PayPal in "Come pagare") e il maniscalco registra il pagamento.
Esempio: Marco vede per Furia "Pagato 2 rate su 3 · prossima 200 € entro il 10 novembre".
Note: Gli importi e le rate li scrive il maniscalco; Equo non gestisce i pagamenti, mostra solo quello che il maniscalco ha registrato.
Parole chiave: rate, acconto, quanto manca, prossima rata, pagamento a rate, pagato in parte, scadenza pagamento',
now(), current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Pagamenti a rate al maniscalco');

-- controllo finale: deve dare 2 · 6 · 2
select (select count(*) from information_schema.tables where table_schema = 'public' and table_name in ('incassi_tranche','incassi_rate')) as tabelle,
       (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'
         and p.proname in ('equo_registra_pagamento','equo_elimina_pagamento','equo_salva_rate','equo_piano_rate','equo_sollecita_rata','prop_pagamenti_da_saldare')) as funzioni,
       (select count(*) from ai_conoscenze where titolo in ('Pagamenti in più volte: acconti e rate','Pagamenti a rate al maniscalco')) as guide;
