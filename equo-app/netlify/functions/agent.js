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


// Le parti stanno in netlify/agente/ (configurazione, istruzioni dei vari agenti, strumenti, aiuti, meteo, esegui-strumento).
const { createClient } = require("@supabase/supabase-js");
const { linkCitati, oggiISO, senzaImporti, testoDaBlocchi, utenteDaToken } = require("../agente/aiuti");
const { CHIAVE_PUBBLICA, COSTO_RICERCA_USD, LIMITI, MAX_GIRI_TOOL, MODELLO, PREZZI } = require("../agente/configurazione");
const { eseguiStrumento } = require("../agente/esegui-strumento");
const { ISTRUZIONI_ARES } = require("../agente/istruzioni-ares");
const { ISTRUZIONI_CASO, ISTRUZIONI_FOTO_GUIDATA, ISTRUZIONI_HAMMER } = require("../agente/istruzioni-hammer");
const { ISTRUZIONI_MERLINO } = require("../agente/istruzioni-merlino");
const { ISTRUZIONI, ISTRUZIONI_PEGASUS } = require("../agente/istruzioni-proprietario");
const { ISTRUZIONI_ARES_SCUD, ISTRUZIONI_ATHENA, ISTRUZIONI_ATHENA_BASIC, ISTRUZIONI_HAMMER_SCUD } = require("../agente/istruzioni-scuderia");
const { STRUMENTI, STRUMENTI_ARES, STRUMENTI_ARES_SCUD, STRUMENTI_ATHENA, STRUMENTI_ATHENA_BASIC, STRUMENTI_GESTIONE, STRUMENTI_HAMMER, STRUMENTI_HAMMER_SCUD, STRUMENTI_MERLINO } = require("../agente/strumenti");
const ORIGINI_OK = ["https://scuderia.equohub.com", "https://app.equohub.com"];
let corsOrigine = "https://app.equohub.com";
const intestazioniCors = () => ({ "Access-Control-Allow-Origin": corsOrigine, "Vary": "Origin",
  "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Max-Age": "86400" });
const risposta = (status, obj) => ({ statusCode: status, headers: { "Content-Type": "application/json", ...intestazioniCors() }, body: JSON.stringify(obj) });

const PROVA_MESSAGGI = 10;
async function provaAgente(admin, centroId, agente) {
  const { data: r } = await admin.from("centri_prove_agenti").select("iniziata_il").eq("centro_id", centroId).eq("agente", agente).maybeSingle();
  if (!r) return null;
  const fine = new Date(r.iniziata_il).getTime() + 86400000;
  if (Date.now() >= fine) return null;
  const { count } = await admin.from("ai_messaggi").select("id", { count: "exact", head: true }).eq("centro_id", centroId).eq("agente", agente).eq("ruolo", "user").gte("created_at", r.iniziata_il);
  if ((count || 0) >= PROVA_MESSAGGI) return null;
  return { usati: count || 0, fine };
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
  // Hammer: modalità del pannello (analisi foto guidata, consulta un caso, riassunto dello storico) e quello che il maniscalco sta guardando
  const modalita = ["foto", "caso", "storico"].includes(body.modalita) ? body.modalita : null;
  if (modalita === "foto" && !allegati.some((a) => a.media_type !== "application/pdf")) return risposta(400, { error: "Serve una foto" });
  const contestoApp = typeof body.contesto_app === "string" ? body.contesto_app.replace(/\s+\n/g, "\n").slice(0, 2500) : "";
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
  let prova = null;
  if (merlino && !(limitiCentro.agenti || []).includes("merlino")) prova = await provaAgente(admin, centro.id, "merlino");
  if (merlino && !(limitiCentro.agenti || []).includes("merlino") && !prova) return risposta(403, { error: "Merlino non è attivo per questo centro", bloccato: true });
  // Merlino (numeri, incassi, strategia): solo titolare, amministratori e livelli 2-3
  if (merlino && !(centro.owner_id === user.id || membro.ruolo === "admin" || ["admin", "2", "3"].includes(String(membro.livello)))) return risposta(403, { error: "Merlino è riservato al titolare e ai responsabili del centro (livello 2 o 3)" });
  // Hammer e Ares (add-on del centro): stessi agenti dell'app, sui cavalli del centro
  const agScud = scud && ["hammer", "ares"].includes(body.agente) ? body.agente : null;
  if (agScud && !(limitiCentro.agenti || []).includes(agScud)) prova = await provaAgente(admin, centro.id, agScud);
  if (agScud && !(limitiCentro.agenti || []).includes(agScud) && !prova) return risposta(403, { error: `${agScud === "hammer" ? "Hammer" : "Ares"} non è attivo per questo centro`, bloccato: true });
  const athena = scud && !merlino && !agScud;
  const athenaBasic = athena && limitiCentro.athena_proattiva === false;
  // il Premium da proprietario non vale nella vista professionista (Hammer & co.): lì serve il Premium professionista
  const premiumSoloProp = profilo?.premium_livello === "proprietario";
  const piano = profilo?.piano === "premium" && !(vista === "professionista" && premiumSoloProp) ? "premium" : "free";
  // Free: 5 messaggi al GIORNO (chiave "AAAA-MM-GG", riparte a mezzanotte ora italiana); Premium: 500 al mese ("AAAA-MM")
  const giornaliero = !scud && piano === "free";
  const periodo = giornaliero ? oggiISO() : mese;
  const chiaveMese = merlino ? mese + "-merlino" : agScud ? mese + "-" + agScud : athena ? mese + "-athena" : periodo;
  // Hammer: vista professionista di un utente che è maniscalco (ruolo letto dal DB, non dall'app)
  const hammer = vista === "professionista" && [profilo?.ruolo, profilo?.ruolo_secondario].includes("maniscalco");
  // Pegasus: vista proprietario. Veterinari/istruttori (vista professionista non maniscalco): Equo AI neutro
  const pegasus = vista === "proprietario";
  // Ares: vista professionista di un utente che è istruttore/trainer (ruolo letto dal DB, non dall'app)
  const ares = vista === "professionista" && !hammer && [profilo?.ruolo, profilo?.ruolo_secondario].includes("istruttore");
  const agente = merlino ? "merlino" : agScud ? agScud : athena ? "athena" : hammer ? "hammer" : ares ? "ares" : pegasus ? "pegasus" : "equo";
  const { data: uso } = await admin.from("ai_utilizzo").select("conteggio, costo_usd").eq("user_id", user.id).eq("mese", chiaveMese).maybeSingle();
  let limite = LIMITI[piano], usati = uso?.conteggio || 0;
  if (scud) {
    // in Scuderia il limite è del CENTRO (tutto lo staff insieme), per agente
    limite = Number(merlino || agScud ? limitiCentro.merlino_messaggi : limitiCentro.athena_messaggi) || 30;
    let q = admin.from("ai_messaggi").select("id", { count: "exact", head: true }).eq("centro_id", centro.id).eq("ruolo", "user").gte("created_at", mese + "-01T00:00:00Z");
    q = merlino ? q.eq("agente", "merlino") : agScud ? q.eq("agente", agScud) : q.or("agente.is.null,agente.eq.athena");
    const { count } = await q;
    usati = count || 0;
    if (prova) { limite = PROVA_MESSAGGI; usati = prova.usati; }
    else if (merlino || agScud) {
      // messaggi extra del centro (200 o 500 al mese): pool condiviso fra gli agenti extra, usato quando un agente finisce i suoi
      const { data: cc } = await admin.from("centri").select("messaggi_extra").eq("id", centro.id).maybeSingle();
      const extra = Number(cc?.messaggi_extra) || 0;
      if (extra > 0) {
        const { data: righe } = await admin.from("ai_messaggi").select("agente").eq("centro_id", centro.id).eq("ruolo", "user")
          .in("agente", ["merlino", "hammer", "ares", "ermes", "galeno"]).gte("created_at", mese + "-01T00:00:00Z").limit(50000);
        const per = {}; (righe || []).forEach((r) => { per[r.agente] = (per[r.agente] || 0) + 1; });
        const altri = Object.entries(per).filter(([k]) => k !== agente).reduce((n, [, c]) => n + Math.max(0, c - limite), 0);
        limite += Math.max(0, extra - altri);
      }
    }
  }
  // un'analisi foto guidata vale 3 messaggi nel piano Free
  const peso = hammer && modalita === "foto" && giornaliero ? 3 : 1;
  if (usati + peso > limite) return risposta(200, { limite_raggiunto: true, peso, uso: { usati, limite, piano, periodo: giornaliero ? "giorno" : "mese" } });
  // prenotazione ATOMICA del messaggio (SQL ai_prenota): richieste in parallelo non superano il limite
  // e il messaggio resta contato anche se la risposta va in timeout. Se la funzione SQL manca, si prosegue come prima.
  const chiavePren = scud ? `centro:${centro.id}:${merlino ? "merlino" : agScud || "athena"}${prova ? ":prova" : ""}` : `utente:${user.id}:${chiaveMese}`;
  let prenotato = 0;
  for (let k = 0; k < peso; k++) {
    const { data: pren, error: ePren } = await admin.rpc("ai_prenota", { p_chiave: chiavePren, p_mese: scud ? mese : periodo, p_limite: limite, p_base: usati + k });
    if (ePren) { console.warn("ai_prenota non disponibile:", ePren.message); break; }
    if (Number(pren) < 0) {
      for (let j = 0; j < prenotato; j++) await admin.rpc("ai_rilascia", { p_chiave: chiavePren, p_mese: scud ? mese : periodo }).then(() => {}, () => {});
      return risposta(200, { limite_raggiunto: true, peso, uso: { usati: limite, limite, piano, periodo: giornaliero ? "giorno" : "mese" } });
    }
    if (k === 0) usati = Math.max(usati, Number(pren) - 1);
    prenotato++;
  }

  // contesto: cavalli, memoria, cronologia
  const { data: cavalli } = scud ? { data: [] } : await db.from("horses").select("id, name, breed, birth_date, microchip, mantello, note, condiviso_ecosistema").eq("owner_id", user.id).order("created_at", { ascending: true });
  const { data: memoria } = scud ? { data: [] } : await db.from("ai_memoria").select("testo, horse_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30);
  let qStoria = db.from("ai_messaggi").select("ruolo, contenuto").eq("user_id", user.id).eq("vista", vista);
  if (scud) qStoria = qStoria.eq("centro_id", centro.id);
  if (merlino) qStoria = qStoria.eq("agente", "merlino"); else if (agScud) qStoria = qStoria.eq("agente", agScud); else if (athena) qStoria = qStoria.or("agente.is.null,agente.eq.athena");
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
      : `Utente: ${profilo?.full_name || "—"} · piano ${piano} · messaggi AI usati ${giornaliero ? "oggi" : "questo mese"}: ${usati + peso} di ${limite}.`,
    scud ? "" : listaCavalli.length ? `Cavalli: ${listaCavalli.map((c) => c.name).join(", ")}.` : "L'utente non ha ancora registrato cavalli (si aggiungono dal tab Cavalli).",
    (memoria || []).length ? "Cose da ricordare:\n" + memoria.map((m) => "- " + (m.horse_id ? `[${listaCavalli.find((c) => c.id === m.horse_id)?.name || "cavallo"}] ` : "") + m.testo).join("\n") : "",
    hammer ? "Stai parlando con un maniscalco (vista professionista). I cavalli elencati sopra, se ci sono, sono i SUOI cavalli personali, non quelli dei clienti." :
      ares ? "Stai parlando con un istruttore/trainer (vista professionista). I cavalli elencati sopra, se ci sono, sono i SUOI cavalli personali; i cavalli che segue come istruttore li leggi con cavalli_seguiti." :
      vista === "professionista" ? "L'utente sta usando la vista professionista: gli strumenti professionali arrivano a breve; per ora aiutalo con conoscenze generali e con l'uso dell'app." : "",
    hammer && contestoApp ? "IN QUESTO MOMENTO IL MANISCALCO STA GUARDANDO (dati dell'app, usali per rispondere senza chiederli di nuovo):\n" + contestoApp : "",
    hammer && modalita === "foto" ? ISTRUZIONI_FOTO_GUIDATA : "",
    hammer && modalita === "caso" ? ISTRUZIONI_CASO : "",
    hammer && modalita === "storico" ? "RIASSUNTO DELLO STORICO: riassumi in 5-8 righe lo storico del cavallo che il maniscalco sta guardando (dati sopra): ritmo dei lavori, ferro e correttivi, cose ricorrenti, cosa tenere d'occhio alla prossima visita. Non inventare dati che non ci sono." : "",
    chiediFeedback && !modalita ? "DOMANDA PER I BOSS: in questa risposta, SOLO se la conversazione è tranquilla (nessuna emergenza, nessun problema urgente o arrabbiato), dopo aver risposto aggiungi in fondo una riga con parole tue di questo senso: \"C'è qualcosa che vorresti cambiare o migliorare in Equo? Dimmelo, che lo faccio presente ai Boss.\" Se non è il momento giusto, non aggiungerla." : "",
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
  const ctx = { db, admin, userId: user.id, cavalli: listaCavalli, proposta: null, azioni: [], ambito: hammer || agScud === "hammer" ? "maniscalco" : ares || agScud === "ares" ? "istruttore" : "proprietario",
    guida: scud ? "scuderia" : ares ? "istruttore" : vista === "professionista" ? "maniscalco" : "proprietario",
    strumenti: merlino ? STRUMENTI_MERLINO : agScud === "hammer" ? STRUMENTI_HAMMER_SCUD : agScud === "ares" ? STRUMENTI_ARES_SCUD : athenaBasic ? STRUMENTI_ATHENA_BASIC : athena ? STRUMENTI_ATHENA : null,
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
  const costo = { in: 0, out: 0, cacheRead: 0, cacheWrite: 0, ricerche: 0, giri: 0 };
  let link = [];
  let testoFinale = "";

  try {
    for (let giro = 0; giro < MAX_GIRI_TOOL; giro++) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: MODELLO,
          max_tokens: allegati.length ? 2000 : (hammer || merlino || ares || agScud ? 1600 : 1200),
          system: [
            { type: "text", text: merlino ? ISTRUZIONI_MERLINO : agScud === "hammer" ? ISTRUZIONI_HAMMER_SCUD : agScud === "ares" ? ISTRUZIONI_ARES_SCUD : athenaBasic ? ISTRUZIONI_ATHENA_BASIC : athena ? ISTRUZIONI_ATHENA : hammer ? ISTRUZIONI_HAMMER : ares ? ISTRUZIONI_ARES : pegasus ? ISTRUZIONI_PEGASUS : ISTRUZIONI, cache_control: { type: "ephemeral" } },
            { type: "text", text: contesto },
          ],
          tools: scud ? ctx.strumenti : hammer ? STRUMENTI_HAMMER : ares ? STRUMENTI_ARES : STRUMENTI,
          messages,
        }),
      });
      const data = await res.json();
      if (!res.ok) { console.error("Errore Claude API:", JSON.stringify(data).slice(0, 500)); throw new Error("api"); }
      const u = data.usage || {};
      costo.giri += 1;
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
    for (let j = 0; j < prenotato; j++) await admin.rpc("ai_rilascia", { p_chiave: chiavePren, p_mese: scud ? mese : periodo }).then(() => {}, () => {});
    return risposta(200, { reply: "Non riesco a rispondere in questo momento, riprova tra poco.", errore: true, uso: { usati, limite, piano, periodo: giornaliero ? "giorno" : "mese" } });
  }

  // se ha usato la ricerca web ma non ha scritto i link, aggiungiamo quelli citati
  if (testoFinale && link.length && !/https?:\/\//.test(testoFinale)) testoFinale += "\n\nLink:\n" + link.map((l) => `- [${l.titolo}](${l.url})`).join("\n");
  if (!testoFinale) testoFinale = ctx.azioni.length ? "Ho preparato le schede da confermare qui sotto." : "Non sono riuscito a rispondere, riprova.";
  const testoUtenteSalvato = (modalita === "foto" ? "📷 Analisi foto — " : allegati.length ? `📎 ${allegati.length === 1 ? "1 allegato" : allegati.length + " allegati"}${messaggio ? " — " : ""}` : "") + messaggio;

  // salva conversazione e consumo (service role: la tabella ai_utilizzo non è scrivibile dall'app)
  const p = PREZZI[MODELLO] || PREZZI["claude-sonnet-5"];
  const costoUsd = (costo.in * p.in + costo.out * p.out + costo.cacheRead * p.cacheRead + costo.cacheWrite * p.cacheWrite) / 1e6 + costo.ricerche * COSTO_RICERCA_USD;
  await admin.from("ai_messaggi").insert([
    { user_id: user.id, vista, agente, ruolo: "user", contenuto: testoUtenteSalvato, centro_id: centro?.id || null },
    { user_id: user.id, vista, agente, ruolo: "assistant", contenuto: testoFinale, centro_id: centro?.id || null },
  ]);
  // domanda per i Boss fatta davvero: si segna per non ripeterla prima di 14 giorni
  if (chiediFeedback && /boss/i.test(testoFinale)) await admin.from("profiles").update({ ai_feedback_chiesto_at: new Date().toISOString() }).eq("id", user.id);
  await admin.from("ai_utilizzo").upsert({ user_id: user.id, mese: chiaveMese, conteggio: (uso?.conteggio || 0) + peso, costo_usd: Number(uso?.costo_usd || 0) + costoUsd, aggiornato_il: new Date().toISOString() }, { onConflict: "user_id,mese" });
  // costo reale per agente (tabella ai_costi); se la tabella non esiste ancora, il resto funziona uguale
  try {
    await admin.from("ai_costi").insert({ user_id: user.id, centro_id: centro?.id || null, agente: agente || null, vista: vista || null, modello: MODELLO,
      token_in: costo.in, token_out: costo.out, cache_read: costo.cacheRead, cache_write: costo.cacheWrite, ricerche: costo.ricerche, giri: costo.giri,
      prova: !!prova, costo_usd: Math.round(costoUsd * 100000) / 100000 });
  } catch (_) {}

  return risposta(200, { reply: testoFinale, agente, azioni: ctx.azioni, proposedEvent: ctx.proposta, uso: { usati: usati + peso, limite, piano, periodo: giornaliero ? "giorno" : "mese" }, prova: prova ? { fine: new Date(prova.fine).toISOString() } : undefined, modalita });
};

// esportati solo per i test
exports._interni = { eseguiStrumento, ISTRUZIONI_ATHENA, STRUMENTI_ATHENA, ISTRUZIONI_ATHENA_BASIC, STRUMENTI_ATHENA_BASIC, ISTRUZIONI_MERLINO, STRUMENTI_MERLINO, ISTRUZIONI, ISTRUZIONI_PEGASUS, STRUMENTI, ISTRUZIONI_HAMMER, STRUMENTI_HAMMER, ISTRUZIONI_ARES, STRUMENTI_ARES, ISTRUZIONI_HAMMER_SCUD, STRUMENTI_HAMMER_SCUD, ISTRUZIONI_ARES_SCUD, STRUMENTI_ARES_SCUD, STRUMENTI_GESTIONE, testoDaBlocchi, linkCitati };
