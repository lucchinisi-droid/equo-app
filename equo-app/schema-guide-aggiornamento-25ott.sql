-- 25/10/2026 GUIDA DEGLI AGENTI: schede aggiornate alle novità del 24-25 ottobre
-- (cavalli: «Non lo seguo più» e «Archivia»; profili certificati; scheda cavallo con intervallo, prezzo e anagrafica;
--  scadenze della struttura e «Cambia data»; misure olandesi 4x0; cambia proprietario; resoconto PDF; posizione attuale;
--  QR «Colleghiamoci su Equo» nei PDF; codici Equo senza trattini e lettore QR)
-- DA ESEGUIRE DOPO IL DEPLOY (le schede descrivono l'app aggiornata).
-- Si puo rieseguire: aggiorna per titolo e inserisce solo le schede che mancano (il titolo è unico in tutta la tabella).

-- ===================== SCHEDE AGGIORNATE =====================

-- 1) Maniscalco: cavalli di un cliente (niente più cestino)
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = $t$Dove: "Clienti" → cliente → "Modifica" → sezione "Cavalli"
Passi:
1. Apri "Modifica cliente".
2. Se il cavallo ha già un codice Equo (es. MAR-000005, si legge sotto il nome del cavallo) scrivilo in "Codice Equo del cavallo" e tocca "Aggiungi": arriva con tutto il suo storico. Se è già tra i cavalli di un altro tuo cliente, l'app chiede se spostarlo qui (es. il cavallo del proprietario che sta in una scuderia).
3. Per un cavallo nuovo scrivi "Nome nuovo cavallo" e, se lo sai, "Microchip (opz.)", poi tocca "+ Aggiungi cavallo".
4. Per togliere un cavallo dalla tua lista usa l'icona accanto al cavallo: i cavalli non si eliminano più (vedi la scheda «Non seguo più un cavallo: Non lo seguo più e Archivia»).
Esempio: Rio di Simone ora sta alla Scuderia Colleferro: Riccardo apre la scuderia, scrive PSI-000002 e conferma lo spostamento; se Rio c'era già con il codice della scuderia, le due schede diventano una.
Note: Conta il numero del codice: le tre lettere indicano la razza e possono cambiare se la razza viene corretta (MAR-000005 e ALT-000005 sono lo stesso cavallo). Ogni cavallo ha un solo numero e uno storico a vita: spostamenti e unioni restano registrati. Puoi aggiungere con il codice i cavalli dei proprietari tuoi clienti su Equo e quelli delle scuderie collegate. Il proprietario collegato riceve in chat "Rio ora lo seguo presso …". Nella scheda del proprietario il cavallo resta visibile con "📍 presso …". Cavalli del proprietario o della scuderia: icona persona barrata = «Non lo seguo più» (serve la loro conferma). Cavalli inseriti solo da te: icona scatola = «Archivia» (li ripristini da «Cavalli archiviati»).
Parole chiave: cavalli cliente, aggiungere cavallo, codice equo, codice cavallo, spostare cavallo, cambio scuderia, unire schede, doppione, microchip, eliminare cavallo, togliere cavallo, archiviare, non lo seguo più$t$
where categoria = 'guida' and ambito = 'maniscalco' and titolo = 'Come aggiungo o tolgo i cavalli di un cliente';

-- 2) Maniscalco: modifica cliente (nome e tipo bloccati se collegato, posizione attuale)
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = $t$Dove: "Clienti" → tocca il cliente → "Modifica"
Passi:
1. Apri la scheda del cliente.
2. Tocca "Modifica" in alto.
3. Cambia "Tipo di cliente", "Nome cliente", "Telefono", "Indirizzo (per «Naviga»)" e "Note". Se sei dal cliente e non sai la via, tocca "📍 Usa la mia posizione attuale".
4. Se non è ancora collegato puoi inserire il "Codice Equo del cliente (opzionale)".
5. Tocca "Salva modifiche".
Esempio: Marco Rossi cambia numero: Luca aggiorna il telefono in 333 7654321.
Note: Il nome è obbligatorio. Se il cliente è collegato a Equo (vedi "✓ Collegato a Equo") o è una scuderia collegata con Equo Scuderia, "Tipo di cliente" e "Nome cliente" sono bloccati: compare "Collegato a Equo: nome e tipo li gestisce il cliente nel suo profilo" (vedi la scheda «Profili certificati: cosa non posso modificare»). Nella scheda il telefono è toccabile per chiamare; sotto ci sono i box dei cavalli.
Parole chiave: modificare cliente, cambiare telefono, aggiornare cliente, correggere nome, note cliente, numero cliente, tipo cliente bloccato, nome bloccato, indirizzo, posizione$t$
where categoria = 'guida' and ambito = 'maniscalco' and titolo = 'Come modifico i dati di un cliente';

-- 3) Maniscalco: collegare un cliente con codice invito e QR (QR = link, Condividi l'invito, QR nei PDF)
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = $t$Dove: "Clienti" → tocca il cliente → chip "QR e codice invito"
Passi:
1. Apri la scheda del cliente e tocca "QR e codice invito": vedi il QR e il codice invito (es. EQUO3F8A2; i più vecchi hanno il trattino, es. EQUO-3F8A2).
2. Fai inquadrare il QR al cliente con la fotocamera del suo telefono: si apre Equo, crea l'account e scegliendo «Ho un cavallo» è già collegato a te.
3. Oppure tocca "Condividi l'invito": parte un messaggio (WhatsApp, SMS…) con il codice e il link che lo collega da solo.
4. Se ha già Equo può anche scrivere il codice in "Chat" → "Il tuo maniscalco" → "+ Collega".
Esempio: Luca condivide l'invito con Marco Rossi su WhatsApp; Marco apre il link, crea l'account e trova già i cavalli che Luca gli ha preparato.
Note: Il QR «Colleghiamoci su Equo» c'è anche in fondo ai PDF di appuntamento, conto e resoconto dei clienti proprietari non ancora collegati. Il codice si accetta scritto in qualunque modo (maiuscole o minuscole, con o senza trattini). Una volta collegato la scheda mostra "✓ Collegato a Equo" e nella lista il badge "su Equo". Ogni codice vale per un solo account. Le scuderie si collegano con Equo Scuderia, non con questo codice.
Parole chiave: collegare cliente, codice invito, qr cliente, invitare cliente, cliente su equo, condividi l'invito, link invito, scansiona, collegamento, colleghiamoci su equo$t$
where categoria = 'guida' and ambito = 'maniscalco' and titolo = 'Come collego un cliente a Equo con il codice invito e il QR';

-- 4) Maniscalco: codice personale (nuovo formato, QR = link, condivisione semplice)
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = $t$Dove: menu profilo → "Attività professionale" → "Il tuo codice personale"
Passi:
1. Apri il menu profilo.
2. Tocca "Il tuo codice personale": vedi il QR e il codice (i nuovi sono senza trattini, es. EQUOPRO0FKEM; quelli già dati restano validi, es. EQUO-PRO-0FKEM).
3. Tocca "Copia" o "Condividi": si manda solo il codice e il link https://app.equohub.com, comodi da copiare.
Esempio: Luca fa inquadrare il QR a una nuova cliente con la fotocamera del suo telefono: si apre Equo e lei si collega subito a lui.
Note: Il QR è un link: aperto con la fotocamera porta su Equo e collega. Il codice si accetta in qualunque modo: maiuscole o minuscole, con o senza trattini e spazi, O al posto di 0 e I o L al posto di 1. Serve a chi non è ancora tuo cliente su Equo (lo scrive in Chat → "Il tuo maniscalco" → "+ Collega") e ai colleghi professionisti per chattare con te. È diverso dal codice invito che ogni scheda cliente ha.
Parole chiave: codice personale, codice pro, EQUOPRO, EQUO-PRO, qr code, il mio codice, codice professionista, farsi trovare, condividere codice$t$
where categoria = 'guida' and ambito = 'maniscalco' and titolo = 'Dov''è il mio codice personale EQUO-PRO e il QR';

-- 5) Maniscalco: PDF dell'intervento (QR di invito, ruolo)
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = $t$Dove: Agenda → tocca l'appuntamento → "Stampa PDF"
Passi:
1. Apri l'appuntamento in Agenda.
2. Tocca "Stampa PDF".
3. Dal menu di condivisione del telefono scegli Stampa, Salva su File, invia, ecc. (su computer il file si scarica).
Esempio: Luca genera "Equo_Marco-Rossi_Aurora_2026-09-16.pdf" per l'archivio del cliente.
Note: Il PDF ("Riepilogo intervento" o "Conferma appuntamento") riporta cliente, cavallo, data, ora, tipo, misura con equivalenze, quantità ferri, importo, pagamento, stato, prossimo intervento consigliato e note; accanto al tuo nome c'è il tuo ruolo (Maniscalco, Veterinario o Istruttore) e, con il badge, "Equo Certified". Se non è saldato aggiunge i tuoi dati di pagamento. Se il cliente è un proprietario non ancora su Equo, in fondo c'è il riquadro "Colleghiamoci su Equo" con il QR e il codice invito: inquadrandolo apre Equo e si collega a te. Non ha valore fiscale. Serve la connessione.
Parole chiave: pdf, stampare, ricevuta, riepilogo, documento, scaricare pdf, salvare, archivio, qr, colleghiamoci$t$
where categoria = 'guida' and ambito = 'maniscalco' and titolo = 'Come stampo o salvo il PDF di un intervento';

-- 6) Maniscalco: conto (QR, differenza con il resoconto)
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto, 'Nei dati di pagamento del PDF compaiono IBAN e PayPal che hai inserito nel profilo.',
    'Nei dati di pagamento del PDF compaiono IBAN e PayPal che hai inserito nel profilo. Per un cliente proprietario non ancora su Equo il PDF ha in fondo il QR «Colleghiamoci su Equo». Per un riepilogo di tutti gli interventi (pagati e no) senza numero di conto usa «Resoconto PDF».')
where categoria = 'guida' and ambito = 'maniscalco' and titolo = 'Fare il conto di una scuderia o di un cliente (PDF)' and contenuto not like '%Colleghiamoci%';

-- 7) Maniscalco: misura del ferro (nomi dei sistemi, 4x0, misura che uso di solito)
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = $t$Dove: scheda del cavallo → "Ferratura" → "Modifica" → "Misura del ferro"
Passi:
1. Scegli il sistema: "Misura olandese / internazionale", "Misura italiana" o "Misura tedesca".
2. Con − e + porti la misura a quella giusta (cambiando sistema resta la misura equivalente). Le misure olandesi piccole si scrivono con la x: 4x0, 3x0, 2x0, poi 0, 1, 2…
3. Se usi quasi sempre lo stesso sistema tocca "Usa sempre la misura …": i cavalli senza misura partono da quella.
4. Tocca "Salva".
Esempio: Brezza porta il n. 2 olandese: Luca lo imposta una volta e tutti i suoi appuntamenti lo usano.
Note: La misura vale per tutti gli appuntamenti del cavallo e ogni cambio resta nello storico. Un lavoro già fatto conserva la misura usata quel giorno. Nei PDF accanto alla misura ci sono le equivalenze negli altri sistemi.
Parole chiave: misura ferro, numero ferro, taglia ferro, sistema italiano, olandese, internazionale, tedesco, 4x0, 3x0, ferro standard, misura predefinita$t$
where categoria = 'guida' and ambito = 'maniscalco' and titolo = 'Come inserisco la misura del ferro';

-- 8) Maniscalco: come si calcola la prossima scadenza (intervallo del cavallo e della struttura)
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = $t$Dove: si apre da solo quando segni "fatto" una Ferratura, Mezza ferratura o Pareggio (pulsante "Fatto" in Agenda, "Segna come fatto", o salvando un intervento con data già passata)
Passi:
1. Segna l'intervento come fatto: compare il riquadro "Prossimo intervento" con "Inserisco il prossimo intervento tra 35 giorni" e la data.
2. Tocca "OK" per confermare quei giorni.
3. Oppure tocca "CAMBIA": scorri la ruota, scegli il numero e tocca "OK".
4. La data del prossimo intervento viene salvata con l'intervento.
Esempio: Aurora va ferrata ogni 42 giorni: imposti "Intervallo di ferratura" 42 nella sua scheda e da allora l'app propone sempre 42 giorni per Aurora.
Note: I giorni proposti vengono, in quest'ordine: 1) l'intervallo del cavallo (scheda del cavallo → "Intervallo di ferratura"); 2) quello della struttura ("Scadenze della struttura" → "Ferratura ogni N giorni"); 3) l'ultima scelta fatta per quel cavallo; 4) i tuoi "Richiami predefiniti" (menu profilo: all'inizio ferratura e mezza ferratura 35, pareggio 56). Cambiare un intervallo non sposta una data già fissata: per quella usa "Cambia data". "Altro" non ha richiamo. La data compare in Home, in Agenda come promemoria, nel PDF come "Prossimo intervento consigliato", nel libretto del proprietario su Equo e nella scheda della scuderia su Equo Scuderia.
Parole chiave: prossima scadenza, prossimo intervento, richiamo, dopo quanti giorni, 35 giorni, cambiare giorni, promemoria ferratura, reminder, intervallo, intervallo del cavallo, intervallo della struttura$t$
where categoria = 'guida' and ambito = 'maniscalco' and titolo = 'Come viene calcolata la prossima scadenza';

-- 9) Proprietario: collegare il maniscalco (codici in qualunque forma, QR dei PDF)
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = $t$Dove: barra in basso → "Chat" → "Il tuo maniscalco" → "+ Collega"
Passi:
1. Il modo più semplice: inquadra con la fotocamera del telefono il QR del maniscalco (dal suo telefono o in fondo a un suo PDF, riquadro "Colleghiamoci su Equo"), oppure apri il link che ti ha mandato: si apre Equo e sei collegato.
2. A mano: in "Chat" tocca "+ Collega", scrivi il codice in "Codice maniscalco" e tocca "Collega", oppure tocca "Scansiona QR".
3. Se il maniscalco ti ha preparato dei cavalli, in Home trovi "(maniscalco) ha preparato N cavalli per te": accettali.
Esempio: Paolo, maniscalco, dà a Giulia il codice EQUOPRO7K2QX: lei scrive «equopro 7k2qx», tocca "Collega" e vede "Collegato a Paolo Neri!".
Note: Il codice si accetta in qualunque modo: maiuscole o minuscole, con o senza trattini e spazi, O al posto di 0 e I o L al posto di 1 (vanno bene sia EQUOPRO0FKEM sia EQUO-PRO-0FKEM). Se non hai ancora l'account, il link o il QR ricordano l'invito per 30 giorni: crea l'account e scegli «Ho un cavallo». Errori possibili: "Codice non valido", "Questo codice è già stato usato da un altro account", "Questo non è il codice di un maniscalco". Anche il maniscalco può collegarti usando il tuo codice personale. "✓ Equo Certified" indica un professionista verificato.
Parole chiave: collegare maniscalco, codice maniscalco, EQUOPRO, EQUO-PRO, maniscalco, ferratura, farrier, qr maniscalco, invito maniscalco, colleghiamoci, link invito$t$
where categoria = 'guida' and ambito = 'proprietario' and titolo = 'Come collego il mio maniscalco';

-- 10) Proprietario: scanner QR
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = $t$Dove: "Chat" → "+ Nuova chat" → "Scansiona QR" (oppure "Il tuo maniscalco" → "+ Collega" → "Scansiona QR")
Passi:
1. Tocca "Scansiona QR" e consenti l'uso della fotocamera.
2. Inquadra il QR nella finestra "Inquadra il QR" (del telefono dell'altra persona o di un PDF Equo).
3. Equo riconosce il codice: quello di un proprietario apre la chat, quello di un istruttore apre la richiesta all'istruttore, quello di un maniscalco o un codice invito ti collega al maniscalco.
Esempio: In scuderia Paolo mostra il suo QR: Giulia lo inquadra e il maniscalco è subito collegato.
Note: I QR di Equo sono anche link: puoi inquadrarli direttamente con la fotocamera del telefono, senza aprire lo scanner. Se compare "Non riesco ad accedere alla fotocamera." consenti la fotocamera nelle impostazioni. Puoi sempre scrivere il codice a mano, in qualunque forma (maiuscole o minuscole, con o senza trattini).
Parole chiave: qr, scansiona, qr code, fotocamera, inquadrare, codice qr, scan, lettore qr$t$
where categoria = 'guida' and ambito = 'proprietario' and titolo = 'Come uso lo scanner QR';

-- 11) Proprietario: codice per la chat
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto = $t$Dove: menu profilo → sezione "Chat" → "Il tuo codice per la chat"
Passi:
1. Apri il menu profilo.
2. Tocca "Il tuo codice per la chat".
3. Vedi il codice (i nuovi sono senza trattini, es. EQUOOWN3Q9NM; i vecchi tipo EQUO-OWN-3Q9NM restano validi) e il suo QR.
4. Tocca "Copia" oppure "Condividi": si manda solo il codice e il link https://app.equohub.com.
Esempio: Giulia manda a Sara il suo codice; Sara lo incolla in Chat → "+ Nuova chat" e iniziano a scriversi.
Note: Il QR è un link: inquadrato con la fotocamera apre Equo e avvia la chat. Lo stesso codice serve alla tua scuderia (Equo Scuderia) e al tuo maniscalco per collegarti. Si accetta scritto in qualunque modo. Il codice viene creato la prima volta che apri questa voce.
Parole chiave: mio codice, codice personale, EQUOOWN, EQUO-OWN, qr personale, codice chat, condividere codice, invitare amico$t$
where categoria = 'guida' and ambito = 'proprietario' and titolo = 'Dove trovo il mio codice per chattare con altri proprietari';

-- 12) Scuderia: codici in qualunque forma (aggiunta alle schede esistenti)
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = regexp_replace(contenuto, E'\nParole chiave:', E'\nNota sui codici: si accettano scritti in qualunque modo (maiuscole o minuscole, con o senza trattini e spazi, O al posto di 0 e I o L al posto di 1); i nuovi codici sono senza trattini (es. EQUOPRO0FKEM, EQUOOWN3Q9NM, EQUO3F8A2).\nParole chiave:')
where categoria = 'guida' and ambito = 'scuderia'
  and titolo in ('Come collego un maniscalco con il codice EQUO-PRO', 'Dove vedo i dati del centro e il codice invito', 'Come collego un cavallo al suo proprietario che usa Equo App', 'Come entro nel team di un centro con il codice invito', 'Come avvio una chat con un cliente o proprietario')
  and contenuto not like '%Nota sui codici%';

-- ===================== SCHEDE NUOVE =====================

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'maniscalco', 'guida', 'Non seguo più un cavallo: «Non lo seguo più» e «Archivia»', $t$Dove: "Clienti" → cliente → "Modifica" → sezione "Cavalli" → icona accanto al cavallo
Passi:
1. Cavallo collegato al proprietario o alla scuderia (icona persona barrata): tocca l'icona, scrivi se vuoi il "Motivo (facoltativo)" e tocca "Invia la richiesta". Il proprietario o la scuderia ricevono un messaggio in chat e la richiesta nella loro Home.
2. Finché non rispondono il cavallo resta nella tua lista con "In attesa di conferma"; se ci ripensi tocca "Annulla richiesta".
3. Se confermano, il cavallo esce dalla tua lista e i tuoi appuntamenti ancora da fare per quel cavallo si annullano; se rifiutano, continui a seguirlo.
4. Cavallo inserito solo da te (icona scatola): tocca l'icona e "Archivia": esce dalla lista ma lo storico resta.
5. I cavalli archiviati sono in fondo, in "Cavalli archiviati (N)": tocca "Ripristina" per riaverli.
Esempio: Riccardo non segue più Rio: tocca «Non lo seguo più», scrive "il proprietario ha cambiato maniscalco" e invia; Simone conferma dalla Home e Rio esce dalla lista di Riccardo.
Note: I cavalli non si eliminano più: il database rifiuta l'eliminazione di un cavallo collegato. Lo storico (ferrature, pagamenti, foto) resta sempre. I cavalli archiviati o lasciati non compaiono nella ricerca, nell'indice dei cavalli e nei richiami.
Parole chiave: eliminare cavallo, togliere cavallo, non lo seguo più, non seguo più, archiviare cavallo, archivio, ripristinare, cestino, lasciare cavallo, cambio maniscalco$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where titolo = 'Non seguo più un cavallo: «Non lo seguo più» e «Archivia»');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'proprietario', 'guida', 'Il maniscalco chiede di non seguire più un mio cavallo', $t$Dove: "Home" → riquadro "Richieste del maniscalco" (e il messaggio in chat del maniscalco)
Passi:
1. Quando il maniscalco tocca «Non lo seguo più» ricevi in chat "🐴 Non seguirò più (cavallo)… Confermi?".
2. In Home trovi il riquadro "Richieste del maniscalco" con il nome del cavallo, del maniscalco e l'eventuale motivo.
3. Tocca "Conferma" se è d'accordo: il cavallo esce dalla sua lista e i suoi appuntamenti ancora da fare si annullano.
4. Tocca "Rifiuta" se vuoi che continui a seguirlo.
Esempio: Paolo non segue più Aurora perché Giulia ha cambiato zona: Giulia tocca "Conferma" e cerca un nuovo maniscalco.
Note: Il cavallo resta tuo e il suo storico non si cancella: lavori, pagamenti e libretto restano. Senza la tua conferma (o quella della scuderia dove sta) il maniscalco non può togliere il tuo cavallo.
Parole chiave: non lo seguo più, maniscalco lascia, richiesta maniscalco, conferma, rifiuta, cavallo tolto, cambio maniscalco$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where titolo = 'Il maniscalco chiede di non seguire più un mio cavallo');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'scuderia', 'guida', 'Un maniscalco chiede di non seguire più un cavallo del centro', $t$Dove: "Home" → riquadro "Richieste dei maniscalchi (N)" (e il messaggio nella chat con il maniscalco)
Passi:
1. Quando un maniscalco collegato tocca «Non lo seguo più» su un cavallo del centro arriva il messaggio in chat e la richiesta in Home.
2. Leggi cavallo, maniscalco e motivo.
3. Tocca "Conferma": il cavallo esce dalla lista del maniscalco e i suoi appuntamenti ancora da fare si annullano. Tocca "Rifiuta" per lasciarlo seguito.
Esempio: Il maniscalco non segue più Bombastik perché è passato a un collega: la segreteria conferma e assegna il nuovo maniscalco.
Note: Rispondono gli amministratori del centro (oppure il proprietario del cavallo, se è su Equo App). Lo storico del cavallo non si cancella.
Parole chiave: non lo seguo più, maniscalco lascia cavallo, richiesta maniscalco, conferma, rifiuta, cambio maniscalco$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where titolo = 'Un maniscalco chiede di non seguire più un cavallo del centro');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'maniscalco', 'guida', 'Profili certificati: cosa non posso modificare', $t$Dove: "Clienti" → cliente → "Modifica"; scheda del cavallo → "Anagrafica" → "Modifica"
Passi:
1. Un profilo creato dalla persona stessa (il proprietario che scarica Equo, una scuderia con Equo Scuderia) è certificato: nessun altro lo modifica.
2. Se il cliente è collegato a Equo, "Nome cliente" e "Tipo di cliente" sono bloccati e vengono dal suo profilo.
3. Per i cavalli del proprietario o della scuderia non cambi nome, razza, microchip, anno di nascita e mantello: li gestiscono loro.
4. Restano tuoi i dati del tuo lavoro: telefono, indirizzo, note, ferro, misura, intervallo, prezzo, altezza, peso, sesso, disciplina, segni particolari, appuntamenti.
Esempio: Simone è collegato a Equo come proprietario: Riccardo non può più trasformarlo in «scuderia» né cambiargli il nome.
Note: Le schede che crei tu per un cliente che non è ancora su Equo (non certe) le modifichi liberamente; quando il cliente si collega diventano certificate e si bloccano. Anche i cavalli che prepari tu restano modificabili finché il proprietario non li accetta.
Parole chiave: profilo certificato, non posso modificare, nome bloccato, tipo cliente bloccato, anagrafica bloccata, collegato a equo, dati del proprietario$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where titolo = 'Profili certificati: cosa non posso modificare');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'maniscalco', 'guida', 'Intervallo di ferratura e prezzo abituale del cavallo', $t$Dove: scheda del cavallo → sezione "Ferratura" (oppure "Ferratura" → "Modifica")
Passi:
1. Intervallo: nella sezione "Ferratura" usa − e + accanto a "Intervallo di ferratura: N giorni". Senza un valore vedi quello che Equo userebbe (es. "35 giorni (della struttura)").
2. In "Modifica" trovi anche i giorni rapidi 30 · 35 · 40 · 45 e "Togli".
3. Prezzo: tocca la riga "Prezzo abituale" e scrivi l'importo (in "Modifica" c'è il campo "Prezzo abituale (solo tuo, proposto quando segni fatto)").
4. Quando segni fatto un lavoro di quel cavallo, l'app propone quei giorni e quell'importo.
Esempio: Barney va ferrato ogni 40 giorni a 90 €: Francesco li imposta una volta e non li riscrive più.
Note: L'intervallo del cavallo vale prima di quello della struttura e dei richiami predefiniti. Cambiarlo non sposta la prossima data già fissata (per quella usa "Cambia data"). Il prezzo lo vedi solo tu, anche con gli incassi nascosti, e non compare mai al proprietario o alla scuderia; gli importi già registrati non cambiano.
Parole chiave: intervallo, ogni quanti giorni, giorni ferratura, prezzo, prezzo abituale, importo, tariffa, prezzo cavallo$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where titolo = 'Intervallo di ferratura e prezzo abituale del cavallo');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'maniscalco', 'guida', 'Scadenze della struttura: ferratura ogni N giorni e Allinea le scadenze', $t$Dove: "Clienti" → apri una struttura (scuderia) → riquadro "Scadenze della struttura"
Passi:
1. "Ferratura ogni": tocca "Imposta" e con − e + scegli i giorni. Da quel momento, quando segni fatto un cavallo di questa struttura, la prossima scadenza è tra quei giorni ("Togli" per tornare al normale).
2. "Allinea le scadenze dei cavalli": scegli la "Nuova scadenza per tutti", controlla l'elenco dei cavalli e tocca "Allinea".
3. Tutti i cavalli della struttura avranno la stessa prossima scadenza: in agenda la struttura compare una volta sola con tutti i cavalli.
Esempio: Francesco ferra tutti i cavalli del Centro Le Querce nella stessa visita ogni 35 giorni: imposta 35 e allinea le scadenze al 18 novembre.
Note: Un cavallo con il suo "Intervallo di ferratura" usa il suo. Le nuove date vanno anche nel libretto del proprietario e nella scheda della scuderia.
Parole chiave: struttura, scuderia, allinea scadenze, stessa data, ferratura ogni, intervallo struttura, giro scuderia, tutti i cavalli insieme$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where titolo = 'Scadenze della struttura: ferratura ogni N giorni e Allinea le scadenze');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'maniscalco', 'guida', 'Come cambio la data di una scadenza (Cambia data)', $t$Dove: Home → "Scadenze" → tocca il cavallo → "Cambia data (anticipa o posticipa)"; oppure scheda del cavallo → tocca "Prossima: (data)"
Passi:
1. Apri la scadenza del cavallo.
2. Tocca "Cambia data (anticipa o posticipa)".
3. Usa i tasti (es. −7 giorni, +14) o scegli la data.
4. Tocca "Salva la nuova data".
Esempio: Il proprietario di Aurora è in vacanza: Luca sposta la scadenza di 14 giorni.
Note: Si sposta la scadenza vera, avanti o indietro, mai nel passato. La nuova data va anche nel libretto del proprietario e nella scheda della scuderia. Dalla stessa finestra puoi "Fissa appuntamento", "Scrivi al cliente" o "Non serve più".
Parole chiave: cambia data, spostare scadenza, anticipare, posticipare, rimandare, prossima ferratura, scadenza$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where titolo = 'Come cambio la data di una scadenza (Cambia data)');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'maniscalco', 'guida', 'Anagrafica del cavallo: anno di nascita, altezza, peso, sesso, disciplina', $t$Dove: scheda del cavallo → sezione "Anagrafica" → "Modifica"
Passi:
1. Tocca "Modifica" nella sezione "Anagrafica": si apre la finestra del cavallo (non la scheda del cliente).
2. Cavalli inseriti da te: compili "Nome", "Microchip", "Razza", "Anno di nascita", "Mantello".
3. Per tutti i cavalli aggiungi "Altezza (cm)", "Peso (kg, stimato)", "Sesso" (Femmina, Castrone, Stallone), "Disciplina" e "Segni particolari".
4. Tocca "Salva".
Esempio: Alessandro segna per Brezza 158 cm, 480 kg, castrone, salto ostacoli.
Note: Tutti i campi sono facoltativi. Per i cavalli del proprietario o della scuderia nome, razza, nascita e mantello li gestiscono loro nella loro app: qui aggiungi i tuoi dati. Nella scheda l'età si calcola dall'anno di nascita.
Parole chiave: anagrafica, anno di nascita, età, altezza, peso, sesso, castrone, stallone, femmina, disciplina, segni particolari, mantello$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where titolo = 'Anagrafica del cavallo: anno di nascita, altezza, peso, sesso, disciplina');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'maniscalco', 'guida', 'Cambia proprietario di un cavallo in scuderia (chi paga)', $t$Dove: "Clienti" → apri la struttura → chip "Proprietari dei cavalli"; oppure scheda del cavallo → "Proprietario" → "Cambia"
Passi:
1. Scegli i cavalli ("Quali cavalli?"): puoi sceglierne più di uno insieme.
2. In "Nuovo proprietario (chi paga)" scegli un tuo cliente, un'altra scuderia o creane uno nuovo.
3. Se ci sono lavori già fatti e da saldare, l'app chiede chi li paga: il nuovo proprietario o la scuderia.
4. Tocca "Conferma".
Esempio: Al Centro Le Querce tre cavalli sono di Mario Rossi: Francesco li intesta a Mario, che da ora riceve i suoi conti.
Note: Il cavallo resta dove sta (nella scuderia, in "Qui stanno"): cambia solo chi paga. Gli appuntamenti futuri passano al nuovo proprietario. Un cavallo collegato al suo proprietario su Equo non si cambia da qui.
Parole chiave: cambia proprietario, intestare, chi paga, proprietario cavallo, scuderia, proprietari dei cavalli, pagante$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where titolo = 'Cambia proprietario di un cavallo in scuderia (chi paga)');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'maniscalco', 'guida', 'Resoconto PDF degli interventi', $t$Dove: "Clienti" → apri il cliente o la struttura → "Resoconto PDF"
Passi:
1. In una struttura scegli "Per chi": "Tutta la struttura (diviso per proprietario)" oppure un solo proprietario.
2. Scegli il "Periodo": "Questo mese", "Mese scorso", "Tutto" o "Scegli le date".
3. Controlla il riepilogo: interventi, totale, pagato, da pagare.
4. Tocca "Condividi il PDF (WhatsApp, email…)" oppure "Scarica il PDF".
Esempio: La scuderia chiede tutti i lavori di ottobre divisi per proprietario: Francesco sceglie "Mese scorso" e lo manda su WhatsApp.
Note: Il resoconto è diverso dal conto: elenca tutti gli interventi (pagati e da pagare), non prende un numero e non cambia lo stato dei pagamenti. Per un cliente proprietario non ancora su Equo ha in fondo il QR «Colleghiamoci su Equo». Non è una fattura.
Parole chiave: resoconto, riepilogo interventi, pdf, report, lavori del mese, elenco lavori, storico pagamenti$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where titolo = 'Resoconto PDF degli interventi');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'maniscalco', 'guida', 'Salvo la posizione attuale come indirizzo del cliente', $t$Dove: "Nuovo cliente" oppure cliente → "Modifica" → sotto "Indirizzo (per «Naviga»)" → "📍 Usa la mia posizione attuale"
Passi:
1. Quando sei sul posto tocca "📍 Usa la mia posizione attuale" e consenti la posizione.
2. Nel campo indirizzo compaiono la via e il comune (senza numero civico) con le coordinate tra parentesi.
3. Tocca "Salva modifiche".
Esempio: Il maneggio di campagna non ha un numero civico: Luca salva la posizione mentre è lì e la volta dopo «Naviga» lo porta al cancello.
Note: "Naviga", il meteo e "Sei arrivato" usano le coordinate esatte. Puoi correggere a mano il testo della via.
Parole chiave: posizione, gps, indirizzo, coordinate, naviga, dove si trova, maneggio senza indirizzo, salva posizione$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where titolo = 'Salvo la posizione attuale come indirizzo del cliente');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'proprietario', 'guida', 'Ho ricevuto un PDF con il QR «Colleghiamoci su Equo»', $t$Dove: in fondo al PDF che ti ha mandato il tuo professionista (appuntamento, conto o resoconto)
Passi:
1. Inquadra il QR con la fotocamera del telefono (o tocca il link se te l'ha mandato in chat).
2. Si apre Equo: crea il tuo account gratuito e scegli «Ho un cavallo».
3. Sei già collegato al professionista: in Home trovi i cavalli che ti ha preparato, da accettare.
Esempio: Marco riceve il conto di Luca con il QR: lo inquadra, crea l'account e vede subito Aurora con le sue ferrature.
Note: Se hai già Equo il collegamento parte appena apri il link. L'invito resta ricordato sul telefono per 30 giorni. In alternativa scrivi il "Codice invito" del PDF in Chat → "Il tuo maniscalco" → "+ Collega".
Parole chiave: qr pdf, colleghiamoci su equo, invito, collegarsi al maniscalco, codice invito, link, scaricare app$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where titolo = 'Ho ricevuto un PDF con il QR «Colleghiamoci su Equo»');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, attivo)
select 'tutti', 'guida', 'Come si scrivono i codici Equo', $t$Dove: ovunque si inserisce un codice (collegare un maniscalco, un cliente, una scuderia, un collega, un istruttore, una chat)
Passi:
1. Scrivi il codice come ti viene: maiuscole o minuscole, con o senza trattini e spazi.
2. Non preoccuparti di O e 0 o di I, L e 1: valgono uguale.
3. Tocca il pulsante per collegare.
Esempio: «equo pro ofkem», «EQUOPRO0FKEM» ed «EQUO-PRO-0FKEM» trovano tutti lo stesso maniscalco.
Note: I nuovi codici sono senza trattini e senza le lettere I, L e O: EQUOPRO… (maniscalco), EQUOTRA… (istruttore), EQUOMED… (veterinario), EQUOOWN… (proprietario), EQUO + 5 caratteri (invito di un cliente o codice di una struttura). I codici già dati con i trattini restano validi. I QR di Equo sono link: inquadrati con la fotocamera aprono Equo e collegano. Quando condividi un codice personale parte solo il codice con il link https://app.equohub.com.
Parole chiave: codice, codice non valido, codice non trovato, trattini, maiuscole, minuscole, zero, lettera o, formato codice, EQUOPRO, EQUOOWN, qr$t$, current_date, true
where not exists (select 1 from public.ai_conoscenze where titolo = 'Come si scrivono i codici Equo');

-- controllo: elenco delle schede toccate adesso (atteso: 11 schede aggiornate, 5 della scuderia con la nota sui codici, 13 schede nuove)
select ambito, titolo, aggiornato_il::date from public.ai_conoscenze where categoria = 'guida' and aggiornato_il > now() - interval '5 minutes' order by ambito, titolo;
