-- Equo: Francesco Bizzarri, «Kiri» doppio nel Centro ippico Julius (28 ottobre 2026). Eseguito da Claude su richiesta di Simone.
-- Stesso cavallo (confermato da Simone). Si tiene Kiri PRV-000253 (24/10, numero più vecchio);
-- la ferratura del 27/10 passa a lui; Kiri PRV-000484 (27/10) viene archiviato, non cancellato.
-- Rieseguibile: se è già stato fatto non cambia niente.

do $$
declare
  v_tieni constant uuid := '6cde715d-82fb-437f-9f21-43ae074e9096';   -- Kiri PRV-000253
  v_togli constant uuid := '2a2ab0da-d051-4d4f-9108-f6c6d6390269';   -- Kiri PRV-000484
  v_cli   constant uuid := '66d6a660-8ec6-49b8-983d-f963c7d9c0da';   -- Centro ippico Julius
  v_man   constant uuid := 'f170bc74-a189-4d68-bab5-31d9613726bb';   -- Francesco Bizzarri
  n int;
begin
  if not exists (select 1 from cavalli_clienti_mascalcia where id = v_tieni and cliente_mascalcia_id = v_cli and maniscalco_id = v_man)
     or not exists (select 1 from cavalli_clienti_mascalcia where id = v_togli and cliente_mascalcia_id = v_cli and maniscalco_id = v_man) then
    raise exception 'Schede di Kiri non trovate come previsto';
  end if;
  if (select archiviato_il from cavalli_clienti_mascalcia where id = v_togli) is not null then
    raise notice 'Già fatto'; return;
  end if;

  perform set_config('equo.unisci_manuali', 'on', true);
  update interventi_mascalcia set cavallo_cliente_id = v_tieni where cavallo_cliente_id = v_togli;
  get diagnostics n = row_count;
  update cavalli_problemi_piede set cavallo_cliente_id = v_tieni where cavallo_cliente_id = v_togli;
  update cavalli_allegati set cavallo_cliente_id = v_tieni where cavallo_cliente_id = v_togli;
  update cavalli_arrivi set cavallo_cliente_id = v_tieni where cavallo_cliente_id = v_togli;
  perform set_config('equo.unisci_manuali', '', true);

  update cavalli_clienti_mascalcia set archiviato_il = now() where id = v_togli;

  insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
  values ('PRV-000253', null, null, v_tieni, 'unione',
          'Scheda doppia Kiri (PRV-000484, creata il 27/10) unita a questa: ' || n || ' lavoro spostato qui, la doppia è archiviata',
          v_man, 'maniscalco', 'app'),
         ('PRV-000484', null, null, v_togli, 'unione',
          'Scheda doppia: è lo stesso cavallo di Kiri PRV-000253. Lavori spostati là, questa scheda è archiviata',
          v_man, 'maniscalco', 'app');

  -- testo dei cavalli del cliente (lista clienti / inbox) senza i cavalli archiviati
  update clienti_mascalcia set nome_cavallo = coalesce((select string_agg(nome, ', ' order by nome) from cavalli_clienti_mascalcia
     where cliente_mascalcia_id = v_cli and archiviato_il is null), '') where id = v_cli;
end $$;

-- controllo: deve dare 1 · 0 · true · una sola «Kiri»
select (select count(*) from interventi_mascalcia where cavallo_cliente_id = '6cde715d-82fb-437f-9f21-43ae074e9096') as lavori_kiri_253,
       (select count(*) from interventi_mascalcia where cavallo_cliente_id = '2a2ab0da-d051-4d4f-9108-f6c6d6390269') as lavori_kiri_484,
       (select archiviato_il is not null from cavalli_clienti_mascalcia where id = '2a2ab0da-d051-4d4f-9108-f6c6d6390269') as kiri_484_archiviato,
       (select nome_cavallo from clienti_mascalcia where id = '66d6a660-8ec6-49b8-983d-f963c7d9c0da') as cavalli_julius;
