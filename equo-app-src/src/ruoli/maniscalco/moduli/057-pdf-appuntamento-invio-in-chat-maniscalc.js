// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { MISURE_FERRO, misuraNorm } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { AG_GIORNI, AG_MESI_LUNGHI, agDescrizioneTipo, agNomeCavallo } from "./053-agenda-settimanale-maniscalco.js";
import { etichettaPro, riquadroInvitoPdf } from "./108-invito-qr.js";
/* ---------- PDF APPUNTAMENTO + INVIO IN CHAT (maniscalco) ---------- */
let jsPdfPromise = null;
function caricaJsPdf(){
  if(window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if(!jsPdfPromise){
    jsPdfPromise = new Promise((resolve, reject) => {
      const sc = document.createElement("script");
      sc.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      sc.onload = () => window.jspdf?.jsPDF ? resolve(window.jspdf.jsPDF) : reject(new Error("jsPDF non disponibile"));
      sc.onerror = () => { jsPdfPromise = null; reject(new Error("impossibile scaricare la libreria PDF (sei offline?)")); };
      document.head.appendChild(sc);
    });
  }
  return jsPdfPromise;
}

function pdfNomeFile(e){
  const pulisci = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  return ["Equo", pulisci(e.clienti_mascalcia?.nome), pulisci(agNomeCavallo(e)), e.data_intervento].filter(Boolean).join("_") + ".pdf";
}

function testoRiepilogoEvento(e){
  const [y, m, d] = e.data_intervento.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const quando = `${AG_GIORNI[(dt.getDay() + 6) % 7]} ${d} ${AG_MESI_LUNGHI[m - 1]}${e.ora ? " ore " + String(e.ora).slice(0, 5) : ""}`;
  const cav = agNomeCavallo(e);
  const parti = [
    (e.stato === "fatto" ? "Intervento del " : "Appuntamento: ") + quando,
    (cav ? cav + " — " : "") + agDescrizioneTipo(e)
  ];
  if(e.importo != null) parti.push("€ " + Number(e.importo).toFixed(2).replace(".", ",") + (e.stato_pagamento === "saldato" ? " (saldato)" : " (da saldare)"));
  return parti.join(" · ");
}

async function creaPdfEvento(e){
  const JsPDF = await caricaJsPdf();
  const doc = new JsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 18;
  const verde = [20, 49, 42], oro = [201, 143, 46], grigio = [95, 111, 103];
  // intestazione
  doc.setFillColor(...verde); doc.rect(0, 0, W, 32, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(22);
  doc.text("Equo", M, 20);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.text("Prenditi cura del tuo cavallo", M, 26);
  doc.setFontSize(10);
  doc.text(new Date().toLocaleDateString("it-IT"), W - M, 20, { align: "right" });
  doc.setFillColor(...oro); doc.rect(0, 32, W, 1.5, "F");

  let y = 48;
  doc.setTextColor(...verde); doc.setFont("helvetica", "bold"); doc.setFontSize(17);
  doc.text(e.stato === "fatto" ? "Riepilogo intervento" : "Conferma appuntamento", M, y);
  if(agNomeCavallo(e)){
    y += 9;
    doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(...oro);
    doc.text(agNomeCavallo(e), M, y);
  }
  y += 6;
  const professionista = currentUser?.datiPagamentoNome || currentUser?.fullName || currentUser?.full_name || currentUser?.email || "";
  if(professionista){
    doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(...grigio);
    doc.text(etichettaPro() + ": " + professionista + (currentUser?.certificazioneStato === "verificato" ? "  ·  Equo Certified" : ""), M, y + 2); y += 6;
  }
  y += 6;

  const [yy, mm, dd] = e.data_intervento.split("-").map(Number);
  const dt = new Date(yy, mm - 1, dd);
  const dataTxt = `${["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"][(dt.getDay() + 6) % 7]} ${dd} ${AG_MESI_LUNGHI[mm - 1]} ${yy}`;
  let tipoTxt = TIPO_FERRATURA_LABELS[e.tipo_ferratura] || e.tipo_ferratura || "";
  if(e.tipo_ferratura === "altro" && e.tipo_altro) tipoTxt = "Altro — " + e.tipo_altro;
  let misuraTxt = "";
  if(e.numero_ferro){
    const sis = e.misura_sistema || "italiana";
    const idx = MISURE_FERRO[sis] ? MISURE_FERRO[sis].indexOf(misuraNorm(e.numero_ferro)) : -1;
    misuraTxt = misuraNorm(e.numero_ferro) + " (" + ({ italiana: "italiana", olandese: "olandese", tedesca: "tedesca" }[sis]) + ")";
    if(idx >= 0) misuraTxt += " — italiana " + MISURE_FERRO.italiana[idx] + " · olandese " + MISURE_FERRO.olandese[idx] + " · tedesca " + MISURE_FERRO.tedesca[idx];
  }
  const righe = [
    ["Cavallo", agNomeCavallo(e) || "—"],
    ["Cliente", e.clienti_mascalcia?.nome || "—"],
    ["Data", dataTxt],
    ["Ora", e.ora ? String(e.ora).slice(0, 5) : "—"],
    ["Tipo intervento", tipoTxt],
    misuraTxt ? ["Misura ferro", misuraTxt] : null,
    e.quantita_ferri ? ["Quantità ferri", String(e.quantita_ferri)] : null,
    ["Importo", e.importo != null ? "€ " + Number(e.importo).toFixed(2).replace(".", ",") : "—"],
    ["Pagamento", e.stato_pagamento === "saldato" ? "Saldato" : "Da saldare"],
    ["Stato", e.stato === "fatto" ? "Eseguito" : "Programmato"],
    e.prossima_scadenza && e.stato === "fatto" ? ["Prossimo intervento consigliato", new Date(e.prossima_scadenza + "T00:00").toLocaleDateString("it-IT")] : null,
    e.note ? ["Note", e.note] : null
  ].filter(Boolean);

  doc.setFontSize(11);
  righe.forEach(([k, v], idx) => {
    const valore = doc.splitTextToSize(String(v), W - M * 2 - 62);
    const h = Math.max(9, valore.length * 5.2 + 3.8);
    if(idx % 2 === 0){ doc.setFillColor(248, 246, 240); doc.rect(M, y - 5.6, W - M * 2, h, "F"); }
    doc.setFont("helvetica", "bold"); doc.setTextColor(...grigio); doc.text(k, M + 3, y);
    doc.setFont("helvetica", "normal"); doc.setTextColor(...verde); doc.text(valore, M + 62, y);
    y += h;
  });

  // dati di pagamento del professionista (se inseriti nel profilo e non saldato)
  if(e.stato_pagamento !== "saldato" && (currentUser?.datiPagamentoIban || currentUser?.datiPagamentoPaypal)){
    y += 8;
    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(...verde);
    doc.text("Dati per il pagamento", M, y); y += 7;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(...grigio);
    if(currentUser.datiPagamentoNome){ doc.text("Intestatario: " + currentUser.datiPagamentoNome, M, y); y += 6; }
    if(currentUser.datiPagamentoIban){ doc.text("IBAN: " + currentUser.datiPagamentoIban, M, y); y += 6; }
    if(currentUser.datiPagamentoPaypal){ doc.text("PayPal: " + currentUser.datiPagamentoPaypal, M, y); y += 6; }
  }

  // «Colleghiamoci su Equo»: QR di invito se il cliente non è ancora su Equo
  const piede = () => {
    doc.setDrawColor(227, 221, 204); doc.setLineWidth(0.2); doc.line(M, 280, W - M, 280);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...grigio);
    doc.text("Documento generato con Equo — equohub.com. Non ha valore fiscale.", M, 285);
  };
  y = riquadroInvitoPdf(doc, (typeof clientiMascalcia !== "undefined" ? clientiMascalcia : []).find(x => x.id === e.cliente_mascalcia_id), y + 4, W, M, () => { piede(); doc.addPage(); return 22; });
  // piè di pagina
  piede();

  const nome = pdfNomeFile(e);
  return { blob: doc.output("blob"), nome };
}

// "Stampa PDF": genera il file vero e apre la condivisione di sistema (iPhone: Salva su File, Stampa, AirDrop...) o lo scarica
async function generaPdfEvento(e){
  closeModal("modal-azioni-evento");
  showToast("Creo il PDF…");
  try {
    const { blob, nome } = await creaPdfEvento(e);
    const file = new File([blob], nome, { type: "application/pdf" });
    if(navigator.canShare && navigator.canShare({ files: [file] })){
      try { await navigator.share({ files: [file], title: nome }); return; }
      catch(err){ if(err?.name === "AbortError") return; }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } catch(err){
    console.error("generaPdfEvento:", err);
    showToast("Impossibile creare il PDF: " + (err?.message || err));
  }
}

// "Invia in chat": apre la chat Equo con quel cliente, riepilogo precompilato, PDF allegato (rimovibile)
/* -> stato-condiviso.js */
async function inviaEventoInChat(e){
  closeModal("modal-azioni-evento");
  await openChatThread(e.cliente_mascalcia_id);
  document.getElementById("mchat-input").value = testoRiepilogoEvento(e);
  chatAllegatoEvento = e;
  document.getElementById("mchat-allegato-nome").textContent = pdfNomeFile(e);
  document.getElementById("mchat-allegato").classList.add("active");
}
function rimuoviAllegatoChat(){
  chatAllegatoEvento = null;
  const el = document.getElementById("mchat-allegato");
  if(el) el.classList.remove("active");
}

/* ==================== CONTO DELLA SCUDERIA / DEL CLIENTE ====================
   Il maniscalco raccoglie i lavori fatti e non saldati, il conto prende un numero (C-anno-numero), resta salvato
   e diventa un PDF «resoconto» (non fiscale) da mandare in chat, per email o WhatsApp. Stati: da_incassare / pagato / annullato.
   Il PDF non mostra mai ferri nuovi né note private. */
/* -> stato-condiviso.js */      // { clienteId, modo, periodo, da, a, lavori:[], sel:Set }
/* -> stato-condiviso.js */   // conto mostrato nel foglio di invio
const contoCodice = c => "C-" + c.anno + "-" + String(c.numero).padStart(3, "0");
const contoLavori = n => n + (n === 1 ? " lavoro" : " lavori");
const contoEuro = n => "€ " + Number(n || 0).toFixed(2).replace(".", ",");
const contoData = iso => { const [y, m, d] = String(iso).slice(0, 10).split("-"); return `${d}/${m}/${y}`; };

const ContoDB = {
  async lavoriLiberi(clienteId){
    let righe, usati = new Set();
    if(DEMO_MODE){
      righe = demoState.interventiMascalcia.filter(i => (i.cliente_mascalcia_id === clienteId || i.luogo_cliente_id === clienteId))
        .map(i => ({ ...i, cavalli_clienti_mascalcia: (demoState.cavalliClientiMascalcia.find(x => x.id === i.cavallo_cliente_id) ? { nome: demoState.cavalliClientiMascalcia.find(x => x.id === i.cavallo_cliente_id).nome } : null) }));
      (demoState.conti || []).filter(c => c.stato !== "annullato").forEach(c => c.righe.forEach(r => usati.add(r.intervento_id)));
    } else {
      const { data, error } = await sb.from("interventi_mascalcia").select("*, cavalli_clienti_mascalcia(nome)")
        .eq("maniscalco_id", currentUser.id).eq("stato", "fatto")
        .or(`cliente_mascalcia_id.eq.${clienteId},luogo_cliente_id.eq.${clienteId}`)
        .order("data_intervento", { ascending: true });
      if(error){ console.error("lavoriLiberi:", error); return []; }
      righe = data || [];
      const ids = righe.map(r => r.id);
      if(ids.length){
        const u = await sb.from("conti_mascalcia_righe").select("intervento_id, conti_mascalcia!inner(stato)").in("intervento_id", ids).neq("conti_mascalcia.stato", "annullato");
        (u.data || []).forEach(r => usati.add(r.intervento_id));
      }
    }
    return righe.filter(i => i.stato === "fatto" && i.stato_pagamento !== "saldato" && Number(i.importo) > 0 && !usati.has(i.id));
  },
  async crea(clienteId, modo, da, a, righe){
    if(DEMO_MODE){
      demoState.conti = demoState.conti || [];
      const anno = new Date().getFullYear();
      const numero = demoState.conti.filter(c => c.anno === anno).length + 1;
      const c = { id: "dc-" + Date.now().toString(36) + numero, cliente_mascalcia_id: clienteId, anno, numero, modo, periodo_da: da, periodo_a: a, stato: "da_incassare", creato_il: new Date().toISOString(),
        righe: righe.map(r => { const i = demoState.interventiMascalcia.find(x => x.id === r.intervento_id); return { ...r, data_intervento: i.data_intervento, importo: Number(i.importo) }; }) };
      c.totale = c.righe.reduce((s, r) => s + r.importo, 0); c.n_lavori = c.righe.length;
      demoState.conti.push(c);
      return { data: { id: c.id, anno, numero, totale: c.totale, n_lavori: c.n_lavori }, error: null };
    }
    const { data, error } = await sb.rpc("equo_crea_conto", { p_cliente: clienteId, p_modo: modo, p_da: da || null, p_a: a || null, p_righe: righe });
    if(error) console.error("equo_crea_conto:", error);
    return { data, error };
  },
  async lista(clienteId){
    if(DEMO_MODE) return (demoState.conti || []).filter(c => c.cliente_mascalcia_id === clienteId).sort((a, b) => b.creato_il.localeCompare(a.creato_il));
    const { data, error } = await sb.from("conti_mascalcia").select("*").eq("maniscalco_id", currentUser.id).eq("cliente_mascalcia_id", clienteId).order("creato_il", { ascending: false }).limit(30);
    if(error){ console.error("lista conti:", error); return []; }
    return data || [];
  },
  async completo(id){
    if(DEMO_MODE) return (demoState.conti || []).find(c => c.id === id) || null;
    const [c, r] = await Promise.all([
      sb.from("conti_mascalcia").select("*").eq("id", id).single(),
      sb.from("conti_mascalcia_righe").select("*").eq("conto_id", id).order("proprietario_nome").order("data_intervento")
    ]);
    if(c.error || !c.data) return null;
    return { ...c.data, righe: r.data || [] };
  },
  async pagato(id){
    if(DEMO_MODE){ const c = demoState.conti.find(x => x.id === id); c.stato = "pagato"; c.pagato_il = new Date().toISOString();
      c.righe.forEach(r => { const i = demoState.interventiMascalcia.find(x => x.id === r.intervento_id); if(i){ i.stato_pagamento = "saldato"; i.saldato_il = c.pagato_il; } }); return { error: null }; }
    const { error } = await sb.rpc("equo_conto_pagato", { p_conto: id }); if(error) console.error("equo_conto_pagato:", error); return { error };
  },
  async annulla(id){
    if(DEMO_MODE){ const c = demoState.conti.find(x => x.id === id); c.stato = "annullato"; c.annullato_il = new Date().toISOString(); return { error: null }; }
    const { error } = await sb.rpc("equo_conto_annulla", { p_conto: id }); if(error) console.error("equo_conto_annulla:", error); return { error };
  }
};


export { ContoDB, caricaJsPdf, contoCodice, contoData, contoEuro, contoLavori, creaPdfEvento, generaPdfEvento, inviaEventoInChat, rimuoviAllegatoChat };
