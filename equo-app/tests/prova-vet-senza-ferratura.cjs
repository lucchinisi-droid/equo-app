// Prova (3/11/2026): il veterinario non vede la scheda «Ferratura» del maniscalco: niente riga «Ferrato · 4 ferri · Modifica»
// nel nuovo appuntamento, niente tasto «Ferro» nei cavalli di Modifica cliente. Il maniscalco li ha ancora.
const path = require("path"); const { chromium } = require("playwright");
const APP = path.resolve(__dirname, "..", "index.html");
const SUPA = process.env.SUPABASE_UMD || path.join(path.dirname(require.resolve("@supabase/supabase-js/package.json")), "dist", "umd", "supabase.js");
const problemi = []; const ok = (c, m) => { console.log((c ? "OK  " : "NO  ") + m); if(!c) problemi.push(m); };
(async () => {
  const b = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  for(const ruolo of ["veterinario", "maniscalco"]){
    const pg = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    const err = []; pg.on("pageerror", e => err.push(String(e.message)));
    await pg.route("**/*", r => { const u = r.request().url(); if(u.includes("supabase-js")) return r.fulfill({ path: SUPA, contentType: "application/javascript" });
      if(u.startsWith("file://") || u.startsWith("data:")) return r.continue(); return r.abort(); });
    await pg.goto("file://" + APP); await pg.waitForTimeout(1200);
    await pg.evaluate(() => startDemo()); await pg.waitForTimeout(600);
    await pg.evaluate(async r => { currentUser.ruolo = r; await enterApp(r); }, ruolo); await pg.waitForTimeout(3000);
    // nuovo appuntamento con un cliente che ha cavalli
    await pg.evaluate(() => (typeof vapVia === "function" && eVeterinario() ? (VAP.via = "cliente", Promise.resolve(openInterventoModal(null)).finally(() => { VAP.via = null; })) : openInterventoModal(null))); await pg.waitForTimeout(700);
    const cli = await pg.evaluate(() => { const s = document.getElementById("intervento-cliente-select"); const o = [...s.options].find(x => x.value && !x.value.startsWith("__") && demoState.cavalliClientiMascalcia.some(v => v.cliente_mascalcia_id === x.value));
      s.value = o.value; s.dispatchEvent(new Event("change")); return o.value; }); await pg.waitForTimeout(800);
    await pg.evaluate(() => { const c = document.querySelector("#intervento-cavalli-multi .int-cav-chk"); if(c && !c.checked){ c.checked = true; c.dispatchEvent(new Event("change", { bubbles: true })); } if(typeof renderFerroRighe === "function") renderFerroRighe(); }); await pg.waitForTimeout(400);
    const righe = await pg.evaluate(() => document.querySelectorAll("#intervento-scheda-righe .int-scheda-riga").length);
    await pg.evaluate(() => closeModal("modal-add-intervento"));
    // Modifica cliente → cavalli
    await pg.evaluate(async id => { showPage("pro-clienti"); await openClienteDetail(id); await openEditCliente(); }, cli); await pg.waitForTimeout(1000);
    const ferro = await pg.evaluate(() => [...document.querySelectorAll("button")].filter(x => x.offsetParent && /^\+? ?Ferro$/.test(x.textContent.trim())).length);
    const cavalli = await pg.evaluate(() => document.querySelectorAll("button[onclick^='apriLasciaCavallo']").length);
    if(ruolo === "veterinario") ok(righe === 0 && ferro === 0 && cavalli > 0, "Veterinario: niente riga Ferratura nel nuovo appuntamento né tasto Ferro in Modifica cliente " + JSON.stringify({ righe, ferro, cavalli }));
    else ok(righe > 0 && ferro > 0, "Maniscalco: riga Ferratura e tasto Ferro ci sono ancora " + JSON.stringify({ righe, ferro }));
    ok(!err.length, ruolo + ": nessun errore JavaScript " + JSON.stringify(err));
  }
  await b.close();
  if(problemi.length){ console.error("\nPROVA VET SENZA FERRATURA: " + problemi.length + " problemi"); process.exit(1); }
  console.log("\nPROVA VET SENZA FERRATURA: tutto OK");
})();
