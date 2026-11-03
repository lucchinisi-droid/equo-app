// Equo App · veterinario · VISITA APERTA (3/11/2026, richiesta di Riccardo e mockup approvato da Simone)
// Il veterinario spesso sa CHI lo chiama (scuderia, maneggio, privato) e COSA fare (vaccini, controllo, pre-acquisto),
// non QUALI cavalli: lo scopre sul posto.
//  · Nuovo appuntamento: «Li segno a fine visita» / «Li scelgo ora» (per scuderie e clienti nuovi parte da «a fine visita»);
//  · in Agenda e in Home la visita senza cavalli ha l'etichetta «aperto»;
//  · «Fatto» → «Quali cavalli hai visto?»: cavalli del cliente (e quelli che stanno in quella scuderia) da spuntare,
//    altri scritti a mano (diventano cavalli del cliente, con il codice provvisorio di Equo), cosa è stato fatto UNA volta
//    per tutti (vaccini con lotto), prezzo per cavallo modificabile uno per uno, totale;
//    il primo cavallo resta sull'appuntamento, gli altri diventano lavori fatti dello stesso giorno: storico di ogni cavallo e conto;
//  · «Più tardi»: la visita resta «da completare» in Home finché non si segnano i cavalli.
// Dopo, anche per il maniscalco (es. pareggi a 6 cavalli del maneggio): in lista delle cose da fare.

const VAA = { modo: null, e: null, cavalli: [], scelti: new Set(), prezzi: {}, fatto: [], lotto: "", lottoScad: "", richiamo: 365, prezzoBase: "", testo: "", risolvi: null };
const vaaEsc = s => escapeHtml(s == null ? "" : String(s));
const VAA_VACCINI = ["Influenza", "Tetano", "EHV (rinopolmonite)", "West Nile"];
const VAA_RIMANDATE = "equo-vaa-dopo";
const vaaVet = () => typeof eVeterinario === "function" && eVeterinario();
const vaaAperto = e => !!e && !e.cavallo_cliente_id && !e.horse_id && e.stato !== "fatto";

/* ---------------- 1. nuovo appuntamento: cavalli ora o a fine visita ---------------- */
function vaaDopoCliente(){
  if(!vaaVet()) return;
  const multi = document.getElementById("intervento-cavalli-multi"); if(!multi) return;
  const inMod = document.getElementById("intervento-cavallo-select")?.style.display === "";
  let seg = document.getElementById("vaa-seg");
  if(inMod){ if(seg) seg.remove(); document.getElementById("vaa-nota")?.remove(); return; }
  const cid = document.getElementById("intervento-cliente-select")?.value || "";
  if(!cid){ if(seg) seg.remove(); document.getElementById("vaa-nota")?.remove(); return; }
  const cli = typeof clienteDiId === "function" ? clienteDiId(cid) : null;
  const giaScelto = [...multi.querySelectorAll(".int-cav-chk:checked")].some(x => x.value && x.value !== "__nuovo_cavallo__");
  // punto di partenza: scuderia o cliente nuovo → a fine visita; privato con cavalli → li scelgo ora
  VAA.modo = giaScelto ? "ora" : (cid === "__nuovo__" || (cli && cli.tipo_cliente === "struttura")) ? "fine" : "ora";
  if(!seg){
    seg = document.createElement("div"); seg.id = "vaa-seg"; seg.className = "vaa-seg"; seg.setAttribute("role", "tablist");
    multi.parentNode.insertBefore(seg, multi);
    const nota = document.createElement("div"); nota.id = "vaa-nota"; nota.className = "vaa-nota";
    nota.textContent = "Non serve sapere ora quali cavalli. A fine visita, con «Fatto», scegli quelli che hai visto: lo storico di ogni cavallo si crea da solo.";
    multi.parentNode.insertBefore(nota, multi);
  }
  vaaModo(VAA.modo);
}
function vaaModo(m){
  VAA.modo = m === "ora" ? "ora" : "fine";
  const seg = document.getElementById("vaa-seg"), multi = document.getElementById("intervento-cavalli-multi"), nota = document.getElementById("vaa-nota");
  if(!seg || !multi) return;
  seg.innerHTML = [["fine", "Li segno a fine visita"], ["ora", "Li scelgo ora"]].map(([k, t]) =>
    `<button type="button" role="tab" aria-selected="${VAA.modo === k}" class="${VAA.modo === k ? "on" : ""}" onclick="vaaModo('${k}')">${t}</button>`).join("");
  multi.style.display = VAA.modo === "fine" ? "none" : "block";
  if(nota) nota.style.display = VAA.modo === "fine" ? "" : "none";
  if(VAA.modo === "fine"){
    multi.querySelectorAll(".int-cav-chk:checked").forEach(x => { x.checked = false; });
    if(typeof toggleInterventoNuovoCavallo === "function") toggleInterventoNuovoCavallo();
  }
}

/* ---------------- 2. etichetta «aperto» ---------------- */
function vaaEtichetta(e){ return vaaAperto(e) ? { cls: "oro", txt: "aperto" } : null; }

/* ---------------- 3. «Fatto»: quali cavalli hai visto? ---------------- */
async function vaaCavalliDelCliente(cid){
  const l = [];
  const add = (c, extra) => { if(!c || !c.id || l.some(x => x.id === c.id)) return; l.push({ id: c.id, nome: c.nome || "Cavallo", horse_id: c.horse_id || null, ...extra }); };
  try{ (await DB.listCavalliCliente(cid)).forEach(c => { if(c.tipo !== "equo" || c.id) add(c, {}); }); }catch(_){}
  // scuderia: anche i cavalli di altri proprietari che stanno qui
  const tutti = typeof cavalliCartella === "function" ? cavalliCartella() : [];
  tutti.filter(c => c.ubicazione_cliente_id === cid).forEach(c => add(c, { di: (typeof clienteDiId === "function" ? clienteDiId(c.cliente_mascalcia_id)?.nome : "") || "" }));
  return l.sort((a, b) => a.nome.localeCompare(b.nome, "it", { sensitivity: "base" }));
}
async function vaaUltimiVaccini(ids){
  const out = {};
  try{
    const tutti = DEMO_MODE ? (demoState.interventiMascalcia || []) : (await DB.listInterventiMascalciaTutti());
    (tutti || []).filter(i => i.stato === "fatto" && ids.includes(i.cavallo_cliente_id) && (i.tipo_ferratura === "vaccino" || /vaccin/i.test(i.tipo_altro || "")))
      .forEach(i => { if(!out[i.cavallo_cliente_id] || i.data_intervento > out[i.cavallo_cliente_id]) out[i.cavallo_cliente_id] = i.data_intervento; });
  }catch(_){}
  return out;
}
const vaaVaccino = e => e.tipo_ferratura === "vaccino" || /vaccin/i.test(e.tipo_altro || "");
async function vaaFatto(e){
  if(VAA.risolvi){ VAA.risolvi({ ok: false }); VAA.risolvi = null; }
  VAA.e = e; VAA.scelti = new Set(); VAA.prezzi = {}; VAA.fatto = vaaVaccino(e) ? ["Influenza", "Tetano"] : []; VAA.lotto = ""; VAA.lottoScad = ""; VAA.richiamo = 365;
  VAA.prezzoBase = Number(e.importo) > 0 ? String(e.importo) : ""; VAA.testo = vaaVaccino(e) ? "" : (e.tipo_altro || "");
  VAA.cavalli = await vaaCavalliDelCliente(e.cliente_mascalcia_id);
  const ult = await vaaUltimiVaccini(VAA.cavalli.map(c => c.id));
  VAA.cavalli.forEach(c => { c.ultimoVaccino = ult[c.id] || null; });
  vaaApriFoglio();
  return new Promise(res => { VAA.risolvi = res; });
}
function vaaApriFoglio(){
  let ov = document.getElementById("modal-vaa");
  if(!ov){
    ov = document.createElement("div"); ov.className = "modal-overlay"; ov.id = "modal-vaa"; ov.setAttribute("data-senza-x", "");
    ov.innerHTML = '<div class="modal vaa-modal" role="dialog" aria-modal="true" aria-labelledby="vaa-tit"><div class="modal-handle"></div><div id="vaa-corpo"></div></div>';
    document.body.appendChild(ov);
  }
  vaaDisegna();
  openModal("modal-vaa");
}
function vaaNomeCliente(){ return (typeof clienteDiId === "function" ? clienteDiId(VAA.e?.cliente_mascalcia_id)?.nome : "") || VAA.e?.clienti_mascalcia?.nome || "Cliente"; }
function vaaDisegna(){
  const box = document.getElementById("vaa-corpo"); if(!box) return;
  const e = VAA.e, vacc = vaaVaccino(e);
  const mese = d => d ? new Date(d + "T12:00").toLocaleDateString("it-IT", { month: "2-digit", year: "numeric" }) : "";
  const righe = VAA.cavalli.map(c => { const on = VAA.scelti.has(c.id);
    return `<div class="vaa-cav${on ? " on" : ""}"><label><input type="checkbox" ${on ? "checked" : ""} onchange="vaaSpunta('${c.id}', this.checked)"><span class="n"><b>${vaaEsc(c.nome)}</b>
      <small>${[c.di ? "di " + vaaEsc(c.di) : "", vacc ? (c.ultimoVaccino ? "ultimo vaccino " + mese(c.ultimoVaccino) : "nessun vaccino segnato") : ""].filter(Boolean).join(" · ")}</small></span></label>
      ${on ? `<label class="vaa-prezzo">€<input type="number" min="0" step="1" inputmode="decimal" value="${vaaEsc(VAA.prezzi[c.id] ?? VAA.prezzoBase)}" oninput="vaaPrezzo('${c.id}', this.value)" aria-label="Prezzo per ${vaaEsc(c.nome)}"></label>` : ""}</div>`; }).join("");
  const nuovi = vaaNomiNuovi();
  const lavoro = vacc
    ? `<div class="vs-chips">${VAA_VACCINI.map(v => `<button type="button" class="vs-chip${VAA.fatto.includes(v) ? " on" : ""}" aria-pressed="${VAA.fatto.includes(v)}" onclick="vaaVacc('${v}')">${v}</button>`).join("")}</div>
       <div class="vaa-due"><input class="input" id="vaa-lotto" placeholder="Lotto" value="${vaaEsc(VAA.lotto)}" oninput="VAA.lotto = this.value"><input class="input" id="vaa-lotto-scad" placeholder="Scadenza lotto (es. 06/2027)" value="${vaaEsc(VAA.lottoScad)}" oninput="VAA.lottoScad = this.value"></div>
       <div class="vaa-sotto">Richiamo</div><div class="vs-chips">${[[182, "tra 6 mesi"], [365, "tra 1 anno"]].map(([g, t]) => `<button type="button" class="vs-chip${VAA.richiamo === g ? " on" : ""}" onclick="vaaRichiamo(${g})">${t}</button>`).join("")}</div>`
    : `<input class="input" id="vaa-testo" placeholder="Cosa hai fatto (es. controllo, ecografia tendine)" value="${vaaEsc(VAA.testo)}" oninput="VAA.testo = this.value">`;
  const n = VAA.scelti.size + nuovi.length, tot = vaaTotale();
  box.innerHTML = `<div class="modal-title" id="vaa-tit">Quali cavalli hai visto?</div>
    <div class="vaa-sotto-tit">${vaaEsc(vaaNomeCliente())} · ${vaaEsc(TIPO_FERRATURA_LABELS?.[e.tipo_ferratura] || e.tipo_altro || "Visita")}</div>
    ${VAA.cavalli.length ? `<div class="vaa-lab">Cavalli del cliente${VAA.cavalli.some(c => c.di) ? " e della scuderia" : ""}</div><div class="vaa-lista">${righe}</div>` : ""}
    <div class="vaa-lab">${VAA.cavalli.length ? "Altri cavalli" : "Cavalli"}</div>
    <input class="input" id="vaa-nuovi" placeholder="Scrivi i nomi, separati da virgola" value="${vaaEsc(VAA.testoNuovi || "")}" oninput="vaaNuovi(this.value)">
    ${nuovi.length ? `<div class="vaa-nuovi">${nuovi.map((x, i) => `<span>${vaaEsc(x)}<label class="vaa-prezzo">€<input type="number" min="0" step="1" inputmode="decimal" value="${vaaEsc(VAA.prezzi["n:" + i] ?? VAA.prezzoBase)}" oninput="vaaPrezzo('n:${i}', this.value)"></label></span>`).join("")}</div>
      <div class="vaa-nota">Diventano cavalli di ${vaaEsc(vaaNomeCliente())}, con il codice provvisorio di Equo: la prossima volta sono già in elenco.</div>` : ""}
    <div class="vaa-lab">Cosa hai fatto · vale per tutti</div>${lavoro}
    <div class="vaa-lab">Prezzo per cavallo</div>
    <label class="vaa-prezzo base">€<input type="number" min="0" step="1" inputmode="decimal" id="vaa-prezzo-base" value="${vaaEsc(VAA.prezzoBase)}" oninput="vaaPrezzoBase(this.value)"><small>vale per tutti; lo cambi accanto al singolo cavallo</small></label>
    <div class="vaa-tot"><span>${n} ${n === 1 ? "cavallo" : "cavalli"}</span><span>${tot > 0 ? formatEuro(tot) : "—"}</span></div>
    <div class="auth-error" id="vaa-err" style="display:none"></div>
    <button class="btn btn-primary vaa-ok" onclick="vaaSalva()" ${n ? "" : "disabled"}>Salva e chiudi la visita</button>
    <button class="btn btn-outline vaa-dopo" onclick="vaaDopo()">Più tardi</button>`;
}
function vaaNomiNuovi(){ return typeof nomiCavalliDaTesto === "function" ? nomiCavalliDaTesto(VAA.testoNuovi || "") : String(VAA.testoNuovi || "").split(",").map(s => s.trim()).filter(Boolean); }
function vaaTotale(){
  const p = k => { const v = VAA.prezzi[k] ?? VAA.prezzoBase; return Number(v) > 0 ? Number(v) : 0; };
  return [...VAA.scelti].reduce((s, id) => s + p(id), 0) + vaaNomiNuovi().reduce((s, _, i) => s + p("n:" + i), 0);
}
function vaaRidisegnaTenendo(id){
  const a = document.activeElement, sel = a && a.id ? a.id : null, pos = a && "selectionStart" in a ? a.selectionStart : null;
  vaaDisegna();
  const el = sel ? document.getElementById(sel) : id ? document.querySelector(`#vaa-corpo [oninput*="'${id}'"]`) : null;
  if(el){ el.focus(); try{ if(pos != null) el.setSelectionRange(pos, pos); }catch(_){} }
}
function vaaSpunta(id, on){ on ? VAA.scelti.add(id) : VAA.scelti.delete(id); vaaDisegna(); }
function vaaPrezzo(k, v){ VAA.prezzi[k] = v; const t = document.querySelector("#vaa-corpo .vaa-tot span:last-child"); if(t){ const tot = vaaTotale(); t.textContent = tot > 0 ? formatEuro(tot) : "—"; } }
function vaaPrezzoBase(v){ VAA.prezzoBase = v; vaaRidisegnaTenendo(); }
function vaaNuovi(v){ VAA.testoNuovi = v; vaaRidisegnaTenendo(); }
function vaaVacc(v){ VAA.fatto = VAA.fatto.includes(v) ? VAA.fatto.filter(x => x !== v) : VAA_VACCINI.filter(x => x === v || VAA.fatto.includes(x)); vaaDisegna(); }
function vaaRichiamo(g){ VAA.richiamo = g; vaaDisegna(); }
function vaaChiudi(r){ closeModal("modal-vaa"); const f = VAA.risolvi; VAA.risolvi = null; if(f) f(r); }
// «Più tardi»: resta aperta e «da completare» in Home
function vaaDopo(){
  try{ const l = JSON.parse(localStorage.getItem(VAA_RIMANDATE) || "[]"); if(VAA.e && !l.includes(VAA.e.id)) l.push(VAA.e.id); localStorage.setItem(VAA_RIMANDATE, JSON.stringify(l.slice(-50))); }catch(_){}
  vaaChiudi({ ok: false, rimandata: true });
  vaaAggiorna();
}
function vaaDescrizione(){
  if(vaaVaccino(VAA.e)){
    const v = VAA.fatto.map(x => x.split(" ")[0].toLowerCase()).join(" + ");
    return ["Vaccino " + (v || "").trim(), VAA.lotto.trim() ? "lotto " + VAA.lotto.trim() + (VAA.lottoScad.trim() ? " (scad. " + VAA.lottoScad.trim() + ")" : "") : ""].filter(Boolean).join(" · ").slice(0, 200);
  }
  return String(VAA.testo || "").trim().slice(0, 200) || VAA.e.tipo_altro || null;
}
async function vaaSalva(){
  const e = VAA.e, err = document.getElementById("vaa-err"), btn = document.querySelector("#vaa-corpo .vaa-ok");
  const errore = t => { if(err){ err.textContent = t; err.style.display = "block"; } };
  if(err) err.style.display = "none";
  const nuovi = vaaNomiNuovi();
  if(!VAA.scelti.size && !nuovi.length) return errore("Spunta o scrivi almeno un cavallo.");
  if(vaaVaccino(e) && !VAA.fatto.length) return errore("Scegli almeno un vaccino.");
  if(btn) btn.disabled = true;
  try{
    // cavalli scritti a mano: diventano cavalli del cliente (codice provvisorio dato dal database)
    let creati = [];
    if(nuovi.length){
      creati = typeof creaCavalliDaTesto === "function" ? await creaCavalliDaTesto(e.cliente_mascalcia_id, nuovi.join(", ")) : [];
      if(creati.length < nuovi.length) return errore("Non sono riuscito a salvare tutti i cavalli nuovi: riprova.");
    }
    const prezzo = k => { const v = VAA.prezzi[k] ?? VAA.prezzoBase; return v === "" || v == null || !(Number(v) >= 0) ? null : Number(v); };
    const lista = [...VAA.cavalli.filter(c => VAA.scelti.has(c.id)).map(c => ({ id: c.id, horse_id: c.horse_id || null, importo: prezzo(c.id) })),
      ...creati.map((c, i) => ({ id: c.id, horse_id: null, importo: prezzo("n:" + i) }))];
    const oggi = isoLocale(new Date()), giorno = e.data_intervento && e.data_intervento <= oggi ? e.data_intervento : oggi;
    const descr = vaaDescrizione();
    const prossima = vaaVaccino(e) && typeof aggiungiGiorniIso === "function" ? aggiungiGiorniIso(giorno, VAA.richiamo) : null;
    const base = { tipo_ferratura: e.tipo_ferratura, tipo_altro: descr, data_intervento: giorno, ora: e.ora || null, stato: "fatto", stato_pagamento: e.stato_pagamento || "da_saldare" };
    // il primo cavallo resta sull'appuntamento; gli altri diventano lavori fatti dello stesso giorno
    const [primo, ...altri] = lista;
    const { error: e1 } = await DB.updateInterventoMascalcia(e.id, { ...base, cavallo_cliente_id: primo.id, horse_id: primo.horse_id, importo: primo.importo, ...(prossima ? { prossima_scadenza: prossima } : {}) });
    if(e1) return errore("Errore: " + e1.message);
    for(const c of altri){
      const { error } = await DB.insertInterventoMascalcia({ cliente_mascalcia_id: e.cliente_mascalcia_id, cavallo_cliente_id: c.id, horse_id: c.horse_id, ...base, importo: c.importo, prossima_scadenza: prossima, note: e.note || null });
      if(error) return errore("Errore: " + error.message);
    }
    try{ const l = JSON.parse(localStorage.getItem(VAA_RIMANDATE) || "[]").filter(x => x !== e.id); localStorage.setItem(VAA_RIMANDATE, JSON.stringify(l)); }catch(_){}
    if(VAA.passate) VAA.passate = VAA.passate.filter(x => x.id !== e.id);
    showToast(`Visita chiusa: ${lista.length} ${lista.length === 1 ? "cavallo" : "cavalli"}`);
    vaaChiudi({ ok: true, cavalli: lista.length });
    if(nuovi.length && typeof caricaCavalliMiei === "function") await caricaCavalliMiei().catch(() => {});
    await vaaAggiorna();
  } finally { if(btn) btn.disabled = false; }
}
async function vaaAggiorna(){
  for(const f of ["renderAgendaSettimana", "renderIncassi", "renderProDeadlines"]) if(typeof window[f] === "function") try{ await window[f](); }catch(_){}
  if(document.getElementById("vh") && typeof renderHomeVet === "function") try{ renderHomeVet(); }catch(_){}
}

/* ---------------- 4. «da completare» in Home ---------------- */
// visite aperte dei giorni passati, più quelle di oggi rimandate con «Più tardi»
// le visite dei giorni passati non sono tra le prossime: si leggono una volta (ultimi 60 giorni) e si tengono qui
VAA.passate = null;
function vaaCaricaPassate(){
  if(VAA.passate || VAA.caricando || typeof DB?.listInterventiPeriodo !== "function") return;
  VAA.caricando = true;
  const oggi = isoLocale(new Date()), da = isoLocale(new Date(Date.now() - 60 * 864e5));
  DB.listInterventiPeriodo(da, oggi).then(l => { VAA.passate = (l || []).filter(vaaAperto); VAA.caricando = false;
    if(VAA.passate.length && document.getElementById("vh") && typeof renderHomeVet === "function") renderHomeVet(); })
    .catch(() => { VAA.caricando = false; VAA.passate = []; });
}
function vaaDaCompletare(eventi){
  const oggi = isoLocale(new Date());
  let rim = []; try{ rim = JSON.parse(localStorage.getItem(VAA_RIMANDATE) || "[]"); }catch(_){}
  vaaCaricaPassate();
  const tutte = [...(VAA.passate || []), ...(eventi || [])].filter((e, i, a) => a.findIndex(x => x.id === e.id) === i);
  return tutte.filter(e => vaaAperto(e) && e.data_intervento && (e.data_intervento < oggi || (e.data_intervento === oggi && rim.includes(e.id))));
}
function vaaBannerHtml(eventi){
  const l = vaaDaCompletare(eventi); if(!l.length) return "";
  const e = l[0], nome = (typeof clienteDiId === "function" ? clienteDiId(e.cliente_mascalcia_id)?.nome : "") || e.clienti_mascalcia?.nome || "Cliente";
  return `<button class="vaa-banner" onclick="vaaCompleta('${e.id}')"><b>${l.length === 1 ? "1 visita da completare" : l.length + " visite da completare"}</b>
    <span>${vaaEsc(nome)} · ${vaaEsc(TIPO_FERRATURA_LABELS?.[e.tipo_ferratura] || e.tipo_altro || "Visita")}: segna quali cavalli hai visto, così il conto e i libretti sono giusti. <u>Completa</u></span></button>`;
}
function vaaCompleta(id){
  const hp = typeof hpAppuntamenti !== "undefined" ? hpAppuntamenti || [] : [];
  const e = [...(VAA.passate || []), ...hp, ...(DEMO_MODE ? demoState.interventiMascalcia || [] : [])].find(x => x.id === id);
  if(e) vaaFatto(e);
}

export { VAA, vaaDopoCliente, vaaModo, vaaEtichetta, vaaAperto, vaaFatto, vaaSpunta, vaaPrezzo, vaaPrezzoBase, vaaNuovi, vaaVacc, vaaRichiamo, vaaDopo, vaaSalva,
  vaaDaCompletare, vaaBannerHtml, vaaCompleta };
