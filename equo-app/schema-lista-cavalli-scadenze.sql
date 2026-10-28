-- Equo: appuntamento con una scuderia, lista dei cavalli con la scadenza accanto e «Fissa il prossimo giro» (28 ottobre 2026).
-- Tolti la «linea del tempo» (27/10) e «Allinea le scadenze». Solo testi delle guide di Hammer. Eseguito da Claude. Rieseguibile.

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  titolo = 'Scegliere i cavalli per scadenza nel nuovo appuntamento',
  contenuto = $t$Dove: tasto + → "Nuovo appuntamento" (o Agenda) → scegli il cliente; anche "Proponi appuntamento" a una scuderia su Equo
Passi:
1. La lista dei cavalli è a spunte, con a destra la prossima scadenza: rossa "scaduta 16 ott", arancione entro 10 giorni, verde più in là, grigia "in agenda 4 nov" se il cavallo ha già un appuntamento. Senza scadenza non c'è niente.
2. In alto "Ordina": "A–Z" (di partenza), "Scadenza" (prima le scadute, poi le più vicine; in agenda e senza scadenza in fondo), "Data" (dal lavoro più vecchio, con "ultimo lavoro 11 set" sotto il nome), "Proprietari" (a gruppi: della scuderia, di Mario Rossi…; c'è solo se i cavalli hanno proprietari diversi). L'app si ricorda l'ultimo ordine scelto.
3. "Seleziona scaduti e in scadenza (n)" spunta in un tocco i rossi e gli arancioni (non quelli già in agenda); toccandolo di nuovo ("Togli…") li toglie.
4. Puoi sempre togliere o aggiungere un cavallo toccandolo; "+ Aggiungi cavallo" resta in fondo.
Esempio: Luca apre un appuntamento per Le Querce, tocca "Seleziona scaduti e in scadenza (8)", toglie Luna che ha ferrato ieri e salva.
Note: Le scadenze sono le stesse di "Da richiamare" (prossima ferratura o data rimandata). Cambiando l'ordine le spunte restano. Nessun cavallo è spuntato da solo. La vecchia "linea del tempo" con "Prendi tutti" non c'è più.
Parole chiave: scegliere cavalli, appuntamento scuderia, cavalli in scadenza, scaduti, seleziona tutti, ordina, ordine cavalli, proprietari, scadenza ferratura, semaforo$t$
 where id = '3143a9c8-a932-4014-b4ed-f10cb857cacc';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  titolo = 'Scadenze della struttura: ferratura ogni N giorni e Fissa il prossimo giro',
  contenuto = $t$Dove: "Clienti" → apri una struttura (scuderia) → riquadro "Scadenze della struttura"
Passi:
1. "Ferratura ogni": tocca "Imposta" e con − e + scegli i giorni. Da quel momento, quando segni fatto un cavallo di questa struttura, la prossima scadenza è tra quei giorni ("Togli" per tornare al normale).
2. Sotto vedi quanti cavalli sono scaduti e quanti scadono entro 10 giorni, e la data proposta (la scadenza più vicina, oggi se è già passata; mai di domenica). I cavalli già in agenda non contano.
3. "Fissa il prossimo giro" apre il Nuovo appuntamento con la scuderia già scelta e quella data (per una scuderia su Equo Scuderia apre "Proponi appuntamento"). Scegli i cavalli nella lista con le scadenze e salvi.
Esempio: Francesco apre il Centro Le Querce, vede "2 scaduti · 3 entro 10 giorni · proposta: oggi", tocca "Fissa il prossimo giro", tocca "Seleziona scaduti e in scadenza" e salva.
Note: Ogni cavallo tiene la sua scadenza: non c'è più "Allinea le scadenze" (portava tutti i cavalli alla stessa data). Un cavallo con il suo "Intervallo di ferratura" usa il suo.
Parole chiave: struttura, scuderia, fissa prossimo giro, giro scuderia, ferratura ogni, intervallo struttura, scaduti, allinea scadenze, stessa data, tutti i cavalli insieme$t$
 where id = '8918cf7e-64f6-4f49-afe5-09cd1eca94a4';

-- controllo: deve dare 0 · 2
select (select count(*) from ai_conoscenze where contenuto ilike '%Prendi tutti%' and contenuto not ilike '%non c''è più%') as testo_vecchio,
       (select count(*) from ai_conoscenze where id in ('3143a9c8-a932-4014-b4ed-f10cb857cacc','8918cf7e-64f6-4f49-afe5-09cd1eca94a4') and verificato_il = current_date) as aggiornate;
