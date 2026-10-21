/* ---------- AUTH ---------- */
let authMode = "login";
function setAuthTab(mode){
  authMode = mode;
  document.getElementById("tab-login").classList.toggle("active", mode === "login");
  document.getElementById("tab-register").classList.toggle("active", mode === "register");
  document.getElementById("field-nome").style.display = mode === "register" ? "block" : "none";
  document.getElementById("auth-submit-btn").textContent = mode === "register" ? "Crea account" : "Accedi";
  document.getElementById("auth-error").style.display = "none";
}

async function submitAuth(e){
  e.preventDefault();
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;
  const nome = document.getElementById("auth-nome").value.trim();
  const errBox = document.getElementById("auth-error");
  errBox.style.display = "none";

  try{
    if(authMode === "register"){
      const { data, error } = await sb.auth.signUp({ email, password, options:{ data:{ full_name: nome } } });
      if(error) throw error;
      if(data.user) currentUser = { id: data.user.id, email: data.user.email };
    } else {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if(error) throw error;
      currentUser = { id: data.user.id, email: data.user.email };
    }
    DEMO_MODE = false;
    await afterLogin();
  } catch(err){
    errBox.textContent = err.message || "Errore, riprova.";
    errBox.style.display = "block";
  }
}

function startDemo(){
  DEMO_MODE = true;
  currentUser = { id:"demo-user", email:"demo@equoscuderia.it" };
  currentCentro = demoState.centro;
  currentMembro = demoState.membri[0];
  teamList = demoState.membri;
  enterAppShell();
  showToast("Modalità demo attiva — nessun dato reale viene salvato.");
}

async function logout(){
  Registro.ferma();
  copiaSvuota(); // dispositivo condiviso: la copia offline dei dati non resta a chi entra dopo
  if(!DEMO_MODE){ try{ await sb.auth.signOut(); }catch(e){} }
  currentUser = null; currentCentro = null; currentMembro = null; teamList = [];
  athenaCaricata = false; pianoCentro = null; statDati = null; radarAttesa = null;
  if(boxCanale){ try{ sb.removeChannel(boxCanale); }catch(e){} boxCanale = null; } boxList = []; boxAttivita = [];
  DEMO_MODE = false;
  document.getElementById("auth-form").reset();
  showScreen("screen-auth");
}

