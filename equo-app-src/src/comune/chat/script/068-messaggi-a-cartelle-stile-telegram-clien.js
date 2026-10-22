/* ---------- MESSAGGI A CARTELLE (stile Telegram): Clienti · Scuderie · Colleghi ---------- */
let chatCartella = "clienti";
const chatContatori = { proprietari: { n: 0, nonLetti: 0 }, clienti: { n: 0, nonLetti: 0 }, scuderie: { n: 0, nonLetti: 0 }, colleghi: { n: 0, nonLetti: 0 } };
try{ chatCartella = localStorage.getItem("equo-chat-cartella") || "clienti"; }catch(_){}
function sceltaCartellaChat(k){
  chatCartella = k;
  try{ localStorage.setItem("equo-chat-cartella", k); }catch(_){}
  if(typeof cercaAzzera === "function") cercaAzzera("inbox");
  renderChatCartelle();
}
function renderChatCartelle(){ const x = renderChatCartelleBase.apply(this, arguments); eseguiEstensioniSubito(estensioniDopo, "renderChatCartelle"); return x; }
function renderChatCartelleBase(){
  const box = document.getElementById("chat-cartelle");
  if(!box) return;
  const soloColleghi = typeof plRuolo === "function" && plRuolo() === "istr";
  if(!(soloColleghi ? ["proprietari", "colleghi"] : ["clienti", "scuderie", "colleghi"]).includes(chatCartella)) chatCartella = soloColleghi ? "proprietari" : "clienti";
  box.innerHTML = (soloColleghi ? [["proprietari", "Proprietari"], ["colleghi", "Colleghi"]] : [["clienti", "Clienti"], ["scuderie", "Scuderie"], ["colleghi", "Colleghi"]]).map(([k, t]) => {
    const c = chatContatori[k];
    return `<button role="tab" aria-selected="${chatCartella === k}" class="${chatCartella === k ? "on" : ""}" onclick="sceltaCartellaChat('${k}')">${t}${c.nonLetti ? `<span class="n nonletti" aria-label="${c.nonLetti} non letti">${c.nonLetti}</span>` : `<span class="n">${c.n}</span>`}</button>`;
  }).join("");
  document.getElementById("chat-cartella-sotto").textContent = { proprietari: "Chat con i proprietari dei cavalli che segui", clienti: "Chat con i proprietari dei cavalli", scuderie: "Chat con scuderie, maneggi e centri ippici", colleghi: "Chat con maniscalchi, veterinari e altri professionisti" }[chatCartella];
  document.querySelectorAll("#page-pro-inbox .chat-sez").forEach(el => { el.hidden = el.dataset.sez !== chatCartella; });
}

function renderInboxStrutture(strutture, unreadByCliente){
  const wrap = document.getElementById("inbox-strutture-wrap");
  const box = document.getElementById("inbox-strutture-list");
  if(!wrap || !box) return;
  if(strutture.length === 0){
    box.innerHTML = '<div class="muted" style="font-size:13px;line-height:1.6">Nessuna chat con scuderie. Da <strong>Clienti → Scuderie → Collega scuderia</strong> inserisci il codice di una scuderia che usa Equo Scuderia, oppure accetta il suo invito.</div>';
    return;
  }
  box.innerHTML = strutture.map(m => {
    const unread = unreadByCliente[m.cliente_mascalcia_id] || 0;
    const c = m.clienti_mascalcia || {};
    const stato = !c.centro_id || c.collegamento_stato === "attivo" ? "" : c.collegamento_stato === "da_confermare_pro" ? "Invito da accettare · " : "In attesa della scuderia · ";
    const chi = m.mittente_tipo === "maniscalco" ? "Tu: " : (m.mittente_nome ? m.mittente_nome + ": " : "");
    const preview = stato + chi + previewMessaggioMascalcia(m.tipo, m.testo, m.file_nome);
    const azione = c.collegamento_stato === "da_confermare_pro"
      ? `showPage('pro-clienti'); openClienteDetail('${m.cliente_mascalcia_id}')`
      : `openChatThread('${m.cliente_mascalcia_id}')`;
    return `
    <div class="inbox-item ${unread > 0 ? "unread" : ""}" onclick="${azione}">
      <div class="horse-avatar"><i class="fa-solid fa-building" style="font-size:19px"></i></div>
      <div style="flex:1;min-width:0">
        <div class="inbox-name" style="font-size:14px">${escapeHtml(c.nome || "Scuderia")}</div>
        <div class="inbox-preview muted" style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(preview)}</div>
      </div>
      ${unread > 0 ? `<span class="inbox-unread-dot"></span>` : ""}
    </div>`;
  }).join("");
}

