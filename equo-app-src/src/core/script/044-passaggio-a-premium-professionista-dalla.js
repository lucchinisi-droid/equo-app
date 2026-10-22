/* ---------- PASSAGGIO A PREMIUM PROFESSIONISTA (dalla versione proprietario) ----------
   Mensile/annuale: Stripe cambia il prezzo dello stesso abbonamento e addebita subito solo la differenza
   per i giorni che restano (cifra mostrata prima di confermare). Lifetime: differenza di 50 €. */
let upgradeAnteprima = null;
async function apriUpgradePro(){
  const box = document.getElementById("upgrade-pro-testo"), ok = document.getElementById("upgrade-pro-ok");
  box.innerHTML = '<div class="loading"><div class="spinner"></div> Calcolo la differenza…</div>';
  ok.style.display = "none"; upgradeAnteprima = null;
  closeModal("modal-menu");
  openModal("modal-upgrade-pro");
  if(DEMO_MODE){ box.textContent = "In demo il passaggio non è disponibile."; return; }
  try{
    const res = await fetch("/.netlify/functions/upgrade-premium", { method: "POST", headers: await authHeaders(), body: JSON.stringify({ azione: "anteprima" }) });
    const d = await res.json().catch(() => ({}));
    if(!res.ok){ box.textContent = d.error || "Non riesco a calcolare la differenza, riprova."; return; }
    upgradeAnteprima = d;
    const eur = c => "€ " + (Number(c || 0) / 100).toFixed(2).replace(".", ",");
    if(d.tipo === "lifetime"){
      box.innerHTML = `Hai il Premium <b>lifetime</b> da proprietario. Per sbloccare anche le funzioni da professionista paghi solo la differenza: <b>${eur(d.importo_cent)}</b> una volta sola (99 € − 49 €).`
        + (d.link ? "" : '<br><br>Il pagamento della differenza non è ancora attivo: scrivici dall\'assistenza e lo sistemiamo noi.');
      ok.textContent = "Paga la differenza"; ok.style.display = d.link ? "" : "none";
    } else {
      const rinnovo = d.prossimo_rinnovo ? new Date(d.prossimo_rinnovo * 1000).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : "";
      box.innerHTML = `Il tuo abbonamento <b>${d.periodo}</b> passa al prezzo da professionista (${eur(d.nuovo_prezzo_cent)}/${d.periodo === "annuale" ? "anno" : "mese"}) e vale per entrambi i profili.<br><br>`
        + `Paghi ora <b>${eur(d.importo_cent)}</b>: solo la differenza per i giorni che restano fino al rinnovo${rinnovo ? " del " + rinnovo : ""}. Poi ${eur(d.nuovo_prezzo_cent)} al rinnovo, con la stessa data.`
        + '<br><br><small class="muted">Se il pagamento non va a buon fine il tuo abbonamento resta com\'è.</small>';
      ok.textContent = "Conferma e paga " + eur(d.importo_cent); ok.style.display = "";
    }
  }catch(e){ box.textContent = "Errore di connessione, riprova."; }
}
async function confermaUpgradePro(){
  const d = upgradeAnteprima; if(!d) return;
  if(d.tipo === "lifetime"){ if(d.link) window.location.href = d.link; return; }
  const ok = document.getElementById("upgrade-pro-ok"); ok.disabled = true;
  try{
    const res = await fetch("/.netlify/functions/upgrade-premium", { method: "POST", headers: await authHeaders(), body: JSON.stringify({ azione: "conferma", proration_date: d.proration_date }) });
    const r = await res.json().catch(() => ({}));
    if(r.serve_pagamento && r.url){ window.location.href = r.url; return; }
    if(!res.ok || !r.ok){ showToast(r.error || "Passaggio non riuscito, riprova."); return; }
    closeModal("modal-upgrade-pro");
    showToast("Fatto! Il Premium professionista si attiva tra pochi secondi.");
    // il livello lo aggiorna il webhook di Stripe: controllo per qualche secondo
    for(let i = 0; i < 8; i++){
      await new Promise(x => setTimeout(x, 1500));
      const { data } = await sb.from("profiles").select("premium_livello").eq("id", currentUser.id).maybeSingle();
      if(data?.premium_livello === "professionista"){ currentUser.premiumLivello = "professionista"; updatePianoUI(); showToast("Premium professionista attivo"); return; }
    }
  }catch(e){ showToast("Errore di connessione: prima di riprovare controlla tra qualche minuto se il passaggio è già attivo."); }
  finally{ ok.disabled = false; }
}

async function startCheckout(periodo){
  try{
    const res = await fetch("/.netlify/functions/create-checkout", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ piano: currentPianoRuolo(), periodo })
    });
    const data = await res.json().catch(() => ({}));
    if(data.url){ window.location.href = data.url; }
    else { showToast(data.error || "Non sono riuscito ad aprire il pagamento, riprova."); }
  } catch(e){
    showToast("Errore di connessione, riprova.");
  }
}

function startLifetimeCheckout(){
  // client_reference_id = utente Equo: il webhook Stripe lo usa per attivare Premium lifetime
  const url = new URL(LIFETIME_LINKS[currentPianoRuolo()]);
  url.searchParams.set("client_reference_id", currentUser.id);
  if(currentUser.email) url.searchParams.set("prefilled_email", currentUser.email);
  window.location.href = url.toString();
}

async function confirmUpgradePremium(){
  closeModal("modal-upgrade-premium");
  await setPiano("premium");
  showToast("Sei passato a Premium! (demo)");
}

async function confirmDowngradeFree(){
  closeModal("modal-downgrade-free");
  if(DEMO_MODE){
    await setPiano("free");
    showToast("Sei tornato al piano Free.");
    return;
  }
  try{
    const res = await fetch("/.netlify/functions/cancel-subscription", {
      method: "POST",
      headers: await authHeaders(),
      body: "{}"
    });
    if(!res.ok){
      const d = await res.json().catch(() => ({}));
      showToast(d.error || "Non sono riuscito ad annullare l'abbonamento, riprova o scrivici.");
      return;
    }
    currentUser.piano = "free";
    updatePianoUI();
    if(typeof renderIncassi === "function" && PRO_ROLES.includes(currentUser.vistaAttiva || currentUser.ruolo)) await renderIncassi();
    showToast("Sei tornato al piano Free, abbonamento annullato.");
  } catch(e){
    showToast("Non sono riuscito ad annullare l'abbonamento, riprova o scrivici.");
  }
}

async function setPiano(piano){
  currentUser.piano = piano;
  if(!DEMO_MODE){
    const { error } = await sb.from("profiles").update({ piano }).eq("id", currentUser.id);
    if(error){ showToast("Non sono riuscito a salvare, riprova."); return; }
  }
  updatePianoUI();
  // riaggiorna gli sblocchi legati al piano già presenti in pagina (es. incassi-premium-box)
  if(typeof renderIncassi === "function" && PRO_ROLES.includes(currentUser.vistaAttiva || currentUser.ruolo)) await renderIncassi();
}

