/* ---------- LIVELLI & PERMESSI ---------- */
function memberCanUI(azione){
  if(!currentMembro) return false;
  if(currentMembro.ruolo === "admin") return true;
  const livello = currentMembro.livello;
  if(livello === "2") return ["cavalli","lezioni","pacchetti","messaggi","contatti"].includes(azione);
  if(livello === "3") return !!(currentMembro.permessi && currentMembro.permessi[azione]);
  return false;
}

function applyPermissionGating(){
  const map = {
    "btn-nuovo-cavallo": "cavalli",
    "btn-modifica-cavallo": "cavalli",
    "btn-registra-evento": "eventi",
    "btn-nuova-lezione": "lezioni",
    "btn-nuovo-pacchetto": "pacchetti",
    "btn-nuovo-messaggio": "messaggi",
    "btn-aggiungi-contatto": "contatti",
  };
  Object.entries(map).forEach(([id, azione]) => {
    const el = document.getElementById(id);
    if(el) el.style.display = memberCanUI(azione) ? "" : "none";
  });
}

