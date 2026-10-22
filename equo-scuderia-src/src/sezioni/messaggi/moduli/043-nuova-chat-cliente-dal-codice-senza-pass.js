// Equo App · messaggi · modulo (moduli ES, costruiti con Vite in ruoli/messaggi/costruito.js)
import { chattaConMembro } from "./014-chat-interna-membro-equo-app-struttura.js";
/* ---------- NUOVA CHAT CLIENTE (dal codice, senza passare da un cavallo) ---------- */
function openNuovaChatClienteForm(){
  document.getElementById("nuova-chat-cliente-error").style.display = "none";
  document.getElementById("nuova-chat-codice").value = "";
  openModal("modal-nuova-chat-cliente");
  setTimeout(() => document.getElementById("nuova-chat-codice")?.focus(), 100);
}

async function avviaNuovaChatCliente(){
  const codice = document.getElementById("nuova-chat-codice").value.trim().toUpperCase();
  const errBox = document.getElementById("nuova-chat-cliente-error");
  errBox.style.display = "none";
  if(!codice){ errBox.textContent = "Inserisci il codice del proprietario."; errBox.style.display = "block"; return; }

  const btn = document.getElementById("nuova-chat-cliente-btn");
  btn.disabled = true;
  try{
    const esito = await collegaProprietarioDaCodice(codice, null, null);
    if(!esito.ok){ errBox.textContent = esito.error; errBox.style.display = "block"; return; }
    closeModal("modal-nuova-chat-cliente");
    await proponiImportCavalli(esito.membroId, esito.nome || "il proprietario", () => chattaConMembro(esito.membroId));
  } finally {
    btn.disabled = false;
  }
}

function askDeleteCavallo(){
  cavalloToDelete = currentCavalloId;
  openModal("modal-delete-cavallo");
}

async function confirmDeleteCavallo(){
  if(!cavalloToDelete) return;
  if(DEMO_MODE){
    demoState.cavalli = demoState.cavalli.filter(c => c.id !== cavalloToDelete);
    demoState.eventi = demoState.eventi.filter(e => e.cavallo_id !== cavalloToDelete);
  } else {
    const { error } = await sb.from("scuderia_cavalli").delete().eq("id", cavalloToDelete);
    if(error){ showToast("Errore nell'eliminazione."); closeModal("modal-delete-cavallo"); return; }
  }
  closeModal("modal-delete-cavallo");
  closeCavalloDetail();
  await loadCavalli();
  await loadEventiAll();
  renderCavalliList();
  showToast("Cavallo eliminato.");
}

let editingEventoId = null;

function toggleEventoAltro(){
  const tipo = document.getElementById("ev-tipo").value;
  document.getElementById("ev-tipo-altro-field").style.display = tipo === "altro" ? "block" : "none";
}

function openEventoForm(id){
  editingEventoId = id || null;
  document.getElementById("evento-error").style.display = "none";
  document.getElementById("modal-evento-title").textContent = editingEventoId ? "Modifica evento sanitario" : "Registra evento sanitario";
  document.getElementById("evento-save-btn").textContent = editingEventoId ? "Salva modifiche" : "Salva evento";
  if(editingEventoId){
    const e = eventiAll.find(x => x.id === editingEventoId);
    document.getElementById("ev-tipo").value = e?.tipo || "vaccino";
    document.getElementById("ev-tipo-altro").value = e?.tipo_altro || "";
    document.getElementById("ev-data").value = e?.data_evento || "";
    document.getElementById("ev-scadenza").value = e?.data_scadenza || "";
    document.getElementById("ev-note").value = e?.note || "";
  } else {
    document.getElementById("ev-tipo").value = "vaccino";
    document.getElementById("ev-tipo-altro").value = "";
    document.getElementById("ev-data").value = isoLoc(new Date());
    document.getElementById("ev-scadenza").value = "";
    document.getElementById("ev-note").value = "";
  }
  toggleEventoAltro();
  openModal("modal-evento");
}

async function saveEvento(){
  const tipo = document.getElementById("ev-tipo").value;
  const tipo_altro = tipo === "altro" ? (document.getElementById("ev-tipo-altro").value.trim() || null) : null;
  const data_evento = document.getElementById("ev-data").value;
  const data_scadenza = document.getElementById("ev-scadenza").value || null;
  const note = document.getElementById("ev-note").value.trim() || null;
  const errBox = document.getElementById("evento-error");
  errBox.style.display = "none";
  if(!data_evento){ errBox.textContent = "Inserisci la data dell'evento."; errBox.style.display = "block"; return; }

  try{
    if(DEMO_MODE){
      if(editingEventoId){
        const idx = demoState.eventi.findIndex(x => x.id === editingEventoId);
        if(idx >= 0) demoState.eventi[idx] = { ...demoState.eventi[idx], tipo, tipo_altro, data_evento, data_scadenza, note, updated_at: new Date().toISOString() };
      } else {
        demoState.eventi.push({ id:"e" + (demoIdCounter++ + 100), centro_id: demoState.centro.id, cavallo_id: currentCavalloId, tipo, tipo_altro, data_evento, data_scadenza, note, creato_da: currentMembroId(), updated_at: new Date().toISOString() });
      }
    } else if(editingEventoId){
      const { error } = await sb.from("scuderia_eventi_sanitari").update({ tipo, tipo_altro, data_evento, data_scadenza, note }).eq("id", editingEventoId);
      if(error) throw error;
    } else {
      const { error } = await sb.from("scuderia_eventi_sanitari").insert({ centro_id: currentCentro.id, cavallo_id: currentCavalloId, tipo, tipo_altro, data_evento, data_scadenza, note, creato_da: currentMembroId() });
      if(error) throw error;
    }
    await loadEventiAll();
    renderCavalloDetail();
    closeModal("modal-evento");
    showToast(editingEventoId ? "Evento aggiornato." : "Evento registrato.");
  } catch(err){
    errBox.textContent = err.message || "Errore nel salvataggio.";
    errBox.style.display = "block";
  }
}

function askDeleteEvento(id){
  eventoToDelete = id;
  openModal("modal-delete-evento");
}

async function confirmDeleteEvento(){
  if(!eventoToDelete) return;
  if(DEMO_MODE){
    demoState.eventi = demoState.eventi.filter(e => e.id !== eventoToDelete);
  } else {
    const { error } = await sb.from("scuderia_eventi_sanitari").delete().eq("id", eventoToDelete);
    if(error){ showToast(error.message && /può cancellarla/.test(error.message) ? error.message : "Errore nell'eliminazione."); closeModal("modal-delete-evento"); return; }
  }
  await loadEventiAll();
  renderCavalloDetail();
  closeModal("modal-delete-evento");
  showToast("Evento eliminato.");
}

function formatDate(iso){
  if(!iso) return "—";
  const [y,m,d] = iso.split("-");
  return `${d}/${m}/${y}`;
}


export { askDeleteCavallo, askDeleteEvento, avviaNuovaChatCliente, confirmDeleteCavallo, confirmDeleteEvento, formatDate, openEventoForm, openNuovaChatClienteForm, saveEvento, toggleEventoAltro };
