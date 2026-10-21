/* ---------------- depositi ---------------- */
let magUbiEdit = null;
function magRenderDepositi(){
  const box = document.getElementById("mag-depositi");
  const conta = (id) => {
    const ids = [id, ...mag.ubicazioni.filter(u => u.parent_id === id).flatMap(u => [u.id, ...mag.ubicazioni.filter(x => x.parent_id === u.id).map(x => x.id)])];
    return mag.articoli.filter(a => ids.includes(a.ubicazione_id));
  };
  const depositi = mag.ubicazioni.filter(u => !u.parent_id);
  let html = magPuoGestire() ? `<div><button class="btn btn-primary" onclick="magApriUbicazione()"><i class="fa-solid fa-plus"></i> Nuovo deposito</button></div>` : "";
  if(!depositi.length) html += `<div class="card empty-state"><i class="fa-solid fa-warehouse"></i><div>Nessun deposito. Crea i posti dove tieni le cose (es. Fienile, Selleria, Magazzino mangimi, Armadio farmaci) e, se vuoi, zone e scaffali al loro interno.</div></div>`;
  html += depositi.map(d => {
    const arts = conta(d.id), g = magStatoGruppo(arts);
    const figli = mag.ubicazioni.filter(u => u.parent_id === d.id);
    return `<div class="mag-ubi"><h4><i class="mag-sem ${arts.length ? g.colore : "verde"}"></i><i class="fa-solid fa-warehouse" style="color:var(--primary)"></i> ${escapeHtml(d.nome)}
      <span class="badge-pill badge-gray" style="margin-left:auto">${arts.length} articoli</span>
      ${magPuoGestire() ? `<button class="btn btn-sm btn-ghost" onclick="magApriUbicazione('${d.id}')"><i class="fa-solid fa-pen"></i></button>` : ""}</h4>
      ${d.note ? `<div style="color:var(--muted);font-size:12.5px;margin-top:4px">${escapeHtml(d.note)}</div>` : ""}
      <div class="figli">${figli.map(z => { const az = conta(z.id), gz = magStatoGruppo(az); const sub = mag.ubicazioni.filter(u => u.parent_id === z.id);
        return `<span class="figlio" onclick="${magPuoGestire() ? `magApriUbicazione('${z.id}')` : ""}"><i class="mag-sem ${az.length ? gz.colore : "verde"}" style="width:8px;height:8px"></i>${escapeHtml(z.nome)} <span style="color:var(--muted)">${az.length}</span>${sub.length ? ` <span style="color:var(--muted)">· ${sub.map(s => escapeHtml(s.nome)).join(", ")}</span>` : ""}</span>`; }).join("")}
        ${magPuoGestire() ? `<span class="figlio" onclick="magApriUbicazione(null,'${d.id}')" style="color:var(--primary)"><i class="fa-solid fa-plus"></i> zona / scaffale</span>` : ""}</div>
      ${arts.length ? `<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">${arts.slice(0, 12).map(a => `<span class="mag-tag" style="cursor:pointer" onclick="magApriDettaglio('${a.id}')"><i class="mag-sem ${mag.calc[a.id].stato}" style="width:7px;height:7px"></i>${escapeHtml(a.nome)}</span>`).join("")}${arts.length > 12 ? `<span class="mag-tag">+${arts.length - 12}</span>` : ""}</div>` : ""}
    </div>`;
  }).join("");
  box.innerHTML = html;
}
function magApriUbicazione(id, parentId){
  magUbiEdit = id ? mag.ubicazioni.find(u => u.id === id) : null;
  const u = magUbiEdit || {};
  document.getElementById("mag-ubi-titolo").textContent = magUbiEdit ? "Modifica ubicazione" : parentId ? "Nuova zona / scaffale" : "Nuovo deposito";
  document.getElementById("mag-ubi-tipo").value = u.tipo || (parentId ? "zona" : "deposito");
  document.getElementById("mag-ubi-parent").innerHTML = mag.ubicazioni.filter(x => x.id !== u.id && x.tipo !== "scaffale").map(x => `<option value="${x.id}">${escapeHtml(magUbiNome(x.id))}</option>`).join("");
  document.getElementById("mag-ubi-parent").value = u.parent_id || parentId || "";
  document.getElementById("mag-ubi-nome").value = u.nome || "";
  document.getElementById("mag-ubi-note").value = u.note || "";
  document.getElementById("mag-ubi-elimina").style.display = magUbiEdit ? "" : "none";
  document.getElementById("mag-ubi-err").style.display = "none";
  magUbiTipoCambiato();
  openModal("modal-mag-ubicazione");
}
function magUbiTipoCambiato(){ document.getElementById("mag-ubi-parent-box").style.display = document.getElementById("mag-ubi-tipo").value === "deposito" ? "none" : "block"; }
async function magSalvaUbicazione(){
  const err = document.getElementById("mag-ubi-err"); err.style.display = "none";
  const tipo = document.getElementById("mag-ubi-tipo").value;
  const row = { centro_id: currentCentro.id, tipo, nome: document.getElementById("mag-ubi-nome").value.trim(),
    parent_id: tipo === "deposito" ? null : (document.getElementById("mag-ubi-parent").value || null), note: document.getElementById("mag-ubi-note").value.trim() || null };
  if(!row.nome){ err.textContent = "Scrivi il nome."; err.style.display = "block"; return; }
  if(tipo !== "deposito" && !row.parent_id){ err.textContent = "Scegli dove si trova (dentro a quale deposito)."; err.style.display = "block"; return; }
  if(DEMO_MODE){ if(magUbiEdit) Object.assign(magUbiEdit, row); else mag.ubicazioni.push({ id: "du" + Math.random().toString(36).slice(2), ...row }); demoState.mag.ubicazioni = JSON.parse(JSON.stringify(mag.ubicazioni)); }
  else {
    const r = magUbiEdit ? await sb.from("mag_ubicazioni").update(row).eq("id", magUbiEdit.id).select().single() : await sb.from("mag_ubicazioni").insert(row).select().single();
    if(r.error){ err.textContent = "Non salvato: " + r.error.message; err.style.display = "block"; return; }
    const i = mag.ubicazioni.findIndex(x => x.id === r.data.id); if(i >= 0) mag.ubicazioni[i] = r.data; else mag.ubicazioni.push(r.data);
  }
  closeModal("modal-mag-ubicazione"); magRenderTutto(); showToast("Salvato.");
}
async function magEliminaUbicazione(){
  if(!magUbiEdit) return;
  if(!confirm(`Eliminare "${magUbiEdit.nome}" (e le zone al suo interno)? Gli articoli restano in magazzino, senza ubicazione.`)) return;
  if(DEMO_MODE){ const via = new Set([magUbiEdit.id, ...mag.ubicazioni.filter(u => u.parent_id === magUbiEdit.id).map(u => u.id)]); mag.ubicazioni = mag.ubicazioni.filter(u => !via.has(u.id)); demoState.mag.ubicazioni = JSON.parse(JSON.stringify(mag.ubicazioni)); }
  else { const { error } = await sb.from("mag_ubicazioni").delete().eq("id", magUbiEdit.id); if(error){ showToast("Non eliminato: " + error.message); return; } await loadMagazzino(); }
  closeModal("modal-mag-ubicazione"); magRenderTutto();
}

