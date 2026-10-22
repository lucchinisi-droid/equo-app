// Equo App · chat · modulo (moduli ES, costruiti con Vite in ruoli/chat/costruito.js)
import { formatChatTime } from "./062-chat-mascalcia-stile-whatsapp.js";
/* ---------- SPUNTE DI LETTURA (pallini) ---------- */
const FERRO_D = "M0.8 11.6V6A5.2 5.2 0 0 1 11.2 6V11.6H8.5V6.2A2.5 2.5 0 0 0 3.5 6.2V11.6Z M1.8 7.4h1v1.1h-1Z M1.8 9.6h1v1.1h-1Z M9.2 7.4h1v1.1h-1Z M9.2 9.6h1v1.1h-1Z M2.4 3.9l.8-.8.8.8-.8.8Z M7.9 3.9l.8-.8.8.8-.8.8Z";
function statoSpunta(m){ return m.letto ? "letto" : (m.consegnato_at ? "consegnato" : "inviato"); }
function ferriHtml(stato){
  const titoli = { inviato: "Inviato", consegnato: "Consegnato", letto: "Letto" };
  // pallini: 1 grigio = inviato · 2 grigi = consegnato · 2 verde scuro = letto
  const uno = x => `<circle cx="${x}" cy="4" r="3.4" fill="currentColor"/>`;
  const svg = stato === "inviato"
    ? `<svg viewBox="0 0 8 8" aria-hidden="true">${uno(4)}</svg>`
    : `<svg viewBox="0 0 19 8" aria-hidden="true">${uno(4)}${uno(15)}</svg>`;
  return `<span class="ferri ferri-${stato}" title="${titoli[stato]}" aria-label="${titoli[stato]}">${svg}</span>`;
}
// riga ora + ferri (i ferri solo sui messaggi inviati da me)
function oraBolla(m, out){
  return `<div class="mchat-bubble-time"><span class="t">${formatChatTime(m.created_at)}</span>${out ? ferriHtml(statoSpunta(m)) : ""}</div>`;
}
function attrBolla(m, out, tabella){
  if(!m.id) return "";
  return ` data-id="${escapeHtml(m.id)}"` + (out ? ` data-mid="${escapeHtml(m.id)}" data-tab="${tabella}" data-stato="${statoSpunta(m)}"` : "");
}
// aggiorna i ferri delle bolle aperte senza ricaricare la chat
async function aggiornaSpunte(){
  if(DEMO_MODE || !currentUser) return;
  const bolle = [...document.querySelectorAll('.mchat-bubble.out[data-mid]:not([data-stato="letto"])')]
    .filter(b => b.offsetParent !== null);
  if(!bolle.length) return;
  const perTab = {};
  bolle.forEach(b => (perTab[b.dataset.tab] = perTab[b.dataset.tab] || []).push(b.dataset.mid));
  for(const [tab, ids] of Object.entries(perTab)){
    const { data, error } = await sb.from(tab).select("id, letto, consegnato_at").in("id", ids.slice(-100));
    if(error || !data) continue;
    data.forEach(r => {
      const stato = statoSpunta(r);
      document.querySelectorAll(`.mchat-bubble.out[data-mid="${r.id}"]`).forEach(b => {
        if(b.dataset.stato === stato) return;
        b.dataset.stato = stato;
        const f = b.querySelector(".ferri");
        if(f) f.outerHTML = ferriHtml(stato);
      });
    });
  }
}
// "consegnato": appena apro Equo (e poi periodicamente) i messaggi indirizzati a me risultano consegnati
async function segnaConsegnati(){
  if(DEMO_MODE || !currentUser || document.visibilityState !== "visible") return;
  try{ await sb.rpc("segna_messaggi_consegnati"); }catch(e){}
}
let spunteTimer = null;
function avviaSpunte(){
  segnaConsegnati();
  clearInterval(spunteTimer);
  let giri = 0;
  spunteTimer = setInterval(() => {
    aggiornaSpunte();
    if(++giri % 5 === 0) segnaConsegnati(); // ogni ~30 s
  }, 6000);
}
document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible"){ segnaConsegnati(); aggiornaSpunte(); } });


export { attrBolla, avviaSpunte, oraBolla };
