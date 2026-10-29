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
  const prima = diOggi.map(vhOra).filter(o => o !== "—").sort()[0];
  const km = vhKm.giorno === oggi && vhKm.km ? `${vhKm.km} km` : "";
  // prossime visite: prima l'urgenza, poi in ordine di orario; da adesso in avanti (quelle di oggi già passate restano finché non sono fatte)
  const prossime = app.filter(e => e.data_intervento >= oggi)
    .sort((a, b) => (a.data_intervento + vhOra(a)).localeCompare(b.data_intervento + vhOra(b))).slice(0, 3);
  const nome = (currentUser?.nome || currentUser?.full_name || "").split(" ")[0];
  const data = new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
  const nMsg = wgPro?.unread || 0, inRitardo = (hpRichiamiLista || []).filter(r => r.giorni < 0).length;
  const avviso = nMsg ? { t: `hai ${nMsg} ${nMsg === 1 ? "messaggio da leggere" : "messaggi da leggere"}.`, az: "hmMessaggi()" }
    : inRitardo ? { t: `${inRitardo} ${inRitardo === 1 ? "cavallo è in ritardo" : "cavalli sono in ritardo"} con il richiamo.`, az: "hmScadenze()" }
    : urg ? { t: `oggi hai ${urg === 1 ? "un'urgenza" : urg + " urgenze"}: è la prima del giro.`, az: "showPage('pro-agenda')" } : null;

  box.innerHTML = `
    <div class="vh-saluto">${escapeHtml(testoSaluto())}${nome ? " " + escapeHtml(nome) : ""} · ${escapeHtml(data)}</div>
    <div class="vh-giro">
      <div class="vh-giro-et">Il giro di oggi</div>
      <div class="vh-giro-riga">
        <div><div class="vh-giro-n">${diOggi.length} ${diOggi.length === 1 ? "visita" : "visite"}</div>
          <div class="vh-giro-s">${[km, prima ? "prima alle " + prima : diOggi.length ? "" : "nessuna visita in agenda"].filter(Boolean).join(" · ")}</div></div>
        <button class="vh-giornata" onclick="vhGiornata()">Giornata</button>
      </div>
      <div class="vh-giro-num">
        <button onclick="vhGiornata()"><b>${urg}</b><span>${urg === 1 ? "urgenza" : "urgenze"}</span></button>
        <button onclick="hmScadenze()"><b>${ric}</b><span>${ric === 1 ? "richiamo" : "richiami"}</span></button>
      </div>
    </div>
    <div class="vh-cerchi">
      <button onclick="hmPortami()"><span class="c">${VH_IC.portami}</span>Portami da</button>
      <button onclick="vhDetta()"><span class="c">${VH_IC.detta}</span>Detta</button>
      <button onclick="hmScadenze()"><span class="c">${VH_IC.scadenze}</span>Scadenze</button>
      <button class="solo-incassi" onclick="hmDaIncassare()"><span class="c">${VH_IC.euro}</span>Da incassare</button>
      <button onclick="hmAltro()"><span class="c">${VH_IC.altro}</span>Altro</button>
    </div>
    <div class="vh-tit">Prossime visite</div>
    ${prossime.length ? prossime.map(e => { const et = vhEtichetta(e); const altroGiorno = e.data_intervento !== oggi;
      return `<button class="vh-visita${et.cls === "urg" ? " urg" : ""}" onclick="apriAzioniEvento('${e.id}')">
        <span class="o">${altroGiorno ? `<small>${escapeHtml(hpGiornoEtichetta(e.data_intervento))}</small>` : ""}${vhOra(e)}</span>
        <span class="c"><span class="t">${vhTitolo(e)}</span><span class="l">${escapeHtml(vhLuogo(e))}</span></span>
        <span class="vh-et ${et.cls}">${et.txt}</span></button>`; }).join("")
      : `<div class="vh-vuoto">Nessuna visita in agenda. <button onclick="openInterventoModal(null)">Aggiungine una</button></div>`}
    ${avviso ? `<button class="vh-galeno" onclick="${avviso.az}"><span class="g">${VH_IC.piu}</span><span><b>Galeno:</b> ${escapeHtml(avviso.t)}</span></button>` : ""}`;
  // chilometri del giro di oggi: stessa stima della Giornata dell'officina (una volta al giorno)
  if(diOggi.length && vhKm.giorno !== oggi && typeof ofStimaKm === "function"){
    vhKm = { giorno: oggi, km: null };
    ofStimaKm(oggi, diOggi).then(r => { if(r && r.km){ vhKm.km = r.km; renderHomeVet(); } }).catch(() => {});
  }
  void adesso;
}

// «Giornata»: l'agenda di oggi, con le visite raggruppate per posto e l'ordine del giro
function vhGiornata(){ showPage("pro-agenda"); if(typeof tornaSettimanaCorrente === "function") tornaSettimanaCorrente(); }
// «Detta»: per ora apre Galeno (la dettatura arriverà con Galeno)
function vhDetta(){ openAiSheet(); }
function vhMeteo(){ const m = document.getElementById("hm-meteo"); if(m) m.click(); }

quandoApriPagina(function(p){ if(p === "pro-home") renderHomeVet(); });
quandoAggiornaBarra(function(){ if(document.body.classList.contains("pl-vet") && !document.getElementById("vh")) renderHomeVet(); });

export { renderHomeVet, vhGiornata, vhDetta, vhMeteo };
