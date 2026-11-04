// Equo App · veterinario · PUNTI DI AGOPUNTURA TRATTATI (4/11/2026, richiesta di Laura, mockup approvato da Simone)
// Campo della scheda visita di tipo «punti» (dati[k] = ["GV20", "BL23", "Bai-hui", …], come la vecchia scelta multipla):
//  · i punti scelti in alto, con la × per toglierli;
//  · «Come l'ultima volta» (i punti della visita precedente dello stesso cavallo) e «I miei più usati» (contati su questo telefono);
//  · ricerca o scrittura a mano (Invio o «Aggiungi» per un punto che non è in elenco);
//  · meridiani (LU … CV) e punti classici equini: la griglia dei punti, un clic segna e un clic toglie, senza finestre.
// L'elenco dei classici è da rivedere con Laura (ci manderà il suo).

import { VS, vsCambia } from "./07-scheda-visita.js";

const VP_MERIDIANI = [["LU", 11], ["LI", 20], ["ST", 45], ["SP", 21], ["HT", 9], ["SI", 19], ["BL", 67], ["KID", 27], ["PC", 9], ["TH", 23], ["GB", 44], ["LIV", 14], ["GV", 28], ["CV", 24]];
const VP_CLASSICI = ["Bai-hui", "Wei-jian", "Wei-gen", "Er-jian", "Tai-yang", "Shan-gen", "Long-hui", "Da-feng-men", "Jiu-wei", "Hou-hai", "Jiang-ya", "Qian-chan-wan"];
const VP = {};   // stato per campo: { mer, cerca }
const vpEsc = s => escapeHtml(s == null ? "" : String(s));
const vpJs = s => vpEsc(JSON.stringify(s));
const vpStato = k => (VP[k] = VP[k] || { mer: "BL", cerca: "" });
const vpVal = k => { const v = VS.visita?.dati?.[k]; return Array.isArray(v) ? v : []; };
const vpPuntiDi = m => m === "Classici" ? VP_CLASSICI : Array.from({ length: (VP_MERIDIANI.find(x => x[0] === m) || [m, 0])[1] }, (_, i) => m + (i + 1));
const vpTutti = () => [...VP_MERIDIANI.flatMap(([m]) => vpPuntiDi(m)), ...VP_CLASSICI];
const vpNorm = s => String(s || "").trim().replace(/\s+/g, " ");
const vpChiaveUso = () => "equo-mtc-punti-uso-" + (currentUser?.id || "x");
function vpUso(){ try{ return JSON.parse(localStorage.getItem(vpChiaveUso()) || "{}") || {}; }catch(_){ return {}; } }
function vpContaUso(p){ try{ const u = vpUso(); u[p] = (u[p] || 0) + 1; localStorage.setItem(vpChiaveUso(), JSON.stringify(u)); }catch(_){} }
function vpPiuUsati(){ return Object.entries(vpUso()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(x => x[0]); }
// ultima visita dello stesso cavallo con dei punti trattati
function vpUltimi(k){ for(const pr of VS.precedenti || []){ const l = pr.dati && Array.isArray(pr.dati[k]) ? pr.dati[k] : []; if(l.length) return l; } return []; }

function vpCampoHtml(c, val, sola){
  return `<div class="vs-campo pieno vp" id="vp-${vpEsc(c.k)}"><span class="vs-lab">${vpEsc(c.e)}</span><div class="vp-dentro">${vpInterno(c.k, sola)}</div></div>`;
}
function vpInterno(k, sola){
  const st = vpStato(k), sel = vpVal(k), q = vpNorm(st.cerca), ql = q.toLowerCase();
  const scelti = sel.length ? `<div class="vp-scelti">${sel.map(p => `<button type="button" class="vp-p on"${sola ? " disabled" : ""} onclick="vpTocca(${vpJs(k)}, ${vpJs(p)})" aria-label="Togli ${vpEsc(p)}">${vpEsc(p)}${sola ? "" : " <i>×</i>"}</button>`).join("")}</div>`
    : `<div class="vp-vuoto">${sola ? "Nessun punto segnato." : "Nessun punto ancora: tocca i punti qui sotto."}</div>`;
  if(sola) return scelti;
  const ultimi = vpUltimi(k), usati = vpPiuUsati().filter(p => !sel.includes(p));
  const griglia = (l, cls) => `<div class="vp-griglia${cls ? " " + cls : ""}">${l.map(p => `<button type="button" class="vp-p${sel.includes(p) ? " on" : ""}" aria-pressed="${sel.includes(p)}" onclick="vpTocca(${vpJs(k)}, ${vpJs(p)})">${vpEsc(p)}</button>`).join("")}</div>`;
  const trovati = ql ? vpTutti().filter(p => p.toLowerCase().replace("-", "").startsWith(ql.replace("-", "").replace(/\s/g, "")) || p.toLowerCase().includes(ql)).slice(0, 30) : [];
  const nuovo = q && !vpTutti().some(p => p.toLowerCase() === ql) && !sel.some(p => p.toLowerCase() === ql);
  return `${scelti}
    <div class="vp-az">${ultimi.length ? `<button type="button" onclick="vpComeUltima(${vpJs(k)})">↺ Come l'ultima volta <small>${ultimi.length}</small></button>` : ""}
      ${usati.length ? `<button type="button" class="${st.usati ? "on" : ""}" onclick="vpUsati(${vpJs(k)})">★ I miei più usati</button>` : ""}</div>
    ${st.usati && usati.length ? griglia(usati, "usati") : ""}
    <input class="vp-cerca" id="vp-cerca-${vpEsc(k)}" type="search" autocomplete="off" autocapitalize="characters" placeholder="Cerca o scrivi a mano: BL2, ST36, Bai-hui…" value="${vpEsc(st.cerca)}"
      oninput="vpCerca(${vpJs(k)}, this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault();vpAggiungiScritto(${vpJs(k)})}">
    ${q ? `${trovati.length ? griglia(trovati) : ""}${nuovo ? `<button type="button" class="vp-nuovo" onclick="vpAggiungiScritto(${vpJs(k)})">+ Aggiungi «${vpEsc(q)}»</button>` : ""}`
      : `<div class="vp-mer" role="tablist">${[...VP_MERIDIANI.map(x => x[0]), "Classici"].map(m => { const n = sel.filter(p => vpPuntiDi(m).includes(p)).length;
          return `<button type="button" role="tab" aria-selected="${st.mer === m}" class="${st.mer === m ? "on" : ""}" onclick="vpMeridiano(${vpJs(k)}, ${vpJs(m)})">${m}${n ? ` <b>${n}</b>` : ""}</button>`; }).join("")}</div>
         ${griglia(vpPuntiDi(st.mer))}`}`;
}
function vpRidisegna(k, fuoco){
  const box = document.querySelector(`#vp-${CSS.escape(k)} .vp-dentro`); if(!box) return;
  box.innerHTML = vpInterno(k, false);
  if(fuoco){ const i = document.getElementById("vp-cerca-" + k); if(i){ i.focus(); try{ i.setSelectionRange(i.value.length, i.value.length); }catch(_){} } }
}
function vpTocca(k, p){
  const l = vpVal(k).slice(), i = l.indexOf(p);
  if(i >= 0) l.splice(i, 1); else { l.push(p); vpContaUso(p); }
  vsCambia(k, l); vpRidisegna(k);
}
function vpCerca(k, v){ vpStato(k).cerca = v; vpRidisegna(k, true); }
function vpAggiungiScritto(k){
  const st = vpStato(k), q = vpNorm(st.cerca).slice(0, 30); if(!q) return;
  const comp = x => x.toLowerCase().replace(/[\s-]+/g, "");
  const nome = vpTutti().find(p => comp(p) === comp(q)) || (/^[a-z]+\s*\d+$/i.test(q) ? q.toUpperCase().replace(/\s+/g, "") : q);
  const l = vpVal(k).slice();
  if(!l.some(p => p.toLowerCase() === nome.toLowerCase())){ l.push(nome); vpContaUso(nome); vsCambia(k, l); }
  st.cerca = ""; vpRidisegna(k, true);
}
function vpMeridiano(k, m){ const st = vpStato(k); st.mer = m; st.usati = false; vpRidisegna(k); }
function vpUsati(k){ const st = vpStato(k); st.usati = !st.usati; vpRidisegna(k); }
function vpComeUltima(k){
  const l = vpVal(k).slice(); vpUltimi(k).forEach(p => { if(!l.includes(p)) l.push(p); });
  vsCambia(k, l); vpRidisegna(k);
  showToast("Ripresi i punti dell'ultima visita: togli quelli che oggi non hai fatto");
}
function vpReset(){ Object.keys(VP).forEach(k => delete VP[k]); }

export { VP, VP_MERIDIANI, VP_CLASSICI, vpCampoHtml, vpInterno, vpTocca, vpCerca, vpAggiungiScritto, vpMeridiano, vpUsati, vpComeUltima, vpReset };
