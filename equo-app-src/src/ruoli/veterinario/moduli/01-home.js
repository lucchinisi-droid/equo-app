// Equo App · veterinario · Home (29/10/2026, mockup «Equo Veterinario · le quattro pagine», Home 1 in colori C)
// Stessi dati della Home del maniscalco: appuntamenti e scadenze (renderProDeadlines → hpAppuntamenti, hpRichiamiLista),
// messaggi e incassi (wgPro), tasti «Portami da», «Scadenze», «Da incassare», «Altro» del maniscalco (hm*).
// Il contenitore #vh si crea qui dentro #page-pro-home; cosa si vede lo decide core/stili/10-regole-ruoli.css.
// La riga in alto (profilo, Cerca, tasti) è la barra comune dell'app, uguale per tutti i ruoli.

const VH_IC = {
  cerca: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  sole: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  portami: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 22 2l-9 19-2-8z"/></svg>',
  detta: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5"/></svg>',
  scadenze: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 22h14M5 2h14"/><path d="M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4a2 2 0 0 0 .6-1.4V2"/></svg>',
  euro: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 7a7 7 0 1 0 0 10M4 10h10M4 14h10"/></svg>',
  altro: '<svg viewBox="0 0 24 24" aria-hidden="true" class="pieno"><circle cx="6" cy="9" r="1.5"/><circle cx="12" cy="9" r="1.5"/><circle cx="18" cy="9" r="1.5"/><circle cx="6" cy="15" r="1.5"/><circle cx="12" cy="15" r="1.5"/><circle cx="18" cy="15" r="1.5"/></svg>',
  piu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'
};

// tipo di visita → etichetta e colore (rosso urgenza, oro vaccini e richiami, Tiffany il resto)
function vhEtichetta(e){
  const t = e.tipo_ferratura;
  if(t === "urgenza") return { cls: "urg", txt: "Urgente" };
  const ap = typeof vaaEtichetta === "function" ? vaaEtichetta(e) : null; if(ap) return ap;   // visita aperta: cavalli a fine visita (14)
  if(t === "vaccino") return { cls: "oro", txt: "Vaccino" };
  if(t === "mtc") return { cls: "tif", txt: "MTC" };
  if(t === "fisio") return { cls: "tif", txt: "Fisio" };
  if(t === "terapia") return { cls: "tif", txt: "Terapia" };
  if(t === "visita") return { cls: "tif", txt: "Controllo" };
  return { cls: "tif", txt: TIPO_FERRATURA_LABELS[t] || "Visita" };
}
// «Nerone · colica lieve»: cavallo e motivo (senza motivo, il tipo di visita)
function vhTitolo(e){
  const cav = agNomeCavallo(e);
  if(!cav && typeof vaaAperto === "function" && vaaAperto(e)) return `<b>Cavallo da segnare</b> · ${escapeHtml(typeof vapNomeLavoro === "function" ? vapNomeLavoro(e) : TIPO_FERRATURA_LABELS[e.tipo_ferratura] || "Visita")}`;
  const motivo = (e.tipo_altro || "").trim() || TIPO_FERRATURA_LABELS[e.tipo_ferratura] || "Visita";
  return cav ? `<b>${escapeHtml(cav)}</b> · ${escapeHtml(motivo)}` : `<b>${escapeHtml(motivo)}</b>`;
}
function vhLuogo(e){
  try{ return luogoEvento(e, true).nome; }catch(_){ return e.clienti_mascalcia?.nome || ""; }
}
function vhOra(e){ return e.ora ? String(e.ora).slice(0, 5) : "—"; }
function vhDaFare(e){ return !["annullato", "rifiutato", "fatto"].includes(e.stato); }

let vhKm = { giorno: null, km: null };
function vhBox(){
  const home = document.getElementById("page-pro-home");
  if(!home) return null;
  let box = document.getElementById("vh");
  if(!box){ box = document.createElement("div"); box.id = "vh"; box.className = "vh"; home.appendChild(box); }
  return box;
}

function renderHomeVet(){
  if(typeof eVeterinario !== "function" || !eVeterinario()) return;
  const box = vhBox(); if(!box) return;
  const oggi = isoLocale(new Date()), adesso = new Date().toTimeString().slice(0, 5);
  const app = (hpAppuntamenti || []).filter(vhDaFare);
  const diOggi = app.filter(e => e.data_intervento === oggi);
  const urg = diOggi.filter(e => e.tipo_ferratura === "urgenza").length;
  const ric = (hpRichiamiLista || []).filter(r => r.giorni <= 7).length;
  // terapie in corso (piano terapeutico, 11): si leggono una volta e la Home si ridisegna
  const ter = typeof ptConteggi === "function" ? ptConteggi() : { n: 0, saltate: 0 };
  if(typeof ptCaricaInCorso === "function" && !PT.inCorso && !PT.promessa) ptCaricaInCorso().then(() => { if(document.getElementById("vh")) renderHomeVet(); });
  const prima = diOggi.map(vhOra).filter(o => o !== "—").sort()[0];
  const km = vhKm.giorno === oggi && vhKm.km ? `${vhKm.km} km` : "";
  const nome = (currentUser?.nome || currentUser?.full_name || "").split(" ")[0];
  const data = new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
  const nMsg = wgPro?.unread || 0, inRitardo = (hpRichiamiLista || []).filter(r => r.giorni < 0).length;
  const avviso = nMsg ? { t: `hai ${nMsg} ${nMsg === 1 ? "messaggio da leggere" : "messaggi da leggere"}.`, az: "hmMessaggi()" }
    : inRitardo ? { t: `${inRitardo} ${inRitardo === 1 ? "cavallo è in ritardo" : "cavalli sono in ritardo"} con il richiamo.`, az: "hmScadenze()" }
    : urg ? { t: `oggi hai ${urg === 1 ? "un'urgenza" : urg + " urgenze"}: è la prima del giro.`, az: "showPage('pro-agenda')" } : null;

  box.innerHTML = `
    <div class="vh-saluto">${escapeHtml(testoSaluto())}${nome ? " " + escapeHtml(nome) : ""} · ${escapeHtml(data)}</div>
    <div class="vh-giro" role="button" tabindex="0" aria-label="Vedi le visite inserite" onclick="vhVisite(event)" onkeydown="if(event.key==='Enter')vhVisite(event)">
      <div class="vh-giro-et">Il giro di oggi</div>
      <div class="vh-giro-riga">
        <div><div class="vh-giro-n">${diOggi.length} ${diOggi.length === 1 ? "visita" : "visite"}</div>
          <div class="vh-giro-s">${[km, prima ? "prima alle " + prima : diOggi.length ? "" : "nessuna visita in agenda"].filter(Boolean).join(" · ")}</div></div>
        <button class="vh-giornata" onclick="event.stopPropagation();vhVisite()">Vedi visite <span aria-hidden="true">›</span></button>
      </div>
      <div class="vh-giro-num">
        <button onclick="event.stopPropagation();vhGiornata()"><b>${urg}</b><span>${urg === 1 ? "urgenza" : "urgenze"}</span></button>
        <button onclick="event.stopPropagation();ptElenco()"><b>${ter.n}</b><span>${ter.n === 1 ? "terapia" : "terapie"}${ter.saltate ? ` · <em class="vh-saltate">${ter.saltate} ${ter.saltate === 1 ? "saltata" : "saltate"}</em>` : ""}</span></button>
        <button onclick="event.stopPropagation();hmScadenze()"><b>${ric}</b><span>${ric === 1 ? "richiamo" : "richiami"}</span></button>
      </div>
    </div>
    ${typeof vaaBannerHtml === "function" ? vaaBannerHtml(app) : ""}
    <div class="vh-cerchi">
      <button onclick="hmPortami()"><span class="c">${VH_IC.portami}</span>Portami da</button>
      <button onclick="vhDetta()"><span class="c">${VH_IC.detta}</span>Detta</button>
      <button onclick="hmScadenze()"><span class="c">${VH_IC.scadenze}</span>Scadenze</button>
      <button class="solo-incassi" onclick="hmDaIncassare()"><span class="c">${VH_IC.euro}</span>Da incassare</button>
      <button onclick="hmAltro()"><span class="c">${VH_IC.altro}</span>Altro</button>
    </div>
    ${vhRigheHtml(vhNuovoHtml())}
    ${avviso ? `<button class="vh-galeno" onclick="${avviso.az}"><span class="g">${VH_IC.piu}</span><span><b>Galeno:</b> ${escapeHtml(avviso.t)}</span></button>` : ""}
    <div class="vh-aiuto"><span class="ic"><i class="fa-solid fa-life-ring"></i></span><span class="t"><b>Segnalaci un problema o un consiglio</b>
      <small>Un errore, un'idea per migliorare l'app: ti rispondiamo via email.</small></span><button type="button" class="vh-aiuto-bt" onclick="apriTicketAssistenza()">Scrivici</button></div>`;
  // chilometri del giro di oggi: stessa stima della Giornata dell'officina (una volta al giorno)
  if(diOggi.length && vhKm.giorno !== oggi && typeof ofStimaKm === "function"){
    vhKm = { giorno: oggi, km: null };
    ofStimaKm(oggi, diOggi).then(r => { if(r && r.km){ vhKm.km = r.km; renderHomeVet(); } }).catch(() => {});
  }
  void adesso;
}

// 3/11/2026 sera (Simone, mockup approvato): niente lista «Prossime visite» in Home; il banner «Il giro di oggi» si tocca
// e apre «Le visite inserite»: tutte le visite da fare in agenda, divise per giorno; un tocco apre la visita.
function vhRigaVisita(e){
  const et = vhEtichetta(e);
  return `<button class="vh-visita${et.cls === "urg" ? " urg" : ""}" onclick="closeModal('modal-vh-visite');apriAzioniEvento('${e.id}')">
    <span class="o">${vhOra(e)}</span>
    <span class="c"><span class="t">${vhTitolo(e)}</span><span class="l">${escapeHtml(vhLuogo(e))}</span></span>
    <span class="vh-et ${et.cls}">${et.txt}</span></button>`;
}
function vhVisite(ev){
  if(ev && ev.target && ev.target.closest && ev.target.closest(".vh-giro-num button")) return;
  const oggi = isoLocale(new Date());
  const app = (hpAppuntamenti || []).filter(vhDaFare).filter(e => e.data_intervento >= oggi || e.data_intervento === oggi)
    .sort((a, b) => (a.data_intervento + vhOra(a)).localeCompare(b.data_intervento + vhOra(b)));
  const gruppi = [];
  app.forEach(e => { let g = gruppi.find(x => x.d === e.data_intervento); if(!g){ g = { d: e.data_intervento, l: [] }; gruppi.push(g); } g.l.push(e); });
  let ov = document.getElementById("modal-vh-visite");
  if(!ov){
    ov = document.createElement("div"); ov.className = "modal-overlay"; ov.id = "modal-vh-visite";
    ov.onclick = ev2 => { if(ev2.target === ov) closeModal("modal-vh-visite"); };
    ov.innerHTML = '<div class="modal vh-visite-modal" role="dialog" aria-modal="true" aria-labelledby="vh-visite-tit"><div class="modal-handle"></div><div id="vh-visite-corpo"></div></div>';
    document.body.appendChild(ov);
  }
  document.getElementById("vh-visite-corpo").innerHTML = `<div class="modal-title" id="vh-visite-tit">Le visite inserite</div>
    <div class="vh-visite-sotto">${app.length ? `${app.length} in agenda · tocca una visita per aprirla` : "Nessuna visita in agenda."}</div>
    ${gruppi.map(g => `<div class="vh-visite-g">${g.d === oggi ? "Oggi" : escapeHtml(hpGiornoEtichetta(g.d))} · ${g.l.length}</div>
      <div class="vh-visite-l">${g.l.map(vhRigaVisita).join("")}</div>`).join("")}
    <button class="btn btn-primary vh-visite-agenda" onclick="closeModal('modal-vh-visite');vhGiornata()">Apri l'agenda</button>`;
  openModal("modal-vh-visite");
}

// righe come nella Home del maniscalco (2/11/2026, mockup approvato da Simone): Cavalli · Clienti · Scuderie · Incassi.
// Le icone sono quelle della Home del maniscalco (pagina 008, nascosta per il veterinario): si riusano da lì, non si copiano.
function vhIcona(cls){ return document.querySelector("#hm .hm-riga." + cls + " .ic")?.innerHTML || ""; }
// 3/11/2026 (Simone, dal mockup): tasto «Nuovo appuntamento» come Cavalli · Clienti, Tiffany con bordo e testo blu notte,
// primo dei tasti (sopra Cavalli); apre il nuovo appuntamento (le tre strade, 14-visita-aperta).
const VH_CAL = '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18M12 13v5M9.5 15.5h5"/></svg>';
function vhNuovoHtml(){
  return `<button class="hm-riga r-vis" onclick="openInterventoModal(null)"><span class="ic">${VH_CAL}</span>
    <span class="tx"><b>Nuovo appuntamento</b><span>Inserisci un nuovo appuntamento</span></span>
    <span class="fr"><svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></span></button>`;
}
function vhRigheHtml(prima){
  const attivi = typeof clientiAttivi === "function" ? clientiAttivi() : [];
  const nCav = typeof cavalliCartella === "function" ? cavalliCartella().length : 0;
  const str = c => typeof isStruttura === "function" && isStruttura(c);
  const nCli = attivi.filter(c => !str(c)).length, nScu = attivi.filter(str).length;
  const mese = new Date().toLocaleDateString("it-IT", { month: "long" });
  const euro = n => formatEuro(Math.round(Number(n) || 0));
  const inc = `${escapeHtml(mese)} <strong>${euro(wgPro?.incassatoMese)}</strong>` + (wgPro?.daIncassareMese ? ` · da incassare <strong>${euro(wgPro.daIncassareMese)}</strong>` : "");
  const riga = (cls, az, t, sotto, extra) => `<button class="hm-riga ${cls}${extra ? " " + extra : ""}" onclick="${az}"><span class="ic">${vhIcona(cls)}</span>
    <span class="tx"><b>${t}</b><span>${sotto}</span></span><span class="fr"><svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></span></button>`;
  return `<div class="hm-righe vh-righe">${prima || ""}
    ${riga("r-cav", "vhVai('cavalli')", "Cavalli", `<strong>${nCav}</strong> ${nCav === 1 ? "cavallo che segui" : "cavalli che segui"}`)}
    ${riga("r-cli", "vhVai('privati')", "Clienti", `<strong>${nCli}</strong> ${nCli === 1 ? "proprietario" : "proprietari"}`)}
    ${riga("r-scu", "vhVai('scuderie')", "Scuderie", `<strong>${nScu}</strong> ${nScu === 1 ? "scuderia o maneggio" : "scuderie e maneggi"}`)}
    ${riga("r-inc", "showPage('pro-incassi')", "Incassi", inc, "solo-incassi")}</div>`;
}
// Clienti del veterinario con il filtro giusto (04-clienti): cavalli, proprietari, scuderie
function vhVai(filtro){ showPage("pro-clienti"); if(typeof closeClienteDetail === "function") try{ closeClienteDetail(); }catch(_){} if(typeof vetFiltroClienti === "function") vetFiltroClienti(filtro); }

// «Giornata»: l'agenda di oggi, con le visite raggruppate per posto e l'ordine del giro
function vhGiornata(){ showPage("pro-agenda"); if(typeof tornaSettimanaCorrente === "function") tornaSettimanaCorrente(); }
// «Detta» (2/11/2026): scegli una visita di oggi o degli ultimi 7 giorni e si apre la sua scheda con la dettatura (10-dettatura)
function vhDetta(){ if(typeof vdDaHome === "function") return vdDaHome(); }
function vhMeteo(){ const m = document.getElementById("hm-meteo"); if(m) m.click(); }

quandoApriPagina(function(p){ if(p === "pro-home") renderHomeVet(); });
quandoAggiornaBarra(function(){ if(document.body.classList.contains("pl-vet") && !document.getElementById("vh")) renderHomeVet(); });

export { renderHomeVet, vhGiornata, vhDetta, vhMeteo, vhVai, vhRigheHtml, vhVisite };
