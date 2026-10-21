// Controllo automatico dell'app Equo (index.html) PRIMA di ogni deploy.
// Apre l'app in modalita demo come proprietario, maniscalco, istruttore e veterinario
// (telefono 390x844) e controlla: Home visibile, barra in basso, tasto "+", ogni pagina della barra,
// nessun errore JavaScript. Se qualcosa non va esce con codice 1 e Netlify NON pubblica.
// Uso: node tests/controllo-app.cjs   (dalla cartella equo-app)
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

const RUOLI = [
  { ruolo: "proprietario", home: "#page-home" },
  { ruolo: "maniscalco", home: "#hm" },
  { ruolo: "istruttore", home: "#tr-home" },
  { ruolo: "veterinario", home: "#page-pro-home" },
];
const SENZA_PIU = ["pro-inbox", "chat"]; // pagine dove il "+" e nascosto apposta

(async () => {
  if(!SUPABASE || !fs.existsSync(SUPABASE)){ console.error("Manca la libreria supabase-js (npm install)"); process.exit(1); }
  const browser = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const errori = [];
  for(const { ruolo, home } of RUOLI){
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pg = await ctx.newPage();
    const jsErr = [];
    pg.on("pageerror", e => jsErr.push(String(e.message || e).slice(0, 200)));
    await pg.route("**/*", route => {
      const u = route.request().url();
      if(u.includes("supabase-js")) return route.fulfill({ path: SUPABASE, contentType: "application/javascript" });
      if(u.startsWith("file://") || u.startsWith("data:")) return route.continue();
      return route.abort();
    });
    const male = (msg) => errori.push(ruolo + ": " + msg);
    try{
      await pg.goto("file://" + APP);
      await pg.waitForTimeout(1200);
      await pg.evaluate(() => startDemo());
      await pg.waitForTimeout(600);
      await pg.evaluate(async (r) => { currentUser.ruolo = r; await enterApp(r); }, ruolo);
      await pg.waitForTimeout(3500);

      const h = await pg.evaluate((sel) => {
        const el = document.querySelector(sel); if(!el) return null;
        const r = el.getBoundingClientRect();
        return { disp: getComputedStyle(el).display, alto: Math.round(r.height), testo: el.innerText.trim().length };
      }, home);
      if(!h) male("Home assente (" + home + ")");
      else if(h.disp === "none" || h.alto < 150 || h.testo < 40) male("Home NON visibile (" + home + " display=" + h.disp + " altezza=" + h.alto + " testo=" + h.testo + ")");

      const piu = async () => pg.evaluate(() => { const e = document.getElementById("hm-piu"); return !!e && getComputedStyle(e).display !== "none"; });
      if(!(await piu())) male("tasto + non visibile in Home");

      const pagine = await pg.evaluate(() => {
        const navs = [...document.querySelectorAll(".bottom-nav")].filter(n => getComputedStyle(n).display !== "none" && n.getBoundingClientRect().height > 0);
        const nav = navs[0]; if(!nav) return null;
        return [...nav.querySelectorAll(".nav-btn[data-page]")].map(b => b.dataset.page);
      });
      if(!pagine || pagine.length < 3) male("barra in basso assente o incompleta");
      for(const p of (pagine || [])){
        await pg.evaluate((p) => { const b = [...document.querySelectorAll(".bottom-nav .nav-btn[data-page='" + p + "']")].find(x => x.getBoundingClientRect().height > 0); if(b) b.click(); else showPage(p); }, p);
        await pg.waitForTimeout(1600);
        const s = await pg.evaluate(() => { const a = document.querySelector(".page-content.active"); return a ? { id: a.id, testo: a.innerText.trim().length, alto: Math.round(a.getBoundingClientRect().height) } : null; });
        if(!s || s.id !== "page-" + p) male("la barra non apre " + p + " (aperta: " + (s && s.id) + ")");
        else if(s.testo < 20) male("pagina " + p + " vuota");
        if(!SENZA_PIU.includes(p) && !(await piu())) male("tasto + sparito dopo 1,6 s in " + p);
      }
      jsErr.forEach(e => male("errore JavaScript: " + e));
      console.log((errori.some(x => x.startsWith(ruolo + ":")) ? "KO " : "OK ") + ruolo + " · pagine: " + (pagine || []).join(", "));
    } catch(e){ male("il controllo si e fermato: " + e.message); }
    await ctx.close();
  }
  await browser.close();
  if(errori.length){
    console.error("\nCONTROLLO FALLITO, il deploy viene bloccato:\n- " + errori.join("\n- "));
    process.exit(1);
  }
  console.log("\nControllo superato: 4 ruoli OK.");
})();
