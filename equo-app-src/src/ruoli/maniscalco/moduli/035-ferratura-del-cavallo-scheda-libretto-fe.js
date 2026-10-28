// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { loadClientiMascalcia } from "./032-richiamo-prossimo-intervento-sempre-in-g.js";
import { cavalliEditCache, messaggioErroreCollegaCliente, openClienteDetail, renderCavalliEditCliente } from "./034-strutture-collegate-a-equo-scuderia-prof.js";
import { MISURA_SISTEMA_LABEL, MISURE_FERRO, misuraNorm, misuraPredefinita } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { siglaFerro, chiediConferma } from "./052-ferro-standard-nella-scheda-del-cavallo.js";
import { cavalliMieiLista } from "./086-indice-dei-cavalli-dei-clienti-professio.js";
import { vistaCompleta } from "./097-versione-semplice-completa-dell-app-mani.js";
import { intervalloCavallo, intervalloEffettivo } from "./103-intervallo-prezzo-anagrafica-cavallo.js";
import { onbEmail } from "./116-onboarding.js";
/* ---------- FERRATURA DEL CAVALLO (scheda = libretto): Ferrato / Mezza / Pareggio, misura, tipo di ferro, note ----------
   Si imposta una volta e vale per tutti gli appuntamenti; ogni cambio resta nello storico del cavallo (trigger nel database).
   Completa: tipo di ferro separato davanti / dietro (ferro_tipo = davanti, ferro_tipo_post = dietro). */
const LAVORO_CAV = {
  completa: { t: "Ferrato", s: "4 ferri", q: 4, tipo: "ferratura" },
  mezza:    { t: "Mezza", s: "2 davanti", q: 2, tipo: "mezza_ferratura" },
  pareggio: { t: "Pareggio", s: "senza ferri", q: null, tipo: "pareggio" }
};
function lavoroCav(cv){ return cv && LAVORO_CAV[cv.ferratura_tipo] ? cv.ferratura_tipo : "completa"; }
function tipoDaScheda(cv){ return LAVORO_CAV[lavoroCav(cv)].tipo; }
// dettagli del correttivo (24/10/2026, richiesta di Francesco Bizzarri): si scelgono a tocchi, le note restano per il resto
const DETTAGLI_CORRETTIVO = ["Pad", "Soletta", "Alluminio", "Pianella", "Banda larga in punta", "Ferro asimmetrico"];
// stesso testo della funzione equo_testo_ferro_dettagli del database: «pad, soletta · note» / «davanti: pad; dietro: alluminio»
function testoDettagliFerro(det, detp, note){
  const l = a => (a || []).map(x => String(x).toLowerCase()).join(", ");
  const d = (detp || []).length ? [det && det.length ? "davanti: " + l(det) : "", "dietro: " + l(detp)].filter(Boolean).join("; ") : l(det);
  return [d, (note || "").trim()].filter(Boolean).join(" · ");
}
function testoTipoFerro(ft, ftp, note, det, detp){
  let t = ftp && ftp !== ft ? (ft === "correttivo" ? "correttivo davanti" : "correttivo dietro") : (ft === "correttivo" ? "correttivo" : "standard");
  const extra = testoDettagliFerro(det, detp, note);
  if(extra && t !== "standard") t += " (" + extra + ")";
  return t;
}
// testo del ferro salvato in un intervento (ferro_tipo può essere standard, correttivo, corr_davanti, corr_dietro)
function testoFerroIntervento(i){
  if(!i || !i.ferro_tipo || i.ferro_tipo === "standard") return null;
  const t = i.ferro_tipo === "corr_davanti" ? "correttivo davanti" : i.ferro_tipo === "corr_dietro" ? "correttivo dietro" : "correttivo";
  return t + (i.ferro_note ? " (" + i.ferro_note + ")" : "");
}
// «Ferrato · 4 ferri n. 2 IT · standard»
function descrFerraturaCavallo(cv){
  const k = lavoroCav(cv), l = LAVORO_CAV[k];
  if(k === "pareggio") return "Pareggio · senza ferri";
  return [l.t, l.s + (cv.ferro_numero ? " " + siglaFerro(cv.ferro_sistema, cv.ferro_numero) : ""),
    testoTipoFerro(cv.ferro_tipo, k === "completa" ? cv.ferro_tipo_post : null, cv.ferro_note, cv.ferro_dettagli, k === "completa" ? cv.ferro_dettagli_post : null)].join(" · ");
}
let ferStato = null;
// cv: cavallo (chiave, id, nome, campi ferro); clienteId: per creare la riga se il cavallo è solo «su Equo»; dopo: callback(cv)
function apriSchedaFerratura(cv, clienteId, dopo, extra){
  if(!cv) return;
  const n = cv.ferro_numero ? MISURE_FERRO[cv.ferro_sistema || "italiana"]?.indexOf(misuraNorm(cv.ferro_numero)) : -1;
  // senza misura salvata si parte dalla misura che il maniscalco usa di solito
  ferStato = { cv, clienteId, dopo, lavoro: lavoroCav(cv), s: cv.ferro_numero ? (cv.ferro_sistema || "italiana") : misuraPredefinita(), idx: n >= 0 ? n : -1,
    ft: cv.ferro_tipo || "standard", ftp: cv.ferro_tipo_post || null,
    det: (cv.ferro_dettagli || []).slice(), detp: (cv.ferro_dettagli_post || []).slice(),
    int: intervalloCavallo(cv), intEff: intervalloEffettivo({ ...cv, intervallo_giorni: null }, clienteId || currentClienteId, schedaStoricoCavallo) };
  document.getElementById("fer-prezzo").value = cv.prezzo_ferratura != null && cv.prezzo_ferratura !== "" ? Number(cv.prezzo_ferratura) : "";
  document.getElementById("fer-titolo").textContent = (cv.nome || "Cavallo") + " · Ferratura";
  document.getElementById("fer-sistema").value = ferStato.s;
  document.getElementById("fer-note").value = cv.ferro_note || "";
  const av = document.getElementById("fer-avviso"); av.value = cv.avviso_sicurezza || ""; ferStato.avviso = cv.avviso_sicurezza || "";
  if(cv.id && cv.avviso_sicurezza === undefined && !DEMO_MODE){
    sb.from("cavalli_clienti_mascalcia").select("avviso_sicurezza").eq("id", cv.id).maybeSingle().then(({ data }) => {
      if(data && ferStato && ferStato.cv === cv && !av.value){ av.value = data.avviso_sicurezza || ""; ferStato.avviso = av.value; }
    }, () => {});
  }
  document.getElementById("fer-errore").style.display = "none";
  document.getElementById("fer-dati").innerHTML = extra || "";
  ferRender();
  openModal("modal-ferratura");
}
function ferRender(){
  const f = ferStato; if(!f) return;
  document.querySelectorAll("#fer-lavoro button").forEach(b => b.classList.toggle("on", b.dataset.v === f.lavoro));
  document.getElementById("fer-con-ferri").style.display = f.lavoro === "pareggio" ? "none" : "";
  document.getElementById("fer-misura").textContent = f.idx >= 0 ? "n. " + MISURE_FERRO[f.s][f.idx] + " " + MISURA_SISTEMA_LABEL[f.s] : "non impostata";
  // Completa con 4 ferri: davanti e dietro separati
  const dd = vistaCompleta() && f.lavoro === "completa";
  document.getElementById("fer-tipo-label").textContent = dd ? "Tipo di ferro · davanti e dietro" : "Tipo di ferro";
  document.querySelector("#fer-riga-unico span").textContent = dd ? "Davanti" : "";
  document.getElementById("fer-riga-dietro").style.display = dd ? "" : "none";
  const ftp = f.ftp || f.ft;
  document.querySelectorAll('#modal-ferratura .fer-scelta[data-k="ft"] button').forEach(b => b.classList.toggle("on", b.dataset.v === f.ft));
  document.querySelectorAll('#modal-ferratura .fer-scelta[data-k="ftp"] button').forEach(b => b.classList.toggle("on", b.dataset.v === ftp));
  // dettagli del correttivo sotto la riga che è «Correttivo»
  const chips = (lato, lista) => DETTAGLI_CORRETTIVO.map(v => `<button type="button" class="${lista.includes(v) ? "on" : ""}" onclick="ferDettaglio('${lato}','${v}')">${escapeHtml(v)}</button>`).join("");
  const bu = document.getElementById("fer-det-unico"), bd = document.getElementById("fer-det-dietro");
  bu.style.display = f.ft === "correttivo" ? "" : "none";
  bu.innerHTML = f.ft === "correttivo" ? chips("det", f.det) : "";
  bd.style.display = dd && ftp === "correttivo" ? "" : "none";
  bd.innerHTML = dd && ftp === "correttivo" ? chips("detp", f.detp) : "";
  // intervallo di ferratura del cavallo
  const da = { struttura: "della struttura", ultima: "come l'ultima volta", predefinito: "il tuo predefinito" };
  document.getElementById("fer-int-val").textContent = (f.int || f.intEff.giorni) + " giorni";
  document.getElementById("fer-int-rapidi").innerHTML = [30, 35, 40, 45].map(g => `<button type="button" class="${f.int === g ? "on" : ""}" onclick="ferIntervalloImposta(${g})">${g}</button>`).join("")
    + (f.int ? `<button type="button" class="togli" onclick="ferIntervalloImposta(null)">Togli</button>` : "");
  document.getElementById("fer-int-nota").textContent = f.int
    ? "Vale dalla prossima ferratura: la prossima data già fissata non cambia."
    : `Non impostato: usa ${f.intEff.giorni} giorni (${da[f.intEff.da] || ""}). Tocca − o + per fissarlo per questo cavallo.`;
  // misura preferita: «Usa sempre questa misura» oppure «È la tua misura di sempre»
  const pref = document.getElementById("fer-sistema-pref");
  if(pref){
    const mia = currentUser && currentUser.ferroSistema === f.s;
    pref.innerHTML = mia ? '<i class="fa-solid fa-check"></i> La tua misura di sempre' : `<button type="button" onclick="impostaMisuraPredefinita(ferStatoSistema())">Usa sempre la ${escapeHtml(TESTO_MISURA[f.s] || f.s)}</button>`;
  }
}
// intervallo del cavallo: − / +, valori rapidi, «Togli» (senza valore vale quello della struttura o il solito)
function ferIntervallo(d){
  const f = ferStato; if(!f) return;
  const base = f.int || f.intEff.giorni;
  f.int = Math.max(7, Math.min(180, base + d));
  ferRender();
}
function ferIntervalloImposta(v){ const f = ferStato; if(!f) return; f.int = v; ferRender(); }
const TESTO_MISURA = { italiana: "misura italiana", olandese: "misura olandese / internazionale", tedesca: "misura tedesca" };
function ferStatoSistema(){ return ferStato ? ferStato.s : null; }
function ferDettaglio(lato, v){
  const f = ferStato; if(!f || !DETTAGLI_CORRETTIVO.includes(v)) return;
  const l = f[lato] || [];
  f[lato] = l.includes(v) ? l.filter(x => x !== v) : DETTAGLI_CORRETTIVO.filter(x => x === v || l.includes(x));
  ferRender();
}
// misura che il maniscalco usa di solito (dalla scheda Ferratura o dal menu)
async function impostaMisuraPredefinita(v){
  if(!currentUser || !MISURE_FERRO[v]) return;
  if(!DEMO_MODE){
    const { error } = await sb.from("profiles").update({ ferro_sistema_predefinito: v }).eq("id", currentUser.id);
    if(error){ showToast(/ferro_sistema_predefinito/.test(error.message || "") ? "Manca un aggiornamento del database: avvisa l'assistenza Equo." : "Errore: " + error.message); return; }
  }
  currentUser.ferroSistema = v;
  const sel = document.getElementById("misura-pref-select"); if(sel) sel.value = v;
  if(document.getElementById("modal-ferratura")?.classList.contains("active")) ferRender();
  showToast("Da ora i cavalli senza misura partono dalla " + (TESTO_MISURA[v] || v));
}
function ferLavoro(v){ if(ferStato){ ferStato.lavoro = v; ferRender(); } }
function ferSistema(){
  const f = ferStato; if(!f) return;
  const nuovo = document.getElementById("fer-sistema").value;
  if(f.idx >= 0){ const i = f.idx; f.s = nuovo; f.idx = Math.min(i, MISURE_FERRO[nuovo].length - 1); } else f.s = nuovo;  // stessa riga = misura equivalente
  ferRender();
}
function ferMisura(d){
  const f = ferStato; if(!f) return;
  const max = MISURE_FERRO[f.s].length - 1;
  f.idx = f.idx < 0 ? MISURA_INDICE_PARTENZA : Math.max(0, Math.min(max, f.idx + d));
  ferRender();
}
function ferTipo(k, v){
  const f = ferStato; if(!f) return;
  if(k === "ft"){ const dietro = f.ftp || f.ft; f.ft = v; if(vistaCompleta() && f.lavoro === "completa") f.ftp = dietro; else f.ftp = null; }
  else f.ftp = v;
  if(f.ftp === f.ft) f.ftp = null;
  ferRender();
}
async function salvaSchedaFerratura(){
  const f = ferStato; if(!f) return;
  const cv = f.cv;
  const err = m => { const e = document.getElementById("fer-errore"); e.textContent = m; e.style.display = "block"; };
  const campi = { ferratura_tipo: f.lavoro };
  if(f.lavoro !== "pareggio"){
    if(f.idx >= 0){ campi.ferro_sistema = f.s; campi.ferro_numero = MISURE_FERRO[f.s][f.idx]; }
    campi.ferro_tipo = f.ft;
    // davanti/dietro si tocca solo nella Completa con 4 ferri; altrove resta com'era (salvo cambio del tipo unico)
    if(vistaCompleta() && f.lavoro === "completa") campi.ferro_tipo_post = f.ftp || null;
    else if(f.ft !== (cv.ferro_tipo || "standard")) campi.ferro_tipo_post = null;
    campi.ferro_note = document.getElementById("fer-note").value.trim() || null;
    // dettagli del correttivo: solo per il lato che è correttivo
    campi.ferro_dettagli = f.ft === "correttivo" && f.det.length ? f.det.slice() : null;
    if(vistaCompleta() && f.lavoro === "completa") campi.ferro_dettagli_post = (f.ftp || f.ft) === "correttivo" && f.detp.length ? f.detp.slice() : null;
    else if(f.ft !== (cv.ferro_tipo || "standard")) campi.ferro_dettagli_post = null;
  }
  // intervallo e prezzo valgono anche per il pareggio
  campi.intervallo_giorni = f.int || null;
  const pz = document.getElementById("fer-prezzo").value;
  if(pz !== "" && !(Number(pz) >= 0 && Number(pz) <= 10000)) return err("Controlla il prezzo.");
  campi.prezzo_ferratura = pz === "" ? null : Math.round(Number(pz) * 100) / 100;
  const avviso = document.getElementById("fer-avviso").value.trim();
  if(avviso !== (f.avviso || "")) campi.avviso_sicurezza = avviso || null;
  // solo i campi davvero cambiati (lo storico registra ogni cambio)
  Object.keys(campi).forEach(k => {
    const prima = k === "ferratura_tipo" ? lavoroCav(cv) : k === "ferro_tipo" ? (cv.ferro_tipo || "standard") : k === "avviso_sicurezza" ? (f.avviso || null) : (cv[k] ?? null);
    if(k === "prezzo_ferratura" || k === "intervallo_giorni"){ const a = prima == null || prima === "" ? null : Number(prima), b = campi[k] == null ? null : Number(campi[k]); if(a === b) delete campi[k]; return; }
    if(String(prima ?? "") === String(campi[k] ?? "")) delete campi[k];
  });
  if(!Object.keys(campi).length){ closeModal("modal-ferratura"); if(f.dopo) f.dopo(cv, false); return; }
  const btn = document.getElementById("fer-salva"); btn.disabled = true;
  try{
    let id = cv.id;
    if(!id && f.clienteId){ ({ cavallo_cliente_id: id } = await DB.risolviCavalloPerIntervento(f.clienteId, cv)); }
    if(!id) return err("Non riuscito, riprova.");
    const { error } = await DB.updateCavalloCliente(id, campi);
    if(error) return err(/ferratura_tipo|ferro_tipo_post|ferro_dettagli|intervallo_giorni|prezzo_ferratura/.test(error.message || "") || /avviso_sicurezza/.test(error.message || "") ? "Manca un aggiornamento del database: avvisa l'assistenza Equo." : "Errore: " + error.message);
    Object.assign(cv, campi, { id });
    // tiene allineate le altre copie del cavallo in memoria
    [schedaCavalli, cavalliEditCache, cavalliClienteCorrente, cavalliMieiLista].forEach(l => (l || []).forEach(x => { if(x !== cv && x.id === id) Object.assign(x, campi); }));
    closeModal("modal-ferratura");
    showToast(`${cv.nome || "Cavallo"}: ${descrFerraturaCavallo(cv)}`);
    if(f.dopo) f.dopo(cv, true);
  } finally { btn.disabled = false; }
}

// tiene allineato il vecchio campo testo nome_cavallo (usato in lista clienti/inbox)
async function syncNomeCavalloCliente(){
  const cav = await DB.listCavalliCliente(currentClienteId);
  const nome_cavallo = cav.map(x => x.nome).join(", ");
  await DB.updateClienteMascalcia(currentClienteId, { nome_cavallo });
}

// 28/10/2026: i cavalli si aggiungono solo da «Nuovo cavallo» (033 apriNuovoCavalloCartella), anche da «Modifica» cliente

async function eliminaCavalloEditCliente(id){
  if(!await chiediConferma("Eliminare questo cavallo? Gli interventi già registrati restano nello storico.")) return;
  const { error } = await DB.deleteCavalloCliente(id);
  if(error){ showToast("Errore: " + error.message); return; }
  await renderCavalliEditCliente();
  await syncNomeCavalloCliente();
}

async function salvaEditCliente(){
  const errBox = document.getElementById("edit-cliente-error");
  errBox.style.display = "none";
  const nome = document.getElementById("edit-cliente-nome").value.trim();
  const telefono = document.getElementById("edit-cliente-telefono").value.trim();
  const note = document.getElementById("edit-cliente-note").value.trim();
  if(!nome){ errBox.textContent = "Il nome del cliente è obbligatorio."; errBox.style.display = "block"; return; }
  const tipo_cliente = document.getElementById("edit-cliente-tipo").value;
  const codiceEquo = document.getElementById("edit-cliente-codice-equo").value.trim().toUpperCase();
  const campiCli = { telefono, note };
  { const g = document.getElementById("edit-cliente-email-group");
    if(g && g.style.display !== "none"){
      const email = onbEmail("edit-cliente-email");
      if(email === null){ errBox.textContent = "L'email non sembra giusta: controllala o lasciala vuota."; errBox.style.display = "block"; return; }
      const prima = clientiMascalcia.find(x => x.id === currentClienteId)?.email || "";
      if(email !== prima) campiCli.email = email || null;
    } }
  if(!document.getElementById("edit-cliente-nome").disabled) campiCli.nome = nome;   // collegato a Equo: il nome viene dal profilo
  if(!document.getElementById("edit-cliente-tipo").disabled) campiCli.tipo_cliente = tipo_cliente;   // collegato a Equo: il tipo non si cambia
  const { error } = await DB.updateClienteMascalcia(currentClienteId, campiCli);
  if(error){ errBox.textContent = "Errore: " + error.message; errBox.style.display = "block"; return; }
  // indirizzo salvato a parte: se il database non avesse ancora la colonna, il resto è già salvo
  const indirizzo = document.getElementById("edit-cliente-indirizzo").value.trim();
  const cPrima = clientiMascalcia.find(x => x.id === currentClienteId);
  if((cPrima?.indirizzo || "") !== indirizzo) await DB.updateClienteMascalcia(currentClienteId, { indirizzo: indirizzo || null });
  // promemoria pagamenti (solo clienti collegati su Equo); a parte, così il resto resta salvo anche senza la colonna
  if(cPrima?.cliente_user_id){
    const prom = !!document.getElementById("edit-cliente-promemoria").checked;
    if((cPrima.promemoria_pagamenti !== false) !== prom) await DB.updateClienteMascalcia(currentClienteId, { promemoria_pagamenti: prom });
  }
  if(codiceEquo){
    const res = await DB.collegaClienteDaCodice(currentClienteId, codiceEquo);
    if(!res.ok){
      errBox.textContent = "Dati salvati, ma " + messaggioErroreCollegaCliente(res).replace(/^./, x => x.toLowerCase());
      errBox.style.display = "block";
      await loadClientiMascalcia();
      return;
    }
    showToast("Collegato a Equo: gli è arrivato il tuo primo messaggio");
  }
  closeModal("modal-edit-cliente");
  if(!codiceEquo) showToast("Cliente aggiornato");
  const id = currentClienteId;
  await loadClientiMascalcia();
  await openClienteDetail(id);
}

function closeClienteDetail(){
  currentClienteId = null;
  schedaDaCartella = false;
  schedaCavalloKey = null;
  const vp = document.getElementById("cavallo-pro-view"); if(vp) vp.style.display = "none";
  document.getElementById("clienti-list-view").style.display = "block";
  document.getElementById("clienti-detail-view").style.display = "none";
}


export { syncNomeCavalloCliente, DETTAGLI_CORRETTIVO, LAVORO_CAV, ferDettaglio, ferIntervallo, ferIntervalloImposta, ferStatoSistema, impostaMisuraPredefinita, testoDettagliFerro, apriSchedaFerratura, closeClienteDetail, descrFerraturaCavallo, eliminaCavalloEditCliente, ferLavoro, ferMisura, ferSistema, ferTipo, lavoroCav, salvaEditCliente, salvaSchedaFerratura, testoFerroIntervento, tipoDaScheda };
