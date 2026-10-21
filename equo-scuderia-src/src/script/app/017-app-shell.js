/* ---------- APP SHELL ---------- */
function enterAppShell(){
  setTimeout(invitoInstallaControlla, 4000);
  Registro.avvia(currentMembro?.ruolo || null);
  document.getElementById("sidebar-centro-name").textContent = currentCentro?.nome || "—";
  document.getElementById("centro-view-nome").textContent = currentCentro?.nome || "—";
  document.getElementById("centro-view-indirizzo").textContent = currentCentro?.indirizzo || "Non impostato";
  document.getElementById("centro-view-telefono").textContent = currentCentro?.telefono || "Non impostato";
  document.getElementById("centro-view-code").textContent = currentCentro?.join_code || "—";
  document.getElementById("home-centro-name").textContent = currentCentro?.nome || "Il tuo centro";

  const label = RUOLO_LABELS[currentMembro?.ruolo] || currentMembro?.ruolo || "";
  const displayName = currentMembro?.nome_visualizzato || currentUser?.email || "Utente";
  const initial = (displayName || "U").trim().charAt(0).toUpperCase();
  document.getElementById("user-name").textContent = displayName;
  document.getElementById("user-name").title = displayName; // nome/email completi al passaggio del mouse
  document.getElementById("user-role").textContent = label;
  document.getElementById("user-avatar").textContent = initial;
  document.getElementById("user-avatar-mobile").textContent = initial;

  renderTeam();
  renderPlaceholderModules();
  applySavedSidebarState();
  applySavedTheme();
  applyPermissionGating();
  showModule("home");
  showScreen("screen-app");
  startChatUnreadPolling();
  startContatoriNav();
  collegaOneSignal();
  renderZonaCentro();
  caricaPianoCentro().then(() => apriChatDaUrl());
}

