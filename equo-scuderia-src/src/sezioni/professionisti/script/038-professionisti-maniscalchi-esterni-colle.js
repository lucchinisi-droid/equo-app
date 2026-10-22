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
  if(DEMO_MODE || !currentCentro){ professionistiList = []; return; }
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
      stato = '<span style="color:#2f8a4e;font-weight:600">Collegato</span>';
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
      <div class="msg-item" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:12px;min-width:0">
          <div class="pro-avatar">${avatar}</div>
          <div style="min-width:0">
            <div><span class="who">${escapeHtml(p.nome || "Maniscalco")}</span>${cert}${Number(p.non_letti) ? '<span class="unread-dot" title="Messaggi non letti"></span>' : ""}</div>
            <div style="color:var(--muted);font-size:12px">Maniscalco · ${stato}</div>
            ${p.stato === "attivo" && (p.prossimo || Number(p.da_confermare)) ? `<div style="font-size:12px;margin-top:2px">${Number(p.da_confermare) ? `<span style="color:var(--danger);font-weight:700">${p.da_confermare} da confermare</span>${p.prossimo ? " · " : ""}` : ""}${p.prossimo ? `Prossimo: ${escapeHtml(p.prossimo.tipo)} ${escapeHtml(dataAppIt(p.prossimo.data, p.prossimo.ora))}` : ""}</div>` : ""}
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${azioni}</div>
      </div>`;
  }).join("");
}

function apriAggiungiProfessionista(){
  document.getElementById("pro-codice-input").value = "";
  document.getElementById("pro-codice-error").style.display = "none";
  openModal("modal-aggiungi-pro");
  setTimeout(() => document.getElementById("pro-codice-input").focus(), 50);
}

async function inviaInvitoProfessionista(){
  const input = document.getElementById("pro-codice-input");
  const err = document.getElementById("pro-codice-error");
  const btn = document.getElementById("pro-codice-btn");
  const codice = input.value.trim().toUpperCase();
  err.style.display = "none";
  if(!codice){ err.textContent = "Inserisci il codice professionista."; err.style.display = "block"; return; }
  if(DEMO_MODE){ closeModal("modal-aggiungi-pro"); showToast("In demo il collegamento non è disponibile."); return; }
  btn.disabled = true;
  const { data, error } = await sb.rpc("scuderia_aggiungi_maniscalco", { p_centro_id: currentCentro.id, p_codice: codice });
  btn.disabled = false;
  if(error || !data?.ok){
    err.textContent = (data && data.errore) || "Non è stato possibile inviare l'invito. Riprova.";
    err.style.display = "block";
    return;
  }
  closeModal("modal-aggiungi-pro");
  const avvisoPiva = data.senza_piva ? ` Attenzione: nel suo profilo mancano P.IVA o codice fiscale (gliel'abbiamo segnalato).` : "";
  showToast((data.gia
    ? (data.stato === "attivo" ? `${data.nome} è già collegato.` : `C'è già una richiesta in corso con ${data.nome}.`)
    : `Invito inviato a ${data.nome}: riceverà una notifica per accettarlo.`) + avvisoPiva);
  await refreshProfessionistiModule();
}

async function rispondiCollegamentoPro(clienteId, accetta, btn){
  if(btn) btn.disabled = true;
  const { data, error } = await sb.rpc("scuderia_rispondi_collegamento", { p_cliente_id: clienteId, p_accetta: accetta });
  if(error || !data?.ok){
    showToast((data && data.errore) || "Operazione non riuscita. Riprova.");
    if(btn) btn.disabled = false;
    return;
  }
  showToast(accetta ? "Maniscalco collegato: ora potete scrivervi e fissare gli appuntamenti." : "Richiesta rifiutata.");
  await refreshProfessionistiModule();
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
  const storico = appProLista.filter(g => !attivi.includes(g));
  const STATO = {
    proposto:   ["Da confermare", "badge-yellow"],
    richiesto:  ["In attesa del maniscalco", "badge-gray"],
    programmato:["Confermato", "badge-green"],
    fatto:      ["Fatto", "badge-green"],
    annullato:  ["Annullato", "badge-red"],
    rifiutato:  ["Non disponibile", "badge-gray"],
  };
  const card = (g, attivo) => {
    const [txt, cls] = STATO[g.stato] || [g.stato, "badge-gray"];
    const tipo = g.tipo === "altro" && g.tipo_altro ? g.tipo_altro : (APP_TIPO_LABELS[g.tipo] || g.tipo);
    const cavalli = (g.cavalli || []).filter(c => c.scuderia_cavallo_id || c.nome !== "Cavallo")
      .map(c => `<span class="badge-pill badge-gray" style="font-size:11px;padding:2px 8px">${c.fatto ? "✓ " : ""}${escapeHtml(c.nome)}</span>`).join(" ");
    const azioni = attivo && !g.con_proprietario ? `
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
        ${g.stato === "proposto" ? `<button class="btn btn-primary btn-sm btn-conferma" onclick="azioneAppPro('${g.gruppo_id}','conferma',this)">Conferma</button>` : ""}
        <button class="btn btn-outline btn-sm btn-variazione" onclick="modificaAppPro('${g.gruppo_id}')">Modifica</button>
        <button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="azioneAppPro('${g.gruppo_id}','annulla',this)">Annulla</button>
      </div>` : "";
    return `
      <div class="msg-item"${attivo ? "" : ' style="opacity:.7"'}>
        <div style="display:flex;justify-content:space-between;gap:6px 10px;align-items:flex-start;flex-wrap:wrap">
          <div style="min-width:0;flex:1 1 200px">
            <div style="font-weight:700;font-size:14px">${escapeHtml(dataAppIt(g.data_intervento, g.ora))} · ${escapeHtml(tipo)}</div>
            ${g.stato === "proposto" && !(g.modifica && g.modifica.prima) ? '<div style="font-size:12px;color:var(--muted)">Proposta del maniscalco: conferma o proponi un\'altra data</div>' : ""}
            ${g.con_proprietario ? `<div style="font-size:12px;color:var(--muted)"><i class="fa-solid fa-user"></i> Fissato dal maniscalco con il proprietario <b>${escapeHtml(g.con_proprietario)}</b> · solo da leggere</div>` : ""}
            ${attivo && g.modifica && g.modifica.prima && !g.con_proprietario ? notaModificaPro(g) : ""}
            ${cavalli ? `<div style="margin-top:5px;display:flex;gap:4px;flex-wrap:wrap">${cavalli}</div>` : ""}
            ${g.note ? `<div style="color:var(--muted);font-size:12.5px;margin-top:4px">${escapeHtml(g.note)}</div>` : ""}
          </div>
          <span class="badge-pill ${g.con_proprietario ? "badge-gray" : cls}" style="flex-shrink:0;font-size:11px">${g.con_proprietario ? (g.stato === "fatto" ? "Fatto" : "Con il proprietario") : txt}</span>
        </div>
        ${azioni}
      </div>`;
  };
  box.innerHTML = (attivi.length ? attivi.map(g => card(g, true)).join("") : '<p style="color:var(--muted);font-size:13px">Nessun appuntamento in programma. Tocca "Nuovo" per chiederne uno.</p>')
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
  if(!cavalliList.length) await loadCavalli();
  document.getElementById("app-pro-cavalli").innerHTML = cavalliList.length
    ? cavalliList.map(c => `<label style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:13.5px;cursor:pointer"><input type="checkbox" class="app-pro-cav" value="${c.id}" style="width:17px;height:17px"> ${escapeHtml(c.nome)}</label>`).join("")
    : '<p style="color:var(--muted);font-size:12.5px;margin:4px 0">Nessun cavallo in scheda: l\'appuntamento sarà generico.</p>';
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

