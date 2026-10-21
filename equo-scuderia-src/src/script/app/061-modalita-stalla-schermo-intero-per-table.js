/* ---- modalità stalla: schermo intero per tablet / display in scuderia ---- */
function boxModalitaStalla(on){
  const s = document.getElementById("box-sezione");
  s.classList.toggle("stalla", on);
  document.getElementById("box-stalla-barra").style.display = on ? "flex" : "none";
  clearInterval(boxOrologioTimer);
  if(on){
    const tick = () => { document.getElementById("box-orologio").textContent = new Date().toLocaleTimeString("it-IT", { hour:"2-digit", minute:"2-digit" }); };
    tick(); boxOrologioTimer = setInterval(async () => { tick(); if(new Date().getSeconds() < 30 && !DEMO_MODE){ await loadBox(); renderBox(); } }, 30000);
    try{ s.requestFullscreen?.(); }catch(e){}
  } else { try{ if(document.fullscreenElement) document.exitFullscreen(); }catch(e){} }
}

/* =====================================================================
   SUGGERIMENTI: fumetto al passaggio del mouse (computer) o tenendo premuto (telefono/tablet).
   Basta mettere data-tip="…" su un elemento; i pulsanti con sola icona e i vecchi title li prende da solo.
   ===================================================================== */
(function(){
  let tip = null, timer = null, bersaglio = null, bloccaClick = false;
  const ICONE_TIP = { "fa-pen":"Modifica", "fa-trash":"Elimina", "fa-file-pdf":"Scheda PDF", "fa-print":"Stampa", "fa-download":"Scarica", "fa-paper-plane":"Invia",
    "fa-xmark":"Chiudi", "fa-rotate-left":"Nuova chat", "fa-copy":"Copia", "fa-plus":"Aggiungi", "fa-arrows-rotate":"Aggiorna", "fa-chevron-left":"Riduci o espandi il menu",
    "fa-bars":"Apri il menu", "fa-paperclip":"Allega foto o PDF", "fa-eye":"Vedi", "fa-lock":"Non incluso nel tuo pacchetto: tocca per saperne di più" };
  const MODULI_TIP = { home:"Panoramica del centro, accesso rapido e promemoria", centro:"Dati del centro, team, codice invito e il tuo pacchetto",
    cavalli:"Anagrafica cavalli, scadenzario sanitario e Box / Stalla", lezioni:"Calendario delle lezioni e prenotazioni", pacchetti:"Carnet, abbonamenti e pensioni",
    comunicazioni:"Messaggi al team e chat con i clienti", magazzino:"Scorte, movimenti, riordini e fornitori", statistiche:"Incassi, clienti a rischio, margini e radar di Merlino",
    professionisti:"Maniscalchi collegati: chat e appuntamenti", groom:"App Equo Groom per il personale di stalla: QR, PIN e icone del giorno", store:"Vendita online (in arrivo)", fatturazione:"Fatture elettroniche SDI (in arrivo)", ai:"Athena, Merlino e gli altri agenti" };
  function crea(){ if(!tip){ tip = document.createElement("div"); tip.id = "eq-tip"; tip.setAttribute("role", "tooltip"); document.body.appendChild(tip); } return tip; }
  function mostra(el){
    if(window.__boxDrag) return;
    const testo = el.getAttribute("data-tip"); if(!testo) return;
    const t = crea(); t.textContent = testo; t.classList.remove("sopra", "sotto"); t.style.left = "0px"; t.style.top = "0px"; t.classList.add("vis");
    const r = el.getBoundingClientRect(), w = t.offsetWidth, h = t.offsetHeight;
    let x = Math.min(window.innerWidth - w - 8, Math.max(8, r.left + r.width / 2 - w / 2));
    let y = r.top - h - 10, sopra = true;
    if(y < 8){ y = r.bottom + 10; sopra = false; }
    t.style.left = x + "px"; t.style.top = y + "px"; t.classList.add(sopra ? "sopra" : "sotto");
    t.style.setProperty("--freccia", Math.min(w - 12, Math.max(12, r.left + r.width / 2 - x)) + "px");
  }
  function nascondi(){ clearTimeout(timer); bersaglio = null; if(tip) tip.classList.remove("vis"); }
  document.addEventListener("mouseover", e => {
    const el = e.target.closest && e.target.closest("[data-tip]");
    if(el === bersaglio) return;
    nascondi(); if(!el) return;
    bersaglio = el; timer = setTimeout(() => mostra(el), 450);
  });
  document.addEventListener("mouseout", e => { if(bersaglio && !bersaglio.contains(e.relatedTarget)) nascondi(); });
  document.addEventListener("scroll", nascondi, true);
  document.addEventListener("focusin", e => { const el = e.target.closest && e.target.closest("[data-tip]"); if(el && el.matches(":focus-visible")) mostra(el); });
  document.addEventListener("focusout", nascondi);
  // telefono / tablet: tieni premuto per vedere il suggerimento (senza attivare il tasto)
  document.addEventListener("touchstart", e => {
    const el = e.target.closest && e.target.closest("[data-tip]");
    nascondi(); if(!el) return;
    timer = setTimeout(() => { mostra(el); bloccaClick = true; setTimeout(nascondi, 2600); }, 520);
  }, { passive: true });
  ["touchend", "touchmove", "touchcancel"].forEach(ev => document.addEventListener(ev, () => clearTimeout(timer), { passive: true }));
  document.addEventListener("click", e => { if(bloccaClick){ bloccaClick = false; e.preventDefault(); e.stopPropagation(); return; } nascondi(); }, true);
  document.addEventListener("contextmenu", e => { if(e.target.closest && e.target.closest("[data-tip]") && matchMedia("(hover: none)").matches) e.preventDefault(); });
  // suggerimenti automatici: vecchi title → data-tip, pulsanti con sola icona, voci del menu
  function automatici(radice){
    (radice || document).querySelectorAll("[title]:not(input):not(textarea):not(select):not(iframe)").forEach(el => { if(!el.hasAttribute("data-tip")) el.setAttribute("data-tip", el.getAttribute("title")); el.removeAttribute("title"); });
    (radice || document).querySelectorAll("button:not([data-tip]), .x:not([data-tip])").forEach(b => {
      if(b.textContent.trim()) return;
      const i = b.querySelector("i[class*='fa-']"); if(!i && !b.classList.contains("x")) return;
      const k = i ? [...i.classList].find(c => ICONE_TIP[c]) : null;
      if(k) b.setAttribute("data-tip", ICONE_TIP[k]); else if(b.classList.contains("x")) b.setAttribute("data-tip", "Chiudi");
    });
    (radice || document).querySelectorAll(".nav-item[data-module]:not([data-tip])").forEach(n => { const t = MODULI_TIP[n.dataset.module]; if(t) n.setAttribute("data-tip", t); });
    (radice || document).querySelectorAll(".badge:not([data-tip])").forEach(b => { if(/soon/i.test(b.textContent)) b.setAttribute("data-tip", "In arrivo: ci stiamo lavorando"); });
  }
  let pend = null;
  const osserva = () => { clearTimeout(pend); pend = setTimeout(() => automatici(document), 250); };
  document.addEventListener("DOMContentLoaded", () => { automatici(document); new MutationObserver(osserva).observe(document.body, { childList: true, subtree: true }); });
  if(document.readyState !== "loading"){ automatici(document); new MutationObserver(osserva).observe(document.body, { childList: true, subtree: true }); }
})();

/* =====================================================================
   GESTIONE GROOM — app "Equo Groom" (/groom) per il personale di stalla.
   Niente account: QR personale (token) + PIN di 4 cifre scelto al primo accesso.
   Limiti: START 0 · ADVANCE 3 · PREMIUM 10 (separati dal limite del team).
   ===================================================================== */
let groomDati = { limite: 0, gestisce: false, groom: [] }, groomQrCorrente = null;
const GROOM_LINGUE = { it:"Italiano", en:"English", ro:"Română", hi:"हिन्दी", pa:"ਪੰਜਾਬੀ", bn:"বাংলা", ar:"العربية" };
const groomLimiteLocale = () => ({ start:0, advance:3, premium:10 })[pianoCentro?.pacchetto] ?? 50;
const groomLink = token => `${location.origin}/groom?t=${token}`;
async function groomCarica(){
  if(DEMO_MODE){
    if(!demoState.groom) demoState.groom = [
      { id:"g1", nome:"Rahim", lingua:"bn", attivo:true, pin_creato:true, bloccato:false, ultimo_accesso:new Date(Date.now() - 36e5).toISOString(), token:"demo-rahim" },
      { id:"g2", nome:"Ion", lingua:"ro", attivo:true, pin_creato:false, bloccato:false, ultimo_accesso:null, token:"demo-ion" } ];
    groomDati = { limite: groomLimiteLocale(), gestisce: true, groom: demoState.groom }; return;
  }
  const { data, error } = await sb.rpc("groom_elenco", { p_centro_id: currentCentro.id });
  if(error){ console.warn("groom:", error.message); groomDati = { limite: groomLimiteLocale(), gestisce: false, groom: [] }; return; }
  groomDati = data;
}
async function refreshGroomModule(){ await groomCarica(); groomRender(); }
async function groomCaricaTeam(){ if(pianoCentro && pianoCentro.groom === false) return; await groomCarica(); groomRenderTeam(); }
function groomAttivi(){ return groomDati.groom.filter(g => g.attivo).length; }
function groomQuando(iso){
  if(!iso) return "mai entrato";
  const d = new Date(iso), min = Math.round((Date.now() - d) / 6e4);
  if(min < 2) return "attivo ora"; if(min < 60) return `${min} min fa`;
  if(d.toDateString() === new Date().toDateString()) return "oggi alle " + d.toLocaleTimeString("it-IT", { hour:"2-digit", minute:"2-digit" });
  return d.toLocaleDateString("it-IT", { day:"numeric", month:"short" });
}
function groomRender(){
  const n = groomAttivi(), lim = groomDati.limite ?? groomLimiteLocale(), pieno = n >= lim;
  document.getElementById("groom-contatore").textContent = `${n} di ${lim}`;
  const btn = document.getElementById("groom-btn-agg");
  btn.style.display = groomDati.gestisce ? "" : "none";
  btn.classList.toggle("disabled", pieno);
  btn.setAttribute("data-tip", pieno ? (lim < 10 ? "Hai raggiunto i 3 groom di ADVANCE: con PREMIUM arrivi a 10." : "Hai raggiunto il massimo di groom del tuo pacchetto.") : "Crea il QR personale per un nuovo groom");
  const lista = document.getElementById("groom-lista");
  document.getElementById("groom-vuoto").style.display = groomDati.groom.length ? "none" : "block";
  lista.innerHTML = groomDati.groom.map(g => {
    const stato = !g.attivo ? `<span class="badge-pill badge-gray">Disattivato</span>`
      : g.bloccato ? `<span class="badge-pill" style="background:#fdeceb;color:#a5281b">PIN bloccato: genera un nuovo QR</span>`
      : !g.pin_creato ? `<span class="badge-pill" style="background:#fff4d6;color:#7a5300">In attesa del primo accesso</span>`
      : `<span class="badge-pill" style="background:#e8f3ec;color:#1d4a35">${escapeHtml(groomQuando(g.ultimo_accesso))}</span>`;
    const az = !groomDati.gestisce ? "" : g.attivo
      ? `<button class="btn btn-outline btn-sm" onclick="groomMostraQr('${g.id}')" data-tip="Mostra il QR personale da inquadrare"><i class="fa-solid fa-qrcode"></i> QR</button>
         <button class="btn btn-ghost btn-sm" onclick="groomNuovoQr('${g.id}')" data-tip="Telefono cambiato o PIN dimenticato: il vecchio QR smette di funzionare"><i class="fa-solid fa-arrows-rotate"></i> Nuovo QR</button>
         <button class="btn btn-ghost btn-sm" onclick="groomAttiva('${g.id}', false)" data-tip="Il groom non può più entrare nell'app"><i class="fa-solid fa-user-slash"></i> Disattiva</button>`
      : `<button class="btn btn-outline btn-sm" onclick="groomAttiva('${g.id}', true)"><i class="fa-solid fa-user-check"></i> Riattiva</button>
         <button class="btn btn-ghost btn-sm" onclick="groomElimina('${g.id}')"><i class="fa-solid fa-trash"></i></button>`;
    return `<div class="groom-riga${g.attivo ? "" : " off"}"><div class="groom-av">${escapeHtml((g.nome || "?").slice(0, 1).toUpperCase())}</div>
      <div class="groom-info"><b>${escapeHtml(g.nome)}</b><span>${escapeHtml(GROOM_LINGUE[g.lingua] || g.lingua)} · ${stato}</span></div><div class="groom-az">${az}</div></div>`;
  }).join("");
}
function groomRenderTeam(){
  const box = document.getElementById("team-groom"); if(!box) return;
  box.style.display = groomDati.groom.length ? "block" : "none";
  document.getElementById("team-groom-count").textContent = `${groomAttivi()} di ${groomDati.limite ?? groomLimiteLocale()}`;
  document.getElementById("team-groom-lista").innerHTML = groomDati.groom.map(g => `<div class="groom-riga mini${g.attivo ? "" : " off"}"><div class="groom-av">${escapeHtml((g.nome || "?").slice(0, 1).toUpperCase())}</div>
    <div class="groom-info"><b>${escapeHtml(g.nome)}</b><span>Groom · ${escapeHtml(GROOM_LINGUE[g.lingua] || "")} · ${g.attivo ? escapeHtml(g.pin_creato ? groomQuando(g.ultimo_accesso) : "in attesa del primo accesso") : "disattivato"}</span></div></div>`).join("");
}
function groomApriNuovo(){
  const lim = groomDati.limite ?? groomLimiteLocale();
  if(groomAttivi() >= lim){ if(lim < 10) return apriUpsell("groom"); return showToast("Hai raggiunto il massimo di groom del tuo pacchetto."); }
  document.getElementById("groom-nome").value = ""; document.getElementById("groom-lingua").value = "it";
  document.getElementById("groom-err").style.display = "none";
  openModal("modal-groom-nuovo"); setTimeout(() => document.getElementById("groom-nome").focus(), 50);
}
async function groomSalvaNuovo(){
  const nome = document.getElementById("groom-nome").value.trim(), lingua = document.getElementById("groom-lingua").value;
  const err = document.getElementById("groom-err");
  if(!nome){ err.textContent = "Scrivi il nome del groom."; err.style.display = "block"; return; }
  let r;
  if(DEMO_MODE){ r = { id:"g" + Date.now(), token:"demo-" + Date.now() }; demoState.groom.push({ id:r.id, nome, lingua, attivo:true, pin_creato:false, bloccato:false, ultimo_accesso:null, token:r.token }); }
  else{
    const { data, error } = await sb.rpc("groom_crea", { p_centro_id: currentCentro.id, p_nome: nome, p_lingua: lingua });
    if(error){ err.textContent = error.message; err.style.display = "block"; return; }
    r = data;
  }
  Registro.azione("groom:crea");
  closeModal("modal-groom-nuovo");
  await refreshGroomModule();
  groomMostraQr(r.id, r.token);
}
function groomMostraQr(id, token){
  const g = groomDati.groom.find(x => x.id === id);
  token = token || g?.token; if(!token) return showToast("QR non disponibile.");
  groomQrCorrente = { nome: g?.nome || "", link: groomLink(token) };
  document.getElementById("groom-qr-titolo").textContent = "QR di " + (g?.nome || "");
  const d = document.getElementById("groom-qr-img"); d.innerHTML = "";
  try{ new QRCode(d, { text: groomQrCorrente.link, width: 220, height: 220, colorDark: "#0b341e", colorLight: "#ffffff" }); } catch(e){ d.textContent = groomQrCorrente.link; }
  openModal("modal-groom-qr");
}
function groomCondividi(){
  if(!groomQrCorrente) return;
  const testo = `Ciao ${groomQrCorrente.nome}, questa è la tua app Equo Groom per ${currentCentro?.nome || "la scuderia"}. Apri il link, scegli il tuo PIN e la tua lingua: ${groomQrCorrente.link}`;
  if(navigator.share){ navigator.share({ title:"Equo Groom", text: testo }).catch(() => {}); return; }
  window.open("https://wa.me/?text=" + encodeURIComponent(testo), "_blank");
}
async function groomCopia(){ try{ await navigator.clipboard.writeText(groomQrCorrente.link); showToast("Link copiato."); } catch(e){ showToast(groomQrCorrente.link); } }
async function groomStampaQr(){
  const u = await qrDataUrl(groomQrCorrente.link);
  groomFinestraStampa(`<div class="et grande"><img src="${u}"><b>${escapeHtml(groomQrCorrente.nome)}</b><span>Equo Groom · ${escapeHtml(currentCentro?.nome || "")}</span><small>QR personale: non condividerlo</small></div>`, "QR groom");
}
async function groomNuovoQr(id){
  const g = groomDati.groom.find(x => x.id === id);
  if(!await groomConferma("Nuovo QR", `Il QR attuale di ${g.nome} smetterà di funzionare e al prossimo accesso sceglierà un nuovo PIN. Procedo?`)) return;
  let token;
  if(DEMO_MODE){ token = "demo-" + Date.now(); Object.assign(g, { token, pin_creato:false, bloccato:false }); }
  else{ const { data, error } = await sb.rpc("groom_nuovo_qr", { p_id: id }); if(error) return showToast(error.message); token = data.token; }
  await refreshGroomModule(); groomMostraQr(id, token);
}
async function groomAttiva(id, attivo){
  const g = groomDati.groom.find(x => x.id === id);
  if(!attivo && !await groomConferma("Disattiva groom", `${g.nome} non potrà più entrare nell'app Groom. Le spunte che ha già fatto restano. Potrai riattivarlo con un nuovo QR.`)) return;
  if(attivo && groomAttivi() >= (groomDati.limite ?? groomLimiteLocale())) return groomApriNuovo();
  if(DEMO_MODE){ Object.assign(g, { attivo, pin_creato: attivo ? false : g.pin_creato }); }
  else{ const { error } = await sb.rpc("groom_attiva", { p_id: id, p_attivo: attivo }); if(error) return showToast(error.message); }
  await refreshGroomModule();
  if(attivo) groomMostraQr(id);
}
async function groomElimina(id){
  const g = groomDati.groom.find(x => x.id === id);
  if(!await groomConferma("Elimina groom", `Elimino ${g.nome} dall'elenco? Le spunte che ha già fatto restano nello storico.`)) return;
  if(DEMO_MODE) demoState.groom = demoState.groom.filter(x => x.id !== id);
  else{ const { error } = await sb.rpc("groom_elimina", { p_id: id }); if(error) return showToast(error.message); }
  await refreshGroomModule();
}
function groomConferma(titolo, testo){
  return new Promise(ok => {
    document.getElementById("box-conf-titolo").textContent = titolo; document.getElementById("box-conf-testo").textContent = testo;
    const si = document.getElementById("box-conf-si"), no = document.getElementById("box-conf-no");
    si.onclick = () => { closeModal("modal-box-conferma"); ok(true); }; no.onclick = () => { closeModal("modal-box-conferma"); ok(false); };
    openModal("modal-box-conferma");
  });
}
// etichette QR per i box: il groom inquadra e apre subito quel cavallo
async function groomStampaBox(){
  if(!boxList || !boxList.length){ try{ await loadBox(); } catch(e){} }
  const lista = (boxList || []).slice().sort((a, b) => (a.numero || 0) - (b.numero || 0));
  if(!lista.length) return showToast("Nessun box: creali prima in Cavalli & Salute → Box / Stalla.");
  showToast("Preparo le etichette…");
  const et = [];
  for(const b of lista){
    const u = await qrDataUrl(`${location.origin}/groom?b=${b.id}`);
    et.push(`<div class="et"><img src="${u}"><b>Box ${escapeHtml(b.numero ?? "")}</b><span>${escapeHtml([b.nome, b.zona].filter(Boolean).join(" · ") || currentCentro?.nome || "")}</span><small>Equo Groom</small></div>`);
  }
  groomFinestraStampa(et.join(""), "QR dei box");
}
function groomFinestraStampa(corpo, titolo){
  const w = window.open("", "_blank"); if(!w) return showToast("Consenti le finestre pop-up per stampare.");
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${titolo}</title><style>
    @page{ size:A4; margin:10mm } body{ font-family:Arial,sans-serif; margin:0; color:#0b341e }
    .griglia{ display:grid; grid-template-columns:repeat(3,1fr); gap:6mm }
    .et{ border:0.4mm solid #0b341e; border-radius:3mm; padding:4mm; text-align:center; break-inside:avoid; display:flex; flex-direction:column; align-items:center; gap:1mm }
    .et img{ width:42mm; height:42mm } .et b{ font-size:16pt } .et span{ font-size:9pt; color:#444 } .et small{ font-size:7.5pt; color:#777 }
    .et.grande{ width:90mm; margin:20mm auto } .et.grande img{ width:70mm; height:70mm }
  </style></head><body><div class="${corpo.includes("grande") ? "" : "griglia"}">${corpo}</div><script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>`);
  w.document.close();
}

function openModal(id){ document.getElementById(id).classList.add("active"); }

