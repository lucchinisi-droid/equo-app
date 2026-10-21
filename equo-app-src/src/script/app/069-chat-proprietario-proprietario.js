/* ---------- CHAT PROPRIETARIO↔PROPRIETARIO ---------- */
let currentConversazioneId = null;
const OWNER_EMOJI_LIST = EMOJI_LIST;

function populateOwnerEmojiPicker(){
  const box = document.getElementById("ochat-emoji-picker");
  if(box.childElementCount > 0) return;
  box.innerHTML = OWNER_EMOJI_LIST.map(e => `<button type="button" onclick="insertOwnerEmoji('${e}')">${e}</button>`).join("");
}
function toggleOwnerEmojiPicker(){
  populateOwnerEmojiPicker();
  document.getElementById("ochat-emoji-picker").classList.toggle("active");
}
function insertOwnerEmoji(emoji){
  const input = document.getElementById("ochat-input");
  input.value += emoji;
  input.focus();
}

async function loadOwnerChatList(){
  const box = document.getElementById("owner-chat-list");
  if(!box) return;
  box.innerHTML = '<div class="loading"><div class="spinner"></div> Caricamento...</div>';
  const conversazioni = await DB.listConversazioniProprietario();
  if(!conversazioni || conversazioni.length === 0){
    box.innerHTML = '<div class="empty-state"><div class="icon" style="width:32px;height:32px;margin:0 auto 10px;color:var(--muted)"><svg><use href="#i-inbox"/></svg></div><div style="font-size:13.5px;line-height:1.6">Nessuna chat ancora.<br>Usa "+ Nuova chat" e il codice di un altro proprietario per iniziare.</div></div>';
    return;
  }
  box.innerHTML = conversazioni.map(c => {
    const nome = c.altro?.full_name || "Utente Equo";
    const m = c.ultimoMessaggio;
    let previewBody = "Inizia la conversazione";
    if(m){
      previewBody = (m.tipo && m.tipo !== "testo") ? previewAllegato(m.tipo, m.file_nome) : (m.testo || "");
      previewBody = (m.mittente_id === currentUser.id ? "Tu: " : "") + previewBody;
    }
    return `
    <div class="inbox-item ${c.unread > 0 ? "unread" : ""}" onclick="openOwnerChatThread(${jsArg(c.id)}, ${jsArg(nome)})">
      <div class="horse-avatar"><i class="fa-solid fa-user" style="font-size:20px"></i></div>
      <div style="flex:1;min-width:0">
        <div class="inbox-name" style="font-size:14px">${escapeHtml(nome)}</div>
        <div class="inbox-preview muted" style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(previewBody)}</div>
      </div>
      ${c.unread > 0 ? `<span class="inbox-unread-dot"></span>` : ""}
    </div>`;
  }).join("");
}

let currentStableMembro = null; // { membro_id, centro_id, nome }

async function loadStableChatSection(){
  const section = document.getElementById("stable-chat-section");
  const box = document.getElementById("stable-chat-list");
  if(!section || !box) return;
  const scuderie = await DB.listScuderieCollegate();
  if(!scuderie || scuderie.length === 0){ section.style.display = "none"; return; }
  section.style.display = "block";
  const conMessaggi = await Promise.all(scuderie.map(async s => ({ ...s, messaggi: await DB.listMessaggiScuderia(s.membro_id) })));
  box.innerHTML = conMessaggi.map(s => {
    const ultimo = s.messaggi[s.messaggi.length - 1];
    let preview = "Inizia la conversazione con la scuderia";
    if(ultimo) preview = (ultimo.mittente_user_id === currentUser.id ? "Tu: " : "") + (ultimo.testo || previewAllegato(ultimo.tipo, ultimo.file_nome));
    const nonLetti = contaNonLettiScuderia(s.membro_id, s.messaggi);
    return `
    <div class="inbox-item" onclick="openStableChatThread(${jsArg(s.membro_id)}, ${jsArg(s.centro_id)}, ${jsArg(s.nome)})">
      <div class="horse-avatar"><i class="fa-solid fa-horse-head" style="font-size:20px"></i></div>
      <div style="flex:1;min-width:0">
        <div class="inbox-name" style="font-size:14px">${escapeHtml(s.nome)}</div>
        <div class="inbox-preview muted" style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(preview)}</div>
      </div>
      ${nonLetti > 0 ? `<span class="inbox-unread-dot"></span>` : ""}
    </div>`;
  }).join("");
}

async function openStableChatThread(membroId, centroId, nome){
  currentStableMembro = { membro_id: membroId, centro_id: centroId, nome };
  document.getElementById("schat-nome").textContent = nome || "Scuderia";
  document.getElementById("schat-input").value = "";
  document.getElementById("schat-overlay").classList.add("active");
  await renderStableChatThread();
  avviaChatLive({ chiave: "schat:" + membroId, tabella: "chat_messaggi", colonna: "membro_id", valore: membroId, overlay: "schat-overlay",
    aggiorna: () => currentStableMembro ? renderStableChatThread() : null, segnaLetti: () => segnaLettiChatApp(membroId) });
  await segnaLettiChatApp(membroId);
  refreshChatBadge();
}

