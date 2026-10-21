/* ---------- PIANO (Passa a Premium / Torna a Free) ----------
   Stripe collegato: mensile/annuale passano da una vera Checkout Session, i lifetime
   da un Payment Link diretto (con limite posti impostato su Stripe). "Torna a Free"
   annulla davvero l'abbonamento su Stripe (cancel-subscription.js), non solo il flag
   in app — obbligo di fatto per l'art. 54-bis Codice del Consumo su recesso/disdetta
   facile quanto la sottoscrizione: altrimenti l'utente continuerebbe a pagare da Free. */
const LIFETIME_LINKS = {
  proprietario: "https://buy.stripe.com/00w4gB64fgRu0cbcrD6Na01",
  professionista: "https://buy.stripe.com/9B6dRbgIT58Mf7577j6Na00",
};
const PREZZI_PREMIUM = {
  proprietario: { mensile: "Mensile — 2,99€/mese", annuale: "Annuale — 19€/anno", lifetime: "Lifetime — 49€ una tantum" },
  professionista: { mensile: "Mensile — 7,99€/mese", annuale: "Annuale — 59€/anno", lifetime: "Lifetime — 99€ una tantum" },
};

// Il prezzo segue il profilo, non la vista: chi è anche professionista paga sempre il prezzo da professionista
// (il Premium vale per tutto l'account, quindi sblocca entrambi i profili). Lo stesso controllo è nel server.
function currentPianoRuolo(){
  const ruoli = [currentUser?.ruolo, currentUser?.ruoloSecondario];
  return ruoli.some(r => PRO_ROLES.includes(r)) ? "professionista" : "proprietario";
}

function updatePianoUI(){
  const label = document.getElementById("piano-label");
  const desc = document.getElementById("piano-desc");
  const btn = document.getElementById("piano-btn");
  if(!label || !btn) return;
  if(currentUser?.piano === "premium" && !isPremium()){
    label.textContent = "Premium proprietario";
    desc.textContent = "Qui nella vista professionista serve il Premium professionista: paghi solo la differenza";
    btn.textContent = "Passa a Premium professionista";
    btn.className = "btn btn-primary btn-sm";
  } else if(isPremium()){
    label.textContent = "Premium";
    desc.textContent = "Tutte le funzioni sbloccate";
    btn.textContent = "Torna a Free";
    btn.className = "btn btn-outline btn-sm";
  } else {
    label.textContent = "Free";
    desc.textContent = "Funzioni base";
    btn.textContent = "Passa a Premium";
    btn.className = "btn btn-primary btn-sm";
  }
}

function togglePiano(){
  if(currentUser?.piano === "premium" && !isPremium()){ apriUpgradePro(); return; }
  if(isPremium()){
    openModal("modal-downgrade-free");
    return;
  }
  const demoBox = document.getElementById("upgrade-demo-actions");
  const realBox = document.getElementById("upgrade-real-options");
  if(DEMO_MODE){
    demoBox.style.display = "block";
    realBox.style.display = "none";
  } else {
    demoBox.style.display = "none";
    realBox.style.display = "flex";
    const prezzi = PREZZI_PREMIUM[currentPianoRuolo()];
    document.getElementById("upgrade-btn-mensile").textContent = prezzi.mensile;
    document.getElementById("upgrade-btn-annuale").textContent = prezzi.annuale;
    document.getElementById("upgrade-btn-lifetime").textContent = prezzi.lifetime;
    if(typeof earlyAggiornaBottoneLifetime === "function") earlyAggiornaBottoneLifetime();
  }
  openModal("modal-upgrade-premium");
}

// Header con il token di login: le funzioni Netlify ricavano l'utente dal token, mai dal body.
async function authHeaders(){
  const { data } = await sb.auth.getSession();
  const token = data?.session?.access_token;
  return { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) };
}

