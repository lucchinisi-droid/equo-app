/* ---------- APPUNTAMENTI CON STRUTTURE EQUO SCUDERIA (doppia conferma, più cavalli) ---------- */
async function azioneGruppoStruttura(gruppoId, azione){
  const { data, error } = await sb.rpc("pro_azione_appuntamento_struttura", { p_gruppo_id: gruppoId, p_azione: azione });
  if(error || !data?.ok){ showToast((data && data.errore) || "Operazione non riuscita: " + (error?.message || "riprova")); return; }
  showToast(azione === "conferma" ? "Confermato: la scuderia riceve l'avviso." : azione === "rifiuta" ? "Richiesta rifiutata." : "Appuntamento annullato.");
  await renderAgendaSettimana();
  await renderProDeadlines();
  if(currentClienteId) await loadClienteInterventi(currentClienteId);
}

let propStrutturaClienteId = null;
async function apriPropostaStruttura(clienteId, preset){
  propStrutturaClienteId = clienteId;
  const c = clientiMascalcia.find(x => x.id === clienteId);
  document.getElementById("prop-str-nome").textContent = c?.nome || "Scuderia";
  const p = preset || {};
  document.getElementById("prop-str-tipo").value = p.tipo_ferratura || "ferratura";
  document.getElementById("prop-str-tipo-altro").value = p.tipo_altro || "";
  document.getElementById("prop-str-tipo-altro-group").style.display = (p.tipo_ferratura === "altro") ? "flex" : "none";
  document.getElementById("prop-str-data").value = p.data_intervento || "";
  document.getElementById("prop-str-data").min = isoLocale(new Date());
  document.getElementById("prop-str-ora").value = p.ora ? String(p.ora).slice(0, 5) : "";
  document.getElementById("prop-str-importo").value = "";
  document.getElementById("prop-str-note").value = "";
  document.getElementById("prop-str-error").style.display = "none";
  const box = document.getElementById("prop-str-cavalli");
  box.innerHTML = '<div class="muted" style="font-size:13px">Caricamento…</div>';
  openModal("modal-proponi-struttura");
  const { data } = DEMO_MODE ? { data: [] } : await sb.rpc("pro_cavalli_struttura", { p_cliente_id: clienteId });
  const cav = data || [];
  box.innerHTML = cav.length
    ? cav.map(x => `<label style="display:flex;align-items:center;gap:10px;padding:7px 2px;font-size:14px"><input type="checkbox" class="prop-str-cav" value="${x.id}" style="width:18px;height:18px"${p.cavallo_cliente_id === x.id || (p.cavalli || []).includes(x.id) ? " checked" : ""}> ${escapeHtml(x.nome)}${x.in_scuderia === false ? ' <span class="muted" style="font-size:11.5px">(inserito da te, non nella scheda della scuderia)</span>' : ""}</label>`).join("")
    : '<div class="muted" style="font-size:13px">La scuderia non ha ancora cavalli in scheda: l\'appuntamento sarà generico.</div>';
}

async function inviaPropostaStruttura(){
  const err = document.getElementById("prop-str-error");
  err.style.display = "none";
  const tipo = document.getElementById("prop-str-tipo").value;
  const tipoAltro = document.getElementById("prop-str-tipo-altro").value.trim();
  const data = document.getElementById("prop-str-data").value;
  const ora = document.getElementById("prop-str-ora").value;
  const importo = document.getElementById("prop-str-importo").value;
  const note = document.getElementById("prop-str-note").value.trim();
  const cavalli = Array.from(document.querySelectorAll(".prop-str-cav:checked")).map(el => el.value);
  if(!data){ err.textContent = "Scegli la data."; err.style.display = "block"; return; }
  if(tipo === "altro" && !tipoAltro){ err.textContent = "Specifica il tipo di intervento."; err.style.display = "block"; return; }
  const { data: res, error } = await sb.rpc("pro_proponi_appuntamento_struttura", {
    p_cliente_id: propStrutturaClienteId, p_tipo: tipo, p_tipo_altro: tipoAltro || null, p_data: data, p_ora: ora || null,
    p_cavalli: cavalli, p_note: note || null, p_importo: importo ? Number(importo) : null });
  if(error || !res?.ok){ err.textContent = (res && res.errore) || ("Invio non riuscito: " + (error?.message || "riprova")); err.style.display = "block"; return; }
  closeModal("modal-proponi-struttura");
  showToast("Proposta inviata: la scuderia deve confermarla.");
  if(document.getElementById("ag-week")) await renderAgendaSettimana();
  if(currentClienteId) await loadClienteInterventi(currentClienteId);
}

function vaiAllaDataAgenda(iso){
  const lunCorrente = agLunedi(0);
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const diffGiorni = Math.round((target - lunCorrente) / 86400000);
  agSettimanaOffset = Math.floor(diffGiorni / 7);
  agGiorniAperti = new Set([iso]);
  renderAgendaSettimana();
}

function accettaRichiesta(id){
  const r = richiesteCache[id] || agEventiCache[id];
  if(!r) return;
  if(r.gruppo_id) return azioneGruppoStruttura(r.gruppo_id, "conferma");
  // apre il form già compilato (il ferro arriva dalla scheda del cavallo): il maniscalco controlla e conferma
  openInterventoModal(null, r);
}

async function rifiutaRichiesta(id){
  const r = richiesteCache[id] || agEventiCache[id];
  if(!r) return;
  if(r.gruppo_id){
    if(!confirm("Rifiutare la richiesta della scuderia? Riceve un messaggio in chat per trovare un'altra data.")) return;
    return azioneGruppoStruttura(r.gruppo_id, "rifiuta");
  }
  if(!confirm("Rifiutare la richiesta? Il cliente riceve un messaggio in chat per trovare un'altra data.")) return;
  const { error } = await DB.updateInterventoMascalcia(id, { stato: "rifiutato" });
  if(error){ showToast("Errore: " + error.message); return; }
  await DB.insertMessaggioMascalcia({ cliente_mascalcia_id: r.cliente_mascalcia_id, tipo: "testo",
    testo: testoRichiesta("❌ Non riesco per questa richiesta", r, agNomeCavallo(r)) + " Scrivimi qui per trovare un'altra data." });
  showToast("Richiesta rifiutata");
  await renderAgendaSettimana();
  await renderProDeadlines();
  if(currentClienteId === r.cliente_mascalcia_id) await loadClienteInterventi(r.cliente_mascalcia_id);
}

/* Agenda a fisarmonica su 2 colonne (Lun|Mar, Mer|Gio, Ven|Sab, Domenica sotto):
   giorno chiuso = nome, data e numero; un solo giorno aperto alla volta, con il dettaglio
   a tutta larghezza sotto la sua coppia, raggruppato per cliente. Oggi si apre da solo. */
let agGiorniDati = [], agLuoghi = {};
function agRigaEvento(e, di){
  const cav = agNomeCavallo(e);
  return `
      <div class="ag-ev${e.stato === "fatto" ? " fatto" : (e.stato === "richiesto" || e.stato === "proposto") ? " richiesta" : ""}" data-ev="${e.id}">
        <span class="ag-mani" data-drag="ev" aria-label="Trascina per cambiare l'ordine" title="Trascina per cambiare l'ordine">⋮⋮</span>
        <div class="ag-ev-time">${e.ora ? String(e.ora).slice(0, 5) : "—"}</div>
        <div class="ag-ev-main" onclick="apriAzioniEvento('${e.id}')">
          <div class="ag-ev-title">${cav ? escapeHtml(cav) : '<span style="color:var(--muted);font-weight:500">Cavallo non indicato</span>'}</div>
          <div class="ag-ev-sub">${di ? `<span class="ag-di">di ${escapeHtml(di)}</span> · ` : ""}${e.stato === "richiesto" ? "Richiesta · " : e.stato === "proposto" ? "In attesa della scuderia · " : ""}${escapeHtml(agDescrizioneTipoPro(e))}${e.note ? " · " + escapeHtml(e.note) : ""}</div>
          ${notaModificaMan(e)}
        </div>
        ${e.stato === "fatto"
          ? '<span class="ag-ev-done">✓ Fatto</span>'
          : e.stato === "proposto"
            ? '<span class="ag-ev-done" style="color:var(--accent)">attesa</span>'
          : e.stato === "richiesto"
            ? `<button class="ag-ev-fatto" onclick="accettaRichiesta('${e.id}')">Accetta</button>`
            : `<button class="ag-ev-fatto" onclick="segnaFattoAgenda('${e.id}')">Fatto</button>`}
        <button class="ag-ev-menu" onclick="apriAzioniEvento('${e.id}')" aria-label="Azioni">⋯</button>
      </div>`;
}
function agRigaScadenza(sc, di){
  const cav = agNomeCavallo(sc);
  return `
      <div class="ag-ev promemoria">
        <div class="ag-ev-time" style="font-size:11px;color:var(--muted)">scad.</div>
        <div class="ag-ev-main" onclick="fissaDaScadenza('${sc.id}')">
          <div class="ag-ev-title">${cav ? escapeHtml(cav) : '<span style="color:var(--muted);font-weight:500">Cavallo non indicato</span>'}</div>
          <div class="ag-ev-sub">${di ? `<span class="ag-di">di ${escapeHtml(di)}</span> · ` : ""}Da ripetere: ${escapeHtml(TIPO_FERRATURA_LABELS[sc.tipo_ferratura] || sc.tipo_ferratura)} (ultimo ${formatDate(sc.data_intervento)})</div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="fissaDaScadenza('${sc.id}')">Fissa</button>
      </div>`;
}
function agTile(d){
  const tot = d.ev.length + d.sc.length, aperto = agGiorniAperti.has(d.iso);
  return `<button type="button" class="ag-tile${d.oggi ? " today" : ""}${aperto ? " aperto" : ""}${d.k === 6 ? " dom" : ""}" data-iso="${d.iso}" aria-expanded="${aperto}" onclick="toggleGiornoAgenda('${d.iso}')">
      <span class="ag-tile-gg"><span class="ag-tile-nome">${AG_GIORNI[d.k]}</span><span class="ag-tile-data">${d.g.getDate()} ${AG_MESI[d.g.getMonth()]}</span>${d.oggi ? '<span class="ag-tile-oggi">oggi</span>' : ""}</span>
      <span class="ag-count${tot ? "" : " zero"}">${tot}</span><span class="ag-chev">▾</span>
    </button>`;
}
function agPannello(d){
  // raggruppa per LUOGO (una tappa del giro) nell'ordine del primo appuntamento; le scadenze vanno dopo gli appuntamenti dello stesso luogo.
  // Sotto ogni cavallo resta scritto di chi è quando il luogo non è il suo cliente.
  const gruppi = new Map();
  const metti = (x, attuale, riga) => {
    const l = luogoEvento(x, attuale);
    if(!gruppi.has(l.key)){ gruppi.set(l.key, { nome: l.nome, l, righe: [] }); agLuoghi[l.key] = l; }
    const di = l.key !== "c:" + x.cliente_mascalcia_id ? (x.clienti_mascalcia?.nome || clienteDiId(x.cliente_mascalcia_id)?.nome || "") : "";
    gruppi.get(l.key).righe.push(riga(x, di));
  };
  agOrdinaGiro(d.ev).forEach(e => metti(e, false, agRigaEvento));
  d.sc.forEach(sc => metti(sc, true, agRigaScadenza));
  const cavalli = new Set([...d.ev, ...d.sc].map(x => x.cavallo_cliente_id || x.horse_id || ("r:" + x.id))).size;
  const nCli = gruppi.size;
  const nomeEsteso = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"][d.k];
  const corpo = [...gruppi.entries()].map(([k, gr]) => `
      <div class="ag-gblock" data-cli="${escapeHtml(k)}">
        <div class="ag-cli">${d.ev.length > 1 ? '<span class="ag-mani" data-drag="gr" aria-label="Trascina il luogo" title="Trascina il luogo">⋮⋮</span>' : ""}<span class="ag-cli-nome">${escapeHtml(gr.nome)}</span><span>${gr.righe.length}</span>
          <button class="ag-cli-nav" onclick="event.stopPropagation();navigaLuogo(agLuoghi[this.closest('.ag-gblock').dataset.cli])" aria-label="Naviga">Naviga</button>${d.oggi && agenteAiHammer() && d.ev.some(e => e.stato !== "fatto" && luogoEvento(e, false).key === k) ? `<button class="ag-cli-lav" onclick="event.stopPropagation();mlApri(this.closest('.ag-gblock').dataset.cli)" aria-label="Modalità Lavoro"><svg viewBox="0 0 24 24"><use href="#i-ferro"/></svg>Lavoro</button>` : ""}</div>
        <div class="ag-gr">${gr.righe.join("")}</div>
      </div>`).join("");
  return `<div class="ag-pannello" data-iso="${d.iso}">
      <div class="ag-pannello-testa"><b>${nomeEsteso} ${d.g.getDate()} ${AG_MESI[d.g.getMonth()]}${d.oggi ? " · oggi" : ""}</b>
        <span>${nCli ? `${nCli} ${nCli === 1 ? "tappa" : "tappe"} · ${cavalli} ${cavalli === 1 ? "cavallo" : "cavalli"}` : ""}</span></div>
      <div class="ag-gruppi">${corpo || '<div class="ag-empty">Nessun appuntamento</div>'}</div>
      ${d.ev.length > 1 ? '<div class="ag-sugger">Tieni premuto ⋮⋮ e trascina per cambiare l\'ordine del giro.</div>' : ""}
      <button class="btn btn-outline btn-sm ag-add-day" onclick="nuovoAppuntamentoGiorno('${d.iso}')">+ Aggiungi in questo giorno</button>
    </div>`;
}
function agDisegnaGriglia(){
  const box = document.getElementById("ag-week");
  if(!box || !agGiorniDati.length) return;
  let html = "";
  for(const coppia of [[0, 1], [2, 3], [4, 5], [6]]){
    const gg = coppia.map(k => agGiorniDati[k]);
    html += gg.map(agTile).join("");
    const ap = gg.find(d => agGiorniAperti.has(d.iso));
    if(ap) html += agPannello(ap);
  }
  box.innerHTML = `<div class="ag-griglia">${html}</div>`;
  agAttivaTrascina(box);
}

