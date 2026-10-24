// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { isStruttura } from "./033-clienti-a-cartelle-stile-telegram-cavall.js";
import { clienteDiId } from "./050-sposta-cavallo-dove-sta-il-cavallo-a-cas.js";
import { isoLocale } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { agDescrizioneTipo, agNomeCavallo } from "./053-agenda-settimanale-maniscalco.js";
import { caricaJsPdf, contoData, contoEuro } from "./057-pdf-appuntamento-invio-in-chat-maniscalc.js";
/* ---------- RESOCONTO PDF (24/10/2026) ----------
   Diverso dal «conto»: riepiloga TUTTI gli interventi di un periodo (pagati e da pagare), non prende un numero e non cambia
   lo stato dei pagamenti. Dalla scheda di una struttura: tutta la struttura (diviso per proprietario) oppure un proprietario;
   dalla scheda di un proprietario: i suoi cavalli. */
let resCtx = null;

async function apriResoconto(clienteId){
  if(incassiNascosti()){ showToast("Hai nascosto gli incassi: mostrali dal menu (serve il PIN) per fare il resoconto."); return; }
  const cli = clienteDiId(clienteId);
  if(!cli) return;
  resCtx = { clienteId, struttura: isStruttura(cli), periodo: "mese", da: "", a: "", chi: "tutti", tutti: [], lavori: [] };
  document.getElementById("res-tit").textContent = "Resoconto · " + cli.nome;
  document.getElementById("res-corpo").innerHTML = '<div class="loading"><div class="spinner"></div> Carico gli interventi…</div>';
  openModal("modal-resoconto");
  resCtx.tutti = await DB.interventiResoconto(clienteId, null, null);
  resApplica();
}
function resPeriodo(p){ if(!resCtx) return; resCtx.periodo = p; if(p !== "date") resApplica(); else resRender(); }
function resDate(){ if(!resCtx) return; resCtx.da = document.getElementById("res-da").value; resCtx.a = document.getElementById("res-a").value; resApplica(); }
function resChi(v){ if(!resCtx) return; resCtx.chi = v; resApplica(); }
function resIntervallo(){
  const c = resCtx, oggi = new Date(), iso = isoLocale;
  if(c.periodo === "mese") return [iso(new Date(oggi.getFullYear(), oggi.getMonth(), 1)), iso(new Date(oggi.getFullYear(), oggi.getMonth() + 1, 0))];
  if(c.periodo === "scorso") return [iso(new Date(oggi.getFullYear(), oggi.getMonth() - 1, 1)), iso(new Date(oggi.getFullYear(), oggi.getMonth(), 0))];
  if(c.periodo === "tre") return [iso(new Date(oggi.getFullYear(), oggi.getMonth() - 2, 1)), iso(new Date(oggi.getFullYear(), oggi.getMonth() + 1, 0))];
  if(c.periodo === "date") return [c.da || "", c.a || ""];
  return ["", ""];
}
function resProprietario(i){ return clienteDiId(i.cliente_mascalcia_id)?.nome || "Cliente"; }
function resApplica(){
  const c = resCtx; if(!c) return;
  const [da, a] = resIntervallo();
  c.pDa = da; c.pA = a;
  c.lavori = c.tutti.filter(i => (!da || i.data_intervento >= da) && (!a || i.data_intervento <= a) && (c.chi === "tutti" || i.cliente_mascalcia_id === c.chi));
  resRender();
}
function resTotali(l){
  const tot = l.reduce((s, i) => s + (Number(i.importo) || 0), 0);
  const pag = l.filter(i => i.stato_pagamento === "saldato").reduce((s, i) => s + (Number(i.importo) || 0), 0);
  return { tot, pag, da: tot - pag };
}
function resRender(){
  const c = resCtx; if(!c) return;
  const chip = (k, t) => `<button type="button" class="btn ${c.periodo === k ? "btn-primary" : "btn-outline"} btn-sm" onclick="resPeriodo('${k}')">${t}</button>`;
  const proprietari = [...new Map(c.tutti.map(i => [i.cliente_mascalcia_id, resProprietario(i)])).entries()].sort((x, y) => x[1].localeCompare(y[1], "it"));
  const t = resTotali(c.lavori);
  const nProp = new Set(c.lavori.map(i => i.cliente_mascalcia_id)).size;
  document.getElementById("res-corpo").innerHTML = `
    ${c.struttura && proprietari.length > 1 ? `<div class="clienti-sez-title" style="margin:4px 0 6px">PER CHI</div>
      <select class="input" onchange="resChi(this.value)"><option value="tutti"${c.chi === "tutti" ? " selected" : ""}>Tutta la struttura (diviso per proprietario)</option>
      ${proprietari.map(([id, n]) => `<option value="${id}"${c.chi === id ? " selected" : ""}>Solo ${escapeHtml(n)}</option>`).join("")}</select>` : ""}
    <div class="clienti-sez-title" style="margin:14px 0 6px">PERIODO</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">${chip("mese", "Questo mese")}${chip("scorso", "Mese scorso")}${chip("tre", "Ultimi 3 mesi")}${chip("tutto", "Tutto")}${chip("date", "Scegli le date")}</div>
    ${c.periodo === "date" ? `<div style="display:flex;gap:8px;margin-top:8px"><input class="input" type="date" id="res-da" value="${c.da}" onchange="resDate()"><input class="input" type="date" id="res-a" value="${c.a}" onchange="resDate()"></div>` : ""}
    <div class="res-riep">
      <div><span>Interventi</span><b>${c.lavori.length}</b></div>
      <div><span>Totale</span><b>${contoEuro(t.tot)}</b></div>
      <div><span>Pagato</span><b>${contoEuro(t.pag)}</b></div>
      <div class="da"><span>Da pagare</span><b>${contoEuro(t.da)}</b></div>
    </div>
    ${c.struttura && c.chi === "tutti" && nProp > 1 ? `<div class="muted" style="font-size:12px;margin-top:6px">Nel PDF gli interventi sono divisi per i ${nProp} proprietari, con i totali di ognuno.</div>` : ""}
    <div class="ag-azioni" style="margin-top:14px">
      <button class="btn btn-primary" ${c.lavori.length ? "" : "disabled"} onclick="resCondividi()"><span class="fa-icon"><i class="fa-solid fa-share-nodes"></i></span> Condividi il PDF (WhatsApp, email…)</button>
      <button class="btn btn-outline" ${c.lavori.length ? "" : "disabled"} onclick="resScarica()"><span class="fa-icon"><i class="fa-solid fa-file-pdf"></i></span> Scarica il PDF</button>
    </div>
    <div class="muted" style="font-size:11.5px;line-height:1.5;margin-top:8px">Il resoconto riepiloga tutti gli interventi del periodo, pagati e da pagare. Non cambia i pagamenti e non è una fattura. Per chiedere il pagamento usa «Fai il conto».</div>`;
}
function resNomeFile(){
  const c = resCtx;
  const chi = c.chi === "tutti" ? clienteDiId(c.clienteId)?.nome : clienteDiId(c.chi)?.nome;
  const n = String(chi || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  return ["Equo", "Resoconto", n, c.pDa || "", c.pA || ""].filter(Boolean).join("_") + ".pdf";
}
async function creaPdfResoconto(){
  const c = resCtx;
  const JsPDF = await caricaJsPdf();
  const doc = new JsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 18, verde = [20, 49, 42], oro = [201, 143, 46], grigio = [95, 111, 103], rosso = [163, 59, 43];
  const piede = () => {
    doc.setDrawColor(227, 221, 204); doc.line(M, 280, W - M, 280);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...grigio);
    doc.text("Resoconto generato con Equo — equohub.com. Non è una fattura e non ha valore fiscale.", M, 285);
  };
  doc.setFillColor(...verde); doc.rect(0, 0, W, 32, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.text("Equo", M, 20);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text("Prenditi cura del tuo cavallo", M, 26);
  doc.text(contoData(isoLocale(new Date())), W - M, 20, { align: "right" });
  doc.setFillColor(...oro); doc.rect(0, 32, W, 1.5, "F");
  let y = 48;
  const luogo = clienteDiId(c.clienteId);
  const solo = c.chi !== "tutti" ? clienteDiId(c.chi) : null;
  doc.setTextColor(...verde); doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.text("Resoconto interventi", M, y);
  y += 9; doc.setFontSize(15); doc.text(solo ? solo.nome : (luogo?.nome || ""), M, y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(...grigio);
  if(solo && c.struttura && solo.id !== c.clienteId){ y += 6; doc.text("Cavalli presso " + (luogo?.nome || ""), M, y); }
  const pro = currentUser?.datiPagamentoNome || currentUser?.fullName || currentUser?.full_name || "";
  if(pro){ y += 6; doc.text("Maniscalco: " + pro + (currentUser?.certificazioneStato === "verificato" ? "  ·  Equo Certified" : ""), M, y); }
  y += 5.5; doc.text("Periodo: " + (c.pDa || c.pA ? (c.pDa ? "dal " + contoData(c.pDa) + " " : "") + (c.pA ? "al " + contoData(c.pA) : "") : "tutti gli interventi"), M, y);
  y += 10;
  const colData = M + 2, colCav = M + 24, colLav = M + 66, colStato = W - M - 30, colImp = W - M - 2;
  const testa = () => {
    doc.setFillColor(...verde); doc.rect(M, y - 5, W - M * 2, 8, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(255, 255, 255);
    doc.text("DATA", colData, y); doc.text("CAVALLO", colCav, y); doc.text("LAVORO", colLav, y); doc.text("STATO", colStato, y); doc.text("IMPORTO", colImp, y, { align: "right" });
    y += 8;
  };
  testa();
  const nuovaPagina = () => { piede(); doc.addPage(); y = 22; testa(); };
  const gruppi = new Map();
  c.lavori.forEach(i => { const n = resProprietario(i); (gruppi.get(n) || gruppi.set(n, []).get(n)).push(i); });
  const nomi = [...gruppi.keys()].sort((a, b) => a.localeCompare(b, "it"));
  const conGruppi = nomi.length > 1;
  let k = 0;
  nomi.forEach(n => {
    const lista = gruppi.get(n).slice().sort((a, b) => (agNomeCavallo(a) || "").localeCompare(agNomeCavallo(b) || "", "it") || String(a.data_intervento).localeCompare(String(b.data_intervento)));
    if(conGruppi){ if(y > 262) nuovaPagina(); doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...oro); doc.text(n, colData, y); y += 6; }
    lista.forEach(i => {
      const lav = doc.splitTextToSize(String(agDescrizioneTipo(i) || ""), colStato - colLav - 3);
      const h = Math.max(7.5, lav.length * 4.8 + 2.6);
      if(y + h > 268) nuovaPagina();
      if(k++ % 2 === 0){ doc.setFillColor(248, 246, 240); doc.rect(M, y - 4.6, W - M * 2, h, "F"); }
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...grigio); doc.text(contoData(i.data_intervento), colData, y);
      doc.setFont("helvetica", "bold"); doc.setTextColor(...verde); doc.text(doc.splitTextToSize(String(agNomeCavallo(i) || "—"), colLav - colCav - 3), colCav, y);
      doc.setFont("helvetica", "normal"); doc.setTextColor(...grigio); doc.text(lav, colLav, y);
      const saldato = i.stato_pagamento === "saldato";
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...(saldato ? verde : rosso)); doc.text(saldato ? "Pagato" : "Da pagare", colStato, y);
      doc.setFontSize(10); doc.setTextColor(...verde); doc.text(Number(i.importo) > 0 ? contoEuro(i.importo) : "—", colImp, y, { align: "right" });
      y += h;
    });
    if(conGruppi){
      const t = resTotali(gruppi.get(n));
      doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...grigio);
      doc.text(`Totale ${n}: ${contoEuro(t.tot)}  ·  pagato ${contoEuro(t.pag)}  ·  da pagare`, colLav - 40, y);
      doc.setFont("helvetica", "bold"); doc.setTextColor(...(t.da > 0 ? rosso : verde)); doc.text(contoEuro(t.da), colImp, y, { align: "right" }); y += 8;
    }
  });
  if(y > 240) nuovaPagina();
  const t = resTotali(c.lavori);
  y += 4; doc.setDrawColor(...oro); doc.setLineWidth(0.6); doc.line(M, y, W - M, y); y += 8;
  doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(...grigio);
  doc.text(`${c.lavori.length === 1 ? "1 intervento" : c.lavori.length + " interventi"}`, M, y);
  doc.text("Totale", W - M - 45, y); doc.setFont("helvetica", "bold"); doc.setTextColor(...verde); doc.text(contoEuro(t.tot), W - M, y, { align: "right" }); y += 6.5;
  doc.setFont("helvetica", "normal"); doc.setTextColor(...grigio); doc.text("Pagato", W - M - 45, y); doc.setFont("helvetica", "bold"); doc.setTextColor(...verde); doc.text(contoEuro(t.pag), W - M, y, { align: "right" }); y += 8;
  doc.setFontSize(15); doc.setTextColor(...(t.da > 0 ? rosso : verde)); doc.text("DA PAGARE  " + contoEuro(t.da), W - M, y, { align: "right" }); y += 12;
  if(t.da > 0 && (currentUser?.datiPagamentoIban || currentUser?.datiPagamentoPaypal)){
    if(y > 250) nuovaPagina();
    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(...verde); doc.text("Dati per il pagamento", M, y); y += 7;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(...grigio);
    if(currentUser.datiPagamentoNome){ doc.text("Intestatario: " + currentUser.datiPagamentoNome, M, y); y += 6; }
    if(currentUser.datiPagamentoIban){ doc.text("IBAN: " + currentUser.datiPagamentoIban, M, y); y += 6; }
    if(currentUser.datiPagamentoPaypal){ doc.text("PayPal: " + currentUser.datiPagamentoPaypal, M, y); y += 6; }
  }
  piede();
  return { blob: doc.output("blob"), nome: resNomeFile() };
}
function resScaricaBlob(blob, nome){
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
async function resCondividi(){
  if(!resCtx) return;
  showToast("Creo il PDF…");
  try {
    const { blob, nome } = await creaPdfResoconto();
    const file = new File([blob], nome, { type: "application/pdf" });
    if(navigator.canShare && navigator.canShare({ files: [file] })){
      try { await navigator.share({ files: [file], title: nome }); return; }
      catch(err){ if(err?.name === "AbortError") return; }
    }
    resScaricaBlob(blob, nome);
    showToast("Il PDF è stato scaricato: allegalo alla tua email o a WhatsApp.");
  } catch(err){ console.error("resCondividi:", err); showToast("Impossibile creare il PDF: " + (err?.message || err)); }
}
async function resScarica(){
  if(!resCtx) return;
  try { const { blob, nome } = await creaPdfResoconto(); resScaricaBlob(blob, nome); }
  catch(err){ console.error("resScarica:", err); showToast("Impossibile creare il PDF: " + (err?.message || err)); }
}

export { apriResoconto, creaPdfResoconto, resChi, resCondividi, resDate, resPeriodo, resScarica };
