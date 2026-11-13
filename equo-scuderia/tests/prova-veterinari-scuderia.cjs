// Prova di Equo Scuderia · VETERINARI (11/11/2026, Fase 4, SQL 67):
// Professionisti › Veterinari senza «COMING SOON», elenco dei veterinari (collegato / chiede di collegarsi), «Aggiungi veterinario»
// con il codice EQUOMED, limite del pacchetto unico «Professionisti collegati: N di M», «Visite» al posto di «Appuntamenti»;
// scheda del cavallo con «Visite del veterinario»: solo data, tipo e veterinario.
// Uso: node tests/prova-veterinari-scuderia.cjs (dalla cartella equo-scuderia)
const path = require("path"); const { chromium } = require("playwright");
const APP = path.resolve(__dirname, "..", "index.html");
const SUPA = process.env.SUPABASE_UMD || path.join(path.dirname(require.resolve("@supabase/supabase-js/package.json")), "dist", "umd", "supabase.js");
const problemi = []; const ok = (c, m) => { console.log((c ? "OK  " : "NO  ") + m); if(!c) problemi.push(m); };
(async () => {
  const b = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const pg = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const err = []; pg.on("pageerror", e => err.push(String(e.message)));
  await pg.route("**/*", r => { const u = r.request().url(); if(u.includes("supabase")) return r.fulfill({ path: SUPA, contentType: "application/javascript" });
    if(u.startsWith("file://") || u.startsWith("data:")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + APP); await pg.waitForTimeout(1200);
  await pg.evaluate(() => startDemo()); await pg.waitForTimeout(2500);
  const attesa = ms => pg.waitForTimeout(ms);

  await pg.evaluate(() => showModule("professionisti")); await attesa(900);
  await pg.evaluate(() => selezionaTabPro("veterinari")); await attesa(300);
  const v = await pg.evaluate(() => ({ tab: document.querySelector('.pro-tab[data-pro-tab="veterinari"]')?.textContent.trim(), btn: document.getElementById("btn-aggiungi-pro")?.textContent.trim(),
    btnVis: document.getElementById("btn-aggiungi-pro")?.style.display !== "none", righe: [...document.querySelectorAll("#pro-veterinari-list .msg-item")].map(r => r.textContent.replace(/\s+/g, " ").trim()),
    lim: document.querySelector("#pro-tab-veterinari .pro-limite")?.textContent.replace(/\s+/g, " ").trim(), mani: document.querySelectorAll("#pro-maniscalchi-list .msg-item").length }));
  ok(v.tab === "Veterinari" && v.btn === "Aggiungi veterinario" && v.btnVis, "Tab Veterinari attivo con «Aggiungi veterinario» " + JSON.stringify({ tab: v.tab, btn: v.btn }));
  ok(v.righe.length === 2 && /Bolaffio.*Chiede di collegarsi/.test(v.righe.join("|")) && /Mastrovalerio.*Veterinario · Collegato.*2 cavalli seguiti.*Visite/.test(v.righe.join("|")) && v.mani === 1,
    "Elenco veterinari: richiesta da accettare e collegato con i cavalli seguiti e «Visite» " + JSON.stringify(v.righe));
  ok(/Professionisti collegati: 3 di 5/.test(v.lim || "") && /maniscalchi e veterinari insieme/.test(v.lim || ""), "Limite unico del pacchetto " + JSON.stringify(v.lim));
  await pg.evaluate(() => apriAggiungiProfessionista()); await attesa(300);
  const m = await pg.evaluate(() => ({ tit: document.getElementById("pro-aggiungi-titolo")?.textContent, lab: document.getElementById("pro-codice-label")?.textContent, ph: document.getElementById("pro-codice-input")?.placeholder }));
  ok(m.tit === "Aggiungi veterinario" && /veterinario/.test(m.lab) && /EQUOMED/.test(m.ph), "Finestra «Aggiungi veterinario» con il codice EQUOMED " + JSON.stringify(m));
  await pg.evaluate(() => closeModal("modal-aggiungi-pro"));
  await pg.evaluate(() => selezionaTabPro("maniscalchi")); await attesa(200);
  const mb = await pg.evaluate(() => document.getElementById("btn-aggiungi-pro")?.textContent.trim());
  ok(mb === "Aggiungi maniscalco", "Tab Maniscalchi: «Aggiungi maniscalco»");

  // scheda del cavallo: visite del veterinario (solo data, tipo, veterinario)
  await pg.evaluate(() => showModule("cavalli")); await attesa(900);
  const vv = await pg.evaluate(async () => { const c = (demoState.cavalli || [])[0]; if(!c) return null; openCavalloDetail(c.id); await new Promise(r => setTimeout(r, 500));
    const box = document.getElementById("cav-visite-vet-box"); return { t: box?.textContent.replace(/\s+/g, " ") || "", righe: box?.querySelectorAll(".vv-riga").length }; });
  ok(vv && vv.righe === 3 && /Visite del veterinario/.test(vv.t) && /diagnosi e referti li vede solo il proprietario/.test(vv.t) && /Vaccino · influenza-tetano/.test(vv.t) && /Dott.ssa Laura Bolaffio/.test(vv.t) && /fissata/.test(vv.t),
    "Scheda del cavallo: «Visite del veterinario» con data, tipo e veterinario " + JSON.stringify(vv));

  ok(!err.length, "nessun errore JavaScript " + JSON.stringify(err));
  await b.close();
  if(problemi.length){ console.error("\nPROVA VETERINARI SCUDERIA: " + problemi.length + " problemi"); process.exit(1); }
  console.log("\nPROVA VETERINARI SCUDERIA: tutto OK");
})();
