// Prova (3/11/2026, decisione di Simone): niente scelta generale Semplice/Completa né al primo accesso né nel menu del profilo.
// Le funzioni sono sempre accese; la scelta resta dentro le sezioni (Incassi: Semplice · Completa/Statistiche).
const path = require("path"); const { chromium } = require("playwright");
const APP = path.resolve(__dirname, "..", "index.html");
const SUPA = process.env.SUPABASE_UMD || path.join(path.dirname(require.resolve("@supabase/supabase-js/package.json")), "dist", "umd", "supabase.js");
const problemi = []; const ok = (c, m) => { console.log((c ? "OK  " : "NO  ") + m); if(!c) problemi.push(m); };
(async () => {
  const b = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  for(const ruolo of ["maniscalco", "veterinario"]){
    const pg = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    const err = []; pg.on("pageerror", e => err.push(String(e.message)));
    await pg.route("**/*", r => { const u = r.request().url(); if(u.includes("supabase-js")) return r.fulfill({ path: SUPA, contentType: "application/javascript" });
      if(u.startsWith("file://") || u.startsWith("data:")) return r.continue(); return r.abort(); });
    await pg.goto("file://" + APP); await pg.waitForTimeout(1200);
    await pg.evaluate(() => startDemo()); await pg.waitForTimeout(600);
    await pg.evaluate(async r => { currentUser.ruolo = r; await enterApp(r); }, ruolo); await pg.waitForTimeout(3000);
    // primo accesso senza scelta fatta (fuori dalla demo): nessuna finestra «Come vuoi usare Equo?»
    const pop = await pg.evaluate(() => { currentUser.vistaMan = null; DEMO_MODE = false; try{ mostraSceltaVistaManiscalco(); } finally { DEMO_MODE = true; } return document.getElementById("eq-pop-vista")?.classList.contains("attivo") || false; });
    // menu del profilo
    await pg.evaluate(() => { openMenu(); }); await pg.waitForTimeout(400);
    const menu = await pg.evaluate(() => ({ riga: !!document.getElementById("menu-vista-man-row"), versione: [...document.querySelectorAll("#modal-menu .menu-section-label")].some(x => x.textContent.trim() === "Versione" && x.offsetParent) }));
    await pg.evaluate(() => { try{ closeModal("modal-menu"); }catch(_){} });
    // Incassi: la scelta Semplice · Completa resta nella sezione
    await pg.evaluate(async () => { showPage("pro-incassi"); await renderIncassi(); }); await pg.waitForTimeout(500);
    const inc = await pg.evaluate(() => ({ vis: getComputedStyle(document.getElementById("inc-vista")).display !== "none", tasti: [...document.querySelectorAll("#inc-vista button")].map(x => x.textContent.trim()) }));
    let altro = null;
    if(ruolo === "maniscalco"){ await pg.evaluate(() => { showPage("pro-home"); hmAltro(); }); await pg.waitForTimeout(300); altro = await pg.evaluate(() => document.body.textContent.includes("Passa alla Completa") || document.body.textContent.includes("Passa alla Semplice")); }
    ok(!pop && !menu.riga && !menu.versione && inc.vis && inc.tasti.length === 2 && /^Semplice/.test(inc.tasti[0]) && /^Completa/.test(inc.tasti[1]) && !altro && await pg.evaluate(() => vistaCompleta()),
      ruolo + ": niente finestra al primo accesso né «Versione» nel menu; in Incassi resta Semplice · Completa " + JSON.stringify({ pop, menu, inc, altro }));
    ok(!err.length, ruolo + ": nessun errore JavaScript " + JSON.stringify(err));
  }
  await b.close();
  if(problemi.length){ console.error("\nPROVA SENZA VERSIONE: " + problemi.length + " problemi"); process.exit(1); }
  console.log("\nPROVA SENZA VERSIONE: tutto OK");
})();
