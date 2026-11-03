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
  pushInvitoPro();   // 3/11/2026: anche l'invito dei professionisti (Home e Messaggi)
  const banner = document.getElementById("push-permission-banner");
  if(!banner) return;
  try{
    const giaConcesso = typeof OneSignal !== "undefined" && OneSignal.Notifications?.permission;
    banner.style.display = giaConcesso ? "none" : "flex";
  } catch(err){ /* SDK non ancora pronto: banner resta nascosto, si aggiorna al prossimo giro */ }
}

/* ---------- 3/11/2026: INVITO AD ATTIVARE LE NOTIFICHE anche per i professionisti ----------
   Su iPhone il permesso si chiede solo dopo un tocco: prima c'era il tasto solo nella chat del proprietario,
   così maniscalchi e veterinari non potevano attivarle. Riquadro in cima a Home e Messaggi, finché il permesso non c'è;
   «Più tardi» lo nasconde per 3 giorni. Niente riquadro se il telefono non supporta le notifiche (es. iPhone senza app installata). */
const PUSH_INVITO_PAGINE = ["pro-home", "pro-inbox"], PUSH_INVITO_RIMANDA = "equo-push-invito";
function pushSupportata(){ try{ return typeof OneSignal !== "undefined" && !!OneSignal.Notifications && OneSignal.Notifications.isPushSupported?.() !== false; }catch(_){ return false; } }
function pushConcessa(){ try{ return typeof OneSignal !== "undefined" && !!OneSignal.Notifications?.permission; }catch(_){ return false; } }
function pushInvitoRimandato(){ try{ return Date.now() - Number(localStorage.getItem(PUSH_INVITO_RIMANDA) || 0) < 3 * 86400000; }catch(_){ return false; } }
function pushInvitoPro(pagina){
  const pro = !DEMO_MODE && currentUser && PRO_ROLES.includes(currentUser.vistaAttiva || currentUser.ruolo);
  const mostra = pro && pushSupportata() && !pushConcessa() && !pushInvitoRimandato();
  PUSH_INVITO_PAGINE.forEach(pg => {
    const box = document.getElementById("page-" + pg); if(!box) return;
    let b = box.querySelector(":scope > .push-invito");
    if(!mostra){ if(b) b.remove(); return; }
    if(pagina && pagina !== pg && !b) return;   // si crea quando si apre la pagina
    if(!b){
      const agente = typeof nomeAgenteAi === "function" ? nomeAgenteAi() : "";
      b = document.createElement("div"); b.className = "push-invito"; b.setAttribute("role", "region"); b.setAttribute("aria-label", "Notifiche");
      b.innerHTML = `<span class="pi-ic"><i class="fa-solid fa-bell"></i></span>
        <span class="pi-t"><b>Attiva le notifiche</b><span>Ti arrivano i messaggi dei clienti${agente ? " e gli avvisi di " + escapeHtml(agente) : ""}, anche a telefono chiuso.</span></span>
        <span class="pi-az"><button type="button" class="pi-si" onclick="attivaNotifichePush()">Attiva</button><button type="button" class="pi-no" onclick="pushInvitoRimanda()">Più tardi</button></span>`;
      box.prepend(b);
    }
  });
}
function pushInvitoRimanda(){ try{ localStorage.setItem(PUSH_INVITO_RIMANDA, String(Date.now())); }catch(_){} pushInvitoPro(); }
quandoApriPagina(pg => { if(PUSH_INVITO_PAGINE.includes(pg)) pushInvitoPro(pg); });

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

