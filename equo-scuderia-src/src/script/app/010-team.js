/* ---------- TEAM ---------- */
async function loadTeam(){
  if(DEMO_MODE){ teamList = demoState.membri; return; }
  const { data, error } = await sb.from("scuderia_membri")
    .select("id, user_id, ruolo, nome_visualizzato, livello, permessi")
    .eq("centro_id", currentCentro.id)
    .order("created_at", { ascending: true });
  if(!error) teamList = data || [];
}

function renderTeam(){
  document.getElementById("team-count").textContent = teamList.length;
  const body = document.getElementById("team-table-body");
  const empty = document.getElementById("team-empty");
  body.innerHTML = "";
  if(teamList.length <= 1){ empty.style.display = "block"; } else { empty.style.display = "none"; }

  teamList.forEach(m => {
    const isMe = m.user_id === currentUser.id;
    const isAdminUser = currentMembro.ruolo === "admin";
    const canRemove = isAdminUser && !isMe && m.ruolo !== "admin";
    const canEdit = isAdminUser && !isMe;
    const livelloLabel = m.ruolo === "admin" ? "Admin" : (LIVELLO_LABELS[m.livello] || "—");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(m.nome_visualizzato || (isMe ? "Tu" : "Membro"))}</td>
      <td><span class="badge-pill badge-gray">${RUOLO_LABELS[m.ruolo] || m.ruolo}</span></td>
      <td><span class="badge-pill badge-gray">${livelloLabel}</span></td>
      <td style="text-align:right;white-space:nowrap">
        ${canEdit ? `<button class="btn btn-ghost btn-sm" onclick="openMemberForm('${m.id}')"><i class="fa-solid fa-pen"></i></button>` : ""}
        ${canRemove ? `<button class="btn btn-ghost btn-sm" onclick="askRemoveMember(${jsArg(m.id)}, ${jsArg(m.nome_visualizzato || 'questo membro')})"><i class="fa-solid fa-trash"></i></button>` : ""}
      </td>
    `;
    body.appendChild(tr);
  });
}

function onMemberRuoloChange(){
  const ruolo = document.getElementById("member-ruolo").value;
  const isAdminRole = ruolo === "admin";
  document.getElementById("member-livello-field").style.display = isAdminRole ? "none" : "block";
  document.getElementById("member-livello-admin-note").style.display = isAdminRole ? "block" : "none";
  if(isAdminRole){
    document.getElementById("member-permessi-field").style.display = "none";
  } else {
    onMemberLivelloChange();
  }
}
function onMemberLivelloChange(){
  const livello = document.getElementById("member-livello").value;
  document.getElementById("member-permessi-field").style.display = livello === "3" ? "block" : "none";
}

function openMemberForm(id){
  const m = teamList.find(x => x.id === id);
  if(!m) return;
  editingMemberId = id;
  document.getElementById("member-error").style.display = "none";
  document.getElementById("member-nome").value = m.nome_visualizzato || "";
  document.getElementById("member-ruolo").value = m.ruolo;
  document.getElementById("member-livello").value = (m.livello && m.livello !== "admin") ? m.livello : "1";
  PERMESSI_FLAGS.forEach(f => {
    document.getElementById("perm-" + f).checked = !!(m.permessi && m.permessi[f]);
  });
  onMemberRuoloChange();
  openModal("modal-member");
}

async function saveMember(){
  if(!editingMemberId) return;
  const nome_visualizzato = document.getElementById("member-nome").value.trim() || null;
  const ruolo = document.getElementById("member-ruolo").value;
  const errBox = document.getElementById("member-error");
  errBox.style.display = "none";

  let livello, permessi;
  if(ruolo === "admin"){
    livello = "admin"; permessi = {};
  } else {
    livello = document.getElementById("member-livello").value;
    permessi = {};
    if(livello === "3"){
      PERMESSI_FLAGS.forEach(f => { permessi[f] = document.getElementById("perm-" + f).checked; });
    }
  }

  try{
    if(DEMO_MODE){
      const idx = demoState.membri.findIndex(x => x.id === editingMemberId);
      if(idx >= 0) demoState.membri[idx] = { ...demoState.membri[idx], nome_visualizzato, ruolo, livello, permessi };
      teamList = demoState.membri;
    } else {
      const { error } = await sb.from("scuderia_membri").update({ nome_visualizzato, ruolo, livello, permessi }).eq("id", editingMemberId);
      if(error) throw error;
      await loadTeam();
    }
    renderTeam();
    closeModal("modal-member");
    showToast("Membro aggiornato.");
  } catch(err){
    errBox.textContent = err.message || "Errore nel salvataggio.";
    errBox.style.display = "block";
  }
}

function askRemoveMember(id, nome){
  memberToRemove = id;
  document.getElementById("remove-member-text").textContent = `Confermi di voler rimuovere ${nome} dal team?`;
  openModal("modal-remove-member");
}

async function confirmRemoveMember(){
  if(!memberToRemove) return;
  if(DEMO_MODE){
    demoState.membri = demoState.membri.filter(m => m.id !== memberToRemove);
    teamList = demoState.membri;
  } else {
    const { error } = await sb.from("scuderia_membri").delete().eq("id", memberToRemove);
    if(error){ showToast("Errore nella rimozione."); closeModal("modal-remove-member"); return; }
    await loadTeam();
  }
  renderTeam();
  closeModal("modal-remove-member");
  showToast("Membro rimosso.");
}

