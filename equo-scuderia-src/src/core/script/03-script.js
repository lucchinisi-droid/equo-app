
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  OneSignalDeferred.push(async function(OneSignal){
    await OneSignal.init({ appId: "ec3d1231-0e8b-4691-9e6d-02c3f9f405e8",
      notificationClickHandlerMatch: "origin", notificationClickHandlerAction: "focus" });
    OneSignal.Notifications.addEventListener("click", (ev) => {
      const d = ev?.notification?.additionalData;
      if(d && d.apri === "chat") window.apriDaNotifica ? window.apriDaNotifica(d) : (window.__notificaInSospeso = d);
    });
  });
