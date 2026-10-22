// Equo App · chat · modulo (moduli ES, costruiti con Vite in ruoli/chat/costruito.js)
import { renderChatThread } from "./065-chat-fluida-stile-whatsapp.js";
import { renderChatCartelle, renderInboxStrutture } from "./068-messaggi-a-cartelle-stile-telegram-clien.js";
/* ---------- NOTE VOCALI ---------- */
let mediaRecorder = null;
let recordedChunks = [];
let recordingTimer = null;
let recordingSeconds = 0;
let recordingStream = null;

function formatRecTimer(sec){
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ":" + String(s).padStart(2, "0");
}

async function startVoiceRecording(){
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === "undefined"){
    showToast("Il tuo browser non supporta la registrazione vocale.");
    return;
  }
  try{
    recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch(e){
    showToast("Permesso microfono negato. Abilitalo dalle impostazioni del browser.");
    return;
  }
  recordedChunks = [];
  try{
    mediaRecorder = new MediaRecorder(recordingStream);
  } catch(e){
    showToast("Impossibile avviare la registrazione su questo dispositivo.");
    recordingStream.getTracks().forEach(t => t.stop());
    return;
  }
  mediaRecorder.ondataavailable = e => { if(e.data && e.data.size > 0) recordedChunks.push(e.data); };
  mediaRecorder.start();
  recordingSeconds = 0;
  document.getElementById("mchat-rec-timer").textContent = "0:00";
  document.getElementById("mchat-input-bar").style.display = "none";
  document.getElementById("mchat-recording-bar").classList.add("active");
  document.getElementById("mchat-emoji-picker").classList.remove("active");
  recordingTimer = setInterval(() => {
    recordingSeconds++;
    document.getElementById("mchat-rec-timer").textContent = formatRecTimer(recordingSeconds) + (isPremium() ? "" : " / 0:30");
    // piano Free del professionista: note vocali max 30 secondi (e 5 al giorno, controllo lato server)
    if(!isPremium() && recordingSeconds >= 30){ showToast("Piano Free: note vocali fino a 30 secondi."); stopAndSendVoiceRecording(); }
  }, 1000);
}

function stopRecordingInternal(){
  clearInterval(recordingTimer);
  recordingTimer = null;
  document.getElementById("mchat-input-bar").style.display = "flex";
  document.getElementById("mchat-recording-bar").classList.remove("active");
  if(recordingStream){ recordingStream.getTracks().forEach(t => t.stop()); recordingStream = null; }
}

function cancelVoiceRecording(){
  if(mediaRecorder && mediaRecorder.state !== "inactive"){
    mediaRecorder.onstop = null;
    mediaRecorder.stop();
  }
  recordedChunks = [];
  mediaRecorder = null;
  stopRecordingInternal();
}

async function stopAndSendVoiceRecording(){
  if(!mediaRecorder || mediaRecorder.state === "inactive") return;
  const clienteId = currentClienteId;
  mediaRecorder.onstop = async () => {
    stopRecordingInternal();
    if(recordedChunks.length === 0){ showToast("Registrazione troppo breve, riprova."); return; }
    const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || "audio/webm" });
    recordedChunks = [];
    mediaRecorder = null;
    const { url, error } = await DB.uploadNotaVocaleMascalcia(blob, clienteId);
    if(error || !url){ showToast("Errore nel caricamento della nota vocale."); return; }
    const { error: insertError } = await DB.insertMessaggioMascalcia({ cliente_mascalcia_id: clienteId, tipo: "audio", audio_url: url });
    if(insertError){ showToast("Errore: " + insertError.message); return; }
    await renderChatThread(clienteId);
    await loadInboxMascalcia();
  };
  mediaRecorder.stop();
}

function shareInviteCodeFromChat(){
  const c = clientiMascalcia.find(x => x.id === currentClienteId);
  if(!c) return;
  const text = `Il tuo codice per collegarti a me su Equo: ${c.codice_invito}\nApri Equo App (app.equohub.com) → Chat → "Il tuo maniscalco" → Collega.`;
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(() => showToast("Codice copiato negli appunti!"))
      .catch(() => showToast("Non sono riuscito a copiare, riprova."));
  } else {
    showToast("Codice: " + c.codice_invito);
  }
}

async function loadInboxMascalcia(){
  const box = document.getElementById("inbox-list");
  if(!box) return;
  box.innerHTML = '<div class="loading"><div class="spinner"></div> Caricamento...</div>';
  const data = await DB.listInboxMascalcia();

  // Un conteggio non letti per cliente (calcolato su tutti i messaggi, non solo sull'ultimo)
  const unreadByCliente = {};
  data.forEach(m => {
    if(m.mittente_tipo === "cliente" && !m.letto){
      unreadByCliente[m.cliente_mascalcia_id] = (unreadByCliente[m.cliente_mascalcia_id] || 0) + 1;
    }
  });

  // Tiene solo il messaggio più recente per cliente come anteprima (i dati arrivano già ordinati per data desc)
  const seen = new Set();
  const conversazioni = [];
  data.forEach(m => {
    if(seen.has(m.cliente_mascalcia_id)) return;
    seen.add(m.cliente_mascalcia_id);
    conversazioni.push(m);
  });

  const totalUnread = Object.values(unreadByCliente).reduce((a,b) => a+b, 0);
  proUnreadTotal = totalUnread;
  if(typeof wgPro !== "undefined"){
    const u = conversazioni[0];
    wgPro.unread = totalUnread;
    wgPro.ultimo = u ? { nome: u.clienti_mascalcia?.nome || "Cliente", testo: u.testo || (u.tipo === "audio" ? "Nota vocale" : u.file_nome ? "Allegato: " + u.file_nome : "Allegato") } : null;
    if(typeof wgRidisegna === "function") wgRidisegna();
  }
  const navBadge = document.getElementById("inbox-nav-badge");
  if(navBadge) navBadge.style.display = totalUnread > 0 ? "block" : "none";

  // cartella Scuderie: scuderie collegate a Equo Scuderia e clienti di tipo scuderia; cartella Clienti: i proprietari
  const eScuderia = m => !!m.clienti_mascalcia?.centro_id || m.clienti_mascalcia?.tipo_cliente === "struttura"
    || isStruttura((clientiMascalcia || []).find(c => c.id === m.cliente_mascalcia_id));
  const strutture = conversazioni.filter(eScuderia);
  const clientiConv = conversazioni.filter(m => !eScuderia(m));
  renderInboxStrutture(strutture, unreadByCliente);
  chatContatori.clienti = { n: clientiConv.length, nonLetti: clientiConv.reduce((t, m) => t + (unreadByCliente[m.cliente_mascalcia_id] || 0), 0) };
  chatContatori.scuderie = { n: strutture.length, nonLetti: strutture.reduce((t, m) => t + (unreadByCliente[m.cliente_mascalcia_id] || 0), 0) };
  renderChatCartelle();

  if(clientiConv.length === 0){
    box.innerHTML = '<div class="empty-state"><div class="icon" style="width:32px;height:32px;margin:0 auto 10px;color:var(--muted)"><svg><use href="#i-inbox"/></svg></div><div style="font-size:13.5px;line-height:1.6">Nessun messaggio con i proprietari.<br>Le conversazioni con i clienti appariranno qui.</div></div>';
    return;
  }

  box.innerHTML = clientiConv.map(m => {
    const unread = unreadByCliente[m.cliente_mascalcia_id] || 0;
    const nome = m.clienti_mascalcia?.nome || "Cliente";
    const cavallo = m.clienti_mascalcia?.nome_cavallo;
    const previewBody = previewMessaggioMascalcia(m.tipo, m.testo, m.file_nome);
    const preview = (m.mittente_tipo === "maniscalco" ? "Tu: " : "") + previewBody;
    return `
    <div class="inbox-item ${unread > 0 ? "unread" : ""}" onclick="openChatThread('${m.cliente_mascalcia_id}')">
      <div class="horse-avatar"><i class="fa-solid fa-user" style="font-size:20px"></i></div>
      <div style="flex:1;min-width:0">
        <div class="inbox-name" style="font-size:14px">${escapeHtml(nome)}${cavallo ? " · " + escapeHtml(cavallo) : ""}</div>
        <div class="inbox-preview muted" style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(preview)}</div>
      </div>
      ${unread > 0 ? `<span class="inbox-unread-dot"></span>` : ""}
    </div>`;
  }).join("");
}


export { cancelVoiceRecording, formatRecTimer, loadInboxMascalcia, mediaRecorder, shareInviteCodeFromChat, startVoiceRecording, stopAndSendVoiceRecording };
