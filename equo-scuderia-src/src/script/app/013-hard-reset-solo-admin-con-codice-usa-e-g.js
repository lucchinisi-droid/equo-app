/* ---------- HARD RESET (solo admin, con codice usa e getta fornito da Equo) ----------
   La cancellazione avviene SOLO nella funzione SQL esegui_hard_reset (verifica admin + codice).
   Codice generato da Equo con: select genera_codice_reset('<nome o id centro>', '<tipo>');
   (vedi Claude outputs/migrazione-scuderia-hard-reset-otp.sql). */
const RESET_LABELS = { cavalli:"Cavalli (e storico sanitario)", eventi:"Eventi sanitari", lezioni:"Lezioni", pacchetti:"Pacchetti/abbonamenti", messaggi:"Messaggi", note:"Post-it", totale:"TUTTO (reset totale)" };
const RESET_DEMO_TABLES = {
  cavalli:["scuderia_eventi_sanitari","scuderia_cavalli"], eventi:["scuderia_eventi_sanitari"], lezioni:["scuderia_lezioni"],
  pacchetti:["scuderia_pacchetti"], messaggi:["scuderia_messaggi"], note:["scuderia_note"],
  totale:["scuderia_note","scuderia_messaggi","scuderia_pacchetti","scuderia_lezioni","scuderia_eventi_sanitari","scuderia_cavalli","scuderia_contatti","scuderia_dati_fiscali"],
};
let pendingHardReset = null;

function refreshHardResetCard(){
  const isAdminUser = currentMembro?.ruolo === "admin";
  const card = document.getElementById("card-hard-reset");
  if(card) card.style.display = isAdminUser ? "block" : "none";
  chiudiHardReset(); // di default sempre CHIUSO
}
function chiudiHardReset(){
  const body = document.getElementById("hard-reset-body");
  if(body) body.style.display = "none";
  const btn = document.getElementById("hard-reset-toggle"); if(btn) btn.textContent = "Apri";
  const lock = document.getElementById("hard-reset-lock"); if(lock) lock.className = "fa-solid fa-lock";
}
function toggleHardReset(){
  const body = document.getElementById("hard-reset-body");
  if(body.style.display === "none"){
    body.style.display = "block";
    document.getElementById("hard-reset-toggle").textContent = "Chiudi";
    document.getElementById("hard-reset-lock").className = "fa-solid fa-lock-open";
  } else chiudiHardReset();
}

function richiediCodiceReset(){
  const tipo = document.getElementById("reset-modulo-select").value;
  const oggetto = `Richiesta codice Hard Reset — ${currentCentro?.nome || "centro"}`;
  const corpo = `Ciao Equo,\n\nchiedo un codice usa e getta per l'Hard Reset.\n\n`
    + `Centro: ${currentCentro?.nome || "—"}\nID centro: ${currentCentro?.id || "—"}\nCosa cancellare: ${RESET_LABELS[tipo]}\n`
    + `Richiesto da: ${currentUser?.email || "—"}\n\n`
    + `(Per Equo) Comando da eseguire su Supabase:\nselect genera_codice_reset('${currentCentro?.id || ""}', '${tipo}');\n`;
  window.location.href = `mailto:gestione.equo@gmail.com?subject=${encodeURIComponent(oggetto)}&body=${encodeURIComponent(corpo)}`;
  showToast("Si apre la tua email: invia la richiesta a Equo.");
}

function askHardReset(){
  const tipo = document.getElementById("reset-modulo-select").value;
  pendingHardReset = { tipo };
  document.getElementById("hard-reset-code-input").value = "";
  document.getElementById("hard-reset-error").style.display = "none";
  document.getElementById("hard-reset-desc").innerHTML = (tipo === "totale"
    ? "Stai per cancellare definitivamente <strong>TUTTI</strong> i dati operativi del centro (cavalli, eventi sanitari, lezioni, pacchetti, messaggi, post-it, contatti, dati societari). Centro e team resteranno."
    : `Stai per cancellare definitivamente tutti i dati di: <strong>${escapeHtml(RESET_LABELS[tipo])}</strong>. Operazione irreversibile.`)
    + (DEMO_MODE ? "<br><em>Demo: usa il codice 123456.</em>" : "");
  openModal("modal-hard-reset");
  setTimeout(() => document.getElementById("hard-reset-code-input").focus(), 50);
}

async function confirmHardReset(){
  if(!pendingHardReset) return;
  const codice = document.getElementById("hard-reset-code-input").value.replace(/\D/g, "");
  const errBox = document.getElementById("hard-reset-error");
  const btn = document.getElementById("hard-reset-confirm-btn");
  errBox.style.display = "none";
  if(codice.length !== 6){ errBox.textContent = "Inserisci il codice di 6 cifre ricevuto da Equo."; errBox.style.display = "block"; return; }
  btn.disabled = true;
  try{
    if(DEMO_MODE){
      if(codice !== "123456") throw new Error("Codice errato.");
      hardResetDemo(RESET_DEMO_TABLES[pendingHardReset.tipo]);
    } else {
      const { data, error } = await sb.rpc("esegui_hard_reset", { p_centro_id: currentCentro.id, p_tipo: pendingHardReset.tipo, p_codice: codice });
      if(error) throw error;
      if(!data?.ok) throw new Error(data?.errore || "Reset non eseguito.");
    }
    closeModal("modal-hard-reset");
    chiudiHardReset();
    showToast("Reset eseguito.");
    pendingHardReset = null;
    await refreshHomeModule();
    await refreshContattiModule();
    await refreshCavalliModule();
    await refreshLezioniModule();
    await refreshPacchettiModule();
    await refreshComunicazioniModule();
  } catch(err){
    errBox.textContent = err.message || "Errore durante il reset.";
    errBox.style.display = "block";
  } finally {
    btn.disabled = false;
  }
}

function hardResetDemo(tables){
  const stateKeyMap = { scuderia_cavalli:"cavalli", scuderia_eventi_sanitari:"eventi", scuderia_lezioni:"lezioni", scuderia_pacchetti:"pacchetti", scuderia_messaggi:"messaggi", scuderia_note:"note", scuderia_contatti:"contatti" };
  tables.forEach(t => {
    if(t === "scuderia_dati_fiscali"){ demoState.datiFiscali = null; datiFiscali = null; return; }
    const key = stateKeyMap[t];
    if(key) demoState[key] = [];
  });
}

