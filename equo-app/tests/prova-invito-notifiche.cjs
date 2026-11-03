// Prova dell'INVITO AD ATTIVARE LE NOTIFICHE per i professionisti (3/11/2026): riquadro in cima a Home e Messaggi
// finché il permesso non c'è; «Attiva» chiede il permesso (tocco vero, come vuole iPhone); «Più tardi» lo nasconde; mai per il proprietario.
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
  const attesa = ms => pg.waitForTimeout(ms);
  const c = sel => pg.evaluate(s => document.querySelectorAll(s).length, sel);
  // in demo niente invito
  await pg.evaluate(() => showPage("pro-home")); await attesa(200);
  ok(await c("#page-pro-home > .push-invito") === 0, "Demo: nessun invito");
  // account vero, telefono che supporta le notifiche, permesso non dato
  await pg.evaluate(() => { try{ localStorage.removeItem("equo-push-invito"); }catch(_){}
    DEMO_MODE = false; window.OneSignal = { Notifications: { permission: false, isPushSupported: () => true, requestPermission: async () => { OneSignal.Notifications.permission = true; } } }; });
  await pg.evaluate(() => showPage("pro-home")); await attesa(200);
  const t = await pg.evaluate(() => document.querySelector("#page-pro-home > .push-invito")?.textContent.replace(/\s+/g, " ").trim());
  await pg.evaluate(() => showPage("pro-inbox")); await attesa(200);
  const inbox = await c("#page-pro-inbox > .push-invito");
  ok(/^Attiva le notifiche ?Ti arrivano i messaggi dei clienti e gli avvisi di Galeno, anche a telefono chiuso\. ?Attiva ?Più tardi$/.test(t || "") && inbox === 1, "Veterinario: invito in Home e in Messaggi " + JSON.stringify(t));
  // «Più tardi»: sparisce da tutte e due
  await pg.evaluate(() => document.querySelector("#page-pro-inbox > .push-invito .pi-no").click()); await attesa(200);
  await pg.evaluate(() => showPage("pro-home")); await attesa(200);
  ok(await c(".push-invito") === 0, "«Più tardi»: l'invito sparisce");
  // di nuovo (dopo i 3 giorni): «Attiva» → permesso → sparisce
  await pg.evaluate(() => { localStorage.setItem("equo-push-invito", String(Date.now() - 4 * 86400000)); showPage("pro-home"); }); await attesa(200);
  const prima = await c("#page-pro-home > .push-invito");
  await pg.click("#page-pro-home > .push-invito .pi-si"); await attesa(400);
  ok(prima === 1 && await c(".push-invito") === 0 && await pg.evaluate(() => OneSignal.Notifications.permission === true), "«Attiva»: chiede il permesso e l'invito sparisce");
  // telefono senza supporto (iPhone senza app installata): niente invito
  await pg.evaluate(() => { OneSignal.Notifications.permission = false; OneSignal.Notifications.isPushSupported = () => false; showPage("pro-home"); }); await attesa(200);
  ok(await c(".push-invito") === 0, "Notifiche non supportate: nessun invito");
  // proprietario: mai
  await pg.evaluate(() => { OneSignal.Notifications.isPushSupported = () => true; currentUser.vistaAttiva = "proprietario"; currentUser.ruolo = "proprietario"; showPage("pro-home"); }); await attesa(200);
  ok(await c(".push-invito") === 0, "Proprietario: nessun invito (ha il suo nella chat)");
  await pg.evaluate(() => { DEMO_MODE = true; });
  ok(!err.length, "nessun errore JavaScript " + JSON.stringify(err));
  await b.close();
  if(problemi.length){ console.error("\nPROVA INVITO NOTIFICHE: " + problemi.length + " problemi"); process.exit(1); }
  console.log("\nPROVA INVITO NOTIFICHE: tutto OK");
})();
