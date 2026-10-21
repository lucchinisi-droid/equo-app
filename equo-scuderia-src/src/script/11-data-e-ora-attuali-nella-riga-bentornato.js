
/* Data e ora attuali nella riga «Bentornato» della Home (si aggiornano a ogni minuto) */
function aggiornaDataOraScud(){
  const el = document.getElementById("home-dataora"); if(!el) return;
  const d = new Date();
  el.textContent = " · " + d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }) + " · " + d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}
(function(){
  aggiornaDataOraScud();
  const prossimo = () => setTimeout(() => { aggiornaDataOraScud(); prossimo(); }, 60000 - (Date.now() % 60000) + 50);
  prossimo();
  document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible") aggiornaDataOraScud(); });
})();
