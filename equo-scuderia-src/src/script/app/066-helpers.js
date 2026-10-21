/* ---------- HELPERS ---------- */
// argomento sicuro per gli onclick="..." scritti nell'HTML (nomi con apostrofi, virgolette, ecc.)
function jsArg(v){ return escapeHtml(JSON.stringify(v ?? "")); }
// solo link veri (https, o anteprime locali): niente javascript: o altri schemi dentro href/src
function urlSicuro(u){ u = String(u || "").trim(); return /^(https:\/\/|blob:|data:image\/)/i.test(u) ? u : "#"; }
// immagine di sfondo: url("...") con la stringa protetta
function cssUrl(u){ return "url(" + escapeHtml(JSON.stringify(urlSicuro(u))) + ")"; }
function escapeHtml(str){
  return String(str ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

