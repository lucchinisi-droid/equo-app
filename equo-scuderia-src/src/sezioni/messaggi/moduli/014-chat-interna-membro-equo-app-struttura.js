// Equo App · messaggi · modulo (moduli ES, costruiti con Vite in ruoli/messaggi/costruito.js)
import { renderChatMessaggi } from "./015-spunte-di-lettura-pallini-come-in-equo-a.js";
import { refreshChatUnread } from "./049-non-letti-chat-basati-su-chat-messaggi-l.js";
/* ---------- CHAT INTERNA (membro Equo App <-> struttura) ---------- */
// TODO: verifica/aggiorna con il dominio reale di produzione di Equo App.
const EQUO_APP_URL = "https://equo-app.netlify.app";

let currentChatMembro = null; // { id, user_id, nome_visualizzato }
let chatPollTimer = null;
const appProfileCache = {};

async function hasAppProfile(userId){
  if(!userId) return false;
  if(DEMO_MODE) return userId === "u3"; // in demo, solo Giulia Verdi "ha l'app"
  if(userId in appProfileCache) return appProfileCache[userId];
  const { data, error } = await sb.rpc("has_equo_app_profile", { check_user_id: userId });
  const result = !error && !!data;
  appProfileCache[userId] = result;
  return result;
}

async function chattaConMembro(membroId){
  const m = teamList.find(x => x.id === membroId);
  if(!m){ showToast("Membro non trovato."); return; }
  const haApp = await hasAppProfile(m.user_id);
  if(haApp){
    openChatModal(m);
  } else {
    copyInviteText(m);
  }
}

function copyInviteText(m){
  const nome = m.nome_visualizzato || "";
  const testo = `Ciao${nome ? " " + nome : ""}! Scarica Equo per gestire il tuo cavallo e chattare direttamente con ${currentCentro?.nome || "il centro ippico"}: ${EQUO_APP_URL}`;
  navigator.clipboard?.writeText(testo).then(() => {
    showToast(`${nome || "Questo membro"} non ha ancora Equo App — messaggio di invito copiato, incollalo dove preferisci (WhatsApp, email, SMS).`);
  }).catch(() => {
    showToast("Impossibile copiare automaticamente. Testo invito: " + testo);
  });
}

function openChatModal(m){
  currentChatMembro = m;
  document.getElementById("chat-membro-nome").textContent = "Chat con " + (m.nome_visualizzato || RUOLO_LABELS[m.ruolo] || "membro");
  openModal("modal-chat");
  loadAndRenderChat();
  segnaLettiChat(m.id);
  clearInterval(chatPollTimer);
  chatPollTimer = setInterval(loadAndRenderChat, 4000);
  ascoltaChat("chat_messaggi", "membro_id", m.id, async () => { await loadAndRenderChat(); if(currentChatMembro) segnaLettiChat(currentChatMembro.id); });
  setTimeout(() => document.getElementById("chat-input")?.focus(), 100);
}

// Segna come letti i messaggi ricevuti in questo thread (lato database, non
// localStorage: così il "letto" è uguale su qualsiasi dispositivo/utente).
async function segnaLettiChat(membroId){
  if(DEMO_MODE) return;
  const { error } = await sb.rpc("segna_letti_chat", { p_membro_id: membroId });
  if(error){ console.error("segnaLettiChat:", error); return; }
  await refreshChatUnread();
}

function closeChatModal(){
  closeModal("modal-chat");
  clearInterval(chatPollTimer);
  chatPollTimer = null;
  smettiAscoltoChat();
  currentChatMembro = null;
}

async function loadAndRenderChat(){
  if(!currentChatMembro) return;
  let messaggi;
  if(DEMO_MODE){
    demoState.chat = demoState.chat || {};
    messaggi = demoState.chat[currentChatMembro.id] || [];
  } else {
    const { data, error } = await sb.from("chat_messaggi")
      .select("*")
      .eq("centro_id", currentCentro.id)
      .eq("membro_id", currentChatMembro.id)
      .order("created_at", { ascending: true });
    if(error) console.error("loadAndRenderChat:", error);
    messaggi = error ? [] : (data || []);
  }
  renderChatMessaggi(messaggi);
}


export { chattaConMembro, closeChatModal, currentChatMembro, loadAndRenderChat, openChatModal, segnaLettiChat };
