/* ---------- COOKIE CONSENT + GOOGLE ANALYTICS ----------
   Nessuno script di tracciamento viene caricato finché l'utente non clicca "Accetta".
   GA_MEASUREMENT_ID è un placeholder: va sostituito con l'ID reale (G-XXXXXXX) prima
   che il tracciamento sia effettivo — finché resta un placeholder, acceptCookies()
   salva comunque la preferenza ma non carica nulla. */
const GA_MEASUREMENT_ID = "G-XXXXXXXXXX";

function initCookieConsent(){
  const consent = lsGet("equo-cookie-consent");
  if(consent === "accepted") loadGoogleAnalytics();
  else if(consent !== "rejected") document.getElementById("cookie-banner").classList.add("active");
}

function acceptCookies(){
  lsSet("equo-cookie-consent", "accepted");
  document.getElementById("cookie-banner").classList.remove("active");
  loadGoogleAnalytics();
}

function rejectCookies(){
  lsSet("equo-cookie-consent", "rejected");
  document.getElementById("cookie-banner").classList.remove("active");
}

function reopenCookieBanner(){
  closeLegalPage();
  lsDel("equo-cookie-consent");
  document.getElementById("cookie-banner").classList.add("active");
}

let gaLoaded = false;
function loadGoogleAnalytics(){
  if(gaLoaded || !GA_MEASUREMENT_ID || GA_MEASUREMENT_ID.includes("XXXXXXXXXX")) return;
  gaLoaded = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);
}

function formatEuro(n){
  return "€ " + (Number(n) || 0).toFixed(2);
}
function formatMeseLabel(yyyyMm){
  const [y, m] = yyyyMm.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("it-IT", { month: "long", year: "numeric" });
}

