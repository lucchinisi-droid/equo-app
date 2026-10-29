/* ---------- CANDIDATURE VETERINARI E TRAINER (al primo accesso o da «+ Aggiungi profilo») ---------- */
let candOrigine = "app_primo_accesso";
function aggiornaCandidatura(){
  const vet = document.getElementById("cand-professione").value === "veterinario";
  document.getElementById("cand-titolo").textContent = vet ? "Equo per veterinari" : "Equo per istruttori e trainer";
  document.getElementById("cand-ico").className = vet ? "fa-solid fa-stethoscope" : "fa-solid fa-graduation-cap";
  const box = document.getElementById("cand-codice-box"); if(box) box.style.display = vet ? "" : "none";
}
function apriCandidatura(professione, origine){
  candOrigine = origine || "app_primo_accesso";
  document.getElementById("cand-professione").value = professione === "istruttore" ? "istruttore" : "veterinario";
  aggiornaCandidatura();
  ["cand-telefono","cand-citta","cand-provincia","cand-spec","cand-msg","cand-codice"].forEach(id => { const el = document.getElementById(id); if(el) el.value = ""; });
  { const e = document.getElementById("cand-codice-error"); if(e) e.style.display = "none"; }
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


/* ---------- CODICE DI PROVA (29/10/2026): il veterinario entra subito con un codice (SQL 27) ---------- */
const CODICE_PROVA_ERRORI = {
  codice_non_valido: "Codice non valido: controlla di averlo scritto bene.",
  codice_scaduto: "Questo codice è scaduto: chiedicene uno nuovo.",
  codice_esaurito: "Questo codice è già stato usato: chiedicene uno nuovo.",
  altra_professione: "Il tuo account ha già un'altra professione: per casi particolari scrivici.",
  profilo_struttura: "Il profilo struttura non si combina con altri profili.",
  consenso: "Prima accetta i Termini e l'Informativa Privacy: chiudi questa finestra, spunta la casella nella schermata e riprova.",
  non_autenticato: "Accedi di nuovo e riprova."
};
async function attivaCodiceProva(){
  const inp = document.getElementById("cand-codice"), err = document.getElementById("cand-codice-error"), btn = document.getElementById("cand-codice-btn");
  const errore = t => { err.textContent = t; err.style.display = "block"; };
  err.style.display = "none";
  const codice = (inp.value || "").replace(/\s/g, "").toUpperCase();
  if(codice.length < 4) return errore("Scrivi il codice che ti abbiamo mandato.");
  const consenso = !!document.getElementById("onb-consent")?.checked || !!currentUser?.consensoTerminiPrivacy;
  let res = { ok: true, campo: candOrigine === "app_primo_accesso" ? "ruolo" : "ruolo_secondario" };
  btn.disabled = true;
  if(!DEMO_MODE){
    const { data, error } = await sb.rpc("equo_attiva_codice_prova", { p_codice: codice, p_consenso: consenso });
    res = error ? { ok: false, errore: "rete", msg: error.message } : data;
  }
  btn.disabled = false;
  if(!res || !res.ok){
    return errore(CODICE_PROVA_ERRORI[res?.errore] || "Non sono riuscito a controllare il codice, riprova.");
  }
  if(res.campo === "ruolo") currentUser.ruolo = "veterinario"; else currentUser.ruoloSecondario = "veterinario";
  if(consenso && !currentUser.consensoTerminiPrivacy) currentUser.consensoTerminiPrivacy = new Date().toISOString();
  closeModal("modal-candidatura");
  closeModal("modal-menu");
  document.getElementById("screen-onboarding")?.classList.remove("active");
  showToast("Benvenuto in Equo Veterinario");
  await enterApp("veterinario");
}
// email a Equo per chiedere il codice, con nome ed email già scritti
function chiediCodiceProva(){
  const nome = (document.getElementById("cand-nome")?.value || currentUser?.fullName || "").trim();
  const email = (document.getElementById("cand-email")?.value || currentUser?.email || "").trim();
  const oggetto = "Codice di prova Equo Veterinario";
  const testo = "Ciao, sono un veterinario e vorrei provare Equo.\n\nNome e cognome: " + nome + "\nEmail dell'account: " + email
    + "\nTelefono: \nCittà: \n\nGrazie!";
  location.href = "mailto:gestione.equo@gmail.com?subject=" + encodeURIComponent(oggetto) + "&body=" + encodeURIComponent(testo);
}
