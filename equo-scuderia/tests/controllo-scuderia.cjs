// Controllo automatico di Equo Scuderia (index.html) PRIMA di ogni deploy.
// Apre il gestionale in modalita demo su computer (1280x800) e su telefono (390x844) e controlla:
// Home visibile, menu laterale, ogni voce del menu apre la sua sezione con contenuto (o la finestra
// "passa a..." se la sezione non e nel pacchetto), nessun errore JavaScript.
// Uso: node tests/controllo-scuderia.cjs   (dalla cartella equo-scuderia)
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

const APP = path.resolve(__dirname, "..", "index.html");
function trovaSupabase(){
  if(process.env.SUPABASE_UMD) return process.env.SUPABASE_UMD;
  try{ return path.join(path.dirname(require.resolve("@supabase/supabase-js/package.json")), "dist", "umd", "supabase.js"); }
  catch(e){ return null; }
}
const SUPABASE = trovaSupabase();
const SCHERMI = [
  { nome: "computer", viewport: { width: 1280, height: 800 } },
  { nome: "telefono", viewport: { width: 390, height: 844 } },
];

(async () => {
  if(!SUPABASE || !fs.existsSync(SUPABASE)){ console.error("Manca la libreria supabase-js"); process.exit(1); }
  const browser = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const errori = [];
  for(const sc of SCHERMI){
    const ctx = await browser.newContext({ viewport: sc.viewport });
    const pg = await ctx.newPage();
    const jsErr = [];
    pg.on("pageerror", e => jsErr.push(String(e.message || e).slice(0, 200)));
    await pg.route("**/*", route => {
      const u = route.request().url();
      if(u.includes("supabase")) return route.fulfill({ path: SUPABASE, contentType: "application/javascript" });
      if(u.startsWith("file://") || u.startsWith("data:")) return route.continue();
      return route.abort();
    });
    const male = (msg) => errori.push(sc.nome + ": " + msg);
    try{
      await pg.goto("file://" + APP);
      await pg.waitForTimeout(1200);
      await pg.evaluate(() => startDemo());
      await pg.waitForTimeout(2500);
      const home = await pg.evaluate(() => { const e = document.getElementById("module-home"); if(!e) return null; const r = e.getBoundingClientRect(); return { disp: getComputedStyle(e).display, alto: Math.round(r.height), testo: e.innerText.trim().length }; });
      if(!home) male("sezione Home assente");
      else if(home.disp === "none" || home.alto < 150 || home.testo < 40) male("Home NON visibile (display=" + home.disp + " altezza=" + home.alto + " testo=" + home.testo + ")");

      const voci = await pg.evaluate(() => [...new Set([...document.querySelectorAll(".nav-item[data-module]")].map(b => b.dataset.module))]);
      if(voci.length < 6) male("menu laterale incompleto (" + voci.length + " voci)");
      for(const k of voci){
        await pg.evaluate(() => document.querySelectorAll(".modal-overlay.active, .modal.active").forEach(m => m.classList.remove("active")));
        await pg.evaluate((k) => showModule(k), k);
        await pg.waitForTimeout(900);
        const s = await pg.evaluate((k) => {
          const e = document.getElementById("module-" + k);
          const upsell = !!document.querySelector(".modal-overlay.active, .modal.active");
          return { vis: !!e && getComputedStyle(e).display !== "none", testo: e ? e.innerText.trim().length : 0, upsell };
        }, k);
        if(!s.vis && !s.upsell) male("la voce " + k + " non apre la sua sezione");
        else if(s.vis && s.testo < 20 && !s.upsell) male("sezione " + k + " vuota");
      }
      jsErr.forEach(e => male("errore JavaScript: " + e));
      console.log((errori.some(x => x.startsWith(sc.nome + ":")) ? "KO " : "OK ") + sc.nome + " · sezioni: " + voci.join(", "));
    } catch(e){ male("il controllo si e fermato: " + e.message); }
    await ctx.close();
  }
  await browser.close();
  if(errori.length){ console.error("\nCONTROLLO FALLITO:\n- " + errori.join("\n- ")); process.exit(1); }
  console.log("\nControllo superato: Equo Scuderia OK su computer e telefono.");
})();
