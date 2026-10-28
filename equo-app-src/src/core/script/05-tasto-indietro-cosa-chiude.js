
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
  // maniscalco, Clienti: prima la scheda del cavallo, poi la scheda del cliente, poi l'elenco (28/10/2026: la pagina è «pro-clienti»)
  if(pag === "pro-clienti" && vis("cavallo-pro-view") && typeof chiudiSchedaCavalloPro === "function"){ chiudiSchedaCavalloPro(); return true; }
  if(pag === "pro-clienti" && vis("clienti-detail-view") && typeof closeClienteDetail === "function"){ closeClienteDetail(); return true; }
  if(vis("cavalli-detail-view")){ closeHorseDetail(); return true; }
  const home = homeDellaVista();
  if(pag && pag !== home){ goHome(); return true; }
  return false;
};
