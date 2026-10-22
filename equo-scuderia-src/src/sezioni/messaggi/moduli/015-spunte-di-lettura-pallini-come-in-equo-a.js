// Equo App · messaggi · modulo (moduli ES, costruiti con Vite in ruoli/messaggi/costruito.js)
import { currentChatMembro } from "./014-chat-interna-membro-equo-app-struttura.js";
import { citazioneHtml, corpoMessaggioChat, registraMsgCit } from "./016-risposta-a-un-messaggio-stile-whatsapp-c.js";
/* ---------- SPUNTE DI LETTURA (pallini, come in Equo App) ----------
   1 pallino grigio = inviato · 2 grigi = consegnato · 2 verde scuro = letto */
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
function oraBollaScuderia(m, mine){
  const ora = new Date(m.created_at).toLocaleString("it-IT",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
  return `<div class="bolla-ora"><span class="t">${ora}</span>${mine ? ferriHtml(statoSpunta(m)) : ""}</div>`;
}
async function segnaConsegnati(){
  if(DEMO_MODE || !currentUser || document.visibilityState !== "visible") return;
  try{ await sb.rpc("segna_messaggi_consegnati"); }catch(e){}
}
document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible") segnaConsegnati(); });

function renderChatMessaggi(messaggi){
  const box = document.getElementById("chat-messages");
  if(!box) return;
  const wasAtBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 40;
  const html = messaggi.map(msg => {
    const mine = msg.mittente_user_id === currentUser.id;
    registraMsgCit(msg, mine ? "Tu" : (msg.mittente_user_id === currentChatMembro?.user_id ? (currentChatMembro?.nome_visualizzato || "Cliente") : "Staff del centro"));
    return `<div class="sbolla${mine ? " mia" : ""}" data-id="${escapeHtml(msg.id || "")}" style="align-self:${mine ? "flex-end" : "flex-start"};max-width:80%;background:${mine ? "var(--primary)" : "var(--muted-bg)"};color:${mine ? "#fff" : "var(--text)"};padding:8px 12px;border-radius:12px;font-size:13.5px;white-space:pre-wrap;word-break:break-word">`
      + citazioneHtml(msg) + corpoMessaggioChat(msg, mine)
      + oraBollaScuderia(msg, mine) + `</div>`;
  }).join("") || `<p style="color:var(--muted);font-size:12.5px;text-align:center;margin:auto">Nessun messaggio ancora. Scrivi il primo!</p>`;
  if(box.dataset.html === html) return; // nulla di nuovo: non si ridisegna
  box.dataset.html = html;
  box.innerHTML = html;
  if(wasAtBottom || messaggi.length <= 1) box.scrollTop = box.scrollHeight;
}

// Foto e PDF nella chat con i clienti (stesso contenitore "chat-allegati" di Equo App)

export { oraBollaScuderia, renderChatMessaggi, segnaConsegnati };
