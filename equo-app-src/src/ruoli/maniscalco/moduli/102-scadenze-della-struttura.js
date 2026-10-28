// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { isStruttura, isStrutturaCollegata } from "./033-clienti-a-cartelle-stile-telegram-cavall.js";
import { cavalliQuiStanno } from "./037-scheda-cliente-a-box-scheda-del-cavallo.js";
import { isoLocale } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { openInterventoModal } from "./052-ferro-standard-nella-scheda-del-cavallo.js";
import { agDataPerFissare } from "./053-agenda-settimanale-maniscalco.js";
import { apriPropostaStruttura } from "./055-appuntamenti-con-strutture-equo-scuderia.js";
import { lcScadenzeStruttura, lcSvuotaCache } from "./118-lista-cavalli-scadenze.js";
/* ---------- SCADENZE DELLA STRUTTURA (24/10/2026, richiesta di Francesco Bizzarri) ----------
   Molti maniscalchi ferrano tutti i cavalli di una struttura nella stessa visita.
   1) «Ferratura ogni N giorni» (clienti_mascalcia.intervallo_giorni): quando segna fatto un cavallo della struttura,
      la prossima scadenza proposta usa questi giorni (vedi giorniRichiamoSuggeriti).
   2) 28/10/2026: tolto «Allinea le scadenze» (portava tutti i cavalli alla stessa data: con 50 cavalli non ha senso).
      Al suo posto «Fissa il prossimo giro»: apre il Nuovo appuntamento con la struttura già scelta e la data della
      scadenza più vicina (oggi se è già passata); i cavalli si scelgono nella lista con le scadenze (118). */
const CICLO_MIN = 7, CICLO_MAX = 180, CICLO_PARTENZA = 35;
let cicloTimer = null;

function intervalloStruttura(clienteId){
  const c = (clientiMascalcia || []).find(x => x.id === clienteId);
  const g = c ? Number(c.intervallo_giorni) : NaN;
  return g >= CICLO_MIN && g <= CICLO_MAX ? g : null;
}
// riquadro nella scheda della struttura
function renderCicloStruttura(c){
  const box = document.getElementById("cli-ciclo");
  if(!box) return;
  if(!c || !isStruttura(c) || c.archiviato_il){ box.innerHTML = ""; box.style.display = "none"; return; }
  box.style.display = "";
  const g = intervalloStruttura(c.id);
  box.innerHTML = `<div class="ciclo-tit">Scadenze della struttura</div>
    <div class="ciclo-riga"><span>Ferratura ogni</span>
      ${g ? `<div class="ciclo-step"><button type="button" onclick="cicloCambia(-1)" aria-label="Meno giorni">−</button><b id="ciclo-val">${g}</b><button type="button" onclick="cicloCambia(1)" aria-label="Più giorni">+</button></div><span>giorni</span>`
          : `<button type="button" class="btn btn-outline btn-sm" onclick="cicloCambia(0)">Imposta</button>`}</div>
    <div class="ciclo-nota">${g ? `Quando segni fatto un cavallo di questa struttura, la prossima scadenza è tra ${g} giorni. <button type="button" class="ciclo-link" onclick="cicloTogli()">Togli</button>`
      : "Non impostato: ogni cavallo usa il suo intervallo."}</div>
    <button type="button" class="ciclo-fissa" onclick="fissaProssimoGiro()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg> Fissa il prossimo giro</button>
    <div class="ciclo-conti" id="ciclo-conti"></div>
    <div class="ciclo-nota">Apre il Nuovo appuntamento con la scuderia già scelta e la data della scadenza più vicina (oggi se è già passata). Scegli i cavalli e salvi.</div>`;
  cicloContiStruttura(c);
}
// sotto il tasto: quanti cavalli sono scaduti / entro 10 giorni e la data proposta (già in agenda esclusi)
let cicloProposta = { id: null, data: "" };
async function cicloContiStruttura(c){
  cicloProposta = { id: c.id, data: "" };
  let l = [];
  lcSvuotaCache();
  try{ l = await lcScadenzeStruttura(c.id, new Set(cavalliQuiStanno(c.id).map(x => x.id))); }catch(e){ l = []; }
  const box = document.getElementById("ciclo-conti");
  if(!box || currentClienteId !== c.id) return;
  const min = l.map(x => x.scad).sort()[0];
  cicloProposta = { id: c.id, data: min ? agDataPerFissare(min) : "" };
  const nR = l.filter(x => x.g < 0).length, nA = l.filter(x => x.g >= 0 && x.g <= 10).length;
  const oggi = isoLocale(new Date()), d = cicloProposta.data;
  const quando = d ? (d === oggi ? "oggi, " : "") + new Date(d + "T12:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "") : "";
  box.innerHTML = (nR ? `<span class="lc-pill r">${nR} ${nR === 1 ? "scaduto" : "scaduti"}</span>` : "")
    + (nA ? `<span class="lc-pill a">${nA} entro 10 giorni</span>` : "")
    + (quando ? `<span>· proposta: <b>${escapeHtml(quando)}</b></span>` : "");
}
function fissaProssimoGiro(){
  const id = currentClienteId;
  if(!id) return;
  const data = cicloProposta.id === id ? cicloProposta.data : "";
  const preset = data ? { data_intervento: data } : {};
  if(isStrutturaCollegata(id)) return apriPropostaStruttura(id, preset);
  return openInterventoModal(id, null, preset);
}
function cicloCambia(d){
  const c = clientiMascalcia.find(x => x.id === currentClienteId);
  if(!c) return;
  const g = intervalloStruttura(c.id);
  const nuovo = !g ? CICLO_PARTENZA : Math.max(CICLO_MIN, Math.min(CICLO_MAX, g + d));
  c.intervallo_giorni = nuovo;
  renderCicloStruttura(c);
  clearTimeout(cicloTimer);
  cicloTimer = setTimeout(() => cicloSalva(c.id, nuovo), 700);   // salva quando smette di toccare + / −
}
async function cicloSalva(id, v){
  const { error } = await DB.updateClienteMascalcia(id, { intervallo_giorni: v });
  if(error){ showToast(/intervallo_giorni/.test(error.message || "") ? "Manca un aggiornamento del database: avvisa l'assistenza Equo." : "Errore: " + error.message); return; }
  showToast(v ? `Struttura: ferratura ogni ${v} giorni` : "Intervallo della struttura tolto");
}
function cicloTogli(){
  const c = clientiMascalcia.find(x => x.id === currentClienteId);
  if(!c) return;
  clearTimeout(cicloTimer);
  c.intervallo_giorni = null;
  renderCicloStruttura(c);
  cicloSalva(c.id, null);
}


export { cicloCambia, cicloTogli, fissaProssimoGiro, intervalloStruttura, renderCicloStruttura };
