/* ---------- CANDIDATURE VETERINARI E TRAINER (al primo accesso o da «+ Aggiungi profilo») ---------- */
let candOrigine = "app_primo_accesso";
function aggiornaCandidatura(){
  const vet = document.getElementById("cand-professione").value === "veterinario";
  document.getElementById("cand-titolo").textContent = vet ? "Equo per veterinari" : "Equo per istruttori e trainer";
  document.getElementById("cand-ico").className = vet ? "fa-solid fa-stethoscope" : "fa-solid fa-graduation-cap";
}
function apriCandidatura(professione, origine){
  candOrigine = origine || "app_primo_accesso";
  document.getElementById("cand-professione").value = professione === "istruttore" ? "istruttore" : "veterinario";
  aggiornaCandidatura();
  ["cand-telefono","cand-citta","cand-provincia","cand-spec","cand-msg"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("cand-nome").value = currentUser?.fullName || "";
  document.getElementById("cand-email").value = currentUser?.email || "";
  // al primo accesso, se ha già accettato termini e privacy nella schermata, la casella è già spuntata
  const consOnb = document.getElementById("onb-consent");
  document.getElementById("cand-privacy").checked = candOrigine === "app_primo_accesso" && !!consOnb?.checked;
  document.getElementById("cand-error").style.display = "none";
  document.getElementById("cand-form").style.display = "block";
  document.getElementById("cand-ok").style.display = "none";
  openModal("modal-candidatura");
}
async function inviaCandidatura(){
  const v = id => document.getElementById(id).value.trim();
  const errBox = document.getElementById("cand-error");
  const errore = t => { errBox.textContent = t; errBox.style.display = "block"; };
  errBox.style.display = "none";
  const row = { tipo: "candidatura", origine: candOrigine, professione: v("cand-professione"), nome: v("cand-nome"), email: v("cand-email"),
    telefono: v("cand-telefono"), citta: v("cand-citta"), provincia: v("cand-provincia"), messaggio: v("cand-msg") || null,
    dettagli: { specializzazione: v("cand-spec") || null }, consenso_privacy: document.getElementById("cand-privacy").checked ? new Date().toISOString() : null };
  const manca = [["nome","nome e cognome"],["email","email"],["telefono","telefono"],["citta","città"],["provincia","provincia"]].filter(([k]) => !row[k]).map(([, n]) => n);
  if(manca.length) return errore("Compila: " + manca.join(", ") + ".");
  if(!EMAIL_RE.test(row.email)) return errore("Controlla l'indirizzo email.");
  if(row.telefono.replace(/\D/g, "").length < 6) return errore("Controlla il numero di telefono.");
  if(!row.consenso_privacy) return errore("Per inviare serve accettare l'Informativa Privacy.");
  const btn = document.getElementById("cand-btn"); btn.disabled = true;
  const error = await salvaRichiestaContatto(row);
  btn.disabled = false;
  if(error){ console.error("candidatura:", error); return errore(error.message || "Invio non riuscito, riprova."); }
  const onb = candOrigine === "app_primo_accesso";
  document.getElementById("cand-form").style.display = "none";
  document.getElementById("cand-ok").style.display = "block";
  document.getElementById("cand-ok-onboarding").style.display = onb ? "block" : "none";
  document.getElementById("cand-ok-chiudi").style.display = onb ? "none" : "block";
  document.getElementById("cand-ok-testo").textContent = onb
    ? "Ti ricontattiamo presto all'email o al telefono che ci hai lasciato. Intanto, se hai anche un cavallo, puoi già usare Equo come proprietario."
    : "Ti ricontattiamo presto all'email o al telefono che ci hai lasciato.";
}

