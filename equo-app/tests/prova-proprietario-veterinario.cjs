// Prova dei TESTI DEL PROPRIETARIO quando il professionista è un veterinario (11/11/2026, SQL 63):
// menu e finestra «Collega maniscalco o veterinario», chat con «veterinario» e icona dello stetoscopio,
// cavalli proposti «Il veterinario … ha preparato», «visite del veterinario nel libretto». Senza SQL 63 resta «maniscalco».
const path = require("path"); const { chromium } = require("playwright");
const APP = path.resolve(__dirname, "..", "index.html");
const SUPA = process.env.SUPABASE_UMD || path.join(path.dirname(require.resolve("@supabase/supabase-js/package.json")), "dist", "umd", "supabase.js");
const problemi = []; const ok = (c, m) => { console.log((c ? "OK  " : "NO  ") + m); if(!c) problemi.push(m); };
(async () => {
  const b = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const pg = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const err = []; pg.on("pageerror", e => err.push(String(e.message)));
  await pg.route("**/*", r => { const u = r.request().url(); if(u.includes("supabase-js")) return r.fulfill({ path: SUPA, contentType: "application/javascript" });
    if(u.startsWith("file://") || u.startsWith("data:")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + APP); await pg.waitForTimeout(1200);
  await pg.evaluate(() => startDemo()); await pg.waitForTimeout(600);
  await pg.evaluate(async () => { currentUser.ruolo = "proprietario"; await enterApp("proprietario"); }); await pg.waitForTimeout(3000);
  const attesa = ms => pg.waitForTimeout(ms);

  const menu = await pg.evaluate(() => document.getElementById("menu-owner-section")?.textContent.replace(/\s+/g, " ") || "");
  ok(/Collega maniscalco o veterinario/.test(menu) && !/Collega il tuo maniscalco/.test(menu), "Menu: «Collega maniscalco o veterinario»");
  await pg.evaluate(() => openCollegaManiscalco(true)); await attesa(400);
  const fin = await pg.evaluate(() => ({ t: document.querySelector("#modal-collega-maniscalco .modal-title")?.textContent.trim(), isc: document.getElementById("collega-maniscalco-iscrizione")?.textContent.replace(/\s+/g, " ").trim(),
    ph: document.getElementById("collega-maniscalco-codice")?.placeholder }));
  ok(fin.t === "Collega il tuo professionista" && /maniscalco o il tuo veterinario usano già Equo/.test(fin.isc) && fin.ph === "EQUOPRO… o EQUOMED…", "Finestra di collegamento per maniscalco e veterinario " + JSON.stringify(fin));
  await pg.evaluate(() => closeModal("modal-collega-maniscalco"));

  // chat: un maniscalco e un veterinario (risposta dell'SQL 63) e uno senza professione (database di prima)
  await pg.evaluate(() => { DB.listManiscalchiCollegati = async () => [
    { cliente_mascalcia_id: "x1", nome_maniscalco: "Marco Ferri", professione: "maniscalco", non_letti: 0 },
    { cliente_mascalcia_id: "x2", nome_maniscalco: "Riccardo Mastrovalerio", professione: "veterinario", non_letti: 0 },
    { cliente_mascalcia_id: "x3", nome_maniscalco: null, non_letti: 0 }]; });
  await pg.evaluate(async () => { let box = document.getElementById("farrier-chat-list"); if(!box){ box = document.createElement("div"); box.id = "farrier-chat-list"; document.body.appendChild(box); } await loadFarrierChatSection(); });
  const chat = await pg.evaluate(() => [...document.querySelectorAll("#farrier-chat-list .inbox-item")].map(x => ({ n: x.querySelector(".inbox-name").textContent.replace(/\s+/g, " ").trim(), ic: x.querySelector(".horse-avatar i").className, p: x.querySelector(".inbox-preview").textContent })));
  ok(chat.length === 3 && /fa-hammer/.test(chat[0].ic) && /· maniscalco/.test(chat[0].n) && /fa-stethoscope/.test(chat[1].ic) && /Riccardo Mastrovalerio · veterinario/.test(chat[1].n) && /tuo veterinario/.test(chat[1].p)
    && chat[2].n === "Il tuo maniscalco" && /fa-hammer/.test(chat[2].ic), "Chat: maniscalco e veterinario distinti, senza SQL 63 come prima " + JSON.stringify(chat));

  // cavalli proposti dal veterinario
  const carica = async prof => pg.evaluate(async prof => { let box = document.getElementById("home-proposte"); if(!box){ box = document.createElement("div"); box.id = "home-proposte"; document.body.appendChild(box); }
    const rpc0 = sb.rpc; sb.rpc = async (f, a) => f !== "equo_proposte_cavalli_proprietario" ? { data: null, error: null } : { data: [
      { proposta: "p1", nome: "Dilan", codice: "PRV-000231", maniscalco: "Riccardo Mastrovalerio", professione: prof, candidati: [] },
      { proposta: "p2", nome: "Stella", codice: "PRV-000232", maniscalco: "Riccardo Mastrovalerio", professione: prof, candidati: [] }], error: null };
    const lh = DB.listHorses; DB.listHorses = async () => horses || []; DEMO_MODE = false; try{ await loadHorses(); await new Promise(r => setTimeout(r, 600)); } finally { DEMO_MODE = true; sb.rpc = rpc0; DB.listHorses = lh; } }, prof);
  await carica("veterinario");
  const prop = await pg.evaluate(() => document.getElementById("home-proposte").textContent.replace(/\s+/g, " "));
  ok(/Il veterinario Riccardo Mastrovalerio ha preparato 2 cavalli per te/.test(prop) && /Le visite che il veterinario Riccardo Mastrovalerio ha già fatto/.test(prop) && !/maniscalco/i.test(prop), "Cavalli proposti dal veterinario " + prop.slice(0, 260));
  await carica(undefined);
  const prima = await pg.evaluate(() => document.getElementById("home-proposte").textContent.replace(/\s+/g, " "));
  ok(/Riccardo Mastrovalerio ha preparato 2 cavalli per te/.test(prima) && /I lavori che Riccardo Mastrovalerio/.test(prima), "Senza professione: testi di prima");

  ok(!err.length, "nessun errore JavaScript " + JSON.stringify(err));
  await b.close();
  if(problemi.length){ console.error("\nPROVA PROPRIETARIO-VETERINARIO: " + problemi.length + " problemi"); process.exit(1); }
  console.log("\nPROVA PROPRIETARIO-VETERINARIO: tutto OK");
})();
