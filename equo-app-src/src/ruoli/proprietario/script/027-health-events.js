/* ---------- HEALTH EVENTS ---------- */
const EVENT_LABELS = { vaccino: "Vaccino", coggins: "Test Coggins", ferratura: "Ferratura", sverminazione: "Sverminazione" };

async function loadHorseEvents(horseId){
  const box = document.getElementById("horse-events-list");
  box.innerHTML = '<div class="loading"><div class="spinner"></div> Caricamento...</div>';
  if(typeof cercaAzzera === "function" && loadHorseEvents.ultimo !== horseId) cercaAzzera("eventi");
  loadHorseEvents.ultimo = horseId;
  const [data, spost] = await Promise.all([DB.listEvents(horseId), DB.spostamentiCavallo("proprietario", horseId)]);
  currentHorseEventsData = data || [];
  if((!data || data.length === 0) && !spost.length){
    box.innerHTML = '<div class="muted" style="font-size:13px">Nessun evento registrato.</div>';
    return;
  }
  const voci = [...(data || []).map(ev => ({ d: ev.date || "", ev })), ...spost.map(s => ({ d: isoLocale(new Date(s.creato)), s }))].sort((a, b) => b.d.localeCompare(a.d));
  box.innerHTML = voci.map(({ ev, s }) => s ? spostamentoHtml(s) : `
    <div class="event-item" style="cursor:pointer" onclick="openEditEventModal('${ev.id}')">
      <div>
        <div style="font-weight:600;font-size:14px">${EVENT_LABELS[ev.type] || ev.type}</div>
        <div class="muted" style="font-size:12px">${formatDate(ev.date)}${ev.notes ? " · " + escapeHtml(ev.notes) : ""}</div>
      </div>
      ${ev.next_due_date ? `<span class="badge ${deadlineBadgeClass(ev.next_due_date)}">${formatDate(ev.next_due_date)}</span>` : ""}
    </div>
  `).join("");
}

let editingEventId = null;
let currentHorseEventsData = [];
function openAddEventModal(){
  editingEventId = null;
  document.getElementById("modal-add-event-title").textContent = "Nuovo evento sanitario";
  document.getElementById("event-type").value = "vaccino";
  document.getElementById("event-date").value = "";
  document.getElementById("event-next-date").value = "";
  document.getElementById("event-notes").value = "";
  document.getElementById("event-delete-btn").style.display = "none";
  const notaAltrui = document.getElementById("event-altrui-nota"); if(notaAltrui) notaAltrui.style.display = "none";
  openModal("modal-add-event");
}

function openEditEventModal(id){
  const ev = currentHorseEventsData.find(e => e.id === id);
  if(!ev) return;
  editingEventId = id;
  document.getElementById("modal-add-event-title").textContent = "Modifica evento";
  document.getElementById("event-type").value = ev.type;
  document.getElementById("event-date").value = ev.date;
  document.getElementById("event-next-date").value = ev.next_due_date || "";
  document.getElementById("event-notes").value = ev.notes || "";
  // voce scritta da altri (scuderia o maniscalco): può cancellarla solo chi l'ha registrata
  const altrui = ev.origine && ev.origine !== "proprietario";
  const btnDel = document.getElementById("event-delete-btn");
  btnDel.style.display = altrui ? "none" : "block";
  let nota = document.getElementById("event-altrui-nota");
  if(!nota){ nota = document.createElement("div"); nota.id = "event-altrui-nota"; nota.className = "muted"; nota.style.cssText = "font-size:12px;line-height:1.5;margin-top:8px;text-align:center"; btnDel.after(nota); }
  nota.textContent = altrui ? (ev.origine === "scuderia" ? "Voce registrata dalla scuderia: può cancellarla solo la scuderia." : "Voce registrata dal maniscalco: può cancellarla solo il maniscalco.") : "";
  nota.style.display = altrui ? "block" : "none";
  openModal("modal-add-event");
}

async function saveHorseEvent(){
  if(!currentHorseId) return;
  const type = document.getElementById("event-type").value;
  const date = document.getElementById("event-date").value;
  const next_due_date = document.getElementById("event-next-date").value || null;
  const notes = document.getElementById("event-notes").value.trim();
  if(!date) return;
  const payload = { horse_id: currentHorseId, type, date, next_due_date, notes };
  const { error } = editingEventId ? await DB.updateEvent(editingEventId, payload) : await DB.insertEvent(payload);
  if(error){ alert("Errore: " + error.message); return; }
  document.getElementById("event-date").value = "";
  document.getElementById("event-next-date").value = "";
  document.getElementById("event-notes").value = "";
  editingEventId = null;
  closeModal("modal-add-event");
  await loadHorseEvents(currentHorseId);
}

async function deleteHorseEventFromModal(){
  if(!editingEventId) return;
  if(!confirm("Eliminare questo evento?")) return;
  await DB.deleteEvent(editingEventId, currentHorseId);
  editingEventId = null;
  closeModal("modal-add-event");
  await loadHorseEvents(currentHorseId);
}
// nome vecchio
const createHorseEvent = saveHorseEvent;

function deadlineBadgeClass(dateStr){
  const days = (new Date(dateStr) - new Date()) / 86400000;
  if(days < 0) return "badge-red";
  if(days < 14) return "badge-accent";
  return "badge-green";
}

async function loadDeadlines(){
  const box = document.getElementById("home-deadlines");
  const horseIds = horses.map(h => h.id);
  if(horseIds.length === 0){ box.innerHTML = '<div class="muted" style="font-size:13px">Nessuna scadenza.</div>'; return; }
  const data = await DB.listUpcomingDeadlines(horseIds, 5);
  if(!data || data.length === 0){
    box.innerHTML = '<div class="muted" style="font-size:13px">Nessuna scadenza in arrivo.</div>';
    document.getElementById("stat-deadlines").textContent = "0";
    return;
  }
  document.getElementById("stat-deadlines").textContent = data.filter(d => (new Date(d.next_due_date) - new Date())/86400000 < 30).length;
  box.innerHTML = data.map(d => `
    <div class="deadline-item">
      <div class="deadline-dot ${deadlineBadgeClass(d.next_due_date) === 'badge-red' ? 'late' : deadlineBadgeClass(d.next_due_date) === 'badge-accent' ? 'soon' : 'ok'}"></div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:600">${EVENT_LABELS[d.type] || d.type} · ${escapeHtml(d.horses?.name || "")}</div>
        <div class="muted" style="font-size:12px">${formatDate(d.next_due_date)}</div>
      </div>
    </div>
  `).join("");
}

