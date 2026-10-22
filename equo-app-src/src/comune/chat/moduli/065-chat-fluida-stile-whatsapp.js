// Equo App · chat · modulo (moduli ES, costruiti con Vite in ruoli/chat/costruito.js)
import { formatChatDay, formatChatTime } from "./062-chat-mascalcia-stile-whatsapp.js";
import { citazioneHtml, rispostaInCorso } from "./063-risposta-a-un-messaggio-stile-whatsapp.js";
import { attrBolla, oraBolla } from "./064-spunte-di-lettura-pallini.js";
import { refreshChatBadge } from "./070-notifiche-badge-messaggi-non-letti.js";
/* ---------- CHAT FLUIDA (stile WhatsApp) ----------
   - apertura istantanea: si mostra subito l'ultima versione del thread in memoria, poi si aggiorna;
   - aggiornamento senza sfarfallio: si aggiungono solo i messaggi nuovi (niente ricarica completa,
     le note vocali in riproduzione non si interrompono);
   - tempo reale (Supabase Realtime) + controllo di riserva ogni 4 s mentre la chat è aperta;
   - invio ottimistico: la bolla compare subito, con l'orologio finché il server non conferma. */
const cacheThread = new Map();
function vicinoAlFondo(box){ return box.scrollHeight - box.scrollTop - box.clientHeight < 120; }
function inizioThread(box, chiave){
  if(box.dataset.thread === chiave && !box.dataset.vuoto) return; // già aperto: aggiornamento silenzioso
  delete box.dataset.vuoto;
  if(cacheThread.has(chiave)){
    box.innerHTML = cacheThread.get(chiave);
    box.dataset.thread = chiave;
    box.scrollTop = box.scrollHeight;
  } else {
    box.dataset.thread = "";
    box.innerHTML = '<div class="loading"><div class="spinner"></div> Caricamento...</div>';
  }
}
function applicaThread(box, chiave, html){
  cacheThread.set(chiave, html);
  delete box.dataset.vuoto;
  const tpl = document.createElement("div");
  tpl.innerHTML = html;
  const nuovi = [...tpl.children];
  const inAttesa = [...box.querySelectorAll(".mchat-bubble.pending")];
  const vecchi = [...box.children].filter(el => !el.classList.contains("pending") && !el.classList.contains("mchat-nuovi"));
  const eraInFondo = vicinoAlFondo(box) || inAttesa.length > 0;
  const stessoThread = box.dataset.thread === chiave && vecchi.length > 0 && vecchi.every(el => el.dataset.id);
  const idNuovi = nuovi.map(el => el.dataset.id);
  const prefisso = stessoThread && vecchi.length <= nuovi.length && vecchi.every((el, i) => el.dataset.id === idNuovi[i]);
  if(!prefisso){
    box.innerHTML = html;
    box.dataset.thread = chiave;
    box.scrollTop = box.scrollHeight;
    return;
  }
  // aggiorna i ferri delle bolle già presenti
  vecchi.forEach((el, i) => {
    const n = nuovi[i];
    if(el.dataset.stato && n.dataset.stato && el.dataset.stato !== n.dataset.stato){
      el.dataset.stato = n.dataset.stato;
      const f = el.querySelector(".ferri"), nf = n.querySelector(".ferri");
      if(f && nf) f.outerHTML = nf.outerHTML;
    }
  });
  const aggiunti = nuovi.slice(vecchi.length);
  if(!aggiunti.length && !inAttesa.length) return;
  // le bolle "in invio" lasciano il posto a quelle vere (in attesa restano solo quelle non ancora arrivate)
  const daRimuovere = inAttesa.slice(0, aggiunti.filter(el => el.classList.contains("out")).length);
  daRimuovere.forEach(el => el.remove());
  const primaPending = box.querySelector(".mchat-bubble.pending");
  let arrivatiDaAltri = false;
  aggiunti.forEach(el => {
    el.classList.add("nuovo");
    if(el.classList.contains("in")) arrivatiDaAltri = true;
    box.insertBefore(el, primaPending || box.querySelector(".mchat-nuovi"));
  });
  if(eraInFondo){
    box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  } else if(arrivatiDaAltri){
    mostraPillolaNuovi(box);
  }
}
function mostraPillolaNuovi(box){
  let pill = box.querySelector(".mchat-nuovi");
  if(!pill){
    pill = document.createElement("button");
    pill.className = "mchat-nuovi";
    pill.textContent = "Nuovi messaggi ↓";
    pill.onclick = () => { box.scrollTo({ top: box.scrollHeight, behavior: "smooth" }); pill.remove(); };
    box.appendChild(pill);
    box.addEventListener("scroll", function via(){ if(vicinoAlFondo(box)){ pill.remove(); box.removeEventListener("scroll", via); } });
  }
}
// bolla ottimistica: compare subito con l'orologio
function bollaInAttesa(boxId, testo){
  const box = document.getElementById(boxId);
  if(!box) return null;
  if(box.dataset.vuoto){ box.innerHTML = ""; }
  const el = document.createElement("div");
  el.className = "mchat-bubble out pending nuovo";
  el.innerHTML = `${rispostaInCorso ? citazioneHtml({ risposta: rispostaInCorso }) : ""}<div class="mchat-bubble-text">${escapeHtml(testo)}</div><div class="mchat-bubble-time"><span class="t">${formatChatTime(new Date().toISOString())}</span><span class="ferri ferri-invio" title="Invio in corso">${ICONA_OROLOGIO}</span></div>`;
  box.appendChild(el);
  box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  return el;
}
const ICONA_OROLOGIO = '<svg viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M6 3.4V6l1.8 1.1" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
function bollaNonInviata(el){
  if(!el) return;
  el.classList.remove("pending");
  el.classList.add("failed");
  const f = el.querySelector(".ferri");
  if(f) f.outerHTML = '<span class="ferri ferri-errore" title="Non inviato">!</span>';
}

// tempo reale + controllo di riserva mentre una chat è aperta
const chatLive = { chiave: null, canale: null, timer: null, inCorso: false, ancora: false, cfg: null };
function avviaChatLive(cfg){
  // cfg: { chiave, tabella, colonna, valore, aggiorna: async fn, segnaLetti: async fn, overlay }
  fermaChatLive();
  chatLive.chiave = cfg.chiave; chatLive.cfg = cfg;
  if(DEMO_MODE) return;
  try{
    chatLive.canale = sb.channel("chat-" + cfg.chiave.replace(/[^a-z0-9-]/gi, "-"))
      .on("postgres_changes", { event: "*", schema: "public", table: cfg.tabella, filter: `${cfg.colonna}=eq.${cfg.valore}` }, (p) => {
        const r = p.new || {};
        const altrui = p.eventType === "INSERT" && !eMioMessaggio(cfg.tabella, r);
        aggiornaChatLive(altrui);
      })
      .subscribe();
  }catch(e){ console.error("realtime chat:", e); }
  chatLive.timer = setInterval(() => {
    const ov = document.getElementById(cfg.overlay);
    if(!ov || !ov.classList.contains("active")){ fermaChatLive(); return; }
    if(document.visibilityState === "visible") aggiornaChatLive(false);
  }, 4000);
}
function eMioMessaggio(tabella, r){
  if(tabella === "messaggi_proprietari") return r.mittente_id === currentUser?.id;
  if(tabella === "chat_messaggi") return r.mittente_user_id === currentUser?.id;
  if(tabella === "messaggi_mascalcia") return chatLive.chiave?.startsWith("mchat:") ? r.mittente_tipo === "maniscalco" : r.mittente_tipo !== "maniscalco";
  return false;
}
let letturaTimer = null;
async function aggiornaChatLive(conNuoviAltrui){
  const cfg = chatLive.cfg;
  if(!cfg) return;
  if(chatLive.inCorso){ chatLive.ancora = true; return; }
  chatLive.inCorso = true;
  try{
    await cfg.aggiorna();
    // i messaggi arrivati mentre guardo la chat sono letti
    const box = document.querySelector("#" + cfg.overlay + " .mchat-messages");
    const nonLetti = box && [...box.querySelectorAll(".mchat-bubble.in.nuovo")].length;
    if((conNuoviAltrui || nonLetti) && document.visibilityState === "visible" && cfg.segnaLetti){
      clearTimeout(letturaTimer);
      letturaTimer = setTimeout(() => { cfg.segnaLetti().then(() => refreshChatBadge && refreshChatBadge()).catch(() => {}); }, 400);
      box && box.querySelectorAll(".mchat-bubble.in.nuovo").forEach(el => el.classList.remove("nuovo"));
    }
  } catch(e){ console.error("aggiornaChatLive:", e); }
  chatLive.inCorso = false;
  if(chatLive.ancora){ chatLive.ancora = false; aggiornaChatLive(false); }
}
function fermaChatLive(){
  clearInterval(chatLive.timer); chatLive.timer = null;
  if(chatLive.canale){ try{ sb.removeChannel(chatLive.canale); }catch(e){} }
  chatLive.canale = null; chatLive.chiave = null; chatLive.cfg = null;
}
document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible" && chatLive.cfg) aggiornaChatLive(true); });

async function renderChatThread(clienteId){
  const box = document.getElementById("mchat-messages");
  const chiaveThread = "mchat:" + clienteId;
  inizioThread(box, chiaveThread);
  const data = await DB.listThreadMascalcia(clienteId);
  if(!data || data.length === 0){
    box.innerHTML = '<div class="muted" style="font-size:13px;text-align:center;margin-top:20px">Nessun messaggio ancora.<br>Scrivi il primo messaggio qui sotto.</div>';
    box.dataset.thread = chiaveThread; box.dataset.vuoto = '1';
    return;
  }
  let lastDay = null;
  let html = "";
  data.forEach(m => {
    const day = formatChatDay(m.created_at);
    if(day !== lastDay){
      html += `<div class="mchat-day-sep" data-id="day-${escapeHtml(day)}">${day}</div>`;
      lastDay = day;
    }
    const out = m.mittente_tipo === "maniscalco";
    const body = m.tipo === "audio"
      ? `<div class="mchat-audio-bubble"><audio controls src="${escapeHtml(m.audio_url)}"></audio></div>`
      : (m.tipo === "documento" || m.tipo === "foto" || m.tipo === "video")
        ? bollaAllegato(m.tipo, m.file_url, m.file_nome, m.testo)
        : `<div class="mchat-bubble-text">${escapeHtml(m.testo || "")}</div>`;
    const firma = !out && m.mittente_nome ? `<div style="font-size:11px;font-weight:700;color:var(--primary);margin-bottom:2px">${escapeHtml(m.mittente_nome)}</div>` : "";
    html += `
      <div class="mchat-bubble ${out ? "out" : "in"}"${attrBolla(m, out, "messaggi_mascalcia")}>
        ${firma}${citazioneHtml(m)}${body}
        ${oraBolla(m, out)}
      </div>`;
  });
  applicaThread(box, chiaveThread, html);
}


export { aggiornaChatLive, applicaThread, avviaChatLive, bollaInAttesa, bollaNonInviata, fermaChatLive, inizioThread, renderChatThread };
