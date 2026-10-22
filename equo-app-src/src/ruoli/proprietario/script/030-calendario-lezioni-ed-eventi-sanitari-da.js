/* ---------- CALENDARIO: lezioni ed eventi sanitari dalla scuderia collegata ----------
   Dati via RPC sicure (mie_lezioni_scuderia, miei_eventi_scuderia). Quando la scuderia crea,
   sposta o annulla una lezione, o registra un evento sanitario sul cavallo, il database scrive
   un messaggio automatico nella chat con la scuderia (=> notifica push). "Accetta" conferma la
   lezione e avvisa la struttura; "Modifica" apre la chat con la struttura. */
const LEZ_SCUD_STATO = {
  prenotata:  ["Da confermare", "badge-accent"],
  confermata: ["Confermata", "badge-green"],
  completata: ["Completata", ""],
  annullata:  ["Annullata", "badge-red"],
};
const EVENTO_SCUD_LABEL = { vaccino: "Vaccino", coggins: "Coggins", ferratura: "Ferratura", sverminazione: "Sverminazione" };
let calScuderiaCache = { lezioni: [], eventi: [] };

function oggiISO(){
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function dataLezioneIt(dataStr, ora){
  const d = new Date(dataStr + "T12:00:00");
  const txt = d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
  return txt.charAt(0).toUpperCase() + txt.slice(1) + (ora ? ", " + ora : "");
}

async function loadCalendarioScuderia(){
  const wrap = document.getElementById("scuderia-cal-box");
  const box = document.getElementById("scuderia-cal-list");
  const nota = document.getElementById("cal-nota-scuderia");
  if(!wrap || !box) return;
  if(DEMO_MODE || !currentUser){ wrap.style.display = "none"; return; }
  try{
    const [scuderie, lez, ev] = await Promise.all([
      DB.listScuderieCollegate(),
      sb.rpc("mie_lezioni_scuderia"),
      sb.rpc("miei_eventi_scuderia"),
    ]);
    if(lez.error) console.error("mie_lezioni_scuderia:", lez.error);
    if(ev.error) console.error("miei_eventi_scuderia:", ev.error);
    calScuderiaCache = { lezioni: lez.error ? [] : (lez.data || []), eventi: ev.error ? [] : (ev.data || []) };
    if(nota) nota.style.display = (scuderie && scuderie.length) ? "none" : "";
    if(!(scuderie && scuderie.length) && !calScuderiaCache.lezioni.length && !calScuderiaCache.eventi.length){
      wrap.style.display = "none"; return;
    }
    wrap.style.display = "block";
    renderCalendarioScuderia();
  } catch(err){
    console.error("loadCalendarioScuderia:", err);
    wrap.style.display = "none";
  }
}

function renderCalendarioScuderia(){
  const box = document.getElementById("scuderia-cal-list");
  if(!box) return;
  const oggi = oggiISO();
  const { lezioni, eventi } = calScuderiaCache;
  const future = lezioni.filter(l => l.data >= oggi);
  const passate = lezioni.filter(l => l.data < oggi).reverse();
  let html = "";

  if(future.length === 0 && passate.length === 0){
    html += '<div class="muted" style="font-size:13px;padding:6px 0 10px">Nessuna lezione in programma dalla scuderia.</div>';
  }
  html += future.map(l => cardLezioneScuderia(l, true)).join("");
  if(passate.length){
    html += `<details style="margin-top:6px"><summary class="muted" style="font-size:12.5px;cursor:pointer;padding:6px 0">Lezioni passate (${passate.length})</summary>${passate.map(l => cardLezioneScuderia(l, false)).join("")}</details>`;
  }

  if(eventi.length){
    html += '<div style="font-weight:700;font-size:13.5px;margin:16px 0 4px">Salute registrata dalla scuderia</div>';
    html += eventi.map(e => {
      const tipo = EVENTO_SCUD_LABEL[e.tipo] || (e.tipo_altro || "Evento sanitario");
      const scad = e.data_scadenza ? ` · prossima scadenza ${formatDate(e.data_scadenza)}` : "";
      const scaduto = e.data_scadenza && e.data_scadenza < oggi;
      return `
      <div class="event-item">
        <div style="min-width:0">
          <div style="font-weight:600;font-size:14px">${escapeHtml(tipo)} · ${escapeHtml(e.cavallo || "Cavallo")}</div>
          <div class="muted" style="font-size:12px">${formatDate(e.data_evento)}${scad} · ${escapeHtml(e.scuderia)}${e.note ? " · " + escapeHtml(e.note) : ""}</div>
        </div>
        ${scaduto ? '<span class="badge badge-red">Scaduto</span>' : ""}
      </div>`;
    }).join("");
  }
  box.innerHTML = html;
}

function cardLezioneScuderia(l, futura){
  const [statoTxt, statoCls] = LEZ_SCUD_STATO[l.stato] || [l.stato, ""];
  const dettagli = [
    l.cavaliere ? "monta " + escapeHtml(l.cavaliere) : null,
    l.cavallo ? "su " + escapeHtml(l.cavallo) : null,
    l.istruttore ? "istruttore " + escapeHtml(l.istruttore) : null,
  ].filter(Boolean).join(" · ");
  const azioni = futura && l.stato !== "annullata" && l.stato !== "completata" ? `
    <div style="display:flex;gap:8px;margin-top:10px">
      ${l.stato === "prenotata" ? `<button class="btn btn-primary btn-sm btn-conferma" style="flex:1" onclick="accettaLezioneScuderia('${l.id}', this)">Accetta</button>` : ""}
      <button class="btn btn-outline btn-sm btn-variazione" style="flex:1" onclick="modificaLezioneScuderia('${l.id}')">Modifica</button>
    </div>` : "";
  return `
    <div class="event-item" style="display:block;${futura ? "" : "opacity:.65"}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
        <div style="min-width:0">
          <div style="font-weight:600;font-size:14px">${escapeHtml(dataLezioneIt(l.data, l.ora))} · Lezione</div>
          <div class="muted" style="font-size:12px">${dettagli ? dettagli + " · " : ""}${escapeHtml(l.scuderia)}</div>
        </div>
        <span class="badge ${statoCls}" style="flex-shrink:0${statoCls ? "" : ";background:rgba(0,0,0,.07);color:var(--muted)"}">${statoTxt}</span>
      </div>
      ${azioni}
    </div>`;
}

async function accettaLezioneScuderia(id, btn){
  if(btn) btn.disabled = true;
  const { data, error } = await sb.rpc("accetta_lezione_scuderia", { p_lezione_id: id });
  if(error || !data?.ok){
    showToast((data && data.errore) || "Non sono riuscito a confermare la lezione. Riprova.");
    if(btn) btn.disabled = false;
    return;
  }
  showToast(data.gia ? "La lezione era già confermata." : "Lezione confermata: la scuderia riceve l'avviso.");
  await loadCalendarioScuderia();
}

async function modificaLezioneScuderia(id){
  const l = calScuderiaCache.lezioni.find(x => x.id === id);
  if(!l) return;
  await openStableChatThread(l.membro_id, l.centro_id, l.scuderia);
  const input = document.getElementById("schat-input");
  if(input){
    input.value = `Vorrei modificare la lezione di ${dataLezioneIt(l.data, l.ora)}: `;
    input.focus();
  }
}

function openAddLezioneModal(id){
  editingLezioneId = id || null;
  document.getElementById("lezione-error").style.display = "none";
  document.getElementById("lezione-form-title").textContent = editingLezioneId ? "Modifica lezione" : "Nuova lezione";
  document.getElementById("lezione-delete-btn").style.display = editingLezioneId ? "block" : "none";
  const sel = document.getElementById("lezione-cavallo");
  if(horses.length === 0){
    sel.innerHTML = '<option value="">Nessun cavallo</option>';
  } else {
    sel.innerHTML = cavalliUsabili().map(h => `<option value="${h.id}">${escapeHtml(h.name)}</option>`).join("");
  }
  if(editingLezioneId){
    const l = lezioniCache.find(x => x.id === editingLezioneId);
    sel.value = l?.horse_id || "";
    document.getElementById("lezione-tipo").value = l?.tipo || "lezione";
    document.getElementById("lezione-data").value = l?.data || "";
    document.getElementById("lezione-note").value = l?.note || "";
  } else {
    document.getElementById("lezione-tipo").value = "lezione";
    document.getElementById("lezione-data").value = "";
    document.getElementById("lezione-note").value = "";
  }
  openModal("modal-add-lezione");
}

async function createLezione(){
  const errBox = document.getElementById("lezione-error");
  errBox.style.display = "none";
  const horse_id = document.getElementById("lezione-cavallo").value || null;
  const tipo = document.getElementById("lezione-tipo").value;
  const data = document.getElementById("lezione-data").value;
  const note = document.getElementById("lezione-note").value.trim();
  if(!data) return;
  const { error } = editingLezioneId
    ? await DB.updateLezione(editingLezioneId, { horse_id, data, tipo, note })
    : await DB.insertLezione({ horse_id, data, tipo, note });
  if(error){ errBox.textContent = "Errore: " + error.message; errBox.style.display = "block"; return; }
  closeModal("modal-add-lezione");
  await loadLezioni();
}

async function deleteLezioneCorrente(){
  if(!editingLezioneId) return;
  if(!confirm("Eliminare questa lezione?")) return;
  const { error } = await DB.deleteLezione(editingLezioneId);
  if(error){ alert("Errore: " + error.message); return; }
  closeModal("modal-add-lezione");
  await loadLezioni();
}

