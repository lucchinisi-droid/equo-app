// Prova del NUOVO APPUNTAMENTO A TRE STRADE e dell'APPUNTAMENTO APERTO del veterinario (3/11/2026 sera, mockup approvato da Simone):
// «Da dove parti?» (Scegli cavallo · Scegli cliente · Appuntamento aperto); «Scegli cavallo» cerca solo i cavalli;
// appuntamento aperto: dove, quando, quanti cavalli (previsione), un lavoro per cavallo con il suo tipo o «sul posto»;
// «Fatto» su un lavoro: «Chi era il cavallo?» (suggeriti, microchip, vaccino con lotto ricordato, costo), «Salva e vai al lavoro N»;
// chiuso l'ultimo: documenti (certificati di vaccinazione, riepilogo e conto) e invio in chat; «Più tardi» resta da completare in Home.
const path = require("path"); const { chromium } = require("playwright");
const APP = path.resolve(__dirname, "..", "index.html");
const SUPA = process.env.SUPABASE_UMD || path.join(path.dirname(require.resolve("@supabase/supabase-js/package.json")), "dist", "umd", "supabase.js");
let JSPDF = null; try{ JSPDF = path.join(path.dirname(require.resolve("jspdf/package.json")), "dist", "jspdf.umd.min.js"); }catch(_){}
const problemi = []; const ok = (c, m) => { console.log((c ? "OK  " : "NO  ") + m); if(!c) problemi.push(m); };
(async () => {
  const b = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const pg = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const err = []; pg.on("pageerror", e => err.push(String(e.message)));
  await pg.route("**/*", r => { const u = r.request().url(); if(u.includes("supabase-js")) return r.fulfill({ path: SUPA, contentType: "application/javascript" });
    if(u.includes("jspdf") && JSPDF) return r.fulfill({ path: JSPDF, contentType: "application/javascript" });
    if(u.startsWith("file://") || u.startsWith("data:")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + APP); await pg.waitForTimeout(1200);
  await pg.evaluate(() => startDemo()); await pg.waitForTimeout(600);
  await pg.evaluate(async () => { currentUser.ruolo = "veterinario"; await enterApp("veterinario"); try{ localStorage.setItem("equo-no-promemoria-prezzo", "1"); }catch(_){} }); await pg.waitForTimeout(3500);
  const attesa = ms => pg.waitForTimeout(ms);
  const attivo = id => pg.evaluate(i => !!document.getElementById(i)?.classList.contains("active"), id);

  // 1. «Da dove parti?»
  await pg.evaluate(() => openInterventoModal(null)); await attesa(500);
  const scelta = await pg.evaluate(() => ({ aperta: document.getElementById("modal-vap")?.classList.contains("active"), app: document.getElementById("modal-add-intervento").classList.contains("active"),
    op: [...document.querySelectorAll("#modal-vap .vap-op b")].map(x => x.textContent), ap: !!document.querySelector("#modal-vap .vap-op.ap small")?.textContent.includes("cavalli li segni sul posto") }));
  ok(scelta.aperta && !scelta.app && scelta.op.join("|") === "Scegli cavallo|Scegli cliente|Appuntamento aperto" && scelta.ap, "Nuovo appuntamento: prima «Da dove parti?» con le tre strade " + JSON.stringify(scelta));
  // con un cliente già scelto (dalla sua scheda) si va dritti alla scheda
  await pg.evaluate(() => { closeModal("modal-vap"); openInterventoModal("vc-sr"); }); await attesa(800);
  ok(await attivo("modal-add-intervento") && !(await attivo("modal-vap")), "dal cliente: dritti alla scheda");
  await pg.evaluate(() => closeModal("modal-add-intervento"));

  // 2. Scegli cavallo: si cercano solo i cavalli, scelto il cavallo si compila il cliente
  await pg.evaluate(() => { openInterventoModal(null); }); await attesa(300);
  await pg.evaluate(() => vapVia("cavallo")); await attesa(900);
  await pg.fill("#int-cerca-input", "Ve"); await attesa(300);
  const cav = await pg.evaluate(() => ({ ph: document.getElementById("int-cerca-input").placeholder, lab: document.querySelector("#intervento-cliente-group .input-label").textContent,
    righe: [...document.querySelectorAll("#int-cerca-lista button small")].map(x => x.textContent) }));
  await pg.evaluate(() => document.querySelector("#int-cerca-lista button[data-cav]").click()); await attesa(900);
  const dopo = await pg.evaluate(() => ({ cli: document.getElementById("intervento-cliente-select").value, spunta: [...document.querySelectorAll("#intervento-cavalli-multi .int-cav-chk:checked")].length, seg: !!document.getElementById("vaa-seg") }));
  ok(cav.ph === "Cerca il cavallo…" && cav.lab === "Cavallo" && cav.righe.length > 0 && cav.righe.every(x => x === "Cavallo") && dopo.cli && dopo.spunta === 1 && !dopo.seg,
    "Scegli cavallo: solo cavalli nella ricerca, poi cliente e cavallo compilati " + JSON.stringify({ cav, dopo }));
  await pg.evaluate(() => closeModal("modal-add-intervento"));
  // Scegli cliente: la scheda di sempre (niente più «Li segno a fine visita»)
  await pg.evaluate(() => { openInterventoModal(null); }); await attesa(300);
  await pg.evaluate(() => vapVia("cliente")); await attesa(900);
  const cli = await pg.evaluate(() => ({ ph: document.getElementById("int-cerca-input")?.placeholder, lab: document.querySelector("#intervento-cliente-group .input-label").textContent, solo: window.intCercaSolo }));
  await pg.evaluate(() => { const s = document.getElementById("intervento-cliente-select"); s.value = "vc-sr"; s.dispatchEvent(new Event("change")); }); await attesa(900);
  ok(cli.lab === "Cliente" && !cli.solo && !(await pg.evaluate(() => !!document.getElementById("vaa-seg"))), "Scegli cliente: la scheda di sempre " + JSON.stringify(cli));
  await pg.evaluate(() => closeModal("modal-add-intervento"));

  // 3. Appuntamento aperto: previsione, lavori, appuntamenti creati
  await pg.evaluate(() => { const o = isoLocale(new Date(Date.now() - 40 * 864e5));
    ["vv-ne", "vv-ve"].forEach((c, i) => demoState.interventiMascalcia.push({ id: "prev-" + i, cliente_mascalcia_id: "vc-sr", cavallo_cliente_id: c, tipo_ferratura: "vaccino", tipo_altro: "Vaccino influenza", data_intervento: o, stato: "fatto", importo: 50, prossima_scadenza: isoLocale(new Date(Date.now() + 10 * 864e5)) }));
    openInterventoModal(null); }); await attesa(300);
  await pg.evaluate(() => vapVia("aperto")); await attesa(400);
  await pg.evaluate(() => vapDove("vc-sr")); await attesa(900);
  const prev = await pg.evaluate(() => ({ n: VAP.a.n, slot: VAP.a.slot.join(","), testo: document.getElementById("vap-prev")?.textContent || "", lavori: document.querySelectorAll("#modal-vap-aperto .vap-slot").length }));
  ok(prev.n === 2 && prev.slot === "vaccino,vaccino" && /ultima volta qui/.test(prev.testo) && /richiamo in scadenza/.test(prev.testo) && prev.lavori === 2,
    "Aperto: previsione dall'ultima volta e dai richiami (2 vaccini) " + JSON.stringify(prev));
  await pg.evaluate(() => { vapQuanti(1); }); await attesa(100);
  await pg.evaluate(() => { vapTipoSlot(2, "posto"); vapQuando("domani"); document.getElementById("vap-ora").value = "09:00"; VAP.a.ora = "09:00"; }); await attesa(100);
  const bt = await pg.evaluate(() => document.getElementById("vap-crea").textContent);
  await pg.evaluate(() => vapCrea()); await attesa(900);
  const domani = await pg.evaluate(() => aggiungiGiorniIso(isoLocale(new Date()), 1));
  const creati = await pg.evaluate(d => demoState.interventiMascalcia.filter(e => e.cliente_mascalcia_id === "vc-sr" && e.data_intervento === d && !e.cavallo_cliente_id)
    .map(e => ({ id: e.id, t: e.tipo_ferratura, a: e.tipo_altro, o: e.ora, s: e.stato })), domani);
  ok(bt === "Crea 3 appuntamenti" && creati.length === 3 && creati.map(x => x.t + "@" + x.o).join(",") === "vaccino@09:00,vaccino@09:15,visita@09:30" && creati[2].a === "Da decidere sul posto" && creati.every(x => x.s === "programmato")
    && !(await attivo("modal-vap-aperto")), "Aperto: 3 appuntamenti normali senza cavallo, orari distanziati, il terzo «da decidere» " + JSON.stringify({ bt, creati }));
  const et = await pg.evaluate(d => vetEtichettaGruppo(demoState.interventiMascalcia.filter(e => e.cliente_mascalcia_id === "vc-sr" && e.data_intervento === d), { scuderia: true }).html, domani);
  ok(/aperto · 3 cavalli da segnare/.test(et), "Agenda: etichetta «aperto · 3 cavalli da segnare» " + et);

  // 4. «Fatto» sul primo lavoro: chi era il cavallo?
  await pg.evaluate(() => { const v = demoState.cavalliClientiMascalcia.find(c => c.id === "vv-ve"); if(v) v.microchip = "380260000999888"; });
  await pg.evaluate(id => { segnaFatto(demoState.interventiMascalcia.find(e => e.id === id)); return 1; }, creati[0].id); await attesa(400);
  await pg.evaluate(() => { const s = document.getElementById("eq-pop-sino"); if(s && s.classList.contains("active") || document.getElementById("sino-si")?.offsetParent) rispondiSiNo(true); }); await attesa(900);
  const f1 = await pg.evaluate(() => ({ aperto: document.getElementById("modal-vaa")?.classList.contains("active"), tit: document.querySelector("#modal-vaa .modal-title")?.textContent, sotto: document.querySelector("#modal-vaa .vaa-sotto-tit")?.textContent,
    sug: [...document.querySelectorAll("#modal-vaa .vap-sug button")].map(x => x.firstChild.textContent), bt: document.querySelector("#modal-vaa .vaa-ok")?.textContent }));
  ok(f1.aperto && f1.tit === "Chi era il cavallo?" && /^Lavoro 1 di 3 · Vaccino/.test(f1.sotto) && f1.sug.includes("Nerone") && f1.sug.includes("Vento") && f1.bt === "Salva e vai al lavoro 2 ›",
    "Fatto: «Chi era il cavallo?» con i cavalli del posto " + JSON.stringify(f1));
  // microchip: riconosce il cavallo
  await pg.evaluate(() => vapChip("380 260 000 999 888")); await attesa(200);
  const mc = await pg.evaluate(() => ({ scelto: VAP.c.scelto?.nome, esito: document.querySelector("#modal-vaa .vap-ok")?.textContent || "" }));
  ok(mc.scelto === "Vento" && /Trovato tra i tuoi cavalli/.test(mc.esito), "Microchip: riconosce il cavallo " + JSON.stringify(mc));
  // «+ Un altro cavallo qui»: due tocchi veloci = un solo lavoro, conferma nel foglio, «Togli» lo toglie
  const nPrima = await pg.evaluate(() => demoState.interventiMascalcia.length);
  await pg.evaluate(() => { vapAggiungiLavoro(); vapAggiungiLavoro(); return 1; }); await attesa(500);
  const ag = await pg.evaluate(n => ({ nuovi: demoState.interventiMascalcia.length - n, nota: document.querySelector("#modal-vaa .vap-aggiunto")?.textContent.replace(/\s+/g, " ").trim() || "",
    sotto: document.querySelector("#modal-vaa .vaa-sotto-tit")?.textContent }), nPrima);
  await pg.evaluate(() => { vapTogliAggiunto(); return 1; }); await attesa(500);
  const tg = await pg.evaluate(n => ({ nuovi: demoState.interventiMascalcia.length - n, nota: !!document.querySelector("#modal-vaa .vap-aggiunto"), sotto: document.querySelector("#modal-vaa .vaa-sotto-tit")?.textContent }), nPrima);
  ok(ag.nuovi === 1 && /Aggiunto 1 lavoro: lo compili dopo questo/.test(ag.nota) && /di 4/.test(ag.sotto) && tg.nuovi === 0 && !tg.nota && /di 3/.test(tg.sotto),
    "«+ Un altro cavallo qui»: niente doppioni, conferma nel foglio, «Togli» " + JSON.stringify({ ag, tg }));
  await pg.evaluate(() => { VAP.c.lotto = "AB1234"; VAP.c.lottoScad = "06/2027"; VAP.c.prezzo = "45"; vaaSalva(); return 1; }); await attesa(1200);
  const s1 = await pg.evaluate(id => demoState.interventiMascalcia.find(e => e.id === id), creati[0].id);
  const f2 = await pg.evaluate(() => ({ sotto: document.querySelector("#modal-vaa .vaa-sotto-tit")?.textContent, lotto: document.getElementById("vaa-lotto")?.value, sug: [...document.querySelectorAll("#modal-vaa .vap-sug button")].map(x => x.firstChild.textContent) }));
  ok(s1.stato === "fatto" && s1.cavallo_cliente_id === "vv-ve" && /lotto AB1234 \(scad\. 06\/2027\)/.test(s1.tipo_altro) && s1.importo === 45 && s1.prossima_scadenza === (await pg.evaluate(d => aggiungiGiorniIso(d, 365), s1.data_intervento)),
    "Lavoro 1 salvato: cavallo, vaccino con lotto, costo, richiamo a 1 anno " + JSON.stringify(s1));
  ok(/^Lavoro 2 di 3/.test(f2.sotto || "") && f2.lotto === "AB1234" && !f2.sug.includes("Vento"), "Si passa al lavoro 2: lotto ricordato, Vento non più proposto " + JSON.stringify(f2));
  // lavoro 2: cavallo nuovo con microchip
  await pg.evaluate(() => { vapNome("Puledro Nuovo"); vapChip("380260000123456"); VAP.c.prezzo = "60"; }); await attesa(200);
  const nuovoTxt = await pg.evaluate(() => document.querySelector("#modal-vaa .vap-piccolo")?.textContent || "");
  await pg.evaluate(() => { vaaSalva(); return 1; }); await attesa(1200);
  const pn = await pg.evaluate(() => demoState.cavalliClientiMascalcia.find(c => c.nome === "Puledro Nuovo"));
  const s2 = await pg.evaluate(id => demoState.interventiMascalcia.find(e => e.id === id), creati[1].id);
  ok(/Cavallo nuovo/.test(nuovoTxt) && pn && pn.cliente_mascalcia_id === "vc-sr" && pn.microchip === "380260000123456" && s2.cavallo_cliente_id === pn.id && s2.importo === 60,
    "Lavoro 2: cavallo nuovo del cliente con microchip " + JSON.stringify({ nuovoTxt, pn, s2 }));
  // lavoro 3: da decidere → serve il tipo; poi visita
  const f3 = await pg.evaluate(() => ({ sotto: document.querySelector("#modal-vaa .vaa-sotto-tit")?.textContent, bt: document.querySelector("#modal-vaa .vaa-ok")?.textContent, on: document.querySelectorAll("#modal-vaa .vs-chips .vs-chip.on").length }));
  await pg.evaluate(() => { vapScegliCavallo("vv-ne"); vaaSalva(); return 1; }); await attesa(300);
  const errTipo = await pg.evaluate(() => document.getElementById("vaa-err")?.textContent || "");
  await pg.evaluate(() => vapTipo("visita")); await attesa(300);
  await pg.evaluate(() => { VAP.c.motivo = "controllo"; VAP.c.prezzo = "70"; vaaSalva(); return 1; }); await attesa(1500);
  ok(/^Lavoro 3 di 3 · da decidere/.test(f3.sotto || "") && f3.bt === "Salva e chiudi la visita" && f3.on === 0 && /Scegli cosa hai fatto/.test(errTipo), "Lavoro 3 «da decidere»: chiede cosa hai fatto " + JSON.stringify({ f3, errTipo }));

  // 5. documenti
  const doc = await pg.evaluate(() => ({ aperto: document.getElementById("modal-vap-doc")?.classList.contains("active"), sotto: document.querySelector("#modal-vap-doc .vaa-sotto-tit")?.textContent,
    voci: [...document.querySelectorAll("#modal-vap-doc .vap-doc b")].map(x => x.textContent), tot: document.querySelector("#modal-vap-doc .vaa-tot span:last-child")?.textContent }));
  ok(doc.aperto && /^3 cavalli/.test(doc.sotto) && doc.voci.includes("Certificati di vaccinazione") && doc.voci.includes("Riepilogo e conto") && doc.voci.includes("Referto · Nerone") && doc.voci.includes("Allevamento San Rocco") && /175/.test(doc.tot),
    "Visita chiusa: documenti da inviare, a chi, totale " + JSON.stringify(doc));
  const prima = await pg.evaluate(() => ({ m: demoState.messaggiMascalcia.length, d: (demoState.documenti || []).length }));
  await pg.evaluate(() => { vapInvia(); return 1; }); await attesa(3000);
  const inv = await pg.evaluate(p => ({ msg: demoState.messaggiMascalcia.slice(p.m).map(m => m.cliente_mascalcia_id + ":" + m.tipo + ":" + (m.testo || "").slice(0, 40)),
    doc: (demoState.documenti || []).slice(p.d).map(d => d.categoria + ":" + d.cavallo_cliente_id), ok: document.querySelector("#modal-vap-doc .vr-ok b")?.textContent }), prima);
  ok(inv.doc.length === 2 && inv.doc.every(x => x.startsWith("vaccino:")) && inv.msg.filter(x => /:documento:Certificato di vaccinazione/.test(x)).length === 2 && inv.msg.some(x => /^vc-sr:testo:Riepilogo della visita/.test(x)) && inv.ok === "Documenti inviati",
    "Invio: 2 certificati nello spazio privato e in chat, riepilogo e conto in chat " + JSON.stringify(inv));
  await pg.evaluate(() => closeModal("modal-vap-doc"));

  // 6. «Più tardi»: resta aperto e da completare in Home
  await pg.evaluate(async () => { const { data } = await DB.insertInterventoMascalcia({ cliente_mascalcia_id: "vc-sr", tipo_ferratura: "vaccino", tipo_altro: null, data_intervento: isoLocale(new Date()), ora: null, stato: "programmato", stato_pagamento: "da_saldare" });
    window.__pt = data.id; segnaFatto(data); }); await attesa(900);
  await pg.evaluate(() => vaaDopo()); await attesa(500);
  const ban = await pg.evaluate(() => { showPage("pro-home"); hpAppuntamenti = [...(hpAppuntamenti || []), demoState.interventiMascalcia.find(e => e.id === window.__pt)]; renderHomeVet(); return document.querySelector("#vh .vaa-banner")?.textContent.replace(/\s+/g, " ") || ""; });
  ok(/1 lavoro da completare/.test(ban) && /chi era il cavallo/.test(ban), "Più tardi: «da completare» in Home " + ban);

  ok(!err.length, "nessun errore JavaScript " + JSON.stringify(err));
  await b.close();
  if(problemi.length){ console.error("\nPROVA VISITA APERTA: " + problemi.length + " problemi"); process.exit(1); }
  console.log("\nPROVA VISITA APERTA: tutto OK");
})();
