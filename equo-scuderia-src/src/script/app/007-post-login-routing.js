/* ---------- POST-LOGIN ROUTING ---------- */
async function afterLogin(){
  if(DEMO_MODE){ enterAppShell(); return; }

  const { data: membri, error } = await sb
    .from("scuderia_membri")
    .select("id, centro_id, ruolo, nome_visualizzato, livello, permessi, centri(id, nome, indirizzo, telefono, join_code, owner_id, citta, provincia, regione, box_icone_extra, promo_inizio, promo_fino, promo_pacchetto_prima)")
    .eq("user_id", currentUser.id);

  if(error){ showToast("Errore nel caricamento del profilo."); return; }

  if(!membri || membri.length === 0){
    // profiles è condivisa con Equo App: se l'utente ha già accettato Termini/Privacy
    // lì (o in un onboarding precedente qui), non richiediamo di nuovo il consenso.
    const { data: profile } = await sb.from("profiles").select("consenso_termini_privacy").eq("id", currentUser.id).maybeSingle();
    currentUser.consensoTerminiPrivacy = profile?.consenso_termini_privacy || null;
    document.getElementById("onb-consent-group").style.display = currentUser.consensoTerminiPrivacy ? "none" : "block";
    showScreen("screen-onboarding");
    return;
  }

  const m = membri[0];
  currentCentro = m.centri;
  currentMembro = { ruolo: m.ruolo, nome_visualizzato: m.nome_visualizzato, livello: m.livello, permessi: m.permessi || {} };

  if(m.ruolo === "allievo"){
    document.getElementById("allievo-centro-name").textContent = currentCentro.nome;
    showScreen("screen-allievo");
  } else {
    await loadTeam();
    enterAppShell();
  }
}

