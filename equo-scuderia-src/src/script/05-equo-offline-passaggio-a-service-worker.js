
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

/* ---------- Invito a installare l'app (iPhone/iPad da Safari, Android con il pulsante del browser) ----------
   Installata: si apre anche senza rete, riceve le notifiche e su iPhone non perde i dati salvati. */
let invitoInstallaEvento = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); invitoInstallaEvento = e; });
function invitoInstallaControlla(){
  const installata = window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone;
  if(installata || (typeof DEMO_MODE !== "undefined" && DEMO_MODE)) return;
  let rimandato = 0; try{ rimandato = Number(localStorage.getItem("equo-invito-installa") || 0); }catch(e){}
  if(Date.now() - rimandato < 14 * 86400000) return;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if(!ios && !invitoInstallaEvento) return;
  const box = document.getElementById("invito-installa"); if(!box) return;
  document.getElementById("invito-installa-passi").innerHTML = ios
    ? `<div class="ii-passo"><span>1</span><div>Tocca <b>Condividi</b> <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px"><path d="M12 15V3M8 7l4-4 4 4"/><path d="M5 11v9h14v-9"/></svg> in basso (o in alto su iPad)</div></div>
       <div class="ii-passo"><span>2</span><div>Scegli <b>«Aggiungi alla schermata Home»</b></div></div>
       <div class="ii-passo"><span>3</span><div>Apri Equo dall'icona sulla Home</div></div>`
    : `<button class="ii-btn" onclick="invitoInstallaAndroid()">Installa l'app</button>`;
  box.style.display = "flex";
}
async function invitoInstallaAndroid(){
  if(!invitoInstallaEvento) return;
  invitoInstallaEvento.prompt();
  try{ await invitoInstallaEvento.userChoice; }catch(e){}
  invitoInstallaEvento = null; invitoInstallaChiudi(false);
}
function invitoInstallaChiudi(ricorda = true){
  if(ricorda){ try{ localStorage.setItem("equo-invito-installa", String(Date.now())); }catch(e){} }
  const box = document.getElementById("invito-installa"); if(box) box.style.display = "none";
}
