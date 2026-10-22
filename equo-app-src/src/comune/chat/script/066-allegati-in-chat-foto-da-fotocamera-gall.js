/* ---------- ALLEGATI IN CHAT (foto da fotocamera/galleria, PDF) ---------- */
let allegatoChatTarget = null; // "mchat" (maniscalco→cliente) | "fchat" (cliente→maniscalco) | "schat" (proprietario→scuderia) | "ochat" (tra proprietari)
function apriMenuAllegati(chat){
  allegatoChatTarget = chat;
  // video: tra proprietari per tutti (come prima); verso maniscalco e scuderia solo per i proprietari Premium
  const videoPremium = chat === "fchat" || chat === "schat" || (chat === "ochat" && chatColleghiAperta)
    || (chat === "mchat" && isStrutturaCollegata(currentClienteId));
  const video = (chat === "ochat" && !chatColleghiAperta) || (videoPremium && isPremium());
  document.getElementById("allegato-galleria").accept = video ? "image/*,video/*" : "image/*";
  document.getElementById("allegati-galleria-label").textContent = video ? "Foto o video dalla galleria" : "Foto dalla galleria";
  document.getElementById("allegati-video-premium").style.display = (videoPremium && !isPremium()) ? "flex" : "none";
  document.getElementById("allegati-overlay").classList.add("active");
}
function chiudiMenuAllegati(){ document.getElementById("allegati-overlay").classList.remove("active"); }
function scegliAllegato(fonte){
  chiudiMenuAllegati();
  document.getElementById("allegato-" + fonte).click();
}
function durataVideo(file){
  return new Promise(ok => {
    const v = document.createElement("video"); const u = URL.createObjectURL(file);
    v.preload = "metadata";
    v.onloadedmetadata = () => { URL.revokeObjectURL(u); ok(v.duration || 0); };
    v.onerror = () => { URL.revokeObjectURL(u); ok(0); };
    v.src = u;
  });
}
async function allegatoScelto(event){
  const file = event.target.files && event.target.files[0];
  event.target.value = "";
  const chat = allegatoChatTarget;
  if(!file || !chat) return;
  const isVideo = (file.type || "").startsWith("video/") || /\.(mp4|mov|m4v|webm|3gp)$/i.test(file.name || "");
  if(chat === "ochat" && isVideo){
    if(bloccaPremiumColleghi("I video")) return;
    return handleOwnerChatMediaChange({ target: { files: [file], value: "" } });
  }
  if(isVideo){
    if(!(chat === "fchat" || chat === "schat" || (chat === "mchat" && isStrutturaCollegata(currentClienteId)))){ showToast("Qui puoi allegare foto o documenti PDF."); return; }
    if(!isPremium()){ showToast("I video in chat sono inclusi in Equo Premium"); togglePiano(); return; }
    if(file.size > 50 * 1024 * 1024){ showToast("Video troppo pesante (max 50 MB): accorcialo o riprendilo a qualità più bassa."); return; }
    const durata = await durataVideo(file);
    if(durata > 62){ showToast("Video troppo lungo: massimo 1 minuto."); return; }
  }
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
  const isImg = (file.type || "").startsWith("image/") || /\.(jpe?g|png|heic|heif|webp)$/i.test(file.name || "");
  if(!isPdf && !isImg && !isVideo){ showToast("Puoi allegare foto o documenti PDF."); return; }
  if(isPdf && file.size > 10 * 1024 * 1024){ showToast("PDF troppo grande (max 10 MB)."); return; }
  const tipo = isVideo ? "video" : isPdf ? "documento" : "foto";
  showToast(isVideo ? "Invio del video… (può volerci qualche secondo)" : isPdf ? "Invio del PDF…" : "Invio della foto…");
  const { url, nome, error: upErr } = await DB.uploadAllegatoChat(file, chat, tipo);
  if(upErr || !url){ showToast("Caricamento non riuscito: " + (upErr?.message || "riprova")); return; }
  let error = null;
  if(chat === "mchat" && currentClienteId){
    ({ error } = await DB.insertMessaggioMascalcia({ cliente_mascalcia_id: currentClienteId, tipo, file_url: url, file_nome: nome }));
    if(!error){ await renderChatThread(currentClienteId); await loadInboxMascalcia(); }
  } else if(chat === "fchat" && currentFarrier){
    ({ error } = await DB.inviaAllegatoAlManiscalco(currentFarrier.cliente_mascalcia_id, tipo, url, nome));
    if(!error){ await renderFarrierChatThread(); loadFarrierChatSection(); }
  } else if(chat === "schat" && currentStableMembro){
    ({ error } = await DB.inviaMessaggioScuderia({ centro_id: currentStableMembro.centro_id, membro_id: currentStableMembro.membro_id, tipo, file_url: url, file_nome: nome }));
    if(!error){ await renderStableChatThread(); await loadStableChatSection(); }
  } else if(chat === "ochat" && currentConversazioneId){
    ({ error } = await DB.insertMessaggioProprietario({ conversazione_id: currentConversazioneId, tipo, media_url: url, file_nome: isPdf ? nome : null }));
    if(!error){ await renderOwnerChatThread(currentConversazioneId); await aggiornaListeChatProprietari(); }
  } else return;
  if(error) showToast("Invio non riuscito: " + (error.message || "riprova"));
}

async function sendMascalciaMessage(){
  const input = document.getElementById("mchat-input");
  const testo = input.value.trim();
  if(!currentClienteId) return;
  if(chatAllegatoEvento){
    const ev = chatAllegatoEvento;
    showToast("Invio PDF in corso…");
    try {
      const { blob, nome } = ev.__conto ? await creaPdfConto(ev.__conto) : await creaPdfEvento(ev);
      const { url, error: upErr } = await DB.uploadDocumentoMascalcia(blob, currentClienteId);
      if(upErr || !url){ showToast("Errore caricamento PDF: " + (upErr?.message || "")); return; }
      const { error } = await DB.insertMessaggioMascalcia({ cliente_mascalcia_id: currentClienteId, tipo: "documento", testo, file_url: url, file_nome: nome });
      if(error){ showToast("Errore: " + error.message); return; }
    } catch(err){
      console.error("invio PDF:", err);
      showToast("Impossibile creare il PDF: " + (err?.message || err));
      return;
    }
    input.value = "";
    rimuoviAllegatoChat();
    await renderChatThread(currentClienteId);
    await loadInboxMascalcia();
    return;
  }
  if(!testo) return;
  input.value = "";
  input.focus();
  const clienteId = currentClienteId;
  const bolla = bollaInAttesa("mchat-messages", testo);
  const { error } = await DB.insertMessaggioMascalcia({ cliente_mascalcia_id: clienteId, tipo: "testo", testo });
  if(error){ bollaNonInviata(bolla); showToast("Non inviato: " + error.message); return; }
  if(currentClienteId === clienteId) await aggiornaChatLive(false);
  loadInboxMascalcia();
}

