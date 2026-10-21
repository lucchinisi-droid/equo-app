/* ---------- SCHEDA CAVALLO: PDF brandizzato Equo + QR, scarica / invia in chat / stampa ---------- */
const PDF_VERDE = [20, 72, 44], PDF_VERDE_SCURO = [11, 52, 30], PDF_ORO = [232, 176, 75], PDF_BEIGE = [247, 243, 234], PDF_GRIGIO = [110, 118, 112];
function needsPdfUpdate(c){
  if(!c.pdf_url || !c.pdf_generato_at) return true;
  const genTime = new Date(c.pdf_generato_at).getTime();
  if(c.updated_at && new Date(c.updated_at).getTime() > genTime) return true;
  const eventiCavallo = eventiAll.filter(e => e.cavallo_id === c.id);
  return eventiCavallo.some(e => e.updated_at && new Date(e.updated_at).getTime() > genTime);
}
function refreshSchedaPdfUI(c){
  const btn = document.getElementById("scheda-pdf-btn");
  const status = document.getElementById("scheda-pdf-status");
  const qrBox = document.getElementById("scheda-qr-box");
  const qrDiv = document.getElementById("scheda-qr");
  const azioni = document.getElementById("scheda-pdf-azioni");
  qrDiv.innerHTML = "";
  if(!c.pdf_url){
    btn.style.display = "";
    btn.innerHTML = `<i class="fa-solid fa-file-pdf"></i> Genera PDF`;
    status.textContent = "Nessuna scheda generata ancora.";
    qrBox.style.display = "none"; azioni.style.display = "none";
    return;
  }
  const vecchio = needsPdfUpdate(c);
  btn.style.display = vecchio ? "" : "none";
  btn.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> Aggiorna PDF`;
  status.innerHTML = vecchio
    ? `⚠️ La scheda è stata modificata dopo l'ultimo PDF (generato il ${formatDate(c.pdf_generato_at.slice(0,10))}): scaricandolo, inviandolo o stampandolo viene aggiornato da solo.`
    : "Scheda aggiornata — generata il " + formatDate(c.pdf_generato_at.slice(0,10)) + ".";
  qrBox.style.display = "block"; azioni.style.display = "flex";
  new QRCode(qrDiv, { text: urlPdfPulito(c.pdf_url), width:140, height:140 });
}
const urlPdfPulito = u => String(u || "").split("?")[0];
async function handleSchedaPdf(){
  const c = cavalliList.find(x => x.id === currentCavalloId);
  if(!c) return;
  const btn = document.getElementById("scheda-pdf-btn");
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generazione...`;
  try{ await generateSchedaPdf(c); showToast("Scheda PDF generata."); }
  catch(err){ console.error("pdf:", err); showToast("Errore nella generazione del PDF."); }
  finally { btn.disabled = false; }
}
// restituisce il cavallo con un PDF aggiornato (lo rigenera se serve)
async function pdfCavalloAggiornato(){
  let c = cavalliList.find(x => x.id === currentCavalloId);
  if(!c) return null;
  if(needsPdfUpdate(c)){
    showToast("Aggiorno la scheda PDF…");
    await generateSchedaPdf(c);
    c = cavalliList.find(x => x.id === currentCavalloId);
  }
  return c;
}
const nomeFilePdf = c => `Scheda_${String(c.nome || "cavallo").replace(/[^\wÀ-ÿ]+/g, "_")}.pdf`;
async function blobPdfCavallo(c){
  const res = await fetch(DEMO_MODE ? c.pdf_url : urlPdfPulito(c.pdf_url) + "?v=" + Date.now(), { cache: "no-store" });
  if(!res.ok) throw new Error("download");
  return await res.blob();
}
async function scaricaSchedaPdf(){
  try{
    const c = await pdfCavalloAggiornato(); if(!c) return;
    const blob = await blobPdfCavallo(c);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = nomeFilePdf(c);
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 20000);
  } catch(e){ console.error(e); showToast("Download non riuscito, riprova."); }
}
async function stampaSchedaPdf(){
  try{
    const c = await pdfCavalloAggiornato(); if(!c) return;
    const blob = await blobPdfCavallo(c);
    const url = URL.createObjectURL(blob);
    let fr = document.getElementById("pdf-stampa-frame");
    if(fr) fr.remove();
    fr = document.createElement("iframe");
    fr.id = "pdf-stampa-frame";
    fr.style.cssText = "position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0";
    fr.src = url;
    fr.onload = () => {
      try{ fr.contentWindow.focus(); fr.contentWindow.print(); }
      catch(e){ window.open(url, "_blank"); } // alcuni browser (es. iPhone) stampano dal visualizzatore PDF
    };
    document.body.appendChild(fr);
  } catch(e){ console.error(e); showToast("Stampa non riuscita, riprova."); }
}
async function apriInviaSchedaChat(){
  const c = cavalliList.find(x => x.id === currentCavalloId); if(!c) return;
  const sel = document.getElementById("pdf-chat-dest");
  if(!DEMO_MODE && !professionistiList.length) await loadProfessionisti();
  const persone = teamList.filter(m => m.user_id && m.user_id !== currentUser?.id);
  const pro = professionistiList.filter(p => p.categoria === "maniscalco" && p.stato === "attivo");
  // chi ha due ruoli (es. proprietario e maniscalco) compare due volte: l'etichetta dice in quale chat arriva
  const nomiPro = new Set(pro.map(p => (p.nome || "").trim().toLowerCase()));
  const nomiTeam = new Set(persone.map(m => (m.nome_visualizzato || "").trim().toLowerCase()));
  const etichetta = (nome, ruolo, doppio) => escapeHtml(nome) + (doppio ? ` · come ${ruolo}` : "");
  const gruppo = (titolo, lista, ruolo) => lista.length ? `<optgroup label="${titolo}">${lista.map(m => { const nome = m.nome_visualizzato || RUOLO_LABELS[m.ruolo] || "Membro"; return `<option value="m:${m.id}">${etichetta(nome, ruolo, nomiPro.has(nome.trim().toLowerCase()))}</option>`; }).join("")}</optgroup>` : "";
  const gruppoPro = pro.length ? `<optgroup label="Maniscalchi collegati">${pro.map(p => `<option value="p:${p.cliente_id}">${etichetta(p.nome || "Maniscalco", "maniscalco", nomiTeam.has((p.nome || "").trim().toLowerCase()))}</option>`).join("")}</optgroup>` : "";
  sel.innerHTML = gruppo("Clienti / proprietari", persone.filter(m => m.ruolo === "proprietario"), "proprietario") + gruppo("Team", persone.filter(m => m.ruolo !== "proprietario"), "membro del team") + gruppoPro;
  if(!sel.options.length){ showToast("Nessuna persona collegata a cui inviarla: collega il proprietario, il team o un maniscalco."); return; }
  if(c.proprietario_membro_id && [...sel.options].some(o => o.value === "m:" + c.proprietario_membro_id)) sel.value = "m:" + c.proprietario_membro_id;
  document.getElementById("pdf-chat-testo").value = `Ecco la scheda aggiornata di ${c.nome} 🐴`;
  openModal("modal-pdf-chat");
}
async function inviaSchedaChat(){
  const btn = document.getElementById("pdf-chat-btn"); btn.disabled = true;
  try{
    const c = await pdfCavalloAggiornato(); if(!c) return;
    const scelta = document.getElementById("pdf-chat-dest").value || "";
    const testo = document.getElementById("pdf-chat-testo").value.trim();
    if(scelta.startsWith("p:")){
      // chat professionale con il maniscalco: il file deve stare negli allegati chat di chi invia
      const pro = professionistiList.find(p => p.cliente_id === scelta.slice(2));
      if(!pro){ showToast("Scegli a chi inviarla."); return; }
      if(DEMO_MODE){ showToast("Nella demo la chat con i maniscalchi non è attiva."); return; }
      const res = await fetch(urlPdfPulito(c.pdf_url) + "?v=" + Date.now());
      if(!res.ok) throw new Error("PDF non disponibile");
      const url = await caricaFileChatPro(await res.blob(), "pdf", "application/pdf");
      {
        const invia = async (tipo, t, fu, fn) => {
          const { data, error } = await sb.rpc("scuderia_invia_messaggio_professionista", { p_cliente_id: pro.cliente_id, p_tipo: tipo, p_testo: t || null, p_file_url: fu || null, p_file_nome: fn || null });
          if(error || !data?.ok) throw new Error((data && data.errore) || error?.message || "riprova");
        };
        if(testo) await invia("testo", testo);
        await invia("documento", null, url, nomeFilePdf(c));
      }
      closeModal("modal-pdf-chat");
      showToast(`Scheda inviata nella chat con ${pro.nome || "il maniscalco"} (Professionisti).`);
      return;
    }
    const m = teamList.find(x => x.id === scelta.replace(/^m:/, ""));
    if(!m){ showToast("Scegli a chi inviarla."); return; }
    const file_url = DEMO_MODE ? c.pdf_url : urlPdfPulito(c.pdf_url) + "?v=" + Date.now();
    if(DEMO_MODE){
      demoState.chat = demoState.chat || {}; demoState.chat[m.id] = demoState.chat[m.id] || [];
      if(testo) demoState.chat[m.id].push({ id:"chat" + (demoIdCounter++ + 900), mittente_user_id: currentUser.id, testo, created_at: new Date().toISOString() });
      demoState.chat[m.id].push({ id:"chat" + (demoIdCounter++ + 900), mittente_user_id: currentUser.id, testo:null, tipo:"documento", file_url, file_nome: nomeFilePdf(c), created_at: new Date().toISOString() });
    } else {
      if(testo){ const r = await sb.from("chat_messaggi").insert({ centro_id: currentCentro.id, membro_id: m.id, mittente_user_id: currentUser.id, testo }); if(r.error) throw r.error; }
      const { error } = await sb.from("chat_messaggi").insert({ centro_id: currentCentro.id, membro_id: m.id, mittente_user_id: currentUser.id, testo: null, tipo: "documento", file_url, file_nome: nomeFilePdf(c) });
      if(error) throw error;
    }
    closeModal("modal-pdf-chat");
    showToast(`Scheda inviata in chat a ${m.nome_visualizzato || "destinatario"}.`);
  } catch(e){ console.error("inviaSchedaChat:", e); showToast("Invio non riuscito: " + (e?.message || "riprova")); }
  finally { btn.disabled = false; }
}

// foto con l'orientamento corretto (EXIF dei telefoni) → quadrato ritagliato al centro, JPEG leggero
async function fotoPerPdf(url){
  try{
    const res = await fetch(url);
    const blob = await res.blob();
    let bmp = null;
    try{ bmp = await createImageBitmap(blob, { imageOrientation: "from-image" }); } catch(e){ bmp = null; }
    if(!bmp){
      bmp = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = URL.createObjectURL(blob); });
    }
    const w = bmp.width, h = bmp.height, lato = Math.min(w, h), out = 700;
    const cv = document.createElement("canvas"); cv.width = out; cv.height = out;
    cv.getContext("2d").drawImage(bmp, (w - lato) / 2, (h - lato) / 2, lato, lato, 0, 0, out, out);
    return cv.toDataURL("image/jpeg", 0.85);
  } catch(e){ console.error("foto pdf:", e); return null; }
}
async function immagineDataUrl(src){
  try{ const r = await fetch(src); const b = await r.blob(); return await new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = () => ok(null); fr.readAsDataURL(b); }); }
  catch(e){ return null; }
}
function qrDataUrl(testo){
  return new Promise(ok => {
    const d = document.createElement("div"); d.style.cssText = "position:fixed;left:-9999px;top:0";
    document.body.appendChild(d);
    try{ new QRCode(d, { text: testo, width: 256, height: 256, colorDark: "#0b341e", colorLight: "#ffffff" }); } catch(e){ d.remove(); return ok(null); }
    setTimeout(() => { const cv = d.querySelector("canvas"); const img = d.querySelector("img"); const u = cv ? cv.toDataURL("image/png") : (img?.src || null); d.remove(); ok(u); }, 60);
  });
}
// cornice geometrica Equo: doppio filo verde/oro, angoli a triangolo e piccoli rombi lungo il perimetro
function cornicePdf(doc){
  const W = 210, H = 297;
  doc.setDrawColor(...PDF_VERDE); doc.setLineWidth(0.6); doc.rect(7, 7, W - 14, H - 14);
  doc.setDrawColor(...PDF_ORO); doc.setLineWidth(0.3); doc.rect(9.2, 9.2, W - 18.4, H - 18.4);
  const angolo = (x, y, sx, sy) => {
    doc.setFillColor(...PDF_VERDE); doc.triangle(x, y, x + 16 * sx, y, x, y + 16 * sy, "F");
    doc.setFillColor(...PDF_ORO); doc.triangle(x + 2.2 * sx, y + 2.2 * sy, x + 9 * sx, y + 2.2 * sy, x + 2.2 * sx, y + 9 * sy, "F");
    doc.setDrawColor(...PDF_ORO); doc.setLineWidth(0.3); doc.line(x + 19 * sx, y, x, y + 19 * sy);
  };
  angolo(7, 7, 1, 1); angolo(W - 7, 7, -1, 1); angolo(7, H - 7, 1, -1); angolo(W - 7, H - 7, -1, -1);
  const rombo = (cx, cy, r, col) => { doc.setFillColor(...col); doc.triangle(cx - r, cy, cx, cy - r, cx + r, cy, "F"); doc.triangle(cx - r, cy, cx, cy + r, cx + r, cy, "F"); };
  for(let x = 40; x <= W - 40; x += 16){ rombo(x, 7, x === 105 ? 1.9 : 1.1, x === 105 ? PDF_ORO : PDF_VERDE); rombo(x, H - 7, x === 105 ? 1.9 : 1.1, x === 105 ? PDF_ORO : PDF_VERDE); }
  for(let y = 44; y <= H - 44; y += 18){ const m = Math.abs(y - H / 2) < 9; rombo(7, y, m ? 1.9 : 1.1, m ? PDF_ORO : PDF_VERDE); rombo(W - 7, y, m ? 1.9 : 1.1, m ? PDF_ORO : PDF_VERDE); }
}
async function generateSchedaPdf(c){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, L = 20, R = W - 20;
  const path = `${currentCentro?.id}/${c.id}.pdf`;
  const urlFinale = DEMO_MODE ? "https://scuderia.equohub.com" : sb.storage.from("cavalli-pdf").getPublicUrl(path).data.publicUrl;
  const [logo, foto, qr] = await Promise.all([immagineDataUrl("assets/logo-equo.png"), c.foto_url ? fotoPerPdf(c.foto_url) : null, qrDataUrl(urlFinale)]);
  const nuovaPagina = () => { doc.addPage(); cornicePdf(doc); return 26; };
  cornicePdf(doc);

  // intestazione: logo + etichetta
  if(logo) doc.addImage(logo, "PNG", L, 15, 36, 18);
  doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(...PDF_ORO);
  doc.text("SCHEDA CAVALLO", R, 21, { align: "right", charSpace: 1.2 });
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...PDF_GRIGIO);
  doc.text(currentCentro?.nome || "", R, 27, { align: "right" });
  doc.setDrawColor(...PDF_ORO); doc.setLineWidth(0.5); doc.line(L, 38, R, 38);

  // nome, foto, dati
  let y = 52;
  doc.setFont("helvetica", "bold"); doc.setFontSize(26); doc.setTextColor(...PDF_VERDE_SCURO);
  doc.text(c.nome || "Cavallo", L, y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(...PDF_GRIGIO);
  doc.text([c.razza, c.mantello, TIPO_PROPRIETA_LABELS[c.tipo_proprieta]].filter(Boolean).join("  ·  ") || " ", L, y + 7);
  if(c.codice_equo){ doc.setFont("courier", "bold"); doc.setFontSize(11); doc.setTextColor(...PDF_VERDE_SCURO); doc.text("Codice Equo " + c.codice_equo, L, y + 13); doc.setFont("helvetica", "normal"); }
  const fx = R - 52, fy = 44;
  if(foto){
    doc.setFillColor(...PDF_ORO); doc.roundedRect(fx - 1.2, fy - 1.2, 54.4, 54.4, 3, 3, "F");
    doc.addImage(foto, "JPEG", fx, fy, 52, 52);
  } else {
    doc.setFillColor(...PDF_BEIGE); doc.roundedRect(fx, fy, 52, 52, 3, 3, "F");
    doc.setFontSize(9); doc.setTextColor(...PDF_GRIGIO); doc.text("Foto non inserita", fx + 26, fy + 27, { align: "center" });
  }
  y = 70;
  const dati = [
    ["Data di nascita", c.data_nascita ? formatDate(c.data_nascita) : "—"], ["Microchip", c.microchip || "—"],
    ["Gruppo sanguigno", c.gruppo_sanguigno || "—"], ["Proprietario", c.proprietario || "—"],
  ];
  dati.forEach(([k, v], i) => {
    const cx = L + (i % 2) * 60, cy = y + Math.floor(i / 2) * 13;
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(...PDF_GRIGIO); doc.text(k.toUpperCase(), cx, cy, { charSpace: 0.4 });
    doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(25, 35, 30); doc.text(doc.splitTextToSize(String(v), 56)[0], cx, cy + 5.5);
  });
  y = 104;
  if(c.note){
    doc.setFillColor(...PDF_BEIGE); const righe = doc.splitTextToSize(c.note, R - L - 10);
    const h = 8 + righe.length * 4.6; doc.roundedRect(L, y, R - L, h, 2.5, 2.5, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(...PDF_GRIGIO); doc.text("NOTE", L + 5, y + 5.5);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(25, 35, 30); doc.text(righe, L + 5, y + 10.5);
    y += h + 8;
  } else y += 2;

  // scadenzario: 4 riquadri con il semaforo
  const titolo = t => { doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(...PDF_VERDE_SCURO); doc.text(t, L, y);
    doc.setDrawColor(...PDF_ORO); doc.setLineWidth(0.8); doc.line(L, y + 2, L + 14, y + 2); y += 9; };
  titolo("Scadenzario sanitario");
  const scad = scadenzarioFor(c.id);
  const colori = { red: [201, 75, 64], yellow: [214, 150, 40], green: [47, 125, 70], gray: [150, 150, 150] };
  const bw = (R - L - 6) / 2;
  TIPO_ORDER.forEach((tipo, i) => {
    const s = scad[tipo], bx = L + (i % 2) * (bw + 6), by = y + Math.floor(i / 2) * 20;
    doc.setFillColor(...PDF_BEIGE); doc.roundedRect(bx, by, bw, 16, 2.5, 2.5, "F");
    doc.setFillColor(...colori[s.status]); doc.circle(bx + 6, by + 8, 1.9, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(25, 35, 30); doc.text(TIPO_LABELS[tipo], bx + 11, by + 6.5);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...PDF_GRIGIO);
    doc.text(s.ultimo ? `Ultimo ${formatDate(s.ultimo.data_evento)}${s.ultimo.data_scadenza ? " · scadenza " + formatDate(s.ultimo.data_scadenza) : ""}` : "Mai registrato", bx + 11, by + 11.8);
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(...colori[s.status]);
    doc.text(etichettaStato(s).toUpperCase(), bx + bw - 4, by + 6.5, { align: "right" });
  });
  y += 46;

  // storico eventi
  titolo("Storico eventi");
  const eventiCavallo = eventiAll.filter(e => e.cavallo_id === c.id).sort((a, b) => new Date(b.data_evento) - new Date(a.data_evento));
  const intest = () => { doc.setFillColor(...PDF_VERDE); doc.rect(L, y - 4.5, R - L, 7, "F"); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
    doc.text("DATA", L + 3, y); doc.text("TIPO", L + 28, y); doc.text("SCADENZA", L + 68, y); doc.text("NOTE", L + 96, y); y += 7; };
  if(!eventiCavallo.length){ doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...PDF_GRIGIO); doc.text("Nessun evento registrato.", L, y); y += 6; }
  else {
    intest();
    eventiCavallo.forEach((e, i) => {
      const tipoLabel = e.tipo === "altro" ? (e.tipo_altro || "Altro") : TIPO_LABELS[e.tipo];
      let nota = String(e.note || "");
      if(nota.toLowerCase().startsWith(String(tipoLabel).toLowerCase() + " — ")) nota = nota.slice(String(tipoLabel).length + 3);
      const righe = doc.splitTextToSize(nota || "—", R - L - 99);
      const h = Math.max(7, righe.length * 4.2 + 3);
      if(y + h > 262){ y = nuovaPagina(); intest(); }
      if(i % 2 === 0){ doc.setFillColor(...PDF_BEIGE); doc.rect(L, y - 4.6, R - L, h, "F"); }
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(25, 35, 30);
      doc.text(formatDate(e.data_evento), L + 3, y); doc.setFont("helvetica", "bold"); doc.text(doc.splitTextToSize(tipoLabel, 38)[0], L + 28, y);
      doc.setFont("helvetica", "normal"); doc.text(e.data_scadenza ? formatDate(e.data_scadenza) : "—", L + 68, y);
      doc.setTextColor(...PDF_GRIGIO); doc.text(righe, L + 96, y);
      y += h;
    });
  }

  // piè di pagina (ultima pagina): QR + firma Equo
  const fy2 = 266;
  if(qr){ doc.addImage(qr, "PNG", R - 24, fy2 - 8, 20, 20);
    doc.setFontSize(6); doc.setTextColor(...PDF_GRIGIO); doc.text("Scansiona: versione aggiornata", R - 14, fy2 + 15, { align: "center" }); }
  doc.setDrawColor(...PDF_ORO); doc.setLineWidth(0.3); doc.line(L, fy2 + 4, R - 30, fy2 + 4);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...PDF_GRIGIO);
  doc.text(`Generato con Equo Scuderia il ${formatDate(isoLoc(new Date()))}  ·  equohub.com`, L, fy2 + 9);
  doc.setFont("helvetica", "bold"); doc.setTextColor(...PDF_VERDE); doc.text("Prenditi cura del tuo cavallo", L, fy2 + 13.5);

  const blob = doc.output("blob");
  const generato_at = new Date().toISOString();
  let pdf_url;
  if(DEMO_MODE){
    pdf_url = URL.createObjectURL(blob);
    const idx = demoState.cavalli.findIndex(x => x.id === c.id);
    if(idx >= 0) demoState.cavalli[idx] = { ...demoState.cavalli[idx], pdf_url, pdf_generato_at: generato_at };
  } else {
    const { error: upErr } = await sb.storage.from("cavalli-pdf").upload(path, blob, { upsert: true, contentType: "application/pdf" });
    if(upErr) throw upErr;
    pdf_url = urlFinale + "?t=" + Date.now();
    const { error } = await sb.from("scuderia_cavalli").update({ pdf_url, pdf_generato_at: generato_at }).eq("id", c.id);
    if(error) throw error;
  }
  await loadCavalli();
  renderCavalloDetail();
}
function etichettaStato(s){ return s.ultimo && !s.ultimo.data_scadenza ? "Senza scadenza" : STATUS_LABELS[s.status]; }

function openCavalloForm(id){
  editingCavalloId = id || null;
  document.getElementById("cavallo-error").style.display = "none";
  document.getElementById("cav-foto-file").value = "";
  const preview = document.getElementById("cav-foto-preview");
  if(editingCavalloId){
    const c = cavalliList.find(x => x.id === editingCavalloId);
    document.getElementById("modal-cavallo-title").textContent = "Modifica cavallo";
    document.getElementById("cav-nome").value = c?.nome || "";
    document.getElementById("cav-tipo-proprieta").value = c?.tipo_proprieta || "proprieta";
    razzaImposta("cav-razza", c?.razza || "");
    document.getElementById("cav-mantello").value = c?.mantello || "";
    document.getElementById("cav-nascita").value = c?.data_nascita || "";
    document.getElementById("cav-microchip").value = c?.microchip || "";
    document.getElementById("cav-gruppo-sanguigno").value = c?.gruppo_sanguigno || "";
    document.getElementById("cav-proprietario").value = c?.proprietario || "";
    document.getElementById("cav-codice-proprietario").value = "";
    document.getElementById("cav-note").value = c?.note || "";
    preview.innerHTML = c?.foto_url ? `<img src="${escapeHtml(urlSicuro(c.foto_url))}" style="width:80px;height:80px;object-fit:cover;border-radius:8px">` : "";
  } else {
    document.getElementById("modal-cavallo-title").textContent = "Nuovo cavallo";
    document.getElementById("cav-tipo-proprieta").value = "proprieta";
    razzaImposta("cav-razza", "");
    ["cav-nome","cav-mantello","cav-nascita","cav-microchip","cav-gruppo-sanguigno","cav-proprietario","cav-codice-proprietario","cav-note"].forEach(id => document.getElementById(id).value = "");
    preview.innerHTML = "";
  }
  openModal("modal-cavallo");
}

async function uploadCavalloFoto(file, cavalloId){
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${currentCentro.id}/${cavalloId}.${ext}`;
  const { error } = await sb.storage.from("cavalli-foto").upload(path, file, { upsert: true });
  if(error) throw error;
  const { data } = sb.storage.from("cavalli-foto").getPublicUrl(path);
  return data.publicUrl + "?t=" + Date.now();
}


