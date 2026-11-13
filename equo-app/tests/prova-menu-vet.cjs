// Prova del MENU IN BASSO del veterinario (14/11/2026, Simone: «non si capisce su che pagina sono»):
// la voce attiva è una pillola Tiffany con icona e scritta blu notte; le pagine aperte dalla Home (Incassi…) accendono «Home».
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
  await pg.evaluate(async () => { currentUser.ruolo = "veterinario"; await enterApp("veterinario"); }); await pg.waitForTimeout(3000);
  const stato = () => pg.evaluate(() => [...document.querySelectorAll("#bottom-nav-pro .nav-btn[data-page]")].filter(x => x.classList.contains("active"))
    .map(x => ({ p: x.dataset.page, bg: getComputedStyle(x).backgroundColor, c: getComputedStyle(x).color })));
  for(const [pagina, attesa] of [["pro-home", "pro-home"], ["pro-agenda", "pro-agenda"], ["pro-clienti", "pro-clienti"], ["pro-incassi", "pro-home"]]){
    await pg.evaluate(p => showPage(p), pagina); await pg.waitForTimeout(400);
    const s = await stato();
    ok(s.length === 1 && s[0].p === attesa && s[0].bg === "rgb(127, 209, 201)" && s[0].c === "rgb(29, 45, 80)", `${pagina}: accesa «${attesa}», pillola Tiffany e blu notte ` + JSON.stringify(s));
  }
  // il maniscalco non cambia
  await pg.evaluate(async () => { currentUser.ruolo = "maniscalco"; await enterApp("maniscalco"); }); await pg.waitForTimeout(2500);
  await pg.evaluate(() => showPage("pro-agenda")); await pg.waitForTimeout(300);
  const man = await stato();
  ok(!man.some(x => x.bg === "rgb(127, 209, 201)"), "Maniscalco: menu come prima " + JSON.stringify(man));
  ok(!err.length, "nessun errore JavaScript " + JSON.stringify(err));
  await b.close();
  if(problemi.length){ console.error("\nPROVA MENU VET: " + problemi.length + " problemi"); process.exit(1); }
  console.log("\nPROVA MENU VET: tutto OK");
})();
