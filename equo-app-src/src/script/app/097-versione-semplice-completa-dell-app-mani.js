/* ---------- VERSIONE SEMPLICE / COMPLETA dell'app maniscalco (profiles.vista_maniscalco) ----------
   Semplice: pochi tasti, un tocco e hai fatto. Completa: in più statistiche degli incassi, ferri nuovi usati,
   interventi straordinari, ferro davanti/dietro. Si sceglie al primo accesso e si cambia dal menu; i dati sono gli stessi. */
function vistaCompleta(){ return !!(currentUser && currentUser.vistaMan === "completa"); }
function applicaVistaManiscalco(){
  document.body.classList.toggle("vm-completa", vistaCompleta());
  document.body.classList.toggle("vm-semplice", !vistaCompleta());
  if(!vistaCompleta() && typeof incVista !== "undefined" && incVista === "completa") incVista = "semplice";
}
async function cambiaVistaManiscalco(v, daScelta){
  if(!currentUser) return;
  currentUser.vistaMan = v === "completa" ? "completa" : "semplice";
  applicaVistaManiscalco();
  aggiornaSwitchHome();
  if(!DEMO_MODE){
    const { error } = await sb.from("profiles").update({ vista_maniscalco: currentUser.vistaMan }).eq("id", currentUser.id);
    if(error) console.warn("vista_maniscalco:", error.message);
  }
  if(typeof renderIncassi === "function" && document.getElementById("page-pro-incassi")?.classList.contains("active")) renderIncassi();
  showToast(currentUser.vistaMan === "completa" ? "Versione Completa attiva" : "Versione Semplice attiva" + (daScelta ? "" : ": la Completa la riaccendi dal menu"));
}
// primo accesso (maniscalco, scelta mai fatta): un riquadro con le due versioni
let vistaManScelta = "semplice";
function mostraSceltaVistaManiscalco(){
  if(DEMO_MODE || !currentUser || currentUser.vistaMan || vistaAi() !== "professionista") return;
  if(document.getElementById("eq-pop-vista")?.classList.contains("attivo")) return;
  sceltaVistaMan("semplice");
  document.getElementById("eq-pop-vista").classList.add("attivo");
}
function sceltaVistaMan(v){
  vistaManScelta = v;
  document.querySelectorAll("#eq-pop-vista .vm-opz").forEach(b => b.classList.toggle("on", b.dataset.v === v));
}
async function confermaVistaMan(){
  document.getElementById("eq-pop-vista").classList.remove("attivo");
  await cambiaVistaManiscalco(vistaManScelta, true);
}
async function cambiaPromemoriaPagamenti(on){
  if(DEMO_MODE){ currentUser.promemoriaPagamenti = on; showToast(on ? "Promemoria pagamenti attivi" : "Promemoria pagamenti spenti"); return; }
  const { error } = await sb.from("profiles").update({ promemoria_pagamenti: on }).eq("id", currentUser.id);
  if(error){ showToast("Errore: " + error.message); const sp = document.getElementById("promemoria-switch"); if(sp) sp.checked = !on; return; }
  currentUser.promemoriaPagamenti = on;
  showToast(on ? "Promemoria pagamenti attivi: i clienti su Equo ricevono un avviso per i lavori da saldare" : "Promemoria pagamenti spenti per tutti i clienti");
}

