/* =====================================================================
   «QUESTO CAVALLO NON VIENE FERRATO» (11/11/2026 · SQL 62) — script normale: funzioni globali.
   Puledri, anziani, scalzi: con la spunta lo scadenzario segue il pareggio al posto della ferratura e non segnala
   dati mancanti. La spunta si toglie quando il cavallo inizia a essere ferrato. Si allinea con il libretto del proprietario.
   ===================================================================== */
function nfImposta(c){
  const cb = document.getElementById("cav-non-ferrato"); if(!cb) return;
  cb.checked = !!c?.non_ferrato;
  const m = document.getElementById("cav-nf-motivo"); if(m) m.value = c?.non_ferrato_motivo || "";
  nfSpunta();
}
function nfSpunta(){
  const on = !!document.getElementById("cav-non-ferrato")?.checked;
  const box = document.getElementById("cav-nf-motivo-box"); if(box) box.style.display = on ? "" : "none";
  // suggerimento per i puledri: meno di 3 anni dalla data di nascita (solo un invito, la spunta la mette l'utente)
  const sug = document.getElementById("cav-nf-suggerimento"), nasc = document.getElementById("cav-nascita")?.value;
  const anni = nasc ? (Date.now() - new Date(nasc + "T00:00").getTime()) / (365.25 * 864e5) : null;
  if(sug) sug.style.display = !on && anni != null && anni >= 0 && anni < 3 ? "" : "none";
}
document.addEventListener("change", e => { if(e.target && e.target.id === "cav-nascita") nfSpunta(); });
