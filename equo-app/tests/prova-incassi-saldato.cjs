// Prova di INCASSI · DA INCASSARE (3/11/2026, segnalazione di un maniscalco): dopo «Saldato» la scuderia resta al suo posto;
// «Tutto saldato» segna in un colpo i lavori di un cliente o di una scuderia, dopo la conferma.
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
  await pg.evaluate(async () => { currentUser.ruolo = "maniscalco"; await enterApp("maniscalco"); }); await pg.waitForTimeout(3000);
  const attesa = ms => pg.waitForTimeout(ms);
  // dati di prova: lavori fatti e non pagati per tre clienti (uno con più cavalli, come una scuderia)
  await pg.evaluate(() => {
    const l = demoState.interventiMascalcia, cli = [...new Set(l.map(i => i.cliente_mascalcia_id).filter(Boolean))].slice(0, 3);
    const base = l.find(i => i.cliente_mascalcia_id === cli[0]) || l[0];
    const giorno = n => isoLocale(new Date(Date.now() - n * 864e5));
    [[cli[0], 6, 40], [cli[1], 2, 90], [cli[2], 1, 60]].forEach(([c, quanti, prezzo], j) => { for(let k = 0; k < quanti; k++)
      l.push({ ...base, id: "pv-" + j + "-" + k, cliente_mascalcia_id: c, clienti_mascalcia: (l.find(i => i.cliente_mascalcia_id === c) || base).clienti_mascalcia,
        stato: "fatto", stato_pagamento: "da_saldare", saldato_il: null, importo: prezzo, data_intervento: giorno(10 + k), tipo_ferratura: "ferratura" }); });
  });
  await pg.evaluate(async () => { showPage("pro-incassi"); await renderIncassi(); if(document.getElementById("inc-det-dasaldare").hidden) incApri("dasaldare"); }); await attesa(800);
  const stato = () => pg.evaluate(() => [...document.querySelectorAll("#incassi-da-saldare-list .inc-gruppo")].map(g => ({ id: g.dataset.cli, nome: g.firstElementChild.textContent,
    tot: g.querySelector("span:last-child").firstChild?.textContent?.trim(), tutto: g.nextElementSibling?.classList.contains("inc-gruppo-az") ? g.nextElementSibling.textContent.trim() : null })));
  const g0 = await stato();
  ok(g0.length >= 2, "Da incassare: almeno due clienti " + JSON.stringify(g0));
  // il primo gruppo con più lavori: si salda un lavoro alla volta finché scenderebbe sotto il secondo
  const primo = g0[0];
  const n = await pg.evaluate(id => (incTutti || []).filter(i => i.stato === "fatto" && i.stato_pagamento !== "saldato" && String(i.cliente_mascalcia_id || "?") === id).length, primo.id);
  for(let k = 0; k < Math.min(n - 1, 4); k++){
    await pg.evaluate(id => { const g = [...document.querySelectorAll("#incassi-da-saldare-list .inc-gruppo")].find(x => x.dataset.cli === id);
      let el = g.nextElementSibling; while(el && !el.classList.contains("inc-voce")) el = el.nextElementSibling; el.querySelector(".inc-saldato").click(); }, primo.id);
    await attesa(300); await pg.evaluate(() => pagModoScegli("contanti"));   // 4/11/2026: «Come ha pagato?»
    await attesa(500);
  }
  const g1 = await stato();
  ok(g1[0].id === primo.id && g1.map(g => g.id).join() === g0.filter(g => g1.some(x => x.id === g.id)).map(g => g.id).join(), "Dopo «Saldato» le scuderie restano nello stesso ordine " + JSON.stringify({ prima: g0.map(g => g.nome + " " + g.tot), dopo: g1.map(g => g.nome + " " + g.tot) }));
  // «Tutto saldato» sul secondo gruppo con più lavori
  const conPiu = g1.find(g => g.tutto);
  ok(!!conPiu && /^Tutto saldato · \d+ lavori$/.test(conPiu.tutto), "Tasto «Tutto saldato · N lavori» sotto il cliente " + JSON.stringify(conPiu));
  if(conPiu){
    // prima «No»: non cambia niente
    await pg.evaluate(id => { document.querySelector(`#incassi-da-saldare-list .inc-gruppo[data-cli="${id}"] + .inc-gruppo-az .inc-tutto`).click(); }, conPiu.id); await attesa(300);
    const domanda = await pg.evaluate(() => document.getElementById("modal-pag-modo")?.textContent.replace(/\s+/g, " ").trim());
    await pg.evaluate(() => pagModoScegli(null)); await attesa(500);
    const ancora = (await stato()).some(g => g.id === conPiu.id);
    await pg.evaluate(id => { document.querySelector(`#incassi-da-saldare-list .inc-gruppo[data-cli="${id}"] + .inc-gruppo-az .inc-tutto`).click(); }, conPiu.id); await attesa(300);
    await pg.evaluate(() => pagModoScegli("pos")); await attesa(900);
    const g2 = await stato();
    const rimasti = await pg.evaluate(id => (incTutti || []).filter(i => i.stato === "fatto" && i.stato_pagamento !== "saldato" && String(i.cliente_mascalcia_id || "?") === id).length, conPiu.id);
    ok(/Tutto saldato · .*Come ha pagato\?/.test(domanda || "") && ancora && !g2.some(g => g.id === conPiu.id) && rimasti === 0
      && g2.map(g => g.id).join() === g1.filter(g => g.id !== conPiu.id).map(g => g.id).join(), "«Tutto saldato»: chiede come ha pagato, con Annulla non cambia, con POS il cliente esce da Da incassare e gli altri restano in ordine " + JSON.stringify({ domanda, g2: g2.map(g => g.nome) }));
  }
  // riaprendo la pagina si riordina per importo
  await pg.evaluate(async () => { await renderIncassi(); }); await attesa(500);
  const g3 = await stato();
  const tot = s => Number(String(s.tot || "0").replace(/[^\d,]/g, "").replace(",", "."));
  ok(g3.every((g, i) => i === 0 || tot(g3[i - 1]) >= tot(g)), "Riaprendo, ordine per importo " + JSON.stringify(g3.map(g => g.nome + " " + g.tot)));
  ok(!err.length, "nessun errore JavaScript " + JSON.stringify(err));
  await b.close();
  if(problemi.length){ console.error("\nPROVA INCASSI SALDATO: " + problemi.length + " problemi"); process.exit(1); }
  console.log("\nPROVA INCASSI SALDATO: tutto OK");
})();
