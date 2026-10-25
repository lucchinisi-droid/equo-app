// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { loadClienteInterventi } from "./037-scheda-cliente-a-box-scheda-del-cavallo.js";
import { renderIncassi } from "./047-incassi-saldati-per-periodo-da-saldare-p.js";
import { clienteDiId } from "./050-sposta-cavallo-dove-sta-il-cavallo-a-cas.js";
import { chiediSiNo } from "./052-ferro-standard-nella-scheda-del-cavallo.js";
import { ContoDB, contoCodice, contoData, contoEuro, contoLavori } from "./057-pdf-appuntamento-invio-in-chat-maniscalc.js";
import { caricaContiCliente } from "./058-scheda-cliente-pulsante-elenco-dei-conti.js";
import { creaPdfConto } from "./061-pdf-del-conto-dai-dati-salvati-snapshot.js";
/* ---- foglio di invio / gestione del conto ---- */
async function apriInvioConto(id){
  const c = await ContoDB.completo(id);
  if(!c){ showToast("Conto non trovato"); return; }
  contoAperto = c;
  const cli = clienteDiId(c.cliente_mascalcia_id);
  const stato = c.stato === "pagato" ? '<span class="badge badge-green">Pagato</span>' : c.stato === "annullato" ? '<span class="badge">Annullato</span>' : '<span class="badge badge-red">Da incassare</span>';
  document.getElementById("conto-invio-titolo").textContent = "Conto " + contoCodice(c);
  document.getElementById("conto-invio-corpo").innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><b>${escapeHtml(cli?.nome || "")}</b><div class="muted" style="font-size:12px">${contoLavori(c.n_lavori)} · ${contoData(c.creato_il)}</div></div><div style="text-align:right"><b style="font-size:20px">${contoEuro(c.totale)}</b><div>${stato}</div></div></div>
    <div class="ag-azioni" style="margin-top:14px">
      ${c.stato !== "annullato" ? `
      <button class="btn btn-primary" onclick="contoInviaChat()"><span class="fa-icon"><i class="fa-solid fa-comment"></i></span> Invia in chat Equo</button>
      <button class="btn btn-outline" onclick="contoCondividi()"><span class="fa-icon"><i class="fa-solid fa-share-nodes"></i></span> Email, WhatsApp, altro…</button>
      <button class="btn btn-outline" onclick="contoScarica()"><span class="fa-icon"><i class="fa-solid fa-file-pdf"></i></span> Scarica il PDF</button>` : ""}
      ${c.stato === "da_incassare" ? `
      <button class="btn btn-outline" onclick="contoSegnaPagato()"><span class="fa-icon"><i class="fa-solid fa-check"></i></span> Segna pagato</button>
      <button class="btn btn-outline" style="color:var(--red)" onclick="contoAnnulla()"><span class="fa-icon"><i class="fa-solid fa-ban"></i></span> Annulla il conto</button>` : ""}
    </div>`;
  openModal("modal-conto-invio");
}
async function contoInviaChat(){
  const c = contoAperto; if(!c) return;
  closeModal("modal-conto-invio");
  await openChatThread(c.cliente_mascalcia_id);
  document.getElementById("mchat-input").value = `Conto ${contoCodice(c)}: ${c.n_lavori} lavori · totale ${contoEuro(c.totale)}`;
  chatAllegatoEvento = { __conto: c };
  document.getElementById("mchat-allegato-nome").textContent = contoNomeFile(c);
  document.getElementById("mchat-allegato").classList.add("active");
}
function contoNomeFile(c){
  const n = String(clienteDiId(c.cliente_mascalcia_id)?.nome || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  return ["Equo", "Conto", contoCodice(c), n].filter(Boolean).join("_") + ".pdf";
}
async function contoCondividi(){
  const c = contoAperto; if(!c) return;
  showToast("Creo il PDF…");
  try {
    const { blob, nome } = await creaPdfConto(c);
    const file = new File([blob], nome, { type: "application/pdf" });
    if(navigator.canShare && navigator.canShare({ files: [file] })){
      try { await navigator.share({ files: [file], title: nome, text: `Conto ${contoCodice(c)} · totale ${contoEuro(c.totale)}` }); return; }
      catch(err){ if(err?.name === "AbortError") return; }
    }
    contoScaricaBlob(blob, nome);
    showToast("Il PDF è stato scaricato: allegalo alla tua email o a WhatsApp.");
  } catch(err){ console.error("contoCondividi:", err); showToast("Impossibile creare il PDF: " + (err?.message || err)); }
}
function contoScaricaBlob(blob, nome){
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
async function contoScarica(){
  const c = contoAperto; if(!c) return;
  try { const { blob, nome } = await creaPdfConto(c); contoScaricaBlob(blob, nome); }
  catch(err){ console.error("contoScarica:", err); showToast("Impossibile creare il PDF: " + (err?.message || err)); }
}
async function contoSegnaPagato(){
  const c = contoAperto; if(!c) return;
  if(!await chiediSiNo("Conto pagato?", `${c.n_lavori === 1 ? "Il lavoro" : "Tutti i " + c.n_lavori + " lavori"} del conto ${contoCodice(c)} (${contoEuro(c.totale)}) ${c.n_lavori === 1 ? "risulterà saldato" : "risulteranno saldati"}.`)) return;
  const { error } = await ContoDB.pagato(c.id);
  if(error){ showToast("Errore: " + (error.message || "riprova")); return; }
  closeModal("modal-conto-invio");
  showToast("Conto pagato: lavori saldati");
  if(currentClienteId){ caricaContiCliente(currentClienteId); loadClienteInterventi(currentClienteId); }
  if(typeof renderIncassi === "function") renderIncassi();
  if(typeof agAggiornaSchede === "function") agAggiornaSchede();
}
async function contoAnnulla(){
  const c = contoAperto; if(!c) return;
  if(!await chiediSiNo("Annullare il conto?", `Il conto ${contoCodice(c)} resta nell'elenco come «annullato» e i suoi lavori tornano da saldare: potrai rifarlo.`)) return;
  const { error } = await ContoDB.annulla(c.id);
  if(error){ showToast("Errore: " + (error.message || "riprova")); return; }
  closeModal("modal-conto-invio");
  showToast("Conto annullato");
  if(currentClienteId) caricaContiCliente(currentClienteId);
  if(typeof renderIncassi === "function") renderIncassi();
  if(typeof agAggiornaSchede === "function") agAggiornaSchede();
}


export { apriInvioConto, contoAnnulla, contoCondividi, contoInviaChat, contoNomeFile, contoScarica, contoSegnaPagato };
