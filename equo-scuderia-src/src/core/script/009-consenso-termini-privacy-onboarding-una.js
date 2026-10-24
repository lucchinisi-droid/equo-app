/* ---------- CONSENSO TERMINI/PRIVACY (onboarding, una sola volta per account) ----------
   profiles è condivisa con Equo App: se l'utente ha già accettato lì, non lo richiediamo di nuovo. */
function consentStillNeeded(){
  const group = document.getElementById("onb-consent-group");
  return group && group.style.display !== "none";
}
function checkConsentOrBlock(){
  if(!consentStillNeeded()) return true;
  const errBox = document.getElementById("onb-consent-error");
  if(!document.getElementById("onb-consent").checked){
    errBox.textContent = "Devi accettare i Termini e l'Informativa Privacy per continuare.";
    errBox.style.display = "block";
    return false;
  }
  errBox.style.display = "none";
  return true;
}
async function saveConsentIfNeeded(){
  if(!consentStillNeeded() || DEMO_MODE) return;
  const consenso_termini_privacy = new Date().toISOString();
  await sb.from("profiles").upsert({ id: currentUser.id, email: currentUser.email, consenso_termini_privacy });
  currentUser.consensoTerminiPrivacy = consenso_termini_privacy;
}

async function createCentro(){
  const nome = document.getElementById("centro-nome").value.trim();
  const indirizzo = document.getElementById("centro-indirizzo").value.trim();
  const telefono = document.getElementById("centro-telefono").value.trim();
  const errBox = document.getElementById("create-centro-error");
  errBox.style.display = "none";
  if(!nome){ errBox.textContent = "Inserisci il nome del centro."; errBox.style.display = "block"; return; }
  if(!checkConsentOrBlock()) return;

  const join_code = "EQUO" + Array.from({ length: 5 }, () => "0123456789ABCDEFGHJKMNPQRSTUVWXYZ"[Math.floor(Math.random() * 33)]).join("");   // senza trattini e senza I, L, O
  try{
    const { data, error } = await sb.from("centri").insert({
      nome, indirizzo: indirizzo || null, telefono: telefono || null,
      join_code, owner_id: currentUser.id,
    }).select().single();
    if(error) throw error;
    await saveConsentIfNeeded();
    currentCentro = data;
    currentMembro = { ruolo:"admin", nome_visualizzato:null, livello:"admin", permessi:{} };
    await loadTeam();
    enterAppShell();
    showToast("Centro creato! Sei l'amministratore.");
  } catch(err){
    errBox.textContent = err.message || "Errore nella creazione del centro.";
    errBox.style.display = "block";
  }
}

async function joinCentro(){
  const code = document.getElementById("join-code").value.trim().toUpperCase();
  const ruolo = document.getElementById("join-ruolo").value;
  const errBox = document.getElementById("join-centro-error");
  errBox.style.display = "none";
  if(!code){ errBox.textContent = "Inserisci un codice invito."; errBox.style.display = "block"; return; }
  if(!checkConsentOrBlock()) return;

  try{
    const { data, error } = await sb.rpc("join_centro_by_code", {
      p_join_code: code, p_ruolo: ruolo, p_nome_visualizzato: null,
    });
    if(error) throw error;
    await saveConsentIfNeeded();
    await afterLogin();
    showToast("Ti sei unito al centro!");
  } catch(err){
    errBox.textContent = err.message || "Codice non valido.";
    errBox.style.display = "block";
  }
}

