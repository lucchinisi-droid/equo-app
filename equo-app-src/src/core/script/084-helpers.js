/* ---------- HELPERS ---------- */
/* Codici Equo (25/10/2026): si accettano maiuscole/minuscole, con o senza trattini e spazi, O per 0 e I/L per 1
   (stessa regola del database, equo_norm_codice). I nuovi nascono senza trattini e senza I, L, O: EQUOPRO0FKEM. */
function normCodiceEquo(t){
  const s = String(t || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if(!s) return "";
  const mappa = x => x.replace(/O/g, "0").replace(/[IL]/g, "1");
  if(s.slice(0, 4).replace(/0/g, "O") !== "EQUO") return mappa(s);
  const r = s.slice(4), t3 = r.slice(0, 3).replace(/0/g, "O").replace(/1/g, "I");
  if(r.length >= 7 && ["PRO", "OWN", "TRA", "MED"].includes(t3)) return "EQUO" + t3 + mappa(r.slice(3));
  return "EQUO" + mappa(r);
}
// "pro" | "tra" | "med" | "own" (codici personali) | "invito" (cliente del maniscalco o struttura) | null
function tipoCodiceEquo(t){
  const n = normCodiceEquo(t);
  let m = n.match(/^EQUO(PRO|TRA|MED|OWN)[A-Z0-9]{3,8}$/);
  if(m) return m[1].toLowerCase();
  return /^EQUO[A-Z0-9]{3,8}$/.test(n) ? "invito" : null;
}
// trova un codice Equo dentro un testo (anche un link app.equohub.com/?invito=...)
function codiceEquoDaTesto(t){
  const raw = String(t || "").trim();
  try{ const u = new URL(raw); const v = u.searchParams.get("invito"); if(v) return v; }catch(e){}
  const m = raw.toUpperCase().match(/EQU[O0][\s-]*(?:(?:PR[O0]|[O0]WN|TRA|MED)[\s-]*)?[A-Z0-9]{4,6}\b/);
  return m ? m[0] : raw;
}
// nuovo codice: "EQUO" + tipo + 5 caratteri senza I, L, O
function nuovoCodiceEquo(tipo){
  const alfabeto = "0123456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let s = "";
  const rnd = new Uint32Array(5);
  try{ crypto.getRandomValues(rnd); }catch(e){ for(let i = 0; i < 5; i++) rnd[i] = Math.floor(Math.random() * 1e9); }
  for(let i = 0; i < 5; i++) s += alfabeto[rnd[i] % alfabeto.length];
  return "EQUO" + (tipo || "") + s;
}
// link di Equo con il codice: chi lo apre arriva su Equo e si collega da solo
function linkCodiceEquo(codice){ return "https://app.equohub.com/?invito=" + encodeURIComponent(String(codice || "")); }
function escapeHtml(str){
  return String(str ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
// argomento sicuro per gli onclick="..." scritti nell'HTML (nomi con apostrofi, virgolette, ecc.)
function jsArg(v){ return escapeHtml(JSON.stringify(v ?? "")); }
// solo link veri (https, o anteprime locali): niente javascript: o altri schemi dentro href/src
function urlSicuro(u){ u = String(u || "").trim(); return /^(https:\/\/|blob:|data:image\/)/i.test(u) ? u : "#"; }
function formatDate(dateStr){
  if(!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}
function startPromoRotation(){
  clearInterval(timerPromo);
  let i = 0;
  const slides = document.querySelectorAll(".promo-slide");
  slides.forEach((sl, k) => sl.classList.toggle("active", k === 0));
  if(slides.length < 2) return;
  timerPromo = setInterval(() => {
    slides[i].classList.remove("active");
    i = (i + 1) % slides.length;
    slides[i].classList.add("active");
  }, 5000);
}

/* Carica la lista spese quando si apre la pagina */
document.querySelector('[data-page="spese"]').addEventListener("click", loadExpenses);

/* Carica la lista lezioni quando si apre il calendario */
document.querySelector('[data-page="prenotazioni"]').addEventListener("click", loadLezioni);

/* Carica la lista chat quando si apre la tab Chat */
document.querySelector('[data-page="chat"]').addEventListener("click", () => { loadOwnerChatList(); loadFarrierChatSection(); loadStableChatSection(); refreshChatBadge(); aggiornaBannerPush(); });

