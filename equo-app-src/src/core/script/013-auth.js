/* ---------- AUTH ---------- */
function setAuthTab(mode){
  authMode = mode;
  document.getElementById("tab-login").classList.toggle("active", mode === "login");
  document.getElementById("tab-signup").classList.toggle("active", mode === "signup");
  document.getElementById("signup-name-group").style.display = mode === "signup" ? "flex" : "none";
  document.getElementById("signup-referral-group").style.display = mode === "signup" ? "flex" : "none";
  document.getElementById("auth-submit").textContent = mode === "signup" ? "Registrati" : "Accedi";
  document.getElementById("auth-error").style.display = "none";
}

async function submitAuth(){
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;
  const errBox = document.getElementById("auth-error");
  errBox.style.display = "none";
  if(!email || !password){
    errBox.textContent = "Inserisci email e password.";
    errBox.style.display = "block";
    return;
  }
  try{
    if(authMode === "signup"){
      const name = document.getElementById("auth-name").value.trim();
      const referral_code = document.getElementById("auth-referral").value.trim() || null;
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: name } } });
      if(error) throw error;
      // Nessuna validazione o logica di sconto qui: il codice viene solo salvato,
      // la gestione della commissione al referrer resta manuale (vedi doc pricing).
      if(data.user) await sb.from("profiles").upsert({ id: data.user.id, email, full_name: name, referral_code });
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if(error) throw error;
    }
    await boot();
  } catch(e){
    errBox.textContent = e.message || "Errore, riprova.";
    errBox.style.display = "block";
  }
}

async function logout(){
  Registro.ferma();
  offSvuotaLetture(); // telefono condiviso: la copia dei dati non resta a chi entra dopo
  if(!DEMO_MODE){ try{ await sb.auth.signOut(); }catch(e){} }
  currentUser = null;
  DEMO_MODE = false;
  document.documentElement.removeAttribute("data-vista");
  aggiornaThemeColorMeta();
  closeModal("modal-menu");
  document.getElementById("screen-app").classList.remove("active");
  document.getElementById("screen-onboarding").classList.remove("active");
  document.getElementById("screen-auth").classList.add("active");
}

