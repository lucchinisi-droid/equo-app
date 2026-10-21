/* ---------- CONTATTI UTILI ---------- */
async function refreshContattiModule(){
  await loadContatti();
  renderContatti();
  await refreshDatiFiscaliCard();
  refreshHardResetCard();
}

async function loadContatti(){
  if(DEMO_MODE){ contattiList = demoState.contatti; return; }
  const { data, error } = await sb.from("scuderia_contatti")
    .select("id, centro_id, tipo, tipo_altro, nome, telefono, email, note")
    .eq("centro_id", currentCentro.id)
    .order("nome", { ascending: true });
  if(!error) contattiList = data || [];
}

function contattoRuoloLabel(c){
  return c.tipo === "altro" ? (c.tipo_altro || "Altro") : (CONTATTO_TIPO_LABELS[c.tipo] || c.tipo);
}

function renderContatti(){
  document.getElementById("contatti-count").textContent = contattiList.length;
  const body = document.getElementById("contatti-table-body");
  const empty = document.getElementById("contatti-empty");
  body.innerHTML = "";
  empty.style.display = contattiList.length === 0 ? "block" : "none";
  const isAdminUser = currentMembro?.ruolo === "admin";
  const canEditContatti = isAdminUser || memberCanUI("contatti");

  contattiList.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(c.nome)}</td>
      <td><span class="badge-pill badge-gray">${escapeHtml(contattoRuoloLabel(c))}</span></td>
      <td>${c.telefono ? escapeHtml(c.telefono) : "—"}</td>
      <td>${c.email ? escapeHtml(c.email) : "—"}</td>
      <td style="text-align:right;white-space:nowrap">
        ${canEditContatti ? `
          <button class="btn btn-ghost btn-sm" onclick="openContattoForm('${c.id}')"><i class="fa-solid fa-pen"></i></button>
          ${isAdminUser ? `<button class="btn btn-ghost btn-sm" onclick="askDeleteContatto('${c.id}')"><i class="fa-solid fa-trash"></i></button>` : ""}
        ` : ""}
      </td>`;
    body.appendChild(tr);
  });
}

function toggleContattoAltro(){
  const tipo = document.getElementById("cont-tipo").value;
  document.getElementById("cont-tipo-altro-field").style.display = tipo === "altro" ? "block" : "none";
}

function openContattoForm(id){
  editingContattoId = id || null;
  document.getElementById("contatto-error").style.display = "none";
  document.getElementById("modal-contatto-title").textContent = editingContattoId ? "Modifica contatto" : "Nuovo contatto";
  if(editingContattoId){
    const c = contattiList.find(x => x.id === editingContattoId);
    document.getElementById("cont-tipo").value = c?.tipo || "altro";
    document.getElementById("cont-tipo-altro").value = c?.tipo_altro || "";
    document.getElementById("cont-nome").value = c?.nome || "";
    document.getElementById("cont-telefono").value = c?.telefono || "";
    document.getElementById("cont-email").value = c?.email || "";
    document.getElementById("cont-note").value = c?.note || "";
  } else {
    document.getElementById("cont-tipo").value = "istruttore_esterno";
    ["cont-tipo-altro","cont-nome","cont-telefono","cont-email","cont-note"].forEach(id => document.getElementById(id).value = "");
  }
  toggleContattoAltro();
  openModal("modal-contatto");
}

async function saveContatto(){
  const tipo = document.getElementById("cont-tipo").value;
  const nome = document.getElementById("cont-nome").value.trim();
  const errBox = document.getElementById("contatto-error");
  errBox.style.display = "none";
  if(!nome){ errBox.textContent = "Inserisci il nome del contatto."; errBox.style.display = "block"; return; }

  const payload = {
    tipo,
    tipo_altro: tipo === "altro" ? (document.getElementById("cont-tipo-altro").value.trim() || null) : null,
    nome,
    telefono: document.getElementById("cont-telefono").value.trim() || null,
    email: document.getElementById("cont-email").value.trim() || null,
    note: document.getElementById("cont-note").value.trim() || null,
  };

  try{
    if(DEMO_MODE){
      if(editingContattoId){
        const idx = demoState.contatti.findIndex(c => c.id === editingContattoId);
        if(idx >= 0) demoState.contatti[idx] = { ...demoState.contatti[idx], ...payload };
      } else {
        demoState.contatti.push({ id:"ct" + (demoIdCounter++ + 600), centro_id: demoState.centro.id, ...payload });
      }
    } else if(editingContattoId){
      const { error } = await sb.from("scuderia_contatti").update(payload).eq("id", editingContattoId);
      if(error) throw error;
    } else {
      const { error } = await sb.from("scuderia_contatti").insert({ centro_id: currentCentro.id, ...payload });
      if(error) throw error;
    }
    await loadContatti();
    renderContatti();
    closeModal("modal-contatto");
    showToast(editingContattoId ? "Contatto aggiornato." : "Contatto aggiunto.");
  } catch(err){
    errBox.textContent = err.message || "Errore nel salvataggio.";
    errBox.style.display = "block";
  }
}

function askDeleteContatto(id){
  contattoToDelete = id;
  openModal("modal-delete-contatto");
}

async function confirmDeleteContatto(){
  if(!contattoToDelete) return;
  if(DEMO_MODE){
    demoState.contatti = demoState.contatti.filter(c => c.id !== contattoToDelete);
  } else {
    const { error } = await sb.from("scuderia_contatti").delete().eq("id", contattoToDelete);
    if(error){ showToast("Errore nell'eliminazione."); closeModal("modal-delete-contatto"); return; }
  }
  await loadContatti();
  renderContatti();
  closeModal("modal-delete-contatto");
  showToast("Contatto eliminato.");
}

function copyJoinCode(){
  const code = currentCentro?.join_code || "";
  navigator.clipboard?.writeText(code).then(() => showToast("Codice copiato!"));
}

