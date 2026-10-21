
/* Veterinario e istruttore: stessa pillola del maniscalco, con il loro agente (Galeno / Ares) al centro.
   L'agente non c'è ancora: al tocco compare «presto disponibile» (vedi openAiSheet sopra). */
const PL_AGENTE = { vet: ["Galeno", "veterinario"], istr: ["Ares", "istruttore"] };
function plNavAltri(){
  const r = plRuolo(), nav = document.getElementById("bottom-nav-pro");
  if(!nav || !PL_AGENTE[r]) return;
  if(nav.dataset.alt === r) return;
  const nome = PL_AGENTE[r][0];
  nav.innerHTML = HM_NAV.replace('onclick="hmMessaggi()"', 'onclick="showPage(\'pro-inbox\'); loadColleghiList();"')
    .replace('onclick="hmCartella(\'clienti\')"', 'onclick="showPage(\'pro-clienti\')"')
    .replace(/Hammer, agente di mascalcia/, nome + ", agente AI").replace('<small>Hammer</small>', '<small>' + nome + '</small>')
    .replace(/ data-cart="clienti"/, "");
  nav.dataset.alt = r; delete nav.dataset.man;
  nav.querySelectorAll(".nav-btn[data-page]").forEach(b => b.classList.toggle("active", b.dataset.page === plPagina()));
}
quandoAggiornaBarra(function(){
  plNavAltri();
  const r = plRuolo();
  if(PL_AGENTE[r]){
    const pg = plPagina();
    document.body.classList.toggle("pl-fab", pg !== "pro-inbox");
  }
});
const _pl2Menu = plCostruisciMenu;
plCostruisciMenu = function(){
  const r = plRuolo();
  if(!PL_AGENTE[r]) return _pl2Menu.apply(this, arguments);
  const m = document.getElementById("hm-menu-piu"); if(!m) return;
  m.innerHTML = plSez("Vai a", [
    plTile(HM_IC.wallet, "Incassi", "showPage('pro-incassi')"),
    plTile(HM_IC.users, "Clienti", "showPage('pro-clienti')"),
    plTile(HM_IC.cerca, "Cerca", "apriCercaTutto()"),
    plTile(HM_IC.qr, "Invita clienti", "openCodicePersonaleModal()"),
    plTile(HM_IC.aiuto, "Serve aiuto?", "apriTicketAssistenza()")
  ]);
  m.classList.add("pl-menu");
};
plAggiorna();
