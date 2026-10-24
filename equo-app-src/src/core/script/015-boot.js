/* ---------- BOOT ---------- */
async function boot(){
  initTheme();
  if(DEMO_MODE) return;
  let user = null;
  try{
    const res = await sb.auth.getUser();
    user = res.data.user;
    // senza rete il controllo del login non risponde: si usa la sessione salvata sul telefono
    if(!user && (!navigator.onLine || /fetch|network|retryable/i.test(String(res.error?.name || "") + " " + String(res.error?.message || "")))){
      const s2 = await sb.auth.getSession(); user = s2.data?.session?.user || null;
    }
  } catch(e){
    console.warn("Supabase non ancora configurato:", e.message);
  }
  if(!user){
    document.getElementById("screen-auth").classList.add("active");
    document.getElementById("screen-app").classList.remove("active");
    document.getElementById("screen-onboarding").classList.remove("active");
    return;
  }
  currentUser = user;
  document.getElementById("screen-auth").classList.remove("active");

  document.getElementById("profile-email").textContent = user.email || "";
  const { data: profile } = await sb.from("profiles").select(
    "full_name, ruolo, ruolo_secondario, piano, avatar_url, codice_professionista, codice_proprietario, dati_pagamento_tipo, dati_pagamento_nome, dati_pagamento_piva_cf, dati_pagamento_iban, dati_pagamento_paypal, consenso_termini_privacy, cancellazione_richiesta_at"
  ).eq("id", user.id).maybeSingle();
  // campi badge letti a parte: se la colonna non esistesse ancora, il resto del profilo resta intatto
  const { data: cert, error: certErr } = await sb.from("profiles").select("certificazione_stato, certificazione_motivo").eq("id", user.id).maybeSingle();
  if(certErr) console.error("profilo certificazione:", certErr);
  const { data: pref } = await sb.from("profiles").select("home_vista, incassi_nascosti").eq("id", user.id).maybeSingle();
  currentUser.homeVista = pref?.home_vista || "widget";
  currentUser.incassiNascosti = !!pref?.incassi_nascosti;
  // letto a parte: se la colonna non esistesse ancora, le altre preferenze restano intatte
  try{ const { data: pp } = await sb.from("profiles").select("promemoria_pagamenti").eq("id", user.id).maybeSingle(); currentUser.promemoriaPagamenti = pp ? pp.promemoria_pagamenti !== false : true; }catch(e){ currentUser.promemoriaPagamenti = true; }
  try{ const { data: pl } = await sb.from("profiles").select("premium_livello").eq("id", user.id).maybeSingle(); currentUser.premiumLivello = pl?.premium_livello || null; }catch(e){ currentUser.premiumLivello = null; }
  try{ const { data: fs, error: fsErr } = await sb.from("profiles").select("ferro_sistema_predefinito").eq("id", user.id).maybeSingle(); currentUser.ferroSistema = fsErr ? null : (fs?.ferro_sistema_predefinito || null); }catch(e){ currentUser.ferroSistema = null; }
  try{ const { data: vm, error: vmErr } = await sb.from("profiles").select("vista_maniscalco").eq("id", user.id).maybeSingle(); currentUser.vistaMan = vmErr ? "completa" : (vm?.vista_maniscalco || null); }catch(e){ currentUser.vistaMan = "completa"; }
  document.getElementById("profile-name").textContent = profile?.full_name || "Il tuo profilo";
  currentUser.ruolo = profile?.ruolo || null;
  currentUser.ruoloSecondario = profile?.ruolo_secondario || null;
  currentUser.piano = profile?.piano || "free";
  currentUser.avatarUrl = profile?.avatar_url || null;
  currentUser.codiceProfessionista = profile?.codice_professionista || null;
  currentUser.codiceProprietario = profile?.codice_proprietario || null;
  currentUser.datiPagamentoTipo = profile?.dati_pagamento_tipo || null;
  currentUser.datiPagamentoNome = profile?.dati_pagamento_nome || null;
  currentUser.fullName = profile?.full_name || null;
  currentUser.datiPagamentoPivaCf = profile?.dati_pagamento_piva_cf || null;
  currentUser.datiPagamentoIban = profile?.dati_pagamento_iban || null;
  currentUser.datiPagamentoPaypal = profile?.dati_pagamento_paypal || null;
  currentUser.consensoTerminiPrivacy = profile?.consenso_termini_privacy || null;
  currentUser.cancellazioneRichiestaAt = profile?.cancellazione_richiesta_at || null;
  currentUser.certificazioneStato = cert?.certificazione_stato || "nessuno";
  currentUser.certificazioneMotivo = cert?.certificazione_motivo || null;
  renderBadgeProfilo();
  if(currentUser.avatarUrl) setAvatarImage(currentUser.avatarUrl);
  else setAvatarInitial((user.email || "?").charAt(0).toUpperCase());

  const nomeParoleBoot = (profile?.full_name || "").trim().split(/\s+/).filter(Boolean);
  if(nomeParoleBoot.length < 2){
    document.getElementById("screen-app").classList.remove("active");
    document.getElementById("screen-onboarding").classList.remove("active");
    document.getElementById("cp-nome-error").style.display = "none";
    document.getElementById("cp-nome-cognome").value = profile?.full_name || "";
    openModal("modal-completa-profilo");
    return;
  }

  await continueBootAfterProfile();
}

async function continueBootAfterProfile(){
  if(!currentUser.ruolo){
    document.getElementById("screen-app").classList.remove("active");
    document.getElementById("screen-onboarding").classList.add("active");
    const onbAcc = document.getElementById("onb-account");
    if(onbAcc) onbAcc.textContent = currentUser.email || "questo account";
    showOnboardingStep(1);
    return;
  }
  let vista = currentUser.ruolo;
  try{
    const salvata = lsGet("equo-vista-" + currentUser.id);
    if(salvata && (salvata === currentUser.ruolo || salvata === currentUser.ruoloSecondario)) vista = salvata;
  }catch(e){}
  await enterApp(vista);
  checkPendingDeletion();
  apriChatDaUrl();
  await handleCheckoutReturn();
}

async function saveCompleteProfile(){
  const nome = document.getElementById("cp-nome-cognome").value.trim();
  const errBox = document.getElementById("cp-nome-error");
  errBox.style.display = "none";
  const parole = nome.split(/\s+/).filter(Boolean);
  if(parole.length < 2){
    errBox.textContent = "Inserisci nome e cognome (almeno due parole).";
    errBox.style.display = "block";
    return;
  }
  try{
    const { error } = await sb.from("profiles").update({ full_name: nome }).eq("id", currentUser.id);
    if(error) throw error;
    document.getElementById("profile-name").textContent = nome;
    currentUser.fullName = nome;
    closeModal("modal-completa-profilo");
    await continueBootAfterProfile();
  } catch(err){
    errBox.textContent = err.message || "Errore nel salvataggio.";
    errBox.style.display = "block";
  }
}

/* Al ritorno da Stripe Checkout (?checkout=success in URL) il webhook potrebbe
   impiegare qualche istante ad aggiornare profiles.piano: aspettiamo un attimo e
   ricontrolliamo, poi ripuliamo l'URL per non ritriggerare al refresh. */
