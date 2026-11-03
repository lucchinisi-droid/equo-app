// Prova della VISITA APERTA del veterinario (3/11/2026, richiesta di Riccardo, mockup approvato da Simone):
// appuntamento senza cavalli («Li segno a fine visita»), etichetta «aperto», «Fatto» → «Quali cavalli hai visto?»
// (spunte, cavalli scritti a mano che diventano cavalli del cliente, vaccini con lotto per tutti, prezzo per cavallo modificabile),
// «Più tardi» → «da completare» in Home.
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
  await pg.evaluate(async () => { currentUser.ruolo = "veterinario"; await enterApp("veterinario"); try{ localStorage.setItem("equo-no-promemoria-prezzo", "1"); localStorage.removeItem("equo-vaa-dopo"); }catch(_){} }); await pg.waitForTimeout(3000);
  const attesa = ms => pg.waitForTimeout(ms);
  const scuderia = await pg.evaluate(() => { const c = demoState.clientiMascalcia.find(x => x.tipo_cliente === "struttura" && demoState.cavalliClientiMascalcia.filter(v => v.cliente_mascalcia_id === x.id).length >= 2); return { id: c.id, nome: c.nome }; });
  const privato = await pg.evaluate(() => demoState.clientiMascalcia.find(x => x.tipo_cliente !== "struttura" && demoState.cavalliClientiMascalcia.some(v => v.cliente_mascalcia_id === x.id))?.id);
  const scegli = async id => { await pg.evaluate(id => { const s = document.getElementById("intervento-cliente-select"); s.value = id; s.dispatchEvent(new Event("change")); }, id); await attesa(900); };
  const seg = () => pg.evaluate(() => ({ c: [...document.querySelectorAll("#vaa-seg button")].map(x => x.textContent + (x.classList.contains("on") ? "*" : "")).join("|"),
    lista: getComputedStyle(document.getElementById("intervento-cavalli-multi")).display, spunte: document.querySelectorAll("#intervento-cavalli-multi .int-cav-chk:checked").length }));

  /* 1. nuovo appuntamento con una scuderia: parte da «a fine visita» */
  await pg.evaluate(() => openInterventoModal(null)); await attesa(700);
  await scegli(scuderia.id);
  const s1 = await seg();
  ok(s1.c === "Li segno a fine visita*|Li scelgo ora" && s1.lista === "none" && s1.spunte === 0, "Scuderia: «Li segno a fine visita» già scelto, elenco nascosto " + JSON.stringify(s1));
  await pg.evaluate(() => vaaModo("ora")); await attesa(200);
  const s1b = await seg();
  await pg.evaluate(() => vaaModo("fine")); await attesa(200);
  ok(s1b.c === "Li segno a fine visita|Li scelgo ora*" && s1b.lista === "block", "«Li scelgo ora» mostra l'elenco " + JSON.stringify(s1b));
  await pg.evaluate(() => { document.getElementById("intervento-data").value = isoLocale(new Date()); document.getElementById("intervento-ora").value = "09:30";
    const t = document.getElementById("intervento-tipo"); t.value = "vaccino"; t.dispatchEvent(new Event("change")); const a = document.getElementById("intervento-tipo-altro"); if(a) a.value = ""; }); await attesa(200);
  const n0 = await pg.evaluate(() => demoState.interventiMascalcia.length);
  await pg.evaluate(() => document.getElementById("intervento-save-btn").click()); await attesa(1500);
  const app = await pg.evaluate(n => { const e = demoState.interventiMascalcia[n]; return e && { id: e.id, cav: e.cavallo_cliente_id, horse: e.horse_id, tipo: e.tipo_ferratura, cli: e.cliente_mascalcia_id }; }, n0);
  ok(app && !app.cav && !app.horse && app.tipo === "vaccino" && app.cli === scuderia.id, "Salvato senza cavalli " + JSON.stringify(app));
  const et = await pg.evaluate(id => vaaEtichetta(demoState.interventiMascalcia.find(x => x.id === id)), app.id);
  const gr = await pg.evaluate(id => vetEtichettaGruppo([demoState.interventiMascalcia.find(x => x.id === id)], {}).html, app.id);
  ok(et.txt === "aperto" && /aperto · cavalli da segnare/.test(gr), "Etichetta «aperto» in Home e in Agenda " + JSON.stringify({ et, gr }));

  /* 2. privato con cavalli: parte da «Li scelgo ora» */
  await pg.evaluate(() => openInterventoModal(null)); await attesa(700);
  await scegli(privato);
  const s2 = await seg();
  ok(s2.c === "Li segno a fine visita|Li scelgo ora*" && s2.lista === "block", "Privato: «Li scelgo ora» " + JSON.stringify(s2));
  await pg.evaluate(() => closeModal("modal-add-intervento"));

  /* 3. «Fatto» → quali cavalli hai visto */
  const p = pg.evaluate(id => segnaFatto(demoState.interventiMascalcia.find(x => x.id === id)).then(r => { window.__esito = r; }), app.id);
  await attesa(1000);
  const f0 = await pg.evaluate(() => ({ aperto: document.getElementById("modal-vaa")?.classList.contains("active"), x: !!document.querySelector("#modal-vaa .modal-close-x"),
    tit: document.getElementById("vaa-tit")?.textContent, cav: [...document.querySelectorAll("#vaa-corpo .vaa-cav b")].map(x => x.textContent),
    vacc: [...document.querySelectorAll("#vaa-corpo .vs-chip.on")].map(x => x.textContent), salva: document.querySelector("#vaa-corpo .vaa-ok").disabled }));
  ok(f0.aperto && !f0.x && f0.tit === "Quali cavalli hai visto?" && f0.cav.length >= 2 && f0.vacc.join("|") === "Influenza|Tetano|tra 1 anno" && f0.salva,
    "«Fatto»: si apre «Quali cavalli hai visto?» con i cavalli della scuderia, influenza e tetano già scelti, Salva spento senza cavalli " + JSON.stringify(f0));
  const ids = await pg.evaluate(() => VAA.cavalli.slice(0, 2).map(c => c.id));
  await pg.evaluate(ids => { vaaSpunta(ids[0], true); vaaSpunta(ids[1], true); }, ids); await attesa(200);
  await pg.fill("#vaa-prezzo-base", "45"); await attesa(200);
  await pg.fill(`#vaa-corpo [oninput*="'${ids[1]}'"]`, "60"); await attesa(100);
  await pg.fill("#vaa-nuovi", "Puledro Nuovo"); await attesa(200);
  await pg.fill("#vaa-lotto", "AB1234"); await pg.fill("#vaa-lotto-scad", "06/2027");
  const tot = await pg.evaluate(() => document.querySelector("#vaa-corpo .vaa-tot").textContent.replace(/\s+/g, " ").trim());
  const nCav0 = await pg.evaluate(() => demoState.cavalliClientiMascalcia.length);
  await pg.evaluate(() => vaaSalva()); await attesa(1500); await p;
  const r = await pg.evaluate(({ id, n0, scu }) => { const l = demoState.interventiMascalcia; const e = l.find(x => x.id === id); const nuovi = l.slice(n0 + 1);
    const nuovoCav = demoState.cavalliClientiMascalcia.slice(-1)[0];
    return { esito: window.__esito, e: { stato: e.stato, cav: e.cavallo_cliente_id, imp: e.importo, descr: e.tipo_altro, pross: e.prossima_scadenza, data: e.data_intervento },
      altri: nuovi.map(x => ({ cav: x.cavallo_cliente_id, imp: x.importo, stato: x.stato, cli: x.cliente_mascalcia_id === scu })), nuovoCav: { nome: nuovoCav.nome, cli: nuovoCav.cliente_mascalcia_id === scu },
      modale: document.getElementById("modal-vaa").classList.contains("active") }; }, { id: app.id, n0, scu: scuderia.id });
  const unAnno = await pg.evaluate(() => aggiungiGiorniIso(isoLocale(new Date()), 365));
  ok(tot.replace(/\s/g, "") === "3cavalli€150" && r.esito?.ok && r.e.stato === "fatto" && r.e.cav === ids[0] && r.e.imp === 45 && r.e.descr === "Vaccino influenza + tetano · lotto AB1234 (scad. 06/2027)" && r.e.pross === unAnno
    && r.altri.length === 2 && r.altri[0].cav === ids[1] && r.altri[0].imp === 60 && r.altri[1].imp === 45 && r.altri.every(x => x.stato === "fatto" && x.cli)
    && r.nuovoCav.nome === "Puledro Nuovo" && r.nuovoCav.cli && (await pg.evaluate(() => demoState.cavalliClientiMascalcia.length)) === nCav0 + 1 && !r.modale,
    "Salva: un lavoro per cavallo (primo sull'appuntamento), prezzo per cavallo, cavallo scritto a mano creato nel cliente, richiamo tra un anno " + JSON.stringify({ tot, r }));

  /* 4. «Più tardi» e «da completare» in Home */
  const id2 = await pg.evaluate(scu => { const ieri = isoLocale(new Date(Date.now() - 864e5));
    demoState.interventiMascalcia.push({ id: "aperta-ieri", cliente_mascalcia_id: scu, cavallo_cliente_id: null, horse_id: null, tipo_ferratura: "visita", tipo_altro: "controllo", data_intervento: ieri, ora: "10:00", stato: "programmato", stato_pagamento: "da_saldare" });
    VAA.passate = null; return "aperta-ieri"; }, scuderia.id);
  await pg.evaluate(() => { showPage("pro-home"); renderHomeVet(); }); await attesa(800);
  await pg.evaluate(() => renderHomeVet()); await attesa(300);
  const ban = await pg.evaluate(() => document.querySelector("#vh .vaa-banner")?.textContent.replace(/\s+/g, " ").trim());
  await pg.evaluate(() => document.querySelector("#vh .vaa-banner").click()); await attesa(900);
  const apre = await pg.evaluate(() => ({ aperto: document.getElementById("modal-vaa").classList.contains("active"), id: VAA.e?.id }));
  await pg.evaluate(() => vaaDopo()); await attesa(400);
  ok(/^1 visita da completare/.test(ban || "") && /segna quali cavalli hai visto/.test(ban) && apre.aperto && apre.id === id2 && !(await pg.evaluate(() => document.getElementById("modal-vaa").classList.contains("active"))),
    "Home: «1 visita da completare» apre «Quali cavalli hai visto?», «Più tardi» la lascia aperta " + JSON.stringify({ ban, apre }));
  ok(!err.length, "nessun errore JavaScript " + JSON.stringify(err));
  await b.close();
  if(problemi.length){ console.error("\nPROVA VISITA APERTA: " + problemi.length + " problemi"); process.exit(1); }
  console.log("\nPROVA VISITA APERTA: tutto OK");
})();
