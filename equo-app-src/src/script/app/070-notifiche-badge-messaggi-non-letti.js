/* ---------- NOTIFICHE / BADGE MESSAGGI NON LETTI ---------- */
// "Letto" vive nel database (colonna chat_messaggi.letto), non nel browser:
// così il contatore è identico su qualsiasi dispositivo del proprietario.
async function segnaLettiChatApp(membroId){
  if(DEMO_MODE) return;
  const { error } = await sb.rpc("segna_letti_chat", { p_membro_id: membroId });
  if(error) console.error("segnaLettiChatApp:", error);
}
function contaNonLettiScuderia(membroId, messaggi){
  return (messaggi || []).filter(m => m.mittente_user_id !== currentUser.id && !m.letto).length;
}

let chatBadgePollTimer = null;
async function computeChatUnreadTotal(){
  let total = 0;
  const conversazioni = await DB.listConversazioniProprietario();
  (conversazioni || []).forEach(c => { total += c.unread || 0; });
  const scuderie = await DB.listScuderieCollegate();
  for(const s of scuderie){
    const msgs = await DB.listMessaggiScuderia(s.membro_id);
    total += contaNonLettiScuderia(s.membro_id, msgs);
  }
  const maniscalchi = await DB.listManiscalchiCollegati();
  maniscalchi.forEach(f => { total += Number(f.non_letti) || 0; });
  return total;
}
async function refreshChatBadge(){
  if(DEMO_MODE || !currentUser) return;
  const total = await computeChatUnreadTotal();
  const badge = document.getElementById("owner-chat-nav-badge");
  if(badge) badge.style.display = total > 0 || daSaldareStato.daRicordare ? "block" : "none";
}

