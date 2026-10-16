-- Equo: guide per Diario, nuova barra, Home e Album (14 ottobre 2026) — da eseguire dopo il deploy
-- Barra proprietario ora: Home · Diario · "+" · Chat · Calendario. Cavalli e Spese si aprono dalla Home.

-- 1) Home
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = 'Dove: barra in basso → "Home"
Passi:
1. In alto vedi il saluto, il meteo e la carta "Oggi con (nome del cavallo)": con "Foto", "Vocale" e "Nota" scrivi subito un momento nel Diario.
2. Sotto la carta ci sono gli "Ultimi momenti" e i tasti "Scheda di (nome del cavallo)" (con più cavalli "I miei cavalli") e "Spese": da qui si aprono la scheda del cavallo e le Spese.
3. Finché il Diario ha pochi momenti compaiono le card "Da Equo" per iniziare; se nel Diario c''è una foto di un anno fa compare "Un anno fa".
4. Poi i riquadri promozionali, "Spese questo mese", "Scadenze in arrivo", "ULTIMO MESSAGGIO", "Prossime scadenze" e "Servizi vicino a te".
Esempio: Sara apre Equo, tocca "Foto" nella carta "Oggi con Aurora" e il momento finisce nel Diario di Aurora.
Note: Se non hai ancora cavalli la Home mostra solo "Aggiungi il tuo primo cavallo". La barra in basso ha Home, Diario, il tasto "+" al centro, Chat e Calendario. Il logo Equo in alto ti riporta sempre qui.
Parole chiave: home, pagina principale, schermata iniziale, dashboard, riepilogo, panoramica, oggi, spese, scheda cavallo'
where id = 'e32e9ae9-a31d-44cd-9017-312cf34955ba';

-- 2) Come aggiungo un cavallo
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(replace(contenuto,
    'barra in basso → "Cavalli" → "+ Aggiungi"', 'Home → "I miei cavalli" → "+ Aggiungi" (con un solo cavallo: "Scheda di (nome)", poi la freccia indietro)'),
    'Apri "Cavalli" e tocca "+ Aggiungi".', 'Dalla Home apri "I miei cavalli" (con un solo cavallo "Scheda di (nome)" e poi la freccia indietro) e tocca "+ Aggiungi".')
where id = 'ac734108-50ff-4c7f-ba94-0a082e65b2cf';

-- 3) Come aggiungo una spesa
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(replace(replace(contenuto,
    'barra in basso → "Spese"', 'Home → "Spese"'),
    'Apri "Spese" e tocca', 'Dalla Home tocca "Spese" e poi'),
    'che hai aperto in "Cavalli"', 'di cui hai aperto la scheda')
where id = 'bc6561c0-bb2c-4216-bf20-83a9480cda45';

-- 4) Dove vedo tutti i miei cavalli
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = 'Dove: Home → "I miei cavalli" (con un solo cavallo: "Scheda di (nome)")
Passi:
1. Dalla Home tocca "I miei cavalli": con un solo cavallo il tasto si chiama "Scheda di (nome)" e apre subito la sua scheda; la freccia indietro porta all''elenco.
2. Ogni riga dell''elenco mostra nome, razza e categoria ("Di proprietà" o "A noleggio").
3. Tocca un cavallo per aprire "Album foto", "Scheda cavallo" e "Libretto sanitario". Dal Diario puoi arrivarci anche con "Scheda e album".
Esempio: Marco ha Aurora e Tornado: in alto accanto al logo legge "2 cavalli" e dalla Home tocca "I miei cavalli".
Note: Se l''elenco è vuoto compare "Nessun cavallo ancora. Aggiungine uno per iniziare." La scheda PDF/QR non è disponibile nell''app proprietario.
Parole chiave: elenco cavalli, lista cavalli, i miei cavalli, vedere cavalli, scheda cavallo, scuderia personale'
where id = 'c865911a-2649-473d-8b96-7c22c2703e17';

-- 5) nuove guide: Diario e Album
insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, attivo, verificato_il) values
('proprietario','guida','Come scrivo un momento nel Diario del mio cavallo',
'Dove: barra in basso → "Diario" (oppure il tasto "+" al centro della barra, oppure la carta "Oggi" nella Home)
Passi:
1. Tocca "+" al centro della barra in basso.
2. Scegli il "Cavallo" e il tipo: "Foto", "Nota" o "Vocale".
3. Foto: "Scatta o scegli una foto". Vocale: tocca il microfono per registrare (massimo 3 minuti) e tocca di nuovo per fermare. Nota: scrivi il testo.
4. Aggiungi, se vuoi, una riga e scegli la categoria: Allenamento, Passeggiata, Lezione, Cura, Traguardo o Altro.
5. Tocca "Salva nel Diario".
6. In "Diario" vedi la copertina, i giorni di fila, i momenti del mese, gli ultimi 7 giorni e tutti i momenti. Tocca "giorni di fila", "momenti del mese" o "nel Diario" per i dettagli, un giorno per aprirlo, un momento per modificarlo, metterlo nell''album o nasconderlo.
Esempio: Marco scatta una foto di Rio al tramonto, scrive "Prima passeggiata dopo la pioggia", sceglie "Passeggiata" e salva: la foto compare nel Diario di Rio.
Note: Per ora ogni momento lo vedi solo tu. "Nascondi dal Diario" lo toglie dalla vista ma resta nello storico del cavallo. Il video (Premium) e la condivisione con la scuderia arrivano in seguito. Il Diario è diverso dal libretto sanitario, che sta nella scheda del cavallo. Finché il Diario è vuoto trovi le card "Da Equo".
Parole chiave: diario, foto, nota, vocale, momento, allenamento, passeggiata, giorni di fila, storico, ricordi, scrivere, +, nascondere',
true, current_date),
('proprietario','guida','Come aggiungo foto all''album del mio cavallo',
'Dove: Home → "Scheda di (nome del cavallo)" (oppure Diario → "Scheda e album") → "Album foto" → "+ Foto"
Passi:
1. Apri la scheda del cavallo.
2. In "Album foto" tocca "+ Foto" (o il quadrato con il +) e scegli una o più foto.
3. La prima foto diventa la copertina. Per cambiarla tocca una foto e scegli "Usa come copertina".
4. Per toglierne una tocca la foto e scegli "Nascondi dall''album".
5. Dal Diario puoi aggiungere una foto già scattata: apri il momento e tocca "Metti nell''album del cavallo".
Esempio: Sara carica tre foto di Aurora e sceglie quella al tramonto come copertina: compare come sfondo del Diario e della Home.
Note: La copertina è lo sfondo di Diario e Home. Senza foto proprie l''app usa una foto Equo. Le foto dell''album le vedi solo tu; gli allegati (lastre, referti) restano nella sezione "Allegati".
Parole chiave: album, foto cavallo, copertina, immagine, sfondo, caricare foto, galleria',
true, current_date);

-- controllo: deve dare nuove = 2 e vecchi = 0
select (select count(*) from ai_conoscenze where titolo in ('Come scrivo un momento nel Diario del mio cavallo','Come aggiungo foto all''album del mio cavallo')) as nuove,
       (select count(*) from ai_conoscenze where categoria = 'guida' and ambito = 'proprietario' and (contenuto like '%barra in basso → "Cavalli"%' or contenuto like '%barra in basso → "Spese"%')) as vecchi;
