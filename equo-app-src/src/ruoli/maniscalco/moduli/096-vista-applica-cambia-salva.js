// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { renderHomeMan } from "./095-banner-riquadri-dalla-tabella-home-banne.js";
import { vistaCompleta } from "./097-versione-semplice-completa-dell-app-mani.js";
import { renderWidgetPro } from "./098-professionista.js";
/* ---------- vista: applica, cambia, salva ---------- */
function applicaVistaHome(){
  document.body.classList.toggle("vista-widget", vistaWidgetAttiva());
  document.body.classList.toggle("incassi-nascosti", incassiNascosti());
  if(incassiNascosti() && document.getElementById("page-pro-incassi")?.classList.contains("active")) showPage("pro-home");
  if(vistaWidgetAttiva()) wgRidisegna();
}
function wgRidisegna(){
  if(currentUser && document.body.classList.contains("home-man")) try{ renderHomeMan(); }catch(e){ console.error("renderHomeMan:", e); }
  if(!currentUser || !vistaWidgetAttiva()) return;
  if(vistaAi() === "professionista") renderWidgetPro(); else renderWidgetOwner();
}
async function cambiaVistaHome(widget){
  if(!currentUser) return;
  currentUser.homeVista = widget ? "widget" : "standard";
  applicaVistaHome();
  if(!DEMO_MODE){
    const { error } = await sb.from("profiles").update({ home_vista: currentUser.homeVista }).eq("id", currentUser.id);
    if(error) console.warn("home_vista:", error.message);
  }
  showToast(widget ? "Vista Widget attiva" : "Vista Standard attiva");
}
function aggiornaSwitchHome(){ const x = aggiornaSwitchHomeBase.apply(this, arguments); eseguiEstensioniSubito(estensioniDopo, "aggiornaSwitchHome"); return x; }
function aggiornaSwitchHomeBase(){
  const sw = document.getElementById("vista-widget-switch");
  if(sw) sw.checked = vistaWidgetAttiva();
  // il maniscalco ha la sua Home (niente scelta widget / classica)
  const rw = sw && sw.closest(".menu-row");
  if(rw) rw.style.display = typeof agenteAiHammer === "function" && agenteAiHammer() ? "none" : "";
  const pro = vistaAi() === "professionista";
  const riga = document.getElementById("menu-incassi-row");
  if(riga) riga.style.display = pro ? "" : "none";
  const si = document.getElementById("incassi-switch");
  if(si) si.checked = !incassiNascosti();
  const rp = document.getElementById("menu-promemoria-row");
  if(rp) rp.style.display = pro ? "" : "none";
  const sp = document.getElementById("promemoria-switch");
  if(sp) sp.checked = currentUser?.promemoriaPagamenti !== false;
  const rv = document.getElementById("menu-vista-man-row");
  if(rv) rv.style.display = pro ? "" : "none";
  const sv = document.getElementById("vista-man-switch");
  if(sv) sv.checked = vistaCompleta();
  // misura dei ferri preferita: solo maniscalco
  const rm = document.getElementById("menu-misura-row");
  if(rm) rm.style.display = typeof agenteAiHammer === "function" && agenteAiHammer() ? "" : "none";
  const sm = document.getElementById("misura-pref-select");
  if(sm) sm.value = currentUser?.ferroSistema || "";
}


export { aggiornaSwitchHome, applicaVistaHome, wgRidisegna };
