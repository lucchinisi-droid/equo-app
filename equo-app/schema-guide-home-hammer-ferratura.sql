-- Equo: GUIDE DEGLI ASSISTENTI · nuova Home del maniscalco, pannello di Hammer, ferratura nel libretto, Semplice/Completa (12 ottobre 2026)
-- Va eseguito DOPO schema-ferratura-libretto.sql e schema-home-banner.sql. Solo testi (tabella ai_conoscenze).

-- 1. guide riscritte
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  titolo = 'Ferratura del cavallo: Ferrato, Mezza o Pareggio, misura e tipo di ferro',
  contenuto = 'Dove: scheda del cavallo → sezione "Ferratura" → "Modifica" (Clienti → cliente → box del cavallo, oppure la cartella Cavalli); anche dal nuovo appuntamento con "Modifica" sotto il nome del cavallo
Passi:
1. "Che lavoro ha": Ferrato (4 ferri), Mezza (2 davanti) o Pareggio (senza ferri).
2. Misura del ferro con − e +, e il sistema (italiana, olandese/internazionale, tedesca).
3. Tipo di ferro: Standard o Correttivo. Nella versione Completa, con 4 ferri, lo scegli separato per davanti e dietro (es. correttivi davanti e normali dietro).
4. Note: modello o lavorazione (es. barra a uovo davanti). Tocca "Salva".
Esempio: Stella ha solo gli anteriori ferrati: Luca sceglie "Mezza"; quando fissa un appuntamento per lei, Equo registra "Mezza ferratura" con 2 ferri senza chiedere altro.
Note: Si imposta una volta e vale per tutti gli appuntamenti. Ogni cambio resta nello storico del cavallo, a vita. Lavoro e tipo di ferro vanno anche nel libretto del proprietario e nella scheda della scuderia; "ferri nuovi/rimessa" resta solo tuo. Un correttivo non diventa mezza ferratura da solo: lo cambi tu dalla scheda.
Parole chiave: mezza ferratura, ferratura completa, pareggio, anteriori, davanti, dietro, ferro correttivo, ferro ortopedico, ferro standard, tipo di ferro, misura ferro, libretto del cavallo'
where ambito = 'maniscalco' and categoria = 'guida' and titolo in ('Ferratura completa o mezza e tipo di ferro del cavallo', 'Ferratura del cavallo: Ferrato, Mezza o Pareggio, misura e tipo di ferro');

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = 'Dove: Home → "+" in basso a destra → "Appuntamento" (oppure Agenda → "+ Nuovo appuntamento", o dalla scheda del cavallo "+ Intervento")
Passi:
1. Scegli il cliente (o "+ Nuovo cliente").
2. Spunta uno o più cavalli. Sotto ogni cavallo leggi il suo lavoro dalla scheda (es. "Ferrato · 4 ferri n. 2 IT · standard"); se è cambiato tocca "Modifica".
3. Quando: "Oggi", "Domani" o "Scegli giorno", e l''ora se vuoi.
4. Note facoltative e "Salva appuntamento".
Esempio: Luca sceglie Marco Rossi, spunta Aurora (Ferrato) e Tornado (Pareggio), tocca "Domani" alle 9: Equo crea una ferratura con 4 ferri e un pareggio, e Marco riceve un solo messaggio.
Note: Il tipo di lavoro, la misura e il numero di ferri arrivano dalla scheda del cavallo: non si scelgono più nell''appuntamento. Senza cavallo, o per un cavallo nuovo, scegli tu il lavoro. Nella versione Completa c''è anche "Lavoro: Come da scheda / Straordinario". Se non metti il prezzo Equo te lo chiede proponendo l''ultimo.
Parole chiave: nuovo appuntamento, fissare appuntamento, prenotare ferratura, aggiungere intervento, agenda, più cavalli, oggi, domani'
where ambito = 'maniscalco' and categoria = 'guida' and titolo = 'Come aggiungo un nuovo appuntamento';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = 'Dove: Agenda o Home → appuntamento → "Segna come fatto" (o "Fatto")
Passi:
1. Si apre un solo riquadro: la prossima data (proposta come l''ultima volta per quel cavallo; "CAMBIA" per sceglierla).
2. Importo con € già scritto (il prezzo dell''ultima volta) e accanto "Saldato" o "Da saldare".
3. Versione Completa: spunta "Ferri nuovi utilizzati" e compare il numero, già a 4 o 2; senza spunta è una rimessa.
4. Tocca "OK".
Esempio: Luca ha rimesso un ferro perso ad Aurora senza farsi pagare: scrive 0 €; Equo capisce che non è la ferratura del ciclo e la prossima data resta quella di prima ("Come prima").
Note: Con più cavalli insieme c''è un importo per ogni cavallo e il totale. I ferri nuovi li vedi solo tu. Se gli incassi sono nascosti con il PIN, importo e pagamento non compaiono.
Parole chiave: segnare fatto, ferratura fatta, chiudere appuntamento, importo, saldato, da saldare, ferri nuovi, rimessa, prossima ferratura, come prima'
where ambito = 'maniscalco' and categoria = 'guida' and titolo = 'Come segno una ferratura fatta';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = 'Dove: scheda del cavallo → "Ferratura" (il numero di ferri dipende dal lavoro) · al "Fatto" nella versione Completa
Passi:
1. Il numero di ferri lo sa già la scheda del cavallo: Ferrato = 4, Mezza = 2, Pareggio = nessuno.
2. Versione Completa: quando segni "Fatto" spunta "Ferri nuovi utilizzati" e correggi il numero con − e + (es. 3 nuovi su 4).
Esempio: Aurora è a mezza ferratura: ogni appuntamento parte da 2 ferri senza che Luca li scriva.
Note: Senza la spunta il lavoro è una rimessa (ferri riutilizzati). I dati sui ferri servono per le statistiche del consumo e li vedi solo tu.
Parole chiave: quanti ferri, numero ferri, ferri nuovi, rimessa, consumo ferri'
where ambito = 'maniscalco' and categoria = 'guida' and titolo = 'Come indico quanti ferri ho messo';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = 'Dove: scheda del cavallo → "Ferratura" → "Modifica" → "Misura del ferro"
Passi:
1. Scegli il sistema: italiana, olandese/internazionale o tedesca.
2. Con − e + porti la misura a quella giusta (cambiando sistema resta la misura equivalente).
3. Tocca "Salva".
Esempio: Brezza porta il n. 2 italiano: Luca lo imposta una volta e tutti i suoi appuntamenti lo usano.
Note: La misura vale per tutti gli appuntamenti del cavallo e ogni cambio resta nello storico. Un lavoro già fatto conserva la misura usata quel giorno.
Parole chiave: misura ferro, numero ferro, taglia ferro, sistema italiano, olandese, tedesco, ferro standard'
where ambito = 'maniscalco' and categoria = 'guida' and titolo = 'Come inserisco la misura del ferro';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = 'Dove: nuovo appuntamento (il lavoro arriva dalla scheda del cavallo)
Passi:
1. Ferratura completa (Ferrato, 4 ferri), Mezza ferratura (2 davanti) e Pareggio: li decide la scheda del cavallo.
2. Senza cavallo indicato scegli tu: Ferratura, Mezza ferratura, Pareggio o Altro (con la descrizione).
3. Versione Completa: "Straordinario" per i lavori fuori ciclo (ferro perso o rimesso con quale piede, ferri tolti per lastre o riposo, pareggio su cavallo ferrato, correttivo provvisorio, urgenza o con il veterinario, altro).
Esempio: Luca rimette il ferro anteriore sinistro ad Aurora: "Straordinario" → "Ferro perso / rimesso" → "Anteriore sx".
Note: Gli straordinari restano nello storico e nel libretto ma non spostano la prossima ferratura e non cambiano la scheda. Nella versione Semplice basta un appuntamento a 0 € con una nota.
Parole chiave: tipi di intervento, ferratura, mezza ferratura, pareggio, altro, straordinario, ferro perso'
where ambito = 'maniscalco' and categoria = 'guida' and titolo = 'Quali tipi di intervento posso registrare';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = 'Dove: barra in basso → "Home"
Passi:
1. In alto il saluto e il meteo di oggi: toccalo per la settimana.
2. Il banner scorre da solo: un nostro messaggio, gli appuntamenti di oggi (tocca per l''agenda) e l''invito a provare Hammer.
3. Cinque tasti rotondi: "Portami da…" (le tappe di oggi, tocca e si apre il navigatore), "Scadenze" (cavalli da richiamare, il numero rosso sono quelli in ritardo o entro 7 giorni), "Da incassare", "Cerca", "Altro".
4. Le righe Cavalli, Clienti, Scuderie e Incassi aprono le loro sezioni.
5. In basso a sinistra i Messaggi con i non letti; a destra il "+" per aggiungere appuntamento, intervento già fatto, cavallo, cliente, scuderia o incasso.
Esempio: Luca alle 8 tocca "Portami da…": in alto la prima tappa del giro, "Vai" apre le mappe.
Note: Il menu in basso è Home · Agenda · Hammer · Clienti · Cavalli; Hammer è il tasto verde al centro con il bordo oro, che si illumina quando ha un riepilogo o un avviso. Se gli incassi sono nascosti con il PIN, "Da incassare", "Incasso" e la riga Incassi spariscono.
Parole chiave: home, schermata iniziale, banner, portami da, scadenze, da incassare, altro, messaggi, più, menu in basso'
where ambito = 'maniscalco' and categoria = 'guida' and titolo = 'Cosa vedo nella Home del maniscalco';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = 'Dove: menu profilo (tocca la tua iniziale in alto a destra) → "Home"
Passi:
1. Il maniscalco ha la nuova Home con banner, tasti rotondi e righe: non c''è più la scelta tra widget e vista standard.
2. Veterinari, istruttori e proprietari possono scegliere ancora "Vista Widget" (spenta = Home classica).
Esempio: Luca apre l''app e trova subito "Portami da…" e le scadenze in Home.
Note: Nel menu profilo il maniscalco trova invece "Versione Completa" per passare dalla Semplice alla Completa.
Parole chiave: home widget, vista standard, home classica, cambiare home'
where ambito = 'maniscalco' and categoria = 'guida' and titolo = 'Home a widget o vista standard';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = 'Dove: tasto verde "Hammer" al centro del menu in basso
Passi:
1. Tocca "Hammer": si apre il pannello. Se stai guardando la scheda di un cavallo o di un cliente compare "Stai guardando …" e Hammer usa quei dati (la × li toglie).
2. Avvii rapidi: "Chiedi a Hammer", "Analizza una foto", "Consulta un caso", "Riassumi lo storico" (solo dalla scheda di un cavallo).
3. Oppure scrivi la domanda o allega una foto o un PDF con la graffetta.
Esempio: dalla scheda di Aurora Luca tocca "Riassumi lo storico" e Hammer gli scrive ritmo dei lavori, ferri e cosa guardare alla prossima visita.
Note: Hammer conosce tecnica di mascalcia, prodotti dei siti di settore e il tuo lavoro (agenda, scadenze, incassi) e prepara schede da confermare. Il bordo oro si illumina quando ha un riepilogo o un avviso. Non sostituisce il veterinario.
Parole chiave: Hammer, assistente, aprire Hammer, tasto centrale, pannello, stai guardando, riassumi storico'
where ambito = 'maniscalco' and categoria = 'guida' and titolo = 'Cos''è Hammer e come lo apro';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = 'Dove: pannello di Hammer (il contatore è sotto la chat)
Passi:
1. Piano Free: 5 messaggi al giorno, ripartono a mezzanotte. Un''analisi foto guidata ("Analizza una foto") vale 3 messaggi.
2. Premium: 500 messaggi al mese; l''analisi foto vale 1 messaggio.
3. Finiti i messaggi compare il riquadro con "Passa a Premium" e "Acquista crediti Hammer".
Esempio: Luca ha già mandato 3 messaggi oggi: per un''analisi foto gliene servono 3, quindi Hammer gli propone Premium o i crediti.
Note: I crediti Hammer (pacchetti di messaggi in più) sono in arrivo. Se la risposta non arriva per un problema del servizio, il messaggio non viene contato.
Parole chiave: quanti messaggi, limite Hammer, messaggi finiti, crediti Hammer, analisi foto 3 messaggi, premium'
where ambito = 'maniscalco' and categoria = 'guida' and titolo = 'Quanti messaggi posso mandare a Hammer';

-- 2. guide nuove
insert into public.ai_conoscenze (ambito, categoria, attivo, titolo, contenuto, aggiornato_il, verificato_il)
select a, 'guida', true, t, c, now(), current_date from (values
('maniscalco', 'Versione Semplice o Completa dell''app',
'Dove: al primo accesso il riquadro "Come vuoi usare Equo?"; poi menu profilo → "Versione Completa" (interruttore) oppure Home → "Altro" → "Passa alla Completa / Semplice"
Passi:
1. Semplice: agenda, clienti, cavalli e soldi con pochi tasti grandi.
2. Completa: in più le statistiche degli incassi, "Ferri nuovi utilizzati" al Fatto, il ferro diverso davanti e dietro e gli interventi straordinari.
3. Cambi quando vuoi: i dati restano gli stessi.
Esempio: Luca parte con la Semplice; dopo un mese accende la Completa per vedere quanti ferri consuma.
Note: Alcune parti della Completa (le statistiche degli incassi) restano Premium.
Parole chiave: versione semplice, versione completa, cambiare versione, app semplice, più funzioni, statistiche'),
('maniscalco', 'Interventi straordinari (ferro perso, ferri tolti, urgenza)',
'Dove: versione Completa → nuovo appuntamento → "Lavoro: Straordinario ▸" (anche dalla scheda del cavallo → "Straordinario")
Passi:
1. Scegli il cavallo.
2. Tocca "Straordinario" e il caso: Ferro perso / rimesso (poi quale piede: anteriore o posteriore, sinistro o destro), Ferri tolti (lastre, riposo), Pareggio su cavallo ferrato, Correttivo provvisorio, Urgenza / con il veterinario, Altro (lo scrivi tu).
3. Giorno, note e "Salva"; al Fatto metti l''importo (anche 0 €).
Esempio: Brezza ha perso il ferro posteriore destro: Luca registra "Ferro perso / rimesso · posteriore dx" a 0 €.
Note: Non sposta la prossima ferratura e non cambia la scheda del cavallo; resta nello storico e nel libretto. Nella versione Semplice si fa con un appuntamento a 0 € e una nota: la prossima data resta "come prima".
Parole chiave: straordinario, ferro perso, rimettere ferro, ferri tolti, lastre, urgenza, veterinario, fuori ciclo, zero euro'),
('maniscalco', 'Come analizzo una foto con Hammer',
'Dove: tasto "Hammer" → "Analizza una foto" (meglio dalla scheda del cavallo, così l''analisi si collega a lui)
Passi:
1. Scegli cosa fotografi: Laterale, Frontale, Suola o Lastra; la guida tratteggiata oro ti dice come inquadrare.
2. "Scatta" o "Dalla galleria", aggiungi una nota se serve e tocca "Analizza".
3. Il risultato: Cosa si vede, Da controllare, Cosa fare, Limiti e l''affidabilità (alta, media, bassa).
4. Scegli: "Scarica PDF" (resta solo sul tuo telefono), "Condividi nel libretto" del cavallo (diventa un allegato visibile al proprietario collegato e alla scuderia) oppure "Elimina".
Esempio: Luca fotografa di lato lo zoccolo di Aurora: affidabilità media, Hammer suggerisce di rifare lo scatto a terra e di accorciare la punta.
Note: È una valutazione indicativa, non una diagnosi: la decisione resta tua e per zoppie o infezioni serve il veterinario. Nel Free vale 3 messaggi, con Premium 1.
Parole chiave: analisi foto, foto zoccolo, radiografia, lastra, valutazione, affidabilità, PDF analisi, condividi libretto'),
('maniscalco', 'Consulta un caso con Hammer',
'Dove: tasto "Hammer" → "Consulta un caso"
Passi:
1. Hammer fa una domanda alla volta (disciplina, problema, da quanto, cosa hai già provato, ferro attuale).
2. Rispondi scrivendo o toccando una delle risposte pronte sotto il messaggio.
3. Dopo poche domande ti dà il parere: ipotesi, pareggio e ferro, cosa controllare, quando chiamare il veterinario. "Fine" chiude il consulto.
Esempio: dalla scheda di Tornado Luca apre "Consulta un caso": Hammer sa già che è a pareggio e chiede da quanto zoppica.
Note: Se apri il consulto dalla scheda di un cavallo, Hammer usa la sua ferratura e il suo storico.
Parole chiave: consulto, caso clinico, parere, zoppia, domande, risposte pronte')
) v(a, t, c)
where not exists (select 1 from public.ai_conoscenze x where x.titolo = v.t and x.ambito = v.a and x.categoria = 'guida');

-- controllo: deve dare 4 · 10
select (select count(*) from ai_conoscenze where categoria = 'guida' and ambito = 'maniscalco' and titolo in ('Versione Semplice o Completa dell''app', 'Interventi straordinari (ferro perso, ferri tolti, urgenza)', 'Come analizzo una foto con Hammer', 'Consulta un caso con Hammer')) as guide_nuove,
       (select count(*) from ai_conoscenze where categoria = 'guida' and ambito = 'maniscalco' and verificato_il = current_date and titolo in ('Ferratura del cavallo: Ferrato, Mezza o Pareggio, misura e tipo di ferro', 'Come aggiungo un nuovo appuntamento', 'Come segno una ferratura fatta', 'Come indico quanti ferri ho messo', 'Come inserisco la misura del ferro', 'Quali tipi di intervento posso registrare', 'Cosa vedo nella Home del maniscalco', 'Home a widget o vista standard', 'Cos''è Hammer e come lo apro', 'Quanti messaggi posso mandare a Hammer')) as guide_aggiornate;
