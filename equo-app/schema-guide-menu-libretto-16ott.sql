-- Guide AI: nuovo menù, Home e Libretto a tre schede (16 ottobre 2026) — da eseguire DOPO il deploy
insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, attivo, verificato_il) values
('proprietario','guida','Come uso il menù in basso e il tasto «+»',
'Dove: barra in basso
Passi:
1. La barra ha cinque voci: Home, Diario, Libretto, Messaggi, Calendario. La voce accesa è la pagina in cui sei.
2. Sopra la barra, a destra, c''è il tasto «+»: toccalo per aprire le altre funzioni (Pegasus, Spese, I miei cavalli, Servizi vicino a te, Partner, Serve aiuto?).
3. Tocca di nuovo il «+» o fuori dal pannello per chiuderlo.
Esempio: Sara vuole registrare una spesa: tocca «+» e poi «Spese».
Note: Il tasto «+» non compare dentro una chat. L''avatar in alto serve solo per account e impostazioni.
Parole chiave: menù, barra, più, plus, dove trovo spese, dove trovo pegasus, navigazione', true, current_date),
('proprietario','guida','Come uso le Chat preferite e le storie della Home',
'Dove: barra in basso → "Home"
Passi:
1. «Ultimi momenti» mostra gli ultimi 5 momenti del Diario come cerchi con la data; tocca un cerchio per aprirlo.
2. «Chat preferite» ha 5 cerchi con l''iniziale della persona: toccane uno per aprire la chat.
3. Per cambiarle tocca «Modifica» e scegli fino a 5 chat.
4. «Prossime scadenze» è chiusa: toccala per vedere le prossime 5.
Esempio: Sara tocca il cerchio «P» di Paolo e scrive al maniscalco.
Note: Se non hai ancora chat vedi cerchi tratteggiati «Preferita».
Parole chiave: home, chat preferite, storie, ultimi momenti, scadenze, preferiti', true, current_date),
('proprietario','guida','Come uso il Libretto del cavallo (Identità, Salute, Sport)',
'Dove: barra in basso → "Libretto" (o Home → "Scheda di (nome)")
Passi:
1. In alto scegli la scheda: Identità, Salute o Sport.
2. Identità: dati del cavallo, quattro foto di riconoscimento (fronte, sinistra, destra, particolari), «Cosa vedono i professionisti» e lo storico dei cambi. Il microchip risulta «dichiarato» finché un professionista non lo verifica.
3. Salute: libretto sanitario (vaccini, ferrature, Coggins) e allegati.
4. Sport: discipline e risultati di gara; è una funzione Premium.
Esempio: Sara cambia il microchip di Aurora: l''app chiede conferma e il numero precedente resta nello storico.
Note: Spese, note private e incassi non compaiono mai nel libretto e i professionisti non li vedono.
Parole chiave: libretto, identità, salute, sport, microchip, foto riconoscimento, premium, passaporto', true, current_date)
;
