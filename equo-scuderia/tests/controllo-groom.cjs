// Controllo automatico dell'app Equo Groom (groom.html) in modalita demo (?demo=1), su telefono 390x844:
// la schermata si riempie, menu e lingue si aprono, il primo pulsante di attivita risponde, nessun errore JavaScript.
// Uso: node tests/controllo-groom.cjs   (dalla cartella equo-scuderia)
const path = require("path");
const { chromium } = require("playwright");
const APP = path.resolve(__dirname, "..", "groom.html");
(async () => {
  const browser = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pg = await ctx.newPage();
  const errori = [];
  pg.on("pageerror", e => errori.push("errore JavaScript: " + String(e.message || e).slice(0, 200)));
  await pg.route("**/*", r => { const u = r.request().url(); return (u.startsWith("file://") || u.startsWith("data:")) ? r.continue() : r.abort(); });
  try{
    await pg.goto("file://" + APP + "?demo=1");
    await pg.waitForTimeout(2000);
    const testo = await pg.evaluate(() => document.body.innerText.trim().length);
    if(testo < 80) errori.push("schermata vuota (" + testo + " caratteri)");
    for(const f of ["apriMenu", "chiudiFoglio", "apriLingue", "chiudiFoglio"]){
      const ok = await pg.evaluate((f) => { if(typeof window[f] !== "function") return false; window[f](); return true; }, f);
      if(!ok) errori.push("funzione " + f + " assente");
      await pg.waitForTimeout(400);
    }
    const premuto = await pg.evaluate(() => { const b = document.querySelector("main button, #app button, .box button, button[onclick]"); if(!b) return false; b.click(); return true; });
    if(!premuto) errori.push("nessun pulsante di attivita trovato");
    await pg.waitForTimeout(800);
  } catch(e){ errori.push("il controllo si e fermato: " + e.message); }
  await browser.close();
  if(errori.length){ console.error("CONTROLLO GROOM FALLITO:\n- " + errori.join("\n- ")); process.exit(1); }
  console.log("Controllo superato: Equo Groom OK.");
})();
