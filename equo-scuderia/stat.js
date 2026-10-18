/* Equo · statistiche anonime (visite e click). Nessun cookie, nessun dato personale.
   Per escludere il tuo browser: apri il sito con ?nostat=1 (con ?nostat=0 torna a contare). */
(function () {
  try {
    var q = new URLSearchParams(location.search);
    if (q.get("nostat") === "1") localStorage.setItem("equo-nostat", "1");
    if (q.get("nostat") === "0") localStorage.removeItem("equo-nostat");
    if (localStorage.getItem("equo-nostat") === "1") return;
  } catch (_) {}
  if (navigator.doNotTrack === "1" || window.doNotTrack === "1") return;
  var sito = /^scuderia\./.test(location.hostname) ? "scuderia" : "sito";
  var pagina = location.pathname.replace(/index\.html$/, "").replace(/\.html$/, "") || "/";
  var mobile = Math.min(window.innerWidth || 1024, screen.width || 1024) < 768;
  function invia(d) {
    d.sito = sito; d.dispositivo = mobile ? "mobile" : "desktop";
    var s = JSON.stringify(d);
    try { if (navigator.sendBeacon && navigator.sendBeacon("/api/v", new Blob([s], { type: "text/plain" }))) return; } catch (_) {}
    try { fetch("/api/v", { method: "POST", body: s, keepalive: true }); } catch (_) {}
  }
  var sorgente = null;
  try {
    var u = new URLSearchParams(location.search).get("utm_source") || new URLSearchParams(location.search).get("ref");
    var r = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : "";
    sorgente = u || (r && r.indexOf("equohub.com") < 0 ? r : null);
  } catch (_) {}
  invia({ tipo: "visita", pagina: pagina, sorgente: sorgente });
  if (sito !== "sito") return;
  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("a,button,[data-stat]");
    if (!el) return;
    var nome = el.getAttribute("data-stat") || el.getAttribute("data-cta") || (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60) || el.getAttribute("aria-label") || "";
    var href = el.getAttribute("href") || "";
    if (href && /^https?:/.test(href) && href.indexOf(location.host) < 0) nome = (nome ? nome + " → " : "") + href.replace(/^https?:\/\//, "").slice(0, 60);
    if (!nome) return;
    invia({ tipo: "click", pagina: pagina, nome: nome });
  }, true);
})();
