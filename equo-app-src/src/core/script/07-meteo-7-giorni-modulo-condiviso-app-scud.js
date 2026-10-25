
/* METEO 7 giorni — modulo condiviso App / Scuderia.
   EquoMeteo.monta(el, { posizione: async () => ({lat, lon, luogo} | {indirizzo, citta, luogo} | null), endpoint, token: async () => "..." ,
                         senzaPosizione: { testo, azione } })
   Previsione salvata sul dispositivo per 30 minuti. In demo i dati sono di esempio. */
(function(){
  const ICONE = {
    sereno: ["fa-sun", "fa-moon"], variabile: ["fa-cloud-sun", "fa-cloud-moon"], nubi: ["fa-cloud", "fa-cloud"], nebbia: ["fa-smog", "fa-smog"],
    pioviggine: ["fa-cloud-sun-rain", "fa-cloud-moon-rain"], pioggia: ["fa-cloud-rain", "fa-cloud-rain"], pioggia_forte: ["fa-cloud-showers-heavy", "fa-cloud-showers-heavy"],
    temporale: ["fa-cloud-bolt", "fa-cloud-bolt"], neve: ["fa-snowflake", "fa-snowflake"], nevischio: ["fa-cloud-meatball", "fa-cloud-meatball"],
  };
  const NOMI = { sereno: "Sereno", variabile: "Poco nuvoloso", nubi: "Nuvoloso", nebbia: "Nebbia", pioviggine: "Pioggia debole", pioggia: "Pioggia",
    pioggia_forte: "Pioggia forte", temporale: "Temporale", neve: "Neve", nevischio: "Neve mista a pioggia" };
  const CON_NOTTE = { sereno: 1, variabile: 1, pioviggine: 1 };
  const icona = (k, notte) => { k = NOMI[k] ? k : "nubi"; const id = "mi-" + k + (notte && CON_NOTTE[k] ? "-n" : ""); return `<svg class="mi" role="img" aria-label="${NOMI[k]}"><title>${NOMI[k]}</title><use href="#${id}"/></svg>`; };
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const oggiIso = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
  const etichettaGiorno = (iso, i) => {
    if(iso === oggiIso()) return "Oggi";
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("it-IT", { weekday: "short" }).replace(".", "");
  };
  const lungaGiorno = iso => iso === oggiIso() ? "Oggi" : new Date(iso + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "short" });
  const ora = t => new Date(t).toLocaleTimeString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });
  const giornoDi = t => new Date(t).toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
  const leggi = k => { try{ return JSON.parse(localStorage.getItem(k) || "null"); }catch(e){ return null; } };
  const scrivi = (k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };

  // dati di esempio (demo e prove): 7 giorni, ora per ora i primi 2, poi ogni 6 ore
  function datiDemo(){
    const ore = [], base = new Date(); base.setMinutes(0, 0, 0);
    const seq = ["sereno","variabile","nubi","pioviggine","variabile","sereno","pioggia"];
    for(let h = 0; h < 7 * 24; h += (h < 48 ? 1 : 6)){
      const t = new Date(base.getTime() + h * 3600e3), hh = t.getHours(), g = Math.floor(h / 24);
      ore.push({ t: t.toISOString(), passo: h < 48 ? 1 : 6, temp: Math.round(13 + 6 * Math.sin((hh - 9) / 24 * 6.28) + g % 3), sim: hh < 7 || hh > 19 ? (seq[g] === "sereno" ? "sereno" : "nubi") : seq[g],
        notte: hh < 7 || hh > 19, mm: seq[g].includes("piog") && hh > 11 && hh < 17 ? 0.6 : 0, vento: 8 + (hh % 5) * 2, umid: 65 });
    }
    const giorni = [];
    ore.forEach(o => { const d = giornoDi(o.t); let x = giorni.find(z => z.data === d); if(!x){ x = { data: d, min: o.temp, max: o.temp, mm: 0, sim: o.sim }; giorni.push(x); }
      x.min = Math.min(x.min, o.temp); x.max = Math.max(x.max, o.temp); x.mm += o.mm; const hh = Number(ora(o.t).slice(0, 2)); if(hh === 12 || hh === 14) x.sim = o.sim; });
    return { luogo: "Esempio", fonte: "dati di esempio", aggiornato: new Date().toISOString(), giorni: giorni.slice(0, 7), ore, demo: true };
  }

  const SPRITE = '<svg id="meteo-sprite" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false">  <defs>    <radialGradient id="mg-sole" cx="40%" cy="38%" r="70%"><stop offset="0" stop-color="#FFE68A"/><stop offset=".55" stop-color="#FFC52E"/><stop offset="1" stop-color="#F59E0B"/></radialGradient>    <linearGradient id="mg-luna" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3F6FD"/><stop offset="1" stop-color="#B7C3E3"/></linearGradient>    <linearGradient id="mg-nube" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D9E1EA"/></linearGradient>    <linearGradient id="mg-nube2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E6EBF1"/><stop offset="1" stop-color="#BCC7D3"/></linearGradient>    <linearGradient id="mg-scura" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#AEB9C6"/><stop offset="1" stop-color="#7A8899"/></linearGradient>    <linearGradient id="mg-goccia" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6CB8FF"/><stop offset="1" stop-color="#2F7FD8"/></linearGradient>    <linearGradient id="mg-fulmine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE066"/><stop offset="1" stop-color="#FFA41B"/></linearGradient>    <g id="mp-raggi" stroke="#FFB81C" stroke-width="3.6" stroke-linecap="round">      <path d="M32 6v6M32 52v6M6 32h6M52 32h6M13.6 13.6l4.2 4.2M46.2 46.2l4.2 4.2M13.6 50.4l4.2-4.2M46.2 17.8l4.2-4.2"/>    </g>    <g id="mp-sole"><use href="#mp-raggi"/><circle cx="32" cy="32" r="12.5" fill="url(#mg-sole)"/></g>    <path id="mp-luna" d="M38.5 12.5A20 20 0 1 0 51.5 41 16.5 16.5 0 0 1 38.5 12.5z" fill="url(#mg-luna)" stroke="#9FAED6" stroke-width="1.2"/>    <path id="mp-nube" d="M19 50h27.5a10.5 10.5 0 0 0 1.2-20.9A14.5 14.5 0 0 0 20.2 25.6 12.2 12.2 0 0 0 19 50z"/>    <g id="mp-gocce" stroke="url(#mg-goccia)" stroke-width="3.6" stroke-linecap="round"><path d="M24 54l-2 5M33 54l-2 5M42 54l-2 5"/></g>  </defs>  <!-- sereno -->  <symbol id="mi-sereno" viewBox="0 0 64 64"><use href="#mp-sole"/></symbol>  <symbol id="mi-sereno-n" viewBox="0 0 64 64"><use href="#mp-luna"/><circle cx="50" cy="14" r="1.6" fill="#C9D3EE"/><circle cx="56" cy="24" r="1.1" fill="#C9D3EE"/></symbol>  <!-- poco nuvoloso -->  <symbol id="mi-variabile" viewBox="0 0 64 64"><g transform="translate(0 -1) scale(.72)"><use href="#mp-sole"/></g><use href="#mp-nube" fill="url(#mg-nube)" stroke="#C5CFDA" stroke-width="1.2" transform="translate(4 4)"/></symbol>  <symbol id="mi-variabile-n" viewBox="0 0 64 64"><g transform="translate(-2 -4) scale(.72)"><use href="#mp-luna"/></g><use href="#mp-nube" fill="url(#mg-nube)" stroke="#C5CFDA" stroke-width="1.2" transform="translate(4 4)"/></symbol>  <!-- nuvoloso -->  <symbol id="mi-nubi" viewBox="0 0 64 64"><use href="#mp-nube" fill="url(#mg-nube2)" transform="translate(10 -8) scale(.8)"/><use href="#mp-nube" fill="url(#mg-nube)" stroke="#C5CFDA" stroke-width="1.2" transform="translate(-2 4)"/></symbol>  <!-- nebbia -->  <symbol id="mi-nebbia" viewBox="0 0 64 64"><use href="#mp-nube" fill="url(#mg-nube2)" transform="translate(0 -8)"/><g stroke="#9AA6B4" stroke-width="3.6" stroke-linecap="round"><path d="M12 48h40M18 56h30"/></g></symbol>  <!-- pioggia debole -->  <symbol id="mi-pioviggine" viewBox="0 0 64 64"><g transform="translate(0 -3) scale(.66)"><use href="#mp-sole"/></g><use href="#mp-nube" fill="url(#mg-nube)" stroke="#C5CFDA" stroke-width="1.2" transform="translate(2 -4)"/><g stroke="url(#mg-goccia)" stroke-width="3.6" stroke-linecap="round"><path d="M28 52l-1.5 4M38 52l-1.5 4"/></g></symbol>  <symbol id="mi-pioviggine-n" viewBox="0 0 64 64"><g transform="translate(-2 -6) scale(.66)"><use href="#mp-luna"/></g><use href="#mp-nube" fill="url(#mg-nube)" stroke="#C5CFDA" stroke-width="1.2" transform="translate(2 -4)"/><g stroke="url(#mg-goccia)" stroke-width="3.6" stroke-linecap="round"><path d="M28 52l-1.5 4M38 52l-1.5 4"/></g></symbol>  <!-- pioggia -->  <symbol id="mi-pioggia" viewBox="0 0 64 64"><use href="#mp-nube" fill="url(#mg-nube2)" stroke="#A9B5C2" stroke-width="1.2" transform="translate(0 -8)"/><use href="#mp-gocce" transform="translate(0 -6)"/></symbol>  <!-- pioggia forte -->  <symbol id="mi-pioggia_forte" viewBox="0 0 64 64"><use href="#mp-nube" fill="url(#mg-scura)" transform="translate(0 -10)"/><g stroke="url(#mg-goccia)" stroke-width="3.6" stroke-linecap="round"><path d="M20 46l-3 8M29 46l-3 8M38 46l-3 8M47 46l-3 8"/></g></symbol>  <!-- temporale -->  <symbol id="mi-temporale" viewBox="0 0 64 64"><use href="#mp-nube" fill="url(#mg-scura)" transform="translate(0 -10)"/><path d="M34 38l-8 12h7l-4 11 12-15h-7l4-8z" fill="url(#mg-fulmine)" stroke="#F08C00" stroke-width="1" stroke-linejoin="round"/><g stroke="url(#mg-goccia)" stroke-width="3.4" stroke-linecap="round"><path d="M20 46l-2 5M48 46l-2 5"/></g></symbol>  <!-- neve -->  <symbol id="mi-neve" viewBox="0 0 64 64"><use href="#mp-nube" fill="url(#mg-nube)" stroke="#C5CFDA" stroke-width="1.2" transform="translate(0 -10)"/><g stroke="#7CC4F2" stroke-width="2.6" stroke-linecap="round"><path d="M22 47v8M18.5 49l7 4M18.5 53l7-4M42 47v8M38.5 49l7 4M38.5 53l7-4M32 54v7M29 55.5l6 4M29 59.5l6-4"/></g></symbol>  <!-- neve mista a pioggia -->  <symbol id="mi-nevischio" viewBox="0 0 64 64"><use href="#mp-nube" fill="url(#mg-nube2)" stroke="#A9B5C2" stroke-width="1.2" transform="translate(0 -10)"/><g stroke="url(#mg-goccia)" stroke-width="3.6" stroke-linecap="round"><path d="M24 46l-2 6M42 52l-2 6"/></g><g stroke="#7CC4F2" stroke-width="2.6" stroke-linecap="round"><path d="M33 47v8M29.5 49l7 4M29.5 53l7-4"/></g></symbol>  <!-- meteo non disponibile: sole grigio sbarrato -->  <symbol id="mi-nd" viewBox="0 0 64 64"><g stroke="#AEB4BB" stroke-width="3.6" stroke-linecap="round"><path d="M32 6v6M32 52v6M6 32h6M52 32h6M13.6 13.6l4.2 4.2M46.2 46.2l4.2 4.2M13.6 50.4l4.2-4.2M46.2 17.8l4.2-4.2"/></g><circle cx="32" cy="32" r="12.5" fill="#C9CED4"/><path d="M10 54L54 10" stroke="#7F8790" stroke-width="4.6" stroke-linecap="round"/></symbol>  <!-- meteo non disponibile: sole grigio sbarrato -->  <symbol id="mi-nd" viewBox="0 0 64 64"><g stroke="#AEB4BB" stroke-width="3.6" stroke-linecap="round"><path d="M32 6v6M32 52v6M6 32h6M52 32h6M13.6 13.6l4.2 4.2M46.2 46.2l4.2 4.2M13.6 50.4l4.2-4.2M46.2 17.8l4.2-4.2"/></g><circle cx="32" cy="32" r="12.5" fill="#C9CED4"/><path d="M10 54L54 10" stroke="#7F8790" stroke-width="4.6" stroke-linecap="round"/></symbol></svg>';
  function sprite(){ if(!document.getElementById("meteo-sprite")) document.body.insertAdjacentHTML("afterbegin", SPRITE); }
  const stati = new WeakMap();
  async function carica(el, forza){
    const cfg = stati.get(el); if(!cfg) return;
    el.innerHTML = cfg.dati ? el.innerHTML : cfg.soloIcona ? '<span class="meteo-scheletro"></span>' : Array.from({ length: 7 }, () => '<span class="meteo-scheletro"></span>').join("");
    let pos = null;
    try{ pos = await cfg.posizione(); }catch(e){ pos = null; }
    if(!pos || pos.messaggio){ cfg.dati = null; mostraMsg(el, (pos && pos.messaggio) || cfg.senzaPosizione); return; }
    if(pos.demo){ cfg.dati = datiDemo(); disegna(el); return; }
    const chiave = "equo-meteo:" + (pos.lat != null ? Number(pos.lat).toFixed(2) + "," + Number(pos.lon).toFixed(2) : String(pos.indirizzo || "") + "|" + String(pos.citta || ""));
    const salv = leggi(chiave);
    if(salv && !forza && Date.now() - salv.salvato < 30 * 60e3){ cfg.dati = salv.dati; disegna(el); return; }
    if(salv) { cfg.dati = salv.dati; disegna(el); }
    try{
      const tk = await cfg.token();
      const r = await fetch(cfg.endpoint, { method: "POST", headers: { "Content-Type": "application/json", ...(tk ? { Authorization: "Bearer " + tk } : {}) }, body: JSON.stringify(pos) });
      const d = await r.json().catch(() => ({}));
      if(d && d.giorni && d.giorni.length){ if(pos.luogo && !d.luogo) d.luogo = pos.luogo; cfg.dati = d; scrivi(chiave, { salvato: Date.now(), dati: d }); disegna(el); return; }
      if(!cfg.dati) mostraMsg(el, d && d.non_trovato ? cfg.nonTrovato || { testo: "Indirizzo non trovato per il meteo" } : { testo: "Meteo non disponibile ora", icona: "fa-cloud" });
    }catch(e){ if(!cfg.dati) mostraMsg(el, { testo: "Meteo non disponibile offline", icona: "fa-wifi" }); }
  }
  function mostraMsg(el, m){
    m = m || { testo: "Meteo non disponibile" };
    if(stati.get(el).soloIcona){   // barra in alto: solo un'icona, il testo nel suggerimento
      el.innerHTML = `<i class="fa-solid ${m.icona || "fa-location-dot"}"></i>`;
      el.title = m.testo + (m.link ? " " + m.link : "");
      el.setAttribute("aria-label", el.title);
      stati.get(el).azioneMsg = m.azione || null;
      return;
    }
    el.innerHTML = `<span class="meteo-msg"><i class="fa-solid ${m.icona || "fa-location-dot"}"></i><span>${esc(m.testo)}${m.link ? ` <u>${esc(m.link)}</u>` : ""}</span></span>`;
    el.dataset.azione = m.azione ? "1" : "";
    stati.get(el).azioneMsg = m.azione || null;
  }
  function disegna(el){
    const cfg = stati.get(el), d = cfg.dati;
    const oggi = oggiIso();
    if(cfg.soloIcona){   // barra in alto: il tempo di adesso (ora più vicina), al tocco il dettaglio
      const adesso = window.EquoMeteo.alle(d, oggi, new Date().toLocaleTimeString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" })) || d.giorni[0] || {};
      el.innerHTML = icona(adesso.sim, adesso.notte);
      el.title = "Meteo" + (d.luogo ? " · " + d.luogo : "") + ": " + (NOMI[adesso.sim] || "") + " · tocca per i dettagli";
      el.setAttribute("aria-label", el.title);
      stati.get(el).azioneMsg = null;
      return;
    }
    el.innerHTML = d.giorni.slice(0, 7).map((g, i) => `<span class="meteo-g${g.data === oggi ? " oggi" : ""}"><b>${esc(etichettaGiorno(g.data, i))}</b>${icona(g.sim, false)}</span>`).join("");
    el.setAttribute("aria-label", "Meteo dei prossimi 7 giorni" + (d.luogo ? " a " + d.luogo : "") + ": tocca per il dettaglio ora per ora");
    stati.get(el).azioneMsg = null;
  }
  function apriDettaglio(el, giorno){
    sprite();
    const cfg = stati.get(el), d = cfg && cfg.dati; if(!d) return;
    let sel = giorno || d.giorni[0].data;
    const velo = document.createElement("div");
    velo.className = "meteo-velo";
    velo.innerHTML = `<div class="meteo-sheet" role="dialog" aria-label="Previsioni meteo">
      <div class="meteo-testa"><h3><i class="fa-solid fa-location-dot"></i>${esc(d.luogo || "Meteo")}</h3><button class="meteo-x" aria-label="Chiudi">✕</button></div>
      <div class="meteo-giorni"></div><div class="meteo-ore"></div>
      <div class="meteo-nota"></div></div>`;
    const chiudi = () => { velo.remove(); document.removeEventListener("keydown", esc_); };
    const esc_ = e => { if(e.key === "Escape") chiudi(); };
    velo.addEventListener("click", e => { if(e.target === velo || e.target.closest(".meteo-x")) chiudi(); });
    document.addEventListener("keydown", esc_);
    const giorniEl = velo.querySelector(".meteo-giorni"), oreEl = velo.querySelector(".meteo-ore");
    const rendi = () => {
      giorniEl.innerHTML = d.giorni.slice(0, 7).map(g => `<button class="meteo-chip${g.data === sel ? " sel" : ""}" data-g="${g.data}"><b>${esc(etichettaGiorno(g.data))}</b>${icona(g.sim, false)}<small>${g.min != null ? g.min + "° / " + g.max + "°" : ""}</small></button>`).join("");
      const ore = d.ore.filter(o => giornoDi(o.t) === sel && new Date(o.t) >= new Date(Date.now() - 3600e3));
      const g = d.giorni.find(x => x.data === sel) || {};
      const sei = ore.length && ore.every(o => o.passo === 6);
      oreEl.innerHTML = `<div class="meteo-sezione">${esc(lungaGiorno(sel))} · ${NOMI[g.sim] || ""}${g.mm ? " · " + String(g.mm).replace(".", ",") + " mm" : ""}${sei ? " · ogni 6 ore" : ""}</div>`
        + (ore.length ? ore.map(o => `<div class="meteo-riga"><span class="h">${ora(o.t)}</span>${icona(o.sim, o.notte)}<span class="t">${o.temp != null ? o.temp + "°" : "–"}</span>`
          + `<span class="p">${Number(o.mm) > 0 ? '<i class="fa-solid fa-droplet" style="font-size:11px"></i> ' + String(Math.round(o.mm * 10) / 10).replace(".", ",") + " mm" : ""}</span>`
          + `<span class="v">${o.vento != null ? '<i class="fa-solid fa-wind" style="font-size:11px"></i> ' + o.vento + " km/h" : ""}</span></div>`).join("")
          : '<div class="meteo-msg" style="padding:20px 0">Nessun dettaglio per questo giorno.</div>');
      giorniEl.querySelector(".sel")?.scrollIntoView({ block: "nearest", inline: "center" });
    };
    giorniEl.addEventListener("click", e => { const b = e.target.closest(".meteo-chip"); if(b){ sel = b.dataset.g; rendi(); oreEl.scrollTop = 0; } });
    velo.querySelector(".meteo-nota").textContent = (d.demo ? "Dati di esempio. " : "") + "Fonte dati: " + (d.fonte || "") + (d.aggiornato ? " · aggiornato alle " + ora(d.aggiornato) : "") + ". Le previsioni oltre 2-3 giorni sono meno precise.";
    document.body.appendChild(velo);
    rendi();
  }
  window.EquoMeteo = {
    monta(el, cfg){
      if(!el) return;
      sprite();
      const gia = stati.get(el);
      stati.set(el, Object.assign(gia || {}, cfg));
      if(!gia){
        el.setAttribute("role", "button"); el.tabIndex = 0;
        const tocco = () => { const c = stati.get(el); if(c.azioneMsg){ c.azioneMsg(); return; } if(c.dati) apriDettaglio(el); else carica(el, true); };
        el.addEventListener("click", tocco);
        el.addEventListener("keydown", e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); tocco(); } });
      }
      const c = stati.get(el);
      if(!c.dati || !c.caricatoIl || Date.now() - c.caricatoIl > 30 * 60e3){ c.caricatoIl = Date.now(); carica(el); }
    },
    // previsione senza riquadro (es. icona accanto a un appuntamento): stessa cache del riquadro
    async previsione(pos, cfg){
      if(!pos) return null;
      if(pos.demo) return datiDemo();
      const chiave = "equo-meteo:" + (pos.lat != null ? Number(pos.lat).toFixed(2) + "," + Number(pos.lon).toFixed(2) : String(pos.indirizzo || "") + "|" + String(pos.citta || ""));
      const salv = leggi(chiave);
      if(salv && Date.now() - salv.salvato < 30 * 60e3) return salv.dati;
      try{
        const tk = await cfg.token();
        const r = await fetch(cfg.endpoint, { method: "POST", headers: { "Content-Type": "application/json", ...(tk ? { Authorization: "Bearer " + tk } : {}) }, body: JSON.stringify(pos) });
        const d = await r.json().catch(() => ({}));
        if(d && d.giorni && d.giorni.length){ scrivi(chiave, { salvato: Date.now(), dati: d }); return d; }
        return d && d.non_trovato ? { non_trovato: true } : (salv ? salv.dati : null);
      }catch(e){ return salv ? salv.dati : null; }
    },
    // il tempo previsto a una certa ora di un giorno (ora più vicina)
    alle(dati, giorno, oraHHMM){
      if(!dati || !dati.ore) return null;
      const ore = dati.ore.filter(o => giornoDi(o.t) === giorno);
      if(!ore.length){ const g = (dati.giorni || []).find(x => x.data === giorno); return g ? { sim: g.sim, notte: false, temp: g.max, mm: g.mm } : null; }
      const [h, m] = String(oraHHMM || "10:00").split(":").map(Number);
      const obiettivo = h * 60 + (m || 0);
      const min = o => { const t = ora(o.t).split(":").map(Number); return t[0] * 60 + t[1]; };
      return ore.reduce((a, b) => Math.abs(min(b) - obiettivo) < Math.abs(min(a) - obiettivo) ? b : a);
    },
    icona(k, notte){ sprite(); return icona(k, notte); },
    iconaNd(titolo){ sprite(); const t = esc(titolo || "Meteo non disponibile"); return `<svg class="mi mi-nd" role="img" aria-label="${t}"><title>${t}</title><use href="#mi-nd"/></svg>`; },
    nome: k => NOMI[k] || "",
    ricarica(el){ const c = stati.get(el); if(c){ c.caricatoIl = Date.now(); carica(el, true); } },
    datiDemo,
  };
})();
