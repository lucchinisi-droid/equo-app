
/* ===== BARRA A PILLOLA, «+» e tono per pagina (16/10/2026) ===== */
function plRuolo(){
  if(!currentUser) return null;
  if(vistaAi() === "proprietario") return "owner";
  if(agenteAiHammer()) return "man";
  const r = currentUser.vistaAttiva || currentUser.ruolo;
  return r === "veterinario" ? "vet" : r === "istruttore" ? "istr" : "pro";
}
const PL_TONI = {
  owner: { home: 1, diario: 2, cavalli: 3, spese: 3, chat: 4, prenotazioni: 5 },
  man:   { "pro-home": 1, "pro-agenda": 2, "pro-incassi": 3, "pro-inbox": 4, "pro-clienti": 5 },
  vet:   { "pro-home": 1, "pro-agenda": 2, "pro-inbox": 3, "pro-clienti": 4, "pro-incassi": 5 },
  istr:  { "pro-home": 1, "pro-agenda": 2, "pro-inbox": 3, "pro-clienti": 4, "pro-incassi": 5 },
  pro:   { "pro-home": 1, "pro-agenda": 2, "pro-inbox": 3, "pro-clienti": 4, "pro-incassi": 5 }
};
function plPagina(){ return document.querySelector(".page-content.active")?.id?.replace("page-", "") || ""; }
function plAggiorna(){
  const app = document.getElementById("screen-app");
  const r = app && app.classList.contains("active") ? plRuolo() : null;
  const b = document.body;
  ["owner", "man", "vet", "istr", "pro"].forEach(k => b.classList.toggle("pl-" + k, r === k));
  const pg = plPagina();
  const tono = r ? ((PL_TONI[r] || {})[pg] || 1) : null;
  if(tono) b.dataset.tono = tono; else delete b.dataset.tono;
  b.classList.toggle("pl-fab", (r === "owner" || r === "man") && pg !== "chat" && pg !== "pro-inbox");
}
const _plShowPage = showPage;
showPage = function(){ const x = _plShowPage.apply(this, arguments); plAggiorna(); return x; };
const _plApplicaHm = applicaHomeMan;
applicaHomeMan = function(){ const x = _plApplicaHm.apply(this, arguments); plAggiorna(); return x; };
setInterval(function(){ plAggiorna(); }, 1200);
document.addEventListener("DOMContentLoaded", plAggiorna);

const PLI = {
  cal: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2v4M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M10 16h4M12 14v4"/></svg>',
  fatto: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/></svg>',
  scuderia: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21V10l9-6 9 6v11"/><path d="M2 21h20"/><rect x="8" y="13" width="8" height="8"/><path d="m8 13 8 8M16 13l-8 8"/></svg>',
  scad: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 22h14M5 2h14"/><path d="M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22"/><path d="M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/></svg>',
  pin: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  partner: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
};
function plTile(ic, t, az, o, cls, sotto){
  return `<button class="pl-tl${o ? " o" : ""} ${cls || ""}" onclick="hmChiudi();${az}"><span class="pi-c">${ic}</span>${t}${sotto ? `<small>${sotto}</small>` : ""}</button>`;
}
function plSez(t, tiles){ return `<h5>${t}</h5><div class="pl-tg">${tiles.join("")}</div>`; }
function plCostruisciMenu(){
  const m = document.getElementById("hm-menu-piu"); if(!m) return;
  const r = plRuolo(); let h = "";
  if(r === "owner"){
    h += `<button class="pl-peg" onclick="hmChiudi();openAiSheet()"><span class="im"><img src="assets/agenti/pegasus.webp" alt=""></span><div><b>Chiedi a Pegasus</b><span class="t">Il tuo esperto equestre, risponde subito</span></div></button>`;
    h += plSez("Vai a", [
      plTile(HM_IC.wallet, "Spese", "showPage('spese')"),
      plTile(HM_IC.ferro, "I miei cavalli", "showPage('cavalli')"),
      plTile(PLI.pin, "Servizi vicino a te", "openServicesMap()"),
      plTile(PLI.partner, "Partner", "window.location.href='mailto:gestione.equo@gmail.com?subject='+encodeURIComponent('Vorrei comparire come partner su Equo')"),
      plTile(HM_IC.aiuto, "Serve aiuto?", "apriTicketAssistenza()")
    ]);
  } else if(r === "man"){
    h += plSez("Crea subito", [
      plTile(PLI.cal, "Appuntamento", "openInterventoModal(null)", 1),
      plTile(PLI.fatto, "Intervento già fatto", "hmGiaFatto()", 1),
      plTile(HM_IC.ferro, "Cavallo", "hmCartella('cavalli');setTimeout(()=>{try{apriNuovoCavalloCartella()}catch(e){}},150)", 1),
      plTile(HM_IC.users, "Cliente", "apriNuovoCliente('proprietario')", 1),
      plTile(PLI.scuderia, "Scuderia", "apriNuovoCliente('struttura')", 1)
    ]);
    h += plSez("Vai a", [
      plTile(HM_IC.wallet, "Incassi", "hmDaIncassare()", 0, "solo-incassi"),
      plTile(HM_IC.ferro, "Cavalli", "hmCartella('cavalli')"),
      plTile(PLI.scuderia, "Scuderie e centri", "hmCartella('clienti')"),
      plTile(PLI.scad, "Scadenze", "hmScadenze()"),
      plTile(HM_IC.cerca, "Cerca", "apriCercaTutto()"),
      plTile(HM_IC.qr, "Invita clienti", "openCodicePersonaleModal()"),
      plTile(HM_IC.aiuto, "Serve aiuto?", "apriTicketAssistenza()")
    ]);
  } else return;
  m.innerHTML = h; m.classList.add("pl-menu");
}
const _plHmPiu = hmPiu;
hmPiu = function(){ plCostruisciMenu(); return _plHmPiu.apply(this, arguments); };
// vet e istruttori: l'agente non c'è ancora → «presto disponibile»
const _plOpenAi = openAiSheet;
openAiSheet = function(){
  const r = plRuolo();
  if(r === "vet"){ showToast(nomeAgenteAi() + " è presto disponibile"); return; }
  return _plOpenAi.apply(this, arguments);
};
// l'etichetta «Versione» del menu profilo compare solo se c'è l'interruttore Completa/Semplice
const _plAggSw = aggiornaSwitchHome;
aggiornaSwitchHome = function(){
  const x = _plAggSw.apply(this, arguments);
  const row = document.getElementById("menu-vista-man-row"), lab = document.getElementById("menu-home-label");
  if(lab) lab.style.display = row && row.style.display !== "none" ? "" : "none";
  return x;
};
