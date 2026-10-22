// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { renderIncassi } from "./047-incassi-saldati-per-periodo-da-saldare-p.js";
import { INC_ORIZZONTE } from "./048-vista-completa-premium-previsionale-clie.js";
import { aggiungiGiorniIso, isoLocale } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { formatDataBreve } from "./054-richieste-di-appuntamento-step-5d.js";
/* ---------- PREZZO MANCANTE: promemoria (salvando un appuntamento) e «Aggiungi» dal previsionale ---------- */
let prezziResolve = null;
function prezzoSuggerito(clienteId, cavalloId, tipo){
  const conPrezzo = (incTutti || []).filter(i => Number(i.importo) > 0 && i.cliente_mascalcia_id === clienteId && i.tipo_ferratura === tipo)
    .sort((a, b) => b.data_intervento.localeCompare(a.data_intervento));
  const stesso = cavalloId ? conPrezzo.find(i => i.cavallo_cliente_id === cavalloId) : null;
  const x = stesso || conPrezzo[0];
  return x ? { v: Number(x.importo), fonte: stesso ? "ultimo prezzo per questo cavallo" : "ultimo prezzo di questo cliente" } : null;
}
// righe: [{ nome, tipo, clienteId, cavalloId, nomeCliente? }] → Promise: array di importi (null se vuoto) oppure null («senza prezzo»)
function chiediPrezzi(righe, { salvataggio = true } = {}){
  return new Promise(resolve => {
    prezziResolve = { resolve, n: righe.length, salvataggio };
    document.getElementById("prezzi-tit").textContent = salvataggio ? "Manca il prezzo" : "Aggiungi i prezzi";
    document.getElementById("prezzi-testo").textContent = salvataggio
      ? "Con l'importo Equo ti dice quanto incasserai nei prossimi giorni e chi deve ancora pagarti. Senza, questo appuntamento non entra nel previsionale."
      : "Gli appuntamenti delle prossime 4 settimane senza importo. Quelli che lasci vuoti restano senza prezzo.";
    document.getElementById("prezzi-righe").innerHTML = righe.map((r, n) => {
      const sug = prezzoSuggerito(r.clienteId, r.cavalloId, r.tipo);
      return `<div class="prezzi-riga"><div class="n"><b>${escapeHtml(r.nome || "Appuntamento")}</b> · ${escapeHtml(TIPO_FERRATURA_LABELS[r.tipo] || r.tipo || "")}${r.sotto ? " · " + escapeHtml(r.sotto) : ""}</div>
        <label class="prezzi-campo"><span>€</span><input type="number" min="0" step="0.01" inputmode="decimal" id="prezzi-v-${n}" placeholder="importo" value="${sug ? sug.v : ""}">${sug ? `<small>${sug.fonte}</small>` : ""}</label></div>`;
    }).join("");
    document.getElementById("prezzi-mai-box").hidden = !salvataggio;
    document.getElementById("prezzi-mai").checked = false;
    document.getElementById("prezzi-ok").textContent = salvataggio ? "Salva con prezzo" : "Salva prezzi";
    document.getElementById("prezzi-no").textContent = salvataggio ? "Salva senza prezzo" : "Più tardi";
    openModal("modal-prezzi");
  });
}
function rispondiPrezzi(ok){
  const p = prezziResolve; prezziResolve = null;
  closeModal("modal-prezzi");
  if(!p) return;
  if(p.salvataggio && document.getElementById("prezzi-mai").checked){ try { localStorage.setItem("equo-no-promemoria-prezzo", "1"); } catch(e){} }
  if(!ok) return p.resolve(null);
  const v = [];
  for(let n = 0; n < p.n; n++){ const raw = document.getElementById("prezzi-v-" + n).value; v.push(raw === "" || !(Number(raw) >= 0) ? null : Number(raw)); }
  p.resolve(v);
}
function promemoriaPrezzoAttivo(){ try { return localStorage.getItem("equo-no-promemoria-prezzo") !== "1"; } catch(e){ return true; } }
async function aggiungiPrezziMancanti(){
  const oggi = isoLocale(new Date()), fine = aggiungiGiorniIso(oggi, INC_ORIZZONTE - 1);
  const lista = incTutti.filter(i => i.stato === "programmato" && i.stato_pagamento !== "saldato" && i.data_intervento >= oggi && i.data_intervento <= fine && !(Number(i.importo) > 0))
    .sort((a, b) => (a.data_intervento + (a.ora || "")).localeCompare(b.data_intervento + (b.ora || ""))).slice(0, 40);
  if(!lista.length) return;
  const v = await chiediPrezzi(lista.map(i => ({ nome: [i.clienti_mascalcia?.nome, i.cavalli_clienti_mascalcia?.nome].filter(Boolean).join(" · "), tipo: i.tipo_ferratura,
    clienteId: i.cliente_mascalcia_id, cavalloId: i.cavallo_cliente_id, sotto: formatDataBreve(i.data_intervento) + (i.ora ? " " + String(i.ora).slice(0, 5) : "") })), { salvataggio: false });
  if(!v) return;
  let n = 0;
  for(let k = 0; k < lista.length; k++){
    if(v[k] == null) continue;
    const { error } = await DB.updateInterventoMascalcia(lista[k].id, { importo: v[k] });
    if(error){ showToast("Errore: " + error.message); break; }
    if(DEMO_MODE) lista[k].importo = v[k];
    n++;
  }
  if(n) showToast(n === 1 ? "Prezzo salvato" : `${n} prezzi salvati`);
  await renderIncassi();
}

async function segnaSaldatoIncassi(id, btn){
  btn.disabled = true;
  const { error } = await DB.updateInterventoMascalcia(id, { stato_pagamento: "saldato" });
  if(error){ btn.disabled = false; showToast("Errore: " + error.message); return; }
  const i = incTutti.find(x => x.id === id);
  if(i && DEMO_MODE) i.saldato_il = new Date().toISOString();
  showToast("Segnato come saldato");
  await renderIncassi();
}



export { aggiungiPrezziMancanti, chiediPrezzi, promemoriaPrezzoAttivo, rispondiPrezzi, segnaSaldatoIncassi };
