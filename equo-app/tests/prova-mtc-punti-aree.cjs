// Prova dei PUNTI TRATTATI e delle AREE DEL CAVALLO nella scheda «Agopuntura · MTC · Fisioterapia» (4/11/2026, richieste di Laura):
// punti per meridiano con un clic (segna/togli), scritti a mano, «Come l'ultima volta», «I miei più usati»;
// aree trattate (un tocco segna, un altro toglie, lato sinistro/destro) e aree reattive (1 · 2 · 3 poi spento);
// testo nel referto; i polsi restano.
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
  await pg.evaluate(async () => { currentUser.ruolo = "veterinario"; await enterApp("veterinario"); try{ localStorage.clear(); }catch(_){} }); await pg.waitForTimeout(3500);
  const attesa = ms => pg.waitForTimeout(ms);
  const dati = k => pg.evaluate(k => JSON.parse(JSON.stringify(VS.visita.dati[k] ?? null)), k);

  await pg.evaluate(() => vsApriDaEvento("vi-2")); await attesa(500);
  await pg.evaluate(() => vsNuova("mtc")); await attesa(500);

  // Valutazione MTC: aree reattive (e i polsi restano)
  const v0 = await pg.evaluate(() => ({ aree: !!document.querySelector("#mp-aree_reattive .mp-svg polygon[data-z]"), viste: [...document.querySelectorAll("#mp-aree_reattive .mp-viste button")].map(x => x.textContent.trim()),
    chips: document.querySelectorAll("#mp-aree_reattive .mp-aree .vs-chip").length, polsi: !!document.getElementById("vs-f-polso_sx") }));
  ok(v0.aree && v0.viste.join("|") === "Sinistra|Destra" && v0.chips === 11 && v0.polsi, "Valutazione: aree reattive (sinistra/destra, 11 aree) e polsi ancora presenti " + JSON.stringify(v0));
  // tocco sul disegno: cicla 1 → 2 → 3 → spento
  const tocca = async (k, id) => { const p = pg.locator(`#mp-${k} .mp-svg polygon[data-z="${id}"]`); await p.scrollIntoViewIfNeeded(); const bb = await p.boundingBox();
    await pg.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await attesa(250); };
  await tocca("aree_reattive", "lombi"); await tocca("aree_reattive", "lombi"); await tocca("aree_reattive", "lombi");
  await tocca("aree_reattive", "collo");
  let d = await dati("aree_reattive");
  ok(d && d["lombi|sx"] === 3 && d["collo|sx"] === 1, "Aree reattive: tre tocchi = 3, un tocco = 1 " + JSON.stringify(d));
  await tocca("aree_reattive", "collo"); await tocca("aree_reattive", "collo"); await tocca("aree_reattive", "collo");
  d = await dati("aree_reattive");
  ok(!("collo|sx" in d), "Aree reattive: il quarto tocco spegne " + JSON.stringify(d));
  // lato destro dall'elenco
  await pg.evaluate(() => { mpVista("aree_reattive", "dx"); mpAreaTocca("aree_reattive", "groppa"); mpAreaTocca("aree_reattive", "groppa"); }); await attesa(200);
  d = await dati("aree_reattive");
  const testoR = await pg.evaluate(() => mpTesto(VS.campi.find(c => c.k === "aree_reattive"), VS.visita.dati.aree_reattive));
  ok(d["groppa|dx"] === 2 && testoR === "Lombi sx 3/3, Groppa dx 2/3", "Aree reattive a destra e testo per il referto: " + testoR);

  // Trattamento: punti trattati
  await pg.evaluate(() => vsTab("tratt")); await attesa(400);
  const t0 = await pg.evaluate(() => ({ campo: !!document.getElementById("vp-punti"), mer: [...document.querySelectorAll("#vp-punti .vp-mer button")].map(x => x.textContent.trim()).join(","),
    bl: document.querySelectorAll("#vp-punti .vp-griglia .vp-p").length, note: document.querySelector('label[for="vs-f-punti_altri"]')?.textContent }));
  ok(t0.campo && t0.mer === "LU,LI,ST,SP,HT,SI,BL,KID,PC,TH,GB,LIV,GV,CV,Classici" && t0.bl === 67 && t0.note === "Note sui punti", "Punti trattati: meridiani e 67 punti BL " + JSON.stringify(t0));
  const clic = async t => { await pg.evaluate(t => [...document.querySelectorAll("#vp-punti .vp-griglia .vp-p")].find(x => x.textContent.trim() === t).click(), t); await attesa(120); };
  await clic("BL18"); await clic("BL23"); await clic("BL25"); await clic("BL23");
  await pg.evaluate(() => vpMeridiano("punti", "GV")); await attesa(120); await clic("GV20");
  await pg.evaluate(() => vpMeridiano("punti", "Classici")); await attesa(120); await clic("Bai-hui");
  // scritto a mano: «st 36» diventa ST36 (dall'elenco), un nome nuovo resta com'è
  await pg.fill("#vp-cerca-punti", "st 36"); await pg.press("#vp-cerca-punti", "Enter"); await attesa(150);
  await pg.fill("#vp-cerca-punti", "Ah-shi"); await attesa(150);
  const nuovoBt = await pg.evaluate(() => document.querySelector("#vp-punti .vp-nuovo")?.textContent);
  await pg.press("#vp-cerca-punti", "Enter"); await attesa(150);
  let pt = await dati("punti");
  ok(JSON.stringify(pt) === JSON.stringify(["BL18", "BL25", "GV20", "Bai-hui", "ST36", "Ah-shi"]) && /Aggiungi «Ah-shi»/.test(nuovoBt || ""), "Un clic segna, un clic toglie; scritti a mano " + JSON.stringify({ pt, nuovoBt }));
  // ricerca: «BL2» mostra BL2 e BL20…BL29
  await pg.fill("#vp-cerca-punti", "BL2"); await attesa(150);
  const ric = await pg.evaluate(() => [...document.querySelectorAll("#vp-punti .vp-griglia .vp-p")].map(x => x.textContent.trim()));
  ok(ric[0] === "BL2" && ric.includes("BL23") && ric.includes("BL29") && !ric.includes("BL3"), "Ricerca BL2 " + ric.join(","));
  await pg.fill("#vp-cerca-punti", ""); await attesa(100);
  const sel = await pg.evaluate(() => [...document.querySelectorAll("#vp-punti .vp-scelti .vp-p")].map(x => x.textContent.replace("×", "").trim()));
  ok(sel.join(",") === "BL18,BL25,GV20,Bai-hui,ST36,Ah-shi", "Punti scelti in alto con la × " + sel.join(","));
  // più usati
  await pg.evaluate(() => vpUsati("punti")); await attesa(100);
  const usati = await pg.evaluate(() => document.querySelectorAll("#vp-punti .vp-griglia.usati .vp-p").length);
  ok(usati >= 1, "«I miei più usati» " + usati);

  // aree trattate: un tocco segna, un altro toglie
  await tocca("aree_trattate", "dorso"); await tocca("aree_trattate", "lombi"); await tocca("aree_trattate", "collo"); await tocca("aree_trattate", "collo");
  await pg.evaluate(() => { mpVista("aree_trattate", "dx"); mpAreaTocca("aree_trattate", "lombi"); }); await attesa(150);
  const at = await dati("aree_trattate");
  const testoT = await pg.evaluate(() => mpTesto(VS.campi.find(c => c.k === "aree_trattate"), VS.visita.dati.aree_trattate));
  ok(at["dorso|sx"] === 1 && at["lombi|sx"] === 1 && !("collo|sx" in at) && testoT === "Dorso (sx), Lombi (sx e dx)", "Aree trattate e testo: " + testoT);

  // referto: punti e aree nelle sezioni; disegni nel PDF
  const ref = await pg.evaluate(() => JSON.stringify(vrSezioni()));
  ok(/BL18, BL25, GV20, Bai-hui, ST36, Ah-shi/.test(ref) && /Dorso \(sx\), Lombi \(sx e dx\)/.test(ref) && /Lombi sx 3\/3/.test(ref), "Referto: punti e aree " + ref.slice(0, 300));
  const img = await pg.evaluate(async () => (await mpImmaginiPdf()).map(x => x.titolo));
  ok(img.includes("Aree reattive · Sinistra") && img.includes("Aree reattive · Destra") && img.includes("Aree trattate · Sinistra"), "PDF: disegni delle aree " + img.join(" | "));

  // «Come l'ultima volta»: punti della visita precedente dello stesso cavallo
  await pg.evaluate(() => { VS.precedenti = [{ dati: { punti: ["LIV3", "BL18"] } }]; VS.visita.dati.punti = ["BL18"]; vsTab("tratt"); }); await attesa(300);
  await pg.evaluate(() => vpComeUltima("punti")); await attesa(150);
  pt = await dati("punti");
  ok(JSON.stringify(pt) === JSON.stringify(["BL18", "LIV3"]), "«Come l'ultima volta» aggiunge i punti mancanti " + JSON.stringify(pt));

  ok(!err.length, "nessun errore JavaScript " + JSON.stringify(err));
  await b.close();
  if(problemi.length){ console.error("\nPROVA PUNTI E AREE: " + problemi.length + " problemi"); process.exit(1); }
  console.log("\nPROVA PUNTI E AREE: tutto OK");
})();
