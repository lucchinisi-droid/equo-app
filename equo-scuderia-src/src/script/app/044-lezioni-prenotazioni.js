/* ---------- LEZIONI & PRENOTAZIONI ---------- */
const STATO_LEZIONE_LABELS = { prenotata:"Prenotata", confermata:"Confermata", completata:"Completata", annullata:"Annullata" };
const STATO_LEZIONE_BADGE = { prenotata:"gray", confermata:"green", completata:"green", annullata:"red" };

async function refreshLezioniModule(){
  if(cavalliList.length === 0) await loadCavalli();
  await loadLezioni();
  populateLezioneSelects();
  renderLezioni();
}

async function loadLezioni(){
  if(DEMO_MODE){ lezioniList = demoState.lezioni; aggiornaContatoriNav(); return; }
  const { data, error } = await sb.from("scuderia_lezioni")
    .select("id, centro_id, data, ora_inizio, istruttore_id, cavallo_id, allievo_id, stato, note, cavaliere")
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
      <td>${escapeHtml(membroNome(l.allievo_id))}${l.cavaliere ? `<div style="color:var(--muted);font-size:12px">monta ${escapeHtml(l.cavaliere)}</div>` : ""}</td>
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

  const payload = { data, ora_inizio, istruttore_id, cavallo_id, allievo_id, note, cavaliere };
  if(editingLezioneId) payload.stato = document.getElementById("lez-stato").value || "prenotata";
  else payload.stato = "prenotata";
  try{
    if(DEMO_MODE){
      if(editingLezioneId){
        const l = demoState.lezioni.find(x => x.id === editingLezioneId);
        if(l) Object.assign(l, payload);
      } else {
        demoState.lezioni.push({ id:"l" + (demoIdCounter++ + 200), centro_id: demoState.centro.id, ...payload });
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
    await loadLezioni();
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
    if(l) l.stato = stato;
  } else {
    const { error } = await sb.from("scuderia_lezioni").update({ stato }).eq("id", id);
    if(error){ showToast("Errore nell'aggiornamento."); return; }
  }
  await loadLezioni();
  renderLezioni();
  showToast("Lezione aggiornata.");
}

function askDeleteLezione(id){ lezioneToDelete = id; openModal("modal-delete-lezione"); }

async function confirmDeleteLezione(){
  if(!lezioneToDelete) return;
  if(DEMO_MODE){
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

