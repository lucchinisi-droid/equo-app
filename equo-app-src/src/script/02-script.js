
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  OneSignalDeferred.push(async function(OneSignal){
    await OneSignal.init({ appId: "440aeba3-69c9-4dc8-ad3d-9bf6f23ae7f0",
      // se l'app è già aperta la notifica la porta in primo piano e apre la chat giusta (evento "click" sotto)
      notificationClickHandlerMatch: "origin", notificationClickHandlerAction: "focus" });
    OneSignal.Notifications.addEventListener("click", (ev) => {
      const d = ev?.notification?.additionalData;
      if(d && d.apri === "chat") window.apriDaNotifica ? window.apriDaNotifica(d) : (window.__notificaInSospeso = d);
    });
  });
