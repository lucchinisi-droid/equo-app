## ✅ 16/10/2026 notte (2) — Collegamenti Trainer FATTI in locale
- `equo-app/schema-trainer-collegamenti.sql`: consenso del proprietario (richiesta/invito con codice TR-…, accetta/rifiuta/revoca), codice trainer, struttura (entra con join_centro_by_code, segue cavalli del centro, il centro vede le sedute inviate sui suoi cavalli), destinatari all'invio (proprietario collegato + allievi/staff del centro), guide AI. Provato su Postgres locale con 6 utenti.
- App: Cavalli seguiti con stati/inviti/strutture/codice, scelta destinatari all'invio, lato proprietario «I miei istruttori» (menù «+») + card richieste in Home.
- DA FARE: notifica push/email al proprietario quando arriva una richiesta; toggle visibilità sedute per il centro; passaggio di proprietà del cavallo (sedute già condivise restano al vecchio proprietario); lato Scuderia: vista delle sedute del centro (ora le vede solo l'app via RLS); prova con account reali.
## ✅ 16/10/2026 notte — App Trainer + Ares FATTI in locale (in attesa di SQL + deploy)
- SQL: `equo-app/schema-trainer-sedute.sql` (sedute, media, annotazioni, condivisioni, commenti, trainer_cavalli, RLS, limiti 10 cavalli / 10 slot / video 60 s, bucket `sedute-media`) e `schema-ares-trainer-guide.sql` (ambito 'istruttore' + 5 guide Trainer). Provati su Postgres locale.
- UI Trainer in `equo-app/index.html` (`tr-js`, `ares-js`): Home, Sedute, Cavalli seguiti, editor con Punto/Voce/Lente/Lavagna/Rallenta, invio, risposta del proprietario.
- Ares: `prompt-agenti/ares-system-prompt.txt` + `ISTRUZIONI_ARES`/`STRUMENTI_ARES` in `netlify/functions/agent.js` (le_mie_sedute, dettaglio_seduta, cavalli_seguiti, guida, memoria, meteo). Chat aperta dal disco della barra.
- DA FARE su Ares: schede `ai_conoscenze` verificate con fonte (allenamento/equitazione/biomeccanica: nessuna scritta, per ora risponde «indicazione generale»); FASE 1 comandi che propongono annotazioni con anteprima/annulla; fasi 2-5 (trascrizione audio, highlights, suggerimenti dal video, export mp4); add-on Ares in Scuderia.
- DA PROVARE con account reale: registrazione istruttore vs `profiles_ruoli_guard`, storage/RLS di `sedute-media`, invio e risposta tra due account, Ares via Netlify.

## ✅ 16/10/2026 sera — FATTO in locale (non in produzione, in attesa di SQL + deploy)
- Menù pillola + «+»: proprietario, maniscalco (Hammer), veterinario (Galeno) e istruttore (Ares) in `equo-app`; Scuderia mobile con Athena al centro + «+» + card Athena nella sidebar desktop + pagina Agenti AI con icone nuove (`equo-scuderia`). «Comunicazioni & Chat» → «Messaggi».
- Home proprietario v3: storie 5 (VUOTO), Prenotazioni | Ultimo messaggio, Scheda/Spese, Prossime scadenze chiusa, Chat preferite (localStorage `equo-chat-pref-<id>`), Da Equo in basso, meteo a pastiglia; bug foto → blob.
- Istruttori: registrazione diretta (`chooseMainRole('istruttore')` e `confirmAddSecondaryRole`). Veterinario: resta la candidatura.
- Libretto a 3 schede (Identità/Salute/Sport) + SQL `schema-libretto-identita-salute-sport.sql`; guide AI `schema-guide-menu-libretto-16ott.sql`; `novita.json` aggiornati.
## ⏳ ANCORA DA FARE (dopo questo giro)
- **ARES / app Trainer** (checklist URGENTE in cima): tabelle sedute*, editor video, prompt, agent.js, limiti 10 cavalli / 10 slot / video 60 s: NON iniziati.
- Menù: schermo largo → barra in colonna a sinistra (proprietario); toni di colore per pagina in Scuderia; mockup «Agenti AI» già fatto ma Ermes resta «presto disponibile».
- Libretto: PDF Premium; interruttori per singolo professionista (ora c'è un interruttore unico `_tutti`); notifica agli utenti collegati sul cambio microchip; il libretto non segue ancora automaticamente il cambio proprietario; foto di riconoscimento solo proprietario (i professionisti non le vedono ancora).
- Il «+» in Libretto copre i bottoni «+ Foto»/«+ Evento» in alto a destra: valutare di nasconderlo nella scheda cavallo.
# 🔴 URGENTE · Costruzione di ARES (deciso 16/10)
Agente personal trainer / istruttore + assistente editor video dell'app Trainer. Incluso nel Premium trainer (limite messaggi Free 5 / Premium 500); in Scuderia add-on a pagamento. Icona ricevuta (disco centrale barra Trainer).
- [ ] Scheda agente `prompt-agenti/ares-system-prompt.txt` (persona, tono, regole comuni: mai dosi, emergenze → veterinario, azioni sempre con conferma, nessun giudizio su salute/benessere del cavallo)
- [ ] Configurazione in `netlify/functions/agent.js` (nuova vista Trainer, limiti Free/Premium, prompt caching, memoria `salva_memoria`)
- [ ] Schede di conoscenza verificate con fonte (`ai_conoscenze`: allenamento, equitazione, biomeccanica base) + guida app Trainer (categoria 'guida')
- [ ] Strumenti: sedute, punti/annotazioni, cavalli seguiti, agenda; FASE 1 comandi in chat → annotazioni con anteprima/annulla (mai condivide da solo)
- [ ] Tabelle: sedute, sedute_media, sedute_annotazioni, sedute_condivisioni (+ cavalli_sport, sport_voci per il libretto Sport)
- [ ] UI: disco Ares al centro barra Trainer + chat Ares; agenti AI in Scuderia (add-on)
- [ ] Fasi successive: 2 trascrizione note audio + riassunto + bozza messaggio · 3 highlights come elenco intervalli · 4 suggerimenti dal video («da confermare») · 5 export mp4 (server, dopo)
- [ ] Dipendenze da decidere: app Trainer (Editor, sedute, Free 10 slot video non cancellabili, video max 60 s), limite cavalli trainer = 10

## 🟡 16/10/2026 — STILE: vetro dove ha senso + tono colore per pagina
- Regola aggiornata: un po' di vetro dove c'è foto/sfumatura dietro (barra pillola, testate su foto, sheet); fallback pieno; mai nei PDF.
- Tono per pagina: da più chiaro (Home) a più scuro (ultima voce barra). Versione prudente (sfondo/testata, carte crema) o completa (testi chiari nelle pagine scure). Da decidere dopo il menù.

## 🟡 16/10/2026 — MENÙ A PILLOLA SOSPESA (stile Revolut, da decidere app per app)
- Barra staccata dal bordo, arrotondata, 5-6 icone, voce attiva con cuscinetto; colori Equo pieni (NO vetro). Su schermo largo → colonna a sinistra.
- Proposta: AI sempre dentro la barra (Pegasus / Hammer / Ares / Athena); proprietario: Home · Diario · Libretto · Chat · Calendario · Pegasus (niente «+»); maniscalco: Home · Agenda · Clienti · Messaggi · Incassi · Hammer; trainer: Home · Sedute · Agenda · Chat · Ares; Scuderia da decidere.
- 16/10 PROPRIETARIO scelto da Simone: Home · Diario · Libretto · Chat · Calendario · 6ª voce «Altro» (o «+»/«…») con Pegasus e le voci mancanti. Proposta: Altro = Pegasus in cima, Spese, I miei cavalli, Servizi vicino a te, Partner, Aiuto; avatar = solo account; badge su Altro per Pegasus; «+» tolto. Da confermare.
- 16/10 Principio: proprietario → Pegasus discreto dentro «Altro» (costi AI); professionisti → AI AL CENTRO della barra (Hammer, Ares). MANISCALCO proposta: Home · Agenda · [Hammer] · Chat · Clienti; Incassi in Home; Cavalli/Scuderie cartelle in Clienti; «+» vetro sopra la barra. Da decidere.
- 16/10 MANISCALCO DECISO: Home · Agenda · [Hammer] · Chat · Clienti + tasto «+» in basso a destra SOPRA la barra (senza sovrapporsi) con tutte le altre funzioni (azioni rapide + destinazioni: Incassi, Cavalli, Scuderie, Scadenze, Cerca, Invita clienti, Aiuto). Proposta coerenza: stesso «+» anche nel proprietario (barra a 5, «+» con Pegasus e voci mancanti).
- 16/10 CONFERMATO: barra a 5 + «+» sopra la barra in tutte le app. Proprietario: Home·Diario·Libretto·Chat·Calendario (+ Pegasus, Spese, I miei cavalli, Servizi, Partner, Aiuto). Maniscalco: Home·Agenda·[Hammer]·Chat·Clienti. In decisione: Trainer (Home·Sedute·[Ares]·Chat·Agenda) e Scuderia mobile (Home·Cavalli&Salute·[Athena]·Lezioni·Chat; desktop sidebar).
- 16/10 Trainer e Scuderia mobile CONFERMATI (Scuderia: Home·Cavalli&Salute·[Athena]·Lezioni·Chat + «+»). APP GROOM: una schermata, niente barra/AI/«+» (proposta); solo stile Equo + lingua/esci in testata; barra «Oggi · Segnala» solo in futuro. Da confermare.
- Da fare: decidere insieme i menù, poi mockup della pillola, poi codice.

## 🟡 16/10/2026 — RIDISEGNO LIBRETTO DEL CAVALLO (da decidere, poi mockup)
- Tre libretti: Carta d'identità (dati base + foto), Libretto sanitario (ferrature, vaccini, farmaci), Libretto sportivo (allenamenti, gare, trofei; solo se il cavallo fa sport).
- Nomi proposti: Identità · Salute · Carriera (estesi: Carta d'identità / Libretto sanitario / Palmarès); contenitore «Il libretto di Rio». Evitare «Passaporto».
- Criteri proposti: voce con autore+ruolo+data, mai sovrascritta, si cancella solo la propria; Identità scrive il proprietario (altri propongono); Salute: ognuno le sue voci, firmate dal professionista = «verificate»; Sportivo: proprietario, trainer/istruttore, scuderia + Sedute del Trainer in automatico; il proprietario decide quali libretti vede ogni professionista.
- Aperti: passaggio di proprietà, Premium/PDF, tabelle nuove (cavalli_sport, sport_voci).
- DECISO 16/10: nomi Identità · Salute · Sport; Sport = Premium (Identità e Salute Free); il libretto segue il cavallo nel passaggio di proprietà; bollino verificata/dichiarata; numero Equo non modificabile, microchip solo proprietario con avviso+storico+notifica, se esiste già altrove si propone il collegamento.
- MOCKUP creato: ux/mockup-libretto-v1.html (7 schermate). In attesa di feedback.
- DECISIONI FINALI 16/10: Identità include anche passaporto ufficiale, UELN, data di nascita, proprietario precedente; i professionisti vedono Sport solo se il proprietario è Premium; PDF del libretto = PREMIUM; «Il libretto» si apre dalla scheda cavallo (card sotto la foto). Mockup approvato, in attesa del «fai tutto».

## 🟡 16/10/2026 — APP TRAINER / ALLENATORE (base, da mockuppare)
- Concetto: analisi e condivisione della seduta (stile match analysis). Strumenti sul video: bullet point+commento, nota audio, lente d'ingrandimento, lavagna. Altre funzioni: chat, appuntamenti/agenda.
- La seduta è legata al cavallo (codice Equo), storico a vita, visibile nel Diario del proprietario. Annotazioni non distruttive (dati sopra il video originale).
- Video caricabile da allenatore E da cavaliere/proprietario.
- PIANI: proprietario Free = solo riceve/guarda i video dell'allenatore (no invio propri con controanalisi); Premium = invia i propri e fa controanalisi. Trainer Free = molto limitato; Trainer Premium = pagina dedicata «Editor video allenamenti».
- CORRETTO 16/10: Trainer Free = 10 SLOT video NON cancellabili e non rinnovabili (prova dell'editor, poi Premium). Trattato come il maniscalco (professionista; Free maniscalco = 10 clienti, cavalli illimitati). Limite cavalli trainer: da definire (proposta 10).
- UX da gestire: conta solo la seduta condivisa (bozze/prove no); elimina/nascondi per privacy ma slot non restituito; avvisi a 7/10 e 9/10 e contatore sempre visibile; al 10° slot restano chat, agenda, vista e modifica delle sedute già fatte; dentro i 10 slot editor COMPLETO (altrimenti la prova non fa capire).
- CONFERMATI 16/10: 10 slot, video max 60 s.
- Agente AI del trainer (editor via chat), a fasi: 1 comandi → annotazioni (con anteprima/annulla); 2 trascrizione note audio + riassunto + bozza messaggio; 3 highlights come elenco di intervalli; 4 suggerimenti dal video (sperimentale, «da confermare»); 5 esporta mp4 montato (server, costoso, dopo). Solo Premium, con limite d'uso. Agente = ARES (già scelto 27/09, Personal Trainer/Istruttore). CONFERMATO 16/10: Ares incluso nel Premium del trainer (stesso limite messaggi degli altri agenti); in Scuderia resta add-on a pagamento.
- MOCKUP creato 16/10: ux/mockup-trainer-v1.html (Editor tablet con assistente, lavagna e lente, Home trainer, vista proprietario Free, muro 10/10). In attesa di feedback.
- Da definire: limiti precisi Free trainer, peso/compressione video, privacy minori nei video (verifica legale già in lista), schema DB (sedute, sedute_media, sedute_annotazioni, sedute_condivisioni).

## 🟡 15/10/2026 — Mockup Home v3 creato (ux/mockup-proprietario-home-v3.html)
- Voci aggiunte alla lista «fai tutto»: pannello giallo «Chat preferite» (5 cerchi sotto Prossime scadenze, tap = apre la chat), card «Prenotazioni» (lezioni in scuderia, foto) al posto di «Scheda», card gialla «Ultimo messaggio» al posto di «Spese».
- Da decidere: dove mettere Scheda cavallo e Spese; come si scelgono le 5 chat preferite (stella in Chat?); Prenotazioni se la scuderia non usa Equo; ordine finale sezioni sotto.

## 🟡 15/10/2026 — DA FARE (richieste di Simone: si raccolgono, poi si fanno TUTTE insieme quando dice «fai tutto»)
- [ ] **Meteo app proprietario: farlo come nell'app maniscalco** (oggi nella Home proprietario è la striscia dei 7 giorni con sole/nuvole; vedere come lo mostra la Home del maniscalco e allinearlo). Simone darà altre indicazioni: NON fare nulla finché non le dà.
- [ ] **Home proprietario: «Scheda di (cavallo)» e «Spese» devono diventare 2 card belle e chiare (con icona, titolo e una riga di dettaglio, ad es. ultima scadenza / spese del mese), non tasti anonimi.** Simone vuole PRIMA i mockup (poi la scelta, poi il codice).
- [ ] **BUG Home «Ultimi momenti»: le foto non si vedono** (dal telefono di Simone, 15/10: compare un quadrato grigio vuoto). Verificato: righe e file sono salvati bene e le regole d'accesso ai file ci sono; il problema è nel collegamento dell'immagine (link temporaneo firmato) sul telefono reale. Da fare: leggere l'immagine con scaricamento diretto (download → blob) al posto del link firmato, e mostrare un avviso chiaro se fallisce. Provare con l'app vera.
- [ ] **«Ultimi momenti» rifatti come le storie di Instagram** (richiesta Simone): solo **5** cerchi (non 7/8); sotto ognuno la **data GG/MM dell'evento** (es. 10/11 = 10 novembre); niente miniature ma **una nostra icona di categoria**: foto → icona foto, video → telecamera, ferratura → ferro di cavallo, e così via (vocale, nota, vaccino, lezione…); gli ultimi 5 eventi comprendono anche quelli del libretto (ferratura, vaccino) e delle lezioni, non solo il Diario; all'inizio i 5 cerchi sono visibili ma con la scritta piccola **VUOTO**, e al tocco una spiegazione di cosa va lì (con tasto per aggiungere). Includere nei mockup della Home.
- [ ] **Home proprietario: riordino sezioni.** «Da Equo» va più in basso; «PROSSIME SCADENZE» va più in alto. «Prossime scadenze» di default è **chiusa**, come una **locandina con una nostra foto** e la spiegazione della sezione; al tocco si apre e mostra le **prossime 5 scadenze**, ciascuna **con la possibilità di interagire** (es. «Fissa con il maniscalco», segna come fatta, apri la scheda). Includere nei mockup.
- [x] Mockup Home creato 15/10: `ux/mockup-proprietario-home-v2.html` (da approvare; le altre voci della lista si fanno dopo il via di Simone). Contenuto originale richiesto:: meteo come app maniscalco, riga storie «ultimi 5 eventi», 2 card Scheda e Spese, «Prossime scadenze» chiusa con locandina (in alto), «Da Equo» in basso.
- [ ] Notato dallo screenshot su computer (schermo largo): la barra in basso diventa una colonna a sinistra e il tasto «+» tondo si sovrappone alla voce «Diario». Da sistemare insieme alle altre modifiche.

## 🟡 14/10/2026 — APP PROPRIETARIO SOCIAL (Diario + feed) — decisioni prese
Mockup: `ux/mockup-proprietario-social.html` (A «Diario prima» vs B «Feed della stalla») — **scelta fatta: Direzione A (Diario prima)** · mockup Home: `ux/mockup-proprietario-home-A.html` (da approvare).
Decisioni: 1 l'autore può nascondere/eliminare le proprie voci ma le voci sanitarie restano nello storico · 2 minori/persone nei video: da valutare dopo (controllo legale) · 3 community chiusa all'inizio, con segnala e blocca · 4 **Free solo foto; Premium anche video e filmato mensile** · 5 peso app → vedi sotto · 6 funzione Premium.
Fasi: 1 Diario personale (foto, note, vocali) · 2 condivisione con persone scelte/scuderia/istruttore · 3 feed e storie · 4 filmato mensile Premium.
- [x] Scelta direzione A (14/10)
- [x] Home di A approvata (14/10)
- [x] SQL `schema-diario.sql` eseguito (14/10)
- [x] Fase 1 costruita in `equo-app/index.html` (NON ancora in produzione): nav Home·Diario·+·Chat·Cavalli (Calendario e Spese spostati nei chip della Home), pagina Diario, composer foto/nota/vocale, carta «Oggi» + «Un anno fa» nella Home
- [x] 14/10 sera: contenuti «Da Equo» (6 card con foto brand in `assets/equo/`) quando il Diario ha meno di 6 momenti; barra = Home·Diario·+·Chat·Calendario (Cavalli e Spese nascosti, chip nella Home); Album foto nella scheda cavallo (copertina per Diario e Home)
- [x] 14/10 notte: controllo funzioni dopo la prova di Simone. Corretto: dopo il salvataggio Home e Diario si ricaricano (prima la miniatura non compariva se salvavi dalla Home); ogni riquadro apre una sezione (giorni di fila, momenti del mese, nel Diario, giorno della settimana, momento, card «Da Equo», video Premium); nel dettaglio di un momento: modifica, categoria, «Metti nell'album», nascondi. Provato con un finto database: 24 controlli ok.
- [x] `schema-album-cavallo.sql` eseguito (14/10)
- [ ] Idee: «metti nell'album» dalle foto del Diario, contenuti Equo da tabella (modificabili senza deploy), video Equo per le card
- [x] `schema-guida-diario.sql` (guide AI: Home, cavalli, spese, Diario, Album) eseguito (14/10)
- [ ] Provare sul telefono (scatto, vocale, nascondi) e poi deploy quando lo chiedi
- [ ] Da fare dopo: meteo e luogo automatici nel momento, video Premium (con controllo lato server), coda offline per gli scatti, condivisione (fase 2)
- [ ] **Alleggerire l'app (punto 5)**: spezzare `equo-app/index.html` (~1 MB, file unico) in moduli = «versione B» multi-file su beta.equohub.com, generata dalla A con script; modulo Social caricato solo quando serve (lazy)
- [ ] Compressione foto/video sul telefono prima dell'invio (foto ~1600 px, video breve); limiti Free/Premium
- [ ] Storage Supabase per i media del Diario + regole RLS per livello di privacy (solo io / persone scelte / scuderia e professionisti / community)
- [ ] Coda offline estesa agli scatti (salva senza rete, invia dopo)
- [ ] Tabelle moderazione: segnalazioni, blocchi; reazione = ferro di cavallo
- [ ] Filmato mensile automatico (Premium)
- [ ] Verifica legale minori/persone nei video (decisione 2)

## 🔴 URGENTE · 14/10/2026 — FATTURAZIONE ELETTRONICA (SDI): la promettiamo ma non esiste
Oggi in Equo c'è solo il flag centri.sdi_attivo e i dati fiscali della scuderia (scuderia_dati_fiscali: P.IVA, PEC, codice SDI); la voce «Fatturazione SDI» del menu Scuderia è «in arrivo». Il listino la dà come inclusa in PREMIUM Scuderia (SDI add-on in ADVANCE 9 €/mese + IVA; add-on App professionisti 4,99 €/mese).
- [ ] 1. SUBITO: allineare i testi → «in arrivo» ovunque sia promessa come già disponibile (listino, volantino Scuderia, sito scuderia.html, guide di Athena/Merlino, confronto pacchetti). Controllare cosa dicono oggi.
- [ ] 2. Decidere da quale lato partire: (a) fatture che emette Equo ai suoi abbonati (le scuderie con P.IVA; Stripe da solo NON emette verso SDI → obbligo nostro, anche col commercialista); (b) funzione per i clienti (scuderia/maniscalco che fattura ai propri clienti dentro Equo = la promessa del listino, lavoro grosso).
- [ ] 3. Primo passo realistico per (b): Equo prepara la fattura con tutti i dati e produce XML FatturaPA / riepilogo per il commercialista o per il portale gratuito dell'Agenzia delle Entrate (poco rischio, nessun costo per fattura).
- [ ] 4. Secondo passo: integrazione con un provider con API (es. Fatture in Cloud con account del cliente collegato, oppure provider scelto da noi con costo girato nel prezzo): confrontare prezzi per fattura, condizioni rivenditori, conservazione 10 anni. Dati mancanti da raccogliere: P.IVA/CF, indirizzo, PEC o codice SDI dei clienti da fatturare; aliquote/natura IVA (forfettari), bollo, ritenuta, cassa.
- [ ] 5. Ricordare: il «Conto» in PDF NON è una fattura (documento non fiscale, dirlo nel testo).

## 13/10/2026 · DA FARE
- ✅ SQL schema-ferratura-libretto, schema-home-banner, schema-guide-home-hammer-ferratura eseguiti e deploy fatto.
- Dopo il deploy: provare popup Semplice/Completa, nuova Home, analisi foto Hammer su telefono vero.
- Creare prodotto Stripe «Crediti Hammer» (oggi tasto = avviso).
- Referral dedicato ALESSANDRO (3 mesi Premium gratis al nuovo proprietario) + volantino A4: codice in equo-app, SQL schema-referral.sql DA ESEGUIRE, poi deploy. Volantino in ux/Equo-volantino-Alessandro.pdf (stampabile). Dopo il deploy: provare il link ?ref=ALESSANDRO con un account nuovo (poi cancellarlo) e verificare il PDF stampato.
- Conto della scuderia/cliente (PDF numerato C-anno-N, chat/email/WhatsApp, Segna pagato/Annulla): codice in equo-app, SQL schema-conti-mascalcia.sql DA ESEGUIRE, poi deploy (insieme a «Qui stanno»). Tasto in Incassi e spunta per proprietario FATTI. Da fare: verifica PDF su telefono vero, decidere Gratis/Premium, chiedere a Simone cosa «semplificare».
- «Qui stanno» (cavalli spostati in una scuderia visibili nella scheda della scuderia, nelle cartelle Scuderie e Cavalli): codice pronto in equo-app, SQL schema-guide-qui-stanno ESEGUITO (14/10). Resta il deploy. (Il secondo cavallo del 13/10 era un test cancellato di proposito: chiarito.)
- ✅ Modalità Lavoro: SQL schema-modalita-lavoro eseguito e deploy fatto (13/10). Da fare: provare con Alessandro su telefono vero (Lavoro dall'Agenda, «Sei arrivato?» con posizione già permessa, chiudi tappa, problema su un piede con foto e avviso al proprietario, notifiche in pausa).

# Equo — Roadmap di lancio

## 🔴 URGENTE · DOMANI 9 ottobre 2026 — STRIPE (dopo il deploy dell'8/10)
Il codice nuovo è online (deploy 8/10): senza questi passaggi rinnovi, rimborsi, contestazioni e passaggi di livello NON vengono registrati.
- [x] (17/10) 1. Webhook Stripe (endpoint già esistente di equo-app): aggiungere gli eventi `invoice.paid`, `customer.subscription.updated`, `charge.refunded`, `charge.dispute.created` (oltre a `checkout.session.completed`, `customer.subscription.deleted`)
- [x] (17/10, link https://buy.stripe.com/28E3cx64ffNq2kj3V76Na02, env impostata su Netlify, attiva al prossimo deploy) 2. Creare il link di pagamento «Differenza Premium lifetime» 50 € una tantum → variabile Netlify (sito equo-app) `STRIPE_LINK_UPGRADE_LIFETIME`, poi nuovo deploy o «Clear cache and deploy»
- [x] (17/10) 3. Controllare le variabili Netlify `STRIPE_PRICE_PRO_*` (prezzi da professionista mensile/annuale/lifetime)
- [x] (17/10) 4. Customer Portal: disattivare il cambio piano
- [x] (17/10) 5. Pagamenti falliti: impostare «cancella abbonamento»
- [x] (17/10: PROVAPRO, PROVAPREMIUM1, STAFF100 0/10; promo spenti sui 3 link) 6. Controllare i codici promozionali attivi
- [ ] 7. Verifica: un pagamento di prova (poi rimborso) deve comparire nella pagina «Registro pagamenti» e nel rimborso diventare «Rimborsato»

- [ ] 8. DEPLOY del sito (in attesa): pagina Scuderia con la nuova foto di apertura (img/scuderia-equo.webp, classe foto-equo in css/sito.css: su computer il motto resta sopra il titolo e il logo fuori dal riquadro; su telefono solo ragazza e cavallo). Comando: git add equo-app equo-scuderia equo-sito → commit → git push origin master

- [ ] 9. (9/10) Incassi a tre schede + ordine del giro in Agenda: eseguire schema-incassi-giro.sql (controllo 1·1·1·1) PRIMA del deploy dell'App

- [ ] 10. (9/10) Clienti a cartelle: solo guide, schema-guide-cartelle-clienti.sql (controllo 1·1·1) — si può eseguire anche dopo il deploy

- [ ] 11. (9/10) Messaggi a cartelle: solo guida, schema-guide-chat-cartelle.sql (controllo 1)

- [ ] 12. (9/10) Incassi vista Semplice / Completa: solo guida, schema-guida-incassi-viste.sql (controllo 1) — DOPO schema-incassi-giro.sql

- [ ] 13. (10/10) Sposta cavallo: eseguire schema-sposta-cavallo.sql (controllo 5 · 4 · 1 · 4 · 3). App e Scuderia funzionano anche prima (senza spostamenti), ma va eseguito prima di provarlo. Dopo il deploy: provare uno spostamento vero verso una scuderia su Equo Scuderia (richiesta «in arrivo» → Accogli) e il ritorno a casa (scheda in «Usciti dal centro»).

- [ ] 14. (12/10) DEPLOY correzione aggiornamenti (iPad bloccato sulla versione vecchia): service worker di App e Scuderia (OneSignalSDKWorker.js + OneSignalSDKUpdaterWorker.js) → cache equo-offline-v2; con rete lenta (>6 s) apre la copia salvata ma il download continua e aggiorna la copia (prima veniva interrotto); tasto «Aggiorna» = ?aggiorna= aspetta la rete fino a 45 s. Dopo il deploy: iPad apri Equo, aspetta 10 s, chiudi e riapri.

### Da provare dopo il deploy dell'8/10
- [ ] Allegato vero su un cavallo (es. di Riccardo): visibile anche al proprietario e a Scuderia Colleferro
- [ ] Clienti di Francesco a box; doppione «In the mood» lasciato finché non conferma
- [ ] Ferratura su un cavallo impostato «mezza» → registrata mezza ferratura con 2 ferri

## 🔴 URGENTE · DOMANI 7 ottobre 2026 — SCHEDA CAVALLO UNICA (opzione B)
REGOLA: il cavallo è al centro dell'ecosistema · azioni univoche · storico a vita (vedi memoria, in cima).
Oggi lo stesso cavallo ha 3 schede: horses (App proprietario), scuderia_cavalli (Equo Scuderia), cavalli_clienti_mascalcia (maniscalco). Esempio: Rio ha codice PSI-000002 in App e ALT-000007 in Scuderia.
Decisione di Simone (6/10): scheda unica per chi la usa, costruita sulle schede attuali (B), poi eventualmente tabella unica (A).
- [x] 1. (7/10) Un solo cavallo Equo: SQL schema-cavallo-unico (scuderia_cavalli.horse_id legame stabile; stesso proprietario + microchip → unione automatica; solo nome → App chiede «È lo stesso cavallo?»; resta il numero più vecchio, alias in equo_numeri_unificati; storico + avviso in chat; equo_schede_scuderia_di/equo_horse_di_scheda ora sul legame stabile; 3 guide) + deploy App. Controllo 1 · 2 · 3. ✅ ESEGUITO. 1b: SQL schema-cavallo-unico-maniscalco (stesso cavallo in più clienti dello stesso maniscalco → una riga presso la struttura, interventi spostati, storico; trigger su collegamento scheda e su righe maniscalco). Controllo 1 · 1
- [x] 2. Registro sanitario comune (7/10): SQL schema-registro-sanitario — health_events ↔ scuderia_eventi_sanitari in entrambe le direzioni (origine + link), modifiche/cancellazioni allineate, avvisi agli altri due (centro, proprietario, maniscalchi del cavallo), «✅ Fatto» del maniscalco a proprietario e centro, storico in cavalli_storico, 3 guide agenti. ✅ ESEGUITO 7/10
- [x] 2b. (7/10) Ognuno cancella solo le voci scritte da sé: SQL schema-cancella-proprie ✅ ESEGUITO (trigger before delete su health_events e scuderia_eventi_sanitari, controllo 2 · 2) + deploy App/Scuderia (cestino nascosto e nota «può cancellarla solo …» sulle voci altrui). DA DECIDERE: anche le modifiche solo all'autore?
- [ ] 3. Anagrafica condivisa (nome, razza, mantello, nascita, microchip) aggiornata per tutti
- [ ] 4. Restano privati: spese del proprietario, box e note interne della struttura, incassi del maniscalco
- [x] 1a. (7/10) Maniscalco: aggiungi/sposta cavallo con il CODICE EQUO nella scheda cliente (pro_cavallo_da_codice: sposta, unisce doppioni, storico in cavalli_storico; richieste del proprietario senza doppioni) — SQL schema-cavallo-codice + deploy App
- [ ] 6. TRASFERIMENTO CAVALLO: in Scuderia «Il cavallo lascia il centro» (data, motivo) al posto di Elimina → scheda archiviata in sola lettura, storico conservato, box liberato, esce da scadenze/statistiche/avvisi; proprietario «Ho spostato …» con codice della nuova scuderia (o import dalla nuova); nuova scuderia riceve lo stesso codice Equo + storico sanitario comune; avviso al maniscalco («Rio ora è alla Scuderia X») e appuntamenti futuri collegati alla nuova struttura; conferma alla vecchia
- [ ] 5. Guide agenti AI aggiornate nello stesso SQL

## ✅ DEPLOY FATTI (6 e 8 ottobre 2026) — sotto lo storico di cosa è partito
## ▶ (storico) DEPLOY DI martedì 6 ottobre 2026
Tutti gli SQL sono GIÀ eseguiti su Supabase (verificato il 6/10, compreso schema-demo-scuderia). Resta solo il push.

```
cd ~/Desktop/Equo
git add equo-app equo-scuderia equo-sito
git commit -m "Home a widget, tablet, incassi PIN, Naviga, portami da, ricerca, moduli contatto, pagine Proprietari e Maniscalchi, sito legale"
git push origin master
```

### Cosa parte
- [ ] (8/10) PREMIUM PER LIVELLO + protezioni pagamenti: SQL schema-premium-livello (controllo 1 · 1 · 3 · 1 · 1) PRIMA del deploy. SU STRIPE: (1) webhook: aggiungere eventi invoice.paid, customer.subscription.updated, charge.refunded, charge.dispute.created; (2) creare link di pagamento «Differenza Premium lifetime» 50 € una tantum → env Netlify STRIPE_LINK_UPGRADE_LIFETIME; (3) controllare codici promozionali (checkout li accetta); (4) Customer Portal: niente cambio piano da lì; (5) impostazione pagamenti falliti
- [ ] (7/10) Premium: prezzo da professionista per chi ha anche un ruolo professionale (app + create-checkout.js + avviso nel webhook). SQL guide schema-guide-premium-profili (controllo 3)
- [ ] (7/10) PROMEMORIA PAGAMENTI «Da saldare» (solo proprietari su Equo, non scuderie): primo avviso in chat (push), poi riquadro in Home + pallino Chat ogni 5 giorni finché non è saldato; «Ho già pagato» → messaggio al maniscalco; interruttore maniscalco nel menu + spunta per cliente. SQL schema-promemoria-pagamenti (controllo 1 · 1 · 2), da eseguire PRIMA del deploy
- [ ] (7/10) NUOVO APPUNTAMENTO semplificato (maniscalco): più cavalli insieme (un appuntamento per cavallo, un solo messaggio al cliente); ferro standard nella scheda del cavallo (Modifica cliente → Cavalli → «Ferro»), «Cambia ferro» solo per l'appuntamento con «Vuoi modificare il ferro standard di …? Sì/No»; rotella ferri 1-4; importo/pagamento tolti dal modulo → nel riquadro del «Fatto» un importo per cavallo (proposto: ultimo prezzo del cavallo, poi del cliente) + totale, anche per «Altro». SQL schema-ferro-standard ✅ ESEGUITO 7/10 (+ aggiunta ferri_nuovi ✅, 48 cavalli con ferro standard). + spunta «Ferri nuovi utilizzati» (rimessa), visibile solo al maniscalco. DA DECIDERE: «Prezzo abituale» nella scheda del cavallo
- [ ] (7/10) QR bianco su Android/iPad (codice personale): generatore QR ora integrato nelle app (niente libreria esterna), SVG visibile + canvas per PDF/groom. Widget Oggi: «1 scuderia»
- [ ] (7/10) «struttura» → «scuderia» / «centro ippico» in App (proprietario e maniscalco) e Scuderia; resta solo dove è una scelta (tipo cliente, sezione Clienti → STRUTTURE). Messaggi → «Scuderie». Guide: SQL schema-guide-struttura-scuderia ✅ ESEGUITO (0)
- [ ] (7/10) Scelta profilo al primo accesso: mostra l'email e tasto «Email sbagliata? Esci» (prima si restava bloccati lì)
- [ ] (7/10) Clienti vuoti: i tasti «+ Aggiungi» proprietari/strutture ora compaiono anche senza clienti (segnalato da Francesco Bizzarri su iPad, nuovo account mascalcia.bizzarri91@icloud.com)
- [ ] Ora attuale accanto alla data in Home (App) e nella riga «Bentornato» (Scuderia); icone meteo nuove disegnate a mano
- [ ] METEO + LENTE: Home App (proprietario e maniscalco) senza barra di ricerca → meteo 7 giorni con posizione del telefono, tocco = ora per ora; Scuderia: meteo all'indirizzo del centro accanto al nome + lente di ricerca (cavalli, persone, lezioni, magazzino, Ctrl+K). Funzione netlify meteo.js (fonte gratuita norvegese CC BY; passaggio al modello italiano con METEO_FONTE=openmeteo + METEO_API_KEY + METEO_MODELLI); proxy /api/meteo in equo-scuderia/netlify.toml. Guide agenti: SQL schema-guide-meteo-ricerca (dopo il deploy, controllo 5 · 2). Agenti con strumento meteo (Pegasus, Hammer, Athena, Merlino); icona meteo accanto agli appuntamenti di oggi, sole grigio sbarrato se manca l'indirizzo. DOPO IL DEPLOY: provare meteo reale su telefono e Scuderia Colleferro.
**Equo App**
- [ ] Home a widget predefinita (proprietari, maniscalchi, tablet) + interruttore «Vista Widget» nel menu
- [ ] Tablet/iPad a tutto schermo (menu laterale, widget affiancati, clienti e chat su due colonne)
- [ ] Incassi nascosti con PIN a 4 cifre (anche in Hammer e nel riepilogo del lunedì)
- [ ] Naviga: indirizzo scheda cliente → struttura collegata → ricerca luogo (cerca-luogo.js); campo Indirizzo nel cliente
- [ ] «Portami da…» in Hammer e Pegasus (scheda Naviga in chat)
- [ ] Ricerca rapida (7 elenchi, scelta cliente nel Nuovo appuntamento, lente in Home e topbar)
- [ ] Early Adopter dal sito (finestra con prezzo, posti, pagamento)
- [ ] AI piano Free: 5 messaggi al GIORNO (riparte a mezzanotte)
- [ ] Accesso Google: chiede sempre quale account usare
- [ ] Veterinario/Istruttore al primo accesso e da «+ Aggiungi profilo» → modulo candidatura (non creano più il profilo)
- [ ] Nuova icona app; novita.json aggiornato
- [ ] Home maniscalco: tocco su un appuntamento di oggi = in evidenza (Naviga/Chatta/Fatto), «⋯» per modificare; avviso appuntamento doppio; «Fatto» su giorno futuro con conferma; pulsante assistente che si nasconde scorrendo
- [ ] Scheda struttura collegata: «Scollega da Equo Scuderia» apre una finestra di conferma (prima bastava un doppio tocco)
- [ ] Android: tasto indietro del telefono = chiude finestra/chat → torna alla Home → «Premi di nuovo indietro per uscire» (anche in Scuderia)
- [ ] Collegamento a una struttura senza P.IVA obbligatoria (solo consiglio per il badge) — SQL eseguito 6/10
- [ ] Appuntamenti modificati (servizio/data/ora): messaggio «prima → ora», badge «✏️ Modificato», proprietario «Ok, ho visto», struttura da riconfermare con riquadro prima→ora — SQL eseguito 6/10
- [ ] TRE FRONTI: appuntamenti maniscalco↔proprietario per cavalli che stanno in una struttura → avviso alla struttura (chat Professionisti se il maniscalco è collegato, altrimenti chat col proprietario), lista «Con il proprietario» in Professionisti → Appuntamenti, intervento fatto nella scheda sanitaria Scuderia — SQL eseguito 6/10
- [ ] Guide agenti AI aggiornate (6 corrette + 7 nuove: scheda ai maniscalchi, scollega con conferma, P.IVA facoltativa, indietro Android, modifiche prima→ora, avvisi alla struttura) — SQL eseguito 6/10
**Equo Scuderia**
- [ ] Icona Scuderia a colori invertiti; Groom con icona App
- [ ] Scheda cavallo «Invia in chat»: nuovo gruppo «Maniscalchi collegati» (va nella chat Professionisti, PDF copiato in chat-allegati); chi ha due ruoli ha l'etichetta «come proprietario/come maniscalco»
**Sito equohub.com**
- [ ] Pagine nuove: proprietari.html, maniscalchi.html, scuderia.html (pacchetti + IVA, 2 mesi in regalo con l'annuale, modulo «Richiedi una demo»), candidatura.html (Veterinari e trainer), scuderia-smart.html, termini.html, privacy.html, contatti.html
- [ ] Moduli di contatto → /api/contatto → email a gestione.equo@gmail.com con «Provenienza»
- [ ] Risparmio % sulle offerte Early Adopter; pulsanti collegati all'app («Posti esauriti» a 0)
- [ ] Redirect vecchi indirizzi, robots.txt, sitemap.xml, immagine social, icona

### Subito dopo il deploy
- [x] (17/10, già attivi) Stripe: attivare «accettare i termini di servizio» su ENTRAMBI i Payment Link Early Adopter
- [ ] Inviare un modulo di prova da equohub.com/candidatura.html e da scuderia-smart.html → controllare l'email
- [ ] Acquisto di prova 49 € dal sito → rimborso → SQL di ripristino del profilo (chiederlo a Claude)
- [ ] Provare su telefono: Home a widget, PIN incassi, Naviga, «portami in scuderia» con Pegasus
- [ ] Rinominare il centro da «simone lucchini» a «Centro Ippico Colleferro» (Scuderia → Il tuo Centro → Modifica dati)

### Aperti (decisioni / prossimi lavori)
- [ ] Chiave Google Maps (Places API New) → Netlify equo-app `GOOGLE_MAPS_API_KEY` (finché manca: «Cerca su Google Maps»)
- [ ] Notifiche: strategia (proposta app native con Capacitor), problema token Android di Alessandro
- [ ] Feedback dei maniscalchi sul mockup Home a widget; eventuale citazione (solo con permesso)
- [ ] Pagine sito ancora «Coming Soon»: Groom, Community, Benessere, Chi siamo, Piani e prezzi
- [ ] IVA / Stripe Tax con il commercialista; webhook Classly sullo stesso account Stripe
- [ ] Revisione legale di termini e privacy (incluse le nuove righe sui moduli di contatto)

---
_Storico precedente (fermo al 24/09, non aggiornato voce per voce):_


Ordine di priorità per arrivare da "codebase pronta" a "prodotto live e testabile".

**Nota struttura progetto**: il repo contiene DUE deploy separati sullo stesso account Netlify (gestione.equo@gmail.com):
- root (`src/app/`) → landing page Next.js → **https://equo-land.netlify.app**
- `equo-app/` → Web App / PWA single-file (stile Classly) → **https://equo-app.netlify.app**

## 1. Landing Page ✅
- [x] Struttura landing (`src/app/page.tsx`) con hero, feature, waitlist form
- [x] API `/api/waitlist` (salva su Supabase + email conferma Resend)
- [x] Rifinire copy, logo, sezioni Equo App / Equo Scuderia separate per gerarchia
- [x] Sezione "Come funziona Equo Scuderia" con foto+descrizione
- [x] WaitlistForm a doppio banner (proprietario / scuderia) senza scelta manuale
- [x] Deploy su Netlify (account gestione.equo@gmail.com) — **equo-land.netlify.app** live
- [ ] Verifica responsive reale su dispositivo (solo verificato via codice finora)

## 2. Equo App (PWA) — stato attuale
- [x] Scheletro completo stile Classly (auth, bottom nav, modali)
- [x] Demo mode (in-memory) per testare senza account
- [x] Icone SVG eleganti + logo ufficiale + icona cavallo (Font Awesome horse-head)
- [x] Menù profilo: dark mode, metodi di pagamento (carta/PayPal/IBAN, no numeri carta salvati), accesso Google
- [x] AI spostata da tab a pulsante flottante (chat a mezzo schermo)
- [x] Bottom nav: Home - Cavalli - Calendario - Spese
- [x] AI può PROPORRE eventi sanitari (vaccino/coggins/ferratura/sverminazione) via tool-use Claude, con conferma utente obbligatoria prima del salvataggio — implementato anche in demo mode
- [x] **AI collegata davvero** (era dietro un pulsante "presto disponibile"): FAB ora apre la chat reale per proprietari e professionisti, con limite mensile 5 msg Free / 500 msg Premium (contatore in chat, reset automatico a fine mese, CTA upgrade al limite) — commit 412f5f0
- [x] Deploy su Netlify (secondo sito, base directory `equo-app`) — **equo-app.netlify.app** live, reso pubblico
- [x] `ANTHROPIC_API_KEY` configurata su Netlify (sito equo-app) — chiave dedicata a Equo (organizzazione Anthropic separata). **Resta da fare**: aggiungere credito sulla console Anthropic (piano Free non esegue chiamate reali), poi verificare con un test end-to-end
- [x] SQL contatore messaggi AI eseguita su Supabase + push in produzione — confermato 20/09/2026
- [ ] Test navigazione completa con un utente reale end-to-end (login vero, non demo)
- [ ] Upload foto cavallo + documenti sanitari (Supabase Storage) — non ancora implementato
- [ ] Pagina profilo utente / impostazioni scuderia
- [ ] Playlist Spotify Equo: creare playlist pubblica (account gestione.equo@gmail.com), integrare via embed ufficiale Spotify (iframe) — salvataggio/condivisione gestiti nativamente da Spotify, no OAuth/backend necessario
- [ ] Modulo Mascalcia (equo-app): Step 1-6 completati (doppio ruolo, nav pro/proprietario a 5 voci, profilo pro, calendario lezioni manuale, chat proprietario testo/vocali/foto/video, condivisione esterna con watermark) — **Step 7: Community in Equo Scuderia** (bacheca pubblica dei contenuti condivisi, tocca equo-scuderia non equo-app) ancora da fare, dettagli in claude/equo-app-mascalcia.md
- [x] Onboarding legale minimo (equo-app): checkbox unica Termini+Privacy+dichiarazione eta in onboarding (una sola volta per account), pagina in-app "Legale" (Privacy/Cookie/Termini), banner cookie Accetta/Rifiuta con Google Analytics gated dietro consenso, bottone Premium/Free finalmente collegato in UI (mancava), disclaimer AI sotto la chat — vedi commit 7cee147.
- [x] Migrazione SQL eseguita su Supabase (progetto equo-prod): colonne `consenso_termini_privacy`, `dichiarazione_eta`, `cancellazione_richiesta_at` su `profiles` — confermato 20/09/2026
- [x] SQL colonne `ai_msg_count`/`ai_msg_month` eseguita su Supabase — confermato 20/09/2026
- [x] Replicato su Equo Scuderia (checkbox onboarding condivisa via `profiles`, pagina Legale, cookie banner) — commit 75ecefc. Non replicati: bottone Premium/Free (Scuderia non ha ancora un campo piano/gating in UI) e disclaimer AI (la chat AI è ancora "SOON", nulla da disclaimare finché non è live)
- [x] **Blocco auto-Premium gratis**: "Passa a Premium" non scrive più `piano=premium` da solo — apre un'email precompilata per richiesta manuale (Stripe non ancora collegato). "Torna a Free" resta self-service. Commit ec7f2a7
- [x] **Eliminazione account (GDPR)**: bottone nel menu, richiesta salvata con 30gg di grazia, modale di riattivazione al login. La cancellazione DEFINITIVA dei dati dopo i 30gg **non è automatica** (nessun cron/Edge Function collegato) — per ora va fatta a mano da chi gestisce Equo quando arriva una richiesta scaduta. Solo su Equo App per ora, non ancora su Equo Scuderia. Commit ec7f2a7
- [x] **Deploy in produzione confermato** (equo-app.netlify.app + equo-scuderia) — push del 20/09/2026, tutti i commit sopra live
- [ ] Sostituire `GA_MEASUREMENT_ID` (placeholder "G-XXXXXXXXXX", in equo-app e equo-scuderia) con l'ID reale di Google Analytics 4, altrimenti GA non traccia nulla anche dopo consenso
- [ ] Replicare "Eliminazione account" (GDPR) anche su Equo Scuderia — al momento solo su Equo App

## 3. Infrastruttura
- [x] Account dedicati creati con gestione.equo@gmail.com (Supabase + Netlify, separati dagli altri progetti)
- [x] Progetto Supabase produzione **"equo-prod"** (regione Frankfurt/eu-central-1) — URL: `https://ncbdrhbpgdcaentoxlfz.supabase.co`
- [x] Schema creato: `profiles`, `horses`, `health_events`, `expenses`, `stables` + Row Level Security attivo su tutte + trigger auto-crea profilo alla registrazione
- [x] `SUPABASE_URL` / publishable key inseriti in `equo-app/index.html`
- [x] Repo Git remoto — github.com/lucchinisi-droid/equo-app (root = landing, `equo-app/` = PWA)
- [x] Deploy automatico su Netlify ad ogni push su master (due siti separati)
- [x] Visitor access impostato su Public per entrambi i siti (di default era privato sul nuovo team)
- [x] `ANTHROPIC_API_KEY` configurata su Netlify (sito equo-app) — v. sezione 2
- [x] `GEMINI_API_KEY` configurata su Netlify (sito equo-app) — in vista della voce Gemini Live (v. sezione 4bis), non ancora usata dal codice
- [x] `RESEND_API_KEY` configurata su Netlify (sito equo-app) — chiave dedicata `equo-prod` (scope "Sending access", non Full access), dominio email non ancora verificato (si usa `onboarding@resend.dev` finché non si aggiunge un dominio custom su Resend) — confermato 20/09/2026
  - [ ] **Idea da implementare**: email automatica di recupero carrello — intercettare l'evento webhook Stripe `checkout.session.expired` (sessione di checkout aperta ma non completata entro 24h) e mandare via Resend una mail con link diretto al checkout a chi ha cliccato "Passa a Premium" ma non ha concluso l'acquisto
- [ ] Configurare Supabase Storage (bucket foto cavalli e documenti PDF)
- [ ] Dominio custom (opzionale, per ora *.netlify.app)
- [ ] Quando si acquista equohub.com: aggiornare dominio custom su Netlify (equo-land + equo-app), redirect URI OAuth Google, Authorized JavaScript origins, e URL di callback Supabase con il nuovo dominio
- [x] **Stripe collegato davvero** (era skeleton non collegato): checkout reale mensile/annuale (proprietari + professionisti), Payment Link dedicati per i lifetime (150 posti prop, 50 posti pro, limite gestito nativamente da Stripe), webhook che attiva Premium, "Torna a Free" annulla davvero l'abbonamento su Stripe — commit 0be6ff1
  - [ ] **SQL da eseguire su Supabase**: `alter table profiles add column if not exists stripe_customer_id text; alter table profiles add column if not exists stripe_subscription_id text;`
  - [x] Webhook Stripe configurato (`equo-app`, endpoint `https://app.equohub.com/.netlify/functions/stripe-webhook`, eventi `checkout.session.completed` + `customer.subscription.deleted`) e `STRIPE_WEBHOOK_SECRET` impostata su Netlify — confermato 20/09/2026
  - [x] Verificato: nessuna imposta automatica su nessuno dei 6 prezzi/link — il cliente paga sempre esattamente il prezzo mostrato, IVA (se dovuta) già considerata inclusa
  - [ ] Account Stripe attualmente in modalità **Live** (non Test) — primi test di pagamento saranno reali, fare un acquisto di prova con importo minimo e poi rimborsarlo dalla dashboard Stripe
  - [ ] Verificare "Riscuoti le imposte automaticamente" (Stripe Tax) sui prodotti creati — se non configurato in Impostazioni → Tax potrebbe non calcolare l'IVA correttamente

## 3bis. Chat & notifiche push (sessione 23/09)
- [x] Non letti chat basati su database (non più localStorage): colonna `chat_messaggi.letto` + RPC `segna_letti_chat`; contatore + pallini non letti lato Equo Scuderia (sidebar "Comunicazioni & Chat" + lista "Chatta con i tuoi clienti"), badge lato Equo App aggiornato dalla vecchia versione localStorage alla nuova basata su DB — così il conteggio è identico su qualsiasi dispositivo/utente
- [x] Import cavalli con conferma dopo collegamento proprietario via chat/codice: RPC `cavalli_da_importare` + `importa_cavallo_scuderia`, popup con checkbox lato Equo Scuderia prima del popup "Chatta ora?"
- [x] **Notifiche push reali (OneSignal)**: SDK integrato in Equo App ed Equo Scuderia (banner "Attiva le notifiche" nella pagina Chat/Comunicazioni, mostrato solo se il permesso non è già stato concesso), utente collegato con `OneSignal.login(user.id)` all'ingresso in app
- [x] Function Netlify `notify-chat-message.js` (sito equo-app) che riceve i webhook Supabase a ogni nuovo messaggio e invia la push al destinatario giusto via API OneSignal — copre `chat_messaggi` (scuderia↔proprietari/professionisti collegati), `messaggi_proprietari` (chat diretta tra utenti app) e `messaggi_mascalcia` (maniscalco↔cliente, solo se il cliente ha collegato l'account app)
- [x] 3 Database Webhook configurati su Supabase (Integrations → Database Webhooks): `notify-chat-scuderia` (chat_messaggi), `notify-chat-proprietari` (messaggi_proprietari), `notify-chat-mascalcia` (messaggi_mascalcia) — tutti Insert-only, header `X-Webhook-Secret` condiviso
- [x] Variabili d'ambiente impostate su Netlify (sito equo-app): `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`, `CHAT_WEBHOOK_SECRET`
- [x] **Bug corretto**: `SUPABASE_URL` su Netlify (sito equo-app) aveva `/rest/v1/` di troppo in fondo, il che rompeva silenziosamente OGNI chiamata delle Netlify Function al database (404 su tutte le query) — probabilmente affliggeva anche `stripe-webhook.js` da tempo (verificare se qualche abbonamento pagato di recente non ha ricevuto `piano=premium`). Corretta il 23/09.
- [ ] **Push per i messaggi broadcast** (`scuderia_messaggi`, il "Nuovo messaggio" a tutto il centro/per ruolo in Equo Scuderia): non è una chat 1-a-1, oggi non ha nessuna push collegata — da valutare come intervento a parte se serve
- [ ] Test end-to-end reale con app chiusa/telefono bloccato, sia Android che iPhone (su iPhone la push funziona solo se l'app è stata aggiunta alla schermata Home, richiede iOS 16.4+)
- [x] **Bug corretto**: mancava `OneSignalSDKWorker.js`/`OneSignalSDKUpdaterWorker.js` in root su equo-app ed equo-scuderia (404) — senza questi file il browser non registra il service worker richiesto per le push, quindi su iOS il tasto "Attiva" non mostrava alcun popup. Aggiunti e deployati il 23/09.
- [ ] **Bug da fixare (prossima sessione)**: su scuderia.equohub.com il tasto "Attiva" notifiche non funziona — OneSignal segue il same-origin policy dei browser, un App ID web push vale per UN SOLO dominio. L'app OneSignal attuale è configurata solo per `app.equohub.com`, quindi su scuderia il SDK dà errore "Can only be used on..." e non parte. Serve: creare un secondo Web Push App OneSignal dedicato a `scuderia.equohub.com`, aggiornare l'init in equo-scuderia/index.html con il nuovo App ID, e aggiornare `notify-chat-message.js` per usare le chiavi giuste a seconda del destinatario (staff scuderia → app scuderia, cliente/proprietario → app equo).
- [x] **Bug risolto (24/09): notifiche push non arrivavano su NESSUN dispositivo (iOS e Android)**. Causa reale: l'URL usata in `OneSignalSDKWorker.js`/`OneSignalSDKUpdaterWorker.js` (`cdn.onesignal.com/sdks/web/v16/OneSignalSDKWorker.js`) rispondeva 404 → il service worker non si registrava mai su nessun browser → nessuna sottoscrizione push poteva completarsi, anche con permesso di sistema concesso (confermato su OneSignal dashboard: tutti i tentativi "Never Subscribed / No Push Token"). Diagnosticato aprendo la console del browser (`navigator.serviceWorker.register` dava "ServiceWorker script evaluation failed"). URL corretta: `cdn.onesignal.com/sdks/OneSignalSDKWorker.js` (verificata 200). Confermato funzionante: notifica di test "Thanks for subscribing!" ricevuta su iPhone e Android dopo il fix.

- [ ] **Bug aperto (24/09 sera, DA RIPRENDERE): notifiche push accettate da OneSignal ("Delivered") ma non compaiono sul dispositivo, su TUTTI i canali testati**. Isolato con certezza: anche una notifica mandata manualmente dalla dashboard OneSignal (bypassando del tutto la nostra function) risulta "Delivered" + "Web Push (Apple Web): 1" ma non arriva sul telefono. Quindi NON è un bug di codice/function/webhook (quella parte è stata verificata funzionante: fix del CHAT_WEBHOOK_SECRET disallineato fatto e confermato con query SQL su net._http_response, risposta OneSignal sempre 200 con id valido). L'unica notifica mai arrivata davvero è stata la primissima "Thanks for subscribing!" automatica, prima di tutti i vari "Cancella e reimposta" fatti durante i test di stasera.
  Ipotesi principale da verificare domani: sottoscrizioni OneSignal duplicate/stale. Ogni "Cancella e reimposta" genera una nuova sottoscrizione push sul dispositivo ma quella vecchia resta segnata "Subscribed" su OneSignal (non si autoelimina) — probabile che le notifiche vengano mandate a un external_id/sottoscrizione ormai morta mentre quella davvero attiva sul telefono è un'altra.
  Prossimo passo suggerito: sul telefono, eliminare l'icona home, cancellare i dati del sito da Impostazioni iPhone → Safari → Avanzate → Dati dei siti web (non dal banner cookie interno al sito, serve la cancellazione a livello di sistema), reinstallare da zero, riattivare le notifiche, e verificare su OneSignal → Users & subscriptions che compaia una sottoscrizione NUOVISSIMA (timestamp di pochi secondi prima) — mandare il test solo a quel external_id specifico, non a uno vecchio.
- [x] Fix icona "E" generica su home screen iOS (24/09): `equo-app/manifest.json` puntava a `/icona-equo.png` invece di `/assets/icona-equo.png` (404). Aggiunto anche `<link rel="apple-touch-icon">` mancante in entrambe le app.
- [x] Aggiunto Content-Type esplicito `application/manifest+json` per manifest.json su equo-app (best practice iOS, non la causa del bug ma corretto tenerlo).

## 4. Altro fondamentale prima del lancio
- [ ] **Monetizzazione**: definire piano free vs pro (limite cavalli? assistente AI limitato? export PDF a pagamento?) — nessuna feature senza logica di business
- [x] **Privacy & Cookie (equo-app + equo-scuderia)**: Privacy Policy, Cookie Policy, Termini di Servizio, cookie banner, diritto di cancellazione account — vedi sezione 2 sopra e doc `claude/equo-normativa-privacy.md`
  - [ ] Cookie banner su equo-land (landing) — non ancora fatto, solo su equo-app/equo-scuderia finora
- [ ] Analytics base (Plausible o simile)
- [x] Mappa servizi vicino a te implementata (OSM live + tabella `services` curata) — manca solo il seed iniziale, vedi SQL da eseguire su Supabase
- [ ] Seed iniziale tabella `services` (cliniche 24h, maneggi, negozi) — almeno la tua zona, inserimento manuale via Supabase dashboard
- [ ] **Idea futura — fallback Google Places API** se OSM continua a dare pochi risultati in molte zone: chiamare Google Places (Nearby Search) SOLO quando OSM restituisce zero risultati anche a raggio ampio, per non far scalare il costo con gli utenti free. A settembre 2026 il pricing è: 5.000 chiamate gratuite/mese, poi 32$/1.000 chiamate — richiede API key + fatturazione attiva su Google Cloud + chiamata via Netlify Function (mai client-side). Non prioritario ora, valutare se il fallback raggio-ampio su OSM non basta.
- [ ] Onboarding primo utente
- [ ] Test su dispositivi reali (iPad e Mac mini)
- [ ] Gestione/controllo email raccolte dalla waitlist (to-do aperto)
- [ ] Auto-renew dominio: verificare se attivarlo su Namecheap prima della scadenza

## 4bis. AI — agenti verticali e voce (idea da sviluppare, non ancora pianificata in dettaglio)
- [ ] Agenti AI con competenze verticali via tool-use Claude (stessa infrastruttura già in piedi per le proposte AI con conferma utente):
  - Proprietario: 1 agente esperto equestre + esecuzione procedure (allenamenti, appuntamenti, ecc.)
  - App professionisti: 1 agente specializzato per categoria (maniscalco/veterinario/istruttore) + procedure della sua categoria
  - Equo Scuderia: più agenti a scelta (Segretaria, Commercialista, Esperto Equestre...) — 1 incluso nel pack scelto alla prima configurazione, altri ADD-ON a pagamento → serve un modello "moduli/add-on acquistabili" per scuderia, non basta il flag free/premium binario attuale
- [ ] **Regole comuni a TUTTI gli agenti (Pegasus, Hammer, Galeno, Ares, Athena, Merlino, Ermes)** — richiesta Simone 30/09/2026
  - Proattivi: promemoria e consigli per migliorare le operazioni (riepilogo periodico + avvisi puntuali), non solo risposte
  - "Messaggero dei Boss": strumento `riferisci_ai_boss` (problema / richiesta / idea / domanda) → tabella segnalazioni + email a gestione.equo@gmail.com; l'agente dice "lo giro ai Boss e ti faccio sapere il prima possibile"; la risposta dei Boss torna nella chat dell'agente con notifica
  - Ogni tanto (max 1 volta ogni ~14 giorni per utente, mai in emergenza) chiede: "C'è qualcosa che vorresti cambiare o migliorare? Dimmelo, che lo faccio presente ai Boss."
  - ✅ 30/09 FATTO su Pegasus e Hammer (e Equo AI neutro): regole comuni REGOLE_COMUNI in agent.js, strumenti riferisci_ai_boss + le_mie_segnalazioni, tabella segnalazioni_boss, email ai Boss (notify-segnalazione-boss.js), risposta con `select rispondi_segnalazione_boss('<id>', 'testo');` → messaggio nella chat dell'agente + push; domanda "cosa vorresti migliorare?" max ogni 14 giorni (profiles.ai_feedback_chiesto_at)
  - ✅ 30/09 Hammer proattivo: riepilogo del lunedì (riepilogo-hammer.js: agenda 7 gg, richieste da confermare, scaduti da richiamare, incassi, proposte alle strutture, consiglio Haiku; Premium push+email; switch nel menu pro)
  - [ ] Pagina admin per leggere e rispondere alle segnalazioni senza SQL
  - **Guida all'app (prerogativa di OGNI agente, presente e futuro)** — richiesta Simone 30/09/2026: ogni agente conosce alla perfezione l'app in cui lavora e, se richiesto, spiega ogni funzione: DOVE si trova, PASSI numerati con le etichette esatte, ESEMPIO concreto, note (permessi, limiti). Mai inventare pulsanti.
    - ✅ 30/09 FATTO: regola "Guida all'app" in REGOLE_COMUNI (agent.js) + strumento `guida_app` (rpc `cerca_guida` / `indice_guida`) su schede `ai_conoscenze` categoria 'guida': 65 schede app Proprietario (Pegasus), 70 app Maniscalco (Hammer), 85 Equo Scuderia con Magazzino (Athena). Sorgenti JSON in `Claude outputs/guide/`.
    - Quando si aggiunge o cambia una funzione dell'app: aggiornare la scheda guida corrispondente (stesso titolo = aggiornamento).
    - Nuovo agente = nuove schede guida con il suo ambito + `guida_app` negli strumenti.
  - ✅ 30/09 **Athena attiva** in Equo Scuderia (bolla con la civetta): guida del gestionale + `situazione_centro` (scadenze sanitarie, carnet, lezioni, sotto-scorta, ordini) + messaggero dei Boss; 300 messaggi/mese per utente; conversazione per centro (ai_messaggi vista 'scuderia', centro_id); chiamata via proxy `/api/agent` (equo-scuderia/netlify.toml)
  - [ ] Athena: azioni con conferma (lezioni, promemoria ai clienti, movimenti di magazzino) e riepilogo del lunedì
  - [ ] Galeno/Ares/Merlino/Ermes: nascono già con REGOLE_COMUNI (guida all'app compresa) + riepilogo periodico proprio
- [x] **Ticket di assistenza in Home** (30/09/2026): card "Serve aiuto?" → "Apri un ticket" nell'app (vista proprietario e professionista) e in Equo Scuderia; tabella `ticket_assistenza` (numero progressivo da #1001, max 5/giorno) → email a gestione.equo@gmail.com con reply-to dell'utente + email di conferma all'utente (notify-ticket-assistenza.js)
  - [ ] Pagina admin ticket (stato aperto / in lavorazione / chiuso)
- [x] **Pacchetti Scuderia attivi** (30/09/2026): START/ADVANCE/PREMIUM con limiti lato server, lucchetti nel menu, "Il tuo pacchetto", sblocco totale per losportivocolleferro@gmail.com
- [x] **Statistiche + Merlino** (30/09/2026): pagina Statistiche (base/complete), Merlino in chat, Radar settimanale della concorrenza
  - [ ] Pagamenti Scuderia (checkout con IVA e fattura) che aggiornano centri.pacchetto in automatico
  - [ ] Ermes (seconda scelta dell'agente incluso in PREMIUM)
  - [ ] Promemoria automatici solo da ADVANCE (oggi i promemoria non distinguono il pacchetto)
- [x] **Box / Stalla + semaforo + suggerimenti** (30/09/2026, Scuderia): box disegnati (verde/rosso/giallo), stato del cavallo, icone del giorno, modalità stalla, limiti START/ADVANCE/PREMIUM; pallino con preavviso per tipo; fumetti di aiuto
  - [ ] Collegamento dispositivi (GPS, telecamera, display touch, sensori) → scuderia_box_attivita.fonte / scuderia_box.dispositivo_id
  - [ ] Suggerimenti anche nell'app Equo
  - [ ] Preavvisi delle scadenze modificabili da ogni centro
- [ ] **Offline** (decisione 30/09/2026): Equo App livello 2 (si apre senza rete, ultimi dati visti, coda di chat/interventi/appuntamenti/spese/eventi inviata al ritorno della rete); Equo Scuderia livello 1 (si apre senza rete, barra "Sei offline", ultimi dati in sola lettura). Service worker unico con OneSignal importato.
- [ ] **Ermes — Magazziniere & Responsabile Logistica (Equo Scuderia)** — scheda definita il 30/09/2026, prompt base in `prompt-agenti/ermes-system-prompt.txt`
  - Tono: sintetico, preciso, organizzato, proattivo, orientato al controllo delle scorte; risponde con tabelle ed elenchi puntati
  - Funzioni: mappatura dei depositi (scaffali, ripiani, zone di stoccaggio), tracciamento giacenze (mangimi, integratori, farmaci veterinari, ferri/chiodi, coperte, attrezzatura), alert di sotto-scorta, liste di riordino e gestione riordini con i fornitori
  - Prerequisito: modulo **Magazzino** di Equo Scuderia (oggi "SOON" nel menu) → servono tabelle depositi/ubicazioni, articoli, movimenti di carico/scarico, soglie minime, fornitori, ordini
  - Strumenti da costruire (sul motore comune `agent.js`, azioni sempre con conferma): leggi_giacenze, cerca_articolo, articoli_sotto_scorta, proponi_movimento (carico/scarico), proponi_articolo, proponi_riordino (lista per fornitore)
  - Regole: mai dosi o indicazioni d'uso dei farmaci (solo quantità e scadenze di magazzino); segnala lotti in scadenza; add-on a pagamento su Scuderia (prezzo da definire)
- [ ] Conversazione vocale in tempo reale: Claude non ha (ad oggi, 18/09/2026) una Live API vocale pubblica per sviluppatori paragonabile a Gemini — solo Voice Mode nelle sue app consumer, non integrabile in Equo
  - Se si vuole voce nativa: valutare Gemini Live API (audio bidirezionale + function calling nella stessa sessione) come provider AI separato solo per quella funzione, oppure dettatura di sistema (STT del telefono) come alternativa a costo zero mantenendo tutto su Claude
  - Gemini Live/TTS usa lo stesso pacchetto di ~30 voci native (maschili/femminili) dell'app Gemini — nessuna differenza di qualità tra API e app
  - Nodo economico: audio in tempo reale costa molto più del testo — da gatare dietro Premium se implementato

## 4ter. Gamification — percorso a punti e badge (idea definita, da sviluppare — non ora, richiede tempo)

- [ ] **Percorso a 5 livelli con nome dal mondo equestre**, punti guadagnati con azioni reali nell'app (scheda cavallo completa, evento sanitario registrato in anticipo sulla scadenza, segnalazione maneggio, referral andato a buon fine, collegamento chat con un professionista, streak accessi settimanali):
  1. **Puledro** — 50 pt — badge profilo (costo zero, ripetibile)
  2. **Scudiero** — 120 pt — 50 messaggi AI extra (ripetibile)
  3. **Cavaliere** — 250 pt — 200 messaggi AI extra oppure 15% sconto sul prossimo rinnovo mensile (ripetibile)
  4. **Fantino** — 500 pt — 1 mese Premium gratis (**una tantum**, o max 1 volta ogni 6 mesi — NON ripetibile a piacere, altrimenti cannibalizza il ricavo abbonamenti)
  5. **Purosangue** — 1000 pt — 1 mese Premium gratis + badge permanente visibile pubblicamente (chat/profilo) + 20% sconto a vita sul rinnovo annuale (**una tantum**)
- [ ] Meccanica di riscatto: il badge raggiunto resta per sempre (bacheca trofei), al riscatto del premio l'utente sceglie tra "riparti da 0" (rifà lo stesso livello, solo per i livelli ripetibili 1-3) o "mantieni i punti e vai avanti" verso il livello successivo
- [ ] Schema dati da definire: tabella livelli (statica), progresso utente (punti correnti + livello max raggiunto), storico riscatti (per audit/anti-abuso sui livelli una tantum)
- [ ] **Non è priorità immediata** — rimandato a dopo il lancio, richiede tempo per essere sviluppato bene

- [ ] Francesco Bizzarri: chiedergli se i due «In the mood» (XXX-000105 in Jumping horse, XXX-000106 in Ciani R.) sono lo stesso cavallo → solo allora unire le schede
- [ ] Eseguire schema-archivio-clienti.sql (controllo 1·1·1·1·1) PRIMA del deploy dell'App

## 5. Feature innovative (wow factor) — in ordine di priorità
- [ ] **1. QR Code passaporto emergenza** — richiede ampliare la scheda cavallo: genera QR univoco per cavallo, pagina pubblica read-only (senza login) con allergie, vaccinazioni, gruppo sanguigno, contatti proprietario, scansionabile da un veterinario in emergenza
- [ ] **2. Voice logging** — richiede creare nuova sezione "Diario Sanitario": nota vocale trascritta e strutturata via AI (Whisper/Claude), utile per loggare osservazioni a mani libere in scuderia
- [ ] **3. Body Condition Score via foto** — carichi foto del cavallo, l'AI (Claude vision) stima il punteggio di condizione corporea (scala 1-9) e segnala sovrappeso/sottopeso

---
**Prossimo step**: aggiungere credito sulla console Anthropic (piano Free non fa chiamate reali) — unico blocco rimasto prima di poter fare un test end-to-end reale della chat AI (Free e Premium) in produzione.

## 16/10 · Mockup Home + nuovi menù v1
File `ux/mockup-home-nuovi-menu-v1.html`: proprietario, maniscalco, trainer, Scuderia (mobile+desktop), Groom. In attesa di conferma su: colore disco AI, nome agente sotto il disco, tono per pagina (prudente/completo), voce Scuderia «Cavalli». Nessuna modifica all'app finché non arriva «fai tutto».

## 16/10 · Menù proprietario con icona Pegasus
`ux/mockup-menu-proprietario-v1.html`. Limite cavalli trainer = 10 (deciso). Cuscinetto voce attiva fisso 70×56 px. Icone agenti: le fornisce Simone (Pegasus ricevuta); mancano Hammer, Ares, Athena, Galeno, Merlino, Ermes, Equo AI.

## 16/10 · Decisioni di Simone (da fare al «fai tutto»)
- Tono per pagina: versione PRUDENTE (sfondo/fascia in alto, carte crema); sottopagine ereditano.
- Nome della voce chat in tutte le app: «Messaggi» (non «Chat»).
- Menù VETERINARIO: per ora all'iscrizione del veterinario compare il banner «collabora con noi alla creazione della tua app» (nessuna app dedicata); poi si disegna con loro.
- ISTRUTTORI/TRAINER: abilitare la registrazione degli istruttori (tipo account Trainer scelto in onboarding).
- «Equo AI» neutro: sostituirlo con le icone nuove degli agenti (Galeno per i veterinari); al tocco appare «NOME AGENTE — presto disponibile» (Galeno finché non è pronto; Ares quando sarà costruito).
- Limite cavalli trainer = 10.
- Da decidere: due interruttori del maniscalco (vedi spiegazione): Vista Widget e Versione Completa/Semplice.
- MANISCALCO Home = la vista widget attuale (carta Oggi con puntini, 5 tondi: Portami da… · Scadenze · Da incassare · Cerca · Altro, carte Cavalli · Clienti · Scuderie) DA MANTENERE; cambiano solo barra (Home · Agenda · [Hammer] · Messaggi · Clienti) e «+». Quindi togliere l'interruttore «Vista Widget» (Home classica) — la widget diventa l'unica. Mockup: `ux/mockup-home-maniscalco-widget-v1.html`. Resta da chiarire solo l'interruttore Completa/Semplice.
- Maniscalco: TENERE entrambi gli interruttori Completa/Semplice (decisione 16/10). Resta solo da togliere «Vista Widget».
- Maniscalco: la MODALITÀ LAVORO (Sei arrivato? → Ho letto · al lavoro → Al lavoro → Ho finito, con i 4 piedi Ant. sx/Ant. dx/Post. sx/Post. dx Regolare/Problema) esiste già e NON va toccata: con la nuova barra/Home deve restare raggiungibile da «Portami da…», dalla carta Oggi e dal popup «Sei arrivato?».

## Analytics sito/gestionale (17/10/2026) — pronto, da pubblicare
1) Eseguire equo-app/schema-analytics-sito.sql in Supabase. 2) git add equo-app equo-sito equo-scuderia → commit → push. 3) Cruscotto Equo: scheda Analytics già online. Escludere il proprio browser: aprire il sito con ?nostat=1. Retention 24 mesi (cancellazione manuale per ora).

## Promo scuderie «3 mesi PREMIUM gratis» (17/10)
- [x] Meccanismo creato ed eseguito: equo-app/schema-promo-centri-automatica.sql (attiva_promo_centro una sola volta, scadenza notturna pg_cron, imposta_onboarding_centro).
- Attivazione centri: fatta da Claude su richiesta di Simone (select attiva_promo_centro('<id>', 3);) finché i volumi sono sostenibili. Poi onboarding: 20 cavalli, 20 proprietari, staff.
- [ ] (idea) mostrare nel gestionale la data di fine promo al centro; (idea) pannello «Promo centri» nel Cruscotto.

## Economia scuderie + avviso fine promo (17/10)
- [ ] SQL DA ESEGUIRE: equo-app/schema-centri-contratti.sql (tabella centri_contratti, imposta_contratto_centro, chiudi_contratto_centro, equo_scade_promo_centri aggiornata: a fine promo il centro passa al pacchetto del contratto).
- [x] Cruscotto, scheda Scuderie: «Soldi delle scuderie» (incassato, da incassare, previsione 12 mesi, potenziale, scadenze) + «Come usano il gestionale e quali upgrade proporre». Pubblicato (v5). Mostra l'avviso se i contratti non sono ancora nel DB.
- [x] Gestionale (equo-scuderia/index.html): riquadro «3 mesi di PREMIUM in regalo fino al …» nel pannello «Il tuo pacchetto» (legge promo_fino/promo_pacchetto_prima da centri). DA PUBBLICARE col deploy.
- Prima scuderia reale: impostare il contratto con select imposta_contratto_centro('<id>','advance','annuale'); poi registrare i pagamenti con registra_pagamento_scuderia (importo IVA inclusa).

## Athena = segretaria, non agente verticale (17/10)
- [x] agent.js (ISTRUZIONI_ATHENA): niente magazzino, salute, mascalcia, allenamenti: rimanda a Ermes / Galeno / Hammer / Ares (se non attivo: add-on da ADVANCE, ticket). Nella situazione ignora magazzino e scadenze sanitarie. Gestionale: chip e saluto di Athena aggiornati. DA PUBBLICARE col deploy (funzione + gestionale). Dopo il deploy: provare «aggiungi 5 balle di fieno al magazzino» → deve rimandare a Ermes in 1-2 frasi.

## Hammer e Ares acquistabili in Scuderia + icone agenti (17/10)
- [ ] SQL DA ESEGUIRE: equo-app/schema-agenti-scuderia-hammer-ares.sql (vincolo agente_incluso esteso a galeno/hammer/ares).
- [x] agent.js: nel gestionale (vista scuderia) body.agente = 'hammer' | 'ares' → stesse istruzioni dell'app + contesto «staff del centro»; strumenti: cerca_conoscenze (schede maniscalco/istruttore), web_search (solo Hammer), cavalli_centro (nuovo, sola lettura sui cavalli del centro), meteo. Limite messaggi = merlino_messaggi del centro, contati per agente. Niente strumenti di clienti/agenda/sedute/memoria.
- [x] Gestionale: schede Hammer e Ares non più «In arrivo» (Add-on, «Richiedi l'attivazione»; attivi se il centro li ha), chat con chip e saluto, icone nuove (galeno/hammer/ares copiate in equo-scuderia/assets/agenti), pulsante Athena in basso a destra e intestazione chat con l'immagine nuova.
- Attivazione: da SQL (vedi commenti nel file). Prezzo add-on ancora «in arrivo». Ermes e Galeno restano «presto».
- DA PUBBLICARE col deploy (agent.js + gestionale). Test dopo il deploy: attivare Hammer su un centro e chiedere «che ferro consigli?» e «quali cavalli del centro hanno note sui piedi?».

## Prezzi agenti extra, prova gratuita, messaggi extra (17/10)
- Listino (IVA esclusa, al mese): Merlino 9, Ermes 9, Hammer 4, Ares 4, Galeno 4 · nessuno sconto sul 2º agente · TUTTI gli agenti 24 (19 per PREMIUM) · messaggi extra condivisi fra gli agenti extra: 200 = 7, 500 = 15 · PREMIUM: 1 agente incluso a scelta (0 €, 300 messaggi/mese) · START: nessun acquisto (consigliato ADVANCE) ma può provare.
- Prova gratuita per TUTTI i pacchetti: 1 giorno e 10 messaggi per agente, un nuovo agente ogni 3 giorni, una sola volta per agente (solo Merlino, Hammer, Ares: gli unici attivi). La può avviare titolare/admin/livello 2-3.
- [ ] SQL DA ESEGUIRE: equo-app/schema-agenti-prezzi-prove.sql (colonna centri.messaggi_extra protetta dal guard, tabella centri_prove_agenti, RPC agenti_prove_stato / agente_prova_avvia, imposta_messaggi_extra_centro(centro, 0|200|500), centro_e_responsabile).
- [x] agent.js: prova (limite 10, chiave contatore ':prova'), pool messaggi extra, risposta con prova.fine. [x] Gestionale: prezzi sulle schede, «Prova gratis 1 giorno», box «Tutti gli agenti insieme» e «Messaggi in più» (richiesta via ticket), messaggi in chat per fine prova/limite. [x] Cruscotto (v6): colonna «Agenti e messaggi extra (listino/mese)» (non nei totali). DA PUBBLICARE col deploy (agent.js + gestionale).
- Costo reale misurato ~2,7 centesimi di € a messaggio (29 messaggi): da ricontrollare dopo il primo mese; pareggio: Hammer/Ares/Galeno ~150 messaggi/mese, Merlino/Ermes ~330, 200 extra = 7 € → ~260 messaggi.
- Attivazione agenti/pacchetto tutti: da SQL (centri.agenti_extra / agente_incluso, vedi schema-agenti-scuderia-hammer-ares.sql) — manuale tramite Claude; poi aggiornare il contratto (importo con agenti compresi).

## Schede doppie dello stesso cavallo nel cliente del maniscalco (18/10/2026)
- Causa: la scheda inserita a mano dal maniscalco (senza collegamento) e quella creata dal collegamento con il proprietario non venivano mai riconosciute come lo stesso cavallo; l'unione automatica esisteva solo per i cavalli di una scuderia.
- Dati di Marco Mattozzi corretti a mano (Venere e White → White night). Nome del proprietario ha sempre priorità.
- `equo-app/schema-cavalli-clienti-aggancio.sql` (ESEGUITO il 18/10, provato in locale; per incollarlo nel SQL Editor usare $fn$ e blocchi separati): aggancia/unisce per nome uguale (senza maiuscole/accenti). Nomi solo simili (White / White night) restano da unire a mano.
- Nota: le DELETE su cavalli_clienti_mascalcia dal connettore Supabase di Claude vanno in timeout; dal SQL Editor funzionano.
- Avviso «È lo stesso cavallo?» nella scheda cliente del maniscalco (nomi simili: prefisso a parola intera o differenza di 1 lettera): tasti «Unisci» / «Sono diversi». Codice in `equo-app/index.html` (renderAvvisoSimili, unisciSimili) — DA PUBBLICARE; richiede `equo-app/schema-cavalli-clienti-unisci-rpc.sql` (DA ESEGUIRE, provato in locale: RPC `equo_unisci_cavalli_cliente`).

## Codice cavallo: provvisorio + doppia conferma + bollino (18/10/2026) — PROGETTO, non costruito
- Decisioni: tre livelli provvisorio → validato (nome, razza, data di nascita + doppia conferma da due persone diverse tra proprietario e professionisti; codice definitivo e bollino «Validato») → certificato (validato + microchip verificato; bollino «Certificato»). Il codice definitivo si assegna a Validato (il Certificato aggiunge solo il bollino dorato). Doppia conferma: 1 persona = 1 conferma, una delle due SEMPRE del proprietario; la scuderia conta (proprietario per i suoi cavalli, professionista per quelli dei clienti). Passaggio di proprietà attivo già da Validato. I ~170 codici attuali diventano provvisori fino alla conferma. Dettagli e 13 casi di prova nel documento del progetto. Mockup: https://claude.ai/artifact/4USwoYL47VHpTcR8ERJFwN. Da decidere: prefisso PRV-, verifica microchip, ruoli professionista.
- Dettagli, fasi e rischi in `claude/Equo_Codice_cavallo_validazione.md` (Project Equo).
- Prima di costruire: verificare cosa è già stato stampato/comunicato con i codici attuali e decidere i vantaggi del bollino (stampa/QR, passaggio di proprietà, ricerca).
- Fatto il 18/10: unificazione codici (numero più vecchio + alias), registro costo AI per agente (`ai_costi`, cruscotto v7).

## Prassi «il maniscalco prepara, il proprietario riceve» (18/10, progetto, non costruito)
- Documento: Equo_Codice_cavallo_prassi_maniscalco (progetto Equo). Il maniscalco inserisce cavallo e proprietario, il proprietario si abbina, accetta i cavalli (non li crea), li completa e conferma; maniscalco o altro professionista è la seconda conferma. Nessun doppione possibile in questo flusso.
- Regola generale: le conferme valgono per la versione dei dati essenziali; se cambiano, decadono le conferme degli altri e chi modifica conferma da sé.
- Da costruire: RPC «proponi al proprietario», accettazione con creazione della scheda in horses mantenendo il numero, «Non è mio», tabella cavalli_conferme, notifiche di riconferma. Casi di prova 14–20.

## Codice a tre livelli · FASE 1 database (18/10) · file equo-app/schema-codice-livelli.sql
- Blocchi 0-7 provati su database di prova (scenari 1,4,6,7,8,9,10,12,13 + protezioni). Da eseguire da Simone nel SQL Editor, un blocco alla volta. Niente cambia per gli utenti (codice_equo e app non toccati).
- Blocco 0 corregge un errore GIA' in produzione: cambiare nome o microchip di un cavallo del proprietario dava errore (trigger horses_storico_cambi scriveva colonne inesistenti in cavalli_storico).
- Dopo l'esecuzione: verifica con le query di controllo; poi fase 2 (app + migrazione dei codici attuali a provvisori PRV-, proponi/accetta cavalli dal maniscalco).
- Nota: le righe manuali del maniscalco (cavalli_clienti_mascalcia) non hanno data di nascita: la sua conferma arriva dopo che il proprietario ha accettato e completato.

## Codice a tre livelli · FASE 2A database (18/10) · file equo-app/schema-codice-provvisorio.sql
- Fase 1 eseguita e verificata (7 cavalli, 4 scuderia, 0 conferme, 4 trigger, 4 funzioni).
- 2A (da eseguire): i codici mostrati diventano PRV-NNNNNN (provvisorio) e il codice definitivo (validato/certificato); i numeri definitivi partono da 201; la ricerca per codice (pro_cavallo_da_codice) trova PRV-, vecchi codici e definitivi. Compatibile con l'app gia' in produzione (i codici sono solo testo).
- Prossimi passi: 2B proponi/accetta cavalli dal maniscalco al proprietario (RPC), 2C schermate app (livello, checklist, Conferma, bollini, testo es. MAR-000005 -> PRV-000005 nei campi codice).

## Codice a tre livelli · FASE 2B database (18/10) · file equo-app/schema-codice-proposte.sql
- 2A eseguita e verificata (tutti i codici PRV-, 141 schede su 141). 2B in un unico blocco da eseguire: tabella cavalli_proposte, equo_proponi_cavalli_cliente (+ trigger automatico al collegamento del cliente), equo_proposte_cavalli_proprietario, equo_accetta_cavallo_proposto, equo_rifiuta_cavallo_proposto, equo_proposte_inviate, equo_cavalli_da_confermare.
- DECISIONE APERTA: il piano Free (1 cavallo) blocca l'accettazione del secondo cavallo proposto dal maniscalco (risposta limite_cavalli_free). Da decidere: rispettare il limite (upsell Premium) o esentare i cavalli accettati dal maniscalco.
- Prossimo: 2C schermate app (proposte ricevute dal proprietario, livello/checklist/Conferma/bollini, da confermare per i professionisti, testo es. MAR-000005 -> PRV-000005).

## Fase 2C: blocco Free dei cavalli proposti dal maniscalco (18/10/26)
- Fatto: i cavalli accettati dal maniscalco si aggiungono anche oltre il limite Free; oltre il primo restano bloccati (sfocati in app, invito a Premium). SQL: equo-app/schema-cavalli-bloccati.sql
- DA FARE: sfocatura/blocco lato database. Oggi lo sfocato e solo grafico e i dati arrivano al telefono. Serve un controllo in RLS o nelle funzioni, cosi i dati dei cavalli bloccati non escono finche l'owner e Free.
- DA FARE: sfocare anche in Home, scadenze e spese i dati dei cavalli bloccati.
- DA FARE: le stesse schermate (proposte, livelli, conferme) in Equo Scuderia e area trainer; stampa QR/PDF solo da Validato; Passaggio di proprieta.

## STATO 18/10/2026 sera: codice a tre livelli ONLINE (fasi 1, 2A, 2B, 2C + blocco Free)
- ESEGUITI da Simone: schema-codice-livelli, schema-codice-provvisorio, schema-codice-proposte, schema-cavalli-bloccati. DEPLOY fatto (push 18/10: app con proposte, livello/conferma, Da confermare, Proponi cavalli, blocco Free sfocato).
- Agenti aggiornati (nel codice, DA PUBBLICARE con il prossimo deploy): paragrafo "Codice del cavallo" in Pegasus e "Cavalli dei clienti e codice" in Hammer (agent.js + prompt-agenti/*.txt). Schede guida nuove in equo-app/schema-guide-codice-livelli-18ott.sql (4 schede: 2 proprietario, 2 maniscalco): DA ESEGUIRE dopo il deploy, rieseguibile.
- PROVA DA FARE con account veri: maniscalco con cliente e 2 cavalli a mano -> il proprietario si collega -> Home mostra le proposte -> Accetta (stesso codice PRV, nessun doppione) -> completa data di nascita -> "Confermo i dati" -> il maniscalco vede "Da confermare" -> conferma -> cavallo Validato con codice definitivo (numeri da 201). Poi proprietario Free con 2 proposte: il secondo e Bloccato (sfocato, "Sblocca con Premium").
- DA FARE (codice): sfocatura lato database dei cavalli bloccati; sfocare anche Home/scadenze/spese; schermate proposte/livelli/conferme in Equo Scuderia e area trainer (Ares); stampa QR/PDF solo da Validato; Passaggio di proprieta; log nello storico delle modifiche di razza/data di nascita (prima->dopo); novita.json con le nuove funzioni.
- DA DECIDERE: verifica del microchip per il Certificato (chi e come); quali ruoli professionali contano come conferma (veterinario non e un ruolo del profilo); codici gia stampati/comunicati prima del PRV.
- DA VERIFICARE: eseguito anche equo-app/schema-cavalli-clienti-unisci-rpc.sql (serve al tasto "Unisci" di "E lo stesso cavallo?")? e schema-agenti-prezzi-prove.sql (aperto dal 17/10)?

## 21/10/2026: foto del Diario non visibili (URGENTE) + settimana + Instagram
- CAUSA: la regola storage cavalli_allegati_leggi (schema-scheda-cavallo-pro.sql) leggeva la tabella cavalli_allegati, chiusa ai proprietari: ogni SELECT su storage.objects da utente autenticato dava "permission denied" (foto Diario, album, allegati). I file sono salvati (3/3). FIX: equo-app/schema-fix-storage-allegati.sql (funzione equo_allegato_path_visibile + policy rifatta). Dopo l'esecuzione verificare in lettura che authenticated legga storage.objects.
- App: settimana del Diario scorrevole (frecce + swipe, fino a 52 settimane indietro), icone del contenuto nei giorni (macchina fotografica, videocamera, microfono, penna) anche nel calendario mensile e nell'elenco del giorno; indirizzi dei file rifirmati dopo 40 minuti; "Foto non disponibile" ritenta al tocco; "Condividi su Instagram" nel dettaglio (foglio di condivisione con la foto; sul computer salva la foto e copia il testo). Condivisione video/vocali non c'e (video e Premium, non ancora attivo).
- DA FARE: Instagram Stories con sticker/formato 9:16 (richiede app Meta o immagine 1080x1920 preparata); controllare tutti gli altri punti che leggono storage (album cavalli, sedute-media, allegati) dopo il fix; regola da ricordare: nessuna policy di storage deve leggere tabelle chiuse ad authenticated, usare funzioni SECURITY DEFINER.
- Condivisione Instagram: logo Equo (equo-app/assets/equo/logo-share.png, cerchio verde/giallo/cavallo bianco senza sfondo) + scritta Equohub.com in bianco in basso a destra, applicati solo alla copia condivisa (diarioMarchia in index.html). DA PROVARE su telefono dopo il deploy.

## 21/10/2026: controllo app allenatore (Ares/Trainer) — 3 difetti corretti nel codice, DA PUBBLICARE
- Home allenatore invisibile: la regola della "vista widget" (body.vista-widget #page-pro-home > :not(.wh-keep)...) nascondeva anche #tr-home. Fix: aggiunto :not(#tr-home).
- Tasto "+" che spariva dopo circa 1 secondo (anche per il veterinario): setInterval(plAggiorna) teneva la versione vecchia della funzione e toglieva la classe pl-fab. Fix: setInterval(function(){ plAggiorna(); }).
- Saluto della Home allenatore senza nome: leggeva currentUser.nome/full_name, il campo reale e fullName.
- Provato in modalita demo (Playwright, 390 px): Home, Sedute, Messaggi, Agenda, Cavalli seguiti, menu "+", Nuova seduta, Cavallo seguito, Il mio codice: nessun errore JS. NON provabile in demo: chat, proposte lezione, collegamenti con account reali.
- 21/10 sera: CORRETTO un mio errore: il :not(#tr-home) aggiunto alla regola vista-widget alzava la priorita CSS e nascondeva la Home del maniscalco (#hm). Tolto; ora #tr-home ha la classe wh-keep. Provate le Home di maniscalco, istruttore, veterinario e proprietario in demo: tutte visibili, tasto + presente. REGOLA: dopo ogni modifica CSS o di navigazione provare tutti e 4 i ruoli prima del deploy.

## 21/10/2026: PASSAGGIO AL MULTI-FILE · TAPPA 1 (rete di sicurezza)
- Piano completo: claude/Equo_Architettura_multifile.md (Project Equo).
- Fatto: equo-app/tests/controllo-app.cjs (Playwright, 4 ruoli in demo: Home, barra, tasto +, pagine, errori JS). Provato: passa sulla versione attuale, blocca le due versioni rotte di oggi. package.json: script controllo / controllo:netlify, devDependency playwright 1.56.0. netlify.toml: [context.beta] con il controllo nel comando di build.
- DA FARE (Simone): abilitare branch deploy "beta" su Netlify (equo-app), poi creare e pushare il ramo beta e guardare il log di build. Se ok: controllo anche in produzione. Se Chromium non parte su Netlify: GitHub Actions.
- Tappe successive: Vite + core, poi un ruolo alla volta (allenatore, veterinario, proprietario, maniscalco), poi Equo Scuderia.

## 21/10/2026: MULTI-FILE · TAPPA 2 (prima parte) — sorgenti divisi
- Nuova cartella equo-app-src/: l'index.html dell'app e diviso in 256 file (63 di stile comune, 8 stili di modulo, 68 pagine/finestre HTML, 102 sezioni del codice principale, 13 script di modulo) + modello. strumenti/unisci.cjs li rimette insieme: verificato che il risultato e IDENTICO byte per byte all'index.html online (nessun effetto sull'app pubblicata). LEGGIMI in equo-app-src.
- Da ora: si modifica in equo-app-src/src, poi unisci.cjs, poi controllo dei 4 ruoli, poi commit.
- Vite: rimandato. npm non e raggiungibile ne dal mio ambiente cloud ne dalla VM del Mac, quindi non potrei verificare la sua build prima del deploy. unisci.cjs (senza dipendenze) fa il lavoro di unione; la struttura dei file e gia compatibile con un passaggio a Vite.
- Prossimi passi tappa 2: navigazione unica a eventi al posto di showPage/plAggiorna avvolte piu volte; stile di ogni ruolo confinato (prefisso) e riduzione dei !important; poi un ruolo alla volta. Ogni passo con controllo dei 4 ruoli.
- 21/10 TAPPA 2 passo 1 FATTO: navigazione unica. showPage avvisa gli iscritti con quandoApriPagina(fn); plAggiorna con quandoAggiornaBarra(fn). Tolte le 3 riassegnazioni di showPage (diario, barra, allenatore) e quella di plAggiorna (pl2). Il controllo automatico ora fallisce se qualcuno riassegna di nuovo showPage o plAggiorna. Controllo 4 ruoli: OK; diario si carica aprendo la pagina. Vite non usato in questo passo (la navigazione deve partire prima degli altri script: resta script classico); entra con il primo modulo di funzione.
- 21/10 BUG allenatore: creare una seduta dava "new row violates row-level security policy for table sedute" (0 sedute salvate da sempre: la funzione non aveva mai funzionato con account veri, solo in demo). Causa: policy SELECT sedute_sel = equo_vede_seduta(id), che durante INSERT ... RETURNING non vede la riga nuova. Fix: equo-app/schema-fix-sedute-rls.sql (trainer_id = auth.uid() or equo_vede_seduta(id)). Riprodotto e verificato su Postgres locale. Nessun'altra tabella ha lo stesso schema di regola.
- 21/10 TAPPA 2 passo 2 FATTO: regole "cosa si vede nella Home dei professionisti" tutte in equo-app-src/src/stili/10-regole-ruoli.css, una per ruolo (maniscalco #hm, istruttore #tr-home, widget solo per gli altri). Tolte da 47-home-a-widget, 54-home-del-maniscalco, 07-tr-css; tolto il trucco wh-keep su #tr-home. unisci.cjs si ferma se qualcuno scrive regole "#page-pro-home > ..." in altri file. Verifiche: controllo 4 ruoli OK; confronto visivo prima/dopo su 18 schermate: identiche (unica differenza l'orologio). Analisi: in tutto lo stile ci sono solo 43 righe con !important; gli scontri tra ruoli erano concentrati in queste regole della Home; le altre sono locali (campi, pulsanti) e non toccano altri ruoli. Nuovi strumenti: strumenti/confronto-foto.py e confronto-differenze.py (confronto visivo prima/dopo).
- 21/10 BLOCCO VERO DEI CAVALLI FREE: equo-app/schema-blocco-cavalli-db.sql (DA ESEGUIRE). Funzione equo_cavallo_bloccato(horse); regole di lettura del proprietario con "e non bloccato" su health_events, cavalli_storico (2), cavalli_album, cavalli_sport, sport_voci, expenses, diario_voci, lezioni_manuali, cavalli_arrivi; equo_chiavi_cavallo (allegati e spostamenti) rifiuta i cavalli bloccati per la vista proprietario; equo_cavalli_bloccati_di(owner) per il riepilogo settimanale. Maniscalco/scuderia/allenatore invariati. Provato su Postgres locale: Free vede solo il cavallo libero, Premium vede tutto, maniscalco vede lo storico. App (DA PUBBLICARE): diario, scelta cavallo del diario e delle lezioni escludono i cavalli bloccati; riepilogo-settimanale.js li esclude da scadenze e spese. Home, scadenze e spese non mostrano piu i dati bloccati perche il database non li consegna. Controllo 4 ruoli OK, confronto visivo identico. Non coperto: sedute dell'allenatore condivise con il proprietario su un cavallo bloccato.

## 21/10/2026: EQUO SCUDERIA — rete di sicurezza e sorgenti divisi
- equo-scuderia/tests/controllo-scuderia.cjs: demo su computer (1280x800) e telefono (390x844); Home visibile, menu, tutte le 13 sezioni (o la finestra "passa a..." se fuori pacchetto), nessun errore JS. Passa sulla versione online; provato che si ferma con una Home nascosta e con un errore in una sezione.
- equo-scuderia-src/: 183 file (sezioni del menu, finestre, stile, codice) + modello; unisci.cjs --app equo-scuderia rimette insieme un index.html IDENTICO a quello online. Strumenti dividi/unisci ora valgono per entrambe le app; dividi.cjs si rifiuta di sovrascrivere sorgenti esistenti.
- Da fare: navigazione unica anche in Scuderia (showModule e avvolta una volta da sc-pill-js); groom.html (app Groom) non ancora coperta dal controllo.
- 21/10 SCUDERIA navigazione unica: showModule avvisa gli iscritti con quandoApriSezione(fn) (anche quando apre la finestra "passa a..."); tolta la riassegnazione in sc-pill-js. Il controllo fallisce se showModule viene riassegnata. Verificato: 13 sezioni OK su computer e telefono, la pillola in basso segue la sezione aperta.
- 21/10 GROOM: equo-scuderia/tests/controllo-groom.cjs (demo ?demo=1, telefono: schermata piena, menu, lingue, primo pulsante, nessun errore). Passa.

## 21/10/2026 sera: codice cavallo in Scuderia e allenatore, PDF solo da Validato, notifiche
- EQUO SCUDERIA: scheda del cavallo con riquadro "Codice Equo" (codice, badge del livello, cosa manca, "Confermo i dati" per admin e istruttori; per i cavalli del centro il centro fa da proprietario). Home: riquadro "Da confermare (N)" con pulsante Confermo. File: equo-scuderia-src/src/script/13-codice-cavallo-scuderia.js. loadCavalli legge anche codice_livello e codice_definitivo.
- SCHEDA PDF + QR della scuderia solo da Validato (in demo sempre attiva): pulsanti nascosti e spiegazione; bloccati anche scarica/stampa/invia in chat. Nell'app proprietario non esiste ancora una scheda PDF/QR del cavallo (solo citata nel piano Premium).
- ALLENATORE: "Da confermare" nella Home (#tr-conferme, stessa funzione del maniscalco caricaConfermePro(forza, idBox)).
- NOTIFICHE: equo-app/schema-notifiche-cavalli.sql (DA ESEGUIRE DOPO il deploy) + funzione netlify/functions/notify-cavalli.js. Tabella notifiche_cavalli + webhook "notify-cavalli" (segreto copiato da notify-chat-scuderia). Avvisi: proposta di cavalli dal pulsante del maniscalco -> proprietario; nome/razza/nascita cambiati con dati completi -> tutti quelli che possono confermare tranne chi ha modificato (staff scuderia sull'app OneSignal della scuderia). Niente doppioni entro 10 minuti. Provato su Postgres locale (5 scenari).
- Verifiche: controllo 4 ruoli app OK, controllo Scuderia OK su computer e telefono, confronto visivo app identico.

## >>> PROSSIMA SESSIONE (dal 22/10/2026) — riepilogo completo in claude/Equo_Storico_4_dal_21-10-26.md (Project Equo)
1. Deploy del 21/10 gia fatto (fino a 41e77aa). Da fare: SQL `equo-app/schema-notifiche-cavalli.sql` (la funzione notify-cavalli e gia online) e `git push` degli ultimi 2 commit (tema scuro del riquadro Codice Equo in Scuderia + TODO).
2. Prove con account veri: Riccardo allenatore (sedute, lezioni, chat); codice cavallo completo (proposta -> accetta -> completa -> conferme -> Validato); push di proposta e "Da confermare"; Scuderia: riquadro Codice Equo e Home "Da confermare".
3. Decidere: transizione scheda PDF scuderie (oggi tutti provvisori = niente PDF) / PDF con scritta "provvisorio"; scheda PDF/QR nell'app proprietario (promessa Premium non costruita).
4. Multi-file: FATTO allenatore in moduli ES con Vite e zero avvolgimenti. FATTO anche il modulo di stato (moduli/stato.js con TR e T2) il MANISCALCO e il PROPRIETARIO in moduli. Prossimi: core e comune (chat, agenti, barra; dividere core/script/003), isolamento CSS, Scuderia in moduli in moduli, isolamento CSS, dividere core/script/003 (1149 righe).
5. Aperti: Passaggio di proprieta, Instagram Stories, log prima->dopo razza/nascita, novita.json, Stripe (prova 49 EUR, Crediti Hammer, carrello), IVA con commercialista.
- 22/10 VITE: app allenatore in 15 moduli ES veri (equo-app-src/src/ruoli/allenatore/moduli/, import/export calcolati: 37 nomi condivisi, nessun ciclo) costruiti da Vite in costruito.js (strumenti/costruisci-moduli.mjs). Verifiche: 4 ruoli OK; barra/menu/AI/messaggi per ruolo = 0 differenze; azioni e registri dell'allenatore = 0 differenze (63 funzioni pubbliche); confronto visivo identico (solo orologio e meteo). Nessun deploy necessario finche non si fa push.
- 22/10 PROPRIETARIO in moduli ES con Vite: 16 file -> ruoli/proprietario/moduli, stato-condiviso.js (25 variabili), API pubblica (102 funzioni); inseriti prima di core/script/084-helpers.js. Vite ha tolto 3 funzioni mai usate. Verifiche: 4 ruoli OK (anche pulsanti senza funzione); prova proprietario (Home, cavalli, scheda cavallo, diario, chat, calendario, nuova lezione, spese, nuova spesa, evento sanitario, servizi vicino) 0 differenze; maniscalco e allenatore 0 differenze; arrivo dal sito (?early=&ref=) identico; confronto visivo identico (solo orologio).
- 22/10 MANISCALCO in moduli ES con Vite: 42 file -> ruoli/maniscalco/moduli (import/export calcolati), stato-condiviso.js (56 variabili lette o cambiate anche da altre parti), API pubblica in moduli/index.js (229 funzioni per i pulsanti e le altre parti). Vite ha tolto 17 funzioni/variabili mai usate (codice morto). Nuovo controllo automatico: in ogni pagina, ogni pulsante deve chiamare una funzione esistente. Verifiche: 4 ruoli OK; confronto per ruolo 0 differenze; prova maniscalco (clienti, scheda cliente, agenda, nuovo appuntamento, incassi, Home, scadenze, giro, nuovo cliente, conto) 0 differenze e nessun pulsante senza funzione; allenatore 0 differenze; confronto visivo identico.
- 22/10 STATO allenatore: TR e T2 spostati in moduli/stato.js (unico posto), importati dai 14 moduli che li usano. Verifiche: 4 ruoli OK, confronti per ruolo e allenatore 0 differenze, confronto visivo identico (orologio + rumore d'ombra).
Metodo: modifiche solo in equo-app-src/src e equo-scuderia-src/src -> unisci.cjs -> controlli automatici -> commit. Nessun deploy di prova.
- 22/10 MULTI-FILE: sorgenti dell'app riorganizzati per ruolo (equo-app-src/src: core, comune/barra|chat|agenti, ruoli/proprietario|maniscalco|allenatore|professionisti, finestre). App allenatore divisa in 15 sezioni (ruoli/allenatore/script/13-xx-*.js). index.html identico byte per byte (nessun deploy necessario). Controllo stile aggiornato ai nuovi percorsi e provato. Cartelle vuote vecchie da cancellare (serve permesso di cancellazione).
- 22/10 Scuderia: sorgenti riorganizzati per sezione del menu (equo-scuderia-src/src/sezioni/<home|centro|cavalli|magazzino|...>/{pagina,script,stili}, core, comune/barra, finestre). index.html identico.
- 22/10 ESTENSIONI al posto delle funzioni avvolte: estendiPrima/estendiDopo (core/script/020-nav.js). Convertite: renderHome (diario), openHorseDetail (album + libretto lib3), diarioHomeRender (hv3 + allenatore), firmaUrl (hv3), trRenderHome (prossime lezioni). Il controllo automatico fallisce se vengono riassegnate. Verifiche: 4 ruoli OK, confronto visivo identico (18 schermate, solo orologio), scheda cavallo e Home proprietario identiche alla versione precedente.
- RESTANO da convertire (sono "sostituzioni per ruolo", serve un registro per ruolo): plCostruisciMenu (pl2 + allenatore), plNavAltri (allenatore), renderChatCartelle (allenatore), aggiornaTestataAi (Ares), openAiSheet / hmPiu / aggiornaSwitchHome / applicaHomeMan (pill), renderHorseInfoBox / eseguiSalvataggioHorse (lib3).
- 22/10 cancellate le cartelle vuote dello spostamento e la copia vecchia del codice allenatore (resta nella storia git); tolti i file .lock rimasti in .git.
- 22/10 SPACCHETTAMENTO completato per le funzioni avvolte dell'app: ZERO riassegnazioni rimaste. Nuovi strumenti nel core (020-nav.js): eseguiPrimaConStop (un "prima" puo fermare, es. conferma cambio microchip) e registraPerRuolo/versioneDelRuolo (versione di una funzione per ruolo: menu + di veterinario e allenatore, barra dell'allenatore, assistente AI "presto disponibile" del veterinario). Convertite: applicaHomeMan, hmPiu, openAiSheet, aggiornaSwitchHome, plCostruisciMenu, plNavAltri, renderChatCartelle, aggiornaTestataAi (Ares), renderHorseInfoBox, eseguiSalvataggioHorse, trOwnerCard. Verifiche: 4 ruoli OK; confronto prima/dopo per ogni ruolo di barra, menu +, assistente AI e messaggi = 0 differenze; confronto visivo identico; conferma microchip: "No" ferma il salvataggio, "Si" salva. Il controllo automatico fallisce se una di queste funzioni viene riassegnata.
