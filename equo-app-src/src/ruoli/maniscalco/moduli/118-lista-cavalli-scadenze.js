// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { isoLocale } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
/* ---------- CAVALLI CON LA SCADENZA ACCANTO (28/10/2026, sostituisce la «linea del tempo» del 27/10) ----------
   Nuovo appuntamento e «Proponi a scuderia»: la solita lista a spunte, per qualunque numero di cavalli, con a destra
   la pastiglia della prossima scadenza (semaforo): rossa «scaduta 16 ott», arancione entro 10 giorni, verde più in là,
   grigia «in agenda 4 nov» se il cavallo ha già un appuntamento; niente pastiglia senza scadenza.
   In alto «Ordina»: A–Z (di partenza) · Scadenza · Data (dall'ultimo lavoro più vecchio) · Proprietari (a gruppi).
   «Seleziona scaduti e in scadenza (n)» spunta rossi e arancioni (non quelli già in agenda); nessuna spunta automatica.
   Le caselle restano <input type="checkbox"> con la classe della finestra (int-cav-chk / prop-str-cav),
   così il codice che legge le scelte non cambia.
   Scadenza = richiamo aperto del cavallo (funzione richiami_maniscalco: prossima scadenza o data rimandata). */
const LC_SOGLIA = 10, LC_ORD = "equo_lc_ordine";
const LC_NOMI = { az: "A–Z", scad: "Scadenza", data: "Data", prop: "Proprietari" };
const LC_SPIEGA = {
  az: "In ordine alfabetico.",
  scad: "Prima le scadute, poi le più vicine; in agenda e senza scadenza in fondo.",
  data: "Dal lavoro più vecchio al più recente.",
  prop: "Divisi per chi paga: la scuderia e i proprietari privati."
};
let lcCache = { t: 0, richiami: [], agenda: [], fatti: [] };
const lcOggi = () => isoLocale(new Date());
const lcGiorni = (da, a) => Math.round((new Date(a + "T12:00") - new Date(da + "T12:00")) / 86400000);
const lcData = iso => { const d = new Date(iso + "T12:00"); return d.getDate() + " " + d.toLocaleDateString("it-IT", { month: "short" }).replace(".", ""); };
function lcOrdine(){ try{ const v = localStorage.getItem(LC_ORD); return LC_NOMI[v] ? v : "az"; }catch(e){ return "az"; } }

async function lcCarica(){
  if(Date.now() - lcCache.t < 5000) return lcCache;   // dati freschi a ogni apertura (5 s: le due letture della stessa apertura)
  const oggi = lcOggi();
  let richiami = [], agenda = [], fatti = [];
  try{ richiami = await DB.listRichiami(400); }catch(e){ richiami = []; }
  if(DEMO_MODE){
    const tutti = demoState.interventiMascalcia || [];
    agenda = tutti.filter(i => ["programmato", "proposto", "richiesto"].includes(i.stato) && i.data_intervento >= oggi);
    fatti = tutti.filter(i => i.stato === "fatto");
  } else {
    const [a, f] = await Promise.all([
      sb.from("interventi_mascalcia").select("cavallo_cliente_id, horse_id, data_intervento, stato")
        .eq("maniscalco_id", currentUser.id).in("stato", ["programmato", "proposto", "richiesto"]).gte("data_intervento", oggi)
        .order("data_intervento", { ascending: true }).limit(1000),
      sb.from("interventi_mascalcia").select("cavallo_cliente_id, horse_id, data_intervento")
        .eq("maniscalco_id", currentUser.id).eq("stato", "fatto").order("data_intervento", { ascending: false }).limit(3000)
    ]);
    agenda = a.data || []; fatti = f.data || [];
  }
  lcCache = { t: Date.now(), richiami, agenda, fatti };
  return lcCache;
}
function lcStessoCavallo(c, r){
  return (r.cavallo_cliente_id && (r.cavallo_cliente_id === c.id || r.cavallo_cliente_id === c.cavalloClienteId)) || (r.horse_id && (r.horse_id === c.horse_id || (c.tipo === "equo" && r.horse_id === c.id)));
}
// i dati di ogni cavallo: g (giorni alla scadenza), scad, agenda (data), ultimo (data dell'ultimo lavoro fatto)
function lcArricchisci(cavalli, d){
  const oggi = lcOggi();
  return cavalli.map(c => {
    const ag = d ? d.agenda.filter(a => lcStessoCavallo(c, a)).sort((a, b) => a.data_intervento.localeCompare(b.data_intervento))[0] : null;
    const r = d ? d.richiami.find(x => lcStessoCavallo(c, x)) : null;
    const f = d ? d.fatti.filter(x => lcStessoCavallo(c, x)).reduce((m, x) => !m || x.data_intervento > m ? x.data_intervento : m, null) : null;
    const scad = r ? (r.scadenza || r.prossima_scadenza) : null;
    return { ...c, scad, g: scad ? lcGiorni(oggi, scad) : null, agenda: ag ? ag.data_intervento : null, ultimo: f };
  });
}
function lcPill(c){
  if(c.agenda) return { cls: "ag", t: "in agenda " + lcData(c.agenda) };
  if(c.g == null) return null;
  if(c.g < 0) return { cls: "r", t: "scaduta " + lcData(c.scad) };
  return { cls: c.g <= LC_SOGLIA ? "a" : "v", t: lcData(c.scad) };
}
const lcUrgente = c => !c.agenda && c.g != null && c.g <= LC_SOGLIA;

// cavalli: [{ key, id, horse_id?, tipo?, nome, proprietario?, info? }]
// opz: { chk (classe delle caselle), preset (Set di key), cambio (nome della funzione globale), coda (html in fondo), ancora () => bool }
function lcRender(box, cavalli, opz){
  box.classList.add("lc-on");
  box._lc = { cavalli: lcArricchisci(cavalli, null), opz, pronto: false };
  const sel = new Set(opz.preset || []);
  lcDisegna(box, sel);
  return lcCarica().then(d => {
    if(opz.ancora && !opz.ancora()) return false;
    if(box._lc?.opz !== opz) return false;
    const scelti = lcScelti(box);
    box._lc.cavalli = lcArricchisci(cavalli, d);
    box._lc.pronto = true;
    lcDisegna(box, scelti);
    return true;
  }).catch(e => { console.warn("scadenze dei cavalli:", e); return false; });
}
function lcScelti(box){ return new Set([...box.querySelectorAll("input[type=checkbox]:checked")].map(x => x.value)); }
function lcDisegna(box, sel){
  const { cavalli, opz, pronto } = box._lc;
  const gruppi = new Set(cavalli.map(c => c.proprietario || ""));
  let ord = lcOrdine();
  if(ord === "prop" && gruppi.size < 2) ord = "az";
  const az = (a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" });
  const l = cavalli.slice();
  if(ord === "az") l.sort(az);
  if(ord === "scad") l.sort((a, b) => (a.agenda ? 1 : 0) - (b.agenda ? 1 : 0) || (a.g == null ? 1e6 : a.g) - (b.g == null ? 1e6 : b.g) || az(a, b));
  if(ord === "data") l.sort((a, b) => (a.ultimo || "9999").localeCompare(b.ultimo || "9999") || az(a, b));
  if(ord === "prop") l.sort((a, b) => (a.proprietario || "").localeCompare(b.proprietario || "", "it") || az(a, b));
  const urg = cavalli.filter(lcUrgente);
  const tuttiUrg = urg.length && urg.every(c => sel.has(c.key));
  const chips = Object.keys(LC_NOMI).filter(k => k !== "prop" || gruppi.size > 1)
    .map(k => `<button type="button" class="lc-ord${k === ord ? " on" : ""}" aria-pressed="${k === ord}" onclick="lcOrdina(this,'${k}')">${LC_NOMI[k]}</button>`).join("");
  let righe = "", gruppo = null;
  l.forEach(c => {
    if(ord === "prop" && (c.proprietario || "") !== gruppo){
      gruppo = c.proprietario || "";
      righe += `<div class="lc-gruppo">${escapeHtml(gruppo ? "Di " + gruppo : "Della scuderia")}</div>`;
    }
    const p = lcPill(c);
    const sotto = ord === "data" ? (pronto ? (c.ultimo ? "ultimo lavoro " + lcData(c.ultimo) : "nessun lavoro") : "")
      : [c.proprietario && ord !== "prop" ? "di " + c.proprietario : "", c.info || ""].filter(Boolean).join(" · ");
    righe += `<label class="int-cav lc-riga"><input type="checkbox" class="${opz.chk}" value="${escapeHtml(c.key)}"${sel.has(c.key) ? " checked" : ""} onchange="lcCambio(this)">
      <span class="lc-nome"><span>${escapeHtml(c.nome || "Cavallo")}</span>${sotto ? `<small>${escapeHtml(sotto)}</small>` : ""}</span>
      ${p ? `<span class="lc-pill ${p.cls}">${escapeHtml(p.t)}</span>` : ""}</label>`;
  });
  box.innerHTML = `<div class="lc-barra"><span>Ordina</span>${chips}</div>
    <div class="lc-spiega">${LC_SPIEGA[ord]}</div>
    ${urg.length ? `<button type="button" class="lc-urgenti" onclick="lcUrgenti(this)">${tuttiUrg ? "Togli" : "Seleziona"} scaduti e in scadenza (${urg.length})</button>` : ""}
    <div class="lc-lista">${righe}${opz.coda || ""}</div>
    <div class="lc-legenda"><span><i class="r"></i>scaduta</span><span><i class="a"></i>entro ${LC_SOGLIA} giorni</span><span><i class="v"></i>più in là</span><span><i class="ag"></i>già in agenda</span></div>`;
  // la coda («+ Aggiungi cavallo») tiene la sua spunta
  box.querySelectorAll(".lc-lista input[type=checkbox]").forEach(x => { x.checked = sel.has(x.value); });
  lcConta(box);
}
// «N scelti» accanto all'etichetta «Cavalli» della finestra
function lcEtichetta(box){ return box.parentElement?.querySelector(":scope > .input-label"); }
function lcConta(box){
  const lab = lcEtichetta(box); if(!lab) return;
  let s = lab.querySelector(".lc-conta");
  if(!s){ s = document.createElement("span"); s.className = "lc-conta"; lab.appendChild(s); }
  const n = box.querySelectorAll(".lc-riga input[type=checkbox]:checked").length;
  s.textContent = n ? n + (n === 1 ? " scelto" : " scelti") : "";
}
function lcBox(el){ return el.closest(".lc-on"); }
function lcAvvisa(box){ const fn = box._lc?.opz?.cambio; if(fn && typeof window[fn] === "function") window[fn](); }
function lcCambio(el){
  const box = lcBox(el); if(!box) return;
  const b = box.querySelector(".lc-urgenti");
  if(b){ const sel = lcScelti(box), urg = box._lc.cavalli.filter(lcUrgente); b.textContent = (urg.every(c => sel.has(c.key)) ? "Togli" : "Seleziona") + ` scaduti e in scadenza (${urg.length})`; }
  lcConta(box);
  lcAvvisa(box);
}
function lcOrdina(btn, k){
  const box = lcBox(btn); if(!box) return;
  try{ localStorage.setItem(LC_ORD, k); }catch(e){}
  lcDisegna(box, lcScelti(box));
}
function lcUrgenti(btn){
  const box = lcBox(btn); if(!box) return;
  const sel = lcScelti(box), urg = box._lc.cavalli.filter(lcUrgente);
  const tutti = urg.every(c => sel.has(c.key));
  urg.forEach(c => tutti ? sel.delete(c.key) : sel.add(c.key));
  lcDisegna(box, sel);
  lcAvvisa(box);
}
function lcTogli(box){ if(box){ box.classList.remove("lc-on"); box._lc = null; lcEtichetta(box)?.querySelector(".lc-conta")?.remove(); } }
// «Fissa il prossimo giro» (102): scadenze aperte dei cavalli di una struttura, già in agenda esclusi
async function lcScadenzeStruttura(clienteId, idCavalliQui){
  const d = await lcCarica();
  const oggi = lcOggi();
  return d.richiami.filter(r => r.cliente_mascalcia_id === clienteId || (r.cavallo_cliente_id && idCavalliQui.has(r.cavallo_cliente_id)))
    .map(r => { const s = r.scadenza || r.prossima_scadenza; return { scad: s, g: s ? lcGiorni(oggi, s) : null }; }).filter(x => x.scad);
}
function lcSvuotaCache(){ lcCache.t = 0; }

export { lcCambio, lcOrdina, lcRender, lcScadenzeStruttura, lcSvuotaCache, lcTogli, lcUrgenti };
