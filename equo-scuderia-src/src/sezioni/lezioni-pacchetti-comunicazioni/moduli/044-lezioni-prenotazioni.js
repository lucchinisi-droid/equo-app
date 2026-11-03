// Equo App · lezioni-pacchetti-comunicazioni · modulo (moduli ES, costruiti con Vite in ruoli/lezioni-pacchetti-comunicazioni/costruito.js)
/* ---------- LEZIONI & PRENOTAZIONI ---------- */
const STATO_LEZIONE_LABELS = { prenotata:"Prenotata", confermata:"Confermata", completata:"Completata", annullata:"Annullata" };
/* -> stato-condiviso.js */

async function refreshLezioniModule(){
  if(cavalliList.length === 0) await loadCavalli();
  await Promise.all([loadLezioni(), loadPacchetti().catch(() => {}), caricaDisdettaOre()]);
  populateLezioneSelects();
  renderLezioni();
}

async function loadLezioni(){
  if(DEMO_MODE){ lezioniList = demoState.lezioni; aggiornaContatoriNav(); return; }
  const { data, error } = await sb.from("scuderia_lezioni")
    .select("*")
    .eq("centro_id", currentCentro.id)
    .order("data", { ascending: true }).order("ora_inizio", { ascending: true });
  if(!error) lezioniList = data || [];
  aggiornaContatoriNav();
}

function membroNome(id){
  const m = teamList.find(x => x.id === id);
  return m ? (m.nome_visualizzato || RUOLO_LABELS[m.ruolo]) : "—";
}
function cavalloNome(id){
  const c = cavalliList.find(x => x.id === id);
  return c ? c.nome : "—";
}

function setLezioniFilter(f){
  lezioniFilter = f;
  document.querySelectorAll(".lez-filter-btn").forEach(b => b.classList.toggle("active", b.dataset.filter === f));
  renderLezioni();
}

function renderLezioni(){
  const oggi = isoLoc(new Date());
  let list = [...lezioniList];
  if(lezioniFilter === "prossime") list = list.filter(l => l.data >= oggi);
  if(lezioniFilter === "passate") list = list.filter(l => l.data < oggi);
  list.sort((a,b) => (a.data + a.ora_inizio).localeCompare(b.data + b.ora_inizio) * (lezioniFilter === "passate" ? -1 : 1));

  const body = document.getElementById("lezioni-table-body");
  const empty = document.getElementById("lezioni-empty");
  body.innerHTML = "";
  empty.style.display = list.length === 0 ? "block" : "none";

  list.forEach(l => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatDate(l.data)}</td>
      <td>${l.ora_inizio ? String(l.ora_inizio).slice(0,5) : "—"}</td>
      <td>${escapeHtml(membroNome(l.istruttore_id))}</td>
      <td>${escapeHtml(cavalloNome(l.cavallo_id))}</td>
      <td>${escapeHtml(membroNome(l.allievo_id))}${l.cavaliere ? `<div style="color:var(--muted);font-size:12px">monta ${escapeHtml(l.cavaliere)}</div>` : ""}${carnetBreve(l.pacchetto_id)}</td>
      <td><span class="badge-pill badge-${STATO_LEZIONE_BADGE[l.stato] || "gray"}">${STATO_LEZIONE_LABELS[l.stato] || l.stato}</span></td>
      <td style="text-align:right">
        ${l.allievo_id ? `<button class="btn btn-ghost btn-sm" onclick="chattaConMembro('${l.allievo_id}')" title="Chatta"><i class="fa-solid fa-comment-dots"></i></button>` : ""}
        ${memberCanUI("lezioni") ? `<button class="btn btn-ghost btn-sm" onclick="openLezioneForm('${l.id}')" title="Modifica"><i class="fa-solid fa-pen"></i></button>` : ""}
        ${(l.stato !== "annullata" && l.stato !== "completata" && memberCanUI("lezioni")) ? `<button class="btn btn-ghost btn-sm" onclick="setLezioneStato('${l.id}','completata')" title="Segna completata"><i class="fa-solid fa-check"></i></button>` : ""}
        <button class="btn btn-ghost btn-sm" onclick="askDeleteLezione('${l.id}')" title="Elimina"><i class="fa-solid fa-trash"></i></button>
      </td>`;
    body.appendChild(tr);
  });
}

function populateLezioneSelects(){
  const istruttori = teamList.filter(m => ["istruttore","admin"].includes(m.ruolo));
  // allievi del team + proprietari collegati al centro (es. chi ha il cavallo in pensione e fa lezione)
  const allievi = teamList.filter(m => m.ruolo === "allievo");
  const proprietari = teamList.filter(m => m.ruolo === "proprietario");
  const selIst = document.getElementById("lez-istruttore");
  const selAll = document.getElementById("lez-allievo");
  const selCav = document.getElementById("lez-cavallo");
  const opt = (m, def) => `<option value="${m.id}">${escapeHtml(m.nome_visualizzato || def)}</option>`;
  selIst.innerHTML = istruttori.map(m => opt(m, RUOLO_LABELS[m.ruolo])).join("") || `<option value="">Nessun istruttore nel team</option>`;
  selAll.innerHTML = `<option value="">Nessuno / da definire</option>`
    + (allievi.length ? `<optgroup label="Allievi">${allievi.map(m => opt(m, "Allievo")).join("")}</optgroup>` : "")
    + (proprietari.length ? `<optgroup label="Proprietari collegati">${proprietari.map(m => opt(m, "Proprietario")).join("")}</optgroup>` : "");
  selCav.innerHTML = `<option value="">Nessuno / da definire</option>` + cavalliList.map(c => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("");
}

// "Chi monta": suggerisce i nomi già usati nelle lezioni dello stesso allievo/proprietario (o di tutti se vuoto)
function aggiornaCavalieriSuggeriti(){
  const allievo = document.getElementById("lez-allievo").value;
  const nomi = [...new Set(lezioniList.filter(l => l.cavaliere && (!allievo || l.allievo_id === allievo)).map(l => l.cavaliere))].sort();
  document.getElementById("lez-cavalieri-suggeriti").innerHTML = nomi.map(n => `<option value="${escapeHtml(n)}">`).join("");
}

// scegliendo un cavallo con proprietario collegato, l'allievo si compila da solo (se vuoto)
function lezioneCavalloCambiato(){
  const cav = cavalliList.find(c => c.id === document.getElementById("lez-cavallo").value);
  const selAll = document.getElementById("lez-allievo");
  if(cav?.proprietario_membro_id && !selAll.value && [...selAll.options].some(o => o.value === cav.proprietario_membro_id)){
    selAll.value = cav.proprietario_membro_id;
    aggiornaCavalieriSuggeriti();
  }
}

function openLezioneForm(id){
  document.getElementById("lezione-error").style.display = "none";
  populateLezioneSelects();
  const l = id ? lezioniList.find(x => x.id === id) : null;
  editingLezioneId = l ? l.id : null;
  document.getElementById("lezione-modal-titolo").textContent = l ? "Modifica lezione" : "Nuova lezione";
  document.getElementById("lez-stato-field").style.display = l ? "block" : "none";
  document.getElementById("lez-data").value = l ? l.data : isoLoc(new Date());
  document.getElementById("lez-ora").value = l?.ora_inizio ? String(l.ora_inizio).slice(0,5) : "10:00";
  document.getElementById("lez-note").value = l?.note || "";
  document.getElementById("lez-cavallo").value = l?.cavallo_id || "";
  document.getElementById("lez-allievo").value = l?.allievo_id || "";
  document.getElementById("lez-stato").value = l?.stato || "prenotata";
  document.getElementById("lez-cavaliere").value = l?.cavaliere || "";
  aggiornaCavalieriSuggeriti();
  lezioneAggiornaCarnet(l?.pacchetto_id || null, !l);
  if(l?.istruttore_id) document.getElementById("lez-istruttore").value = l.istruttore_id;
  openModal("modal-lezione");
}

async function saveLezione(){
  const data = document.getElementById("lez-data").value;
  const ora_inizio = document.getElementById("lez-ora").value;
  const istruttore_id = document.getElementById("lez-istruttore").value || null;
  const cavallo_id = document.getElementById("lez-cavallo").value || null;
  const allievo_id = document.getElementById("lez-allievo").value || null;
  const note = document.getElementById("lez-note").value.trim() || null;
  const cavaliere = document.getElementById("lez-cavaliere").value.trim().slice(0, 80) || null;
  const errBox = document.getElementById("lezione-error");
  errBox.style.display = "none";
  if(!data || !ora_inizio){ errBox.textContent = "Inserisci data e orario."; errBox.style.display = "block"; return; }

  const pacchetto_id = document.getElementById("lez-pacchetto").value || null;
  const payload = { data, ora_inizio, istruttore_id, cavallo_id, allievo_id, note, cavaliere, pacchetto_id };
  if(editingLezioneId) payload.stato = document.getElementById("lez-stato").value || "prenotata";
  else payload.stato = "prenotata";
  try{
    if(DEMO_MODE){
      if(editingLezioneId){
        const l = demoState.lezioni.find(x => x.id === editingLezioneId);
        if(l){ const prima = l.stato, pacPrima = l.pacchetto_id; if(pacPrima && pacPrima !== payload.pacchetto_id){ l.stato = "prenotata"; demoScalo(l, prima); l.stato = prima; l.pacchetto_id = pacPrima; } Object.assign(l, payload); demoScalo(l, prima); }
      } else {
        const l = { id:"l" + (demoIdCounter++ + 200), centro_id: demoState.centro.id, ...payload };
        demoState.lezioni.push(l); demoScalo(l, null);
      }
    } else if(editingLezioneId){
      const { error } = await sb.from("scuderia_lezioni").update(payload).eq("id", editingLezioneId);
      if(error) throw error;
    } else {
      const { error } = await sb.from("scuderia_lezioni").insert({ centro_id: currentCentro.id, ...payload });
      if(error) throw error;
    }
    const modificata = !!editingLezioneId;
    editingLezioneId = null;
    await Promise.all([loadLezioni(), loadPacchetti().catch(() => {})]);
    renderLezioni();
    closeModal("modal-lezione");
    showToast(modificata ? "Lezione aggiornata." : "Lezione aggiunta.");
  } catch(err){
    errBox.textContent = err.message || "Errore nel salvataggio.";
    errBox.style.display = "block";
  }
}

async function setLezioneStato(id, stato){
  if(DEMO_MODE){
    const l = demoState.lezioni.find(x => x.id === id);
    if(l){ const prima = l.stato; l.stato = stato; demoScalo(l, prima); }
  } else {
    const { error } = await sb.from("scuderia_lezioni").update({ stato }).eq("id", id);
    if(error){ showToast("Errore nell'aggiornamento."); return; }
  }
  await Promise.all([loadLezioni(), loadPacchetti().catch(() => {})]);
  renderLezioni();
  const l = lezioniList.find(x => x.id === id), p = l?.pacchetto_id ? pacchettiList.find(x => x.id === l.pacchetto_id) : null;
  showToast(stato === "completata" && p && p.unita_totali != null ? `Lezione completata · nel carnet restano ${Math.max(p.unita_totali - (p.unita_usate || 0), 0)} lezioni.` : "Lezione aggiornata.");
}

function askDeleteLezione(id){ lezioneToDelete = id; openModal("modal-delete-lezione"); }

async function confirmDeleteLezione(){
  if(!lezioneToDelete) return;
  if(DEMO_MODE){
    const l = demoState.lezioni.find(x => x.id === lezioneToDelete);
    if(l){ const prima = l.stato; l.stato = "prenotata"; demoScalo(l, prima); }
    demoState.lezioni = demoState.lezioni.filter(l => l.id !== lezioneToDelete);
  } else {
    const { error } = await sb.from("scuderia_lezioni").delete().eq("id", lezioneToDelete);
    if(error){ showToast("Errore nell'eliminazione."); closeModal("modal-delete-lezione"); return; }
  }
  await loadLezioni();
  renderLezioni();
  closeModal("modal-delete-lezione");
  showToast("Lezione eliminata.");
}


/* ---------- CARNET COLLEGATO ALLE LEZIONI (SQL 40) ----------
   In produzione lo scalo lo fa il database (trigger su scuderia_lezioni): qui si propone il carnet e si mostra quante
   lezioni restano. In demo demoScalo applica le stesse regole. */
function carnetValidiPer(allievoId, data){
  if(!allievoId) return [];
  const ref = typeof clientiDati !== "undefined" ? clientiDati[allievoId]?.referente_id : null;
  return (pacchettiList || []).filter(p => p.tipo === "carnet" && (p.membro_id === allievoId || (ref && p.membro_id === ref))
      && (!p.data_scadenza || p.data_scadenza >= data) && (!p.data_inizio || p.data_inizio <= data))
    .sort((a, b) => (a.data_scadenza || "9999").localeCompare(b.data_scadenza || "9999"));
}
function carnetRimaste(p){ return p && p.unita_totali != null ? p.unita_totali - (p.unita_usate || 0) : null; }
function carnetBreve(id){
  const p = id ? (pacchettiList || []).find(x => x.id === id) : null; if(!p) return "";
  const r = carnetRimaste(p);
  return `<div style="color:${r != null && r <= 2 ? "#8a6a12" : "var(--muted)"};font-size:12px"><i class="fa-solid fa-ticket"></i> carnet ${p.unita_usate || 0}/${p.unita_totali ?? "—"}</div>`;
}
function lezioneAggiornaCarnet(scelto, proponi){
  const sel = document.getElementById("lez-pacchetto"); if(!sel) return;
  const allievo = document.getElementById("lez-allievo").value, data = document.getElementById("lez-data").value || isoLoc(new Date());
  const validi = carnetValidiPer(allievo, data);
  const attuale = scelto !== undefined && scelto !== null ? scelto : sel.value;
  const extra = attuale && !validi.some(p => p.id === attuale) ? (pacchettiList || []).filter(p => p.id === attuale) : [];
  sel.innerHTML = `<option value="">— nessuno —</option>` + [...validi, ...extra].map(p => { const r = carnetRimaste(p);
    return `<option value="${p.id}">${escapeHtml(p.cliente)} · ${r == null ? "senza limite" : r + " su " + p.unita_totali + " rimaste"}${p.data_scadenza ? " · scade " + formatDate(p.data_scadenza) : ""}</option>`; }).join("");
  const libero = validi.find(p => carnetRimaste(p) == null || carnetRimaste(p) > 0);
  sel.value = attuale && [...sel.options].some(o => o.value === attuale) ? attuale : ((proponi !== false && !attuale && libero) ? libero.id : "");
  lezioneCarnetInfo();
}
function lezioneCarnetInfo(){
  const info = document.getElementById("lez-carnet-info"); if(!info) return;
  const allievo = document.getElementById("lez-allievo").value, id = document.getElementById("lez-pacchetto").value;
  const p = id ? (pacchettiList || []).find(x => x.id === id) : null, r = carnetRimaste(p);
  if(p) info.innerHTML = r == null ? "Lezioni senza limite." : r <= 0 ? '<span style="color:var(--danger)">Questo carnet è finito: la lezione si salva, ma conviene un carnet nuovo.</span>'
    : `Quando la segni completata, la lezione si scala da qui: ne restano ${r}.`;
  else info.innerHTML = allievo ? "Nessun carnet valido: la lezione si salva lo stesso, senza scalare." : "";
}
// regola della disdetta (centri.disdetta_ore): letta qui, così funziona anche prima dello SQL 40
async function caricaDisdettaOre(){
  if(!DEMO_MODE && currentCentro?.id && currentCentro.disdetta_ore == null){
    const { data, error } = await sb.from("centri").select("disdetta_ore").eq("id", currentCentro.id).maybeSingle();
    if(!error && data?.disdetta_ore != null) currentCentro.disdetta_ore = data.disdetta_ore;
  }
  const sel = document.getElementById("lez-disdetta-ore"); if(!sel) return;
  const ore = String(currentCentro?.disdetta_ore ?? 24);
  if(![...sel.options].some(o => o.value === ore)) sel.insertAdjacentHTML("beforeend", `<option value="${ore}">${ore}</option>`);
  sel.value = ore;
  sel.disabled = currentMembro?.ruolo !== "admin";
}
async function salvaDisdettaOre(){
  const ore = parseInt(document.getElementById("lez-disdetta-ore").value, 10);
  if(!DEMO_MODE){ const { error } = await sb.from("centri").update({ disdetta_ore: ore }).eq("id", currentCentro.id); if(error){ showToast(error.message); return; } }
  currentCentro.disdetta_ore = ore;
  showToast(ore ? `Disdetta senza perdere la lezione fino a ${ore} ore prima.` : "Le lezioni disdette non si perdono mai.");
}
// demo: stesse regole dello SQL 40
function demoScalo(l, statoPrima){
  if(!DEMO_MODE || !l) return;
  demoState.movimenti = demoState.movimenti || [];
  if(!l.pacchetto_id && l.allievo_id && l.stato === "completata" && statoPrima !== "completata"){
    const libero = carnetValidiPer(l.allievo_id, l.data).find(p => carnetRimaste(p) == null || carnetRimaste(p) > 0);
    l.pacchetto_id = libero ? libero.id : null;
  }
  const p = demoState.pacchetti.find(x => x.id === l.pacchetto_id && x.tipo === "carnet"); if(!p) return;
  const netto = demoState.movimenti.filter(m => m.lezione_id === l.id && m.pacchetto_id === p.id).reduce((s, m) => s + m.quantita, 0);
  let target, motivo = "lezione";
  if(l.stato === "completata") target = 1;
  else if(l.stato === "annullata" && statoPrima && statoPrima !== "annullata"){
    const inizio = new Date(l.data + "T" + String(l.ora_inizio || "00:00").slice(0, 5)).getTime();
    target = Date.now() > inizio - (currentCentro?.disdetta_ore ?? 24) * 3600000 ? 1 : 0; motivo = "disdetta_tardiva";
  } else if(l.stato === "annullata") target = netto;
  else target = 0;
  if(target === netto) return;
  demoState.movimenti.push({ id: "mv" + (demoIdCounter++), pacchetto_id: p.id, lezione_id: l.id, quantita: target - netto, motivo: target > netto ? motivo : "restituito",
    nota: "lezione del " + formatDate(l.data), creato_il: new Date().toISOString() });
  p.unita_usate = Math.max((p.unita_usate || 0) + target - netto, 0);
}

export { lezioneAggiornaCarnet, lezioneCarnetInfo, caricaDisdettaOre, salvaDisdettaOre, carnetValidiPer, aggiornaCavalieriSuggeriti, askDeleteLezione, cavalloNome, confirmDeleteLezione, lezioneCavalloCambiato, loadLezioni, membroNome, openLezioneForm, refreshLezioniModule, saveLezione, setLezioneStato, setLezioniFilter };
