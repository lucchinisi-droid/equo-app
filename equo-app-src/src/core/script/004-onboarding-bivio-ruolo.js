/* ---------- ONBOARDING (bivio ruolo) ---------- */
const ROLE_LABELS = {
  proprietario: "Proprietario",
  maniscalco: "Maniscalco",
  veterinario: "Veterinario",
  istruttore: "Istruttore/Trainer",
  gestore_struttura: "Gestore centro ippico",
};
const PRO_ROLES = ["maniscalco", "veterinario", "istruttore"];
const PRO_ACTION_LABELS = {
  maniscalco: "Ferratura completata",
  veterinario: "Visita completata",
  istruttore: "Lezione completata",
};

function showOnboardingStep(step){
  document.getElementById("onb-step-1").style.display = step === 1 ? "flex" : "none";
  document.getElementById("onb-step-2").style.display = step === 2 ? "flex" : "none";
  document.getElementById("onb-error").style.display = "none";
  // la dichiarazione età + accettazione Termini/Privacy si chiede una sola volta,
  // al primo onboarding: chi ha già consenso salvato (currentUser.consensoTerminiPrivacy)
  // non la rivede più quando cambia semplicemente ruolo in seguito.
  const consentGroup = document.getElementById("onb-consent-group");
  if(consentGroup) consentGroup.style.display = (DEMO_MODE || (currentUser && currentUser.consensoTerminiPrivacy)) ? "none" : "block";
}

async function chooseMainRole(ruolo){
  const errBox = document.getElementById("onb-error");
  errBox.style.display = "none";
  if(DEMO_MODE){
    currentUser.ruolo = ruolo;
    document.getElementById("screen-onboarding").classList.remove("active");
    await enterApp(ruolo);
    return;
  }
  const consentGroup = document.getElementById("onb-consent-group");
  const needsConsent = consentGroup && consentGroup.style.display !== "none";
  if(needsConsent && !document.getElementById("onb-consent").checked){
    errBox.textContent = "Devi accettare i Termini e l'Informativa Privacy per continuare.";
    errBox.style.display = "block";
    return;
  }
  try{
    // upsert (non update): un utente arrivato via Google potrebbe non avere
    // ancora una riga in profiles, quindi va creata qui se manca.
    const payload = { id: currentUser.id, email: currentUser.email, ruolo };
    if(needsConsent){
      payload.consenso_termini_privacy = new Date().toISOString();
      payload.dichiarazione_eta = true;
    }
    const { error } = await sb.from("profiles").upsert(payload);
    if(error) throw error;
    currentUser.ruolo = ruolo;
    if(needsConsent) currentUser.consensoTerminiPrivacy = payload.consenso_termini_privacy;
    document.getElementById("screen-onboarding").classList.remove("active");
    await enterApp(ruolo);
  } catch(e){
    errBox.textContent = "Non sono riuscito a salvare la scelta, riprova.";
    errBox.style.display = "block";
  }
}

