/* =====================================================================
   CONFIGURAZIONE GUIDATA DELLA SCUDERIA · motore della finestra (blocco B1, 10/11/2026 · SQL 58)
   - Benvenuto al primo accesso («Inizia ora» / «Più tardi»), poi card «Riprendi configurazione» in Home.
   - Finestra a 10 passi: avanti, indietro, salta, non applicabile; lo stato si salva nel database
     (configurazione_salva) e si riprende da qualsiasi dispositivo; due amministratori insieme non si
     sovrascrivono (rev). Lo stato del salvataggio mostrato è quello reale.
   - Athena (civetta cartoon) in basso a sinistra con i fumetti accanto: guida fissa (071). La chat e la
     compilazione da una frase arrivano con il blocco B3; i moduli dentro i passi con il blocco B2.
   - La vedono solo amministratore e livelli 2-3. Finché CONF_RILASCIATA è false si attiva solo per prova:
     indirizzo con «?configura» oppure localStorage equo_conf_prova = "1".
   ===================================================================== */
const CONF_RILASCIATA = false;
let confStato = null;          // risposta di configurazione_leggi
let confPassoVisto = 1;        // passo mostrato nella finestra
let confDati = null;           // dati già presenti nei moduli
let confOccupato = false;      // salvataggio in corso (niente doppio clic)
let confUltimoEsito = null;    // testo dell'ultimo salvataggio riuscito, mostrato da Athena

function confAbilitata(){
  if(CONF_RILASCIATA) return true;
  try{ if(/[?&]configura\b/.test(location.search)) localStorage.setItem("equo_conf_prova", "1"); }catch(e){}
  try{ return localStorage.getItem("equo_conf_prova") === "1"; }catch(e){ return false; }
}
function confPuo(){ return typeof puoCollegareProfessionisti === "function" && puoCollegareProfessionisti(); }

// ---------- stato nel database ----------
async function confCarica(){
  if(!currentCentro || !confPuo()){ confStato = null; return null; }
  if(DEMO_MODE){
    demoState.conf = demoState.conf || { ok: true, puo: true, versione_passi: 1, passo_corrente: 1, passi: {}, stato: "nuova", proposta_vista: false, ai_bonus_usati: 0, rev: 0 };
    confStato = demoState.conf; return confStato;
  }
  const { data, error } = await sb.rpc("configurazione_leggi", { p_centro: currentCentro.id });
  if(error){ console.warn("configurazione_leggi:", error.message); confStato = null; return null; }
  confStato = data && data.ok ? data : null;
  return confStato;
}
// salva: passo + stato del passo, oppure un'azione (proposta_vista, rimanda, completa)
async function confSalva(passo, statoPasso, azione){
  if(!confStato) return false;
  confOccupato = true; confBottoni();
  confMostraSalvato("Salvataggio…", "");
  if(DEMO_MODE){
    const s = demoState.conf;
    if(passo){ s.passo_corrente = passo; if(statoPasso) s.passi = { ...s.passi, [passo]: statoPasso }; if(["nuova", "rimandata"].includes(s.stato)) s.stato = "in_corso"; s.proposta_vista = true; }
    if(azione === "proposta_vista") s.proposta_vista = true;
    if(azione === "rimanda"){ s.proposta_vista = true; if(s.stato !== "completata") s.stato = "rimandata"; }
    if(azione === "completa"){ s.stato = "completata"; s.completata_il = new Date().toISOString(); }
    s.rev++; s.aggiornato_da_me = true; s.ultima_attivita = new Date().toISOString();
    confStato = s; confOccupato = false; confBottoni();
    confMostraSalvato("Salvato alle " + confOra(), "ok");
    return true;
  }
  let esito;
  try{
    const { data, error } = await sb.rpc("configurazione_salva", { p_centro: currentCentro.id, p_passo: passo || null, p_passo_stato: statoPasso || null,
      p_passi: null, p_azione: azione || null, p_rev: confStato.rev });
    if(error) throw error;
    esito = data;
  }catch(e){
    confOccupato = false; confBottoni();
    confMostraSalvato("Non salvato: controlla la connessione e riprova", "err");
    return false;
  }
  confOccupato = false;
  if(esito && esito.conflitto){
    confStato = esito.conf || confStato;
    confBottoni();
    showToast((confStato.aggiornato_da_nome || "Un altro membro") + " ha appena aggiornato la configurazione: ti mostro la versione più recente.");
    confMostraSalvato("Aggiornato da " + (confStato.aggiornato_da_nome || "un altro membro"), "");
    if(document.getElementById("modal-configurazione")?.classList.contains("active")){ confPassoVisto = confStato.passo_corrente || confPassoVisto; confRender(); }
    return false;
  }
  if(!esito || !esito.ok){
    confBottoni();
    confMostraSalvato((esito && esito.errore) || "Non salvato: riprova", "err");
    return false;
  }
  confStato = esito.conf || confStato;
  confBottoni();
  confMostraSalvato("Salvato alle " + confOra(), "ok");
  return true;
}
function confOra(){ return new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }); }
function confMostraSalvato(testo, tipo){
  const el = document.getElementById("conf-salvato"); if(!el) return;
  el.className = "conf-salvato" + (tipo ? " " + tipo : "");
  el.innerHTML = tipo === "ok" ? `<i class="fa-solid fa-check"></i> ${escapeHtml(testo)}` : escapeHtml(testo);
}

// ---------- dati già presenti nei moduli (per le scuderie già attive) ----------
async function confLeggiDati(){
  const d = { box: 0, paddock: 0, cavalli: 0, staff: 0, proprietari: 0, lezioni: 0, incassi: 0, maniscalchi: 0, centro: {} };
  if(DEMO_MODE){
    d.box = (demoState.box || []).length; d.paddock = (demoState.paddock || []).length; d.cavalli = (demoState.cavalli || []).length;
    d.staff = (typeof teamList !== "undefined" ? teamList : []).filter(m => !["allievo", "proprietario"].includes(m.ruolo)).length;
    d.proprietari = (typeof teamList !== "undefined" ? teamList : []).filter(m => m.ruolo === "proprietario").length;
    d.lezioni = (demoState.lezioni || []).length; d.incassi = (demoState.pagamenti || demoState.incassi || []).length;
    d.maniscalchi = (typeof professionistiList !== "undefined" ? professionistiList : []).filter(p => p.stato === "attivo").length || 1;
    d.centro = { ...currentCentro };
    confDati = d; return d;
  }
  const c = currentCentro.id;
  const conta = async (q) => { try{ const { count } = await q; return count || 0; }catch(e){ return 0; } };
  const testa = { count: "exact", head: true };
  const [box, pad, cav, staff, prop, lez, inc, man, cen] = await Promise.all([
    conta(sb.from("scuderia_box").select("id", testa).eq("centro_id", c)),
    conta(sb.from("scuderia_paddock").select("id", testa).eq("centro_id", c)),
    conta(sb.from("scuderia_cavalli").select("id", testa).eq("centro_id", c).is("uscito_il", null)),
    conta(sb.from("scuderia_membri").select("id", testa).eq("centro_id", c).not("ruolo", "in", "(allievo,proprietario)")),
    conta(sb.from("scuderia_membri").select("id", testa).eq("centro_id", c).eq("ruolo", "proprietario")),
    conta(sb.from("scuderia_lezioni").select("id", testa).eq("centro_id", c)),
    conta(sb.from("scuderia_pagamenti").select("id", testa).eq("centro_id", c)),
    conta(sb.from("clienti_mascalcia").select("id", testa).eq("centro_id", c).eq("collegamento_stato", "attivo")),
    sb.from("centri").select("nome, indirizzo, telefono, citta, provincia, join_code, asd_attiva, asd_nome, asd_cf, asd_sede, asd_rasd, asd_affiliazioni, asd_quota_annuale, asd_mese_inizio, lezioni_addebito, cassa_lezioni").eq("id", c).maybeSingle().then(r => r.data || {}, () => ({})),
  ]);
  try{ const { data: ex } = await sb.from("centri").select("email, forma_giuridica, logo_url").eq("id", c).maybeSingle(); if(ex) Object.assign(cen, ex); }catch(e){}
  Object.assign(d, { box, paddock: pad, cavalli: cav, staff, proprietari: prop, lezioni: lez, incassi: inc, maniscalchi: man, centro: cen });
  confDati = d; return d;
}
// un passo è già soddisfatto dai dati che la scuderia ha? (lo si mostra «Già fatto: controlla», niente si segna da solo)
function confGiaFatto(n, d){
  if(!d) return false;
  const c = d.centro || {};
  switch(n){
    case 1: return d.maniscalchi > 0;
    case 2: return !!(c.nome && c.indirizzo && c.telefono);
    case 3: return !!(c.asd_attiva && c.asd_nome);
    case 4: return d.staff > 1;
    case 5: return d.box + d.paddock > 0;
    case 6: return d.cavalli > 0;
    case 7: return d.proprietari > 0;
    case 8: return d.lezioni > 0;
    case 9: return d.incassi > 0;
  }
  return false;
}
function confRiepilogoDati(n, d){
  if(!d) return [];
  const c = d.centro || {}, si = (v, t, vuoto) => ({ ok: !!v, testo: v ? t : vuoto });
  const num = (k, uno, tanti, nessuno) => si(d[k] > 0, d[k] === 1 ? "1 " + uno : d[k] + " " + tanti, nessuno);
  switch(n){
    case 1: return [num("maniscalchi", "maniscalco collegato", "maniscalchi collegati", "Nessun maniscalco collegato")];
    case 2: return [si(c.nome, "Nome: " + (c.nome || ""), "Manca il nome"), si(c.indirizzo, "Indirizzo: " + (c.indirizzo || "") + (c.citta ? ", " + c.citta : ""), "Manca l'indirizzo"), si(c.telefono, "Telefono: " + (c.telefono || ""), "Manca il telefono")];
    case 3: return [si(c.asd_attiva, "ASD attiva" + (c.asd_nome ? ": " + c.asd_nome : ""), "ASD non attiva"), si(c.asd_cf, "Codice fiscale: " + (c.asd_cf || ""), "Codice fiscale ASD non inserito")];
    case 4: return [si(d.staff > 1, d.staff + " persone nello staff", "Per ora nello staff ci sei solo tu")];
    case 5: return [num("box", "box", "box", "Nessun box"), num("paddock", "paddock", "paddock", "Nessun paddock")];
    case 6: return [num("cavalli", "cavallo", "cavalli", "Nessun cavallo")];
    case 7: return [num("proprietari", "proprietario tra i clienti", "proprietari tra i clienti", "Nessun proprietario tra i clienti")];
    case 8: return [num("lezioni", "lezione nel calendario", "lezioni nel calendario", "Nessuna lezione")];
    case 9: return [num("incassi", "incasso registrato", "incassi registrati", "Nessun incasso registrato")];
  }
  return [];
}

// ---------- benvenuto e card in Home ----------
async function confControllaAllAvvio(){
  if(!confAbilitata() || !confPuo()) return;
  await confCarica();
  confRenderCard();
  if(confStato && confStato.stato === "nuova" && !confStato.proposta_vista) confApriBenvenuto();
}
function confApriBenvenuto(){
  const ol = document.getElementById("conf-ben-passi");
  if(ol) ol.innerHTML = CONF_PASSI.map(p => `<li>${p.n} · ${escapeHtml(p.breve)}</li>`).join("");
  openModal("modal-conf-benvenuto");
  setTimeout(() => document.querySelector("#modal-conf-benvenuto .btn-primary")?.focus(), 50);
}
async function confPiuTardi(){
  closeModal("modal-conf-benvenuto");
  await confSalva(null, null, "rimanda");
  confRenderCard();
  showToast("Va bene! Riprendi quando vuoi dalla Home.");
}
async function confInizia(){
  closeModal("modal-conf-benvenuto");
  await confSalva(null, null, "proposta_vista");
  confApri();
}
function confRenderCard(){
  const box = document.getElementById("scud-configurazione"); if(!box) return;
  if(!confAbilitata() || !confStato || confStato.stato === "completata" || (!confStato.proposta_vista && confStato.stato === "nuova")){ box.innerHTML = ""; return; }
  const fatti = Object.values(confStato.passi || {}).filter(s => s !== "in_corso").length;
  const chi = confStato.aggiornato_da_nome && !confStato.aggiornato_da_me ? ` · ultima modifica di ${escapeHtml(confStato.aggiornato_da_nome)}` : "";
  box.innerHTML = `<div class="conf-card">
    <img src="assets/agenti/athena-cartoon.webp" alt="">
    <div><b>Riprendi la configurazione</b><span>Passo ${confStato.passo_corrente} di 10 · ${fatti} ${fatti === 1 ? "passo completato" : "passi completati"}${chi}</span></div>
    <button type="button" class="btn btn-primary" onclick="confApri()">Riprendi</button></div>`;
}

// ---------- la finestra ----------
async function confApri(passo){
  if(!confStato) await confCarica();
  if(!confStato){ showToast("Non riesco a caricare la configurazione: riprova tra poco."); return; }
  confPassoVisto = passo || confStato.passo_corrente || 1;
  document.getElementById("conf-modal")?.classList.remove("athena-aperta");
  openModal("modal-configurazione");
  confMostraSalvato(confStato.ultima_attivita ? "Ripreso dal passo " + confPassoVisto : "", "");
  confRender();
  (async () => {
    try{
      if(typeof loadTeam === "function" && !(typeof teamList !== "undefined" && teamList.length)) await loadTeam();
      if(typeof loadCavalli === "function" && !(typeof cavalliList !== "undefined" && cavalliList.length)) await loadCavalli();
    }catch(e){}
    await confLeggiDati();
    if(document.getElementById("modal-configurazione")?.classList.contains("active")) confRender(true);
  })();
}
async function confChiudi(){
  closeModal("modal-configurazione");
  confRenderCard();
}
function confRender(soloCorpo){
  const p = CONF_PASSI.find(x => x.n === confPassoVisto) || CONF_PASSI[0];
  const passi = confStato?.passi || {};
  document.getElementById("conf-sopra").textContent = p.n === 10 ? "Configura la tua scuderia · ultimo passo" : `Configura la tua scuderia · passo ${p.n} di 10`;
  document.getElementById("conf-titolo").textContent = p.titolo;
  const chiusi = CONF_PASSI.filter(x => ["fatto", "saltato", "non_applicabile"].includes(passi[x.n])).length;
  document.getElementById("conf-barra-dentro").style.width = Math.round(chiusi / 10 * 100) + "%";
  document.getElementById("conf-barra").setAttribute("aria-valuenow", String(chiusi));
  document.getElementById("conf-pallini").innerHTML = CONF_PASSI.map(x => {
    const st = passi[x.n] || "";
    return `<button type="button" class="conf-pallino ${st}${x.n === p.n ? " attivo" : ""}" onclick="confVaiA(${x.n})" aria-label="Passo ${x.n}: ${escapeHtml(x.breve)}${st ? ", " + (CONF_STATI[st] || st).toLowerCase() : ""}"${x.n === p.n ? ' aria-current="step"' : ""}>${st === "fatto" ? '<i class="fa-solid fa-check"></i>' : x.n}</button>`;
  }).join("");
  document.getElementById("conf-passo").innerHTML = p.n === 10 ? confCorpoRiepilogo() : confCorpoPasso(p);
  confBottoni();
  if(!soloCorpo){ confFumetti(p); document.getElementById("conf-passo").focus({ preventScroll: true }); }
}
function confCorpoPasso(p){
  const d = confDati, gia = confGiaFatto(p.n, d), st = confStato?.passi?.[p.n];
  const righe = confRiepilogoDati(p.n, d);
  return `${gia ? `<div class="conf-gia"><i class="fa-solid fa-circle-check"></i> Già fatto: controlla e vai avanti.</div>` : ""}
    ${st && st !== "in_corso" ? `<p style="color:var(--muted)">Stato: <b>${escapeHtml(CONF_STATI[st] || st)}</b></p>` : ""}
    <p>${escapeHtml(p.cosa)}${p.facoltativo ? ' <span style="color:var(--muted)">(facoltativo)</span>' : ""}</p>
    <div class="conf-riquadro conf-gia-presente"><h3>Cosa c'è già nel gestionale</h3>
      ${d ? righe.map(r => `<div class="conf-esiste${r.ok ? "" : " vuoto"}"><i class="fa-solid ${r.ok ? "fa-circle-check" : "fa-circle"}"></i> ${escapeHtml(r.testo)}</div>`).join("")
          : '<div class="conf-esiste vuoto"><i class="fa-solid fa-spinner fa-spin"></i> Controllo i tuoi dati…</div>'}
    </div>
    ${d && typeof CONF_FORM !== "undefined" && CONF_FORM[p.n] ? CONF_FORM[p.n].html() : ""}
    ${p.modulo ? `<p class="conf-nota">Preferisci il modulo completo? <button type="button" class="btn btn-ghost btn-sm" onclick="confApriModulo(${p.n})">Apri ${escapeHtml(p.moduloNome)}</button> (la configurazione resta salvata).</p>` : ""}`;
}
function confCorpoRiepilogo(){
  const passi = confStato?.passi || {};
  const righe = CONF_PASSI.filter(p => p.n < 10).map(p => {
    const st = passi[p.n] || (confGiaFatto(p.n, confDati) ? "gia" : "");
    const etichetta = st === "gia" ? "Già presente" : st ? (CONF_STATI[st] || st) : "Da fare";
    const icona = st === "fatto" || st === "gia" ? "fa-circle-check" : st === "non_applicabile" ? "fa-ban" : st === "saltato" ? "fa-forward" : "fa-circle";
    return `<div class="conf-esiste${st === "fatto" || st === "gia" ? "" : " vuoto"}"><i class="fa-solid ${icona}"></i>
      <span style="flex:1">${p.n} · ${escapeHtml(p.breve)} <span style="color:var(--muted)">· ${escapeHtml(etichetta)}</span></span>
      ${st !== "fatto" && st !== "gia" && st !== "non_applicabile" ? `<button type="button" class="btn btn-ghost btn-sm" onclick="confVaiA(${p.n})">Vai</button>` : ""}</div>`;
  }).join("");
  return `<p>Ecco a che punto è la tua scuderia. I passi saltati restano qui e nella card della Home finché non li completi.</p>
    <div class="conf-riquadro"><h3>I passi</h3>${righe}</div>
    <p style="color:var(--muted);font-size:13px">Configurazione completata non vuol dire profilo completo: i dati che mancano restano segnati nei moduli.</p>`;
}
function confBottoni(){
  const p = CONF_PASSI.find(x => x.n === confPassoVisto) || CONF_PASSI[0];
  const set = (id, vis, dis) => { const b = document.getElementById(id); if(!b) return; b.style.display = vis ? "" : "none"; b.disabled = !!dis; };
  set("conf-indietro", true, confOccupato || p.n === 1);
  set("conf-salta", !!p.facoltativo && p.n < 10, confOccupato);
  set("conf-na", !!p.nonApplicabile, confOccupato);
  set("conf-avanti", true, confOccupato);
  const av = document.getElementById("conf-avanti"); if(av) av.textContent = p.n === 10 ? "Concludi" : "Salva e continua";
}
function confFumetti(p){
  const box = document.getElementById("conf-fumetti"); if(!box) return;
  box.innerHTML = "";
  // l'esito del passo appena salvato resta visibile come primo fumetto del passo nuovo
  const esito = confUltimoEsito; confUltimoEsito = null;
  if(esito) confAggiungiFumetto("✓ " + esito, false);
  p.guida.forEach((t, i) => setTimeout(() => {
    if(confPassoVisto !== p.n) return;
    confAggiungiFumetto(t, false);
  }, (esito ? 900 : 0) + i * 650));
  if(typeof confInputAthena === "function") confInputAthena();   // B3: chat del passo e compilazione da una frase
}
function confAggiungiFumetto(testo, mio){
  const box = document.getElementById("conf-fumetti"); if(!box) return;
  const d = document.createElement("div");
  d.className = "conf-fumetto nuovo" + (mio ? " mio" : "");
  d.innerHTML = escapeHtml(testo) + '<svg class="conf-coda" viewBox="0 0 20 18" aria-hidden="true"><path d="M18 2 L2 12 L18 15"/></svg>';
  box.appendChild(d);
  box.scrollTop = box.scrollHeight;
  return d;
}
function confAthena(apri){
  document.getElementById("conf-modal")?.classList.toggle("athena-aperta", !!apri);
  if(apri) setTimeout(() => document.querySelector("#conf-modal .conf-athena-chiudi")?.focus(), 300);
}

// ---------- navigazione ----------
async function confAvanti(){
  if(confOccupato) return;
  const n = confPassoVisto;
  if(n === 10){
    const ok = await confSalva(10, "fatto", "completa");
    if(!ok) return;
    closeModal("modal-configurazione");
    confRenderCard();
    showToast("Configurazione completata! Trovi tutto nei moduli del gestionale.");
    return;
  }
  const p = CONF_PASSI.find(x => x.n === n);
  const f = typeof CONF_FORM !== "undefined" ? CONF_FORM[n] : null;
  let st;
  if(f && f.salva && confDati && !f.vuoto()){
    // B2: il passo scrive nel modulo vero; se non riesce si resta qui con l'errore
    confOccupato = true; confBottoni(); confMostraSalvato("Salvataggio…", "");
    let r;
    try{ r = await f.salva(); }catch(e){ r = { ok: false, errore: e?.message || "Non riuscito, riprova." }; }
    confOccupato = false; confBottoni();
    if(!r || !r.ok){ confMostraSalvato((r && r.errore) || "Non riuscito, riprova.", "err"); confAggiungiFumetto((r && r.errore) || "Qualcosa non è andato: riprova.", false); return; }
    confUltimoEsito = r.testo || "Fatto!";
    st = "fatto";
    await confLeggiDati();
  } else {
    // niente di nuovo da salvare: fatto se i dati ci sono già, altrimenti saltato (facoltativo) o da completare
    st = confGiaFatto(n, confDati) ? "fatto" : (p.facoltativo ? "saltato" : "in_corso");
  }
  if(!(await confSalva(n, st, null))) return;
  if(!(await confSalva(n + 1, null, null))) return;
  confPassoVisto = n + 1;
  confRender();
}
async function confVai(delta){
  if(confOccupato) return;
  const prossimo = Math.max(1, Math.min(10, confPassoVisto + delta));
  if(prossimo === confPassoVisto) return;
  if(!(await confSalva(prossimo, null, null))) return;
  confPassoVisto = prossimo;
  confRender();
}
async function confVaiA(n){
  if(confOccupato || n === confPassoVisto) return;
  if(!(await confSalva(n, null, null))) return;
  confPassoVisto = n;
  confRender();
}
async function confSalta(){
  if(confOccupato) return;
  const n = confPassoVisto;
  if(!(await confSalva(n, "saltato", null))) return;
  if(!(await confSalva(Math.min(10, n + 1), null, null))) return;
  confPassoVisto = Math.min(10, n + 1);
  confRender();
}
async function confNonApplicabile(){
  if(confOccupato) return;
  const n = confPassoVisto;
  if(!(await confSalva(n, "non_applicabile", null))) return;
  if(!(await confSalva(Math.min(10, n + 1), null, null))) return;
  confPassoVisto = Math.min(10, n + 1);
  confRender();
}
async function confApriModulo(n){
  const p = CONF_PASSI.find(x => x.n === n); if(!p || !p.modulo) return;
  if(!confStato.passi?.[n]) await confSalva(n, "in_corso", null);
  closeModal("modal-configurazione");
  confRenderCard();
  if(typeof showModule === "function") showModule(p.modulo);
}

// Esc chiude la finestra (lo stato è già salvato)
document.addEventListener("keydown", (e) => {
  if(e.key !== "Escape") return;
  if(document.getElementById("modal-configurazione")?.classList.contains("active")){ e.preventDefault(); confChiudi(); }
});

// avvio: dopo l'ingresso nel gestionale; la card si ridisegna con la Home
(function(){
  try{
    const ingressoOrig = enterAppShell;
    enterAppShell = function(){ const r = ingressoOrig.apply(this, arguments); setTimeout(() => { confControllaAllAvvio().catch(e => console.warn("configurazione:", e)); }, 800); return r; };
  }catch(e){ console.warn("configurazione (avvio):", e); }
  try{
    const homeOrig = refreshHomeModule;
    refreshHomeModule = async function(){ const r = await homeOrig.apply(this, arguments); try{ confRenderCard(); }catch(e){} return r; };
  }catch(e){ console.warn("configurazione (home):", e); }
})();
