// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { renderProDeadlines } from "./040-home-pro-prossimi-appuntamenti-da-richia.js";
import { isStruttura } from "./033-clienti-a-cartelle-stile-telegram-cavall.js";
import { openClienteDetail } from "./034-strutture-collegate-a-equo-scuderia-prof.js";
import { aggiungiGiorniIso, isoLocale } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { formatDataBreve } from "./054-richieste-di-appuntamento-step-5d.js";
/* ---------- SCADENZE DELLA STRUTTURA (24/10/2026, richiesta di Francesco Bizzarri) ----------
   Molti maniscalchi ferrano tutti i cavalli di una struttura nella stessa visita.
   1) «Ferratura ogni N giorni» (clienti_mascalcia.intervallo_giorni): quando segna fatto un cavallo della struttura,
      la prossima scadenza proposta usa questi giorni (vedi giorniRichiamoSuggeriti).
   2) «Allinea le scadenze»: porta la prossima scadenza di tutti i cavalli della struttura a una sola data, scelta da lui.
      Si cambia la prossima_scadenza dell'ultima ferratura/pareggio fatto di ogni cavallo (libretto e scuderia seguono da soli). */
const CICLO_MIN = 7, CICLO_MAX = 180, CICLO_PARTENZA = 35;
const TIPI_CICLO = ["ferratura", "mezza_ferratura", "pareggio"];
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
    <button type="button" class="btn btn-outline btn-sm ciclo-allinea" onclick="apriAllineaScadenze()">Allinea le scadenze dei cavalli</button>`;
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

// «Allinea le scadenze»: elenco dei cavalli con la loro scadenza, una data per tutti
let allineaLista = [];
async function apriAllineaScadenze(){
  const c = clientiMascalcia.find(x => x.id === currentClienteId);
  if(!c) return;
  document.getElementById("all-tit").textContent = "Allinea le scadenze · " + c.nome;
  document.getElementById("all-righe").innerHTML = '<div class="loading"><div class="spinner"></div> Caricamento...</div>';
  document.getElementById("all-ok").disabled = true;
  openModal("modal-allinea");
  const tutti = await DB.ultimiFattiCliente(c.id, TIPI_CICLO);
  // l'ultimo intervento fatto di ogni cavallo; conta solo se ha una prossima scadenza
  const visti = new Set();
  allineaLista = [];
  tutti.forEach(i => {
    const k = i.cavallo_cliente_id || i.horse_id;
    if(!k || visti.has(k)) return;
    visti.add(k);
    if(i.prossima_scadenza) allineaLista.push(i);
  });
  allineaLista.sort((a, b) => a.prossima_scadenza.localeCompare(b.prossima_scadenza) || nomeAll(a).localeCompare(nomeAll(b)));
  const inp = document.getElementById("all-data");
  const oggi = isoLocale(new Date());
  // proposta: la scadenza più vicina (nessun cavallo resta indietro), mai nel passato
  const prima = allineaLista.length ? allineaLista[0].prossima_scadenza : aggiungiGiorniIso(oggi, intervalloStruttura(c.id) || CICLO_PARTENZA);
  inp.min = oggi;
  inp.value = prima < oggi ? oggi : prima;
  allineaRender();
}
function nomeAll(i){ return i.cavalli_clienti_mascalcia?.nome || "Cavallo"; }
function allineaRender(){
  const d = document.getElementById("all-data").value;
  const box = document.getElementById("all-righe"), ok = document.getElementById("all-ok");
  if(!allineaLista.length){
    box.innerHTML = '<div class="muted" style="font-size:13px">Nessun cavallo di questa struttura ha una prossima scadenza: prima segna fatta una ferratura.</div>';
    ok.disabled = true; ok.textContent = "Allinea"; return;
  }
  const daCambiare = allineaLista.filter(i => i.prossima_scadenza !== d).length;
  box.innerHTML = allineaLista.map(i => `<div class="all-riga${i.prossima_scadenza === d ? " uguale" : ""}"><b>${escapeHtml(nomeAll(i))}</b>
      <span>${escapeHtml(formatDataBreve(i.prossima_scadenza))}${i.prossima_scadenza === d ? "" : " → " + escapeHtml(formatDataBreve(d))}</span></div>`).join("");
  ok.disabled = !d || !daCambiare;
  ok.textContent = !daCambiare ? "Già tutte allineate" : `Allinea ${daCambiare === 1 ? "1 cavallo" : daCambiare + " cavalli"} al ${formatDataBreve(d)}`;
}
async function confermaAllineaScadenze(){
  const d = document.getElementById("all-data").value;
  if(!d){ showToast("Scegli la data"); return; }
  const ids = allineaLista.filter(i => i.prossima_scadenza !== d).map(i => i.id);
  if(!ids.length) return;
  const ok = document.getElementById("all-ok"); ok.disabled = true;
  const { error } = await DB.allineaScadenze(ids, d);
  if(error){ ok.disabled = false; showToast("Errore: " + error.message); return; }
  closeModal("modal-allinea");
  showToast(`${ids.length === 1 ? "1 cavallo" : ids.length + " cavalli"}: prossima scadenza ${formatDataBreve(d)}`);
  try { await openClienteDetail(currentClienteId); await renderProDeadlines(); } catch(e){}
}

export { allineaRender, apriAllineaScadenze, cicloCambia, cicloTogli, confermaAllineaScadenze, intervalloStruttura, renderCicloStruttura };
