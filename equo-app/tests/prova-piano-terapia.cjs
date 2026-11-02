// Prova del PIANO TERAPEUTICO (2/11/2026, SQL 34): veterinario (scheda, avvio, referto, sospendi, Home, Clienti, Galeno)
// e proprietario (Home «Terapie di oggi», «Fatto», scheda del cavallo). Modalità prova: dati in demoState.terapie.
const path = require("path"); const { chromium } = require("playwright");
const APP = path.resolve(__dirname, "..", "index.html");
const SUPA = process.env.SUPABASE_UMD || path.join(path.dirname(require.resolve("@supabase/supabase-js/package.json")), "dist", "umd", "supabase.js");
const problemi = []; const ok = (c, m) => { console.log((c ? "OK  " : "NO  ") + m); if(!c) problemi.push(m); };

async function pagina(b){
  const pg = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const err = []; pg.on("pageerror", e => err.push(String(e.message)));
  await pg.route("**/*", r => { const u = r.request().url(); if(u.includes("supabase-js")) return r.fulfill({ path: SUPA, contentType: "application/javascript" });
    if(u.startsWith("file://") || u.startsWith("data:")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + APP); await pg.waitForTimeout(1200);
  await pg.evaluate(() => startDemo()); await pg.waitForTimeout(600);
  return { pg, err };
}

(async () => {
  const b = await chromium.launch({ args: ["--allow-file-access-from-files"] });

  /* ===================== VETERINARIO ===================== */
  {
    const { pg, err } = await pagina(b); const attesa = ms => pg.waitForTimeout(ms);
    await pg.evaluate(async () => { currentUser.ruolo = "veterinario"; await enterApp("veterinario"); }); await attesa(3500);
    await pg.evaluate(() => { class F { constructor(){ this.t = []; } text(x){ this.t.push([].concat(x).join(" ")); } splitTextToSize(s){ return [String(s)]; } output(){ window.__pdf = this.t.join("\n"); return new Blob([window.__pdf]); } }
      ["setFillColor", "rect", "setTextColor", "setFont", "setFontSize", "setDrawColor", "setLineWidth", "line", "addPage"].forEach(m => { F.prototype[m] = function(){}; }); window.caricaJsPdf = async () => F; });
    const oggi = await pg.evaluate(() => isoLocale(new Date()));

    await pg.evaluate(() => vsApriDaEvento("vi-2")); await attesa(500);
    await pg.evaluate(() => vsNuova("standard")); await attesa(600);
    const s0 = await pg.evaluate(() => ({ box: document.querySelector("#pt-box h3")?.textContent, tasti: [...document.querySelectorAll("#pt-box .pt-aggiungi button")].map(x => x.textContent),
      ordine: [...document.querySelectorAll("#vs-corpo .vs-sez h3")].map(h => h.firstChild.textContent.trim()).slice(-3) }));
    ok(/^Piano terapeutico/.test(s0.box) && s0.tasti.join("|") === "+ Farmaco|+ Cura o esercizio" && s0.ordine.join("|") === "Relazione per il referto|Piano terapeutico|Foto, video e lastre",
      "Scheda: sezione Piano terapeutico tra relazione e allegati " + JSON.stringify(s0));

    // farmaco: 2 volte al giorno per 10 giorni, attesa DPA 180 giorni
    await pg.evaluate(() => ptNuovaVoce("farmaco")); await attesa(200);
    await pg.fill("#pt-nome", "Fenilbutazone"); await pg.fill("#pt-dose", "1 bustina");
    await pg.evaluate(() => { ptCampo("via", "Bocca"); ptVolte(2); ptCampo("giorni", 10); }); await attesa(100);
    await pg.fill("#pt-attesa", "180");
    const ed = await pg.evaluate(() => ({ orari: [...document.querySelectorAll(".pt-orari input")].map(i => i.value), nome: document.getElementById("pt-nome").value, schermo: VS.schermo }));
    await pg.evaluate(() => ptSalvaVoce()); await attesa(700);
    // cura senza orario
    await pg.evaluate(() => ptNuovaVoce("cura")); await attesa(200);
    await pg.fill("#pt-nome", "Riposo in box"); await pg.evaluate(() => { ptVolte(0); ptCampo("giorni", 7); }); await pg.evaluate(() => ptSalvaVoce()); await attesa(700);
    const fineAttesa = await pg.evaluate(o => { const d = new Date(o + "T12:00"); d.setDate(d.getDate() + 9 + 180); return d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }); }, oggi);
    const s1 = await pg.evaluate(() => ({ voci: [...document.querySelectorAll("#pt-box .pt-voce b")].map(x => x.textContent), sotto: document.querySelector("#pt-box .pt-voce small")?.textContent,
      conferme: document.querySelector(".pt-conferme input")?.checked, attesa: document.querySelector(".pt-attesa b")?.textContent, stato: PT.piano?.stato, avvia: document.querySelector("#pt-box .vs-btn.pri")?.textContent }));
    ok(ed.orari.join() === "08:00,20:00" && ed.schermo === "piano-voce" && s1.voci.join("|") === "Fenilbutazone · 1 bustina · bocca|Riposo in box" && /2 volte al giorno \(08:00, 20:00\) · 10 giorni/.test(s1.sotto)
      && s1.conferme === true && s1.attesa === fineAttesa && s1.stato === "bozza" && /Avvia e manda a Giulia Verdi/.test(s1.avvia || ""),
      "Voci salvate, conferme accese (oltre 7 giorni), fine attesa DPA, bozza " + JSON.stringify({ ed, s1, fineAttesa }));

    // avvio: attivo, mandato, somministrazioni future, messaggio in chat alla proprietaria
    await pg.evaluate(() => ptAvvia()); await attesa(600);
    const av = await pg.evaluate(() => { const t = demoState.terapie, p = t.piani[0]; const ora = Date.now();
      return { stato: p.stato, inviato: !!p.inviato_il, somm: t.somm.filter(s => s.piano_id === p.id).length, future: t.somm.every(s => new Date(s.previsto_il).getTime() > ora),
        msg: demoState.messaggiMascalcia.filter(m => m.cliente_mascalcia_id === "vc-gv").map(m => m.testo).find(x => /Piano terapeutico di Aurora/.test(x || "")) || "" }; });
    ok(av.stato === "attivo" && av.inviato && av.somm >= 18 && av.somm <= 20 && av.future && /Fenilbutazone 1 bustina \(bocca\)/.test(av.msg) && /tempo di attesa/.test(av.msg) && /«Fatto»/.test(av.msg),
      "Avvio: piano attivo, " + av.somm + " somministrazioni future, messaggio in chat " + JSON.stringify({ ...av, msg: av.msg.slice(0, 90) }));

    // modifica a piano attivo: somministrazioni rifatte + avviso
    await pg.evaluate(() => ptModificaVoce(0)); await attesa(200);
    await pg.evaluate(() => ptVolte(1)); await pg.evaluate(() => ptSalvaVoce()); await attesa(700);
    const mod = await pg.evaluate(() => ({ somm: demoState.terapie.somm.length, msg: demoState.messaggiMascalcia.filter(m => /Ho aggiornato il piano terapeutico di Aurora/.test(m.testo || "")).length }));
    ok(mod.somm >= 9 && mod.somm <= 10 && mod.msg === 1, "Modifica: una volta al giorno, somministrazioni rifatte, avviso in chat " + JSON.stringify(mod));

    // referto: piano nella sezione Terapia e indicazioni (anteprima e PDF)
    await pg.evaluate(() => vrApri()); await attesa(500);
    const ref = await pg.evaluate(() => ({ righe: [...document.querySelectorAll(".vr-piano .vr-r span")].map(x => x.textContent), att: document.querySelector(".vr-attesa")?.textContent || "" }));
    await pg.evaluate(async () => { await vrCreaPdf(); }); await attesa(200);
    const pdf = await pg.evaluate(() => { const t = window.__pdf || ""; return { ter: t.indexOf("TERAPIA E INDICAZIONI"), piano: t.indexOf("Piano terapeutico"), fen: t.includes("Fenilbutazone · 1 bustina · bocca"), att: /tempo di attesa fino al/.test(t) }; });
    ok(ref.righe.join("|") === "Fenilbutazone · 1 bustina · bocca|Riposo in box" && /tempo di attesa fino al/.test(ref.att) && pdf.ter > 0 && pdf.piano > pdf.ter && pdf.fen && pdf.att,
      "Referto: piano e fine attesa nell'anteprima e nel PDF " + JSON.stringify({ ref, pdf }));

    // sospendi (niente somministrazioni future) e riprendi
    await pg.evaluate(() => vsMostraScheda()); await attesa(400);
    await pg.evaluate(() => ptCambiaStato("sospeso")); await attesa(600);
    const sos = await pg.evaluate(() => ({ stato: demoState.terapie.piani[0].stato, future: demoState.terapie.somm.filter(s => new Date(s.previsto_il) > new Date()).length, badge: document.querySelector("#pt-box .pt-stato")?.textContent,
      msg: demoState.messaggiMascalcia.some(m => /è sospeso/.test(m.testo || "")) }));
    await pg.evaluate(() => ptCambiaStato("attivo")); await attesa(600);
    const rip = await pg.evaluate(() => ({ stato: demoState.terapie.piani[0].stato, future: demoState.terapie.somm.filter(s => new Date(s.previsto_il) > new Date()).length }));
    ok(sos.stato === "sospeso" && sos.future === 0 && sos.badge === "Sospeso" && sos.msg && rip.stato === "attivo" && rip.future >= 9, "Sospendi e riprendi " + JSON.stringify({ sos, rip }));

    // Home: terapie in corso e saltate (12 ore senza conferma)
    await pg.evaluate(() => { const t = demoState.terapie, p = t.piani[0], v = t.voci.find(x => x.piano_id === p.id);
      t.somm.push({ id: "ps-vecchia", piano_id: p.id, voce_id: v.id, previsto_il: new Date(Date.now() - 13 * 3600000).toISOString(), fatto_il: null },
                  { id: "ps-recente", piano_id: p.id, voce_id: v.id, previsto_il: new Date(Date.now() - 2 * 3600000).toISOString(), fatto_il: null }); PT.inCorso = null; });
    await pg.evaluate(() => { vsChiudi(); showPage("pro-home"); renderHomeVet(); }); await attesa(800);
    const home = await pg.evaluate(() => [...document.querySelectorAll("#vh .vh-giro-num button")].map(x => x.textContent.replace(/\s+/g, " ").trim()));
    await pg.evaluate(() => ptElenco()); await attesa(500);
    const el = await pg.evaluate(() => ({ t: document.getElementById("vs-titolo").textContent, righe: [...document.querySelectorAll("#vs-corpo .pt-voce b")].map(x => x.textContent), sal: document.querySelector("#vs-corpo .pt-saltate")?.textContent }));
    ok(home.some(x => x === "1terapia · 1 saltata") && el.t === "Terapie in corso" && el.righe[0] === "Aurora" && el.sal === "1 saltata", "Home: 1 terapia, 1 saltata (non la recente); elenco " + JSON.stringify({ home, el }));
    await pg.evaluate(() => document.querySelector("#vs-corpo .pt-voce").click()); await attesa(900);
    ok(await pg.evaluate(() => VS.schermo === "scheda" && VS.e?.id === "vi-2"), "Dall'elenco si apre la visita di Aurora");
    await pg.evaluate(() => vsChiudi());

    // Clienti: filtro «In terapia»
    await pg.evaluate(() => { showPage("pro-clienti"); }); await attesa(800);
    await pg.evaluate(() => vetFiltroClienti("terapia")); await attesa(400);
    const cli = await pg.evaluate(() => ({ tab: [...document.querySelectorAll("#cli-cartelle button")].map(x => x.textContent), righe: [...document.querySelectorAll("#clienti-list .vt-cli b")].map(x => x.textContent.trim()) }));
    ok(cli.tab.includes("In terapia") && cli.righe.length === 1 && /^Giulia Verdi/.test(cli.righe[0]) && /in terapia/.test(cli.righe[0]), "Clienti: filtro In terapia " + JSON.stringify(cli));
    await pg.evaluate(() => vetFiltroClienti("tutti"));

    // Galeno: voci del piano dalla dettatura
    await pg.evaluate(() => vsApriDaEvento("vi-4")); await attesa(600); await pg.evaluate(() => vsNuova("standard")); await attesa(500);
    await pg.evaluate(() => vdDetta()); await attesa(200); await pg.fill("#dt-testo", "meloxicam una volta al giorno per cinque giorni");
    await pg.evaluate(async () => { const f = window.fetch, a = window.authHeaders; window.authHeaders = async () => ({});
      window.fetch = async (u, o) => String(u).includes("functions/agent") ? { ok: true, status: 200, json: async () => ({ dettatura: { relazione: "Dolore lombare.", terapia: "Riposo.", da_controllare: "Dose non detta",
        piano: [{ tipo: "farmaco", nome: "Meloxicam", dose: "", via: "Bocca", volte_giorno: 1, giorni: 5, note: "" }] } }) } : f(u, o);
      DEMO_MODE = false; try{ await dtSistema(); } finally { DEMO_MODE = true; window.fetch = f; window.authHeaders = a; } }); await attesa(300);
    const pr = await pg.evaluate(() => [...document.querySelectorAll("#dt-corpo .dt-prop")].map(p => p.querySelector("b").textContent + "=" + (p.querySelector(".dt-prop-d")?.textContent || "")));
    await pg.evaluate(() => dtConferma()); await attesa(900);
    const gal = await pg.evaluate(() => ({ voci: (PT.piano?.voci || []).map(v => v.nome + ":" + v.orari.join() + ":" + v.giorni), stato: PT.piano?.stato, dom: [...document.querySelectorAll("#pt-box .pt-voce b")].map(x => x.textContent) }));
    ok(pr.some(x => /^Piano terapeutico · 1 voce=• Meloxicam · bocca · 1 volta al giorno · 5 giorni/.test(x)) && gal.voci.join() === "Meloxicam:08:00:5" && gal.stato === "bozza" && gal.dom[0] === "Meloxicam · bocca",
      "Galeno: voce del piano dalla dettatura, in bozza " + JSON.stringify({ pr, gal }));
    ok(!err.length, "Veterinario: nessun errore JavaScript " + JSON.stringify(err));
    await pg.context().close();
  }

  /* ===================== PROPRIETARIO ===================== */
  {
    const { pg, err } = await pagina(b); const attesa = ms => pg.waitForTimeout(ms);
    await pg.evaluate(async () => { currentUser.ruolo = "proprietario"; await enterApp("proprietario"); }); await attesa(2500);
    await pg.evaluate(() => {
      const h = horses[0], ora = Date.now(), fine = new Date(); fine.setHours(23, 58, 0, 0); const fut = Math.min(ora + 2 * 3600000, fine.getTime()); window.__lontana = fut - ora > 31 * 60000;
      const oggi = isoLocale(new Date()), hh = d => new Date(d).toTimeString().slice(0, 5);
      const t = demoState.terapie = { piani: [], voci: [], somm: [] };
      t.piani.push({ id: "pp1", professionista_id: "vet-x", horse_id: h.id, cavallo_nome: h.name, stato: "attivo", chiedi_conferme: true, inviato_il: new Date().toISOString(), attesa_fino: "2027-05-10" },
                   { id: "pp2", professionista_id: "vet-x", horse_id: h.id, cavallo_nome: h.name, stato: "attivo", chiedi_conferme: false, inviato_il: null });   // bozza non mandata: non si vede
      t.voci.push({ id: "pv1", piano_id: "pp1", ordine: 0, tipo: "farmaco", nome: "Fenilbutazone", dose: "1 bustina", via: "Bocca", orari: [hh(ora - 3600000), hh(fut)], ogni_giorni: 1, giorni: 5, inizio: oggi, note: "dopo il pasto" });
      t.somm.push({ id: "s-pas", piano_id: "pp1", voce_id: "pv1", previsto_il: new Date(ora - 3600000).toISOString(), fatto_il: null },
                  { id: "s-fut", piano_id: "pp1", voce_id: "pv1", previsto_il: new Date(fut).toISOString(), fatto_il: null });
      window.__h = h.id; TER.il = 0;
    });
    await pg.evaluate(() => { showPage("home"); renderHome(); }); await attesa(1200);
    const hm = await pg.evaluate(() => ({ tit: document.querySelector("#home-terapie .ter-tit")?.textContent, righe: [...document.querySelectorAll("#home-terapie .ter-somm")].map(r => r.querySelector(".o").textContent + " " + r.querySelector("b").textContent + " " + (r.querySelector("button") ? (r.querySelector("button").disabled ? "[off]" : "[Fatto]") : "")),
      piani: document.querySelectorAll("#home-terapie .ter-piano").length, lontana: window.__lontana }));
    ok(hm.tit === "💊 Terapie di oggi" && hm.piani === 1 && hm.righe.length === 2 && /Fenilbutazone \[Fatto\]$/.test(hm.righe[0]) && (hm.lontana ? /\[off\]$/.test(hm.righe[1]) : true),
      "Proprietario, Home: terapie di oggi (solo il piano mandato), Fatto sulla passata " + JSON.stringify(hm));
    await pg.evaluate(() => terFatto("s-pas")); await attesa(700);
    const dopo = await pg.evaluate(() => ({ fatto: !!demoState.terapie.somm.find(s => s.id === "s-pas").fatto_il, riga: document.querySelector("#home-terapie .ter-somm .ter-fatta")?.textContent }));
    ok(dopo.fatto && dopo.riga === "✓ Fatto", "«Fatto» salvato e mostrato " + JSON.stringify(dopo));
    await pg.evaluate(() => openHorseDetail(window.__h)); await attesa(800);
    const cav = await pg.evaluate(() => ({ tit: document.querySelector("#horse-terapia .ter-tit")?.textContent, voce: document.querySelector("#horse-terapia .ter-voce b")?.textContent,
      att: document.querySelector("#horse-terapia .ter-attesa b")?.textContent, nota: document.querySelector("#horse-terapia .ter-nota")?.textContent || "", dopoDove: document.getElementById("horse-dove")?.nextElementSibling?.id }));
    ok(cav.tit === "💊 Terapia in corso" && cav.voce === "Fenilbutazone · 1 bustina · bocca" && cav.att === "10 maggio 2027" && /«Fatto»/.test(cav.nota) && cav.dopoDove === "horse-terapia",
      "Scheda del cavallo: terapia in corso, attesa DPA " + JSON.stringify(cav));
    ok(!err.length, "Proprietario: nessun errore JavaScript " + JSON.stringify(err));
    await pg.context().close();
  }

  await b.close();
  if(problemi.length){ console.error("\nPROVA PIANO TERAPIA: " + problemi.length + " problemi"); process.exit(1); }
  console.log("\nPROVA PIANO TERAPIA: tutto OK");
})();
