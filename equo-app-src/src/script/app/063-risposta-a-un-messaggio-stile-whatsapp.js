/* ---------- RISPOSTA A UN MESSAGGIO (stile WhatsApp) ----------
   Scorri una bolla verso destra (o doppio clic) → barra «Rispondi a …» sopra il campo di testo.
   Il messaggio inviato porta con sé una copia breve di quello citato (colonna risposta: id, nome, testo, tipo). */
let rispostaInCorso = null; // { ov, id, nome, testo, tipo }
const ETICHETTE_TIPO_CIT = { audio: "🎤 Nota vocale", foto: "📷 Foto", video: "🎬 Video", documento: "📄 Documento", immagine: "📷 Foto" };
function citazioneHtml(m){
  const r = m && m.risposta;
  if(!r || typeof r !== "object" || !r.id) return "";
  const testo = r.testo || ETICHETTE_TIPO_CIT[r.tipo] || "Messaggio";
  return `<div class="mchat-cit" onclick="event.stopPropagation();vaiAlMessaggio('${String(r.id).replace(/[^a-zA-Z0-9_-]/g, "")}', this)"><b>${escapeHtml(r.nome || "")}</b><span>${escapeHtml(testo)}</span></div>`;
}
function vaiAlMessaggio(id, da){
  const box = da && da.closest(".mchat-overlay");
  const b = (box || document).querySelector(`.mchat-bubble[data-id="${id}"]`);
  if(!b){ showToast("Messaggio non più nella chat"); return; }
  b.scrollIntoView({ behavior: "smooth", block: "center" });
  b.classList.remove("lampeggia"); void b.offsetWidth; b.classList.add("lampeggia");
}
function avviaRisposta(bolla){
  const ov = bolla.closest(".mchat-overlay");
  if(!ov || !bolla.dataset.id || bolla.dataset.id.startsWith("tmp")) return;
  const out = bolla.classList.contains("out");
  const titolo = ov.querySelector(".mchat-header-name")?.textContent?.trim() || "";
  const firma = bolla.querySelector(":scope > div[style*='font-weight:700']")?.textContent?.trim();
  const testoEl = bolla.querySelector(".mchat-bubble-text");
  let tipo = "testo", testo = testoEl ? testoEl.textContent.trim() : "";
  if(!testo){
    if(bolla.querySelector("audio")) tipo = "audio";
    else if(bolla.querySelector("video")) tipo = "video";
    else if(bolla.querySelector("img")) tipo = "foto";
    else tipo = "documento";
    testo = ETICHETTE_TIPO_CIT[tipo];
  }
  rispostaInCorso = { ov: ov.id, id: bolla.dataset.id, nome: out ? "Tu" : (firma || titolo || "Messaggio"), testo: testo.slice(0, 160), tipo };
  mostraBarraRisposta();
  const inp = ov.querySelector(".mchat-input-bar input, .mchat-input-bar textarea");
  if(inp) setTimeout(() => inp.focus(), 50);
}
function mostraBarraRisposta(){
  document.querySelectorAll(".risposta-bar").forEach(x => x.remove());
  const r = rispostaInCorso; if(!r) return;
  const ov = document.getElementById(r.ov);
  const barra = ov && ov.querySelector(".mchat-input-bar");
  if(!barra) return;
  barra.insertAdjacentHTML("beforebegin", `<div class="risposta-bar"><div class="rb-cit"><b>Rispondi a ${escapeHtml(r.nome)}</b><span>${escapeHtml(r.testo)}</span></div><button type="button" aria-label="Annulla risposta" onclick="annullaRisposta()">✕</button></div>`);
}
function annullaRisposta(){ rispostaInCorso = null; document.querySelectorAll(".risposta-bar").forEach(x => x.remove()); }
// usata dagli invii: restituisce la citazione solo se la chat della risposta è ancora aperta
function consumaRisposta(){
  const r = rispostaInCorso;
  if(!r) return null;
  annullaRisposta();
  if(!document.getElementById(r.ov)?.classList.contains("active")) return null;
  return { id: r.id, nome: r.nome, testo: r.testo, tipo: r.tipo };
}
(function(){
  let x0 = 0, y0 = 0, bolla = null, dx = 0;
  document.addEventListener("touchstart", e => {
    const b = e.target.closest && e.target.closest(".mchat-overlay .mchat-bubble[data-id]");
    if(!b || e.target.closest("audio, video, a, button")){ bolla = null; return; }
    bolla = b; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0;
  }, { passive: true });
  document.addEventListener("touchmove", e => {
    if(!bolla) return;
    dx = e.touches[0].clientX - x0;
    const dy = Math.abs(e.touches[0].clientY - y0);
    if(dy > 30 && dy > Math.abs(dx)){ bolla.style.transform = ""; bolla = null; return; }
    if(dx > 0) bolla.style.transform = `translateX(${Math.min(dx, 80)}px)`;
  }, { passive: true });
  document.addEventListener("touchend", () => {
    if(!bolla) return;
    const b = bolla; bolla = null; b.style.transform = "";
    if(dx > 60) avviaRisposta(b);
  });
  document.addEventListener("dblclick", e => {
    const b = e.target.closest && e.target.closest(".mchat-overlay .mchat-bubble[data-id]");
    if(b && !e.target.closest("audio, video, a, button")){ e.preventDefault(); avviaRisposta(b); }
  });
})();

