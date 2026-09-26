// Equo AI — agente per i proprietari (Step 1 del progetto agenti, vedi claude/equo-agenti-ai.md).
//
// Cosa fa:
//  - verifica il LOGIN (token Supabase): niente token, niente risposta;
//  - applica il limite mensile di messaggi LATO SERVER (Free 5, Premium 500);
//  - legge i dati dell'utente con i SUOI permessi (RLS): cavalli, scadenze, storico, spese,
//    appuntamenti col maniscalco, lezioni;
//  - consulta le schede di conoscenza verificate (tabella ai_conoscenze) e ne cita la fonte;
//  - ricorda: conversazione salvata (ai_messaggi) + note di memoria (ai_memoria);
//  - può PROPORRE un evento sanitario, che l'utente conferma in app (non scrive da solo).
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
const TIPI_EVENTO = { vaccino: "Vaccino", coggins: "Test Coggins (AIE)", ferratura: "Ferratura", sverminazione: "Sverminazione" };

// ---------------------------------------------------------------- istruzioni fisse (in cache)
const ISTRUZIONI = `Sei **Equo AI**, l'assistente dell'app Equo per chi possiede o monta un cavallo in Italia.
Parli in italiano, in modo caldo ma diretto, come un esperto di scuderia che conosce bene anche la burocrazia.

## Come lavori
- Per QUALSIASI cosa che riguarda i dati dell'utente (i suoi cavalli, scadenze, vaccini, ferrature, spese, appuntamenti col maniscalco, lezioni) usa SEMPRE gli strumenti per leggerli: non indovinare e non inventare mai date, importi o nomi.
- Per domande su salute, normative, vaccinazioni, Coggins/AIE, anagrafe equina, sverminazione, ferratura, alimentazione, emergenze: prima cerca nelle schede verificate con lo strumento cerca_conoscenze. Se trovi una scheda pertinente basati su quella e alla fine scrivi "Fonte: <titolo fonte>". Se non c'è una scheda, rispondi con conoscenze generali prudenti e dillo ("indicazione generale").
- Se l'utente ti dice qualcosa di utile da ricordare in futuro (abitudini, allergie o sensibilità del cavallo, preferenze, nome del veterinario o della scuderia), salvalo con salva_memoria, senza chiedere il permesso per cose ovvie. Non salvare dati sensibili sulla salute delle PERSONE.
- Se l'utente chiede di registrare un vaccino, un test Coggins, una ferratura o una sverminazione con una data chiara, usa proponi_evento_sanitario: l'app mostrerà una scheda che l'utente conferma. Se mancano cavallo o data, chiedili. Non dire mai che hai già salvato: di' che hai preparato la scheda da confermare.
- Oggi puoi solo proporre eventi sanitari. Per spese, lezioni o appuntamenti col maniscalco spiega in una riga dove farlo nell'app (vedi "Dove si trovano le cose").
- Quando elenchi scadenze, metti prima quelle scadute o più vicine, con la data in formato italiano (es. 12 ottobre 2026).

## Salute e sicurezza (regole non negoziabili)
- Non sei un veterinario e non fai diagnosi. Dai indicazioni generali e di buon senso, poi indica sempre quando serve il veterinario.
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

// ---------------------------------------------------------------- strumenti
const STRUMENTI = [
  { name: "elenco_cavalli", description: "Elenca i cavalli dell'utente con razza, data di nascita, microchip, mantello e note.", input_schema: { type: "object", properties: {} } },
  { name: "scadenze", description: "Prossime scadenze sanitarie (vaccini, Coggins, ferratura, sverminazione) di tutti i cavalli, comprese quelle già scadute. Una riga per cavallo e tipo: la più recente.", input_schema: { type: "object", properties: { giorni_avanti: { type: "integer", description: "Quanti giorni nel futuro guardare (default 90)." } } } },
  { name: "storico_sanitario", description: "Storico degli eventi sanitari registrati (più recenti prima), filtrabile per cavallo e tipo.", input_schema: { type: "object", properties: { cavallo: { type: "string", description: "Nome del cavallo (facoltativo)." }, tipo: { type: "string", enum: ["vaccino", "coggins", "ferratura", "sverminazione"] }, limite: { type: "integer", description: "Numero massimo di eventi (default 15)." } } } },
  { name: "spese", description: "Riepilogo spese in un periodo: totale, totale per categoria, per mese e per cavallo, più le ultime voci.", input_schema: { type: "object", properties: { da: { type: "string", description: "Data inizio YYYY-MM-DD (default: 1 gennaio dell'anno in corso)." }, a: { type: "string", description: "Data fine YYYY-MM-DD (default: oggi)." }, categoria: { type: "string", enum: ["pensione", "mangime", "veterinario", "maniscalco", "attrezzatura", "altro"] } } } },
  { name: "appuntamenti_maniscalco", description: "Maniscalchi collegati all'utente e appuntamenti (richiesti, confermati, rifiutati) da 7 giorni fa in poi.", input_schema: { type: "object", properties: {} } },
  { name: "lezioni", description: "Lezioni, allenamenti e gare segnati nel calendario, in un periodo.", input_schema: { type: "object", properties: { da: { type: "string" }, a: { type: "string" } } } },
  { name: "cerca_conoscenze", description: "Cerca nelle schede verificate di Equo (normativa italiana, vaccinazioni, Coggins/AIE, anagrafe, sverminazione, ferratura, alimentazione, emergenze, uso dell'app). Restituisce testo e fonte.", input_schema: { type: "object", properties: { domanda: { type: "string", description: "Parole chiave o domanda in italiano." } }, required: ["domanda"] } },
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
    cache_control: { type: "ephemeral" },
  },
];

// ---------------------------------------------------------------- utilità
const oggiISO = () => new Date().toISOString().slice(0, 10);
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
      const { data, error } = await db.rpc("cerca_conoscenze", { p_query: String(input.domanda || "").slice(0, 300), p_ambito: "proprietario", p_limite: 4 });
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
      ctx.proposta = { horse_name: c.name, type: input.type, date: input.date, next_due_date: /^\d{4}-\d{2}-\d{2}$/.test(input.next_due_date || "") ? input.next_due_date : null, notes: input.notes || null };
      return "Scheda mostrata all'utente: sarà salvata solo quando la conferma. Diglielo in una frase.";
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
  if (!messaggio) return risposta(400, { error: "Messaggio mancante" });
  const vista = body.vista === "professionista" ? "professionista" : "proprietario";

  // client con i permessi DELL'UTENTE: tutte le letture passano dalle regole RLS
  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY || CHIAVE_PUBBLICA, {
    auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // limite mensile lato server
  const mese = oggiISO().slice(0, 7);
  const { data: profilo } = await admin.from("profiles").select("full_name, piano").eq("id", user.id).maybeSingle();
  const piano = profilo?.piano === "premium" ? "premium" : "free";
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
    vista === "professionista" ? "L'utente sta usando la vista professionista: gli strumenti professionali arrivano a breve; per ora aiutalo con conoscenze generali e con l'uso dell'app." : "",
  ].filter(Boolean).join("\n");

  const messages = (storia || []).reverse().map((m) => ({ role: m.ruolo === "assistant" ? "assistant" : "user", content: m.contenuto }));
  while (messages.length && messages[0].role !== "user") messages.shift();
  messages.push({ role: "user", content: messaggio });

  const ctx = { db, userId: user.id, cavalli: listaCavalli, proposta: null };
  const costo = { in: 0, out: 0, cacheRead: 0, cacheWrite: 0 };
  let testoFinale = "";

  try {
    for (let giro = 0; giro < MAX_GIRI_TOOL; giro++) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: MODELLO,
          max_tokens: 1200,
          system: [
            { type: "text", text: ISTRUZIONI, cache_control: { type: "ephemeral" } },
            { type: "text", text: contesto },
          ],
          tools: STRUMENTI,
          messages,
        }),
      });
      const data = await res.json();
      if (!res.ok) { console.error("Errore Claude API:", JSON.stringify(data).slice(0, 500)); throw new Error("api"); }
      const u = data.usage || {};
      costo.in += u.input_tokens || 0; costo.out += u.output_tokens || 0;
      costo.cacheRead += u.cache_read_input_tokens || 0; costo.cacheWrite += u.cache_creation_input_tokens || 0;

      const blocchi = Array.isArray(data.content) ? data.content : [];
      const testo = blocchi.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      if (testo) testoFinale = testo;
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

  if (!testoFinale) testoFinale = ctx.proposta ? `Ho preparato la scheda per ${ctx.proposta.horse_name}: confermala qui sotto.` : "Non sono riuscito a rispondere, riprova.";

  // salva conversazione e consumo (service role: la tabella ai_utilizzo non è scrivibile dall'app)
  const p = PREZZI[MODELLO] || PREZZI["claude-sonnet-5"];
  const costoUsd = (costo.in * p.in + costo.out * p.out + costo.cacheRead * p.cacheRead + costo.cacheWrite * p.cacheWrite) / 1e6;
  await admin.from("ai_messaggi").insert([
    { user_id: user.id, vista, ruolo: "user", contenuto: messaggio },
    { user_id: user.id, vista, ruolo: "assistant", contenuto: testoFinale },
  ]);
  await admin.from("ai_utilizzo").upsert({ user_id: user.id, mese, conteggio: usati + 1, costo_usd: Number(uso?.costo_usd || 0) + costoUsd, aggiornato_il: new Date().toISOString() }, { onConflict: "user_id,mese" });

  return risposta(200, { reply: testoFinale, proposedEvent: ctx.proposta, uso: { usati: usati + 1, limite, piano } });
};

// esportati solo per i test
exports._interni = { eseguiStrumento, ISTRUZIONI, STRUMENTI };
