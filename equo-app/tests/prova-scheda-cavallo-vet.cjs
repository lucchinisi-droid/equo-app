// Prova della SCHEDA DEL CAVALLO per il veterinario (2/11/2026): Clinica e Documenti al posto di Ferratura e Allegati;
// il maniscalco resta com'era.
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
  {
    const { pg, err } = await pagina(b); const attesa = ms => pg.waitForTimeout(ms);
    await pg.evaluate(async () => { currentUser.ruolo = "veterinario"; await enterApp("veterinario"); }); await attesa(3500);
    // una visita conclusa con diagnosi e DPA, un piano attivo, un referto privato
    await pg.evaluate(async () => {
      await vsApriDaEvento("vi-2"); vsNuova("standard"); vsCambia("diagnosi", "Ascesso subsolare ASx"); vsScegli("dpa", "Non DPA"); await new Promise(r => setTimeout(r, 1000));
      ptNuovaVoce("farmaco"); document.getElementById("pt-nome").value = "Fenilbutazone"; document.getElementById("pt-dose").value = "1 bustina"; await ptSalvaVoce(); await ptAvvia(false);
      demoState.documenti = demoState.documenti || [];
      demoState.documenti.push({ id: "doc-r1", categoria: "referto", titolo: "Aurora · 2 nov 2026 · Referto", data_documento: isoLocale(new Date()), mime: "application/pdf", cavallo_cliente_id: "vv-au", autore_user_id: currentUser.id, creato_il: new Date().toISOString() },
        { id: "doc-l1", categoria: "lastra", titolo: "Aurora · 1 nov 2026 · Lastra · Piede ASx", data_documento: isoLocale(new Date()), mime: "image/jpeg", cavallo_cliente_id: "vv-au", autore_user_id: "altro", autore_ruolo: "maniscalco", creato_il: new Date().toISOString() });
      vsChiudi();
    }); await attesa(800);
    await pg.evaluate(() => { showPage("pro-clienti"); return apriCavalloDaCartella("vc-gv", "vv-au", null); }); await attesa(1500);
    const s = await pg.evaluate(() => ({ tab: [...document.querySelectorAll("#cavpro-tab button")].map(x => x.textContent), sez: [...document.querySelectorAll("#cavpro-corpo .cavpro-sez-testa > span:first-child")].map(x => x.textContent),
      ter: document.querySelector("#vc-clinica .vc-ter-t")?.textContent || "", dpa: document.querySelector("#vc-clinica .vc-dpa b")?.textContent, visite: [...document.querySelectorAll("#vc-clinica .vc-visita b")].map(x => x.textContent),
      diag: document.querySelector("#vc-clinica .vc-visita small")?.textContent, gruppi: [...document.querySelectorAll("#vc-documenti .vc-h")].map(x => x.textContent),
      docs: [...document.querySelectorAll("#vc-documenti .vc-doc small")].map(x => x.textContent), condivisi: !!document.getElementById("vc-condivisi"), ferro: !!document.querySelector(".cavpro-ferro") }));
    ok(s.tab.join("|") === "Tutto|Anagrafica|Clinica|Storico|Documenti" && s.sez.join("|").startsWith("Anagrafica|Colleghi|Clinica|Storico di Aurora|Documenti|Allegati condivisi") && !s.ferro,
      "Veterinario: tasti e sezioni (niente Ferratura; «Colleghi» dalla Fase 4) " + JSON.stringify({ tab: s.tab, sez: s.sez }));
    ok(/Terapia in corso/.test(s.ter) && s.dpa === "Non DPA" && s.visite[0] === "Visita standard · bozza" && s.diag === "Ascesso subsolare ASx", "Clinica: terapia, DPA, visite " + JSON.stringify(s));
    ok(s.gruppi.join("|") === "Referti · 1|Lastre · 1" && s.docs.join("|") === "tuo|maniscalco" && s.condivisi, "Documenti per tipo, allegati condivisi sotto " + JSON.stringify(s));
    // solo Clinica / solo Documenti
    await pg.evaluate(() => { schedaCavalloTab = "doc"; renderTabCavalloPro(); renderCorpoCavalloPro(); }); await attesa(600);
    const soloDoc = await pg.evaluate(() => [...document.querySelectorAll("#cavpro-corpo .cavpro-sez-testa > span:first-child")].map(x => x.textContent));
    ok(soloDoc.join("|") === "Documenti|Allegati condivisi", "Tasto Documenti " + JSON.stringify(soloDoc));
    // + Carica senza visita: tipo, nome dato da Equo, spazio privato
    await pg.evaluate(() => vcFile(new File([new Uint8Array(3000)], "IMG_1234.pdf", { type: "application/pdf" }))); await attesa(300);
    await pg.evaluate(() => vcImposta("categoria", "esame")); await pg.fill("#vc-nota", "emocromo"); await attesa(100);
    const nome = await pg.evaluate(() => document.getElementById("vc-nome").textContent);
    await pg.evaluate(() => vcSalva()); await attesa(800);
    const car = await pg.evaluate(() => ({ d: demoState.documenti.find(x => x.categoria === "esame"), gruppi: [...document.querySelectorAll("#vc-documenti .vc-h")].map(x => x.textContent) }));
    ok(/^Aurora · \d+ nov 2026 · Esame · emocromo$/.test(nome) && car.d && car.d.titolo === nome && !car.d.visita_id && car.d.cavallo_cliente_id === "vv-au" && car.gruppi.includes("Esami · 1"),
      "Carica senza visita: esame con nome di Equo " + JSON.stringify({ nome, gruppi: car.gruppi }));
    // dalla Clinica si apre la visita
    await pg.evaluate(() => { schedaCavalloTab = "cli"; renderTabCavalloPro(); renderCorpoCavalloPro(); }); await attesa(700);
    await pg.evaluate(() => document.querySelector("#vc-clinica .vc-visita").click()); await attesa(900);
    ok(await pg.evaluate(() => VS.schermo === "scheda" && VS.e?.id === "vi-2"), "Dalla Clinica si apre la scheda della visita");
    ok(!err.length, "Veterinario: nessun errore JavaScript " + JSON.stringify(err));
    await pg.context().close();
  }
  {
    const { pg, err } = await pagina(b); const attesa = ms => pg.waitForTimeout(ms);
    await pg.evaluate(async () => { currentUser.ruolo = "maniscalco"; await enterApp("maniscalco"); }); await attesa(2500);
    const c = await pg.evaluate(async () => { const cv = cavalliCartella()[0]; showPage("pro-clienti"); await apriCavalloDaCartella(cv.cliente_mascalcia_id, cv.id, cv.horse_id); await new Promise(r => setTimeout(r, 1200));
      return { tab: [...document.querySelectorAll("#cavpro-tab button")].map(x => x.textContent), ferro: !!document.querySelector(".cavpro-ferro"), vc: !!document.getElementById("vc-clinica") }; });
    ok(c.tab.join("|") === "Tutto|Anagrafica|Ferratura|Storico|Allegati" && c.ferro && !c.vc, "Maniscalco: scheda come prima " + JSON.stringify(c));
    ok(!err.length, "Maniscalco: nessun errore JavaScript " + JSON.stringify(err));
    await pg.context().close();
  }
  await b.close();
  if(problemi.length){ console.error("\nPROVA SCHEDA CAVALLO VET: " + problemi.length + " problemi"); process.exit(1); }
  console.log("\nPROVA SCHEDA CAVALLO VET: tutto OK");
})();
