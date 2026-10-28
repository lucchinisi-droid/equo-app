// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { isStrutturaCollegata } from "./033-clienti-a-cartelle-stile-telegram-cavall.js";
import { hpColoreApp, hpColoreRic, hpListaApp, hpListaRic, hpQuando, hpTipo, renderProDeadlines } from "./040-home-pro-prossimi-appuntamenti-da-richia.js";
import { giorniTra } from "./032-richiamo-prossimo-intervento-sempre-in-g.js";
import { statoCavalloPro } from "./037-scheda-cliente-a-box-scheda-del-cavallo.js";
import { apriSchedaCavalloPro } from "./038-avviso-sembra-lo-stesso-cavallo.js";
import { isPremium } from "./042-incassi-pro.js";
import { aggiungiGiorniIso, isoLocale } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { openInterventoModal, chiediConferma } from "./052-ferro-standard-nella-scheda-del-cavallo.js";
import { renderAgendaSettimana } from "./053-agenda-settimanale-maniscalco.js";
import { formatDataBreve } from "./054-richieste-di-appuntamento-step-5d.js";
import { apriPropostaStruttura } from "./055-appuntamenti-con-strutture-equo-scuderia.js";
import { segnaFattoAgenda } from "./056-ordine-del-giro-trascina-un-cavallo-nel.js";
/* ---------- GIRO DELLA ZONA (Premium) ----------
   Più cavalli dello stesso cliente/struttura da richiamare entro GIRO_GIORNI → un appuntamento unico.
   Struttura collegata a Equo Scuderia: proposta multi-cavallo (la struttura conferma).
   Altri clienti: un intervento "programmato" per cavallo, stessa data e ora. */
const GIRO_GIORNI = 14;
function hpGiri(){
  const per = {};
  hpRichiamiLista.filter(r => r.giorni <= GIRO_GIORNI).forEach(r => { (per[r.cliente_mascalcia_id] = per[r.cliente_mascalcia_id] || []).push(r); });
  return Object.values(per).filter(l => l.length >= 2).sort((a, b) => b.length - a.length);
}
function hpRigaGiro(l){
  const nomi = l.map(r => r.cavallo_nome || "cavallo").join(", ");
  const ritardo = l.some(r => r.giorni < 0);
  return `<div class="hp-giro" onclick="apriGiro('${l[0].cliente_mascalcia_id}')">
    <div class="hp-giro-ic"><i class="fa-solid fa-route"></i></div>
    <div class="hp-main"><b>Giro · ${escapeHtml(l[0].cliente_nome || "")}</b>
      <span>${l.length} cavalli ${ritardo ? "da fare (alcuni in ritardo)" : "entro " + GIRO_GIORNI + " giorni"}: ${escapeHtml(nomi)}</span></div>
    ${isPremium() ? "" : '<span class="hp-prem">PREMIUM</span>'}<span class="ag-chev" style="color:var(--muted)">›</span></div>`;
}
function giroDataProposta(l){
  const oggi = isoLocale(new Date());
  const future = l.map(r => r.scadenza).filter(d => d >= oggi).sort();
  return l.some(r => r.giorni < 0) || !future.length ? aggiungiGiorniIso(oggi, 1) : future[0];
}
function giroTipoPrevalente(l){
  const n = {}; l.forEach(r => { n[r.tipo_ferratura] = (n[r.tipo_ferratura] || 0) + 1; });
  return Object.entries(n).sort((a, b) => b[1] - a[1])[0][0];
}
let giroCorrente = null;
async function apriGiro(clienteId){
  if(!isPremium()){
    showToast("Il giro della zona è incluso in Equo Premium");
    togglePiano();
    return;
  }
  const l = hpGiri().find(g => g[0].cliente_mascalcia_id === clienteId);
  if(!l) return;
  if(!clientiMascalcia || !clientiMascalcia.some(x => x.id === clienteId)) clientiMascalcia = await DB.listClientiMascalcia();
  const tipo = giroTipoPrevalente(l);
  if(isStrutturaCollegata(clienteId)){
    const diversi = l.filter(r => r.tipo_ferratura !== tipo).map(r => `${r.cavallo_nome}: ${hpTipo(r).toLowerCase()}`);
    await apriPropostaStruttura(clienteId, { tipo_ferratura: tipo, data_intervento: giroDataProposta(l), cavalli: l.map(r => r.cavallo_cliente_id).filter(Boolean) });
    if(diversi.length) document.getElementById("prop-str-note").value = diversi.join(" · ");
    return;
  }
  giroCorrente = { clienteId, lista: l };
  document.getElementById("giro-nome").textContent = l[0].cliente_nome || "cliente";
  document.getElementById("giro-data").value = giroDataProposta(l);
  document.getElementById("giro-data").min = isoLocale(new Date());
  document.getElementById("giro-ora").value = "";
  document.getElementById("giro-error").style.display = "none";
  document.getElementById("giro-cavalli").innerHTML = l.map(r => `<label class="giro-cav"><input type="checkbox" class="giro-cav-ck" value="${r.intervento_id}" checked style="width:18px;height:18px">
    <span><b>${escapeHtml(r.cavallo_nome || "Cavallo")}</b> · ${escapeHtml(hpTipo(r))}</span><small class="${hpColoreRic(r) === "rosso" ? "" : ""}">${hpQuando(r)}</small></label>`).join("");
  openModal("modal-giro");
}
async function confermaGiro(){
  const g = giroCorrente; if(!g) return;
  const err = document.getElementById("giro-error"); err.style.display = "none";
  const data = document.getElementById("giro-data").value;
  const ora = document.getElementById("giro-ora").value || null;
  const scelti = Array.from(document.querySelectorAll(".giro-cav-ck:checked")).map(el => el.value);
  if(!data){ err.textContent = "Scegli la data."; err.style.display = "block"; return; }
  if(!scelti.length){ err.textContent = "Seleziona almeno un cavallo."; err.style.display = "block"; return; }
  const righe = g.lista.filter(r => scelti.includes(r.intervento_id));
  for(const r of righe){
    const { error } = await DB.insertInterventoMascalcia({ cliente_mascalcia_id: r.cliente_mascalcia_id, cavallo_cliente_id: r.cavallo_cliente_id, horse_id: r.horse_id,
      tipo_ferratura: r.tipo_ferratura, tipo_altro: r.tipo_altro, misura_sistema: r.misura_sistema, numero_ferro: r.numero_ferro, quantita_ferri: r.quantita_ferri,
      data_intervento: data, ora, stato: "programmato", prossima_scadenza: null, importo: null, stato_pagamento: "da_saldare", note: null });
    if(error){ err.textContent = "Non sono riuscito a salvare: " + error.message; err.style.display = "block"; await renderProDeadlines(); return; }
  }
  closeModal("modal-giro");
  showToast(`Giro fissato: ${righe.length} cavalli ${formatDataBreve(data)}${ora ? " ore " + ora : ""}`);
  giroCorrente = null;
  await renderProDeadlines();
  if(document.getElementById("ag-week")) renderAgendaSettimana();
  if(document.getElementById("giro-avvisa").checked){
    const nome = (righe[0].cliente_nome || "").split(" ")[0];
    const elenco = righe.map(r => `${r.cavallo_nome || "cavallo"} (${hpTipo(r).toLowerCase()})`).join(", ");
    await openChatThread(g.clienteId);
    const inp = document.getElementById("mchat-input");
    if(inp){ inp.value = `Ciao${nome && righe[0].tipo_cliente !== "struttura" ? " " + nome : ""}, passo ${formatDataBreve(data)}${ora ? " alle " + ora : ""} per ${elenco}. Ti va bene?`; inp.focus(); }
  }
}

async function hpSegnaFatto(id){
  await segnaFattoAgenda(id);   // chiede i giorni del richiamo, aggiorna agenda, incassi e Home
}

function apriListaHome(tipo){
  hpListaTipo = tipo; hpListaFiltro = "tutti";
  document.getElementById("hp-lista-titolo").textContent = tipo === "app" ? "Prossimi appuntamenti" : "Da richiamare";
  renderListaHome();
  openModal("modal-hp-lista");
}
function hpFiltra(f){ hpListaFiltro = f; renderListaHome(); }
function renderListaHome(){
  const filtri = hpListaTipo === "app"
    ? [["tutti", "Tutti"], ["rosso", "Da chiudere"], ["ocra", "Da confermare"], ["verde", "Confermati"]]
    : [["tutti", "Tutti"], ["rosso", "In ritardo"], ["ocra", "Questa settimana"], ["verde", "Prossimi 30 giorni"]];
  document.getElementById("hp-lista-filtri").innerHTML = filtri.map(([k, t]) => `<button class="${hpListaFiltro === k ? "on" : ""}" onclick="hpFiltra('${k}')">${t}</button>`).join("");
  const corpo = document.getElementById("hp-lista-corpo");
  if(hpListaTipo === "app"){
    const l = hpAppuntamenti.filter(e => hpListaFiltro === "tutti" || hpColoreApp(e) === hpListaFiltro);
    corpo.innerHTML = l.length ? hpListaApp(l) : '<div class="muted" style="font-size:13px;padding:10px 0">Nessun appuntamento.</div>';
  } else {
    const l = hpRichiamiLista.filter(r => hpListaFiltro === "tutti" || hpColoreRic(r) === hpListaFiltro);
    corpo.innerHTML = l.length ? hpListaRic(l) : '<div class="muted" style="font-size:13px;padding:10px 0">Nessun cavallo in questo gruppo.</div>';
  }
}

function apriRichiamo(id){
  const r = hpRichiami[id]; if(!r) return;
  hpRichiamoId = id;
  document.getElementById("ricaz-titolo").textContent = (r.cliente_nome || "Cliente") + (r.cavallo_nome ? " · " + r.cavallo_nome : "");
  document.getElementById("ricaz-dettaglio").innerHTML = [
    `<span class="hp-dot ${hpColoreRic(r)}" style="display:inline-block;vertical-align:-1px;margin-right:6px"></span><b>${escapeHtml(hpTipo(r))}</b> · ${hpQuando(r)} (${formatDate(r.scadenza)})`,
    `Ultimo intervento: ${formatDate(r.data_intervento)}`,
    r.rimandato ? `Rimandato: in origine era il ${formatDate(r.prossima_scadenza)}` : "",
    r.tipo_cliente === "struttura" ? '<span style="font-size:12px">Cliente scuderia: l\'appuntamento va confermato dalla scuderia.</span>' : ""
  ].filter(Boolean).join("<br>");
  document.getElementById("ricaz-scrivi").innerHTML = '<span class="fa-icon"><i class="fa-solid fa-comment"></i></span> Scrivi al cliente' + (isPremium() ? "" : '<span class="hp-prem">PREMIUM</span>');
  richiamoMostraAzioni();
  openModal("modal-richiamo-az");
}
function richiamoMostraAzioni(){
  document.getElementById("ricaz-azioni").style.display = "";
  document.getElementById("ricaz-rimanda").style.display = "none";
}
async function richiamoAzione(tipo){
  const r = hpRichiami[hpRichiamoId]; if(!r) return;
  if(tipo === "fissa"){
    closeModal("modal-richiamo-az");
    const oggi = isoLocale(new Date());
    openInterventoModal(r.cliente_mascalcia_id, null, {
      tipo_ferratura: r.tipo_ferratura, tipo_altro: r.tipo_altro, misura_sistema: r.misura_sistema, numero_ferro: r.numero_ferro, quantita_ferri: r.quantita_ferri,
      data_intervento: r.scadenza > oggi ? r.scadenza : oggi, cavallo_cliente_id: r.cavallo_cliente_id, horse_id: r.horse_id
    });
  } else if(tipo === "scrivi"){
    closeModal("modal-richiamo-az");
    if(!isPremium()){
      await openChatThread(r.cliente_mascalcia_id);
      showToast("Con Equo Premium trovi il messaggio già pronto da inviare");
      return;
    }
    const nome = (r.cliente_nome || "").split(" ")[0];
    const testo = `Ciao${nome && r.tipo_cliente !== "struttura" ? " " + nome : ""}, ${r.giorni < 0 ? "è ora di rifare" : "si avvicina"} ${hpTipo(r).toLowerCase()}${r.cavallo_nome ? " di " + r.cavallo_nome : ""}${r.giorni < 0 ? "" : " (" + formatDataBreve(r.scadenza) + ")"}. Quando ti va bene che passi?`;
    await openChatThread(r.cliente_mascalcia_id);
    const inp = document.getElementById("mchat-input");
    if(inp){ inp.value = testo; inp.focus(); }
  } else if(tipo === "rimanda"){
    document.getElementById("ricaz-azioni").style.display = "none";
    document.getElementById("ricaz-rimanda").style.display = "block";
    const inp = document.getElementById("ricaz-data");
    inp.min = isoLocale(new Date());
    inp.value = r.scadenza < inp.min ? inp.min : r.scadenza;
    document.getElementById("ricaz-attuale").textContent = "Scadenza attuale: " + formatDataBreve(r.scadenza) + " (" + hpQuando(r) + ")";
    richiamoAnteprima();
  } else if(tipo === "chiudi"){
    if(!await chiediConferma(`Non ricordarti più ${hpTipo(r).toLowerCase()}${r.cavallo_nome ? " di " + r.cavallo_nome : ""}? Tornerà solo quando registrerai un nuovo intervento.`)) return;
    const { error } = await DB.setRichiamoStato(r.intervento_id, { chiuso_il: new Date().toISOString() });
    if(error){ showToast("Errore: " + error.message); return; }
    closeModal("modal-richiamo-az");
    showToast("Fatto, non te lo ricordo più");
    await renderProDeadlines();
  }
}
// «Cambia data»: sposta la scadenza vera (prossima_scadenza dell'ultimo intervento), avanti o indietro, mai nel passato
function richiamoSposta(d){
  const r = hpRichiami[hpRichiamoId]; if(!r) return;
  const inp = document.getElementById("ricaz-data"), oggi = isoLocale(new Date());
  let v = aggiungiGiorniIso(inp.value || r.scadenza, d);
  if(v < oggi) v = oggi;
  inp.value = v;
  richiamoAnteprima();
}
function richiamoAnteprima(){
  const v = document.getElementById("ricaz-data").value, box = document.getElementById("ricaz-anteprima");
  if(!v){ box.textContent = ""; return; }
  const g = giorniTra(isoLocale(new Date()), v);
  box.textContent = "Nuova scadenza: " + formatDataBreve(v) + " (" + (g < 0 ? "nel passato" : g === 0 ? "oggi" : g === 1 ? "domani" : "tra " + g + " giorni") + ")";
  box.style.color = g < 0 ? "var(--red)" : "";
}
async function richiamoCambiaData(){
  const r = hpRichiami[hpRichiamoId]; if(!r) return;
  const data = document.getElementById("ricaz-data").value;
  if(!data){ showToast("Scegli la data"); return; }
  if(data < isoLocale(new Date())){ showToast("La scadenza non può essere nel passato"); return; }
  const { error } = await DB.updateInterventoMascalcia(r.intervento_id, { prossima_scadenza: data });
  if(error){ showToast("Errore: " + error.message); return; }
  if(r.rimandato) await DB.setRichiamoStato(r.intervento_id, { rimandato_al: null });
  closeModal("modal-richiamo-az");
  showToast("Nuova scadenza" + (r.cavallo_nome ? " di " + r.cavallo_nome : "") + ": " + formatDataBreve(data));
  await renderProDeadlines();
  if(schedaCavalloKey && document.getElementById("cavallo-pro-view")?.style.display === "block") await apriSchedaCavalloPro(schedaCavalloKey, true);
}
// dalla scheda del cavallo: la stessa finestra della lista «Scadenze»
async function apriScadenzaCavallo(){
  const cv = schedaCavalli.find(c => c.key === schedaCavalloKey);
  if(!cv) return;
  const st = statoCavalloPro(cv, schedaStoricoCavallo || []);
  if(st.prossimo?.fissato){
    const app = (schedaStoricoCavallo || []).filter(i => ["programmato", "richiesto", "proposto"].includes(i.stato) && i.data_intervento === st.prossimo.data)[0];
    if(app) return openInterventoModal(null, app);
  }
  const u = st.ultimo;
  if(!u || !u.prossima_scadenza){ showToast("Nessuna scadenza: si crea quando segni fatto un lavoro."); return; }
  if(!hpRichiami[u.id]){
    const cli = clientiMascalcia.find(c => c.id === u.cliente_mascalcia_id);
    hpRichiami[u.id] = { intervento_id: u.id, cliente_mascalcia_id: u.cliente_mascalcia_id, cliente_nome: cli?.nome || "", tipo_cliente: cli?.tipo_cliente || null,
      cavallo_cliente_id: u.cavallo_cliente_id, horse_id: u.horse_id, cavallo_nome: cv.nome, tipo_ferratura: u.tipo_ferratura, tipo_altro: u.tipo_altro,
      misura_sistema: u.misura_sistema, numero_ferro: u.numero_ferro, quantita_ferri: u.quantita_ferri, data_intervento: u.data_intervento,
      prossima_scadenza: u.prossima_scadenza, scadenza: u.prossima_scadenza, rimandato: false, giorni: giorniTra(isoLocale(new Date()), u.prossima_scadenza) };
  }
  apriRichiamo(u.id);
}
async function richiamoRimanda(giorni){
  const r = hpRichiami[hpRichiamoId]; if(!r) return;
  const data = giorni ? aggiungiGiorniIso(isoLocale(new Date()), giorni) : document.getElementById("ricaz-data").value;
  if(!data){ showToast("Scegli una data"); return; }
  const { error } = await DB.setRichiamoStato(r.intervento_id, { rimandato_al: data });
  if(error){ showToast("Errore: " + error.message); return; }
  closeModal("modal-richiamo-az");
  showToast("Te lo ricordo " + formatDataBreve(data));
  await renderProDeadlines();
}


export { apriScadenzaCavallo, richiamoAnteprima, richiamoCambiaData, richiamoSposta, apriGiro, apriListaHome, apriRichiamo, confermaGiro, hpFiltra, hpGiri, hpRigaGiro, hpSegnaFatto, renderListaHome, richiamoAzione, richiamoMostraAzioni, richiamoRimanda };
