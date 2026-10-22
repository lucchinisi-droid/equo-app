// Equo App · messaggi · modulo (moduli ES, costruiti con Vite in ruoli/messaggi/costruito.js)
/* ---------- CHATTA CON I TUOI CLIENTI ---------- */
function clientiChatCollegati(){
  // Persone già collegate al centro con account Equo App: proprietari agganciati
  // a un cavallo (ruolo "proprietario") + membri del team che hanno un account.
  return teamList.filter(m => m.user_id && m.user_id !== currentUser.id && (m.ruolo === "proprietario" || m.ruolo !== "admin"));
}


export { clientiChatCollegati };
