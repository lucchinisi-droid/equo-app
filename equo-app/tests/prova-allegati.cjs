// Prova degli ALLEGATI DELLA VISITA (2/11/2026): 4 tasti, tipo/zona/nota, nome dato da Equo (non dal telefono),
// numero progressivo, limiti (50 MB), cambia tipo o zona, elimina, allegati spediti con il referto.
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
    window.caricaJsPdf = async () => FintoPdf; window.__ultimoPdf = null;
    const orig = FintoPdf.prototype.output; FintoPdf.prototype.output = function(){ window.__ultimoPdf = this.t.join("\n"); return orig.call(this); };
  });
  const attesa = ms => pg.waitForTimeout(ms);
  const oggi = await pg.evaluate(() => isoLocale(new Date()));

  // scheda vuota di Aurora: la sezione c'è, con i 4 tasti
  await pg.evaluate(() => vsApriDaEvento("vi-2")); await attesa(500);
  await pg.evaluate(() => vsNuova("standard")); await attesa(400);
  const sez = await pg.evaluate(() => ({ tit: document.querySelector("#va-box h3")?.textContent, tasti: [...document.querySelectorAll(".va-tasti button")].map(b => b.textContent) }));
  ok(sez.tit === "Foto, video e lastre" && sez.tasti.join("|") === "Scatta foto|Dalla galleria|Video|File · PDF, lastre", "Scheda: sezione e 4 tasti " + JSON.stringify(sez));

  // una foto con il nome del telefono: tipo lastra, zona piede ASx, nota
  await pg.evaluate(() => vaFile(new File([new Uint8Array(2000)], "IMG_20261102_123456.jpg", { type: "image/jpeg" }))); await attesa(300);
  const pan = await pg.evaluate(() => ({ c: !!document.getElementById("va-attesa"), tipo: document.querySelector("#va-attesa .vs-chip.on")?.textContent }));
  await pg.evaluate(() => { vaImposta("categoria", "lastra"); vaImposta("zona", "piede_as"); }); await attesa(100);
  await pg.fill("#va-nota", "proiezione laterale"); await attesa(100);
  const nomeAnt = await pg.evaluate(() => document.querySelector(".va-anteprima-nome b")?.textContent);
  await pg.evaluate(() => vaSalva()); await attesa(800);
  const d1 = await pg.evaluate(() => { const d = demoState.documenti.find(x => x.categoria === "lastra"); const v = demoState.visitePro.visite.find(x => x.intervento_id === "vi-2");
    return d && { tit: d.titolo, n: d.numero, zona: d.zona, nota: d.nota, data: d.data_documento, visita: !!v && d.visita_id === v.id, cav: d.cavallo_cliente_id, file: DB.nomeFileDocumento(d, "Aurora"), telefono: JSON.stringify(d).includes("IMG_2026") }; });
  ok(pan.c && pan.tipo === "Foto clinica", "File scelto: riga da confermare, tipo proposto «Foto clinica» " + JSON.stringify(pan));
  ok(d1 && /^Aurora · \d+ nov 2026 · Lastra · Piede ASx · proiezione laterale$/.test(d1.tit) && d1.tit === nomeAnt && d1.n === 1 && d1.visita && d1.cav === "vv-au" && d1.data === oggi && !d1.telefono,
    "Nome dato da Equo, niente nome del telefono, scheda salvata " + JSON.stringify(d1));
  ok(d1 && d1.file === `Equo_Aurora_${oggi}_Lastra_Piede-ASx.jpg`, "Nome del file scaricato " + (d1 && d1.file));

  // seconda lastra del piede ASx lo stesso giorno: (2); la zona resta proposta
  await pg.evaluate(() => vaFile(new File([new Uint8Array(1500)], "IMG_9999.jpg", { type: "image/jpeg" }))); await attesa(200);
  const zonaProp = await pg.evaluate(() => VA.attesa.zona);
  await pg.evaluate(() => { vaImposta("categoria", "lastra"); }); await pg.evaluate(() => vaSalva()); await attesa(700);
  const d2 = await pg.evaluate(() => demoState.documenti.filter(x => x.categoria === "lastra").map(x => ({ t: x.titolo, n: x.numero, f: DB.nomeFileDocumento(x, "Aurora") })));
  ok(zonaProp === "piede_as" && d2.length === 2 && d2[1].n === 2 && / \(2\)$/.test(d2[1].t) && d2[1].f.endsWith("_Lastra_Piede-ASx_2.jpg"), "Progressivo (2) e zona riproposta " + JSON.stringify({ zonaProp, d2 }));

  // elenco nella scheda, cambia zona (il nome si rifà), limite di 50 MB
  const el = await pg.evaluate(() => [...document.querySelectorAll("#va-box .va-doc .va-tit b")].map(x => x.textContent));
  await pg.evaluate(async () => { const id = demoState.documenti.find(x => x.numero === 2).id; vaModifica(id); vaImposta("zona", "piede_ad"); await vaSalvaModifica(); }); await attesa(400);
  const mod = await pg.evaluate(() => demoState.documenti.find(x => x.numero === 2).titolo);
  let toast = await pg.evaluate(async () => { let m = ""; const t = window.showToast; window.showToast = x => { m = x; }; await vaFile(new File([new Uint8Array(51 * 1024 * 1024)], "big.mov", { type: "video/quicktime" })); window.showToast = t; return m; });
  ok(el.length === 2 && /Piede ADx/.test(mod) && /massimo 50 MB/.test(toast), "Elenco 2 allegati, zona cambiata nel nome, limite 50 MB " + JSON.stringify({ el, mod, toast }));

  // referto con un allegato: il PDF lo elenca e in chat arrivano referto + allegato, con l'accesso alla proprietaria
  await pg.fill("#vs-f-diagnosi", "Sospetto ascesso subsolare ASx"); await attesa(1000);
  const idA = await pg.evaluate(() => demoState.documenti.find(x => x.numero === 1 && x.categoria === "lastra").id);
  await pg.evaluate(id => { VR.alleg = new Set([id]); }, idA);
  await pg.evaluate(() => vrApri()); await attesa(500);
  const cas = await pg.evaluate(() => [...document.querySelectorAll(".vr-dest")].map(l => l.querySelector("b").textContent + ":" + l.querySelector("input").checked));
  await pg.evaluate(() => vrInvia()); await attesa(900);
  const ref = await pg.evaluate(id => ({ pdf: /ALLEGATI/.test(window.__ultimoPdf || "") && /Piede ASx/.test(window.__ultimoPdf || ""),
    msg: demoState.messaggiMascalcia.filter(m => m.cliente_mascalcia_id === "vc-gv" && String(m.file_url).startsWith("equo-doc:")).map(m => m.tipo + ":" + m.file_nome),
    acc: demoState.documenti.find(x => x.id === id).accessi.map(a => a.user_id) }), idA);
  ok(cas.some(x => /Lastra · Piede ASx/.test(x) && x.endsWith(":true")) && ref.pdf && ref.msg.length === 2 && ref.msg.some(m => /^foto:Equo_Aurora_.*_Lastra_Piede-ASx\.jpg$/.test(m)) && ref.acc.includes("demo-gv"),
    "Referto con allegato: elencato nel PDF, 2 messaggi, accesso alla proprietaria " + JSON.stringify({ cas, ref }));

  // elimina (l'autore): sparisce dall'elenco
  await pg.evaluate(() => vsApriDaEvento("vi-2")); await attesa(700);
  await pg.evaluate(async () => { const id = demoState.documenti.find(x => x.numero === 2).id; vaElimina(id); }); await attesa(300);
  await pg.evaluate(() => rispondiSiNo(true)); await attesa(500);
  const dopo = await pg.evaluate(() => ({ el: document.querySelectorAll("#va-box .va-doc").length, elim: demoState.documenti.filter(x => x.eliminato_il).length }));
  ok(dopo.el === 1 && dopo.elim === 1, "Elimina: l'allegato sparisce " + JSON.stringify(dopo));

  ok(!err.length, "nessun errore JavaScript " + JSON.stringify(err));
  await b.close();
  if(problemi.length){ console.error("\nPROVA ALLEGATI: " + problemi.length + " problemi"); process.exit(1); }
  console.log("\nPROVA ALLEGATI: tutto OK");
})();
