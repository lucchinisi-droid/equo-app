/* ---------- banner: riquadri dalla tabella home_banner (gestita da noi); se manca, i 3 di partenza ---------- */
const HM_BANNER_BASE = [
  { id: null, tipo: "foto", immagine: "assets/banner/cavallo.webp", titolo: "La cura del cavallo inizia dai dettagli." },
  { id: null, tipo: "oggi" },
  { id: null, tipo: "hammer", immagine: "assets/banner/hammer.webp", titolo: "Chiedi a Hammer:<br>«Chi devo richiamare questa settimana?»", testo: "Prova Hammer" },
];
let hmBanner = null, hmBannerTimer = null, hmBannerVisti = new Set(), hmBannerFermo = 0;
async function hmCaricaBanner(){
  if(hmBanner) return hmBanner;
  hmBanner = HM_BANNER_BASE;
  if(DEMO_MODE) return hmBanner;
  try{
    const oggi = isoLocale(new Date());
    const { data, error } = await sb.from("home_banner").select("id, tipo, titolo, testo, immagine, link, dal, al, pubblico, ordine")
      .eq("app", "maniscalco").eq("attivo", true).order("ordine", { ascending: true });
    if(!error && data && data.length){
      const prem = isPremium();
      const validi = data.filter(b => (!b.dal || b.dal <= oggi) && (!b.al || b.al >= oggi) && (b.pubblico === "tutti" || !b.pubblico || (b.pubblico === "premium") === prem));
      if(validi.length) hmBanner = validi;
    }
  }catch(e){}
  return hmBanner;
}
// titoli e testi del banner li scriviamo noi: ammessi solo <br>, <b>, <i>
function hmTestoBanner(t){ return escapeHtml(t || "").replace(/&lt;(\/?)(br|b|i)\s*\/?&gt;/gi, "<$1$2>"); }
function hmSlideHtml(b, i){
  const img = b.immagine ? ` style="background-image:url('${String(b.immagine).replace(/['"()\\]/g, "")}')"` : "";
  if(b.tipo === "oggi"){
    const oggi = isoLocale(new Date());
    const app = agOrdinaGiro((hpAppuntamenti || []).filter(e => e.data_intervento === oggi && !["annullato", "rifiutato"].includes(e.stato)));
    const righe = app.slice(0, 3).map(e => `<div class="r"><b>${e.ora ? String(e.ora).slice(0, 5) : "—"}</b>${escapeHtml(agNomeCavallo(e) || TIPO_FERRATURA_LABELS[e.tipo_ferratura] || "")} <span>· ${escapeHtml(e.clienti_mascalcia?.nome || "")}</span></div>`).join("");
    return `<div class="hm-slide" data-i="${i}" onclick="hmToccaBanner(${i})"><div class="cerchio-oro"></div>${HM_IC.cal.replace('class="hm-svg"', 'class="hm-svg ombra"')}
      <div class="eti">${HM_IC.cal}Oggi${app.length ? " · " + app.length + (app.length === 1 ? " appuntamento" : " appuntamenti") : ""}</div>
      ${app.length ? `<div class="lista">${righe}${app.length > 3 ? `<div class="r"><b>+${app.length - 3}</b><span>altri in agenda</span></div>` : ""}</div>`
        : `<div class="vuoto">Oggi niente in agenda.<small>Tocca per aprire l'agenda della settimana</small></div>`}</div>`;
  }
  if(b.tipo === "hammer") return `<div class="hm-slide foto" data-i="${i}"${img} onclick="hmToccaBanner(${i})"><div class="frase">${hmTestoBanner(b.titolo)}</div><div class="chip">${HM_IC.hammer}${escapeHtml(b.testo || "Prova Hammer")}</div></div>`;
  if(b.tipo === "foto") return `<div class="hm-slide foto" data-i="${i}"${img} onclick="hmToccaBanner(${i})"><div class="frase">${hmTestoBanner(b.titolo)}</div><div class="marchio"><img src="assets/icona-equo.png" alt="">Equo</div></div>`;
  // sponsor / messaggi nostri: immagine, titolo, testo e (facoltativo) link
  return `<div class="hm-slide foto" data-i="${i}"${img} onclick="hmToccaBanner(${i})"><div class="frase">${hmTestoBanner(b.titolo)}</div>${b.testo ? `<div class="chip">${escapeHtml(b.testo)}</div>` : ""}</div>`;
}
function hmToccaBanner(i){
  const b = (hmBanner || [])[i]; if(!b) return;
  hmBannerEvento(b, "tocco");
  if(b.tipo === "oggi") return showPage("pro-agenda");
  if(b.tipo === "hammer") return openAiSheet();
  if(b.link && /^https:\/\//.test(b.link)) return window.open(b.link, "_blank", "noopener");
}
function hmBannerEvento(b, tipo){
  if(!b || !b.id || DEMO_MODE) return;
  if(tipo === "vista"){ if(hmBannerVisti.has(b.id)) return; hmBannerVisti.add(b.id); }
  sb.rpc("equo_banner_evento", { p_banner: b.id, p_tipo: tipo }).then(() => {}, () => {});
}
async function hmRenderBanner(){
  const box = document.getElementById("hm-slides"), pall = document.getElementById("hm-pall");
  if(!box) return;
  const lista = await hmCaricaBanner();
  const pos = box.scrollLeft;
  box.innerHTML = lista.map(hmSlideHtml).join("");
  box.scrollLeft = pos;
  pall.innerHTML = lista.length > 1 ? lista.map((_, i) => `<i${i === hmBannerIdx() ? ' class="on"' : ""}></i>`).join("") : "";
  if(!box.dataset.pronto){
    box.dataset.pronto = "1";
    box.addEventListener("scroll", () => { clearTimeout(box._t); box._t = setTimeout(hmBannerAggiornaPallini, 80); }, { passive: true });
    ["touchstart", "pointerdown"].forEach(ev => box.addEventListener(ev, () => { hmBannerFermo = Date.now(); }, { passive: true }));
  }
  hmBannerAggiornaPallini();
  if(!hmBannerTimer) hmBannerTimer = setInterval(hmBannerAvanti, 6000);
}
function hmBannerIdx(){ const box = document.getElementById("hm-slides"); return box && box.clientWidth ? Math.round(box.scrollLeft / box.clientWidth) : 0; }
function hmBannerAggiornaPallini(){
  const i = hmBannerIdx();
  document.querySelectorAll("#hm-pall i").forEach((p, k) => p.classList.toggle("on", k === i));
  if(document.body.classList.contains("home-man") && document.getElementById("page-pro-home")?.classList.contains("active")) hmBannerEvento((hmBanner || [])[i], "vista");
}
function hmBannerAvanti(){
  const box = document.getElementById("hm-slides");
  if(!box || !box.clientWidth || document.hidden || !document.getElementById("page-pro-home")?.classList.contains("active")) return;
  if(Date.now() - hmBannerFermo < 8000) return;            // l'ha appena toccato: aspetta
  const n = (hmBanner || []).length; if(n < 2) return;
  const i = (hmBannerIdx() + 1) % n;
  const ridotto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  box.scrollTo({ left: i * box.clientWidth, behavior: ridotto ? "auto" : "smooth" });
}

function renderHomeMan(){
  if(!document.getElementById("hm")) return;
  caricaConfermePro(false, "hm-conferme");
  document.getElementById("hm-saluto").textContent = testoSaluto();
  document.getElementById("hm-data").textContent = new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
  // scadenze: in ritardo + entro 7 giorni
  const ric = hpRichiamiLista || [];
  const nScad = ric.filter(r => r.giorni <= 7).length;
  const ns = document.getElementById("hm-n-scad"); ns.hidden = !nScad; ns.textContent = nScad;
  // righe
  const attivi = typeof clientiAttivi === "function" ? clientiAttivi() : [];
  const nCav = typeof cavalliCartella === "function" ? cavalliCartella().length : 0;
  const nCli = attivi.filter(c => !isStruttura(c)).length, nScu = attivi.filter(isStruttura).length;
  document.getElementById("hm-r-cav").innerHTML = `<strong>${nCav}</strong> ${nCav === 1 ? "cavallo che segui" : "cavalli che segui"}`;
  document.getElementById("hm-r-cli").innerHTML = `<strong>${nCli}</strong> ${nCli === 1 ? "proprietario" : "proprietari"}`;
  document.getElementById("hm-r-scu").innerHTML = `<strong>${nScu}</strong> ${nScu === 1 ? "scuderia o maneggio" : "scuderie e maneggi"}`;
  const mese = new Date().toLocaleDateString("it-IT", { month: "long" });
  document.getElementById("hm-r-inc").innerHTML = `${mese} <strong>${wgEuro(wgPro.incassatoMese)}</strong>` + (wgPro.daIncassareMese ? ` · da incassare <strong>${wgEuro(wgPro.daIncassareMese)}</strong>` : "");
  // messaggi
  const n = wgPro.unread || 0, b = document.getElementById("hm-msg-n");
  if(b){ b.hidden = !n; b.textContent = n > 99 ? "99+" : n; }
  hmRenderBanner();
  hmTemperatura();
  // modalità Lavoro: si riprende la tappa in corso, oppure «Sei arrivato?» se apri l'app vicino a una tappa di oggi
  if(agenteAiHammer()){
    if(!mlRipresa){ mlRipresa = true; mlRiprendi().then(() => mlControllaArrivo()).catch(e => console.warn("lavoro:", e)); }
    else mlControllaArrivo().catch(e => console.warn("arrivo:", e));
  }
}
let mlRipresa = false;
// temperatura di oggi accanto all'icona del meteo (stessa previsione e cache del riquadro; la posizione non si chiede qui)
let hmTempT = 0;
async function hmTemperatura(){
  const el = document.getElementById("hm-temp");
  if(!el || typeof EquoMeteo === "undefined" || Date.now() - hmTempT < 60000) return;
  hmTempT = Date.now();
  const pos = DEMO_MODE ? { demo: true } : (typeof meteoUltimaPos === "function" ? meteoUltimaPos() : null);
  if(!pos) return;
  const d = await EquoMeteo.previsione(pos, { endpoint: "/.netlify/functions/meteo", token: async () => { try{ return (await sb.auth.getSession()).data.session?.access_token || ""; }catch(e){ return ""; } } });
  const ora = new Date().toTimeString().slice(0, 5);
  const o = d && d.giorni ? EquoMeteo.alle(d, isoLocale(new Date()), ora) : null;
  el.innerHTML = o && o.temp != null ? `${Math.round(o.temp)}°${d.luogo && !d.demo ? `<small>${escapeHtml(String(d.luogo).split(",")[0])}</small>` : ""}` : "";
}

