-- Equo: guide della pagina Clienti a cartelle (9 ottobre 2026)
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(replace(contenuto,
    'Dove: "Clienti" → sezione "PROPRIETARI" → "+ Aggiungi" (oppure Home → "+ Aggiungi cliente")',
    'Dove: "Clienti" → cartella "Clienti" → "Aggiungi cliente" (primo spazio in alto; oppure Home → "+ Aggiungi cliente")'),
    'Note: I clienti sono in ordine alfabetico, divisi in "PROPRIETARI" e "SCUDERIE E CENTRI IPPICI".',
    'Note: In alto ci sono tre cartelle con il loro numero: "Cavalli", "Clienti" (proprietari) e "Scuderie" (scuderie, maneggi e centri ippici); in ognuna il primo spazio è l''aggiunta rapida e "Cerca…" cerca solo nella cartella aperta.')
where id = '6854a3fc-a48f-4dfb-8d73-06604edf0d04';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto, 'Dove: "Clienti" → sezione "SCUDERIE E CENTRI IPPICI" → "+ Aggiungi"', 'Dove: "Clienti" → cartella "Scuderie" → "Aggiungi scuderia" (primo spazio in alto)')
where id = '6378633b-a613-40a6-9093-62c05df6a3bc';

insert into public.ai_conoscenze (ambito, categoria, attivo, titolo, contenuto, aggiornato_il, verificato_il)
select 'maniscalco', 'guida', true, 'Come trovo e aggiungo un cavallo (cartella Cavalli)',
'Dove: "Clienti" → cartella "Cavalli"
Passi:
1. Apri "Clienti": in alto le cartelle "Cavalli", "Clienti" e "Scuderie" con il loro numero (si cambia con un tocco).
2. In "Cavalli" trovi tutti i cavalli che segui in ordine alfabetico: pallino della scadenza (verde in regola, arancio entro 7 giorni, rosso scaduta), cliente o scuderia, ferro e prossima data.
3. Tocca un cavallo per aprire la sua scheda (anagrafica, ferratura, storico, allegati); "indietro" torna alla cartella.
4. Per aggiungerne uno tocca "Aggiungi cavallo" (primo spazio): scrivi nome, microchip e razza e scegli "Di chi è / dove sta?" (un cliente o una scuderia, oppure "+ Nuovo cliente" / "+ Nuova scuderia"). Se ha già un codice Equo basta scrivere quello.
5. "Cerca…" trova per nome del cavallo, cliente o microchip.
Esempio: Luca tocca "Aggiungi cavallo", scrive Brezza e sceglie Paolo Neri: Brezza compare nella cartella e nella scheda di Paolo.
Note: I clienti archiviati restano in fondo alle cartelle Clienti e Scuderie e i loro cavalli non compaiono in "Cavalli".
Parole chiave: cartella cavalli, tutti i cavalli, elenco cavalli, aggiungere cavallo, trovare cavallo, cercare cavallo, microchip, cartelle, clienti, scuderie',
now(), current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Come trovo e aggiungo un cavallo (cartella Cavalli)');

-- controllo: deve dare 1 · 1 · 1
select (select count(*) from ai_conoscenze where id = '6854a3fc-a48f-4dfb-8d73-06604edf0d04' and contenuto like '%tre cartelle%') as guida_clienti,
       (select count(*) from ai_conoscenze where id = '6378633b-a613-40a6-9093-62c05df6a3bc' and contenuto like '%cartella "Scuderie"%') as guida_scuderie,
       (select count(*) from ai_conoscenze where titolo = 'Come trovo e aggiungo un cavallo (cartella Cavalli)') as guida_cavalli;
