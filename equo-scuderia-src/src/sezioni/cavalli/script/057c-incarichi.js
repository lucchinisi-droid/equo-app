/* =====================================================================
   INCARICHI DEL MANISCALCO (9/11/2026 · SQL 50) — script normale: funzioni globali.
   Cavalli › Maniscalchi: elenco cavallo → maniscalco, ricerca e filtri, selezione multipla,
   assegna / sostituto a tempo / revoca, con riepilogo prima di confermare. Lo stesso riquadro è nella scheda del cavallo.
   Regole (nel database): 1 titolare + al massimo 1 sostituto con data di fine; il proprietario con l'app conferma;
   il cambio vale subito o da una data; la revoca chiude l'incarico ma non cancella lavori, storico o crediti.
   ===================================================================== */
let mncDati = null, mncSel = new Set(), mncFiltro = { q: "", f: "" }, mncForm = null, mncErrore = "";
const MNC_APERTI = ["attivo", "da_confermare_proprietario", "programmato"];

async function caricaIncarichi(){
  mncErrore = "";
  if(DEMO_MODE){
    if(!demoState.incarichi){
      const pro = (typeof professionistiList !== "undefined" && professionistiList.length ? professionistiList : [{ cliente_id: "demo-pro-1", nome: "Marco Ferri", stato: "attivo" }]);
      demoState.mncPro = [...pro.map(p => ({ cliente_id: p.cliente_id, nome: p.nome, stato: p.stato || "attivo", professione: "maniscalco" })),
        { cliente_id: "demo-pro-2", nome: "Luca Bianchi", stato: "attivo", professione: "maniscalco" }];
      demoState.incarichi = (demoState.cavalli || []).map((c, i) => ({ id: "inc" + i, cav: c.id, cliente_id: i === 0 ? demoState.mncPro[0].cliente_id : null }))
        .filter(x => x.cliente_id).map(x => ({ id: x.id, cav: x.cav, cliente_id: x.cliente_id, ruolo: "titolare", stato: "attivo", dal: isoLoc(new Date()), al: null }));
    }
    const nomePro = id => (demoState.mncPro.find(p => p.cliente_id === id) || {}).nome || "Maniscalco";
    mncDati = { puo: true, pro: demoState.mncPro, cavalli: (cavalliList || []).map(c => ({ id: c.id, nome: c.nome, foto_url: c.foto_url, proprietario: c.proprietario,
      chiede_conferma: false, incarichi: demoState.incarichi.filter(a => a.cav === c.id && MNC_APERTI.includes(a.stato)).map(a => ({ ...a, nome: nomePro(a.cliente_id), collegato: true })) })) };
    return;
  }
  const { data, error } = await sb.rpc("scuderia_incarichi", { p_centro: currentCentro.id });
  if(error || !data || data.errore){
    mncDati = { puo: false, pro: [], cavalli: [] };
    mncErrore = /scuderia_incarichi|schema cache|function/.test(error?.message || "") ? "Manca un aggiornamento del database (SQL 50): avvisa l'assistenza." : (data?.errore || error?.message || "Non riesco a caricare gli incarichi.");
    return;
  }
  mncDati = data;
}
const mncTitolare = c => c.incarichi.find(a => a.ruolo === "titolare" && a.stato === "attivo") || null;
const mncSostituto = c => c.incarichi.find(a => a.ruolo === "sostituto" && a.stato === "attivo") || null;
const mncInAttesa = c => c.incarichi.filter(a => a.stato !== "attivo");
const mncGiorno = d => d ? formatDate(d) : "";

/* ---- vista Cavalli › Maniscalchi ---- */
async function apriIncarichi(){
  document.getElementById("cavalli-list-view").style.display = "none";
  document.getElementById("cavalli-detail-view").style.display = "none";
  document.getElementById("cavalli-incarichi-view").style.display = "block";
  mncSel = new Set();
  document.getElementById("inc-corpo").innerHTML = `<div style="color:var(--muted);padding:20px 0">Caricamento…</div>`;
  await caricaIncarichi(); renderIncarichi();
}
function chiudiIncarichi(){
  document.getElementById("cavalli-incarichi-view").style.display = "none";
  document.getElementById("cavalli-list-view").style.display = "block";
  if(typeof renderCavalliList === "function") renderCavalliList();
}
function mncFiltra(){
  mncFiltro.q = (document.getElementById("inc-cerca")?.value || "").trim().toLowerCase();
  mncFiltro.f = document.getElementById("inc-filtro")?.value || "";
  renderIncarichi();
}
function mncVisibili(){
  const q = mncFiltro.q, f = mncFiltro.f;
  return (mncDati?.cavalli || []).filter(c => {
    if(q){
      const testo = [c.nome, c.proprietario, ...c.incarichi.map(a => a.nome)].filter(Boolean).join(" ").toLowerCase();
      if(!testo.includes(q)) return false;
    }
    if(f === "senza") return !mncTitolare(c);
    if(f === "attesa") return mncInAttesa(c).length > 0 || c.incarichi.some(a => a.stato === "attivo" && a.al);
    if(f.startsWith("pro:")) return c.incarichi.some(a => a.cliente_id === f.slice(4));
    return true;
  });
}
function mncCellaPro(a, cosa){
  if(!a) return `<span style="color:var(--muted)">${cosa === "titolare" ? "Nessuno" : "—"}</span>`;
  return `<div style="font-weight:700">${escapeHtml(a.nome)}</div><div style="font-size:12px;color:var(--muted)">${
    a.al ? (cosa === "sostituto" ? "fino al " : "termina il ") + mncGiorno(a.al) : "dal " + mncGiorno(a.dal)}${a.collegato === false ? " · non ha ancora accettato il collegamento" : ""}</div>`;
}
function mncAttesaHtml(c){
  const righe = mncInAttesa(c).map(a => `<div class="inc-attesa">${a.stato === "da_confermare_proprietario" ? '<i class="fa-solid fa-hourglass-half"></i>' : '<i class="fa-regular fa-calendar"></i>'}
      ${a.ruolo === "sostituto" ? "Sostituto " : "→ "}<b>${escapeHtml(a.nome)}</b> ${a.stato === "da_confermare_proprietario" ? "· in attesa del proprietario" : "dal " + mncGiorno(a.dal)}${a.al && a.ruolo === "sostituto" ? " al " + mncGiorno(a.al) : ""}
      ${mncDati.puo ? `<button class="inc-link" onclick="mncAnnulla('${a.id}')">annulla</button>` : ""}</div>`);
  if(c.ultimo_rifiuto && !mncInAttesa(c).length) righe.push(`<div class="inc-attesa rifiuto"><i class="fa-solid fa-xmark"></i> ${escapeHtml(c.ultimo_rifiuto.nome || "")}: rifiutato dal proprietario</div>`);
  return righe.join("");
}
function renderIncarichi(){
  const el = document.getElementById("inc-corpo"); if(!el || !mncDati) return;
  const fil = document.getElementById("inc-filtro");
  if(fil){
    const v = mncFiltro.f;
    fil.innerHTML = `<option value="">Tutti i cavalli</option><option value="senza">Senza maniscalco</option><option value="attesa">Cambi in attesa o programmati</option>`
      + (mncDati.pro.length ? `<optgroup label="Seguiti da">${mncDati.pro.map(p => `<option value="pro:${p.cliente_id}">${escapeHtml(p.nome)}</option>`).join("")}</optgroup>` : "");
    fil.value = v;
  }
  if(mncErrore){ el.innerHTML = `<div class="bp-avviso giallo">${escapeHtml(mncErrore)}</div>`; return; }
  const tutti = mncDati.cavalli, lista = mncVisibili(), puo = mncDati.puo;
  const senza = tutti.filter(c => !mncTitolare(c)).length;
  document.getElementById("inc-conta").textContent = `${tutti.length} cavalli · ${tutti.length - senza} con maniscalco · ${senza} senza`;
  mncSel = new Set([...mncSel].filter(id => tutti.some(c => c.id === id)));
  const barra = document.getElementById("inc-barra");
  barra.style.display = puo && mncSel.size ? "flex" : "none";
  barra.innerHTML = `<b>${mncSel.size} selezionat${mncSel.size === 1 ? "o" : "i"}</b>
    <button class="btn btn-primary btn-sm" onclick="mncApriForm('assegna')"><i class="fa-solid fa-user-check"></i> Assegna / cambia</button>
    <button class="btn btn-outline btn-sm" onclick="mncApriForm('sostituto')"><i class="fa-solid fa-user-clock"></i> Sostituto a tempo</button>
    <button class="btn btn-outline btn-sm" style="color:var(--danger)" onclick="mncApriForm('revoca')"><i class="fa-solid fa-user-xmark"></i> Revoca</button>
    <button class="btn btn-ghost btn-sm" onclick="mncSel.clear();renderIncarichi()">Deseleziona</button>`;
  if(!mncDati.pro.length){
    el.innerHTML = `<div class="empty-state"><i class="fa-solid fa-user-plus"></i><div>Nessun maniscalco collegato al centro.<br>Collegalo da <a href="#" onclick="event.preventDefault();showModule('professionisti')">Professionisti</a>, poi assegnagli i cavalli da qui.</div></div>`;
    return;
  }
  if(!lista.length){ el.innerHTML = `<div class="empty-state"><i class="fa-solid fa-magnifying-glass"></i><div>Nessun cavallo con questi filtri.</div></div>`; return; }
  const tuttiSel = lista.every(c => mncSel.has(c.id));
  el.innerHTML = `<div class="table-wrap"><table class="inc-tabella">
    <thead><tr>${puo ? `<th style="width:36px"><input type="checkbox" aria-label="Seleziona tutti i cavalli in elenco" ${tuttiSel ? "checked" : ""} onchange="mncSelTutti(this.checked)"></th>` : ""}
      <th>Cavallo</th><th>Maniscalco</th><th>Sostituto</th><th>Cambi in corso</th><th></th></tr></thead>
    <tbody>${lista.map(c => { const t = mncTitolare(c), s = mncSostituto(c);
      return `<tr class="${mncSel.has(c.id) ? "sel" : ""}">
        ${puo ? `<td><input type="checkbox" aria-label="Seleziona ${escapeHtml(c.nome)}" ${mncSel.has(c.id) ? "checked" : ""} onchange="mncSeleziona('${c.id}', this.checked)"></td>` : ""}
        <td><div class="inc-cav">${c.foto_url ? `<span class="f" style="background-image:${cssUrl(c.foto_url)}"></span>` : `<span class="f nf">${escapeHtml((c.nome || "?").charAt(0).toUpperCase())}</span>`}
          <div style="min-width:0"><div style="font-weight:800">${escapeHtml(c.nome)}</div><div style="font-size:12px;color:var(--muted)">${escapeHtml(c.proprietario || "")}${c.chiede_conferma ? `${c.proprietario ? " · " : ""}<span data-tip="Il proprietario ha l'app: ogni cambio gli chiede conferma">conferma il proprietario</span>` : ""}</div></div></div></td>
        <td>${mncCellaPro(t, "titolare")}</td>
        <td>${mncCellaPro(s, "sostituto")}</td>
        <td>${mncAttesaHtml(c) || '<span style="color:var(--muted)">—</span>'}</td>
        <td style="text-align:right;white-space:nowrap">
          ${puo ? `<button class="btn btn-ghost btn-sm" onclick="mncApriForm('assegna', ['${c.id}'])">${t ? "Cambia" : "Assegna"}</button>` : ""}
          ${puo && (t || s) ? `<button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="mncApriForm('revoca', ['${c.id}'])">Revoca</button>` : ""}
          <button class="btn btn-ghost btn-sm" data-tip="Storico degli incarichi" aria-label="Storico degli incarichi di ${escapeHtml(c.nome)}" onclick="mncStorico('${c.id}')"><i class="fa-solid fa-clock-rotate-left"></i></button></td></tr>`; }).join("")}</tbody></table></div>`;
}
function mncSeleziona(id, on){ if(on) mncSel.add(id); else mncSel.delete(id); renderIncarichi(); }
function mncSelTutti(on){ mncVisibili().forEach(c => on ? mncSel.add(c.id) : mncSel.delete(c.id)); renderIncarichi(); }

/* ---- finestra: assegna / sostituto / revoca, con riepilogo ---- */
async function mncApriForm(azione, cavalli){
  if(!mncDati) await caricaIncarichi();
  if(!mncDati.puo){ showToast("Solo l'amministratore o un membro di livello 2 o 3 può assegnare i maniscalchi."); return; }
  const ids = cavalli || [...mncSel];
  if(!ids.length){ showToast("Seleziona almeno un cavallo."); return; }
  if(azione !== "revoca" && !mncDati.pro.length){ showToast("Prima collega un maniscalco da Professionisti."); return; }
  mncForm = { azione, ids };
  const oggi = isoLoc(new Date()), tra7 = isoLoc(new Date(Date.now() + 7 * 864e5));
  const titoli = { assegna: "Assegna o cambia il maniscalco", sostituto: "Maniscalco sostituto a tempo", revoca: "Revoca il maniscalco" };
  document.getElementById("incarico-titolo").textContent = titoli[azione];
  const proSel = `<div class="field"><label for="inc-f-pro">Maniscalco</label><select class="input" id="inc-f-pro" onchange="mncRiepilogo()">
      <option value="">Scegli…</option>${mncDati.pro.map(p => `<option value="${p.cliente_id}">${escapeHtml(p.nome)}${p.stato !== "attivo" ? " (collegamento in attesa)" : ""}</option>`).join("")}</select></div>`;
  let h = "";
  if(azione === "assegna"){
    h = proSel + `<fieldset class="inc-quando"><legend>Da quando</legend>
        <label><input type="radio" name="inc-f-quando" value="subito" checked onchange="mncRiepilogo()"> Da subito</label>
        <label><input type="radio" name="inc-f-quando" value="data" onchange="mncRiepilogo()"> Dal giorno <input class="input" type="date" id="inc-f-dal" min="${oggi}" value="${oggi}" onchange="mncRiepilogo()" aria-label="Data di inizio"></label></fieldset>`;
  } else if(azione === "sostituto"){
    h = proSel + `<div class="grid grid-2"><div class="field"><label for="inc-f-dal">Dal</label><input class="input" type="date" id="inc-f-dal" min="${oggi}" value="${oggi}" onchange="mncRiepilogo()"></div>
        <div class="field"><label for="inc-f-al">Fino al (compreso)</label><input class="input" type="date" id="inc-f-al" min="${oggi}" value="${tra7}" onchange="mncRiepilogo()"></div></div>
        <p class="inc-nota">Finito il periodo torna da solo il maniscalco titolare.</p>`;
  } else {
    h = `<fieldset class="inc-quando"><legend>Da quando</legend>
        <label><input type="radio" name="inc-f-quando" value="subito" checked onchange="mncRiepilogo()"> Da subito</label>
        <label><input type="radio" name="inc-f-quando" value="data" onchange="mncRiepilogo()"> Dal giorno <input class="input" type="date" id="inc-f-dal" min="${oggi}" value="${oggi}" onchange="mncRiepilogo()" aria-label="Data della revoca"></label></fieldset>
      <div class="field"><label for="inc-f-motivo">Motivo (facoltativo, lo legge il maniscalco)</label><input class="input" id="inc-f-motivo" maxlength="200" placeholder="Es. cambio di organizzazione"></div>
      <p class="inc-nota">I lavori fatti restano nel suo storico e i crediti aperti non cambiano. Gli appuntamenti già fissati restano a lui: decide lui se confermarli o annullarli.</p>`;
  }
  document.getElementById("incarico-corpo").innerHTML = h + `<div class="inc-riepilogo" id="inc-riepilogo"></div><div class="auth-error" id="inc-f-errore"></div>
    <button class="btn btn-primary btn-block btn-conferma" id="inc-f-ok" onclick="mncConferma()">Conferma</button>`;
  mncRiepilogo();
  openModal("modal-incarico");
}
function mncValoriForm(){
  const v = { cliente: document.getElementById("inc-f-pro")?.value || null, dal: null, al: null, motivo: document.getElementById("inc-f-motivo")?.value.trim() || null };
  const quando = document.querySelector('input[name="inc-f-quando"]:checked')?.value;
  if(mncForm.azione === "sostituto" || quando === "data") v.dal = document.getElementById("inc-f-dal")?.value || null;
  if(mncForm.azione === "sostituto") v.al = document.getElementById("inc-f-al")?.value || null;
  return v;
}
function mncRiepilogo(){
  const box = document.getElementById("inc-riepilogo"); if(!box || !mncForm) return;
  const v = mncValoriForm(), oggi = isoLoc(new Date());
  const pro = mncDati.pro.find(p => p.cliente_id === v.cliente);
  const quando = v.dal && v.dal > oggi ? " dal " + mncGiorno(v.dal) : " da subito";
  const cav = mncForm.ids.map(id => mncDati.cavalli.find(c => c.id === id)).filter(Boolean);
  const righe = cav.slice(0, 12).map(c => {
    const t = mncTitolare(c), s = mncSostituto(c);
    if(mncForm.azione === "revoca"){
      const chi = [t?.nome, s ? s.nome + " (sostituto)" : null].filter(Boolean).join(", ");
      return `<li><b>${escapeHtml(c.nome)}</b>: ${chi ? "via " + escapeHtml(chi) : '<span style="color:var(--muted)">nessun maniscalco, nessun cambio</span>'}</li>`;
    }
    if(!pro) return `<li><b>${escapeHtml(c.nome)}</b>: ${t ? escapeHtml(t.nome) : "nessuno"} → …</li>`;
    if(mncForm.azione === "assegna" && t && t.cliente_id === pro.cliente_id) return `<li><b>${escapeHtml(c.nome)}</b>: è già di ${escapeHtml(pro.nome)}</li>`;
    const da = mncForm.azione === "sostituto" ? (s ? escapeHtml(s.nome) + " (sostituto)" : (t ? "titolare " + escapeHtml(t.nome) : "nessuno")) : (t ? escapeHtml(t.nome) : "nessuno");
    return `<li><b>${escapeHtml(c.nome)}</b>: ${da} → <b>${escapeHtml(pro.nome)}</b>${c.chiede_conferma ? ' <span class="badge-pill badge-yellow">chiede conferma al proprietario</span>' : ""}</li>`;
  });
  if(cav.length > 12) righe.push(`<li style="color:var(--muted)">… e altri ${cav.length - 12}</li>`);
  const testa = mncForm.azione === "revoca" ? `Revoca${quando}` : mncForm.azione === "sostituto"
    ? `Sostituto${v.dal ? " dal " + mncGiorno(v.dal) : ""}${v.al ? " al " + mncGiorno(v.al) : ""}` : `Nuovo maniscalco${quando}`;
  box.innerHTML = `<div class="inc-riep-testa">${testa} · ${cav.length} cavall${cav.length === 1 ? "o" : "i"}</div><ul>${righe.join("")}</ul>`;
}
async function mncConferma(){
  const err = document.getElementById("inc-f-errore"), btn = document.getElementById("inc-f-ok"); err.style.display = "none";
  const v = mncValoriForm(), oggi = isoLoc(new Date());
  const errore = t => { err.textContent = t; err.style.display = "block"; };
  if(mncForm.azione !== "revoca" && !v.cliente) return errore("Scegli il maniscalco.");
  if(v.dal && v.dal < oggi) return errore("La data non può essere nel passato.");
  if(mncForm.azione === "sostituto" && (!v.al || v.al < (v.dal || oggi))) return errore("Indica fino a quando, dopo la data di inizio.");
  btn.disabled = true;
  try{
    let esito;
    if(DEMO_MODE) esito = mncDemoAzione(mncForm.azione, mncForm.ids, v);
    else {
      const { data, error } = await sb.rpc("scuderia_incarico_azione", { p_centro: currentCentro.id, p_azione: mncForm.azione, p_cavalli: mncForm.ids,
        p_cliente: v.cliente, p_dal: v.dal, p_al: v.al, p_motivo: v.motivo, p_incarico: null });
      if(error) throw error;
      esito = data;
    }
    if(!esito?.ok) return errore(esito?.errore || "Operazione non riuscita.");
    closeModal("modal-incarico");
    showToast(mncTestoEsito(esito));
    mncSel.clear();
    await caricaIncarichi(); renderIncarichi(); mncRenderScheda();
  }catch(e){ errore(e.message || "Operazione non riuscita."); }
  finally{ btn.disabled = false; }
}
function mncTestoEsito(e){
  const parti = [], n = k => Number(e[k]) || 0;
  if(n("attivo")) parti.push(`${n("attivo")} assegnat${n("attivo") === 1 ? "o" : "i"}`);
  if(n("programmato")) parti.push(`${n("programmato")} dalla data scelta`);
  if(n("da_confermare")) parti.push(`${n("da_confermare")} in attesa del proprietario`);
  if(n("revocati")) parti.push(`${n("revocati")} revocat${n("revocati") === 1 ? "o" : "i"}`);
  if(n("revoca_programmata")) parti.push(`${n("revoca_programmata")} revoca programmata`);
  if(n("gia")) parti.push(`${n("gia")} già a posto`);
  if(n("nessuno")) parti.push(`${n("nessuno")} senza maniscalco da revocare`);
  if(n("errore") || n("saltati")) parti.push(`${n("errore") + n("saltati")} non modificat${n("errore") + n("saltati") === 1 ? "o" : "i"}`);
  return parti.length ? "Fatto: " + parti.join(" · ") + "." : "Fatto.";
}
async function mncAnnulla(id){
  if(!confirm("Annullare questa richiesta di cambio?")) return;
  if(DEMO_MODE){ const a = demoState.incarichi.find(x => x.id === id); if(a) a.stato = "chiuso"; }
  else {
    const { data, error } = await sb.rpc("scuderia_incarico_azione", { p_centro: currentCentro.id, p_azione: "annulla", p_cavalli: [], p_cliente: null, p_dal: null, p_al: null, p_motivo: null, p_incarico: id });
    if(error || !data?.ok){ showToast(data?.errore || error?.message || "Non riuscito."); return; }
  }
  showToast("Richiesta annullata.");
  await caricaIncarichi(); renderIncarichi(); mncRenderScheda();
}
// demo: stessa logica, in memoria
function mncDemoAzione(azione, ids, v){
  const oggi = isoLoc(new Date()), out = { ok: true };
  const conta = k => { out[k] = (out[k] || 0) + 1; };
  ids.forEach(cav => {
    const aperti = demoState.incarichi.filter(a => a.cav === cav && MNC_APERTI.includes(a.stato));
    if(azione === "revoca"){ if(!aperti.length) return conta("nessuno"); aperti.forEach(a => { a.stato = "chiuso"; }); return conta("revocati"); }
    const ruolo = azione === "sostituto" ? "sostituto" : "titolare";
    if(aperti.some(a => a.ruolo === ruolo && a.cliente_id === v.cliente && a.stato === "attivo")) return conta("gia");
    const futuro = v.dal && v.dal > oggi;
    if(!futuro) aperti.filter(a => a.ruolo === ruolo).forEach(a => { a.stato = "chiuso"; });
    demoState.incarichi.push({ id: "inc" + Date.now() + cav, cav, cliente_id: v.cliente, ruolo, stato: futuro ? "programmato" : "attivo", dal: v.dal || oggi, al: v.al });
    conta(futuro ? "programmato" : "attivo");
  });
  return out;
}

/* ---- storico di un cavallo ---- */
async function mncStorico(cavId){
  const c = mncDati?.cavalli.find(x => x.id === cavId) || (cavalliList || []).find(x => x.id === cavId);
  document.getElementById("incarico-titolo").textContent = "Storico maniscalchi · " + (c?.nome || "");
  document.getElementById("incarico-corpo").innerHTML = `<div style="color:var(--muted)">Caricamento…</div>`;
  openModal("modal-incarico");
  let righe = [];
  if(DEMO_MODE) righe = demoState.incarichi.filter(a => a.cav === cavId).map(a => ({ ...a, nome: (demoState.mncPro.find(p => p.cliente_id === a.cliente_id) || {}).nome }));
  else { const { data } = await sb.rpc("scuderia_incarichi_storico", { p_cav: cavId }); righe = data || []; }
  const STATO = { attivo: ["In corso", "badge-green"], programmato: ["Programmato", "badge-blue"], da_confermare_proprietario: ["In attesa del proprietario", "badge-yellow"],
    rifiutato: ["Rifiutato dal proprietario", "badge-red"], chiuso: ["Concluso", "badge-gray"] };
  document.getElementById("incarico-corpo").innerHTML = righe.length ? `<div class="inc-storico">${righe.map(a => { const [t, cls] = STATO[a.stato] || [a.stato, "badge-gray"];
    return `<div class="inc-st-riga"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>${escapeHtml(a.nome || "Maniscalco")}${a.ruolo === "sostituto" ? " · sostituto" : ""}</b><span class="badge-pill ${cls}">${t}</span></div>
      <div style="font-size:12.5px;color:var(--muted)">dal ${mncGiorno(a.dal)}${a.al ? " al " + mncGiorno(a.al) : ""}${a.motivo ? " · " + escapeHtml(a.motivo) : ""}${a.da ? " · " + escapeHtml(a.da) : ""}</div></div>`; }).join("")}</div>
    <p class="inc-nota">I lavori di ogni maniscalco restano nel suo storico anche dopo la fine dell'incarico.</p>`
    : `<p style="color:var(--muted)">Nessun maniscalco assegnato finora.</p>`;
}

/* ---- riquadro nella scheda del cavallo ---- */
function mncRenderScheda(){
  const box = document.getElementById("cav-incarico-box"); if(!box) return;
  const id = typeof currentCavalloId !== "undefined" ? currentCavalloId : null;
  const c = id && mncDati ? mncDati.cavalli.find(x => x.id === id) : null;
  if(!id || mncErrore || !c){ box.innerHTML = ""; return; }
  const t = mncTitolare(c), s = mncSostituto(c), puo = mncDati.puo;
  box.innerHTML = `<div class="card" style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px">
      <h3 style="margin:0">Maniscalco</h3>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${puo && mncDati.pro.length ? `<button class="btn btn-outline btn-sm" onclick="mncApriForm('assegna', ['${c.id}'])">${t ? "Cambia" : "Assegna"}</button>
          <button class="btn btn-outline btn-sm" onclick="mncApriForm('sostituto', ['${c.id}'])">Sostituto</button>` : ""}
        ${puo && (t || s) ? `<button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="mncApriForm('revoca', ['${c.id}'])">Revoca</button>` : ""}
        <button class="btn btn-ghost btn-sm" onclick="mncStorico('${c.id}')"><i class="fa-solid fa-clock-rotate-left"></i> Storico</button></div></div>
    <div class="grid grid-2"><div><div class="inc-etichetta">Titolare</div>${mncCellaPro(t, "titolare")}</div><div><div class="inc-etichetta">Sostituto</div>${mncCellaPro(s, "sostituto")}</div></div>
    ${mncAttesaHtml(c) ? `<div style="margin-top:10px">${mncAttesaHtml(c)}</div>` : ""}
    ${!mncDati.pro.length ? `<p class="inc-nota">Nessun maniscalco collegato: collegalo da Professionisti.</p>` : ""}</div>`;
}
// la scheda del cavallo mostra il riquadro appena si apre (chiamata da openCavalloDetail)
function mncAlCavallo(){
  const box = document.getElementById("cav-incarico-box"); if(box) box.innerHTML = "";
  caricaIncarichi().then(mncRenderScheda);
}
