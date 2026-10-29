// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { clienteDaInvitare, linkInvito } from "./108-invito-qr.js";
import { clientiAttivi, loadClientiMascalcia } from "./032-richiamo-prossimo-intervento-sempre-in-g.js";
import { isStruttura } from "./033-clienti-a-cartelle-stile-telegram-cavall.js";
import { apriSchedaFerratura } from "./035-ferratura-del-cavallo-scheda-libretto-fe.js";
import { loadClienteInterventi } from "./037-scheda-cliente-a-box-scheda-del-cavallo.js";
import { renderCorpoCavalloPro } from "./038-avviso-sembra-lo-stesso-cavallo.js";
import { razzaImposta, razzaValore } from "./039-razza-menu-con-ricerca-stesso-codice-in.js";
import { isPremium } from "./042-incassi-pro.js";
import { renderCicloStruttura } from "./102-scadenze-della-struttura.js";
import { creaClienteUnico, onbEmail, onbRenderStato, onbResetTipo } from "./116-onboarding.js";
import { MISURE_FERRO, misuraNorm, misuraPredefinita, renderMisuraWheel } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { ferroStd, siglaFerro } from "./052-ferro-standard-nella-scheda-del-cavallo.js";
/* ---------- STRUTTURE COLLEGATE A EQUO SCUDERIA (Professionisti, opzione A) ----------
   La struttura è un cliente "struttura" con centro_id. Collegamento con doppia conferma:
   invito dalla struttura → il maniscalco accetta qui; richiesta del maniscalco (codice del centro) → accetta la struttura. */
function isManiscalcoUtente(){
  const r = [currentUser?.ruolo, currentUser?.ruoloSecondario, currentUser?.ruolo_secondario];
  return !!currentUser && (r.includes("maniscalco") || r.includes("veterinario"));
}
function badgeCollegamentoCliente(c){
  if(c.collegamento_stato === "attivo") return '<span class="badge badge-green" style="font-size:10.5px;flex-shrink:0">Equo Scuderia</span>';
  if(c.collegamento_stato === "da_confermare_pro") return '<span class="badge badge-red" style="font-size:10.5px;flex-shrink:0">Invito</span>';
  if(c.collegamento_stato === "da_confermare_struttura") return '<span class="badge badge-accent" style="font-size:10.5px;flex-shrink:0">In attesa</span>';
  return c.cliente_user_id ? '<span class="badge badge-green" style="font-size:10.5px;flex-shrink:0">su Equo</span>' : "";
}

async function rispondiInvitoStruttura(clienteId, accetta, btn){
  if(window.event) window.event.stopPropagation();
  if(btn) btn.disabled = true;
  const { data, error } = await sb.rpc("pro_rispondi_collegamento_struttura", { p_cliente_id: clienteId, p_accetta: accetta });
  if(error || !data?.ok){
    showToast((data && data.errore) || "Operazione non riuscita. Riprova.");
    if(btn) btn.disabled = false;
    return;
  }
  showToast(accetta ? "Scuderia collegata: trovi la chat in Messaggi → Scuderie." : "Invito rifiutato.");
  await loadClientiMascalcia();
}

let collegaStrutturaClienteId = null;
function apriCollegaStruttura(clienteId){
  collegaStrutturaClienteId = clienteId || null;
  document.getElementById("collega-struttura-codice").value = "";
  document.getElementById("collega-struttura-error").style.display = "none";
  openModal("modal-collega-struttura");
}

async function inviaRichiestaStruttura(){
  const input = document.getElementById("collega-struttura-codice");
  const err = document.getElementById("collega-struttura-error");
  const codice = input.value.trim().toUpperCase();
  err.style.display = "none";
  if(!codice){ err.textContent = "Inserisci il codice della scuderia."; err.style.display = "block"; return; }
  if(DEMO_MODE){ closeModal("modal-collega-struttura"); showToast("In demo il collegamento non è disponibile."); return; }
  const { data, error } = await sb.rpc("pro_richiedi_collegamento_struttura", { p_codice: codice, p_cliente_id: collegaStrutturaClienteId });
  if(error || !data?.ok){
    err.textContent = (data && data.errore) || "Non è stato possibile inviare la richiesta. Riprova.";
    err.style.display = "block";
    return;
  }
  closeModal("modal-collega-struttura");
  showToast(data.gia
    ? (data.stato === "attivo" ? `Sei già collegato a ${data.nome}.` : `C'è già una richiesta in corso con ${data.nome}.`)
    : `Richiesta inviata a ${data.nome}: la scuderia deve accettarla.`);
  // P.IVA non obbligatoria: solo un consiglio (serve per il badge Equo Certified)
  if(data.senza_piva && !data.gia) setTimeout(() => showToast("Consiglio: aggiungi la P.IVA in menu profilo → Dati per i pagamenti per avere il badge Equo Certified."), 3200);
  await loadClientiMascalcia();
  if(currentClienteId && document.getElementById("clienti-detail-view")?.style.display === "block") openClienteDetail(currentClienteId);
}

// chiusura del collegamento con Equo Scuderia: finestra di conferma (prima bastava un doppio tocco)
function scollegaStrutturaCorrente(){
  const c = clientiMascalcia.find(x => x.id === currentClienteId);
  if(!c || !c.centro_id) return;
  const attivo = c.collegamento_stato === "attivo";
  const nome = escapeHtml(c.nome || "la scuderia");
  document.getElementById("scollega-struttura-titolo").textContent = attivo ? "Chiudi collegamento" : "Annulla richiesta";
  document.getElementById("scollega-struttura-testo").innerHTML = attivo
    ? `Vuoi chiudere il collegamento con <strong>${nome}</strong>?<br>Lo staff non vedrà più la chat e gli appuntamenti con te. La scheda cliente, gli interventi e i messaggi restano tuoi. Per ricollegarti servirà di nuovo il codice della scuderia e la sua conferma.`
    : `Vuoi annullare la richiesta di collegamento con <strong>${nome}</strong>?`;
  const ok = document.getElementById("scollega-struttura-ok");
  ok.textContent = attivo ? "Chiudi collegamento" : "Annulla richiesta"; ok.disabled = false;
  openModal("modal-scollega-struttura");
}
async function confermaScollegaStruttura(){
  const c = clientiMascalcia.find(x => x.id === currentClienteId);
  if(!c || !c.centro_id){ closeModal("modal-scollega-struttura"); return; }
  const ok = document.getElementById("scollega-struttura-ok"); ok.disabled = true;
  try{
    const { data, error } = await sb.rpc("pro_scollega_struttura", { p_cliente_id: c.id });
    if(error || !data?.ok){ showToast((data && data.errore) || "Operazione non riuscita. Riprova."); return; }
    closeModal("modal-scollega-struttura");
    showToast("Collegamento chiuso. La scheda cliente resta tua.");
    await loadClientiMascalcia();
    openClienteDetail(c.id);
  } finally { ok.disabled = false; }
}

const ERRORI_COLLEGA_CLIENTE = {
  codice_non_valido: "Codice Equo non trovato. Controlla di averlo scritto bene.",
  codice_tuo: "Questo è il tuo codice: serve quello del cliente.",
  codice_professionista: "Questo è il codice di un professionista, non di un cliente. Il cliente trova il suo codice in Equo, menu → «Il tuo codice».",
  gia_collegato_altro: "Questo cliente è già collegato a un altro account Equo.",
  cliente_non_trovato: "Cliente non trovato.",
  non_autenticato: "Sessione scaduta: esci e rientra.",
};
function messaggioErroreCollegaCliente(res){
  if(res?.errore === "gia_tuo_cliente") return `Questo account è già collegato al tuo cliente "${res.nome_cliente || ""}".`;
  return ERRORI_COLLEGA_CLIENTE[res?.errore] || ("Collegamento non riuscito." + (res?.messaggio ? " (" + res.messaggio + ")" : ""));
}

/* -> stato-condiviso.js */
// si apre sopra eventuali altri moduli (che restano compilati sotto)
function mostraLimiteClienti(){ openModal("modal-limite-clienti"); }
function apriNuovoCliente(tipo){
  if(!isPremium() && clientiAttivi().length >= LIMITE_CLIENTI_FREE){ mostraLimiteClienti(); return; }
  ["cliente-nome", "cliente-cavallo", "cliente-telefono", "cliente-email", "cliente-indirizzo", "cliente-note", "cliente-codice-equo"].forEach(id => { const el = document.getElementById(id); if(el) el.value = ""; });
  onbResetTipo();
  { const n = document.getElementById("cliente-indirizzo-pos-nota"); if(n){ n.textContent = ""; n.className = "pos-nota"; } }
  document.getElementById("cliente-error").style.display = "none";
  document.getElementById("cliente-tipo").value = tipo === "struttura" ? "struttura" : "proprietario";
  aggiornaEtichetteNuovoCliente();
  openModal("modal-add-cliente");
}

function aggiornaEtichetteNuovoCliente(){
  const struttura = document.getElementById("cliente-tipo").value === "struttura";
  document.getElementById("cliente-nome-label").textContent = struttura ? "Nome scuderia o centro ippico" : "Nome cliente";
  document.getElementById("cliente-nome").placeholder = struttura ? "es. Scuderia Le Querce" : "es. Marco Bianchi";
  const tit = document.getElementById("cliente-modal-titolo"); if(tit) tit.textContent = struttura ? "Nuova scuderia" : "Nuovo cliente";
  const btn = document.getElementById("cliente-save-btn"); if(btn) btn.textContent = struttura ? "Salva scuderia" : "Salva cliente";
}

// "Aurora, Baia" -> una scheda cavallo per nome (senza doppioni)
function nomiCavalliDaTesto(testo){
  const visti = new Set();
  return String(testo || "").split(/[,;\n]+/).map(x => x.trim()).filter(x => x && !visti.has(x.toLowerCase()) && visti.add(x.toLowerCase())).slice(0, 30);
}
async function creaCavalliDaTesto(clienteId, testo, salta){
  const creati = [], via = new Set((salta || []).map(x => x.toLowerCase()));
  for(const nome of nomiCavalliDaTesto(testo)){
    if(via.has(nome.toLowerCase())) continue;
    const { data, error } = await DB.insertCavalloCliente({ cliente_mascalcia_id: clienteId, nome });
    if(!error && data) creati.push(data);
  }
  return creati;
}

async function createClienteMascalcia(){
  const nome = document.getElementById("cliente-nome").value.trim();
  if(!nome) return;
  const nome_cavallo = document.getElementById("cliente-cavallo").value.trim();
  const telefono = document.getElementById("cliente-telefono").value.trim();
  const note = document.getElementById("cliente-note").value.trim();
  const tipo_cliente = document.getElementById("cliente-tipo").value;
  const codiceEquo = document.getElementById("cliente-codice-equo").value.trim().toUpperCase();
  const errBox = document.getElementById("cliente-error");
  errBox.style.display = "none";
  const email = onbEmail("cliente-email");
  if(email === null){ errBox.textContent = "L'email non sembra giusta: controllala o lasciala vuota."; errBox.style.display = "block"; return; }
  const btn = document.getElementById("cliente-save-btn");
  btn.disabled = true;
  try {
    // 28/10/2026: strada unica per i clienti nuovi (cavalli già presenti, email, indirizzo) · 116-onboarding.js
    const { error, data: nuovo } = await creaClienteUnico({ nome, tipo_cliente, telefono, note, email, indirizzo: document.getElementById("cliente-indirizzo")?.value.trim(), cavalli: nome_cavallo });
    if(error || !nuovo){ errBox.textContent = "Errore: " + (error?.message || "salvataggio non riuscito"); errBox.style.display = "block"; return; }
    let msgCollegamento = "";
    if(codiceEquo){
      const res = await DB.collegaClienteDaCodice(nuovo.id, codiceEquo);
      msgCollegamento = res.ok ? " e collegato a Equo: gli è arrivato il tuo primo messaggio" : " — codice non collegato: " + messaggioErroreCollegaCliente(res);
    }
    ["cliente-nome", "cliente-cavallo", "cliente-telefono", "cliente-email", "cliente-indirizzo", "cliente-note", "cliente-codice-equo"].forEach(id => { const el = document.getElementById(id); if(el) el.value = ""; });
    closeModal("modal-add-cliente");
    showToast("Cliente salvato" + msgCollegamento);
    await loadClientiMascalcia();
  } finally {
    btn.disabled = false;
  }
}

async function openClienteDetail(id){
  currentClienteId = id;
  const c = clientiMascalcia.find(x => x.id === id);
  if(!c) return;
  document.getElementById("clienti-list-view").style.display = "none";
  document.getElementById("clienti-detail-view").style.display = "block";
  document.getElementById("detail-cliente-nome").textContent = c.nome;
  document.getElementById("detail-cliente-info").innerHTML = `
    <div style="font-size:13.5px;line-height:1.8">
      ${c.archiviato_il ? `<div style="color:var(--muted)"><strong>Archiviato</strong> il ${new Date(c.archiviato_il).toLocaleDateString("it-IT")}: non compare nella lista né nelle scadenze.</div>` : ""}
      <div><strong>Tipo:</strong> ${isStruttura(c) ? "Scuderia / centro ippico" : "Proprietario"} ${badgeCollegamentoCliente(c)}</div>
      ${c.telefono ? `<div><strong>Telefono:</strong> <a href="tel:${escapeHtml(c.telefono)}" style="color:inherit">${escapeHtml(c.telefono)}</a></div>` : ""}
      ${c.indirizzo ? `<div><strong>Indirizzo:</strong> ${escapeHtml(c.indirizzo)}</div>` : ""}
      ${c.note ? `<div><strong>Note:</strong> ${escapeHtml(c.note)}</div>` : ""}
    </div>
    <div class="cli-chip-row">
      <button class="cli-chip" onclick="openChatThread(currentClienteId)"><span class="icon"><svg><use href="#i-inbox"/></svg></span> Messaggi</button>
      <button class="cli-chip" id="cli-chip-qr" onclick="toggleQrCliente()">QR e codice invito</button>
      ${isStruttura(c) && !c.archiviato_il ? `<button class="cli-chip" onclick="apriCambiaProprietario(true)"><span class="fa-icon"><i class="fa-solid fa-user"></i></span> + Assegna proprietario a cavallo</button>` : ""}
    </div>
    <div class="cli-ciclo" id="cli-ciclo" style="display:none"></div>
    <div class="onb-stato" id="cli-onb" style="display:none"></div>`;
  renderCicloStruttura(c);
  renderProposteCliente(c);
  onbRenderStato(c);
  const chipQr = document.getElementById("cli-chip-qr");
  if(chipQr) chipQr.style.display = isStruttura(c) && c.centro_id ? "none" : "";
  qrClienteAperto = false;
  document.querySelectorAll(".btn-archivia-cliente").forEach(b => b.textContent = c.archiviato_il ? "Ripristina cliente" : "Archivia cliente");
  document.getElementById("detail-cliente-code").textContent = c.codice_invito;
  const linkHint = document.getElementById("detail-cliente-link-hint");
  if(linkHint){
    linkHint.innerHTML = c.cliente_user_id
      ? '<strong style="color:var(--primary)">✓ Collegato a Equo</strong> — riceve i tuoi messaggi e PDF nell\'app.'
      : isStruttura(c)
        ? 'Dai questo codice alla scuderia: può collegarsi da Equo App (Chat → "Il tuo maniscalco" → Collega), presto anche da Equo Scuderia.'
        : 'Fallo inquadrare al cliente con la fotocamera: si apre Equo, crea l\'account e siete collegati. Oppure condividi l\'invito.';
  }
  // proprietario non ancora collegato: il QR è il link di invito (apre Equo e collega da solo); scuderie: il codice
  const daInvitare = clienteDaInvitare(c);
  const qrBox = document.getElementById("detail-cliente-qr");
  qrBox.innerHTML = "";
  if(window.QRCode){ new QRCode(qrBox, { text: daInvitare ? linkInvito(c.codice_invito) : c.codice_invito, width: 140, height: 140 }); }
  { const b = document.getElementById("detail-cliente-invia-invito"); if(b) b.style.display = daInvitare ? "" : "none"; }
  // Strutture: collegamento con Equo Scuderia al posto del codice invito
  const qrCard = document.getElementById("detail-cliente-qr-card");
  let boxScud = document.getElementById("detail-cliente-scuderia");
  if(!boxScud){
    boxScud = document.createElement("div");
    boxScud.id = "detail-cliente-scuderia";
    boxScud.className = "card";
    boxScud.style.marginBottom = "14px";
    qrCard.parentNode.insertBefore(boxScud, qrCard);
  }
  if(isStruttura(c) && c.centro_id){
    if(qrCard) qrCard.style.display = "none";
    boxScud.style.display = "block";
    boxScud.style.display = "block";
    const statoTxt = c.collegamento_stato === "attivo" ? '<strong style="color:var(--green)">✓ Collegata a Equo Scuderia</strong> — chat e appuntamenti con la scuderia con doppia conferma.'
      : c.collegamento_stato === "da_confermare_pro" ? "La scuderia ti ha invitato: accetta per collegarti."
      : "Richiesta inviata: in attesa che la scuderia accetti.";
    boxScud.innerHTML = `<div style="font-size:13.5px;line-height:1.6;margin-bottom:10px">${statoTxt}</div>
      ${c.collegamento_stato === "da_confermare_pro" ? `<div style="display:flex;gap:8px;margin-bottom:8px">
        <button class="btn btn-primary btn-sm btn-conferma" style="flex:1" onclick="rispondiInvitoStruttura('${c.id}', true, this).then(() => openClienteDetail('${c.id}'))">Accetta</button>
        <button class="btn btn-outline btn-sm" style="flex:1" onclick="rispondiInvitoStruttura('${c.id}', false, this).then(() => closeClienteDetail())">Rifiuta</button></div>` : ""}
      <button class="btn btn-ghost btn-sm" id="cliente-scollega-btn" style="width:100%;color:var(--red)" onclick="scollegaStrutturaCorrente()">${c.collegamento_stato === "attivo" ? "Scollega da Equo Scuderia" : "Annulla richiesta"}</button>`;
  } else if(isStruttura(c) && isManiscalcoUtente()){
    if(qrCard) qrCard.style.display = "none";
    boxScud.style.display = "block";
    boxScud.innerHTML = `<div style="font-size:13.5px;line-height:1.6;margin-bottom:10px">La scuderia usa <strong>Equo Scuderia</strong>? Collegala per chattare con lo staff e fissare gli appuntamenti con doppia conferma.</div>
      <button class="btn btn-outline btn-sm" style="width:100%" onclick="apriCollegaStruttura('${c.id}')"><span class="fa-icon" style="width:13px;height:13px"><i class="fa-solid fa-link"></i></span> Collega a Equo Scuderia</button>`;
  } else {
    if(qrCard) qrCard.style.display = "none";
    boxScud.style.display = "none";
  }
  document.getElementById("cliente-cavalli-cerca").value = "";
  document.getElementById("cavallo-pro-view").style.display = "none";
  await loadClienteInterventi(id);
}
let qrClienteAperto = false;
function toggleQrCliente(){
  qrClienteAperto = !qrClienteAperto;
  const card = document.getElementById("detail-cliente-qr-card");
  if(card) card.style.display = qrClienteAperto ? "block" : "none";
  const chip = document.getElementById("cli-chip-qr");
  if(chip) chip.classList.toggle("on", qrClienteAperto);
}

/* -> stato-condiviso.js */

async function openEditCliente(){
  const c = clientiMascalcia.find(x => x.id === currentClienteId);
  if(!c) return;
  document.getElementById("edit-cliente-tipo").value = isStruttura(c) ? "struttura" : "proprietario";
  // collegato a un account Equo o a Equo Scuderia: il tipo di cliente non si cambia (caso Riccardo/Simone, 24/10)
  { const bloccato = !!(c.cliente_user_id || c.centro_id);
    document.getElementById("edit-cliente-tipo").disabled = bloccato;
    document.getElementById("edit-cliente-nome").disabled = bloccato;   // profilo certificato: il nome viene dal profilo
    const n = document.getElementById("edit-cliente-tipo-nota"); if(n) n.style.display = bloccato ? "block" : "none"; }
  document.getElementById("edit-cliente-codice-equo").value = "";
  document.getElementById("edit-cliente-codice-group").style.display = c.cliente_user_id ? "none" : "flex";
  document.getElementById("edit-cliente-collegato").style.display = c.cliente_user_id ? "flex" : "none";
  document.getElementById("edit-cliente-promemoria").checked = c.promemoria_pagamenti !== false;
  document.getElementById("edit-cliente-nome").value = c.nome || "";
  document.getElementById("edit-cliente-telefono").value = c.telefono || "";
  { const em = document.getElementById("edit-cliente-email"); if(em) em.value = c.email || "";
    const g = document.getElementById("edit-cliente-email-group"); if(g) g.style.display = c.cliente_user_id || c.centro_id ? "none" : ""; }
  document.getElementById("edit-cliente-indirizzo").value = c.indirizzo || "";
  { const n = document.getElementById("edit-cliente-indirizzo-pos-nota"); if(n){ n.textContent = ""; n.className = "pos-nota"; } }
  document.getElementById("edit-cliente-note").value = c.note || "";
  document.getElementById("edit-cliente-error").style.display = "none";
  openModal("modal-edit-cliente");
  await renderCavalliEditCliente();
}

let cavalliEditCache = [];
async function renderCavalliEditCliente(){
  const box = document.getElementById("edit-cliente-cavalli");
  box.innerHTML = '<div class="muted" style="font-size:13px">Caricamento…</div>';
  const [cav, attesa, arch] = await Promise.all([DB.listCavalliCliente(currentClienteId), DB.listLasciatiInAttesa(), DB.listCavalliArchiviati(currentClienteId)]);
  cavalliEditCache = cav;
  const collegato = x => !!(x.tipo === "equo" || x.horse_id || x.scuderia_cavallo_id);
  const tastoLascia = x => x.id && attesa.has(x.id)
    ? `<button class="btn btn-ghost btn-sm" onclick="annullaLasciaCavallo('${x.id}')">Annulla richiesta</button>`
    : `<button class="btn btn-outline btn-sm" onclick="apriLasciaCavallo('${x.key}')" aria-label="${collegato(x) ? "Non lo seguo più" : "Archivia cavallo"}" title="${collegato(x) ? "Non lo seguo più" : "Archivia"}"><span class="fa-icon"><i class="fa-solid ${collegato(x) ? "fa-user-slash" : "fa-box-archive"}"></i></span></button>`;
  box.innerHTML = (cav.length ? cav.map(x => `
    <div class="event-item" style="padding:8px 0">
      <div style="font-size:14px">${escapeHtml(x.nome)}${x.tipo === "equo" ? ' <span class="badge badge-accent" style="font-size:10.5px">su Equo</span>' : ""}${x.id && attesa.has(x.id) ? ' <span class="badge" style="font-size:10.5px">In attesa di conferma</span>' : ""}
        <div class="muted" style="font-size:11.5px">${[x.codice_equo ? '<b class="cod-equo">' + escapeHtml(x.codice_equo) + '</b>' : "", x.razza ? escapeHtml(x.razza) : "", x.microchip ? "chip " + escapeHtml(x.microchip) : "", x.presso ? "📍 presso " + escapeHtml(x.presso) : "", x.ferro_numero ? "ferro " + escapeHtml(siglaFerro(x.ferro_sistema, x.ferro_numero)) : ""].filter(Boolean).join(" · ")}</div></div>
      <div style="display:flex;gap:6px;flex-shrink:0"><button class="btn btn-outline btn-sm btn-variazione" onclick="apriFerroCavallo('${x.key}')" aria-label="Ferro standard">${x.ferro_numero ? "Ferro" : "+ Ferro"}</button>${x.tipo === "manuale" && !x.horse_id && !x.scuderia_cavallo_id ? `<button class="btn btn-outline btn-sm btn-variazione" onclick="apriRazzaCavallo('${x.id}')" aria-label="Razza">${x.razza ? "Razza" : "+ Razza"}</button>` : ""}${tastoLascia(x)}</div>
    </div>
    <div class="rz-riga" id="rz-riga-${x.id}" style="display:none">
      <input class="input" id="rz-cv-${x.id}" placeholder="Scrivi per cercare la razza">
      <button class="btn btn-primary btn-sm btn-conferma" onclick="salvaRazzaCavallo('${x.id}')">OK</button>
    </div>`).join("") : '<div class="muted" style="font-size:13px">Nessun cavallo.</div>')
    + (arch.length ? `<details class="cav-archiviati" style="margin-top:8px"><summary class="muted" style="font-size:13px;cursor:pointer">Cavalli archiviati (${arch.length})</summary>
      ${arch.map(a => `<div class="event-item" style="padding:6px 0"><div style="font-size:14px">${escapeHtml(a.nome || "")}
        <div class="muted" style="font-size:11.5px">${a.horse_id || a.scuderia_cavallo_id ? "Non lo segui più" : "Archiviato"}${a.archiviato_il ? " dal " + formatDate(String(a.archiviato_il).slice(0, 10)) : ""}</div></div>
        <button class="btn btn-outline btn-sm" onclick="ripristinaCavallo('${a.id}')">Ripristina</button></div>`).join("")}</details>` : "");
  return cav;
}

function apriRazzaCavallo(id){
  const riga = document.getElementById("rz-riga-" + id); if(!riga) return;
  const aperta = riga.style.display !== "none";
  riga.style.display = aperta ? "none" : "flex";
  if(!aperta){
    const cv = (cavalliEditCache || []).find(x => x.id === id);
    razzaImposta("rz-cv-" + id, cv?.razza || "");
    document.getElementById("rz-cv-" + id).focus();
  }
}
async function salvaRazzaCavallo(id){
  const razza = razzaValore("rz-cv-" + id);
  if(razza === false) return;
  const { error } = await DB.updateCavalloCliente(id, { razza });
  if(error){ showToast("Errore: " + error.message); return; }
  showToast(razza ? "Razza salvata: il codice del cavallo si aggiorna" : "Razza tolta");
  await renderCavalliEditCliente();
}
// FERRO STANDARD nella scheda del cavallo (vale per tutti gli appuntamenti; ogni cambio resta nello storico del cavallo)
let ferroCavalloKey = null;
function cavalloPerChiaveFerro(key){
  return (document.getElementById("cavallo-pro-view")?.style.display === "block" ? schedaCavalli : cavalliEditCache || []).find(x => x.key === key)
    || (cavalliEditCache || []).find(x => x.key === key) || (schedaCavalli || []).find(x => x.key === key);
}
function apriFerroCavallo(key){
  const cv = cavalloPerChiaveFerro(key);
  if(!cv) return;
  if(typeof apriSchedaFerratura === "function"){
    return apriSchedaFerratura(cv, currentClienteId, () => {
      if(document.getElementById("cavallo-pro-view")?.style.display === "block") renderCorpoCavalloPro();
      else renderCavalliEditCliente();
    });
  }
  ferroCavalloKey = key;
  document.getElementById("ferro-cav-titolo").textContent = "Ferro standard · " + cv.nome;
  const f = ferroStd(cv) || { s: misuraPredefinita("olandese"), n: null };
  document.getElementById("ferro-misura-sistema").value = f.s;
  const idx = f.n ? MISURE_FERRO[f.s].indexOf(misuraNorm(f.n)) : -1;
  misuraIndiceFerro = idx >= 0 ? idx : MISURA_INDICE_PARTENZA;
  document.getElementById("ferro-cav-togli").style.display = cv.ferro_numero ? "block" : "none";
  openModal("modal-ferro-cavallo");
  renderMisuraWheel("ferro");
}
async function salvaFerroCavallo(togli){
  const cv = cavalloPerChiaveFerro(ferroCavalloKey);
  if(!cv) return;
  const btn = document.getElementById("ferro-cav-salva"); btn.disabled = true;
  try{
    let id = cv.id;
    if(!id){ ({ cavallo_cliente_id: id } = await DB.risolviCavalloPerIntervento(currentClienteId, cv)); }
    if(!id){ showToast("Non riuscito, riprova."); return; }
    const s = document.getElementById("ferro-misura-sistema").value;
    const campi = togli ? { ferro_sistema: null, ferro_numero: null } : { ferro_sistema: s, ferro_numero: MISURE_FERRO[s][misuraIndiceFerro] };
    const { error } = await DB.updateCavalloCliente(id, campi);
    if(error){ showToast("Errore: " + error.message); return; }
    closeModal("modal-ferro-cavallo");
    showToast(togli ? "Ferro standard tolto" : `Ferro standard di ${cv.nome}: ${siglaFerro(campi.ferro_sistema, campi.ferro_numero)}`);
    Object.assign(cv, campi, { id });
    if(document.getElementById("cavallo-pro-view")?.style.display === "block") renderCorpoCavalloPro();
    else await renderCavalliEditCliente();
  } finally { btn.disabled = false; }
}


export { aggiornaEtichetteNuovoCliente, apriCollegaStruttura, apriFerroCavallo, apriNuovoCliente, apriRazzaCavallo, badgeCollegamentoCliente, cavalliEditCache, confermaScollegaStruttura, creaCavalliDaTesto, createClienteMascalcia, inviaRichiestaStruttura, isManiscalcoUtente, messaggioErroreCollegaCliente, mostraLimiteClienti, nomiCavalliDaTesto, openClienteDetail, openEditCliente, renderCavalliEditCliente, rispondiInvitoStruttura, salvaFerroCavallo, salvaRazzaCavallo, scollegaStrutturaCorrente, toggleQrCliente };
