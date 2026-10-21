/* ---------- COOKIE CONSENT + GOOGLE ANALYTICS ----------
   Nessuno script di tracciamento viene caricato finché l'utente non clicca "Accetta".
   GA_MEASUREMENT_ID è un placeholder da sostituire con l'ID reale prima che il
   tracciamento sia effettivo (condiviso concettualmente con Equo App, ID separato
   se si vogliono statistiche distinte per i due prodotti). */
const GA_MEASUREMENT_ID = "G-XXXXXXXXXX";

function initCookieConsent(){
  const consent = localStorage.getItem("equo-cookie-consent");
  if(consent === "accepted") loadGoogleAnalytics();
  else if(consent !== "rejected") document.getElementById("cookie-banner").style.display = "block";
}
function acceptCookies(){
  localStorage.setItem("equo-cookie-consent", "accepted");
  document.getElementById("cookie-banner").style.display = "none";
  loadGoogleAnalytics();
}
function rejectCookies(){
  localStorage.setItem("equo-cookie-consent", "rejected");
  document.getElementById("cookie-banner").style.display = "none";
}
function reopenCookieBanner(){
  closeModal("modal-legal");
  localStorage.removeItem("equo-cookie-consent");
  document.getElementById("cookie-banner").style.display = "block";
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

