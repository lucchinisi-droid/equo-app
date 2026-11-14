// Prova: FOTO E LASTRE dentro il PDF del referto (14/11/2026, scelta B di Simone):
// tutte le immagini allegate entrano nel PDF, con i segni e la legenda numerata dove ci sono; PDF e video restano solo nell'elenco.
const path = require("path"); const { chromium } = require("playwright");
const APP = path.resolve(__dirname, "..", "index.html");
const SUPA = process.env.SUPABASE_UMD || path.join(path.dirname(require.resolve("@supabase/supabase-js/package.json")), "dist", "umd", "supabase.js");
const problemi = []; const ok = (c, m) => { console.log((c ? "OK  " : "NO  ") + m); if(!c) problemi.push(m); };
(async () => {
  const b = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const pg = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const err = []; pg.on("pageerror", e => err.push(String(e.message)));
  await pg.route("**/*", r => { const u = r.request().url(); if(u.includes("supabase-js")) return r.fulfill({ path: SUPA, contentType: "application/javascript" });
    if(u.startsWith("file://") || u.startsWith("data:") || u.startsWith("blob:")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + APP); await pg.waitForTimeout(1200);
  await pg.evaluate(() => startDemo()); await pg.waitForTimeout(600);
  await pg.evaluate(async () => { currentUser.ruolo = "veterinario"; await enterApp("veterinario"); }); await pg.waitForTimeout(3500);
  await pg.evaluate(() => {
    class FintoPdf { constructor(){ this.t = []; this.img = []; } text(x){ this.t.push([].concat(x).join(" ")); } splitTextToSize(s){ return String(s).match(/.{1,60}(\s|$)/g) || [String(s)]; }
      addImage(u, f, x, y, w, h){ this.img.push({ data: String(u).slice(0, 22), w, h }); } output(){ window.__pdf = this; return new Blob([this.t.join("\n")], { type: "application/pdf" }); } }
    ["setFillColor", "rect", "setTextColor", "setFont", "setFontSize", "setDrawColor", "setLineWidth", "line", "addPage", "save"].forEach(m => { FintoPdf.prototype[m] = function(){}; });
    window.caricaJsPdf = async () => FintoPdf;
  });
  await pg.evaluate(() => vsApriDaEvento("vi-2")); await pg.waitForTimeout(500);
  await pg.evaluate(() => vsNuova("standard")); await pg.waitForTimeout(300);
  const r = await pg.evaluate(async () => {
    const foto = async col => { const cv = document.createElement("canvas"); cv.width = 600; cv.height = 400; const x = cv.getContext("2d"); x.fillStyle = col; x.fillRect(0, 0, 600, 400);
      return URL.createObjectURL(await new Promise(r => cv.toBlob(r, "image/png"))); };
    const base = { autore_user_id: currentUser.id, data_documento: "2026-11-14", creato_il: new Date().toISOString(), accessi: [] };
    const docs = [
      { ...base, id: "rf-1", mime: "image/png", categoria: "lastra", titolo: "Castari · 14 nov 2026 · Lastra · Piede ASx", nome: "Lastra 1", url: await foto("#333"),
        segni: { v: 1, cal: { mmPx: 0.25, mm: 25, rif: "marker 25 mm", p: [[0.1, 0.1], [0.3, 0.1]] }, items: [{ id: "a", t: "misura", c: "#f0c05e", s: 3, p: [[0.1, 0.5], [0.6, 0.5]], nota: "Parete" }, { id: "b", t: "testo", c: "#e2685f", s: 3, p: [[0.5, 0.8]], testo: "talloni bassi" }] } },
      { ...base, id: "rf-2", mime: "image/png", categoria: "lastra", titolo: "Castari · 14 nov 2026 · Lastra · Piede ASx (2)", url: await foto("#555") },
      { ...base, id: "rf-3", mime: "application/pdf", categoria: "esame", titolo: "Castari · 14 nov 2026 · Esame", url: "blob:x" }
    ];
    (demoState.documenti = demoState.documenti || []).push(...docs);
    VA.lista = docs; VR.alleg = new Set(docs.map(d => d.id));
    await vrCreaPdf();
    const p = window.__pdf;
    return { img: p.img.length, testi: p.t.filter(t => /FOTO E LASTRE|Parete|talloni|Calibrata|Lastra 1|Esame|non inclusa/.test(t)) };
  });
  ok(r.img === 2, "Nel PDF le 2 immagini allegate (con e senza segni), non il PDF dell'esame " + JSON.stringify(r.img));
  ok(r.testi.some(t => t === "FOTO E LASTRE") && r.testi.some(t => /1 · Parete 7,5 cm/.test(t)) && r.testi.some(t => /2 · talloni bassi/.test(t)) && r.testi.some(t => /Calibrata su marker\s+25 mm/.test(t)),
    "Sezione «FOTO E LASTRE» con la legenda numerata e la calibrazione " + JSON.stringify(r.testi));
  ok(r.testi.some(t => /Esame/.test(t)) && !r.testi.some(t => /non inclusa/.test(t)), "PDF dell'esame solo nell'elenco degli allegati; nessuna immagine persa");
  ok(!err.length, "Nessun errore JavaScript " + JSON.stringify(err));
  await b.close();
  console.log(problemi.length ? "\nPROVA REFERTO FOTO: " + problemi.length + " problemi" : "\nPROVA REFERTO FOTO: tutto OK");
  process.exit(problemi.length ? 1 : 0);
})();
