/* ---------- 3) Lente: ricerca in tutta l'app ---------- */
let cercaTuttoDati = null, cercaTuttoTimer = null, cercaTuttoVista = null;
function apriCercaTutto(){
  const ov = document.getElementById("cerca-tutto");
  if(!ov) return;
  const vista = vistaAi();
  if(cercaTuttoVista !== vista){ cercaTuttoDati = null; cercaTuttoVista = vista; }
  ov.classList.add("on");
  document.body.classList.add("ct-aperta");
  const inp = document.getElementById("ct-input");
  inp.placeholder = vista === "professionista" ? "Cerca clienti, cavalli, appuntamenti, chat…" : "Cerca cavalli, libretto, spese, chat…";
  inp.value = "";
  cercaTuttoMostra();
  setTimeout(() => inp.focus(), 60);
  // dati sempre freschi a ogni apertura (in rete: pochi secondi; offline: copia sul telefono)
  cercaTuttoCarica().then(() => cercaTuttoMostra());
}
function chiudiCercaTutto(){
  document.getElementById("cerca-tutto")?.classList.remove("on");
  document.body.classList.remove("ct-aperta");
}
const CT_SEZIONI = {
  proprietario: [
    { t: "Home", k: "inizio scadenze", az: () => showPage("home") },
    { t: "I miei cavalli", k: "cavalli scheda", az: () => { showPage("cavalli"); typeof closeHorseDetail === "function" && closeHorseDetail(); } },
    { t: "Aggiungi un cavallo", k: "nuovo cavallo", az: () => openHorseForm() },
    { t: "Chat", k: "messaggi maniscalco scuderia proprietari", az: () => document.querySelector('[data-page="chat"]')?.click() },
    { t: "Calendario e lezioni", k: "prenotazioni lezioni calendario", az: () => document.querySelector('[data-page="prenotazioni"]')?.click() },
    { t: "Registro spese", k: "spese costi", az: () => document.querySelector('[data-page="spese"]')?.click() },
    { t: "Nuova spesa", k: "aggiungi spesa", az: () => { document.querySelector('[data-page="spese"]')?.click(); openAddExpenseModal(); } },
    { t: "Profilo e impostazioni", k: "account menu piano premium esci", az: () => openMenu() },
  ],
  professionista: [
    { t: "Home", k: "inizio richiami", az: () => showPage("pro-home") },
    { t: "Agenda", k: "appuntamenti calendario settimana", az: () => showPage("pro-agenda") },
    { t: "Nuovo appuntamento", k: "intervento ferratura pareggio", az: () => openInterventoModal() },
    { t: "Clienti", k: "clienti elenco", az: () => { showPage("pro-clienti"); typeof closeClienteDetail === "function" && closeClienteDetail(); } },
    { t: "Nuovo cliente", k: "aggiungi cliente", az: () => { showPage("pro-clienti"); apriNuovoCliente("proprietario"); } },
    { t: "Messaggi", k: "chat inbox colleghi strutture", az: () => document.querySelector('[data-page="pro-inbox"]')?.click() },
    { t: "Incassi", k: "pagamenti da saldare soldi", az: () => showPage("pro-incassi") },
    { t: "Profilo e impostazioni", k: "account menu piano premium esci", az: () => openMenu() },
  ],
};
async function cercaTuttoCarica(){
  const vista = cercaTuttoVista;
  const sicuro = p => Promise.resolve().then(p).catch(e => { console.warn("ricerca:", e); return []; });
  const d = {};
  if(vista === "professionista"){
    const [clienti, cavalli, interventi, inbox, colleghi] = await Promise.all([
      sicuro(() => clientiMascalcia.length ? clientiMascalcia : DB.listClientiMascalcia()),
      sicuro(() => caricaCavalliMiei()),
      sicuro(() => DB.listInterventiMascalciaTutti()),
      sicuro(() => DB.listInboxMascalcia()),
      sicuro(() => DB.listColleghi()),
    ]);
    if(!clientiMascalcia.length && clienti.length) clientiMascalcia = clienti;
    d.clienti = clienti; d.cavalli = cavalli; d.interventi = interventi; d.inbox = inbox; d.colleghi = colleghi;
  } else {
    const ids = (horses || []).map(h => h.id);
    const [eventi, spese, lezioni, conv, maniscalchi, scuderie] = await Promise.all([
      sicuro(() => ids.length ? DB.listEventiTutti(ids) : []),
      sicuro(() => DB.listExpenses()),
      sicuro(() => DB.listLezioni()),
      sicuro(() => DB.listConversazioniProprietario()),
      sicuro(() => DB.listManiscalchiCollegati()),
      sicuro(() => DB.listScuderieCollegate()),
    ]);
    d.eventi = eventi; d.spese = spese; d.lezioni = lezioni; d.conv = conv; d.maniscalchi = maniscalchi; d.scuderie = scuderie;
  }
  if(cercaTuttoVista === vista) cercaTuttoDati = d;
}
let ctAzioni = [];
function ctRiga(icona, titolo, sotto, az){
  ctAzioni.push(az);
  return `<button type="button" class="ct-riga" data-i="${ctAzioni.length - 1}"><span class="ct-ico"><i class="fa-solid ${icona}"></i></span><span class="ct-testi"><b>${escapeHtml(titolo)}</b>${sotto ? `<small>${escapeHtml(sotto)}</small>` : ""}</span><span class="ct-freccia">›</span></button>`;
}
function ctGruppo(titolo, righe, max = 6){
  if(!righe.length) return "";
  return `<div class="ct-gruppo"><div class="ct-titolo">${escapeHtml(titolo)}${righe.length > max ? ` <span>(${righe.length})</span>` : ""}</div>${righe.slice(0, max).join("")}${righe.length > max ? `<div class="ct-altri">e altri ${righe.length - max}: aggiungi una parola per restringere</div>` : ""}</div>`;
}
function cercaTuttoMostra(){
  const out = document.getElementById("ct-risultati");
  if(!out) return;
  const q = document.getElementById("ct-input").value;
  const parole = cercaParole(q);
  ctAzioni = [];
  const vista = cercaTuttoVista;
  const ok = (...campi) => cercaCorrisponde(parole, campi.filter(Boolean).join(" "));
  const vai = fn => () => { chiudiCercaTutto(); fn(); };
  if(!parole.length){
    out.innerHTML = `<div class="ct-gruppo"><div class="ct-titolo">Vai a</div>${CT_SEZIONI[vista].filter(s => !(incassiNascosti() && s.t === "Incassi")).map(s => ctRiga("fa-arrow-right", s.t, "", vai(s.az))).join("")}</div>
      <div class="ct-suggerimento">${vista === "professionista" ? "Scrivi il nome di un cliente o di un cavallo, una data (es. 12/10) o una parola come «ferratura» o «da saldare»." : "Scrivi il nome di un cavallo, «vaccino», «fieno», il nome del maniscalco o della scuderia."}</div>`;
    return;
  }
  const d = cercaTuttoDati || {};
  let html = "";
  const sezioni = CT_SEZIONI[vista].filter(s => !(incassiNascosti() && s.t === "Incassi")).filter(s => ok(s.t, s.k)).map(s => ctRiga("fa-arrow-right", s.t, "Sezione", vai(s.az)));
  if(vista === "professionista"){
    const clienti = (d.clienti || clientiMascalcia || []).filter(c => ok(c.nome, c.telefono, paroleCercaCliente(c)))
      .map(c => ctRiga(isStruttura(c) ? "fa-building" : "fa-user", c.nome, [nomiCavalliCliente(c).join(", "), c.telefono].filter(Boolean).join(" · ") || (isStruttura(c) ? "Scuderia" : "Cliente"),
        vai(() => { showPage("pro-clienti"); openClienteDetail(c.id); })));
    const nomeCliente = id => ((d.clienti || clientiMascalcia || []).find(c => c.id === id) || {}).nome || "";
    const cavalli = (d.cavalli || []).filter(c => ok(c.nome, c.microchip, nomeCliente(c.cliente_mascalcia_id)))
      .map(c => ctRiga("fa-horse-head", c.nome || "Cavallo", "di " + (nomeCliente(c.cliente_mascalcia_id) || "cliente"), vai(() => { showPage("pro-clienti"); openClienteDetail(c.cliente_mascalcia_id); })));
    const tipo = i => (TIPO_FERRATURA_LABELS[i.tipo_ferratura] || i.tipo_ferratura || "Intervento") + (i.tipo_ferratura === "altro" && i.tipo_altro ? " · " + i.tipo_altro : "");
    const interventi = (d.interventi || []).filter(i => ok(i.clienti_mascalcia?.nome, i.cavalli_clienti_mascalcia?.nome, tipo(i), formatDate(i.data_intervento), i.data_intervento, i.note,
        i.stato === "programmato" ? "da fare programmato" : "fatto", incassiNascosti() ? "" : (i.stato_pagamento === "saldato" ? "saldato pagato" : "da saldare non pagato")))
      .map(i => ctRiga(i.stato === "programmato" ? "fa-calendar-day" : "fa-check", [i.cavalli_clienti_mascalcia?.nome, i.clienti_mascalcia?.nome].filter(Boolean).join(" · ") || tipo(i),
        `${tipo(i)} · ${formatDate(i.data_intervento)}${i.ora ? " " + String(i.ora).slice(0, 5) : ""}${i.stato === "programmato" ? " · da fare" : ""}${Number(i.importo) && !incassiNascosti() ? " · " + formatEuro(i.importo) + (i.stato_pagamento === "saldato" ? " saldato" : " da saldare") : ""}`,
        vai(() => openInterventoModal(null, i))));
    const visti = new Set();
    const chat = (d.inbox || []).filter(m => { if(visti.has(m.cliente_mascalcia_id)) return false; visti.add(m.cliente_mascalcia_id); return true; })
      .filter(m => ok(m.clienti_mascalcia?.nome || nomeCliente(m.cliente_mascalcia_id), m.testo))
      .map(m => ctRiga("fa-comment", m.clienti_mascalcia?.nome || nomeCliente(m.cliente_mascalcia_id) || "Cliente", m.testo || "Conversazione", vai(() => { document.querySelector('[data-page="pro-inbox"]')?.click(); openChatThread(m.cliente_mascalcia_id); })))
      .concat((d.colleghi || []).filter(c => ok(c.full_name || c.nome, ROLE_LABELS[c.ruolo], "collega"))
        .map(c => ctRiga("fa-user-doctor", c.full_name || c.nome || "Collega", ROLE_LABELS[c.ruolo] || "Collega", vai(() => { document.querySelector('[data-page="pro-inbox"]')?.click(); apriChatCollega(c.conversazione_id, c.full_name || c.nome || "Collega", c.ruolo || ""); }))));
    html = ctGruppo("Clienti", clienti) + ctGruppo("Cavalli dei clienti", cavalli) + ctGruppo("Appuntamenti e interventi", interventi, 8) + ctGruppo("Messaggi", chat) + ctGruppo("Sezioni", sezioni);
  } else {
    const cavalli = (horses || []).filter(h => ok(h.name, h.breed, h.microchip, h.mantello, h.note))
      .map(h => ctRiga("fa-horse-head", h.name, [h.breed, h.microchip ? "chip " + h.microchip : ""].filter(Boolean).join(" · ") || "Scheda cavallo", vai(() => { showPage("cavalli"); openHorseDetail(h.id); })));
    const nomeCav = id => ((horses || []).find(h => h.id === id) || {}).name || "";
    const eventi = (d.eventi || []).filter(e => ok(EVENT_LABELS[e.type] || e.type, e.notes, nomeCav(e.horse_id), formatDate(e.date), e.date, "libretto"))
      .map(e => ctRiga("fa-notes-medical", (EVENT_LABELS[e.type] || e.type) + " · " + nomeCav(e.horse_id), formatDate(e.date) + (e.next_due_date ? " · prossima " + formatDate(e.next_due_date) : "") + (e.notes ? " · " + e.notes : ""),
        vai(async () => { showPage("cavalli"); await openHorseDetail(e.horse_id); if(typeof openEditEventModal === "function") openEditEventModal(e.id); })));
    const spese = (d.spese || []).filter(s => ok(s.category, s.notes, s.horses?.name, formatDate(s.date), s.date, String(s.amount), "spesa"))
      .map(s => ctRiga("fa-euro-sign", `${s.category ? s.category.charAt(0).toUpperCase() + s.category.slice(1) : "Spesa"} · € ${Number(s.amount || 0).toFixed(2)}`, [formatDate(s.date), s.horses?.name, s.notes].filter(Boolean).join(" · "),
        vai(() => { document.querySelector('[data-page="spese"]')?.click(); currentExpensesData = d.spese || []; openEditExpenseModal(s.id); })));
    const lezioni = (d.lezioni || []).filter(l => ok(l.tipo, l.note, l.horses?.name, formatDate(l.data), l.data, "lezione"))
      .map(l => ctRiga("fa-person-chalkboard", (l.tipo ? l.tipo.charAt(0).toUpperCase() + l.tipo.slice(1) : "Lezione") + (l.horses?.name ? " · " + l.horses.name : ""), formatDate(l.data) + (l.note ? " · " + l.note : ""),
        vai(() => document.querySelector('[data-page="prenotazioni"]')?.click())));
    const chat = (d.maniscalchi || []).filter(m => ok(m.nome_maniscalco, "maniscalco", m.ultimo_testo))
      .map(m => ctRiga("fa-hammer", m.nome_maniscalco || "Il tuo maniscalco", "Maniscalco" + (m.ultimo_testo ? " · " + m.ultimo_testo : ""), vai(() => { showPage("chat"); loadFarrierChatSection().then(() => openFarrierChatThread(m.cliente_mascalcia_id, m.nome_maniscalco || "Il tuo maniscalco")); })))
      .concat((d.scuderie || []).filter(s => ok(s.nome, "scuderia maneggio"))
        .map(s => ctRiga("fa-warehouse", s.nome, "Scuderia", vai(() => { showPage("chat"); loadStableChatSection().then(() => openStableChatThread(s.membro_id, s.centro_id, s.nome)); }))))
      .concat((d.conv || []).filter(c => ok(c.altro?.full_name, c.ultimoMessaggio?.testo, "proprietario"))
        .map(c => ctRiga("fa-comment", c.altro?.full_name || "Utente Equo", c.ultimoMessaggio?.testo || "Conversazione", vai(() => { showPage("chat"); loadOwnerChatList().then(() => openOwnerChatThread(c.id, c.altro?.full_name || "Utente Equo")); }))));
    html = ctGruppo("Cavalli", cavalli) + ctGruppo("Libretto sanitario", eventi, 8) + ctGruppo("Spese", spese) + ctGruppo("Lezioni", lezioni) + ctGruppo("Chat", chat) + ctGruppo("Sezioni", sezioni);
  }
  out.innerHTML = html || (cercaTuttoDati
    ? `<div class="ct-nulla">Nessun risultato per «${escapeHtml(q.trim())}»</div>`
    : '<div class="ct-nulla"><div class="spinner" style="margin:0 auto 10px"></div>Sto cercando…</div>');
}
function cercaTuttoInit(){
  const ov = document.getElementById("cerca-tutto");
  if(!ov || ov.dataset.pronto) return;
  ov.dataset.pronto = "1";
  const inp = document.getElementById("ct-input");
  inp.addEventListener("input", () => { clearTimeout(cercaTuttoTimer); cercaTuttoTimer = setTimeout(cercaTuttoMostra, 80); });
  inp.addEventListener("keydown", e => {
    if(e.key === "Escape") chiudiCercaTutto();
    if(e.key === "Enter"){ const primo = document.querySelector("#ct-risultati .ct-riga"); if(primo) primo.click(); }
  });
  document.getElementById("ct-risultati").addEventListener("click", e => {
    const b = e.target.closest(".ct-riga"); if(!b) return;
    const az = ctAzioni[Number(b.dataset.i)];
    if(az) az();
  });
  document.querySelectorAll(".ct-apri").forEach(el => el.innerHTML = el.innerHTML.replace("{{lente}}", CERCA_LENTE_SVG));
}
function cercaAvvio(){ try{ cercaInitElenchi(); cercaTuttoInit(); }catch(e){ console.warn("ricerca:", e); } }
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", cercaAvvio); else setTimeout(cercaAvvio, 0);

