// Prova della HOME DEL VETERINARIO (2/11/2026, mockup approvato da Simone) e di Galeno:
// Prossime visite prima delle righe Cavalli · Clienti · Scuderie · Incassi (icone della Home del maniscalco), «Segnalaci» con il ticket,
// «Detta» (Home e +) senza mai «Galeno presto disponibile», Galeno nella barra apre la chat.
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
  await pg.evaluate(async () => { currentUser.ruolo = "veterinario"; await enterApp("veterinario"); }); await pg.waitForTimeout(3500);
  const attesa = ms => pg.waitForTimeout(ms);
  const toast = async fn => pg.evaluate(async f => { let m = ""; const t = window.showToast; window.showToast = x => { m += x + "|"; }; try{ await window[f](); }finally{ window.showToast = t; } return m; }, fn);

  await pg.evaluate(() => { showPage("pro-home"); renderHomeVet(); }); await attesa(800);
  const h = await pg.evaluate(() => { const box = document.getElementById("vh"); const kids = [...box.children].map(x => x.className.split(" ")[0]);
    return { ordine: kids, righe: [...box.querySelectorAll(".vh-righe .hm-riga .tx b")].map(x => x.textContent), sotto: [...box.querySelectorAll(".vh-righe .hm-riga .tx span")].map(x => x.textContent),
      icone: [...box.querySelectorAll(".vh-righe .hm-riga .ic svg")].length, emoji: /[\u{1F300}-\u{1FAFF}]/u.test(box.querySelector(".vh-righe").textContent),
      aiuto: box.querySelector(".vh-aiuto b")?.textContent, bt: box.querySelector(".vh-aiuto-bt")?.textContent }; });
  const iTit = h.ordine.indexOf("vh-tit"), iRighe = h.ordine.indexOf("hm-righe"), iAiuto = h.ordine.indexOf("vh-aiuto");
  ok(iTit >= 0 && iRighe > iTit && iAiuto > iRighe && h.righe.join("|") === "Cavalli|Clienti|Scuderie|Incassi" && h.icone === 4 && !h.emoji
    && /cavall/.test(h.sotto[0]) && /propriet/.test(h.sotto[1]) && /scuder/.test(h.sotto[2]) && h.aiuto === "Segnalaci un problema o un consiglio" && h.bt === "Scrivici",
    "Home: Prossime visite, poi Cavalli · Clienti · Scuderie · Incassi con le icone della Home, poi Segnalaci " + JSON.stringify(h));

  // righe: Cavalli → elenco dei cavalli; Scuderie → filtro scuderie
  await pg.evaluate(() => vhVai("cavalli")); await attesa(700);
  const cav = await pg.evaluate(() => ({ pagina: document.querySelector(".page-content.active")?.id, tab: document.querySelector("#cli-cartelle button.on")?.textContent, righe: document.querySelectorAll("#clienti-list .vt-cli").length, primo: document.querySelector("#clienti-list .vt-cli b")?.textContent }));
  await pg.evaluate(() => document.querySelector("#clienti-list .vt-cli").click()); await attesa(1200);
  const scheda = await pg.evaluate(() => [...document.querySelectorAll("#cavpro-tab button")].map(x => x.textContent).join("|"));
  ok(cav.pagina === "page-pro-clienti" && cav.tab === "Cavalli" && cav.righe >= 3 && scheda === "Tutto|Anagrafica|Clinica|Storico|Documenti", "Riga Cavalli: elenco dei cavalli, si apre la scheda " + JSON.stringify({ cav, scheda }));
  await pg.evaluate(() => { try{ chiudiSchedaCavalloPro(); }catch(_){} vhVai("scuderie"); }); await attesa(500);
  ok(await pg.evaluate(() => document.querySelector("#cli-cartelle button.on")?.textContent) === "Scuderie", "Riga Scuderie: filtro Scuderie");
  await pg.evaluate(() => vetFiltroClienti("tutti"));

  // Segnalaci: il ticket dell'assistenza
  await pg.evaluate(() => { showPage("pro-home"); renderHomeVet(); }); await attesa(400);
  await pg.evaluate(() => document.querySelector(".vh-aiuto-bt").click()); await attesa(300);
  ok(await pg.evaluate(() => document.getElementById("tk-form")?.style.display === "block" && !!document.getElementById("tk-categoria").querySelector('option[value="suggerimento"]')), "Segnalaci: si apre il ticket (problema o suggerimento)");
  await pg.evaluate(() => { try{ closeModal("modal-ticket"); }catch(_){} document.querySelectorAll(".modal-overlay.active").forEach(m => m.classList.remove("active")); });

  // Galeno nella barra: si apre la chat, niente «presto disponibile»
  const tg = await toast("openAiSheet"); await attesa(500);
  const chat = await pg.evaluate(() => ({ aperta: document.getElementById("ai-sheet-overlay")?.classList.contains("active"), testata: (document.getElementById("ai-sheet-overlay")?.textContent || "").includes("Galeno") }));
  ok(!/presto disponibile/.test(tg) && chat.aperta && chat.testata, "Galeno nella barra apre la chat " + JSON.stringify({ tg, chat }));
  await pg.evaluate(() => { try{ closeAiSheet(); }catch(_){} });

  // «Detta» senza visite recenti (Home e +): spiegazione e «Nuovo appuntamento», mai Galeno
  await pg.evaluate(() => { const o = isoLocale(new Date(Date.now() - 30 * 864e5)); demoState.interventiMascalcia.forEach(e => { e.data_intervento = o; }); hpAppuntamenti = []; });
  const td = await toast("vhDetta"); await attesa(400);
  const vuoto = await pg.evaluate(() => ({ aperto: document.getElementById("dt-foglio")?.classList.contains("aperto"), testo: document.querySelector("#dt-corpo .dt-aiuto")?.textContent || "", bt: document.querySelector("#dt-corpo .dt-vuoto-az")?.textContent }));
  await pg.evaluate(() => dtChiudi());
  await pg.evaluate(() => plCostruisciMenu());
  const tp = await pg.evaluate(async () => { let m = ""; const t = window.showToast; window.showToast = x => { m += x; }; [...document.querySelectorAll("#hm-menu-piu .pl-detta")][0]?.click(); await new Promise(r => setTimeout(r, 400)); window.showToast = t;
    return { m, aperto: document.getElementById("dt-foglio")?.classList.contains("aperto") }; });
  ok(!/Galeno/.test(td + tp.m) && vuoto.aperto && /serve una visita/.test(vuoto.testo) && vuoto.bt === "Nuovo appuntamento" && tp.aperto, "«Detta» senza visite: spiegazione e Nuovo appuntamento (Home e +) " + JSON.stringify({ td, vuoto, tp }));
  ok(!err.length, "nessun errore JavaScript " + JSON.stringify(err));
  await b.close();
  if(problemi.length){ console.error("\nPROVA HOME VET: " + problemi.length + " problemi"); process.exit(1); }
  console.log("\nPROVA HOME VET: tutto OK");
})();
