// Prova: la X di «Manca il prezzo» non blocca il salvataggio dell'appuntamento (3/11/2026, Riccardo: «non riesco a salvare gli appuntamenti»).
// Prima la X chiudeva la finestra e basta: il salvataggio restava in attesa per sempre. Ora la X = «Salva senza prezzo».
const path = require("path"); const { chromium } = require("playwright");
const APP = path.resolve(__dirname, "..", "index.html");
const SUPA = process.env.SUPABASE_UMD || path.join(path.dirname(require.resolve("@supabase/supabase-js/package.json")), "dist", "umd", "supabase.js");
const problemi = []; const ok = (c, m) => { console.log((c ? "OK  " : "NO  ") + m); if(!c) problemi.push(m); };
(async () => {
  const b = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  for(const ruolo of ["veterinario", "maniscalco"]){
    const pg = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    const err = []; pg.on("pageerror", e => err.push(String(e.message)));
    await pg.route("**/*", r => { const u = r.request().url(); if(u.includes("supabase-js")) return r.fulfill({ path: SUPA, contentType: "application/javascript" });
      if(u.startsWith("file://") || u.startsWith("data:")) return r.continue(); return r.abort(); });
    await pg.goto("file://" + APP); await pg.waitForTimeout(1200);
    await pg.evaluate(() => startDemo()); await pg.waitForTimeout(600);
    await pg.evaluate(async r => { currentUser.ruolo = r; await enterApp(r); }, ruolo); await pg.waitForTimeout(3000);
    await pg.evaluate(() => { try{ localStorage.removeItem("equo-no-promemoria-prezzo"); }catch(_){} openInterventoModal(null); }); await pg.waitForTimeout(800);
    await pg.evaluate(() => { const s = document.getElementById("intervento-cliente-select"); s.value = "__nuovo__"; s.dispatchEvent(new Event("change")); }); await pg.waitForTimeout(400);
    await pg.fill("#intervento-nuovo-cliente-nome", "Mario Prova"); await pg.fill("#intervento-nuovo-cavallo-nome", "Fulmine");
    await pg.evaluate(() => { document.getElementById("intervento-data").value = isoLocale(new Date(Date.now() + 864e5)); document.getElementById("intervento-ora").value = "10:00";
      const t = document.getElementById("intervento-tipo-altro"); if(t && !t.value) t.value = "controllo"; });
    const prima = await pg.evaluate(() => demoState.interventiMascalcia.length);
    await pg.click("#intervento-save-btn"); await pg.waitForTimeout(1200);
    const chiede = await pg.evaluate(() => document.getElementById("modal-prezzi").classList.contains("active"));
    await pg.click("#modal-prezzi .modal-close-x"); await pg.waitForTimeout(1500);
    const dopo = await pg.evaluate(() => ({ n: demoState.interventiMascalcia.length, prezzi: document.getElementById("modal-prezzi").classList.contains("active"),
      app: document.getElementById("modal-add-intervento").classList.contains("active"), ultimo: demoState.interventiMascalcia.slice(-1)[0]?.importo ?? null }));
    ok(chiede && !dopo.prezzi && !dopo.app && dopo.n === prima + 1 && dopo.ultimo == null, ruolo + ": X su «Manca il prezzo» → appuntamento salvato senza prezzo " + JSON.stringify({ chiede, prima, dopo }));
    // la X delle altre finestre chiude e basta
    await pg.evaluate(() => openModal("modal-ticket")); await pg.waitForTimeout(200);
    await pg.click("#modal-ticket .modal-close-x"); await pg.waitForTimeout(200);
    ok(!(await pg.evaluate(() => document.getElementById("modal-ticket").classList.contains("active"))), ruolo + ": la X delle altre finestre le chiude");
    ok(!err.length, ruolo + ": nessun errore JavaScript " + JSON.stringify(err));
  }
  await b.close();
  if(problemi.length){ console.error("\nPROVA PREZZO X: " + problemi.length + " problemi"); process.exit(1); }
  console.log("\nPROVA PREZZO X: tutto OK");
})();
