// PEGASUS (proprietari) + HAMMER (maniscalchi, vista professionista) + Equo AI neutro (vet/istruttori) — vedi claude/equo-agenti-ai.md.
// Hammer: persona tecnica di mascalcia, schede ai_conoscenze ambito 'maniscalco', ricerca web
// limitata ai siti di settore (Mustad, Kerckhaert, O'Grady, American Farriers Journal, Il Portale del Cavallo).
//
// Cosa fa:
//  - verifica il LOGIN (token Supabase): niente token, niente risposta;
//  - applica il limite mensile di messaggi LATO SERVER (Free 5, Premium 500);
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

// ---------------------------------------------------------------- istruzioni fisse (in cache)
// Corpo comune (dati, azioni, foto, sicurezza, guida all'app). Sopra ci va l'identità:
// PEGASUS per la vista proprietario; "Equo AI" neutro per veterinari/istruttori finché non arrivano Galeno e Ares.
const CORPO_PROPRIETARIO = `## Come lavori
- Per QUALSIASI cosa che riguarda i dati dell'utente (i suoi cavalli, scadenze, vaccini, ferrature, spese, appuntamenti col maniscalco, lezioni) usa SEMPRE gli strumenti per leggerli: non indovinare e non inventare mai date, importi o nomi.
- Per domande su salute, normative, vaccinazioni, Coggins/AIE, anagrafe equina, sverminazione, ferratura, alimentazione, emergenze: prima cerca nelle schede verificate con lo strumento cerca_conoscenze. Se trovi una scheda pertinente basati su quella e alla fine scrivi "Fonte: <titolo fonte>". Se non c'è una scheda, rispondi con conoscenze generali prudenti e dillo ("indicazione generale").
- Se l'utente ti dice qualcosa di utile da ricordare in futuro (abitudini, allergie o sensibilità del cavallo, preferenze, nome del veterinario o della scuderia), salvalo con salva_memoria, senza chiedere il permesso per cose ovvie. Non salvare dati sensibili sulla salute delle PERSONE.
- Puoi PROPORRE queste azioni, che l'app mostra come schede da confermare con un tocco: proponi_evento_sanitario (vaccino, Coggins, ferratura, sverminazione), proponi_spesa, proponi_lezione (lezione, allenamento, gara) e proponi_richiesta_maniscalco (chiede un appuntamento al maniscalco collegato). Usale quando l'utente chiede di registrare, segnare, aggiungere, prenotare o chiedere qualcosa, anche con parole semplici ("ho speso 60 euro di fieno oggi", "segna una gara domenica", "chiedi al maniscalco di venire venerdì").
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

## Dove si trovano le cose in Equo (per aiutare l'utente a usare l'app)
- Cavalli: tab "Cavalli" → apri il cavallo → libretto sanitario con "+ Evento"; tocca un evento per modificarlo o eliminarlo. Nella scheda del cavallo c'è anche "Condividi con i professionisti collegati".
- Spese: tab "Spese" → "+ Spesa"; tocca una spesa per modificarla o eliminarla. Categorie: pensione, mangime, veterinario, maniscalco, attrezzatura, altro.
- Calendario: lezioni, allenamenti e gare.
- Chat: sezione "Il tuo maniscalco" → "+ Collega" con il codice che dà il maniscalco; poi "Prenota" per chiedere un appuntamento e l'icona del cavallo per abbinare i cavalli. Chat tra proprietari con il codice personale (menu profilo → "Il tuo codice per la chat") o scansionando il QR.
- Home → "Servizi vicino a te": veterinari, centri ippici e negozi vicini, con chiamata e indicazioni.
- Piano: Free (1 cavallo, 5 messaggi AI al mese) e Premium (cavalli illimitati, promemoria automatici, 500 messaggi AI al mese): menu profilo → "Passa a Premium" (mensile 2,99 €, annuale 19 €, lifetime 49 € a posti limitati).
- Assistenza: gestione.equo@gmail.com.`;

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
const STRUMENTI = [
  { name: "elenco_cavalli", description: "Elenca i cavalli dell'utente con razza, data di nascita, microchip, mantello e note.", input_schema: { type: "object", properties: {} } },
  { name: "scadenze", description: "Prossime scadenze sanitarie (vaccini, Coggins, ferratura, sverminazione) di tutti i cavalli, comprese quelle già scadute. Una riga per cavallo e tipo: la più recente.", input_schema: { type: "object", properties: { giorni_avanti: { type: "integer", description: "Quanti giorni nel futuro guardare (default 90)." } } } },
  { name: "storico_sanitario", description: "Storico degli eventi sanitari registrati (più recenti prima), filtrabile per cavallo e tipo.", input_schema: { type: "object", properties: { cavallo: { type: "string", description: "Nome del cavallo (facoltativo)." }, tipo: { type: "string", enum: ["vaccino", "coggins", "ferratura", "sverminazione"] }, limite: { type: "integer", description: "Numero massimo di eventi (default 15)." } } } },
  { name: "spese", description: "Riepilogo spese in un periodo: totale, totale per categoria, per mese e per cavallo, più le ultime voci.", input_schema: { type: "object", properties: { da: { type: "string", description: "Data inizio YYYY-MM-DD (default: 1 gennaio dell'anno in corso)." }, a: { type: "string", description: "Data fine YYYY-MM-DD (default: oggi)." }, categoria: { type: "string", enum: ["pensione", "mangime", "veterinario", "maniscalco", "attrezzatura", "altro"] } } } },
  { name: "appuntamenti_maniscalco", description: "Maniscalchi collegati all'utente e appuntamenti (richiesti, confermati, rifiutati) da 7 giorni fa in poi.", input_schema: { type: "object", properties: {} } },
  { name: "lezioni", description: "Lezioni, allenamenti e gare segnati nel calendario, in un periodo.", input_schema: { type: "object", properties: { da: { type: "string" }, a: { type: "string" } } } },
  { name: "cerca_conoscenze", description: "Cerca nelle schede verificate di Equo (normativa italiana, vaccinazioni tetano/influenza, Coggins/AIE, anagrafe, sverminazione, ferratura, alimentazione e acqua, parametri vitali, denti, condizione corporea, ferite e primo soccorso, colica, laminite, cavallo anziano/Cushing, calendario delle cure, uso dell'app). Restituisce testo e fonte.", input_schema: { type: "object", properties: { domanda: { type: "string", description: "Parole chiave o domanda in italiano." } }, required: ["domanda"] } },
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
    cache_control: { type: "ephemeral" },
  },
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
- "Oggi", "domani", "giovedì" convertili in data usando la data di oggi. Se manca qualcosa di essenziale (cliente, data, quale richiesta) chiedilo in una domanda breve. Se il cliente ha un solo cavallo, usa quello.
- Quando elenchi agenda o scadenze: prima le più vicine o le più in ritardo, data in italiano (es. gio 2 ottobre, ore 9:00), una riga per voce.
- Assistenza: gestione.equo@gmail.com.`;

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
  { name: "proponi_segna_saldato", description: "Propone di segnare come saldati uno o più interventi (id da incassi).", input_schema: { type: "object", properties: {
      ids: { type: "array", items: { type: "string" }, description: "Id degli interventi." } }, required: ["ids"] } },
];

const STRUMENTI_HAMMER = [
  { type: "web_search_20250305", name: "web_search", max_uses: HAMMER_MAX_RICERCHE, allowed_domains: HAMMER_SITI,
    user_location: { type: "approximate", country: "IT", timezone: "Europe/Rome" } },
  { ...clonaStrumento("cerca_conoscenze"), description: "Cerca nelle schede verificate di mascalcia di Equo (esame, pareggio, appiombi, ferratura, ferri speciali, andature, patologie dello zoccolo, laminite, materiali). Restituisce testo e fonte." },
  clonaStrumento("salva_memoria"),
  ...STRUMENTI_GESTIONE.slice(0, -1),
  { ...STRUMENTI_GESTIONE[STRUMENTI_GESTIONE.length - 1], cache_control: { type: "ephemeral" } },
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
  const { data, error } = await ctx.db.from("clienti_mascalcia").select("id, nome, telefono, cliente_user_id, tipo_cliente").eq("maniscalco_id", ctx.userId).order("nome", { ascending: true });
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
const risposta = (status, obj) => ({ statusCode: status, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) });

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
async function eseguiStrumento(nome, input, ctx) {
  const { db, userId, cavalli } = ctx;
  input = input || {};
  if (STRUMENTI_GESTIONE.some((t) => t.name === nome) && ctx.ambito !== "maniscalco") return "Strumento riservato ai maniscalchi.";
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

    default:
      return "Strumento sconosciuto.";
  }
}

// ---------------------------------------------------------------- handler
exports.handler = async (event) => {
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
  const vista = body.vista === "professionista" ? "professionista" : "proprietario";

  // client con i permessi DELL'UTENTE: tutte le letture passano dalle regole RLS
  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY || CHIAVE_PUBBLICA, {
    auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // limite mensile lato server
  const mese = oggiISO().slice(0, 7);
  const { data: profilo } = await admin.from("profiles").select("full_name, piano, ruolo, ruolo_secondario").eq("id", user.id).maybeSingle();
  const piano = profilo?.piano === "premium" ? "premium" : "free";
  // Hammer: vista professionista di un utente che è maniscalco (ruolo letto dal DB, non dall'app)
  const hammer = vista === "professionista" && [profilo?.ruolo, profilo?.ruolo_secondario].includes("maniscalco");
  // Pegasus: vista proprietario. Veterinari/istruttori (vista professionista non maniscalco): Equo AI neutro
  const pegasus = vista === "proprietario";
  const agente = hammer ? "hammer" : pegasus ? "pegasus" : "equo";
  const limite = LIMITI[piano];
  const { data: uso } = await admin.from("ai_utilizzo").select("conteggio, costo_usd").eq("user_id", user.id).eq("mese", mese).maybeSingle();
  const usati = uso?.conteggio || 0;
  if (usati >= limite) return risposta(200, { limite_raggiunto: true, uso: { usati, limite, piano } });

  // contesto: cavalli, memoria, cronologia
  const { data: cavalli } = await db.from("horses").select("id, name, breed, birth_date, microchip, mantello, note, condiviso_ecosistema").eq("owner_id", user.id).order("created_at", { ascending: true });
  const { data: memoria } = await db.from("ai_memoria").select("testo, horse_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30);
  const { data: storia } = await db.from("ai_messaggi").select("ruolo, contenuto").eq("user_id", user.id).eq("vista", vista).order("created_at", { ascending: false }).limit(16);

  const listaCavalli = cavalli || [];
  const contesto = [
    `Oggi è ${new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Rome" })} (${oggiISO()}).`,
    `Utente: ${profilo?.full_name || "—"} · piano ${piano} · messaggi AI usati questo mese: ${usati + 1} di ${limite}.`,
    listaCavalli.length ? `Cavalli: ${listaCavalli.map((c) => c.name).join(", ")}.` : "L'utente non ha ancora registrato cavalli (si aggiungono dal tab Cavalli).",
    (memoria || []).length ? "Cose da ricordare:\n" + memoria.map((m) => "- " + (m.horse_id ? `[${listaCavalli.find((c) => c.id === m.horse_id)?.name || "cavallo"}] ` : "") + m.testo).join("\n") : "",
    hammer ? "Stai parlando con un maniscalco (vista professionista). I cavalli elencati sopra, se ci sono, sono i SUOI cavalli personali, non quelli dei clienti." :
      vista === "professionista" ? "L'utente sta usando la vista professionista: gli strumenti professionali arrivano a breve; per ora aiutalo con conoscenze generali e con l'uso dell'app." : "",
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

  const ctx = { db, userId: user.id, cavalli: listaCavalli, proposta: null, azioni: [], ambito: hammer ? "maniscalco" : "proprietario" };
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
          max_tokens: allegati.length ? 2000 : (hammer ? 1500 : 1200),
          system: [
            { type: "text", text: hammer ? ISTRUZIONI_HAMMER : pegasus ? ISTRUZIONI_PEGASUS : ISTRUZIONI, cache_control: { type: "ephemeral" } },
            { type: "text", text: contesto },
          ],
          tools: hammer ? STRUMENTI_HAMMER : STRUMENTI,
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
        risultati.push({ type: "tool_result", tool_use_id: t.id, content: typeof out === "string" ? out : JSON.stringify(out) });
      }
      messages.push({ role: "user", content: risultati });
    }
  } catch (e) {
    return risposta(200, { reply: "Non riesco a rispondere in questo momento, riprova tra poco.", errore: true, uso: { usati, limite, piano } });
  }

  // se ha usato la ricerca web ma non ha scritto i link, aggiungiamo quelli citati
  if (testoFinale && link.length && !/https?:\/\//.test(testoFinale)) testoFinale += "\n\nLink:\n" + link.map((l) => `- [${l.titolo}](${l.url})`).join("\n");
  if (!testoFinale) testoFinale = ctx.azioni.length ? "Ho preparato le schede da confermare qui sotto." : "Non sono riuscito a rispondere, riprova.";
  const testoUtenteSalvato = (allegati.length ? `📎 ${allegati.length === 1 ? "1 allegato" : allegati.length + " allegati"}${messaggio ? " — " : ""}` : "") + messaggio;

  // salva conversazione e consumo (service role: la tabella ai_utilizzo non è scrivibile dall'app)
  const p = PREZZI[MODELLO] || PREZZI["claude-sonnet-5"];
  const costoUsd = (costo.in * p.in + costo.out * p.out + costo.cacheRead * p.cacheRead + costo.cacheWrite * p.cacheWrite) / 1e6 + costo.ricerche * COSTO_RICERCA_USD;
  await admin.from("ai_messaggi").insert([
    { user_id: user.id, vista, ruolo: "user", contenuto: testoUtenteSalvato },
    { user_id: user.id, vista, ruolo: "assistant", contenuto: testoFinale },
  ]);
  await admin.from("ai_utilizzo").upsert({ user_id: user.id, mese, conteggio: usati + 1, costo_usd: Number(uso?.costo_usd || 0) + costoUsd, aggiornato_il: new Date().toISOString() }, { onConflict: "user_id,mese" });

  return risposta(200, { reply: testoFinale, agente, azioni: ctx.azioni, proposedEvent: ctx.proposta, uso: { usati: usati + 1, limite, piano } });
};

// esportati solo per i test
exports._interni = { eseguiStrumento, ISTRUZIONI, ISTRUZIONI_PEGASUS, STRUMENTI, ISTRUZIONI_HAMMER, STRUMENTI_HAMMER, STRUMENTI_GESTIONE, testoDaBlocchi, linkCitati };
