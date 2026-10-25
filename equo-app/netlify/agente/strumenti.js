// Equo · agenti AI (netlify/functions/agent.js) · definizione degli strumenti (tool) di ogni agente
const { HAMMER_MAX_RICERCHE, HAMMER_SITI } = require("./configurazione");
const { MERLINO_MAX_RICERCHE } = require("./istruzioni-merlino");

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
  { name: "proponi_promemoria_personale", description: "Promemoria PER IL MANISCALCO STESSO («ricordami di…», «domani devo…»): all'ora scelta gli scrivi qui in chat (messaggio importante) e gli arriva la notifica. L'app mostra una scheda da confermare. Se si riferisce a un cliente indicalo; con azione = conto il promemoria avrà il tasto «Fai il conto» di quel cliente.", input_schema: { type: "object", properties: {
      testo: { type: "string", description: "Cosa ricordare, breve e chiaro (max 300 caratteri), es. «Prendere i rock and roll», «Mandare il conto a Centro Ippico Levante»." },
      data: { type: "string", description: "YYYY-MM-DD" },
      ora: { type: "string", description: "HH:MM. Se l'utente dice «mattina» usa 08:00, «pomeriggio» 15:00, «sera» 19:00; se non dice nulla 08:00." },
      cliente: { type: "string", description: "Nome del cliente o della scuderia, se il promemoria riguarda un cliente (facoltativo)." },
      azione: { type: "string", enum: ["nessuna", "conto", "chat", "naviga"], description: "Tasto da mettere nel promemoria: conto = «Fai il conto» del cliente, chat = «Scrivi al cliente», naviga = «Naviga» verso il cliente." } },
    required: ["testo", "data"] } },
  { name: "i_miei_promemoria", description: "Promemoria personali del maniscalco ancora da fare (con id, testo, data e ora, cliente) e quelli fatti negli ultimi 7 giorni.", input_schema: { type: "object", properties: {} } },
  { name: "proponi_conto", description: "Prepara il conto di un cliente o di una scuderia: dice quanti lavori fatti e non pagati sono ancora fuori da un conto (con totale) e quali conti sono già stati fatti e non ancora pagati. L'app mostra una scheda con i tasti «Fai il conto» (si apre già sul cliente, dove si possono togliere i cavalli) e «Apri il conto» per quelli già fatti.", input_schema: { type: "object", properties: {
      cliente: { type: "string", description: "Nome del cliente o della scuderia." } }, required: ["cliente"] } },
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

// ---------------------------------------------------------------- ARES (istruttori / trainer, vista professionista)
// Fase 1: consiglia, prepara le sedute e legge sedute/cavalli seguiti dell'istruttore (RLS). Non modifica né condivide nulla da solo.
// Testo identico a prompt-agenti/ares-system-prompt.txt
const STRUMENTI_ARES = [
  { ...clonaStrumento("cerca_conoscenze"), description: "Cerca nelle schede verificate di Equo su allenamento, didattica e equitazione (esercizi, progressioni, assetto, biomeccanica di base). Restituisce testo e fonte." },
  clonaStrumento("guida_app"),
  clonaStrumento("salva_memoria"),
  clonaStrumento("riferisci_ai_boss"),
  clonaStrumento("le_mie_segnalazioni"),
  { name: "le_mie_sedute", description: "Sedute dell'istruttore (bozze e inviate) con id, titolo, cavallo, stato, data, numero di annotazioni e di commenti. Nascoste escluse.", input_schema: { type: "object", properties: {
      cerca: { type: "string", description: "Filtra per titolo o nome del cavallo." }, stato: { type: "string", enum: ["bozza", "inviata"] }, limite: { type: "number", description: "Max 30 (default 15)." } } } },
  { name: "dettaglio_seduta", description: "Dettaglio di una seduta (id da le_mie_sedute): note, annotazioni (tipo, secondo, testo) e commenti/risposte del proprietario.", input_schema: { type: "object", properties: {
      id: { type: "string" } }, required: ["id"] } },
  { name: "cavalli_seguiti", description: "Cavalli seguiti dall'istruttore (nome, cavaliere, note, se collegati a un cavallo Equo) e quante sedute hanno.", input_schema: { type: "object", properties: {} } },
  { ...STRUMENTO_METEO, cache_control: { type: "ephemeral" } },
];

// ---------------------------------------------------------------- ATHENA (Equo Scuderia: gestori, staff, istruttori)
const STRUMENTI_ATHENA = [
  clonaStrumento("guida_app"),
  { name: "situazione_centro", description: "Situazione attuale del centro: scadenze sanitarie entro 30 giorni (e già scadute), pacchetti/carnet da rinnovare, lezioni di oggi e domani, articoli di magazzino sotto la soglia minima, ordini aperti, box (occupati, liberi, in manutenzione, cavalli fuori dal box e, dopo le 11, cavalli in box senza pasto del mattino segnato).", input_schema: { type: "object", properties: {} } },
  clonaStrumento("riferisci_ai_boss"),
  clonaStrumento("le_mie_segnalazioni"),
  { ...STRUMENTO_METEO, cache_control: { type: "ephemeral" } },
];
// Athena BASIC (pacchetto START): solo guida al gestionale, niente proattività, niente segnalazioni ai Boss
const STRUMENTI_ATHENA_BASIC = [clonaStrumento("guida_app"), { ...STRUMENTO_METEO, cache_control: { type: "ephemeral" } }];

// ---------------------------------------------------------------- HAMMER e ARES in Equo Scuderia (add-on del centro)
// Sono gli stessi agenti dell'app (stesse istruzioni e stesse schede di conoscenza), applicati ai cavalli del centro.
const STRUMENTO_CAVALLI_CENTRO = { name: "cavalli_centro", description: "Cavalli attualmente presenti nel centro: nome, razza, mantello, età, proprietario, box e note. Filtra per nome con 'cerca'. Sola lettura.", input_schema: { type: "object", properties: { cerca: { type: "string", description: "Parte del nome del cavallo." } } } };
const STRUMENTI_HAMMER_SCUD = [
  STRUMENTI_HAMMER.find((t) => t.name === "web_search"),
  STRUMENTI_HAMMER.find((t) => t.name === "cerca_conoscenze"),
  STRUMENTO_CAVALLI_CENTRO,
  { ...STRUMENTO_METEO, cache_control: { type: "ephemeral" } },
].filter(Boolean);
const STRUMENTI_ARES_SCUD = [
  STRUMENTI_ARES.find((t) => t.name === "cerca_conoscenze"),
  STRUMENTO_CAVALLI_CENTRO,
  { ...STRUMENTO_METEO, cache_control: { type: "ephemeral" } },
].filter(Boolean);

// ---------------------------------------------------------------- MERLINO (Equo Scuderia: analista, contabile e stratega del centro)
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

module.exports = { STRUMENTI, STRUMENTI_ARES, STRUMENTI_ARES_SCUD, STRUMENTI_ATHENA, STRUMENTI_ATHENA_BASIC, STRUMENTI_GESTIONE, STRUMENTI_HAMMER, STRUMENTI_HAMMER_SCUD, STRUMENTI_MERLINO, TIPI_INTERVENTO, TIPO_INTERVENTO_LABEL };
