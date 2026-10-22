
/* ---------- EQUO OFFLINE (passaggio A): service worker unico (push + copia dell'app) ----------
   Lo stesso file delle notifiche: se OneSignal l'ha già registrato non si fa nulla, altrimenti lo registriamo noi. */
(function(){
  if(!("serviceWorker" in navigator) || location.protocol !== "https:") return;
  window.addEventListener("load", async () => {
    try{
      const reg = await navigator.serviceWorker.getRegistration("/");
      if(!reg) await navigator.serviceWorker.register("/OneSignalSDKWorker.js", { scope: "/" });
    } catch(e){ console.warn("service worker:", e); }
  });
})();

