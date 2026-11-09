-- Equo: SISTEMAZIONE GIULIUS CAESAR + FRANCESCO BIZZARRI (9 novembre 2026) · SQL 46 · solo dati, una volta sola
-- Francesco aveva già la struttura nella sua app come «Centro ippico Julius» (18 cavalli, 17 lavori). Il collegamento
-- con la scuderia «Giulius Caesar» ha creato un secondo cliente: Littoria doppia e nessun cavallo riconosciuto.
--  1 · Littoria: la scheda vecchia confluisce in quella collegata (lavori, problemi al piede, allegati)
--  2 · la seconda «Kiri» (archiviata, senza lavori) viene tolta
--  3 · tutti gli altri cavalli e i 17 lavori passano nel collegamento con la struttura
--  4 · 7 cavalli abbinati a quelli della scuderia (stesso cavallo, nome abbreviato) e Francesco come loro maniscalco:
--      Blonde→blonde girl, Kiri→kiri du rouet, Miss→miss guagliona, Peccarita'→peccarità, Serze→serse primo,
--      Trionfo→trionfo d'olimpia, Natasha→natascia sabina (nella sua app prendono il nome della scuderia)
--  5 · scuderia: tolto il doppione «nata» (stesso microchip di «natascia sabina», inserita 3 minuti dopo, nessun dato)
--  6 · la vecchia scheda resta archiviata con le note private di Francesco (la scuderia non le vede)
-- Se un controllo non torna, tutto si annulla da solo. Alla fine compare il riepilogo.
begin;
create temp table _esito(n serial, cosa text, valore text) on commit drop;
do $$
declare
  ce uuid := 'd3433db2-dcbe-4635-8a62-5396f892bbd8';
  vecchio uuid := '66d6a660-8ec6-49b8-983d-f963c7d9c0da';
  nuovo uuid := '490c6fc9-8a83-4d7c-a3d9-cf5cd043d91d';
  r record; d record; n_int int; n_cav int; v_lit_old uuid; v_lit_new uuid; v_kiri_arch uuid;
  abbinamenti text[][] := array[['Blonde','blonde girl'],['Kiri','kiri du rouet'],['Miss','miss guagliona'],['Peccarita''','peccarità'],
                                ['Serze','serse primo'],['Trionfo','trionfo d''olimpia'],['Natasha','natascia sabina']];
  i int;
begin
  if not exists (select 1 from clienti_mascalcia where id = vecchio and archiviato_il is null) then raise exception 'Già eseguito: la vecchia scheda è archiviata.'; end if;
  perform set_config('equo.unisci_manuali', 'on', true);
  select count(*) into n_int from interventi_mascalcia where cliente_mascalcia_id = vecchio;
  select count(*) into n_cav from cavalli_clienti_mascalcia where cliente_mascalcia_id = vecchio;
  insert into _esito(cosa, valore) values ('prima: cavalli / lavori nella vecchia scheda', n_cav || ' / ' || n_int);

  select id into v_lit_old from cavalli_clienti_mascalcia where cliente_mascalcia_id = vecchio and nome = 'Littoria';
  select id into v_lit_new from cavalli_clienti_mascalcia where cliente_mascalcia_id = nuovo and nome = 'Littoria';
  select * into d from cavalli_clienti_mascalcia where id = v_lit_old;
  update interventi_mascalcia set cavallo_cliente_id = v_lit_new where cavallo_cliente_id = v_lit_old;
  update cavalli_problemi_piede set cavallo_cliente_id = v_lit_new where cavallo_cliente_id = v_lit_old;
  update cavalli_allegati set cavallo_cliente_id = v_lit_new where cavallo_cliente_id = v_lit_old;
  update cavalli_arrivi set cavallo_cliente_id = v_lit_new where cavallo_cliente_id = v_lit_old;
  update documenti set cavallo_cliente_id = v_lit_new where cavallo_cliente_id = v_lit_old;
  update cavalli_clienti_mascalcia set
    avviso_sicurezza = coalesce(nullif(avviso_sicurezza, ''), d.avviso_sicurezza), ferro_note = coalesce(nullif(ferro_note, ''), d.ferro_note),
    ferro_sistema = coalesce(ferro_sistema, d.ferro_sistema), ferro_numero = coalesce(ferro_numero, d.ferro_numero),
    ferro_dettagli = coalesce(ferro_dettagli, d.ferro_dettagli), razza = coalesce(nullif(razza, ''), d.razza)
   where id = v_lit_new;
  insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_ruolo, app)
  select codice_equo, horse_id, scuderia_cavallo_id, id, 'unione', 'Scheda «Littoria» del Centro ippico Julius unita a quella della struttura Giulius Caesar (assistenza Equo)', 'equo', 'app'
    from cavalli_clienti_mascalcia where id = v_lit_new;
  delete from cavalli_clienti_mascalcia where id = v_lit_old;
  insert into _esito(cosa, valore) values ('Littoria unita', (select count(*)::text || ' lavori sulla scheda collegata' from interventi_mascalcia where cavallo_cliente_id = v_lit_new));

  select id into v_kiri_arch from cavalli_clienti_mascalcia where cliente_mascalcia_id = vecchio and nome = 'Kiri' and archiviato_il is not null;
  if v_kiri_arch is not null and not exists (select 1 from interventi_mascalcia where cavallo_cliente_id = v_kiri_arch) then
    delete from cavalli_clienti_mascalcia where id = v_kiri_arch;
    insert into _esito(cosa, valore) values ('Kiri archiviata doppia', 'tolta');
  end if;

  update cavalli_clienti_mascalcia set cliente_mascalcia_id = nuovo where cliente_mascalcia_id = vecchio;
  update interventi_mascalcia set cliente_mascalcia_id = nuovo where cliente_mascalcia_id = vecchio;

  for i in 1 .. array_length(abbinamenti, 1) loop
    select id, nullif(upper(trim(microchip)), '') chip into r from scuderia_cavalli where centro_id = ce and nome = abbinamenti[i][2];
    if r.id is null then raise exception 'cavallo della scuderia non trovato: %', abbinamenti[i][2]; end if;
    update cavalli_clienti_mascalcia set scuderia_cavallo_id = r.id, microchip = coalesce(nullif(trim(microchip), ''), r.chip)
     where cliente_mascalcia_id = nuovo and nome = abbinamenti[i][1] and archiviato_il is null and scuderia_cavallo_id is null;
    if not found then raise exception 'scheda di Francesco non trovata: %', abbinamenti[i][1]; end if;
    insert into scuderia_cavalli_professionisti (centro_id, scuderia_cavallo_id, cliente_mascalcia_id, stato, proposto_da, risposto_il)
    values (ce, r.id, nuovo, 'attivo', null, now()) on conflict (scuderia_cavallo_id, cliente_mascalcia_id) do update set stato = 'attivo';
  end loop;

  if not exists (select 1 from scuderia_eventi_sanitari where cavallo_id = '7ecb10aa-b219-46d2-8eee-f76d3729fa1c')
     and not exists (select 1 from scuderia_box where cavallo_id = '7ecb10aa-b219-46d2-8eee-f76d3729fa1c')
     and not exists (select 1 from cavalli_clienti_mascalcia where scuderia_cavallo_id = '7ecb10aa-b219-46d2-8eee-f76d3729fa1c') then
    delete from scuderia_cavalli where id = '7ecb10aa-b219-46d2-8eee-f76d3729fa1c' and centro_id = ce and nome = 'nata';
    insert into _esito(cosa, valore) values ('scuderia: doppione «nata»', 'tolto');
  end if;

  update clienti_mascalcia set archiviato_il = now(), nome = 'Centro ippico Julius (unito in Giulius Caesar)' where id = vecchio;
  perform set_config('equo.unisci_manuali', '', true);
  perform equo_sync_cavalli_struttura(nuovo);

  if (select count(*) from interventi_mascalcia where cliente_mascalcia_id = nuovo) <> n_int + 1 then raise exception 'lavori: conteggio diverso, annullo tutto'; end if;
  if exists (select 1 from interventi_mascalcia where cliente_mascalcia_id = vecchio) then raise exception 'lavori rimasti nella vecchia scheda, annullo tutto'; end if;
  insert into _esito(cosa, valore) select 'dopo: cavalli nel collegamento',
    count(*) || ' (' || count(scuderia_cavallo_id) || ' abbinati alla scuderia, ' || count(*) filter (where archiviato_il is not null) || ' archiviati)' from cavalli_clienti_mascalcia where cliente_mascalcia_id = nuovo;
  insert into _esito(cosa, valore) select 'dopo: lavori nel collegamento', count(*)::text || ' (' || count(*) filter (where stato = 'programmato') || ' in programma)' from interventi_mascalcia where cliente_mascalcia_id = nuovo;
  insert into _esito(cosa, valore) select 'abbinati alla scuderia', string_agg(nome || case when archiviato_il is not null then ' (archiviato!)' else '' end, ', ' order by nome) from cavalli_clienti_mascalcia where cliente_mascalcia_id = nuovo and scuderia_cavallo_id is not null;
  insert into _esito(cosa, valore) select 'solo nell''app di Francesco', string_agg(nome, ', ' order by nome) from cavalli_clienti_mascalcia where cliente_mascalcia_id = nuovo and scuderia_cavallo_id is null;
  insert into _esito(cosa, valore) select 'scuderia: cavalli / microchip doppi', count(*) || ' / ' || (select count(*) from (select microchip from scuderia_cavalli where centro_id = ce and nullif(trim(microchip),'') is not null group by 1 having count(*) > 1) z) from scuderia_cavalli where centro_id = ce;
end $$;
select cosa, valore from _esito order by n;
commit;
