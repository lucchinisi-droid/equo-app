/* ---------- TICKET DI ASSISTENZA (Home → "Serve aiuto?") ---------- */
function apriTicketAssistenza(){
  document.getElementById("tk-categoria").value = "problema";
  ["tk-oggetto","tk-descrizione","tk-telefono"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("tk-email").value = currentUser?.email || "";
  document.getElementById("tk-error").style.display = "none";
  document.getElementById("tk-form").style.display = "block";
  document.getElementById("tk-ok").style.display = "none";
  openModal("modal-ticket");
}

async function inviaTicketAssistenza(){
  const v = id => document.getElementById(id).value.trim();
  const errBox = document.getElementById("tk-error");
  const errore = (t) => { errBox.textContent = t; errBox.style.display = "block"; };
  errBox.style.display = "none";
  const row = { app: "app", vista: currentUser?.vistaAttiva || currentUser?.ruolo || null, categoria: v("tk-categoria"),
    oggetto: v("tk-oggetto"), descrizione: v("tk-descrizione"), email: v("tk-email"), telefono: v("tk-telefono") || null,
    nome: currentUser?.fullName || currentUser?.full_name || null,
    dispositivo: (navigator.userAgent || "").slice(0, 300) + " · " + window.innerWidth + "×" + window.innerHeight };
  if(row.oggetto.length < 3) return errore("Scrivi un oggetto (almeno 3 caratteri).");
  if(row.descrizione.length < 10) return errore("Descrivi il problema in qualche parola in più.");
  if(!EMAIL_RE.test(row.email)) return errore("Controlla l'indirizzo email.");
  const btn = document.getElementById("tk-btn"); btn.disabled = true;
  let numero = null;
  if(!DEMO_MODE){
    const { data, error } = await sb.from("ticket_assistenza").insert({ ...row, user_id: currentUser.id }).select("numero").single();
    btn.disabled = false;
    if(error){ console.error("ticket:", error); return errore(error.message?.includes("5 ticket") ? error.message : "Invio non riuscito, riprova o scrivi a gestione.equo@gmail.com."); }
    numero = data?.numero;
  } else btn.disabled = false;
  document.getElementById("tk-ok-titolo").textContent = numero ? `Ticket #${numero} inviato` : "Ticket inviato";
  document.getElementById("tk-form").style.display = "none";
  document.getElementById("tk-ok").style.display = "block";
}

// Non più raggiungibile dal menu (il profilo non si cambia dall'app): resta solo per compatibilità.
function reopenOnboarding(){
  document.getElementById("screen-app").classList.remove("active");
  document.getElementById("screen-onboarding").classList.add("active");
  showOnboardingStep(currentUser && PRO_ROLES.includes(currentUser.ruolo) ? 2 : 1);
}

function goHome(){
  showPage(currentUser && PRO_ROLES.includes(currentUser.ruolo) ? "pro-home" : "home");
}

function updateRoleBadgeUI(ruolo){
  const el = document.getElementById("menu-role-label");
  if(el) el.textContent = ROLE_LABELS[ruolo] || "—";
}

