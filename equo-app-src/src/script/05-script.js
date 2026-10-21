
window.EQUO_INDIETRO_CHIUDI = {
  "ai-sheet-overlay": () => closeAiSheet(),
  "mchat-overlay": () => closeChatThread(),
  "fchat-overlay": () => closeFarrierChatThread(),
  "schat-overlay": () => closeStableChatThread(),
  "ochat-overlay": () => closeOwnerChatThread(),
  "legal-overlay": () => closeLegalPage(),
  "allegati-overlay": () => chiudiMenuAllegati(),
};
window.EQUO_INDIETRO_PAGINA = function(){
  if(!currentUser) return false;
  const pag = (document.querySelector(".page-content.active")?.id || "").replace("page-", "");
  const vis = id => { const el = document.getElementById(id); return !!el && el.style.display !== "none" && el.offsetParent !== null; };
  if(pag === "clienti" && vis("clienti-detail-view")){ closeClienteDetail(); return true; }
  if(vis("cavalli-detail-view")){ closeHorseDetail(); return true; }
  const home = PRO_ROLES.includes(currentUser.ruolo) ? "pro-home" : "home";
  if(pag && pag !== home){ goHome(); return true; }
  return false;
};
