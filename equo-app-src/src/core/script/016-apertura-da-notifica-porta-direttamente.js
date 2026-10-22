/* ---------- APERTURA DA NOTIFICA: porta direttamente alla chat di chi ha scritto ---------- */
// appunto lasciato dal service worker al tocco della notifica (serve su iPhone, che riapre l'app sulla Home)
async function notificaSalvata(){
  try{
    if(!("caches" in window)) return null;
    const c = await caches.open("equo-notifica");
    const r = await c.match("/__ultima-notifica");
    if(!r) return null;
    await c.delete("/__ultima-notifica");
    const j = await r.json();
    return j && j.d && Date.now() - (j.t || 0) < 3 * 60 * 1000 ? j.d : null;
  }catch(_){ return null; }
}
async function controllaNotificaSalvata(){
  const d = await notificaSalvata();
  if(d) apriDaNotifica(d);
}
document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible") setTimeout(controllaNotificaSalvata, 300); });
window.addEventListener("focus", () => setTimeout(controllaNotificaSalvata, 300));
function apriChatDaUrl(){
  setTimeout(controllaNotificaSalvata, 500);
  const p = new URLSearchParams(window.location.search);
  if(p.get("apri") === "chat"){
    const d = Object.fromEntries(p.entries());
    window.history.replaceState({}, "", window.location.pathname);
    apriDaNotifica(d);
  } else if(window.__notificaInSospeso){
    const d = window.__notificaInSospeso; window.__notificaInSospeso = null;
    apriDaNotifica(d);
  }
}
async function assicuraVista(tipo){
  const ruoli = [currentUser.ruolo, currentUser.ruoloSecondario].filter(Boolean);
  const target = tipo === "pro" ? ruoli.find(r => PRO_ROLES.includes(r)) : (ruoli.includes("proprietario") ? "proprietario" : null);
  if(target && currentUser.vistaAttiva !== target) await enterApp(target);
}
async function apriDaNotifica(d){
  if(!d || !d.c || !d.id) return;
  const firma = d.c + ":" + d.id, ora = Date.now();
  if(apriDaNotifica.ultima === firma && ora - (apriDaNotifica.quando || 0) < 4000) return; // stesso click arrivato due volte
  apriDaNotifica.ultima = firma; apriDaNotifica.quando = ora;
  if(!currentUser || !document.getElementById("screen-app")?.classList.contains("active")){ window.__notificaInSospeso = d; return; }
  try{
    // chiude eventuali altre chat aperte
    ["mchat-overlay","fchat-overlay","schat-overlay","ochat-overlay"].forEach(id => document.getElementById(id)?.classList.remove("active"));
    fermaChatLive();
    if(d.c === "mchat"){
      await assicuraVista("pro");
      await openChatThread(d.id);
    } else if(d.c === "colleghi"){
      await assicuraVista("pro");
      await openOwnerChatThread(d.id, d.n || "Collega", true);
    } else if(d.c === "fchat"){
      await assicuraVista("owner");
      const f = (await DB.listManiscalchiCollegati()).find(x => x.cliente_mascalcia_id === d.id);
      await openFarrierChatThread(d.id, f?.nome_maniscalco || "Il tuo maniscalco", !!f?.certificato);
    } else if(d.c === "schat"){
      await assicuraVista("owner");
      await openStableChatThread(d.id, d.centro || null, d.n || "Scuderia");
    } else if(d.c === "ai"){
      // risposta dei Boss o riepilogo settimanale: apre la chat dell'agente giusto
      await assicuraVista(d.v === "professionista" ? "pro" : "owner");
      await openAiSheet();
    } else if(d.c === "ochat"){
      await assicuraVista("owner");
      await openOwnerChatThread(d.id, d.n || "Utente Equo", false);
    }
  } catch(e){ console.error("apriDaNotifica:", e); }
}
window.apriDaNotifica = apriDaNotifica;

async function handleCheckoutReturn(){
  const params = new URLSearchParams(window.location.search);
  const checkout = params.get("checkout");
  if(!checkout) return;
  window.history.replaceState({}, "", window.location.pathname);
  if(checkout === "cancel"){
    if(typeof earlyDopoRitorno === "function") earlyDopoRitorno("cancel", false);
    showToast("Pagamento annullato.");
    return;
  }
  if(checkout === "success"){
    showToast("Pagamento ricevuto, aggiorniamo il tuo piano...");
    await new Promise(r => setTimeout(r, 2000));
    const { data: profile } = await sb.from("profiles").select("piano").eq("id", currentUser.id).maybeSingle();
    if(profile?.piano === "premium"){
      currentUser.piano = "premium";
      updatePianoUI();
      if(typeof renderIncassi === "function" && PRO_ROLES.includes(currentUser.vistaAttiva || currentUser.ruolo)) await renderIncassi();
      if(!(typeof earlyDopoRitorno === "function" && earlyDopoRitorno("success", true))) showToast("Sei passato a Premium!");
    } else {
      if(typeof earlyDopoRitorno === "function") earlyDopoRitorno("success", false);
      showToast("Pagamento ricevuto, l'attivazione arriva a momenti — riapri l'app tra poco se non la vedi subito.");
    }
  }
}

