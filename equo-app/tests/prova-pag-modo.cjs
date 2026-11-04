// Prova del METODO DI PAGAMENTO sul «Saldato» (4/11/2026, Simone: solo un appunto per ricordarsi come hanno pagato):
// Incassi «Saldato» e «Tutto saldato» chiedono «Come ha pagato?» (Annulla = niente), registrano il resto come un pagamento
// con il metodo; senza importo resta il saldato di prima; riquadro del «Fatto» con «Saldato» mostra i metodi;
// il metodo si vede nell'elenco dei saldati e l'ultimo usato si ripropone.
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
  await pg.evaluate(async () => { currentUser.ruolo = "veterinario"; await enterApp("veterinario"); try{ localStorage.clear(); }catch(_){} }); await pg.waitForTimeout(3500);
  await pg.evaluate(() => { const oggi = isoLocale(new Date());
    demoState.clientiMascalcia.push({ id: "pm-c", nome: "Cliente Prova", tipo_cliente: "proprietario" });
    demoState.cavalliClientiMascalcia.push({ id: "pm-h1", nome: "Uno", cliente_mascalcia_id: "pm-c" }, { id: "pm-h2", nome: "Due", cliente_mascalcia_id: "pm-c" }, { id: "pm-h3", nome: "Tre", cliente_mascalcia_id: "pm-c" });
    const l = (id, h, imp, extra) => ({ id, cliente_mascalcia_id: "pm-c", cavallo_cliente_id: h, tipo_ferratura: "visita", data_intervento: oggi, stato: "fatto", stato_pagamento: "da_saldare", importo: imp, ...extra });
    demoState.interventiMascalcia.push(l("pm-1", "pm-h1", 80), l("pm-2", "pm-h2", 60), l("pm-3", "pm-h3", 40), l("pm-4", "pm-h3", null),
      l("pm-5", "pm-h1", 90, { stato: "programmato", data_intervento: isoLocale(new Date(Date.now() - 864e5)) })); });
  const attesa = ms => pg.waitForTimeout(ms);
  const lav = id => pg.evaluate(id => { const i = demoState.interventiMascalcia.find(x => x.id === id); const t = (demoState.tranche || []).filter(x => x.intervento_id === id);
    return { stato: i.stato, pag: i.stato_pagamento, tranche: t.map(x => x.modo + ":" + x.importo) }; }, id);
  await pg.evaluate(async () => { showPage("pro-incassi"); await renderIncassi(); }); await attesa(800);

  // «Saldato»: chiede come ha pagato; Annulla non cambia niente
  await pg.evaluate(() => { segnaSaldatoIncassi("pm-1", document.createElement("button")); return 1; }); await attesa(400);
  const foglio = await pg.evaluate(() => ({ aperto: document.getElementById("modal-pag-modo")?.classList.contains("active"), tit: document.getElementById("pag-modo-tit")?.textContent,
    sotto: document.querySelector(".pag-modo-sotto")?.textContent, bt: [...document.querySelectorAll(".pag-modo-bt b")].map(x => x.textContent), ult: document.querySelector(".pag-modo-bt.ult b")?.textContent }));
  ok(foglio.aperto && foglio.tit === "Come ha pagato?" && /Cliente Prova · Uno · € 80/.test(foglio.sotto || "") && foglio.bt.join(",") === "Contanti,Bonifico,POS,Assegno,Altro" && foglio.ult === "Contanti",
    "«Saldato» → «Come ha pagato?» " + JSON.stringify(foglio));
  await pg.evaluate(() => pagModoScegli(null)); await attesa(400);
  ok((await lav("pm-1")).pag === "da_saldare", "Annulla: resta da saldare");
  await pg.evaluate(() => { segnaSaldatoIncassi("pm-1", document.createElement("button")); return 1; }); await attesa(400);
  await pg.evaluate(() => pagModoScegli("bonifico")); await attesa(900);
  const s1 = await lav("pm-1");
  ok(s1.pag === "saldato" && s1.tranche.join() === "bonifico:80", "Bonifico: saldato con il pagamento registrato " + JSON.stringify(s1));
  const elenco = await pg.evaluate(() => document.getElementById("inc-elenco")?.textContent.replace(/\s+/g, " ") || "");
  ok(/Uno.*Bonifico/.test(elenco), "Elenco dei saldati: si vede il metodo");
  // l'ultimo usato si ripropone
  await pg.evaluate(() => { segnaSaldatoIncassi("pm-4", document.createElement("button")); return 1; }); await attesa(400);
  const ult = await pg.evaluate(() => document.querySelector(".pag-modo-bt.ult b")?.textContent);
  await pg.evaluate(() => pagModoScegli("contanti")); await attesa(900);
  const s4 = await lav("pm-4");
  ok(ult === "Bonifico" && s4.pag === "saldato" && !s4.tranche.length, "Ultimo usato riproposto; senza importo resta il saldato di prima " + JSON.stringify({ ult, s4 }));

  // «Tutto saldato»: un metodo per tutti
  await pg.evaluate(async () => { await renderIncassi(); incTuttoSaldato("pm-c", null); return 1; }); await attesa(400);
  const tt = await pg.evaluate(() => document.getElementById("pag-modo-tit")?.textContent);
  await pg.evaluate(() => pagModoScegli("pos")); await attesa(1200);
  const s2 = await lav("pm-2"), s3 = await lav("pm-3");
  ok(tt === "Tutto saldato · Cliente Prova" && s2.tranche.join() === "pos:60" && s3.tranche.join() === "pos:40" && s2.pag === "saldato" && s3.pag === "saldato", "«Tutto saldato»: POS per tutti " + JSON.stringify({ tt, s2, s3 }));

  // riquadro del «Fatto»: con «Saldato» compaiono i metodi
  await pg.evaluate(() => { segnaFatto(demoState.interventiMascalcia.find(x => x.id === "pm-5")); return 1; }); await attesa(1200);
  const r0 = await pg.evaluate(() => ({ riq: document.getElementById("eq-pop-richiamo")?.classList.contains("attivo"), modi: document.getElementById("ric-pag-modi")?.style.display }));
  await pg.evaluate(() => richiamoPagamento("saldato")); await attesa(200);
  const r1 = await pg.evaluate(() => ({ vis: document.getElementById("ric-pag-modi")?.style.display !== "none", chips: [...document.querySelectorAll("#ric-pag-modi .pag-chip")].map(x => x.textContent), on: document.querySelector("#ric-pag-modi .pag-chip.on")?.textContent }));
  await pg.evaluate(() => richiamoModo("assegno")); await attesa(150);
  await pg.evaluate(() => richiamoConferma()); await attesa(1500);
  const s5 = await lav("pm-5");
  ok(r0.riq && r0.modi === "none" && r1.vis && r1.chips.join(",") === "Contanti,Bonifico,POS,Assegno,Altro" && r1.on === "POS" && s5.stato === "fatto" && s5.pag === "saldato" && s5.tranche.join() === "assegno:90",
    "«Fatto» con «Saldato»: metodi (proposto l'ultimo), pagamento registrato " + JSON.stringify({ r0, r1, s5 }));

  ok(!err.length, "nessun errore JavaScript " + JSON.stringify(err));
  await b.close();
  if(problemi.length){ console.error("\nPROVA METODO DI PAGAMENTO: " + problemi.length + " problemi"); process.exit(1); }
  console.log("\nPROVA METODO DI PAGAMENTO: tutto OK");
})();
