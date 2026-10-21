/* ---------- RICHIESTE DI CONTATTO (struttura al primo accesso / altro profilo) ---------- */
function openRichiestaStruttura(){
  ["rs-nome","rs-via","rs-citta","rs-telefono"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("rs-email").value = currentUser?.email || "";
  document.getElementById("rs-error").style.display = "none";
  document.getElementById("rs-form").style.display = "block";
  document.getElementById("rs-ok").style.display = "none";
  openModal("modal-richiesta-struttura");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function salvaRichiestaContatto(row){
  if(DEMO_MODE) return null;
  const { error } = await sb.from("richieste_contatto").insert({ ...row, user_id: currentUser.id });
  return error;
}

async function inviaContattoStruttura(){
  const v = id => document.getElementById(id).value.trim();
  const errBox = document.getElementById("rs-error");
  errBox.style.display = "none";
  const row = { tipo: "struttura", origine: document.getElementById("screen-onboarding")?.classList.contains("active") ? "app_primo_accesso" : "app_menu", nome_struttura: v("rs-nome"), via: v("rs-via"), citta: v("rs-citta"), email: v("rs-email"), telefono: v("rs-telefono") };
  if(!row.nome_struttura || !row.via || !row.citta || !row.email || !row.telefono){
    errBox.textContent = "Compila tutti i campi."; errBox.style.display = "block"; return;
  }
  if(!EMAIL_RE.test(row.email)){ errBox.textContent = "Controlla l'indirizzo email."; errBox.style.display = "block"; return; }
  const btn = document.getElementById("rs-btn"); btn.disabled = true;
  const error = await salvaRichiestaContatto(row);
  btn.disabled = false;
  if(error){ console.error("richiesta struttura:", error); errBox.textContent = error.message || "Invio non riuscito, riprova."; errBox.style.display = "block"; return; }
  document.getElementById("rs-form").style.display = "none";
  document.getElementById("rs-ok").style.display = "block";
}

function openRichiestaProfilo(){
  closeModal("modal-menu");
  document.getElementById("rp-richiesta").value = "seconda_professione";
  ["rp-nome-struttura","rp-citta","rp-telefono","rp-messaggio"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("rp-nome").value = currentUser?.fullName || currentUser?.full_name || document.getElementById("profile-name")?.textContent?.replace("—","").trim() || "";
  document.getElementById("rp-email").value = currentUser?.email || "";
  document.getElementById("rp-error").style.display = "none";
  document.getElementById("rp-form").style.display = "block";
  document.getElementById("rp-ok").style.display = "none";
  aggiornaFormRichiestaProfilo();
  openModal("modal-richiesta-profilo");
}

function aggiornaFormRichiestaProfilo(){
  const r = document.getElementById("rp-richiesta").value;
  document.getElementById("rp-prof-group").style.display = (r === "seconda_professione" || r === "cambio_professione") ? "flex" : "none";
  document.getElementById("rp-struttura-group").style.display = r === "struttura" ? "flex" : "none";
}

async function inviaRichiestaProfilo(){
  const v = id => document.getElementById(id).value.trim();
  const errBox = document.getElementById("rp-error");
  errBox.style.display = "none";
  const richiesta = v("rp-richiesta");
  const row = { tipo: "profilo", richiesta, nome: v("rp-nome"), email: v("rp-email"), telefono: v("rp-telefono"), messaggio: v("rp-messaggio") || null,
    professione: (richiesta === "seconda_professione" || richiesta === "cambio_professione") ? v("rp-professione") : null,
    nome_struttura: richiesta === "struttura" ? v("rp-nome-struttura") : null, citta: richiesta === "struttura" ? v("rp-citta") : null };
  if(!row.nome || !row.email || !row.telefono){ errBox.textContent = "Inserisci nome, email e telefono."; errBox.style.display = "block"; return; }
  if(!EMAIL_RE.test(row.email)){ errBox.textContent = "Controlla l'indirizzo email."; errBox.style.display = "block"; return; }
  if(richiesta === "struttura" && (!row.nome_struttura || !row.citta)){ errBox.textContent = "Inserisci nome e città del centro ippico."; errBox.style.display = "block"; return; }
  if(richiesta === "altro" && !row.messaggio){ errBox.textContent = "Scrivici in breve di cosa hai bisogno."; errBox.style.display = "block"; return; }
  const btn = document.getElementById("rp-btn"); btn.disabled = true;
  const error = await salvaRichiestaContatto(row);
  btn.disabled = false;
  if(error){ console.error("richiesta profilo:", error); errBox.textContent = error.message || "Invio non riuscito, riprova."; errBox.style.display = "block"; return; }
  document.getElementById("rp-form").style.display = "none";
  document.getElementById("rp-ok").style.display = "block";
}

