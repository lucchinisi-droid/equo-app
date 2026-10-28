-- Equo: IL CONTO SI CHIUDE DA SOLO QUANDO TUTTI I SUOI LAVORI SONO SALDATI (28 ottobre 2026)
-- Prima: «Saldato» da Incassi, Agenda completa → Da saldare, Hammer, Modalità Lavoro o «Acconto o rate» sul singolo lavoro
-- segnava il lavoro saldato ma il conto restava «da incassare». Ora lo fa il database, qualunque sia il punto di partenza:
--  - tutti i lavori del conto saldati  → conto «pagato» (giorno = ultimo saldo), con la riga nello storico dei cavalli;
--  - un lavoro di un conto pagato torna «da saldare» → il conto torna «da incassare».
-- «Segna pagato» sul conto e il pagamento del conto intero continuano come prima (niente doppie righe nello storico).
-- Sistema anche i conti già rimasti aperti con tutti i lavori saldati. Rieseguibile.

create or replace function public.equo_conti_allinea_saldo()
returns trigger language plpgsql security definer set search_path = public as $$
declare k record; v_quando timestamptz;
begin
  if coalesce(current_setting('equo.conto_pagato', true), '') = 'on' then return null; end if;
  if new.stato_pagamento = 'saldato' then
    for k in select c.* from conti_mascalcia c join conti_mascalcia_righe r on r.conto_id = c.id
              where r.intervento_id = new.id and c.stato = 'da_incassare' loop
      if not exists (select 1 from conti_mascalcia_righe r join interventi_mascalcia i on i.id = r.intervento_id
                      where r.conto_id = k.id and i.stato_pagamento <> 'saldato') then
        select coalesce(max(i.saldato_il), now()) into v_quando
          from conti_mascalcia_righe r join interventi_mascalcia i on i.id = r.intervento_id where r.conto_id = k.id;
        update conti_mascalcia set stato = 'pagato', pagato_il = v_quando where id = k.id;
        insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
        select distinct on (cc.id) cc.codice_equo, cc.horse_id, cc.scuderia_cavallo_id, cc.id, 'pagamento',
               'Lavori saldati con il conto C-' || k.anno || '-' || lpad(k.numero::text, 3, '0') || ' (maniscalco ' || equo_nome_profilo(k.maniscalco_id) || ')',
               k.maniscalco_id, 'maniscalco', 'app'
          from conti_mascalcia_righe r
          join interventi_mascalcia i on i.id = r.intervento_id
          join cavalli_clienti_mascalcia cc on cc.id = i.cavallo_cliente_id
         where r.conto_id = k.id;
      end if;
    end loop;
  elsif old.stato_pagamento = 'saldato' then
    update conti_mascalcia c set stato = 'da_incassare', pagato_il = null
     where c.stato = 'pagato' and exists (select 1 from conti_mascalcia_righe r where r.conto_id = c.id and r.intervento_id = new.id);
  end if;
  return null;
end $$;
revoke all on function public.equo_conti_allinea_saldo() from public, anon, authenticated;

drop trigger if exists trg_interventi_conti_saldo on public.interventi_mascalcia;
create trigger trg_interventi_conti_saldo after update of stato_pagamento on public.interventi_mascalcia
  for each row when (old.stato_pagamento is distinct from new.stato_pagamento)
  execute function public.equo_conti_allinea_saldo();

-- «Segna pagato» sul conto e pagamento del conto intero: chiudono il conto loro, il trigger qui sopra resta fermo
do $$
declare v_def text;
begin
  v_def := pg_get_functiondef('public.equo_conto_pagato'::regproc);
  if position('equo.conto_pagato' in v_def) = 0 then
    v_def := replace(v_def, 'if c.stato <> ''da_incassare'' then raise exception ''conto non più da incassare''; end if;',
      'if c.stato <> ''da_incassare'' then raise exception ''conto non più da incassare''; end if;
  perform set_config(''equo.conto_pagato'', ''on'', true);');
    v_def := replace(v_def, 'get diagnostics v_n = row_count;',
      'get diagnostics v_n = row_count;
  perform set_config(''equo.conto_pagato'', '''', true);');
    execute v_def;
  end if;
  v_def := pg_get_functiondef('public.equo_registra_pagamento'::regproc);
  if position('equo.conto_pagato' in v_def) = 0 then
    v_def := replace(v_def, 'if c.stato <> ''da_incassare'' then raise exception ''Il conto non è più da incassare.''; end if;',
      'if c.stato <> ''da_incassare'' then raise exception ''Il conto non è più da incassare.''; end if;
  perform set_config(''equo.conto_pagato'', ''on'', true);   -- 21: il conto lo chiude questa funzione, non il trigger');
    execute v_def;
  end if;
end $$;

-- conti già rimasti aperti con tutti i lavori saldati
do $$
declare k record; v_quando timestamptz;
begin
  for k in select c.* from conti_mascalcia c
            where c.stato = 'da_incassare'
              and exists (select 1 from conti_mascalcia_righe r where r.conto_id = c.id)
              and not exists (select 1 from conti_mascalcia_righe r join interventi_mascalcia i on i.id = r.intervento_id
                               where r.conto_id = c.id and i.stato_pagamento <> 'saldato') loop
    select coalesce(max(i.saldato_il), now()) into v_quando
      from conti_mascalcia_righe r join interventi_mascalcia i on i.id = r.intervento_id where r.conto_id = k.id;
    update conti_mascalcia set stato = 'pagato', pagato_il = v_quando where id = k.id;
  end loop;
end $$;

-- controllo finale: deve dare 1 · 2 · 0
select (select count(*) from pg_trigger where tgname = 'trg_interventi_conti_saldo') as trigger_conto,
       (select count(*) from pg_proc where proname in ('equo_conto_pagato', 'equo_registra_pagamento') and pg_get_functiondef(oid) like '%equo.conto_pagato%') as funzioni_conto,
       (select count(*) from conti_mascalcia c where c.stato = 'da_incassare'
          and exists (select 1 from conti_mascalcia_righe r where r.conto_id = c.id)
          and not exists (select 1 from conti_mascalcia_righe r join interventi_mascalcia i on i.id = r.intervento_id
                           where r.conto_id = c.id and i.stato_pagamento <> 'saldato')) as conti_aperti_gia_saldati;
