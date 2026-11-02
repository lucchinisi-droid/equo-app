// Prova delle MAPPE DEL CAVALLO (2/11/2026): punti MTC messi dove li tocca il veterinario (nome, reattività, spostamento,
// memoria della posizione) e segni della visita standard (tipo, numero, nota); testo nel referto. Tocchi veri col mouse.
const path = require("path"); const { chromium } = require("playwright");
const APP = path.resolve(__dirname, "..", "index.html");
const SUPA = process.env.SUPABASE_UMD || path.join(path.dirname(require.resolve("@supabase/supabase-js/package.json")), "dist", "umd", "supabase.js");
const problemi = []; const ok = (c, m) => { console.log((c ? "OK  " : "NO  ") + m); if(!c) problemi.push(m); };
(async () => {
  const b = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const pg = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: false })).newPage();
  const err = []; pg.on("pageerror", e => err.push(String(e.message)));
  await pg.route("**/*", r => { const u = r.request().url(); if(u.includes("supabase-js")) return r.fulfill({ path: SUPA, contentType: "application/javascript" });
    if(u.startsWith("file://") || u.startsWith("data:")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + APP); await pg.waitForTimeout(1200);
  await pg.evaluate(() => startDemo()); await pg.waitForTimeout(600);
  await pg.evaluate(async () => { currentUser.ruolo = "veterinario"; await enterApp("veterinario"); try{ localStorage.clear(); }catch(_){} }); await pg.waitForTimeout(3500);
  const attesa = ms => pg.waitForTimeout(ms);
  // tocco sul disegno della mappa k, in proporzione (fx, fy)
  const tocca = async (k, fx, fy) => { const svg = pg.locator(`#mp-${k} .mp-svg`); await svg.scrollIntoViewIfNeeded(); const r = await svg.boundingBox();
    await pg.mouse.click(r.x + r.width * fx, r.y + r.height * fy); await attesa(250); };
  const dati = k => pg.evaluate(k => JSON.parse(JSON.stringify(VS.visita.dati[k] || [])), k);

  /* ---- MTC: punti dove li tocca il veterinario ---- */
  await pg.evaluate(() => vsApriDaEvento("vi-2")); await attesa(500);
  await pg.evaluate(() => vsNuova("mtc")); await attesa(500);
  const s0 = await pg.evaluate(() => ({ mappa: !!document.querySelector("#mp-mappa_mtc .mp-svg path"), viste: [...document.querySelectorAll("#mp-mappa_mtc .mp-viste button")].map(x => x.textContent.trim()),
    vecchi: document.querySelectorAll('[id^="vs-f-scan_"], #vs-corpo .vs-scala-r .vs-lab').length && [...document.querySelectorAll("#vs-corpo .vs-lab")].some(x => /^BL23 ·/.test(x.textContent)), pallini: document.querySelectorAll("#mp-mappa_mtc .mp-m").length }));
  ok(s0.mappa && s0.viste.join("|") === "Sinistra|Destra|Davanti|Dietro|Dall'alto" && !s0.vecchi && s0.pallini === 0, "MTC: disegno vuoto con 5 viste, niente elenco fisso dei 12 punti " + JSON.stringify(s0));

  await tocca("mappa_mtc", 0.61, 0.30);
  const nuovo = await pg.evaluate(() => ({ chiede: document.querySelector("#mp-mappa_mtc .mp-pan b")?.textContent, chips: document.querySelectorAll("#mp-mappa_mtc .mp-nomi .vs-chip").length }));
  await pg.evaluate(() => mpNome("mappa_mtc", "BL23")); await attesa(150);
  await pg.evaluate(() => mpGrado("mappa_mtc", 2)); await attesa(150);
  let d = await dati("mappa_mtc");
  const lab = await pg.evaluate(() => [...document.querySelectorAll("#mp-mappa_mtc .mp-m text")].map(t => t.textContent));
  ok(nuovo.chiede === "Che punto è?" && nuovo.chips >= 12 && d.length === 1 && d[0].n === "BL23" && d[0].g === 2 && d[0].v === "sx" && Math.abs(d[0].x - 0.61) < 0.03 && Math.abs(d[0].y - 0.30) < 0.03 && lab.includes("BL23"),
    "Tocco → «Che punto è?» → BL23, reattività 2, sulla sinistra dove ho toccato " + JSON.stringify({ nuovo, d, lab }));

  // trascinamento
  await pg.evaluate(() => mpChiudi("mappa_mtc")); await attesa(100);
  const m = await pg.locator("#mp-mappa_mtc .mp-m").boundingBox();
  await pg.mouse.move(m.x + m.width / 2, m.y + m.height / 2); await pg.mouse.down(); await pg.mouse.move(m.x + m.width / 2 + 25, m.y + m.height / 2 + 5, { steps: 6 }); await pg.mouse.up(); await attesa(250);
  const d2 = await dati("mappa_mtc");
  ok(d2.length === 1 && d2[0].x > d[0].x + 0.01, "Trascinato: il punto si sposta, non se ne crea un altro " + JSON.stringify({ prima: d[0].x, dopo: d2[0].x }));

  // nome scritto a mano + elenco sotto + altra vista
  await pg.evaluate(() => mpVista("mappa_mtc", "al")); await attesa(150);
  await tocca("mappa_mtc", 0.5, 0.55);
  await pg.evaluate(() => mpCerca("mappa_mtc", "Trigger trapezio")); await attesa(100);
  const usa = await pg.evaluate(() => [...document.querySelectorAll("#mp-mappa_mtc .mp-nomi .vs-chip")].map(x => x.textContent).find(t => /^Usa/.test(t)));
  await pg.evaluate(() => mpNome("mappa_mtc", "Trigger trapezio")); await pg.evaluate(() => mpGrado("mappa_mtc", 3)); await attesa(150);
  const el = await pg.evaluate(() => [...document.querySelectorAll("#mp-mappa_mtc .mp-el b")].map(x => x.textContent));
  const viste = await pg.evaluate(() => [...document.querySelectorAll("#mp-mappa_mtc .mp-viste button")].map(x => x.textContent.trim()));
  ok(usa === "Usa «Trigger trapezio»" && el[0] === "Trigger trapezio" && el[1] === "BL23 · Shu Rene" && viste[0] === "Sinistra 1" && viste[4] === "Dall'alto 1",
    "Nome scritto a mano, elenco per reattività, conteggio per vista " + JSON.stringify({ usa, el, viste }));
  await attesa(900);   // salvataggio della scheda

  // referto: punti reattivi nel testo
  const ref = await pg.evaluate(() => vrSezioni().flatMap(s => s.r.map(([k, v]) => s.n + " | " + k + " = " + v)).filter(x => /mappa|Punti/i.test(x)));
  ok(ref.some(x => /Punti sul cavallo = Trigger trapezio 3\/3 \(dall'alto\), BL23 2\/3 \(sinistra\)/.test(x)), "Referto: punti reattivi nel testo " + JSON.stringify(ref));

  // memoria: altra visita, BL23 dall'elenco → messo dove l'avevo messo
  const posBL23 = d2[0];
  await pg.evaluate(() => vsChiudi()); await attesa(200);
  await pg.evaluate(() => vsApriDaEvento("vi-4")); await attesa(500); await pg.evaluate(() => vsNuova("mtc")); await attesa(500);
  await pg.evaluate(() => mpElencoNomi("mappa_mtc")); await attesa(100);
  await pg.evaluate(() => mpNomePrima("mappa_mtc", "BL23")); await attesa(200);
  const d3 = await dati("mappa_mtc");
  ok(d3.length === 1 && d3[0].n === "BL23" && Math.abs(d3[0].x - posBL23.x) < 0.001 && Math.abs(d3[0].y - posBL23.y) < 0.001 && d3[0].g == null, "Memoria: BL23 dall'elenco va dove l'avevo messo l'altra volta " + JSON.stringify({ d3, posBL23 }));
  // nome senza posizione nota: si aspetta il tocco
  await pg.evaluate(() => mpElencoNomi("mappa_mtc")); await pg.evaluate(() => mpNomePrima("mappa_mtc", "SP6")); await attesa(150);
  const aspetta = await pg.evaluate(() => document.querySelector("#mp-mappa_mtc .mp-aiuto.on")?.textContent);
  await tocca("mappa_mtc", 0.75, 0.75);
  const d4 = await dati("mappa_mtc");
  ok(/dove hai trovato SP6/.test(aspetta || "") && d4.some(p => p.n === "SP6" && Math.abs(p.x - 0.75) < 0.03), "Nome senza posizione: si tocca il disegno e il punto prende quel nome " + JSON.stringify({ aspetta, d4 }));
  await pg.evaluate(() => vsChiudi()); await attesa(200);

  /* ---- visita standard: segni ---- */
  await pg.evaluate(() => vsApriDaEvento("vi-1")); await attesa(500); await pg.evaluate(() => vsNuova("standard")); await attesa(500);
  await pg.evaluate(() => { mpVista("mappa", "av"); mpTipo("mappa", "ferita"); }); await attesa(100);
  await tocca("mappa", 0.42, 0.82);
  await pg.fill("#mp-mappa .mp-nota", "escoriazione stinco"); await attesa(100);
  await pg.evaluate(() => { mpChiudi("mappa"); mpTipo("mappa", "dolore"); }); await attesa(100);
  await tocca("mappa", 0.5, 0.5);
  const sg = await dati("mappa");
  const elS = await pg.evaluate(() => [...document.querySelectorAll("#mp-mappa .mp-el button")].map(x => x.textContent.replace(/\s+/g, " ").trim()));
  await attesa(900);
  const refS = await pg.evaluate(() => vrSezioni().flatMap(s => s.r).find(([k]) => k === "Mappa del cavallo")?.[1]);
  ok(sg.length === 2 && sg[0].tipo === "ferita" && sg[0].num === 1 && sg[0].nota === "escoriazione stinco" && sg[1].tipo === "dolore" && sg[1].num === 2 && sg.every(p => p.v === "av")
    && /^1 · Ferita\s*escoriazione stinco/.test(elS[0]) && refS === "1. Ferita: escoriazione stinco (davanti); 2. Dolore (davanti)",
    "Visita standard: segni numerati con tipo e nota, nel referto " + JSON.stringify({ sg, elS, refS }));

  // tipi di campo per i modelli personali
  const tipi = await pg.evaluate(() => { vsModelloDa("vuoto"); return [...document.querySelectorAll("#vs-nc-tipo option")].map(o => o.textContent); });
  ok(tipi.includes("Mappa del cavallo · segni") && tipi.includes("Mappa del cavallo · punti"), "Modelli personali: le mappe tra i tipi di campo " + JSON.stringify(tipi.slice(-3)));
  ok(!err.length, "nessun errore JavaScript " + JSON.stringify(err));
  await b.close();
  if(problemi.length){ console.error("\nPROVA MAPPE: " + problemi.length + " problemi"); process.exit(1); }
  console.log("\nPROVA MAPPE: tutto OK");
})();
