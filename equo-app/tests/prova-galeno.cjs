// Prova di Galeno (2/11/2026): istruzioni e strumenti del server, guide «piano A», testata della chat nell'app.
// Uso: node tests/prova-galeno.cjs   (parte 2 con Playwright, come le altre prove)
const path = require("path");
const assert = require("assert");
const errori = [];
const ok = (cond, msg) => { if (!cond) errori.push(msg); };

// ---- 1 · server: istruzioni, strumenti, guide
const { _interni } = require(path.resolve(__dirname, "..", "netlify", "functions", "agent.js"));
const { ISTRUZIONI_GALENO, STRUMENTI_GALENO, eseguiStrumento } = _interni;
ok(ISTRUZIONI_GALENO && ISTRUZIONI_GALENO.includes("Sei **Galeno**"), "istruzioni di Galeno mancanti");
["Nessuna prescrizione autonoma", "mg/kg", "DPA", "guida_app", "cerca_conoscenze", "Fonte:"].forEach((t) => ok(ISTRUZIONI_GALENO.includes(t), "istruzioni: manca «" + t + "»"));
const nomi = (STRUMENTI_GALENO || []).map((t) => t.name);
["cerca_conoscenze", "guida_app", "salva_memoria", "riferisci_ai_boss", "meteo"].forEach((n) => ok(nomi.includes(n), "strumento mancante: " + n));
["agenda", "incassi", "proponi_appuntamento", "web_search"].forEach((n) => ok(!nomi.includes(n), "strumento che Galeno non deve avere: " + n));

const GUIDE = {
  veterinario: [{ titolo: "Nuovo appuntamento e agenda della settimana", contenuto: "v" }],
  maniscalco: [{ titolo: "Pagamenti in più volte: acconti e rate", contenuto: "m" }, { titolo: "Come segno una ferratura fatta", contenuto: "m" },
    { titolo: "Officina mobile: mezzi, aiutanti, materiali e spese", contenuto: "m" }, { titolo: "Cos'è Hammer e come lo apro", contenuto: "m" }],
};
const chiamate = [];
const db = { rpc: async (fn, args) => { chiamate.push(fn + ":" + args.p_ambito);
  const l = GUIDE[args.p_ambito] || [];
  return { data: fn === "indice_guida" ? l.map((g) => g.titolo) : l, error: null }; } };

(async () => {
  const ctxVet = { db, userId: "u", cavalli: [], azioni: [], ambito: "veterinario", guida: "veterinario" };
  const r = await eseguiStrumento("guida_app", { domanda: "come registro un acconto" }, ctxVet);
  const titoli = (Array.isArray(r) ? r : []).map((g) => g.titolo);
  ok(titoli.includes("Nuovo appuntamento e agenda della settimana"), "guida del veterinario non trovata");
  ok(titoli.includes("Pagamenti in più volte: acconti e rate"), "guida comune del maniscalco non trovata");
  ok(!titoli.some((t) => /ferratura|Officina|Hammer/.test(t)), "guide solo da maniscalco non escluse: " + titoli.join(" | "));
  const el = await eseguiStrumento("guida_app", { elenco: true }, ctxVet);
  ok(el.schede_disponibili.length === 2, "indice delle guide del veterinario: " + JSON.stringify(el.schede_disponibili));
  // il maniscalco resta com'era: solo le sue guide, nessun filtro
  chiamate.length = 0;
  const rm = await eseguiStrumento("guida_app", { domanda: "ferratura" }, { db, userId: "u", cavalli: [], azioni: [], ambito: "maniscalco", guida: "maniscalco" });
  ok(chiamate.join() === "cerca_guida:maniscalco" && rm.length === 3, "guida del maniscalco cambiata: " + chiamate.join() + " " + rm.length);

  // ---- 2 · app: testata della chat per il veterinario
  try {
    const { chromium } = require("playwright");
    const APP = path.resolve(__dirname, "..", "index.html");
    const SUPA = process.env.SUPABASE_UMD || path.join(path.dirname(require.resolve("@supabase/supabase-js/package.json")), "dist", "umd", "supabase.js");
    const b = await chromium.launch({ args: ["--allow-file-access-from-files"] });
    const pg = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    const err = []; pg.on("pageerror", (e) => err.push(String(e.message)));
    await pg.route("**/*", (q) => { const u = q.request().url(); if (u.includes("supabase-js")) return q.fulfill({ path: SUPA, contentType: "application/javascript" });
      if (u.startsWith("file://") || u.startsWith("data:")) return q.continue(); return q.abort(); });
    await pg.goto("file://" + APP); await pg.waitForTimeout(1200);
    await pg.evaluate(() => startDemo()); await pg.waitForTimeout(600);
    await pg.evaluate(async () => { currentUser.ruolo = "veterinario"; currentUser.vistaAttiva = "veterinario"; await enterApp("veterinario"); }); await pg.waitForTimeout(2500);
    const t = await pg.evaluate(() => { aggiornaTestataAi(); return { tit: document.getElementById("ai-sheet-titolo")?.textContent, benv: document.getElementById("ai-benvenuto")?.textContent || "", nome: nomeAgenteAi() }; });
    ok(t.tit === "Galeno · veterinaria", "titolo della chat: " + t.tit);
    ok(t.benv.includes("Galeno") && t.benv.includes("Non prescrivo"), "benvenuto di Galeno mancante");
    ok(t.nome === "Galeno", "nome agente: " + t.nome);
    // il maniscalco resta Hammer
    await pg.evaluate(async () => { currentUser.ruolo = "maniscalco"; currentUser.vistaAttiva = "maniscalco"; await enterApp("maniscalco"); }); await pg.waitForTimeout(2000);
    const tm = await pg.evaluate(() => { aggiornaTestataAi(); return document.getElementById("ai-sheet-titolo")?.textContent; });
    ok(tm === "Hammer · mascalcia", "titolo del maniscalco cambiato: " + tm);
    ok(!err.length, "errori nella pagina: " + err.join(" | "));
    await b.close();
  } catch (e) { errori.push("parte app: " + e.message); }

  if (errori.length) { console.error("PROVA GALENO: " + errori.length + " problemi\n- " + errori.join("\n- ")); process.exit(1); }
  console.log("PROVA GALENO: tutto OK");
})();
