// Equo App · maniscalco e veterinario · LA SCHEDA DI UN CAVALLO AL COLLEGA (11/11/2026, Fase 4, SQL 67, mockup 5-6)
// Dalla scheda del cavallo: «Manda al maniscalco» (veterinario) o «Manda al veterinario» (maniscalco), nella chat tra colleghi.
//  · in cima i colleghi che seguono già lo stesso proprietario, scuderia o cavallo; oppure un altro con il suo codice;
//  · indicazioni scritte; documenti propri del cavallo solo se spuntati (il collega li vede per consulto, resta nello storico);
//  · «Avvisa il proprietario»: messaggio nella chat con il proprietario (o la scuderia collegata), acceso di serie.
// Chi la riceve: «Aggiungi ai miei cavalli» (stesso cliente se c'è, altrimenti nuovo) o «Ce l'ho già: collega».
// Le indicazioni ricevute restano nella scheda del cavallo, riquadro «Colleghi».

const ccEsc = s => escapeHtml(s == null ? "" : String(s));
const CC = { cv: null, riga: null, colleghi: [], scelto: null, altro: false, docs: [], docSel: new Set(), avvisa: true, puoAvvisare: false, invio: false, msg: null };
const ccVerso = () => (typeof eVeterinario === "function" && eVeterinario()) ? "maniscalco" : "veterinario";
const ccPrefisso = () => ccVerso() === "maniscalco" ? "EQUOPRO" : "EQUOMED";
const ccNomeNorm = s => String(s || "").toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]/g, "");
const ccData = iso => iso ? new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }) : "";

/* ---------------- dati (non dentro DB: questo file si carica prima di core/dati) ---------------- */
const ccDB = {
  async colleghiPerCavallo(riga){
    if(DEMO_MODE) return (demoState.colleghi || []).map(c => ({ ...c, id: c.altro_id, segue: !!c.segue }));
    const { data, error } = await sb.rpc("pro_colleghi_per_cavallo", { p_riga: riga });
    if(error){ console.warn("pro_colleghi_per_cavallo:", error.message); return (await DB.listColleghi()).map(c => ({ ...c, id: c.altro_id, segue: false })); }
    return data || [];
  },
  async mandaCavalloCollega({ conv, riga, indicazioni, documenti, avvisa }){
    if(DEMO_MODE){
      const cv = (demoState.cavalliClientiMascalcia || []).find(x => x.id === riga); if(!cv) return { ok: false, errore: "Cavallo non trovato." };
      const cm = (demoState.clientiMascalcia || []).find(x => x.id === cv.cliente_mascalcia_id) || {};
      const col = (demoState.colleghi || []).find(c => c.conversazione_id === conv) || {};
      const docs = (demoState.documenti || []).filter(d => (documenti || []).includes(d.id)).map(d => ({ id: d.id, titolo: d.titolo, mime: d.mime }));
      const ind = String(indicazioni || "").trim() || null;
      const dati = { riga: cv.id, nome: cv.nome, microchip: cv.microchip || null, codice_equo: cv.codice_equo || null, horse_id: cv.horse_id || null, razza: cv.razza || null,
        cliente: cm.nome, tipo_cliente: cm.tipo_cliente || "proprietario", cliente_user_id: cm.cliente_user_id || null, centro_id: cm.centro_id || null,
        professione: eVeterinario() ? "veterinario" : "maniscalco", indicazioni: ind, documenti: docs };
      const id = "mo-" + (++demoIdCounter);
      demoState.messaggiProprietari.push({ id, conversazione_id: conv, mittente_id: "demo-user", tipo: "cavallo", testo: "🐴 " + cv.nome + (ind ? " · " + ind.slice(0, 120) : ""), dati, letto: true, created_at: new Date().toISOString() });
      let avvisato = false;
      if(avvisa !== false && (cm.cliente_user_id || (cm.centro_id && cm.collegamento_stato === "attivo"))){
        await DB.insertMessaggioMascalcia({ cliente_mascalcia_id: cm.id, tipo: "testo", testo: "ℹ️ Ho condiviso la scheda di " + cv.nome + " con " + (col.nome || "un collega") + " (" + (col.ruolo || "professionista") + ")" + (ind ? ", con le mie indicazioni" : "") + (docs.length ? " e " + docs.length + (docs.length === 1 ? " documento" : " documenti") : "") + ", per seguirlo insieme." });
        avvisato = true;
      }
      return { ok: true, messaggio: id, avvisato, documenti: docs.length, collega: col.nome };
    }
    const { data, error } = await sb.rpc("pro_manda_cavallo_collega", { p_conv: conv, p_riga: riga, p_indicazioni: indicazioni || null, p_documenti: documenti && documenti.length ? documenti : null, p_avvisa: avvisa !== false });
    if(error) return { ok: false, errore: /pro_manda_cavallo_collega|schema cache/.test(error.message) ? "Manca un aggiornamento del database (SQL 67)." : error.message };
    return data || { ok: false, errore: "Non riuscito" };
  },
  async riceviCavalloCollega(msg, riga){
    if(DEMO_MODE){
      const m = demoState.messaggiProprietari.find(x => x.id === msg && x.tipo === "cavallo"); if(!m) return { ok: false, errore: "Scheda non trovata." };
      const d = m.dati || {}, miei = demoState.cavalliClientiMascalcia || [];
      let cv = riga ? miei.find(x => x.id === riga) : miei.find(x => !x.archiviato_il && ((d.horse_id && x.horse_id === d.horse_id) || (d.microchip && String(x.microchip || "").toUpperCase() === String(d.microchip).toUpperCase())));
      let nuovoCli = false, nuovoCav = false;
      if(!cv){
        let c = (demoState.clientiMascalcia || []).find(x => !x.archiviato_il && ((d.cliente_user_id && x.cliente_user_id === d.cliente_user_id) || (d.centro_id && x.centro_id === d.centro_id)))
          || (demoState.clientiMascalcia || []).find(x => !x.archiviato_il && String(x.nome || "").trim().toLowerCase() === String(d.cliente || "").trim().toLowerCase());
        if(!c){ c = { id: "cm-" + (++demoIdCounter), nome: d.cliente || "Cliente", tipo_cliente: d.tipo_cliente === "struttura" ? "struttura" : "proprietario", codice_invito: "EQUODEMO" + demoIdCounter, created_at: new Date().toISOString() }; demoState.clientiMascalcia.push(c); nuovoCli = true; }
        cv = { id: "cv-" + (++demoIdCounter), cliente_mascalcia_id: c.id, nome: d.nome || "Cavallo", microchip: d.microchip || null, razza: d.razza || null, note_colleghi: [] };
        miei.push(cv); nuovoCav = true;
      }
      if(d.indicazioni && !(cv.note_colleghi || []).some(n => n.messaggio === m.id)) cv.note_colleghi = [...(cv.note_colleghi || []), { da: "Collega", professione: d.professione, il: m.created_at, testo: d.indicazioni, messaggio: m.id }];
      m.dati = { ...d, ricevuto: { il: new Date().toISOString() } };
      const cli = (demoState.clientiMascalcia || []).find(x => x.id === cv.cliente_mascalcia_id);
      return { ok: true, riga: cv.id, cliente_id: cv.cliente_mascalcia_id, cliente: cli?.nome, nuovo_cliente: nuovoCli, nuovo_cavallo: nuovoCav };
    }
    const { data, error } = await sb.rpc("pro_ricevi_cavallo_collega", { p_msg: msg, p_riga: riga || null });
    if(error) return { ok: false, errore: error.message };
    return data || { ok: false, errore: "Non riuscito" };
  },
  async noteColleghiCavallo(riga){
    if(!riga) return [];
    if(DEMO_MODE) return ((demoState.cavalliClientiMascalcia || []).find(x => x.id === riga) || {}).note_colleghi || [];
    const { data, error } = await sb.from("cavalli_clienti_mascalcia").select("note_colleghi").eq("id", riga).maybeSingle();
    return error ? [] : (data?.note_colleghi || []);
  }
};

/* ---------------- riquadro «Colleghi» nella scheda del cavallo ---------------- */
function ccNoteHtml(note, nome){
  const l = (note || []).slice().sort((a, b) => String(b.il || "").localeCompare(String(a.il || "")));
  if(!l.length) return `<div class="muted cc-vuoto">Manda la scheda di ${ccEsc(nome || "questo cavallo")} a un ${ccVerso()} che usa Equo, con le tue indicazioni: arriva nella chat tra colleghi.</div>`;
  return l.map(n => `<div class="cc-nota"><div class="cc-nota-t"><b>Indicazioni ${n.professione === "veterinario" ? "del veterinario" : n.professione === "maniscalco" ? "del maniscalco" : "del collega"}${n.da ? " " + ccEsc(n.da) : ""}</b><span>${ccEsc(ccData(n.il))}</span></div><div class="cc-nota-x">${ccEsc(n.testo)}</div></div>`).join("");
}
function ccSezioneHtml(cv, vedi){
  if(!cv || (vedi && !vedi("ana"))) return "";
  return `<div class="card cavpro-sez" id="cc-sez"><div class="cavpro-sez-testa"><span>Colleghi</span><button class="btn btn-outline btn-sm" id="cc-manda" onclick="ccApri()">Manda al ${ccVerso()}</button></div>
    <div id="cc-note">${ccNoteHtml(cv.note_colleghi, cv.nome)}</div></div>`;
}
async function ccCaricaNote(cv){
  if(!cv?.id) return;
  const note = await ccDB.noteColleghiCavallo(cv.id);
  cv.note_colleghi = note;
  const box = document.getElementById("cc-note"); if(box) box.innerHTML = ccNoteHtml(note, cv.nome);
}

/* ---------------- «Manda al maniscalco / al veterinario» ---------------- */
function ccFoglio(){
  let ov = document.getElementById("modal-cc");
  if(!ov){
    ov = document.createElement("div"); ov.className = "modal-overlay"; ov.id = "modal-cc";
    ov.setAttribute("onclick", "closeOut(event,'modal-cc')");
    ov.innerHTML = '<div class="modal cc-modal"><div class="modal-handle"></div><div id="modal-cc-corpo"></div></div>';
    document.body.appendChild(ov);
  }
  return document.getElementById("modal-cc-corpo");
}
async function ccApri(){
  const cv = (typeof schedaCavalli !== "undefined" ? schedaCavalli : []).find(c => c.key === schedaCavalloKey);
  if(!cv) return;
  let riga = cv.id;
  if(!riga){ ({ cavallo_cliente_id: riga } = await DB.risolviCavalloPerIntervento(currentClienteId, cv)); if(riga) cv.id = riga; }
  if(!riga) return showToast("Non riesco ad aprire la scheda del cavallo, riprova.");
  const cli = (clientiMascalcia || []).find(x => x.id === (cv.cliente_mascalcia_id || currentClienteId)) || {};
  const [col, docs] = await Promise.all([ccDB.colleghiPerCavallo(riga), DB.listaDocumenti({ cavallo_cliente_id: riga, horse_id: cv.horse_id || null }).catch(() => [])]);
  const verso = ccVerso();
  Object.assign(CC, { cv, riga, colleghi: (col || []).filter(c => c.ruolo === verso), altro: false, docSel: new Set(), avvisa: true, invio: false,
    docs: (docs || []).filter(d => DEMO_MODE || d.autore_user_id === currentUser.id),
    puoAvvisare: !!(cli.cliente_user_id || (cli.centro_id && cli.collegamento_stato === "attivo")) });
  CC.scelto = CC.colleghi[0]?.conversazione_id || null;
  if(!CC.colleghi.length) CC.altro = true;
  // il veterinario: le indicazioni dell'ultima visita come punto di partenza
  const ultima = verso === "maniscalco" && typeof VC !== "undefined" && VC.cv === cv ? (VC.visite || []).find(v => v.dati && (v.dati.indicazioni || v.dati.terapia)) : null;
  CC.testo = ultima ? String(ultima.dati.indicazioni || ultima.dati.terapia || "") : "";
  ccDisegna();
  openModal("modal-cc");
}
function ccDisegna(){
  const box = ccFoglio(), verso = ccVerso(), cv = CC.cv;
  const ind = document.getElementById("cc-ind"); if(ind) CC.testo = ind.value;
  box.innerHTML = `<div class="modal-title">Manda ${ccEsc(cv.nome)} al ${verso}</div>
    <div class="cc-lista">${CC.colleghi.map(c => `<button type="button" class="cc-coll${!CC.altro && CC.scelto === c.conversazione_id ? " on" : ""}" onclick="ccScegli('${c.conversazione_id}')">
      <span class="cc-av">${ccEsc(String(c.nome || "?").trim().charAt(0).toUpperCase())}</span><span class="cc-c"><b>${ccEsc(c.nome || "Collega")}</b><small>${c.segue ? "Segue già questo cliente" : ccEsc(ROLE_LABELS?.[c.ruolo] || c.ruolo || "Collega")}</small></span>
      <span class="cc-spunta">${!CC.altro && CC.scelto === c.conversazione_id ? "✓" : ""}</span></button>`).join("")}
      <button type="button" class="cc-coll altro${CC.altro ? " on" : ""}" onclick="ccAltro()"><span class="cc-av">+</span><span class="cc-c"><b>Un altro ${verso}</b><small>con il suo codice ${ccPrefisso()}…</small></span></button>
      ${CC.altro ? `<input class="input cc-codice" id="cc-codice" placeholder="${ccPrefisso()}…" style="text-transform:uppercase" autocomplete="off">` : ""}</div>
    <div class="cc-lab">Indicazioni per il ${verso}</div>
    <textarea class="input cc-ind" id="cc-ind" rows="3" placeholder="${verso === "maniscalco" ? "Es. ferro a cuore anteriore sx, ricontrollo rx tra 6 settimane" : "Es. ascesso anteriore dx, zoppia da ieri: puoi passare?"}">${ccEsc(CC.testo || "")}</textarea>
    ${CC.docs.length ? `<div class="cc-lab">Allega i tuoi documenti</div>${CC.docs.slice(0, 12).map(d => `<label class="cc-doc"><input type="checkbox" ${CC.docSel.has(d.id) ? "checked" : ""} onchange="ccDoc('${d.id}', this.checked)"><span>${ccEsc(d.titolo || "Documento")}</span></label>`).join("")}
      <div class="muted cc-nota-p">Li vede solo lui, per consulto: resta scritto nello storico del documento.</div>` : ""}
    ${CC.puoAvvisare ? `<label class="cc-avvisa"><input type="checkbox" ${CC.avvisa ? "checked" : ""} onchange="ccAvvisa(this.checked)"><span><b>Avvisa il proprietario</b><small>Riceve un messaggio nella chat con te: sa a chi hai mandato la scheda.</small></span></label>` : ""}
    <div class="auth-error" id="cc-err" style="display:none"></div>
    <button class="btn btn-primary cc-invia" id="cc-invia" onclick="ccInvia()">Invia in chat</button>`;
}
function ccScegli(conv){ CC.altro = false; CC.scelto = conv; ccDisegna(); }
function ccAltro(){ CC.altro = true; ccDisegna(); setTimeout(() => document.getElementById("cc-codice")?.focus(), 50); }
function ccDoc(id, on){ if(on) CC.docSel.add(id); else CC.docSel.delete(id); }
function ccAvvisa(on){ CC.avvisa = !!on; }
async function ccInvia(){
  if(CC.invio) return;
  const err = document.getElementById("cc-err"), btn = document.getElementById("cc-invia");
  const errore = t => { if(err){ err.textContent = t; err.style.display = "block"; } };
  if(err) err.style.display = "none";
  const indicazioni = (document.getElementById("cc-ind")?.value || "").trim();
  CC.invio = true; if(btn) btn.disabled = true;
  try{
    let conv = CC.altro ? null : CC.scelto, nome = (CC.colleghi.find(c => c.conversazione_id === conv) || {}).nome, ruolo = ccVerso();
    if(!conv){
      const codice = (document.getElementById("cc-codice")?.value || "").trim().toUpperCase();
      if(!codice) return errore("Scrivi il codice del collega (" + ccPrefisso() + "…).");
      const r = await DB.creaChatCollega(codice);
      if(!r?.ok) return errore({ codice_non_valido: "Codice non trovato: controlla che sia un codice professionista.", codice_tuo: "Questo è il tuo codice." }[r?.errore] || "Non riesco ad aprire la chat con il collega.");
      conv = r.conversazione_id; nome = r.nome || "Collega"; ruolo = r.ruolo || ruolo;
    }
    const res = await ccDB.mandaCavalloCollega({ conv, riga: CC.riga, indicazioni, documenti: [...CC.docSel], avvisa: CC.puoAvvisare ? CC.avvisa : false });
    if(!res?.ok) return errore(res?.errore || "Non inviato, riprova.");
    closeModal("modal-cc");
    showToast(`Scheda di ${CC.cv.nome} mandata a ${nome || res.collega || "il collega"}` + (res.avvisato ? " · il proprietario è avvisato" : ""));
    if(typeof apriChatCollega === "function") apriChatCollega(conv, nome || "Collega", ruolo);
  } finally { CC.invio = false; if(btn) btn.disabled = false; }
}

/* ---------------- in chat: la scheda ricevuta ---------------- */
function ccSimili(d){
  const tutti = typeof cavalliCartella === "function" ? cavalliCartella() : [];
  const chip = String(d.microchip || "").trim().toUpperCase(), nome = ccNomeNorm(d.nome);
  return tutti.filter(x => x.id && ((chip && String(x.microchip || "").trim().toUpperCase() === chip) || (d.horse_id && x.horse_id === d.horse_id) || (nome && ccNomeNorm(x.nome) === nome)));
}
function ccBollaHtml(m, out){
  const d = m.dati || {};
  const sotto = [d.cliente, d.microchip ? "chip …" + String(d.microchip).slice(-6) : "", d.razza].filter(Boolean).join(" · ");
  const docs = (d.documenti || []).map(x => `<button type="button" class="mchat-doc" onclick="apriDocumentoPrivato('${ccEsc(x.id)}')"><span class="mchat-doc-ico">${/^image\//.test(x.mime || "") ? "FOTO" : /^video\//.test(x.mime || "") ? "VIDEO" : "PDF"}</span><span class="mchat-doc-nome">${ccEsc(x.titolo || "Documento")}</span></button>`).join("");
  const simili = !out && !d.ricevuto ? ccSimili(d) : [];
  const azioni = out ? `<div class="cc-stato">${d.ricevuto ? "✓ Il collega l'ha aggiunto ai suoi cavalli" : "Inviata: il collega la aggiunge ai suoi cavalli"}</div>`
    : d.ricevuto ? `<div class="cc-stato">✓ È tra i tuoi cavalli</div>`
    : `<button type="button" class="btn btn-primary btn-sm cc-bt" onclick="ccRicevi('${ccEsc(m.id)}')">+ Aggiungi ai miei cavalli</button>`
      + (simili.length ? `<button type="button" class="btn btn-outline btn-sm cc-bt" onclick="ccCeLho('${ccEsc(m.id)}')">Ce l'ho già: collega</button>` : "");
  const chi = d.professione === "veterinario" ? "del veterinario" : d.professione === "maniscalco" ? "del maniscalco" : "del collega";
  return `<div class="cc-bolla"><div class="cc-bolla-lab">${out ? "Hai mandato un cavallo" : "Ti ha mandato un cavallo"}</div>
    <div class="cc-cav"><div class="cc-cav-h"><span class="cc-cav-ic">🐴</span><span><b>${ccEsc(d.nome || "Cavallo")}</b><small>${ccEsc(sotto)}</small></span></div>
    <div class="cc-cav-b">${d.indicazioni ? `<div class="cc-ind-box"><b>Indicazioni ${chi}</b>${ccEsc(d.indicazioni)}</div>` : ""}${docs}${azioni}</div></div></div>`;
}
function ccPreviewTesto(m){ return "🐴 " + ((m?.dati && m.dati.nome) || "Scheda cavallo"); }
async function ccRicevi(msg, riga){
  const r = await ccDB.riceviCavalloCollega(msg, riga || null);
  if(!r?.ok) return showToast(r?.errore || "Non riuscito, riprova.");
  closeModal("modal-cc");
  showToast(r.nuovo_cavallo ? `Aggiunto ai tuoi cavalli${r.cliente ? " · cliente " + r.cliente : ""}${r.nuovo_cliente ? " (nuovo)" : ""}` : "Collegato al tuo cavallo: le indicazioni sono nella sua scheda");
  if(typeof loadClientiMascalcia === "function") try{ await loadClientiMascalcia(); }catch(_){}
  if(typeof currentConversazioneId !== "undefined" && currentConversazioneId && typeof renderOwnerChatThread === "function") await renderOwnerChatThread(currentConversazioneId);
  return r;
}
function ccCeLho(msg){
  const m = CC.msgCache?.[msg] || (DEMO_MODE ? demoState.messaggiProprietari.find(x => x.id === msg) : null);
  const simili = ccSimili(m?.dati || {});
  const box = ccFoglio();
  const nomeCli = id => ((clientiMascalcia || []).find(c => c.id === id) || {}).nome || "";
  box.innerHTML = `<div class="modal-title">Quale dei tuoi cavalli è?</div>
    <div class="cc-lista">${simili.map(x => `<button type="button" class="cc-coll" onclick="ccRicevi('${ccEsc(msg)}', '${ccEsc(x.id)}')"><span class="cc-av">🐴</span><span class="cc-c"><b>${ccEsc(x.nome)}</b><small>${ccEsc([nomeCli(x.cliente_mascalcia_id), x.microchip ? "chip " + x.microchip : ""].filter(Boolean).join(" · "))}</small></span><span class="cc-spunta">›</span></button>`).join("")}</div>
    <button class="btn btn-outline cc-invia" onclick="ccRicevi('${ccEsc(msg)}')">Nessuno: aggiungilo come nuovo</button>`;
  openModal("modal-cc");
}
// la chat dei colleghi tiene a portata i messaggi disegnati (per «Ce l'ho già»)
function ccRicorda(lista){ CC.msgCache = {}; (lista || []).forEach(m => { if(m.tipo === "cavallo") CC.msgCache[m.id] = m; }); }
window.ccRicorda = ccRicorda;

export { ccDB, ccSezioneHtml, ccCaricaNote, ccApri, ccScegli, ccAltro, ccDoc, ccAvvisa, ccInvia, ccBollaHtml, ccRicevi, ccCeLho, ccPreviewTesto, CC };
