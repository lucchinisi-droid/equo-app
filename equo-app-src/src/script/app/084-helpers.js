/* ---------- HELPERS ---------- */
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

