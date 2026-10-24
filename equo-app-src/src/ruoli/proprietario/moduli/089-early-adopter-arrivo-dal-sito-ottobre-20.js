// Equo App · proprietario · modulo (moduli ES, costruiti con Vite in ruoli/proprietario/costruito.js)
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

/* ==================== INVITO DEL PROFESSIONISTA DAL QR (25/10/2026) ====================
   Link/QR app.equohub.com/?invito=EQUO-XXXXX (PDF di appuntamento, conto e resoconto; scheda cliente; «Invia l'invito»).
   Il codice si ricorda 30 giorni sul telefono; appena c'è un profilo proprietario il collegamento parte da solo
   (riscatta_codice_maniscalco, la stessa di Chat → «Il tuo maniscalco» → Collega), poi la proposta dei cavalli preparati. */
const INV_KEY = "equo-invito";
(function invitoDaUrl(){
  const p = new URLSearchParams(location.search);
  const v = (p.get("invito") || "").trim().toUpperCase();
  if(v && /^EQUO-[A-Z0-9-]{3,20}$/.test(v)){
    lsSet(INV_KEY, JSON.stringify({ codice: v, t: Date.now() }));
    p.delete("invito");
    history.replaceState({}, "", location.pathname + (p.toString() ? "?" + p.toString() : ""));
  }
})();
function invitoLeggi(){
  try{
    const v = JSON.parse(lsGet(INV_KEY) || "null");
    if(v && v.codice && Date.now() - v.t < 30 * 86400000) return v;
  }catch(e){}
  return null;
}
function invitoCancella(){ lsDel(INV_KEY); document.querySelectorAll(".inv-avviso").forEach(el => el.remove()); }
function invitoMostraAvvisi(){
  if(!invitoLeggi() || (typeof DEMO_MODE !== "undefined" && DEMO_MODE)) return;
  const html = t => `<div class="ref-avviso inv-avviso"><span class="early-medaglia">★</span><div><b>Colleghiamoci su Equo</b><span>Il tuo professionista ti ha invitato</span><small>${t}</small></div></div>`;
  const tag = document.querySelector("#screen-auth .auth-tagline");
  if(tag && !document.querySelector("#screen-auth .inv-avviso")) tag.insertAdjacentHTML("afterend", html("Crea il tuo account gratuito e scegli «Ho un cavallo»: il collegamento parte da solo."));
  const lista = document.querySelector("#onb-step-1 .role-list");
  if(lista && !document.querySelector("#onb-step-1 .inv-avviso")) lista.insertAdjacentHTML("beforebegin", html("Scegli «Ho un cavallo»: ti colleghiamo subito."));
}
let invitoInCorso = false;
async function invitoControlla(){
  if(DEMO_MODE || !currentUser || invitoInCorso) return;
  const r = invitoLeggi();
  if(!r) return;
  const ruoli = [currentUser.ruolo, currentUser.ruoloSecondario].filter(Boolean);
  if(!ruoli.includes("proprietario")) return;   // lo teniamo: si applica quando c'è il profilo proprietario
  invitoInCorso = true;
  try{
    const res = await DB.riscattaCodiceManiscalco(r.codice);
    if(res?.ok){
      invitoCancella();
      const nome = res.nome_maniscalco || "il tuo professionista";
      showToast("Collegato a " + nome + "!");
      if(currentUser.vistaAttiva === "proprietario"){
        if(typeof loadFarrierChatSection === "function") await loadFarrierChatSection().catch(() => {});
        if(typeof proponiAbbinamentoCavalli === "function") await proponiAbbinamentoCavalli(res.cliente_mascalcia_id, nome, () => { if(typeof openFarrierChatThread === "function") openFarrierChatThread(res.cliente_mascalcia_id, nome); });
      }
      return;
    }
    if(res?.errore === "errore" || res?.errore === "non_autenticato") return;   // problema di rete o sessione: riprova al prossimo accesso
    invitoCancella();
    const msg = { codice_non_valido: "Il codice invito non è più valido: chiedi al tuo professionista di mandartelo di nuovo.", codice_gia_usato: "Questo invito è già stato usato da un altro account.", codice_tuo: "Questo è un tuo invito: va dato al cliente." }[res?.errore];
    if(msg) showToast(msg);
  } finally { invitoInCorso = false; }
}
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", invitoMostraAvvisi); else setTimeout(invitoMostraAvvisi, 0);


/* ==================== HOME A WIDGET (ottobre 2026) ====================
   Vista Widget (predefinita) o Standard: interruttore nel menu profilo, salvato in profiles.home_vista.
   Le Home Standard restano nella pagina; con body.vista-widget si vedono solo i widget.
   Professionista: Oggi (grande) · Messaggi · Incassi · Da richiamare · Nuovo appuntamento · Giro · Settimana.
   Proprietario: Prossime scadenze (grande) · Spese · Messaggi · Prossimo appuntamento · + Spesa · + Evento · I miei cavalli · Lezioni.
   I dati arrivano dalle stesse funzioni della Home Standard: i widget si ridisegnano quando queste finiscono. */
/* -> stato-condiviso.js */
/* -> stato-condiviso.js */
/* -> stato-condiviso.js */
function vistaWidgetAttiva(){ return true; }  // Home a widget unica (16/10/2026): niente più Home classica
function incassiNascosti(){ return !!(currentUser && currentUser.incassiNascosti); }


/* ==================== HOME DEL MANISCALCO (ottobre 2026) ====================
   Solo per il maniscalco (Hammer). Saluto + meteo · banner a 3 riquadri (dalla tabella home_banner, gestita da noi:
   foto/logo, Oggi, Hammer; più avanti sponsor) · 5 cerchi (Portami da…, Scadenze, Da incassare, Cerca, Altro) ·
   righe Cavalli/Clienti/Scuderie/Incassi · Messaggi (sinistra) e «+» (destra) flottanti · menu Home · Agenda · HAMMER · Clienti · Cavalli.
   I dati arrivano dalle stesse funzioni della Home di prima (hpAppuntamenti, hpRichiamiLista, wgPro). */
/* -> stato-condiviso.js */
/* -> stato-condiviso.js */
let hmNavOriginale = null;
function homeManAttiva(){ return !!currentUser && agenteAiHammer(); }
function applicaHomeMan(){ const x = applicaHomeManBase.apply(this, arguments); eseguiEstensioniSubito(estensioniDopo, "applicaHomeMan"); return x; }
function applicaHomeManBase(){
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
function hmPiu(){ eseguiEstensioniSubito(estensioniPrima, "hmPiu"); return hmPiuBase.apply(this, arguments); }
function hmPiuBase(){
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
/* -> stato-condiviso.js */
/* -> stato-condiviso.js */
/* -> stato-condiviso.js */
/* -> stato-condiviso.js */            // tappa in corso { key, nome, uid, fase, ids[], importi{}, pag, inizio }
/* -> stato-condiviso.js */
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
/* -> stato-condiviso.js */
/* -> stato-condiviso.js */
function mlRigaCavallo(e){ return { nome: agNomeCavallo(e) || "Cavallo", cli: e.clienti_mascalcia?.nome || clienteDiId(e.cliente_mascalcia_id)?.nome || "" }; }


export { invitoControlla, applicaHomeMan, earlyAggiornaBottoneLifetime, earlyCancella, earlyControlla, earlyDopoRitorno, earlyLeggi, earlyNonOra, earlyPaga, hmCartella, hmChiudi, hmDaIncassare, hmFoglio, hmGiaFatto, hmMessaggi, hmNavAttivo, hmNovitaHammer, hmPiu, incassiNascosti, mlApri, mlCarica, mlCavId, mlOggi, mlRigaCavallo, mlSalva, mlTappeOggi, referralControlla, vistaWidgetAttiva };
