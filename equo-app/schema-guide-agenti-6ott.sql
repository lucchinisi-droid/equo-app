-- Equo: guide degli agenti AI aggiornate con le novità del 6 ottobre 2026
-- (scheda in chat ai maniscalchi, conferma per scollegare, P.IVA non obbligatoria, tasto indietro Android,
--  modifiche agli appuntamenti «prima → ora», avvisi alla struttura dove sta il cavallo)

-- 1) GUIDE ESISTENTI DA CORREGGERE -------------------------------------------------------------

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto =
'Dove: Agenda → tocca l''appuntamento → "Modifica"; oppure scheda cliente → "Storico interventi" → tocca la riga
Passi:
1. Apri l''appuntamento.
2. Tocca "Modifica": si apre "Modifica appuntamento".
3. Cambia i campi (cavallo, tipo, misura, data, ora, importo, pagamento, note).
4. Tocca "Salva modifiche".
Esempio: Marco chiede di spostare Aurora da giovedì a venerdì alle 8:30: Luca cambia data e ora; Marco riceve in chat "✏️ APPUNTAMENTO MODIFICATO" con "Data: gio → ven".
Note: Se cambi servizio (es. da ferratura a pareggio), data o ora di un appuntamento già fissato, chi è coinvolto riceve un messaggio "prima → ora". Il cliente su Equo vede "✏️ Modificato" e conferma con "Ok, ho visto"; finché non lo fa, in agenda vedi "Il cliente non l''ha ancora visto". Con una struttura Equo Scuderia l''appuntamento torna "In attesa della struttura" e va riconfermato. Se il cavallo del cliente sta in una struttura Equo Scuderia, anche la struttura riceve l''avviso. Il cliente non si può cambiare in modifica. Dal menu ⋯ c''è anche "Rimetti da fare" per un intervento segnato fatto per errore.
Parole chiave: modificare appuntamento, spostare, cambiare data, cambiare ora, cambiare servizio, pareggio, mezza ferratura, correggere, rinviare, posticipare, modificato, ok ho visto'
where titolo = 'Come modifico un appuntamento';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto =
'Dove: Agenda → richieste da confermare / tocca l''appuntamento
Passi:
1. Le richieste di una struttura compaiono tra le richieste da confermare come una sola riga con tutti i cavalli.
2. "Accetta" conferma tutti i cavalli; "Rifiuta" manda alla struttura un messaggio per un''altra data.
3. Per annullare un appuntamento confermato o proposto: toccalo → "Annulla con la struttura".
Esempio: Le Querce chiede ferrature per 3 cavalli venerdì: Luca accetta in un tocco.
Note: La struttura riceve sempre un avviso in chat. Se modifichi servizio, data o ora di un appuntamento con struttura, la struttura riceve "✏️ APPUNTAMENTO MODIFICATO" con prima → ora e deve riconfermare; in agenda vedi "✏️ Modificato · In attesa della struttura". Questi appuntamenti non si eliminano finché non sono fatti. Anche Hammer può accettare o rifiutare queste richieste.
Parole chiave: richiesta struttura, annullare con la struttura, conferma scuderia, gruppo cavalli, riconferma, modificato, cambio servizio'
where titolo = 'Come gestisco richieste e appuntamenti con le strutture';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto =
'Dove: "Clienti" → scheda della struttura → "Scollega da Equo Scuderia" (o "Annulla richiesta")
Passi:
1. Apri la scheda della struttura.
2. Tocca "Scollega da Equo Scuderia" (se la richiesta è ancora in attesa: "Annulla richiesta").
3. Si apre una finestra che spiega cosa succede: tocca "Chiudi collegamento" per confermare oppure "Annulla".
Esempio: Luca non lavora più con Le Querce e chiude il collegamento.
Note: Vedi "Collegamento chiuso. La scheda cliente resta tua": storico, interventi e messaggi restano nella tua lista; lo staff non vede più chat e appuntamenti. Chiuso per sbaglio? Scheda della struttura → "Collega a Equo Scuderia" → codice della struttura → la struttura accetta di nuovo.
Parole chiave: scollegare scuderia, chiudere collegamento, rimuovere struttura, annullare richiesta struttura, ricollegare, scollegato per sbaglio'
where titolo = 'Come scollego una struttura da Equo Scuderia';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto =
'Dove: "Clienti" → "STRUTTURE" → "Collega" (o scheda struttura → "Collega a Equo Scuderia")
Passi:
1. Chiedi alla struttura il suo codice (in Equo Scuderia: Il tuo Centro → Codice invito).
2. Tocca "Collega" e scrivi il "Codice della struttura".
3. Tocca "Invia richiesta".
4. Aspetta che la struttura accetti.
Esempio: Luca inserisce il codice del Centro Ippico Le Querce: vede "Richiesta inviata a Centro Ippico Le Querce: la struttura deve accettarla".
Note: Il collegamento funziona con doppia conferma. La P.IVA non è obbligatoria per collegarti: se manca, l''app consiglia di aggiungerla (menu profilo → Dati per i pagamenti) perché serve per il badge Equo Certified, e la struttura vede "P.IVA/CF mancante". Non inserire numeri inventati. Nell''attesa la struttura ha il badge "In attesa"; poi diventa "Equo Scuderia" e la chat compare in Messaggi → "Strutture". Partendo dalla scheda di una struttura esistente il collegamento usa quella scheda.
Parole chiave: collegare scuderia, equo scuderia, codice centro, codice struttura, collegamento struttura, maneggio collegato, partita iva, p.iva obbligatoria'
where titolo = 'Come collego una scuderia che usa Equo Scuderia';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto =
'Dove: menu "Professionisti" → "Maniscalchi" → "Appuntamenti"
Passi:
1. Gli appuntamenti proposti dal maniscalco hanno l''etichetta "Da confermare": tocca "Conferma".
2. Se il maniscalco ha cambiato servizio, data o ora, compare il riquadro giallo "✏️ Modificato dal maniscalco · da riconfermare" con la versione di prima barrata e quella nuova in grassetto: controlla e tocca "Conferma".
3. Per proporre un''altra data tocca "Modifica", scegli "Data" e "Ora" e tocca "Invia la nuova proposta".
4. Per annullare tocca "Annulla" e poi "Tocca ancora per annullare".
5. Gli appuntamenti passati o chiusi sono in "Storico".
Esempio: Luca cambia la ferratura di Ares in mezza ferratura: in chat arriva "✏️ APPUNTAMENTO MODIFICATO" e in Appuntamenti l''etichetta torna "Da confermare".
Note: ogni modifica deve essere confermata dall''altra parte, che riceve un avviso. Gli appuntamenti "Con il proprietario" sono fissati dal maniscalco direttamente con il proprietario di un cavallo del centro: si vedono ma non si confermano. Gli stati sono: Da confermare, In attesa del maniscalco, Confermato, Fatto, Annullato, Non disponibile, Con il proprietario.
Parole chiave: confermare appuntamento, spostare appuntamento, annullare appuntamento, altra data, da confermare, storico appuntamenti, modificato, cambio servizio, con il proprietario'
where titolo = 'Come confermo, sposto o annullo un appuntamento del maniscalco';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto =
'Dove: menu "Cavalli & Salute" → apri il cavallo → riquadro "Scheda cavallo (PDF + QR)"
Passi:
1. Tocca "Genera PDF" la prima volta (o "Aggiorna PDF" se hai cambiato dati o eventi).
2. Accanto trovi il QR: inquadrandolo con il telefono si apre sempre la versione aggiornata della scheda.
3. "Scarica PDF" salva il file sul computer o sul telefono.
4. "Invia in chat" apre la finestra: in "A chi" scegli tra "Clienti / proprietari", "Team" e "Maniscalchi collegati", scrivi un messaggio se vuoi e tocca "Invia PDF".
5. "Stampa" apre la stampa con le stampanti collegate al computer.
Esempio: il maniscalco Riccardo chiede la scheda di Ares: in "A chi" scegli "Riccardo · come maniscalco" (gruppo Maniscalchi collegati) e la scheda arriva nella chat Professionisti con lui.
Note: chi ha due ruoli compare due volte con "· come proprietario" o "· come maniscalco": la scheda arriva nella chat di quel ruolo. Il proprietario del cavallo è già proposto. Se la scheda non è aggiornata, Scarica / Invia / Stampa la rigenerano da soli. Il PDF ha la grafica Equo (logo, cornice verde e oro), foto del cavallo, dati, scadenzario con semaforo, storico eventi e QR.
Parole chiave: pdf, scheda cavallo, qr code, stampare, scaricare, inviare scheda, condividere, passaporto, documento cavallo, inviare al maniscalco, scheda non arriva'
where titolo = 'Come genero e condivido la scheda PDF con QR del cavallo';

-- 2) GUIDE NUOVE ---------------------------------------------------------------------------------

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, attivo, verificato_il)
select 'maniscalco', 'guida', 'Avvisi alla struttura dove sta il cavallo del cliente',
'Dove: succede da solo quando fissi, modifichi o annulli un appuntamento con un proprietario
Passi:
1. Il proprietario ha il cavallo in una struttura che usa Equo Scuderia (scheda collegata al proprietario, stesso microchip o nome).
2. Quando fissi, confermi, modifichi o annulli l''appuntamento, la struttura riceve un avviso: "🔨 Maniscalco in arrivo: …", "✏️ … MODIFICATO" o "❌ Annullato: …".
3. Se sei collegato a quella struttura l''avviso arriva nella vostra chat; altrimenti arriva nella chat della struttura con il proprietario.
4. Quando segni il lavoro "Fatto", l''intervento finisce anche nella scheda sanitaria del cavallo in Equo Scuderia.
Esempio: Simone chiede un pareggio per Rio, che sta alla Scuderia Colleferro; Riccardo lo fissa per lunedì e la scuderia riceve "Maniscalco in arrivo: Pareggio per Rio — lun 12 ott".
Note: La struttura vede questi appuntamenti in Professionisti → Appuntamenti con l''etichetta "Con il proprietario", solo da leggere: la conferma resta tra te e il proprietario.
Parole chiave: struttura avvisata, scuderia, maneggio, cavallo in pensione, avviso centro, tre fronti, proprietario e scuderia'
, true, current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Avvisi alla struttura dove sta il cavallo del cliente');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, attivo, verificato_il)
select 'proprietario', 'guida', 'Il maniscalco ha modificato un appuntamento: Ok, ho visto',
'Dove: chat con il maniscalco; Home → "Prossime scadenze"; Messaggi → maniscalco → Appuntamenti
Passi:
1. Arriva in chat "✏️ APPUNTAMENTO MODIFICATO" con cosa è cambiato (es. "Servizio: Ferratura → Pareggio", "Data: sab 10 ott → lun 12 ott").
2. Nell''appuntamento e nel widget "Prossime scadenze" compare "✏️ Modificato · prima era: …".
3. Se ti va bene tocca "Ok, ho visto": l''avviso sparisce e il maniscalco legge in chat che l''hai visto.
4. Se non ti va bene scrivigli in chat.
Esempio: Riccardo cambia la ferratura di Rio in pareggio: Sara vede il riquadro giallo e tocca "Ok, ho visto".
Note: L''appuntamento resta fissato anche se non tocchi "Ok, ho visto". Se il cavallo sta in una struttura Equo Scuderia, anche la struttura riceve l''avviso.
Parole chiave: appuntamento modificato, cambiato, spostato, ok ho visto, confermare modifica, maniscalco ha cambiato, pareggio, data cambiata'
, true, current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Il maniscalco ha modificato un appuntamento: Ok, ho visto');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, attivo, verificato_il)
select 'proprietario', 'guida', 'La mia scuderia sa degli appuntamenti con il maniscalco?',
'Dove: succede da solo
Passi:
1. Se il tuo cavallo sta in una struttura che usa Equo Scuderia ed è collegato a te (stesso microchip o nome), la struttura riceve un avviso quando il maniscalco fissa, modifica o annulla un appuntamento per quel cavallo.
2. L''avviso arriva nella chat della struttura con il maniscalco (se sono collegati) o nella tua chat con la struttura come "ℹ️ Avviso automatico di Equo".
3. Quando il maniscalco segna il lavoro fatto, l''intervento compare anche nella scheda del cavallo in scuderia.
Esempio: Sara chiede una ferratura per Rio a Riccardo; Riccardo la fissa per domani e la Scuderia Colleferro riceve "Maniscalco in arrivo: Ferratura per Rio".
Note: Se la struttura non riceve gli avvisi, controlla che il cavallo sia collegato a te nella scuderia (stesso microchip) e che tu sia membro del centro.
Parole chiave: scuderia avvisata, maneggio, struttura, pensione, centro ippico, avvisare la scuderia, tre fronti'
, true, current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'La mia scuderia sa degli appuntamenti con il maniscalco?');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, attivo, verificato_il)
select 'scuderia', 'guida', 'Appuntamenti del maniscalco con i proprietari dei cavalli del centro',
'Dove: chat Professionisti con il maniscalco (o chat con il proprietario) e Professionisti → Maniscalchi → "Appuntamenti"
Passi:
1. Quando un maniscalco fissa, modifica o annulla un appuntamento direttamente con il proprietario di un cavallo del centro, ricevi un avviso ("🔨 Maniscalco in arrivo", "✏️ MODIFICATO", "❌ Annullato").
2. In "Appuntamenti" questi compaiono con l''etichetta "Con il proprietario" e il nome del proprietario: sono solo da leggere.
3. Quando il lavoro è fatto, l''intervento viene registrato nella scheda sanitaria del cavallo.
Esempio: Simone chiede un pareggio per Rio a Riccardo: la Scuderia Colleferro riceve "Maniscalco in arrivo: Pareggio per Rio — lun 12 ott" e lo vede negli appuntamenti di Riccardo.
Note: Funziona per i cavalli collegati al proprietario (Cavalli & Salute → cavallo → proprietario collegato) con stesso microchip o nome. Se il maniscalco non è collegato al centro, l''avviso arriva nella chat con il proprietario.
Parole chiave: maniscalco proprietario, appuntamento privato, con il proprietario, avviso maniscalco in arrivo, ferratura cavallo cliente'
, true, current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Appuntamenti del maniscalco con i proprietari dei cavalli del centro');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, attivo, verificato_il)
select a.ambito, 'guida', a.titolo,
'Dove: tasto o gesto "indietro" del telefono Android
Passi:
1. Se è aperta una finestra o una chat, "indietro" la chiude.
2. Se sei dentro una scheda o in un''altra pagina, "indietro" torna all''elenco o alla Home.
3. In Home compare "Premi di nuovo indietro per uscire": l''app si chiude solo con un secondo "indietro" entro pochi secondi.
Esempio: Luca tocca per sbaglio la freccia del telefono mentre è nella Home: vede l''avviso e l''app resta aperta.
Note: Vale solo su Android. Su iPhone e computer non cambia niente.
Parole chiave: tasto indietro, freccia, esce dall''app, chiude l''app, uscita involontaria, android, doppio indietro'
, true, current_date
from (values ('maniscalco', 'Tasto indietro di Android'), ('proprietario', 'Tasto indietro di Android (proprietario)'), ('scuderia', 'Tasto indietro di Android (Scuderia)')) a(ambito, titolo)
where not exists (select 1 from public.ai_conoscenze x where x.titolo = a.titolo);

-- controllo finale: deve dare 6 e 7
select (select count(*) from ai_conoscenze where categoria = 'guida' and aggiornato_il::date = current_date and titolo in (
          'Come modifico un appuntamento','Come gestisco richieste e appuntamenti con le strutture','Come scollego una struttura da Equo Scuderia',
          'Come collego una scuderia che usa Equo Scuderia','Come confermo, sposto o annullo un appuntamento del maniscalco',
          'Come genero e condivido la scheda PDF con QR del cavallo')) as guide_aggiornate,
       (select count(*) from ai_conoscenze where categoria = 'guida' and titolo in (
          'Avvisi alla struttura dove sta il cavallo del cliente','Il maniscalco ha modificato un appuntamento: Ok, ho visto',
          'La mia scuderia sa degli appuntamenti con il maniscalco?','Appuntamenti del maniscalco con i proprietari dei cavalli del centro',
          'Tasto indietro di Android','Tasto indietro di Android (proprietario)','Tasto indietro di Android (Scuderia)')) as guide_nuove;
