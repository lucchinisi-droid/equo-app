-- 22/10/2026 GUIDA DEGLI AGENTI: schede aggiornate alle novita del 20-22 ottobre
-- (Diario con settimana e Instagram, cavalli bloccati col piano Free, notifiche del codice cavallo,
--  codice Equo in Scuderia, PDF solo da Validato, conferme dell'istruttore).
-- Si puo rieseguire: aggiorna per titolo e inserisce solo le schede che mancano.

-- 1) Diario (proprietario): settimana scorrevole con icone, Condividi su Instagram
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = $t$Dove: barra in basso → "Diario" (oppure il tasto "+" al centro della barra, oppure la carta "Oggi" nella Home)
Passi:
1. Tocca "+" al centro della barra in basso.
2. Scegli il "Cavallo" e il tipo: "Foto", "Nota" o "Vocale".
3. Foto: "Scatta o scegli una foto". Vocale: tocca il microfono per registrare (massimo 3 minuti) e tocca di nuovo per fermare. Nota: scrivi il testo.
4. Aggiungi, se vuoi, una riga e scegli la categoria: Allenamento, Passeggiata, Lezione, Cura, Traguardo o Altro.
5. Tocca "Salva nel Diario".
6. In "Diario" vedi la copertina, i giorni di fila, i momenti del mese, la settimana e tutti i momenti. La settimana si sposta con le frecce ‹ › o scorrendo col dito; sotto ogni giorno compare l'icona di cosa c'è: macchina fotografica per le foto, videocamera per i video, microfono per i vocali, penna per le note.
7. Tocca un giorno per aprirlo, un momento per modificarlo, metterlo nell'album o nasconderlo.
8. Per pubblicare un momento tocca "Condividi su Instagram" (foto e note). La foto condivisa ha il logo Equo in basso a destra con la scritta Equohub.com: il logo c'è solo sulla copia condivisa, la foto salvata nel Diario non cambia. Sul telefono si apre la condivisione (scegli Instagram); dal computer la foto viene scaricata e il testo copiato, da incollare su Instagram.
Esempio: Marco scatta una foto di Rio al tramonto, scrive "Prima passeggiata dopo la pioggia", sceglie "Passeggiata" e salva; poi apre il momento e tocca "Condividi su Instagram": la foto parte con il logo Equo.
Note: Ogni momento lo vedi solo tu finché non lo condividi tu. "Nascondi dal Diario" lo toglie dalla vista ma resta nello storico del cavallo. Il video è Premium. Il Diario è diverso dal libretto sanitario, che sta nella scheda del cavallo. Finché il Diario è vuoto trovi le card "Da Equo". Se una foto mostra "Foto non disponibile", riapri il Diario: il collegamento alla foto si rinnova da solo.
Parole chiave: diario, foto, nota, vocale, momento, allenamento, passeggiata, giorni di fila, settimana, icone, storico, ricordi, scrivere, +, nascondere, instagram, condividere, logo, watermark, pubblicare$t$
where categoria = 'guida' and ambito = 'proprietario' and titolo = 'Come scrivo un momento nel Diario del mio cavallo';

-- 2) Piano Free (proprietario): cavalli bloccati oltre il primo
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = $t$Dove: menu profilo → sezione "Piano" ("Free — Funzioni base")
Passi:
1. Con Free usi: un cavallo completo con libretto sanitario, Diario, spese, calendario, scadenze in Home, servizi vicino a te, chat con maniscalco, scuderia e altri proprietari.
2. Pegasus: 5 messaggi al giorno.
3. Per sbloccare il resto tocca "Passa a Premium".
Esempio: Luca usa Free per un solo cavallo: libretto, spese e chat col maniscalco gli bastano; passa a Premium quando il maniscalco gli prepara anche il secondo cavallo.
Note: Limiti Free: un solo cavallo completo. Se ne hai di più (per esempio quelli preparati dal tuo maniscalco), il più vecchio resta completo e gli altri restano nell'account ma bloccati: la scheda è sfocata, con il pulsante "Sblocca con Premium", e non compaiono in Diario, lezioni, spese e scadenze. Il maniscalco può continuare a registrare gli interventi su quei cavalli: restano al sicuro e li vedi appena passi a Premium. Pegasus 5 messaggi al giorno; niente video verso maniscalco e scuderia; niente promemoria automatici; riepilogo del lunedì solo in chat. Segnalando un maneggio che si registra ottieni 1 mese di Premium gratis.
Parole chiave: free, gratis, gratuito, piano base, limiti, cosa è incluso, versione gratuita, cavallo bloccato, sfocato, sblocca con premium, secondo cavallo$t$
where categoria = 'guida' and ambito = 'proprietario' and titolo = 'Cosa posso fare con il piano Free';

-- 3) Notifiche (proprietario): anche gli avvisi del codice cavallo
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = $t$Dove: "Chat" → banner "Attiva le notifiche per non perdere i messaggi…" → "Attiva"
Passi:
1. Apri "Chat".
2. Se vedi il banner, tocca "Attiva".
3. Consenti le notifiche nella richiesta del telefono/browser.
Esempio: Marco attiva le notifiche: quando Paolo conferma la ferratura, tocca la notifica e si apre direttamente la chat.
Note: Oltre ai messaggi ricevi gli avvisi del codice cavallo: "(maniscalco) ti ha preparato N cavalli" quando il tuo maniscalco ti propone i cavalli (li trovi nella Home), e "Da confermare: (nome)" quando qualcuno cambia nome, razza o data di nascita di un tuo cavallo (aprilo e ricontrolla i dati). Lo stesso avviso non arriva più di una volta ogni 10 minuti. Se compare "Permesso non concesso." abilita le notifiche per Equo nelle impostazioni del telefono. Toccare una notifica apre la chat giusta (anche cambiando vista). Il pallino sulla tab "Chat" indica messaggi non letti; in Home trovi anche "ULTIMO MESSAGGIO".
Parole chiave: notifiche, push, avvisi, non ricevo notifiche, attivare notifiche, badge, messaggi non letti, cavalli preparati, da confermare, codice cavallo$t$
where categoria = 'guida' and ambito = 'proprietario' and titolo = 'Come attivo le notifiche dei messaggi';

-- 4) Scheda PDF con QR (Scuderia): solo dal livello Validato
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = $t$Dove: menu "Cavalli & Salute" → apri il cavallo → riquadro "Scheda cavallo (PDF + QR)"
Passi:
1. La scheda PDF e il QR ufficiali si sbloccano solo quando il codice del cavallo è "Validato" (riquadro "Codice Equo" nella scheda del cavallo). Se è ancora "Provvisorio" il riquadro lo dice: completa nome, razza e data di nascita e fate le due conferme (vedi la scheda "Codice Equo del cavallo in Scuderia").
2. Con il codice Validato tocca "Genera PDF" la prima volta (o "Aggiorna PDF" se hai cambiato dati o eventi).
3. Accanto trovi il QR: inquadrandolo con il telefono si apre sempre la versione aggiornata della scheda.
4. "Scarica PDF" salva il file sul computer o sul telefono.
5. "Invia in chat" apre la finestra: in "A chi" scegli tra "Clienti / proprietari", "Team" e "Maniscalchi collegati", scrivi un messaggio se vuoi e tocca "Invia PDF".
6. "Stampa" apre la stampa con le stampanti collegate al computer.
Esempio: il maniscalco Riccardo chiede la scheda di Ares, che è Validato: in "A chi" scegli "Riccardo · come maniscalco" (gruppo Maniscalchi collegati) e la scheda arriva nella chat Professionisti con lui.
Note: Se tocchi Scarica, Invia o Stampa su un cavallo non ancora Validato compare "La scheda PDF si sblocca quando il codice e Validato.". Chi ha due ruoli compare due volte con "· come proprietario" o "· come maniscalco": la scheda arriva nella chat di quel ruolo. Il proprietario del cavallo è già proposto. Se la scheda non è aggiornata, Scarica / Invia / Stampa la rigenerano da soli. Il PDF ha la grafica Equo (logo, cornice verde e oro), foto del cavallo, dati, scadenzario con semaforo, storico eventi e QR.
Parole chiave: pdf, scheda cavallo, qr code, stampare, scaricare, inviare scheda, condividere, passaporto, documento cavallo, inviare al maniscalco, scheda non arriva, pdf bloccato, validato, provvisorio$t$
where categoria = 'guida' and ambito = 'scuderia' and titolo = 'Come genero e condivido la scheda PDF con QR del cavallo';

-- 5) NUOVA (Scuderia): codice Equo e conferme del centro
insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'scuderia', 'guida', 'Codice Equo del cavallo in Scuderia (Provvisorio, Validato, Certificato)', $t$Dove: menu "Cavalli & Salute" → apri il cavallo → riquadro "Codice Equo"; in "Home" il riquadro "Da confermare"
Passi:
1. Nel riquadro "Codice Equo" vedi il codice del cavallo e il suo livello: "Provvisorio" (grigio, codice PRV-…), "Validato" (verde, codice definitivo) o "Certificato" (oro).
2. Un cavallo diventa Validato quando ha nome, razza e data di nascita completi e due persone diverse confermano i dati: una è sempre il proprietario, l'altra può essere il centro, il maniscalco o un istruttore collegato. Il centro conta come una sola persona.
3. Per confermare come centro tocca "Confermo i dati" nel riquadro "Codice Equo", oppure nella Home apri il riquadro "Da confermare", che elenca i cavalli del centro in attesa della vostra conferma.
4. Quando il cavallo diventa Validato riceve il codice definitivo (finché viene assegnato vedi "in assegnazione") e si sbloccano la scheda PDF e il QR ufficiali.
5. Se qualcuno cambia nome, razza o data di nascita il cavallo torna in "Da confermare": ricontrolla e riconferma.
Esempio: il proprietario di Ares completa la data di nascita e conferma; l'amministratore del centro apre la Home, trova Ares in "Da confermare", controlla i dati e conferma: Ares diventa Validato e si può generare la sua scheda PDF.
Note: Admin e istruttori del centro ricevono la notifica "Da confermare: (nome)" quando cambiano i dati di un cavallo del centro. Confermate solo cavalli che conoscete davvero. Il livello Certificato arriva con la verifica di Equo.
Parole chiave: codice equo, codice cavallo, provvisorio, validato, certificato, PRV, da confermare, confermo i dati, conferma, codice definitivo, scheda pdf bloccata$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where categoria = 'guida' and ambito = 'scuderia' and titolo = 'Codice Equo del cavallo in Scuderia (Provvisorio, Validato, Certificato)');

-- 6) NUOVA (istruttore): conferme del codice cavallo nella Home del Trainer
insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'istruttore', 'guida', 'Come confermo i dati di un cavallo (Da confermare)', $t$Dove: "Home" del Trainer → riquadro "Da confermare"
Passi:
1. Nel riquadro compaiono i cavalli che segui con nome, razza e data di nascita completi e che non hai ancora confermato.
2. Controlla che i dati siano giusti e tocca "Confermo".
3. La tua conferma più quella del proprietario rende il cavallo Validato: riceve il codice definitivo con il badge verde.
4. Se il proprietario cambia nome, razza o data di nascita il cavallo ricompare in "Da confermare": ricontrolla e riconferma.
Esempio: Marco completa la data di nascita di Rio; il suo istruttore Riccardo trova Rio in "Da confermare" nella Home, conferma e Rio diventa Validato.
Note: Ricevi anche la notifica "Da confermare: (nome)". Una persona vale una conferma sola. Se non conosci davvero il cavallo non confermare.
Parole chiave: da confermare, conferma, validato, codice definitivo, codice cavallo, seconda conferma, dati cambiati, trainer, istruttore$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where categoria = 'guida' and ambito = 'istruttore' and titolo = 'Come confermo i dati di un cavallo (Da confermare)');

-- 7) Maniscalco: la scheda "Da confermare" cita anche la notifica
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto, 'Note: Se hai creato e completato tu', 'Note: Ricevi anche la notifica "Da confermare: (nome)" quando cambiano i dati di un cavallo che segui. Se hai creato e completato tu')
where categoria = 'guida' and ambito = 'maniscalco' and titolo = 'Come confermo i dati di un cavallo (Da confermare)' and contenuto not like '%notifica "Da confermare%';

-- controllo
select ambito, titolo, aggiornato_il::date from public.ai_conoscenze where categoria = 'guida' and aggiornato_il > now() - interval '5 minutes' order by ambito, titolo;
