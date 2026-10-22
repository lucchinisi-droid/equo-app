/* ---------- installazione ---------- */
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; if(dati) disegna(); });
async function installa(){ if(!installEvt) return; installEvt.prompt(); try{ await installEvt.userChoice; } catch(e){} installEvt = null; disegna(); }
window.addEventListener("appinstalled", () => { installEvt = null; if(dati) disegna(); });

