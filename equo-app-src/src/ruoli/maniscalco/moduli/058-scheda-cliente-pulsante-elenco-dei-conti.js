// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { ContoDB, contoCodice, contoData, contoEuro, contoLavori } from "./057-pdf-appuntamento-invio-in-chat-maniscalc.js";
/* ---- scheda cliente: pulsante + elenco dei conti ---- */
async function caricaContiCliente(clienteId){
  const box = document.getElementById("cliente-conti-box");
  if(!box) return;
  if(incassiNascosti()){ box.innerHTML = ""; return; }
  const lista = await ContoDB.lista(clienteId);
  if(currentClienteId !== clienteId) return;
  const badge = s => s === "pagato" ? '<span class="badge badge-green">Pagato</span>' : s === "annullato" ? '<span class="badge" style="opacity:.7">Annullato</span>' : '<span class="badge badge-red">Da incassare</span>';
  box.innerHTML = `<div class="card" style="margin:14px 0">
    <button class="btn btn-primary" style="width:100%" onclick="apriNuovoConto('${clienteId}')">Fai il conto</button>
    ${lista.length ? `<div class="clienti-sez-title" style="margin:14px 0 6px">CONTI FATTI</div>` + lista.map(c => `
      <div onclick="apriInvioConto('${c.id}')" style="display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid var(--border);cursor:pointer">
        <div style="flex:1;min-width:0"><b>${contoCodice(c)}</b><div class="muted" style="font-size:12px">${contoData(c.creato_il)} · ${contoLavori(c.n_lavori)}</div></div>
        <div style="text-align:right"><b>${contoEuro(c.totale)}</b><div style="margin-top:2px">${badge(c.stato)}</div></div>
      </div>`).join("") : ""}
  </div>`;
}


export { caricaContiCliente };
