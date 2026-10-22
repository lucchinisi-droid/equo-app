// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { giorniTra } from "./032-richiamo-prossimo-intervento-sempre-in-g.js";
import { hpGiri, hpRigaGiro, renderListaHome } from "./041-giro-della-zona-premium.js";
import { isoLocale } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { AG_GIORNI, AG_MESI, agDescrizioneTipoPro, agNomeCavallo } from "./053-agenda-settimanale-maniscalco.js";
import { formatDataBreve } from "./054-richieste-di-appuntamento-step-5d.js";
import { agOrdinaGiro } from "./056-ordine-del-giro-trascina-un-cavallo-nel.js";
import { wgRidisegna } from "./096-vista-applica-cambia-salva.js";
/* ---------- HOME PRO: PROSSIMI APPUNTAMENTI + DA RICHIAMARE ----------
   Appuntamenti = lavoro già in agenda (semaforo: rosso passato non segnato fatto, ocra da confermare, verde confermato).
   Da richiamare = cavalli senza appuntamento la cui prossima ferratura/pareggio è vicina (rosso scaduto, ocra ≤7 gg, verde ≤30 gg). */
/* -> stato-condiviso.js */
const HP_IN_HOME = 5;

function hpTipo(i){
  if(i.tipo_ferratura === "altro" && i.tipo_altro) return i.tipo_altro;
  return TIPO_FERRATURA_LABELS[i.tipo_ferratura] || i.tipo_ferratura || "Intervento";
}
function hpGiornoEtichetta(iso){
  const oggi = isoLocale(new Date());
  const g = giorniTra(oggi, iso);
  if(g === 0) return "Oggi";
  if(g === 1) return "Domani";
  if(g < 0) return "Da chiudere";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${AG_GIORNI[(dt.getDay() + 6) % 7]} ${d} ${AG_MESI[m - 1]}`;
}
function hpColoreApp(e){
  if(e.data_intervento < isoLocale(new Date())) return "rosso";
  return (e.stato === "richiesto" || e.stato === "proposto") ? "ocra" : "verde";
}
function hpColoreRic(r){ return r.giorni < 0 ? "rosso" : r.giorni <= 7 ? "ocra" : "verde"; }
function hpQuando(r){
  if(r.giorni < 0) return `in ritardo di ${-r.giorni} ${-r.giorni === 1 ? "giorno" : "giorni"}`;
  if(r.giorni === 0) return "scade oggi";
  if(r.giorni === 1) return "scade domani";
  return `tra ${r.giorni} giorni`;
}
function hpPill(n, col, txt){ return n ? `<span class="hp-pill"><i style="background:${col}"></i>${n} ${txt}</span>` : ""; }

function hpRigaApp(e){
  const col = hpColoreApp(e);
  const cav = agNomeCavallo(e);
  const stato = col === "rosso" ? '<span class="rosso">' + formatDataBreve(e.data_intervento) + " · non ancora segnato fatto</span>"
    : e.stato === "richiesto" ? '<span class="ocra">Richiesta del cliente · da confermare</span>'
    : e.stato === "proposto" ? '<span class="ocra">In attesa della scuderia</span>'
    : `<span>${escapeHtml(agDescrizioneTipoPro(e))}</span>`;
  const btn = e.stato === "richiesto" ? `<button class="ag-ev-fatto" onclick="event.stopPropagation();accettaRichiesta('${e.id}')">Accetta</button>`
    : e.stato === "proposto" ? "" : `<button class="ag-ev-fatto" onclick="event.stopPropagation();hpSegnaFatto('${e.id}')">Fatto</button>`;
  return `<div class="hp-riga" onclick="apriAzioniEvento('${e.id}')">
    <span class="hp-dot ${col}"></span>
    <div class="hp-ora">${e.ora ? String(e.ora).slice(0, 5) : "—"}</div>
    <div class="hp-main"><b>${escapeHtml(e.clienti_mascalcia?.nome || "")}${cav ? " · " + escapeHtml(cav) : ""}</b>${stato}</div>
    ${btn}</div>`;
}
function hpListaApp(lista){
  let html = "", ultimo = null;
  lista.forEach(e => {
    const et = hpGiornoEtichetta(e.data_intervento);
    if(et !== ultimo){ html += `<div class="hp-gruppo">${et}</div>`; ultimo = et; }
    html += hpRigaApp(e);
  });
  return html;
}
function hpRigaRic(r){
  const col = hpColoreRic(r);
  return `<div class="hp-riga" onclick="apriRichiamo('${r.intervento_id}')">
    <span class="hp-dot ${col}"></span>
    <div class="hp-main"><b>${escapeHtml(r.cliente_nome || "")}${r.cavallo_nome ? " · " + escapeHtml(r.cavallo_nome) : ""}</b>
      <span class="${col === "verde" ? "" : col}">${escapeHtml(hpTipo(r))} · ${hpQuando(r)}${r.rimandato ? '<span class="hp-tag">rimandato</span>' : ""}</span></div>
    <span class="ag-chev" style="color:var(--muted)">›</span></div>`;
}
function hpGruppoRic(r){ return r.giorni < 0 ? "In ritardo" : r.giorni <= 7 ? "Questa settimana" : "Prossimi 30 giorni"; }
function hpListaRic(lista){
  let html = "", ultimo = null;
  lista.forEach(r => {
    const g = hpGruppoRic(r);
    if(g !== ultimo){ html += `<div class="hp-gruppo">${g}</div>`; ultimo = g; }
    html += hpRigaRic(r);
  });
  return html;
}

async function renderProDeadlines(){
  const boxApp = document.getElementById("home-pro-appuntamenti");
  const boxRic = document.getElementById("home-pro-deadlines");
  if(!boxApp && !boxRic) return;
  const [app0, ric] = await Promise.all([DB.listProssimiAppuntamenti(50), DB.listRichiami(30)]);
  const app = agOrdinaGiro(app0);   // nello stesso giorno vale l'ordine del giro scelto in Agenda
  hpAppuntamenti = app;
  app.forEach(e => { agEventiCache[e.id] = e; });
  hpRichiamiLista = ric;
  hpRichiami = {}; ric.forEach(r => { hpRichiami[r.intervento_id] = r; });

  if(boxApp){
    const n = { rosso: 0, ocra: 0 }; app.forEach(e => { const c = hpColoreApp(e); if(n[c] != null) n[c]++; });
    document.getElementById("hp-app-conta").innerHTML = hpPill(n.rosso, "#c0473d", "da chiudere") + hpPill(n.ocra, "#d9a13b", "da confermare");
    boxApp.innerHTML = !app.length
      ? '<div class="muted" style="font-size:13px">Nessun appuntamento in agenda. <a href="#" onclick="event.preventDefault();openInterventoModal(null)" style="color:var(--accent);font-weight:700">Aggiungine uno</a></div>'
      : hpListaApp(app.slice(0, HP_IN_HOME)) + (app.length > HP_IN_HOME ? `<button class="btn btn-outline btn-sm hp-vedi" onclick="apriListaHome('app')">Vedi tutti (${app.length}${app.length >= 50 ? "+" : ""})</button>` : "");
  }
  if(boxRic){
    const n = { rosso: 0, ocra: 0 }; ric.forEach(r => { const c = hpColoreRic(r); if(n[c] != null) n[c]++; });
    document.getElementById("hp-ric-conta").innerHTML = hpPill(n.rosso, "#c0473d", "in ritardo") + hpPill(n.ocra, "#d9a13b", "questa settimana");
    boxRic.innerHTML = !ric.length
      ? '<div class="muted" style="font-size:13px">Nessun cavallo da richiamare nei prossimi 30 giorni.</div>'
      : hpGiri().map(hpRigaGiro).join("") + hpListaRic(ric.slice(0, HP_IN_HOME)) + (ric.length > HP_IN_HOME ? `<button class="btn btn-outline btn-sm hp-vedi" onclick="apriListaHome('ric')">Vedi tutti (${ric.length})</button>` : "");
  }
  if(document.getElementById("modal-hp-lista")?.classList.contains("active")) renderListaHome();
  if(typeof wgRidisegna === "function") wgRidisegna();
}


export { hpColoreApp, hpColoreRic, hpGiornoEtichetta, hpListaApp, hpListaRic, hpQuando, hpTipo, renderProDeadlines };
