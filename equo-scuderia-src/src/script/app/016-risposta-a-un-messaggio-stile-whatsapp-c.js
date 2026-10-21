/* ---------- RISPOSTA A UN MESSAGGIO (stile WhatsApp, come in Equo App) ----------
   Scorri una bolla verso destra (o doppio clic) → barra «Rispondi a …» sopra il campo di testo. */
const ETICHETTE_TIPO_CIT = { audio: "🎤 Nota vocale", foto: "📷 Foto", video: "🎬 Video", documento: "📄 Documento" };
const msgCit = {};
let rispostaInCorso = null; // { box, id, nome, testo, tipo }
function registraMsgCit(m, nome){
  if(!m || !m.id) return;
  msgCit[m.id] = { nome, tipo: m.tipo || "testo", testo: (m.testo || ETICHETTE_TIPO_CIT[m.tipo] || "Messaggio").slice(0, 160) };
}
function citazioneHtml(m){
  const r = m && m.risposta;
  if(!r || typeof r !== "object" || !r.id) return "";
  const testo = r.testo || ETICHETTE_TIPO_CIT[r.tipo] || "Messaggio";
  return `<div class="scit" onclick="event.stopPropagation();vaiAlMessaggio('${String(r.id).replace(/[^a-zA-Z0-9_-]/g, "")}', this)"><b>${escapeHtml(r.nome || "")}</b><span>${escapeHtml(testo)}</span></div>`;
}
function vaiAlMessaggio(id, da){
  const box = da && da.closest("#chat-messages, #chat-pro-messages");
  const b = (box || document).querySelector(`.sbolla[data-id="${id}"]`);
  if(!b){ showToast("Messaggio non più nella chat"); return; }
  b.scrollIntoView({ behavior: "smooth", block: "center" });
  b.classList.remove("lampeggia"); void b.offsetWidth; b.classList.add("lampeggia");
}
const INPUT_DI_BOX = { "chat-messages": "chat-input", "chat-pro-messages": "chat-pro-input" };
function avviaRisposta(b){
  const box = b.closest("#chat-messages, #chat-pro-messages");
  const info = msgCit[b.dataset.id];
  if(!box || !info) return;
  rispostaInCorso = { box: box.id, id: b.dataset.id, ...info };
  document.querySelectorAll(".srisposta-bar").forEach(x => x.remove());
  const inp = document.getElementById(INPUT_DI_BOX[box.id]);
  if(!inp) return;
  inp.parentElement.insertAdjacentHTML("beforebegin", `<div class="srisposta-bar"><div class="rb-cit"><b>Rispondi a ${escapeHtml(info.nome)}</b><span>${escapeHtml(info.testo)}</span></div><button type="button" aria-label="Annulla risposta" onclick="annullaRisposta()">✕</button></div>`);
  setTimeout(() => inp.focus(), 50);
}
function annullaRisposta(){ rispostaInCorso = null; document.querySelectorAll(".srisposta-bar").forEach(x => x.remove()); }
function consumaRisposta(boxId){
  const r = rispostaInCorso;
  if(!r || r.box !== boxId) return null;
  annullaRisposta();
  if(!document.getElementById(boxId)?.offsetParent) return null;
  return { id: r.id, nome: r.nome, testo: r.testo, tipo: r.tipo };
}
(function(){
  let x0 = 0, y0 = 0, bolla = null, dx = 0;
  document.addEventListener("touchstart", e => {
    const b = e.target.closest && e.target.closest(".sbolla[data-id]");
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
    const b = e.target.closest && e.target.closest(".sbolla[data-id]");
    if(b && !e.target.closest("audio, video, a, button")){ e.preventDefault(); avviaRisposta(b); }
  });
})();

function corpoMessaggioChat(msg, mine){
  const testo = msg.testo ? escapeHtml(msg.testo) : "";
  if(msg.tipo === "foto" && msg.file_url){
    return `<a href="${escapeHtml(urlSicuro(msg.file_url))}" target="_blank" rel="noopener"><img src="${escapeHtml(urlSicuro(msg.file_url))}" alt="Foto" loading="lazy" style="max-width:220px;max-height:260px;border-radius:10px;display:block;object-fit:cover"></a>${testo ? `<div style="margin-top:4px">${testo}</div>` : ""}`;
  }
  if(msg.tipo === "video" && msg.file_url){
    return `<video controls playsinline preload="metadata" src="${escapeHtml(msg.file_url)}" style="max-width:220px;max-height:260px;border-radius:10px;display:block"></video>${testo ? `<div style="margin-top:4px">${testo}</div>` : ""}`;
  }
  if(msg.tipo === "audio" && (msg.audio_url || msg.file_url)){
    return `<audio controls preload="none" src="${escapeHtml(msg.audio_url || msg.file_url)}" style="max-width:230px;height:36px;display:block"></audio>${testo ? `<div style="margin-top:4px">${testo}</div>` : ""}`;
  }
  if(msg.tipo === "documento" && msg.file_url){
    return `<a href="${escapeHtml(urlSicuro(msg.file_url))}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;color:inherit;text-decoration:none"><span style="background:#c0392b;color:#fff;font-size:9px;font-weight:800;border-radius:5px;padding:8px 5px">PDF</span><span style="text-decoration:underline">${escapeHtml(msg.file_nome || "Documento.pdf")}</span></a>${testo ? `<div style="margin-top:4px">${testo}</div>` : ""}`;
  }
  return testo;
}
async function riduciFotoChat(file){
  const url = await new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = ko; r.readAsDataURL(file); });
  const img = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = url; });
  const k = Math.min(1, 1600 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return await new Promise(ok => c.toBlob(ok, "image/jpeg", 0.82));
}
async function inviaAllegatoChat(event){
  const file = event.target.files && event.target.files[0];
  event.target.value = "";
  if(!file || !currentChatMembro) return;
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
  const isImg = (file.type || "").startsWith("image/");
  if(!isPdf && !isImg){ showToast("Puoi allegare foto o documenti PDF."); return; }
  if(isPdf && file.size > 10 * 1024 * 1024){ showToast("PDF troppo grande (max 10 MB)."); return; }
  const tipo = isPdf ? "documento" : "foto";
  const file_nome = isPdf ? (file.name || "Documento.pdf") : "Foto.jpg";
  try{
    if(DEMO_MODE){
      demoState.chat = demoState.chat || {};
      if(!demoState.chat[currentChatMembro.id]) demoState.chat[currentChatMembro.id] = [];
      demoState.chat[currentChatMembro.id].push({ id: "chat" + (demoIdCounter++ + 900), mittente_user_id: currentUser.id, testo: null, tipo, file_url: URL.createObjectURL(file), file_nome, created_at: new Date().toISOString() });
    } else {
      showToast(isPdf ? "Invio del PDF…" : "Invio della foto…");
      let blob = file;
      if(!isPdf){ try{ blob = await riduciFotoChat(file) || file; } catch(e){ console.error("riduci foto:", e); } }
      const rnd = crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2);
      const path = `${currentUser.id}/scuderia/${rnd}.${isPdf ? "pdf" : "jpg"}`;
      const up = await sb.storage.from("chat-allegati").upload(path, blob, { contentType: isPdf ? "application/pdf" : "image/jpeg" });
      if(up.error) throw up.error;
      const file_url = sb.storage.from("chat-allegati").getPublicUrl(path).data?.publicUrl;
      const { error } = await sb.from("chat_messaggi").insert({ centro_id: currentCentro.id, membro_id: currentChatMembro.id, mittente_user_id: currentUser.id, testo: null, tipo, file_url, file_nome });
      if(error) throw error;
    }
    await loadAndRenderChat();
  } catch(err){
    console.error("inviaAllegatoChat:", err);
    showToast("Invio non riuscito: " + (err?.message || "riprova"));
  }
}

async function inviaChatMessaggio(){
  const input = document.getElementById("chat-input");
  const testo = input.value.trim();
  if(!testo || !currentChatMembro) return;
  input.value = "";
  try{
    if(DEMO_MODE){
      demoState.chat = demoState.chat || {};
      if(!demoState.chat[currentChatMembro.id]) demoState.chat[currentChatMembro.id] = [];
      demoState.chat[currentChatMembro.id].push({ id:"chat" + (demoIdCounter++ + 900), mittente_user_id: currentUser.id, testo, risposta: consumaRisposta("chat-messages"), created_at: new Date().toISOString() });
    } else {
      const risposta = consumaRisposta("chat-messages");
      const { error } = await sb.from("chat_messaggi").insert({
        centro_id: currentCentro.id, membro_id: currentChatMembro.id, mittente_user_id: currentUser.id, testo, ...(risposta ? { risposta } : {}),
      });
      if(error) throw error;
    }
    await loadAndRenderChat();
  } catch(err){
    showToast("Errore nell'invio del messaggio.");
    input.value = testo;
  }
}

