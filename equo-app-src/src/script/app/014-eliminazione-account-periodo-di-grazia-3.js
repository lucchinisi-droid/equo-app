/* ---------- ELIMINAZIONE ACCOUNT (periodo di grazia 30gg) ----------
   Nessun cron server-side collegato: la cancellazione DEFINITIVA dei dati dopo i
   30 giorni non è automatica, va fatta a mano finché non si aggiunge una Supabase
   Edge Function schedulata (vedi commento schema profiles.cancellazione_richiesta_at). */
async function confirmDeleteAccount(){
  const errBox = document.getElementById("delete-account-error");
  errBox.style.display = "none";
  if(DEMO_MODE){
    closeModal("modal-delete-account");
    showToast("In modalità demo non c'è un account reale da eliminare.");
    return;
  }
  try{
    if(currentUser.piano === "premium"){
      const res = await fetch("/.netlify/functions/cancel-subscription", { method: "POST", headers: await authHeaders(), body: JSON.stringify({ solo_abbonamento: true }) });
      if(!res.ok){
        const d = await res.json().catch(() => ({}));
        errBox.textContent = d.error || "Non sono riuscito ad annullare il tuo abbonamento Premium: riprova o scrivici prima di eliminare l'account.";
        errBox.style.display = "block";
        return;
      }
    }
    const cancellazione_richiesta_at = new Date().toISOString();
    const { error } = await sb.from("profiles").update({ cancellazione_richiesta_at }).eq("id", currentUser.id);
    if(error) throw error;
    closeModal("modal-delete-account");
    showToast("Richiesta registrata. Hai 30 giorni per annullare rientrando in Equo.");
    await logout();
  } catch(e){
    errBox.textContent = "Non sono riuscito a registrare la richiesta, riprova.";
    errBox.style.display = "block";
  }
}

function checkPendingDeletion(){
  if(!currentUser || !currentUser.cancellazioneRichiestaAt) return;
  const richiesta = new Date(currentUser.cancellazioneRichiestaAt);
  const scadenza = new Date(richiesta.getTime() + 30 * 24 * 60 * 60 * 1000);
  const giorniRimasti = Math.max(0, Math.ceil((scadenza - new Date()) / (24 * 60 * 60 * 1000)));
  const testo = giorniRimasti > 0
    ? `Hai chiesto di eliminare questo account il ${richiesta.toLocaleDateString("it-IT")}. Se non annulli, i dati verranno cancellati definitivamente il ${scadenza.toLocaleDateString("it-IT")} (tra ${giorniRimasti} giorni).`
    : `Il periodo di 30 giorni per annullare la cancellazione è scaduto. Scrivi a gestione.equo@gmail.com se hai cambiato idea: la cancellazione definitiva non è ancora stata completata.`;
  document.getElementById("reactivate-account-text").textContent = testo;
  openModal("modal-reactivate-account");
}

async function confirmReactivateAccount(){
  try{
    const { error } = await sb.from("profiles").update({ cancellazione_richiesta_at: null }).eq("id", currentUser.id);
    if(error) throw error;
    currentUser.cancellazioneRichiestaAt = null;
    closeModal("modal-reactivate-account");
    showToast("Cancellazione annullata, bentornato!");
  } catch(e){
    showToast("Non sono riuscito ad annullare la richiesta, riprova.");
  }
}

// lettura/scrittura della memoria del browser che non blocca l'app se è disattivata (alcune webview, privacy)
function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsSet(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }
function lsDel(k){ try{ localStorage.removeItem(k); }catch(e){} }
function setAvatarInitial(letter){
  const topbar = document.getElementById("topbar-avatar");
  const menu = document.getElementById("menu-avatar");
  topbar.style.backgroundImage = "";
  menu.style.backgroundImage = "";
  topbar.textContent = letter;
  menu.textContent = letter;
}

function setAvatarImage(url){
  const topbar = document.getElementById("topbar-avatar");
  const menu = document.getElementById("menu-avatar");
  topbar.textContent = "";
  menu.textContent = "";
  topbar.style.backgroundImage = `url('${url}')`;
  menu.style.backgroundImage = `url('${url}')`;
}

async function handleAvatarFileChange(event){
  const file = event.target.files && event.target.files[0];
  event.target.value = ""; // permette di riselezionare lo stesso file in seguito
  if(!file) return;
  if(!file.type.startsWith("image/")){
    showToast("Seleziona un'immagine.");
    return;
  }
  const { url, error } = await DB.uploadAvatar(file);
  if(error || !url){
    showToast("Non sono riuscito a caricare la foto, riprova.");
    return;
  }
  currentUser.avatarUrl = url;
  setAvatarImage(url);
  renderCertifiedCard();
  showToast("Foto profilo aggiornata!");
}

async function startDemo(){
  DEMO_MODE = true;
  // In demo il piano è Premium di default: il team prova subito tutto sbloccato (pattern "opzione C" del gating).
  currentUser = { id: "demo-user", email: "demo@equo.app", ruolo: "proprietario", ruoloSecondario: null, piano: "premium", vistaMan: "completa" };
  document.getElementById("screen-auth").classList.remove("active");
  document.getElementById("screen-app").classList.add("active");
  setAvatarInitial("D");
  document.getElementById("profile-email").textContent = currentUser.email;
  document.getElementById("profile-name").textContent = "Modalità demo";
  updateRoleBadgeUI("proprietario");
  renderMenuDualRole();
  await loadHorses();
  renderPaymentMethods();
  startPromoRotation();
}

