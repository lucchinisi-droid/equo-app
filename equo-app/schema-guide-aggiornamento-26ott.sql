-- 26/10/2026 GUIDA DEGLI AGENTI: schede aggiornate alle novità del 25-26 ottobre
-- (barra in alto; Equo Card; Equo Pass ed Equo CV con referenze e pagina pubblica; Agenda semplice/completa; promemoria personali;
--  Officina mobile con scadenze del mezzo; cavalli di altri proprietari che stanno in scuderia; Incassi con Guadagnato / Incassato /
--  Da incassare; Sesso e Attività in tutte le schede cavallo; razze Asino, Bardotto, Mulo)
-- DA ESEGUIRE DOPO IL DEPLOY (le schede descrivono l'app aggiornata) e DOPO 13-sesso-attivita-razze.sql.
-- Si può rieseguire: aggiorna per titolo e inserisce solo le schede che mancano (il titolo è unico in tutta la tabella).

-- ===================== SCHEDE AGGIORNATE =====================

-- 1) Maniscalco: incassi (tre riquadri)
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = $t$Dove: Home → riga "Incassi" (oppure il cerchio "Da incassare")
Passi:
1. In alto l'interruttore "Semplice | Completa" (c'è solo nella versione Completa dell'app).
2. Vista Semplice: scegli il periodo (Oggi, Settimana, Mese, Anno o "Scegli date…"). Sotto ci sono due riquadri affiancati:
   - "Guadagnato": il valore dei lavori fatti nel periodo (conta il giorno del lavoro), pagati o no. Toccalo per vedere l'elenco dei lavori con "pagato" o "da incassare".
   - "Incassato": i soldi entrati nel periodo (conta il giorno in cui il cliente ha pagato, anche per lavori di settimane prima). Toccalo per grafico, incassi per tipo di lavoro e per cliente, elenco dei pagamenti.
   Tutti e due mostrano il confronto con il periodo prima (es. "▲ 12% rispetto a ieri"). Sotto compare "Dei lavori del periodo, X € sono ancora da incassare".
3. Più in basso, sotto "IN TOTALE – STORICO", il riquadro "Da incassare": tutto quello che devi ancora riscuotere per lavori già fatti, di qualsiasi data (non dipende dal periodo). Toccalo per i conti aperti e i lavori per cliente, con i giorni passati (in rosso oltre 30), "Fai il conto" e "Saldato".
4. Vista Completa (statistiche, 3, 6 o 12 mesi): Previsionale delle prossime 4 settimane, Clienti e prezzi, Medie operative, Consumo ferri.
Esempio: oggi Luca fa 120 € di lavori e gliene pagano 70; un cliente salda anche 40 € di un lavoro del 1° ottobre. Con "Oggi" vede Guadagnato 120 €, Incassato 110 € e la riga "50 € sono ancora da incassare".
Note: Guadagnato e Incassato seguono il periodo scelto; Da incassare è sempre il totale, per non perdere di vista i crediti vecchi. Per i lavori saldati prima del 9 ottobre 2026 vale il giorno del lavoro. Nel piano Free la vista Semplice mostra Oggi e il mese corrente; Settimana, Anno, date a scelta e la vista Completa sono Premium. Se hai nascosto gli incassi con il PIN, la sezione resta protetta.
Parole chiave: incassi, guadagnato, guadagno, incassato, da incassare, oggi, settimana, mese, periodo, totale, storico, saldati, da saldare, crediti, chi mi deve pagare, quanto ho guadagnato oggi, quanto ho incassato, statistiche, previsionale$t$
where categoria = 'guida' and ambito = 'maniscalco' and titolo = 'Come leggo gli incassi e le statistiche (vista Semplice e Completa)';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = $t$Dove: Home → riga "Incassi" (oppure il cerchio "Da incassare"; nella Home a widget il riquadro degli incassi del mese)
Passi:
1. Scegli il periodo in alto (Oggi, Settimana, Mese…).
2. "Guadagnato": quanto valgono i lavori fatti nel periodo, pagati o no.
3. "Incassato": quanto ti hanno pagato nel periodo.
4. Sotto "IN TOTALE – STORICO", "Da incassare": tutto quello che i clienti ti devono ancora, di qualsiasi data. Toccalo per segnare "Saldato" o fare il conto.
Esempio: a fine mese Luca vede Guadagnato 2.150 €, Incassato 1.980 € e Da incassare 185 € (di cui un lavoro di 40 giorni fa, in rosso).
Note: Contano solo interventi confermati (non richieste o proposte in attesa). Per i dettagli vedi la scheda «Come leggo gli incassi e le statistiche (vista Semplice e Completa)». Puoi anche chiedere a Hammer "quanto devo incassare?".
Parole chiave: incassi, guadagni, soldi, quanto ho incassato, quanto ho guadagnato, fatturato, da incassare, pagamenti in sospeso, crediti$t$
where categoria = 'guida' and ambito = 'maniscalco' and titolo = 'Come vedo i miei incassi';

-- 2) Maniscalco: anagrafica del cavallo («Disciplina» diventa «Attività»)
update public.ai_conoscenze set titolo = 'Anagrafica del cavallo: anno di nascita, altezza, peso, sesso, attività', aggiornato_il = now(), verificato_il = current_date, contenuto = $t$Dove: scheda del cavallo → sezione "Anagrafica" → "Modifica"
Passi:
1. Tocca "Modifica" nella sezione "Anagrafica": si apre la finestra del cavallo (non la scheda del cliente).
2. Cavalli inseriti da te: compili "Nome", "Microchip", "Razza", "Anno di nascita", "Mantello".
3. Per tutti i cavalli aggiungi "Altezza (cm)", "Peso (kg, stimato)", "Sesso" (Femmina, Castrone, Stallone), "Attività" e "Segni particolari".
4. "Attività": scegli dall'elenco o scrivi tu. Elenco: Salto ostacoli, Dressage, Completo, Endurance, Monta western, Monta da lavoro, Trotto, Galoppo, Volteggio, Attacchi, Polo, Scuola, Passeggiata / trekking, Riproduzione, A riposo.
5. Tocca "Salva".
Esempio: Alessandro segna per Brezza 158 cm, 480 kg, castrone, attività Salto ostacoli; per la fattrice Stella sceglie "Riproduzione".
Note: Tutti i campi sono facoltativi. Prima il campo si chiamava "Disciplina": è lo stesso dato, ora con lo stesso elenco della scheda del proprietario e della Scuderia. Per i cavalli del proprietario o della scuderia nome, razza, nascita e mantello li gestiscono loro nella loro app: qui aggiungi i tuoi dati. Nella scheda l'età si calcola dall'anno di nascita. Nella razza ci sono anche Asino, Bardotto e Mulo.
Parole chiave: anagrafica, anno di nascita, età, altezza, peso, sesso, castrone, stallone, femmina, attività, disciplina, riproduzione, fattrice, segni particolari, mantello$t$
where categoria = 'guida' and ambito = 'maniscalco' and titolo in ('Anagrafica del cavallo: anno di nascita, altezza, peso, sesso, disciplina', 'Anagrafica del cavallo: anno di nascita, altezza, peso, sesso, attività');

-- 3) Maniscalco: Agenda della settimana (è la «Agenda semplice»)
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = $t$Dove: barra in basso → "Agenda" → interruttore in alto su "Agenda semplice" → "Agenda della settimana"
Passi:
1. In alto scegli "Agenda semplice" (questa) o "Agenda completa" (vedi la scheda «Agenda completa: Da programmare, Non fatti, Da saldare»). La scelta resta salvata sul telefono.
2. I giorni sono su due colonne: a sinistra Lunedì, Mercoledì, Venerdì; a destra Martedì, Giovedì, Sabato; Domenica su una riga intera sotto.
3. Ogni giorno chiuso mostra nome, data e il numero degli impegni (scadenze da ripetere comprese). Oggi ha il bordo dorato e si apre da solo.
4. Tocca un giorno per aprirlo: in alto quanti clienti e quanti cavalli, sotto gli impegni divisi per cliente e "+ Aggiungi in questo giorno". Nel giorno compaiono anche i tuoi promemoria personali.
5. Cambia settimana con ‹ e › o scorrendo col dito; "Torna a oggi" riporta alla settimana corrente.
6. Ordine del giro: nel giorno aperto tieni premuta la maniglia ⋮⋮ e trascina un cavallo dentro il suo cliente, o il nome del cliente per spostare tutto il gruppo. Se scambi due appuntamenti con orari diversi Equo chiede «Scambiare anche gli orari?».
Esempio: Luca apre giovedì: "2 clienti · 4 cavalli"; sotto SCUDERIA LE QUERCE trova 08:00 Aurora – Ferratura e 08:45 Stella – Pareggio.
Note: Nell'appuntamento il tipo è "Ferratura", "Pareggio" o "Altro": completa o mezza la decide la scheda del cavallo. Gli impegni fatti mostrano "✓ Fatto"; le richieste dei clienti hanno "Accetta"; quelli proposti alle scuderie "attesa". Le righe "scad." sono promemoria di scadenza con "Fissa" (nell'Agenda completa le scadenze stanno invece in "Da programmare").
Parole chiave: agenda, calendario, settimana, appuntamenti, planning, programma, giorni, agenda semplice, navigare settimane, due colonne, aprire giorno, ordine del giro$t$
where categoria = 'guida' and ambito = 'maniscalco' and titolo = 'Come funziona l''Agenda della settimana';

-- 4) Proprietario: aggiungere un cavallo (sesso, attività, razze nuove)
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = $t$Dove: Home → "I miei cavalli" → "+ Aggiungi" (con un solo cavallo: "Scheda di (nome)", poi la freccia indietro) (se non hai cavalli: Home → "Aggiungi cavallo")
Passi:
1. Dalla Home apri "I miei cavalli" e tocca "+ Aggiungi".
2. Scrivi il "Nome" (obbligatorio) e scegli la "Categoria": "Cavallo di proprietà" o "Cavallo a noleggio".
3. Facoltativi: "Razza" (scrivi per cercare: ci sono anche Asino, Bardotto, Mulo e "Pony (razza non indicata)"), "Mantello", "Sesso" (Femmina, Castrone, Stallone), "Attività", "Data di nascita", "Microchip" (15 cifre), "Gruppo sanguigno", "Note".
4. "Attività": Salto ostacoli, Dressage, Completo, Endurance, Monta western, Monta da lavoro, Trotto, Galoppo, Volteggio, Attacchi, Polo, Scuola, Passeggiata / trekking, Riproduzione, A riposo, oppure "Altro…" e la scrivi tu. Compare sulla Equo Card.
5. Lascia o togli la spunta "Condividi con i professionisti collegati" e tocca "Crea scheda".
Esempio: Nome: Aurora · Cavallo di proprietà · Maremmano · Baio · Femmina · Riproduzione · nata il 12/04/2018 · microchip 380271000012345.
Note: Se lasci vuoto il microchip compare l'avviso "Microchip non inserito": scegli "Inserisco il microchip" o "Lo inserisco dopo". Il piano Free ha funzioni base; Premium sblocca cavalli illimitati.
Parole chiave: aggiungere cavallo, nuovo cavallo, inserire cavallo, registrare cavallo, crea scheda, scheda cavallo, pony, asino, mulo, bardotto, sesso, attività, riproduzione$t$
where categoria = 'guida' and ambito = 'proprietario' and titolo = 'Come aggiungo un cavallo';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = $t$Dove: "Cavalli" → tocca il cavallo → riquadro "Scheda cavallo" → "Modifica"
Passi:
1. Apri "Cavalli" e tocca il cavallo.
2. Nel riquadro "Scheda cavallo" tocca "Modifica".
3. Cambia i campi: nome, categoria, razza, mantello, sesso (Femmina, Castrone, Stallone), attività (elenco o "Altro…"), data di nascita, microchip, gruppo sanguigno, note, condivisione.
4. Tocca "Salva".
Esempio: Giulia mette Aurora in "Riproduzione" e aggiunge il gruppo sanguigno dopo le analisi.
Note: La "Scheda cavallo" mostra Categoria, Codice Equo, Razza, Mantello, Sesso, Attività, Data di nascita, Microchip, Gruppo sanguigno, Note e "Condiviso con i professionisti" (Sì/No). L'attività compare anche sulla Equo Card. Per tornare all'elenco usa la freccia in alto a sinistra.
Parole chiave: modificare cavallo, cambiare dati, correggere nome, aggiornare scheda, dati cavallo, razza, mantello, sesso, attività, data di nascita$t$
where categoria = 'guida' and ambito = 'proprietario' and titolo = 'Come modifico i dati di un cavallo';

-- 5) Scuderia: nuovo cavallo e scheda (sesso e attività)
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = $t$Dove: menu "Cavalli & Salute" → "Nuovo cavallo"
Passi:
1. Tocca "Nuovo cavallo".
2. Compila "Nome" (obbligatorio) e scegli la "Categoria": Cavallo di proprietà del centro ippico, Cavallo in pensione (privato) o Cavallo di soci/istruttori.
3. Facoltativi: Razza (scrivi per cercare: ci sono anche Asino, Bardotto, Mulo e Pony), Mantello, Sesso (Femmina, Castrone, Stallone), Attività (scegli dall'elenco o scrivi), Data di nascita, Microchip, Gruppo sanguigno, Proprietario, Codice app proprietario, Foto, Note.
4. Tocca "Salva".
Esempio: Nome "Ares", Categoria "Cavallo in pensione (privato)", Razza "Maremmano", Mantello "Baio", Sesso "Castrone", Attività "Scuola", Proprietario "Giulia Verdi".
Note: possono farlo l'amministratore, il Livello 2 e il Livello 3 con "Modifica/cancellazione cavalli". Attività: Salto ostacoli, Dressage, Completo, Endurance, Monta western, Monta da lavoro, Trotto, Galoppo, Volteggio, Attacchi, Polo, Scuola, Passeggiata / trekking, Riproduzione, A riposo (lo stesso elenco dell'app del proprietario e del maniscalco). Il cavallo compare nella sezione della sua categoria.
Parole chiave: nuovo cavallo, aggiungere cavallo, registrare cavallo, anagrafica cavallo, inserire cavallo, pensione, microchip, sesso, attività, riproduzione, asino, mulo$t$
where categoria = 'guida' and ambito = 'scuderia' and titolo = 'Come aggiungo un nuovo cavallo';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = $t$Dove: menu "Cavalli & Salute" → tocca la scheda del cavallo
Passi:
1. Tocca il cavallo: si apre il dettaglio con foto, razza, mantello, sesso, categoria, proprietario, codice Equo, nascita, microchip, gruppo sanguigno e attività, poi "Scheda cavallo (PDF + QR)", "Scadenzario sanitario" e "Storico eventi".
2. Per modificare tocca "Modifica", cambia i campi (anche "Sesso" e "Attività") e tocca "Salva".
3. Per eliminare tocca il cestino rosso e conferma con "Elimina".
4. Con "Torna ai cavalli" rientri nell'elenco.
Esempio: aggiorni la foto di Ares, metti Sesso "Stallone" e Attività "Riproduzione".
Note: "Modifica" compare a chi ha il permesso cavalli (admin, Livello 2, Livello 3 abilitato). Sesso e attività compaiono anche nel PDF della scheda. Eliminare un cavallo cancella anche tutto il suo storico sanitario: non è reversibile.
Parole chiave: modificare cavallo, scheda cavallo, eliminare cavallo, cancellare cavallo, foto cavallo, dettaglio cavallo, sesso, attività$t$
where categoria = 'guida' and ambito = 'scuderia' and titolo = 'Come apro, modifico o elimino la scheda di un cavallo';

-- ===================== SCHEDE NUOVE =====================

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'tutti', 'guida', 'La barra in alto: profilo, Cerca, meteo e Card', $t$Dove: in cima alla Home dell'app (proprietario e professionisti)
Passi:
1. Primo tondo: la tua foto o le iniziali. Toccalo per il menu profilo. Il pallino arancione vuol dire che hai messaggi non letti.
2. "Cerca": cerca cavalli, clienti, scuderie, appuntamenti in tutta l'app.
3. Icona del meteo di adesso: toccala per il dettaglio ora per ora e i 7 giorni.
4. Quarta icona: per il proprietario la "Equo Card" dei cavalli; per i professionisti la "Card" con Equo Pass ed Equo CV.
Esempio: Luca vede il pallino arancione sull'avatar, apre il menu e trova 2 messaggi non letti; poi tocca il sole per vedere se nel pomeriggio piove.
Note: Il riquadro del meteo che c'era in Home ora è nella barra in alto.
Parole chiave: barra in alto, avatar, profilo, pallino arancione, cerca, ricerca, meteo, previsioni, card, equo card, equo pass, equo cv$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where titolo = 'La barra in alto: profilo, Cerca, meteo e Card');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'proprietario', 'guida', 'Equo Card dei miei cavalli e anelli della salute', $t$Dove: barra in alto → quarta icona "Equo Card"
Passi:
1. Si apre una card per ogni cavallo: scorri a destra e a sinistra per cambiarlo.
2. Davanti: foto (copertina dell'album o foto del Diario), nome, razza, età, attività, codice Equo e livello (Provvisorio, Validato, Certificato).
3. Tocca la card per girarla: QR della scheda pubblica, microchip, anno di nascita e mantello, attività, proprietario e dove sta.
4. Sotto ci sono gli anelli della salute: "Cura" (scadenze del libretto: ferratura, vaccino, Coggins, sverminazione), "Movimento" (allenamenti, passeggiate e lezioni della settimana rispetto all'obiettivo), "Attenzioni" (da quanto non scrivi nel Diario). Tocca un anello: Cura apre la scheda del cavallo, Movimento ti fa cambiare l'obiettivo ("Quante uscite a settimana vuoi fare?"), Attenzioni apre il Diario.
5. "Mostra QR" lo mostra grande; "Condividi card" crea un'immagine da mandare.
Esempio: Giulia apre la card di Aurora: Cura 55% perché il vaccino è scaduto, Movimento 3 su 4 uscite; dopo il vaccino e una passeggiata chiude tutti gli anelli.
Note: Il QR apre la scheda pubblica del cavallo (app.equohub.com/cavallo/CODICE) con soli dati non sensibili; arriva quando il cavallo ha il codice Equo. L'attività si sceglie nella scheda del cavallo ("Modifica" → "Attività"). L'obiettivo di Movimento parte da 4 uscite a settimana.
Parole chiave: equo card, card cavallo, carta del cavallo, anelli, salute, cura, movimento, attenzioni, obiettivo settimanale, qr, scheda pubblica, condividere, immagine$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where titolo = 'Equo Card dei miei cavalli e anelli della salute');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'proprietario', 'guida', 'Un professionista mi chiede una referenza', $t$Dove: Home → riquadro "⭐ (nome) ti chiede una referenza"
Passi:
1. Quando un tuo professionista collegato (maniscalco, veterinario, istruttore) chiede una referenza per il suo Equo CV, in Home compare il riquadro.
2. Scrivi due righe sul suo lavoro.
3. Tocca "Invia la referenza".
Esempio: Giulia scrive "Preciso e puntuale, segue i miei cavalli con grande attenzione." e invia.
Note: La referenza compare con il tuo nome nel suo CV solo se lui decide di pubblicarla. Se non vuoi scriverla puoi ignorare il riquadro.
Parole chiave: referenza, recensione, giudizio, cv del maniscalco, raccomandazione, scrivere referenza$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where titolo = 'Un professionista mi chiede una referenza');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'maniscalco', 'guida', 'Equo Pass ed Equo CV (la tua Card)', $t$Dove: barra in alto → quarta icona "Card" → "Equo Pass" o "Equo CV"
Passi:
1. "Equo CV": compili profilo e presentazione, contatti (con "Mostra o nascondi"), dove lavori (zone abituali e "Disponibile per trasferte ed eventi"), specializzazioni, formazione e certificati (con l'attestato per la verifica), esperienze ed eventi (fino a 3 foto), lingue, numeri Equo da mostrare. Si salva da solo.
2. "Scrivi con Hammer" ti aiuta a scrivere la presentazione; "Versione in inglese" la traduce (15 al giorno).
3. Scegli l'aspetto del PDF (Classico, Moderno, Elegante) e la lingua; "Scarica PDF" o "Condividi".
4. "Equo Pass": il tuo badge con foto, ruolo, zona, specializzazioni, numeri Equo e QR. Tocca il Pass per girarlo; si scarica o condivide in PDF.
Esempio: Luca aggiunge "Ferratura correttiva" e "Ferri incollati", carica l'attestato del corso, sceglie il modello Moderno in inglese e manda il PDF a un centro ippico.
Note: Foto e nome vengono dal tuo profilo (menu profilo). Il QR è il tuo codice personale: chi lo inquadra si collega a te su Equo. I numeri Equo (cavalli seguiti, interventi registrati, scuderie e clienti, discipline) sono calcolati dal lavoro registrato in app. Corsi e certificati diventano "Verificato da Equo" solo dopo il controllo di Equo ("In verifica" fino ad allora). "Aggiungi al Wallet" arriverà più avanti.
Parole chiave: equo cv, curriculum, cv, equo pass, badge, card, tesserino, presentazione, specializzazioni, certificati, attestato, pdf cv, inglese, numeri equo$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where titolo = 'Equo Pass ed Equo CV (la tua Card)');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'maniscalco', 'guida', 'Referenze e pagina pubblica dell''Equo CV', $t$Dove: barra in alto → "Card" → "Equo CV" → sezioni "Referenze" e "Pagina pubblica"
Passi:
1. Referenze: tocca "Chiedi", scegli un cliente collegato su Equo e invia. Il cliente la trova nella sua Home e in chat e la scrive.
2. Quando arriva la vedi come "NUOVA · DA APPROVARE": tocca "Pubblica o nascondi" per decidere se mostrarla.
3. Pagina pubblica (Premium): scegli l'indirizzo (lettere, numeri e trattini) e pubblicala: app.equohub.com/pro/(indirizzo). Con "Condividi il link" la mandi a chi vuoi.
Esempio: Luca chiede una referenza a Giulia Verdi; lei scrive "Preciso e puntuale"; Luca la pubblica e condivide la pagina app.equohub.com/pro/luca-ferri.
Note: Le referenze si chiedono solo ai clienti collegati su Equo. La pagina pubblica è solo per Premium; puoi nasconderla quando vuoi ("Pagina pubblica nascosta"). Nella pagina pubblica compaiono solo i dati che hai deciso di mostrare.
Parole chiave: referenze, chiedere referenza, recensioni, pagina pubblica, link cv, sito, premium, indirizzo pagina, condividi cv$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where titolo = 'Referenze e pagina pubblica dell''Equo CV');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'maniscalco', 'guida', 'Agenda completa: Da programmare, Non fatti, Da saldare', $t$Dove: barra in basso → "Agenda" → interruttore in alto "Agenda completa"
Passi:
1. "Appuntamenti": la settimana con gli appuntamenti (senza le scadenze); i lavori fatti si vedono come "✓ N".
2. "Da programmare": le scadenze già passate e quelle dei prossimi 30 giorni, divise per cliente. "Fissa" crea l'appuntamento per un cavallo, "Fissa tutti" per tutti i cavalli del cliente. Filtri "Tutti" e "Scaduti".
3. "Non fatti": gli appuntamenti con la data passata rimasti da fare: segnali "Fatto", spostali ("Sposta al…") o annullali.
4. "Da saldare": chi ti deve cosa, dal debito più vecchio; tocca un cliente per vedere i lavori, segnarli "Saldato", fare il conto o il "Resoconto PDF".
Esempio: il lunedì Luca apre "Da programmare", vede 6 cavalli della Scuderia Le Querce in scadenza e tocca "Fissa tutti" per giovedì.
Note: La scelta tra Agenda semplice e completa resta salvata sul telefono (si parte da Semplice). La domenica è riposo: la data proposta da "Fissa" non cade mai di domenica, ma puoi sempre cambiarla. Se hai nascosto gli incassi con il PIN, "Da saldare" chiede di mostrarli dal menu.
Parole chiave: agenda completa, da programmare, non fatti, da saldare, fissa tutti, scadenze, appuntamenti passati, crediti, programmare ferrature$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where titolo = 'Agenda completa: Da programmare, Non fatti, Da saldare');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'maniscalco', 'guida', 'Promemoria personali: «Ricordami di…»', $t$Dove: chiedilo a Hammer ("Ricordami di…"), oppure "+" → "Promemoria", oppure Home → "🔔 Da ricordare" → "+ Nuovo"
Passi:
1. Scrivi "Cosa devo ricordarti".
2. Scegli il giorno ("Oggi", "Domani", "Tra una settimana" o "Giorno") e l'ora.
3. Facoltativi: il "Cliente" e il "Tasto nel promemoria" ("Fai il conto", "Scrivi al cliente", "Naviga").
4. Tocca "Salva promemoria". Con Hammer basta scriverlo: lui prepara la scheda e tu confermi.
5. All'ora giusta Hammer te lo scrive in chat come messaggio importante e arriva la notifica (o un'email se le notifiche sono spente).
6. Lo trovi anche in Home ("Da ricordare") e nel giorno dell'Agenda, con "Fatto", "Domani" (lo sposta di un giorno) e il tasto dell'azione.
Esempio: Luca scrive a Hammer "ricordami venerdì alle 18 di fare il conto a Marco Rossi": venerdì alle 18 arriva il messaggio con il tasto "Fai il conto".
Note: I promemoria sono solo tuoi: il cliente non li vede. Per cambiarli o eliminarli toccali ("Modifica promemoria", "Elimina promemoria"). Le scadenze del furgone dell'Officina mobile arrivano allo stesso modo.
Parole chiave: promemoria, ricordami, ricordare, avviso, sveglia, notifica, da ricordare, hammer promemoria, appunto$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where titolo = 'Promemoria personali: «Ricordami di…»');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'maniscalco', 'guida', 'Officina mobile: mezzi, aiutanti, materiali e spese', $t$Dove: Home → riga "Officina mobile" (furgone, aiutanti, materiali e spese)
Passi:
1. La prima volta "Configura in 4 passi": Base (es. consumo medio del mezzo) · Mezzi · Aiutanti · Materiali. Puoi "Salta" e completare dopo.
2. In alto la giornata di oggi: mezzo, aiutante ("Da solo" o il nome), km del giro (Beta, stimati dagli appuntamenti) e materiali usati; tocca "Salva la giornata". Sotto il "GUADAGNO NETTO": lavori fatti meno le spese.
3. Schede: "Mezzi" (furgone, auto, carrello con le loro scadenze), "Aiutanti" (nome e compenso), "Materiali" (con scelte rapide: raspe, nastro smerigliatrice, scarpe antinfortunistiche, bombola gas, grembiule… e l'avviso "Stanno finendo"), "Spese" (spese del mese, "+ Spesa").
4. Una spesa la aggiungi anche dal "+" → "Spesa", oppure mandando a Hammer la foto dello scontrino: lui prepara la spesa e tu tocchi "Registra spesa".
Esempio: Luca esce con il furgone e l'aiutante Marco: la giornata conta 8 lavori, 94 km, 12 ferri nuovi; tolte le spese (compenso di Marco, carburante stimato, materiali) vede il guadagno netto del giorno.
Note: Alcune spese si calcolano da sole: compenso dell'aiutante, carburante stimato dai km, materiali (anche i ferri nuovi segnati nei lavori). Con l'aiutante il cliente vede «Intervento eseguito con l'aiutante (nome)» nel PDF e in chat, e «con (nome)» nell'appuntamento. "Mostra ai clienti" fa comparire il mezzo nella tua pagina pubblica. I km del giro sono in prova (Beta).
Parole chiave: officina mobile, furgone, mezzo, auto, aiutante, garzone, compenso, materiali, scorte, spese, carburante, km, guadagno netto, scontrino$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where titolo = 'Officina mobile: mezzi, aiutanti, materiali e spese');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'maniscalco', 'guida', 'Scadenze del mezzo: tagliando, cinghia, gomme, revisione, assicurazione', $t$Dove: Home → "Officina mobile" → scheda "Mezzi" → il mezzo
Passi:
1. Nel mezzo imposta chilometri, alimentazione e tipo di cambio, "Tagliando ogni" (km o mesi), "Cinghia distribuzione ogni", "Tagliando cambio automatico ogni" (solo cambio automatico), date di assicurazione, bollo e revisione (e collaudo bombole se è a GPL o metano).
2. Con "+ intervento" registri cosa hai fatto: Tagliando, Revisione, Gomme, Pasticche, Cinghia distribuzione, Tagliando cambio automatico, Manutenzione ordinaria, Manutenzione straordinaria, Riparazione. Con "Tagliando fatto" la scadenza riparte.
3. In cima all'Officina vedi le scadenze più vicine con i giorni o i km che mancano.
Esempio: Luca segna il tagliando a 182.000 km con "ogni 30.000 km": a 210.000 km circa riceve l'avviso.
Note: 15 giorni prima e il giorno stesso Hammer ti scrive in chat (messaggio importante) e arriva la notifica, o l'email se le notifiche sono spente, come per i promemoria personali. Lo storico degli interventi resta nel mezzo.
Parole chiave: tagliando, cinghia di distribuzione, gomme, pneumatici, pasticche, freni, revisione, assicurazione, bollo, collaudo bombole, cambio automatico, manutenzione, scadenze furgone$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where titolo = 'Scadenze del mezzo: tagliando, cinghia, gomme, revisione, assicurazione');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'maniscalco', 'guida', 'Cavalli di altri proprietari che stanno in una scuderia', $t$Dove: "Clienti" → apri la scuderia → riquadro "Cavalli"; nuovo appuntamento in quella scuderia
Passi:
1. Nel riquadro "Cavalli" della scuderia vedi anche i cavalli intestati a un proprietario che stanno lì, con "di (proprietario)", con l'ultimo e il prossimo lavoro.
2. Quando crei un appuntamento nella scuderia puoi scegliere insieme i cavalli della scuderia e quelli dei proprietari che stanno lì.
3. Ogni lavoro va a chi paga: i cavalli della scuderia alla scuderia, gli altri al loro proprietario. Ogni cliente su Equo riceve l'avviso solo con i suoi cavalli.
Esempio: Francesco va al Centro Ippico Levante per 3 cavalli del centro e per Rio di Ezio P.: un solo appuntamento; i 3 lavori finiscono nel conto della scuderia, quello di Rio nel conto di Ezio.
Note: Per spostare un cavallo in una scuderia o cambiare chi paga vedi le schede «Come aggiungo o tolgo i cavalli di un cliente» e «Cambia proprietario di un cavallo in scuderia (chi paga)».
Parole chiave: cavalli in scuderia, stanno qui, qui stanno, cavalli di altri proprietari, chi paga, appuntamento in scuderia, pensione, conto separato$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where titolo = 'Cavalli di altri proprietari che stanno in una scuderia');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'tutti', 'guida', 'Razza, sesso e attività del cavallo (anche asino, bardotto, mulo e pony)', $t$Dove: scheda del cavallo → "Modifica" (proprietario e Scuderia); per il maniscalco scheda del cavallo → "Anagrafica" → "Modifica"
Passi:
1. "Razza": scrivi le prime lettere e scegli dall'elenco Equo (es. "asi" → Asino, "mul" → Mulo, "bard" → Bardotto, "pony" → Pony (razza non indicata)). Se non c'è tocca "La mia razza non c'è".
2. "Sesso": Femmina, Castrone o Stallone.
3. "Attività": Salto ostacoli, Dressage, Completo, Endurance, Monta western, Monta da lavoro, Trotto, Galoppo, Volteggio, Attacchi, Polo, Scuola, Passeggiata / trekking, Riproduzione, A riposo, o scrivila tu.
Esempio: Simone registra l'asina Nuvola: razza Asino, sesso Femmina, attività Passeggiata / trekking.
Note: Le tre lettere del codice Equo vengono dalla razza: Asino ASN, Bardotto BDT, Mulo MUL, Pony PNY. Lo stesso elenco di attività c'è nell'app del proprietario, del maniscalco (dove prima si chiamava "Disciplina") e in Equo Scuderia.
Parole chiave: razza, asino, asina, somaro, bardotto, mulo, mula, pony, sesso, femmina, castrone, stallone, attività, disciplina, riproduzione, codice razza$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where titolo = 'Razza, sesso e attività del cavallo (anche asino, bardotto, mulo e pony)');

-- Controllo: elenco delle schede toccate adesso (atteso 19 righe)
select ambito, titolo, aggiornato_il::date from public.ai_conoscenze where categoria = 'guida' and aggiornato_il > now() - interval '5 minutes' order by ambito, titolo;
