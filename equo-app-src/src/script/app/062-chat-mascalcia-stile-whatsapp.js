/* ---------- CHAT MASCALCIA (stile WhatsApp) ---------- */
const EMOJI_LIST = ["😀","😂","😊","😉","😍","🙂","😅","😎","🤔","👍","🙏","👏","💪","🤝","❤️","🔥",
  "✅","⏰","📅","📍","🐴","🐎","🧑‍🌾","🔨","👢","🩺","💬","📞","🚗","☀️","🌧️","⚠️"];

function populateEmojiPicker(){
  const box = document.getElementById("mchat-emoji-picker");
  if(box.childElementCount > 0) return;
  box.innerHTML = EMOJI_LIST.map(e => `<button type="button" onclick="insertEmoji('${e}')">${e}</button>`).join("");
}

function toggleEmojiPicker(){
  populateEmojiPicker();
  document.getElementById("mchat-emoji-picker").classList.toggle("active");
}

function insertEmoji(emoji){
  const input = document.getElementById("mchat-input");
  input.value += emoji;
  input.focus();
}

async function openChatThread(clienteId){
  if(!clienteId) return;
  currentClienteId = clienteId;
  if(!clientiMascalcia || !clientiMascalcia.some(x => x.id === clienteId)) clientiMascalcia = await DB.listClientiMascalcia();
  const c = clientiMascalcia.find(x => x.id === clienteId);
  document.getElementById("mchat-cliente-nome").textContent = c?.nome || "Cliente";
  const strutturaColl = isStrutturaCollegata(clienteId);
  document.getElementById("mchat-cliente-sub").textContent = strutturaColl ? "Scuderia collegata · Equo Scuderia" : (c?.nome_cavallo || "");
  const btnCodice = document.querySelector('#mchat-overlay [onclick="shareInviteCodeFromChat()"]');
  if(btnCodice) btnCodice.style.display = strutturaColl ? "none" : "";
  const btnInt = document.getElementById("mchat-btn-intervento");
  if(btnInt) btnInt.textContent = strutturaColl ? "Proponi appuntamento" : "Segna intervento fatto";
  document.getElementById("mchat-emoji-picker").classList.remove("active");
  document.getElementById("mchat-input").value = "";
  document.getElementById("mchat-overlay").classList.add("active");
  const letti = DB.markLettiMascalcia(clienteId);
  await renderChatThread(clienteId);
  avviaChatLive({ chiave: "mchat:" + clienteId, tabella: "messaggi_mascalcia", colonna: "cliente_mascalcia_id", valore: clienteId, overlay: "mchat-overlay",
    aggiorna: () => renderChatThread(clienteId), segnaLetti: () => DB.markLettiMascalcia(clienteId).then(() => loadInboxMascalcia()) });
  await letti;
  loadInboxMascalcia(); // aggiorna badge/anteprima non appena i messaggi sono segnati come letti
}

function closeChatThread(){
  if(mediaRecorder && mediaRecorder.state !== "inactive") cancelVoiceRecording();
  rimuoviAllegatoChat();
  document.getElementById("mchat-overlay").classList.remove("active");
  fermaChatLive();
}

function formatChatTime(iso){
  return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}
function formatChatDay(iso){
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if(isToday) return "Oggi";
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  if(d.toDateString() === yesterday.toDateString()) return "Ieri";
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

