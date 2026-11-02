// Equo App · agenti · DETTATURA COMUNE (2/11/2026, decisione di Simone)
// Un solo pannello per tutti i professionisti: si detta (microfono di Equo dove il telefono lo permette, altrimenti
// il microfono della tastiera), l'agente del ruolo SISTEMA il testo (Galeno per il referto del veterinario, Hammer per
// il lavoro del maniscalco: netlify/agente/dettatura.js) e il professionista conferma, una proposta per volta, cosa inserire.
// Si salva solo il testo confermato: il dettato grezzo non resta da nessuna parte.
//
// apriDettatura(cfg) · cfg:
//   tipo: "referto" | "ferratura"           → istruzioni dell'agente sul server
//   agente: "Galeno" | "Hammer"             → nome nei tasti
//   titolo, sotto, aiuto                     → testata e riga d'aiuto
//   contesto(): testo                        → dati della scheda per l'agente (facoltativo)
//   proposte(dati, dettato): [{ k, titolo, testo, modificabile, on, nota, disabilitata }]
//   conferma(scelte, dati): Promise          → applica le proposte scelte
//   demo(dettato): dati                      → in prova (senza agente)
// dtScegliDiOggi({ titolo, sotto, vuoto, cerca, onScelta }) → scelta tra gli appuntamenti di oggi (e la ricerca dei cavalli).

const DT_IC = {
  mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5"/></svg>',
  stop: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'
};
const DT = { cfg: null, passo: "detta", testo: "", dati: null, proposte: [], rec: null, ascolta: false, base: "", lavoro: false, scelta: null };
const dtEsc = s => escapeHtml(s == null ? "" : String(s));

function dtMicDisponibile(){ return !!(window.SpeechRecognition || window.webkitSpeechRecognition); }

function dtFoglio(){
  let f = document.getElementById("dt-foglio");
  if(!f){
    f = document.createElement("div"); f.id = "dt-foglio"; f.className = "dt-foglio"; f.setAttribute("role", "dialog"); f.setAttribute("aria-modal", "true");
    f.innerHTML = `<div class="dt-box"><div class="dt-testa"><div class="dt-tt"><b id="dt-titolo"></b><small id="dt-sotto"></small></div>
      <button class="dt-x" onclick="dtChiudi()" aria-label="Chiudi">${DT_IC.x}</button></div><div class="dt-corpo" id="dt-corpo"></div><div class="dt-piede" id="dt-piede"></div></div>`;
    document.body.appendChild(f);
  }
  return f;
}
function dtApri(titolo, sotto){
  dtFoglio().classList.add("aperto"); document.body.classList.add("dt-aperto");
  document.getElementById("dt-titolo").textContent = titolo || "Detta";
  document.getElementById("dt-sotto").textContent = sotto || "";
}

/* ---------------- 1. DETTA ---------------- */
function apriDettatura(cfg){
  dtFerma();
  DT.cfg = cfg; DT.passo = "detta"; DT.testo = cfg.testo || ""; DT.dati = null; DT.proposte = []; DT.lavoro = false;
  dtApri(cfg.titolo, cfg.sotto);
  dtDisegna();
}
function dtDisegna(){
  const c = DT.cfg; if(!c) return;
  const corpo = document.getElementById("dt-corpo"), piede = document.getElementById("dt-piede");
  if(DT.passo === "detta"){
    const mic = dtMicDisponibile();
    corpo.innerHTML = (c.aiuto ? `<div class="dt-aiuto">${dtEsc(c.aiuto)}</div>` : "")
      + `<textarea id="dt-testo" class="dt-testo" rows="9" placeholder="${dtEsc(c.segnaposto || "Parla o scrivi: cosa hai visto, cosa significa, cosa fare…")}" oninput="dtScrivi(this.value)">${dtEsc(DT.testo)}</textarea>`
      + (mic ? `<div class="dt-mic-r"><button type="button" class="dt-mic${DT.ascolta ? " on" : ""}" id="dt-mic" onclick="dtMic()" aria-pressed="${DT.ascolta}">${DT.ascolta ? DT_IC.stop : DT_IC.mic}<span>${DT.ascolta ? "Ferma" : "Tocca e parla"}</span></button>
          <span class="dt-stato" id="dt-stato">${DT.ascolta ? "Ti ascolto…" : ""}</span></div>
          <div class="dt-nota">Puoi anche usare il microfono 🎙 della tastiera.</div>`
        : `<div class="dt-nota">Per dettare tocca il microfono 🎙 della tastiera.</div>`)
      + `<div class="dt-nota">${dtEsc(c.agente)} sistema il testo: non aggiunge niente che tu non abbia detto. Dopo controlli e confermi.</div>`
      + `<div class="dt-errore" id="dt-errore" hidden></div>`;
    piede.innerHTML = `<button class="dt-btn" onclick="dtChiudi()">Annulla</button><button class="dt-btn pri" id="dt-sistema" onclick="dtSistema()"${DT.lavoro ? " disabled" : ""}>${DT.lavoro ? dtEsc(c.agente) + " scrive…" : "Sistema con " + dtEsc(c.agente)}</button>`;
    return;
  }
  // 2. RIVEDI E CONFERMA
  const p = DT.proposte;
  corpo.innerHTML = (DT.dati?.da_controllare ? `<div class="dt-avviso"><b>Da controllare:</b> ${dtEsc(DT.dati.da_controllare)}</div>` : "")
    + (p.length ? `<div class="dt-aiuto">Ecco cosa inserirei. Correggi se serve e togli la spunta a quello che non vuoi.</div>` + p.map((x, i) => `
      <div class="dt-prop${x.on && !x.disabilitata ? " on" : ""}${x.disabilitata ? " spenta" : ""}">
        <label class="dt-prop-t"><input type="checkbox" ${x.on && !x.disabilitata ? "checked" : ""} ${x.disabilitata ? "disabled" : ""} onchange="dtAttiva(${i}, this.checked)"><b>${dtEsc(x.titolo)}</b></label>
        ${x.nota ? `<small class="dt-prop-n">${dtEsc(x.nota)}</small>` : ""}
        ${x.modificabile ? `<textarea class="dt-prop-x" rows="${Math.min(10, Math.max(3, Math.ceil(String(x.testo || "").length / 42)))}" oninput="dtTesto(${i}, this.value)"${x.disabilitata ? " disabled" : ""}>${dtEsc(x.testo)}</textarea>`
          : `<div class="dt-prop-d">${dtEsc(x.testo)}</div>`}
      </div>`).join("")
      : `<div class="dt-aiuto">Non ho trovato niente da inserire. Torna al dettato e aggiungi qualcosa.</div>`);
  piede.innerHTML = `<button class="dt-btn" onclick="dtIndietro()">Torna al dettato</button><button class="dt-btn pri" onclick="dtConferma()"${p.length ? "" : " disabled"}>${dtEsc(DT.cfg.tastoConferma || "Inserisci")}</button>`;
}
function dtScrivi(v){ DT.testo = v; if(DT.ascolta){ DT.base = v; DT.da = DT.nRis || 0; } }

/* ---- microfono di Equo (riconoscimento vocale del telefono, italiano) ----
   2/11/2026: il testo della sessione si ricostruisce ogni volta da TUTTI i risultati. Chrome su Android, in ascolto continuo,
   rimanda a ogni pausa la frase intera detta fin lì («afferrato», «afferrato aressinetto», …): se un pezzo ripete il precedente
   lo sostituisce invece di aggiungersi. Su iPhone e computer i pezzi sono già separati e si mettono in fila. */
function dtTestoSessione(results, da){
  const parti = [];
  for(let i = da || 0; i < results.length; i++){
    const t = String(results[i][0]?.transcript || "").replace(/\s+/g, " ").trim(); if(!t) continue;
    const ult = parti[parti.length - 1], tl = t.toLowerCase(), ul = (ult || "").toLowerCase();
    if(ult && tl.startsWith(ul)) parti[parti.length - 1] = t;          // stessa frase, più lunga (Android)
    else if(ult && ul.startsWith(tl)) continue;                          // ripetizione più corta: niente
    else parti.push(t);
  }
  return parti.join(" ");
}
function dtMic(){
  if(DT.ascolta) return dtFerma(true);
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if(!SR) return;
  const r = new SR(); r.lang = "it-IT"; r.continuous = true; r.interimResults = true;
  DT.rec = r; DT.ascolta = true; DT.base = DT.testo; DT.da = 0; DT.nRis = 0;
  r.onresult = ev => {
    DT.nRis = ev.results.length;
    const sess = dtTestoSessione(ev.results, DT.da);
    DT.testo = DT.base + (sess ? (DT.base && !/\s$/.test(DT.base) ? " " : "") + sess : "");
    const ta = document.getElementById("dt-testo"); if(ta){ ta.value = DT.testo; ta.scrollTop = ta.scrollHeight; }
  };
  r.onerror = ev => {
    if(ev.error === "no-speech" || ev.error === "aborted") return;
    DT.ascolta = false;
    showToast(ev.error === "not-allowed" || ev.error === "service-not-allowed" ? "Il microfono non è permesso: attivalo nelle impostazioni del telefono, oppure usa il 🎙 della tastiera." : "Il riconoscimento vocale si è fermato: usa il 🎙 della tastiera.");
    if(DT.passo === "detta") dtDisegna();
  };
  // Android si ferma dopo qualche secondo di silenzio: quello detto resta e, se stai ancora dettando, riparte da solo
  r.onend = () => {
    DT.base = DT.testo; DT.da = 0; DT.nRis = 0;
    if(DT.ascolta && DT.rec === r){ try{ r.start(); }catch(_){ DT.ascolta = false; if(DT.passo === "detta") dtDisegna(); } }
  };
  try{ r.start(); }catch(_){ DT.ascolta = false; showToast("Il microfono non parte: usa il 🎙 della tastiera."); }
  dtDisegna();
}
function dtFerma(ridisegna){
  const r = DT.rec; DT.ascolta = false; DT.rec = null;
  if(r){ try{ r.stop(); }catch(_){} }
  if(ridisegna && DT.passo === "detta") dtDisegna();
}

/* ---- «Sistema con Galeno / Hammer» ---- */
async function dtSistema(){
  const c = DT.cfg; if(!c || DT.lavoro) return;
  dtFerma();
  const ta = document.getElementById("dt-testo"); if(ta) DT.testo = ta.value;
  const dettato = String(DT.testo || "").trim();
  if(dettato.length < 3) return showToast("Detta o scrivi qualcosa");
  const errore = m => { DT.lavoro = false; dtDisegna(); const e = document.getElementById("dt-errore"); if(e){ e.textContent = m; e.hidden = false; } };
  DT.lavoro = true; dtDisegna();
  let dati = null;
  try{
    if(DEMO_MODE){
      await new Promise(r => setTimeout(r, 250));
      dati = c.demo ? c.demo(dettato) : {};
    } else {
      let contesto = ""; try{ contesto = c.contesto ? String(c.contesto() || "") : ""; }catch(_){}
      const res = await fetch("/.netlify/functions/agent", { method: "POST", headers: await authHeaders(),
        body: JSON.stringify({ message: dettato, vista: "professionista", modalita: "dettatura", dettatura: c.tipo, contesto_app: contesto }) });
      const data = await res.json().catch(() => ({}));
      if(res.status === 401) return errore("Sessione scaduta: esci e rientra per usare " + c.agente + ".");
      if(res.status === 403) return errore(data.error || "La dettatura non è disponibile per il tuo profilo.");
      if(data.limite_raggiunto){ const g = data.uso?.periodo === "giorno"; return errore(`Hai usato tutti i messaggi di ${c.agente} di ${g ? "oggi" : "questo mese"}: il dettato resta qui, puoi copiarlo.`); }
      if(!res.ok || data.errore || !data.dettatura) return errore(data.reply || data.error || "Non riesco a sistemare il testo adesso: riprova tra poco.");
      dati = data.dettatura;
    }
  }catch(err){ console.error("dettatura:", err); return errore("Non riesco a raggiungere " + c.agente + ": controlla la connessione e riprova."); }
  DT.lavoro = false; DT.dati = dati || {};
  try{ DT.proposte = (c.proposte ? c.proposte(DT.dati, dettato) : []).filter(x => x && (x.testo || x.disabilitata)); }catch(err){ console.error("dettatura proposte:", err); DT.proposte = []; }
  DT.passo = "rivedi"; dtDisegna();
  document.getElementById("dt-corpo").scrollTop = 0;
}
function dtAttiva(i, on){ const x = DT.proposte[i]; if(x && !x.disabilitata){ x.on = !!on; const el = document.querySelectorAll("#dt-corpo .dt-prop")[i]; if(el) el.classList.toggle("on", !!on); } }
function dtTesto(i, v){ const x = DT.proposte[i]; if(x) x.testo = v; }
function dtIndietro(){ DT.passo = "detta"; dtDisegna(); }
async function dtConferma(){
  const c = DT.cfg; if(!c || DT.lavoro) return;
  const scelte = DT.proposte.filter(x => x.on && !x.disabilitata && String(x.testo || "").trim());
  if(!scelte.length) return showToast("Non hai scelto niente da inserire");
  DT.lavoro = true;
  try{ await c.conferma(scelte, DT.dati); }
  catch(err){ console.error("dettatura conferma:", err); showToast("Non inserito: " + (err?.message || err)); DT.lavoro = false; return; }
  DT.lavoro = false;
  dtChiudi();
}
function dtChiudi(){
  dtFerma();
  const f = document.getElementById("dt-foglio"); if(f) f.classList.remove("aperto");
  document.body.classList.remove("dt-aperto");
  DT.cfg = null; DT.scelta = null; DT.testo = ""; DT.proposte = []; DT.dati = null;
}

/* ---------------- SCELTA: appuntamenti di oggi (e ricerca dei cavalli) ---------------- */
function dtDiOggi(){
  const oggi = isoLocale(new Date());
  const visti = new Set();
  return (typeof hpAppuntamenti !== "undefined" ? hpAppuntamenti || [] : [])
    .filter(e => e && e.data_intervento === oggi && !["annullato", "rifiutato"].includes(e.stato) && (e.cavallo_cliente_id || e.horse_id))
    .filter(e => { if(visti.has(e.id)) return false; visti.add(e.id); return true; })
    .sort((a, b) => String(a.ora || "99").localeCompare(String(b.ora || "99")));
}
function dtScegliDiOggi(cfg){
  dtFerma(); DT.cfg = null; DT.scelta = cfg; DT.passo = "scegli";
  dtApri(cfg.titolo || "Detta", cfg.sotto || "Scegli l'appuntamento");
  dtDisegnaScelta("");
}
function dtDisegnaScelta(q){
  const cfg = DT.scelta; if(!cfg) return;
  // cfg.eventi: elenco già pronto (veterinario: oggi + ultimi 7 giorni), raggruppato per giorno
  const oggi = cfg.eventi || dtDiOggi(), oggiIso = isoLocale(new Date());
  const nome = e => { try{ return agNomeCavallo(e) || ""; }catch(_){ return ""; } };
  const luogo = e => e.clienti_mascalcia?.nome || (typeof clienteDiId === "function" ? clienteDiId(e.cliente_mascalcia_id)?.nome : "") || "";
  const qq = String(q || "").trim().toLowerCase();
  const cavalli = cfg.cerca && qq.length >= 2 && typeof cavalliCartella === "function"
    ? cavalliCartella().filter(c => String(c.nome || "").toLowerCase().includes(qq)).slice(0, 12) : [];
  const riga = (az, t, s, o) => `<button class="dt-scelta" onclick="${az}">${o ? `<span class="o">${dtEsc(o)}</span>` : ""}<span class="c"><b>${dtEsc(t)}</b><small>${dtEsc(s)}</small></span><span class="fr">›</span></button>`;
  const corpo = document.getElementById("dt-corpo");
  const giaCerca = document.getElementById("dt-cerca");
  const giorno = d => d === oggiIso ? "Oggi" : new Date(d + "T12:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
  let ultimo = null;
  const lista = (oggi.length ? oggi.map(e => { const g = e.data_intervento || oggiIso, testa = g !== ultimo ? `<div class="dt-h">${dtEsc(giorno(g))}</div>` : ""; ultimo = g;
        return testa + riga(`dtScelto('${e.id}')`, nome(e) || "Cavallo", [luogo(e), e.tipo_altro].filter(Boolean).join(" · "), e.ora ? String(e.ora).slice(0, 5) : ""); }).join("")
      : `<div class="dt-aiuto">${dtEsc(cfg.vuoto || "Oggi non hai appuntamenti.")}</div>` + (cfg.azioneVuoto ? `<button type="button" class="dt-btn pri dt-vuoto-az" onclick="dtChiudi();${cfg.azioneVuoto.az}">${dtEsc(cfg.azioneVuoto.testo)}</button>` : ""))
    + (cavalli.length ? `<div class="dt-h">Cavalli</div>` + cavalli.map(c => riga(`dtSceltoCavallo('${dtEsc(c.key || c.id || c.horse_id)}')`, c.nome || "Cavallo", (typeof clienteDiId === "function" ? clienteDiId(c.cliente_mascalcia_id)?.nome : "") || "")).join("")
      : cfg.cerca && qq.length >= 2 ? `<div class="dt-nota">Nessun cavallo con questo nome.</div>` : "");
  if(cfg.cerca && giaCerca){ document.getElementById("dt-lista").innerHTML = lista; return; }
  corpo.innerHTML = (cfg.cerca ? `<input class="dt-cerca" id="dt-cerca" type="search" placeholder="Cerca un cavallo" autocomplete="off" oninput="dtDisegnaScelta(this.value)">` : "") + `<div id="dt-lista">${lista}</div>`;
  document.getElementById("dt-piede").innerHTML = `<button class="dt-btn" onclick="dtChiudi()">Annulla</button>`;
}
function dtScelto(id){
  const cfg = DT.scelta, e = (cfg?.eventi || dtDiOggi()).find(x => x.id === id); if(!cfg || !e) return;
  dtChiudi(); cfg.onScelta({ e });
}
function dtSceltoCavallo(chiave){
  const cfg = DT.scelta; if(!cfg) return;
  const cv = (typeof cavalliCartella === "function" ? cavalliCartella() : []).find(c => String(c.key || c.id || c.horse_id) === String(chiave)); if(!cv) return;
  dtChiudi(); cfg.onScelta({ cv });
}

export { apriDettatura, dtMicDisponibile, dtMic, dtFerma, dtScrivi, dtSistema, dtAttiva, dtTesto, dtIndietro, dtConferma, dtChiudi, dtScegliDiOggi, dtDisegnaScelta, dtScelto, dtSceltoCavallo, dtDiOggi, DT };
