/* ---------- ULTIMO MESSAGGIO (home) ---------- */
let homeLastMessageTarget = null;
async function loadHomeLastMessage(){
  const card = document.getElementById("home-last-message-card");
  if(!card) return;
  card.style.display = "none";
  homeLastMessageTarget = null;
  if(DEMO_MODE) return;

  const candidates = [];
  const scuderie = await DB.listScuderieCollegate();
  for(const s of scuderie){
    const msgs = await DB.listMessaggiScuderia(s.membro_id);
    const ultimo = msgs[msgs.length - 1];
    if(ultimo) candidates.push({ tipo: "scuderia", nome: s.nome, testo: ultimo.testo || previewAllegato(ultimo.tipo, ultimo.file_nome), data: ultimo.created_at, target: s });
  }
  const maniscalchi = await DB.listManiscalchiCollegati();
  maniscalchi.forEach(f => {
    if(!f.ultimo_at) return;
    candidates.push({ tipo: "maniscalco", nome: f.nome_maniscalco || "Il tuo maniscalco", testo: previewMessaggioMascalcia(f.ultimo_tipo, f.ultimo_testo, f.ultimo_file_nome), data: f.ultimo_at, target: f });
  });
  const conversazioni = await DB.listConversazioniProprietario();
  (conversazioni || []).forEach(c => {
    const m = c.ultimoMessaggio;
    if(!m) return;
    const testo = m.tipo && m.tipo !== "testo" ? previewAllegato(m.tipo, m.file_nome) : (m.testo || "");
    candidates.push({ tipo: "proprietario", nome: c.altro?.full_name || "Utente Equo", testo, data: m.created_at, target: c });
  });

  if(candidates.length === 0) return;
  candidates.sort((a, b) => new Date(b.data) - new Date(a.data));
  window.homeChatTutte = candidates;
  const top = candidates[0];
  homeLastMessageTarget = top;
  document.getElementById("home-last-message-from").textContent = top.nome;
  document.getElementById("home-last-message-preview").textContent = top.testo;
  card.style.display = "block";
  if(typeof wgRidisegna === "function" && vistaAi() === "proprietario") wgRidisegna();
  if(typeof homeV3Chat === "function") homeV3Chat();
}

function goToLastMessage(){
  if(!homeLastMessageTarget) return;
  showPage("chat");
  if(homeLastMessageTarget.tipo === "scuderia"){
    const s = homeLastMessageTarget.target;
    loadStableChatSection().then(() => openStableChatThread(s.membro_id, s.centro_id, s.nome));
  } else if(homeLastMessageTarget.tipo === "maniscalco"){
    const f = homeLastMessageTarget.target;
    loadFarrierChatSection().then(() => openFarrierChatThread(f.cliente_mascalcia_id, f.nome_maniscalco || "Il tuo maniscalco"));
  } else {
    const c = homeLastMessageTarget.target;
    loadOwnerChatList().then(() => openOwnerChatThread(c.id, c.altro?.full_name || "Utente Equo"));
  }
}

function renderHorsesList(){
  const box = document.getElementById("horses-list");
  if(horses.length === 0){
    box.innerHTML = '<div class="empty-state"><div class="fa-icon" style="width:32px;height:32px;font-size:28px;margin:0 auto 10px"><i class="fa-solid fa-horse-head"></i></div>Nessun cavallo ancora. Aggiungine uno per iniziare.</div>';
    return;
  }
  const TIPO_LABELS = { proprieta: "Di proprietà", noleggio: "A noleggio" };
  box.innerHTML = horses.map(h => {
    const sub = [h.breed, TIPO_LABELS[h.tipo_proprieta] || null].filter(Boolean).join(" · ") || "Razza non specificata";
    const bl = cavalliBloccati.has(h.id);
    return `
    <div class="card horse-card${bl ? " bloccato" : ""}" data-cerca="${escapeHtml([h.microchip, h.mantello, h.codice_equo].filter(Boolean).join(" "))}" onclick="openHorseDetail('${h.id}')">
      <div class="horse-avatar"><i class="fa-solid fa-horse-head" style="font-size:22px"></i></div>
      <div>
        <div style="font-weight:700">${escapeHtml(h.name)}${bl ? ' <span style="font-size:11px;font-weight:700;color:#7A5A00;background:#F8EDD2;border-radius:999px;padding:2px 8px;margin-left:4px">Bloccato</span>' : ""}</div>
        <div class="muted" style="font-size:13px">${escapeHtml(sub)}</div>
      </div>
    </div>`;
  }).join("");
}

let editingHorseId = null;
const TIPO_PROPRIETA_LABELS = { proprieta: "Cavallo di proprietà", noleggio: "Cavallo a noleggio" };

const LIMITE_CAVALLI_FREE = 1;
function openHorseForm(id){
  if(!id && !isPremium() && horses.length >= LIMITE_CAVALLI_FREE){ openModal("modal-limite-cavalli"); return; }
  editingHorseId = id || null;
  document.getElementById("horse-error").style.display = "none";
  document.getElementById("horse-form-title").textContent = editingHorseId ? "Modifica cavallo" : "Nuovo cavallo";
  if(editingHorseId){
    const h = horses.find(x => x.id === editingHorseId);
    document.getElementById("horse-name").value = h?.name || "";
    document.getElementById("horse-tipo-proprieta").value = h?.tipo_proprieta || "proprieta";
    razzaImposta("horse-breed", h?.breed || "");
    document.getElementById("horse-mantello").value = h?.mantello || "";
    document.getElementById("horse-birthdate").value = h?.birth_date || "";
    document.getElementById("horse-microchip").value = h?.microchip || "";
    document.getElementById("horse-gruppo-sanguigno").value = h?.gruppo_sanguigno || "";
    document.getElementById("horse-note").value = h?.note || "";
    document.getElementById("horse-condiviso").checked = h?.condiviso_ecosistema !== false;
  } else {
    ["horse-name","horse-mantello","horse-birthdate","horse-microchip","horse-gruppo-sanguigno","horse-note"].forEach(id => document.getElementById(id).value = "");
    razzaImposta("horse-breed", "");
    document.getElementById("horse-tipo-proprieta").value = "proprieta";
    document.getElementById("horse-condiviso").checked = true;
  }
  openModal("modal-add-horse");
}

function raccogliDatiHorseForm(){
  return {
    name: document.getElementById("horse-name").value.trim(),
    tipo_proprieta: document.getElementById("horse-tipo-proprieta").value,
    breed: document.getElementById("horse-breed").value.trim() || null,
    mantello: document.getElementById("horse-mantello").value.trim() || null,
    birth_date: document.getElementById("horse-birthdate").value || null,
    microchip: document.getElementById("horse-microchip").value.trim() || null,
    gruppo_sanguigno: document.getElementById("horse-gruppo-sanguigno").value.trim() || null,
    note: document.getElementById("horse-note").value.trim() || null,
    condiviso_ecosistema: document.getElementById("horse-condiviso").checked,
  };
}

async function saveHorse(){
  const errBox = document.getElementById("horse-error");
  errBox.style.display = "none";
  if(razzaValore("horse-breed") === false) return;
  const payload = raccogliDatiHorseForm();
  if(!payload.name){ errBox.textContent = "Inserisci il nome del cavallo."; errBox.style.display = "block"; return; }

  if(!payload.microchip){
    openModal("modal-microchip-warning");
    return;
  }
  await eseguiSalvataggioHorse(payload);
}

function tornaAInserireMicrochip(){
  closeModal("modal-microchip-warning");
  setTimeout(() => document.getElementById("horse-microchip")?.focus(), 150);
}

async function confermaSalvaSenzaMicrochip(){
  closeModal("modal-microchip-warning");
  await eseguiSalvataggioHorse(raccogliDatiHorseForm());
}

async function eseguiSalvataggioHorse(payload){ if(!(await eseguiPrimaConStop("eseguiSalvataggioHorse", [payload]))) return; return eseguiSalvataggioHorseBase(payload); }
async function eseguiSalvataggioHorseBase(payload){
  const errBox = document.getElementById("horse-error");
  const btn = document.getElementById("horse-save-btn");
  btn.disabled = true;
  try{
    let horseId = editingHorseId;
    if(editingHorseId){
      const { error } = await DB.updateHorse(editingHorseId, payload);
      if(error) throw error;
    } else {
      const { error, data } = await DB.insertHorse(payload);
      if(error) throw error;
      horseId = data?.id || null;
    }
    closeModal("modal-add-horse");
    await loadHorses();
    if(currentHorseId) await openHorseDetail(currentHorseId);
    if(payload.microchip && !DEMO_MODE){
      await sb.rpc("sync_microchip_link", { p_microchip: payload.microchip });
    }
  } catch(err){
    errBox.textContent = err.message || "Errore nel salvataggio.";
    errBox.style.display = "block";
  } finally {
    btn.disabled = false;
  }
}

function renderHorseInfoBox(h){ const x = renderHorseInfoBoxBase.apply(this, arguments); eseguiEstensioniSubito(estensioniDopo, "renderHorseInfoBox", [h]); return x; }
function renderHorseInfoBoxBase(h){
  const box = document.getElementById("horse-info-box");
  if(!box) return;
  const righe = [
    ["Categoria", TIPO_PROPRIETA_LABELS[h.tipo_proprieta] || "—"],
    ["Codice Equo", h.codice_equo || "in assegnazione"],
    ["Razza", h.breed || "—"],
    ["Mantello", h.mantello || "—"],
    ["Data di nascita", h.birth_date ? formatDate(h.birth_date) : "—"],
    ["Microchip", h.microchip || "Non inserito"],
    ["Gruppo sanguigno", h.gruppo_sanguigno || "—"],
    ["Note", h.note || "—"],
    ["Condiviso con i professionisti", h.condiviso_ecosistema === false ? "No" : "Sì"],
  ];
  box.innerHTML = righe.map(([label, val]) => `
    <div style="display:flex;justify-content:space-between;gap:10px">
      <span class="muted">${label}</span><span style="text-align:right">${escapeHtml(String(val))}</span>
    </div>`).join("");
}

async function openHorseDetail(id){
  await eseguiEstensioni(estensioniPrima, "openHorseDetail", [id]);
  const r = await openHorseDetailBase(id);
  await eseguiEstensioni(estensioniDopo, "openHorseDetail", [id]);
  return r;
}
async function openHorseDetailBase(id){
  currentHorseId = id;
  const horse = horses.find(h => h.id === id);
  if(!horse) return;
  document.getElementById("cavalli-list-view").style.display = "none";
  document.getElementById("cavalli-detail-view").style.display = "block";
  document.getElementById("detail-horse-name").textContent = horse.name;
  renderHorseBloccato(horse);
  renderLivelloCavallo(horse);
  renderHorseInfoBox(horse);
  renderDoveStaProprietario(horse);
  caricaAllegatiCavallo("horse-allegati", "proprietario", { id });
  await loadHorseEvents(id);
}

function closeHorseDetail(){
  currentHorseId = null;
  document.getElementById("cavalli-list-view").style.display = "block";
  document.getElementById("cavalli-detail-view").style.display = "none";
}

function askDeleteHorse(){
  if(!currentHorseId) return;
  const h = horses.find(x => x.id === currentHorseId);
  document.getElementById("delete-horse-nome-1").textContent = h?.name || "questo cavallo";
  openModal("modal-delete-horse-1");
}

function askDeleteHorseStep2(){
  const h = horses.find(x => x.id === currentHorseId);
  closeModal("modal-delete-horse-1");
  document.getElementById("delete-horse-nome-2").textContent = h?.name || "il cavallo";
  openModal("modal-delete-horse-2");
}

async function confirmDeleteHorse(){
  if(!currentHorseId) return;
  await DB.deleteHorse(currentHorseId);
  closeModal("modal-delete-horse-2");
  closeHorseDetail();
  await loadHorses();
}

