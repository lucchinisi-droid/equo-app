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
  if(p.get("apri") === "statistiche"){
    window.history.replaceState({}, "", window.location.pathname);
    showModule("statistiche");
    return;
  }
  if(p.get("apri") === "chat"){
    const d = Object.fromEntries(p.entries());
    window.history.replaceState({}, "", window.location.pathname);
    apriDaNotifica(d);
  } else if(window.__notificaInSospeso){
    const d = window.__notificaInSospeso; window.__notificaInSospeso = null;
    apriDaNotifica(d);
  }
}
async function apriDaNotifica(d){
  if(!d || !d.c || !d.id) return;
  if(!currentCentro){ window.__notificaInSospeso = d; return; }
  const firma = d.c + ":" + d.id, ora = Date.now();
  if(apriDaNotifica.ultima === firma && ora - (apriDaNotifica.quando || 0) < 4000) return;
  apriDaNotifica.ultima = firma; apriDaNotifica.quando = ora;
  try{
    if(d.c === "cliente"){
      if(!teamList.length) await loadTeam();
      const m = teamList.find(x => x.id === d.id);
      if(!m){ showToast("Chat non trovata."); return; }
      if(document.getElementById("modal-chat").classList.contains("active")) closeChatModal();
      showModule("comunicazioni");
      openChatModal(m);
    } else if(d.c === "pro"){
      await loadProfessionisti();
      if(document.getElementById("modal-chat-pro").classList.contains("active")) chiudiChatProfessionista();
      await apriChatProfessionista(d.id);
    }
  } catch(e){ console.error("apriDaNotifica:", e); }
}
window.apriDaNotifica = apriDaNotifica;

/* chat in tempo reale (Supabase Realtime) oltre al controllo periodico */
let canaleChatScuderia = null;
function ascoltaChat(tabella, colonna, valore, aggiorna){
  smettiAscoltoChat();
  if(DEMO_MODE) return;
  try{
    canaleChatScuderia = sb.channel("sc-" + tabella + "-" + valore)
      .on("postgres_changes", { event: "*", schema: "public", table: tabella, filter: `${colonna}=eq.${valore}` }, () => aggiorna())
      .subscribe();
  }catch(e){ console.error("realtime:", e); }
}
function smettiAscoltoChat(){
  if(canaleChatScuderia){ try{ sb.removeChannel(canaleChatScuderia); }catch(e){} }
  canaleChatScuderia = null;
}

