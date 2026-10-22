/* ---------- COMUNICAZIONI ---------- */
async function refreshComunicazioniModule(){
  await loadMessaggi();
  renderMessaggi();
  renderClientiChatList();
}

