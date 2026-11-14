// Prova dell'ARCHIVIO e di DISEGNA E MISURA (13/11/2026, SQL 69, mockup «Archivio e Disegno»):
//  · Menu › Archivio; contenuto nuovo «Nascosto · solo tu»; + Cartella, Rinomina, Sposta; Chi lo vede (7 giorni); Elimina e Ripristina;
//  · chi lo riceve: avviso privacy con la spunta (Apri spento finché non spunti), foto dentro Equo con filigrana;
//  · Disegna: calibra (marker 25 mm), misura in cm, angolo con 3 tocchi, salva → matita nell'Archivio; Prima/dopo: tabella, copia segni, salva confronto;
//  · anche per il veterinario (stesso Archivio, colori suoi).
const path = require("path"); const { chromium } = require("playwright");
const APP = path.resolve(__dirname, "..", "index.html");
const SUPA = process.env.SUPABASE_UMD || path.join(path.dirname(require.resolve("@supabase/supabase-js/package.json")), "dist", "umd", "supabase.js");
const problemi = []; const ok = (c, m) => { console.log((c ? "OK  " : "NO  ") + m); if(!c) problemi.push(m); };
async function entra(b, ruolo){
  const pg = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const err = []; pg.on("pageerror", e => err.push(String(e.message)));
  await pg.route("**/*", r => { const u = r.request().url(); if(u.includes("supabase-js")) return r.fulfill({ path: SUPA, contentType: "application/javascript" });
    if(u.startsWith("file://") || u.startsWith("data:") || u.startsWith("blob:")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + APP); await pg.waitForTimeout(1200);
  await pg.evaluate(() => startDemo()); await pg.waitForTimeout(600);
  await pg.evaluate(async r => { currentUser.ruolo = r; await enterApp(r); }, ruolo); await pg.waitForTimeout(3000);
  return { pg, err };
}
// immagine finta (zoccolo) come blob: e documento caricato con la strada di sempre
const caricaFoto = (pg, colore) => pg.evaluate(async col => {
  const cv = document.createElement("canvas"); cv.width = 800; cv.height = 600; const x = cv.getContext("2d");
  x.fillStyle = col; x.fillRect(0, 0, 800, 600); x.fillStyle = "#333"; x.beginPath(); x.moveTo(250, 150); x.lineTo(450, 150); x.lineTo(600, 500); x.lineTo(150, 500); x.fill();
  const blob = await new Promise(r => cv.toBlob(r, "image/png"));
  const cav = cavalliCartella().find(c => c.id);
  const r = await DB.caricaDocumentoPrivato({ blob, mime: "image/png", categoria: "lastra", zona: "piede_as", cavallo_nome: cav.nome, horse_id: cav.horse_id || null, cavallo_cliente_id: cav.id, autore_ruolo: "maniscalco" });
  return { id: r.id, cav: cav.nome };
}, colore);
(async () => {
  const b = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const { pg, err } = await entra(b, "maniscalco");
  const attesa = ms => pg.waitForTimeout(ms);

  /* 1. menu e archivio */
  const menu = await pg.evaluate(() => !!document.getElementById("menu-archivio-row") && /Archivio/.test(document.getElementById("menu-archivio-row").textContent));
  ok(menu, "Menu: riga «Archivio»");
  const f1 = await caricaFoto(pg, "#c8b48a");
  await pg.evaluate(() => apriArchivio()); await attesa(800);
  const a1 = await pg.evaluate(() => ({ aperto: document.getElementById("arc-pagina")?.classList.contains("aperto"), righe: document.querySelectorAll("#arc-pagina .arc-lista .arc-riga").length,
    vis: document.querySelector("#arc-pagina .arc-vis")?.textContent.trim(), chips: [...document.querySelectorAll("#arc-pagina .arc-chip")].map(x => x.textContent), cartella: !!document.querySelector(".arc-nuova"),
    img: !!document.querySelector("#arc-pagina .arc-thumb img") }));
  ok(a1.aperto && a1.righe === 1 && /Nascosto · solo tu/.test(a1.vis) && a1.chips.join(",") === "Tutti,Foto,Lastre,Documenti,Annotati" && a1.cartella && a1.img, "Archivio: contenuto nuovo nascosto, filtri, «+ Cartella», anteprima " + JSON.stringify(a1));

  /* 2. cartella, rinomina, sposta */
  await pg.evaluate(() => arcNuovaCartella()); await attesa(300);
  await pg.fill("#arc-cart-in", "Da ricontrollare"); await pg.evaluate(() => arcCreaCartella()); await attesa(600);
  await pg.evaluate(id => arcRinomina(id), f1.id); await attesa(300);
  await pg.fill("#arc-nome-in", "Castari – controllo talloni"); await pg.evaluate(id => arcSalvaNome(id), f1.id); await attesa(600);
  await pg.evaluate(id => arcSposta(id), f1.id); await attesa(300);
  await pg.evaluate(() => arcSpostaIn(ARC.dati.cartelle[0].id)); await attesa(600);
  const a2 = await pg.evaluate(id => { const d = demoState.documenti.find(x => x.id === id); return { nome: d.nome, cart: !!d.cartella_id, n: ARC.dati.cartelle[0]?.n, tit: document.querySelector("#arc-pagina .arc-righe b")?.textContent, sotto: document.querySelector("#arc-pagina .arc-righe small")?.textContent }; }, f1.id);
  ok(a2.nome === "Castari – controllo talloni" && a2.cart && a2.n === 1 && a2.tit === a2.nome && /Lastra/.test(a2.sotto), "Rinomina (sotto il nome di Equo) e Sposta in cartella " + JSON.stringify(a2));

  /* 3. azioni e chi lo vede */
  await pg.evaluate(id => arcAzioni(id), f1.id); await attesa(400);
  const az = await pg.evaluate(() => [...document.querySelectorAll("#modal-arc-azioni .arc-az b")].map(x => x.textContent));
  ok(az.join(",") === "Disegna e misura,Rinomina,Sposta in cartella,Chi lo vede,Manda in chat,Scarica,Elimina", "Azioni sul contenuto " + JSON.stringify(az));
  await pg.evaluate(() => closeModal("modal-arc-azioni"));
  await pg.evaluate(id => arcChiLoVede(id), f1.id); await attesa(500);
  const c1 = await pg.evaluate(() => ({ righe: document.querySelectorAll("#modal-arc-chi .arc-persona").length, seg: [...document.querySelector("#modal-arc-chi .arc-persona").querySelectorAll(".arc-seg button")].map(x => x.textContent + (x.classList.contains("on") ? "*" : "")),
    autore: /lo vedi sempre/.test(document.querySelector("#modal-arc-chi .arc-autore")?.textContent || ""), sw: document.querySelector("#modal-arc-chi .arc-switch input")?.checked }));
  ok(c1.righe >= 1 && c1.seg.join(",") === "Per sempre,7 giorni,Nascosto*" && c1.autore && c1.sw === true, "Chi lo vede: persone con Per sempre / 7 giorni / Nascosto, autore sempre, avviso acceso " + JSON.stringify(c1));
  await pg.evaluate(() => arcChiScegli(0, "7g")); await attesa(150);
  const nota7 = await pg.evaluate(() => document.querySelector("#modal-arc-chi .arc-persona .arc-nota")?.textContent || "");
  await pg.evaluate(() => arcChiSalva()); await attesa(700);
  const c2 = await pg.evaluate(() => document.querySelector("#arc-pagina .arc-vis")?.textContent || "");
  // l'archivio è filtrato sulla cartella? torna alla vista generale
  ok(/poi si chiude da solo/.test(nota7) && /7 giorni · fino al/.test(c2), "7 giorni: «poi si chiude da solo», nell'Archivio «7 giorni · fino al …» " + JSON.stringify({ nota7, c2 }));

  /* 4. chi lo riceve: avviso con la spunta, foto con filigrana */
  await pg.evaluate(id => { const d = demoState.documenti.find(x => x.id === id); d._autore = d.autore_user_id; d.autore_user_id = "altro-professionista"; }, f1.id);
  pg.evaluate(id => docVisualizza(id), f1.id); await attesa(600);
  const v1 = await pg.evaluate(() => ({ av: document.getElementById("modal-arc-avviso")?.classList.contains("active"), testo: document.querySelector("#modal-arc-avviso .arc-av-testo")?.textContent,
    spento: document.getElementById("arc-av-apri")?.disabled }));
  ok(v1.av && /normativa sulla privacy/.test(v1.testo) && v1.spento === true, "Avviso privacy: testo, «Apri il documento» spento finché non spunti " + JSON.stringify(v1));
  await pg.check("#arc-av-ok"); await attesa(100);
  const acceso = await pg.evaluate(() => !document.getElementById("arc-av-apri").disabled);
  await pg.click("#arc-av-apri"); await attesa(900);
  const v2 = await pg.evaluate(id => ({ vedi: document.getElementById("arc-vedi")?.classList.contains("aperto"), cv: !!document.getElementById("arc-vedi-cv"), fil: ARC.vedi?.filigrana,
    reg: (demoState.documenti.find(x => x.id === id).avvisiAccettati || []).length, nota: document.querySelector(".arc-vedi-nota")?.textContent }), f1.id);
  ok(acceso && v2.vedi && v2.cv && /·/.test(v2.fil || "") && v2.reg === 1 && /protetto/.test(v2.nota), "Spuntato: si apre dentro Equo con filigrana (nome · data), conferma registrata " + JSON.stringify(v2));
  await pg.evaluate(() => docChiudi());
  pg.evaluate(id => docVisualizza(id), f1.id); await attesa(700);
  const v3 = await pg.evaluate(() => ({ av: document.getElementById("modal-arc-avviso")?.classList.contains("active"), vedi: document.getElementById("arc-vedi")?.classList.contains("aperto") }));
  ok(!v3.av && v3.vedi, "La seconda volta non chiede di nuovo la spunta " + JSON.stringify(v3));
  await pg.evaluate(() => docChiudi());
  await pg.evaluate(id => { const d = demoState.documenti.find(x => x.id === id); d.autore_user_id = d._autore; }, f1.id);

  /* 5. disegna: calibra, misura, angolo, salva */
  await pg.evaluate(id => dsApri(id), f1.id); await attesa(900);
  const st = await pg.evaluate(() => { const c = document.getElementById("ds-canvas").getBoundingClientRect(); const k = Math.min(c.width / 800, c.height / 600);
    return { x: c.left + (c.width - 800 * k) / 2, y: c.top + (c.height - 600 * k) / 2 }; });   // angolo in alto a sinistra della foto
  const ed = await pg.evaluate(() => ({ aperto: document.getElementById("ds-editor")?.classList.contains("aperto"), tools: [...document.querySelectorAll(".ds-tool span")].map(x => x.textContent), cal: document.querySelector(".ds-cal span")?.textContent }));
  ok(ed.aperto && ed.tools.join(",") === "Penna,Freccia,Forma,Testo,Misura,Angolo,Bilancia,Prima/dopo" && /Non calibrata/.test(ed.cal), "Editor: 8 strumenti, non calibrata " + JSON.stringify(ed));
  const drag = async (x1, y1, x2, y2) => { await pg.mouse.move(st.x + x1, st.y + y1); await pg.mouse.down(); await pg.mouse.move(st.x + (x1 + x2) / 2, st.y + (y1 + y2) / 2, { steps: 4 }); await pg.mouse.move(st.x + x2, st.y + y2, { steps: 4 }); await pg.mouse.up(); await attesa(250); };
  // calibra: 100 px dello schermo = 25 mm
  await pg.evaluate(() => dsCalibra()); await attesa(200);
  await drag(50, 50, 150, 50);
  await pg.evaluate(() => document.querySelector(".ds-scelte button").click()); await pg.evaluate(() => document.querySelector("#ds-chiedi .si").click()); await attesa(400);
  const cal = await pg.evaluate(() => ({ cal: DS.segni.cal?.mm, testo: document.querySelector(".ds-cal span")?.textContent }));
  ok(cal.cal === 25 && /marker 25 mm/.test(cal.testo), "Calibra con «Marker 25 mm» " + JSON.stringify(cal));
  await pg.evaluate(() => dsStrumento("misura")); await attesa(200);
  await drag(50, 120, 250, 120);   // 200 px = 50 mm = 5,0 cm
  await pg.evaluate(() => dsStrumento("angolo")); await attesa(200);
  for(const [x, y] of [[250, 200], [100, 200], [200, 100]]){ await pg.mouse.click(st.x + x, st.y + y); await attesa(200); }
  const seg = await pg.evaluate(() => ({ n: DS.segni.items.length, chips: [...document.querySelectorAll(".ds-chip")].map(x => x.textContent.trim()) }));
  ok(seg.n === 2 && /5,0 cm/.test(seg.chips[0]) && /45°/.test(seg.chips[1]), "Misura 5,0 cm e angolo 45° " + JSON.stringify(seg));
  await pg.evaluate(() => dsAnnulla()); await attesa(200);
  const und = await pg.evaluate(() => DS.segni.items.length);
  await pg.evaluate(() => dsRifai()); await attesa(200);
  const red = await pg.evaluate(() => DS.segni.items.length);
  ok(und === 1 && red === 2, "Annulla e Rifai " + JSON.stringify({ und, red }));
  await pg.evaluate(() => dsSalva()); await attesa(800);
  const sv = await pg.evaluate(id => ({ items: demoState.documenti.find(x => x.id === id).segni?.items?.length, chiuso: !document.getElementById("ds-editor")?.classList.contains("aperto"), matita: !!document.querySelector("#arc-pagina .arc-matita") }), f1.id);
  ok(sv.items === 2 && sv.chiuso && sv.matita, "Salva: segni nel documento (l'originale non cambia), matita nell'Archivio " + JSON.stringify(sv));

  /* 6. prima / dopo */
  const f2 = await caricaFoto(pg, "#b9a77f");
  await pg.evaluate(() => arcRicarica()); await attesa(600);
  await pg.evaluate(id => dsConfronto(id), f1.id); await attesa(800);
  const lst = await pg.evaluate(() => document.querySelectorAll("#ds-confronto .cf-scegli .arc-riga").length);
  await pg.evaluate(([a, b2]) => dsConfrontoScegli(a, b2), [f1.id, f2.id]); await attesa(900);
  await pg.evaluate(() => dsCopiaSegni()); await attesa(600);
  const cf = await pg.evaluate(() => ({ tab: [...document.querySelectorAll("#ds-confronto .cf-r")].map(x => x.textContent.replace(/\s+/g, " ").trim()), cv: document.querySelectorAll("#ds-confronto canvas").length }));
  const prima = await pg.evaluate(() => demoState.documenti.length);
  await pg.evaluate(() => dsSalvaConfronto()); await attesa(1200);
  const dopo = await pg.evaluate(() => ({ n: demoState.documenti.length, nota: demoState.documenti.slice(-1)[0]?.nota }));
  ok(lst >= 1 && cf.cv === 2 && cf.tab.length === 2 && cf.tab.some(t => /Angolo/.test(t)) && dopo.n === prima + 1 && dopo.nota === "Prima/dopo", "Prima/dopo: affiancate, copia segni, tabella, «Salva il confronto» nell'Archivio " + JSON.stringify({ lst, cf, dopo }));

  /* 7. elimina e ripristina */
  pg.evaluate(id => arcElimina(id), f2.id); await attesa(400);
  await pg.evaluate(() => rispondiSiNo(true)); await attesa(700);
  await pg.evaluate(() => { ARC.eliminati = true; arcRender(); }); await attesa(200);
  const el = await pg.evaluate(() => ({ elim: document.querySelectorAll("#arc-pagina .arc-riga.elim").length, testo: document.querySelector(".arc-elim .arc-link")?.textContent }));
  await pg.evaluate(id => arcRipristina(id), f2.id); await attesa(600);
  const rip = await pg.evaluate(id => !demoState.documenti.find(x => x.id === id).eliminato_il, f2.id);
  ok(el.elim === 1 && /Eliminati negli ultimi 30 giorni/.test(el.testo) && rip, "Elimina: in «Eliminati» per 30 giorni, poi Ripristina " + JSON.stringify({ el, rip }));
  await pg.evaluate(() => arcChiudi());
  ok(!err.length, "Maniscalco: nessun errore JavaScript " + JSON.stringify(err));

  /* 8. veterinario: stesso archivio */
  const vet = await entra(b, "veterinario");
  await vet.pg.evaluate(() => apriArchivio()); await vet.pg.waitForTimeout(700);
  const vv = await vet.pg.evaluate(() => ({ aperto: document.getElementById("arc-pagina")?.classList.contains("aperto"), pl: document.body.classList.contains("pl-vet"), bg: getComputedStyle(document.getElementById("arc-pagina")).backgroundColor,
    menu: !!document.getElementById("menu-archivio-row") }));
  ok(vv.aperto && vv.pl && vv.menu && /255, 255, 255|29, 45, 80/.test(vv.bg), "Veterinario: Archivio con i suoi colori " + JSON.stringify(vv));
  ok(!vet.err.length, "Veterinario: nessun errore JavaScript " + JSON.stringify(vet.err));
  await b.close();
  console.log(problemi.length ? "\nPROVA ARCHIVIO: " + problemi.length + " problemi" : "\nPROVA ARCHIVIO: tutto OK");
  process.exit(problemi.length ? 1 : 0);
})();
