// Equo App · veterinario · MAPPE DEL CAVALLO (2/11/2026, decisioni di Simone)
// Un solo componente per i disegni: cavallo in 5 viste (sinistra, destra = sinistra specchiata, davanti, dietro, dall'alto).
// Campo della scheda visita di tipo «mappa», in due modi:
//  · punti (agopuntura/MTC): il veterinario tocca il disegno DOVE trova il punto, sceglie il nome (elenco con ricerca o scritto
//    a mano) e la reattività 0–3. Nessuna posizione decisa da Equo: la volta dopo propone dove LUI l'aveva messo;
//  · segni (dolore, ferita, gonfiore, altro): tocca il disegno, numero progressivo, nota, foto dagli allegati.
// I pallini si spostano trascinandoli. Dati nella scheda (dati[k] = [{ id, v, x, y, n, g, tipo, num, nota }], x e y da 0 a 1): niente SQL.
// Dopo: dentatura, lingua, arti, zoccoli con lo stesso componente; disegno nel PDF del referto.

import { VS, vsCambia } from "./07-scheda-visita.js";
import { MP_DISEGNI } from "./13a-mappe-disegni.js";

const mpEsc = s => escapeHtml(s == null ? "" : String(s));
const mpJs = s => mpEsc(JSON.stringify(s));
const MP_VISTE = [["sx", "Sinistra"], ["dx", "Destra"], ["av", "Davanti"], ["po", "Dietro"], ["al", "Dall'alto"]];
const MP_NOME_VISTA = Object.fromEntries(MP_VISTE);
const MP_TIPI = [["dolore", "Dolore", "#A9443B"], ["ferita", "Ferita", "#C9A96E"], ["gonfiore", "Gonfiore", "#2E8F88"], ["altro", "Altro", "#677086"]];
const MP_GRADI = ["#B9C3D9", "#7FD1C9", "#C9A96E", "#A9443B"];   // reattività 0 · 1 lieve · 2 media · 3 forte
const MP_NOMI_GRADO = ["0", "1 lieve", "2 media", "3 forte"];
// elenco proposto (nomi, non posizioni): i punti diagnostici della scheda MTC e i più usati; il veterinario aggiunge i suoi
const MP_PUNTI = [["GV20", "Bai-hui"], ["BL13", "Shu Polmone"], ["BL14", "Shu Pericardio"], ["BL15", "Shu Cuore"], ["BL17", "Shu Diaframma"], ["BL18", "Shu Fegato"],
  ["BL19", "Shu Vescica biliare"], ["BL20", "Shu Milza"], ["BL21", "Shu Stomaco"], ["BL22", "Shu Triplice riscaldatore"], ["BL23", "Shu Rene"], ["BL25", "Shu Grosso intestino"],
  ["BL27", "Shu Intestino tenue"], ["BL28", "Shu Vescica"], ["GB21", "Base del collo"], ["SI9", "Spalla"], ["GB34", "Grassella"], ["ST36", "Sotto la grassella"],
  ["SP6", "Sopra il garretto"], ["LI4", "Arto anteriore"], ["KID1", "Bulbi del tallone"], ["C", "Cervicale"]];
const MP = {};           // stato per campo: { vista, tipo, sel, zoom, attesaNome, cerca }
const mpStato = k => (MP[k] = MP[k] || { vista: "sx", tipo: "dolore", sel: null, zoom: false, attesaNome: null, cerca: "" });
const mpCampo = k => (VS.campi || []).find(c => c.k === k) || { k, modo: "segni" };
const mpVal = k => { const v = VS.visita?.dati?.[k]; return Array.isArray(v) ? v : []; };
const mpId = () => "m" + Math.random().toString(36).slice(2, 9);

/* ---------------- memoria dei punti: dove il veterinario li mette ---------------- */
const mpChiaveMem = () => "equo-mtc-punti-" + (currentUser?.id || "x");
function mpMemLeggi(){ try{ return JSON.parse(localStorage.getItem(mpChiaveMem()) || "{}") || {}; }catch(_){ return {}; } }
function mpMemScrivi(p){ if(!p?.n) return; try{ const m = mpMemLeggi(); m[p.n] = { v: p.v, x: p.x, y: p.y }; localStorage.setItem(mpChiaveMem(), JSON.stringify(m)); }catch(_){} }
// prima le visite precedenti dello stesso cavallo, poi l'ultima posizione usata dal veterinario
function mpPosizioneNota(k, nome){
  for(const pr of VS.precedenti || []){ const l = pr.dati && Array.isArray(pr.dati[k]) ? pr.dati[k] : []; const p = l.find(x => x.n === nome); if(p) return { v: p.v, x: p.x, y: p.y }; }
  return mpMemLeggi()[nome] || null;
}
function mpNomiNoti(k){
  const l = MP_PUNTI.map(([c, n]) => ({ c, n }));
  const extra = new Set(Object.keys(mpMemLeggi()));
  (VS.precedenti || []).forEach(pr => (Array.isArray(pr.dati?.[k]) ? pr.dati[k] : []).forEach(p => p.n && extra.add(p.n)));
  extra.forEach(c => { if(!l.some(x => x.c === c)) l.push({ c, n: "" }); });
  return l;
}

/* ---------------- disegno ---------------- */
function mpSvg(k, sola){
  const st = mpStato(k), c = mpCampo(k), vista = st.vista, dis = MP_DISEGNI[vista === "dx" ? "sx" : vista];
  const sag = vista === "dx" ? `<g transform="translate(${dis.w},0) scale(-1,1)"><path d="${dis.d}"/></g>` : `<path d="${dis.d}"/>`;
  const r = Math.round(Math.max(dis.w, dis.h) * 0.017);
  const segni = mpVal(k).filter(p => p.v === vista).map(p => {
    const x = p.x * dis.w, y = p.y * dis.h, sel = st.sel === p.id;
    const col = c.modo === "punti" ? (p.g == null ? "#FFFFFF" : MP_GRADI[p.g]) : (MP_TIPI.find(t => t[0] === p.tipo) || MP_TIPI[3])[2];
    const testo = c.modo === "punti" ? (p.g > 0 || sel ? (p.n || "?") : "") : String(p.num || "");
    return `<g class="mp-m${sel ? " sel" : ""}" data-id="${mpEsc(p.id)}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
      ${sel ? `<circle r="${r * 1.9}" fill="none" stroke="#1D2D50" stroke-width="${r * 0.25}"/>` : ""}
      <circle r="${sel ? r * 1.3 : r}" fill="${col}" stroke="${c.modo === "punti" && p.g == null ? "#1D2D50" : "#FFFFFF"}" stroke-width="${r * 0.3}"/>
      ${c.modo === "segni" ? `<text y="${r * 0.42}" text-anchor="middle" font-size="${r * 1.2}" font-weight="800" fill="#FFFFFF">${mpEsc(testo)}</text>`
        : testo ? `<text y="${-r * 1.6}" text-anchor="middle" font-size="${r * 1.35}" font-weight="800" fill="#1D2D50" stroke="#FFFFFF" stroke-width="${r * 0.45}" paint-order="stroke">${mpEsc(testo)}</text>` : ""}
    </g>`; }).join("");
  return `<svg class="mp-svg" viewBox="0 0 ${dis.w} ${dis.h}" data-k="${mpEsc(k)}" role="img" aria-label="Cavallo, vista ${mpEsc(MP_NOME_VISTA[vista])}${sola ? "" : ": tocca per segnare"}">
    <g class="mp-sag" fill="currentColor" fill-rule="evenodd">${sag}</g>${segni}</svg>`;
}

/* ---------------- campo nella scheda ---------------- */
function mpCampoHtml(c, val, sola){
  return `<div class="vs-campo pieno mp" id="mp-${mpEsc(c.k)}">${mpInterno(c.k, sola)}</div>`;
}
function mpInterno(k, sola){
  const st = mpStato(k), c = mpCampo(k), l = mpVal(k), punti = c.modo === "punti";
  const conta = v => l.filter(p => p.v === v).length;
  const chip = (on, az, t, stile) => `<button type="button" class="vs-chip${on ? " on" : ""}" aria-pressed="${!!on}"${sola ? " disabled" : ""} onclick="${az}"${stile ? ` style="${stile}"` : ""}>${t}</button>`;
  const sel = l.find(p => p.id === st.sel);
  const tipi = !punti && !sola ? `<div class="vs-chips mp-tipi">${MP_TIPI.map(([t, n, col]) => chip(st.tipo === t, `mpTipo(${mpJs(k)}, '${t}')`, mpEsc(n), st.tipo === t ? `background:${col};border-color:${col};color:#fff` : "")).join("")}</div>` : "";
  const viste = `<div class="mp-viste" role="tablist">${MP_VISTE.map(([v, n]) => `<button type="button" role="tab" aria-selected="${st.vista === v}" class="${st.vista === v ? "on" : ""}" onclick="mpVista(${mpJs(k)}, '${v}')">${n}${conta(v) ? ` <b>${conta(v)}</b>` : ""}</button>`).join("")}</div>`;
  const aiuto = sola ? "" : punti
    ? (st.attesaNome ? `<div class="mp-aiuto on">Tocca il disegno dove hai trovato <b>${mpEsc(st.attesaNome)}</b>.</div>` : '<div class="mp-aiuto">Tocca il disegno dove trovi il punto, poi scegli il nome e la reattività. Trascina un pallino per spostarlo.</div>')
    : `<div class="mp-aiuto">Tocca il disegno per segnare <b>${mpEsc((MP_TIPI.find(t => t[0] === st.tipo) || MP_TIPI[0])[1].toLowerCase())}</b>. Trascina un segno per spostarlo.</div>`;
  return `${tipi}${viste}${aiuto}
    <div class="mp-box${st.zoom ? " zoom" : ""}">${mpSvg(k, sola)}</div>
    <div class="mp-barra"><button type="button" class="mp-lente" onclick="mpZoom(${mpJs(k)})">${st.zoom ? "Riduci" : "Ingrandisci"}</button>
      ${punti && !sola ? `<button type="button" class="mp-lente" onclick="mpElencoNomi(${mpJs(k)})">${st.cerca === null ? "Chiudi l'elenco" : "Scegli dall'elenco"}</button>` : ""}</div>
    ${punti && !sola && st.cerca === null && !sel ? mpScegliNome(k, null) : ""}
    ${sel && !sola ? mpPannello(k, sel) : ""}
    ${mpElenco(k)}`;
}
// pannello del pallino scelto
function mpPannello(k, p){
  const c = mpCampo(k);
  if(c.modo === "punti") return `<div class="mp-pan">
      <div class="mp-pan-t"><b>${p.n ? mpEsc(p.n) + mpEsc(mpDescr(p.n) ? " · " + mpDescr(p.n) : "") : "Che punto è?"}</b><small>${mpEsc(MP_NOME_VISTA[p.v])}</small></div>
      ${!p.n ? mpScegliNome(k, p.id) : `<div class="mp-gradi">${[0, 1, 2, 3].map(g => `<button type="button" class="${p.g === g ? "on" : ""}" style="${p.g === g ? `background:${MP_GRADI[g]};border-color:${MP_GRADI[g]};color:${g ? "#fff" : "#1D2D50"}` : ""}" onclick="mpGrado(${mpJs(k)}, ${g})">${g}</button>`).join("")}</div>
        <div class="mp-pan-az"><button type="button" onclick="mpRinomina(${mpJs(k)})">Cambia nome</button><button type="button" class="urg" onclick="mpTogli(${mpJs(k)})">Togli</button><button type="button" onclick="mpChiudi(${mpJs(k)})">Fatto</button></div>`}
    </div>`;
  const tipo = MP_TIPI.find(t => t[0] === p.tipo) || MP_TIPI[3];
  return `<div class="mp-pan">
      <div class="mp-pan-t"><b>${p.num} · ${mpEsc(tipo[1])}</b><small>${mpEsc(MP_NOME_VISTA[p.v])}</small></div>
      <div class="vs-chips">${MP_TIPI.map(([t, n, col]) => `<button type="button" class="vs-chip${p.tipo === t ? " on" : ""}" style="${p.tipo === t ? `background:${col};border-color:${col};color:#fff` : ""}" onclick="mpCambiaTipo(${mpJs(k)}, '${t}')">${mpEsc(n)}</button>`).join("")}</div>
      <input class="mp-nota" maxlength="140" value="${mpEsc(p.nota || "")}" placeholder="Nota: dove, com'è, da quando" oninput="mpNota(${mpJs(k)}, this.value)">
      <div class="mp-pan-az"><button type="button" onclick="mpFoto()">Foto</button><button type="button" class="urg" onclick="mpTogli(${mpJs(k)})">Togli</button><button type="button" onclick="mpChiudi(${mpJs(k)})">Fatto</button></div>
    </div>`;
}
const mpDescr = c => (MP_PUNTI.find(x => x[0] === c) || [])[1] || "";
// scelta del nome: ricerca + elenco + «usa questo nome»
function mpScegliNome(k, id){
  const st = mpStato(k), q = String(st.cercaTesto || "").trim(), ql = q.toLowerCase();
  const nomi = mpNomiNoti(k).filter(x => !ql || x.c.toLowerCase().includes(ql) || x.n.toLowerCase().includes(ql));
  const az = c => id ? `mpNome(${mpJs(k)}, ${mpJs(c)})` : `mpNomePrima(${mpJs(k)}, ${mpJs(c)})`;
  return `<div class="mp-nomi"><input class="mp-cerca" id="mp-cerca-${mpEsc(k)}" value="${mpEsc(q)}" placeholder="Cerca o scrivi il nome del punto" oninput="mpCerca(${mpJs(k)}, this.value)" autocomplete="off">
    <div class="vs-chips">${nomi.slice(0, 30).map(x => `<button type="button" class="vs-chip" onclick="${az(x.c)}"><b>${mpEsc(x.c)}</b>${x.n ? " " + mpEsc(x.n) : ""}</button>`).join("")}
      ${q && !nomi.some(x => x.c.toLowerCase() === ql) ? `<button type="button" class="vs-chip on" onclick="${az(q)}">Usa «${mpEsc(q)}»</button>` : ""}</div></div>`;
}
// elenco sotto il disegno
function mpElenco(k){
  const c = mpCampo(k), l = mpVal(k);
  if(!l.length) return "";
  if(c.modo === "punti"){
    const ord = l.filter(p => p.n).sort((a, b) => (b.g ?? -1) - (a.g ?? -1) || a.n.localeCompare(b.n));
    return `<div class="mp-el">${ord.map(p => `<button type="button" onclick="mpSeleziona(${mpJs(k)}, ${mpJs(p.id)})"><b>${mpEsc(p.n)}${mpDescr(p.n) ? " · " + mpEsc(mpDescr(p.n)) : ""}</b>
      <span><i style="background:${p.g == null ? "#FFFFFF" : MP_GRADI[p.g]}"></i>${p.g == null ? "da valutare" : MP_NOMI_GRADO[p.g]} · ${mpEsc(MP_NOME_VISTA[p.v].toLowerCase())}</span></button>`).join("")}</div>`;
  }
  return `<div class="mp-el">${l.slice().sort((a, b) => a.num - b.num).map(p => { const t = MP_TIPI.find(x => x[0] === p.tipo) || MP_TIPI[3];
    return `<button type="button" onclick="mpSeleziona(${mpJs(k)}, ${mpJs(p.id)})"><b><i style="background:${t[2]}"></i>${p.num} · ${mpEsc(t[1])}</b><span>${mpEsc(p.nota || MP_NOME_VISTA[p.v].toLowerCase())}</span></button>`; }).join("")}</div>`;
}

/* ---------------- azioni ---------------- */
function mpRidisegna(k){
  const box = document.getElementById("mp-" + k); if(!box) return;
  box.innerHTML = mpInterno(k, VS.visita?.stato === "conclusa");
  mpAttiva(k);
}
function mpSalva(k, l){ vsCambia(k, l); }
function mpVista(k, v){ const st = mpStato(k); st.vista = v; st.sel = null; mpRidisegna(k); }
function mpTipo(k, t){ mpStato(k).tipo = t; mpRidisegna(k); }
function mpZoom(k){ const st = mpStato(k); st.zoom = !st.zoom; mpRidisegna(k); }
function mpElencoNomi(k){ const st = mpStato(k); st.cerca = st.cerca === null ? "" : null; st.sel = null; st.cercaTesto = ""; mpRidisegna(k); }
function mpCerca(k, q){
  const st = mpStato(k); st.cercaTesto = q; mpRidisegna(k);
  const i = document.getElementById("mp-cerca-" + k); if(i){ i.focus(); i.setSelectionRange(q.length, q.length); }
}
function mpSeleziona(k, id){ const st = mpStato(k), p = mpVal(k).find(x => x.id === id); if(!p) return; st.vista = p.v; st.sel = id; st.cerca = ""; mpRidisegna(k); }
function mpChiudi(k){ const st = mpStato(k); st.sel = null; st.cercaTesto = ""; mpRidisegna(k); }
function mpAggiorna(k, id, campi){
  const l = mpVal(k).map(p => p.id === id ? { ...p, ...campi } : p);
  mpSalva(k, l); const p = l.find(x => x.id === id); if(mpCampo(k).modo === "punti") mpMemScrivi(p);
  return p;
}
// nome dato a un pallino appena messo
function mpNome(k, nome){
  const st = mpStato(k); nome = String(nome || "").trim().slice(0, 40); if(!nome) return;
  // stesso punto già segnato in questa vista: si sposta quello, non se ne fa un doppione
  const gia = mpVal(k).find(p => p.n === nome && p.v === st.vista && p.id !== st.sel);
  if(gia){ const nuovo = mpVal(k).find(p => p.id === st.sel); mpSalva(k, mpVal(k).filter(p => p.id !== st.sel)); mpAggiorna(k, gia.id, { x: nuovo.x, y: nuovo.y }); st.sel = gia.id; }
  else mpAggiorna(k, st.sel, { n: nome });
  st.cercaTesto = ""; mpRidisegna(k);
}
// nome scelto prima di toccare: si mette dove il veterinario l'aveva messo, altrimenti si aspetta il tocco
function mpNomePrima(k, nome){
  const st = mpStato(k); nome = String(nome || "").trim().slice(0, 40); if(!nome) return;
  st.cerca = ""; st.cercaTesto = "";
  const gia = mpVal(k).find(p => p.n === nome);
  if(gia){ st.vista = gia.v; st.sel = gia.id; return mpRidisegna(k); }
  const pos = mpPosizioneNota(k, nome);
  if(pos){ const p = { id: mpId(), v: pos.v, x: pos.x, y: pos.y, n: nome, g: null }; mpSalva(k, [...mpVal(k), p]); st.vista = pos.v; st.sel = p.id; showToast("Messo dove l'avevi segnato l'ultima volta: trascinalo se serve"); }
  else { st.attesaNome = nome; showToast("Tocca il disegno dove hai trovato " + nome); }
  mpRidisegna(k);
}
function mpRinomina(k){ const st = mpStato(k); mpAggiorna(k, st.sel, { n: "" }); mpRidisegna(k); }
function mpGrado(k, g){ const st = mpStato(k); const p = mpVal(k).find(x => x.id === st.sel); mpAggiorna(k, st.sel, { g: p && p.g === g ? null : g }); mpRidisegna(k); }
function mpTogli(k){ const st = mpStato(k); mpSalva(k, mpVal(k).filter(p => p.id !== st.sel)); st.sel = null; mpRidisegna(k); }
function mpCambiaTipo(k, t){ const st = mpStato(k); mpAggiorna(k, st.sel, { tipo: t }); st.tipo = t; mpRidisegna(k); }
function mpNota(k, v){ const st = mpStato(k); mpAggiorna(k, st.sel, { nota: String(v).slice(0, 140) }); }
function mpFoto(){ if(typeof vaScegli === "function"){ vaScegli("foto"); setTimeout(() => document.getElementById("va-box")?.scrollIntoView({ block: "start", behavior: "smooth" }), 400); } }
// tocco sul disegno: nuovo pallino o segno
function mpNuovo(k, x, y){
  const st = mpStato(k), c = mpCampo(k), l = mpVal(k);
  if(c.modo === "punti"){
    const p = { id: mpId(), v: st.vista, x, y, n: st.attesaNome || "", g: null };
    st.attesaNome = null; st.cerca = ""; mpSalva(k, [...l, p]); st.sel = p.id;
    if(p.n) mpMemScrivi(p);
  } else {
    const p = { id: mpId(), v: st.vista, x, y, tipo: st.tipo, num: l.reduce((m, q) => Math.max(m, q.num || 0), 0) + 1, nota: "" };
    mpSalva(k, [...l, p]); st.sel = p.id;
  }
  mpRidisegna(k);
}

/* ---------------- tocco e trascinamento ---------------- */
function mpAttiva(k){
  const box = document.getElementById("mp-" + k), svg = box?.querySelector(".mp-svg"); if(!svg || VS.visita?.stato === "conclusa") return;
  const vb = svg.viewBox.baseVal;
  const pos = ev => { const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; const m = svg.getScreenCTM(); const q = m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
    return { x: Math.max(0, Math.min(1, q.x / vb.width)), y: Math.max(0, Math.min(1, q.y / vb.height)), sx: q.x, sy: q.y }; };
  let tr = null;
  svg.addEventListener("pointerdown", ev => {
    const g = ev.target.closest(".mp-m");
    tr = { id: g ? g.dataset.id : null, g, x0: ev.clientX, y0: ev.clientY, mosso: false };
    if(g){ try{ svg.setPointerCapture(ev.pointerId); }catch(_){} ev.preventDefault(); }
  });
  svg.addEventListener("pointermove", ev => {
    if(!tr || !tr.g) return;
    if(Math.hypot(ev.clientX - tr.x0, ev.clientY - tr.y0) > 6) tr.mosso = true;
    if(tr.mosso){ const p = pos(ev); tr.g.setAttribute("transform", `translate(${p.sx.toFixed(1)},${p.sy.toFixed(1)})`); ev.preventDefault(); }
  });
  svg.addEventListener("pointerup", ev => {
    const t = tr; tr = null; if(!t) return;
    const p = pos(ev);
    if(t.id && t.mosso){ mpAggiorna(k, t.id, { x: p.x, y: p.y }); mpStato(k).sel = t.id; return mpRidisegna(k); }
    if(t.id) return mpSeleziona(k, t.id);
    if(Math.hypot(ev.clientX - t.x0, ev.clientY - t.y0) > 10) return;   // era uno scorrimento della pagina
    const st = mpStato(k);
    if(st.sel){ const s = mpVal(k).find(x => x.id === st.sel); if(s && mpCampo(k).modo === "punti" && !s.n){ mpSalva(k, mpVal(k).filter(x => x.id !== st.sel)); } st.sel = null; }
    mpNuovo(k, p.x, p.y);
  });
}
// dopo ogni disegno della scheda si attivano tutte le mappe visibili
function mpAttivaTutte(){ document.querySelectorAll("#vs-corpo .mp").forEach(b => mpAttiva(b.id.slice(3))); }
function mpReset(){ Object.keys(MP).forEach(k => delete MP[k]); }

/* ---------------- testo per il referto e per Galeno ---------------- */
function mpTesto(c, v){
  const l = Array.isArray(v) ? v : []; if(!l.length) return null;
  if(c.modo === "punti"){
    const r = l.filter(p => p.n && p.g != null).sort((a, b) => b.g - a.g || a.n.localeCompare(b.n));
    return r.length ? r.map(p => `${p.n} ${p.g}/3 (${MP_NOME_VISTA[p.v].toLowerCase()})`).join(", ") : null;
  }
  return l.slice().sort((a, b) => a.num - b.num).map(p => `${p.num}. ${(MP_TIPI.find(t => t[0] === p.tipo) || MP_TIPI[3])[1]}${p.nota ? ": " + p.nota : ""} (${MP_NOME_VISTA[p.v].toLowerCase()})`).join("; ");
}

export { mpCampoHtml, mpInterno, mpRidisegna, mpAttiva, mpAttivaTutte, mpReset, mpTesto, mpVista, mpTipo, mpZoom, mpElencoNomi, mpCerca, mpSeleziona, mpChiudi,
  mpNome, mpNomePrima, mpRinomina, mpGrado, mpTogli, mpCambiaTipo, mpNota, mpFoto, mpNuovo, MP, MP_PUNTI };
