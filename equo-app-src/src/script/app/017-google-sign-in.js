/* ---------- GOOGLE SIGN-IN ---------- */
async function signInWithGoogle(){
  const errBox = document.getElementById("auth-error");
  try{
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      // select_account: Google chiede SEMPRE quale account usare (senza, rientra in automatico nell'ultimo scelto)
      options: { redirectTo: window.location.origin + window.location.pathname, queryParams: { prompt: "select_account" } },
    });
    if(error) throw error;
    // Supabase reindirizza a Google e poi torna qui: boot() gestisce la sessione al ritorno.
  } catch(e){
    errBox.textContent = e.message || "Errore con l'accesso Google.";
    errBox.style.display = "block";
  }
}

