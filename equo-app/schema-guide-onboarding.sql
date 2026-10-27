-- Equo: GUIDE DEGLI AGENTI aggiornate con l'onboarding predittivo (27 ottobre 2026, dopo SQL 19). Eseguito da Claude il 27/10 alle 23:50 su richiesta di Simone. Rieseguibile.
-- Ogni update parte solo se la guida non contiene ancora la novità.

-- MANISCALCO
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = replace(replace(replace(replace(contenuto,
  '2. "Tipo di cliente": "Proprietario" o "Scuderia o centro ippico".',
  '2. "Tipo di cliente": "Proprietario" o "Scuderia o centro ippico". Si propone da solo dal nome: «Scuderia…», «Centro…», «Maneggio…», «ASD…» diventano scuderia (compare «Dal nome sembra una scuderia»); se è una persona cambialo a mano.'),
  '3. Scrivi "Nome cliente" (obbligatorio) e, se vuoi, "Nome cavallo (opzionale)", "Telefono (opzionale)", "Note (opzionale)".',
  '3. Scrivi "Nome cliente" (obbligatorio) e, se vuoi, "Cavalli (opzionale)" separati da virgola, "Telefono (opzionale)", "Email (opzionale, consigliata)", "Indirizzo" e "Note (opzionale)".'),
  '5. Tocca "Salva cliente".',
  '5. Tocca "Salva cliente". Se uno dei cavalli scritti c''è già (sotto un altro cliente o già su Equo) Equo te lo chiede: «Sì» crea lo stesso le schede, «No» salva il cliente senza quei cavalli.'),
  'Premium: clienti illimitati.',
  'Con l''email, quando il cliente si iscrive a Equo con quella email trova «ti segue già» e si collega con un tocco, senza QR né codice. Premium: clienti illimitati.')
  || ', email cliente, tipo cliente automatico'
 where id = '6854a3fc-a48f-4dfb-8d73-06604edf0d04' and contenuto not like '%Email (opzionale, consigliata)%';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = replace(contenuto,
  '2. Il tipo è già "Scuderia o centro ippico".',
  '2. Il tipo è già "Scuderia o centro ippico" (anche da «Aggiungi cliente» si propone da solo se il nome comincia con Scuderia, Centro, Maneggio, ASD…).')
 where id = '6378633b-a613-40a6-9093-62c05df6a3bc' and contenuto not like '%si propone da solo%';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = replace(contenuto,
  '"Telefono", "Indirizzo (per «Naviga»)" e "Note".',
  '"Telefono", "Email" (solo se non è ancora collegato: quando si iscrive con quella email ti trova da solo), "Indirizzo (per «Naviga»)" e "Note".')
  || ', email'
 where id = 'be1f96b8-9d49-4a9f-8b6b-0d7b79bf4d6d' and contenuto not like '%"Email" (solo se%';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = replace(contenuto,
  'poi tocca "+ Aggiungi cavallo".',
  'poi tocca "+ Aggiungi cavallo". Se hai già un cavallo con lo stesso nome o microchip (in un altro cliente, archiviato o nell''account di un tuo cliente) Equo chiede «È un altro cavallo?»: «Sì» lo crea, «No» apre quello che c''è già.')
 where id = '3ab1906f-47b8-45c9-bb23-60529ce47b79' and contenuto not like '%È un altro cavallo?%';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = replace(replace(contenuto,
  'Se ha già un codice Equo basta scrivere quello.',
  'Se ha già un codice Equo basta scrivere quello, oppure tocca «📷 Inquadra la Equo Card del cavallo» e il codice si compila da solo. Se scegli una scuderia compare «Di chi è?»: «Della scuderia» oppure un tuo cliente privato (la scheda va a lui, con lavori e conti, e il cavallo risulta in quella scuderia). Con lo stesso nome o microchip di un cavallo che hai già, Equo chiede se è un altro o apre quello esistente.'),
  'Parole chiave: cartella cavalli,',
  'Parole chiave: di chi è, equo card, doppione, cartella cavalli,')
 where id = '6f193b13-e9d5-4820-ac18-adb19baa6b86' and contenuto not like '%Di chi è?%';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = replace(replace(contenuto,
  '4. Se ha già Equo può anche scrivere il codice in "Chat" → "Il tuo maniscalco" → "+ Collega".',
  '4. Se ha già Equo può anche scrivere il codice in "Chat" → "Il tuo maniscalco" → "+ Collega".
5. Senza QR: scrivi la sua email nella scheda cliente («Modifica» → "Email"). Quando entra in Equo con quella email vede in Home «(tuo nome) ti segue già» e tocca «Collegati».
6. Nella scheda cliente il riquadro «Collegamento a Equo» mostra a che punto è (invito, cavalli nel suo account, codici definitivi) con il tasto per il passo che manca: «Condividi l''invito», «Aggiungi email», «Ricordaglielo», «Conferma i dati».'),
  'Parole chiave: collegare cliente,',
  'Parole chiave: email cliente, ti segue già, collegamento a equo, ricordaglielo, collegare cliente,')
 where id = 'e032aaa7-72e6-40ed-a333-7235a95db304' and contenuto not like '%ti segue già%';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = replace(replace(contenuto,
  'Con il piano Free del proprietario solo il primo cavallo è sbloccato per lui: tu continui a lavorare e registrare interventi normalmente.',
  'Con il piano Free del proprietario sono completi 3 cavalli: dal quarto restano bloccati per lui, tu continui a lavorare e registrare interventi normalmente. Se non accetta, dopo 24 ore Equo gli ricorda in chat i cavalli da accettare (una volta) e dopo 3 giorni Hammer avvisa te; puoi anche toccare «Ricordaglielo» nel riquadro «Collegamento a Equo» della scheda cliente. Se il proprietario crea a mano un cavallo con lo stesso nome, si collega da solo alla tua scheda con i lavori.'),
  'Parole chiave: proponi cavalli,',
  'Parole chiave: ricordaglielo, promemoria proposte, proponi cavalli,')
 where id = '59479656-84b9-4d6b-8df3-63dcc659fa5a' and contenuto not like '%Ricordaglielo%';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = replace(contenuto,
  '1. Apri la scheda del cliente: in alto i suoi dati (Messaggi, QR e codice invito, Naviga),',
  '1. Apri la scheda del cliente: in alto i suoi dati (Messaggi, QR e codice invito, Naviga) e, per i clienti privati, il riquadro «Collegamento a Equo» con i passi che mancano,')
 where id = '2455e8e7-7405-4371-8243-7cd7eeed9cfb' and contenuto not like '%Collegamento a Equo%';

-- PROPRIETARIO
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = replace(replace(replace(contenuto,
  '1. Il modo più semplice:',
  '1. Se il maniscalco ha registrato la tua email, appena entri in Equo con quella email vedi in Home «(maniscalco) ti segue già»: tocca «Collegati», niente codice. Se non è lui tocca «Non sono io».
2. Altrimenti il modo più semplice:'),
  '2. A mano:', '3. A mano:'),
  '3. Se il maniscalco ti ha preparato', '4. Se il maniscalco ti ha preparato')
  || ', ti segue già, collegati, email'
 where id = 'd222701f-e733-4c09-9e97-5499138481bd' and contenuto not like '%ti segue già%';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = replace(replace(contenuto,
  '1. Dalla Home apri "I miei cavalli" e tocca "+ Aggiungi".',
  '1. Dalla Home apri "I miei cavalli" e tocca "+ Aggiungi". Se il tuo maniscalco ti ha già preparato dei cavalli, in cima al modulo compare l''avviso con «Vai ai cavalli preparati»: accettali invece di crearli, arrivano con i lavori nel libretto.'),
  'Se lasci vuoto il microchip compare l''avviso',
  'Se crei a mano un cavallo con lo stesso nome di uno preparato dal maniscalco, si collega da solo alla sua scheda (niente doppioni). Se la data di nascita è oggi o nel futuro Equo ti chiede di controllarla (spesso è quella proposta dal telefono). Se lasci vuoto il microchip compare l''avviso')
 where id = 'ac734108-50ff-4c7f-ba94-0a082e65b2cf' and contenuto not like '%Vai ai cavalli preparati%';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = replace(contenuto,
  '4. Tocca "Salva".',
  '4. Tocca "Salva". Se la data di nascita è oggi o nel futuro Equo chiede «Nato il …?»: «No» ti riporta a correggerla.')
 where id = '1a6f9963-ccb0-45fe-840a-5bac5d69efa8' and contenuto not like '%Nato il%';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = replace(replace(contenuto,
  '1. Quando ti colleghi al tuo maniscalco con il suo codice,',
  '1. Quando ti colleghi al tuo maniscalco (con il suo codice, il QR o «Collegati» sul riquadro «ti segue già»),'),
  'Note: Con il piano Free', 'Note: Se non li accetti, il giorno dopo ti arriva un promemoria in chat. Se crei a mano un cavallo con lo stesso nome, si collega da solo a quello preparato. Con il piano Free')
 where id = 'b8d35f4e-e9ea-4d24-b534-4581d7b1d5c0' and contenuto not like '%promemoria in chat%';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = replace(contenuto,
  '1. Collegati al maniscalco con il suo QR o invito:',
  '1. Collegati al maniscalco con il suo QR, l''invito o «Collegati» sul riquadro «ti segue già» (se ha la tua email):')
 where id = '4d2ac6d9-8b2b-4c16-afbb-7cb3a0148aaa' and contenuto not like '%ti segue già%';

-- controllo: deve dare 13 (una riga per guida aggiornata oggi)
select count(*) as guide_aggiornate from public.ai_conoscenze where id in (
 '6854a3fc-a48f-4dfb-8d73-06604edf0d04','6378633b-a613-40a6-9093-62c05df6a3bc','be1f96b8-9d49-4a9f-8b6b-0d7b79bf4d6d','3ab1906f-47b8-45c9-bb23-60529ce47b79',
 '6f193b13-e9d5-4820-ac18-adb19baa6b86','e032aaa7-72e6-40ed-a333-7235a95db304','59479656-84b9-4d6b-8df3-63dcc659fa5a','2455e8e7-7405-4371-8243-7cd7eeed9cfb',
 'd222701f-e733-4c09-9e97-5499138481bd','ac734108-50ff-4c7f-ba94-0a082e65b2cf','1a6f9963-ccb0-45fe-840a-5bac5d69efa8','b8d35f4e-e9ea-4d24-b534-4581d7b1d5c0',
 '4d2ac6d9-8b2b-4c16-afbb-7cb3a0148aaa') and verificato_il = current_date and aggiornato_il > now() - interval '1 hour';
