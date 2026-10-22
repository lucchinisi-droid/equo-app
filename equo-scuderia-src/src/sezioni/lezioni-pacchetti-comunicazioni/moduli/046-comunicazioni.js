// Equo App · lezioni-pacchetti-comunicazioni · modulo (moduli ES, costruiti con Vite in ruoli/lezioni-pacchetti-comunicazioni/costruito.js)
/* ---------- COMUNICAZIONI ---------- */
async function refreshComunicazioniModule(){
  await loadMessaggi();
  renderMessaggi();
  renderClientiChatList();
}


export { refreshComunicazioniModule };
