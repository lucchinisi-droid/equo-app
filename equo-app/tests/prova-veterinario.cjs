// Prova del veterinario (29/10/2026): Home #vh, Nuovo appuntamento con Tipo e Motivo (niente ferri), Agenda, Clienti, Messaggi.
// Uso: node tests/prova-veterinario.cjs (dalla cartella equo-app)
const path = require("path");
const { chromium } = require("playwright");
const APP = path.resolve(__dirname, "..", "index.html");
const SUPABASE = process.env.SUPABASE_UMD || path.join(path.dirname(require.resolve("@supabase/supabase-js/package.json")), "dist", "umd", "supabase.js");
(async () => {
  const b = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const pg = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const err = []; pg.on("pageerror", e => err.push(String(e.message)));
  await pg.route("**/*", r => { const u = r.request().url();
    if(u.includes("supabase-js")) return r.fulfill({ path: SUPABASE, contentType: "application/javascript" });
    if(u.startsWith("file://") || u.startsWith("data:")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + APP); await pg.waitForTimeout(1200);
  await pg.evaluate(() => startDemo()); await pg.waitForTimeout(600);
  await pg.evaluate(async () => { currentUser.ruolo = "veterinario"; await enterApp("veterinario"); }); await pg.waitForTimeout(3500);
  const male = []; const ok = (c, m) => { console.log((c ? "OK  " : "NO  ") + m); if(!c) male.push(m); };
  const home = await pg.evaluate(() => ({ vh: !!document.querySelector("#vh .vh-giro"), visite: document.querySelectorAll("#vh .vh-visita").length, urg: !!document.querySelector("#vh .vh-visita.urg") }));
  ok(home.vh && home.visite === 3 && home.urg, "Home: giro di oggi, 3 prossime visite, urgenza in rosa " + JSON.stringify(home));
  await pg.evaluate(() => openInterventoModal(null)); await pg.waitForTimeout(800);
  const modal = await pg.evaluate(() => ({ tipi: [...document.querySelectorAll("#intervento-tipo option")].map(o => o.value).join(","),
    motivo: getComputedStyle(document.getElementById("intervento-tipo-altro-group")).display !== "none",
    lab: document.querySelector("#intervento-tipo-altro-group .input-label").textContent }));
  ok(modal.tipi === "visita,vaccino,urgenza,terapia,mtc,fisio,altro" && modal.motivo && modal.lab === "Motivo", "Nuovo appuntamento: tipi del veterinario e Motivo " + JSON.stringify(modal));
  await pg.evaluate(async () => {
    const sel = document.getElementById("intervento-cliente-select"); sel.value = "vc-sr"; await onInterventoClienteChange();
    document.getElementById("intervento-tipo").value = "vaccino"; toggleInterventoTipoFields();
    document.getElementById("intervento-tipo-altro").value = "influenza";
    const d = new Date(); d.setDate(d.getDate() + 3); document.getElementById("intervento-data").value = isoLocale(d);
    document.getElementById("intervento-ora").value = "10:00";
    salvaInterventoMascalcia();
  });
  await pg.waitForTimeout(900);
  // stesso promemoria del maniscalco: «Manca il prezzo» → Salva senza prezzo
  await pg.evaluate(() => { if(document.getElementById("modal-prezzi")?.classList.contains("active")) rispondiPrezzi(false); });
  await pg.waitForTimeout(1200);
  const nuovo = await pg.evaluate(() => demoState.interventiMascalcia.filter(i => i.tipo_ferratura === "vaccino" && i.tipo_altro === "influenza" && i.cliente_mascalcia_id === "vc-sr").map(i => ({ q: i.quantita_ferri, n: i.numero_ferro, s: i.stato }))[0] || null);
  ok(nuovo && nuovo.q == null && nuovo.n == null, "Salvato: vaccino · influenza, senza ferri " + JSON.stringify(nuovo));
  await pg.evaluate(() => { try{ closeModal("modal-add-intervento"); }catch(e){} showPage("pro-agenda"); }); await pg.waitForTimeout(1200);
  const ag = await pg.evaluate(() => ({ giorni: document.querySelectorAll("#ag-week .ag-tile").length, schede: !document.getElementById("ag-schede").hidden,
    urg: !!document.querySelector(".ag-gblock.vt-urg"), fissare: document.querySelector('#ag-schede [data-s="prog"] span')?.textContent }));
  ok(ag.giorni === 7 && ag.schede && ag.urg && ag.fissare === "Da fissare", "Agenda: 7 giorni, 4 schede, urgenza, «Da fissare» " + JSON.stringify(ag));
  await pg.evaluate(() => showPage("pro-clienti")); await pg.waitForTimeout(1500);
  const cl = await pg.evaluate(() => ({ filtri: [...document.querySelectorAll("#cli-cartelle button")].map(b => b.textContent).join(","), righe: document.querySelectorAll("#clienti-list .vt-cli").length,
    deve: [...document.querySelectorAll(".vt-cli-deve")].map(x => x.textContent).join(" ") }));
  ok(cl.filtri === "Tutti,Privati,Scuderie,Crediti" && cl.righe === 8 && cl.deve.includes("120"), "Clienti: filtri, 8 clienti, crediti " + JSON.stringify(cl));
  await pg.evaluate(() => vetFiltroClienti("crediti")); await pg.waitForTimeout(300);
  const cr = await pg.evaluate(() => document.querySelectorAll("#clienti-list .vt-cli").length);
  ok(cr === 3, "Clienti · Crediti: 3 clienti (" + cr + ")");
  await pg.evaluate(() => { vetFiltroClienti("tutti"); showPage("pro-inbox"); }); await pg.waitForTimeout(1500);
  const ms = await pg.evaluate(() => ({ matita: !!document.querySelector(".vt-matita"), cerca: !!document.getElementById("vt-msg-cerca"), chips: document.querySelectorAll("#inbox-list .vt-chip").length }));
  ok(ms.matita && ms.cerca && ms.chips >= 4, "Messaggi: matita, ricerca, etichette dei cavalli " + JSON.stringify(ms));
  ok(!err.length, "nessun errore JavaScript " + JSON.stringify(err));
  await b.close();
  process.exit(male.length ? 1 : 0);
})();
