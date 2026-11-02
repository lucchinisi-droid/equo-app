// Prova delle ICONE del veterinario (2/11/2026): stetoscopio al posto del martello nella finestra Sì/No e nelle icone fa-hammer;
// il maniscalco tiene il martello. Alla fine, nessun martello visibile nelle pagine del veterinario.
const path = require("path"); const { chromium } = require("playwright");
const APP = path.resolve(__dirname, "..", "index.html");
const SUPA = process.env.SUPABASE_UMD || path.join(path.dirname(require.resolve("@supabase/supabase-js/package.json")), "dist", "umd", "supabase.js");
const problemi = []; const ok = (c, m) => { console.log((c ? "OK  " : "NO  ") + m); if(!c) problemi.push(m); };
async function prova(b, ruolo){
  const pg = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const err = []; pg.on("pageerror", e => err.push(String(e.message)));
  await pg.route("**/*", r => { const u = r.request().url(); if(u.includes("supabase-js")) return r.fulfill({ path: SUPA, contentType: "application/javascript" });
    if(u.startsWith("file://") || u.startsWith("data:")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + APP); await pg.waitForTimeout(1200);
  await pg.evaluate(() => startDemo()); await pg.waitForTimeout(600);
  await pg.evaluate(async r => { currentUser.ruolo = r; await enterApp(r); }, ruolo); await pg.waitForTimeout(3000);
  pg.evaluate(() => chiediSiNo("Già fatto oggi?", "prova")); await pg.waitForTimeout(300);
  const ic = await pg.evaluate(() => getComputedStyle(document.getElementById("sino-ic"), "::before").content);
  await pg.evaluate(() => rispondiSiNo(false));
  // martelli visibili nelle pagine principali
  const visibili = [];
  for(const p of ["pro-home", "pro-agenda", "pro-inbox", "pro-clienti"]){
    await pg.evaluate(p => showPage(p), p); await pg.waitForTimeout(900);
    visibili.push(...await pg.evaluate(() => [...document.querySelectorAll(".fa-hammer")].filter(e => e.offsetWidth && getComputedStyle(e, "::before").content !== '"\uf0f1"').map(e => (e.closest("[id]") || {}).id)
      .concat([...document.querySelectorAll("svg path")].filter(x => /^m15 12-8\.373/.test(x.getAttribute("d") || "") && x.closest("svg").getClientRects().length).map(x => (x.closest("[id]") || {}).id))));
  }
  await pg.context().close();
  return { ic, visibili, err };
}
(async () => {
  const b = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const v = await prova(b, "veterinario"), m = await prova(b, "maniscalco");
  ok(v.ic === '"\uf0f1"', "Veterinario: stetoscopio nella finestra Sì/No " + JSON.stringify(v.ic));
  ok(!v.visibili.length, "Veterinario: nessun martello visibile nelle pagine " + JSON.stringify(v.visibili));
  ok(m.ic !== '"\uf0f1"', "Maniscalco: nessuno stetoscopio al posto del martello (Font Awesome non si scarica nelle prove) " + JSON.stringify(m.ic));
  ok(!v.err.length && !m.err.length, "nessun errore JavaScript " + JSON.stringify([v.err, m.err]));
  await b.close();
  if(problemi.length){ console.error("\nPROVA ICONE VET: " + problemi.length + " problemi"); process.exit(1); }
  console.log("\nPROVA ICONE VET: tutto OK");
})();
