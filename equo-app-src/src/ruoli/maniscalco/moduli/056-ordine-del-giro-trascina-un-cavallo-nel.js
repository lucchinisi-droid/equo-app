// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { prendiFerriScelti, prendiImportiScelti, prendiPagamentoScelto, richiamoPerFatto } from "./032-richiamo-prossimo-intervento-sempre-in-g.js";
import { renderProDeadlines } from "./040-home-pro-prossimi-appuntamenti-da-richia.js";
import { renderIncassi } from "./047-incassi-saldati-per-periodo-da-saldare-p.js";
import { isoLocale } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { avvisaClienteAppuntamento, chiediSiNo, deveAvvisareAnnullo, notaModificaMan, openInterventoModal } from "./052-ferro-standard-nella-scheda-del-cavallo.js";
import { AG_GIORNI, AG_MESI_LUNGHI, agDescrizioneTipoPro, agNomeCavallo, renderAgendaSettimana } from "./053-agenda-settimanale-maniscalco.js";
import { formatDataBreve } from "./054-richieste-di-appuntamento-step-5d.js";
import { accettaRichiesta, agDisegnaGriglia, azioneGruppoStruttura } from "./055-appuntamenti-con-strutture-equo-scuderia.js";
import { generaPdfEvento, inviaEventoInChat } from "./057-pdf-appuntamento-invio-in-chat-maniscalc.js";
/* ---------- ORDINE DEL GIRO: trascina un cavallo nel suo cliente o un cliente intero ---------- */
function agOrdinaGiro(l){
  return (l || []).slice().sort((a, b) => (a.data_intervento || "").localeCompare(b.data_intervento || "")
    || ((a.ordine_giro ?? 1e9) - (b.ordine_giro ?? 1e9))
    || String(a.ora || "99").localeCompare(String(b.ora || "99"))
    || String(a.created_at || "").localeCompare(String(b.created_at || "")));
}
let agTrascina = null;
function agAttivaTrascina(box){
  if(box.dataset.trascina) return;
  box.dataset.trascina = "1";
  box.addEventListener("pointerdown", e => {
    const h = e.target.closest(".ag-mani");
    if(!h) return;
    e.preventDefault();
    const tipo = h.dataset.drag;
    const el = tipo === "gr" ? h.closest(".ag-gblock") : h.closest(".ag-ev");
    const cont = el && el.parentElement;
    if(!el || !cont) return;
    const r = el.getBoundingClientRect();
    const posto = document.createElement("div");
    posto.className = "ag-posto"; posto.style.height = r.height + "px";
    cont.insertBefore(posto, el);
    el.classList.add("ag-preso");
    el.style.width = r.width + "px"; el.style.left = r.left + "px"; el.style.top = r.top + "px";
    agTrascina = { el, cont, posto, tipo, y0: e.clientY, top0: r.top, ordinePrima: agOrdineDom() };
    try{ h.setPointerCapture(e.pointerId); }catch(_){}
    if(navigator.vibrate) try{ navigator.vibrate(15); }catch(_){}
  });
  box.addEventListener("pointermove", e => {
    const t = agTrascina; if(!t) return;
    e.preventDefault();
    t.el.style.top = (t.top0 + e.clientY - t.y0) + "px";
    const fratelli = [...t.cont.children].filter(x => x !== t.el && x !== t.posto && (t.tipo === "gr" ? x.classList.contains("ag-gblock") : x.classList.contains("ag-ev") && x.dataset.ev));
    let prima = null;
    for(const f of fratelli){ const rr = f.getBoundingClientRect(); if(e.clientY < rr.top + rr.height / 2){ prima = f; break; } }
    if(prima) t.cont.insertBefore(t.posto, prima);
    else { const ultimo = fratelli[fratelli.length - 1]; if(ultimo) t.cont.insertBefore(t.posto, ultimo.nextSibling); }
  });
  const fine = async () => {
    const t = agTrascina; if(!t) return;
    agTrascina = null;
    t.cont.insertBefore(t.el, t.posto); t.posto.remove();
    t.el.classList.remove("ag-preso"); t.el.style.width = t.el.style.left = t.el.style.top = "";
    const dopo = agOrdineDom();
    if(dopo.join() === t.ordinePrima.join()) return;
    await agSalvaOrdine(dopo, t.tipo === "ev" ? t.el.dataset.ev : null);
  };
  box.addEventListener("pointerup", fine);
  box.addEventListener("pointercancel", fine);
}
function agOrdineDom(){ return [...document.querySelectorAll(".ag-pannello .ag-ev[data-ev]")].map(x => x.dataset.ev); }
async function agSalvaOrdine(ids, spostato){
  const ev = id => agEventiCache[id];
  // scambio degli orari: il cavallo spostato è finito prima (o dopo) di uno con orario diverso nello stesso cliente
  let scambio = null;
  if(spostato && ev(spostato)?.ora){
    const m = ev(spostato), pos = ids.indexOf(spostato);
    const stessoCli = x => ev(x) && ev(x).cliente_mascalcia_id === m.cliente_mascalcia_id && ev(x).ora && x !== spostato;
    const dopo = ids.slice(pos + 1).find(stessoCli), prima = ids.slice(0, pos).reverse().find(stessoCli);
    const hm = x => String(ev(x).ora).slice(0, 5);
    if(dopo && hm(dopo) < hm(spostato)) scambio = dopo;
    else if(prima && hm(prima) > hm(spostato)) scambio = prima;
  }
  // salva il nuovo ordine (solo le righe che cambiano posizione)
  const cambi = ids.map((id, n) => ({ id, n })).filter(x => ev(x.id) && ev(x.id).ordine_giro !== x.n);
  for(const c of cambi){
    const { error } = await DB.updateInterventoMascalcia(c.id, { ordine_giro: c.n });
    if(error){ showToast("Ordine non salvato: " + error.message); break; }
    ev(c.id).ordine_giro = c.n;
  }
  if(scambio){
    const a = ev(spostato), b = ev(scambio), oa = String(a.ora).slice(0, 5), ob = String(b.ora).slice(0, 5);
    const si = await chiediSiNo("Scambiare anche gli orari?", `Hai messo ${agNomeCavallo(a) || "questo cavallo"} (${oa}) ${ids.indexOf(spostato) < ids.indexOf(scambio) ? "prima" : "dopo"} di ${agNomeCavallo(b) || "un altro"} (${ob}). Sì: ${agNomeCavallo(a) || "il primo"} alle ${ob} e ${agNomeCavallo(b) || "l'altro"} alle ${oa}; i clienti collegati ricevono l'avviso. No: cambia solo l'ordine del giro.`);
    if(si){
      for(const [x, nuova] of [[a, ob], [b, oa]]){
        const prec = { data: x.data_intervento, ora: String(x.ora).slice(0, 5), cliente: x.cliente_mascalcia_id, tipo_ferratura: x.tipo_ferratura, tipo_altro: x.tipo_altro || "" };
        const { error } = await DB.updateInterventoMascalcia(x.id, { ora: nuova });
        if(error){ showToast("Orario non cambiato: " + error.message); continue; }
        x.ora = nuova;
        if(!x.gruppo_id && x.stato === "programmato")
          await avvisaClienteAppuntamento("modificato", { cliente_mascalcia_id: x.cliente_mascalcia_id, tipo_ferratura: x.tipo_ferratura, tipo_altro: x.tipo_altro, data_intervento: x.data_intervento, ora: nuova, cavallo: agNomeCavallo(x) }, prec);
      }
      showToast("Orari scambiati");
    }
  }
  if(!scambio) showToast("Ordine del giro salvato");
  await renderAgendaSettimana();
  try{ await renderProDeadlines(); }catch(_){}
}
function toggleGiornoAgenda(iso){
  // un giorno alla volta: aprirne uno chiude gli altri
  agGiorniAperti = agGiorniAperti && agGiorniAperti.has(iso) ? new Set() : new Set([iso]);
  agDisegnaGriglia();
  const t = document.querySelector(`.ag-tile[data-iso="${iso}"]`);
  if(t){ t.focus({ preventScroll: true }); const r = t.getBoundingClientRect(); if(r.top < 60) t.scrollIntoView({ block: "start", behavior: "smooth" }); }
}
function cambiaSettimanaAgenda(delta){
  agSettimanaOffset += delta;
  agGiorniAperti = new Set();
  renderAgendaSettimana(delta);
}
function tornaSettimanaCorrente(){
  const delta = -agSettimanaOffset;
  agSettimanaOffset = 0;
  agGiorniAperti = null;
  renderAgendaSettimana(delta || null);
}

// swipe: sinistra = settimana successiva, destra = precedente
function agAttivaSwipe(box){
  if(box.dataset.swipe) return;
  box.dataset.swipe = "1";
  let x0 = null, y0 = null, t0 = 0;
  box.addEventListener("touchstart", e => { if(e.target.closest && e.target.closest(".ag-mani")){ x0 = null; return; } const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; t0 = Date.now(); }, { passive: true });
  box.addEventListener("touchend", e => {
    if(x0 === null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - x0, dy = t.clientY - y0;
    x0 = null;
    if(Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && Date.now() - t0 < 800){
      cambiaSettimanaAgenda(dx < 0 ? 1 : -1);
    }
  }, { passive: true });
}

function nuovoAppuntamentoGiorno(iso){
  openInterventoModal(null, null, { data_intervento: iso });
}
function fissaDaScadenza(id){
  const sc = agEventiCache["sc:" + id];
  if(!sc) return;
  openInterventoModal(sc.cliente_mascalcia_id, null, {
    tipo_ferratura: sc.tipo_ferratura, tipo_altro: sc.tipo_altro,
    misura_sistema: sc.misura_sistema, numero_ferro: sc.numero_ferro, quantita_ferri: sc.quantita_ferri,
    data_intervento: sc.data_vista || sc.prossima_scadenza, cavallo_cliente_id: sc.cavallo_cliente_id, horse_id: sc.horse_id
  });
}

// «Fatto» su un appuntamento di un giorno futuro: si chiede conferma e la data diventa oggi
// (null = annullato dall'utente; {} = nessun cambio; { data_intervento } = anticipato a oggi)
function fattoInAnticipo(e){
  const oggi = isoLocale(new Date());
  if(!e || !e.data_intervento || e.data_intervento <= oggi) return {};
  if(e.gruppo_id){ showToast("È un appuntamento con la scuderia: segnalo fatto il giorno dell'intervento."); return null; }
  const quando = formatDataBreve(e.data_intervento);
  if(!confirm(`Questo appuntamento è per ${quando}. L'hai già fatto oggi?\n\nSe confermi lo segno fatto con la data di oggi.`)) return null;
  return { data_intervento: oggi };
}
async function segnaFattoAgenda(id){
  const e = agEventiCache[id];
  const anticipo = fattoInAnticipo(e);
  if(anticipo === null) return;
  const upd = { stato: "fatto", ...anticipo };
  if(e){
    // riquadro del «Fatto»: richiamo (se previsto), importo proposto e pagamento
    const ps = await richiamoPerFatto({ ...e, ...anticipo });
    if(TIPO_FERRATURA_INTERVALLI[e.tipo_ferratura]) upd.prossima_scadenza = ps;
    const pag = prendiPagamentoScelto(); if(pag) upd.stato_pagamento = pag;
    const imp = prendiImportiScelti(); if(imp) upd.importo = imp[0];
    const fs = prendiFerriScelti(); if(fs){ upd.ferri_nuovi = fs.nuovi; if(fs.nuovi) upd.quantita_ferri = fs.n; }
  }
  const { error } = await DB.updateInterventoMascalcia(id, upd);
  if(error){ showToast("Errore: " + error.message); return; }
  showToast("Segnato come fatto");
  await renderAgendaSettimana();
  await renderIncassi();
  await renderProDeadlines();
}

function apriAzioniEvento(id){
  const e = agEventiCache[id];
  if(!e) return;
  agEventoAzioniId = id;
  const [y, m, d] = e.data_intervento.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  document.getElementById("azioni-evento-titolo").textContent =
    (e.clienti_mascalcia?.nome || "Appuntamento") + (agNomeCavallo(e) ? " · " + agNomeCavallo(e) : "");
  document.getElementById("azioni-evento-dettaglio").innerHTML = [
    `${AG_GIORNI[(dt.getDay() + 6) % 7]} ${d} ${AG_MESI_LUNGHI[m - 1]}${e.ora ? " · ore " + String(e.ora).slice(0, 5) : ""}`,
    escapeHtml(agDescrizioneTipoPro(e)),
    '<span class="solo-incassi">' + (e.importo != null ? "€ " + Number(e.importo).toFixed(2) + " · " : "") + (e.stato_pagamento === "saldato" ? "Saldato" : "Da saldare") + "</span>",
    e.stato === "fatto" ? '<span style="color:var(--green);font-weight:700">✓ Fatto</span>' : e.stato === "richiesto" ? '<span style="color:var(--accent);font-weight:700">Richiesta del cliente · da confermare</span>' : e.stato === "proposto" ? '<span style="color:var(--accent);font-weight:700">In attesa della conferma della scuderia</span>' : "Da fare",
    notaModificaMan(e, true),
    e.gruppo_id ? '<span class="muted" style="font-size:12px">Appuntamento con una scuderia su Equo Scuderia: se cambi servizio, data o ora, la scuderia deve riconfermare.</span>' : "",
    e.note ? escapeHtml(e.note) : ""
  ].filter(Boolean).join("<br>");
  const btnFatto = document.getElementById("azioni-evento-fatto");
  btnFatto.textContent = e.stato === "richiesto" ? "Accetta e conferma" : e.stato === "fatto" ? "Rimetti da fare" : "Segna come fatto";
  btnFatto.style.display = e.stato === "proposto" ? "none" : "";
  const btnAnnStr = document.getElementById("azioni-evento-annulla-struttura");
  if(btnAnnStr) btnAnnStr.style.display = e.gruppo_id && ["proposto","programmato"].includes(e.stato) ? "" : "none";
  const btnElim = document.getElementById("azioni-evento-elimina");
  if(btnElim) btnElim.style.display = e.gruppo_id && e.stato !== "fatto" ? "none" : "";
  openModal("modal-azioni-evento");
}

async function azioneEvento(tipo){
  const e = agEventiCache[agEventoAzioniId];
  if(!e) return;
  if(tipo === "modifica"){
    closeModal("modal-azioni-evento");
    openInterventoModal(null, e);
  } else if(tipo === "annulla_struttura" && e.gruppo_id){
    if(!confirm("Annullare l'appuntamento con la scuderia (tutti i cavalli)? La scuderia riceve un avviso in chat.")) return;
    closeModal("modal-azioni-evento");
    await azioneGruppoStruttura(e.gruppo_id, "annulla");
  } else if(tipo === "fatto" && e.stato === "richiesto"){
    closeModal("modal-azioni-evento");
    accettaRichiesta(e.id);
  } else if(tipo === "fatto"){
    const nuovo = e.stato === "fatto" ? "programmato" : "fatto";
    const anticipo = nuovo === "fatto" ? fattoInAnticipo(e) : {};
    if(anticipo === null) return;
    const upd = { stato: nuovo, ...anticipo };
    if(nuovo === "fatto"){
      closeModal("modal-azioni-evento");
      const ps = await richiamoPerFatto({ ...e, ...anticipo });
      if(TIPO_FERRATURA_INTERVALLI[e.tipo_ferratura]) upd.prossima_scadenza = ps;
      const pag = prendiPagamentoScelto(); if(pag) upd.stato_pagamento = pag;
      const imp = prendiImportiScelti(); if(imp) upd.importo = imp[0];
      const fs = prendiFerriScelti(); if(fs){ upd.ferri_nuovi = fs.nuovi; if(fs.nuovi) upd.quantita_ferri = fs.n; }
    }
    const { error } = await DB.updateInterventoMascalcia(e.id, upd);
    if(error){ showToast("Errore: " + error.message); return; }
    closeModal("modal-azioni-evento");
    showToast(nuovo === "fatto" ? "Segnato come fatto" : "Rimesso da fare");
    await renderAgendaSettimana();
    await renderIncassi();
    await renderProDeadlines();
  } else if(tipo === "elimina"){
    if(!confirm(deveAvvisareAnnullo(e) ? "Eliminare questo appuntamento? Il cliente riceve l'avviso in chat." : "Eliminare questo appuntamento?")) return;
    const { error } = await DB.deleteInterventoMascalcia(e.id);
    if(error){ showToast("Errore: " + error.message); return; }
    if(deveAvvisareAnnullo(e)) await avvisaClienteAppuntamento("annullato", { ...e, cavallo: agNomeCavallo(e) });
    closeModal("modal-azioni-evento");
    showToast("Appuntamento eliminato");
    await renderAgendaSettimana();
    await renderIncassi();
    await renderProDeadlines();
  } else if(tipo === "pdf"){
    if(typeof generaPdfEvento === "function") return generaPdfEvento(e);
    showToast("PDF disponibile a breve");
  } else if(tipo === "chat"){
    if(typeof inviaEventoInChat === "function") return inviaEventoInChat(e);
    showToast("Invio in chat disponibile a breve");
  }
}


export { agAttivaSwipe, agAttivaTrascina, agOrdinaGiro, apriAzioniEvento, azioneEvento, cambiaSettimanaAgenda, fissaDaScadenza, nuovoAppuntamentoGiorno, segnaFattoAgenda, toggleGiornoAgenda, tornaSettimanaCorrente };
