// Equo App · cavalli · modulo (moduli ES, costruiti con Vite in ruoli/cavalli/costruito.js)
import { loadCavalli, renderCavalliList } from "./039-cavalli-salute.js";
import { openModal } from "./061-modalita-stalla-schermo-intero-per-table.js";
/* ---------- IMPORT CAVALLI dopo collegamento proprietario (chat/codice) ---------- */
let importCavalliPendenti = [];
let importCavalliMembroId = null;
let importCavalliOnDone = null;

// Dopo aver collegato un proprietario, controlla se ha cavalli su Equo App non
// ancora presenti in questa scuderia; se sì mostra un popup con checkbox per
// sceglierne l'import, altrimenti prosegue subito con onDone().
async function proponiImportCavalli(membroId, nome, onDone){
  if(DEMO_MODE){ onDone(); return; }
  try{
    const { data, error } = await sb.rpc("cavalli_da_importare", { p_membro_id: membroId });
    if(error || !data || data.length === 0){ onDone(); return; }
    importCavalliMembroId = membroId;
    importCavalliOnDone = onDone;
    importCavalliPendenti = data;
    renderImportCavalliList(nome);
    openModal("modal-import-cavalli");
  } catch(err){
    onDone();
  }
}

function renderImportCavalliList(nome){
  const n = importCavalliPendenti.length;
  document.getElementById("import-cavalli-title").textContent =
    `${nome} ha ${n === 1 ? "un cavallo" : n + " cavalli"} sul suo profilo Equo App non ancora in scheda qui. Seleziona quelli da importare.`;
  document.getElementById("import-cavalli-list").innerHTML = importCavalliPendenti.map(h => `
    <label style="display:flex;align-items:center;gap:10px;padding:8px 2px;border-bottom:1px solid var(--border)">
      <input type="checkbox" class="import-cavallo-check" value="${h.id}" style="width:18px;height:18px;flex-shrink:0">
      <div>
        <div style="font-weight:600">${escapeHtml(h.name || "Cavallo")}</div>
        <div style="color:var(--muted);font-size:12px">${escapeHtml([h.breed, h.microchip ? "Microchip " + h.microchip : null].filter(Boolean).join(" · ") || "—")}</div>
      </div>
    </label>`).join("");
}

async function confermaImportCavalli(){
  const ids = Array.from(document.querySelectorAll(".import-cavallo-check:checked")).map(el => el.value);
  closeModal("modal-import-cavalli");
  if(ids.length > 0){
    let ok = 0;
    const errori = [];
    for(const horseId of ids){
      const { error } = await sb.rpc("importa_cavallo_scuderia", { p_horse_id: horseId, p_membro_id: importCavalliMembroId });
      if(!error) ok++;
      else {
        const nome = (importCavalliPendenti.find(h => h.id === horseId) || {}).name || "cavallo";
        errori.push(`${nome}: ${error.message || "errore"}`);
      }
    }
    if(ok > 0){
      await loadCavalli();
      renderCavalliList();
    }
    if(errori.length === 0){
      if(ok > 0) showToast(ok === 1 ? "Cavallo importato." : `${ok} cavalli importati.`);
    } else {
      showToast((ok > 0 ? `${ok} importat${ok === 1 ? "o" : "i"}, ` : "") + `non importat${errori.length === 1 ? "o" : "i"}: ` + errori.join(" · "));
    }
  }
  importCavalliPendenti = [];
  const onDone = importCavalliOnDone; importCavalliOnDone = null;
  if(onDone) onDone();
}

function saltaImportCavalli(){
  closeModal("modal-import-cavalli");
  importCavalliPendenti = [];
  const onDone = importCavalliOnDone; importCavalliOnDone = null;
  if(onDone) onDone();
}

async function loadMessaggi(){
  if(DEMO_MODE){ messaggiList = demoState.messaggi; return; }
  const { data, error } = await sb.from("scuderia_messaggi")
    .select("id, centro_id, mittente_id, destinatario_tipo, destinatario_ruolo, destinatario_membro_id, testo, priorita, created_at")
    .eq("centro_id", currentCentro.id)
    .order("created_at", { ascending: false });
  if(!error) messaggiList = data || [];
}

function destinatarioLabel(m){
  if(m.destinatario_tipo === "tutti") return "Tutto il centro";
  if(m.destinatario_tipo === "ruolo") return "Per ruolo: " + (RUOLO_LABELS[m.destinatario_ruolo] || m.destinatario_ruolo);
  const nome = m.destinatario_nome || membroNome(m.destinatario_membro_id);
  return "A: " + nome;
}

function renderMessaggi(){
  const list = document.getElementById("messaggi-list");
  const empty = document.getElementById("messaggi-empty");
  list.innerHTML = "";
  empty.style.display = messaggiList.length === 0 ? "block" : "none";

  messaggiList.forEach(m => {
    const mittente = m.mittente_nome || membroNome(m.mittente_id) || "Un membro";
    const div = document.createElement("div");
    div.className = "msg-item";
    div.innerHTML = `
      <div class="head">
        <span class="who">${escapeHtml(mittente)} <span style="color:var(--muted);font-weight:400">→ ${escapeHtml(destinatarioLabel(m))}</span></span>
        <span style="display:flex;align-items:center;gap:8px">
          ${m.priorita === "urgente" ? `<span class="badge-pill badge-red">Urgente</span>` : ""}
          <span class="when">${formatDateTime(m.created_at)}</span>
        </span>
      </div>
      <div class="body">${escapeHtml(m.testo)}</div>`;
    list.appendChild(div);
  });
}

function toggleDestinatarioMsg(){
  const tipo = document.getElementById("msg-destinatario").value;
  document.getElementById("msg-ruolo-field").style.display = tipo === "ruolo" ? "block" : "none";
  document.getElementById("msg-membro-field").style.display = tipo === "singolo" ? "block" : "none";
  if(tipo === "singolo"){
    const sel = document.getElementById("msg-membro");
    sel.innerHTML = teamList.filter(m => m.user_id !== currentUser.id)
      .map(m => `<option value="${m.id}">${escapeHtml(m.nome_visualizzato || RUOLO_LABELS[m.ruolo])}</option>`).join("");
  }
}

function openMessaggioForm(){
  document.getElementById("messaggio-error").style.display = "none";
  document.getElementById("msg-destinatario").value = "tutti";
  document.getElementById("msg-testo").value = "";
  document.getElementById("msg-priorita").value = "normale";
  toggleDestinatarioMsg();
  openModal("modal-messaggio");
}

async function saveMessaggio(){
  const testo = document.getElementById("msg-testo").value.trim();
  const errBox = document.getElementById("messaggio-error");
  errBox.style.display = "none";
  if(!testo){ errBox.textContent = "Scrivi un messaggio prima di inviare."; errBox.style.display = "block"; return; }

  const destinatario_tipo = document.getElementById("msg-destinatario").value;
  const destinatario_ruolo = destinatario_tipo === "ruolo" ? document.getElementById("msg-ruolo").value : null;
  const destinatario_membro_id = destinatario_tipo === "singolo" ? document.getElementById("msg-membro").value : null;
  const priorita = document.getElementById("msg-priorita").value;

  try{
    if(DEMO_MODE){
      demoState.messaggi.unshift({
        id:"msg" + (demoIdCounter++ + 400), centro_id: demoState.centro.id,
        mittente_id: currentMembro ? "m1" : null, mittente_nome: currentMembro?.nome_visualizzato || "Tu (admin)",
        destinatario_tipo, destinatario_ruolo, destinatario_nome: destinatario_membro_id ? membroNome(destinatario_membro_id) : null,
        testo, priorita, created_at: new Date().toISOString(),
      });
    } else {
      const { error } = await sb.from("scuderia_messaggi").insert({
        centro_id: currentCentro.id, mittente_id: currentMembroId(), destinatario_tipo, destinatario_ruolo, destinatario_membro_id, testo, priorita,
      });
      if(error) throw error;
    }
    await loadMessaggi();
    renderMessaggi();
    closeModal("modal-messaggio");
    showToast("Messaggio inviato.");
  } catch(err){
    errBox.textContent = err.message || "Errore nell'invio.";
    errBox.style.display = "block";
  }
}

function currentMembroId(){
  const m = teamList.find(x => x.user_id === currentUser.id);
  return m ? m.id : null;
}

function formatDateTime(iso){
  if(!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("it-IT") + " " + d.toLocaleTimeString("it-IT", { hour:"2-digit", minute:"2-digit" });
}


export { confermaImportCavalli, currentMembroId, loadMessaggi, openMessaggioForm, proponiImportCavalli, renderMessaggi, saltaImportCavalli, saveMessaggio, toggleDestinatarioMsg };
