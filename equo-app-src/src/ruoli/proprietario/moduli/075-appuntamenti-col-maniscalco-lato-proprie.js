// Equo App · proprietario · modulo (moduli ES, costruiti con Vite in ruoli/proprietario/costruito.js)
import { loadFarrierChatSection } from "./073-chat-col-proprio-maniscalco-lato-proprie.js";
import { vistaWidgetAttiva } from "./089-early-adopter-arrivo-dal-sito-ottobre-20.js";
import { wgCaricaOwner, wgOwn } from "./101-proprietario.js";
/* ---------- APPUNTAMENTI COL MANISCALCO (lato proprietario, Step 5d) ---------- */
const STATO_APP_LABEL = {
  richiesto: ['In attesa', 'background:rgba(232,176,75,.18);color:var(--accent)'],
  programmato: ['Confermato', 'background:rgba(92,200,143,.18);color:var(--green)'],
  rifiutato: ['Non disponibile', 'background:rgba(0,0,0,.07);color:var(--muted)'],
};

async function apriAppuntamentiManiscalco(){
  if(!currentFarrier) return;
  if(!horses || horses.length === 0) horses = await DB.listHorses();
  const sel = document.getElementById("rich-cavallo");
  sel.innerHTML = (horses || []).map(h => `<option value="${escapeHtml(h.id)}">${escapeHtml(h.name || "Cavallo")}</option>`).join("")
    + '<option value="__altro__">Altro cavallo…</option>';
  sel.value = horses && horses.length ? horses[0].id : "__altro__";
  document.getElementById("rich-tipo").value = "ferratura";
  ["rich-cavallo-nome", "rich-tipo-altro", "rich-ora", "rich-note"].forEach(id => document.getElementById(id).value = "");
  const domani = aggiungiGiorniIso(isoLocale(new Date()), 1);
  document.getElementById("rich-data").value = domani;
  document.getElementById("rich-data").min = isoLocale(new Date());
  document.getElementById("rich-error").style.display = "none";
  toggleRichiestaCampi();
  openModal("modal-appuntamenti-maniscalco");
  await renderAppuntamentiManiscalco();
}

function toggleRichiestaCampi(){
  document.getElementById("rich-cavallo-nome-group").style.display = document.getElementById("rich-cavallo").value === "__altro__" ? "flex" : "none";
  document.getElementById("rich-tipo-altro-group").style.display = document.getElementById("rich-tipo").value === "altro" ? "flex" : "none";
}

async function renderAppuntamentiManiscalco(){
  const box = document.getElementById("app-man-list");
  if(!currentFarrier){ box.innerHTML = ""; return; }
  box.innerHTML = '<div class="loading"><div class="spinner"></div> Caricamento...</div>';
  const lista = await DB.listAppuntamentiCliente(currentFarrier.cliente_mascalcia_id);
  if(!lista.length){
    box.innerHTML = '<div class="muted" style="font-size:13px">Nessun appuntamento in programma.</div>';
    return;
  }
  box.innerHTML = lista.map(a => {
    const [lbl, stile] = STATO_APP_LABEL[a.stato] || [a.stato, ""];
    let tipo = TIPO_FERRATURA_LABELS[a.tipo_ferratura] || a.tipo_ferratura || "";
    if(a.tipo_ferratura === "altro" && a.tipo_altro) tipo = a.tipo_altro;
    return `
    <div class="rich-item">
      <div style="flex:1;min-width:0">
        <div style="font-size:13.5px;font-weight:600">${formatDataBreve(a.data_intervento)}${a.ora ? " · " + String(a.ora).slice(0, 5) : ""}</div>
        <div class="muted" style="font-size:12px">${escapeHtml(tipo)}${a.nome_cavallo ? " · " + escapeHtml(a.nome_cavallo) : ""}</div>
      </div>
      <span class="app-man-stato" style="${stile}">${lbl}</span>
      ${a.stato === "richiesto" ? `<button class="btn btn-outline btn-sm" onclick="annullaRichiestaAppuntamento('${a.id}')">Annulla</button>` : ""}
    </div>${a.modifica && a.modifica.prima ? `
    <div class="nota-modifica lunga" style="margin:-4px 0 10px">✏️ Modificato dal maniscalco · prima era: ${escapeHtml(testoPrimaModifica(a.modifica))}
      <button class="btn btn-primary btn-sm" style="display:block;margin-top:6px" onclick="vistoModificaAppuntamento('${a.id}', this)">Ok, ho visto</button></div>` : ""}`;
  }).join("");
}

// il proprietario conferma di aver visto la modifica: sparisce l'avviso e il maniscalco lo legge in chat
async function vistoModificaAppuntamento(id, btn){
  if(btn) btn.disabled = true;
  if(DEMO_MODE){
    const i = demoState.interventiMascalcia.find(x => x.id === id); if(i) i.modifica = null;
  } else {
    const { data, error } = await sb.rpc("prop_visto_modifica_appuntamento", { p_intervento_id: id });
    if(error || !data?.ok){ if(btn) btn.disabled = false; showToast((data && data.errore) || "Non riuscito, riprova."); return; }
  }
  showToast("Fatto: il maniscalco sa che hai visto la modifica.");
  wgOwn.caricato = 0;
  if(currentFarrier){ await renderAppuntamentiManiscalco(); try{ await renderFarrierChatThread(); } catch(e){} }
  if(vistaWidgetAttiva() && vistaAi() === "proprietario") wgCaricaOwner();
}

async function inviaRichiestaAppuntamento(){
  if(!currentFarrier) return;
  const errBox = document.getElementById("rich-error");
  const errore = msg => { errBox.textContent = msg; errBox.style.display = "block"; };
  errBox.style.display = "none";
  const cav = document.getElementById("rich-cavallo").value;
  const horse_id = cav && cav !== "__altro__" ? cav : null;
  const nome_cavallo = cav === "__altro__" ? document.getElementById("rich-cavallo-nome").value.trim() : null;
  const tipo = document.getElementById("rich-tipo").value;
  const tipo_altro = tipo === "altro" ? document.getElementById("rich-tipo-altro").value.trim() : null;
  const data = document.getElementById("rich-data").value;
  const ora = document.getElementById("rich-ora").value || null;
  const note = document.getElementById("rich-note").value.trim() || null;
  if(cav === "__altro__" && !nome_cavallo) return errore("Scrivi il nome del cavallo.");
  if(tipo === "altro" && !tipo_altro) return errore("Specifica il tipo di intervento.");
  if(!data || data < isoLocale(new Date())) return errore("Scegli una data da oggi in poi.");
  const btn = document.getElementById("rich-btn");
  btn.disabled = true;
  const { error } = await DB.richiediAppuntamento({ cliente_mascalcia_id: currentFarrier.cliente_mascalcia_id, horse_id, nome_cavallo, tipo, tipo_altro, data, ora, note });
  btn.disabled = false;
  if(error) return errore("Invio non riuscito: " + (error.message || "riprova"));
  showToast("Richiesta inviata al maniscalco");
  document.getElementById("rich-note").value = "";
  await renderAppuntamentiManiscalco();
  await renderFarrierChatThread();
  loadFarrierChatSection();
}

async function annullaRichiestaAppuntamento(id){
  if(!confirm("Annullare questa richiesta?")) return;
  const { error } = await DB.annullaRichiesta(id);
  if(error){ showToast("Errore: " + (error.message || "")); return; }
  showToast("Richiesta annullata");
  await renderAppuntamentiManiscalco();
  await renderFarrierChatThread();
}


export { annullaRichiestaAppuntamento, apriAppuntamentiManiscalco, inviaRichiestaAppuntamento, toggleRichiestaCampi, vistoModificaAppuntamento };
