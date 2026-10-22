// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
/* ---------- ABBINAMENTO CAVALLI DEL MANISCALCO -> CAVALLI VERI (lato proprietario) ---------- */
let abbinaPendenti = [];
let abbinaOnDone = null;

// Se il maniscalco ha registrato a mano cavalli di questo cliente e il proprietario ha cavalli su Equo,
// mostra il popup di conferma; altrimenti prosegue subito con onDone(). Ritorna true se il popup è stato aperto.
async function proponiAbbinamentoCavalli(clienteId, nomeManiscalco, onDone){
  try{
    if(!horses || horses.length === 0) horses = await DB.listHorses();
    const pendenti = (horses && horses.length) ? await DB.listCavalliDaAbbinare(clienteId) : [];
    if(!pendenti.length){ if(onDone) onDone(); return false; }
    abbinaPendenti = pendenti;
    abbinaOnDone = onDone || null;
    renderAbbinamentoCavalli(nomeManiscalco);
    openModal("modal-abbina-cavalli");
    return true;
  } catch(err){
    console.error("proponiAbbinamentoCavalli:", err);
    if(onDone) onDone();
    return false;
  }
}

function renderAbbinamentoCavalli(nomeManiscalco){
  const n = abbinaPendenti.length;
  document.getElementById("abbina-cavalli-error").style.display = "none";
  document.getElementById("abbina-cavalli-intro").textContent =
    `${nomeManiscalco} ha registrato ${n === 1 ? "questo cavallo" : "questi cavalli"}. Abbinali ai tuoi: gli interventi di mascalcia finiranno sul cavallo giusto.`;
  const opzioni = sel => ['<option value="">— non abbinare —</option>'].concat(horses.map(h =>
    `<option value="${escapeHtml(h.id)}" ${h.id === sel ? "selected" : ""}>${escapeHtml(h.name || "Cavallo")}${h.microchip ? " · " + escapeHtml(h.microchip) : ""}</option>`)).join("");
  document.getElementById("abbina-cavalli-list").innerHTML = abbinaPendenti.map((cv, i) => {
    const badge = cv.match_tipo === "microchip" ? '<span class="badge badge-green" style="font-size:10.5px">stesso microchip</span>'
      : cv.match_tipo === "nome" ? '<span class="badge badge-accent" style="font-size:10.5px">stesso nome</span>' : "";
    return `
    <div style="padding:10px 2px;border-bottom:1px solid var(--border)">
      <label style="display:flex;align-items:center;gap:10px">
        <input type="checkbox" class="abbina-check" data-i="${i}" ${cv.match_tipo === "microchip" ? "checked" : ""} style="width:18px;height:18px;flex-shrink:0">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:14px">${escapeHtml(cv.nome || "Cavallo")} ${badge}</div>
          <div class="muted" style="font-size:12px">${cv.microchip ? "Microchip " + escapeHtml(cv.microchip) : "Senza microchip"}</div>
        </div>
      </label>
      <select class="input abbina-select" data-i="${i}" style="margin-top:8px" onchange="document.querySelector('.abbina-check[data-i=&quot;${i}&quot;]').checked = !!this.value">${opzioni(cv.proposto_horse_id)}</select>
    </div>`;
  }).join("");
}

async function confermaAbbinamentoCavalli(){
  const errBox = document.getElementById("abbina-cavalli-error");
  errBox.style.display = "none";
  const scelte = [];
  document.querySelectorAll(".abbina-check").forEach(chk => {
    if(!chk.checked) return;
    const i = chk.dataset.i;
    const horseId = document.querySelector(`.abbina-select[data-i="${i}"]`).value;
    if(horseId) scelte.push({ cv: abbinaPendenti[i], horseId });
  });
  const usati = scelte.map(x => x.horseId);
  if(new Set(usati).size !== usati.length){
    errBox.textContent = "Hai scelto lo stesso cavallo per due righe: correggi e riprova.";
    errBox.style.display = "block";
    return;
  }
  const btn = document.getElementById("abbina-cavalli-btn");
  btn.disabled = true;
  let ok = 0, falliti = 0;
  for(const x of scelte){
    const { error } = await DB.abbinaCavalloManiscalco(x.cv.id, x.horseId);
    if(error) falliti++; else ok++;
  }
  btn.disabled = false;
  if(falliti > 0) showToast(`${falliti} abbinament${falliti === 1 ? "o non riuscito" : "i non riusciti"}, riprova da "Cavalli" nella chat.`);
  else if(ok > 0) showToast(ok === 1 ? "Cavallo abbinato." : `${ok} cavalli abbinati.`);
  chiudiAbbinamento();
}

function saltaAbbinamentoCavalli(){ chiudiAbbinamento(); }

function chiudiAbbinamento(){
  closeModal("modal-abbina-cavalli");
  abbinaPendenti = [];
  const onDone = abbinaOnDone; abbinaOnDone = null;
  if(onDone) onDone();
}

async function apriAbbinamentoDaChat(){
  if(!currentFarrier) return;
  const aperto = await proponiAbbinamentoCavalli(currentFarrier.cliente_mascalcia_id, currentFarrier.nome || "Il tuo maniscalco", null);
  if(!aperto) showToast(horses && horses.length ? "Nessun cavallo da abbinare." : "Aggiungi prima i tuoi cavalli in Equo.");
}

async function openFarrierChatThread(clienteId, nome, certificato){
  if(certificato === undefined){
    const f = (await DB.listManiscalchiCollegati()).find(x => x.cliente_mascalcia_id === clienteId);
    certificato = !!f?.certificato;
  }
  currentFarrier = { cliente_mascalcia_id: clienteId, nome, certificato };
  document.getElementById("fchat-nome").innerHTML = escapeHtml(nome || "Il tuo maniscalco") + (certificato ? "<br>" + BADGE_CERTIFIED_HTML : "");
  document.getElementById("fchat-input").value = "";
  document.getElementById("fchat-overlay").classList.add("active");
  await renderFarrierChatThread();
  avviaChatLive({ chiave: "fchat:" + clienteId, tabella: "messaggi_mascalcia", colonna: "cliente_mascalcia_id", valore: clienteId, overlay: "fchat-overlay",
    aggiorna: () => currentFarrier ? renderFarrierChatThread() : null, segnaLetti: () => DB.segnaLettiDalManiscalco(clienteId) });
  await DB.segnaLettiDalManiscalco(clienteId);
  loadFarrierChatSection();
  refreshChatBadge();
}

function closeFarrierChatThread(){
  document.getElementById("fchat-overlay").classList.remove("active");
  fermaChatLive();
  currentFarrier = null;
}

async function renderFarrierChatThread(){
  if(!currentFarrier) return;
  const box = document.getElementById("fchat-messages");
  const chiaveThread = "fchat:" + currentFarrier.cliente_mascalcia_id;
  inizioThread(box, chiaveThread);
  const data = await DB.listThreadMascalcia(currentFarrier.cliente_mascalcia_id);
  if(!data || data.length === 0){
    box.innerHTML = '<div class="muted" style="font-size:13px;text-align:center;margin-top:20px">Nessun messaggio ancora.<br>Scrivi al tuo maniscalco qui sotto.</div>';
    box.dataset.thread = chiaveThread; box.dataset.vuoto = '1';
    return;
  }
  let lastDay = null;
  let html = "";
  data.forEach(m => {
    const day = formatChatDay(m.created_at);
    if(day !== lastDay){ html += `<div class="mchat-day-sep" data-id="day-${escapeHtml(day)}">${day}</div>`; lastDay = day; }
    const out = m.mittente_tipo === "cliente";
    const body = m.tipo === "audio"
      ? `<div class="mchat-audio-bubble"><audio controls src="${escapeHtml(m.audio_url)}"></audio></div>`
      : (m.tipo === "documento" || m.tipo === "foto" || m.tipo === "video")
        ? bollaAllegato(m.tipo, m.file_url, m.file_nome, m.testo)
        : `<div class="mchat-bubble-text">${escapeHtml(m.testo || "")}</div>`;
    html += `
      <div class="mchat-bubble ${out ? "out" : "in"}"${attrBolla(m, out, "messaggi_mascalcia")}>
        ${citazioneHtml(m)}${body}
        ${oraBolla(m, out)}
      </div>`;
  });
  applicaThread(box, chiaveThread, html);
}

async function sendFarrierChatMessage(){
  const input = document.getElementById("fchat-input");
  const testo = input.value.trim();
  if(!testo || !currentFarrier) return;
  input.value = "";
  input.focus();
  const bolla = bollaInAttesa("fchat-messages", testo);
  const { error } = await DB.inviaMessaggioAlManiscalco(currentFarrier.cliente_mascalcia_id, testo);
  if(error){ bollaNonInviata(bolla); showToast("Non inviato: " + error.message); return; }
  if(currentFarrier) await aggiornaChatLive(false);
  loadFarrierChatSection();
}


export { apriAbbinamentoDaChat, closeFarrierChatThread, confermaAbbinamentoCavalli, openFarrierChatThread, proponiAbbinamentoCavalli, renderFarrierChatThread, saltaAbbinamentoCavalli, sendFarrierChatMessage };
