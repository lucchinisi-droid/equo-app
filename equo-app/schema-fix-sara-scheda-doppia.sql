-- Equo: Sara Matteucci — scheda doppia di Francesco Bizzarri (12/11/2026). Rieseguibile.
-- Francesco vedeva due «Sara Matteucci»: quella buona (proprietario, collegata, Hermes e Klaus, 5 lavori)
-- e quella creata per sbaglio il 26/10 come «scuderia», archiviata il 26/10, con 0 cavalli attivi.
-- 1) i 2 messaggi della scheda sbagliata (foto e «💪» del 29/10, scritti da Francesco) passano alla scheda buona;
-- 2) la scheda sbagliata si cancella, con le sue 2 schede cavallo doppie già archiviate il 27/10
--    (Hermes PRV-000449 e Klaus PRV-000450: nessun lavoro, nessuna proposta). I cavalli veri restano
--    Hermes PSA-000202 e Klaus APP-000201 nella scheda buona. Lo storico resta (scritto con il codice).

do $fix$
declare
  v_sbagliata uuid := '71a4b982-24ce-4d6b-b9b2-676987376d91';
  v_buona     uuid := 'f6ff3f34-2f14-4089-8168-ce497c5f3e7a';
begin
  if not exists (select 1 from clienti_mascalcia where id = v_sbagliata) then
    raise notice 'Scheda già cancellata: niente da fare.';
    return;
  end if;
  if (select archiviato_il from clienti_mascalcia where id = v_sbagliata) is null then
    raise exception 'La scheda da cancellare non è archiviata: fermo tutto.';
  end if;
  if exists (select 1 from interventi_mascalcia where cliente_mascalcia_id = v_sbagliata or luogo_cliente_id = v_sbagliata)
     or exists (select 1 from conti_mascalcia where cliente_mascalcia_id = v_sbagliata)
     or exists (select 1 from cavalli_clienti_mascalcia where cliente_mascalcia_id = v_sbagliata and archiviato_il is null) then
    raise exception 'La scheda ha lavori, conti o cavalli attivi: fermo tutto.';
  end if;

  perform set_config('equo.collegamento', 'on', true);
  update messaggi_mascalcia set cliente_mascalcia_id = v_buona where cliente_mascalcia_id = v_sbagliata;
  perform set_config('equo.collegamento', '', true);

  delete from cavalli_clienti_mascalcia where cliente_mascalcia_id = v_sbagliata and archiviato_il is not null;
  delete from clienti_mascalcia where id = v_sbagliata;
end $fix$;

-- controllo: deve dare 1 · 2 · 0
select count(*) filter (where nome ilike 'sara matteucci') as schede_sara,
       (select count(*) from cavalli_clienti_mascalcia where cliente_mascalcia_id = 'f6ff3f34-2f14-4089-8168-ce497c5f3e7a' and archiviato_il is null) as cavalli_scheda_buona,
       (select count(*) from messaggi_mascalcia where cliente_mascalcia_id = '71a4b982-24ce-4d6b-b9b2-676987376d91') as messaggi_rimasti
  from clienti_mascalcia where maniscalco_id = 'f170bc74-a189-4d68-bab5-31d9613726bb';
