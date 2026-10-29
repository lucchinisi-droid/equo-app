// Equo App · veterinario · Messaggi (29/10/2026, mockup Messaggi 1 · Cartelle)
// La chat è quella comune (comune/chat: cartelle Clienti · Scuderie · Colleghi, note vocali, tempo reale).
// Per il veterinario qui si aggiungono: matita «nuovo messaggio», ricerca per persona o cavallo, etichette dei cavalli
// di quel cliente su ogni chat e «Urgente» in rosso quando il cliente ha una visita urgente ancora da fare.

const VM_MATITA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';

function vmCavalliDi(clienteId){
  const cav = typeof cavalliCartella === "function" ? cavalliCartella() : [];
  const nomi = cav.filter(c => c.cliente_mascalcia_id === clienteId || c.ubicazione_cliente_id === clienteId).map(c => c.nome).filter(Boolean);
  return [...new Set(nomi)];
}
function vmUrgente(clienteId){
  return (typeof hpAppuntamenti !== "undefined" ? hpAppuntamenti : []).some(e => e.cliente_mascalcia_id === clienteId && e.tipo_ferratura === "urgenza" && e.stato !== "fatto");
}
function vmSigla(nome){
  const p = String(nome || "?").trim().split(/\s+/).filter(Boolean);
  return ((p[0] || "?").charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : "")).toUpperCase();
}
// etichette e sigla su ogni chat di clienti e scuderie (una volta per riga)
function vmDecora(){
  if(typeof eVeterinario !== "function" || !eVeterinario()) return;
  document.querySelectorAll("#inbox-list .inbox-item, #inbox-strutture-list .inbox-item").forEach(it => {
    if(it.dataset.vt) return;
    const m = (it.getAttribute("onclick") || "").match(/'([0-9a-zA-Z-]+)'\)\s*$/);
    const id = m ? m[1] : null;
    it.dataset.vt = "1";
    if(!id) return;
    const urg = vmUrgente(id), cav = vmCavalliDi(id).slice(0, 3);
    const nome = (it.querySelector(".inbox-name")?.textContent || "").split(" · ")[0];
    const av = it.querySelector(".horse-avatar");
    if(av){ av.innerHTML = escapeHtml(vmSigla(nome)); av.classList.add("vt-av", urg ? "urg" : it.closest("#inbox-strutture-list") ? "str" : "equo"); }
    it.classList.toggle("vt-urg", urg);
    const corpo = it.querySelector(".inbox-preview")?.parentElement;
    if(corpo && (urg || cav.length)){
      const r = document.createElement("div"); r.className = "vt-chips";
      r.innerHTML = (urg ? '<span class="vt-chip urg">Urgente</span>' : "") + cav.map(n => `<span class="vt-chip">${escapeHtml(n)}</span>`).join("");
      corpo.appendChild(r);
    }
  });
  vmFiltra();
}
// matita e ricerca in alto (una volta sola)
function vmTesta(){
  if(typeof eVeterinario !== "function" || !eVeterinario()) return;
  const pag = document.getElementById("page-pro-inbox"); if(!pag || pag.querySelector(".vt-msg-testa")) return;
  const tit = pag.querySelector(":scope > .section-title");
  const testa = document.createElement("div"); testa.className = "vt-msg-testa";
  testa.innerHTML = `<button class="vt-matita" onclick="vmNuovoMessaggio()" aria-label="Nuovo messaggio">${VM_MATITA}</button>`;
  if(tit) tit.after(testa);
  const cerca = document.createElement("div"); cerca.className = "vt-msg-cerca";
  cerca.innerHTML = '<input type="search" id="vt-msg-cerca" placeholder="Cerca persona o cavallo" oninput="vmFiltra()" autocomplete="off">';
  testa.after(cerca);
}
function vmFiltra(){
  const q = (document.getElementById("vt-msg-cerca")?.value || "").trim().toLowerCase();
  document.querySelectorAll("#page-pro-inbox .inbox-item").forEach(it => { it.style.display = !q || it.textContent.toLowerCase().includes(q) ? "" : "none"; });
}
// nuovo messaggio: si sceglie un cliente o una scuderia già su Equo e si apre la sua chat
function vmNuovoMessaggio(){
  const lista = (typeof clientiAttivi === "function" ? clientiAttivi() : []).filter(c => c.cliente_user_id || c.collegamento_stato === "attivo")
    .sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" }));
  const corpo = lista.length ? lista.map(c => `<button class="hm-tappa" onclick="hmChiudi();openChatThread('${c.id}')"><span class="o">${escapeHtml(vmSigla(c.nome))}</span>
      <span class="c"><b>${escapeHtml(c.nome)}</b><span>${escapeHtml(vmCavalliDi(c.id).slice(0, 3).join(", "))}</span></span></button>`).join("")
    : '<div class="muted" style="font-size:13.5px;padding:8px 0">Nessun cliente su Equo: invitali dalla pagina Clienti.</div>';
  hmFoglio("Nuovo messaggio", "Scegli a chi scrivere: clienti e scuderie che usano Equo", corpo);
}

let vmOss = null;
quandoApriPagina(function(p){
  if(p !== "pro-inbox" || typeof eVeterinario !== "function" || !eVeterinario()) return;
  vmTesta(); vmDecora();
  if(!vmOss && typeof MutationObserver === "function"){
    vmOss = new MutationObserver(() => vmDecora());
    ["inbox-list", "inbox-strutture-list"].forEach(id => { const el = document.getElementById(id); if(el) vmOss.observe(el, { childList: true }); });
  }
});

export { vmDecora, vmFiltra, vmNuovoMessaggio };
