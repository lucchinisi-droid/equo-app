/* ---------- PACCHETTI & ABBONAMENTI ---------- */
const TIPO_PACCHETTO_LABELS = { carnet:"Carnet lezioni", abbonamento:"Abbonamento", pensione:"Pensione" };

async function refreshPacchettiModule(){
  if(cavalliList.length === 0) await loadCavalli();
  await loadEventiAll();
  await loadPacchetti();
  populatePacchettoMembroSelect();
  renderCruscotto();
  renderPacchetti();
}

function populatePacchettoMembroSelect(){
  const sel = document.getElementById("pac-membro");
  if(!sel) return;
  sel.innerHTML = `<option value="">— nessuno (solo testo libero) —</option>` +
    teamList.map(m => `<option value="${m.id}">${escapeHtml(m.nome_visualizzato || RUOLO_LABELS[m.ruolo])} (${RUOLO_LABELS[m.ruolo] || m.ruolo})</option>`).join("");
}

async function loadPacchetti(){
  if(DEMO_MODE){ pacchettiList = demoState.pacchetti; aggiornaContatoriNav(); return; }
  const { data, error } = await sb.from("scuderia_pacchetti")
    .select("id, centro_id, cliente, tipo, unita_totali, unita_usate, data_inizio, data_scadenza, prezzo, note, membro_id, cavallo_id")
    .eq("centro_id", currentCentro.id)
    .order("data_scadenza", { ascending: true });
  if(!error) pacchettiList = data || [];
  aggiornaContatoriNav();
}

function statusPacchetto(p){
  if(p.tipo === "carnet" && p.unita_totali != null && p.unita_usate >= p.unita_totali) return "red";
  const carnetQuasiFinito = p.tipo === "carnet" && p.unita_totali != null && (p.unita_totali - (p.unita_usate || 0)) <= SOGLIE_CONTATORI.carnetUnitaRimaste;
  if(!p.data_scadenza) return carnetQuasiFinito ? "yellow" : "gray";
  const oggi = new Date(); oggi.setHours(0,0,0,0);
  const giorni = Math.round((new Date(p.data_scadenza) - oggi) / 86400000);
  if(giorni < 0) return "red";
  if(giorni <= SOGLIE_CONTATORI.pacchettiGiorni || carnetQuasiFinito) return "yellow";
  return "green";
}

function renderCruscotto(){
  // riusa lo scadenzario sanitario già caricato (eventiAll) + i pacchetti
  const countByStatus = { red:0, yellow:0 };
  cavalliList.forEach(c => {
    const s = worstStatus(c.id);
    if(s === "red") countByStatus.red++;
    else if(s === "yellow") countByStatus.yellow++;
  });
  let pacchettiInScadenza = 0, pacchettiScaduti = 0;
  pacchettiList.forEach(p => {
    const s = statusPacchetto(p);
    if(s === "red") pacchettiScaduti++;
    else if(s === "yellow") pacchettiInScadenza++;
  });

  const tiles = [
    { label:"Cavalli con scadenze sanitarie scadute", value: countByStatus.red, tone: countByStatus.red > 0 ? "red" : "green", icon:"fa-triangle-exclamation", type:"sanitarie" },
    { label:"Cavalli in scadenza (30 gg)", value: countByStatus.yellow, tone: countByStatus.yellow > 0 ? "yellow" : "green", icon:"fa-clock", type:"sanitarie" },
    { label:"Pacchetti scaduti / esauriti", value: pacchettiScaduti, tone: pacchettiScaduti > 0 ? "red" : "green", icon:"fa-ticket", type:"pacchetti" },
  ];
  document.getElementById("cruscotto-grid").innerHTML = tiles.map(t => `
    <div class="stat-tile stat-tile-clickable" onclick="openHomeDetail('${t.type}')">
      <div class="label"><i class="fa-solid ${t.icon}" style="margin-right:6px"></i>${t.label}</div>
      <div class="value" style="color:${t.tone === 'red' ? 'var(--danger)' : t.tone === 'yellow' ? '#8a6a12' : 'var(--text)'}">${t.value}</div>
    </div>`).join("");
}

function renderPacchetti(){
  const body = document.getElementById("pacchetti-table-body");
  const empty = document.getElementById("pacchetti-empty");
  body.innerHTML = "";
  empty.style.display = pacchettiList.length === 0 ? "block" : "none";

  pacchettiList.forEach(p => {
    const s = statusPacchetto(p);
    const dettaglio = p.tipo === "carnet"
      ? `${p.unita_usate ?? 0} / ${p.unita_totali ?? "—"} lezioni`
      : (p.prezzo ? `€ ${Number(p.prezzo).toFixed(2)}` : "—");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(p.cliente)}</td>
      <td>${TIPO_PACCHETTO_LABELS[p.tipo] || p.tipo}</td>
      <td>${dettaglio}</td>
      <td>${p.data_scadenza ? formatDate(p.data_scadenza) : "—"}</td>
      <td><span class="badge-pill badge-${s}">${s === "red" ? "Scaduto" : s === "yellow" ? "In scadenza" : "Attivo"}</span></td>
      <td style="text-align:right;white-space:nowrap">
        ${p.membro_id ? `<button class="btn btn-ghost btn-sm" onclick="chattaConMembro('${p.membro_id}')" title="Chatta"><i class="fa-solid fa-comment-dots"></i></button>` : ""}
        ${memberCanUI("pacchetti") ? `<button class="btn btn-ghost btn-sm" onclick="openPacchettoForm('${p.id}')"><i class="fa-solid fa-pen"></i></button>` : ""}
        <button class="btn btn-ghost btn-sm" onclick="askDeletePacchetto('${p.id}')"><i class="fa-solid fa-trash"></i></button>
      </td>`;
    body.appendChild(tr);
  });
}

function toggleTipoPacchetto(){
  const tipo = document.getElementById("pac-tipo").value;
  document.getElementById("pac-carnet-fields").style.display = tipo === "carnet" ? "grid" : "none";
  document.getElementById("pac-cavallo-field").style.display = tipo === "carnet" ? "none" : "block";
}
async function popolaPacchettoCavalli(sel){
  if(!cavalliList.length) await loadCavalli();
  document.getElementById("pac-cavallo").innerHTML = `<option value="">— nessuno —</option>` + cavalliList.map(c => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("");
  document.getElementById("pac-cavallo").value = sel || "";
}

function openPacchettoForm(id){
  editingPacchettoId = id || null;
  document.getElementById("pacchetto-error").style.display = "none";
  document.getElementById("modal-pacchetto-title").textContent = editingPacchettoId ? "Modifica pacchetto" : "Nuovo pacchetto";
  populatePacchettoMembroSelect();
  if(editingPacchettoId){
    const p = pacchettiList.find(x => x.id === editingPacchettoId);
    document.getElementById("pac-cliente").value = p?.cliente || "";
    document.getElementById("pac-membro").value = p?.membro_id || "";
    document.getElementById("pac-tipo").value = p?.tipo || "carnet";
    document.getElementById("pac-unita-totali").value = p?.unita_totali ?? "";
    document.getElementById("pac-unita-usate").value = p?.unita_usate ?? "0";
    document.getElementById("pac-inizio").value = p?.data_inizio || "";
    document.getElementById("pac-scadenza").value = p?.data_scadenza || "";
    document.getElementById("pac-prezzo").value = p?.prezzo ?? "";
    document.getElementById("pac-note").value = p?.note || "";
    popolaPacchettoCavalli(p?.cavallo_id);
  } else {
    popolaPacchettoCavalli(null);
    document.getElementById("pac-cliente").value = "";
    document.getElementById("pac-membro").value = "";
    document.getElementById("pac-tipo").value = "carnet";
    document.getElementById("pac-unita-totali").value = "";
    document.getElementById("pac-unita-usate").value = "0";
    document.getElementById("pac-inizio").value = isoLoc(new Date());
    document.getElementById("pac-scadenza").value = "";
    document.getElementById("pac-prezzo").value = "";
    document.getElementById("pac-note").value = "";
  }
  toggleTipoPacchetto();
  openModal("modal-pacchetto");
}

async function savePacchetto(){
  const cliente = document.getElementById("pac-cliente").value.trim();
  const tipo = document.getElementById("pac-tipo").value;
  const errBox = document.getElementById("pacchetto-error");
  errBox.style.display = "none";
  if(!cliente){ errBox.textContent = "Inserisci il nome del cliente."; errBox.style.display = "block"; return; }

  const payload = {
    cliente, tipo,
    membro_id: document.getElementById("pac-membro").value || null,
    unita_totali: tipo === "carnet" ? (parseInt(document.getElementById("pac-unita-totali").value) || null) : null,
    unita_usate: tipo === "carnet" ? (parseInt(document.getElementById("pac-unita-usate").value) || 0) : null,
    data_inizio: document.getElementById("pac-inizio").value || null,
    data_scadenza: document.getElementById("pac-scadenza").value || null,
    prezzo: document.getElementById("pac-prezzo").value ? parseFloat(document.getElementById("pac-prezzo").value) : null,
    note: document.getElementById("pac-note").value.trim() || null,
    cavallo_id: tipo === "carnet" ? null : (document.getElementById("pac-cavallo").value || null),
  };

  try{
    if(DEMO_MODE){
      if(editingPacchettoId){
        const idx = demoState.pacchetti.findIndex(p => p.id === editingPacchettoId);
        if(idx >= 0) demoState.pacchetti[idx] = { ...demoState.pacchetti[idx], ...payload };
      } else {
        demoState.pacchetti.push({ id:"p" + (demoIdCounter++ + 300), centro_id: demoState.centro.id, ...payload });
      }
    } else if(editingPacchettoId){
      const { error } = await sb.from("scuderia_pacchetti").update(payload).eq("id", editingPacchettoId);
      if(error) throw error;
    } else {
      const { error } = await sb.from("scuderia_pacchetti").insert({ centro_id: currentCentro.id, ...payload });
      if(error) throw error;
    }
    await loadPacchetti();
    renderCruscotto();
    renderPacchetti();
    closeModal("modal-pacchetto");
    showToast("Pacchetto salvato.");
  } catch(err){
    errBox.textContent = err.message || "Errore nel salvataggio.";
    errBox.style.display = "block";
  }
}

function askDeletePacchetto(id){ pacchettoToDelete = id; openModal("modal-delete-pacchetto"); }

async function confirmDeletePacchetto(){
  if(!pacchettoToDelete) return;
  if(DEMO_MODE){
    demoState.pacchetti = demoState.pacchetti.filter(p => p.id !== pacchettoToDelete);
  } else {
    const { error } = await sb.from("scuderia_pacchetti").delete().eq("id", pacchettoToDelete);
    if(error){ showToast("Errore nell'eliminazione."); closeModal("modal-delete-pacchetto"); return; }
  }
  await loadPacchetti();
  renderCruscotto();
  renderPacchetti();
  closeModal("modal-delete-pacchetto");
  showToast("Pacchetto eliminato.");
}

