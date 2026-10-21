/* ---------- NOTIFICHE PUSH (OneSignal) ---------- */
// Collega lo staff loggato a OneSignal con external_id = id utente Supabase,
// così il server può inviargli notifiche mirate senza gestire noi i token.
async function collegaOneSignal(){
  if(DEMO_MODE || !currentUser?.id) return;
  try{
    if(typeof OneSignal === "undefined"){
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OS) => { await OS.login(currentUser.id); aggiornaBannerPush(); });
      return;
    }
    await OneSignal.login(currentUser.id);
    aggiornaBannerPush();
  } catch(err){
    console.error("collegaOneSignal:", err);
  }
}

function aggiornaBannerPush(){
  const banner = document.getElementById("push-permission-banner");
  if(!banner) return;
  try{
    const giaConcesso = typeof OneSignal !== "undefined" && OneSignal.Notifications?.permission;
    banner.style.display = giaConcesso ? "none" : "flex";
  } catch(err){ /* SDK non ancora pronto */ }
}

async function attivaNotifichePush(){
  try{
    if(typeof OneSignal === "undefined"){ showToast("Notifiche non disponibili al momento, riprova tra poco."); return; }
    await OneSignal.Notifications.requestPermission();
    aggiornaBannerPush();
    showToast(OneSignal.Notifications.permission ? "Notifiche attivate." : "Permesso non concesso.");
  } catch(err){
    console.error("attivaNotifichePush:", err);
    showToast("Non è stato possibile attivare le notifiche.");
  }
}

