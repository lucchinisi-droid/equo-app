// Prova di DENTATURA, LINGUA, ARTI e ZOCCOLI (2/11/2026, mockup approvato da Simone) e dei disegni nel PDF del referto.
// Tocchi veri col mouse sui disegni.
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
    class FintoPdf { constructor(){ this.t = []; this.img = []; } text(x){ this.t.push([].concat(x).join(" ")); } splitTextToSize(s){ return [String(s)]; }
      addImage(u, f, x, y, w, h){ this.img.push({ jpeg: /^data:image\/jpeg/.test(u), f, w, h }); window.__img = this.img; } output(){ window.__testo = this.t; return new Blob([this.t.join("\n")], { type: "application/pdf" }); } }
    ["setFillColor", "rect", "setTextColor", "setFont", "setFontSize", "setDrawColor", "setLineWidth", "line", "addPage"].forEach(m => { FintoPdf.prototype[m] = function(){}; });
    window.caricaJsPdf = async () => FintoPdf;
  });
  const attesa = ms => pg.waitForTimeout(ms);
  const tocca = async (k, fx, fy) => { const svg = pg.locator(`#mp-${k} .mp-svg`); await svg.scrollIntoViewIfNeeded(); const r = await svg.boundingBox();
    await pg.mouse.click(r.x + r.width * fx, r.y + r.height * fy); await attesa(250); };
  const dati = k => pg.evaluate(k => JSON.parse(JSON.stringify(VS.visita.dati[k] ?? null)), k);
  const referto = k => pg.evaluate(k => vrSezioni().flatMap(s => s.r).find(([e]) => e === k)?.[1], k);

  /* ---- visita standard: arti e zoccoli ---- */
  await pg.evaluate(() => vsApriDaEvento("vi-1")); await attesa(500); await pg.evaluate(() => vsNuova("standard")); await attesa(600);
  const s0 = await pg.evaluate(() => { const sez = [...document.querySelectorAll("#vs-corpo .vs-sez")].find(s => s.querySelector("h3").textContent === "Apparato locomotore");
    return { mappe: [...sez.querySelectorAll(".mp .mp-tit")].map(x => x.textContent), viste: [...document.querySelectorAll("#mp-arti .mp-viste button")].map(x => x.textContent.trim()),
      tipi: [...document.querySelectorAll("#mp-arti .mp-tipi button")].map(x => x.textContent), bande: [...document.querySelectorAll("#mp-arti .mp-svg text")].map(t => t.textContent).filter(t => /^(1A|3C|P2)$/.test(t)),
      zoc: [...document.querySelectorAll("#mp-zoccoli .mp-viste button")].map(x => x.textContent.trim()) }; });
  ok(s0.mappe.join("|") === "Arti · tendini|Zoccoli · suola" && s0.viste.join("|") === "Ant. sinistro|Ant. destro|Post. sinistro|Post. destro" && s0.tipi[0] === "Lesione"
    && s0.bande.join("|") === "1A|3C|P2" && s0.zoc.join("|") === "ASx|ADx|PSx|PDx", "Standard: arti (4 lati, zone 1A–P2) e zoccoli (4 piedi) in Apparato locomotore " + JSON.stringify(s0));

  // lesione sulla vista palmare all'altezza della zona 2B (y 465–535 su 1086), poi gonfiore sulla laterale del destro
  await tocca("arti", 980 / 1448, 500 / 1086);
  await pg.fill("#mp-arti .mp-nota", "TFDS lesione centrale"); await attesa(100);
  await pg.evaluate(() => { mpChiudi("arti"); mpVista("arti", "ad"); mpTipo("arti", "gonfiore"); }); await attesa(150);
  const spec = await pg.evaluate(() => ({ clip: document.querySelectorAll("#mp-arti clipPath").length, flip: !!document.querySelector('#mp-arti g[transform^="translate(940,0) scale(-1,1)"]') }));
  await tocca("arti", 440 / 1448, 1000 / 1086);
  const ar = await dati("arti"); const refA = await referto("Arti · tendini");
  const pan = await pg.evaluate(() => document.querySelector("#mp-arti .mp-pan small")?.textContent);
  ok(ar.length === 2 && ar[0].v === "as" && ar[0].z === "2B" && ar[0].tipo === "lesione" && ar[1].v === "ad" && !ar[1].z && spec.clip === 2 && spec.flip
    && refA === "1. Lesione: TFDS lesione centrale (ant. sinistro, zona 2B); 2. Gonfiore (ant. destro)",
    "Arti: zona 2B da sola, destro con la laterale specchiata, testo nel referto " + JSON.stringify({ ar, spec, refA, pan }));
  // trascinando il segno cambia la zona
  await pg.evaluate(() => { mpVista("arti", "as"); }); await attesa(150);
  const m = await pg.locator("#mp-arti .mp-m").boundingBox(); const svgB = await pg.locator("#mp-arti .mp-svg").boundingBox();
  await pg.mouse.move(m.x + m.width / 2, m.y + m.height / 2); await pg.mouse.down();
  await pg.mouse.move(m.x + m.width / 2, svgB.y + svgB.height * (620 / 1086), { steps: 6 }); await pg.mouse.up(); await attesa(250);
  const ar2 = await dati("arti");
  ok(ar2[0].z === "3B", "Arti: spostato più in basso diventa zona 3B " + JSON.stringify(ar2[0]));

  // zoccoli: PSx ritagliato sul posteriore, DX specchiato
  await pg.evaluate(() => { mpVista("zoccoli", "ps"); mpTipo("zoccoli", "ascesso"); }); await attesa(150);
  const vb = await pg.evaluate(() => document.querySelector("#mp-zoccoli .mp-svg").getAttribute("viewBox"));
  await tocca("zoccoli", 0.5, 0.35);
  await pg.evaluate(() => { mpChiudi("zoccoli"); mpVista("zoccoli", "ad"); mpTipo("zoccoli", "contusione"); }); await attesa(150);
  const vbD = await pg.evaluate(() => ({ vb: document.querySelector("#mp-zoccoli .mp-svg").getAttribute("viewBox"), flip: !!document.querySelector('#mp-zoccoli g[transform="translate(800,0) scale(-1,1)"]') }));
  await tocca("zoccoli", 0.3, 0.8);
  const zo = await dati("zoccoli"); const refZ = await referto("Zoccoli · suola");
  ok(vb === "795 130 615 830" && vbD.vb === "15 130 770 830" && vbD.flip && zo.length === 2 && zo[0].v === "ps" && Math.abs(zo[0].x - 0.5) < 0.03 && zo[1].v === "ad"
    && refZ === "1. Ascesso (PSx); 2. Contusione (ADx)", "Zoccoli: piede scelto, destro specchiato, testo nel referto " + JSON.stringify({ vb, vbD, zo, refZ }));
  await attesa(900);

  // PDF: un disegno per ogni vista segnata (arti: ant. sx e ant. dx; zoccoli: PSx e ADx)
  await pg.evaluate(async () => { window.__img = []; await vrCreaPdf(); }); await attesa(300);
  const pdf = await pg.evaluate(() => ({ img: window.__img, testo: (window.__testo || []).filter(t => /DISEGNI|Arti · tendini ·|Zoccoli · suola ·/.test(t)) }));
  ok(pdf.img.length === 4 && pdf.img.every(i => i.jpeg && i.w > 10 && i.h > 10) && pdf.testo.join("|") === "DISEGNI|Arti · tendini · Ant. sinistro|Arti · tendini · Ant. destro|Zoccoli · suola · ADx|Zoccoli · suola · PSx",
    "PDF del referto: sezione DISEGNI con le 4 viste segnate " + JSON.stringify(pdf));
  await pg.evaluate(() => vsChiudi()); await attesa(200);

  /* ---- MTC: lingua per zone ---- */
  await pg.evaluate(() => vsApriDaEvento("vi-2")); await attesa(500); await pg.evaluate(() => vsNuova("mtc")); await attesa(600);
  const l0 = await pg.evaluate(() => ({ zone: [...document.querySelectorAll("#mp-lingua_zone .mp-z")].map(z => z.dataset.z), vecchi: !!document.getElementById("vs-f-lingua") || [...document.querySelectorAll("#vs-corpo .vs-lab")].some(x => x.textContent === "Patina") }));
  // punta: in basso al centro; il lato sinistro del cavallo è a destra di chi guarda
  await tocca("lingua_zone", 541 / 1086, 1166 / 1448);
  const tit = await pg.evaluate(() => document.querySelector("#mp-lingua_zone .mp-pan-t b")?.textContent);
  await pg.evaluate(() => { mpZonaScegli("lingua_zone", "colore", "Rossa"); mpZonaScegli("lingua_zone", "umidita", "Secca"); }); await attesa(100);
  await tocca("lingua_zone", 541 / 1086, 675 / 1448);
  await pg.evaluate(() => { mpZonaScegli("lingua_zone", "patina", "Spessa"); mpZonaScegli("lingua_zone", "patina_c", "Gialla"); mpZonaSegno("lingua_zone", "Impronte dei denti"); }); await attesa(100);
  await tocca("lingua_zone", 690 / 1086, 675 / 1448);
  const tit2 = await pg.evaluate(() => document.querySelector("#mp-lingua_zone .mp-pan-t b")?.textContent);
  await pg.evaluate(() => mpChiudi("lingua_zone"));
  const li = await dati("lingua_zone"); const refL = await referto("Lingua per zone");
  const el = await pg.evaluate(() => [...document.querySelectorAll("#mp-lingua_zone .mp-el b")].map(x => x.textContent));
  ok(l0.zone.length === 5 && !l0.vecchi && tit === "Punta" && tit2 === "Lato sinistro" && li.punta.colore === "Rossa" && li.centro.patina_c === "Gialla"
    && refL === "Punta (Cuore/Polmone): rossa, secca; Centro (Milza/Stomaco): patina spessa gialla, impronte dei denti" && el.join("|") === "Punta · Cuore / Polmone|Centro · Milza / Stomaco",
    "Lingua: 5 zone sul disegno, scelte per zona, testo nel referto, vecchi campi nascosti " + JSON.stringify({ l0, tit, tit2, li, refL, el }));
  await attesa(900); await pg.evaluate(() => vsChiudi()); await attesa(200);

  /* ---- modello Dentale: dentatura Triadan ---- */
  await pg.evaluate(() => vsApriDaEvento("vi-4")); await attesa(500);
  await pg.evaluate(() => vsModelloDaEsempio("Dentale")); await attesa(150);
  await pg.evaluate(() => vsSalvaModello()); await attesa(900);
  const d0 = await pg.evaluate(() => ({ modello: VS.visita?.modello_nome, denti: document.querySelectorAll("#mp-denti .mp-z").length, nomi: [...document.querySelectorAll("#mp-denti .mp-svg text")].map(t => t.textContent).filter(t => /^\d{3}$/.test(t)).length }));
  // 106 (secondo premolare sup. dx): a sinistra di chi guarda, in alto
  const p106 = await pg.evaluate(() => MP_DENTI["106"]);
  await tocca("denti", p106.x / 887, p106.y / 1774);
  const t106 = await pg.evaluate(() => document.querySelector("#mp-denti .mp-pan-t b")?.textContent);
  await pg.evaluate(() => { mpDente("denti", "punte"); mpDente("denti", "limato"); }); await attesa(100);
  const col106 = await pg.evaluate(() => document.querySelector('#mp-denti .mp-z[data-z="106"]').getAttribute("fill"));
  await pg.evaluate(() => mpDenteVicino("denti", 1)); await attesa(100);
  const dopo = await pg.evaluate(() => document.querySelector("#mp-denti .mp-pan-t b")?.textContent);
  await pg.evaluate(() => { mpSelezionaZona("denti", "409"); }); await attesa(100);
  await pg.evaluate(() => { mpDente("denti", "gancio"); mpDente("denti", "mancante"); }); await attesa(100);
  const de = await dati("denti"); const refD = await referto("Dentatura");
  ok(d0.modello === "Dentale" && d0.denti === 42 && d0.nomi === 42 && t106 === "106 · secondo premolare sup. dx" && col106 === "#2E8F88" && dopo.startsWith("107 ·")
    && JSON.stringify(de["106"].s) === '["punte","limato"]' && JSON.stringify(de["409"].s) === '["mancante"]'
    && refD === "106 punte di smalto, limato oggi; 409 mancante", "Dentatura: 42 denti Triadan, stato per dente, colore, testo nel referto " + JSON.stringify({ d0, t106, col106, dopo, de, refD }));
  // tipi di campo per i modelli personali
  const tipi = await pg.evaluate(() => { vsModelloDa("vuoto"); return [...document.querySelectorAll("#vs-nc-tipo option")].map(o => o.textContent); });
  ok(["Arti · tendini", "Zoccoli · suola", "Dentatura", "Lingua per zone"].every(t => tipi.includes(t)), "Modelli personali: arti, zoccoli, dentatura, lingua tra i tipi di campo");
  ok(!err.length, "nessun errore JavaScript " + JSON.stringify(err));
  await b.close();
  if(problemi.length){ console.error("\nPROVA MAPPE 2: " + problemi.length + " problemi"); process.exit(1); }
  console.log("\nPROVA MAPPE 2: tutto OK");
})();
