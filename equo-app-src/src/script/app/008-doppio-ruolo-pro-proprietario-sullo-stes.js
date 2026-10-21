/* ---------- DOPPIO RUOLO (pro <-> proprietario sullo stesso account) ---------- */
// currentUser.ruolo = ruolo primario (quello scelto nell'onboarding, salvato in DB)
// currentUser.ruoloSecondario = eventuale secondo profilo configurato (salvato in DB)
// currentUser.vistaAttiva = quale dei due profili è mostrato ORA (solo di sessione, non salvato:
// ad ogni riapertura dell'app si riparte sempre dal ruolo primario)
function renderMenuDualRole(){
  const chipRow = document.getElementById("menu-dual-role-switcher");
  const addBtn = document.getElementById("btn-add-secondary-role");
  const primario = currentUser?.ruolo;
  const secondario = currentUser?.ruoloSecondario;
  const attiva = currentUser?.vistaAttiva || primario;

  // la sezione "Attività professionale" (dati pagamento, codice personale) si vede solo in vista pro
  const proSection = document.getElementById("menu-pro-section");
  if(proSection) proSection.style.display = PRO_ROLES.includes(attiva) ? "block" : "none";
  // la sezione "Chat" (codice personale proprietario) si vede solo in vista proprietario
  const ownerSection = document.getElementById("menu-owner-section");
  if(ownerSection) ownerSection.style.display = (attiva === "proprietario") ? "block" : "none";

  // il gestore struttura non partecipa al doppio ruolo (usa Equo Scuderia)
  if(!primario || primario === "gestore_struttura"){
    chipRow.style.display = "none";
    addBtn.style.display = "none";
    return;
  }

  if(secondario){
    chipRow.style.display = "flex";
    addBtn.style.display = "none";
    // a sinistra sempre il proprietario, a destra la professione
    const pro = PRO_ROLES.includes(primario) ? primario : secondario;
    const own = pro === primario ? secondario : primario;
    const la = document.getElementById("sw-lab-a"), lb = document.getElementById("sw-lab-b");
    la.textContent = ROLE_LABELS[own] || own;
    lb.textContent = ROLE_LABELS[pro] || pro;
    const sw = document.getElementById("profilo-switch");
    sw.checked = attiva === pro;
    la.classList.toggle("on", attiva !== pro);
    lb.classList.toggle("on", attiva === pro);
    sw.dataset.own = own; sw.dataset.pro = pro;
  } else {
    chipRow.style.display = "none";
    const isPro = PRO_ROLES.includes(primario);
    addBtn.style.display = "block";
    addBtn.textContent = isPro ? "+ Aggiungi profilo Proprietario" : "+ Aggiungi profilo Professionista";
    addBtn.onclick = isPro ? () => confirmAddSecondaryRole("proprietario") : () => openModal("modal-add-pro-role");
  }
}

function onProfiloSwitch(versoPro){
  const sw = document.getElementById("profilo-switch");
  const ruolo = versoPro ? sw.dataset.pro : sw.dataset.own;
  document.getElementById("sw-lab-a").classList.toggle("on", !versoPro);
  document.getElementById("sw-lab-b").classList.toggle("on", versoPro);
  // piccola pausa per far vedere l'animazione dell'interruttore
  setTimeout(() => switchVista(ruolo), 180);
}

async function switchVista(ruolo){
  closeModal("modal-menu");
  if(ruolo === currentUser.vistaAttiva) return;
  await enterApp(ruolo);
}

async function confirmAddSecondaryRole(ruolo){
  closeModal("modal-add-pro-role");
  if(DEMO_MODE){
    currentUser.ruoloSecondario = ruolo;
  } else {
    const { error } = await sb.from("profiles").update({ ruolo_secondario: ruolo }).eq("id", currentUser.id);
    if(error){ console.error("confirmAddSecondaryRole:", error); showToast(error.message && /profil|professione/i.test(error.message) ? error.message : "Non sono riuscito a salvare, riprova."); return; }
    currentUser.ruoloSecondario = ruolo;
  }
  closeModal("modal-menu");
  await enterApp(ruolo);
}

// Colori per profilo: proprietario beige/verde scuro, professionista ocra tenue/oro scuro (vedi CSS data-vista)
function applicaPaletteVista(ruolo){
  const pro = PRO_ROLES.includes(ruolo);
  document.documentElement.setAttribute("data-vista", pro ? "pro" : "owner");
  aggiornaThemeColorMeta();
}
function aggiornaThemeColorMeta(){
  const m = document.querySelector('meta[name="theme-color"]');
  if(!m) return;
  const top = getComputedStyle(document.documentElement).getPropertyValue("--grad-top").trim();
  m.setAttribute("content", top || getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#0e2019");
}

async function enterApp(ruolo){
  setTimeout(invitoInstallaControlla, 4000);
  setTimeout(() => { if(typeof earlyControlla === "function") earlyControlla(); }, 1200);
  setTimeout(() => { if(typeof referralControlla === "function") referralControlla(); }, 2200);
  document.getElementById("screen-onboarding").classList.remove("active");
  document.getElementById("screen-app").classList.add("active");
  collegaOneSignal();
  currentUser.vistaAttiva = ruolo;
  if(Registro.sid){ Registro.vista = ruolo; Registro.azione("vista:" + ruolo); } else Registro.avvia(ruolo);
  applicaPaletteVista(ruolo);
  avviaSpunte();
  try{ localStorage.setItem("equo-vista-" + currentUser.id, ruolo); }catch(e){}
  aggiornaFabAi();
  controllaNovitaAi();
  controllaAggiornamentoApp();
  updateRoleBadgeUI(ruolo);
  renderMenuDualRole();
  if(PRO_ROLES.includes(ruolo)){
    await setupProNav(ruolo);
  } else {
    setupOwnerNav();
    await loadHorses();
    renderPaymentMethods();
    startPromoRotation();
    startPartnerBannerRotation();
    startChatBadgePolling();
    if(ruolo === "gestore_struttura") showStableManagerBanner();
  }
  if(typeof applicaVistaHome === "function") applicaVistaHome();
  if(typeof applicaVistaManiscalco === "function") applicaVistaManiscalco();
  if(typeof applicaHomeMan === "function") applicaHomeMan();
  if(typeof wgControllaResetPin === "function") setTimeout(wgControllaResetPin, 800);
  if(typeof mostraSceltaVistaManiscalco === "function") setTimeout(mostraSceltaVistaManiscalco, 1200);
}

function setupOwnerNav(){
  document.getElementById("bottom-nav-owner").style.display = "flex";
  document.getElementById("bottom-nav-pro").style.display = "none";
  showPage("home");
}

async function setupProNav(ruolo){
  document.getElementById("bottom-nav-owner").style.display = "none";
  document.getElementById("bottom-nav-pro").style.display = "flex";
  document.getElementById("topbar-context").textContent = ROLE_LABELS[ruolo] || "";
  renderProAgendaHeader(ruolo);
  renderProHomeGreeting();
  showPage("pro-home");
  await loadClientiMascalcia();
  await loadInboxMascalcia();
  loadColleghiList();
  await renderIncassi();
}

function renderProAgendaHeader(ruolo){
  document.getElementById("pro-agenda-title").textContent = "Agenda della settimana";
  document.getElementById("pro-action-btn").textContent = "+ Nuovo appuntamento";
}

// "Buongiorno, Alessandro": saluto in base all'ora + nome di battesimo dell'utente (se lo conosciamo)
function testoSaluto(){
  const h = new Date().getHours();
  const saluto = h < 12 ? "Buongiorno" : h < 18 ? "Buon pomeriggio" : "Buonasera";
  const pieno = DEMO_MODE ? "" : String(currentUser?.fullName || "").trim();
  const nome = pieno.split(/\s+/)[0] || "";
  return nome ? saluto + ", " + nome.charAt(0).toUpperCase() + nome.slice(1) : saluto;
}
function dataDiOggi(){ return new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }); }
// data + ora attuale in Home (l'ora si aggiorna da sola a ogni minuto, anche il saluto)
function dataOraDiOggi(){ const d = new Date(); return dataDiOggi() + " · " + d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }); }
function aggiornaOrologioHome(){
  const a = document.getElementById("home-date"), b = document.getElementById("pro-home-date");
  if(a && a.textContent) a.textContent = dataOraDiOggi();
  if(b && b.textContent) b.textContent = dataOraDiOggi();
  const g1 = document.getElementById("home-greeting"), g2 = document.getElementById("pro-home-greeting");
  if(currentUser){ if(g1 && g1.textContent) g1.textContent = testoSaluto(); if(g2 && g2.textContent) g2.textContent = testoSaluto(); }
}
(function avviaOrologioHome(){
  const prossimo = () => setTimeout(() => { aggiornaOrologioHome(); prossimo(); }, 60000 - (Date.now() % 60000) + 50);
  prossimo();
  document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible") aggiornaOrologioHome(); });
})();
function renderHomeGreeting(){
  const g = document.getElementById("home-greeting"); if(!g) return;
  g.textContent = testoSaluto();
  document.getElementById("home-date").textContent = dataOraDiOggi();
}
function renderProHomeGreeting(){
  document.getElementById("pro-home-greeting").textContent = testoSaluto();
  document.getElementById("pro-home-date").textContent = dataOraDiOggi();
  renderCertifiedCard();
}

