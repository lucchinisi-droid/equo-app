/* ---- pannello del box ---- */
function boxApri(id){ boxPannelloId = id; boxRenderPannello(); openModal("modal-box"); }
function boxRenderPannello(){
  const b = boxList.find(x => x.id === boxPannelloId); if(!b){ closeModal("modal-box"); return; }
  const c = b.cavallo_id ? cavalliList.find(x => x.id === b.cavallo_id) : null;
  const gest = boxPuoGestire();
  const stB = boxStato(b);
  document.getElementById("box-pannello-titolo").innerHTML = `<span class="box-targa">BOX ${b.numero}</span> ${escapeHtml(stB.proprietario || b.zona || "")}`;
  const ass = stB.ass;
  const altriLiberiAss = cavalliList.filter(x => !boxList.some(bb => bb.assegnato_cavallo_id === x.id));
  const sezioneProprieta = !gest ? (ass ? `<p style="font-size:13px;color:var(--muted);margin:10px 0 0">Box di proprietà: ${escapeHtml(ass.nome)}${ass.proprietario ? " · " + escapeHtml(ass.proprietario) : ""}</p>` : "")
    : `<details class="bp-proprieta" ${ass ? "open" : ""}><summary data-tip="Un box di proprietà resta riservato a un cavallo e al suo proprietario, anche quando il cavallo è altrove">Box di proprietà</summary>
      ${ass ? `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:8px"><span style="font-size:13.5px">Riservato a <b>${escapeHtml(ass.nome)}</b>${ass.proprietario ? " · " + escapeHtml(ass.proprietario) : ""}</span>
          <button class="btn btn-outline btn-sm btn-variazione" onclick="boxRiserva('${b.id}', null)">Togli riserva</button></div>`
        : altriLiberiAss.length ? `<div style="display:flex;gap:8px;margin-top:8px"><select class="input" id="box-riserva-cavallo">${altriLiberiAss.map(x => `<option value="${x.id}">${escapeHtml(x.nome)}${x.proprietario ? " · " + escapeHtml(x.proprietario) : ""}</option>`).join("")}</select>
          <button class="btn btn-primary btn-conferma btn-sm" onclick="boxRiserva('${b.id}', document.getElementById('box-riserva-cavallo').value)">Riserva</button></div>`
        : `<p style="font-size:13px;color:var(--muted);margin:8px 0 0">Tutti i cavalli hanno già un box di proprietà.</p>`}</details>`;
  let h = "";
  if(c){
    const liberi = boxList.filter(x => !x.cavallo_id && !x.manutenzione && x.id !== b.id);
    const nota = boxNote[c.id];
    h = `<div class="bp-testa">${c.foto_url ? `<div class="box-foto" style="background-image:${cssUrl(c.foto_url)}"></div>` : `<div class="box-nopic" style="margin:0">NO<br>PICTURE</div>`}
        <div style="min-width:0"><div style="font-weight:800;font-size:18px;display:flex;align-items:center;gap:8px">${escapeHtml(c.nome)} ${pallinoHtml(c.id)}</div>
        <div style="color:var(--muted);font-size:12.5px">${escapeHtml([c.razza, c.proprietario ? "di " + c.proprietario : null].filter(Boolean).join(" · "))}</div>
        <div style="color:var(--muted);font-size:12px;margin-top:2px">${escapeHtml(pallinoCavallo(c.id).testo)}</div></div></div>
      ${stB.sotto ? `<div class="bp-avviso giallo">${escapeHtml(stB.tip.replace(/^Bordo giallo: /, ""))}</div>` : ""}
      <div class="bp-nota" onclick="boxApriNota('${c.id}')"><span class="box-nota ${nota ? "on" : ""}" style="position:static">N</span><span>${nota ? escapeHtml(nota) : '<span style="color:var(--muted)">Nessuna nota: tocca per scriverne una</span>'}</span></div>
      <div class="field"><label>Dov'è / come sta</label>
        <select class="input" onchange="boxAggiorna('${b.id}', { stato_cavallo: this.value })">${Object.entries(BOX_STATI).map(([k, s]) => `<option value="${k}" ${b.stato_cavallo === k ? "selected" : ""}>${s.nome}</option>`).join("")}</select></div>
      <label style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em">Oggi</label>
      <div class="bp-ic-griglia">${boxIconeAttive().map(k => { const d = BOX_ICONE[k], a = boxAttivitaDi(b.id, k);
        return `<button class="bp-ic ${a ? "on" : ""}" style="--ic-col:${d.col}" data-tip="${escapeHtml(d.tip)}" onclick="boxToggleIcona('${b.id}','${k}')"><span class="i">${iconHtml(d.icon)}</span><b>${d.nome}</b>
          <small>${a ? new Date(a.fatto_il).toLocaleTimeString("it-IT", { hour:"2-digit", minute:"2-digit" }) + (a.fatto_da_nome ? " · " + escapeHtml(a.fatto_da_nome.split(" ")[0]) : "") : "da fare"}</small></button>`; }).join("")}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-outline btn-sm" onclick="closeModal('modal-box');showModule('cavalli');openCavalloDetail('${c.id}')"><i class="fa-solid fa-horse-head"></i> Scheda cavallo</button>
        ${gest && liberi.length ? `<select class="input" style="width:auto;flex:1;min-width:140px" onchange="if(this.value)boxSposta('${b.id}', this.value)"><option value="">Sposta in…</option>${liberi.map(x => { const a2 = x.assegnato_cavallo_id ? cavalliList.find(y => y.id === x.assegnato_cavallo_id) : null; return `<option value="${x.id}">Box ${x.numero}${a2 && a2.id !== c.id ? " · riservato a " + escapeHtml(a2.nome) : x.nome ? " · " + escapeHtml(x.nome) : ""}</option>`; }).join("")}</select>` : ""}
        ${gest ? `<button class="btn btn-outline btn-sm" style="color:var(--danger)" onclick="boxLibera('${b.id}')"><i class="fa-solid fa-right-from-bracket"></i> Libera box</button>` : ""}
      </div>`;
  } else if(b.manutenzione){
    h = `<div class="bp-testa"><div class="box-manut-ic" style="margin:0">${iconHtml("fa-screwdriver-wrench")}</div><div><div style="font-weight:800;font-size:17px">In manutenzione</div>
        <div style="color:var(--muted);font-size:13px">${BOX_MOTIVI[b.manutenzione_motivo] || "Lavori"}${b.manutenzione_fino ? " · fino al " + formatDate(b.manutenzione_fino) : ""}</div>
        ${b.manutenzione_nota ? `<div style="font-size:13px;margin-top:4px">${escapeHtml(b.manutenzione_nota)}</div>` : ""}</div></div>
      ${gest ? `<button class="btn btn-primary btn-block" onclick="boxAggiorna('${b.id}', { manutenzione: false }).then(ok => ok && boxRenderPannello())"><i class="fa-solid fa-check"></i> Fine manutenzione: box libero</button>` : `<p style="color:var(--muted);font-size:13px">Può chiudere la manutenzione l'amministratore o un membro di livello 2-3.</p>`}`;
  } else {
    const senzaBox = cavalliList.filter(x => !boxList.some(bb => bb.cavallo_id === x.id))
      .sort((x, y) => (y.id === b.assegnato_cavallo_id) - (x.id === b.assegnato_cavallo_id));
    h = gest ? `<div class="field"><label>Aggiungi un cavallo</label>
        ${senzaBox.length ? `<div style="display:flex;gap:8px"><select class="input" id="box-scegli-cavallo">${senzaBox.map(x => `<option value="${x.id}">${escapeHtml(x.nome)}</option>`).join("")}</select>
        <button class="btn btn-primary" onclick="boxAssegna('${b.id}')">Aggiungi</button></div>` : `<p style="color:var(--muted);font-size:13px;margin:0">Tutti i cavalli hanno già un box. Aggiungi un cavallo da "Nuovo cavallo".</p>`}</div>
      <details style="margin:4px 0 12px"><summary style="cursor:pointer;font-weight:700;font-size:13.5px">Metti in manutenzione</summary>
        <div class="grid grid-2" style="margin-top:10px"><div class="field"><label>Motivo</label><select class="input" id="box-man-motivo">${Object.entries(BOX_MOTIVI).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></div>
        <div class="field"><label>Fino al (facoltativo)</label><input class="input" type="date" id="box-man-fino"></div></div>
        <div class="field"><label>Nota (facoltativa)</label><input class="input" id="box-man-nota" maxlength="300" placeholder="Es. cambio lettiera e disinfezione"></div>
        <button class="btn btn-variazione btn-sm" onclick="boxManutenzione('${b.id}')"><i class="fa-solid fa-screwdriver-wrench"></i> Metti in manutenzione</button></details>
      <details style="margin-bottom:12px"><summary style="cursor:pointer;font-weight:700;font-size:13.5px">Nome e zona del box</summary>
        <div class="grid grid-2" style="margin-top:10px"><div class="field"><label>Nome (facoltativo)</label><input class="input" id="box-nome" maxlength="60" value="${escapeHtml(b.nome || "")}" placeholder="Es. Box grande"></div>
        <div class="field"><label>Zona</label><input class="input" id="box-zona" maxlength="60" value="${escapeHtml(b.zona || "")}" placeholder="Es. Scuderia A"></div></div>
        <button class="btn btn-variazione btn-sm" onclick="boxAggiorna('${b.id}', { nome: document.getElementById('box-nome').value.trim() || null, zona: document.getElementById('box-zona').value.trim() || null }).then(ok => ok && boxRenderPannello())">Salva nome e zona</button></details>
      <button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="boxElimina('${b.id}')"><i class="fa-solid fa-trash"></i> Elimina box</button>`
      : `<p style="color:var(--muted);font-size:13.5px">Box libero. Può assegnare i cavalli l'amministratore o un membro di livello 2-3.</p>`;
  }
  document.getElementById("box-pannello-corpo").innerHTML = h + (b.manutenzione && !c ? "" : sezioneProprieta);
}
// Mette un cavallo in un box (da un altro box o da nessuno), con i controlli:
// box occupato → bloccato · box in manutenzione → bloccato · box riservato a un altro cavallo → conferma
async function boxMuovi(cavId, daId, aId){
  const a = boxList.find(x => x.id === aId), c = cavalliList.find(x => x.id === cavId);
  if(!a || !c || daId === aId) return false;
  if(a.cavallo_id){ const o = cavalliList.find(x => x.id === a.cavallo_id); showToast(`Box ${a.numero} occupato${o ? " da " + o.nome : ""}: spostamento non possibile.`); return false; }
  if(a.manutenzione){ showToast(`Box ${a.numero} in manutenzione: spostamento non possibile.`); return false; }
  if(a.assegnato_cavallo_id && a.assegnato_cavallo_id !== cavId){
    const ass = cavalliList.find(x => x.id === a.assegnato_cavallo_id);
    const chi = ass ? (ass.proprietario ? `di ${ass.proprietario} (cavallo ${ass.nome})` : `riservato a ${ass.nome}`) : "di proprietà";
    const ok = await boxConferma(`Box ${a.numero} privato`, `Questo box è ${chi}. Vuoi mettere comunque ${c.nome}?`);
    if(!ok) return false;
  }
  const da = daId ? boxList.find(x => x.id === daId) : null;
  const stato = da?.stato_cavallo || "in_box";
  if(da && !(await boxAggiorna(daId, { cavallo_id: null }))) return false;
  if(!(await boxAggiorna(aId, { cavallo_id: cavId, stato_cavallo: stato, manutenzione: false }))) return false;
  showToast(da ? `${c.nome} spostato nel box ${a.numero}.` : `${c.nome} nel box ${a.numero}.`);
  return true;
}
async function boxAssegna(id){
  const cav = document.getElementById("box-scegli-cavallo")?.value; if(!cav) return;
  if(await boxMuovi(cav, null, id)) boxRenderPannello();
}
async function boxLibera(id){
  if(!confirm("Liberare il box? Il cavallo resta nell'anagrafica.")) return;
  if(await boxAggiorna(id, { cavallo_id: null })){ showToast("Box liberato."); boxRenderPannello(); }
}
async function boxSposta(daId, aId){
  const b = boxList.find(x => x.id === daId); if(!b?.cavallo_id) return;
  if(await boxMuovi(b.cavallo_id, daId, aId)){ boxPannelloId = aId; boxRenderPannello(); } else boxRenderPannello();
}
// riserva il box a un cavallo (e al suo proprietario); null = toglie la riserva
async function boxRiserva(boxId, cavId){
  if(await boxAggiorna(boxId, { assegnato_cavallo_id: cavId || null })){
    showToast(cavId ? "Box riservato." : "Riserva tolta: il box è di nuovo libero per tutti."); boxRenderPannello();
  }
}
// pop-up di conferma (verde = conferma, contorno = annulla)
function boxConferma(titolo, testo){
  return new Promise(resolve => {
    document.getElementById("box-conf-titolo").textContent = titolo;
    document.getElementById("box-conf-testo").textContent = testo;
    const fine = v => { closeModal("modal-box-conferma"); resolve(v); };
    document.getElementById("box-conf-si").onclick = () => fine(true);
    document.getElementById("box-conf-no").onclick = () => fine(false);
    openModal("modal-box-conferma");
  });
}
// nota "N" del cavallo (la segue in ogni box)
let boxNotaCavalloId = null;
function boxApriNota(cavId){
  const c = cavalliList.find(x => x.id === cavId); if(!c) return;
  boxNotaCavalloId = cavId;
  document.getElementById("box-nota-titolo").textContent = "Nota su " + c.nome;
  document.getElementById("box-nota-testo").value = boxNote[cavId] || "";
  document.getElementById("box-nota-elimina").style.display = boxNote[cavId] ? "" : "none";
  openModal("modal-box-nota");
  setTimeout(() => document.getElementById("box-nota-testo").focus(), 60);
}
async function boxSalvaNota(cancella){
  const id = boxNotaCavalloId; if(!id) return;
  const testo = cancella ? "" : document.getElementById("box-nota-testo").value.trim();
  if(DEMO_MODE){ const c = demoState.cavalli.find(x => x.id === id); if(c) c.nota_box = testo || null; }
  else { const { error } = await sb.rpc("box_nota_cavallo", { p_cavallo: id, p_nota: testo }); if(error){ showToast(error.message); return; } }
  if(testo) boxNote[id] = testo; else delete boxNote[id];
  closeModal("modal-box-nota"); renderBox(); if(boxPannelloId) boxRenderPannello();
  showToast(testo ? "Nota salvata: segue il cavallo in ogni box." : "Nota eliminata.");
}

