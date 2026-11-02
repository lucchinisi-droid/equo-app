// Prova della SCHEDA DELLA VISITA del veterinario (2/11/2026): azioni della visita, «Che visita fai?», Standard, MTC/Fisio,
// I miei modelli, bozza salvata da sola, «Concludi la visita» con il «Fatto» unico; il maniscalco non vede il tasto.
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
  const attesa = ms => pg.waitForTimeout(ms);

  // 1 · azioni della visita: c'è «Scheda visita»
  await pg.evaluate(() => apriAzioniEvento("vi-2")); await attesa(300);
  const az = await pg.evaluate(() => { const b = document.getElementById("azioni-evento-scheda"); return { c: !!b, vis: b && b.style.display !== "none", t: b && b.textContent }; });
  ok(az.c && az.vis && az.t === "Scheda visita", "Azioni della visita: «Scheda visita» " + JSON.stringify(az));

  // 2 · «Che visita fai?» con le visite precedenti di Aurora
  await pg.click("#azioni-evento-scheda"); await attesa(500);
  const sc = await pg.evaluate(() => ({ aperto: document.getElementById("vs-foglio")?.classList.contains("aperto"), carte: document.querySelectorAll(".vs-carta").length,
    prec: document.querySelectorAll(".vs-prec-r").length, tit: document.getElementById("vs-titolo").textContent }));
  ok(sc.aperto && sc.carte === 3 && sc.prec === 1 && sc.tit === "Aurora", "Che visita fai?: 3 modelli, 1 visita precedente " + JSON.stringify(sc));

  // 3 · Visita standard: motivo dall'appuntamento, campi, bozza salvata da sola
  await pg.evaluate(() => vsNuova("standard")); await attesa(300);
  const st = await pg.evaluate(() => ({ sez: [...document.querySelectorAll(".vs-sez h3")].map(h => h.textContent), motivo: document.getElementById("vs-f-motivo")?.value }));
  ok(st.sez.join(",") === "Anamnesi,Esame obiettivo generale,Apparato locomotore,Diagnosi e piano" && st.motivo === "zoppia ASx", "Standard: 4 sezioni, motivo «zoppia ASx» " + JSON.stringify(st));
  await pg.fill("#vs-f-temp", "37,8"); await pg.fill("#vs-f-diagnosi", "Sospetto ascesso subsolare ASx");
  await pg.evaluate(() => vsScegli("zop_as", 2)); await attesa(1200);
  const bz = await pg.evaluate(() => demoState.visitePro.visite.filter(v => v.intervento_id === "vi-2").map(v => ({ s: v.stato, t: v.dati.temp, z: v.dati.zop_as, m: v.modello })));
  ok(bz.length === 1 && bz[0].s === "bozza" && bz[0].t === "37,8" && bz[0].z === 2, "Bozza salvata da sola " + JSON.stringify(bz));
  await pg.evaluate(() => vsChiudi()); await attesa(200);
  await pg.evaluate(() => vsApriDaEvento("vi-2")); await attesa(500);
  const ri = await pg.evaluate(() => ({ d: document.getElementById("vs-f-diagnosi")?.value, on: document.querySelector(".vs-scala button.on")?.textContent }));
  ok(ri.d === "Sospetto ascesso subsolare ASx" && ri.on === "2", "Riaperta: la bozza torna com'era " + JSON.stringify(ri));

  // 4 · Concludi la visita: conclusa + «Fatto»
  await pg.evaluate(() => { vsConcludi(); }); await attesa(900);
  // le domande del «Fatto» unico (Sì/No, riquadro del richiamo, prezzo) come nelle altre prove
  for(let i = 0; i < 4; i++){
    await pg.evaluate(() => { try{
      if(document.getElementById("eq-pop-sino")?.classList.contains("attivo")) rispondiSiNo(true);
      else if(document.getElementById("modal-prezzi")?.classList.contains("active")) rispondiPrezzi(false);
      else if(typeof richiamoConferma === "function") richiamoConferma();
    }catch(_){} }); await attesa(700);
  }
  const co = await pg.evaluate(() => ({ v: demoState.visitePro.visite.find(v => v.intervento_id === "vi-2")?.stato, i: demoState.interventiMascalcia.find(x => x.id === "vi-2")?.stato,
    aperto: document.getElementById("vs-foglio").classList.contains("aperto") }));
  ok(co.v === "conclusa" && co.i === "fatto" && !co.aperto, "Concludi: visita conclusa e appuntamento «Fatto» " + JSON.stringify(co));

  // 5 · MTC · Fisio: proposta per la seduta di Tango, 3 schede, elettroagopuntura apre Hz e minuti
  await pg.evaluate(() => vsApriDaEvento("vi-4")); await attesa(500);
  const su = await pg.evaluate(() => document.querySelector(".vs-carta.sugg b")?.textContent);
  await pg.evaluate(() => vsNuova("mtc")); await attesa(300);
  const t1 = await pg.evaluate(() => ({ tabs: [...document.querySelectorAll(".vs-tabs button")].map(b => b.textContent), punti: [...document.querySelectorAll(".vs-sez")].find(x => x.querySelector("h3").textContent.startsWith("Scansione"))?.querySelectorAll(".vs-scala").length }));
  await pg.evaluate(() => vsTab("tratt")); await attesa(200);
  const hz0 = await pg.evaluate(() => !!document.getElementById("vs-f-hz"));
  await pg.evaluate(() => vsMulti("tecnica", "Elettroagopuntura")); await attesa(200);
  const hz1 = await pg.evaluate(() => !!document.getElementById("vs-f-hz"));
  ok(su === "Agopuntura · MTC · Fisioterapia" && t1.tabs.join(",") === "Valutazione MTC,Fisioterapia,Trattamento" && t1.punti === 12 && !hz0 && hz1,
    "MTC · Fisio: proposta per Tango, 3 schede, 12 punti 0–3, Hz con l'elettroagopuntura " + JSON.stringify({ su, t1, hz0, hz1 }));
  await pg.evaluate(() => vsChiudi()); await attesa(900);

  // 6 · I miei modelli: dall'esempio «Controllo zoppia», spengo un campo, ne aggiungo uno, salvo e lo uso
  await pg.evaluate(() => vsApriDaEvento("vi-3")); await attesa(500);
  await pg.evaluate(() => vsMostraMiei()); await attesa(200);
  const es = await pg.evaluate(() => [...document.querySelectorAll(".vs-chips .vs-chip")].map(b => b.textContent).slice(0, 4));
  await pg.evaluate(() => vsModelloDaEsempio("Controllo zoppia")); await attesa(200);
  await pg.evaluate(() => { const i = VS.modello.campi.findIndex(c => c.k === "polso"); vsAccendi(i); }); await attesa(100);
  await pg.evaluate(() => { document.querySelector("#vs-nuovo-campo").open = true; });
  await pg.fill("#vs-nc-nome", "Ecografia tendine"); await pg.selectOption("#vs-nc-tipo", "testo"); await pg.evaluate(() => vsAggiungiCampo()); await attesa(100);
  await pg.evaluate(() => vsSalvaModello()); await attesa(500);
  const mo = await pg.evaluate(() => ({ modelli: demoState.visitePro.modelli.map(m => m.nome), campiScheda: [...document.querySelectorAll(".vs-campo label, .vs-campo .vs-lab")].map(l => l.textContent) }));
  ok(es.join(",") === "Controllo zoppia,Pre-acquisto,Dentale,Vaccinazione" && mo.modelli.join() === "Controllo zoppia" && mo.campiScheda.includes("Ecografia tendine") && !mo.campiScheda.includes("Polso digitale") && !mo.campiScheda.includes("Blocchi anestetici"),
    "I miei modelli: esempi, campo spento, campo aggiunto, modello usato " + JSON.stringify({ es, mo }));
  await pg.evaluate(() => vsChiudi()); await attesa(300);

  // 7 · il maniscalco non vede «Scheda visita»
  await pg.evaluate(async () => { currentUser.ruolo = "maniscalco"; currentUser.vistaAttiva = "maniscalco"; await enterApp("maniscalco"); }); await attesa(2500);
  const man = await pg.evaluate(() => { const id = Object.keys(agEventiCache)[0]; if(!id) return "nessun evento"; apriAzioniEvento(id); const b = document.getElementById("azioni-evento-scheda"); return b ? b.style.display : "assente"; });
  ok(man === "none" || man === "assente" || man === "nessun evento", "Maniscalco: niente «Scheda visita» (" + man + ")");

  ok(!err.length, "nessun errore JavaScript " + JSON.stringify(err));
  await b.close();
  if(problemi.length){ console.error("\nPROVA SCHEDA VISITA: " + problemi.length + " problemi"); process.exit(1); }
  console.log("\nPROVA SCHEDA VISITA: tutto OK");
})();
