// Equo App · chat · modulo (moduli ES, costruiti con Vite in ruoli/chat/costruito.js)
import { formatChatDay } from "./062-chat-mascalcia-stile-whatsapp.js";
import { citazioneHtml } from "./063-risposta-a-un-messaggio-stile-whatsapp.js";
import { attrBolla, oraBolla } from "./064-spunte-di-lettura-pallini.js";
import { aggiornaChatLive, applicaThread, avviaChatLive, bollaInAttesa, bollaNonInviata, fermaChatLive, inizioThread } from "./065-chat-fluida-stile-whatsapp.js";
import { formatRecTimer } from "./067-note-vocali.js";
import { renderChatCartelle } from "./068-messaggi-a-cartelle-stile-telegram-clien.js";
import { refreshChatBadge } from "./070-notifiche-badge-messaggi-non-letti.js";
/* ---------- CHAT TRA COLLEGHI (vista professionista) ---------- */
let chatColleghiAperta = false; // true quando l'overlay chat (ochat) è usato per un collega
async function loadColleghiList(){
  const box = document.getElementById("colleghi-list");
  if(!box) return;
  const lista = await DB.listColleghi();
  chatContatori.colleghi = { n: lista.length, nonLetti: lista.reduce((t, c) => t + (Number(c.unread) || 0), 0) };
  renderChatCartelle();
  if(!lista.length){
    box.innerHTML = '<div class="muted" style="font-size:13px;line-height:1.6;text-align:center;padding:6px 0">Nessun collega ancora.<br>Tocca "+ Collega" e inserisci il suo codice professionista.</div>';
    return;
  }
  box.innerHTML = lista.map(c => {
    const nome = c.nome || "Collega";
    const m = c.ultimoMessaggio;
    let preview = "Inizia la conversazione";
    if(m) preview = (m.mittente_id === currentUser.id ? "Tu: " : "") + ((m.tipo && m.tipo !== "testo") ? previewAllegato(m.tipo, m.file_nome) : (m.testo || ""));
    return `
    <div class="inbox-item ${c.unread > 0 ? "unread" : ""}" onclick="apriChatCollega(${jsArg(c.conversazione_id)}, ${jsArg(nome)}, ${jsArg(c.ruolo || "")})">
      <div class="horse-avatar">${c.avatar_url ? `<img src="${escapeHtml(c.avatar_url)}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">` : '<i class="fa-solid fa-user-doctor" style="font-size:18px"></i>'}</div>
      <div style="flex:1;min-width:0">
        <div class="inbox-name" style="font-size:14px">${escapeHtml(nome)}${c.certificato ? " " + BADGE_CERTIFIED_HTML : ""}</div>
        <div class="muted" style="font-size:11.5px">${escapeHtml(ROLE_LABELS[c.ruolo] || "Professionista")}</div>
        <div class="inbox-preview muted" style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(preview)}</div>
      </div>
      ${c.unread > 0 ? `<span class="inbox-unread-dot"></span>` : ""}
    </div>`;
  }).join("");
}
function apriNuovoCollega(){
  document.getElementById("nuovo-collega-codice").value = "";
  document.getElementById("nuovo-collega-error").style.display = "none";
  openModal("modal-nuovo-collega");
}
async function avviaChatCollega(){
  const codice = document.getElementById("nuovo-collega-codice").value.trim().toUpperCase();
  const errBox = document.getElementById("nuovo-collega-error");
  errBox.style.display = "none";
  if(!codice) return;
  const r = await DB.creaChatCollega(codice);
  if(!r || !r.ok){
    const msg = { codice_non_valido: "Codice non valido: controlla che sia un codice professionista (es. EQUOPRO0FKEM).", codice_tuo: "Questo è il tuo codice.", solo_professionisti: "La chat tra colleghi è per i professionisti." }[r?.errore];
    errBox.textContent = (msg || "Non sono riuscito ad avviare la chat, riprova.") + (DEMO_MODE ? " (in demo prova EQUO-PRO-DEMO)" : "");
    errBox.style.display = "block";
    return;
  }
  closeModal("modal-nuovo-collega");
  await loadColleghiList();
  await apriChatCollega(r.conversazione_id, r.nome || "Collega", r.ruolo || "");
}
async function apriChatCollega(conversazioneId, nome, ruolo){
  await openOwnerChatThread(conversazioneId, nome + (ROLE_LABELS[ruolo] ? " · " + ROLE_LABELS[ruolo] : ""), true);
}
async function invitaCollega(){
  const codice = await DB.ensureCodiceProfessionista();
  const text = `Ciao! Ti scrivo su Equo, l'app per chi lavora con i cavalli: chat, foto e casi in un posto solo. Scaricala su https://app.equohub.com e aggiungimi con il mio codice ${codice}`;
  if(navigator.share){ navigator.share({ text }).catch(() => {}); return; }
  window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
}
// Video e note vocali tra colleghi: solo Premium
function bloccaPremiumColleghi(cosa){
  if(!chatColleghiAperta || isPremium()) return false;
  showToast(cosa + " tra colleghi sono inclusi in Equo Premium");
  togglePiano();
  return true;
}

async function startNewChat(){
  const codice = document.getElementById("new-chat-codice").value.trim().toUpperCase();
  const errBox = document.getElementById("new-chat-error");
  errBox.style.display = "none";
  if(!codice) return;
  // codice di un maniscalco inserito per errore qui: lo colleghiamo come maniscalco
  if(["pro", "tra", "invito"].includes(tipoCodiceEquo(codice))){ gestisciCodiceScansionato(codice); return; }
  const altro = await DB.findProprietarioByCodice(codice);
  if(!altro){
    errBox.textContent = "Codice non valido." + (DEMO_MODE ? " (in demo prova EQUO-OWN-DEMO)" : "");
    errBox.style.display = "block";
    return;
  }
  const conversazioneId = await DB.getOrCreateConversazione(altro.id);
  if(!conversazioneId){
    errBox.textContent = "Errore nella creazione della chat, riprova.";
    errBox.style.display = "block";
    return;
  }
  document.getElementById("new-chat-codice").value = "";
  closeModal("modal-new-chat");
  await loadOwnerChatList();
  await openOwnerChatThread(conversazioneId, altro.full_name || "Utente Equo");
}

async function openOwnerChatThread(conversazioneId, nome, colleghi = false){
  chatColleghiAperta = !!colleghi;
  currentConversazioneId = conversazioneId;
  document.getElementById("ochat-nome").textContent = nome || "Utente Equo";
  document.getElementById("ochat-emoji-picker").classList.remove("active");
  document.getElementById("ochat-input").value = "";
  document.getElementById("ochat-overlay").classList.add("active");
  const letti = DB.markLettiProprietario(conversazioneId);
  await renderOwnerChatThread(conversazioneId);
  avviaChatLive({ chiave: "ochat:" + conversazioneId, tabella: "messaggi_proprietari", colonna: "conversazione_id", valore: conversazioneId, overlay: "ochat-overlay",
    aggiorna: () => renderOwnerChatThread(conversazioneId), segnaLetti: () => DB.markLettiProprietario(conversazioneId) });
  await letti;
  aggiornaListeChatProprietari();
  refreshChatBadge();
}
async function aggiornaListeChatProprietari(){
  if(chatColleghiAperta) await loadColleghiList(); else await loadOwnerChatList();
}

function closeOwnerChatThread(){
  if(ownerMediaRecorder && ownerMediaRecorder.state !== "inactive") cancelOwnerVoiceRecording();
  document.getElementById("ochat-overlay").classList.remove("active");
  fermaChatLive();
}

async function renderOwnerChatThread(conversazioneId){
  const box = document.getElementById("ochat-messages");
  const chiaveThread = "ochat:" + conversazioneId;
  inizioThread(box, chiaveThread);
  const data = await DB.listThreadProprietario(conversazioneId);
  if(!data || data.length === 0){
    box.innerHTML = '<div class="muted" style="font-size:13px;text-align:center;margin-top:20px">Nessun messaggio ancora.<br>Scrivi il primo messaggio qui sotto.</div>';
    box.dataset.thread = chiaveThread; box.dataset.vuoto = '1';
    return;
  }
  let lastDay = null;
  let html = "";
  data.forEach(m => {
    const day = formatChatDay(m.created_at);
    if(day !== lastDay){
      html += `<div class="mchat-day-sep" data-id="day-${escapeHtml(day)}">${day}</div>`;
      lastDay = day;
    }
    const out = m.mittente_id === currentUser.id;
    let body;
    if(m.tipo === "audio") body = `<div class="mchat-audio-bubble"><audio controls src="${escapeHtml(m.media_url)}"></audio></div>`;
    else if(m.tipo === "foto") body = `<img src="${escapeHtml(m.media_url)}" style="max-width:220px;border-radius:12px;display:block">
      <button class="btn btn-outline btn-sm" style="margin-top:6px;width:100%" onclick="shareContentExternally(${jsArg(urlSicuro(m.media_url))})">
        <span class="fa-icon" style="width:14px;height:14px"><i class="fa-solid fa-share-nodes"></i></span> Condividi fuori da Equo
      </button>`;
    else if(m.tipo === "video") body = `<video controls src="${escapeHtml(m.media_url)}" style="max-width:220px;border-radius:12px;display:block"></video>
      <div class="muted" style="font-size:11px;margin-top:4px">I video si condividono solo dentro Equo per ora.</div>`;
    else if(m.tipo === "documento") body = bollaAllegato("documento", m.media_url, m.file_nome, m.testo);
    else body = `<div class="mchat-bubble-text">${escapeHtml(m.testo)}</div>`;
    html += `
      <div class="mchat-bubble ${out ? "out" : "in"}"${attrBolla(m, out, "messaggi_proprietari")}>
        ${citazioneHtml(m)}${body}
        ${oraBolla(m, out)}
      </div>`;
  });
  applicaThread(box, chiaveThread, html);
}

async function sendOwnerChatMessage(){
  const input = document.getElementById("ochat-input");
  const testo = input.value.trim();
  if(!testo || !currentConversazioneId) return;
  input.value = "";
  input.focus();
  const convId = currentConversazioneId;
  const bolla = bollaInAttesa("ochat-messages", testo);
  const { error } = await DB.insertMessaggioProprietario({ conversazione_id: convId, tipo: "testo", testo });
  if(error){ bollaNonInviata(bolla); showToast("Non inviato: " + error.message); return; }
  if(currentConversazioneId === convId) await aggiornaChatLive(false);
  aggiornaListeChatProprietari();
}

async function handleOwnerChatMediaChange(event){
  const file = event.target.files && event.target.files[0];
  event.target.value = "";
  if(!file || !currentConversazioneId) return;
  const isVideo = file.type.startsWith("video/");
  const tipo = isVideo ? "video" : "foto";
  const ext = (file.name || "").split(".").pop() || (isVideo ? "mp4" : "jpg");
  showToast(isVideo ? "Caricamento video..." : "Caricamento foto...");
  const { url, error } = await DB.uploadMediaProprietario(file, currentConversazioneId, tipo, ext);
  if(error || !url){ showToast("Errore nel caricamento del file."); return; }
  const { error: insertError } = await DB.insertMessaggioProprietario({ conversazione_id: currentConversazioneId, tipo, media_url: url });
  if(insertError){ showToast("Errore: " + insertError.message); return; }
  await renderOwnerChatThread(currentConversazioneId);
  await aggiornaListeChatProprietari();
}

/* -- Note vocali chat proprietario (stesso pattern della chat mascalcia) -- */
let ownerMediaRecorder = null;
let ownerRecordedChunks = [];
let ownerRecordingTimer = null;
let ownerRecordingSeconds = 0;
let ownerRecordingStream = null;

async function startOwnerVoiceRecording(){
  // tra colleghi con il piano Free: note vocali come con i clienti (30 secondi, 5 al giorno in totale, controllo lato server)
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === "undefined"){
    showToast("Il tuo browser non supporta la registrazione vocale.");
    return;
  }
  try{
    ownerRecordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch(e){
    showToast("Permesso microfono negato. Abilitalo dalle impostazioni del browser.");
    return;
  }
  ownerRecordedChunks = [];
  try{
    ownerMediaRecorder = new MediaRecorder(ownerRecordingStream);
  } catch(e){
    showToast("Impossibile avviare la registrazione su questo dispositivo.");
    ownerRecordingStream.getTracks().forEach(t => t.stop());
    return;
  }
  ownerMediaRecorder.ondataavailable = e => { if(e.data && e.data.size > 0) ownerRecordedChunks.push(e.data); };
  ownerMediaRecorder.start();
  ownerRecordingSeconds = 0;
  document.getElementById("ochat-rec-timer").textContent = "0:00";
  document.getElementById("ochat-input-bar").style.display = "none";
  document.getElementById("ochat-recording-bar").classList.add("active");
  document.getElementById("ochat-emoji-picker").classList.remove("active");
  ownerRecordingTimer = setInterval(() => {
    ownerRecordingSeconds++;
    const limiteFree = chatColleghiAperta && !isPremium();
    document.getElementById("ochat-rec-timer").textContent = formatRecTimer(ownerRecordingSeconds) + (limiteFree ? " / 0:30" : "");
    if(limiteFree && ownerRecordingSeconds >= 30){ showToast("Piano Free: note vocali fino a 30 secondi."); stopAndSendOwnerVoiceRecording(); }
  }, 1000);
}

function stopOwnerRecordingInternal(){
  clearInterval(ownerRecordingTimer);
  ownerRecordingTimer = null;
  document.getElementById("ochat-input-bar").style.display = "flex";
  document.getElementById("ochat-recording-bar").classList.remove("active");
  if(ownerRecordingStream){ ownerRecordingStream.getTracks().forEach(t => t.stop()); ownerRecordingStream = null; }
}

function cancelOwnerVoiceRecording(){
  if(ownerMediaRecorder && ownerMediaRecorder.state !== "inactive"){
    ownerMediaRecorder.onstop = null;
    ownerMediaRecorder.stop();
  }
  ownerRecordedChunks = [];
  ownerMediaRecorder = null;
  stopOwnerRecordingInternal();
}

async function stopAndSendOwnerVoiceRecording(){
  if(!ownerMediaRecorder || ownerMediaRecorder.state === "inactive") return;
  const conversazioneId = currentConversazioneId;
  ownerMediaRecorder.onstop = async () => {
    stopOwnerRecordingInternal();
    if(ownerRecordedChunks.length === 0){ showToast("Registrazione troppo breve, riprova."); return; }
    const blob = new Blob(ownerRecordedChunks, { type: ownerMediaRecorder.mimeType || "audio/webm" });
    ownerRecordedChunks = [];
    ownerMediaRecorder = null;
    const { url, error } = await DB.uploadMediaProprietario(blob, conversazioneId, "audio", "webm");
    if(error || !url){ showToast("Errore nel caricamento della nota vocale."); return; }
    const { error: insertError } = await DB.insertMessaggioProprietario({ conversazione_id: conversazioneId, tipo: "audio", media_url: url });
    if(insertError){ showToast(/Premium|piano Free/i.test(insertError.message || "") ? insertError.message : "Errore: " + insertError.message); return; }
    await renderOwnerChatThread(conversazioneId);
    await loadOwnerChatList();
  };
  ownerMediaRecorder.stop();
}


export { aggiornaListeChatProprietari, apriChatCollega, apriNuovoCollega, avviaChatCollega, bloccaPremiumColleghi, cancelOwnerVoiceRecording, chatColleghiAperta, closeOwnerChatThread, handleOwnerChatMediaChange, invitaCollega, loadColleghiList, openOwnerChatThread, renderOwnerChatThread, sendOwnerChatMessage, startNewChat, startOwnerVoiceRecording, stopAndSendOwnerVoiceRecording };
