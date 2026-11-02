// Prova della DETTATURA (2/11/2026): pannello comune, Galeno (relazione e terapia del referto) e Hammer (scheda ferratura).
// Microfono finto (SpeechRecognition) e risposta dell'agente finta (fetch): si prova quello che fa l'app, non il servizio AI.
const path = require("path"); const { chromium } = require("playwright");
const APP = path.resolve(__dirname, "..", "index.html");
const SUPA = process.env.SUPABASE_UMD || path.join(path.dirname(require.resolve("@supabase/supabase-js/package.json")), "dist", "umd", "supabase.js");
const problemi = []; const ok = (c, m) => { console.log((c ? "OK  " : "NO  ") + m); if(!c) problemi.push(m); };
const RISPOSTA_GALENO = { relazione: "Si rileva zoppia di grado 2/5 all'anteriore sinistro, più evidente sul duro. La pinza è positiva in punta: il quadro è compatibile con un ascesso subsolare.",
  terapia: "Apertura dell'ascesso e impacco per tre giorni; riposo in box. Ricontrollo tra una settimana.", da_controllare: "" };
const RISPOSTA_HAMMER = { nota_lavoro: "Ferrato completo. Anteriore sinistro con tallone basso: messo il pad.", scheda: { ferro_tipo: "correttivo", dettagli: ["Pad"], intervallo_giorni: 35 },
  per_proprietario: "Ciao, tieni il box asciutto per qualche giorno.", da_controllare: "Misura non detta" };

async function nuovaPagina(b){
  const pg = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const err = []; pg.on("pageerror", e => err.push(String(e.message)));
  await pg.route("**/*", r => { const u = r.request().url(); if(u.includes("supabase-js")) return r.fulfill({ path: SUPA, contentType: "application/javascript" });
    if(u.startsWith("file://") || u.startsWith("data:")) return r.continue(); return r.abort(); });
  await pg.addInitScript(() => {
    // microfono finto: start() → il test chiama window.__parla(testo, finale)
    class FintoSR { constructor(){ window.__sr = this; } start(){ this.attivo = true; window.__srStart = (window.__srStart || 0) + 1; } stop(){ this.attivo = false; } }
    window.webkitSpeechRecognition = FintoSR; window.SpeechRecognition = FintoSR;
    window.__parla = (t, fin) => { const r = window.__sr; const res = [{ 0: { transcript: t }, isFinal: !!fin, length: 1 }]; r.onresult({ resultIndex: 0, results: res }); };
  });
  await pg.goto("file://" + APP); await pg.waitForTimeout(1200);
  await pg.evaluate(() => startDemo()); await pg.waitForTimeout(600);
  return { pg, err };
}
// risposta finta dell'agente, fuori dalla prova (DEMO_MODE spento solo per la chiamata)
async function conAgente(pg, risposta, azione){
  return pg.evaluate(async ({ risposta, azione }) => {
    const f = window.fetch, a = window.authHeaders; let inviato = null;
    window.fetch = async (u, o) => { if(String(u).includes("functions/agent")){ inviato = JSON.parse(o.body); return { ok: true, status: 200, json: async () => ({ dettatura: risposta, uso: {} }) }; } return f(u, o); };
    window.authHeaders = async () => ({ "Content-Type": "application/json" });
    DEMO_MODE = false;
    try{ await window[azione](); } finally { DEMO_MODE = true; window.fetch = f; window.authHeaders = a; }
    return inviato;
  }, { risposta, azione });
}

(async () => {
  const b = await chromium.launch({ args: ["--allow-file-access-from-files"] });

  /* ===================== VETERINARIO ===================== */
  {
    const { pg, err } = await nuovaPagina(b);
    await pg.evaluate(async () => { currentUser.ruolo = "veterinario"; await enterApp("veterinario"); }); await pg.waitForTimeout(3500);
    await pg.evaluate(() => { class FintoPdf { constructor(){ this.t = []; } text(x){ this.t.push([].concat(x).join(" ")); } splitTextToSize(s){ return [String(s)]; } output(){ window.__ultimoPdf = this.t.join("\n"); return new Blob([window.__ultimoPdf], { type: "application/pdf" }); } }
      ["setFillColor", "rect", "setTextColor", "setFont", "setFontSize", "setDrawColor", "setLineWidth", "line", "addPage"].forEach(m => { FintoPdf.prototype[m] = function(){}; });
      window.caricaJsPdf = async () => FintoPdf; });
    const attesa = ms => pg.waitForTimeout(ms);

    // scheda: sezione «Relazione per il referto» con «Detta», niente più «arriva nel prossimo aggiornamento»
    await pg.evaluate(() => vsApriDaEvento("vi-2")); await attesa(500);
    await pg.evaluate(() => vsNuova("standard")); await attesa(400);
    await pg.evaluate(() => { vsCambia("diagnosi", "Sospetto ascesso subsolare ASx"); vsScegli("zop_as", 2); }); await attesa(900);
    const sez = await pg.evaluate(() => ({ box: !!document.querySelector("#vd-box .vd-detta"), tit: document.querySelector("#vd-box h3")?.textContent,
      vecchia: document.getElementById("vs-corpo").textContent.includes("prossimo aggiornamento"), ordine: [...document.querySelectorAll("#vs-corpo .vs-sez h3")].map(h => h.textContent).slice(-2) }));
    ok(sez.box && sez.tit === "Relazione per il referto" && !sez.vecchia && sez.ordine.join("|") === "Relazione per il referto|Foto, video e lastre", "Scheda: sezione Relazione con «Detta», prima degli allegati " + JSON.stringify(sez));

    // pannello: microfono di Equo, testo che arriva parlando
    await pg.evaluate(() => vdDetta()); await attesa(300);
    const p1 = await pg.evaluate(() => ({ aperto: document.getElementById("dt-foglio")?.classList.contains("aperto"), mic: !!document.getElementById("dt-mic"), tit: document.getElementById("dt-titolo").textContent,
      tasto: document.getElementById("dt-sistema")?.textContent }));
    await pg.evaluate(() => dtMic()); await attesa(100);
    await pg.evaluate(() => { __parla("zoppia anteriore sinistro", false); __parla("zoppia anteriore sinistro due su cinque", true); __parla("pinza positiva", true); }); await attesa(100);
    const parlato = await pg.evaluate(() => ({ t: document.getElementById("dt-testo").value, on: document.getElementById("dt-mic").classList.contains("on") }));
    ok(p1.aperto && p1.mic && p1.tit === "Detta la relazione" && /Sistema con Galeno/.test(p1.tasto) && parlato.on && parlato.t === "zoppia anteriore sinistro due su cinque pinza positiva",
      "Pannello: microfono di Equo e testo dettato " + JSON.stringify({ p1, parlato }));

    // «Sistema con Galeno»: chiamata giusta, proposte da confermare
    const inviato = await conAgente(pg, RISPOSTA_GALENO, "dtSistema"); await attesa(300);
    const prop = await pg.evaluate(() => [...document.querySelectorAll("#dt-corpo .dt-prop")].map(p => p.querySelector("b").textContent + ":" + (p.querySelector("textarea")?.value || "").slice(0, 20) + ":" + p.querySelector("input").checked));
    ok(inviato && inviato.modalita === "dettatura" && inviato.dettatura === "referto" && inviato.vista === "professionista" && /pinza positiva/.test(inviato.message)
      && /Zoppia/i.test(inviato.contesto_app || "") && /diagnosi/i.test(inviato.contesto_app || "") && prop.length === 2 && prop[0].startsWith("Relazione del veterinario:Si rileva") && prop[1].startsWith("Terapia e indicazioni:Apertura"),
      "Galeno: modalità dettatura con i dati della scheda, 2 proposte " + JSON.stringify({ inviato: inviato && { ...inviato, contesto_app: (inviato.contesto_app || "").slice(0, 80) }, prop }));

    // correggo la terapia e confermo: va nella scheda (solo il testo confermato, niente dettato grezzo)
    await pg.evaluate(() => { dtTesto(1, "Apertura dell'ascesso e impacco per tre giorni; riposo in box."); }); await pg.evaluate(() => dtConferma()); await attesa(900);
    const dopo = await pg.evaluate(() => ({ rel: VS.visita.dati.relazione, ind: VS.visita.dati.indicazioni, ta: document.getElementById("vs-f-relazione")?.value.slice(0, 15), chiuso: !document.getElementById("dt-foglio").classList.contains("aperto"),
      grezzo: JSON.stringify(VS.visita.dati).includes("pinza positiva") }));
    ok(dopo.rel === RISPOSTA_GALENO.relazione && dopo.ind === "Apertura dell'ascesso e impacco per tre giorni; riposo in box." && dopo.ta === "Si rileva zoppi" && dopo.chiuso && !dopo.grezzo,
      "Confermato: relazione e terapia nella scheda, il dettato grezzo no " + JSON.stringify(dopo));

    // referto: dati, poi relazione (con la diagnosi) e terapia; la diagnosi non è più tra i dati
    await pg.evaluate(() => vrApri()); await attesa(500);
    const ant = await pg.evaluate(() => ({ dati: [...document.querySelectorAll(".vr-foglio .vr-sez:not(.vr-scritta) h4")].map(h => h.textContent),
      scritta: [...document.querySelectorAll(".vr-scritta h4")].map(h => h.textContent), rel: document.getElementById("vr-relazione")?.value.slice(0, 10),
      diagInRel: [...document.querySelectorAll(".vr-scritta .vr-r span")].map(s => s.textContent).includes("Diagnosi / ipotesi"),
      diagInDati: [...document.querySelectorAll(".vr-foglio .vr-sez:not(.vr-scritta) .vr-r span")].map(s => s.textContent).includes("Diagnosi / ipotesi") }));
    await pg.evaluate(async () => { await vrCreaPdf(); }); await attesa(200);
    const pdf = await pg.evaluate(() => { const t = window.__ultimoPdf || ""; return { rel: t.indexOf("RELAZIONE DEL VETERINARIO"), ter: t.indexOf("TERAPIA E INDICAZIONI"), loc: t.indexOf("APPARATO LOCOMOTORE"), testo: t.includes("compatibile con un ascesso"), diag: t.includes("Sospetto ascesso subsolare ASx") }; });
    ok(ant.dati.includes("Apparato locomotore") && !ant.dati.includes("Diagnosi e piano") && ant.scritta.join("|") === "Relazione del veterinario|Terapia e indicazioni" && ant.rel === "Si rileva " && ant.diagInRel && !ant.diagInDati
      && pdf.loc > 0 && pdf.rel > pdf.loc && pdf.ter > pdf.rel && pdf.testo && pdf.diag, "Referto: dati, poi relazione e terapia (anteprima e PDF) " + JSON.stringify({ ant, pdf }));

    // ritocco nell'anteprima: si salva nella scheda
    await pg.fill("#vr-indicazioni", "Riposo in box per una settimana."); await attesa(900);
    ok(await pg.evaluate(() => VS.visita.dati.indicazioni) === "Riposo in box per una settimana.", "Ritocco della terapia nell'anteprima del referto");

    // prova (demo): senza Galeno il dettato va nella relazione così com'è, con l'avviso
    await pg.evaluate(() => vsMostraScheda()); await attesa(300);
    await pg.evaluate(() => vdDetta()); await attesa(200);
    await pg.fill("#dt-testo", "aggiungo controllo tra dieci giorni"); await pg.evaluate(() => dtSistema()); await attesa(600);
    const demo = await pg.evaluate(() => ({ avviso: document.querySelector(".dt-avviso")?.textContent || "", n: document.querySelectorAll(".dt-prop").length, nota: document.querySelector(".dt-prop-n")?.textContent || "" }));
    await pg.evaluate(() => dtConferma()); await attesa(700);
    const rel2 = await pg.evaluate(() => VS.visita.dati.relazione);
    ok(/In prova Galeno/.test(demo.avviso) && demo.n === 1 && /si aggiunge/i.test(demo.nota) && rel2 === RISPOSTA_GALENO.relazione + "\n\naggiungo controllo tra dieci giorni", "Prova: dettato aggiunto alla relazione che c'era " + JSON.stringify({ demo, rel2 }));

    // Home «Detta»: visite di oggi da scegliere, poi la scheda con la dettatura
    await pg.evaluate(() => vsChiudi()); await attesa(300);
    const oggi = await pg.evaluate(() => { const o = isoLocale(new Date()); const e = (hpAppuntamenti || []).find(x => x.id === "vi-4") || (hpAppuntamenti || [])[0];
      if(e && e.data_intervento !== o) e.data_intervento = o; return dtDiOggi().map(x => x.id); });
    await pg.evaluate(() => vhDetta()); await attesa(300);
    const scelta = await pg.evaluate(() => ({ righe: document.querySelectorAll("#dt-corpo .dt-scelta").length, sotto: document.getElementById("dt-sotto").textContent }));
    await pg.evaluate(() => document.querySelector("#dt-corpo .dt-scelta").click()); await attesa(900);
    let st = await pg.evaluate(() => ({ schermo: VS.schermo, dt: document.getElementById("dt-foglio").classList.contains("aperto"), attesa: VD.attesa }));
    if(st.schermo === "scelta"){ await pg.evaluate(() => vsNuova("standard")); await attesa(400); st = await pg.evaluate(() => ({ schermo: VS.schermo, dt: document.getElementById("dt-foglio").classList.contains("aperto"), attesa: VD.attesa, tit: document.getElementById("dt-titolo").textContent })); }
    ok(oggi.length >= 1 && scelta.righe === oggi.length && /visita di oggi/.test(scelta.sotto) && st.schermo === "scheda" && st.dt && !st.attesa, "Home «Detta»: scelta della visita di oggi, scheda e dettatura " + JSON.stringify({ oggi, scelta, st }));
    await pg.evaluate(() => { dtChiudi(); vsChiudi(); });

    // «+»: voce «Detta» subito dopo «Nuovo appuntamento»
    await pg.evaluate(() => plCostruisciMenu()); await attesa(100);
    const piu = await pg.evaluate(() => [...document.querySelectorAll("#hm-menu-piu .pl-tg")[0].querySelectorAll("button")].map(x => x.textContent.trim()).slice(0, 3));
    ok(piu[0] === "Nuovo appuntamento" && piu[1] === "Detta", "Veterinario: «Detta» nel + " + JSON.stringify(piu));
    ok(!err.length, "Veterinario: nessun errore JavaScript " + JSON.stringify(err));
    await pg.context().close();
  }

  /* ===================== MANISCALCO ===================== */
  {
    const { pg, err } = await nuovaPagina(b);
    const oggi = await pg.evaluate(() => isoLocale(new Date()));
    await pg.evaluate(o => { demoState.clientiMascalcia.push({ id: "dc-d", nome: "Dora Bianchi", tipo_cliente: "proprietario", maniscalco_id: currentUser.id, cliente_user_id: "demo-dora" });
      demoState.cavalliClientiMascalcia.push({ id: "cvd", nome: "Dardo", cliente_mascalcia_id: "dc-d", ferratura_tipo: "completa", ferro_tipo: "standard" });
      demoState.interventiMascalcia.push({ id: "id1", cliente_mascalcia_id: "dc-d", cavallo_cliente_id: "cvd", tipo_ferratura: "ferratura", quantita_ferri: 4, data_intervento: o, ora: "09:00", stato: "programmato", stato_pagamento: "da_saldare", importo: null }); }, oggi);
    await pg.evaluate(async () => { currentUser.ruolo = "maniscalco"; await enterApp("maniscalco"); }); await pg.waitForTimeout(3000);
    const attesa = ms => pg.waitForTimeout(ms);

    // «+»: voce «Detta» in «Crea subito»
    await pg.evaluate(() => plCostruisciMenu()); await attesa(100);
    const piu = await pg.evaluate(() => [...document.querySelectorAll("#hm-menu-piu .pl-tg")[0].querySelectorAll("button")].map(x => x.textContent.trim()));
    ok(piu.includes("Detta") && piu[0] === "Appuntamento", "Maniscalco: «Detta» nel + (Crea subito) " + JSON.stringify(piu));

    // dal «+»: cavallo di oggi o ricerca
    await pg.evaluate(() => { if(!(hpAppuntamenti || []).some(e => e.id === "id1")) hpAppuntamenti = [...(hpAppuntamenti || []), demoState.interventiMascalcia.find(e => e.id === "id1")]; });
    await pg.evaluate(() => ferDettaDaMenu()); await attesa(300);
    const sc = await pg.evaluate(() => ({ righe: [...document.querySelectorAll("#dt-corpo .dt-scelta b")].map(x => x.textContent), cerca: !!document.getElementById("dt-cerca") }));
    await pg.fill("#dt-cerca", "dar"); await attesa(200);
    const cercati = await pg.evaluate(() => [...document.querySelectorAll("#dt-corpo .dt-h")].map(x => x.textContent));
    await pg.evaluate(() => dtScelto("id1")); await attesa(900);
    const aperti = await pg.evaluate(() => ({ fer: document.getElementById("modal-ferratura").classList.contains("active"), dt: document.getElementById("dt-foglio").classList.contains("aperto"),
      tit: document.getElementById("dt-titolo").textContent, sotto: document.getElementById("dt-sotto").textContent, tasto: !!document.querySelector("#modal-ferratura .fer-detta"), int: FD.intervento?.id }));
    ok(sc.righe.includes("Dardo") && sc.cerca && cercati.includes("Cavalli") && aperti.fer && aperti.dt && aperti.tit === "Detta a Hammer" && /^Dardo/.test(aperti.sotto) && aperti.tasto && aperti.int === "id1",
      "Dal +: Dardo di oggi (e ricerca), scheda ferratura + dettatura sull'appuntamento di oggi " + JSON.stringify({ sc, cercati, aperti }));

    // Hammer: proposte (scheda, nota, messaggio non spuntato)
    await pg.fill("#dt-testo", "ferrato completo ehm pad all'anteriore sinistro da ora ogni cinque settimane box asciutto");
    const inviato = await conAgente(pg, RISPOSTA_HAMMER, "dtSistema"); await attesa(300);
    const prop = await pg.evaluate(() => [...document.querySelectorAll("#dt-corpo .dt-prop")].map(p => ({ t: p.querySelector("b").textContent, on: p.querySelector("input").checked, dis: p.querySelector("input").disabled,
      d: (p.querySelector(".dt-prop-d")?.textContent || p.querySelector("textarea")?.value || "").slice(0, 40) })));
    const avviso = await pg.evaluate(() => document.querySelector(".dt-avviso")?.textContent || "");
    ok(inviato && inviato.dettatura === "ferratura" && /Lavoro: Ferrato/.test(inviato.contesto_app) && /Appuntamento di oggi/.test(inviato.contesto_app)
      && prop.length === 3 && prop[0].t === "Cambi della scheda ferratura" && /correttivo \(Pad\).*ogni 35 giorni/.test(prop[0].d) && prop[0].on
      && prop[1].t === "Nota del lavoro" && prop[1].on && !prop[1].dis && prop[2].t === "Messaggio a Dora Bianchi" && !prop[2].on && !prop[2].dis && /Misura non detta/.test(avviso),
      "Hammer: scheda, nota del lavoro, messaggio (da spuntare) " + JSON.stringify({ prop, avviso }));

    // confermo tutto (anche il messaggio): scheda applicata da salvare, nota nell'appuntamento, messaggio in chat
    await pg.evaluate(() => dtAttiva(2, true)); await pg.evaluate(() => dtConferma()); await attesa(800);
    const app = await pg.evaluate(() => { const f = ferStatoAttuale(); return { ft: f.ft, det: f.det, int: f.int, fer: document.getElementById("modal-ferratura").classList.contains("active"),
      nota: demoState.interventiMascalcia.find(x => x.id === "id1").note, msg: demoState.messaggiMascalcia.filter(m => m.cliente_mascalcia_id === "dc-d").map(m => m.testo) }; });
    await pg.evaluate(() => salvaSchedaFerratura()); await attesa(600);
    const salvato = await pg.evaluate(() => { const c = demoState.cavalliClientiMascalcia.find(x => x.id === "cvd"); return { ft: c.ferro_tipo, det: c.ferro_dettagli, int: c.intervallo_giorni }; });
    ok(app.ft === "correttivo" && app.det.join() === "Pad" && app.int === 35 && app.fer && /tallone basso/.test(app.nota || "") && app.msg.includes(RISPOSTA_HAMMER.per_proprietario)
      && salvato.ft === "correttivo" && (salvato.det || []).join() === "Pad" && salvato.int === 35, "Confermato: scheda (poi Salva), nota del lavoro, messaggio in chat " + JSON.stringify({ app, salvato }));

    // scheda aperta senza appuntamento di oggi: la nota non si può salvare
    await pg.evaluate(() => { demoState.interventiMascalcia.find(x => x.id === "id1").data_intervento = "2020-01-01"; hpAppuntamenti = (hpAppuntamenti || []).filter(e => e.id !== "id1");
      ferDettaApri(null, cavalliCartella().find(c => c.id === "cvd")); }); await attesa(700);
    await pg.fill("#dt-testo", "pareggio fatto"); await pg.evaluate(() => dtSistema()); await attesa(600);
    const senza = await pg.evaluate(() => [...document.querySelectorAll("#dt-corpo .dt-prop")].map(p => p.querySelector("b").textContent + ":" + p.querySelector("input").disabled + ":" + (p.querySelector(".dt-prop-n")?.textContent || "").slice(0, 30)));
    ok(senza.length === 1 && /^Nota del lavoro:true:Oggi non c'è un appuntamento/.test(senza[0]), "Senza appuntamento di oggi: nota non salvabile, spiegato " + JSON.stringify(senza));
    await pg.evaluate(() => dtChiudi());
    ok(!err.length, "Maniscalco: nessun errore JavaScript " + JSON.stringify(err));
    await pg.context().close();
  }

  await b.close();
  if(problemi.length){ console.error("\nPROVA DETTATURA: " + problemi.length + " problemi"); process.exit(1); }
  console.log("\nPROVA DETTATURA: tutto OK");
})();
