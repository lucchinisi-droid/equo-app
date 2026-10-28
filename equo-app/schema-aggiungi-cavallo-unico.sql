-- Equo: un solo modo di aggiungere un cavallo (28 ottobre 2026). Da «Modifica» cliente e dalla scheda del cliente
-- si apre la finestra «Aggiungi cavallo» (quella della cartella Cavalli) con il cliente già scelto.
-- Solo testi delle guide di Hammer. Eseguito da Claude. Rieseguibile.

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  titolo = 'Come aggiungo o tolgo i cavalli di un cliente',
  contenuto = $t$Dove: "Clienti" → cliente → riquadro "+ Aggiungi cavallo" (oppure "Modifica" → sezione "Cavalli" → "+ Aggiungi cavallo", oppure cartella "Cavalli" → "Aggiungi cavallo")
Passi:
1. Tocca "+ Aggiungi cavallo": si apre la finestra "Aggiungi cavallo" con il cliente già scelto in "Di chi è / dove sta?". È la stessa finestra da qualunque punto.
2. Cavallo nuovo: scrivi il nome e, se li sai, "Microchip (opz.)" e "Razza (opz.)". Se hai già un cavallo con lo stesso nome o microchip (in un altro cliente, archiviato o nell'account di un tuo cliente) Equo chiede «È un altro cavallo?»: «Sì» lo crea, «No» usa quello che c'è già.
3. Scuderia: in "Di chi è?" lascia "Della scuderia (paga la scuderia)" oppure scegli il proprietario privato: la scheda va a lui (lavori e conti a chi paga) e il cavallo risulta in questa scuderia.
4. Se il cavallo ha già un codice Equo (es. MAR-000005, si legge sotto il nome del cavallo) scrivilo in "Codice Equo del cavallo" (o inquadra la sua Equo Card): arriva con tutto il suo storico. Se è già tra i cavalli di un altro tuo cliente, l'app chiede se spostarlo qui.
5. Tocca "Salva cavallo": l'elenco in "Modifica" e la scheda del cliente si aggiornano da soli.
6. Per togliere un cavallo dalla tua lista: "Modifica" → icona accanto al cavallo. I cavalli non si eliminano (vedi la scheda «Non seguo più un cavallo: Non lo seguo più e Archivia»).
Esempio: Rio di Simone ora sta alla Scuderia Colleferro: Riccardo apre la scuderia, tocca "+ Aggiungi cavallo", scrive PSI-000002 e conferma lo spostamento; se Rio c'era già con il codice della scuderia, le due schede diventano una.
Note: Da "Modifica" non si scrive più il nome del cavallo direttamente: c'è solo il tasto che apre "Aggiungi cavallo" (una sola strada, con "Di chi è?" e codice Equo). Conta il numero del codice: le tre lettere indicano la razza e possono cambiare se la razza viene corretta (MAR-000005 e ALT-000005 sono lo stesso cavallo). Ogni cavallo ha un solo numero e uno storico a vita. Il proprietario collegato riceve in chat "Rio ora lo seguo presso …". Cavalli del proprietario o della scuderia: icona persona barrata = «Non lo seguo più» (serve la loro conferma). Cavalli inseriti solo da te: icona scatola = «Archivia» (li ripristini da «Cavalli archiviati»).
Parole chiave: cavalli cliente, aggiungere cavallo, nuovo cavallo, codice equo, codice cavallo, spostare cavallo, cambio scuderia, unire schede, doppione, microchip, di chi è, togliere cavallo, archiviare, non lo seguo più$t$
 where id = '3ab1906f-47b8-45c9-bb23-60529ce47b79';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = $t$Dove: Clienti → cliente → cavalli (automatico)
Passi:
1. Quando la scheda della scuderia e quella del proprietario risultano lo stesso cavallo (stesso microchip o conferma del proprietario), Equo le unisce.
2. Il cavallo tiene un solo numero, il più vecchio: nelle tue schede vedi il nuovo codice.
3. Il vecchio codice funziona ancora: "+ Aggiungi cavallo" → "Codice Equo del cavallo".
Esempio: Rio era ALT-000007 da Scuderia Colleferro e PSI-000002 dal proprietario: ora è il n. 2 in entrambe.
Note: Se lo stesso cavallo era in due tuoi clienti (il proprietario e la scuderia dove sta), Equo lo tiene una volta sola presso la scuderia, con tutti gli interventi; nel cliente proprietario lo vedi con «📍 presso …» e puoi continuare a fissargli appuntamenti. Se il cavallo cambia scuderia: apri il nuovo cliente → "+ Aggiungi cavallo" → "Codice Equo del cavallo".
Parole chiave: codice cambiato, numero equo, doppione, stesso cavallo, unione schede$t$
 where id = 'd8ebe5a0-8a99-4a59-9bed-3283d884f1be';

-- controllo: deve dare 0 · 2
select (select count(*) from ai_conoscenze where contenuto ilike '%Nome nuovo cavallo%') as testo_vecchio,
       (select count(*) from ai_conoscenze where id in ('3ab1906f-47b8-45c9-bb23-60529ce47b79','d8ebe5a0-8a99-4a59-9bed-3283d884f1be') and verificato_il = current_date) as aggiornate;
