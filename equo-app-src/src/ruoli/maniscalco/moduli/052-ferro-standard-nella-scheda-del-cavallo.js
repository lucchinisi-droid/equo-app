// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { agNomeCavalloSicuro, giorniRichiamoSuggeriti, giorniTra, loadClientiMascalcia, prendiFerriScelti, prendiImportiScelti, prendiPagamentoScelto, richiamoPerFatto } from "./032-richiamo-prossimo-intervento-sempre-in-g.js";
import { isStruttura, isStrutturaCollegata } from "./033-clienti-a-cartelle-stile-telegram-cavall.js";
import { LAVORO_CAV, apriSchedaFerratura, descrFerraturaCavallo, tipoDaScheda } from "./035-ferratura-del-cavallo-scheda-libretto-fe.js";
import { iniziale, loadClienteInterventi } from "./037-scheda-cliente-a-box-scheda-del-cavallo.js";
import { renderProDeadlines } from "./040-home-pro-prossimi-appuntamenti-da-richia.js";
import { renderIncassi } from "./047-incassi-saldati-per-periodo-da-saldare-p.js";
import { chiediPrezzi, promemoriaPrezzoAttivo } from "./049-prezzo-mancante-promemoria-salvando-un-a.js";
import { MISURA_SISTEMA_LABEL, MISURE_FERRO, aggiornaGiaFatto, aggiungiGiorniIso, isoLocale, renderMisuraWheel } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { agNomeCavallo, renderAgendaSettimana } from "./053-agenda-settimanale-maniscalco.js";
import { formatDataBreve, testoRichiesta } from "./054-richieste-di-appuntamento-step-5d.js";
import { apriPropostaStruttura } from "./055-appuntamenti-con-strutture-equo-scuderia.js";
import { cercaClienteIntervento } from "./087-2-scelta-del-cliente-nell-appuntamento.js";
import { vistaCompleta } from "./097-versione-semplice-completa-dell-app-mani.js";
/* ---------- FERRO (standard nella scheda del cavallo) E QUANTITÀ (rotella 1-4) ---------- */
let ferroOverride = {};      // chiave cavallo → { s, n, origine } ferro diverso solo per questo appuntamento
let ferroEditKey = null;
let quantitaCorrente = 4, quantitaToccata = false, quantitaTimer = null, quantitaRenderAt = 0;
function siglaFerro(s, n){ return n ? "n. " + n + " " + (MISURA_SISTEMA_LABEL[s || "italiana"] || "") : ""; }
function ferroStd(c){ return c && c.ferro_numero ? { s: c.ferro_sistema || "italiana", n: String(c.ferro_numero) } : null; }
function ferroUguale(a, b){
  if(!a || !b) return !a && !b;
  const ia = MISURE_FERRO[a.s] ? MISURE_FERRO[a.s].indexOf(String(a.n)) : -1;
  const ib = MISURE_FERRO[b.s] ? MISURE_FERRO[b.s].indexOf(String(b.n)) : -1;
  return a.s === b.s ? String(a.n) === String(b.n) : (ia >= 0 && ia === ib);
}
function tipoConFerri(){ const t = document.getElementById("intervento-tipo").value; return t === "ferratura" || t === "mezza_ferratura"; }
// cavalli scelti nel modulo: chiavi di cavalliClienteCorrente, "__nuovo_cavallo__" o "" (nessun cavallo)
function cavalliSceltiIntervento(){
  if(interventoInModifica) return [document.getElementById("intervento-cavallo-select").value || ""];
  return [...document.querySelectorAll("#intervento-cavalli-multi .int-cav-chk:checked")].map(x => x.value);
}
function nomeCavalloKey(k){
  if(k === "__nuovo_cavallo__") return document.getElementById("intervento-nuovo-cavallo-nome").value.trim() || "Nuovo cavallo";
  return (cavalliClienteCorrente.find(c => c.key === k) || {}).nome || "Cavallo";
}
// sotto i cavalli scelti: il lavoro dalla scheda («Ferrato · 4 ferri n. 2 IT · standard») e «Modifica» che apre la scheda Ferratura
function renderFerroRighe(){
  const box = document.getElementById("intervento-scheda-righe");
  if(!box) return;
  const scelti = cavalliSceltiIntervento().filter(k => k && k !== "__nuovo_cavallo__");
  box.innerHTML = scelti.map(k => {
    const cv = cavalliClienteCorrente.find(c => c.key === k);
    if(!cv) return "";
    const tenuto = interventoInModifica && (interventoInModifica.stato === "fatto" || interventoInModifica.gruppo_id) && tipoOriginaleIntervento !== "altro";
    const dett = tenuto ? (TIPO_FERRATURA_LABELS[tipoOriginaleIntervento] || tipoOriginaleIntervento) + " · come registrato quel giorno" : descrFerraturaCavallo(cv);
    return `<div class="int-scheda-riga"><span class="av">${iniziale(cv.nome)}</span><span class="tx"><b>${escapeHtml(cv.nome)}</b>${escapeHtml(dett)}</span>${tenuto ? "" : `<button type="button" onclick="modificaFerraturaDaIntervento('${k}')">Modifica</button>`}</div>`;
  }).join("");
}
function modificaFerraturaDaIntervento(k){
  const cv = cavalliClienteCorrente.find(c => c.key === k);
  if(!cv) return;
  const clienteId = document.getElementById("intervento-cliente-select").value;
  apriSchedaFerratura(cv, clienteId && clienteId !== "__nuovo__" ? clienteId : null, () => renderFerroRighe());
}
function apriEditorFerro(k){
  ferroEditKey = k;
  const f = ferroOverride[k] || ferroStd(cavalliClienteCorrente.find(c => c.key === k)) || { s: "olandese", n: null };
  document.getElementById("intervento-misura-sistema").value = f.s || "olandese";
  const idx = f.n ? MISURE_FERRO[f.s || "olandese"].indexOf(String(f.n)) : -1;
  misuraIndiceCorrente = idx >= 0 ? idx : MISURA_INDICE_PARTENZA;
  document.getElementById("intervento-ferro-editor-tit").textContent = `Ferro per ${nomeCavalloKey(k)}` + (k === "__nuovo_cavallo__" ? "" : " · solo per questo appuntamento");
  document.getElementById("intervento-ferro-editor").style.display = "block";
  renderMisuraWheel("intervento");
}
function chiudiEditorFerro(usa){
  const k = ferroEditKey; ferroEditKey = null;
  document.getElementById("intervento-ferro-editor").style.display = "none";
  if(usa && k){
    const s = document.getElementById("intervento-misura-sistema").value;
    const nuovo = { s, n: MISURE_FERRO[s][misuraIndiceCorrente] };
    const std = ferroStd(cavalliClienteCorrente.find(c => c.key === k));
    if(ferroUguale(nuovo, std)) delete ferroOverride[k];
    else ferroOverride[k] = nuovo;
  }
  renderFerroRighe();
}
function ripristinaFerro(k){ delete ferroOverride[k]; renderFerroRighe(); }

function renderQuantitaWheel(){
  const w = document.getElementById("intervento-quantita-wheel");
  if(!w) return;
  w.innerHTML = [1, 2, 3, 4].map(v => `<div class="misura-wheel-item${v === quantitaCorrente ? " sel" : ""}" data-v="${v}" onclick="selezionaQuantita(${v}, true)">${v} ${v === 1 ? "ferro" : "ferri"}</div>`).join("");
  quantitaRenderAt = Date.now();
  requestAnimationFrame(() => { w.scrollTop = (quantitaCorrente - 1) * 44; });
  w.onscroll = () => {
    clearTimeout(quantitaTimer);
    quantitaTimer = setTimeout(() => {
      const v = Math.max(1, Math.min(4, Math.round(w.scrollTop / 44) + 1));
      if(Date.now() - quantitaRenderAt > 400) quantitaToccata = true;
      selezionaQuantita(v, false);
    }, 80);
  };
}
function selezionaQuantita(v, scroll){
  quantitaCorrente = v;
  const w = document.getElementById("intervento-quantita-wheel");
  w.querySelectorAll(".misura-wheel-item").forEach(el => el.classList.toggle("sel", Number(el.dataset.v) === v));
  if(scroll){ quantitaToccata = true; w.scrollTo({ top: (v - 1) * 44, behavior: "smooth" }); }
}
function aggiornaQuantitaPer(){
  const n = cavalliSceltiIntervento().filter(Boolean).length;
  document.getElementById("intervento-quantita-per").textContent = n > 1 ? "· per ogni cavallo" : "";
}

// importo e pagamento nel modulo solo per correggere un intervento già fatto
function aggiornaIncassoForm(){
  const g = document.getElementById("intervento-incasso-group");
  if(g) g.style.display = interventoInModifica && interventoInModifica.stato === "fatto" ? "block" : "none";
}

async function openInterventoModal(clienteId, intervento, preset){
  interventoInModifica = intervento || null;
  interventoPreset = intervento ? null : (preset || null);
  const inModifica = !!interventoInModifica;
  const daConfermare = inModifica && interventoInModifica.stato === "richiesto";
  document.getElementById("intervento-modal-title").textContent = daConfermare ? "Conferma richiesta" : inModifica ? "Modifica appuntamento" : "Nuovo appuntamento";
  document.getElementById("intervento-save-btn").textContent = daConfermare ? "Conferma appuntamento" : inModifica ? "Salva modifiche" : "Salva appuntamento";
  document.getElementById("intervento-delete-btn").style.display = inModifica ? "block" : "none";

  const select = document.getElementById("intervento-cliente-select");
  const opzCli = lista => lista.slice().sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" }))
    .map(c => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("");
  // i clienti archiviati non si propongono (salvo quello dell'intervento che si sta modificando)
  const clientiScelta = clientiMascalcia.filter(c => !c.archiviato_il || c.id === clienteId || (inModifica && c.id === inModifica.cliente_mascalcia_id));
  const propr = clientiScelta.filter(c => !isStruttura(c)), strutt = clientiScelta.filter(isStruttura);
  const opzioniClienti = strutt.length
    ? `<optgroup label="Proprietari">${opzCli(propr)}</optgroup><optgroup label="Scuderie e centri ippici">${opzCli(strutt)}</optgroup>`
    : opzCli(propr);
  // nessun cliente scelto in partenza: prima si preselezionava il primo della lista e, se era una scuderia
  // collegata, il modulo saltava subito alla proposta alla scuderia (impossibile scegliere un altro cliente)
  const scegli = !inModifica && !clienteId && clientiScelta.length ? '<option value="" disabled>Scegli il cliente…</option>' : "";
  select.innerHTML = scegli + (inModifica ? "" : '<option value="__nuovo__">+ Nuovo cliente</option>') + opzioniClienti;
  select.disabled = inModifica;
  cercaClienteIntervento();
  if(inModifica) select.value = interventoInModifica.cliente_mascalcia_id;
  else if(clienteId) select.value = clienteId;
  else if(clientiMascalcia.length === 0) select.value = "__nuovo__";
  else select.value = "";

  const i = interventoInModifica || preset || {};
  document.getElementById("intervento-nuovo-cliente-nome").value = "";
  document.getElementById("intervento-nuovo-cliente-tipo").value = "proprietario";
  document.getElementById("intervento-nuovo-cavallo-nome").value = "";
  document.getElementById("intervento-nuovo-cavallo-microchip").value = "";
  // «Mezza ferratura» non è più una scelta dell'appuntamento: la decide la scheda del cavallo
  tipoOriginaleIntervento = interventoInModifica ? interventoInModifica.tipo_ferratura : null;
  document.getElementById("intervento-tipo").value = i.tipo_ferratura || "ferratura";
  document.getElementById("intervento-tipo-altro").value = i.tipo_altro || "";
  // lavoro: come da scheda; un «Altro» già salvato si riapre come straordinario (Completa)
  intModo = "scheda"; intStr = { preset: null, zoccolo: null };
  if(interventoInModifica && interventoInModifica.tipo_ferratura === "altro" && vistaCompleta()){
    const l = leggiStraordinario(interventoInModifica.tipo_altro);
    intModo = "straordinario"; intStr = { preset: l.preset, zoccolo: l.zoccolo };
    document.getElementById("intervento-tipo-altro").value = l.preset === "altro" ? l.libero : "";
  }
  if(!interventoInModifica && preset && preset.modo === "straordinario" && vistaCompleta()) intModo = "straordinario";
  nuovoCavalloLavoro("completa");
  // ferri: quantità salvata o proposta (4 ferratura, 2 mezza); il ferro arriva dalla scheda del cavallo
  ferroOverride = {}; ferroEditKey = null;
  document.getElementById("intervento-ferro-editor").style.display = "none";
  const q = Number(i.quantita_ferri);
  quantitaToccata = q >= 1 && q <= 4;
  quantitaCorrente = quantitaToccata ? q : ((i.tipo_ferratura || "ferratura") === "mezza_ferratura" ? 2 : 4);
  quantitaDaScheda = !quantitaToccata && !interventoInModifica;
  document.getElementById("intervento-ferri-nuovi").checked = interventoInModifica ? interventoInModifica.ferri_nuovi !== false : true;
  document.getElementById("intervento-data").value = i.data_intervento || isoLocale(new Date());
  document.getElementById("intervento-ora").value = i.ora ? String(i.ora).slice(0, 5) : "";
  aggiornaQuando();
  document.getElementById("intervento-importo").value = interventoInModifica?.importo ?? "";
  document.getElementById("intervento-pagamento").value = interventoInModifica?.stato_pagamento || "da_saldare";
  aggiornaIncassoForm();
  document.getElementById("intervento-note").value = i.note || "";
  // conferma di una richiesta: la data del cliente è solo una proposta, il maniscalco può cambiarla
  const boxRich = document.getElementById("intervento-richiesta-box");
  if(boxRich){
    const rich = daConfermare && !interventoInModifica.gruppo_id;
    boxRich.style.display = rich ? "block" : "none";
    if(rich){
      const dOrig = interventoInModifica.data_intervento, oOrig = interventoInModifica.ora ? String(interventoInModifica.ora).slice(0, 5) : "";
      const aggiorna = () => {
        const d = document.getElementById("intervento-data").value, o = document.getElementById("intervento-ora").value;
        const cambiata = d !== dOrig || (o || "") !== oOrig;
        document.getElementById("modal-add-intervento").classList.toggle("int-cambiata", cambiata);
        boxRich.innerHTML = cambiata
          ? `<b>📅 Nuova data: ${formatDataBreve(d)}${o ? " ore " + o : ""}</b>Il cliente aveva chiesto ${formatDataBreve(dOrig)}${oOrig ? " ore " + oOrig : ""}: riceverà in chat la data che salvi.`
          : `<b>📅 Il cliente chiede ${formatDataBreve(dOrig)}${oOrig ? " ore " + oOrig : ""}</b>Puoi cambiare data e ora più in basso: il cliente riceve in chat la data che salvi.`;
      };
      document.getElementById("intervento-data").oninput = aggiorna;
      document.getElementById("intervento-ora").oninput = aggiorna;
      aggiorna();
    } else {
      document.getElementById("modal-add-intervento").classList.remove("int-cambiata");
      document.getElementById("intervento-data").oninput = null;
      document.getElementById("intervento-ora").oninput = null;
    }
  }
  document.getElementById("intervento-error").style.display = "none";

  document.getElementById("intervento-gia-fatto").checked = false; aggiornaGiaFatto();
  openModal("modal-add-intervento");
  await onInterventoClienteChange();
  toggleInterventoTipoFields();
}

async function onInterventoClienteChange(){
  const clienteId = document.getElementById("intervento-cliente-select").value;
  if(!interventoInModifica && clienteId !== "__nuovo__" && isStrutturaCollegata(clienteId)){
    const preset = { ...(interventoPreset || {}),
      tipo_ferratura: document.getElementById("intervento-tipo").value,
      data_intervento: document.getElementById("intervento-data").value,
      ora: document.getElementById("intervento-ora").value };
    closeModal("modal-add-intervento");
    return apriPropostaStruttura(clienteId, preset);
  }
  const isNuovo = clienteId === "__nuovo__";
  document.getElementById("intervento-nuovo-cliente-group").style.display = isNuovo ? "flex" : "none";
  const sel = document.getElementById("intervento-cavallo-select");
  const multi = document.getElementById("intervento-cavalli-multi");
  const inMod = !!interventoInModifica;
  sel.style.display = inMod ? "" : "none";
  multi.style.display = inMod ? "none" : "block";
  document.getElementById("intervento-cavallo-label").textContent = inMod ? "Cavallo" : "Cavalli";
  ferroOverride = {};
  if(!clienteId){
    cavalliClienteCorrente = [];
    sel.innerHTML = '<option value="">Scegli prima il cliente</option>';
    sel.value = "";
    multi.innerHTML = '<div class="muted" style="font-size:13px;padding:9px 0">Scegli prima il cliente</div>';
    toggleInterventoNuovoCavallo();
    return;
  }
  sel.innerHTML = '<option value="">Caricamento…</option>';
  multi.innerHTML = '<div class="muted" style="font-size:13px;padding:9px 0">Caricamento…</div>';
  cavalliClienteCorrente = isNuovo ? [] : await DB.listCavalliCliente(clienteId);
  const opzioni = cavalliClienteCorrente.map(c =>
    `<option value="${c.key}">${escapeHtml(c.nome)}${c.tipo === "equo" ? " · su Equo" : ""}</option>`).join("");
  sel.innerHTML = (cavalliClienteCorrente.length ? "" : '<option value="">— nessun cavallo —</option>') + opzioni + '<option value="__nuovo_cavallo__">+ Aggiungi cavallo</option>';
  // preselezione: cavallo dell'intervento in modifica / del preset, altrimenti il primo (se c'è), altrimenti "aggiungi" per un cliente nuovo
  let valore = "";
  const rif = interventoInModifica || interventoPreset;
  const mRif = rif && (rif.cavallo_cliente_id || rif.horse_id) ? cavalliClienteCorrente.find(c =>
      (rif.cavallo_cliente_id && c.id === rif.cavallo_cliente_id) ||
      (rif.horse_id && c.horse_id === rif.horse_id)) : null;
  if(inMod || mRif){
    if(mRif) valore = mRif.key;
  } else if(isNuovo || !cavalliClienteCorrente.length){
    valore = "__nuovo_cavallo__";
  } else if(cavalliClienteCorrente.length === 1){
    valore = cavalliClienteCorrente[0].key;
  }
  sel.value = valore;
  const presetCavalli = new Set([valore].concat(interventoPreset?.cavalli || []).filter(Boolean));
  multi.innerHTML = cavalliClienteCorrente.map(c =>
    `<label class="int-cav"><input type="checkbox" class="int-cav-chk" value="${c.key}"${presetCavalli.has(c.key) ? " checked" : ""} onchange="onCavalliMultiChange()"> <span>${escapeHtml(c.nome)}${c.tipo === "equo" ? " <small>· su Equo</small>" : ""}${c.presso ? " <small>· 📍 " + escapeHtml(c.presso) + "</small>" : ""}</span></label>`).join("")
    + `<label class="int-cav nuovo"><input type="checkbox" class="int-cav-chk" value="__nuovo_cavallo__"${presetCavalli.has("__nuovo_cavallo__") ? " checked" : ""} onchange="onCavalliMultiChange()"> <span>+ Aggiungi cavallo</span></label>`;
  // in modifica: il ferro salvato nell'appuntamento, se diverso dallo standard, resta «usato in questo appuntamento»
  if(inMod && mRif && interventoInModifica.numero_ferro){
    const usato = { s: interventoInModifica.misura_sistema || "italiana", n: String(interventoInModifica.numero_ferro), origine: "intervento" };
    if(!ferroUguale(usato, ferroStd(mRif))) ferroOverride[mRif.key] = usato;
  }
  toggleInterventoNuovoCavallo();
}
// scelto dalla ricerca (cavallo · cliente): lo spunta / lo seleziona
function selezionaCavalloIntervento(nome){
  const k = cercaNorm(nome);
  const c = cavalliClienteCorrente.find(x => cercaNorm(x.nome) === k);
  if(!c) return;
  const sel = document.getElementById("intervento-cavallo-select");
  if(sel) sel.value = c.key;
  document.querySelectorAll("#intervento-cavalli-multi .int-cav-chk").forEach(x => { x.checked = x.value === c.key; });
  toggleInterventoNuovoCavallo();
}
let tipoOriginaleIntervento = null, quantitaDaScheda = false;
let intModo = "scheda", intStr = { preset: null, zoccolo: null }, nuovoCavLavoro = "completa";
function cavalloMezza(k){ const c = cavalliClienteCorrente.find(x => x.key === k); return !!(c && c.ferratura_tipo === "mezza"); }
function quantitaPredefinita(){
  const sc = cavalliSceltiIntervento().filter(k => k && k !== "__nuovo_cavallo__");
  return sc.length && sc.every(cavalloMezza) ? 2 : 4;
}
function intConCavalli(){ return cavalliSceltiIntervento().some(Boolean); }
// il tipo si sceglie a mano solo senza cavallo (o correggendo un «Altro» nella versione Semplice)
function intTipoManuale(){
  if(!intConCavalli()) return true;
  return !!(interventoInModifica && tipoOriginaleIntervento === "altro" && !vistaCompleta());
}
function intStraordinario(){ return vistaCompleta() && intConCavalli() && !intTipoManuale() && intModo === "straordinario"; }
// tipo salvato per ogni cavallo: dalla sua scheda (Ferrato / Mezza / Pareggio). Un lavoro già fatto o con la scuderia resta com'era.
function tipoPerCavallo(_tipo, k){
  if(intTipoManuale()) return document.getElementById("intervento-tipo").value;
  if(intStraordinario()) return "altro";
  if(interventoInModifica && (interventoInModifica.stato === "fatto" || interventoInModifica.gruppo_id) && tipoOriginaleIntervento && tipoOriginaleIntervento !== "altro") return tipoOriginaleIntervento;
  if(k === "__nuovo_cavallo__") return LAVORO_CAV[nuovoCavLavoro].tipo;
  const cv = cavalliClienteCorrente.find(c => c.key === k);
  return cv ? tipoDaScheda(cv) : document.getElementById("intervento-tipo").value;
}
function onCavalliMultiChange(){ toggleInterventoNuovoCavallo(); }
function nuovoCavalloLavoro(v){
  nuovoCavLavoro = LAVORO_CAV[v] ? v : "completa";
  document.querySelectorAll("#intervento-nuovo-cavallo-lavoro button").forEach(b => b.classList.toggle("on", b.dataset.v === nuovoCavLavoro));
}

function toggleInterventoNuovoCavallo(){
  const scelti = cavalliSceltiIntervento();
  const nuovo = scelti.includes("__nuovo_cavallo__");
  document.getElementById("intervento-nuovo-cavallo-group").style.display = nuovo ? "flex" : "none";
  document.getElementById("intervento-nuovo-cavallo-lavoro-group").style.display = nuovo ? "flex" : "none";
  renderFerroRighe();
  toggleInterventoTipoFields();
}
// compatibilità con eventuali vecchie chiamate
function toggleInterventoNuovoCliente(){ onInterventoClienteChange(); }

/* Lavori STRAORDINARI (solo Completa): salvati come «Altro» con la descrizione; non spostano il richiamo e non cambiano la scheda */
const STR_PRESET = [
  { k: "perso", t: "Ferro perso / rimesso", zoccolo: true, ic: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>' },
  { k: "tolti", t: "Ferri tolti (lastre, riposo)", ic: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>' },
  { k: "pareggio", t: "Pareggio su cavallo ferrato", ic: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>' },
  { k: "corr", t: "Correttivo provvisorio", ic: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14 21 3"/>' },
  { k: "urg", t: "Urgenza / con il veterinario", ic: '<path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.2 16.2l2.8 2.8M2 12h4M18 12h4"/><circle cx="12" cy="12" r="3"/>' },
  { k: "altro", t: "Altro", ic: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>' }
];
const STR_ZOCCOLI = ["Anteriore sx", "Anteriore dx", "Posteriore sx", "Posteriore dx"];
function sceltaModoIntervento(m){
  intModo = m === "straordinario" ? "straordinario" : "scheda";
  toggleInterventoTipoFields();
}
function sceltaStraordinario(k){ intStr.preset = k; if(k !== "perso") intStr.zoccolo = null; toggleInterventoTipoFields(); }
function sceltaZoccolo(z){ intStr.zoccolo = intStr.zoccolo === z ? null : z; toggleInterventoTipoFields(); }
function testoStraordinario(){
  const p = STR_PRESET.find(x => x.k === intStr.preset);
  if(!p) return null;
  if(p.k === "altro") return document.getElementById("intervento-tipo-altro").value.trim() || null;
  return p.t + (p.zoccolo && intStr.zoccolo ? " · " + intStr.zoccolo.toLowerCase() : "");
}
// da un «Altro» già salvato ricava preset e zoccolo (per la modifica)
function leggiStraordinario(testo){
  const t = String(testo || "");
  const p = STR_PRESET.find(x => x.k !== "altro" && t.startsWith(x.t));
  if(!p) return { preset: "altro", zoccolo: null, libero: t };
  const z = STR_ZOCCOLI.find(z => t.toLowerCase().endsWith(z.toLowerCase()));
  return { preset: p.k, zoccolo: z || null, libero: "" };
}

function toggleInterventoTipoFields(){
  const manuale = intTipoManuale();
  const str = intStraordinario();
  const conCav = intConCavalli();
  // ferro, quantità e ferri nuovi non si chiedono più nell'appuntamento (scheda del cavallo / riquadro del «Fatto»)
  ["intervento-ferro-group", "intervento-quantita-group", "intervento-ferri-nuovi-row"].forEach(id => { const el = document.getElementById(id); if(el) el.style.display = "none"; });
  document.getElementById("intervento-tipo-group").style.display = manuale ? "flex" : "none";
  const tipo = document.getElementById("intervento-tipo").value;
  const modoVis = vistaCompleta() && conCav && !manuale;
  document.getElementById("intervento-modo-group").style.display = modoVis ? "flex" : "none";
  document.querySelectorAll("#intervento-modo button").forEach(b => b.classList.toggle("on", b.dataset.v === (str ? "straordinario" : "scheda")));
  const sg = document.getElementById("intervento-str-group");
  sg.style.display = str ? "flex" : "none";
  if(str){
    document.getElementById("intervento-str-preset").innerHTML = STR_PRESET.map(p =>
      `<button type="button" class="${intStr.preset === p.k ? "on" : ""}" onclick="sceltaStraordinario('${p.k}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${p.ic}</svg><span>${p.t}</span></button>`).join("");
    const conZ = STR_PRESET.find(p => p.k === intStr.preset)?.zoccolo;
    document.getElementById("intervento-str-zoccoli-box").style.display = conZ ? "block" : "none";
    document.getElementById("intervento-str-zoccoli").innerHTML = STR_ZOCCOLI.map(z =>
      `<button type="button" class="${intStr.zoccolo === z ? "on" : ""}" onclick="sceltaZoccolo('${z}')">${z}</button>`).join("");
  }
  document.getElementById("intervento-tipo-altro-group").style.display = (manuale && tipo === "altro") || (str && intStr.preset === "altro") ? "flex" : "none";
  renderFerroRighe();
}
// Quando: Oggi / Domani / Scegli giorno
function quandoIntervento(q){
  const inp = document.getElementById("intervento-data");
  if(q === "x"){ try{ inp.showPicker ? inp.showPicker() : inp.focus(); }catch(e){ inp.focus(); } }
  else { const d = new Date(); d.setDate(d.getDate() + q); inp.value = isoLocale(d); aggiornaGiaFatto(); }
  aggiornaQuando(q === "x");
}
function aggiornaQuando(forzaScegli){
  const v = document.getElementById("intervento-data").value;
  const oggi = isoLocale(new Date()), dom = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return isoLocale(d); })();
  const q = forzaScegli && v !== oggi && v !== dom ? "x" : v === oggi ? "0" : v === dom ? "1" : "x";
  document.querySelectorAll("#intervento-quando button").forEach(b => b.classList.toggle("on", b.dataset.q === q));
}

/* Pop-up Sì / No (stile Equo) — restituisce true/false */
let sinoResolve = null;
function chiediSiNo(titolo, testo){
  return new Promise(resolve => {
    sinoResolve = resolve;
    document.getElementById("sino-tit").textContent = titolo;
    document.getElementById("sino-testo").textContent = testo || "";
    document.getElementById("eq-pop-sino").classList.add("attivo");
  });
}
function rispondiSiNo(si){
  document.getElementById("eq-pop-sino").classList.remove("attivo");
  const r = sinoResolve; sinoResolve = null;
  if(r) r(!!si);
}

async function salvaInterventoMascalcia(){
  const errBox = document.getElementById("intervento-error");
  const errore = msg => { errBox.textContent = msg; errBox.style.display = "block"; };
  errBox.style.display = "none";
  const saveBtn = document.getElementById("intervento-save-btn");

  let cliente_mascalcia_id = document.getElementById("intervento-cliente-select").value;
  if(!cliente_mascalcia_id) return errore("Scegli il cliente (oppure \"+ Nuovo cliente\").");
  let scelti = cavalliSceltiIntervento();
  if(!scelti.length) scelti = [""];                 // appuntamento senza cavallo indicato
  if(scelti.length > 1) scelti = scelti.filter(Boolean);
  // lavoro: dalla scheda di ogni cavallo (Ferrato / Mezza / Pareggio); straordinario = «Altro» con la descrizione
  const straord = intStraordinario();
  if(straord && !intStr.preset) return errore("Scegli il lavoro straordinario.");
  const tipo_ferratura = tipoPerCavallo(null, scelti.find(Boolean) || "");
  const tipo_altro = tipo_ferratura === "altro"
    ? (straord ? testoStraordinario() : (document.getElementById("intervento-tipo-altro").value.trim() || null)) : null;
  const conFerri = t => t === "ferratura" || t === "mezza_ferratura";
  const data_intervento = document.getElementById("intervento-data").value;
  const ora = document.getElementById("intervento-ora").value || null;
  // importo/pagamento dal modulo solo modificando un intervento già fatto; altrimenti li chiede il riquadro del «Fatto»
  const conIncassoForm = !!(interventoInModifica && interventoInModifica.stato === "fatto");
  const importoRaw = conIncassoForm ? document.getElementById("intervento-importo").value : "";
  let importoForm = importoRaw === "" ? (interventoInModifica && !conIncassoForm ? interventoInModifica.importo ?? null : null) : Number(importoRaw);
  let statoPagamento = conIncassoForm ? document.getElementById("intervento-pagamento").value : (interventoInModifica?.stato_pagamento || "da_saldare");
  const note = document.getElementById("intervento-note").value.trim();

  if(!cliente_mascalcia_id || !data_intervento) return errore("Seleziona cliente e data.");
  if(tipo_ferratura === "altro" && !tipo_altro) return errore(straord ? "Scrivi che lavoro hai fatto." : "Specifica il tipo di intervento.");
  const nuovoCavalloNome = document.getElementById("intervento-nuovo-cavallo-nome").value.trim();
  const nuovoCavalloChip = document.getElementById("intervento-nuovo-cavallo-microchip").value.trim();
  if(scelti.includes("__nuovo_cavallo__") && !nuovoCavalloNome) return errore("Inserisci il nome del cavallo.");

  // ferro di ogni cavallo: quello della scheda (un lavoro già fatto conserva il ferro di quel giorno)
  const ferri = {};
  for(const k of scelti){
    if(!k) continue;
    if(interventoInModifica && interventoInModifica.stato === "fatto" && interventoInModifica.numero_ferro){
      ferri[k] = { s: interventoInModifica.misura_sistema || "italiana", n: String(interventoInModifica.numero_ferro) };
      continue;
    }
    const std = ferroStd(cavalliClienteCorrente.find(c => c.key === k));
    if(std) ferri[k] = { s: std.s, n: std.n };
  }

  saveBtn.disabled = true;
  let clienteCreatoOra = false;
  let salvati = 0;
  try {
    // cliente nuovo
    if(cliente_mascalcia_id === "__nuovo__"){
      const nome = document.getElementById("intervento-nuovo-cliente-nome").value.trim();
      if(!nome) return errore("Inserisci il nome del cliente.");
      const tipo_cliente = document.getElementById("intervento-nuovo-cliente-tipo").value;
      const { error: clienteError, data: nuovoCliente } = await DB.insertClienteMascalcia({ nome, nome_cavallo: nuovoCavalloNome, telefono: "", note: "", tipo_cliente });
      if(clienteError || !nuovoCliente) return errore("Errore nel creare il cliente: " + (clienteError?.message || ""));
      cliente_mascalcia_id = nuovoCliente.id;
      clienteCreatoOra = true;
    }

    // cavalli: nuovo / esistenti (manuali o "su Equo")
    const righe = [];
    for(const k of scelti){
      let cavallo_cliente_id = null, horse_id = null, nome = "";
      if(k === "__nuovo_cavallo__"){
        const { error: cvErr, data: cv } = await DB.insertCavalloCliente({ cliente_mascalcia_id, nome: nuovoCavalloNome, microchip: nuovoCavalloChip || null, ferratura_tipo: nuovoCavLavoro });
        if(cvErr || !cv) return errore("Errore nel salvare il cavallo: " + (cvErr?.message || ""));
        cavallo_cliente_id = cv.id; nome = nuovoCavalloNome;
      } else if(k){
        const scelto = cavalliClienteCorrente.find(c => c.key === k);
        ({ cavallo_cliente_id, horse_id } = await DB.risolviCavalloPerIntervento(cliente_mascalcia_id, scelto));
        nome = scelto?.nome || "";
      }
      const f = ferri[k];
      righe.push({ key: k, cavallo_cliente_id, horse_id, nome, tipo: tipoPerCavallo(null, k), misura_sistema: f ? f.s : null, numero_ferro: f ? f.n : null });
    }
    const nomiCavalli = righe.map(r => r.nome).filter(Boolean).join(", ");

    // stato: data/ora nel futuro = programmato; altrimenti fatto (in modifica non si "chiude" da solo un programmato)
    // nuovo appuntamento: passato = fatto, oggi = da fare (salvo «L'ho già fatto»), futuro = da fare
    const oggiIso = isoLocale(new Date());
    const giaFatto = !!document.getElementById("intervento-gia-fatto")?.checked;
    const futuro = interventoInModifica
      ? new Date(data_intervento + "T" + (ora || "00:00")).getTime() > Date.now()
      : (data_intervento > oggiIso || (data_intervento === oggiIso && !giaFatto));
    const statoPrec = interventoInModifica ? (interventoInModifica.stato || "fatto") : null;
    const diGruppo = !!(interventoInModifica && interventoInModifica.gruppo_id); // appuntamento con scuderia Equo Scuderia
    const precInfo = interventoInModifica ? { data: interventoInModifica.data_intervento, ora: interventoInModifica.ora ? String(interventoInModifica.ora).slice(0, 5) : "", cliente: interventoInModifica.cliente_mascalcia_id,
      tipo_ferratura: interventoInModifica.tipo_ferratura, tipo_altro: interventoInModifica.tipo_altro || "" } : null;
    const eraRichiesta = !diGruppo && STATI_NON_CONFERMATI.includes(statoPrec);
    // una richiesta confermata per oggi o per il futuro diventa "programmato", mai "fatto" da sola
    // (appuntamenti con scuderia: lo stato cambia solo con i tasti; se cambi data/ora la scuderia deve riconfermare)
    const stato = diGruppo ? statoPrec
      : eraRichiesta ? (data_intervento >= isoLocale(new Date()) ? "programmato" : "fatto")
      : futuro ? "programmato" : (statoPrec || "fatto");
    const diventaFatto = stato === "fatto" && statoPrec !== "fatto";

    // diventa FATTO ora → un solo riquadro per tutti i cavalli: giorni del richiamo, importo di ogni cavallo, pagamento
    let scadenzaComune = null, importi = null, ferriScelti = null;
    if(diventaFatto){
      const r0 = righe[0] || {};
      const rFerri = righe.filter(r => conFerri(r.tipo));
      const ps = await richiamoPerFatto({ id: interventoInModifica?.id, cliente_mascalcia_id, tipo_ferratura, tipo_altro, data_intervento,
        cavallo_cliente_id: r0.cavallo_cliente_id, horse_id: r0.horse_id, cavallo: nomiCavalli,
        stato_pagamento: statoPagamento, importo: importoForm,
        ferri: rFerri.length ? { q: rFerri.every(r => r.tipo === "mezza_ferratura") ? 2 : 4, nome: rFerri.length === 1 ? rFerri[0].nome : null, nuovi: interventoInModifica?.ferri_nuovi } : null,
        cavalli: righe.map(r => ({ nome: r.nome || "Intervento", cavallo_cliente_id: r.cavallo_cliente_id, horse_id: r.horse_id, importo: interventoInModifica ? interventoInModifica.importo : null })) });
      if(TIPO_FERRATURA_INTERVALLI[tipo_ferratura]) scadenzaComune = ps;
      statoPagamento = prendiPagamentoScelto() || statoPagamento;
      importi = prendiImportiScelti();
      ferriScelti = prendiFerriScelti();
    }

    // nuovo appuntamento da fare senza prezzo → promemoria (serve al previsionale degli incassi)
    if(!interventoInModifica && stato === "programmato" && importoForm == null && !importi && tipo_ferratura !== "altro" && promemoriaPrezzoAttivo()){
      if(!incTutti.length) { try { incTutti = await DB.listInterventiMascalciaTutti(); } catch(e){} }
      const nomeCli = clientiMascalcia.find(c => c.id === cliente_mascalcia_id)?.nome || "";
      importi = await chiediPrezzi(righe.map(r => ({ nome: r.nome || nomeCli, tipo: r.tipo, clienteId: cliente_mascalcia_id, cavalloId: r.cavallo_cliente_id })));
    }

    // stesso cliente, stesso cavallo, stesso giorno e stesso tipo: probabilmente salvato due volte
    if(!interventoInModifica){
      const stessoGiorno = await DB.listInterventiPeriodo(data_intervento, data_intervento).catch(() => []);
      const doppi = righe.map(r => (stessoGiorno || []).find(i => i.cliente_mascalcia_id === cliente_mascalcia_id && i.tipo_ferratura === tipo_ferratura
        && ((r.cavallo_cliente_id && i.cavallo_cliente_id === r.cavallo_cliente_id) || (r.horse_id && i.horse_id === r.horse_id) || (!r.cavallo_cliente_id && !r.horse_id && !i.cavallo_cliente_id && !i.horse_id)))).filter(Boolean);
      if(doppi.length){
        const cv = doppi.map(d => d.cavalli_clienti_mascalcia?.nome || agNomeCavallo(d) || "questo cavallo").join(", ");
        if(!confirm(`C'è già ${TIPO_MAN_LABEL[tipo_ferratura] ? TIPO_MAN_LABEL[tipo_ferratura].toLowerCase() : "un intervento"} per ${cv} il ${formatDataBreve(data_intervento)}.\n\nVuoi salvare comunque?`))
          return errore("Non salvato: c'era già lo stesso appuntamento.");
      }
    }

    for(let n = 0; n < righe.length; n++){
      const r = righe[n];
      // RICHIAMO in giorni: diventa fatto → giorni del riquadro; già fatto → si mantiene l'intervallo; programmato → proposta silenziosa
      let prossima_scadenza = null;
      if(TIPO_FERRATURA_INTERVALLI[r.tipo]){
        const eraFatto = interventoInModifica && statoPrec === "fatto" && interventoInModifica.prossima_scadenza && interventoInModifica.tipo_ferratura === r.tipo;
        if(eraFatto) prossima_scadenza = aggiungiGiorniIso(data_intervento, giorniTra(interventoInModifica.data_intervento, interventoInModifica.prossima_scadenza));
        else if(diventaFatto) prossima_scadenza = scadenzaComune;
        else if(stato === "fatto") prossima_scadenza = interventoInModifica?.prossima_scadenza || null;
        else {
          const sg = await giorniRichiamoSuggeriti(r.tipo, r.cavallo_cliente_id, r.horse_id, interventoInModifica?.id);
          prossima_scadenza = sg.giorni ? aggiungiGiorniIso(data_intervento, sg.giorni) : null;
        }
      }
      const importo = importi ? (importi[n] ?? null) : importoForm;
      const tipoRiga = r.tipo;
      const fr = conFerri(tipoRiga);
      // ferri: 4 o 2 dalla scheda; nella Completa il «Fatto» dice se erano nuovi (e quanti) o una rimessa
      const qScheda = tipoRiga === "mezza_ferratura" ? 2 : 4;
      const quantitaRiga = !fr ? null : ferriScelti && ferriScelti.nuovi ? Math.max(1, Math.min(4, Number(ferriScelti.n) || qScheda))
        : (interventoInModifica && Number(interventoInModifica.quantita_ferri) >= 1 && interventoInModifica.tipo_ferratura === tipoRiga ? Number(interventoInModifica.quantita_ferri) : qScheda);
      const ferri_nuovi = !fr ? null : ferriScelti ? ferriScelti.nuovi : (interventoInModifica ? interventoInModifica.ferri_nuovi ?? null : null);
      const payload = { cavallo_cliente_id: r.cavallo_cliente_id, horse_id: r.horse_id, tipo_ferratura: tipoRiga, tipo_altro: tipoRiga === "altro" ? tipo_altro : null,
        misura_sistema: fr ? r.misura_sistema : null, numero_ferro: fr ? r.numero_ferro : null, quantita_ferri: quantitaRiga, ferri_nuovi,
        data_intervento, ora, stato, prossima_scadenza, importo, stato_pagamento: statoPagamento, note };
      const { error } = interventoInModifica
        ? await DB.updateInterventoMascalcia(interventoInModifica.id, payload)
        : await DB.insertInterventoMascalcia({ cliente_mascalcia_id, ...payload });
      if(error) return errore("Errore: " + error.message + (salvati ? ` (salvati ${salvati} su ${righe.length})` : ""));
      salvati++;
    }

    closeModal("modal-add-intervento");
    const nomeCv = nomiCavalli;
    if(eraRichiesta){
      const spostata = precInfo && (precInfo.data !== data_intervento || (precInfo.ora || "") !== (ora || ""));
      await DB.insertMessaggioMascalcia({ cliente_mascalcia_id, tipo: "testo",
        testo: spostata
          ? testoRichiesta("✅ Appuntamento confermato con nuova data", { tipo_ferratura, tipo_altro, data_intervento, ora }, nomeCv).replace(/\.$/, "") + ` (avevi chiesto ${formatDataBreve(precInfo.data)}${precInfo.ora ? " ore " + precInfo.ora : ""}).`
          : testoRichiesta("✅ Appuntamento confermato", { tipo_ferratura, tipo_altro, data_intervento, ora }, nomeCv) });
      showToast("Richiesta confermata: il cliente riceve un messaggio in chat");
    } else if(precInfo && diGruppo && ["programmato","richiesto","proposto"].includes(statoPrec)
        && (precInfo.data !== data_intervento || (precInfo.ora || "") !== (ora || "") || servizioCambiato(precInfo, { tipo_ferratura, tipo_altro }))){
      showToast("Appuntamento modificato: la scuderia riceve l'avviso e deve riconfermarlo");
    } else if(precInfo && !diGruppo && statoPrec === "programmato" && stato === "programmato"
        && (precInfo.data !== data_intervento || (precInfo.ora || "") !== (ora || "") || precInfo.cliente !== cliente_mascalcia_id || servizioCambiato(precInfo, { tipo_ferratura, tipo_altro }))){
      // 1. appuntamento già confermato cambiato (data, ora o servizio): il cliente lo deve sapere
      await avvisaClienteAppuntamento("modificato", { cliente_mascalcia_id, tipo_ferratura, tipo_altro, data_intervento, ora, cavallo: nomeCv }, precInfo);
      showToast(clienteCollegatoEquo(cliente_mascalcia_id) ? "Appuntamento modificato: il cliente riceve l'avviso e lo conferma con «Ok, ho visto»" : "Appuntamento modificato: avviso salvato nella chat del cliente");
    } else if(!interventoInModifica && stato === "programmato" && clienteCollegatoEquo(cliente_mascalcia_id)){
      // nuovo appuntamento fissato dal maniscalco: il cliente su Equo riceve un solo messaggio in chat (anche con più cavalli)
      await avvisaClienteAppuntamento("nuovo", { cliente_mascalcia_id, tipo_ferratura, tipo_altro, data_intervento, ora, cavallo: nomeCv });
      showToast(righe.length > 1 ? `${righe.length} appuntamenti salvati: il cliente riceve l'avviso in chat` : "Appuntamento salvato: il cliente riceve l'avviso in chat");
    } else {
      showToast(interventoInModifica ? "Appuntamento aggiornato"
        : righe.length > 1 ? `${righe.length} ${stato === "programmato" ? "appuntamenti salvati" : "interventi registrati"} (uno per cavallo)`
        : (stato === "programmato" ? "Appuntamento salvato" : "Intervento registrato"));
    }
    interventoInModifica = null;
    if(clienteCreatoOra) await loadClientiMascalcia();
    await renderProDeadlines();
    await renderIncassi();
    if(typeof renderAgendaSettimana === "function") await renderAgendaSettimana();
    if(currentClienteId === cliente_mascalcia_id) await loadClienteInterventi(cliente_mascalcia_id);
  } finally {
    saveBtn.disabled = false;
    // se il cliente è stato creato ora ma nessun intervento è stato salvato, lo rimuoviamo (niente clienti duplicati)
    if(clienteCreatoOra && !salvati && cliente_mascalcia_id && cliente_mascalcia_id !== "__nuovo__"){
      await DB.deleteCavalliClienteNuovo(cliente_mascalcia_id);  // prima i cavalli appena creati: il database non elimina un cliente con cavalli
      await DB.deleteClienteMascalcia(cliente_mascalcia_id);
      document.getElementById("intervento-cliente-select").value = "__nuovo__";
    }
  }
}

/* Avviso automatico al cliente quando il maniscalco sposta o annulla un appuntamento già in agenda
   (la chat genera anche la notifica sul telefono; il calendario del proprietario legge sempre la data aggiornata). */
async function avvisaClienteAppuntamento(tipo, i, prec){
  if(!i?.cliente_mascalcia_id) return;
  const cav = i.cavallo || "";
  let testo;
  if(tipo === "nuovo"){
    testo = testoRichiesta("📅 Nuovo appuntamento", { tipo_ferratura: i.tipo_ferratura, tipo_altro: i.tipo_altro, data_intervento: i.data_intervento, ora: i.ora }, cav).replace(/\.$/, "")
      + ". Se non ti va bene scrivimi qui.";
  } else if(tipo === "spostato" || tipo === "modificato"){
    const righe = [];
    if(prec && servizioCambiato(prec, i)) righe.push(`• Servizio: ${etichettaServizio(prec.tipo_ferratura, prec.tipo_altro)} → ${etichettaServizio(i.tipo_ferratura, i.tipo_altro)}`);
    if(prec && (prec.data !== i.data_intervento || (prec.ora || "") !== (i.ora ? String(i.ora).slice(0, 5) : "")))
      righe.push(`• Data: ${formatDataBreve(prec.data)}${prec.ora ? " ore " + prec.ora : ""} → ${formatDataBreve(i.data_intervento)}${i.ora ? " ore " + String(i.ora).slice(0, 5) : ""}`);
    testo = `✏️ APPUNTAMENTO MODIFICATO${cav ? " · " + cav : ""}` + (righe.length ? "\n" + righe.join("\n") : "")
      + "\n" + testoRichiesta("Ora", { tipo_ferratura: i.tipo_ferratura, tipo_altro: i.tipo_altro, data_intervento: i.data_intervento, ora: i.ora }, "")
      + (clienteCollegatoEquo(i.cliente_mascalcia_id) ? "\n👉 Tocca «Ok, ho visto» nell'appuntamento per confermare, o scrivimi qui se non ti va bene." : "\nSe non ti va bene scrivimi qui.");
  } else {
    testo = testoRichiesta("❌ Appuntamento annullato", { tipo_ferratura: i.tipo_ferratura, tipo_altro: i.tipo_altro, data_intervento: i.data_intervento, ora: i.ora }, cav)
      + " Scrivimi qui se vuoi fissare un'altra data.";
  }
  const { error } = await DB.insertMessaggioMascalcia({ cliente_mascalcia_id: i.cliente_mascalcia_id, tipo: "testo", testo });
  if(error) console.error("avvisaClienteAppuntamento:", error);
}
function etichettaServizio(t, altro){ return t === "altro" && altro ? altro : (TIPO_FERRATURA_LABELS[t] || t || "Appuntamento"); }
function servizioCambiato(a, b){ return (a.tipo_ferratura || "") !== (b.tipo_ferratura || "") || (a.tipo_altro || "") !== (b.tipo_altro || ""); }
// «Modificato · prima: Ferratura, gio 8 ott»: testo breve dalla colonna «modifica» (com'era prima)
function testoPrimaModifica(m){
  const p = m && m.prima; if(!p) return "";
  return `${etichettaServizio(p.tipo, p.tipo_altro)}, ${formatDataBreve(p.data)}${p.ora ? " ore " + p.ora : ""}`;
}
// lato maniscalco: l'appuntamento è stato modificato e chi deve saperlo non l'ha ancora confermato/visto
function notaModificaMan(e, lungo){
  if(!e || !e.modifica || !e.modifica.prima || e.stato === "fatto") return "";
  const daStruttura = e.modifica.da === "struttura";
  const chi = e.gruppo_id ? (daStruttura ? "Proposta della scuderia" : "In attesa della scuderia") : (clienteCollegatoEquo(e.cliente_mascalcia_id) ? "Il cliente non l'ha ancora visto" : "");
  if(!e.gruppo_id && !clienteCollegatoEquo(e.cliente_mascalcia_id)) return "";
  return `<div class="nota-modifica${lungo ? " lunga" : ""}">✏️ Modificato · prima: ${escapeHtml(testoPrimaModifica(e.modifica))}${chi ? " · " + chi : ""}</div>`;
}
function clienteCollegatoEquo(id){
  const c = (clientiMascalcia || []).find(x => x.id === id);
  return !!(c && c.cliente_user_id && !c.centro_id);
}
function deveAvvisareAnnullo(e){
  return e && !e.gruppo_id && e.stato === "programmato" && e.data_intervento >= isoLocale(new Date());
}

async function eliminaInterventoInModifica(){
  if(!interventoInModifica) return;
  if(!confirm(deveAvvisareAnnullo(interventoInModifica) ? "Eliminare questo appuntamento? Il cliente riceve l'avviso in chat." : "Eliminare questo appuntamento?")) return;
  const clienteId = interventoInModifica.cliente_mascalcia_id;
  const daAvvisare = deveAvvisareAnnullo(interventoInModifica) ? { ...interventoInModifica, cavallo: agNomeCavalloSicuro(interventoInModifica) || (cavalliClienteCorrente.find(c => c.id === interventoInModifica.cavallo_cliente_id) || {}).nome || "" } : null;
  const { error } = await DB.deleteInterventoMascalcia(interventoInModifica.id);
  if(error){ showToast("Errore: " + error.message); return; }
  if(daAvvisare) await avvisaClienteAppuntamento("annullato", daAvvisare);
  interventoInModifica = null;
  closeModal("modal-add-intervento");
  showToast("Appuntamento eliminato");
  await renderProDeadlines();
  await renderIncassi();
  if(typeof renderAgendaSettimana === "function") await renderAgendaSettimana();
  if(currentClienteId === clienteId) await loadClienteInterventi(clienteId);
}
// nome vecchio, usato altrove
const createInterventoMascalcia = salvaInterventoMascalcia;


export { aggiornaQuando, avvisaClienteAppuntamento, chiediSiNo, chiudiEditorFerro, clienteCollegatoEquo, deveAvvisareAnnullo, eliminaInterventoInModifica, ferroStd, modificaFerraturaDaIntervento, notaModificaMan, nuovoCavalloLavoro, onCavalliMultiChange, onInterventoClienteChange, openInterventoModal, quandoIntervento, rispondiSiNo, salvaInterventoMascalcia, sceltaModoIntervento, sceltaStraordinario, sceltaZoccolo, selezionaCavalloIntervento, selezionaQuantita, siglaFerro, testoPrimaModifica, toggleInterventoNuovoCavallo, toggleInterventoTipoFields };
