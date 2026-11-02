// Prova del REFERTO del veterinario (2/11/2026): anteprima dai campi compilati, destinatari, invio nello spazio privato
// («equo-doc:<id>» in chat), bolla della chat che apre il file con un link temporaneo; i PDF normali restano com'erano.
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
  // la libreria PDF viene dalla rete: nella prova un PDF finto con gli stessi comandi
  await pg.evaluate(() => {
    class FintoPdf { constructor(){ this.t = []; } text(x){ this.t.push([].concat(x).join(" ")); } splitTextToSize(s){ return [String(s)]; } output(){ return new Blob([this.t.join("\n")], { type: "application/pdf" }); } }
    ["setFillColor", "rect", "setTextColor", "setFont", "setFontSize", "setDrawColor", "setLineWidth", "line", "addPage"].forEach(m => { FintoPdf.prototype[m] = function(){}; });
    window.caricaJsPdf = async () => FintoPdf; window.__pdf = FintoPdf;
  });
  const attesa = ms => pg.waitForTimeout(ms);

  // scheda di Aurora con qualche campo
  await pg.evaluate(() => vsApriDaEvento("vi-2")); await attesa(500);
  await pg.evaluate(() => vsNuova("standard")); await attesa(200);
  await pg.fill("#vs-f-diagnosi", "Sospetto ascesso subsolare ASx"); await pg.fill("#vs-f-temp", "37,8");
  await pg.evaluate(() => vsScegli("zop_as", 2)); await attesa(1000);
  const piede = await pg.evaluate(() => [...document.querySelectorAll("#vs-piede button")].map(b => b.textContent));
  ok(piede.includes("Referto"), "Scheda: tasto «Referto» " + JSON.stringify(piede));

  // anteprima
  await pg.evaluate(() => vrApri()); await attesa(500);
  const an = await pg.evaluate(() => ({ tit: document.getElementById("vs-titolo").textContent, testo: document.querySelector(".vr-foglio")?.textContent || "",
    dest: [...document.querySelectorAll(".vr-dest")].map(l => ({ n: l.querySelector("b").textContent, on: l.querySelector("input").checked, dis: l.querySelector("input").disabled })),
    scorri: !!document.getElementById("vr-scorri") }));
  ok(an.tit === "Referto pronto" && an.testo.includes("Sospetto ascesso subsolare ASx") && an.testo.includes("2/5") && an.testo.includes("37,8") && !an.testo.includes("Mucose"),
    "Anteprima: solo i campi compilati " + JSON.stringify({ tit: an.tit, testo: an.testo.slice(0, 160) }));
  ok(an.dest.length === 2 && an.dest[0].n === "Giulia Verdi" && an.dest[0].on && !an.dest[0].dis && an.dest[1].n === "Scuderia Il Poggio" && an.dest[1].dis && an.scorri,
    "Destinatari: proprietaria su Equo spuntata, scuderia fuori da Equo disattivata " + JSON.stringify(an.dest));

  // invio
  await pg.evaluate(() => vrInvia()); await attesa(800);
  const inv = await pg.evaluate(() => {
    const d = (demoState.documenti || [])[0];
    const m = (demoState.messaggiMascalcia || []).filter(x => x.tipo === "documento" && String(x.file_url).startsWith("equo-doc:"));
    const v = demoState.visitePro.visite.find(x => x.intervento_id === "vi-2");
    return { doc: d && { cat: d.categoria, visita: d.visita_id === v.id, cav: d.cavallo_cliente_id, acc: d.accessi.map(a => a.user_id + ":" + a.motivo) },
      msg: m.map(x => ({ c: x.cliente_mascalcia_id, url: x.file_url === "equo-doc:" + (d && d.id), nome: x.file_nome })),
      referto: v.dati._referto && { a: v.dati._referto.a, doc: v.dati._referto.documento_id === (d && d.id) }, fatto: document.getElementById("vs-titolo").textContent };
  });
  ok(inv.doc && inv.doc.cat === "referto" && inv.doc.visita && inv.doc.cav === "vv-au" && inv.doc.acc.join() === "demo-gv:chat", "Documento privato: referto della visita, accesso alla proprietaria " + JSON.stringify(inv.doc));
  ok(inv.msg.length === 1 && inv.msg[0].c === "vc-gv" && inv.msg[0].url && /^Equo_Aurora_2026-\d\d-\d\d_Referto\.pdf$/.test(inv.msg[0].nome), "In chat: un messaggio a Giulia con «equo-doc:» " + JSON.stringify(inv.msg));
  ok(inv.referto && inv.referto.a.join() === "Giulia Verdi" && inv.referto.doc && inv.fatto === "Fatto", "Scheda: «Referto inviato» salvato " + JSON.stringify(inv.referto));

  // bolla della chat: il documento privato si apre con il link temporaneo; i PDF normali restano link
  const bo = await pg.evaluate(async () => {
    const id = demoState.documenti[0].id;
    const priv = bollaAllegato("documento", "equo-doc:" + id, "Referto.pdf", "");
    const norm = bollaAllegato("documento", "https://esempio.it/a.pdf", "A.pdf", "");
    let aperto = null; window.open = () => ({ close(){}, location: { set href(u){ aperto = u; } } });
    await apriDocumentoPrivato(id);
    let negato = "sì"; const t = window.showToast; window.showToast = m => { negato = m; }; await apriDocumentoPrivato("doc-inesistente"); window.showToast = t;
    return { priv: priv.startsWith("<button") && priv.includes("apriDocumentoPrivato") && priv.includes("Privato"), norm: norm.startsWith('<a class="mchat-doc" href="https://esempio.it/a.pdf"'),
      aperto: String(aperto).startsWith("blob:"), negato };
  });
  ok(bo.priv && bo.norm && bo.aperto && /Non hai accesso/.test(bo.negato), "Chat: documento privato con link temporaneo, PDF normali invariati " + JSON.stringify(bo));

  ok(!err.length, "nessun errore JavaScript " + JSON.stringify(err));
  await b.close();
  if(problemi.length){ console.error("\nPROVA REFERTO: " + problemi.length + " problemi"); process.exit(1); }
  console.log("\nPROVA REFERTO: tutto OK");
})();
