// Equo App · home · modulo (moduli ES, costruiti con Vite in ruoli/home/costruito.js)
/* ---------- CONTATORI A SEMAFORO NEL MENU (verde = 0 / tutto ok, giallo = da guardare, rosso = urgente) ----------
   Lezioni: numero = lezioni di oggi ancora da fare + lezioni passate mai chiuse;
            rosso se c'è una lezione passata aperta, giallo se una di oggi è ancora "prenotata".
   Pacchetti: numero = pacchetti rossi + gialli (statusPacchetto).
   Cavalli & Salute: numero = cavalli con scadenze rosse o gialle (statusFor).
   Chat: numero = messaggi non letti, rosso se > 0 (refreshChatUnread). */
/* -> stato-condiviso.js */
/* -> stato-condiviso.js */
function impostaContatoreNav(id, valore, colore){
  const el = document.getElementById(id);
  if(!el) return;
  el.textContent = valore > 99 ? "99+" : String(valore);
  el.classList.remove("sem-verde","sem-giallo","sem-rosso");
  el.classList.add("sem-" + colore);
}
function aggiornaContatoriNav(){
  if(typeof currentCentro === "undefined" || !currentCentro) return;
  const oggi = oggiLocaleIso();
  // lezioni
  const aperte = l => !["annullata","completata"].includes(l.stato);
  const diOggi = (lezioniList || []).filter(l => l.data === oggi && aperte(l));
  const passateAperte = (lezioniList || []).filter(l => l.data < oggi && aperte(l));
  impostaContatoreNav("lezioni-nav-badge", diOggi.length + passateAperte.length,
    passateAperte.length ? "rosso" : diOggi.some(l => l.stato === "prenotata") ? "giallo" : "verde");
  // pacchetti
  const statiPac = (pacchettiList || []).map(statusPacchetto);
  const pacRossi = statiPac.filter(x => x === "red").length, pacGialli = statiPac.filter(x => x === "yellow").length;
  impostaContatoreNav("pacchetti-nav-badge", pacRossi + pacGialli, pacRossi ? "rosso" : pacGialli ? "giallo" : "verde");
  // cavalli & salute
  let cavRossi = 0, cavGialli = 0;
  (cavalliList || []).forEach(c => { const w = pallinoCavallo(c.id).col; if(w === "rosso") cavRossi++; else if(w === "ocra") cavGialli++; });
  impostaContatoreNav("cavalli-nav-badge", cavRossi + cavGialli, cavRossi ? "rosso" : cavGialli ? "giallo" : "verde");
}
let contatoriNavTimer = null;
async function ricaricaContatoriNav(){
  if(!currentCentro) return;
  await Promise.all([ cavalliList.length === 0 ? loadCavalli() : Promise.resolve(), loadEventiAll(), loadLezioni(), loadPacchetti(),
    loadMagazzino().catch(e => console.error("magazzino:", e)) ]);
  aggiornaContatoriNav();
}
function startContatoriNav(){
  clearInterval(contatoriNavTimer);
  ricaricaContatoriNav();
  contatoriNavTimer = setInterval(ricaricaContatoriNav, 5 * 60 * 1000); // ogni 5 minuti (anche il cambio di giorno)
}
document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible" && currentCentro) ricaricaContatoriNav(); });


export { aggiornaContatoriNav, impostaContatoreNav, startContatoriNav };
