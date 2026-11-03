// Prova dei DOPPIONI di clienti e cavalli (3/11/2026, caso Riccardo: «Dilan» con «Stallone» salvato due volte).
// · cliente con lo stesso nome: «Usa questo cliente» / «È un'altra persona»;
// · cavallo con lo stesso nome: tasti con parole («È lo stesso cavallo» / «È un altro cavallo: scheda nuova»), non più Sì/No.
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
  await pg.evaluate(async () => { currentUser.ruolo = "veterinario"; await enterApp("veterinario"); }); await pg.waitForTimeout(3000);
  const attesa = ms => pg.waitForTimeout(ms);
  const pop = () => pg.evaluate(() => { const p = document.getElementById("eq-pop-sino"); return { aperto: p.classList.contains("attivo"), tit: document.getElementById("sino-tit").textContent,
    testo: document.getElementById("sino-testo").textContent, si: document.getElementById("sino-si").textContent, no: document.getElementById("sino-no").textContent }; });
  const nCli = () => pg.evaluate(() => demoState.clientiMascalcia.length);
  // un cliente con un cavallo
  const esistente = await pg.evaluate(() => { const c = demoState.clientiMascalcia[0]; const cav = demoState.cavalliClientiMascalcia.find(v => v.cliente_mascalcia_id === c.id); return { nome: c.nome, cav: cav?.nome, id: c.id }; });

  /* ---- Clienti → Nuovo cliente con lo stesso nome ---- */
  const apriNuovo = async (nome, cav) => { await pg.evaluate(() => { showPage("pro-clienti"); openModal("modal-add-cliente"); }); await attesa(200);
    await pg.fill("#cliente-nome", nome); if(cav != null) await pg.fill("#cliente-cavallo", cav); await pg.evaluate(() => { createClienteMascalcia(); }); await attesa(500); };
  let n0 = await nCli();
  await apriNuovo(esistente.nome, "");
  const p1 = await pop();
  await pg.click("#sino-si"); await attesa(600);
  ok(p1.aperto && p1.tit === esistente.nome + " c'è già tra i tuoi clienti" && p1.si === "Usa questo cliente" && p1.no === "È un'altra persona" && await nCli() === n0,
    "Stesso nome: domanda con tasti chiari, «Usa questo cliente» non crea un doppione " + JSON.stringify(p1));
  n0 = await nCli();
  await apriNuovo(esistente.nome.toUpperCase() + " ", "");
  await pg.click("#sino-no"); await attesa(600);
  ok(await nCli() === n0 + 1, "«È un'altra persona» (anche scritto in maiuscolo): crea il cliente nuovo");

  /* ---- nuovo appuntamento: cliente nuovo con un cavallo che c'è già ---- */
  await pg.evaluate(() => { try{ localStorage.setItem("equo-no-promemoria-prezzo", "1"); }catch(_){} closeModal("modal-add-cliente"); openInterventoModal(null); }); await attesa(800);
  await pg.evaluate(() => { const s = document.getElementById("intervento-cliente-select"); s.value = "__nuovo__"; s.dispatchEvent(new Event("change")); }); await attesa(300);
  await pg.fill("#intervento-nuovo-cliente-nome", "Persona Nuova"); await pg.fill("#intervento-nuovo-cavallo-nome", esistente.cav);
  await pg.evaluate(() => { document.getElementById("intervento-data").value = isoLocale(new Date(Date.now() + 864e5)); const t = document.getElementById("intervento-tipo-altro"); if(t && !t.value) t.value = "controllo"; });
  const nInt = await pg.evaluate(() => demoState.interventiMascalcia.length);
  n0 = await nCli();
  await pg.evaluate(() => document.getElementById("intervento-save-btn").click()); await attesa(600);
  const p2 = await pop();
  await pg.click("#sino-si"); await attesa(800);
  const e2 = await pg.evaluate(() => document.getElementById("intervento-error").textContent);
  ok(p2.aperto && p2.si === "È lo stesso cavallo" && p2.no === "È un altro cavallo: scheda nuova" && /È lo stesso cavallo o un altro/.test(p2.testo)
    && new RegExp("c'è già sotto «" + esistente.nome + "»: scegli").test(e2) && await nCli() === n0 && await pg.evaluate(() => demoState.interventiMascalcia.length) === nInt,
    "Cavallo uguale: tasti con parole; «È lo stesso cavallo» ferma e dice quale cliente scegliere " + JSON.stringify({ p2, e2 }));
  // stesso appuntamento, «È un altro cavallo»: si salva con un cavallo nuovo
  await pg.evaluate(() => document.getElementById("intervento-save-btn").click()); await attesa(600);
  await pg.click("#sino-no"); await attesa(1200);
  ok(await pg.evaluate(() => demoState.interventiMascalcia.length) === nInt + 1, "«È un altro cavallo: scheda nuova»: appuntamento salvato");
  // appuntamento con «+ Nuovo cliente» che ha il nome di un cliente che c'è già: «Usa questo cliente» → appuntamento sul cliente esistente, nessun cliente in più
  await pg.evaluate(() => openInterventoModal(null)); await attesa(800);
  await pg.evaluate(() => { const s = document.getElementById("intervento-cliente-select"); s.value = "__nuovo__"; s.dispatchEvent(new Event("change")); }); await attesa(300);
  await pg.fill("#intervento-nuovo-cliente-nome", esistente.nome); await pg.fill("#intervento-nuovo-cavallo-nome", "Cavallo Mai Visto");
  await pg.evaluate(() => { document.getElementById("intervento-data").value = isoLocale(new Date(Date.now() + 2 * 864e5)); const t = document.getElementById("intervento-tipo-altro"); if(t && !t.value) t.value = "controllo"; });
  n0 = await nCli(); const nInt2 = await pg.evaluate(() => demoState.interventiMascalcia.length);
  await pg.evaluate(() => document.getElementById("intervento-save-btn").click()); await attesa(600);
  const p4 = await pop(); await pg.click("#sino-si"); await attesa(1200);
  const ult = await pg.evaluate(() => demoState.interventiMascalcia.slice(-1)[0]?.cliente_mascalcia_id);
  ok(p4.si === "Usa questo cliente" && await nCli() === n0 && ult === esistente.id && await pg.evaluate(() => demoState.interventiMascalcia.length) === nInt2 + 1,
    "Appuntamento: nome di un cliente esistente → «Usa questo cliente» → appuntamento su quello, nessun doppione " + JSON.stringify({ p4: p4.tit, ult }));
  // le altre domande Sì/No restano come prima
  const p3 = await pg.evaluate(async () => { const pr = chiediSiNo("Prova?", ""); const r = { si: document.getElementById("sino-si").textContent, parole: document.getElementById("eq-pop-sino").classList.contains("parole") }; rispondiSiNo(true); await pr; return r; });
  ok(p3.si === "SÌ" && !p3.parole, "Le altre domande Sì/No non cambiano " + JSON.stringify(p3));
  ok(!err.length, "nessun errore JavaScript " + JSON.stringify(err));
  await b.close();
  if(problemi.length){ console.error("\nPROVA DOPPIONI: " + problemi.length + " problemi"); process.exit(1); }
  console.log("\nPROVA DOPPIONI: tutto OK");
})();
