/* ---------- PROPRIETARIO ---------- */
let wgOwn = { scadenze: null, spese: null, appuntamento: null, lezioni: null, unread: 0, caricato: 0 };
async function wgCaricaOwner(){
  if(!currentUser || DEMO_MODE && !demoState) return;
  const ids = (horses || []).map(h => h.id);
  const sicuro = p => Promise.resolve().then(p).catch(e => { console.warn("widget:", e); return null; });
  const [scad, spese, man, lez, unread] = await Promise.all([
    sicuro(() => ids.length ? DB.listUpcomingDeadlines(ids, 6) : []),
    sicuro(() => DB.listExpenses()),
    sicuro(() => DEMO_MODE ? [] : DB.listManiscalchiCollegati()),
    sicuro(async () => { if(DEMO_MODE) return []; const r = await sb.rpc("mie_lezioni_scuderia"); return r.error ? [] : (r.data || []); }),
    sicuro(() => DEMO_MODE ? 0 : computeChatUnreadTotal()),
  ]);
  wgOwn.scadenze = scad || [];
  wgOwn.spese = spese || [];
  wgOwn.lezioni = lez || [];
  wgOwn.unread = Number(unread) || 0;
  // prossimo appuntamento: ferrature dai maniscalchi collegati + lezioni della scuderia
  const oggi = isoLocale(new Date());
  const cand = [];
  for(const f of (man || [])){
    const lista = await sicuro(() => DB.listAppuntamentiCliente(f.cliente_mascalcia_id)) || [];
    lista.filter(a => a.data_intervento >= oggi && ["programmato", "richiesto"].includes(a.stato)).forEach(a => cand.push({
      tipo: "maniscalco", data: a.data_intervento, ora: a.ora ? String(a.ora).slice(0, 5) : "", titolo: (TIPO_FERRATURA_LABELS[a.tipo_ferratura] || "Appuntamento") + (a.nome_cavallo ? " · " + a.nome_cavallo : ""),
      chi: f.nome_maniscalco || "Il tuo maniscalco", stato: a.stato, modifica: a.modifica && a.modifica.prima ? a.modifica : null, f }));
  }
  (wgOwn.lezioni || []).filter(l => l.data >= oggi && !["annullata", "completata"].includes(l.stato)).forEach(l => cand.push({
    tipo: "lezione", data: l.data, ora: l.ora ? String(l.ora).slice(0, 5) : "", titolo: "Lezione" + (l.cavallo ? " · " + l.cavallo : ""),
    chi: [l.scuderia, l.istruttore ? "con " + l.istruttore : ""].filter(Boolean).join(" · "), stato: l.stato, l }));
  cand.sort((a, b) => (a.data + a.ora).localeCompare(b.data + b.ora));
  wgOwn.appuntamento = cand[0] || null;
  wgOwn.appMan = cand.filter(c => c.tipo === "maniscalco");
  wgOwn.caricato = Date.now();
  if(vistaWidgetAttiva() && vistaAi() === "proprietario") renderWidgetOwner(true);
}
function wgGiorniA(iso){ return giorniTra(isoLocale(new Date()), String(iso).slice(0, 10)); }
function wgQuandoScad(g){ return g < 0 ? `scaduta da ${-g} ${-g === 1 ? "giorno" : "giorni"}` : g === 0 ? "scade oggi" : g === 1 ? "scade domani" : `tra ${g} giorni`; }
function renderWidgetOwner(daCarica){
  const box = document.getElementById("wh-owner");
  if(!box || !currentUser) return;
  if(!horses || !horses.length){ box.innerHTML = ""; return; }
  if(!daCarica && Date.now() - wgOwn.caricato > 30000) wgCaricaOwner();
  const scad = wgOwn.scadenze;
  const oggi = isoLocale(new Date());
  // appuntamenti già fissati con il maniscalco: compaiono anche tra le prossime scadenze
  const appMan = (wgOwn.appMan || []).slice(0, 4);
  const rigaAppMan = a => `<div class="wg-ric" onclick="wgApriAppMan('${a.f.cliente_mascalcia_id}')"><span class="wg-sem ${a.stato === "richiesto" || a.modifica ? "ocra" : "verde"}"></span><span class="wg-t"><b>${a.modifica ? "✏️ " : ""}${wgEsc(a.titolo)}</b><small>${a.modifica ? "<b>Modificato</b> (prima: " + wgEsc(testoPrimaModifica(a.modifica)) + ") · " : ""}${a.stato === "richiesto" ? "richiesto a " : "fissato con "}${wgEsc(a.chi)} · ${wgEsc(a.data === oggi ? "oggi" : hpGiornoEtichetta(a.data).toLowerCase())}${a.ora ? " " + a.ora : ""}</small></span></div>`;
  // SCADENZE (grande)
  let scadHtml;
  if(scad == null) scadHtml = '<div class="wg-vuoto piccolo">Caricamento…</div>';
  else if(!scad.length && appMan.length) scadHtml = appMan.map(rigaAppMan).join("");
  else if(!scad.length) scadHtml = '<div class="wg-vuoto">Nessuna scadenza in arrivo.<br><button class="wg-link" onclick="wgNuovoEvento()">+ Registra un vaccino o una ferratura</button></div>';
  else {
    const p = scad[0], g = wgGiorniA(p.next_due_date);
    const ferr = p.type === "ferratura";
    const nomeP = String(p.horses?.name || "").toLowerCase();
    const giaFissato = ferr && nomeP ? appMan.find(x => String(x.titolo).toLowerCase().endsWith("· " + nomeP)) : null;
    const haMan = !!document.querySelector("#farrier-chat-list .inbox-item") || (wgOwn.appuntamento && wgOwn.appuntamento.tipo === "maniscalco");
    scadHtml = `
      <div class="wg-prossimo ${g < 0 ? "rosso" : ""}" onclick="showPage('cavalli');openHorseDetail('${p.horse_id}')">
        <div class="wg-quando">${wgEsc(wgQuandoScad(g))} · ${formatDate(p.next_due_date)}</div>
        <div class="wg-chi">${wgEsc(EVENT_LABELS[p.type] || p.type)} · ${wgEsc(p.horses?.name || "")}</div>
        <div class="wg-azioni">
          ${ferr && giaFissato ? `<button class="oro" onclick="event.stopPropagation();wgApriAppMan('${giaFissato.f.cliente_mascalcia_id}')">${WG_IC.cal}Fissato: ${wgEsc(giaFissato.data === oggi ? "oggi" : hpGiornoEtichetta(giaFissato.data).toLowerCase())}${giaFissato.ora ? " " + giaFissato.ora : ""}</button>` : ferr ? `<button class="oro" onclick="event.stopPropagation();wgFissaManiscalco()">${WG_IC.cal}Fissa con il maniscalco</button>` : `<button class="oro" onclick="event.stopPropagation();showPage('cavalli');openHorseDetail('${p.horse_id}')">${WG_IC.scad}Apri il libretto</button>`}
        </div>
      </div>
      ${[...scad.slice(1, 4).map(d => ({ k: d.next_due_date, h: (() => { const gg = wgGiorniA(d.next_due_date); return `<div class="wg-ric" onclick="showPage('cavalli');openHorseDetail('${d.horse_id}')"><span class="wg-sem ${gg < 0 ? "rosso" : gg <= 14 ? "ocra" : "verde"}"></span><span class="wg-t"><b>${wgEsc(EVENT_LABELS[d.type] || d.type)}</b> · ${wgEsc(d.horses?.name || "")}<small>${wgEsc(wgQuandoScad(gg))} · ${formatDate(d.next_due_date)}</small></span></div>`; })() })),
          ...appMan.map(a => ({ k: a.data, h: rigaAppMan(a) }))].sort((x, y) => String(x.k).localeCompare(String(y.k))).slice(0, 4).map(x => x.h).join("")}`;
  }
  // SPESE
  const spese = wgOwn.spese || [];
  const inizio = new Date(); inizio.setDate(1); inizio.setHours(0, 0, 0, 0);
  const inizioPrec = new Date(inizio); inizioPrec.setMonth(inizioPrec.getMonth() - 1);
  const mese = spese.filter(e => new Date(e.date) >= inizio).reduce((t, e) => t + Number(e.amount || 0), 0);
  const prec = spese.filter(e => new Date(e.date) >= inizioPrec && new Date(e.date) < inizio).reduce((t, e) => t + Number(e.amount || 0), 0);
  const diff = mese - prec;
  // APPUNTAMENTO
  const a = wgOwn.appuntamento;
  const quandoA = a ? (a.data === oggi ? "Oggi" : a.data === aggiungiGiorniIso(oggi, 1) ? "Domani" : hpGiornoEtichetta(a.data)) + (a.ora ? " · " + a.ora : "") : "";
  // LEZIONI settimana
  const fra7 = aggiungiGiorniIso(oggi, 7);
  const lezSett = (wgOwn.lezioni || []).filter(l => l.data >= oggi && l.data <= fra7 && !["annullata"].includes(l.stato));
  const ultimo = typeof homeLastMessageTarget !== "undefined" ? homeLastMessageTarget : null;

  box.innerHTML = `
    <div class="wg wg-grande">
      <div class="wg-testa"><span class="wg-et">${WG_IC.scad}Prossime scadenze</span><span class="wg-meta">${(scad && scad.length) || appMan.length ? ((scad ? scad.length : 0) + appMan.length) + " in arrivo" : ""}</span></div>
      ${scadHtml}
    </div>
    <div class="wg wg-piccolo wg-pieno" onclick="document.querySelector('[data-page=&quot;spese&quot;]')?.click()">
      <span class="wg-cerchio">${WG_IC.euro}</span>
      <div class="wg-num">${wgEuro(mese)}</div>
      <div class="wg-riga">spese di ${new Date().toLocaleDateString("it-IT", { month: "long" })}</div>
      <div class="wg-riga evid">${prec ? (diff > 0 ? "+" : diff < 0 ? "−" : "") + wgEuro(Math.abs(diff)).replace("€ ", "€ ") + " sul mese scorso" : "Registra le spese con +"}</div>
    </div>
    <div class="wg wg-piccolo" onclick="${ultimo ? "goToLastMessage()" : "document.querySelector('[data-page=&quot;chat&quot;]')?.click()"}">
      <span class="wg-et">${WG_IC.msg}Messaggi</span>${wgOwn.unread ? `<span class="wg-badge">${wgOwn.unread}</span>` : ""}
      <div class="wg-num">${wgOwn.unread} <small>${wgOwn.unread === 1 ? "non letto" : "non letti"}</small></div>
      <div class="wg-riga">${ultimo ? `<b>${wgEsc(ultimo.nome)}:</b> ${wgEsc(ultimo.testo || "")}` : "Nessun messaggio"}</div>
    </div>
    <div class="wg wg-medio">
      <div class="wg-testa"><span class="wg-et">${WG_IC.cal}Prossimo appuntamento</span></div>
      ${a ? `<div class="wg-app">
          <div class="wg-app-data">${wgEsc(quandoA)}${a.stato === "richiesto" || a.stato === "prenotata" ? ' <span class="wg-tag">da confermare</span>' : ""}</div>
          <div class="wg-app-tit">${wgEsc(a.titolo)}</div>
          <div class="wg-riga">${wgEsc(a.chi)}</div>
          <div class="wg-azioni chiaro"><button class="oro" onclick="wgChattaAppuntamento()">${WG_IC.msg}Chatta</button><button onclick="${a.tipo === "lezione" ? "document.querySelector('[data-page=&quot;prenotazioni&quot;]')?.click()" : "wgFissaManiscalco()"}">Apri</button></div>
        </div>` : '<div class="wg-vuoto piccolo">Nessun appuntamento in programma.</div>'}
    </div>
    <div class="wg wg-piccolo wg-pieno wg-azione" onclick="document.querySelector('[data-page=&quot;spese&quot;]')?.click();openAddExpenseModal()">
      <span class="wg-cerchio grande">${WG_IC.piu}</span>
      <div class="wg-riga forte">Nuova spesa</div>
    </div>
    <div class="wg wg-piccolo wg-pieno wg-azione" onclick="wgNuovoEvento()">
      <span class="wg-cerchio grande">${WG_IC.piu}</span>
      <div class="wg-riga forte">Nuovo evento<br><small>vaccino, ferratura…</small></div>
    </div>
    <div class="wg wg-medio">
      <div class="wg-testa"><span class="wg-et">${WG_IC.cav}I miei cavalli</span><button class="wg-link" onclick="showPage('cavalli');closeHorseDetail()">Tutti ›</button></div>
      <div class="wg-cavalli">${horses.slice(0, 8).map(h => `<button class="wg-cavallo" onclick="showPage('cavalli');openHorseDetail('${h.id}')"><span>${wgEsc((h.name || "?").charAt(0).toUpperCase())}</span><small>${wgEsc(h.name)}</small></button>`).join("")}
        <button class="wg-cavallo nuovo" onclick="openHorseForm()"><span>${WG_IC.piu}</span><small>Aggiungi</small></button></div>
    </div>
    ${(wgOwn.lezioni || []).length ? `<div class="wg wg-medio" onclick="document.querySelector('[data-page=&quot;prenotazioni&quot;]')?.click()">
      <div class="wg-testa"><span class="wg-et">${WG_IC.lez}Lezioni della settimana</span><span class="wg-meta">${lezSett.length}</span></div>
      ${lezSett.length ? lezSett.slice(0, 3).map(l => `<div class="wg-voce"><span class="wg-ora">${wgEsc(hpGiornoEtichetta(l.data))}</span><span class="wg-t">${l.ora ? String(l.ora).slice(0, 5) + " · " : ""}${wgEsc(l.cavallo || "Lezione")} <small>${wgEsc(l.istruttore ? "· " + l.istruttore : "")}</small></span></div>`).join("") : '<div class="wg-vuoto piccolo">Nessuna lezione nei prossimi 7 giorni.</div>'}
    </div>` : ""}`;
}
function wgApriAppMan(clienteId){
  showPage("chat");
  const f = (wgOwn.appMan || []).find(a => a.f.cliente_mascalcia_id === clienteId)?.f;
  if(typeof loadFarrierChatSection === "function") loadFarrierChatSection().then(() => { if(f) openFarrierChatThread(f.cliente_mascalcia_id, f.nome_maniscalco || "Il tuo maniscalco"); });
}
function wgFissaManiscalco(){
  showPage("chat");
  if(typeof loadFarrierChatSection === "function") loadFarrierChatSection().then(() => {
    const a = wgOwn.appuntamento;
    if(a && a.tipo === "maniscalco") openFarrierChatThread(a.f.cliente_mascalcia_id, a.f.nome_maniscalco || "Il tuo maniscalco");
  });
}
function wgChattaAppuntamento(){
  const a = wgOwn.appuntamento; if(!a) return;
  showPage("chat");
  if(a.tipo === "maniscalco") loadFarrierChatSection().then(() => openFarrierChatThread(a.f.cliente_mascalcia_id, a.f.nome_maniscalco || "Il tuo maniscalco"));
  else loadStableChatSection().then(async () => {
    const s = (await DB.listScuderieCollegate()).find(x => !a.l.scuderia || x.nome === a.l.scuderia) || null;
    if(s) openStableChatThread(s.membro_id, s.centro_id, s.nome);
  });
}
async function wgNuovoEvento(){
  if(!horses || !horses.length){ openHorseForm(); return; }
  if(horses.length === 1){ showPage("cavalli"); await openHorseDetail(horses[0].id); openAddEventModal(); return; }
  let ov = document.getElementById("modal-scegli-cavallo");
  if(!ov){
    ov = document.createElement("div"); ov.className = "modal-overlay"; ov.id = "modal-scegli-cavallo";
    ov.addEventListener("click", ev => { if(ev.target === ov) closeModal("modal-scegli-cavallo"); });
    document.body.appendChild(ov);
  }
  ov.innerHTML = `<div class="modal"><div class="modal-handle"></div><div class="modal-title">Per quale cavallo?</div>
    ${horses.map(h => `<button class="wg-app-mappa" onclick="closeModal('modal-scegli-cavallo');showPage('cavalli');openHorseDetail('${h.id}').then(openAddEventModal)"><i style="background:var(--surface2);display:flex;align-items:center;justify-content:center;color:var(--accent);font-weight:700">${wgEsc((h.name || "?").charAt(0))}</i>${wgEsc(h.name)}</button>`).join("")}
    <button class="btn btn-outline" style="width:100%;margin-top:6px" onclick="closeModal('modal-scegli-cavallo')">Annulla</button></div>`;
  openModal("modal-scegli-cavallo");
}

/* ==================== INCASSI NASCOSTI CON PIN ==================== */
function wgPin({ titolo, testo, passo, dimenticato }){
  return new Promise(resolve => {
    let ov = document.getElementById("pin-ov");
    if(!ov){ ov = document.createElement("div"); ov.id = "pin-ov"; document.body.appendChild(ov); }
    let cifre = "";
    const tasti = ["1","2","3","4","5","6","7","8","9","","0","⌫"];
    ov.className = "pin-ov on";
    ov.innerHTML = `<div class="pin-box">
      <div class="pin-lucch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg></div>
      <h3>${wgEsc(titolo)}</h3><p>${wgEsc(testo || "")}</p>
      <div class="pin-pallini"><i></i><i></i><i></i><i></i></div>
      <div class="pin-passo">${wgEsc(passo || "")}</div>
      <div class="pin-err" id="pin-err"></div>
      <div class="pin-tast">${tasti.map(t => t ? `<button type="button" data-t="${t}">${t}</button>` : "<span></span>").join("")}</div>
      ${dimenticato ? '<button type="button" class="pin-link" data-az="dim">PIN dimenticato?</button>' : ""}
      <button type="button" class="pin-link grigio" data-az="annulla">Annulla</button></div>`;
    const pallini = ov.querySelectorAll(".pin-pallini i");
    const aggiorna = () => pallini.forEach((p, i) => p.classList.toggle("p", i < cifre.length));
    const fine = v => { ov.className = "pin-ov"; document.removeEventListener("keydown", tastiera); resolve(v); };
    const premi = t => {
      if(t === "⌫"){ cifre = cifre.slice(0, -1); aggiorna(); return; }
      if(cifre.length >= 4) return;
      cifre += t; aggiorna();
      if(cifre.length === 4) setTimeout(() => fine(cifre), 160);
    };
    const tastiera = e => { if(/^[0-9]$/.test(e.key)) premi(e.key); else if(e.key === "Backspace") premi("⌫"); else if(e.key === "Escape") fine(null); };
    document.addEventListener("keydown", tastiera);
    ov.onclick = e => {
      const b = e.target.closest("button"); if(!b) return;
      if(b.dataset.t) premi(b.dataset.t);
      else if(b.dataset.az === "annulla") fine(null);
      else if(b.dataset.az === "dim") fine("__dimenticato__");
    };
  });
}
function wgPinErrore(msg){ showToast(msg); }
async function cambiaIncassi(mostra){
  const sw = document.getElementById("incassi-switch");
  const ripristina = () => { if(sw) sw.checked = !incassiNascosti(); };
  if(DEMO_MODE){ currentUser.incassiNascosti = !mostra; applicaVistaHome(); showToast(mostra ? "Incassi visibili" : "Incassi nascosti"); return; }
  try{
    if(!mostra){
      const { data: st } = await sb.rpc("incassi_stato");
      let pin = null;
      if(!st?.ha_pin){
        const p1 = await wgPin({ titolo: "Crea un PIN per gli incassi", testo: "Ti servirà per farli ricomparire. Scegli 4 cifre che ricordi facilmente.", passo: "Passo 1 di 2 · scegli il PIN" });
        if(!p1){ ripristina(); return; }
        const p2 = await wgPin({ titolo: "Ripeti il PIN", testo: "Per sicurezza scrivilo un'altra volta.", passo: "Passo 2 di 2 · ripeti il PIN" });
        if(!p2){ ripristina(); return; }
        if(p1 !== p2){ showToast("I due PIN non coincidono, riprova."); ripristina(); return; }
        pin = p1;
      }
      const { data, error } = await sb.rpc("incassi_nascondi", { p_pin: pin });
      if(error || !data?.ok) throw error || new Error("non riuscito");
      currentUser.incassiNascosti = true;
      applicaVistaHome();
      closeModal("modal-menu");
      showToast("Incassi nascosti in tutta l'app");
    } else {
      const p = await wgPin({ titolo: "Mostra gli incassi", testo: "Inserisci il PIN di 4 cifre che hai scelto quando li hai nascosti.", dimenticato: true });
      if(!p){ ripristina(); return; }
      if(p === "__dimenticato__"){ ripristina(); return wgPinDimenticato(); }
      const { data, error } = await sb.rpc("incassi_mostra", { p_pin: p });
      if(error) throw error;
      if(data?.ok){ currentUser.incassiNascosti = false; applicaVistaHome(); showToast("Incassi di nuovo visibili"); if(typeof renderIncassi === "function") renderIncassi(); return; }
      ripristina();
      if(data?.bloccato_fino) showToast("Troppi tentativi: riprova tra 5 minuti.");
      else showToast(`PIN errato. ${data?.rimasti != null ? "Tentativi rimasti: " + data.rimasti : ""}`);
    }
  } catch(e){
    console.error("incassi:", e);
    ripristina();
    showToast("Funzione non ancora attiva: serve l'aggiornamento del database.");
  }
}
async function wgPinDimenticato(){
  const ok = confirm("Per scegliere un nuovo PIN devi rientrare nel tuo account. Ti facciamo uscire: dopo l'accesso ti chiediamo subito il nuovo PIN. Continuare?");
  if(!ok) return;
  lsSet("equo-pin-reset", "1");
  await logout();
}
async function wgControllaResetPin(){
  if(DEMO_MODE || lsGet("equo-pin-reset") !== "1" || vistaAi() !== "professionista") return;
  const p1 = await wgPin({ titolo: "Scegli il nuovo PIN", testo: "Hai appena fatto l'accesso: scegli 4 nuove cifre per gli incassi.", passo: "Passo 1 di 2" });
  if(!p1){ lsDel("equo-pin-reset"); return; }
  const p2 = await wgPin({ titolo: "Ripeti il nuovo PIN", testo: "", passo: "Passo 2 di 2" });
  if(p1 !== p2){ showToast("I due PIN non coincidono: riprova dal menu."); lsDel("equo-pin-reset"); return; }
  const { data, error } = await sb.rpc("incassi_nuovo_pin", { p_pin: p1 });
  lsDel("equo-pin-reset");
  if(error || !data?.ok){ showToast(data?.serve_accesso ? "Per sicurezza rifai l'accesso e riprova subito." : "Non sono riuscito a salvare il PIN."); return; }
  currentUser.incassiNascosti = false;
  applicaVistaHome();
  showToast("Nuovo PIN salvato: gli incassi sono di nuovo visibili");
}

/* Il pulsante dell'assistente si fa da parte mentre si scorre (non copre i riquadri) e torna appena ci si ferma */
(function(){
  let t = null;
  document.addEventListener("scroll", ev => {
    if(!ev.target || !ev.target.classList || !ev.target.classList.contains("page-content")) return;
    document.body.classList.add("fab-via");
    clearTimeout(t); t = setTimeout(() => document.body.classList.remove("fab-via"), 700);
  }, true);
})();

