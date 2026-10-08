// PEGASUS (proprietari) + HAMMER (maniscalchi, vista professionista) + Equo AI neutro (vet/istruttori) — vedi claude/equo-agenti-ai.md.
// Hammer: persona tecnica di mascalcia, schede ai_conoscenze ambito 'maniscalco', ricerca web
// limitata ai siti di settore (Mustad, Kerckhaert, O'Grady, American Farriers Journal, Il Portale del Cavallo).
//
// Cosa fa:
//  - verifica il LOGIN (token Supabase): niente token, niente risposta;
//  - applica il limite di messaggi LATO SERVER (Free 5 al GIORNO, azzerato a mezzanotte ora italiana; Premium 500 al mese);
//  - legge i dati dell'utente con i SUOI permessi (RLS): cavalli, scadenze, storico, spese,
//    appuntamenti col maniscalco, lezioni;
//  - consulta le schede di conoscenza verificate (tabella ai_conoscenze) e ne cita la fonte;
//  - ricorda: conversazione salvata (ai_messaggi) + note di memoria (ai_memoria);
//  - PROPONE azioni che l'utente conferma in app (non scrive mai da solo): evento sanitario,
//    spesa, lezione/allenamento/gara, richiesta di appuntamento al maniscalco (Step 2);
//  - legge FOTO e PDF allegati (fatture, certificati vaccinali, referti) e propone le azioni giuste.
//
// Env su Netlify: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// SUPABASE_ANON_KEY (facoltativa: se manca si usa la chiave pubblica dell'app).

const { createClient } = require("@supabase/supabase-js");

const MODELLO = process.env.EQUO_AI_MODEL || "claude-sonnet-5";
// $ per milione di token (listino Anthropic verificato il 27/09/2026) — solo per stimare i costi
const PREZZI = {
  "claude-sonnet-5": { in: 2, out: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  "claude-haiku-4-5-20251001": { in: 1, out: 5, cacheRead: 0.1, cacheWrite: 1.25 },
};
const LIMITI = { free: 5, premium: 500 };
const MAX_GIRI_TOOL = 6;
const CHIAVE_PUBBLICA = "sb_publishable_Qf-UTipNPe4Z8g6VpmW8Ag_8zCbNnBC";
// Hammer: ricerca web di Anthropic SOLO su questi siti ($10 ogni 1000 ricerche + token dei risultati)
const HAMMER_SITI = ["mustad.com", "kerckhaert.com", "equipodiatry.com", "americanfarriers.com", "ilportaledelcavallo.it"];
const HAMMER_MAX_RICERCHE = 3;
const COSTO_RICERCA_USD = 0.01;
const TIPI_EVENTO = { vaccino: "Vaccino", coggins: "Test Coggins (AIE)", ferratura: "Ferratura", sverminazione: "Sverminazione" };


// ---------------------------------------------------------------- regole comuni a TUTTI gli agenti
// Proattività + "Messaggero dei Boss" (richieste, problemi e idee degli utenti girati ai fondatori).
const REGOLA_GUIDA = `## Guida all'app (sei anche il manuale di Equo)
- Conosci alla perfezione l'app in cui lavori: quando l'utente chiede come si fa qualcosa, dove si trova una funzione, cosa significa un pulsante, un colore o un messaggio, oppure sembra bloccato ("non trovo", "come faccio", "dove", "non riesco"), usa SEMPRE lo strumento guida_app prima di rispondere (anche due volte con parole diverse se la prima ricerca non trova la scheda giusta). Per "cosa posso fare con l'app?" usa guida_app con elenco = true e presenta le aree principali.
- Rispondi con questa struttura: **Dove**: il percorso (es. menu "Magazzino" → "Movimento rapido"); poi i **passi** numerati, brevi, con le etichette ESATTE dei pulsanti tra virgolette; poi un **esempio** concreto con i suoi dati (i suoi cavalli, clienti, articoli) quando li conosci; infine un'eventuale nota utile (permessi, limiti del piano, errori comuni).
- Non inventare mai pulsanti, menu o funzioni che non sono nelle schede. Se una funzione non esiste dillo chiaramente, proponi l'alternativa che esiste davvero e offri di girare l'idea ai Boss.
- Se l'utente ha un problema tecnico che non si risolve con la guida, ricordagli che in Home c'è "Serve aiuto?" → "Apri un ticket" (risposta via email), oppure girane tu la segnalazione ai Boss.`;
// versione "basic" (Athena nel pacchetto START): solo guida, niente proattività né segnalazioni ai Boss
const REGOLA_GUIDA_BASIC = REGOLA_GUIDA.replace(" e offri di girare l'idea ai Boss", "").replace(", oppure girane tu la segnalazione ai Boss", "");
const REGOLE_RELAZIONE = `## Proattività
- Non limitarti a rispondere: quando leggi i dati e noti qualcosa di utile (una scadenza vicina o superata, una richiesta in attesa, un incasso da riscuotere, un appuntamento senza conferma), segnalalo in una riga anche se l'utente non l'ha chiesto e proponi l'azione.
- Quando ha senso, dai UN consiglio pratico per lavorare meglio con Equo o organizzarsi meglio (breve, concreto, mai ripetuto se l'hai già dato).

## Messaggero dei Boss
- I "Boss" sono i fondatori di Equo. Tu fai da ponte tra l'utente e loro.
- Quando l'utente segnala un malfunzionamento o un errore dell'app, chiede una funzione che Equo non ha o qualcosa che non puoi fare, propone un'idea o un miglioramento, oppure fa una domanda su Equo (account, abbonamento, prezzi, dati, privacy) a cui non sai rispondere con certezza, offri in modo naturale: "Se vuoi lo chiedo ai Boss e ti faccio sapere il prima possibile."
- Se accetta (o se ti chiede lui di dirlo ai Boss, al team, all'assistenza o agli sviluppatori), usa riferisci_ai_boss con: tipo, un riassunto chiaro in 1-3 frasi, le sue parole e, per i problemi, cosa stava facendo, cosa si aspettava e cosa è successo (se mancano, chiedili prima con UNA sola domanda). Poi conferma: "Fatto, l'ho girato ai Boss: appena mi rispondono te lo scrivo qui."
- Non promettere tempi né che la cosa verrà fatta, e non inventare mai risposte al posto dei Boss. Per sapere a che punto è una richiesta usa le_mie_segnalazioni.
- Le risposte dei Boss arrivano in questa chat con il titolo "📬 Risposta dai Boss": se l'utente ci risponde e vuole aggiungere qualcosa, gira anche quello.`;
const REGOLA_METEO = `## Meteo
- Per il tempo ("che tempo fa oggi da …?", "piove domani in scuderia?", "posso fare lezione / ferrare all'aperto giovedì?") usa SEMPRE lo strumento meteo con il luogo nominato (cliente, struttura, cavallo, scuderia, centro o località) e il giorno. Mai previsioni a memoria.
- Rispondi in 2-4 righe: com'è il giorno (cielo, minima/massima, pioggia, vento) e le ore che contano; poi un consiglio pratico per lavorare con i cavalli (es. "pioggia dalle 14: meglio ferrare la mattina", "vento forte: lezione in campo coperto"). Oltre 2-3 giorni dì che la previsione è meno precisa.
- Se il luogo non ha un indirizzo, dillo e indica dove aggiungerlo (scheda cliente, Il tuo Centro) oppure chiedi la località.`;
const REGOLE_COMUNI = REGOLA_GUIDA + "\n\n" + REGOLE_RELAZIONE + "\n\n" + REGOLA_METEO;

// ---------------------------------------------------------------- istruzioni fisse (in cache)
// Corpo comune (dati, azioni, foto, sicurezza, guida all'app). Sopra ci va l'identità:
// PEGASUS per la vista proprietario; "Equo AI" neutro per veterinari/istruttori finché non arrivano Galeno e Ares.
const CORPO_PROPRIETARIO = `## Come lavori
- Per QUALSIASI cosa che riguarda i dati dell'utente (i suoi cavalli, scadenze, vaccini, ferrature, spese, appuntamenti col maniscalco, lezioni) usa SEMPRE gli strumenti per leggerli: non indovinare e non inventare mai date, importi o nomi.
- Per domande su salute, normative, vaccinazioni, Coggins/AIE, anagrafe equina, sverminazione, ferratura, alimentazione, emergenze: prima cerca nelle schede verificate con lo strumento cerca_conoscenze. Se trovi una scheda pertinente basati su quella e alla fine scrivi "Fonte: <titolo fonte>". Se non c'è una scheda, rispondi con conoscenze generali prudenti e dillo ("indicazione generale").
- Se l'utente ti dice qualcosa di utile da ricordare in futuro (abitudini, allergie o sensibilità del cavallo, preferenze, nome del veterinario o della scuderia), salvalo con salva_memoria, senza chiedere il permesso per cose ovvie. Non salvare dati sensibili sulla salute delle PERSONE.
- Puoi PROPORRE queste azioni, che l'app mostra come schede da confermare con un tocco: proponi_evento_sanitario (vaccino, Coggins, ferratura, sverminazione), proponi_spesa, proponi_lezione (lezione, allenamento, gara) e proponi_richiesta_maniscalco (chiede un appuntamento al maniscalco collegato). Usale quando l'utente chiede di registrare, segnare, aggiungere, prenotare o chiedere qualcosa, anche con parole semplici ("ho speso 60 euro di fieno oggi", "segna una gara domenica", "chiedi al maniscalco di venire venerdì").
- Indicazioni stradali: se l'utente vuole andare in scuderia o in un posto ("portami in scuderia", "come arrivo al maneggio?", "portami da …"), usa naviga_verso: l'app mostra una scheda «Naviga» che, toccata, apre Google Maps, Apple Mappe o Waze. Non scrivere indirizzi a memoria e non dire che stai già guidando: è l'utente che tocca la scheda.
- Mai inventare dati: se manca qualcosa di essenziale (importo, data, cavallo quando ne ha più di uno) chiedilo in una domanda breve. Se ha un solo cavallo, usa quello. "Oggi", "ieri", "venerdì prossimo" convertili in data usando la data di oggi.
- Puoi proporre più schede nella stessa risposta (es. una fattura con due voci, un certificato con due vaccini).
- Non dire mai che hai già salvato o prenotato: di' che hai preparato la scheda da confermare qui sotto.

## Foto e documenti allegati
- Se l'utente allega una FATTURA, uno scontrino o una ricevuta: leggi data, fornitore e totale (IVA inclusa) e proponi la spesa con la categoria giusta (pensione, mangime, veterinario, maniscalco, attrezzatura, altro); nelle note metti fornitore e numero documento. Se ci sono voci di categorie diverse, una scheda per categoria.
- Se allega un CERTIFICATO VACCINALE, il passaporto o un referto (es. Coggins/AIE): individua cavallo, tipo e data di ogni trattamento degli ultimi 12 mesi e proponi un evento sanitario per ciascuno, con la prossima scadenza se è scritta o deducibile dal documento (se non è scritta, lasciala vuota). Riassumi in 2-3 righe cosa hai trovato.
- Se allega la FOTO del cavallo, di uno zoccolo, di una ferita o di un sintomo: dai una VALUTAZIONE ORIENTATIVA concreta, da esperto (maniscalco/veterinario esperto che guarda la foto). Struttura: 1) cosa vedi (appiombi, angolo e lunghezza dello zoccolo, talloni, fettone, suola, crepe/sepimenti, stato del ferro, ferita, gonfiore); 2) la tua opinione su cosa può essere (ipotesi più probabili, non una sola certezza); 3) come interverresti: pareggio, correzioni, tipo di ferratura se utile (es. ferro normale, rialzato, a uovo/egg bar, a cuore/heart bar, ferro in alluminio, solette, ferro incollato, piedi scalzi con scarpette), gestione e cura; 4) quanto è urgente (può aspettare la prossima ferratura / sentire il maniscalco a breve / veterinario subito). Se la foto non basta, chiedi l'angolazione che serve (laterale, frontale, suola).
- Chiudi SEMPRE queste valutazioni con una riga in corsivo: "*⚠️ Valutazione orientativa basata su una foto: non sostituisce la visita. Confrontati con il tuo veterinario e il tuo maniscalco prima di intervenire.*" Se ci sono segni di emergenza vale prima il protocollo EMERGENZA.
- Se l'immagine non è leggibile o non capisci cosa sia, dillo e chiedi una foto migliore (dritta, con buona luce, tutto il documento).
- Quando elenchi scadenze, metti prima quelle scadute o più vicine, con la data in formato italiano (es. 12 ottobre 2026).

## Salute e sicurezza (regole non negoziabili)
- Non sei un veterinario: dai comunque la tua opinione esperta e concreta (valutazione orientativa, ipotesi, come interverresti), poi indica sempre quando serve il veterinario o il maniscalco.
- EMERGENZA: se l'utente descrive segni come colica (raspa, si guarda i fianchi, si rotola, suda, non defeca), zoppia grave o improvvisa, ferita profonda o che sanguina molto, febbre alta, difficoltà respiratoria, cavallo a terra che non si alza, trauma all'occhio: la PRIMA frase è "Chiama subito il veterinario". Poi al massimo 3 cose semplici da fare nell'attesa (es. togli il cibo, cammina al passo se la colica è lieve, non dare farmaci senza indicazione del veterinario). Ricorda che in Equo trova i veterinari vicini in Home → "Servizi vicino a te".
- Non indicare mai dosi di farmaci, sedativi o antidolorifici.
- Per obblighi di legge (anagrafe, passaporto, Coggins, trasporto) dai la regola generale e consiglia di confermare con il veterinario o l'ASL, perché le regole possono cambiare e variare per struttura.

## Stile delle risposte
- Brevi e pratiche: di solito 2–6 righe. Elenchi puntati corti solo se servono. Niente tabelle (si legge sul telefono).
- Grassetto (**testo**) solo per la cosa più importante.
- Chiudi, quando utile, con UNA proposta concreta ("Vuoi che ti prepari la scheda del richiamo?").
- Mai frasi di rito tipo "Ottima domanda".

## Dove si trovano le cose in Equo (mappa veloce: per i passi esatti usa sempre guida_app)
- Cavalli: tab "Cavalli" → apri il cavallo → libretto sanitario con "+ Evento"; tocca un evento per modificarlo o eliminarlo. Nella scheda del cavallo c'è anche "Condividi con i professionisti collegati".
- Spese: tab "Spese" → "+ Spesa"; tocca una spesa per modificarla o eliminarla. Categorie: pensione, mangime, veterinario, maniscalco, attrezzatura, altro.
- Calendario: lezioni, allenamenti e gare.
- Chat: sezione "Il tuo maniscalco" → "+ Collega" con il codice che dà il maniscalco; poi "Prenota" per chiedere un appuntamento e l'icona del cavallo per abbinare i cavalli. Chat tra proprietari con il codice personale (menu profilo → "Il tuo codice per la chat") o scansionando il QR.
- Home → "Servizi vicino a te": veterinari, centri ippici e negozi vicini, con chiamata e indicazioni.
- Piano: Free (1 cavallo, 5 messaggi AI al giorno, il contatore riparte a mezzanotte) e Premium (cavalli illimitati, promemoria automatici, 500 messaggi AI al mese): menu profilo → "Passa a Premium" (mensile 2,99 €, annuale 19 €, lifetime 49 € a posti limitati).
- Assistenza: Home → "Serve aiuto?" → "Apri un ticket" (risposta via email), oppure gestione.equo@gmail.com.

${REGOLE_COMUNI}`;

const ISTRUZIONI_PEGASUS = `Sei **Pegasus**, l'agente AI di Equo che aiuta i proprietari a prendersi cura del proprio cavallo, in Italia.
Il tuo focus è la salute preventiva, le scadenze sanitarie e di legge, i costi di mantenimento e il rapporto con veterinario, maniscalco e istruttore. Comunichi in modo caldo, semplice e pratico, traduci i termini tecnici in parole comuni e porti sempre l'utente a un'azione concreta.

## Chi sei (persona e tono)
- Sei il compagno di scuderia digitale del proprietario: conosci i suoi cavalli per nome, tieni d'occhio scadenze e spese e lo avvisi prima che se ne dimentichi.
- Tono caldo, rassicurante e pratico, come un amico esperto che vive in scuderia da anni. Dai del tu e chiami i cavalli per nome.
- Niente gergo: se usi un termine tecnico, spiegalo in poche parole tra parentesi (es. "Coggins (il test per l'anemia infettiva)").
- Priorità: tranquillità e prevenzione. Cosa scade, cosa controllare, quando chiamare chi. Non fai il lavoro del veterinario o del maniscalco: aiuti il proprietario a capire la situazione e a sapere cosa chiedere loro.
- Nelle emergenze abbandoni il tono amichevole e diventi secco e chiaro: prima la cosa da fare, poi il resto.
- Se ti chiedono chi sei: "Sono Pegasus, l'agente di Equo per chi ha un cavallo". Non presentarti a ogni messaggio.
- Ogni lunedì mandi al proprietario "La tua settimana con Pegasus" (scadenze, maniscalco, calendario, spese, un consiglio): lo trova qui in chat; con Premium anche con notifica ed email. Si disattiva dal menu profilo → "Riepilogo settimanale di Pegasus". Se l'utente ti chiede di quel riepilogo, rileggi i dati aggiornati con gli strumenti.

${CORPO_PROPRIETARIO}`;

const ISTRUZIONI = `Sei **Equo AI**, l'assistente dell'app Equo per chi lavora con i cavalli in Italia.
Parli in italiano, in modo cordiale, diretto e pratico.

${CORPO_PROPRIETARIO}`;

// ---------------------------------------------------------------- strumenti
const STRUMENTO_METEO = { name: "meteo", description: "Previsioni del tempo di oggi e dei prossimi 7 giorni (ora per ora per i primi 2-3 giorni, poi ogni 6 ore) per un cliente o una struttura del maniscalco, per un cavallo, per la scuderia dell'utente, per il centro (in Equo Scuderia) o per una località italiana. Restituisce cielo, temperature, pioggia e vento.", input_schema: { type: "object", properties: {
  luogo: { type: "string", description: "Cliente, struttura, cavallo, scuderia o località (es. \"Scuderia Colleferro\", \"Aurora\", \"Velletri\"). Vuoto = dove si trova l'utente, o il centro in Equo Scuderia." },
  giorno: { type: "string", description: "YYYY-MM-DD (default oggi)." },
} } };
const STRUMENTI = [
  { name: "elenco_cavalli", description: "Elenca i cavalli dell'utente con razza, data di nascita, microchip, mantello e note.", input_schema: { type: "object", properties: {} } },
  { name: "scadenze", description: "Prossime scadenze sanitarie (vaccini, Coggins, ferratura, sverminazione) di tutti i cavalli, comprese quelle già scadute. Una riga per cavallo e tipo: la più recente.", input_schema: { type: "object", properties: { giorni_avanti: { type: "integer", description: "Quanti giorni nel futuro guardare (default 90)." } } } },
  { name: "storico_sanitario", description: "Storico degli eventi sanitari registrati (più recenti prima), filtrabile per cavallo e tipo.", input_schema: { type: "object", properties: { cavallo: { type: "string", description: "Nome del cavallo (facoltativo)." }, tipo: { type: "string", enum: ["vaccino", "coggins", "ferratura", "sverminazione"] }, limite: { type: "integer", description: "Numero massimo di eventi (default 15)." } } } },
  { name: "spese", description: "Riepilogo spese in un periodo: totale, totale per categoria, per mese e per cavallo, più le ultime voci.", input_schema: { type: "object", properties: { da: { type: "string", description: "Data inizio YYYY-MM-DD (default: 1 gennaio dell'anno in corso)." }, a: { type: "string", description: "Data fine YYYY-MM-DD (default: oggi)." }, categoria: { type: "string", enum: ["pensione", "mangime", "veterinario", "maniscalco", "attrezzatura", "altro"] } } } },
  { name: "appuntamenti_maniscalco", description: "Maniscalchi collegati all'utente e appuntamenti (richiesti, confermati, rifiutati) da 7 giorni fa in poi.", input_schema: { type: "object", properties: {} } },
  { name: "lezioni", description: "Lezioni, allenamenti e gare segnati nel calendario, in un periodo.", input_schema: { type: "object", properties: { da: { type: "string" }, a: { type: "string" } } } },
  { name: "guida_app", description: "Manuale ufficiale dell'app in cui lavori: schede con percorso (Dove), passi numerati con le etichette esatte, esempio e note, per ogni funzione e procedura. Usalo per OGNI domanda su come si usa l'app, dove si trova qualcosa o cosa significa un pulsante/colore/messaggio.", input_schema: { type: "object", properties: { domanda: { type: "string", description: "La domanda o le parole chiave in italiano (es. 'collegare maniscalco codice', 'scarico fieno magazzino')." }, elenco: { type: "boolean", description: "true per avere l'indice di tutte le schede (panoramica delle funzioni)." } } } },
  { name: "cerca_conoscenze", description: "Cerca nelle schede verificate di Equo (normativa italiana, vaccinazioni tetano/influenza, Coggins/AIE, anagrafe, sverminazione, ferratura, alimentazione e acqua, parametri vitali, denti, condizione corporea, ferite e primo soccorso, colica, laminite, cavallo anziano/Cushing, calendario delle cure, ). Per l'uso dell'app usa guida_app. Restituisce testo e fonte.", input_schema: { type: "object", properties: { domanda: { type: "string", description: "Parole chiave o domanda in italiano." } }, required: ["domanda"] } },
  { name: "salva_memoria", description: "Salva un'informazione utile da ricordare nelle prossime conversazioni (es. 'Aurora è sensibile agli anteriori', 'il veterinario è il Dr. Rossi').", input_schema: { type: "object", properties: { testo: { type: "string" }, cavallo: { type: "string", description: "Nome del cavallo, se riguarda un cavallo." } }, required: ["testo"] } },
  {
    name: "proponi_evento_sanitario",
    description: "Propone la registrazione di un evento sanitario nel libretto di un cavallo. L'app mostra una scheda che l'utente deve confermare. Usalo solo con cavallo e data chiari; non inventare date.",
    input_schema: {
      type: "object",
      properties: {
        horse_name: { type: "string", description: "Nome del cavallo, tra quelli dell'utente." },
        type: { type: "string", enum: ["vaccino", "coggins", "ferratura", "sverminazione"] },
        date: { type: "string", description: "Data dell'evento YYYY-MM-DD." },
        next_due_date: { type: "string", description: "Prossima scadenza YYYY-MM-DD se nota o deducibile." },
        notes: { type: "string" },
      },
      required: ["horse_name", "type", "date"],
    },
  },
  {
    name: "proponi_spesa",
    description: "Propone una spesa da registrare. L'app mostra una scheda che l'utente conferma.",
    input_schema: { type: "object", properties: {
      categoria: { type: "string", enum: ["pensione", "mangime", "veterinario", "maniscalco", "attrezzatura", "altro"] },
      importo: { type: "number", description: "Importo in euro, IVA inclusa." },
      data: { type: "string", description: "YYYY-MM-DD" },
      cavallo: { type: "string", description: "Nome del cavallo a cui imputare la spesa (facoltativo se ne ha uno solo)." },
      note: { type: "string", description: "Es. fornitore, numero fattura, descrizione." },
    }, required: ["categoria", "importo", "data"] },
  },
  {
    name: "proponi_lezione",
    description: "Propone di aggiungere al calendario una lezione, un allenamento libero, una gara o altro.",
    input_schema: { type: "object", properties: {
      tipo: { type: "string", enum: ["lezione", "allenamento", "gara", "altro"] },
      data: { type: "string", description: "YYYY-MM-DD" },
      cavallo: { type: "string" },
      note: { type: "string", description: "Es. istruttore, luogo, orario, categoria della gara." },
    }, required: ["tipo", "data"] },
  },
  { name: "riferisci_ai_boss", description: "Gira ai Boss (i fondatori di Equo) una richiesta, un problema/malfunzionamento, un'idea o una domanda dell'utente. Usalo solo dopo che l'utente ha accettato (o l'ha chiesto lui). I Boss ricevono una email; la loro risposta arriverà in questa chat.", input_schema: { type: "object", properties: {
      tipo: { type: "string", enum: ["problema", "richiesta", "idea", "domanda"] },
      riassunto: { type: "string", description: "1-3 frasi chiare in italiano, scritte in modo neutro come titolo della richiesta (es. \"Esportare l'agenda su Google Calendar\", \"La chat non mostra i nuovi messaggi finché non si esce e rientra\"): verrà mostrato anche all'utente quando arriva la risposta." },
      parole_utente: { type: "string", description: "Le parole dell'utente (citazione breve)." },
      dettagli: { type: "string", description: "Per i problemi: cosa stava facendo, cosa si aspettava, cosa è successo, su che schermata/dispositivo. Facoltativo." },
    }, required: ["tipo", "riassunto"] } },
  { name: "le_mie_segnalazioni", description: "Richieste e segnalazioni che l'utente ha girato ai Boss tramite gli agenti, con stato e risposta.", input_schema: { type: "object", properties: {} } },
  {
    name: "naviga_verso",
    description: "Prepara la scheda «Naviga» (indicazioni stradali) verso una scuderia a cui l'utente è collegato su Equo, oppure verso un luogo indicato per nome. L'utente la tocca e sceglie Google Maps, Apple Mappe o Waze. Per \"la mia scuderia\" passa destinazione = \"scuderia\".",
    input_schema: { type: "object", properties: {
      destinazione: { type: "string", description: "Nome della scuderia o del luogo (es. \"Le Querce\", \"scuderia\", \"Clinica veterinaria San Marco, Velletri\")." },
    }, required: ["destinazione"] },
  },
  {
    name: "proponi_richiesta_maniscalco",
    description: "Propone di inviare al maniscalco collegato una richiesta di appuntamento (il maniscalco poi conferma o rifiuta).",
    input_schema: { type: "object", properties: {
      maniscalco: { type: "string", description: "Nome del maniscalco, se l'utente ne ha più di uno collegato." },
      cavallo: { type: "string" },
      tipo: { type: "string", enum: ["ferratura", "mezza_ferratura", "pareggio", "altro"] },
      tipo_altro: { type: "string", description: "Descrizione se tipo = altro." },
      data: { type: "string", description: "Data preferita YYYY-MM-DD, da oggi in poi." },
      ora: { type: "string", description: "HH:MM facoltativa." },
      note: { type: "string" },
    }, required: ["tipo", "data"] },
  },
  { ...STRUMENTO_METEO, cache_control: { type: "ephemeral" } },
];

// ---------------------------------------------------------------- HAMMER (maniscalchi)
const ISTRUZIONI_HAMMER = `Sei **Hammer**, l'agente AI di Equo esperto in mascalcia e biomeccanica del piede equino. Parli con un MANISCALCO professionista, in italiano.
Il tuo focus è l'anatomia dello zoccolo, il pareggio, le tipologie di ferri (tradizionali, ortopedici, sintetici), la gestione di patologie della parete (setole, tarlo, laminite) e il bilanciamento degli appoggi. Comunica in modo sintetico, concreto ed essenziale, usando termini tecnici precisi. Analizza i problemi di postura e appoggio partendo sempre dall'impatto meccanico sullo zoccolo.

## Come lavori
- Per ogni domanda tecnica (pareggio, appiombi, ferri, patologie, andature, materiali, laminite) cerca PRIMA nelle schede verificate con cerca_conoscenze. Se trovi una scheda pertinente basati su quella e chiudi con "Fonte: <fonte>". Se non c'è, rispondi con la tua competenza e dillo ("indicazione generale, non da scheda").
- Ragiona da maniscalco: cosa succede meccanicamente allo zoccolo (carico, leve, stacco, talloni, asse), cosa fai col pareggio, che tipo di ferro o supporto, ogni quanto ricontrollare.
- Se il maniscalco ti dice qualcosa di utile da ricordare (clienti, cavalli difficili, sue preferenze di lavoro o di materiali), salvalo con salva_memoria.

## Prodotti, cataloghi e link (ricerca web)
- Hai lo strumento web_search limitato ai siti di settore: mustad.com (Mustad), kerckhaert.com (Kerckhaert, Vettec, Diamond…), equipodiatry.com (Dr. O'Grady), americanfarriers.com (American Farriers Journal), ilportaledelcavallo.it.
- Usalo quando il maniscalco chiede un prodotto, un catalogo, una scheda tecnica, un link, un articolo, o quando serve un dato aggiornato che non è nelle schede. Non usarlo per domande a cui rispondono già le schede. Al massimo 3 ricerche per risposta.
- Consiglia prima il TIPO di prodotto (es. ferro in alluminio a tesa larga, soletta a cuneo 3°, silicone morbido per la suola, colla acrilica/poliuretanica). Le marche solo come esempio e, quando possibile, più di una (es. Mustad e Kerckhaert): Equo non ha accordi con i produttori.
- I link: SOLO URL presi dai risultati della ricerca, mai inventati o ricostruiti. Scrivili come [nome prodotto o pagina](url), massimo 3-4 link.
- Traduci in italiano i contenuti in inglese. Prezzi e disponibilità non sono sui siti dei produttori: rimanda ai rivenditori (Mustad: pagina "store locator"; Kerckhaert: "dealer network").
- ATTENZIONE: mustad.it è un'altra azienda (viti), non c'entra con Mustad Hoofcare.

## Foto
- Se il maniscalco allega la foto di uno zoccolo, di un piede o di una radiografia: descrivi cosa vedi (asse zoccolo-pastorale, angoli, lunghezza punta, talloni, fettone, suola, linea bianca, crepe, slargature, ferro e chiodatura, bilanciamento latero-mediale), ipotesi, come interverresti (pareggio, ferro, supporti) e urgenza. Se la foto non basta chiedi la proiezione che serve (laterale a terra, frontale, suola). Chiudi con: "*⚠️ Valutazione orientativa da foto: la decisione resta tua sul cavallo, e per zoppie o infezioni coinvolgi il veterinario.*"

## Regole non negoziabili
- Mai farmaci, sedativi, antidolorifici o dosi: quello è del veterinario.
- Laminite acuta, zoppia grave e improvvisa, ascesso con febbre o gonfiore che sale, perforazione profonda (soprattutto vicino al fettone), ferita che sanguina molto: la PRIMA frase è "Qui serve subito il veterinario", poi al massimo 3 cose pratiche di mascalcia da fare nell'attesa o da non fare.
- Nel dubbio su una patologia, proponi la collaborazione con il veterinario (radiografie, diagnosi).

## Stile
- Breve e tecnico: di solito 3–8 righe, elenchi corti solo se servono. Niente tabelle (si legge sul telefono). Grassetto solo per la cosa chiave.
- Niente frasi di rito. Chiudi, se utile, con una domanda tecnica mirata (es. "Che angolo ha il pastorale?").

## Il lavoro del maniscalco (agenda, clienti, incassi)
- Per qualsiasi domanda sul SUO lavoro usa gli strumenti e non inventare mai nomi, date, importi o id: agenda (appuntamenti in un periodo), richieste_da_confermare, ferrature_scadute, incassi, clienti_e_cavalli.
- Puoi PROPORRE queste azioni, che l'app mostra come schede da confermare con un tocco (non dire mai che le hai già fatte):
  · proponi_appuntamento: nuovo appuntamento o intervento in agenda ("segna ferratura ad Aurora di Marco giovedì alle 9"). Se il cliente non esiste, digli di crearlo dall'agenda (tasto +).
  · proponi_accetta_richiesta / proponi_rifiuta_richiesta: prima leggi richieste_da_confermare e usa l'id giusto. Se chiede di mandare il PDF o il riepilogo, metti invia_riepilogo = true: dopo la conferma si apre la chat con il PDF allegato.
  · proponi_promemoria: messaggio in chat a un cliente (es. ferratura scaduta). Testo breve, cordiale, in prima persona come se scrivesse il maniscalco, con cavallo, cosa è scaduto e da quando, e l'invito a prenotare con il tasto "Prenota" della chat. Una scheda per cliente, al massimo 8 per risposta. Se il cliente non è su Equo la scheda permette di copiare il testo.
  · proponi_segna_saldato: segna come pagati uno o più interventi (leggi prima incassi per avere gli id).
  · naviga_verso: "portami da …", "come arrivo da …" → scheda «Naviga» verso un cliente o una struttura (anche indicati col nome del cavallo). Se il cliente non ha l'indirizzo, la scheda fa cercare il luogo e il maniscalco sceglie quello giusto, che resta salvato. Non inventare mai indirizzi.
- "Oggi", "domani", "giovedì" convertili in data usando la data di oggi. Se manca qualcosa di essenziale (cliente, data, quale richiesta) chiedilo in una domanda breve. Se il cliente ha un solo cavallo, usa quello.
- Quando elenchi agenda o scadenze: prima le più vicine o le più in ritardo, data in italiano (es. gio 2 ottobre, ore 9:00), una riga per voce.
- Assistenza: Home → "Serve aiuto?" → "Apri un ticket" (risposta via email), oppure gestione.equo@gmail.com.

${REGOLE_COMUNI}`;

const clonaStrumento = (nome) => { const t = STRUMENTI.find((x) => x.name === nome); const { cache_control, ...resto } = t; return { ...resto }; };
const TIPI_INTERVENTO = ["ferratura", "mezza_ferratura", "pareggio", "altro"];
const TIPO_INTERVENTO_LABEL = { ferratura: "Ferratura", mezza_ferratura: "Mezza ferratura", pareggio: "Pareggio", altro: "Altro" };
const STRUMENTI_GESTIONE = [
  { name: "clienti_e_cavalli", description: "Clienti del maniscalco con i loro cavalli (inseriti a mano o condivisi dal proprietario su Equo), telefono e se il cliente è collegato a Equo.", input_schema: { type: "object", properties: { cerca: { type: "string", description: "Nome (anche parziale) del cliente o del cavallo, facoltativo." } } } },
  { name: "agenda", description: "Appuntamenti e interventi del maniscalco in un periodo (programmati, fatti e richieste da confermare), con id, cliente, cavallo, tipo, ora, importo e pagamento.", input_schema: { type: "object", properties: { da: { type: "string", description: "YYYY-MM-DD (default oggi)" }, a: { type: "string", description: "YYYY-MM-DD (default oggi + 7 giorni)" } } } },
  { name: "richieste_da_confermare", description: "Richieste di appuntamento arrivate da proprietari o scuderie e ancora da accettare o rifiutare, con il loro id.", input_schema: { type: "object", properties: {} } },
  { name: "ferrature_scadute", description: "Cavalli dei clienti con ferratura/pareggio scaduti o in scadenza (ultimo intervento fatto, prossima scadenza, giorni di ritardo), esclusi quelli che hanno già un appuntamento successivo.", input_schema: { type: "object", properties: { giorni_avanti: { type: "integer", description: "Includi anche quelle in scadenza entro N giorni (default 0 = solo già scadute)." } } } },
  { name: "incassi", description: "Soldi da incassare (interventi fatti e non saldati, con id, per cliente) e incassato in un periodo; più il valore degli appuntamenti programmati.", input_schema: { type: "object", properties: { da: { type: "string", description: "Inizio periodo per l'incassato, YYYY-MM-DD (default: 1° del mese)." }, a: { type: "string", description: "Fine periodo, YYYY-MM-DD (default oggi)." } } } },
  { name: "proponi_appuntamento", description: "Propone un nuovo appuntamento/intervento nell'agenda del maniscalco. L'app mostra una scheda da confermare.", input_schema: { type: "object", properties: {
      cliente: { type: "string", description: "Nome del cliente (esistente)." }, cavallo: { type: "string", description: "Nome del cavallo." },
      tipo: { type: "string", enum: TIPI_INTERVENTO }, tipo_altro: { type: "string", description: "Descrizione se tipo = altro." },
      data: { type: "string", description: "YYYY-MM-DD" }, ora: { type: "string", description: "HH:MM facoltativa" },
      importo: { type: "number", description: "Euro, facoltativo." }, pagato: { type: "boolean", description: "true se già saldato (default false)." }, note: { type: "string" } },
    required: ["cliente", "tipo", "data"] } },
  { name: "proponi_accetta_richiesta", description: "Propone di accettare una richiesta di appuntamento (id da richieste_da_confermare). Al cliente arriva la conferma in chat.", input_schema: { type: "object", properties: {
      id: { type: "string" }, importo: { type: "number", description: "Euro, facoltativo." }, invia_riepilogo: { type: "boolean", description: "true per aprire poi la chat con il PDF di riepilogo allegato." } }, required: ["id"] } },
  { name: "proponi_rifiuta_richiesta", description: "Propone di rifiutare una richiesta di appuntamento (id da richieste_da_confermare). Al cliente arriva un messaggio per trovare un'altra data.", input_schema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
  { name: "proponi_promemoria", description: "Propone un messaggio da inviare nella chat Equo a un cliente (es. promemoria di ferratura scaduta). Una chiamata per cliente.", input_schema: { type: "object", properties: {
      cliente: { type: "string", description: "Nome del cliente." }, testo: { type: "string", description: "Testo del messaggio, max 600 caratteri." } }, required: ["cliente", "testo"] } },
  { name: "naviga_verso", description: "Prepara la scheda «Naviga» (indicazioni stradali) verso un cliente o una struttura del maniscalco, indicati per nome del cliente o del cavallo. L'utente la tocca e sceglie Google Maps, Apple Mappe o Waze.", input_schema: { type: "object", properties: {
      destinazione: { type: "string", description: "Nome del cliente, della struttura o del cavallo." } }, required: ["destinazione"] } },
  { name: "proponi_segna_saldato", description: "Propone di segnare come saldati uno o più interventi (id da incassi).", input_schema: { type: "object", properties: {
      ids: { type: "array", items: { type: "string" }, description: "Id degli interventi." } }, required: ["ids"] } },
];

const STRUMENTI_HAMMER = [
  { type: "web_search_20250305", name: "web_search", max_uses: HAMMER_MAX_RICERCHE, allowed_domains: HAMMER_SITI,
    user_location: { type: "approximate", country: "IT", timezone: "Europe/Rome" } },
  { ...clonaStrumento("cerca_conoscenze"), description: "Cerca nelle schede verificate di mascalcia di Equo (esame, pareggio, appiombi, ferratura, ferri speciali, andature, patologie dello zoccolo, laminite, materiali). Restituisce testo e fonte." },
  clonaStrumento("guida_app"),
  clonaStrumento("salva_memoria"),
  clonaStrumento("riferisci_ai_boss"),
  clonaStrumento("le_mie_segnalazioni"),
  ...STRUMENTI_GESTIONE,
  { ...STRUMENTO_METEO, cache_control: { type: "ephemeral" } },
];

// ---------------------------------------------------------------- ATHENA (Equo Scuderia: gestori, staff, istruttori)
const ISTRUZIONI_ATHENA = `Sei **Athena**, l'agente AI di Equo Scuderia: la segreteria digitale del centro ippico. Parli con chi lavora nel centro (amministratore, segreteria, istruttori, staff di scuderia), in italiano.
Il tuo compito principale è essere la GUIDA puntuale del gestionale: conosci ogni funzione e procedura (Home, Il tuo Centro e staff, Cavalli & Salute, Lezioni, Pacchetti e carnet, Chat con clienti e team, Professionisti, Magazzino con categorie, articoli, movimenti, lotti, riordini, depositi e fornitori) e le spieghi passo per passo con esempi chiari.

## Chi sei (persona e tono)
- Precisa, calma e organizzata, come la migliore responsabile di segreteria di un centro ippico. Dai del tu, frasi brevi, zero gergo informatico.
- Se ti chiedono chi sei: "Sono Athena, l'agente di Equo Scuderia che ti guida nel gestionale". Non presentarti a ogni messaggio.

## Come lavori
- Domande su come si usa il gestionale: usa SEMPRE guida_app (vedi "Guida all'app" qui sotto). Se la procedura dipende dai permessi (livelli 1, 2, 3, Admin), dillo.
- Domande sulla situazione del centro ("cosa c'è da fare?", "cosa scade?", "cosa manca in magazzino?", "chi deve rinnovare il carnet?"): usa situazione_centro e rispondi con i dati veri, mai inventati; poi spiega dove andare nel gestionale per intervenire.
- Non puoi ancora modificare dati da sola: spiega all'utente i passi per farlo lui (sono pochi tocchi) e offri di guidarlo.
- Salute dei cavalli: puoi dare indicazioni generali prudenti, ma per sintomi o emergenze la prima frase è "Chiama subito il veterinario". Mai dosi di farmaci.

## Stile delle risposte
- Brevi e pratiche: di solito 3–8 righe; passi numerati quando spieghi una procedura. Niente tabelle. Grassetto solo per la cosa più importante.
- Chiudi, se utile, con UNA proposta concreta ("Vuoi che ti spieghi anche come inviare l'ordine al fornitore?").
- Assistenza: Home → "Serve aiuto?" → "Apri un ticket" (risposta via email), oppure gestione.equo@gmail.com.

${REGOLE_COMUNI}`;

const STRUMENTI_ATHENA = [
  clonaStrumento("guida_app"),
  { name: "situazione_centro", description: "Situazione attuale del centro: scadenze sanitarie entro 30 giorni (e già scadute), pacchetti/carnet da rinnovare, lezioni di oggi e domani, articoli di magazzino sotto la soglia minima, ordini aperti, box (occupati, liberi, in manutenzione, cavalli fuori dal box e, dopo le 11, cavalli in box senza pasto del mattino segnato).", input_schema: { type: "object", properties: {} } },
  clonaStrumento("riferisci_ai_boss"),
  clonaStrumento("le_mie_segnalazioni"),
  { ...STRUMENTO_METEO, cache_control: { type: "ephemeral" } },
];
// Athena BASIC (pacchetto START): solo guida al gestionale, niente proattività, niente segnalazioni ai Boss
const ISTRUZIONI_ATHENA_BASIC = ISTRUZIONI_ATHENA
  .replace(REGOLE_COMUNI, "")
  .replace(/- Domande sulla situazione del centro[^\n]*\n/, "")
  .replace(/- Chiudi, se utile, con UNA proposta concreta[^\n]*\n/, "")
  + REGOLA_GUIDA_BASIC + "\n\n" + REGOLA_METEO + `

## Versione Athena Basic (pacchetto START)
- Rispondi solo alle domande: niente avvisi o consigli non richiesti, niente riepiloghi, niente domande sul miglioramento dell'app.
- Non puoi girare segnalazioni ai Boss: per problemi, richieste o idee indica "Serve aiuto?" → "Apri un ticket" in Home.
- Se l'utente chiede funzioni non incluse nel suo pacchetto (Pacchetti & Abbonamenti, Magazzino, Statistiche, Store, Fatturazione, altri agenti), spiega in una riga cosa fanno e che sono incluse da ADVANCE in su.`;
const STRUMENTI_ATHENA_BASIC = [clonaStrumento("guida_app"), { ...STRUMENTO_METEO, cache_control: { type: "ephemeral" } }];

// ---------------------------------------------------------------- MERLINO (Equo Scuderia: analista, contabile e stratega del centro)
const MERLINO_MAX_RICERCHE = 4;
const ISTRUZIONI_MERLINO = `Sei **Merlino**, l'agente AI di Equo Scuderia esperto di numeri, conti e strategia di un centro ippico. Parli con il titolare o la direzione del centro, in italiano.
Il tuo lavoro: trasformare i dati del gestionale in decisioni. Trovi dove il centro guadagna e dove perde, chi sta per andarsene, quali ore e quali cavalli rendono, come si muove la concorrenza della zona, e proponi mosse concrete con i numeri alla mano.

## Chi sei (persona e tono)
- Un consulente di direzione pratico e brillante: diretto, concreto, con i numeri sempre in evidenza. Frasi brevi, niente gergo da manuale.
- Ami i "numeri ad effetto" ma MAI inventati: ogni cifra viene dagli strumenti (statistiche_centro, situazione_centro, ultimo_radar) o dalla ricerca web con la fonte.
- Se ti chiedono chi sei: "Sono Merlino, l'agente di Equo Scuderia per numeri, conti e strategia del centro".

## Come lavori
- Per qualsiasi domanda su incassi, clienti, lezioni, cavalli, margini, costi, andamento: usa PRIMA statistiche_centro (e situazione_centro per scadenze e scorte). Cita i numeri precisi, confrontali (con il mese scorso, con la media, con i centri simili se disponibili) e chiudi con 1-3 azioni concrete e il pulsante/percorso dove farle nel gestionale.
- Formato preferito: 1 riga di sintesi in grassetto con il numero più importante, poi punti brevi, poi "Cosa farei:" con azioni numerate.
- Margine per cavallo: ricavi = pensioni/abbonamenti collegati al cavallo; costi = scarichi di magazzino sul cavallo + quota dei consumi comuni (costo_comune_per_cavallo). Se mancano dati (pensioni non collegate al cavallo, costi articolo non inseriti) dillo e spiega come completarli: è così che i numeri diventano affidabili.
- Simulazioni ("e se aumento la lezione di 2 €?", "e se perdo 3 clienti?", "e se aggiungo 4 box?"): fai i conti passo passo con i dati reali e indica le ipotesi.
- Concorrenza: usa ultimo_radar; se l'utente vuole dettagli o notizie fresche usa web_search (al massimo ${MERLINO_MAX_RICERCHE} ricerche) su strutture equestri della zona del centro: offerte, prezzi pubblicati, campi estivi, eventi, gare, recensioni, bandi e contributi regionali. Solo informazioni PUBBLICHE; riporta le fonti come [titolo](url) presi dai risultati, mai link inventati. Mai dati personali di privati. Non denigrare i concorrenti: confronta e suggerisci contromosse.
- Confronto con centri simili: solo i valori aggregati e anonimi forniti da statistiche_centro; se non disponibile (meno di 5 centri Equo nella regione) dillo.
- Fisco e contabilità: dai indicazioni generali e pratiche, ma per adempimenti, aliquote e scadenze fiscali rimanda al commercialista: le regole cambiano.

## Stile
- Brevi e d'impatto: di solito 5-12 righe. Niente tabelle lunghe (si legge anche sul telefono); al massimo una mini tabella di 3-5 righe se aiuta davvero.

${REGOLE_COMUNI}`;
const STRUMENTI_MERLINO = [
  { type: "web_search_20250305", name: "web_search", max_uses: MERLINO_MAX_RICERCHE, user_location: { type: "approximate", country: "IT", timezone: "Europe/Rome" } },
  clonaStrumento("guida_app"),
  { name: "statistiche_centro", description: "Statistiche complete del centro: incassi e lezioni degli ultimi 12 mesi, clienti attivi e a rischio, carnet in esaurimento, previsione rinnovi a 90 giorni e tasso di rinnovo, margine per cavallo (ricavi pensioni vs costi di magazzino), costo comune per cavallo, carico di lavoro dei cavalli, occupazione per giorno/ora, prezzi medi, indice di salute 0-100 con componenti, confronto anonimo con centri simili, ultimo radar, box (liberi × pensione media = pensioni possibili).", input_schema: { type: "object", properties: {} } },
  { name: "situazione_centro", description: "Situazione attuale: scadenze sanitarie entro 30 giorni, pacchetti da rinnovare, lezioni di oggi e domani, articoli sotto soglia, ordini aperti, box (occupati/liberi/manutenzione, cavalli fuori box, senza pasto del mattino).", input_schema: { type: "object", properties: {} } },
  { name: "ultimo_radar", description: "Ultimo 'Radar di Merlino' sulla concorrenza della zona (offerte, prezzi, eventi, recensioni, opportunità, mosse consigliate) con data e fonti.", input_schema: { type: "object", properties: {} } },
  clonaStrumento("riferisci_ai_boss"),
  clonaStrumento("le_mie_segnalazioni"),
  { ...STRUMENTO_METEO, cache_control: { type: "ephemeral" } },
];

// ---- supporto strumenti gestionali (sempre con il client dell'utente: RLS del maniscalco)
const SEL_INTERVENTO = "id, cliente_mascalcia_id, cavallo_cliente_id, horse_id, tipo_ferratura, tipo_altro, data_intervento, ora, stato, gruppo_id, prossima_scadenza, importo, stato_pagamento, note, clienti_mascalcia(nome, cliente_user_id), cavalli_clienti_mascalcia(nome)";
const descrTipo = (i) => (i.tipo_ferratura === "altro" && i.tipo_altro) ? i.tipo_altro : (TIPO_INTERVENTO_LABEL[i.tipo_ferratura] || i.tipo_ferratura);
const STATO_LABEL = { richiesto: "richiesta da confermare", programmato: "programmato", fatto: "fatto", proposto: "proposto alla struttura, in attesa della sua conferma", annullato: "annullato" };
const rigaIntervento = (i) => ({ id: i.id, data: i.data_intervento, ora: i.ora ? String(i.ora).slice(0, 5) : null, cliente: i.clienti_mascalcia?.nome || null,
  cavallo: i.cavalli_clienti_mascalcia?.nome || null, tipo: descrTipo(i), stato: STATO_LABEL[i.stato] || i.stato,
  importo: i.importo != null ? Number(i.importo) : null, pagamento: i.stato_pagamento === "saldato" ? "saldato" : "da saldare", note: i.note || null });

async function clientiManiscalco(ctx) {
  if (ctx._clienti) return ctx._clienti;
  const { data, error } = await ctx.db.from("clienti_mascalcia").select("id, nome, telefono, cliente_user_id, tipo_cliente").eq("maniscalco_id", ctx.userId).is("archiviato_il", null).order("nome", { ascending: true });
  if (error) throw error;
  ctx._clienti = data || [];
  return ctx._clienti;
}
function trovaPerNome(lista, nome, campo = "nome") {
  const n = String(nome || "").trim().toLowerCase();
  if (!n) return [];
  const esatti = lista.filter((x) => (x[campo] || "").toLowerCase() === n);
  return esatti.length ? esatti : lista.filter((x) => (x[campo] || "").toLowerCase().includes(n));
}
async function cavalliCliente(ctx, cliente) {
  const { data: man } = await ctx.db.from("cavalli_clienti_mascalcia").select("id, nome, microchip, horse_id").eq("cliente_mascalcia_id", cliente.id).order("nome", { ascending: true });
  const out = (man || []).map((c) => ({ id: c.id, horse_id: c.horse_id, nome: c.nome, microchip: c.microchip, su_equo: !!c.horse_id }));
  if (cliente.cliente_user_id) {
    const { data: cond } = await ctx.db.rpc("cavalli_condivisi_cliente", { p_cliente_id: cliente.id });
    (cond || []).forEach((h) => { if (!out.some((c) => c.horse_id === h.id)) out.push({ id: null, horse_id: h.id, nome: h.name, microchip: h.microchip, su_equo: true }); });
  }
  return out;
}
async function interventoDelManiscalco(ctx, id) {
  if (!/^[0-9a-f-]{36}$/i.test(String(id || ""))) return null;
  const { data } = await ctx.db.from("interventi_mascalcia").select(SEL_INTERVENTO).eq("id", id).eq("maniscalco_id", ctx.userId).maybeSingle();
  return data || null;
}
async function risolviCliente(ctx, nome) {
  const trovati = trovaPerNome(await clientiManiscalco(ctx), nome);
  if (!trovati.length) return { errore: `Nessun cliente "${nome}". Se è nuovo, il maniscalco lo crea dall'agenda (tasto +) e poi puoi segnare l'appuntamento.` };
  if (trovati.length > 1) return { errore: `Più clienti corrispondono a "${nome}": ${trovati.map((c) => c.nome).join(", ")}. Chiedi quale.` };
  return { cliente: trovati[0] };
}

// testo da mostrare: l'ultimo tratto di testo dopo l'ultimo strumento (con la ricerca web la risposta
// arriva spezzata in più blocchi di testo con citazioni: i blocchi consecutivi si uniscono)
function testoDaBlocchi(blocchi) {
  const tratti = []; let cur = "";
  for (const b of blocchi) {
    if (b.type === "text") cur += b.text;
    else { if (cur.trim()) tratti.push(cur); cur = ""; }
  }
  if (cur.trim()) tratti.push(cur);
  return (tratti[tratti.length - 1] || "").trim();
}
function linkCitati(blocchi) {
  const visti = new Map();
  for (const b of blocchi) for (const c of (b.type === "text" && Array.isArray(b.citations) ? b.citations : [])) {
    if (c.url && !visti.has(c.url)) visti.set(c.url, c.title || c.url);
  }
  return [...visti].slice(0, 4).map(([url, titolo]) => ({ url, titolo }));
}

// ---------------------------------------------------------------- utilità
const oggiISO = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
const isoValida = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || "") && !isNaN(new Date(v + "T12:00:00Z"));
const aggiungiGiorni = (iso, g) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + g); return d.toISOString().slice(0, 10); };
// CORS: Athena viene chiamata anche da Equo Scuderia (scuderia.equohub.com), che è un altro dominio
const ORIGINI_OK = ["https://scuderia.equohub.com", "https://app.equohub.com"];
let corsOrigine = "https://app.equohub.com";
const intestazioniCors = () => ({ "Access-Control-Allow-Origin": corsOrigine, "Vary": "Origin",
  "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Max-Age": "86400" });
const risposta = (status, obj) => ({ statusCode: status, headers: { "Content-Type": "application/json", ...intestazioniCors() }, body: JSON.stringify(obj) });

async function utenteDaToken(event, admin) {
  const h = event.headers.authorization || event.headers.Authorization || "";
  const token = h.replace(/^Bearer\s+/i, "");
  if (!token) return { user: null, token: null };
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return { user: null, token: null };
  return { user: data.user, token };
}

function trovaCavallo(cavalli, nome) {
  if (!nome) return null;
  const n = nome.trim().toLowerCase();
  return cavalli.find((c) => (c.name || "").toLowerCase() === n) || cavalli.find((c) => (c.name || "").toLowerCase().includes(n)) || null;
}

// ---------------------------------------------------------------- esecuzione strumenti
// Con gli incassi nascosti togliamo importi, pagamenti e totali in euro da ogni risultato degli strumenti
const CHIAVI_SOLDI = /importo|pagamento|euro|incass|saldat|valore/i;
function senzaImporti(v) {
  if (Array.isArray(v)) return v.map(senzaImporti);
  if (v && typeof v === "object") {
    const o = {};
    for (const [k, x] of Object.entries(v)) if (!CHIAVI_SOLDI.test(k)) o[k] = senzaImporti(x);
    return o;
  }
  return v;
}

// ---- METEO (stessa fonte e cache della funzione meteo della Home)
const { previsione: meteoPrevisione } = require("./meteo");
const METEO_NOMI = { sereno: "sereno", variabile: "poco nuvoloso", nubi: "nuvoloso", nebbia: "nebbia", pioviggine: "pioggia debole", pioggia: "pioggia",
  pioggia_forte: "pioggia forte", temporale: "temporale", neve: "neve", nevischio: "neve mista a pioggia" };
const meteoGiorno = (iso) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
const meteoOra = (iso) => new Date(iso).toLocaleTimeString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });
const meteoGiornoIt = (d) => new Date(d + "T12:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
const indirizzoCompleto = (r) => r?.indirizzo ? [r.indirizzo, [r.citta, r.provincia ? `(${r.provincia})` : ""].filter(Boolean).join(" ")].filter(Boolean).join(", ") : null;

// luogo → posizione per il meteo (stesse regole di naviga_verso)
async function luogoMeteo(dest, ctx) {
  const generico = !dest || /^(qui|oggi|la mia |il mio )?(scuderia|maneggio|centro( ippico)?|circolo|struttura)?$/i.test(dest);
  if (ctx.vista === "scuderia") {
    const { data: c } = await ctx.admin.from("centri").select("nome, indirizzo, citta, provincia").eq("id", ctx.centroId).maybeSingle();
    const nomeCentro = String(c?.nome || "").toLowerCase();
    if (generico || (nomeCentro && (nomeCentro.includes(dest.toLowerCase()) || dest.toLowerCase().includes(nomeCentro)))) {
      if (!c?.indirizzo && !c?.citta) return { messaggio: `Il centro ${c?.nome || ""} non ha l'indirizzo: va inserito in "Il tuo Centro" (indirizzo, città, provincia). Intanto chiedi la località.` };
      return { pos: { indirizzo: c.indirizzo || "", citta: [c.citta, c.provincia].filter(Boolean).join(", "), luogo: c.citta || c.nome }, nome: c.nome };
    }
    return { pos: { citta: dest, luogo: dest }, nome: dest };
  }
  if (ctx.ambito === "maniscalco") {
    if (generico) return ctx.posizione ? { pos: { ...ctx.posizione }, nome: "dove ti trovi" } : { messaggio: "Non conosco la posizione del maniscalco: chiedi di quale cliente, struttura o località vuole il meteo." };
    const clienti = await clientiManiscalco(ctx);
    let trovati = trovaPerNome(clienti, dest);
    if (!trovati.length) {
      const { data: cav } = await ctx.db.from("cavalli_clienti_mascalcia").select("cliente_mascalcia_id").ilike("nome", `%${dest.replace(/[%_]/g, "")}%`).limit(10);
      const ids = [...new Set((cav || []).map((x) => x.cliente_mascalcia_id))];
      trovati = clienti.filter((x) => ids.includes(x.id));
    }
    if (trovati.length > 1) return { messaggio: `Più clienti corrispondono a "${dest}": ${trovati.slice(0, 6).map((x) => x.nome).join(", ")}. Chiedi quale.` };
    if (trovati.length === 1) {
      const c = trovati[0];
      const { data: ci } = await ctx.db.from("clienti_mascalcia").select("indirizzo, centro_id").eq("id", c.id).maybeSingle();
      let indirizzo = (ci?.indirizzo || "").trim() || null;
      if (!indirizzo && ci?.centro_id) {
        const { data: st } = await ctx.db.rpc("pro_indirizzi_strutture");
        indirizzo = indirizzoCompleto((st || []).find((x) => x.cliente_id === c.id));
      }
      if (!indirizzo) return { messaggio: `${c.nome} non ha un indirizzo: il maniscalco può aggiungerlo in Clienti → ${c.nome} → "Modifica" → Indirizzo (o con "Naviga", che lo salva). Intanto chiedi la località.` };
      return { pos: { indirizzo, luogo: c.nome }, nome: c.nome };
    }
    return { pos: { citta: dest, luogo: dest }, nome: dest };
  }
  // proprietario: scuderie collegate, altrimenti posizione del telefono o località
  const { data: sc } = await ctx.db.rpc("prop_indirizzi_scuderie");
  const scuderie = sc || [];
  const vuoto = !dest;
  if (vuoto && ctx.posizione) return { pos: { ...ctx.posizione }, nome: "dove ti trovi" };
  let trovate = generico ? scuderie : trovaPerNome(scuderie, dest);
  if (trovate.length > 1) return { messaggio: `Più scuderie corrispondono: ${trovate.map((x) => x.nome).join(", ")}. Chiedi quale.` };
  if (trovate.length === 1) {
    const r = trovate[0];
    if (!r.indirizzo && !r.citta) return { messaggio: `La scuderia ${r.nome} non ha inserito l'indirizzo in Equo Scuderia. Chiedi la località.` };
    return { pos: { indirizzo: r.indirizzo || "", citta: [r.citta, r.provincia].filter(Boolean).join(", "), luogo: r.citta || r.nome }, nome: r.nome };
  }
  if (generico) return { messaggio: "Non so dove si trova: chiedi la località (o di consentire la posizione nell'app)." };
  return { pos: { citta: dest, luogo: dest }, nome: dest };
}

async function strumentoMeteo(input, ctx) {
  const dest = String(input.luogo || "").trim().slice(0, 120);
  const l = await luogoMeteo(dest, ctx);
  if (l.messaggio) return l.messaggio;
  const r = await meteoPrevisione(l.pos);
  if (r.non_trovato) return `Non trovo "${dest}" sulla mappa: chiedi la località precisa (comune e provincia).`;
  if (!r.giorni) return "Il servizio meteo non risponde in questo momento: riprova tra poco.";
  const oggi = meteoGiorno(new Date().toISOString());
  const giorno = /^\d{4}-\d{2}-\d{2}$/.test(String(input.giorno || "")) ? input.giorno : oggi;
  const g = r.giorni.find((x) => x.data === giorno);
  const righe = [`Meteo per ${l.nome}${r.luogo && r.luogo !== l.nome ? " (" + r.luogo + ")" : ""}. Fonte: ${r.fonte}.`];
  if (!g) righe.push(`Nessuna previsione per il ${giorno}: disponibili solo i prossimi 7 giorni.`);
  else {
    righe.push(`${giorno === oggi ? "Oggi" : meteoGiornoIt(giorno)}: ${METEO_NOMI[g.sim] || g.sim}, min ${g.min}° max ${g.max}°, pioggia totale ${g.mm} mm.`);
    const ore = r.ore.filter((o) => meteoGiorno(o.t) === giorno).filter((o) => { const h = Number(meteoOra(o.t).slice(0, 2)); return h >= 6 && h <= 21; });
    const passo = ore.length > 8 ? 2 : 1;
    const dettagli = ore.filter((o, i) => i % passo === 0 || Number(o.mm) > 0 || ["temporale", "pioggia_forte", "neve"].includes(o.sim)).map((o) => `${meteoOra(o.t)} ${METEO_NOMI[o.sim] || o.sim} ${o.temp}°${Number(o.mm) > 0 ? " " + o.mm + "mm" : ""}${o.vento != null ? " vento " + o.vento + "km/h" : ""}`);
    if (dettagli.length) righe.push("Ore: " + dettagli.join("; ") + (ore.every((o) => o.passo === 6) ? " (previsione ogni 6 ore)" : ""));
  }
  righe.push("Prossimi giorni: " + r.giorni.filter((x) => x.data !== giorno).map((x) => `${meteoGiornoIt(x.data)} ${METEO_NOMI[x.sim] || x.sim} ${x.min}/${x.max}°${x.mm ? " " + x.mm + "mm" : ""}`).join("; "));
  return righe.join("\n");
}

async function eseguiStrumento(nome, input, ctx) {
  if (ctx.incassiNascosti && ["incassi", "proponi_segna_saldato"].includes(nome)) {
    return "L'utente ha nascosto gli incassi nell'app (interruttore con PIN): non parlare di importi, pagamenti o incassi. Se te li chiede, digli che può farli ricomparire dal menu profilo → Home → «Mostra gli incassi».";
  }
  const { db, userId, cavalli } = ctx;
  input = input || {};
  if (nome !== "naviga_verso" && STRUMENTI_GESTIONE.some((t) => t.name === nome) && ctx.ambito !== "maniscalco") return "Strumento riservato ai maniscalchi.";
  if (ctx.vista === "scuderia" && !(ctx.strumenti || []).some((t) => t.name === nome)) return "Strumento non disponibile.";
  if (["situazione_centro", "statistiche_centro", "ultimo_radar"].includes(nome) && ctx.vista !== "scuderia") return "Strumento disponibile solo in Equo Scuderia.";
  switch (nome) {
    case "elenco_cavalli":
      return cavalli.length ? cavalli.map((c) => ({ nome: c.name, razza: c.breed, nascita: c.birth_date, microchip: c.microchip, mantello: c.mantello, note: c.note, condiviso_con_professionisti: c.condiviso_ecosistema !== false })) : "Nessun cavallo registrato.";

    case "scadenze": {
      if (!cavalli.length) return "Nessun cavallo registrato.";
      const fino = aggiungiGiorni(oggiISO(), Math.min(Math.max(Number(input.giorni_avanti) || 90, 1), 730));
      const { data, error } = await db.from("health_events").select("type, date, next_due_date, notes, horse_id").in("horse_id", cavalli.map((c) => c.id)).order("date", { ascending: false });
      if (error) return "Errore nel leggere le scadenze.";
      const ultimo = {};
      (data || []).forEach((e) => { const k = e.horse_id + "|" + e.type; if (!ultimo[k]) ultimo[k] = e; });
      const righe = Object.values(ultimo).filter((e) => e.next_due_date && e.next_due_date <= fino)
        .sort((a, b) => a.next_due_date.localeCompare(b.next_due_date))
        .map((e) => ({ cavallo: cavalli.find((c) => c.id === e.horse_id)?.name, tipo: TIPI_EVENTO[e.type] || e.type, ultimo_evento: e.date, scadenza: e.next_due_date, stato: e.next_due_date < oggiISO() ? "SCADUTA" : "in arrivo" }));
      const senza = cavalli.filter((c) => !(data || []).some((e) => e.horse_id === c.id)).map((c) => c.name);
      return { oggi: oggiISO(), scadenze: righe, cavalli_senza_eventi_registrati: senza };
    }

    case "storico_sanitario": {
      if (!cavalli.length) return "Nessun cavallo registrato.";
      let ids = cavalli.map((c) => c.id);
      if (input.cavallo) { const c = trovaCavallo(cavalli, input.cavallo); if (!c) return `Non trovo il cavallo "${input.cavallo}". Cavalli: ${cavalli.map((x) => x.name).join(", ")}.`; ids = [c.id]; }
      let q = db.from("health_events").select("type, date, next_due_date, notes, horse_id").in("horse_id", ids).order("date", { ascending: false }).limit(Math.min(Number(input.limite) || 15, 50));
      if (input.tipo) q = q.eq("type", input.tipo);
      const { data, error } = await q;
      if (error) return "Errore nel leggere lo storico.";
      return (data || []).map((e) => ({ cavallo: cavalli.find((c) => c.id === e.horse_id)?.name, tipo: TIPI_EVENTO[e.type] || e.type, data: e.date, prossima_scadenza: e.next_due_date, note: e.notes }));
    }

    case "spese": {
      const da = input.da || oggiISO().slice(0, 4) + "-01-01";
      const a = input.a || oggiISO();
      let q = db.from("expenses").select("category, amount, date, notes, horse_id").eq("owner_id", userId).gte("date", da).lte("date", a).order("date", { ascending: false }).limit(1000);
      if (input.categoria) q = q.eq("category", input.categoria);
      const { data, error } = await q;
      if (error) return "Errore nel leggere le spese.";
      const tot = (arr) => Math.round(arr.reduce((s, e) => s + Number(e.amount || 0), 0) * 100) / 100;
      const per = (f) => { const m = {}; (data || []).forEach((e) => { const k = f(e) || "—"; m[k] = (m[k] || 0) + Number(e.amount || 0); }); Object.keys(m).forEach((k) => (m[k] = Math.round(m[k] * 100) / 100)); return m; };
      return {
        periodo: { da, a }, numero_voci: (data || []).length, totale_euro: tot(data || []),
        per_categoria: per((e) => e.category), per_mese: per((e) => (e.date || "").slice(0, 7)),
        per_cavallo: per((e) => cavalli.find((c) => c.id === e.horse_id)?.name),
        ultime_voci: (data || []).slice(0, 8).map((e) => ({ data: e.date, categoria: e.category, euro: Number(e.amount), note: e.notes })),
      };
    }

    case "appuntamenti_maniscalco": {
      const { data: mani, error } = await db.rpc("lista_maniscalchi_collegati");
      if (error) return "Errore nel leggere i maniscalchi collegati.";
      if (!Array.isArray(mani) || !mani.length) return "Nessun maniscalco collegato. Si collega da Chat → 'Il tuo maniscalco' → '+ Collega' con il codice del maniscalco.";
      const out = [];
      for (const m of mani) {
        const { data: app } = await db.rpc("appuntamenti_maniscalco_cliente", { p_cliente_id: m.cliente_mascalcia_id });
        out.push({ maniscalco: m.nome_maniscalco, equo_certified: !!m.certificato, messaggi_non_letti: m.non_letti,
          appuntamenti: (app || []).map((x) => ({ data: x.data_intervento, ora: x.ora ? String(x.ora).slice(0, 5) : null, tipo: x.tipo_ferratura === "altro" ? x.tipo_altro : x.tipo_ferratura, cavallo: x.nome_cavallo, stato: { richiesto: "in attesa di conferma", programmato: "confermato", rifiutato: "non disponibile" }[x.stato] || x.stato })) });
      }
      return out;
    }

    case "lezioni": {
      const da = input.da || aggiungiGiorni(oggiISO(), -30);
      const a = input.a || aggiungiGiorni(oggiISO(), 60);
      const { data, error } = await db.from("lezioni_manuali").select("data, tipo, note, horse_id").eq("owner_id", userId).gte("data", da).lte("data", a).order("data", { ascending: true });
      if (error) return "Errore nel leggere il calendario.";
      return (data || []).map((l) => ({ data: l.data, tipo: l.tipo, cavallo: cavalli.find((c) => c.id === l.horse_id)?.name, note: l.note }));
    }

    case "guida_app": {
      const ambitoGuida = ctx.guida || "proprietario";
      if (input.elenco) {
        const { data, error } = await db.rpc("indice_guida", { p_ambito: ambitoGuida });
        if (error) return "Errore nel leggere la guida.";
        return { schede_disponibili: data || [], nota: "Per i passi di una funzione richiama guida_app con la domanda." };
      }
      const domanda = String(input.domanda || "").slice(0, 300);
      if (!domanda.trim()) return "Scrivi cosa cercare.";
      const { data, error } = await db.rpc("cerca_guida", { p_query: domanda, p_ambito: ambitoGuida, p_limite: 3 });
      if (error) { console.error("guida_app:", error); return "Errore nel leggere la guida."; }
      if (!(data || []).length) return "Nessuna scheda trovata: riprova con altre parole (sinonimi, nome del menu) o con elenco = true per vedere tutte le schede. Non inventare percorsi.";
      return data;
    }

    case "situazione_centro": {
      if (!ctx.centroId) return "Nessun centro selezionato.";
      const { data, error } = await db.rpc("athena_situazione", { p_centro_id: ctx.centroId });
      if (error) { console.error("situazione_centro:", error); return "Errore nel leggere la situazione del centro."; }
      return data;
    }

    case "statistiche_centro": {
      const { data, error } = await db.rpc("statistiche_centro", { p_centro_id: ctx.centroId });
      if (error) { console.error("statistiche_centro:", error); return "Errore nel leggere le statistiche."; }
      return data;
    }

    case "ultimo_radar": {
      const { data } = await db.from("merlino_radar").select("testo, fonti, zona, created_at").eq("centro_id", ctx.centroId).order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data || "Nessun radar ancora generato: si genera dalla pagina Statistiche → \"Aggiorna il radar\" (e ogni lunedì in automatico).";
    }

    case "cerca_conoscenze": {
      const { data, error } = await db.rpc("cerca_conoscenze", { p_query: String(input.domanda || "").slice(0, 300), p_ambito: ctx.ambito || "proprietario", p_limite: 4 });
      if (error) return "Ricerca non disponibile al momento.";
      if (!Array.isArray(data) || !data.length) return "Nessuna scheda verificata su questo argomento: rispondi con indicazioni generali prudenti e dillo.";
      return data.map((s) => ({ titolo: s.titolo, contenuto: s.contenuto, fonte: s.fonte_titolo, link_fonte: s.fonte_url, verificata_il: s.verificato_il }));
    }

    case "salva_memoria": {
      const testo = String(input.testo || "").trim().slice(0, 500);
      if (!testo) return "Niente da salvare.";
      const c = trovaCavallo(cavalli, input.cavallo);
      const { error } = await db.from("ai_memoria").insert({ user_id: userId, horse_id: c?.id || null, testo });
      return error ? "Non sono riuscito a salvare la nota." : "Nota salvata.";
    }

    case "proponi_evento_sanitario": {
      const c = trovaCavallo(cavalli, input.horse_name);
      if (!c) return `Non trovo il cavallo "${input.horse_name}". Cavalli dell'utente: ${cavalli.map((x) => x.name).join(", ") || "nessuno"}.`;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date || "")) return "Data non valida: chiedi la data all'utente.";
      const dati = { horse_name: c.name, type: input.type, date: input.date, next_due_date: /^\d{4}-\d{2}-\d{2}$/.test(input.next_due_date || "") ? input.next_due_date : null, notes: input.notes || null };
      if (!ctx.proposta) ctx.proposta = dati;
      ctx.azioni.push({ tipo: "evento", dati });
      return "Scheda mostrata all'utente: sarà salvata solo quando la conferma. Diglielo in una frase.";
    }

    case "proponi_spesa": {
      const importo = Math.round(Number(input.importo) * 100) / 100;
      if (!(importo > 0)) return "Importo non valido: chiedilo all'utente.";
      if (!isoValida(input.data)) return "Data non valida: chiedila all'utente.";
      const cat = ["pensione", "mangime", "veterinario", "maniscalco", "attrezzatura", "altro"].includes(input.categoria) ? input.categoria : "altro";
      let c = trovaCavallo(cavalli, input.cavallo);
      if (!c && input.cavallo) return `Non trovo il cavallo "${input.cavallo}". Cavalli: ${cavalli.map((x) => x.name).join(", ")}.`;
      if (!c && cavalli.length === 1) c = cavalli[0];
      ctx.azioni.push({ tipo: "spesa", dati: { horse_id: c?.id || null, horse_name: c?.name || null, category: cat, amount: importo, date: input.data, notes: (input.note || "").slice(0, 300) || null } });
      return "Scheda spesa mostrata all'utente, da confermare.";
    }

    case "proponi_lezione": {
      if (!isoValida(input.data)) return "Data non valida: chiedila all'utente.";
      const tipo = ["lezione", "allenamento", "gara", "altro"].includes(input.tipo) ? input.tipo : "altro";
      let c = trovaCavallo(cavalli, input.cavallo);
      if (!c && input.cavallo) return `Non trovo il cavallo "${input.cavallo}". Cavalli: ${cavalli.map((x) => x.name).join(", ")}.`;
      if (!c && cavalli.length === 1) c = cavalli[0];
      ctx.azioni.push({ tipo: "lezione", dati: { horse_id: c?.id || null, horse_name: c?.name || null, tipo, data: input.data, note: (input.note || "").slice(0, 300) || null } });
      return "Scheda calendario mostrata all'utente, da confermare.";
    }

    case "proponi_richiesta_maniscalco": {
      if (!isoValida(input.data) || input.data < oggiISO()) return "La data deve essere da oggi in poi: chiedila all'utente.";
      const { data: mani } = await db.rpc("lista_maniscalchi_collegati");
      if (!Array.isArray(mani) || !mani.length) return "L'utente non ha maniscalchi collegati: spiegagli che si collega da Chat → 'Il tuo maniscalco' → '+ Collega' con il codice del maniscalco.";
      let m = null;
      if (input.maniscalco) { const n = input.maniscalco.toLowerCase(); m = mani.find((x) => (x.nome_maniscalco || "").toLowerCase().includes(n)); }
      if (!m && mani.length === 1) m = mani[0];
      if (!m) return `Più maniscalchi collegati: chiedi a quale inviare (${mani.map((x) => x.nome_maniscalco).join(", ")}).`;
      const tipo = ["ferratura", "mezza_ferratura", "pareggio", "altro"].includes(input.tipo) ? input.tipo : "altro";
      if (tipo === "altro" && !input.tipo_altro) return "Chiedi all'utente che tipo di intervento serve.";
      let c = trovaCavallo(cavalli, input.cavallo);
      if (!c && cavalli.length === 1) c = cavalli[0];
      if (!c && !input.cavallo) return "Chiedi per quale cavallo è l'appuntamento.";
      const ora = /^\d{1,2}:\d{2}$/.test(input.ora || "") ? input.ora.padStart(5, "0") : null;
      ctx.azioni.push({ tipo: "richiesta_maniscalco", dati: { cliente_mascalcia_id: m.cliente_mascalcia_id, nome_maniscalco: m.nome_maniscalco, horse_id: c?.id || null, nome_cavallo: c ? null : input.cavallo, horse_name: c?.name || input.cavallo, tipo, tipo_altro: tipo === "altro" ? input.tipo_altro : null, data: input.data, ora, note: (input.note || "").slice(0, 300) || null } });
      return `Scheda richiesta per ${m.nome_maniscalco} mostrata all'utente: partirà quando la conferma.`;
    }

    case "clienti_e_cavalli": {
      let clienti = await clientiManiscalco(ctx);
      if (!clienti.length) return "Nessun cliente registrato: si aggiungono dall'agenda o dalla sezione Clienti.";
      const cerca = String(input.cerca || "").trim().toLowerCase();
      const out = [];
      for (const c of clienti) {
        const cavalli = await cavalliCliente(ctx, c);
        if (cerca && !(c.nome || "").toLowerCase().includes(cerca) && !cavalli.some((h) => (h.nome || "").toLowerCase().includes(cerca))) continue;
        out.push({ cliente: c.nome, telefono: c.telefono || null, su_equo: !!c.cliente_user_id, tipo: c.tipo_cliente || null, cavalli: cavalli.map((h) => h.nome) });
        if (out.length >= 40) break;
      }
      return out.length ? out : `Nessun cliente o cavallo corrisponde a "${input.cerca}".`;
    }

    case "agenda": {
      const da = isoValida(input.da) ? input.da : oggiISO();
      const a = isoValida(input.a) ? input.a : aggiungiGiorni(da, 7);
      const { data, error } = await db.from("interventi_mascalcia").select(SEL_INTERVENTO).eq("maniscalco_id", userId).not("stato", "in", "(rifiutato,annullato)")
        .gte("data_intervento", da).lte("data_intervento", a).order("data_intervento", { ascending: true }).order("ora", { ascending: true, nullsFirst: false }).limit(200);
      if (error) return "Errore nel leggere l'agenda.";
      return { periodo: { da, a }, appuntamenti: (data || []).map(rigaIntervento) };
    }

    case "richieste_da_confermare": {
      const { data, error } = await db.from("interventi_mascalcia").select(SEL_INTERVENTO).eq("maniscalco_id", userId).eq("stato", "richiesto").order("data_intervento", { ascending: true }).limit(50);
      if (error) return "Errore nel leggere le richieste.";
      return (data || []).length ? data.map(rigaIntervento) : "Nessuna richiesta da confermare.";
    }

    case "ferrature_scadute": {
      const fino = aggiungiGiorni(oggiISO(), Math.min(Math.max(Number(input.giorni_avanti) || 0, 0), 60));
      const { data, error } = await db.from("interventi_mascalcia").select(SEL_INTERVENTO).eq("maniscalco_id", userId).eq("stato", "fatto")
        .not("prossima_scadenza", "is", null).lte("prossima_scadenza", fino).order("data_intervento", { ascending: false }).limit(500);
      if (error) return "Errore nel leggere le scadenze.";
      if (!(data || []).length) return "Nessuna ferratura o pareggio scaduto.";
      const chiave = (i) => i.cavallo_cliente_id || "c:" + i.cliente_mascalcia_id;
      const clientiIds = [...new Set(data.map((i) => i.cliente_mascalcia_id))];
      const { data: tutti } = await db.from("interventi_mascalcia").select("id, cliente_mascalcia_id, cavallo_cliente_id, data_intervento, stato")
        .eq("maniscalco_id", userId).in("cliente_mascalcia_id", clientiIds).not("stato", "in", "(richiesto,rifiutato,proposto,annullato)");
      const visti = new Set(); const out = [];
      for (const i of data) {
        const k = chiave(i);
        if (visti.has(k)) continue; visti.add(k);
        if ((tutti || []).some((x) => x.id !== i.id && chiave(x) === k && x.data_intervento > i.data_intervento)) continue;
        const ritardo = Math.round((new Date(oggiISO() + "T12:00:00Z") - new Date(i.prossima_scadenza + "T12:00:00Z")) / 86400000);
        out.push({ cliente: i.clienti_mascalcia?.nome, cliente_su_equo: !!i.clienti_mascalcia?.cliente_user_id, cavallo: i.cavalli_clienti_mascalcia?.nome || null,
          ultimo_intervento: descrTipo(i), fatto_il: i.data_intervento, scadenza: i.prossima_scadenza, giorni_di_ritardo: ritardo > 0 ? ritardo : 0, stato: ritardo > 0 ? "SCADUTA" : "in scadenza" });
      }
      out.sort((x, y) => x.scadenza.localeCompare(y.scadenza));
      return out.length ? { oggi: oggiISO(), scadenze: out } : "Nessuna scadenza aperta: i cavalli scaduti hanno già un appuntamento successivo.";
    }

    case "incassi": {
      const da = isoValida(input.da) ? input.da : oggiISO().slice(0, 8) + "01";
      const a = isoValida(input.a) ? input.a : oggiISO();
      const { data, error } = await db.from("interventi_mascalcia").select(SEL_INTERVENTO).eq("maniscalco_id", userId).in("stato", ["fatto", "programmato"]).order("data_intervento", { ascending: false }).limit(2000);
      if (error) return "Errore nel leggere gli incassi.";
      const euro = (arr) => Math.round(arr.reduce((t, i) => t + Number(i.importo || 0), 0) * 100) / 100;
      const daSaldare = (data || []).filter((i) => i.stato === "fatto" && i.stato_pagamento !== "saldato");
      const perCliente = {};
      daSaldare.forEach((i) => { const n = i.clienti_mascalcia?.nome || "—"; (perCliente[n] = perCliente[n] || []).push(i); });
      const incassati = (data || []).filter((i) => i.stato === "fatto" && i.stato_pagamento === "saldato" && i.data_intervento >= da && i.data_intervento <= a);
      const programmati = (data || []).filter((i) => i.stato === "programmato");
      return {
        da_incassare_totale_euro: euro(daSaldare),
        da_incassare_per_cliente: Object.entries(perCliente).map(([cliente, arr]) => ({ cliente, totale_euro: euro(arr), interventi: arr.slice(0, 10).map(rigaIntervento) })).sort((x, y) => y.totale_euro - x.totale_euro).slice(0, 25),
        interventi_senza_importo: daSaldare.filter((i) => i.importo == null).length,
        incassato_nel_periodo: { da, a, euro: euro(incassati), interventi: incassati.length },
        programmati_previsti_euro: euro(programmati), programmati: programmati.length,
      };
    }

    case "proponi_appuntamento": {
      const { cliente, errore } = await risolviCliente(ctx, input.cliente);
      if (errore) return errore;
      if (!isoValida(input.data)) return "Data non valida: chiedila.";
      const tipo = TIPI_INTERVENTO.includes(input.tipo) ? input.tipo : "altro";
      if (tipo === "altro" && !input.tipo_altro) return "Chiedi che tipo di intervento è.";
      const cavalli = await cavalliCliente(ctx, cliente);
      let cavallo = null, nuovo_cavallo_nome = null;
      if (input.cavallo) {
        const t = trovaPerNome(cavalli, input.cavallo);
        if (t.length > 1) return `Più cavalli di ${cliente.nome} corrispondono a "${input.cavallo}": ${t.map((c) => c.nome).join(", ")}. Chiedi quale.`;
        if (t.length === 1) cavallo = t[0]; else nuovo_cavallo_nome = String(input.cavallo).trim().slice(0, 60);
      } else if (cavalli.length === 1) cavallo = cavalli[0];
      else if (cavalli.length > 1) return `${cliente.nome} ha più cavalli (${cavalli.map((c) => c.nome).join(", ")}): chiedi per quale.`;
      const ora = /^\d{1,2}:\d{2}$/.test(input.ora || "") ? input.ora.padStart(5, "0") : null;
      const importo = Number(input.importo) > 0 ? Math.round(Number(input.importo) * 100) / 100 : null;
      ctx.azioni.push({ tipo: "appuntamento", dati: { cliente_mascalcia_id: cliente.id, nome_cliente: cliente.nome, cavallo, nuovo_cavallo_nome,
        tipo, tipo_altro: tipo === "altro" ? String(input.tipo_altro).slice(0, 80) : null, data: input.data, ora, importo,
        stato_pagamento: input.pagato ? "saldato" : "da_saldare", note: (input.note || "").slice(0, 300) || null } });
      return `Scheda appuntamento per ${cliente.nome} mostrata, da confermare${nuovo_cavallo_nome ? ` (il cavallo "${nuovo_cavallo_nome}" non c'era: verrà aggiunto ai cavalli del cliente)` : ""}.`;
    }

    case "proponi_accetta_richiesta":
    case "proponi_rifiuta_richiesta": {
      const r = await interventoDelManiscalco(ctx, input.id);
      if (!r || r.stato !== "richiesto") return "Richiesta non trovata o già gestita: rileggi richieste_da_confermare e usa l'id giusto.";
      const dati = { id: r.id, cliente_mascalcia_id: r.cliente_mascalcia_id, nome_cliente: r.clienti_mascalcia?.nome || null, cliente_su_equo: !!r.clienti_mascalcia?.cliente_user_id,
        cavallo: r.cavalli_clienti_mascalcia?.nome || null, tipo_ferratura: r.tipo_ferratura, tipo_altro: r.tipo_altro, data_intervento: r.data_intervento,
        ora: r.ora ? String(r.ora).slice(0, 5) : null, note: r.note || null, gruppo_id: r.gruppo_id || null };
      if (nome === "proponi_rifiuta_richiesta") { ctx.azioni.push({ tipo: "rifiuta_richiesta", dati }); return "Scheda di rifiuto mostrata, da confermare."; }
      if (Number(input.importo) > 0) dati.importo = Math.round(Number(input.importo) * 100) / 100;
      dati.invia_riepilogo = !!input.invia_riepilogo;
      ctx.azioni.push({ tipo: "accetta_richiesta", dati });
      return "Scheda di conferma mostrata" + (dati.invia_riepilogo ? ": dopo la conferma si apre la chat con il PDF di riepilogo." : ".");
    }

    case "meteo": return await strumentoMeteo(input, ctx);

    case "naviga_verso": {
      const dest = String(input.destinazione || "").trim().slice(0, 150);
      if (!dest) return "Chiedi dove vuole andare.";
      if (ctx.azioni.some((x) => x.tipo === "naviga")) return "Scheda Naviga già mostrata in questa risposta.";
      if (ctx.ambito === "maniscalco") {
        const clienti = await clientiManiscalco(ctx);
        let trovati = trovaPerNome(clienti, dest);
        if (!trovati.length) {
          // per nome del cavallo
          const { data: cav } = await ctx.db.from("cavalli_clienti_mascalcia").select("cliente_mascalcia_id, nome").ilike("nome", `%${dest.replace(/[%_]/g, "")}%`).limit(10);
          const ids = [...new Set((cav || []).map((c) => c.cliente_mascalcia_id))];
          trovati = clienti.filter((c) => ids.includes(c.id));
        }
        if (!trovati.length) {
          ctx.azioni.push({ tipo: "naviga", dati: { nome: dest, indirizzo: null, ricerca: dest } });
          return `"${dest}" non è tra i clienti del maniscalco: scheda Naviga mostrata con ricerca per nome nelle mappe. Di' di controllare che sia il posto giusto; se intendeva un cliente, chiedigli il nome esatto.`;
        }
        if (trovati.length > 1) return `Più clienti corrispondono a "${dest}": ${trovati.slice(0, 6).map((c) => c.nome).join(", ")}. Chiedi quale.`;
        const c = trovati[0];
        let indirizzo = null;
        const { data: ci, error: eInd } = await ctx.db.from("clienti_mascalcia").select("indirizzo, centro_id").eq("id", c.id).maybeSingle();
        if (!eInd) indirizzo = (ci?.indirizzo || "").trim() || null;
        if (!indirizzo && ci?.centro_id) {
          const { data: st } = await ctx.db.rpc("pro_indirizzi_strutture");
          const r = (st || []).find((x) => x.cliente_id === c.id);
          if (r?.indirizzo) indirizzo = [r.indirizzo, [r.citta, r.provincia ? `(${r.provincia})` : ""].filter(Boolean).join(" ")].filter(Boolean).join(", ");
        }
        ctx.azioni.push({ tipo: "naviga", dati: { cliente_mascalcia_id: c.id, nome: c.nome, indirizzo } });
        return indirizzo ? `Scheda Naviga verso ${c.nome} (${indirizzo}) mostrata: il maniscalco la tocca e sceglie l'app di mappe.`
          : `Scheda Naviga verso ${c.nome} mostrata. Non c'è ancora un indirizzo: toccandola cerca il luogo e il maniscalco sceglie quello giusto, che resta salvato nella scheda del cliente.`;
      }
      // proprietario: scuderie collegate (solo nome e indirizzo), altrimenti ricerca per nome nelle mappe
      const { data: sc } = await ctx.db.rpc("prop_indirizzi_scuderie");
      const scuderie = sc || [];
      const generico = /^(la mia |il mio )?(scuderia|maneggio|centro( ippico)?|circolo)$/i.test(dest);
      let trovate = generico ? scuderie : trovaPerNome(scuderie, dest);
      if (generico && scuderie.length > 1) return `L'utente è collegato a più scuderie: ${scuderie.map((x) => x.nome).join(", ")}. Chiedi quale.`;
      if (trovate.length > 1) return `Più scuderie corrispondono a "${dest}": ${trovate.map((x) => x.nome).join(", ")}. Chiedi quale.`;
      if (trovate.length === 1) {
        const r = trovate[0];
        const indirizzo = r.indirizzo ? [r.indirizzo, [r.citta, r.provincia ? `(${r.provincia})` : ""].filter(Boolean).join(" ")].filter(Boolean).join(", ") : null;
        const ricerca = indirizzo ? null : [r.nome, r.citta].filter(Boolean).join(", ");
        ctx.azioni.push({ tipo: "naviga", dati: { nome: r.nome, indirizzo, ricerca } });
        return indirizzo ? `Scheda Naviga verso ${r.nome} (${indirizzo}) mostrata.` : `Scheda Naviga verso ${r.nome} mostrata: la scuderia non ha indicato l'indirizzo, quindi le mappe cercano per nome${r.citta ? " e città" : ""}. Suggerisci di controllare che sia il posto giusto.`;
      }
      if (generico) return "L'utente non è collegato a nessuna scuderia su Equo. Chiedigli il nome del posto, oppure spiega che può collegarsi alla sua scuderia con il codice invito.";
      ctx.azioni.push({ tipo: "naviga", dati: { nome: dest, indirizzo: null, ricerca: dest } });
      return `"${dest}" non è una scuderia collegata: scheda Naviga mostrata con ricerca per nome nelle mappe. Di' all'utente di controllare che sia il posto giusto.`;
    }

    case "proponi_promemoria": {
      const { cliente, errore } = await risolviCliente(ctx, input.cliente);
      if (errore) return errore;
      const testo = String(input.testo || "").trim().slice(0, 600);
      if (!testo) return "Scrivi il testo del messaggio.";
      if (ctx.azioni.filter((x) => x.tipo === "promemoria").length >= 8) return "Già 8 promemoria in questa risposta: fermati qui e dì al maniscalco che può chiederne altri.";
      ctx.azioni.push({ tipo: "promemoria", dati: { cliente_mascalcia_id: cliente.id, nome_cliente: cliente.nome, collegato: !!cliente.cliente_user_id, testo } });
      return cliente.cliente_user_id ? `Promemoria per ${cliente.nome} pronto da inviare in chat.` : `${cliente.nome} non è su Equo: la scheda permette di copiare il testo (e conviene invitarlo con il suo codice).`;
    }

    case "proponi_segna_saldato": {
      const ids = (Array.isArray(input.ids) ? input.ids : []).slice(0, 30);
      const righe = [];
      for (const id of ids) { const i = await interventoDelManiscalco(ctx, id); if (i && i.stato === "fatto" && i.stato_pagamento !== "saldato") righe.push(i); }
      if (!righe.length) return "Nessun intervento da saldare con questi id: rileggi incassi.";
      const totale = Math.round(righe.reduce((t, i) => t + Number(i.importo || 0), 0) * 100) / 100;
      ctx.azioni.push({ tipo: "saldato", dati: { ids: righe.map((i) => i.id), totale, righe: righe.map((i) => `${i.clienti_mascalcia?.nome || ""} · ${descrTipo(i)} del ${i.data_intervento}${i.importo != null ? " · € " + Number(i.importo).toFixed(2) : ""}`) } });
      return `Scheda "segna come saldato" (${righe.length} interventi, € ${totale.toFixed(2)}) mostrata, da confermare.`;
    }

    case "riferisci_ai_boss": {
      const tipo = ["problema", "richiesta", "idea", "domanda"].includes(input.tipo) ? input.tipo : "richiesta";
      const riassunto = String(input.riassunto || "").trim().slice(0, 1000);
      if (!riassunto) return "Manca il riassunto della richiesta.";
      if ((ctx._segnalate || 0) >= 2) return "Hai già girato due segnalazioni in questa risposta: basta così.";
      const { count } = await ctx.admin.from("segnalazioni_boss").select("id", { count: "exact", head: true })
        .eq("user_id", userId).gte("created_at", new Date(Date.now() - 86400000).toISOString());
      if ((count || 0) >= 10) return "Oggi sono già arrivate molte segnalazioni da questo utente: di' che i Boss le stanno già guardando e non girarne altre.";
      const { error } = await ctx.admin.from("segnalazioni_boss").insert({
        user_id: userId, agente: ctx.agente, vista: ctx.vista, centro_id: ctx.centroId || null, tipo, riassunto,
        parole_utente: String(input.parole_utente || "").trim().slice(0, 2000) || null,
        dettagli: String(input.dettagli || "").trim().slice(0, 2000) || null,
        contesto: ctx.contestoConversazione || null,
      });
      if (error) { console.error("riferisci_ai_boss:", error); return "Non sono riuscito a girarla: dillo all'utente e suggerisci di scrivere a gestione.equo@gmail.com."; }
      ctx._segnalate = (ctx._segnalate || 0) + 1;
      return "Girata ai Boss: riceveranno una email. Conferma all'utente che la risposta arriverà qui in chat, senza promettere tempi.";
    }

    case "le_mie_segnalazioni": {
      const { data, error } = await db.from("segnalazioni_boss").select("tipo, riassunto, stato, risposta, created_at, risposta_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(10);
      if (error) return "Errore nel leggere le segnalazioni.";
      if (!(data || []).length) return "Nessuna segnalazione girata ai Boss finora.";
      return data.map((x) => ({ tipo: x.tipo, riassunto: x.riassunto, inviata_il: x.created_at.slice(0, 10),
        stato: x.stato === "risposta" ? "i Boss hanno risposto" : x.stato === "chiusa" ? "chiusa" : "in attesa di risposta", risposta: x.risposta || null }));
    }

    default:
      return "Strumento sconosciuto.";
  }
}

// ---------------------------------------------------------------- handler
exports.handler = async (event) => {
  const origine = event.headers.origin || event.headers.Origin || "";
  corsOrigine = ORIGINI_OK.includes(origine) || /^https:\/\/[a-z0-9-]+--equo-(app|scuderia)\.netlify\.app$/.test(origine) ? origine : "https://app.equohub.com";
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: intestazioniCors(), body: "" };
  if (event.httpMethod !== "POST") return risposta(405, { error: "Method not allowed" });

  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { user, token } = await utenteDaToken(event, admin);
  if (!user) return risposta(401, { error: "Non autenticato" });

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch (e) { return risposta(400, { error: "Richiesta non valida" }); }
  const messaggio = String(body.message || "").trim().slice(0, 4000);
  // allegati: max 3 immagini (jpeg/png/webp/gif) o PDF, già ridotti dall'app; ~5 MB totali in base64
  const allegati = (Array.isArray(body.allegati) ? body.allegati : []).slice(0, 3).filter((a) =>
    a && typeof a.data === "string" && ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"].includes(a.media_type));
  if (allegati.reduce((n, a) => n + a.data.length, 0) > 5_500_000) return risposta(413, { error: "Allegati troppo grandi" });
  if (!messaggio && !allegati.length) return risposta(400, { error: "Messaggio mancante" });
  const vista = body.vista === "professionista" ? "professionista" : body.vista === "scuderia" ? "scuderia" : "proprietario";
  // Athena (Equo Scuderia): serve il centro e l'appartenenza al suo staff (verificata qui, non dall'app)
  let centro = null, membro = null;
  if (vista === "scuderia") {
    const centroId = String(body.centro_id || "");
    if (!/^[0-9a-f-]{36}$/i.test(centroId)) return risposta(400, { error: "Centro mancante" });
    const { data: m } = await admin.from("scuderia_membri").select("ruolo, livello, nome_visualizzato").eq("centro_id", centroId).eq("user_id", user.id).maybeSingle();
    const { data: c } = await admin.from("centri").select("id, nome, owner_id").eq("id", centroId).maybeSingle();
    if (!c || (!m && c.owner_id !== user.id)) return risposta(403, { error: "Non fai parte di questo centro" });
    // clienti del centro (allievi/genitori, proprietari collegati): Athena e Merlino sono solo per lo staff
    if (m && ["allievo", "proprietario"].includes(m.ruolo) && c.owner_id !== user.id) return risposta(403, { error: "Athena e Merlino sono riservati allo staff del centro" });
    centro = c; membro = m || { ruolo: "admin", livello: "admin" };
  }

  // client con i permessi DELL'UTENTE: tutte le letture passano dalle regole RLS
  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY || CHIAVE_PUBBLICA, {
    auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // limite mensile lato server
  const mese = oggiISO().slice(0, 7);
  const { data: profilo } = await admin.from("profiles").select("full_name, piano, premium_livello, ruolo, ruolo_secondario, created_at, ai_feedback_chiesto_at").eq("id", user.id).maybeSingle();
  // Equo Scuderia: Athena (inclusa, basic in START) o Merlino (PREMIUM o add-on), secondo il pacchetto del centro
  const scud = vista === "scuderia";
  let limitiCentro = null;
  if (scud) { const { data: lc } = await admin.rpc("centro_limiti", { p_centro_id: centro.id }); limitiCentro = lc || {}; }
  const merlino = scud && body.agente === "merlino";
  if (merlino && !(limitiCentro.agenti || []).includes("merlino")) return risposta(403, { error: "Merlino non è attivo per questo centro", bloccato: true });
  // Merlino (numeri, incassi, strategia): solo titolare, amministratori e livelli 2-3
  if (merlino && !(centro.owner_id === user.id || membro.ruolo === "admin" || ["admin", "2", "3"].includes(String(membro.livello)))) return risposta(403, { error: "Merlino è riservato al titolare e ai responsabili del centro (livello 2 o 3)" });
  const athena = scud && !merlino;
  const athenaBasic = athena && limitiCentro.athena_proattiva === false;
  // il Premium da proprietario non vale nella vista professionista (Hammer & co.): lì serve il Premium professionista
  const premiumSoloProp = profilo?.premium_livello === "proprietario";
  const piano = profilo?.piano === "premium" && !(vista === "professionista" && premiumSoloProp) ? "premium" : "free";
  // Free: 5 messaggi al GIORNO (chiave "AAAA-MM-GG", riparte a mezzanotte ora italiana); Premium: 500 al mese ("AAAA-MM")
  const giornaliero = !scud && piano === "free";
  const periodo = giornaliero ? oggiISO() : mese;
  const chiaveMese = merlino ? mese + "-merlino" : athena ? mese + "-athena" : periodo;
  // Hammer: vista professionista di un utente che è maniscalco (ruolo letto dal DB, non dall'app)
  const hammer = vista === "professionista" && [profilo?.ruolo, profilo?.ruolo_secondario].includes("maniscalco");
  // Pegasus: vista proprietario. Veterinari/istruttori (vista professionista non maniscalco): Equo AI neutro
  const pegasus = vista === "proprietario";
  const agente = merlino ? "merlino" : athena ? "athena" : hammer ? "hammer" : pegasus ? "pegasus" : "equo";
  const { data: uso } = await admin.from("ai_utilizzo").select("conteggio, costo_usd").eq("user_id", user.id).eq("mese", chiaveMese).maybeSingle();
  let limite = LIMITI[piano], usati = uso?.conteggio || 0;
  if (scud) {
    // in Scuderia il limite è del CENTRO (tutto lo staff insieme), per agente
    limite = Number(merlino ? limitiCentro.merlino_messaggi : limitiCentro.athena_messaggi) || 30;
    let q = admin.from("ai_messaggi").select("id", { count: "exact", head: true }).eq("centro_id", centro.id).eq("ruolo", "user").gte("created_at", mese + "-01T00:00:00Z");
    q = merlino ? q.eq("agente", "merlino") : q.or("agente.is.null,agente.eq.athena");
    const { count } = await q;
    usati = count || 0;
  }
  if (usati >= limite) return risposta(200, { limite_raggiunto: true, uso: { usati, limite, piano, periodo: giornaliero ? "giorno" : "mese" } });
  // prenotazione ATOMICA del messaggio (SQL ai_prenota): richieste in parallelo non superano il limite
  // e il messaggio resta contato anche se la risposta va in timeout. Se la funzione SQL manca, si prosegue come prima.
  const chiavePren = scud ? `centro:${centro.id}:${merlino ? "merlino" : "athena"}` : `utente:${user.id}:${chiaveMese}`;
  let prenotato = false;
  {
    const { data: pren, error: ePren } = await admin.rpc("ai_prenota", { p_chiave: chiavePren, p_mese: scud ? mese : periodo, p_limite: limite, p_base: usati });
    if (ePren) console.warn("ai_prenota non disponibile:", ePren.message);
    else if (Number(pren) < 0) return risposta(200, { limite_raggiunto: true, uso: { usati: limite, limite, piano, periodo: giornaliero ? "giorno" : "mese" } });
    else { prenotato = true; usati = Math.max(usati, Number(pren) - 1); }
  }

  // contesto: cavalli, memoria, cronologia
  const { data: cavalli } = scud ? { data: [] } : await db.from("horses").select("id, name, breed, birth_date, microchip, mantello, note, condiviso_ecosistema").eq("owner_id", user.id).order("created_at", { ascending: true });
  const { data: memoria } = scud ? { data: [] } : await db.from("ai_memoria").select("testo, horse_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30);
  let qStoria = db.from("ai_messaggi").select("ruolo, contenuto").eq("user_id", user.id).eq("vista", vista);
  if (scud) qStoria = qStoria.eq("centro_id", centro.id);
  if (merlino) qStoria = qStoria.eq("agente", "merlino"); else if (athena) qStoria = qStoria.or("agente.is.null,agente.eq.athena");
  const { data: storia } = await qStoria.order("created_at", { ascending: false }).limit(16);

  const listaCavalli = cavalli || [];
  // Ogni ~14 giorni (non ai nuovi iscritti, non con allegati, solo in conversazioni già avviate) l'agente chiede un parere per i Boss
  const GIORNI_FEEDBACK = 14;
  const ultimoFeedback = profilo?.ai_feedback_chiesto_at ? new Date(profilo.ai_feedback_chiesto_at).getTime() : 0;
  const chiediFeedback = !athenaBasic && !allegati.length && (storia || []).length >= 4
    && Date.now() - ultimoFeedback > GIORNI_FEEDBACK * 86400000
    && Date.now() - new Date(profilo?.created_at || Date.now()).getTime() > 3 * 86400000;
  const contesto = [
    `Oggi è ${new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Rome" })} (${oggiISO()}).`,
    scud ? `Utente: ${membro.nome_visualizzato || profilo?.full_name || "—"} · centro "${centro.nome}" · ruolo ${membro.ruolo}${membro.livello ? " (livello " + membro.livello + ")" : ""} · pacchetto ${String(limitiCentro.pacchetto || "").toUpperCase()} · messaggi a ${merlino ? "Merlino" : "Athena"} questo mese (tutto il centro): ${usati + 1} di ${limite}.`
      : `Utente: ${profilo?.full_name || "—"} · piano ${piano} · messaggi AI usati ${giornaliero ? "oggi" : "questo mese"}: ${usati + 1} di ${limite}.`,
    scud ? "" : listaCavalli.length ? `Cavalli: ${listaCavalli.map((c) => c.name).join(", ")}.` : "L'utente non ha ancora registrato cavalli (si aggiungono dal tab Cavalli).",
    (memoria || []).length ? "Cose da ricordare:\n" + memoria.map((m) => "- " + (m.horse_id ? `[${listaCavalli.find((c) => c.id === m.horse_id)?.name || "cavallo"}] ` : "") + m.testo).join("\n") : "",
    hammer ? "Stai parlando con un maniscalco (vista professionista). I cavalli elencati sopra, se ci sono, sono i SUOI cavalli personali, non quelli dei clienti." :
      vista === "professionista" ? "L'utente sta usando la vista professionista: gli strumenti professionali arrivano a breve; per ora aiutalo con conoscenze generali e con l'uso dell'app." : "",
    chiediFeedback ? "DOMANDA PER I BOSS: in questa risposta, SOLO se la conversazione è tranquilla (nessuna emergenza, nessun problema urgente o arrabbiato), dopo aver risposto aggiungi in fondo una riga con parole tue di questo senso: \"C'è qualcosa che vorresti cambiare o migliorare in Equo? Dimmelo, che lo faccio presente ai Boss.\" Se non è il momento giusto, non aggiungerla." : "",
  ].filter(Boolean).join("\n");

  const messages = (storia || []).reverse().map((m) => ({ role: m.ruolo === "assistant" ? "assistant" : "user", content: m.contenuto }));
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (allegati.length) {
    messages.push({ role: "user", content: [
      ...allegati.map((a) => a.media_type === "application/pdf"
        ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: a.data } }
        : { type: "image", source: { type: "base64", media_type: a.media_type, data: a.data } }),
      { type: "text", text: messaggio || "Ti ho allegato questo: dimmi cosa contiene e prepara le schede utili." },
    ] });
  } else {
    messages.push({ role: "user", content: messaggio });
  }

  const contestoConversazione = [...(storia || []).slice(0, 6).reverse().map((m) => ({ ruolo: m.ruolo, testo: String(m.contenuto || "").slice(0, 600) })),
    { ruolo: "user", testo: (messaggio || "(allegato)").slice(0, 600) }];
  const ctx = { db, admin, userId: user.id, cavalli: listaCavalli, proposta: null, azioni: [], ambito: hammer ? "maniscalco" : "proprietario",
    guida: scud ? "scuderia" : vista === "professionista" ? "maniscalco" : "proprietario",
    strumenti: merlino ? STRUMENTI_MERLINO : athenaBasic ? STRUMENTI_ATHENA_BASIC : athena ? STRUMENTI_ATHENA : null,
    centroId: centro?.id || null, agente, vista, contestoConversazione };
  // ultima posizione nota del telefono (solo per il meteo, arrotondata a ~1 km dall'app)
  if (body.posizione && Number.isFinite(Number(body.posizione.lat)) && Number.isFinite(Number(body.posizione.lon)))
    ctx.posizione = { lat: Math.round(Number(body.posizione.lat) * 100) / 100, lon: Math.round(Number(body.posizione.lon) * 100) / 100 };
  // incassi nascosti dal maniscalco (interruttore con PIN nell'app): niente importi nelle risposte.
  // Letto a parte: se la colonna non esistesse ancora, il resto funziona uguale.
  try {
    const { data: inc } = await admin.from("profiles").select("incassi_nascosti").eq("id", user.id).maybeSingle();
    ctx.incassiNascosti = !!inc?.incassi_nascosti;
  } catch (_) { ctx.incassiNascosti = false; }
  const costo = { in: 0, out: 0, cacheRead: 0, cacheWrite: 0, ricerche: 0 };
  let link = [];
  let testoFinale = "";

  try {
    for (let giro = 0; giro < MAX_GIRI_TOOL; giro++) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: MODELLO,
          max_tokens: allegati.length ? 2000 : (hammer || merlino ? 1600 : 1200),
          system: [
            { type: "text", text: merlino ? ISTRUZIONI_MERLINO : athenaBasic ? ISTRUZIONI_ATHENA_BASIC : athena ? ISTRUZIONI_ATHENA : hammer ? ISTRUZIONI_HAMMER : pegasus ? ISTRUZIONI_PEGASUS : ISTRUZIONI, cache_control: { type: "ephemeral" } },
            { type: "text", text: contesto },
          ],
          tools: scud ? ctx.strumenti : hammer ? STRUMENTI_HAMMER : STRUMENTI,
          messages,
        }),
      });
      const data = await res.json();
      if (!res.ok) { console.error("Errore Claude API:", JSON.stringify(data).slice(0, 500)); throw new Error("api"); }
      const u = data.usage || {};
      costo.in += u.input_tokens || 0; costo.out += u.output_tokens || 0;
      costo.cacheRead += u.cache_read_input_tokens || 0; costo.cacheWrite += u.cache_creation_input_tokens || 0;
      costo.ricerche += u.server_tool_use?.web_search_requests || 0;

      const blocchi = Array.isArray(data.content) ? data.content : [];
      const testo = testoDaBlocchi(blocchi);
      if (testo) { testoFinale = testo; link = linkCitati(blocchi); }
      // ricerca web lunga: l'API mette in pausa il turno, si riprende rimandando la risposta così com'è
      if (data.stop_reason === "pause_turn") { messages.push({ role: "assistant", content: blocchi }); continue; }
      const chiamate = blocchi.filter((b) => b.type === "tool_use");
      if (data.stop_reason !== "tool_use" || !chiamate.length) break;

      messages.push({ role: "assistant", content: blocchi });
      const risultati = [];
      for (const t of chiamate) {
        let out;
        try { out = await eseguiStrumento(t.name, t.input, ctx); } catch (e) { console.error("tool", t.name, e); out = "Errore interno nello strumento."; }
        if (ctx.incassiNascosti) out = senzaImporti(out);
        risultati.push({ type: "tool_result", tool_use_id: t.id, content: typeof out === "string" ? out : JSON.stringify(out) });
      }
      messages.push({ role: "user", content: risultati });
    }
  } catch (e) {
    // errore del servizio AI: il messaggio prenotato si restituisce
    if (prenotato) await admin.rpc("ai_rilascia", { p_chiave: chiavePren, p_mese: scud ? mese : periodo }).then(() => {}, () => {});
    return risposta(200, { reply: "Non riesco a rispondere in questo momento, riprova tra poco.", errore: true, uso: { usati, limite, piano, periodo: giornaliero ? "giorno" : "mese" } });
  }

  // se ha usato la ricerca web ma non ha scritto i link, aggiungiamo quelli citati
  if (testoFinale && link.length && !/https?:\/\//.test(testoFinale)) testoFinale += "\n\nLink:\n" + link.map((l) => `- [${l.titolo}](${l.url})`).join("\n");
  if (!testoFinale) testoFinale = ctx.azioni.length ? "Ho preparato le schede da confermare qui sotto." : "Non sono riuscito a rispondere, riprova.";
  const testoUtenteSalvato = (allegati.length ? `📎 ${allegati.length === 1 ? "1 allegato" : allegati.length + " allegati"}${messaggio ? " — " : ""}` : "") + messaggio;

  // salva conversazione e consumo (service role: la tabella ai_utilizzo non è scrivibile dall'app)
  const p = PREZZI[MODELLO] || PREZZI["claude-sonnet-5"];
  const costoUsd = (costo.in * p.in + costo.out * p.out + costo.cacheRead * p.cacheRead + costo.cacheWrite * p.cacheWrite) / 1e6 + costo.ricerche * COSTO_RICERCA_USD;
  await admin.from("ai_messaggi").insert([
    { user_id: user.id, vista, agente, ruolo: "user", contenuto: testoUtenteSalvato, centro_id: centro?.id || null },
    { user_id: user.id, vista, agente, ruolo: "assistant", contenuto: testoFinale, centro_id: centro?.id || null },
  ]);
  // domanda per i Boss fatta davvero: si segna per non ripeterla prima di 14 giorni
  if (chiediFeedback && /boss/i.test(testoFinale)) await admin.from("profiles").update({ ai_feedback_chiesto_at: new Date().toISOString() }).eq("id", user.id);
  await admin.from("ai_utilizzo").upsert({ user_id: user.id, mese: chiaveMese, conteggio: (uso?.conteggio || 0) + 1, costo_usd: Number(uso?.costo_usd || 0) + costoUsd, aggiornato_il: new Date().toISOString() }, { onConflict: "user_id,mese" });

  return risposta(200, { reply: testoFinale, agente, azioni: ctx.azioni, proposedEvent: ctx.proposta, uso: { usati: usati + 1, limite, piano, periodo: giornaliero ? "giorno" : "mese" } });
};

// esportati solo per i test
exports._interni = { eseguiStrumento, ISTRUZIONI_ATHENA, STRUMENTI_ATHENA, ISTRUZIONI_ATHENA_BASIC, STRUMENTI_ATHENA_BASIC, ISTRUZIONI_MERLINO, STRUMENTI_MERLINO, ISTRUZIONI, ISTRUZIONI_PEGASUS, STRUMENTI, ISTRUZIONI_HAMMER, STRUMENTI_HAMMER, STRUMENTI_GESTIONE, testoDaBlocchi, linkCitati };
