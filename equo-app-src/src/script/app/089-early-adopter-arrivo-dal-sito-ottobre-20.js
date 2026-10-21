/* ---------- EARLY ADOPTER: arrivo dal sito (ottobre 2026) ----------
   equohub.com → app.equohub.com/?early=proprietario|professionista
   1) la scelta viene ricordata sul telefono (48 ore) anche durante registrazione e onboarding;
   2) dopo l'accesso si apre la finestra "Diventa Early Adopter" con il Lifetime del profilo giusto;
   3) al ritorno da Stripe (?checkout=success) messaggio di benvenuto.
   Controlli: profilo diverso dal pacchetto scelto, posti esauriti, già Premium a vita, abbonamento in corso. */
const EARLY_KEY = "equo-early";
const EARLY_PREZZO = { proprietario: 49, professionista: 99 };
const EARLY_ANNUALE = { proprietario: 19, professionista: 59 };
const EARLY_NOME = { proprietario: "Proprietari", professionista: "Professionisti" };
const EARLY_RITORNO_STRIPE = new URLSearchParams(location.search).has("checkout");
function earlyLeggi(){
  try{
    const v = JSON.parse(lsGet(EARLY_KEY) || "null");
    if(v && EARLY_PREZZO[v.piano] && Date.now() - v.t < 2 * 86400000) return v;
  }catch(e){}
  return null;
}
function earlyCancella(){ lsDel(EARLY_KEY); document.querySelectorAll(".early-avviso").forEach(el => el.remove()); document.querySelectorAll(".early-scelta").forEach(el => el.classList.remove("early-scelta")); }
(function earlyDaUrl(){
  const p = new URLSearchParams(location.search);
  const e = p.get("early");
  if(e === "proprietario" || e === "professionista"){
    lsSet(EARLY_KEY, JSON.stringify({ piano: e, t: Date.now() }));
    p.delete("early");
    history.replaceState({}, "", location.pathname + (p.toString() ? "?" + p.toString() : ""));
  }
})();
function earlyAvvisoHtml(e, testo){
  return `<div class="early-avviso"><span class="early-medaglia">★</span><div><b>Stai per diventare Early Adopter</b><span>Premium a vita · ${EARLY_NOME[e.piano]} · ${EARLY_PREZZO[e.piano]} € una volta sola</span><small>${testo}</small></div></div>`;
}
// avviso nella schermata di accesso e nella scelta del profilo
function earlyMostraAvvisi(){
  const e = earlyLeggi();
  if(!e || (typeof DEMO_MODE !== "undefined" && DEMO_MODE)) return;
  const tag = document.querySelector("#screen-auth .auth-tagline");
  if(tag && !document.querySelector("#screen-auth .early-avviso")) tag.insertAdjacentHTML("afterend", earlyAvvisoHtml(e, "Accedi o crea il tuo account: subito dopo completi il pagamento."));
  const lista = document.querySelector("#onb-step-1 .role-list");
  if(lista && !document.querySelector("#onb-step-1 .early-avviso")){
    lista.insertAdjacentHTML("beforebegin", earlyAvvisoHtml(e, e.piano === "proprietario" ? "Scegli «Ho un cavallo» per continuare." : "Scegli «Sono un professionista» e poi la tua professione."));
    const bottoni = lista.querySelectorAll(".role-card");
    const giusto = e.piano === "proprietario" ? bottoni[0] : bottoni[1];
    if(giusto) giusto.classList.add("early-scelta");
  }
}
let earlyInCorso = false;
async function earlyControlla(){
  const e = earlyLeggi();
  if(!e || DEMO_MODE || !currentUser || EARLY_RITORNO_STRIPE || earlyInCorso) return;
  if(document.getElementById("modal-early")?.classList.contains("active")) return;
  if(document.getElementById("screen-onboarding")?.classList.contains("active")) return;
  earlyInCorso = true;
  try{
    const { data: prof } = await sb.from("profiles").select("piano, stripe_subscription_id, stripe_customer_id").eq("id", currentUser.id).maybeSingle();
    if(prof?.piano === "premium" && prof.stripe_customer_id && !prof.stripe_subscription_id){
      earlyCancella();
      showToast("Sei già Premium a vita: grazie per essere un Early Adopter!");
      return;
    }
    // il pacchetto scelto sul sito è dell'altro profilo: se l'utente ha anche quel profilo ci passiamo
    let ruoloVista = currentPianoRuolo();
    let cambio = null;
    if(e.piano !== ruoloVista){
      const ruoli = [currentUser.ruolo, currentUser.ruoloSecondario].filter(Boolean);
      const target = e.piano === "professionista" ? ruoli.find(r => PRO_ROLES.includes(r)) : (ruoli.includes("proprietario") ? "proprietario" : null);
      if(target){ await enterApp(target); ruoloVista = currentPianoRuolo(); }
      else cambio = { scelto: e.piano, giusto: ruoloVista };
    }
    let rimasti = null;
    try{
      const { data } = await sb.rpc("promo_posti");
      const r = data && data[ruoloVista === "professionista" ? "professionisti" : "proprietari"];
      if(r && typeof r.rimasti === "number") rimasti = r.rimasti;
    }catch(_){}
    earlyApriFinestra(ruoloVista, rimasti, !!(prof?.piano === "premium" && prof?.stripe_subscription_id), cambio);
  } finally { earlyInCorso = false; }
}
function earlyApriFinestra(ruolo, rimasti, abbonato, cambio){
  let ov = document.getElementById("modal-early");
  if(!ov){
    ov = document.createElement("div");
    ov.className = "modal-overlay";
    ov.id = "modal-early";
    ov.addEventListener("click", ev => { if(ev.target === ov) earlyNonOra(); });
    document.body.appendChild(ov);
  }
  const prezzo = EARLY_PREZZO[ruolo], annuale = EARLY_ANNUALE[ruolo];
  const esauriti = rimasti === 0;
  const risparmio = Math.round((1 - prezzo / (annuale * 10)) * 100);
  ov.innerHTML = `<div class="modal early-finestra">
    <div class="modal-handle"></div>
    <div class="early-testa"><span class="early-medaglia grande">★</span><div><div class="modal-title" style="margin:0">Diventa Early Adopter</div><div class="muted" style="font-size:13px">Equo Premium a vita · ${EARLY_NOME[ruolo]}</div></div></div>
    ${cambio ? `<div class="early-nota">Sul sito hai scelto il pacchetto <b>${EARLY_NOME[cambio.scelto]}</b>, ma il tuo profilo è <b>${cambio.giusto === "professionista" ? "professionista" : "proprietario"}</b>: per te c'è il pacchetto <b>${EARLY_NOME[ruolo]}</b> qui sotto.</div>` : ""}
    ${esauriti
      ? `<p class="early-txt">I posti Early Adopter per i ${EARLY_NOME[ruolo].toLowerCase()} sono <b>esauriti</b>. Grazie per l'interesse: puoi comunque passare a Premium con il piano mensile o annuale.</p>
         <div style="display:flex;flex-direction:column;gap:10px"><button class="btn btn-primary" style="width:100%" onclick="earlyCancella();closeModal('modal-early');togglePiano()">Vedi i piani Premium</button><button class="btn btn-outline" style="width:100%" onclick="earlyNonOra()">Chiudi</button></div>`
      : `<div class="early-prezzo">${prezzo} € <small>una volta sola</small></div>
         <ul class="early-punti">
           <li>Premium a vita, senza abbonamento e senza rinnovi</li>
           <li>−${risparmio}% in 10 anni rispetto al piano annuale (${annuale}&nbsp;€/anno)</li>
           <li>Accesso in anteprima alle nuove funzioni</li>
         </ul>
         ${rimasti != null ? `<div class="early-posti">Restano <b>${rimasti}</b> posti</div>` : ""}
         ${abbonato ? `<div class="early-nota">Hai già un abbonamento Premium: dopo il pagamento lo chiudiamo noi in automatico, così non paghi più rinnovi.</div>` : ""}
         <div style="display:flex;flex-direction:column;gap:10px;margin-top:4px"><button class="btn btn-primary" style="width:100%" onclick="earlyPaga()">Paga ${prezzo} € e diventa Early Adopter</button><button class="btn btn-outline" style="width:100%" onclick="earlyNonOra()">Non ora</button></div>
         <div class="muted" style="font-size:11.5px;line-height:1.5;margin-top:10px;text-align:center">Pagamento sicuro con Stripe: carta, Apple Pay, Google Pay, PayPal. Rimborso completo entro 14 giorni se cambi idea.</div>`}
  </div>`;
  openModal("modal-early");
}
function earlyNonOra(){ earlyCancella(); closeModal("modal-early"); }
function earlyPaga(){
  lsSet("equo-early-pagamento", "1");
  startLifetimeCheckout();
}
// al ritorno da Stripe: benvenuto (chiamata da handleCheckoutReturn)
function earlyDopoRitorno(esito, premiumAttivo){
  const pagando = lsGet("equo-early-pagamento") === "1";
  lsDel("equo-early-pagamento");
  if(!pagando) return false;
  earlyCancella();
  if(esito === "success" && premiumAttivo){ showToast("Benvenuto tra gli Early Adopter! Il tuo Premium a vita è attivo."); return true; }
  return false;
}
// nella finestra Premium: Lifetime con i posti rimasti, nascosto quando sono finiti
async function earlyAggiornaBottoneLifetime(){
  const btn = document.getElementById("upgrade-btn-lifetime");
  if(!btn || DEMO_MODE) return;
  try{
    const ruolo = currentPianoRuolo();
    const { data } = await sb.rpc("promo_posti");
    const r = data && data[ruolo === "professionista" ? "professionisti" : "proprietari"];
    if(!r || typeof r.rimasti !== "number") return;
    if(r.rimasti === 0){ btn.style.display = "none"; return; }
    btn.style.display = "";
    btn.textContent = PREZZI_PREMIUM[ruolo].lifetime + " · Early Adopter, restano " + r.rimasti + " posti";
  }catch(e){}
}
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", earlyMostraAvvisi); else setTimeout(earlyMostraAvvisi, 0);

/* ==================== REFERRAL CON CODICE DEDICATO ====================
   Link/QR tipo app.equohub.com/?ref=ALESSANDRO: il nuovo proprietario che si iscrive ha 3 mesi di Premium gratis (gestione interna, niente Stripe).
   Il codice si ricorda 30 giorni sul telefono e si applica quando l'iscrizione è completa (RPC equo_riscatta_referral).
   A fine periodo torna Free da solo (controllo all'accesso con equo_controlla_premium + notturno sul database). */
const REF_KEY = "equo-ref";
(function refDaUrl(){
  const p = new URLSearchParams(location.search);
  const r = p.get("ref");
  if(r && /^[A-Za-z0-9_-]{2,40}$/.test(r)){
    lsSet(REF_KEY, JSON.stringify({ codice: r.toUpperCase(), t: Date.now() }));
    p.delete("ref");
    history.replaceState({}, "", location.pathname + (p.toString() ? "?" + p.toString() : ""));
  }
})();
function refLeggi(){
  try{
    const v = JSON.parse(lsGet(REF_KEY) || "null");
    if(v && v.codice && Date.now() - v.t < 30 * 86400000) return v;
  }catch(e){}
  return null;
}
function refCancella(){ lsDel(REF_KEY); document.querySelectorAll(".ref-avviso").forEach(el => el.remove()); }
let refInfoCache = null;
async function refMostraAvvisi(){
  const r = refLeggi();
  if(!r || (typeof DEMO_MODE !== "undefined" && DEMO_MODE) || typeof sb === "undefined") return;
  try{
    if(!refInfoCache || refInfoCache.codice !== r.codice){
      const { data } = await sb.rpc("equo_referral_info", { p_codice: r.codice });
      if(!data || typeof data.valido !== "boolean") return;
      refInfoCache = { codice: r.codice, info: data };
    }
  }catch(e){ return; }
  const info = refInfoCache.info;
  if(!info.valido){ return; }
  const mesi = Math.round((info.giorni || 90) / 30);
  const html = t => `<div class="ref-avviso"><span class="early-medaglia">★</span><div><b>Invito di ${escapeHtml(info.nome)}</b><span>${mesi} mesi di Premium gratis, senza carta</span><small>${t}</small></div></div>`;
  const tag = document.querySelector("#screen-auth .auth-tagline");
  if(tag && !document.querySelector("#screen-auth .ref-avviso")) tag.insertAdjacentHTML("afterend", html("Crea il tuo account e scegli «Ho un cavallo»: il Premium parte da solo."));
  const lista = document.querySelector("#onb-step-1 .role-list");
  if(lista && !document.querySelector("#onb-step-1 .ref-avviso")) lista.insertAdjacentHTML("beforebegin", html("Scegli «Ho un cavallo» per attivarlo."));
}
let refInCorso = false;
async function referralControlla(){
  if(DEMO_MODE || !currentUser || refInCorso) return;
  refInCorso = true;
  try{
    // 1) un Premium da referral arrivato a fine periodo torna Free
    try{
      const { data } = await sb.rpc("equo_controlla_premium");
      if(data?.scaduto){ currentUser.piano = "free"; currentUser.premiumLivello = null; showToast("I tuoi mesi di Premium in regalo sono finiti: sei tornato al piano Free. Puoi passare a Premium quando vuoi dal menu."); }
    }catch(e){}
    // 2) codice invito ricordato: lo applichiamo a chi ha il profilo proprietario
    const r = refLeggi();
    if(!r) return;
    const ruoli = [currentUser.ruolo, currentUser.ruoloSecondario].filter(Boolean);
    if(!ruoli.includes("proprietario")) return;
    const { data, error } = await sb.rpc("equo_riscatta_referral", { p_codice: r.codice });
    if(error){ console.error("referral:", error); return; }
    if(data?.ok){
      refCancella();
      currentUser.piano = "premium"; currentUser.premiumLivello = "proprietario";
      const fino = new Date(data.premium_fino).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
      showToast(`Benvenuto! Hai ${Math.round((data.giorni || 90) / 30)} mesi di Premium gratis grazie a ${data.nome}, fino al ${fino}.`);
      return;
    }
    if(data?.errore === "profilo") return;
    refCancella();
    const msg = { gia_usato: "Hai già usato un codice invito.", gia_premium: "Sei già Premium: il codice invito non serve.", non_nuovo: "Il codice invito vale solo per i nuovi iscritti.", esaurito: "Questo codice invito ha esaurito i posti.", codice_non_valido: "Questo codice invito non è più valido." }[data?.errore];
    if(msg) showToast(msg);
  } finally { refInCorso = false; }
}
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", refMostraAvvisi); else setTimeout(refMostraAvvisi, 0);


/* ==================== HOME A WIDGET (ottobre 2026) ====================
   Vista Widget (predefinita) o Standard: interruttore nel menu profilo, salvato in profiles.home_vista.
   Le Home Standard restano nella pagina; con body.vista-widget si vedono solo i widget.
   Professionista: Oggi (grande) · Messaggi · Incassi · Da richiamare · Nuovo appuntamento · Giro · Settimana.
   Proprietario: Prossime scadenze (grande) · Spese · Messaggi · Prossimo appuntamento · + Spesa · + Evento · I miei cavalli · Lezioni.
   I dati arrivano dalle stesse funzioni della Home Standard: i widget si ridisegnano quando queste finiscono. */
const WG_IC = {
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  msg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  euro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M17 6.5A6.5 6.5 0 1 0 17 17.5M4 10.5h9M4 13.5h9"/></svg>',
  camp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5h4"/></svg>',
  mappa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-8-8 18-2-8z"/></svg>',
  giro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/></svg>',
  sett: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 20V12M10 20V6M15 20v-9M20 20V9"/></svg>',
  scad: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.5-7-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7 3.5C19 16.5 12 21 12 21z"/></svg>',
  cav: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 20c0-5 1-8 4-11l-1-4 3 2 2-2 1 3c2 1 3 3 3 5l-2 1-2-1-1 7"/></svg>',
  lez: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-5 9 5-9 5z"/><path d="M7 11v5c3 2 7 2 10 0v-5"/></svg>',
  piu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
};
const wgEsc = s => escapeHtml(String(s ?? ""));
const wgEuro = n => "€ " + Math.round(Number(n) || 0).toLocaleString("it-IT");
function vistaWidgetAttiva(){ return true; }  // Home a widget unica (16/10/2026): niente più Home classica
function incassiNascosti(){ return !!(currentUser && currentUser.incassiNascosti); }


/* ==================== HOME DEL MANISCALCO (ottobre 2026) ====================
   Solo per il maniscalco (Hammer). Saluto + meteo · banner a 3 riquadri (dalla tabella home_banner, gestita da noi:
   foto/logo, Oggi, Hammer; più avanti sponsor) · 5 cerchi (Portami da…, Scadenze, Da incassare, Cerca, Altro) ·
   righe Cavalli/Clienti/Scuderie/Incassi · Messaggi (sinistra) e «+» (destra) flottanti · menu Home · Agenda · HAMMER · Clienti · Cavalli.
   I dati arrivano dalle stesse funzioni della Home di prima (hpAppuntamenti, hpRichiamiLista, wgPro). */
const HM_IC = {
  hammer: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg>',
  users: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  ferro: '<svg class="hm-svg pieno" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-ferro"/></svg>',
  cal: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2v4M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>',
  nav: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 22 2l-9 19-2-8z"/></svg>',
  cerca: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.3-4.3"/></svg>',
  wallet: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-wallet"/></svg>',
  inbox: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-inbox"/></svg>',
  menu: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  aiuto: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/></svg>',
  slider: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>',
  qr: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/></svg>',
};
const HM_NAV = `
  <button class="nav-btn" data-page="pro-home" onclick="showPage('pro-home')"><span class="icon"><svg><use href="#i-home"/></svg></span><small>Home</small></button>
  <button class="nav-btn" data-page="pro-agenda" onclick="showPage('pro-agenda')"><span class="icon"><svg><use href="#i-calendar"/></svg></span><small>Agenda</small></button>
  <button class="nav-btn nav-hammer" id="nav-hammer" onclick="openAiSheet()" aria-label="Hammer, agente di mascalcia"><span class="hm-ham">${HM_IC.hammer}<i class="hm-ham-dot"></i></span><small>Hammer</small></button>
  <button class="nav-btn" data-page="pro-inbox" onclick="hmMessaggi()"><span class="icon hm-ico">${HM_IC.inbox}</span><small>Messaggi</small><span class="inbox-nav-badge" id="inbox-nav-badge" style="display:none"></span></button>
  <button class="nav-btn" data-page="pro-clienti" data-cart="clienti" onclick="hmCartella('clienti')"><span class="icon hm-ico">${HM_IC.users}</span><small>Clienti</small></button>`;
let hmNavOriginale = null;
function homeManAttiva(){ return !!currentUser && agenteAiHammer(); }
function applicaHomeMan(){
  const on = homeManAttiva();
  document.body.classList.toggle("home-man", on);
  const nav = document.getElementById("bottom-nav-pro");
  if(!nav) return;
  if(hmNavOriginale === null) hmNavOriginale = nav.innerHTML;
  if(on && !nav.dataset.man){ nav.innerHTML = HM_NAV; nav.dataset.man = "1"; }
  else if(!on && nav.dataset.man){ nav.innerHTML = hmNavOriginale; delete nav.dataset.man; }
  const pg = document.querySelector(".page-content.active")?.id?.replace("page-", "");
  if(pg) hmNavAttivo(pg);
  hmNovitaHammer();
  if(on){
    renderHomeMan();
    if(document.getElementById("page-pro-home")?.classList.contains("active")) setTimeout(() => { try{ meteoHome(); }catch(e){} }, 0);
  }
}
// Clienti e Cavalli aprono la stessa pagina su cartelle diverse: si accende quello giusto
function hmNavAttivo(page){
  document.body.dataset.pagina = page;
  if(!document.body.classList.contains("home-man")) return;
  document.querySelectorAll("#bottom-nav-pro .nav-btn").forEach(b => {
    let on = b.dataset.page === page;
    if(on && b.dataset.cart) on = (b.dataset.cart === "cavalli") === (cliCartella === "cavalli");
    b.classList.toggle("active", on);
  });
  if(page !== "pro-home") hmChiudi();
}
function hmNovitaHammer(){
  const nh = document.getElementById("nav-hammer");
  if(nh) nh.classList.toggle("pulsa", !!document.getElementById("ai-fab")?.classList.contains("con-novita"));
}
function hmCartella(k){
  hmChiudi();
  showPage("pro-clienti");
  if(typeof closeClienteDetail === "function") closeClienteDetail();
  sceltaCartellaClienti(k);
  hmNavAttivo("pro-clienti");
}
function hmMessaggi(){ hmChiudi(); showPage("pro-inbox"); if(typeof loadColleghiList === "function") loadColleghiList(); }
function hmDaIncassare(){
  hmChiudi();
  if(typeof incAperta !== "undefined") incAperta = "dasaldare";
  if(typeof incVista !== "undefined") incVista = "semplice";
  showPage("pro-incassi");
  if(typeof renderIncassi === "function") renderIncassi();
}
async function hmGiaFatto(){
  await openInterventoModal(null);
  const d = document.getElementById("intervento-data"); d.value = isoLocale(new Date()); aggiornaGiaFatto(); aggiornaQuando();
  const g = document.getElementById("intervento-gia-fatto"); if(g) g.checked = true;
}
// «+»: × verde quando è aperto
function hmPiu(){
  const aperto = document.getElementById("hm-menu-piu").classList.contains("on");
  hmChiudi();
  if(aperto) return;
  document.getElementById("hm-menu-piu").classList.add("on");
  document.getElementById("hm-piu").classList.add("aperto");
  document.getElementById("hm-velo").classList.add("on");
}
function hmChiudi(){
  ["hm-menu-piu", "hm-velo", "hm-foglio"].forEach(id => document.getElementById(id)?.classList.remove("on"));
  document.getElementById("hm-piu")?.classList.remove("aperto");
}
function hmFoglio(titolo, sotto, corpo){
  hmChiudi();
  document.getElementById("hm-foglio-tit").textContent = titolo;
  document.getElementById("hm-foglio-s").textContent = sotto || "";
  document.getElementById("hm-foglio-corpo").innerHTML = corpo;
  document.getElementById("hm-velo").classList.add("on");
  document.getElementById("hm-foglio").classList.add("on");
}
/* ==================== MODALITÀ LAVORO DEL MANISCALCO (ottobre 2026) ====================
   Regola di Alessandro: DURANTE l'intervento il telefono non si usa (la distrazione è pericolosa per lui e per il cavallo).
   Quindi: PRIMA (all'arrivo, una scheda da leggere: sicurezza e problemi per piede lasciati l'ultima volta) →
   DURANTE (l'app sta zitta: profiles.lavoro_fino mette in pausa le notifiche dei messaggi) →
   DOPO (al furgone: «Chiudi la tappa»; ogni cavallo è «Regolare», i problemi si segnano solo se ci sono, sul piede giusto).
   Tasti grandi, conferme a scorrimento (mai un tocco singolo che chiude per sbaglio). Stato salvato sul telefono: riaprendo l'app si torna lì. */
const ML_PIEDI = [["as", "Ant. sx", "anteriore sinistro"], ["ad", "Ant. dx", "anteriore destro"], ["ps", "Post. sx", "posteriore sinistro"], ["pd", "Post. dx", "posteriore destro"]];
const ML_VOCI = [["ferro perso", "ferro"], ["parete sfaldata", "alert"], ["ascesso o dolore", "alert"], ["fettone", "alert"], ["zoppia", "alert"], ["altro", "nota"]];
const ML_IC = {
  ferro: '<svg class="pi" viewBox="0 0 24 24"><use href="#i-ferro"/></svg>',
  alert: '<svg class="li" viewBox="0 0 24 24"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  nota: '<svg class="li" viewBox="0 0 24 24"><path d="M4 4h12l4 4v12H4z"/><path d="M8 12h8M8 16h5"/></svg>',
  check: '<svg class="li" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  dx: '<svg class="li" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  x: '<svg class="li" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  cam: '<svg class="li" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  hammer: '<svg class="li" viewBox="0 0 24 24"><path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg>',
  cal: '<svg class="li" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  chat: '<svg class="li" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  indietro: '<svg class="li" viewBox="0 0 24 24"><path d="M15 18 9 12l6-6"/></svg>'
};
let ml = null;            // tappa in corso { key, nome, uid, fase, ids[], importi{}, pag, inizio }
let mlEventi = [], mlInfo = {}, mlProb = null;
function mlSalva(){ try{ if(ml) localStorage.setItem("equo-lavoro", JSON.stringify(ml)); else localStorage.removeItem("equo-lavoro"); }catch(e){} }
function mlOggi(){ return isoLocale(new Date()); }
// tappe di oggi ancora da fare, una per luogo (come «Portami da…»)
async function mlTappeOggi(){
  try{ await caricaUbicazioni(); }catch(e){}
  const oggi = mlOggi();
  const app = agOrdinaGiro((hpAppuntamenti || []).filter(e => e.data_intervento === oggi && !["annullato", "rifiutato", "fatto"].includes(e.stato)));
  const per = new Map();
  app.forEach(e => { const l = luogoEvento(e, true); if(!per.has(l.key)) per.set(l.key, { l, eventi: [] }); per.get(l.key).eventi.push(e); });
  return [...per.values()];
}
function mlCavId(e){
  if(e.cavallo_cliente_id) return e.cavallo_cliente_id;
  const r = e.horse_id && typeof cavalliMieiByHorse !== "undefined" ? cavalliMieiByHorse[e.horse_id] : null;
  return r ? r.id : null;
}
async function mlApri(key){
  const tappe = await mlTappeOggi();
  const t = tappe.find(x => x.l.key === key) || tappe[0];
  if(!t){ showToast("Nessuna tappa da fare oggi."); return; }
  ml = { key: t.l.key, nome: t.l.nome, uid: currentUser?.id, fase: "prima", ids: t.eventi.map(e => e.id), importi: {}, pag: "saldato", inizio: Date.now(), giorno: mlOggi() };
  mlSalva();
  await mlCarica();
  mlRender();
}
// dati della tappa: appuntamenti, avvisi di sicurezza, problemi aperti per piede
async function mlCarica(){
  mlEventi = (ml.ids || []).map(id => agEventiCache[id] || (hpAppuntamenti || []).find(e => e.id === id)).filter(Boolean);
  if(!mlEventi.length && !DEMO_MODE){
    const { data } = await sb.from("interventi_mascalcia").select("*, clienti_mascalcia(nome, cliente_user_id), cavalli_clienti_mascalcia(nome)").in("id", ml.ids);
    mlEventi = data || [];
  }
  const cav = [...new Set(mlEventi.map(mlCavId).filter(Boolean))];
  mlInfo = {};
  cav.forEach(id => { mlInfo[id] = { avviso: null, aperti: [], anno: [] }; });
  if(cav.length && !DEMO_MODE){
    try{
      const [a, p] = await Promise.all([
        sb.from("cavalli_clienti_mascalcia").select("id, avviso_sicurezza").in("id", cav),
        sb.from("cavalli_problemi_piede").select("id, cavallo_cliente_id, piede, voci, nota, ricontrolla_il, risolto_il, creato_il").in("cavallo_cliente_id", cav)
          .gte("creato_il", new Date(Date.now() - 365 * 86400e3).toISOString()).order("creato_il", { ascending: false })
      ]);
      (a.data || []).forEach(r => { if(mlInfo[r.id]) mlInfo[r.id].avviso = r.avviso_sicurezza || null; });
      (p.data || []).forEach(r => { const m = mlInfo[r.cavallo_cliente_id]; if(!m) return; m.anno.push(r); if(!r.risolto_il) m.aperti.push(r); });
    }catch(e){ console.warn("modalità lavoro:", e); }
  }
  if(DEMO_MODE && cav[0] && mlInfo[cav[0]]){
    mlInfo[cav[0]].aperti = [{ piede: "pd", voci: ["ferro perso", "parete sfaldata"], ricontrolla_il: mlOggi(), creato_il: new Date(Date.now() - 20 * 86400e3).toISOString() }];
    mlInfo[cav[0]].anno = mlInfo[cav[0]].aperti.slice();
    if(cav[1] && mlInfo[cav[1]]) mlInfo[cav[1]].avviso = "Scalcia dietro quando gli si alza il posteriore sinistro.";
  }
  // importi proposti (l'ultimo prezzo di quel cavallo o cliente)
  const mancano = mlEventi.filter(e => ml.importi[e.id] === undefined);
  if(mancano.length){
    for(const e of mancano){
      let v = e.importo;
      if(v == null && !incassiNascosti()){ try{ v = (await importiSuggeriti(e, [{ cavallo_cliente_id: e.cavallo_cliente_id, horse_id: e.horse_id }]))[0]; }catch(x){ v = null; } }
      ml.importi[e.id] = v == null ? "" : String(v);
    }
    mlSalva();
  }
}
const mlNomePiede = k => (ML_PIEDI.find(p => p[0] === k) || [k, k, k])[2];
const mlSigla = k => String(k || "").toUpperCase();
function mlRigaCavallo(e){ return { nome: agNomeCavallo(e) || "Cavallo", cli: e.clienti_mascalcia?.nome || clienteDiId(e.cliente_mascalcia_id)?.nome || "" }; }

