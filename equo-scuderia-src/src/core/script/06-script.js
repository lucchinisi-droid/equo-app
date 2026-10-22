
window.EQUO_INDIETRO_CHIUDI = {
  "modal-chat": () => closeChatModal(),
  "modal-chat-pro": () => chiudiChatProfessionista(),
};
window.EQUO_INDIETRO_PAGINA = function(){
  if(document.getElementById("sidebar")?.classList.contains("open")){ closeSidebar(); return true; }
  if(!currentUser || !currentCentro) return false;
  const det = document.getElementById("cavalli-detail-view");
  if(det && det.style.display !== "none" && det.offsetParent !== null){ closeCavalloDetail(); return true; }
  const aperto = [...document.querySelectorAll(".module-page")].find(p => p.style.display === "block");
  if(aperto && aperto.id !== "module-home"){ showModule("home"); return true; }
  return false;
};
