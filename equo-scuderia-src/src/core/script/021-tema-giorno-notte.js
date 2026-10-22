/* ---------- TEMA GIORNO/NOTTE ---------- */
function applySavedTheme(){
  let t = "light";
  try{ t = localStorage.getItem("equo-scuderia-theme") || "light"; }catch(e){}
  setTheme(t, true);
}
function setTheme(mode, silent){
  document.documentElement.setAttribute("data-theme", mode);
  try{ localStorage.setItem("equo-scuderia-theme", mode); }catch(e){}
  document.getElementById("theme-opt-light")?.classList.toggle("active", mode === "light");
  document.getElementById("theme-opt-dark")?.classList.toggle("active", mode === "dark");
  if(!silent) showToast(mode === "dark" ? "Tema notte attivo." : "Tema giorno attivo.");
}
function openUserMenu(){
  const t = document.documentElement.getAttribute("data-theme") || "light";
  document.getElementById("theme-opt-light").classList.toggle("active", t === "light");
  document.getElementById("theme-opt-dark").classList.toggle("active", t === "dark");
  aggiornaVersioneScuderia();
  openModal("modal-user-menu");
}
// Versione mostrata (decisa solo da Simone: resta 1.0 finché non lo dice lui) + pacchetto del centro
const VERSIONE_SCUDERIA = "1.0";
function aggiornaVersioneScuderia(){
  const el = document.getElementById("menu-versione-scuderia"); if(!el) return;
  const pk = pianoCentro?.pacchetto_reale || pianoCentro?.pacchetto;
  const nomi = { start:"START", advance:"ADVANCE", premium:"PREMIUM", enterprise:"ENTERPRISE" };
  el.textContent = `Equo Scuderia v${VERSIONE_SCUDERIA}` + (pk && nomi[pk] ? ` · Pack ${nomi[pk]}` : "") + (pianoCentro?.sbloccato ? " · accesso completo" : "");
}

