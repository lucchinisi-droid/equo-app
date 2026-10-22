/* ---------- MENU / DARK MODE ---------- */
function openMenu(){
  document.getElementById("theme-switch").checked = document.documentElement.getAttribute("data-theme") === "light" ? false : true;
  updateThemeMenuUI();
  updatePianoUI();
  caricaSwitchRiepilogo();
  aggiornaVersioniMenu();
  if(typeof aggiornaSwitchHome === "function") aggiornaSwitchHome();
  openModal("modal-menu");
}

function initTheme(){
  const saved = lsGet("equo-theme");
  document.documentElement.setAttribute("data-theme", saved || "light");
  updateThemeMenuUI();
  initCookieConsent();
}

function toggleTheme(){
  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  const next = isLight ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  lsSet("equo-theme", next);
  updateThemeMenuUI();
  aggiornaThemeColorMeta();
}

function updateThemeMenuUI(){
  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  const switchEl = document.getElementById("theme-switch");
  const iconEl = document.getElementById("theme-icon");
  const labelEl = document.getElementById("theme-label");
  if(!switchEl) return;
  switchEl.checked = !isLight;
  iconEl.innerHTML = `<svg><use href="#i-${isLight ? "sun" : "moon"}"/></svg>`;
  labelEl.textContent = isLight ? "Modalità chiara" : "Modalità scura";
}

