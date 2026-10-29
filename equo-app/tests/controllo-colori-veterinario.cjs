// Controllo colori del veterinario (29/10/2026): ogni elemento visibile di pagine, finestre e fogli; segnala i colori fuori dal mockup C.
// Uso: node tests/controllo-colori-veterinario.cjs [light|dark]   (dalla cartella equo-app). Esce con 1 se trova colori estranei.
const path = require("path");
const { chromium } = require("playwright");
const APP = path.resolve(__dirname, "..", "index.html");
const SUPABASE = process.env.SUPABASE_UMD || path.join(path.dirname(require.resolve("@supabase/supabase-js/package.json")), "dist", "umd", "supabase.js");
const OK = ["#ffffff","#f7f4ee","#fffdfa","#e6e0d4","#1d2d50","#2b3f6b","#24375e","#3a4e7a","#7fd1c9","#2e8f88","#e3f4f2","#1f6e68","#c9a96e","#f4eee1","#8a6d2e","#ede8dd","#1a2236","#677086","#b9c3d9","#a9443b","#fbf0ee","#12233f","#f3d9d5","#e3b5ae","#000000"];
const tema = process.argv[2] || "light";
(async () => {
  const b = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const pg = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await pg.route("**/*", r => { const u = r.request().url(); if(u.includes("supabase-js")) return r.fulfill({ path: SUPABASE, contentType: "application/javascript" }); if(u.startsWith("file://") || u.startsWith("data:")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + APP); await pg.waitForTimeout(1200);
  await pg.evaluate(() => startDemo()); await pg.waitForTimeout(600);
  await pg.evaluate(async (t) => { try{ localStorage.setItem("equo-cookie", "rifiuta"); }catch(e){} document.documentElement.setAttribute("data-theme", t === "dark" ? "dark" : "light"); currentUser.ruolo = "veterinario"; await enterApp("veterinario"); }, tema);
  await pg.waitForTimeout(3500);
  await pg.evaluate((t) => { if(t === "dark") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", "light"); }, tema);
  const raccogli = (nome) => pg.evaluate(({ OK, nome }) => {
    const hex = c => { const m = c.match(/rgba?\(([^)]+)\)/); if(!m) return null; const p = m[1].split(",").map(x => parseFloat(x)); if(p.length > 3 && p[3] < 0.05) return null;
      return "#" + p.slice(0, 3).map(x => Math.round(x).toString(16).padStart(2, "0")).join(""); };
    const sel = el => el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".") : "");
    const out = {};
    document.querySelectorAll("body *").forEach(el => {
      const r = el.getBoundingClientRect(); if(!r.width || !r.height) return;
      const cs = getComputedStyle(el); if(cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) return;
      const vals = [];
      const testo = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) || el.tagName === "svg" || el.tagName === "path" || el.tagName === "I";
      if(testo){ const c = hex(cs.color); if(c) vals.push("testo " + c); if(el.tagName === "svg" || el.tagName === "path"){ const f = cs.fill.startsWith("rgb") ? hex(cs.fill) : null; if(f) vals.push("fill " + f); const s = cs.stroke.startsWith("rgb") ? hex(cs.stroke) : null; if(s) vals.push("stroke " + s); } }
      const bg = hex(cs.backgroundColor); if(bg) vals.push("sfondo " + bg);
      (cs.backgroundImage.match(/rgba?\([^)]+\)/g) || []).forEach(c => { const h = hex(c); if(h) vals.push("sfumatura " + h); });
      if(parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none"){ const h = hex(cs.borderTopColor); if(h) vals.push("bordo " + h); }
      vals.filter(v => !OK.includes(v.split(" ")[1])).forEach(v => { const k = sel(el); (out[k] = out[k] || new Set()).add(v); });
    });
    return Object.entries(out).map(([k, v]) => nome + " | " + k + " | " + [...v].join(", "));
  }, { OK, nome });
  const passi = [
    ["home", "showPage('pro-home')"], ["agenda", "showPage('pro-agenda')"], ["agenda-saldare", "scegliSchedaAgenda('saldare')"], ["agenda-prog", "scegliSchedaAgenda('prog')"], ["agenda-app", "scegliSchedaAgenda('app')"],
    ["messaggi", "showPage('pro-inbox')"], ["messaggi-colleghi", "sceltaCartellaChat('colleghi')"], ["messaggi-clienti", "sceltaCartellaChat('clienti')"],
    ["chat", "openChatThread('vc-pn')"], ["chiudi-chat", "typeof closeChatThread==='function'&&closeChatThread()"],
    ["clienti", "showPage('pro-clienti')"], ["scheda-cliente", "openClienteDetail('vc-gv')"], ["chiudi-scheda", "closeClienteDetail()"],
    ["incassi", "showPage('pro-incassi')"], ["home2", "showPage('pro-home')"],
    ["nuovo-app", "openInterventoModal(null)"], ["chiudi", "closeModal('modal-add-intervento')"],
    ["azioni-evento", "apriAzioniEvento('vi-2')"], ["chiudi2", "document.querySelectorAll('.modal-overlay.active').forEach(m=>m.classList.remove('active'))"],
    ["portami", "hmPortami()"], ["chiudi3", "hmChiudi()"], ["altro", "hmAltro()"], ["chiudi4", "hmChiudi()"], ["scadenze", "hmScadenze()"], ["chiudi5", "hmChiudi()"],
    ["piu", "document.querySelector('.pl-fab-btn, #pl-fab, .ai-fab, .hm-flot.piu')?.click()"], ["chiudi6", "document.querySelectorAll('.modal-overlay.active').forEach(m=>m.classList.remove('active'));typeof hmChiudi==='function'&&hmChiudi()"],
    ["menu", "openMenu()"], ["chiudi7", "closeModal('modal-menu')"], ["codice", "openCodicePersonaleModal()"], ["chiudi8", "document.querySelectorAll('.modal-overlay.active').forEach(m=>m.classList.remove('active'))"],
    ["cavallo", "showPage('pro-clienti');apriCavalloDaCartella('vc-gv','vv-au','')"], ["chiudi9", "typeof chiudiSchedaCavalloPro==='function'&&chiudiSchedaCavalloPro();closeClienteDetail()"],
    ["incassi-sald", "showPage('pro-incassi');document.querySelectorAll('#page-pro-incassi button')[1]?.click()"],
    ["cerca", "apriCercaTutto()"], ["chiudi10", "document.querySelectorAll('.modal-overlay.active').forEach(m=>m.classList.remove('active'))"],
    ["galeno", "openAiSheet()"]
  ];
  let tutto = [];
  for(const [nome, js] of passi){
    try{ await pg.evaluate(js); }catch(e){ tutto.push(nome + " | ERRORE " + e.message.slice(0, 80)); }
    await pg.waitForTimeout(700);
    if(!nome.startsWith("chiudi")) tutto = tutto.concat(await raccogli(nome));
  }
  const visti = new Set(); const fuori = tutto.filter(r => { const k = r.split(" | ").slice(1).join("|"); if(visti.has(k)) return false; visti.add(k); return true; });
  fuori.forEach(r => console.log(r));
  console.log(fuori.length ? "Colori fuori dal mockup: " + fuori.length : "OK: solo colori del mockup (" + tema + ")");
  await b.close();
  process.exit(fuori.length ? 1 : 0);
})();
