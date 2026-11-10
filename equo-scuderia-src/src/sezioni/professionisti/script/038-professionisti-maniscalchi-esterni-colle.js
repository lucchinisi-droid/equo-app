/* ---------- PROFESSIONISTI (maniscalchi esterni collegati via Equo App) ----------
   Opzione A: la struttura è un cliente "struttura" del maniscalco (clienti_mascalcia.centro_id).
   Collegamento con doppia conferma (RPC scuderia_aggiungi_maniscalco / scuderia_rispondi_collegamento /
   scuderia_scollega_professionista). Accettano/chiudono: admin o livello 2-3. Chat ed eventi: tutto lo staff. */
let professionistiList = [];
let proDaScollegare = null;

function puoCollegareProfessionisti(){
  if(!currentMembro) return false;
  return currentMembro.ruolo === "admin" || ["admin","2","3"].includes(String(currentMembro.livello || ""));
}

function selezionaTabPro(tab){
  document.querySelectorAll(".pro-tab").forEach(b => b.classList.toggle("active", b.dataset.proTab === tab));
  ["maniscalchi","veterinari","istruttori"].forEach(t => {
    const el = document.getElementById("pro-tab-" + t);
    if(el) el.style.display = t === tab ? "block" : "none";
  });
  const btn = document.getElementById("btn-aggiungi-pro");
  if(btn) btn.style.display = (tab === "maniscalchi" && puoCollegareProfessionisti()) ? "" : "none";
}

async function loadProfessionisti(){
  if(DEMO_MODE){
    professionistiList = [{ cliente_id: "demo-pro-1", categoria: "maniscalco", nome: "Marco Ferri", stato: "attivo", certificato: true, non_letti: 0, da_confermare: 0 }];
    aggiornaBadgeProfessionisti(); return;
  }
  if(!currentCentro){ professionistiList = []; return; }
  const { data, error } = await sb.rpc("scuderia_lista_professionisti", { p_centro_id: currentCentro.id });
  if(error){ console.error("scuderia_lista_professionisti:", error); professionistiList = []; return; }
  professionistiList = data || [];
  aggiornaBadgeProfessionisti();
}

// Contatore a semaforo (come gli altri del menu): rosso = qualcosa da confermare dalla struttura
// (richieste di collegamento o appuntamenti proposti dal maniscalco), giallo = messaggi non letti, verde = tutto a posto.
function aggiornaBadgeProfessionisti(){
  const daConfermare = professionistiList.reduce((t, p) => t + (Number(p.da_confermare) || 0) + (p.stato === "da_confermare_struttura" ? 1 : 0), 0);
  const nonLetti = professionistiList.reduce((t, p) => t + (Number(p.non_letti) || 0), 0);
  impostaContatoreNav("pro-nav-badge", daConfermare + nonLetti, daConfermare ? "rosso" : nonLetti ? "giallo" : "verde");
}

async function refreshProfessionistiModule(){
  selezionaTabPro(document.querySelector(".pro-tab.active")?.dataset.proTab || "maniscalchi");
  const hint = document.getElementById("pro-codice-centro-hint");
  if(hint && currentCentro?.join_code){
    hint.innerHTML = `Il maniscalco può anche chiedere il collegamento da Equo App inserendo il codice del centro <strong>${escapeHtml(currentCentro.join_code)}</strong>: la richiesta compare qui da accettare.`;
  }
  await loadProfessionisti();
  renderProfessionistiList();
}

function renderProfessionistiList(){
  const box = document.getElementById("pro-maniscalchi-list");
  const empty = document.getElementById("pro-maniscalchi-empty");
  if(!box) return;
  const lista = professionistiList.filter(p => p.categoria === "maniscalco");
  empty.style.display = lista.length ? "none" : "block";
  const puo = puoCollegareProfessionisti();
  const ordine = { da_confermare_struttura: 0, attivo: 1, da_confermare_pro: 2 };
  box.innerHTML = lista.slice().sort((a, b) => (ordine[a.stato] - ordine[b.stato]) || (a.nome || "").localeCompare(b.nome || "")).map(p => {
    const avatar = p.avatar_url ? `<img src="${escapeHtml(p.avatar_url)}" alt="">` : '<i class="fa-solid fa-user"></i>';
    const cert = (p.certificato ? ' <span class="badge-pill badge-green" style="font-size:10.5px;padding:2px 8px" title="P.IVA verificata da Equo"><i class="fa-solid fa-circle-check"></i> Equo Certified</span>' : "")
      + (p.senza_piva ? ' <span class="badge-pill badge-yellow" style="font-size:10.5px;padding:2px 8px" title="Il professionista non ha ancora inserito P.IVA o codice fiscale nel suo profilo Equo"><i class="fa-solid fa-triangle-exclamation"></i> P.IVA/CF mancante</span>' : "");
    let stato = "", azioni = "";
    if(p.stato === "attivo"){
      stato = '<span style="color:#2f8a4e;font-weight:600">Collegato</span>'
        + (p.di_fiducia ? ' · <span style="color:#2f8a4e;font-weight:600" title="I suoi appuntamenti non hanno bisogno della vostra conferma"><i class="fa-solid fa-handshake"></i> Di fiducia</span>' : "");   // SQL 55
      azioni = `
        <button class="btn btn-outline btn-sm" onclick="apriChatProfessionista('${p.cliente_id}')"><i class="fa-solid fa-comment-dots"></i> Chatta</button>
        <button class="btn btn-outline btn-sm" onclick="apriEventiProfessionista('${p.cliente_id}')"><i class="fa-solid fa-calendar-check"></i> Appuntamenti</button>
        ${puo ? `<button class="btn btn-ghost btn-sm" title="Chiudi collegamento" onclick="chiediScollegaProfessionista('${p.cliente_id}')"><i class="fa-solid fa-link-slash"></i></button>` : ""}`;
    } else if(p.stato === "da_confermare_pro"){
      stato = "Invito inviato: in attesa che il maniscalco accetti";
      azioni = puo ? `<button class="btn btn-ghost btn-sm" onclick="chiediScollegaProfessionista('${p.cliente_id}')">Annulla invito</button>` : "";
    } else if(p.stato === "da_confermare_struttura"){
      stato = '<span style="color:var(--danger);font-weight:600">Chiede di collegarsi al centro</span>';
      azioni = puo
        ? `<button class="btn btn-primary btn-sm btn-conferma" onclick="rispondiCollegamentoPro('${p.cliente_id}', true, this)">Accetta</button>
           <button class="btn btn-ghost btn-sm" onclick="rispondiCollegamentoPro('${p.cliente_id}', false, this)">Rifiuta</button>`
        : '<span style="color:var(--muted);font-size:12px">Può accettare l\'amministratore o un membro di livello 2-3</span>';
    }
    return `
      <div class="msg-item" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap${p.stato === "attivo" ? ";cursor:pointer" : ""}"${p.stato === "attivo" ? ` onclick="apriSchedaProfessionista('${p.cliente_id}')" title="Apri la scheda: cavalli, lavori e documenti"` : ""}>
        <div style="display:flex;align-items:center;gap:12px;min-width:0">
          <div class="pro-avatar">${avatar}</div>
          <div style="min-width:0">
            <div><span class="who">${escapeHtml(p.nome || "Maniscalco")}</span>${cert}${Number(p.non_letti) ? '<span class="unread-dot" title="Messaggi non letti"></span>' : ""}</div>
            <div style="color:var(--muted);font-size:12px">Maniscalco · ${stato}</div>
            ${p.stato === "attivo" && (p.prossimo || Number(p.da_confermare)) ? `<div style="font-size:12px;margin-top:2px">${Number(p.da_confermare) ? `<span style="color:var(--danger);font-weight:700">${p.da_confermare} da confermare</span>${p.prossimo ? " · " : ""}` : ""}${p.prossimo ? `Prossimo: ${escapeHtml(p.prossimo.tipo)} ${escapeHtml(dataAppIt(p.prossimo.data, p.prossimo.ora))}` : ""}</div>` : ""}
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center" onclick="event.stopPropagation()">${azioni}${p.stato === "attivo" ? `<button class="btn btn-ghost btn-sm" title="Apri la scheda" onclick="apriSchedaProfessionista('${p.cliente_id}')"><i class="fa-solid fa-chevron-right"></i></button>` : ""}</div>
      </div>`;
  }).join("");
}

function chiediScollegaProfessionista(clienteId){
  const p = professionistiList.find(x => x.cliente_id === clienteId);
  if(!p) return;
  proDaScollegare = clienteId;
  document.getElementById("scollega-pro-text").textContent = p.stato === "attivo"
    ? `Vuoi chiudere il collegamento con ${p.nome}? La chat e gli appuntamenti con il centro non saranno più condivisi.`
    : `Vuoi annullare l'invito a ${p.nome}?`;
  openModal("modal-scollega-pro");
}

async function confermaScollegaProfessionista(){
  if(!proDaScollegare) return;
  const btn = document.getElementById("scollega-pro-btn");
  btn.disabled = true;
  const { data, error } = await sb.rpc("scuderia_scollega_professionista", { p_cliente_id: proDaScollegare });
  btn.disabled = false;
  closeModal("modal-scollega-pro");
  proDaScollegare = null;
  if(error || !data?.ok){ showToast((data && data.errore) || "Operazione non riuscita. Riprova."); return; }
  showToast("Collegamento chiuso.");
  await refreshProfessionistiModule();
}

// Step 2 (chat) e step 3 (appuntamenti) — sostituite più avanti
/* -- Chat con il maniscalco (step 2) -- */
let chatProCorrente = null;      // cliente_id del collegamento
let chatProPoll = null;
let chatProRecorder = null, chatProChunks = [], chatProRecTimer = null, chatProRecSec = 0, chatProStream = null;

async function apriChatProfessionista(clienteId){
  const p = professionistiList.find(x => x.cliente_id === clienteId);
  chatProCorrente = clienteId;
  document.getElementById("chat-pro-nome").textContent = p?.nome || "Maniscalco";
  document.getElementById("chat-pro-input").value = "";
  document.getElementById("chat-pro-messages").innerHTML = '<p style="color:var(--muted);font-size:12.5px;text-align:center;margin:auto">Caricamento…</p>';
  delete document.getElementById("chat-pro-messages").dataset.html;
  openModal("modal-chat-pro");
  await caricaChatProfessionista(true);
  clearInterval(chatProPoll);
  chatProPoll = setInterval(() => { if(document.getElementById("modal-chat-pro").classList.contains("active")) caricaChatProfessionista(false); else clearInterval(chatProPoll); }, 5000);
  ascoltaChat("messaggi_mascalcia", "cliente_mascalcia_id", clienteId, () => caricaChatProfessionista(false));
}

function chiudiChatProfessionista(){
  annullaAudioPro();
  clearInterval(chatProPoll);
  smettiAscoltoChat();
  closeModal("modal-chat-pro");
  chatProCorrente = null;
  refreshProfessionistiModule();
}

async function caricaChatProfessionista(segna){
  if(!chatProCorrente || DEMO_MODE) return;
  const { data, error } = await sb.rpc("scuderia_chat_professionista", { p_cliente_id: chatProCorrente });
  if(error || !data){ console.error("scuderia_chat_professionista:", error); return; }
  const box = document.getElementById("chat-pro-messages");
  const inFondo = box.scrollTop + box.clientHeight >= box.scrollHeight - 40;
  const msgs = data.messaggi || [];
  const html = msgs.map(m => {
    const mio = m.mittente_tipo === "cliente";
    const firma = mio && m.mittente_user_id !== currentUser.id && m.mittente_nome
      ? `<div style="font-size:10.5px;font-weight:700;opacity:.8;margin-bottom:2px">${escapeHtml(m.mittente_nome)}</div>` : "";
    registraMsgCit(m, mio ? (m.mittente_user_id === currentUser.id ? "Tu" : (m.mittente_nome || "Centro")) : (data.nome || "Maniscalco"));
    return `<div class="sbolla${mio ? " mia" : ""}" data-id="${escapeHtml(m.id || "")}" style="align-self:${mio ? "flex-end" : "flex-start"};max-width:80%;background:${mio ? "var(--primary)" : "var(--muted-bg)"};color:${mio ? "#fff" : "var(--text)"};padding:8px 12px;border-radius:12px;font-size:13.5px;white-space:pre-wrap;word-break:break-word">`
      + firma + citazioneHtml(m) + corpoMessaggioChat(m, mio)
      + oraBollaScuderia(m, mio) + `</div>`;
  }).join("") || '<p style="color:var(--muted);font-size:12.5px;text-align:center;margin:auto">Nessun messaggio ancora. Scrivi il primo!</p>';
  if(box.dataset.html !== html){ box.dataset.html = html; box.innerHTML = html; }
  if(inFondo || segna) box.scrollTop = box.scrollHeight;
  if(msgs.some(m => m.mittente_tipo === "maniscalco" && !m.letto)){
    await sb.rpc("scuderia_segna_letti_professionista", { p_cliente_id: chatProCorrente });
  }
}

async function inviaMessaggioPro(tipo, testo, file_url, file_nome){
  const risposta = consumaRisposta("chat-pro-messages");
  const { data, error } = await sb.rpc("scuderia_invia_messaggio_professionista", {
    p_cliente_id: chatProCorrente, p_tipo: tipo, p_testo: testo || null, p_file_url: file_url || null, p_file_nome: file_nome || null, ...(risposta ? { p_risposta: risposta } : {}) });
  if(error || !data?.ok){ showToast((data && data.errore) || ("Invio non riuscito: " + (error?.message || "riprova"))); return false; }
  await caricaChatProfessionista(true);
  return true;
}

async function inviaTestoPro(){
  const input = document.getElementById("chat-pro-input");
  const testo = input.value.trim();
  if(!testo || !chatProCorrente) return;
  input.value = "";
  const ok = await inviaMessaggioPro("testo", testo);
  if(!ok) input.value = testo;
}

async function caricaFileChatPro(blob, estensione, contentType){
  const rnd = crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2);
  const path = `${currentUser.id}/professionisti/${rnd}.${estensione}`;
  const up = await sb.storage.from("chat-allegati").upload(path, blob, { contentType });
  if(up.error) throw up.error;
  return sb.storage.from("chat-allegati").getPublicUrl(path).data?.publicUrl;
}

async function inviaAllegatoPro(event){
  const file = event.target.files && event.target.files[0];
  event.target.value = "";
  if(!file || !chatProCorrente) return;
  const tipoMime = file.type || "";
  const isPdf = tipoMime === "application/pdf" || /\.pdf$/i.test(file.name || "");
  const isVideo = tipoMime.startsWith("video/") || /\.(mp4|mov|m4v|webm|3gp)$/i.test(file.name || "");
  const isImg = tipoMime.startsWith("image/");
  if(!isPdf && !isVideo && !isImg){ showToast("Puoi allegare foto, video o documenti PDF."); return; }
  if(isPdf && file.size > 10 * 1024 * 1024){ showToast("PDF troppo grande (max 10 MB)."); return; }
  if(isVideo && file.size > 50 * 1024 * 1024){ showToast("Video troppo pesante (max 50 MB)."); return; }
  try{
    showToast(isVideo ? "Invio del video… (può volerci qualche secondo)" : isPdf ? "Invio del PDF…" : "Invio della foto…");
    let blob = file, ext, ct;
    if(isImg){ try{ blob = await riduciFotoChat(file) || file; } catch(e){ console.error("riduci foto:", e); } ext = "jpg"; ct = "image/jpeg"; }
    else if(isPdf){ ext = "pdf"; ct = "application/pdf"; }
    else {
      ext = ((file.name || "").split(".").pop() || "mp4").toLowerCase();
      ct = tipoMime || (ext === "mov" ? "video/quicktime" : "video/mp4");
    }
    const url = await caricaFileChatPro(blob, ext, ct);
    const nome = isPdf ? (file.name || "Documento.pdf") : isVideo ? "Video" : "Foto.jpg";
    await inviaMessaggioPro(isPdf ? "documento" : isVideo ? "video" : "foto", null, url, nome);
  } catch(err){
    console.error("inviaAllegatoPro:", err);
    showToast("Invio non riuscito: " + (err?.message || "riprova"));
  }
}

async function avviaAudioPro(){
  if(!chatProCorrente || chatProRecorder) return;
  if(!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined"){ showToast("Il browser non supporta la registrazione audio."); return; }
  try{
    chatProStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch(e){ showToast("Consenti l'uso del microfono per registrare una nota vocale."); return; }
  chatProChunks = [];
  chatProRecorder = new MediaRecorder(chatProStream);
  chatProRecorder.ondataavailable = e => { if(e.data && e.data.size > 0) chatProChunks.push(e.data); };
  chatProRecorder.start();
  chatProRecSec = 0;
  document.getElementById("chat-pro-rec-timer").textContent = "0:00";
  document.getElementById("chat-pro-rec").style.display = "flex";
  document.getElementById("chat-pro-bar").style.display = "none";
  chatProRecTimer = setInterval(() => {
    chatProRecSec++;
    document.getElementById("chat-pro-rec-timer").textContent = Math.floor(chatProRecSec / 60) + ":" + String(chatProRecSec % 60).padStart(2, "0");
    if(chatProRecSec >= 300) inviaAudioPro(); // massimo 5 minuti
  }, 1000);
}

function fermaAudioProUI(){
  clearInterval(chatProRecTimer); chatProRecTimer = null;
  document.getElementById("chat-pro-rec").style.display = "none";
  document.getElementById("chat-pro-bar").style.display = "flex";
  if(chatProStream){ chatProStream.getTracks().forEach(t => t.stop()); chatProStream = null; }
}

function annullaAudioPro(){
  if(chatProRecorder && chatProRecorder.state !== "inactive"){ chatProRecorder.onstop = null; chatProRecorder.stop(); }
  chatProRecorder = null; chatProChunks = [];
  if(document.getElementById("chat-pro-rec")) fermaAudioProUI();
}

function inviaAudioPro(){
  const rec = chatProRecorder;
  if(!rec || rec.state === "inactive") return;
  rec.onstop = async () => {
    fermaAudioProUI();
    const mime = (rec.mimeType || "audio/webm").split(";")[0];
    const blob = new Blob(chatProChunks, { type: mime });
    chatProRecorder = null; chatProChunks = [];
    if(blob.size < 800){ showToast("Registrazione troppo breve, riprova."); return; }
    try{
      showToast("Invio della nota vocale…");
      const ext = mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : mime.includes("mpeg") ? "mp3" : "webm";
      const url = await caricaFileChatPro(blob, ext, mime);
      await inviaMessaggioPro("audio", null, url, "Nota vocale");
    } catch(err){
      console.error("inviaAudioPro:", err);
      showToast("Invio non riuscito: " + (err?.message || "riprova"));
    }
  };
  rec.stop();
}
/* -- Appuntamenti con il maniscalco (step 3): gruppi di interventi_mascalcia, doppia conferma -- */
let appProCliente = null, appProLista = [], appProModificaGruppo = null;
const APP_TIPO_LABELS = { ferratura:"Ferratura", mezza_ferratura:"Mezza ferratura", pareggio:"Pareggio", altro:"Altro" };

function dataAppIt(iso, ora){
  if(!iso) return "";
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  const txt = new Date(y, m - 1, d).toLocaleDateString("it-IT", { weekday:"short", day:"numeric", month:"short" });
  return txt + (ora ? " ore " + String(ora).slice(0, 5) : "");
}
function oggiIsoScud(){
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

async function apriEventiProfessionista(clienteId){
  const p = professionistiList.find(x => x.cliente_id === clienteId);
  appProCliente = clienteId;
  document.getElementById("app-pro-nome").textContent = p?.nome || "Maniscalco";
  mostraListaAppPro();
  openModal("modal-app-pro");
  await caricaAppuntamentiPro();
}

function chiudiAppuntamentiPro(){
  closeModal("modal-app-pro");
  appProCliente = null;
  refreshProfessionistiModule();
}

function mostraListaAppPro(){
  document.getElementById("app-pro-lista-view").style.display = "block";
  document.getElementById("app-pro-form-view").style.display = "none";
}

async function caricaAppuntamentiPro(){
  const box = document.getElementById("app-pro-lista");
  if(DEMO_MODE || !appProCliente){ box.innerHTML = '<p style="color:var(--muted);font-size:13px">Nessun appuntamento.</p>'; return; }
  box.innerHTML = '<p style="color:var(--muted);font-size:13px">Caricamento…</p>';
  const { data, error } = await sb.rpc("scuderia_appuntamenti_professionista", { p_cliente_id: appProCliente });
  if(error){ console.error("scuderia_appuntamenti_professionista:", error); box.innerHTML = '<p style="color:var(--danger);font-size:13px">Non riesco a caricare gli appuntamenti.</p>'; return; }
  appProLista = data || [];
  renderAppuntamentiPro();
}

// appuntamento cambiato dopo l'accordo: riquadro «prima → ora» ben visibile
function notaModificaPro(g){
  const p = g.modifica.prima || {};
  const lab = (t, altro) => t === "altro" && altro ? altro : (APP_TIPO_LABELS[t] || t || "");
  const tipoOra = g.tipo === "altro" && g.tipo_altro ? g.tipo_altro : (APP_TIPO_LABELS[g.tipo] || g.tipo);
  const servizi = (g.cavalli || []).filter(c => c.tipo && (c.tipo !== p.tipo || (c.tipo_altro || "") !== (p.tipo_altro || "")));
  const righe = [];
  if(servizi.length) servizi.forEach(c => righe.push(`Servizio${c.nome && c.nome !== "Cavallo" ? " (" + escapeHtml(c.nome) + ")" : ""}: <s>${escapeHtml(lab(p.tipo, p.tipo_altro))}</s> → <b>${escapeHtml(lab(c.tipo, c.tipo_altro))}</b>`));
  else if(p.tipo && (p.tipo !== g.tipo || (p.tipo_altro || "") !== (g.tipo_altro || ""))) righe.push(`Servizio: <s>${escapeHtml(lab(p.tipo, p.tipo_altro))}</s> → <b>${escapeHtml(tipoOra)}</b>`);
  if(p.data && (p.data !== g.data_intervento || (p.ora || "") !== (g.ora || ""))) righe.push(`Data: <s>${escapeHtml(dataAppIt(p.data, p.ora))}</s> → <b>${escapeHtml(dataAppIt(g.data_intervento, g.ora))}</b>`);
  const chi = g.modifica.da === "struttura" ? "Modificato dalla scuderia · in attesa del maniscalco" : "Modificato dal maniscalco · da riconfermare";
  return `<div style="margin-top:6px;padding:7px 10px;border-radius:9px;background:rgba(232,176,75,.18);border:1px solid rgba(232,176,75,.6);font-size:12.5px;line-height:1.5">
    <div style="font-weight:800;color:#8a5a00">✏️ ${chi}</div>${righe.map(r => `<div>${r}</div>`).join("")}</div>`;
}

function renderAppuntamentiPro(){
  const box = document.getElementById("app-pro-lista");
  const oggi = oggiIsoScud();
  const attivi = appProLista.filter(g => ["richiesto","proposto","programmato"].includes(g.stato) && g.data_intervento >= oggi)
    .sort((a, b) => (a.data_intervento + (a.ora || "")).localeCompare(b.data_intervento + (b.ora || "")));
  // scaduti: la data è passata ma nessuno ha confermato o chiuso l'appuntamento → si propone un'altra data o si annulla
  const scaduti = appProLista.filter(g => !attivi.includes(g) && !g.con_proprietario && ["richiesto","proposto","programmato"].includes(g.stato))
    .sort((a, b) => (b.data_intervento + (b.ora || "")).localeCompare(a.data_intervento + (a.ora || "")));
  const storico = appProLista.filter(g => !attivi.includes(g) && !scaduti.includes(g));
  const STATO = {
    proposto:   ["Da confermare", "badge-yellow"],
    richiesto:  ["In attesa del maniscalco", "badge-gray"],
    programmato:["Confermato", "badge-green"],
    fatto:      ["Fatto", "badge-green"],
    annullato:  ["Annullato", "badge-red"],
    rifiutato:  ["Non disponibile", "badge-gray"],
  };
  const card = (g, attivo, scaduto) => {
    const [txt, cls] = scaduto
      ? (g.stato === "programmato" ? ["Scaduto · non segnato fatto", "badge-yellow"] : ["Scaduto · mai confermato", "badge-red"])
      : (STATO[g.stato] || [g.stato, "badge-gray"]);
    const tipo = g.tipo === "altro" && g.tipo_altro ? g.tipo_altro : (APP_TIPO_LABELS[g.tipo] || g.tipo);
    const cavalli = (g.cavalli || []).filter(c => c.scuderia_cavallo_id || c.nome !== "Cavallo")
      .map(c => `<span class="badge-pill badge-gray" style="font-size:11px;padding:2px 8px">${c.fatto ? "✓ " : ""}${escapeHtml(c.nome)}</span>`).join(" ");
    const azioni = attivo && !g.con_proprietario ? `
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
        ${g.stato === "proposto" && !scaduto ? `<button class="btn btn-primary btn-sm btn-conferma" onclick="azioneAppPro('${g.gruppo_id}','conferma',this)">Conferma</button>` : ""}
        <button class="btn btn-outline btn-sm btn-variazione" onclick="modificaAppPro('${g.gruppo_id}')">${scaduto ? "Proponi un'altra data" : "Modifica"}</button>
        <button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="azioneAppPro('${g.gruppo_id}','annulla',this)">Annulla</button>
      </div>` : "";
    return `
      <div class="msg-item"${attivo ? "" : ' style="opacity:.7"'}>
        <div style="display:flex;justify-content:space-between;gap:6px 10px;align-items:flex-start;flex-wrap:wrap">
          <div style="min-width:0;flex:1 1 200px">
            <div style="font-weight:700;font-size:14px">${escapeHtml(dataAppIt(g.data_intervento, g.ora))} · ${escapeHtml(tipo)}</div>
            ${scaduto ? `<div style="font-size:12px;color:var(--muted)">${g.stato === "programmato" ? "Il maniscalco non l\'ha ancora segnato come fatto. Se non è stato fatto, annullalo o proponi un\'altra data." : "La data è passata senza conferma: proponi un\'altra data o annullalo."}</div>`
              : g.stato === "proposto" && !(g.modifica && g.modifica.prima) ? '<div style="font-size:12px;color:var(--muted)">Proposta del maniscalco: conferma o proponi un\'altra data</div>' : ""}
            ${g.con_proprietario ? `<div style="font-size:12px;color:var(--muted)"><i class="fa-solid fa-user"></i> Fissato dal maniscalco con il proprietario <b>${escapeHtml(g.con_proprietario)}</b> · solo da leggere</div>` : ""}
            ${attivo && !scaduto && g.modifica && g.modifica.prima && !g.con_proprietario ? notaModificaPro(g) : ""}
            ${cavalli ? `<div style="margin-top:5px;display:flex;gap:4px;flex-wrap:wrap">${cavalli}</div>` : ""}
            ${g.note ? `<div style="color:var(--muted);font-size:12.5px;margin-top:4px">${escapeHtml(g.note)}</div>` : ""}
          </div>
          <span class="badge-pill ${g.con_proprietario ? "badge-gray" : cls}" style="flex-shrink:0;font-size:11px">${g.con_proprietario ? (g.stato === "fatto" ? "Fatto" : "Con il proprietario") : txt}</span>
        </div>
        ${azioni}
      </div>`;
  };
  box.innerHTML = (attivi.length ? attivi.map(g => card(g, true)).join("") : '<p style="color:var(--muted);font-size:13px">Nessun appuntamento in programma. Tocca "Nuovo" per chiederne uno.</p>')
    + (scaduti.length ? `<div style="font-weight:700;font-size:13px;margin:14px 0 6px">Scaduti senza esito (${scaduti.length})</div>${scaduti.map(g => card(g, true, true)).join("")}` : "")
    + (storico.length ? `<details style="margin-top:10px"><summary style="cursor:pointer;color:var(--muted);font-size:12.5px;padding:6px 0">Storico (${storico.length})</summary>${storico.map(g => card(g, false)).join("")}</details>` : "");
}

async function nuovoAppuntamentoPro(){
  appProModificaGruppo = null;
  document.getElementById("app-pro-form-titolo").textContent = "Nuovo appuntamento";
  document.getElementById("app-pro-form-nuovo").style.display = "block";
  document.getElementById("app-pro-salva").textContent = "Invia al maniscalco";
  document.getElementById("app-pro-tipo").value = "ferratura";
  document.getElementById("app-pro-tipo-altro").value = "";
  document.getElementById("app-pro-tipo-altro-wrap").style.display = "none";
  document.getElementById("app-pro-data").value = "";
  document.getElementById("app-pro-data").min = oggiIsoScud();
  document.getElementById("app-pro-ora").value = "";
  document.getElementById("app-pro-note").value = "";
  document.getElementById("app-pro-error").style.display = "none";
  document.getElementById("app-pro-cavalli").innerHTML = '<p style="color:var(--muted);font-size:12.5px;margin:4px 0">Caricamento…</p>';
  let abbinati = await cavalliAbbinatiPro(appProCliente);
  if(abbinati === null){ if(!cavalliList.length) await loadCavalli(); abbinati = cavalliList; }
  document.getElementById("app-pro-cavalli").innerHTML = abbinati.length
    ? abbinati.map(c => `<label style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:13.5px;cursor:pointer"><input type="checkbox" class="app-pro-cav" value="${c.id}" style="width:17px;height:17px"> ${escapeHtml(c.nome)}</label>`).join("")
    : '<p style="color:var(--muted);font-size:12.5px;margin:4px 0">Nessun cavallo abbinato a questo professionista: l\'appuntamento sarà generico. Abbina i cavalli dalla sua scheda.</p>';
  document.getElementById("app-pro-lista-view").style.display = "none";
  document.getElementById("app-pro-form-view").style.display = "block";
}

function modificaAppPro(gruppoId){
  const g = appProLista.find(x => x.gruppo_id === gruppoId);
  if(!g) return;
  appProModificaGruppo = gruppoId;
  document.getElementById("app-pro-form-titolo").textContent = "Proponi un'altra data";
  document.getElementById("app-pro-form-nuovo").style.display = "none";
  document.getElementById("app-pro-salva").textContent = "Invia la nuova proposta";
  document.getElementById("app-pro-data").value = g.data_intervento;
  document.getElementById("app-pro-data").min = oggiIsoScud();
  document.getElementById("app-pro-ora").value = g.ora || "";
  document.getElementById("app-pro-note").value = g.note || "";
  document.getElementById("app-pro-error").style.display = "none";
  document.getElementById("app-pro-lista-view").style.display = "none";
  document.getElementById("app-pro-form-view").style.display = "block";
}

async function salvaAppuntamentoPro(){
  const err = document.getElementById("app-pro-error");
  const btn = document.getElementById("app-pro-salva");
  const data = document.getElementById("app-pro-data").value;
  const ora = document.getElementById("app-pro-ora").value;
  const note = document.getElementById("app-pro-note").value.trim();
  err.style.display = "none";
  if(!data){ err.textContent = "Scegli la data."; err.style.display = "block"; return; }
  btn.disabled = true;
  let res;
  if(appProModificaGruppo){
    res = await sb.rpc("scuderia_azione_appuntamento", { p_gruppo_id: appProModificaGruppo, p_azione: "modifica", p_data: data, p_ora: ora || null, p_note: note || null });
  } else {
    const tipo = document.getElementById("app-pro-tipo").value;
    const tipoAltro = document.getElementById("app-pro-tipo-altro").value.trim();
    if(tipo === "altro" && !tipoAltro){ btn.disabled = false; err.textContent = "Specifica il tipo di intervento."; err.style.display = "block"; return; }
    const cavalli = Array.from(document.querySelectorAll(".app-pro-cav:checked")).map(el => el.value);
    res = await sb.rpc("scuderia_proponi_appuntamento", { p_cliente_id: appProCliente, p_tipo: tipo, p_tipo_altro: tipoAltro || null,
      p_data: data, p_ora: ora || null, p_cavalli: cavalli, p_note: note || null });
  }
  btn.disabled = false;
  if(res.error || !res.data?.ok){ err.textContent = (res.data && res.data.errore) || ("Operazione non riuscita: " + (res.error?.message || "riprova")); err.style.display = "block"; return; }
  showToast(appProModificaGruppo ? "Nuova proposta inviata: il maniscalco deve confermarla." : "Richiesta inviata: il maniscalco riceve una notifica per confermarla.");
  appProModificaGruppo = null;
  mostraListaAppPro();
  await caricaAppuntamentiPro();
}

async function azioneAppPro(gruppoId, azione, btn){
  if(azione === "annulla" && btn && btn.dataset.conferma !== "1"){
    btn.dataset.conferma = "1"; btn.textContent = "Tocca ancora per annullare";
    setTimeout(() => { if(btn){ btn.dataset.conferma = ""; btn.textContent = "Annulla"; } }, 4000);
    return;
  }
  if(btn) btn.disabled = true;
  const { data, error } = await sb.rpc("scuderia_azione_appuntamento", { p_gruppo_id: gruppoId, p_azione: azione });
  if(error || !data?.ok){ showToast((data && data.errore) || "Operazione non riuscita. Riprova."); if(btn) btn.disabled = false; return; }
  showToast(azione === "conferma" ? "Appuntamento confermato: il maniscalco riceve l'avviso." : "Appuntamento annullato: il maniscalco riceve l'avviso.");
  await caricaAppuntamentiPro();
}

/* -- Cavalli abbinati e scheda del professionista (SQL 43) --
   La scuderia sceglie quali cavalli abbinare quando invita il professionista o accetta la sua richiesta,
   e li cambia dalla scheda. Se il cavallo ha un proprietario su Equo, l'abbinamento resta «in attesa»
   finché il proprietario non conferma dall'App Equo. */
let abbinaProModo = "invito";      // "invito" | "accetta"
let abbinaProCliente = null;
let schedaProCliente = null;
let schedaProDati = null;

const LAVORO_STATO = {
  richiesto:   ["In attesa del professionista", "badge-gray"],
  proposto:    ["Da confermare", "badge-yellow"],
  programmato: ["In programma", "badge-green"],
  fatto:       ["Fatto", "badge-green"],
  annullato:   ["Annullato", "badge-red"],
  rifiutato:   ["Non disponibile", "badge-gray"],
};

function euroPro(v){
  const n = Number(v);
  return isFinite(n) ? n.toLocaleString("it-IT", { style: "currency", currency: "EUR" }) : "";
}

function dataBreveIt(iso){
  if(!iso) return "";
  const d = new Date(String(iso).length <= 10 ? iso + "T12:00:00" : iso);
  return isNaN(d) ? "" : d.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}

async function cavalliPerAbbinamento(){
  if(DEMO_MODE) return (demoState.cavalli || []).filter(c => !c.uscito_il).map((c, i) => ({ id: c.id, nome: c.nome, chiede_conferma: i % 3 === 2 }));
  const { data, error } = await sb.rpc("scuderia_cavalli_per_abbinamento", { p_centro_id: currentCentro.id });
  if(error){ console.error("scuderia_cavalli_per_abbinamento:", error); return []; }
  return data || [];
}

function rigaCavalloAbbina(c, spuntato, chip){
  return `<label style="display:flex;align-items:center;gap:9px;padding:6px 0;font-size:13.5px;cursor:pointer;border-bottom:1px solid var(--border)">
    <input type="checkbox" class="abbina-pro-cav" value="${c.id}" ${spuntato ? "checked" : ""} style="width:17px;height:17px;flex-shrink:0">
    <span style="flex:1;min-width:0">${escapeHtml(c.nome || "Cavallo")}</span>${chip || ""}</label>`;
}

const chipConferma = '<span class="badge-pill badge-yellow" style="font-size:10.5px;padding:2px 8px;flex-shrink:0" title="Il cavallo ha un proprietario su Equo: dovrà confermare"><i class="fa-solid fa-user-check"></i> chiederà conferma al proprietario</span>';

async function preparaListaAbbina(boxId){
  const box = document.getElementById(boxId);
  box.innerHTML = '<p style="color:var(--muted);font-size:12.5px;margin:4px 0">Caricamento…</p>';
  const cavalli = await cavalliPerAbbinamento();
  box.innerHTML = cavalli.length
    ? `<div style="display:flex;justify-content:flex-end;gap:10px;font-size:12px;margin-bottom:2px">
         <a href="#" onclick="event.preventDefault();document.querySelectorAll('#${boxId} .abbina-pro-cav').forEach(x=>x.checked=true)">Tutti</a>
         <a href="#" onclick="event.preventDefault();document.querySelectorAll('#${boxId} .abbina-pro-cav').forEach(x=>x.checked=false)">Nessuno</a></div>`
      + cavalli.map(c => rigaCavalloAbbina(c, false, c.chiede_conferma ? chipConferma : "")).join("")
    : '<p style="color:var(--muted);font-size:12.5px;margin:4px 0">Nessun cavallo in scheda: potrai abbinarli più avanti dalla scheda del professionista.</p>';
}

function cavalliSpuntati(boxId){
  return Array.from(document.querySelectorAll(`#${boxId} .abbina-pro-cav:checked`)).map(el => el.value);
}

function apriAggiungiProfessionista(){
  abbinaProModo = "invito"; abbinaProCliente = null;
  document.getElementById("pro-aggiungi-titolo").textContent = "Aggiungi maniscalco";
  document.getElementById("pro-codice-wrap").style.display = "";
  document.getElementById("pro-codice-btn").textContent = "Invia invito";
  document.getElementById("pro-codice-input").value = "";
  document.getElementById("pro-codice-error").style.display = "none";
  preparaListaAbbina("pro-abbina-cavalli");
  openModal("modal-aggiungi-pro");
  setTimeout(() => document.getElementById("pro-codice-input").focus(), 50);
}

function confermaAggiungiProfessionista(){
  if(abbinaProModo === "accetta") return accettaCollegamentoConCavalli();
  return inviaInvitoProfessionista();
}

// ── Codice invito del maniscalco (9/11/2026 · SQL 52) ───────────────────────────
// Codice personale EQUOPRO… = invito classico (lui accetta). Codice invito EQUO… o link del QR della scheda della scuderia =
// collegamento subito alla scheda che il maniscalco ha già, con i suoi cavalli da confermare (nessuna scheda doppia).
function codiceDaTestoScud(t){
  const s = String(t || "").trim();
  const m = s.match(/[?&]invito=([^&#\s]+)/i);
  return decodeURIComponent(m ? m[1] : s).replace(/[\s-]/g, "").toUpperCase();
}
const ePersonaleScud = c => /^EQUO(PRO|TRA|MED|OWN)/.test(c);
async function usaCodiceInvitoScud(codice){
  const { data, error } = await sb.rpc("scuderia_usa_codice_invito", { p_centro: currentCentro.id, p_codice: codice });
  if(error) return { ok: false, errore: /scuderia_usa_codice_invito|schema cache/.test(error.message || "") ? "Manca un aggiornamento del database (SQL 52): avvisa l'assistenza." : (error.message || "Non riuscito, riprova.") };
  if(!data?.ok) return { ok: false, errore: data?.errore || "Codice non valido." };
  const nome = data.nome || "Il maniscalco";
  return { ok: true, testo: data.gia ? (data.unita ? `${nome} era già collegato: abbiamo unito le schede, niente doppioni.` : `${nome} è già collegato alla scuderia.`)
    : `Collegati con ${nome}!` + (Number(data.cavalli) ? ` Ha già inserito ${data.cavalli} cavalli: li trovi in Cavalli da confermare.` : "") };
}
function apriCodiceIscrizione(){
  if(DEMO_MODE || !document.getElementById("modal-codice-iscrizione")) return;
  document.getElementById("codice-iscr-input").value = "";
  document.getElementById("codice-iscr-error").style.display = "none";
  openModal("modal-codice-iscrizione");
}
function saltaCodiceIscrizione(){
  closeModal("modal-codice-iscrizione");
  showToast("Va bene! Se il tuo maniscalco usa Equo, lo colleghi quando vuoi da Professionisti.");
}
async function usaCodiceIscrizione(){
  const err = document.getElementById("codice-iscr-error"), btn = document.getElementById("codice-iscr-btn");
  const codice = codiceDaTestoScud(document.getElementById("codice-iscr-input").value);
  err.style.display = "none";
  if(!codice){ err.textContent = "Scrivi il codice del maniscalco."; err.style.display = "block"; return; }
  btn.disabled = true;
  let esito;
  try{
    if(ePersonaleScud(codice)){
      const { data, error } = await sb.rpc("scuderia_aggiungi_maniscalco", { p_centro_id: currentCentro.id, p_codice: codice, p_cavalli: null });
      esito = error || !data?.ok ? { ok: false, errore: data?.errore || "Non è stato possibile inviare l'invito. Riprova." }
        : { ok: true, testo: data.gia ? `${data.nome} è già collegato o c'è già una richiesta in corso.` : `Invito inviato a ${data.nome}: appena accetta vi collegate e i cavalli che ha già inserito ti arrivano da confermare.` };
    } else esito = await usaCodiceInvitoScud(codice);
  } finally { btn.disabled = false; }
  if(!esito.ok){ err.textContent = esito.errore; err.style.display = "block"; return; }
  closeModal("modal-codice-iscrizione");
  showToast(esito.testo);
  if(typeof refreshProfessionistiModule === "function") refreshProfessionistiModule().catch(() => {});
}

async function inviaInvitoProfessionista(){
  const input = document.getElementById("pro-codice-input");
  const err = document.getElementById("pro-codice-error");
  const btn = document.getElementById("pro-codice-btn");
  const codice = codiceDaTestoScud(input.value);
  err.style.display = "none";
  if(!codice){ err.textContent = "Inserisci il codice professionista."; err.style.display = "block"; return; }
  if(DEMO_MODE){ closeModal("modal-aggiungi-pro"); showToast("In demo il collegamento non è disponibile."); return; }
  // codice invito o link del QR: collegamento immediato alla scheda che il maniscalco ha già (SQL 52)
  if(!ePersonaleScud(codice)){
    btn.disabled = true;
    const esito = await usaCodiceInvitoScud(codice);
    btn.disabled = false;
    if(!esito.ok){ err.textContent = esito.errore; err.style.display = "block"; return; }
    closeModal("modal-aggiungi-pro"); showToast(esito.testo);
    await refreshProfessionistiModule();
    return;
  }
  const cavalli = cavalliSpuntati("pro-abbina-cavalli");
  btn.disabled = true;
  const { data, error } = await sb.rpc("scuderia_aggiungi_maniscalco", { p_centro_id: currentCentro.id, p_codice: codice, p_cavalli: cavalli });
  btn.disabled = false;
  if(error || !data?.ok){
    err.textContent = (data && data.errore) || "Non è stato possibile inviare l'invito. Riprova.";
    err.style.display = "block";
    return;
  }
  closeModal("modal-aggiungi-pro");
  const avvisoPiva = data.senza_piva ? ` Attenzione: nel suo profilo mancano P.IVA o codice fiscale (gliel'abbiamo segnalato).` : "";
  const avvisoCav = !data.gia && cavalli.length ? ` Quando accetta riceve ${cavalli.length === 1 ? "il cavallo scelto" : "i " + cavalli.length + " cavalli scelti"}.` : "";
  showToast((data.gia
    ? (data.stato === "attivo" ? `${data.nome} è già collegato: i cavalli si cambiano dalla sua scheda.` : `C'è già una richiesta in corso con ${data.nome}.`)
    : `Invito inviato a ${data.nome}: riceverà una notifica per accettarlo.`) + avvisoCav + avvisoPiva);
  await refreshProfessionistiModule();
}

async function rispondiCollegamentoPro(clienteId, accetta, btn){
  if(accetta){
    // prima di accettare la scuderia sceglie quali cavalli abbinare
    const p = professionistiList.find(x => x.cliente_id === clienteId);
    abbinaProModo = "accetta"; abbinaProCliente = clienteId;
    document.getElementById("pro-aggiungi-titolo").textContent = `Accetta ${p?.nome || "il professionista"}`;
    document.getElementById("pro-codice-wrap").style.display = "none";
    document.getElementById("pro-codice-btn").textContent = "Accetta e abbina i cavalli";
    document.getElementById("pro-codice-error").style.display = "none";
    preparaListaAbbina("pro-abbina-cavalli");
    openModal("modal-aggiungi-pro");
    return;
  }
  if(btn) btn.disabled = true;
  const { data, error } = await sb.rpc("scuderia_rispondi_collegamento", { p_cliente_id: clienteId, p_accetta: false });
  if(error || !data?.ok){
    showToast((data && data.errore) || "Operazione non riuscita. Riprova.");
    if(btn) btn.disabled = false;
    return;
  }
  showToast("Richiesta rifiutata.");
  await refreshProfessionistiModule();
}

async function accettaCollegamentoConCavalli(){
  const err = document.getElementById("pro-codice-error");
  const btn = document.getElementById("pro-codice-btn");
  err.style.display = "none";
  btn.disabled = true;
  const { data, error } = await sb.rpc("scuderia_rispondi_collegamento", { p_cliente_id: abbinaProCliente, p_accetta: true, p_cavalli: cavalliSpuntati("pro-abbina-cavalli") });
  btn.disabled = false;
  if(error || !data?.ok){ err.textContent = (data && data.errore) || "Operazione non riuscita. Riprova."; err.style.display = "block"; return; }
  closeModal("modal-aggiungi-pro");
  showToast("Professionista collegato: riceve solo i cavalli scelti. Quelli con un proprietario su Equo aspettano la sua conferma.");
  abbinaProCliente = null;
  await refreshProfessionistiModule();
}

/* -- Scheda del professionista -- */
function demoSchedaPro(){
  const cav = (demoState.cavalli || []).filter(c => !c.uscito_il);
  const stati = ["attivo", "da_confermare_proprietario", "attivo", null, "rifiutato"];
  const oggi = new Date();
  const giorno = n => { const d = new Date(oggi); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
  return {
    cavalli: cav.map((c, i) => ({ id: c.id, nome: c.nome, ha_proprietario: i % 5 !== 0, stato: stati[i % 5] })),
    lavori: cav.slice(0, 3).flatMap((c, i) => [
      { data: giorno(6 + i * 9), ora: "09:30", cavallo: c.nome, tipo: "Ferratura", stato: "fatto", ferro: "3", misura: "Mustad", quantita_ferri: 4, ferri_nuovi: true,
        ferro_tipo: "Ferro in acciaio", note: "Zoccolo anteriore sinistro un po' secco: ingrassare.", aiutante: "Luca", importo: 110, pagamento: "saldato", saldato_il: giorno(4 + i * 9), prossima: giorno(-38 + i * 9) },
      { data: giorno(52 + i * 7), ora: "11:00", cavallo: c.nome, tipo: "Pareggio", stato: "fatto", quantita_ferri: 0, importo: 45, pagamento: "da_saldare", prossima: giorno(10) }])
      .sort((x, y) => y.data.localeCompare(x.data)),
    documenti: [{ url: "#", nome: "Ricevuta ottobre.pdf", tipo: "documento", da: "professionista", il: giorno(4) },
                { url: "#", nome: "Foto.jpg", tipo: "foto", da: "scuderia", il: giorno(12) }]
  };
}

async function apriSchedaProfessionista(clienteId){
  const p = professionistiList.find(x => x.cliente_id === clienteId);
  if(!p || p.stato !== "attivo") return;
  schedaProCliente = clienteId; schedaProDati = null;
  document.getElementById("scheda-pro-nome").textContent = p.nome || "Professionista";
  document.getElementById("scheda-pro-avatar").innerHTML = p.avatar_url ? `<img src="${escapeHtml(p.avatar_url)}" alt="">` : '<i class="fa-solid fa-user"></i>';
  document.getElementById("scheda-pro-sotto").textContent = "Maniscalco collegato"
    + (p.prossimo ? ` · prossimo: ${p.prossimo.tipo} ${dataAppIt(p.prossimo.data, p.prossimo.ora)}` : "");
  if(typeof fiduciaRender === "function") fiduciaRender(p);   // SQL 55 · maniscalco di fiducia
  ["lavori","cavalli","documenti"].forEach(t => document.getElementById("scheda-pro-" + t).innerHTML = '<p style="color:var(--muted);font-size:13px">Caricamento…</p>');
  schedaProTab("lavori");
  openModal("modal-scheda-pro");
  await caricaSchedaPro();
}

function chiudiSchedaProfessionista(){
  closeModal("modal-scheda-pro");
  schedaProCliente = null; schedaProDati = null;
}

function schedaProTab(tab){
  document.querySelectorAll(".scheda-pro-tab").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  ["lavori","cavalli","documenti"].forEach(t => document.getElementById("scheda-pro-" + t).style.display = t === tab ? "block" : "none");
}

function schedaProApri(cosa){
  const id = schedaProCliente;
  if(!id) return;
  closeModal("modal-scheda-pro");
  if(cosa === "chat") apriChatProfessionista(id); else apriEventiProfessionista(id);
}

async function caricaSchedaPro(){
  if(!schedaProCliente) return;
  if(DEMO_MODE){ schedaProDati = demoSchedaPro(); }
  else {
    const { data, error } = await sb.rpc("scuderia_pro_scheda", { p_cliente_id: schedaProCliente });
    if(error || !data || data.errore){
      console.error("scuderia_pro_scheda:", error || data);
      document.getElementById("scheda-pro-lavori").innerHTML = '<p style="color:var(--danger);font-size:13px">Non riesco a caricare la scheda. Riprova.</p>';
      return;
    }
    schedaProDati = data;
  }
  renderSchedaProLavori(); renderSchedaProCavalli(); renderSchedaProDocumenti();
}

function renderSchedaProLavori(filtro){
  const box = document.getElementById("scheda-pro-lavori");
  const tutti = schedaProDati?.lavori || [];
  if(!tutti.length){ box.innerHTML = '<p style="color:var(--muted);font-size:13px">Nessun lavoro ancora. I lavori che il professionista registra sui cavalli del centro compaiono qui con tutti i dettagli.</p>'; return; }
  const nomi = [...new Set(tutti.map(l => l.cavallo).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const lista = filtro ? tutti.filter(l => l.cavallo === filtro) : tutti;
  const fatti = lista.filter(l => l.stato === "fatto");
  const totale = fatti.reduce((t, l) => t + (Number(l.importo) || 0), 0);
  const daSaldare = fatti.filter(l => l.pagamento !== "saldato").reduce((t, l) => t + (Number(l.importo) || 0), 0);
  const riga = (et, val) => val ? `<div><span style="color:var(--muted)">${et}:</span> ${val}</div>` : "";
  box.innerHTML = `
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px">
      <select class="input" style="flex:1 1 180px;max-width:260px" onchange="renderSchedaProLavori(this.value)">
        <option value="">Tutti i cavalli (${tutti.length} lavori)</option>
        ${nomi.map(n => `<option value="${escapeHtml(n)}"${n === filtro ? " selected" : ""}>${escapeHtml(n)}</option>`).join("")}
      </select>
      <div style="font-size:12.5px;color:var(--muted)">${fatti.length} fatti${totale ? ` · ${euroPro(totale)}` : ""}${daSaldare ? ` · <b style="color:var(--danger)">${euroPro(daSaldare)} da saldare</b>` : ""}</div>
    </div>` + lista.map(l => {
    const [txt, cls] = LAVORO_STATO[l.stato] || [l.stato || "", "badge-gray"];
    const ferri = [];
    if(Number(l.quantita_ferri)) ferri.push(`${l.quantita_ferri} ${Number(l.quantita_ferri) === 1 ? "ferro" : "ferri"}`);
    if(l.ferri_nuovi === true) ferri.push("nuovi"); else if(l.ferri_nuovi === false) ferri.push("riutilizzati");
    if(l.ferro_tipo) ferri.push(escapeHtml(l.ferro_tipo));
    if(l.ferro) ferri.push("n. " + escapeHtml(String(l.ferro)));
    if(l.misura) ferri.push(escapeHtml(l.misura));
    const pag = l.importo != null && l.importo !== ""
      ? `${euroPro(l.importo)} · ${l.pagamento === "saldato" ? `<span style="color:#2f8a4e;font-weight:600">saldato${l.saldato_il ? " il " + dataBreveIt(l.saldato_il) : ""}</span>` : '<span style="color:var(--danger);font-weight:600">da saldare</span>'}` : l.paga_proprietario ? '<span style="color:var(--muted)">paga il proprietario</span>' : "";   // SQL 56
    return `<div class="msg-item">
      <div style="display:flex;justify-content:space-between;gap:6px 10px;align-items:flex-start;flex-wrap:wrap">
        <div style="font-weight:700;font-size:14px;min-width:0;flex:1 1 200px">${escapeHtml(dataAppIt(l.data, l.ora))} · ${escapeHtml(l.tipo || "Lavoro")}${l.cavallo ? ` · <span style="font-weight:600">${escapeHtml(l.cavallo)}</span>` : ""}</div>
        <span class="badge-pill ${cls}" style="flex-shrink:0;font-size:11px">${escapeHtml(txt)}</span>
      </div>
      <div style="font-size:12.5px;line-height:1.55;margin-top:4px">
        ${riga("Ferri", ferri.join(" · "))}${riga("Note ferro", l.ferro_note ? escapeHtml(l.ferro_note) : "")}
        ${riga("Note", l.note ? escapeHtml(l.note) : "")}${riga("Aiutante", l.aiutante ? escapeHtml(l.aiutante) : "")}
        ${riga("Importo", pag)}${riga("Prossimo intervento", l.prossima ? dataBreveIt(l.prossima) : "")}
      </div></div>`;
  }).join("");
}

function renderSchedaProCavalli(){
  const box = document.getElementById("scheda-pro-cavalli");
  const cav = schedaProDati?.cavalli || [];
  const puo = puoCollegareProfessionisti();
  if(!cav.length){ box.innerHTML = '<p style="color:var(--muted);font-size:13px">Nessun cavallo in scheda.</p>'; return; }
  const CHIP = {
    attivo: '<span class="badge-pill badge-green" style="font-size:10.5px;padding:2px 8px;flex-shrink:0">abbinato</span>',
    da_confermare_proprietario: '<span class="badge-pill badge-yellow" style="font-size:10.5px;padding:2px 8px;flex-shrink:0"><i class="fa-solid fa-hourglass-half"></i> in attesa del proprietario</span>',
    rifiutato: '<span class="badge-pill badge-red" style="font-size:10.5px;padding:2px 8px;flex-shrink:0" title="Spunta di nuovo per richiedere la conferma">rifiutato dal proprietario</span>',
    programmato: '<span class="badge-pill badge-gray" style="font-size:10.5px;padding:2px 8px;flex-shrink:0"><i class="fa-regular fa-calendar"></i> dalla data scelta</span>',
  };
  const n = cav.filter(c => c.stato === "attivo").length;
  box.innerHTML = `<p style="color:var(--muted);font-size:12.5px;margin:0 0 8px">${n} ${n === 1 ? "cavallo abbinato" : "cavalli abbinati"}. Il professionista vede nella sua app solo questi.
      ${puo ? "Se togli un cavallo, nella sua app finisce tra gli archiviati: i lavori fatti restano nello storico. I cavalli con un proprietario su Equo aspettano la sua conferma. Se un cavallo spuntato ha già un altro maniscalco, questo lo sostituisce: per sostituti a tempo e cambi da una data usa Cavalli › Maniscalchi." : "Solo l'amministratore o un membro di livello 2-3 può cambiare i cavalli."}</p>
    <div id="scheda-pro-cav-lista">` + cav.map(c => {
      const chip = (CHIP[c.stato] || (c.ha_proprietario ? chipConferma : ""))
        + (c.uscito ? ' <span class="badge-pill badge-gray" style="font-size:10.5px;padding:2px 8px;flex-shrink:0">uscito dal centro</span>' : "");
      return rigaCavalloAbbina(c, ["attivo", "da_confermare_proprietario", "programmato"].includes(c.stato), chip).replace('type="checkbox"', puo ? 'type="checkbox"' : 'type="checkbox" disabled');
    }).join("") + `</div>
    ${puo ? '<div class="auth-error" id="scheda-pro-cav-error"></div><button class="btn btn-primary btn-block" style="margin-top:12px" id="scheda-pro-cav-salva" onclick="salvaCavalliSchedaPro()">Salva i cavalli</button>' : ""}`;
}

async function salvaCavalliSchedaPro(){
  const btn = document.getElementById("scheda-pro-cav-salva");
  const err = document.getElementById("scheda-pro-cav-error");
  err.style.display = "none";
  if(DEMO_MODE){ showToast("In demo le modifiche non vengono salvate."); return; }
  btn.disabled = true;
  const { data, error } = await sb.rpc("scuderia_pro_imposta_cavalli", { p_cliente_id: schedaProCliente, p_cavalli: cavalliSpuntati("scheda-pro-cav-lista") });
  btn.disabled = false;
  if(error || !data?.ok){ err.textContent = (data && data.errore) || "Salvataggio non riuscito. Riprova."; err.style.display = "block"; return; }
  const parti = [];
  if(data.attivi) parti.push(`${data.attivi} ${data.attivi === 1 ? "abbinato" : "abbinati"}`);
  if(data.da_confermare) parti.push(`${data.da_confermare} in attesa del proprietario (gli abbiamo scritto)`);
  if(data.tolti) parti.push(`${data.tolti} ${data.tolti === 1 ? "tolto" : "tolti"}`);
  showToast(parti.length ? "Cavalli aggiornati: " + parti.join(", ") + "." : "Nessuna modifica.");
  await caricaSchedaPro();
}

function renderSchedaProDocumenti(){
  const box = document.getElementById("scheda-pro-documenti");
  const docs = schedaProDati?.documenti || [];
  const ICONA = { foto: "fa-image", video: "fa-video", documento: "fa-file-pdf", audio: "fa-microphone" };
  box.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px">
      <p style="margin:0;color:var(--muted);font-size:12.5px">Ricevute, foto, video e PDF scambiati con il professionista.</p>
      <button class="btn btn-primary btn-sm" style="flex-shrink:0" onclick="document.getElementById('scheda-pro-file').click()"><i class="fa-solid fa-paperclip"></i> Invia</button></div>`
    + (docs.length ? docs.map(d => `
      <a class="msg-item" href="${escapeHtml(d.url || "#")}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px;text-decoration:none;color:inherit">
        <i class="fa-solid ${ICONA[d.tipo] || "fa-file"}" style="font-size:18px;color:var(--muted);width:22px;text-align:center"></i>
        <div style="min-width:0;flex:1"><div style="font-weight:600;font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(d.nome || "Allegato")}</div>
          <div style="color:var(--muted);font-size:12px">${d.da === "professionista" ? "Dal professionista" : "Dalla scuderia"} · ${dataBreveIt(d.il)}</div></div>
        <i class="fa-solid fa-arrow-up-right-from-square" style="color:var(--muted);font-size:12px"></i></a>`).join("")
      : '<p style="color:var(--muted);font-size:13px">Nessun documento ancora.</p>');
}

async function inviaDocumentoSchedaPro(event){
  if(!schedaProCliente) return;
  if(DEMO_MODE){ event.target.value = ""; showToast("In demo l'invio non è disponibile."); return; }
  const prima = chatProCorrente;
  chatProCorrente = schedaProCliente;     // stesso invio della chat: il documento arriva anche in chat
  try{ await inviaAllegatoPro(event); } finally { chatProCorrente = prima; }
  await caricaSchedaPro();
  schedaProTab("documenti");
}

/* l'appuntamento si propone solo per i cavalli abbinati al professionista */
async function cavalliAbbinatiPro(clienteId){
  if(DEMO_MODE) return demoSchedaPro().cavalli.filter(c => c.stato === "attivo");
  const { data, error } = await sb.rpc("scuderia_pro_scheda", { p_cliente_id: clienteId });
  if(error || !data || data.errore) return null;
  return (data.cavalli || []).filter(c => c.stato === "attivo" && !c.uscito);
}

/* -- Cavalli proposti dal professionista (9/11/2026 · SQL 47) --
   Cavalli che il maniscalco ha nella struttura ma che non sono collegati a una scheda della scuderia.
   Per ognuno Equo cerca il cavallo più simile (microchip, nome): la scuderia conferma, sceglie un altro cavallo,
   lo aggiunge alla scuderia (anche oltre il limite del pacchetto: resta bloccato) o dice «non è nostro»
   (nell'app del maniscalco resta «da verificare» per 30 giorni). */
let proposteProList = [];

async function caricaProposteProfessionisti(){
  if(DEMO_MODE){
    const cav = (demoState.cavalli || [])[1];
    proposteProList = [{ riga_id: "dp1", cliente_id: "demo-pro-1", professionista: "Marco Ferri", nome: (cav?.nome || "Luna").slice(0, 4), lavori: 3, ultimo: null,
                         candidato: cav ? { id: cav.id, nome: cav.nome, punti: 85 } : null },
                       { riga_id: "dp2", cliente_id: "demo-pro-1", professionista: "Marco Ferri", nome: "Fede", lavori: 1, candidato: null }];
    return proposteProList;
  }
  if(!currentCentro) return (proposteProList = []);
  const { data, error } = await sb.rpc("scuderia_proposte_pro", { p_centro: currentCentro.id });
  proposteProList = error ? [] : (data || []);
  return proposteProList;
}
function proposteDi(clienteId){ return proposteProList.filter(p => p.cliente_id === clienteId); }

function proposteProHtml(clienteId){
  const lista = proposteDi(clienteId);
  if(!lista.length) return "";
  const puo = puoCollegareProfessionisti();
  const opzCavalli = (sel) => (schedaProDati?.cavalli || []).filter(c => !c.uscito).map(c => `<option value="${c.id}"${c.id === sel ? " selected" : ""}>${escapeHtml(c.nome)}</option>`).join("");
  // 9/11/2026 (SQL 53): stesso microchip o codice Equo = certo; si collegano tutti con un tocco, dopo la conferma
  const certi = lista.filter(p => p.candidato && p.candidato.certo);
  return `<div style="border:1px solid rgba(232,176,75,.7);background:rgba(232,176,75,.12);border-radius:12px;padding:10px 12px;margin-bottom:14px">
    <div style="font-weight:800;margin-bottom:4px">🐴 ${lista.length} ${lista.length === 1 ? "cavallo proposto" : "cavalli proposti"} dal professionista</div>
    <p style="margin:0 0 8px;color:var(--muted);font-size:12.5px">Li ha nella sua app per questa struttura, ma non sono collegati a una vostra scheda. ${puo ? "Dite voi cosa sono." : "Decide l'amministratore o un membro di livello 2-3."}</p>
    ${puo && certi.length > 1 ? `<button class="btn btn-primary btn-sm" style="margin:0 0 8px" onclick="collegaPropostiSicuri('${clienteId}',this)"><i class="fa-solid fa-link"></i> Collega i ${certi.length} sicuri</button>` : ""}
    ${lista.map(p => {
      const c = p.candidato, sicuro = c && c.punti >= 85;
      return `<div style="padding:8px 0;border-top:1px solid rgba(232,176,75,.4)" id="prop-${p.riga_id}">
        <div style="font-size:13.5px"><b>«${escapeHtml(p.nome)}»</b> <span style="color:var(--muted);font-size:12px">${p.lavori ? `${p.lavori} ${p.lavori === 1 ? "lavoro" : "lavori"}` : "nessun lavoro"}${p.microchip ? " · chip " + escapeHtml(p.microchip) : ""}</span></div>
        <div style="font-size:12.5px;margin:2px 0 6px">${c ? (c.certo ? `È <b>${escapeHtml(c.nome)}</b> (${escapeHtml(c.perche || "stesso cavallo")}).` : `${sicuro ? "Probabilmente è" : "Forse è"} <b>${escapeHtml(c.nome)}</b>?`) : "Non trovo un cavallo simile nella vostra scheda."}</div>
        ${puo ? `<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
          ${c ? `<button class="btn btn-primary btn-sm" onclick="rispondiPropostaPro('${p.riga_id}','conferma','${c.id}',this)">Sì, è ${escapeHtml(c.nome)}</button>` : ""}
          <select class="input" id="prop-sel-${p.riga_id}" style="width:auto;padding:6px 10px;font-size:13px"><option value="">${c ? "È un altro…" : "È un cavallo che avete…"}</option>${opzCavalli()}</select>
          <button class="btn btn-outline btn-sm" onclick="rispondiPropostaPro('${p.riga_id}','conferma',document.getElementById('prop-sel-${p.riga_id}').value,this)">Collega</button>
          <button class="btn btn-outline btn-sm" onclick="aggiungiPropostaPro('${p.riga_id}',this)"><i class="fa-solid fa-plus"></i> Aggiungi alla scuderia</button>
          <button class="btn btn-ghost btn-sm" onclick="rispondiPropostaPro('${p.riga_id}','rifiuta',null,this)">Non è nostro</button></div>` : ""}
      </div>`;
    }).join("")}</div>`;
}

async function rispondiPropostaPro(riga, azione, scheda, btn, categoria){
  if(azione === "conferma" && !scheda){ showToast("Scegli il cavallo dall'elenco."); return; }
  if(azione === "rifiuta" && btn && btn.dataset.conferma !== "1"){ btn.dataset.conferma = "1"; btn.textContent = "Tocca ancora per confermare"; setTimeout(() => { if(btn){ btn.dataset.conferma = ""; btn.textContent = "Non è nostro"; } }, 3500); return; }
  if(DEMO_MODE){ showToast("In demo le modifiche non vengono salvate."); return; }
  if(btn) btn.disabled = true;
  const { data, error } = await sb.rpc("scuderia_proposta_rispondi", { p_riga: riga, p_azione: azione, p_scheda: scheda || null, p_categoria: categoria || null });
  if(btn) btn.disabled = false;
  if(error || !data?.ok){ showToast((data && data.errore) || "Operazione non riuscita. Riprova."); return; }
  showToast(azione === "rifiuta" ? "Segnato «non è nostro»: il professionista lo trova da verificare."
    : data.oltre_limite ? "Cavallo aggiunto, ma è oltre il limite del vostro pacchetto: resta bloccato finché non passate al pacchetto superiore."
    : azione === "aggiungi" ? "Cavallo aggiunto alla scuderia e collegato al professionista."
    : (data.abb && data.abb.da_confermare ? "Collegato: il proprietario deve confermare il professionista." : "Collegato: lo storico dei lavori ora è sul vostro cavallo."));
  await caricaProposteProfessionisti();
  if(typeof cavalliList !== "undefined" && azione === "aggiungi" && typeof loadCavalli === "function") loadCavalli();
  if(schedaProCliente) await caricaSchedaPro();
  renderProfessionistiList(); aggiornaBadgeProfessionisti();
}
// collega in un colpo i cavalli certi (stesso microchip o codice Equo), dopo aver mostrato l'elenco
async function collegaPropostiSicuri(clienteId, btn){
  const certi = proposteDi(clienteId).filter(p => p.candidato && p.candidato.certo);
  if(!certi.length) return;
  const elenco = certi.map(p => `• «${p.nome}» → ${p.candidato.nome} (${p.candidato.perche || "stesso cavallo"})`).join("\n");
  if(!confirm(`Collego questi ${certi.length} cavalli alle vostre schede?\n\n${elenco}\n\nLo storico dei lavori del professionista passa sui vostri cavalli.`)) return;
  if(DEMO_MODE){ showToast("In demo le modifiche non vengono salvate."); return; }
  if(btn) btn.disabled = true;
  let ok = 0, ko = 0;
  for(const p of certi){
    const { data, error } = await sb.rpc("scuderia_proposta_rispondi", { p_riga: p.riga_id, p_azione: "conferma", p_scheda: p.candidato.id, p_categoria: null });
    if(!error && data?.ok) ok++; else ko++;
  }
  showToast(`Collegati ${ok} cavalli${ko ? `, ${ko} non riusciti: riprova da qui sotto` : ""}.`);
  await caricaProposteProfessionisti();
  if(schedaProCliente) await caricaSchedaPro();
  renderProfessionistiList(); aggiornaBadgeProfessionisti();
}
function aggiungiPropostaPro(riga, btn){
  const box = btn.parentElement;
  if(box.querySelector(".prop-cat")) return;
  box.insertAdjacentHTML("beforeend", `<span class="prop-cat" style="display:inline-flex;gap:6px;align-items:center">
    <select class="input" style="width:auto;padding:6px 10px;font-size:13px"><option value="pensione">In pensione</option><option value="proprieta">Di proprietà del centro</option><option value="soci">Di soci</option></select>
    <button class="btn btn-primary btn-sm" onclick="rispondiPropostaPro('${riga}','aggiungi',null,this,this.previousElementSibling.value)">Aggiungi</button></span>`);
}

/* agganci: lista, badge, scheda (Cavalli), sezione Cavalli */
(function(){
  const vecchiaLoad = loadProfessionisti;
  loadProfessionisti = async function(){ await vecchiaLoad.apply(this, arguments); await caricaProposteProfessionisti(); aggiornaBadgeProfessionisti(); };
  const vecchioBadge = aggiornaBadgeProfessionisti;
  aggiornaBadgeProfessionisti = function(){
    vecchioBadge.apply(this, arguments);
    const n = proposteProList.length;
    if(!n) return;
    const daConfermare = professionistiList.reduce((t, p) => t + (Number(p.da_confermare) || 0) + (p.stato === "da_confermare_struttura" ? 1 : 0), 0);
    const nonLetti = professionistiList.reduce((t, p) => t + (Number(p.non_letti) || 0), 0);
    impostaContatoreNav("pro-nav-badge", daConfermare + nonLetti + n, "rosso");
  };
  const vecchiaLista = renderProfessionistiList;
  renderProfessionistiList = function(){
    vecchiaLista.apply(this, arguments);
    document.querySelectorAll("#pro-maniscalchi-list .msg-item[onclick*='apriSchedaProfessionista']").forEach(el => {
      const id = (el.getAttribute("onclick").match(/'([^']+)'/) || [])[1];
      const n = proposteDi(id).length;
      if(n && !el.querySelector(".prop-badge")) el.querySelector(".who")?.parentElement?.parentElement?.insertAdjacentHTML("beforeend",
        `<div class="prop-badge" style="font-size:12px;color:var(--danger);font-weight:700;margin-top:2px">🐴 ${n} ${n === 1 ? "cavallo proposto" : "cavalli proposti"} da sistemare</div>`);
    });
  };
  const vecchiCavalli = renderSchedaProCavalli;
  renderSchedaProCavalli = function(){
    vecchiCavalli.apply(this, arguments);
    const box = document.getElementById("scheda-pro-cavalli");
    if(box && schedaProCliente) box.insertAdjacentHTML("afterbegin", proposteProHtml(schedaProCliente));
  };
  const vecchiaApri = apriSchedaProfessionista;
  apriSchedaProfessionista = async function(id, tab){
    await vecchiaApri.apply(this, arguments);
    if(tab === "cavalli" || proposteDi(id).length) schedaProTab("cavalli");
  };
  const agganciaPropCavalli = () => quandoApriSezione(async key => {
    if(key !== "cavalli") return;
    await caricaProposteProfessionisti();
    const mod = document.getElementById("cavalli-list-view") || document.getElementById("module-cavalli");
    let b = document.getElementById("cav-proposte-banner");
    if(!proposteProList.length){ if(b) b.remove(); return; }
    if(!b){ b = document.createElement("div"); b.id = "cav-proposte-banner"; mod.insertBefore(b, mod.querySelector(".cavalli-sezione, #cavalli-sezioni") || mod.firstChild); }
    const per = {}; proposteProList.forEach(p => { (per[p.cliente_id] = per[p.cliente_id] || { nome: p.professionista, n: 0 }).n++; });
    b.innerHTML = Object.entries(per).map(([id, x]) => `<div class="card" style="border-color:rgba(232,176,75,.8);background:rgba(232,176,75,.10);margin-bottom:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:12px 14px">
      <div style="flex:1 1 220px;font-size:13.5px">🐴 <b>${escapeHtml(x.nome || "Il professionista")}</b> segue ${x.n} ${x.n === 1 ? "cavallo che non è collegato" : "cavalli che non sono collegati"} alla vostra scheda.</div>
      <button class="btn btn-primary btn-sm" onclick="showModule('professionisti');setTimeout(()=>apriSchedaProfessionista('${id}','cavalli'),400)">Vediamoli</button></div>`).join("");
  });
  if(typeof quandoApriSezione === "function") agganciaPropCavalli(); else document.addEventListener("DOMContentLoaded", agganciaPropCavalli);
})();
