// Prova della FASE 4 del veterinario (11/11/2026, SQL 67, mockup «Fase 4»):
//  · referto: «Condividi il referto col proprietario» (acceso di serie); spento → la proprietaria non lo riceve, il file resta solo dell'autore,
//    la scelta resta sulla visita; chiusura della visita aperta: cavallo per cavallo («Referto ✓» / «Solo data e tipo»);
//  · veterinario ↔ maniscalco: «Manda al maniscalco» dalla scheda del cavallo, chat tra colleghi con la scheda, avviso al proprietario,
//    chi la riceve «Aggiungi ai miei cavalli» (le indicazioni restano nel riquadro «Colleghi»); per il maniscalco «Manda al veterinario»;
//  · il veterinario vede «Collega scuderia» in Clienti › Scuderie e «Collega a Equo Scuderia» nella scheda della scuderia.
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
  await pg.evaluate(() => {
    class FintoPdf { constructor(){ this.t = []; } text(x){ this.t.push([].concat(x).join(" ")); } splitTextToSize(s){ return [String(s)]; } output(){ return new Blob([this.t.join("\n")], { type: "application/pdf" }); } }
    ["setFillColor", "rect", "setTextColor", "setFont", "setFontSize", "setDrawColor", "setLineWidth", "line", "addPage"].forEach(m => { FintoPdf.prototype[m] = function(){}; });
    window.caricaJsPdf = async () => FintoPdf;
  });
  const attesa = ms => pg.waitForTimeout(ms);

  /* ---------- 1. referto: interruttore per il proprietario ---------- */
  await pg.evaluate(() => vsApriDaEvento("vi-2")); await attesa(500);
  await pg.evaluate(() => vsNuova("standard")); await attesa(200);
  await pg.fill("#vs-f-diagnosi", "Sospetto ascesso subsolare ASx");
  await attesa(900);
  await pg.evaluate(() => vrApri()); await attesa(500);
  const r0 = await pg.evaluate(() => ({ cond: !!document.getElementById("vr-cond"), on: document.querySelector("#vr-cond input")?.checked, testo: document.querySelector("#vr-cond")?.textContent.replace(/\s+/g, " "),
    prop: document.getElementById("vr-dest-0")?.checked }));
  ok(r0.cond && r0.on && /Condividi il referto col proprietario/.test(r0.testo) && r0.prop, "Referto: interruttore acceso di serie, proprietaria spuntata " + JSON.stringify(r0));
  await pg.evaluate(() => { const c = document.querySelector("#vr-cond input"); c.checked = false; c.dispatchEvent(new Event("change")); }); await attesa(200);
  const r1 = await pg.evaluate(() => ({ prop: document.getElementById("vr-dest-0")?.checked, dis: document.getElementById("vr-dest-0")?.disabled, testo: document.querySelector("#vr-cond small")?.textContent }));
  ok(r1.prop === false && r1.dis && /solo data e tipo/.test(r1.testo), "Spento: proprietaria tolta e bloccata, «solo data e tipo» " + JSON.stringify(r1));
  await pg.evaluate(() => vrInvia()); await attesa(900);
  const r2 = await pg.evaluate(() => { const d = (demoState.documenti || []).slice(-1)[0]; const msg = (demoState.messaggiMascalcia || []).filter(x => x.tipo === "documento" && String(x.file_url).startsWith("equo-doc:"));
    const i = demoState.interventiMascalcia.find(x => x.id === "vi-2"); return { solo: d?.solo_autore, acc: (d?.accessi || []).length, msg: msg.length, scelta: i?.referto_proprietario }; });
  ok(r2.solo === true && r2.acc === 0 && r2.msg === 0 && r2.scelta === false, "Inviato spento: file solo dell'autore, niente chat alla proprietaria, scelta salvata sulla visita " + JSON.stringify(r2));
  await pg.evaluate(() => { if(typeof vsChiudi === "function") vsChiudi(); });
  await attesa(300);
  // riaperto: ricorda la scelta
  await pg.evaluate(() => vsApriDaEvento("vi-2")); await attesa(500);
  await pg.evaluate(() => vrApri()); await attesa(400);
  const r3 = await pg.evaluate(() => document.querySelector("#vr-cond input")?.checked);
  ok(r3 === false, "Riaperto: l'interruttore ricorda «spento»");
  await pg.evaluate(() => { if(typeof vsChiudi === "function") vsChiudi(); }); await attesa(300);

  // chiusura della visita aperta: cavallo per cavallo e tutti insieme
  const v = await pg.evaluate(async () => {
    const i = demoState.interventiMascalcia.find(x => x.id === "vi-2"); i.referto_proprietario = true;
    VAP.d = { visite: [{ l: i, cav: { nome: "Aurora" } }] };
    await vapCondUno("vi-2"); const a = i.referto_proprietario;
    await vapCondTutti(true); const b2 = i.referto_proprietario;
    return { a, b: b2 };
  });
  ok(v.a === false && v.b === true, "Chiusura visita: «Solo data e tipo» per un cavallo, poi tutti di nuovo «Referto ✓» " + JSON.stringify(v));

  /* ---------- 2. veterinario → maniscalco ---------- */
  await pg.evaluate(() => {
    demoState.clientiMascalcia.push({ id: "f4-c", nome: "Allevamento San Rocco", tipo_cliente: "proprietario", cliente_user_id: "u-own", codice_invito: "EQUOF4AA" });
    demoState.cavalliClientiMascalcia.push({ id: "f4-h", nome: "Vento", cliente_mascalcia_id: "f4-c", microchip: "380098100123456", razza: "Sella italiano", note_colleghi: [] });
    const conv = { id: "co-f4", proprietario_a_id: "demo-user", proprietario_b_id: "demo-man", tipo: "colleghi", created_at: new Date().toISOString() };
    demoState.conversazioniProprietari.push(conv);
    demoState.colleghi = [{ conversazione_id: "co-f4", altro_id: "demo-man", nome: "Marco Ferri", ruolo: "maniscalco", segue: true },
      { conversazione_id: "co-f4b", altro_id: "demo-vet2", nome: "Dott.ssa Neri", ruolo: "veterinario" }];
    schedaCavalli = [{ key: "m:f4-h", id: "f4-h", nome: "Vento", cliente_mascalcia_id: "f4-c", microchip: "380098100123456", tipo: "manuale" }];
    schedaCavalloKey = "m:f4-h"; currentClienteId = "f4-c"; clientiMascalcia = demoState.clientiMascalcia.slice();
  });
  const sez = await pg.evaluate(() => ccSezioneHtml(schedaCavalli[0], () => true));
  ok(/Manda al maniscalco/.test(sez) && /Colleghi/.test(sez), "Scheda del cavallo (veterinario): riquadro «Colleghi» con «Manda al maniscalco»");
  await pg.evaluate(() => ccApri()); await attesa(500);
  const f = await pg.evaluate(() => ({ aperto: document.getElementById("modal-cc")?.classList.contains("active"), tit: document.querySelector("#modal-cc .modal-title")?.textContent,
    coll: [...document.querySelectorAll("#modal-cc .cc-coll:not(.altro) b")].map(x => x.textContent), sotto: document.querySelector("#modal-cc .cc-coll small")?.textContent,
    on: document.querySelector("#modal-cc .cc-coll.on b")?.textContent, avvisa: document.querySelector("#modal-cc .cc-avvisa input")?.checked }));
  ok(f.aperto && f.tit === "Manda Vento al maniscalco" && f.coll.join() === "Marco Ferri" && f.sotto === "Segue già questo cliente" && f.on === "Marco Ferri" && f.avvisa === true,
    "Foglio: solo i maniscalchi, quello che segue il cliente scelto, «Avvisa il proprietario» acceso " + JSON.stringify(f));
  await pg.fill("#cc-ind", "Ferro a cuore anteriore sx, ricontrollo rx tra 6 settimane");
  await pg.evaluate(() => ccInvia()); await attesa(700);
  const inv = await pg.evaluate(() => { const m = demoState.messaggiProprietari.filter(x => x.tipo === "cavallo").slice(-1)[0];
    const av = (demoState.messaggiMascalcia || []).filter(x => x.cliente_mascalcia_id === "f4-c" && /Ho condiviso la scheda di Vento con Marco Ferri \(maniscalco\), con le mie indicazioni/.test(x.testo || ""));
    return { conv: m?.conversazione_id, nome: m?.dati?.nome, ind: m?.dati?.indicazioni, prof: m?.dati?.professione, chip: m?.dati?.microchip, avviso: av.length, chiuso: !document.getElementById("modal-cc")?.classList.contains("active") }; });
  ok(inv.conv === "co-f4" && inv.nome === "Vento" && /Ferro a cuore/.test(inv.ind || "") && inv.prof === "veterinario" && inv.chip === "380098100123456" && inv.avviso === 1 && inv.chiuso,
    "Inviata in chat al collega con le indicazioni; avviso nella chat con il proprietario " + JSON.stringify(inv));
  const bolle = await pg.evaluate(() => { const m = demoState.messaggiProprietari.filter(x => x.tipo === "cavallo").slice(-1)[0]; const t = h => { const d = document.createElement("div"); d.innerHTML = h; return d.textContent.replace(/\s+/g, " "); };
    return { out: t(ccBollaHtml(m, true)), prev: ccPreviewTesto(m) }; });
  ok(/Hai mandato un cavallo/.test(bolle.out) && /Vento/.test(bolle.out) && /Indicazioni del veterinario/.test(bolle.out) && /il collega la aggiunge/.test(bolle.out) && bolle.prev === "🐴 Vento",
    "Bolla di chi manda e anteprima in elenco " + JSON.stringify(bolle));

  /* ---------- 3. chi riceve (qui: arriva al veterinario da un maniscalco) ---------- */
  await pg.evaluate(() => { demoState.messaggiProprietari.push({ id: "mo-f4in", conversazione_id: "co-f4", mittente_id: "demo-man", tipo: "cavallo", testo: "🐴 Zefirino",
    dati: { nome: "Zefirino", microchip: "380000000000999", cliente: "Maneggio Le Rose", tipo_cliente: "struttura", professione: "maniscalco", indicazioni: "Ascesso anteriore dx: zoppia da ieri", documenti: [] }, letto: false, created_at: new Date().toISOString() }); });
  const ric = await pg.evaluate(() => { const m = demoState.messaggiProprietari.find(x => x.id === "mo-f4in"); const d = document.createElement("div"); d.innerHTML = ccBollaHtml(m, false);
    return { t: d.textContent.replace(/\s+/g, " "), bt: [...d.querySelectorAll("button")].map(x => x.textContent.trim()) }; });
  ok(/Ti ha mandato un cavallo/.test(ric.t) && /Indicazioni del maniscalco/.test(ric.t) && ric.bt.includes("+ Aggiungi ai miei cavalli") && !ric.bt.includes("Ce l'ho già: collega"), "Bolla ricevuta: «Aggiungi ai miei cavalli» " + JSON.stringify(ric));
  const add = await pg.evaluate(async () => { const r = await ccRicevi("mo-f4in"); const cv = demoState.cavalliClientiMascalcia.find(x => x.id === r.riga); const cli = demoState.clientiMascalcia.find(x => x.id === r.cliente_id);
    const m = demoState.messaggiProprietari.find(x => x.id === "mo-f4in"); return { r, cav: cv?.nome, chip: cv?.microchip, note: (cv?.note_colleghi || []).map(n => n.testo), cli: cli?.nome, tipo: cli?.tipo_cliente, ric: !!m.dati.ricevuto }; });
  ok(add.r.ok && add.cav === "Zefirino" && add.chip === "380000000000999" && add.note.join() === "Ascesso anteriore dx: zoppia da ieri" && add.cli === "Maneggio Le Rose" && add.tipo === "struttura" && add.r.nuovo_cliente && add.ric,
    "«Aggiungi»: nuovo cliente e cavallo con le indicazioni, scheda segnata come ricevuta " + JSON.stringify(add));
  const dopo = await pg.evaluate(() => { const m = demoState.messaggiProprietari.find(x => x.id === "mo-f4in"); const d = document.createElement("div"); d.innerHTML = ccBollaHtml(m, false); return d.textContent.replace(/\s+/g, " "); });
  ok(/È tra i tuoi cavalli/.test(dopo), "Dopo: «È tra i tuoi cavalli»");
  // la stessa scheda di nuovo, con il cavallo che ha già: «Ce l'ho già: collega»
  await pg.evaluate(() => { demoState.messaggiProprietari.push({ id: "mo-f4in2", conversazione_id: "co-f4", mittente_id: "demo-man", tipo: "cavallo", testo: "🐴 Zefirino", dati: { nome: "Zefirino", microchip: "380000000000999", cliente: "Maneggio Le Rose", professione: "maniscalco", indicazioni: "Ricontrollo tra 10 giorni", documenti: [] }, letto: false, created_at: new Date().toISOString() }); });
  await pg.evaluate(async () => { await loadClientiMascalcia(); });
  const ce = await pg.evaluate(async () => { const m = demoState.messaggiProprietari.find(x => x.id === "mo-f4in2"); const d = document.createElement("div"); d.innerHTML = ccBollaHtml(m, false);
    const bt = [...d.querySelectorAll("button")].map(x => x.textContent.trim()); window.ccRicorda([m]); ccCeLho("mo-f4in2"); await new Promise(r => setTimeout(r, 200));
    const righe = [...document.querySelectorAll("#modal-cc .cc-coll b")].map(x => x.textContent);
    const cv = demoState.cavalliClientiMascalcia.find(x => x.nome === "Zefirino"); const n0 = demoState.cavalliClientiMascalcia.length;
    await ccRicevi("mo-f4in2", cv.id); return { bt, righe, note: cv.note_colleghi.length, stessi: demoState.cavalliClientiMascalcia.length === n0 }; });
  ok(ce.bt.includes("Ce l'ho già: collega") && ce.righe.includes("Zefirino") && ce.note === 2 && ce.stessi, "«Ce l'ho già»: scelta del cavallo, nessun doppione, indicazioni aggiunte " + JSON.stringify(ce));
  const note = await pg.evaluate(() => { const cv = demoState.cavalliClientiMascalcia.find(x => x.nome === "Zefirino"); const d = document.createElement("div"); d.innerHTML = ccSezioneHtml(cv, () => true); return d.textContent.replace(/\s+/g, " "); });
  ok(/Indicazioni del maniscalco/.test(note) && /Ricontrollo tra 10 giorni/.test(note) && /Ascesso anteriore dx/.test(note), "Riquadro «Colleghi»: le indicazioni ricevute");

  /* ---------- 4. veterinario e scuderie: i tasti per collegarsi ---------- */
  const scud = await pg.evaluate(async () => { showPage("pro-clienti"); await new Promise(r => setTimeout(r, 300)); vetFiltroClienti("scuderie"); const a = document.getElementById("cli-collega-btn")?.style.display;
    vetFiltroClienti("tutti"); const b2 = document.getElementById("cli-collega-btn")?.style.display; return { a, b: b2, qr: !!document.getElementById("collega-struttura-qr") }; });
  ok(scud.a === "" && scud.b === "none" && scud.qr, "Clienti › Scuderie: «Collega scuderia» (con QR) anche per il veterinario " + JSON.stringify(scud));
  const box = await pg.evaluate(async () => { demoState.clientiMascalcia.push({ id: "f4-s", nome: "Scuderia Monte Verde", tipo_cliente: "struttura", codice_invito: "EQUOF4SS" }); clientiMascalcia = demoState.clientiMascalcia.slice();
    await openClienteDetail("f4-s"); return document.getElementById("detail-cliente-scuderia")?.textContent.replace(/\s+/g, " ") || ""; });
  ok(/Collega a Equo Scuderia/.test(box), "Scheda della scuderia: «Collega a Equo Scuderia» anche per il veterinario");

  /* ---------- 5. maniscalco: «Manda al veterinario» ---------- */
  const man = await pg.evaluate(() => { const v0 = currentUser.vistaAttiva; currentUser.ruolo = "maniscalco"; currentUser.vistaAttiva = "maniscalco"; const h = ccSezioneHtml({ nome: "Vento", note_colleghi: [] }, () => true); currentUser.ruolo = "veterinario"; currentUser.vistaAttiva = v0; return h; });
  ok(/Manda al veterinario/.test(man) && /a un veterinario/.test(man), "Maniscalco: «Manda al veterinario»");

  ok(!err.length, "nessun errore JavaScript " + JSON.stringify(err));
  await b.close();
  if(problemi.length){ console.error("\nPROVA FASE 4: " + problemi.length + " problemi"); process.exit(1); }
  console.log("\nPROVA FASE 4: tutto OK");
})();
