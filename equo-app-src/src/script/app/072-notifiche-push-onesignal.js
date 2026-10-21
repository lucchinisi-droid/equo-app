/* ---------- NOTIFICHE PUSH (OneSignal) ---------- */
// Collega l'utente loggato a OneSignal con un id stabile (external_id = id
// utente Supabase), così il server può inviargli notifiche mirate senza
// dover gestire noi i token dei singoli dispositivi.
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
  } catch(err){ /* SDK non ancora pronto: banner resta nascosto, si aggiorna al prossimo giro */ }
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
function startChatBadgePolling(){
  refreshChatBadge();
  clearInterval(chatBadgePollTimer);
  chatBadgePollTimer = setInterval(refreshChatBadge, 25000);
}

function closeStableChatThread(){
  document.getElementById("schat-overlay").classList.remove("active");
  fermaChatLive();
  currentStableMembro = null;
}

async function renderStableChatThread(){
  const box = document.getElementById("schat-messages");
  const chiaveThread = "schat:" + currentStableMembro.membro_id;
  inizioThread(box, chiaveThread);
  const data = await DB.listMessaggiScuderia(currentStableMembro.membro_id);
  if(!data || data.length === 0){
    box.innerHTML = '<div class="muted" style="font-size:13px;text-align:center;margin-top:20px">Nessun messaggio ancora.<br>Scrivi il primo messaggio qui sotto.</div>';
    box.dataset.thread = chiaveThread; box.dataset.vuoto = '1';
    return;
  }
  let lastDay = null;
  let html = "";
  data.forEach(m => {
    const day = formatChatDay(m.created_at);
    if(day !== lastDay){
      html += `<div class="mchat-day-sep" data-id="day-${escapeHtml(day)}">${day}</div>`;
      lastDay = day;
    }
    const out = m.mittente_user_id === currentUser.id;
    const body = (m.tipo === "foto" || m.tipo === "documento" || m.tipo === "video") ? bollaAllegato(m.tipo, m.file_url, m.file_nome, m.testo)
      : `<div class="mchat-bubble-text">${escapeHtml(m.testo || "")}</div>`;
    html += `
      <div class="mchat-bubble ${out ? "out" : "in"}"${attrBolla(m, out, "chat_messaggi")}>
        ${citazioneHtml(m)}${body}
        ${oraBolla(m, out)}
      </div>`;
  });
  applicaThread(box, chiaveThread, html);
}

async function sendStableChatMessage(){
  const input = document.getElementById("schat-input");
  const testo = input.value.trim();
  if(!testo || !currentStableMembro) return;
  input.value = "";
  input.focus();
  const bolla = bollaInAttesa("schat-messages", testo);
  const { error } = await DB.inviaMessaggioScuderia({ centro_id: currentStableMembro.centro_id, membro_id: currentStableMembro.membro_id, testo });
  if(error){ bollaNonInviata(bolla); showToast("Non inviato: " + error.message); return; }
  if(currentStableMembro) await aggiornaChatLive(false);
  loadStableChatSection();
}

