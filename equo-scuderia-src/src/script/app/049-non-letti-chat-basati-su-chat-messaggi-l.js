/* ---------- NON LETTI CHAT (basati su chat_messaggi.letto, sul database:
   così il contatore è uguale su qualsiasi dispositivo/utente dello staff) ---------- */
let chatNonLettiPerMembro = {};
let chatUnreadPollTimer = null;

async function refreshChatUnread(){
  loadProfessionisti().then(() => { if(document.getElementById("module-professionisti")?.style.display === "block") renderProfessionistiList(); });
  if(DEMO_MODE || !currentCentro){
    impostaContatoreNav("chat-nav-unread-badge", 0, "verde");
    return;
  }
  const { data, error } = await sb.from("chat_messaggi")
    .select("membro_id, mittente_user_id")
    .eq("centro_id", currentCentro.id)
    .eq("letto", false);
  if(error){ console.error("refreshChatUnread:", error); return; }
  const map = {};
  (data || []).forEach(row => {
    const m = teamList.find(x => x.id === row.membro_id);
    // Conta solo i messaggi scritti dal cliente (non quelli scritti dallo staff
    // stesso, che non devono generare un "non letto" per lo staff).
    if(m && row.mittente_user_id === m.user_id){
      map[row.membro_id] = (map[row.membro_id] || 0) + 1;
    }
  });
  chatNonLettiPerMembro = map;
  const totale = Object.values(map).reduce((a, b) => a + b, 0);
  const badge = document.getElementById("chat-nav-unread-badge");
  if(badge) impostaContatoreNav("chat-nav-unread-badge", totale, totale > 0 ? "rosso" : "verde");
  renderClientiChatList();
  aggiornaBannerPush();
}

function startChatUnreadPolling(){
  clearInterval(chatUnreadPollTimer);
  refreshChatUnread();
  chatUnreadPollTimer = setInterval(() => { refreshChatUnread(); segnaConsegnati(); }, 20000);
  segnaConsegnati();
}

function renderClientiChatList(){
  const box = document.getElementById("clienti-chat-list");
  const empty = document.getElementById("clienti-chat-empty");
  if(!box) return;
  const query = (document.getElementById("clienti-chat-search")?.value || "").trim().toLowerCase();
  let list = clientiChatCollegati();
  if(query) list = list.filter(m => (m.nome_visualizzato || "").toLowerCase().includes(query));
  list = list.slice().sort((a,b) => (a.nome_visualizzato||"").localeCompare(b.nome_visualizzato||""));

  empty.style.display = clientiChatCollegati().length === 0 ? "block" : "none";
  box.innerHTML = list.map(m => `
    <div class="msg-item" style="display:flex;align-items:center;justify-content:space-between;gap:10px">
      <div style="display:flex;align-items:center">
        <div>
          <span class="who">${escapeHtml(m.nome_visualizzato || "Cliente")}</span>
          <div style="color:var(--muted);font-size:12px">${m.ruolo === "proprietario" ? "Proprietario" : (RUOLO_LABELS[m.ruolo] || m.ruolo)}</div>
        </div>
        ${chatNonLettiPerMembro[m.id] ? '<span class="unread-dot" title="Messaggi non letti"></span>' : ""}
      </div>
      <button class="btn btn-outline btn-sm" onclick="chattaConMembro('${m.id}')"><i class="fa-solid fa-comment-dots"></i> Chatta</button>
    </div>`).join("");
  if(query && list.length === 0 && clientiChatCollegati().length > 0){
    box.innerHTML = `<p style="color:var(--muted);font-size:12.5px;padding:8px 2px">Nessun cliente collegato trovato per "${escapeHtml(query)}".</p>`;
  }
}

let clienteAppenaCollegato = null; // { membro_id, nome }
function apriConfirmChatCliente(nome, membroId){
  clienteAppenaCollegato = { membro_id: membroId, nome };
  document.getElementById("chat-cliente-confirm-text").textContent = `Vuoi subito aprire una chat con ${nome}?`;
  openModal("modal-chat-cliente-confirm");
}
function chattaConProprietarioAppenaCollegato(){
  closeModal("modal-chat-cliente-confirm");
  if(clienteAppenaCollegato) chattaConMembro(clienteAppenaCollegato.membro_id);
  clienteAppenaCollegato = null;
}

