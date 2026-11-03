// Prova di «Scorri per firmare e inviare» (3/11/2026, Simone: «il tasto non funziona»): scorrendo col dito (eventi touch veri)
// parte l'invio; un tocco chiede conferma («Firma e invia» / «Annulla»); il gesto interrotto riporta il cursore all'inizio.
const path = require("path"); const { chromium } = require("playwright");
const APP = path.resolve(__dirname, "..", "index.html");
const SUPA = process.env.SUPABASE_UMD || path.join(path.dirname(require.resolve("@supabase/supabase-js/package.json")), "dist", "umd", "supabase.js");
const problemi = []; const ok = (c, m) => { console.log((c ? "OK  " : "NO  ") + m); if(!c) problemi.push(m); };
(async () => {
  const b = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); const pg = await ctx.newPage();
  const err = []; pg.on("pageerror", e => err.push(String(e.message)));
  await pg.route("**/*", r => { const u = r.request().url(); if(u.includes("supabase-js")) return r.fulfill({ path: SUPA, contentType: "application/javascript" });
    if(u.startsWith("file://") || u.startsWith("data:")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + APP); await pg.waitForTimeout(1200);
  await pg.evaluate(() => startDemo()); await pg.waitForTimeout(600);
  await pg.evaluate(async () => { currentUser.ruolo = "veterinario"; await enterApp("veterinario"); }); await pg.waitForTimeout(3000);
  await pg.evaluate(() => { class F { constructor(){ this.t = []; } text(x){ this.t.push([].concat(x).join(" ")); } splitTextToSize(s){ return [String(s)]; } addImage(){} output(){ return new Blob(["x"], { type: "application/pdf" }); } }
    ["setFillColor", "rect", "setTextColor", "setFont", "setFontSize", "setDrawColor", "setLineWidth", "line", "addPage"].forEach(m => { F.prototype[m] = function(){}; }); window.caricaJsPdf = async () => F; });
  const apri = async () => { await pg.evaluate(() => { try{ vsChiudi(); }catch(_){} vsApriDaEvento("vi-2"); }); await pg.waitForTimeout(500); await pg.evaluate(() => vsNuova("standard")); await pg.waitForTimeout(400);
    await pg.evaluate(() => { window.__t = []; if(!window.__w){ window.__w = 1; const t = window.showToast; window.showToast = x => { __t.push(x); t(x); }; } vrApri(); }); await pg.waitForTimeout(1000);
    await pg.evaluate(() => document.getElementById("vr-scorri").scrollIntoView({ block: "center" })); await pg.waitForTimeout(200); return pg.locator("#vr-scorri").boundingBox(); };
  const cdp = await ctx.newCDPSession(pg);
  const tocchi = async (punti, fine = "touchEnd") => { await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [punti[0]] });
    for(const p of punti.slice(1)){ await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [p] }); await pg.waitForTimeout(20); }
    await cdp.send("Input.dispatchTouchEvent", { type: fine, touchPoints: [] }); };
  // 1) scorrere col dito fino in fondo → invio
  let r = await apri(); const y = r.y + r.height / 2, x0 = r.x + 29;
  await tocchi(Array.from({ length: 13 }, (_, i) => ({ x: x0 + i * (r.width - 60) / 12, y }))); await pg.waitForTimeout(1500);
  const t1 = await pg.evaluate(() => __t);
  ok(t1[0] === "Preparo e invio il referto…", "Scorrendo col dito parte l'invio " + JSON.stringify(t1));
  // 2) un tocco → conferma; «Annulla» non invia, «Firma e invia» invia
  r = await apri();
  await tocchi([{ x: r.x + r.width / 2, y: r.y + r.height / 2 }]); await pg.waitForTimeout(400);
  const dom = await pg.evaluate(() => ({ aperta: document.getElementById("eq-pop-sino").classList.contains("attivo"), tit: document.getElementById("sino-tit").textContent, si: document.getElementById("sino-si").textContent, no: document.getElementById("sino-no").textContent, testo: document.getElementById("sino-testo").textContent }));
  await pg.evaluate(() => rispondiSiNo(false)); await pg.waitForTimeout(400);
  const t2 = await pg.evaluate(() => __t.length);
  await tocchi([{ x: r.x + r.width / 2, y: r.y + r.height / 2 }]); await pg.waitForTimeout(400);
  await pg.evaluate(() => rispondiSiNo(true)); await pg.waitForTimeout(1500);
  const t3 = await pg.evaluate(() => __t);
  ok(dom.aperta && dom.tit === "Firmi e invii il referto?" && dom.si === "Firma e invia" && dom.no === "Annulla" && t2 === 0 && t3.join("|") === "Preparo e invio il referto…", "Un tocco chiede conferma: Annulla non invia, «Firma e invia» invia " + JSON.stringify({ dom, t2, t3 }));
  // 3) gesto interrotto dal telefono: il cursore torna all'inizio
  r = await apri();
  await tocchi([{ x: r.x + 29, y: r.y + r.height / 2 }, { x: r.x + 120, y: r.y + r.height / 2 }], "touchCancel"); await pg.waitForTimeout(400);
  const left = await pg.evaluate(() => document.getElementById("vr-man").style.left);
  ok(left === "5px" && (await pg.evaluate(() => __t.length)) === 0, "Gesto interrotto: cursore all'inizio, niente invio " + JSON.stringify({ left }));
  ok(!err.length, "nessun errore JavaScript " + JSON.stringify(err));
  await b.close();
  if(problemi.length){ console.error("\nPROVA REFERTO SCORRI: " + problemi.length + " problemi"); process.exit(1); }
  console.log("\nPROVA REFERTO SCORRI: tutto OK");
})();
