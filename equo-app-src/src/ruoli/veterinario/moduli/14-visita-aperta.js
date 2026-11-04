// Equo App · veterinario · NUOVO APPUNTAMENTO A TRE STRADE e APPUNTAMENTO APERTO
// 3/11/2026 sera (Simone, mockup «Nuovo appuntamento · tre strade» approvato; sostituisce il foglio unico «Quali cavalli hai visto?»).
//  1. «Nuovo appuntamento» chiede da dove partire: Scegli cavallo · Scegli cliente · Appuntamento aperto.
//     Le prime due sono la scheda di sempre (052): cambia solo il primo campo (con «cavallo» la ricerca mostra solo i cavalli, 087-2).
//  2. Appuntamento aperto: dove (proprietario o struttura), quando, quanti cavalli, il tipo di ogni lavoro (ora o «sul posto»).
//     Equo prevede quanti lavori e quale tipo dall'ultima volta in quel posto e dai richiami in scadenza dei cavalli che stanno lì.
//     Ogni lavoro diventa un appuntamento come gli altri, senza cavallo (etichetta oro «aperto»).
//  3. «Fatto» su un lavoro → «Chi era il cavallo?»: nome (prima i cavalli del posto non ancora visti), microchip (riconosce i cavalli
//     già in elenco; un cavallo nuovo diventa del cliente con il codice provvisorio), cosa hai fatto (vaccini con lotto, uguali da un
//     cavallo all'altro), costo (quello dell'ultima volta). «Salva e vai al lavoro N».
//  4. Chiuso l'ultimo lavoro: i documenti. Certificato di vaccinazione per ogni cavallo vaccinato (al proprietario e alla struttura),
//     riepilogo e conto a chi paga (il cliente dell'appuntamento). Il referto delle visite si fa dalla scheda della visita (08).
// Più avanti: lo stesso per il maniscalco (es. pareggi a più cavalli dello stesso maneggio), in lista delle cose da fare.

const VAP = { via: null, a: null, c: null, fatti: {}, passate: null, caricando: false, risolvi: null, vacc: null };
const VAA = VAP;   // nome storico (Home e prove lo usano)
const vaaEsc = s => escapeHtml(s == null ? "" : String(s));
const VAA_VACCINI = ["Influenza", "Tetano", "EHV (rinopolmonite)", "West Nile"];
const VAA_RIMANDATE = "equo-vaa-dopo";
const VAP_DECIDERE = "Da decidere sul posto";
const VAP_TIPI = ["vaccino", "visita", "terapia", "fisio", "mtc", "altro"];
const VAP_DURATA = { vaccino: 15, visita: 30, terapia: 30, fisio: 45, mtc: 45, urgenza: 45, altro: 30, posto: 20 };
const VAP_PLURALE = { vaccino: "vaccini", visita: "visite", terapia: "terapie", fisio: "sedute di fisioterapia", mtc: "sedute MTC", urgenza: "urgenze", altro: "lavori" };
const vaaVet = () => typeof eVeterinario === "function" && eVeterinario();
const vaaAperto = e => !!e && !e.cavallo_cliente_id && !e.horse_id && e.stato !== "fatto" && !["annullato", "rifiutato"].includes(e.stato);
const vapDaDecidere = e => !e || (e.tipo_altro || "") === VAP_DECIDERE;
const vapEtTipo = t => TIPO_FERRATURA_LABELS?.[t] || "Visita";
const vapNomeCliente = id => (typeof clienteDiId === "function" ? clienteDiId(id)?.nome : "") || "Cliente";
const vapSuEquo = c => !!(c && (c.cliente_user_id || c.centro_id));
const vapOggi = () => isoLocale(new Date());
function vapNomeLavoro(e){ return vapDaDecidere(e) ? "da decidere" : vapEtTipo(e.tipo_ferratura); }
function vaaEtichetta(e){ return vaaAperto(e) ? { cls: "oro", txt: "aperto" } : null; }

/* ======================= 1. le tre strade ======================= */
// chiamata all'inizio di openInterventoModal (052): true = ha aperto la scelta al posto della scheda
function vapScelta(clienteId, intervento, preset){
  if(VAP.via){ window.intCercaSolo = VAP.via === "cavallo" ? "cavallo" : null; return false; }
  window.intCercaSolo = null;
  if(!vaaVet() || clienteId || intervento || preset) return false;
  vapApriScelta();
  return true;
}
function vapIcona(cls){ return document.querySelector("#hm .hm-riga." + cls + " .ic")?.innerHTML || ""; }
const VAP_IC_APERTO = '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M17.5 14v7M14 17.5h7"/></svg>';
function vapFoglio(id, cls, conX){
  let ov = document.getElementById(id);
  if(!ov){
    ov = document.createElement("div"); ov.className = "modal-overlay"; ov.id = id;
    if(!conX) ov.setAttribute("data-senza-x", "");
    else ov.onclick = ev => { if(ev.target === ov) closeModal(id); };
    ov.innerHTML = `<div class="modal ${cls}" role="dialog" aria-modal="true" aria-labelledby="${id}-tit"><div class="modal-handle"></div><div id="${id}-corpo"></div></div>`;
    document.body.appendChild(ov);
  }
  return document.getElementById(id + "-corpo");
}
function vapApriScelta(){
  const box = vapFoglio("modal-vap", "vap-modal", true);
  const fr = '<span class="fr"><svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></span>';
  box.innerHTML = `<div class="modal-title" id="modal-vap-tit">Nuovo appuntamento</div><div class="vap-sotto">Da dove parti?</div>
    <button type="button" class="vap-op" onclick="vapVia('cavallo')"><span class="ic">${vapIcona("r-cav")}</span><span class="tx"><b>Scegli cavallo</b><small>Cerchi il cavallo: proprietario e posto si compilano da soli.</small></span>${fr}</button>
    <button type="button" class="vap-op" onclick="vapVia('cliente')"><span class="ic">${vapIcona("r-cli")}</span><span class="tx"><b>Scegli cliente</b><small>Proprietario o scuderia, poi scegli i suoi cavalli.</small></span>${fr}</button>
    <button type="button" class="vap-op ap" onclick="vapVia('aperto')"><span class="ic">${VAP_IC_APERTO}</span><span class="tx"><b>Appuntamento aperto</b><small>Vai in un posto e non sai ancora quali cavalli vedrai. Prepari quanti lavori servono, i cavalli li segni sul posto.</small></span>${fr}</button>`;
  openModal("modal-vap");
}
function vapVia(v){
  closeModal("modal-vap");
  if(v === "aperto") return vapApriAperto();
  VAP.via = v;
  Promise.resolve(openInterventoModal(null)).finally(() => { VAP.via = null; });
}
// chiamata alla fine di openInterventoModal (052): «Scegli cavallo» parte dalla ricerca del cavallo
function vapDopoApertura(){
  const m = document.getElementById("modal-add-intervento"); if(!m) return;
  const cav = vaaVet() && window.intCercaSolo === "cavallo";
  m.classList.toggle("via-cavallo", cav);
  const inp = document.getElementById("int-cerca-input");
  if(inp){ inp.placeholder = cav ? "Cerca il cavallo…" : "Cerca cliente o cavallo…"; inp.setAttribute("aria-label", inp.placeholder.replace("…", "")); }
  const lab = document.querySelector("#intervento-cliente-group .input-label");
  if(lab) lab.textContent = cav ? "Cavallo" : "Cliente";
  if(cav && inp) setTimeout(() => { try{ inp.focus(); }catch(_){} }, 250);
}

/* ======================= 2. appuntamento aperto: si prepara ======================= */
function vapAddMin(ora, min){
  if(!ora) return null;
  const [h, m] = String(ora).split(":").map(Number), t = h * 60 + m + min;
  return String(Math.floor(t / 60) % 24).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
}
function vapApriAperto(){
  const ora = new Date(), mezz = new Date(Math.ceil((ora.getTime() + 15 * 6e4) / 18e5) * 18e5);
  const oraProposta = isoLocale(mezz) === vapOggi() ? mezz.toTimeString().slice(0, 5) : "";   // dopo mezzanotte: niente ora proposta
  VAP.a = { cid: "", nuovo: "", cerca: "", quando: "oggi", data: vapOggi(), ora: oraProposta, n: 1, slot: ["posto"], prev: null, err: "" };
  vapFoglio("modal-vap-aperto", "vap-modal", true);
  vapDisegnaAperto();
  openModal("modal-vap-aperto");
}
function vapClientiPerDove(testo){
  const p = typeof cercaParole === "function" ? cercaParole(testo) : String(testo || "").toLowerCase().split(/\s+/).filter(Boolean);
  const lista = (typeof clientiAttivi === "function" ? clientiAttivi() : []).filter(c => !p.length || (typeof cercaCorrisponde === "function" ? cercaCorrisponde(p, c.nome) : c.nome.toLowerCase().includes(p.join(" "))));
  return lista.sort((a, b) => (isStruttura(b) - isStruttura(a)) || a.nome.localeCompare(b.nome, "it", { sensitivity: "base" })).slice(0, 8);
}
function vapDisegnaAperto(){
  const box = document.getElementById("modal-vap-aperto-corpo"); if(!box) return;
  const a = VAP.a, nomeDove = a.cid ? vapNomeCliente(a.cid) : a.nuovo;
  const doveLista = nomeDove ? [] : vapClientiPerDove(a.cerca);
  const chip = (i, t, testo) => `<button type="button" class="vs-chip${a.slot[i] === t ? " on" : ""}${t === "posto" ? " posto" : ""}" aria-pressed="${a.slot[i] === t}" onclick="vapTipoSlot(${i}, '${t}')">${testo}</button>`;
  box.innerHTML = `<div class="modal-title" id="modal-vap-aperto-tit">Appuntamento aperto</div><div class="vap-sotto">I cavalli li segni sul posto.</div>
    <div class="vaa-lab">Dove</div>
    ${nomeDove ? `<button type="button" class="vap-dove-scelto" onclick="vapCambiaDove()"><b>${vaaEsc(nomeDove)}</b><span>${a.cid ? (isStruttura(clienteDiId(a.cid)) ? "Scuderia" : "Proprietario") : "Cliente nuovo"} · cambia</span></button>`
      : `<input class="input" id="vap-dove" type="search" autocomplete="off" placeholder="Proprietario o struttura" value="${vaaEsc(a.cerca)}" oninput="vapCercaDove(this.value)">
         <div class="vap-dove-lista">${doveLista.map(c => `<button type="button" onclick="vapDove('${c.id}')"><b>${vaaEsc(c.nome)}</b><small>${isStruttura(c) ? "Scuderia" : "Proprietario"}</small></button>`).join("")}
         ${a.cerca.trim() ? `<button type="button" class="nuovo" onclick="vapDoveNuovo()"><b>+ Nuovo: «${vaaEsc(a.cerca.trim())}»</b><small>Cliente nuovo</small></button>` : ""}</div>`}
    <div class="vaa-lab">Quando</div>
    <div class="vaa-seg" role="tablist">${[["oggi", "Oggi"], ["domani", "Domani"], ["scegli", "Scegli giorno"]].map(([k, t]) => `<button type="button" role="tab" aria-selected="${a.quando === k}" class="${a.quando === k ? "on" : ""}" onclick="vapQuando('${k}')">${t}</button>`).join("")}</div>
    <div class="vaa-due">${a.quando === "scegli" ? `<input class="input" type="date" id="vap-data" value="${a.data}" min="${vapOggi()}" onchange="VAP.a.data = this.value">` : ""}
      <input class="input" type="time" id="vap-ora" value="${vaaEsc(a.ora)}" onchange="VAP.a.ora = this.value" aria-label="Ora"></div>
    <div class="vaa-lab">Quanti cavalli?</div>
    <div class="vap-step"><button type="button" onclick="vapQuanti(-1)" aria-label="Uno in meno" ${a.n <= 1 ? "disabled" : ""}>−</button><b id="vap-n">${a.n}</b>
      <button type="button" onclick="vapQuanti(1)" aria-label="Uno in più" ${a.n >= 30 ? "disabled" : ""}>+</button><small>Se non lo sai lascia 1: ne aggiungi sul posto.</small></div>
    <div class="vaa-lab">Lavori · il tipo puoi sceglierlo ora o sul posto</div>
    <div class="vap-slots">${a.slot.map((t, i) => `<div class="vap-slot"><b>Lavoro ${i + 1}</b><div class="vs-chips">${chip(i, "vaccino", "Vaccino")}${chip(i, "visita", "Visita")}${chip(i, "terapia", "Terapia")}${chip(i, "fisio", "Fisio")}${chip(i, "mtc", "MTC")}${chip(i, "posto", "sul posto")}</div></div>`).join("")}</div>
    ${a.prev && a.prev.testo ? `<div class="vaa-nota" id="vap-prev">${a.prev.testo}</div>` : ""}
    <div class="auth-error" id="vap-err" style="${a.err ? "" : "display:none"}">${vaaEsc(a.err)}</div>
    <button class="btn btn-primary vaa-ok" id="vap-crea" onclick="vapCrea()">Crea ${a.n === 1 ? "l'appuntamento" : a.n + " appuntamenti"}</button>`;
}
function vapCercaDove(v){
  VAP.a.cerca = v; vapDisegnaAperto();
  const inp = document.getElementById("vap-dove"); if(inp){ inp.focus(); try{ inp.setSelectionRange(inp.value.length, inp.value.length); }catch(_){} }
}
function vapCambiaDove(){ VAP.a.cid = ""; VAP.a.nuovo = ""; VAP.a.prev = null; vapCercaDove(""); }
async function vapDove(id){ VAP.a.cid = id; VAP.a.nuovo = ""; VAP.a.cerca = ""; VAP.a.err = ""; vapDisegnaAperto(); await vapPrevedi(id); }
function vapDoveNuovo(){ VAP.a.nuovo = VAP.a.cerca.trim(); VAP.a.cid = ""; VAP.a.cerca = ""; VAP.a.prev = null; vapDisegnaAperto(); }
function vapQuando(k){
  const a = VAP.a; a.quando = k;
  if(k === "oggi") a.data = vapOggi();
  if(k === "domani"){ a.data = aggiungiGiorniIso(vapOggi(), 1); if(!a.oraToccata) a.ora = "09:00"; }
  if(k === "scegli" && a.data <= vapOggi()) a.data = aggiungiGiorniIso(vapOggi(), 1);
  vapDisegnaAperto();
}
function vapQuanti(d){
  const a = VAP.a, n = Math.max(1, Math.min(30, a.n + d));
  while(a.slot.length < n) a.slot.push(a.prev?.tipo || "posto");
  a.slot.length = n; a.n = n; vapDisegnaAperto();
}
function vapTipoSlot(i, t){ VAP.a.slot[i] = t; vapDisegnaAperto(); }

// tutti i lavori del veterinario (fatti e da fare)
async function vapTutti(){
  try{ return DEMO_MODE ? (demoState.interventiMascalcia || []) : (await DB.listInterventiMascalciaTutti()) || []; }catch(_){ return []; }
}
const vapMese = d => new Date(d + "T12:00").toLocaleDateString("it-IT", { month: "short", year: "numeric" }).replace(".", "");
// previsione: ultima volta in quel posto + richiami in scadenza dei cavalli che stanno lì
async function vapPrevedi(cid){
  const tutti = await vapTutti();
  if(!VAP.a || VAP.a.cid !== cid) return;
  const fatti = tutti.filter(i => i.stato === "fatto" && i.cliente_mascalcia_id === cid && i.data_intervento);
  const ultimo = fatti.reduce((m, i) => i.data_intervento > m ? i.data_intervento : m, "");
  const delGiorno = fatti.filter(i => i.data_intervento === ultimo);
  const conta = {}; delGiorno.forEach(i => { conta[i.tipo_ferratura] = (conta[i.tipo_ferratura] || 0) + 1; });
  const tipoUlt = Object.keys(conta).sort((a, b) => conta[b] - conta[a])[0] || null;
  const cav = await vaaCavalliDelCliente(cid), ids = new Set(cav.map(c => c.id));
  const limite = aggiungiGiorniIso(vapOggi(), 30), ultVacc = {};
  tutti.filter(i => i.stato === "fatto" && ids.has(i.cavallo_cliente_id) && vaaVaccino(i))
    .forEach(i => { if(!ultVacc[i.cavallo_cliente_id] || i.data_intervento > ultVacc[i.cavallo_cliente_id].data_intervento) ultVacc[i.cavallo_cliente_id] = i; });
  const inScad = Object.values(ultVacc).filter(i => i.prossima_scadenza && i.prossima_scadenza <= limite).length;
  const tipo = inScad ? "vaccino" : (VAP_TIPI.includes(tipoUlt) ? tipoUlt : null);
  const n = Math.max(delGiorno.length, inScad);
  const parti = [];
  if(delGiorno.length) parti.push(`l'ultima volta qui hai fatto <b>${delGiorno.length === 1 ? "1 " + vapEtTipo(tipoUlt).toLowerCase() : delGiorno.length + " " + (VAP_PLURALE[tipoUlt] || "lavori")}</b> (${vapMese(ultimo)})`);
  if(inScad) parti.push(`<b>${inScad} ${inScad === 1 ? "cavallo ha" : "cavalli hanno"}</b> il richiamo in scadenza`);
  const testo = parti.length ? `Previsione: ${parti.join(", e ")}. Ho proposto ${n > 1 ? n + " lavori" : "1 lavoro"}${tipo ? " «" + vapEtTipo(tipo) + "»" : ""}.` : "";
  VAP.a.prev = { n, tipo, testo };
  if(n > 0){ VAP.a.n = Math.min(30, n); VAP.a.slot = Array.from({ length: VAP.a.n }, () => tipo || "posto"); }
  vapDisegnaAperto();
}

async function vapCrea(){
  const a = VAP.a, btn = document.getElementById("vap-crea");
  const errore = t => { a.err = t; const el = document.getElementById("vap-err"); if(el){ el.textContent = t; el.style.display = "block"; } };
  a.ora = document.getElementById("vap-ora")?.value || a.ora;
  if(a.quando === "scegli") a.data = document.getElementById("vap-data")?.value || a.data;
  if(!a.cid && !a.nuovo) return errore("Scegli dove vai: proprietario o struttura.");
  if(!a.data) return errore("Scegli il giorno.");
  if(btn) btn.disabled = true;
  try{
    let cid = a.cid;
    if(!cid){
      const r = await creaClienteUnico({ nome: a.nuovo, chiediCavalli: false });
      if(r.error || !r.data) return errore("Non sono riuscito a salvare il cliente: " + (r.error?.message || "riprova"));
      cid = r.data.id;
      if(typeof loadClientiMascalcia === "function") await loadClientiMascalcia().catch(() => {});
    }
    let ora = a.ora || null; const creati = [];
    for(const t of a.slot){
      const tipo = t === "posto" ? "visita" : t;
      const { data, error } = await DB.insertInterventoMascalcia({ cliente_mascalcia_id: cid, tipo_ferratura: tipo, tipo_altro: t === "posto" ? VAP_DECIDERE : null,
        data_intervento: a.data, ora, stato: "programmato", stato_pagamento: "da_saldare" });
      if(error) return errore("Errore: " + error.message);
      creati.push(data); ora = vapAddMin(ora, VAP_DURATA[t] || 20);
    }
    if(creati[0] && typeof avvisaNuovoSeCollegato === "function") try{ await avvisaNuovoSeCollegato(creati[0]); }catch(_){}
    closeModal("modal-vap-aperto");
    showToast(creati.length === 1 ? "Appuntamento aperto creato" : `Creati ${creati.length} appuntamenti aperti`);
    await vaaAggiorna();
  } finally { if(btn) btn.disabled = false; }
}

/* ======================= 3. «Fatto» su un lavoro: chi era il cavallo? ======================= */
async function vaaCavalliDelCliente(cid){
  const l = [];
  const add = (c, extra) => { if(!c || !c.id || l.some(x => x.id === c.id)) return; l.push({ id: c.id, nome: c.nome || "Cavallo", horse_id: c.horse_id || null, microchip: c.microchip || "", cliente_mascalcia_id: c.cliente_mascalcia_id || cid, ...extra }); };
  try{ (await DB.listCavalliCliente(cid)).forEach(c => { if(c.id) add(c, {}); }); }catch(_){}
  const tutti = typeof cavalliCartella === "function" ? cavalliCartella() : [];
  tutti.filter(c => c.ubicazione_cliente_id === cid && c.cliente_mascalcia_id !== cid).forEach(c => add(c, { di: vapNomeCliente(c.cliente_mascalcia_id) }));
  return l.sort((a, b) => a.nome.localeCompare(b.nome, "it", { sensitivity: "base" }));
}
const vaaVaccino = e => e.tipo_ferratura === "vaccino" || /vaccin/i.test(e.tipo_altro || "");
const vapChiave = (cid, d) => cid + "|" + d;
const vapNormChip = s => String(s || "").replace(/[^0-9a-z]/gi, "").toUpperCase();
// tutti i lavori di quel cliente in quel giorno (da fare e fatti)
async function vapLavoriDelGiorno(cid, giorno){
  let l = [];
  if(DEMO_MODE) l = demoState.interventiMascalcia || [];
  else{ try{ l = (await DB.listInterventiPeriodo(giorno, giorno)) || []; }catch(_){ l = []; } }
  const hp = typeof hpAppuntamenti !== "undefined" ? hpAppuntamenti || [] : [];
  return [...l, ...hp].filter((e, i, a) => a.findIndex(x => x.id === e.id) === i)
    .filter(e => e.cliente_mascalcia_id === cid && e.data_intervento === giorno && !["annullato", "rifiutato"].includes(e.stato))
    .sort((a, b) => String(a.ora || "99").localeCompare(String(b.ora || "99")) || String(a.created_at || "").localeCompare(String(b.created_at || "")));
}
async function vapPrezzoPrevisto(cid, tipo, e){
  if(Number(e?.importo) > 0) return String(e.importo);
  const tutti = (await vapTutti()).filter(i => i.stato === "fatto" && i.tipo_ferratura === tipo && Number(i.importo) > 0)
    .sort((a, b) => String(b.data_intervento).localeCompare(String(a.data_intervento)));
  const qui = tutti.find(i => i.cliente_mascalcia_id === cid) || tutti[0];
  return qui ? String(qui.importo) : "";
}
function vapVaccMemoria(){
  if(VAP.vacc) return VAP.vacc;
  try{ const m = JSON.parse(localStorage.getItem("equo-vap-vacc") || "null"); if(m && m.giorno === vapOggi()) return (VAP.vacc = m); }catch(_){}
  return { fatto: ["Influenza", "Tetano"], lotto: "", lottoScad: "", richiamo: 365 };
}

// segnaFatto (117) → per un appuntamento senza cavallo
async function vaaFatto(e){
  if(VAP.risolvi){ VAP.risolvi({ ok: false }); VAP.risolvi = null; }
  const giorno = e.data_intervento && e.data_intervento <= vapOggi() ? e.data_intervento : vapOggi();
  const cid = e.cliente_mascalcia_id;
  // i lavori di questo appuntamento aperto: quelli ancora senza cavallo e quelli già chiusi qui (non le altre visite del giorno)
  // (un appuntamento di un altro giorno chiuso oggi passa a oggi: si guardano tutti e due i giorni; prima i già chiusi, poi gli aperti per ora)
  const chiusi = VAP.fatti[vapChiave(cid, giorno)] || [];
  const giorni = [...new Set([e.data_intervento || giorno, giorno])];
  const tutti = []; for(const g of giorni) (await vapLavoriDelGiorno(cid, g)).forEach(x => { if(!tutti.some(y => y.id === x.id)) tutti.push(x); });
  const lavori = [...chiusi.map(id => tutti.find(x => x.id === id)).filter(Boolean),
    ...tutti.filter(x => !chiusi.includes(x.id) && (x.id === e.id || vaaAperto(x))).sort((p, q) => String(p.ora || "99").localeCompare(String(q.ora || "99")))];
  const cav = await vaaCavalliDelCliente(cid);
  const giaVisti = new Set(tutti.filter(x => x.stato === "fatto" && x.cavallo_cliente_id && x.data_intervento === giorno).map(x => x.cavallo_cliente_id));
  const tipo = vapDaDecidere(e) ? null : e.tipo_ferratura;
  const v = vapVaccMemoria();
  VAP.c = { e, giorno, cid, lavori, cavalli: cav, giaVisti, nome: "", scelto: null, chip: "", chipEsito: "",
    tipo, motivo: vapDaDecidere(e) || vaaVaccino(e) ? "" : (e.tipo_altro || ""),
    fatto: v.fatto.slice(), lotto: v.lotto, lottoScad: v.lottoScad, richiamo: v.richiamo, prezzo: tipo ? await vapPrezzoPrevisto(cid, tipo, e) : (Number(e.importo) > 0 ? String(e.importo) : "") };
  vapFoglio("modal-vaa", "vaa-modal", false);
  vapDisegnaChiusura();
  openModal("modal-vaa");
  return new Promise(res => { VAP.risolvi = res; });
}
function vapNumeri(){
  const c = VAP.c, idx = c.lavori.findIndex(x => x.id === c.e.id);
  return { k: (idx >= 0 ? idx : c.lavori.length) + 1, n: Math.max(c.lavori.length, idx + 1),
    prossimo: c.lavori.find(x => x.id !== c.e.id && vaaAperto(x)) || null };
}
function vapSuggeriti(){
  const c = VAP.c, q = (typeof cercaNorm === "function" ? cercaNorm(c.nome) : c.nome.toLowerCase()).trim();
  return c.cavalli.filter(x => !c.giaVisti.has(x.id) && (!q || (typeof cercaNorm === "function" ? cercaNorm(x.nome) : x.nome.toLowerCase()).includes(q))).slice(0, 6);
}
function vapDisegnaChiusura(){
  const box = document.getElementById("modal-vaa-corpo"); if(!box) return;
  const c = VAP.c, e = c.e, { k, n, prossimo } = vapNumeri(), vacc = c.tipo === "vaccino";
  const sug = c.scelto ? [] : vapSuggeriti();
  const tipi = VAP_TIPI.map(t => `<button type="button" class="vs-chip${c.tipo === t ? " on" : ""}" aria-pressed="${c.tipo === t}" onclick="vapTipo('${t}')">${vaaEsc(vapEtTipo(t))}</button>`).join("");
  box.innerHTML = `<div class="modal-title" id="modal-vaa-tit">Chi era il cavallo?</div>
    <div class="vaa-sotto-tit">Lavoro ${k} di ${n} · ${vaaEsc(c.tipo ? vapEtTipo(c.tipo) : "da decidere")} · ${vaaEsc(vapNomeCliente(c.cid))}</div>
    <div class="vaa-lab">Nome del cavallo</div>
    ${c.scelto ? `<button type="button" class="vap-dove-scelto" onclick="vapTogliCavallo()"><b>${vaaEsc(c.scelto.nome)}</b><span>${c.scelto.di ? "di " + vaaEsc(c.scelto.di) + " · " : ""}${c.scelto.microchip ? "chip " + vaaEsc(c.scelto.microchip) + " · " : ""}cambia</span></button>`
      : `<input class="input" id="vap-nome" autocomplete="off" placeholder="Scrivi il nome" value="${vaaEsc(c.nome)}" oninput="vapNome(this.value)">
         ${sug.length ? `<div class="vap-sug">${sug.map(x => `<button type="button" onclick="vapScegliCavallo('${x.id}')">${vaaEsc(x.nome)}${x.di ? `<small>di ${vaaEsc(x.di)}</small>` : ""}</button>`).join("")}</div>
           <div class="vap-piccolo">${c.nome ? "Cavalli di questo posto con questo nome." : "Prima i cavalli di questo posto non ancora visti oggi."}</div>` : (c.nome.trim() ? `<div class="vap-piccolo">Cavallo nuovo: diventa di ${vaaEsc(vapNomeCliente(c.cid))}, con il codice provvisorio di Equo.</div>` : "")}`}
    <div class="vaa-lab">Microchip</div>
    <input class="input" id="vap-chip" inputmode="numeric" autocomplete="off" placeholder="15 cifre (se lo leggi)" value="${vaaEsc(c.chip)}" oninput="vapChip(this.value)">
    ${c.chipEsito ? `<div class="vap-ok">${c.chipEsito}</div>` : ""}
    <div class="vaa-lab">Cosa hai fatto</div>
    <div class="vs-chips">${tipi}</div>
    ${vacc ? `<div class="vs-chips vap-vacc">${VAA_VACCINI.map(v => `<button type="button" class="vs-chip${c.fatto.includes(v) ? " on" : ""}" aria-pressed="${c.fatto.includes(v)}" onclick="vaaVacc('${v}')">${v}</button>`).join("")}</div>
       <div class="vaa-due"><input class="input" id="vaa-lotto" placeholder="Lotto" value="${vaaEsc(c.lotto)}" oninput="VAP.c.lotto = this.value"><input class="input" id="vaa-lotto-scad" placeholder="Scadenza lotto (es. 06/2027)" value="${vaaEsc(c.lottoScad)}" oninput="VAP.c.lottoScad = this.value"></div>
       <div class="vaa-sotto">Richiamo</div><div class="vs-chips">${[[182, "tra 6 mesi"], [365, "tra 1 anno"]].map(([g, t]) => `<button type="button" class="vs-chip${c.richiamo === g ? " on" : ""}" onclick="vaaRichiamo(${g})">${t}</button>`).join("")}</div>`
      : c.tipo ? `<input class="input vap-motivo" id="vaa-testo" placeholder="In breve (es. controllo, ecografia tendine)" value="${vaaEsc(c.motivo)}" oninput="VAP.c.motivo = this.value">` : ""}
    <div class="vaa-lab">Costo</div>
    <label class="vaa-prezzo base">€<input type="number" min="0" step="1" inputmode="decimal" id="vaa-prezzo-base" value="${vaaEsc(c.prezzo)}" oninput="VAP.c.prezzo = this.value">
      <small>${c.prezzo ? "proposto dall'ultima volta: lo cambi se serve" : ""}</small></label>
    <div class="auth-error" id="vaa-err" style="display:none"></div>
    <button class="btn btn-primary vaa-ok" onclick="vaaSalva()">${prossimo ? `Salva e vai al lavoro ${k + 1} ›` : "Salva e chiudi la visita"}</button>
    ${(c.aggiunti || []).length ? `<div class="vaa-nota vap-aggiunto" role="status"><span>✓ ${c.aggiunti.length === 1 ? "Aggiunto 1 lavoro" : "Aggiunti " + c.aggiunti.length + " lavori"}: ${c.aggiunti.length === 1 ? "lo compili" : "li compili"} dopo questo.</span><button type="button" class="vap-mini" onclick="vapTogliAggiunto()">Togli</button></div>` : ""}
    <button class="btn btn-outline vap-altro" id="vap-altro" onclick="vapAggiungiLavoro()" ${VAP.occupato ? "disabled" : ""}>+ Un altro cavallo qui</button>
    <button class="btn btn-outline vaa-dopo" onclick="vaaDopo()">Più tardi</button>
    <div class="vaa-nota oro">Se esci senza nome, il lavoro resta «aperto» e te lo ricordo in Home.</div>`;
}
function vapRidisegna(idFuoco){
  const a = document.activeElement, id = idFuoco || (a && a.id) || null, pos = a && "selectionStart" in a ? a.selectionStart : null;
  vapDisegnaChiusura();
  const el = id ? document.getElementById(id) : null;
  if(el){ el.focus(); try{ if(pos != null) el.setSelectionRange(pos, pos); }catch(_){} }
}
function vapNome(v){ VAP.c.nome = v; vapRidisegna("vap-nome"); }
async function vapScegliCavallo(id){
  const c = VAP.c, x = c.cavalli.find(y => y.id === id); if(!x) return;
  c.scelto = x; c.nome = x.nome; if(x.microchip && !c.chip) c.chip = x.microchip;
  c.chipEsito = ""; vapDisegnaChiusura();
}
function vapTogliCavallo(){ const c = VAP.c; c.scelto = null; c.chipEsito = ""; vapRidisegna("vap-nome"); }
function vapChip(v){
  const c = VAP.c; c.chip = v; const k = vapNormChip(v);
  let esito = "";
  if(k.length >= 10){
    const tutti = [...c.cavalli, ...(typeof cavalliCartella === "function" ? cavalliCartella() : [])];
    const t = tutti.find(x => x.microchip && vapNormChip(x.microchip) === k);
    if(t){
      const di = t.cliente_mascalcia_id && t.cliente_mascalcia_id !== c.cid ? vapNomeCliente(t.cliente_mascalcia_id) : "";
      c.scelto = { id: t.id, nome: t.nome, horse_id: t.horse_id || null, microchip: t.microchip, cliente_mascalcia_id: t.cliente_mascalcia_id, di: t.di || di };
      c.nome = t.nome;
      esito = `✓ Trovato tra i tuoi cavalli: <b>${vaaEsc(t.nome)}</b>${c.scelto.di ? ", di " + vaaEsc(c.scelto.di) + ". Lo collego a lui" : ""}.`;
    }
  }
  c.chipEsito = esito; vapRidisegna("vap-chip");
}
async function vapTipo(t){
  const c = VAP.c; c.tipo = t;
  if(!c.prezzo || c.prezzoAuto){ c.prezzo = await vapPrezzoPrevisto(c.cid, t, null); c.prezzoAuto = true; }
  vapDisegnaChiusura();
}
function vaaVacc(v){ const c = VAP.c; c.fatto = c.fatto.includes(v) ? c.fatto.filter(x => x !== v) : VAA_VACCINI.filter(x => x === v || c.fatto.includes(x)); vapDisegnaChiusura(); }
function vaaRichiamo(g){ VAP.c.richiamo = g; vapDisegnaChiusura(); }
function vaaChiudi(r){ closeModal("modal-vaa"); const f = VAP.risolvi; VAP.risolvi = null; if(f) f(r); }
// «Più tardi»: resta aperta e «da completare» in Home
function vaaDopo(){
  try{ const l = JSON.parse(localStorage.getItem(VAA_RIMANDATE) || "[]"); if(VAP.c?.e && !l.includes(VAP.c.e.id)) l.push(VAP.c.e.id); localStorage.setItem(VAA_RIMANDATE, JSON.stringify(l.slice(-50))); }catch(_){}
  vaaChiudi({ ok: false, rimandata: true });
  vaaAggiorna();
}
function vaaDescrizione(){
  const c = VAP.c;
  if(c.tipo === "vaccino"){
    const v = c.fatto.map(x => x.split(" ")[0].toLowerCase()).join(" + ");
    return ["Vaccino " + v, c.lotto.trim() ? "lotto " + c.lotto.trim() + (c.lottoScad.trim() ? " (scad. " + c.lottoScad.trim() + ")" : "") : ""].filter(Boolean).join(" · ").slice(0, 200);
  }
  return String(c.motivo || "").trim().slice(0, 200) || null;
}
async function vaaSalva(){
  const c = VAP.c, e = c.e, err = document.getElementById("vaa-err"), btn = document.querySelector("#modal-vaa-corpo .vaa-ok");
  const errore = t => { if(err){ err.textContent = t; err.style.display = "block"; } };
  if(err) err.style.display = "none";
  const nome = (c.scelto?.nome || c.nome || "").trim();
  if(!nome) return errore("Scrivi il nome del cavallo (o scegline uno).");
  if(!c.tipo) return errore("Scegli cosa hai fatto.");
  if(c.tipo === "vaccino" && !c.fatto.length) return errore("Scegli almeno un vaccino.");
  if(btn) btn.disabled = true;
  try{
    const chip = vapNormChip(c.chip) ? c.chip.replace(/\s+/g, "").trim().toUpperCase() : null;
    let cav = c.scelto;
    if(!cav){
      // il nome scritto è già un cavallo di questo posto? si usa quello
      const n = typeof cercaNorm === "function" ? cercaNorm(nome) : nome.toLowerCase();
      cav = c.cavalli.find(x => (typeof cercaNorm === "function" ? cercaNorm(x.nome) : x.nome.toLowerCase()) === n) || null;
    }
    if(!cav){
      const { data, error } = await DB.insertCavalloCliente({ cliente_mascalcia_id: c.cid, nome, microchip: chip });
      if(error || !data) return errore("Non sono riuscito a salvare il cavallo: " + (error?.message || "riprova"));
      cav = { id: data.id, nome: data.nome, horse_id: data.horse_id || null, microchip: data.microchip, cliente_mascalcia_id: c.cid, nuovo: true };
      if(chip && !DEMO_MODE) try{ await sb.rpc("sync_microchip_link", { p_microchip: chip }); }catch(_){}
    } else if(chip && !cav.microchip){
      await DB.updateCavalloCliente(cav.id, { microchip: chip }); cav.microchip = chip;
      if(!DEMO_MODE) try{ await sb.rpc("sync_microchip_link", { p_microchip: chip }); }catch(_){}
    }
    const prezzo = c.prezzo === "" || c.prezzo == null || !(Number(c.prezzo) >= 0) ? null : Number(c.prezzo);
    const prossima = c.tipo === "vaccino" ? aggiungiGiorniIso(c.giorno, c.richiamo) : null;
    const upd = { cavallo_cliente_id: cav.id, horse_id: cav.horse_id || null, tipo_ferratura: c.tipo, tipo_altro: vaaDescrizione(), importo: prezzo,
      data_intervento: c.giorno, stato: "fatto", stato_pagamento: e.stato_pagamento || "da_saldare", ...(prossima ? { prossima_scadenza: prossima } : {}) };
    const { error } = await DB.updateInterventoMascalcia(e.id, upd);
    if(error) return errore("Errore: " + error.message);
    Object.assign(e, upd);
    if(c.tipo === "vaccino"){ VAP.vacc = { giorno: vapOggi(), fatto: c.fatto, lotto: c.lotto, lottoScad: c.lottoScad, richiamo: c.richiamo }; try{ localStorage.setItem("equo-vap-vacc", JSON.stringify(VAP.vacc)); }catch(_){} }
    try{ const l = JSON.parse(localStorage.getItem(VAA_RIMANDATE) || "[]").filter(x => x !== e.id); localStorage.setItem(VAA_RIMANDATE, JSON.stringify(l)); }catch(_){}
    if(VAP.passate) VAP.passate = VAP.passate.filter(x => x.id !== e.id);
    const kk = vapChiave(c.cid, c.giorno); (VAP.fatti[kk] = VAP.fatti[kk] || []).push(e.id);
    const { prossimo } = vapNumeri();
    showToast(`${cav.nome}: segnato`);
    vaaChiudi({ ok: true, cavalli: 1 });
    if(cav.nuovo && typeof caricaCavalliMiei === "function") await caricaCavalliMiei().catch(() => {});
    await vaaAggiorna();
    if(prossimo) setTimeout(() => vaaFatto({ ...prossimo }), 250);
    else setTimeout(() => vapDocumenti(c.cid, c.giorno), 250);
  } finally { if(btn) btn.disabled = false; }
}
// «+ Un altro cavallo qui»: un lavoro in più, stesso posto e giorno
// 4/11/2026 (Simone: «il tasto sembra non funzionare ma crea duplicati»): il tasto si blocca mentre salva e nel foglio
// compare «✓ Aggiunto 1 lavoro: lo compili dopo questo» con «Togli» (prima c'era solo un avviso nascosto dietro il foglio).
async function vapAggiungiLavoro(){
  if(VAP.occupato) return;
  const c = VAP.c, e = c.e;
  VAP.occupato = true; const bt = document.getElementById("vap-altro"); if(bt) bt.disabled = true;
  try{
    const { data, error } = await DB.insertInterventoMascalcia({ cliente_mascalcia_id: c.cid, tipo_ferratura: c.tipo || e.tipo_ferratura || "visita", tipo_altro: c.tipo ? null : VAP_DECIDERE,
      data_intervento: e.data_intervento || c.giorno, ora: null, stato: "programmato", stato_pagamento: "da_saldare" });
    if(error || !data) return showToast("Errore: " + (error?.message || "riprova"));
    c.lavori.push(data); (c.aggiunti = c.aggiunti || []).push(data.id);
  } finally { VAP.occupato = false; }
  vapRidisegna();
  vaaAggiorna();
}
// «Togli»: l'ultimo lavoro aggiunto per sbaglio (ancora vuoto)
async function vapTogliAggiunto(){
  if(VAP.occupato) return;
  const c = VAP.c, id = (c.aggiunti || []).slice(-1)[0]; if(!id) return;
  VAP.occupato = true;
  try{
    const { error } = await DB.deleteInterventoMascalcia(id);
    if(error) return showToast("Errore: " + error.message);
    c.aggiunti = c.aggiunti.filter(x => x !== id); c.lavori = c.lavori.filter(x => x.id !== id);
  } finally { VAP.occupato = false; }
  vapRidisegna();
  vaaAggiorna();
}

/* ======================= 4. visita chiusa: i documenti ======================= */
async function vapDocumenti(cid, giorno){
  // i lavori chiusi in questo giro (se ce ne sono), altrimenti tutti quelli fatti lì quel giorno
  const chiusi = VAP.fatti[vapChiave(cid, giorno)] || [];
  const lavori = (await vapLavoriDelGiorno(cid, giorno)).filter(x => x.stato === "fatto" && x.cavallo_cliente_id && (!chiusi.length || chiusi.includes(x.id)));
  if(!lavori.length) return;
  const cart = typeof cavalliCartella === "function" ? cavalliCartella() : [];
  const cavDi = id => cart.find(x => x.id === id) || (DEMO_MODE ? (demoState.cavalliClientiMascalcia || []).find(x => x.id === id) : null) || {};
  const righe = lavori.map(l => { const cv = cavDi(l.cavallo_cliente_id); return { l, cav: { id: l.cavallo_cliente_id, horse_id: l.horse_id, nome: cv.nome || "Cavallo", microchip: cv.microchip || "", codice: cv.codice_equo || "", propId: cv.cliente_mascalcia_id || cid } }; });
  const pagante = clienteDiId(cid);
  const dest = [{ cliente: pagante, cosa: "conto e documenti dei suoi cavalli", conto: true }];
  righe.forEach(r => { if(r.cav.propId !== cid && !dest.some(d => d.cliente?.id === r.cav.propId)){ const p = clienteDiId(r.cav.propId); if(p) dest.push({ cliente: p, cosa: "il certificato del suo cavallo", conto: false }); } });
  dest.forEach(d => { d.suEquo = vapSuEquo(d.cliente); d.on = d.suEquo; });
  const vacc = righe.filter(r => vaaVaccino(r.l)), visite = righe.filter(r => !vaaVaccino(r.l));
  const tot = righe.reduce((s, r) => s + (Number(r.l.importo) > 0 ? Number(r.l.importo) : 0), 0);
  VAP.d = { cid, giorno, righe, vacc, visite, dest, tot, conto: true, cert: true };
  const box = vapFoglio("modal-vap-doc", "vap-modal", true);
  const dt = new Date(giorno + "T12:00").toLocaleDateString("it-IT");
  box.innerHTML = `<div class="modal-title" id="modal-vap-doc-tit">Visita chiusa</div>
    <div class="vaa-sotto-tit">${righe.length} ${righe.length === 1 ? "cavallo" : "cavalli"} · ${vaaEsc(pagante?.nome || "")} · ${dt}</div>
    <div class="vaa-lab">Da inviare</div>
    ${vacc.length ? `<label class="vap-doc"><input type="checkbox" checked onchange="VAP.d.cert = this.checked"><span><b>Certificati di vaccinazione</b><small>${vacc.length} ${vacc.length === 1 ? "cavallo" : "cavalli"} · uno per cavallo, con lotto: ${vaaEsc(vacc.map(r => r.cav.nome).join(", "))}</small></span></label>` : ""}
    <label class="vap-doc"><input type="checkbox" checked onchange="VAP.d.conto = this.checked"><span><b>Riepilogo e conto</b><small>a ${vaaEsc(pagante?.nome || "chi paga")}, con tutti i lavori</small></span></label>
    ${visite.map(r => `<div class="vap-doc"><span class="vap-doc-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg></span><span><b>Referto · ${vaaEsc(r.cav.nome)}</b><small>dalla scheda della visita</small></span><button type="button" class="vap-mini" onclick="vapApriScheda('${r.l.id}')">Apri</button></div>`).join("")}
    <div class="vaa-lab">A chi</div>
    ${dest.map((d, i) => `<label class="vap-doc${d.suEquo ? "" : " fuori"}"><input type="checkbox" ${d.on ? "checked" : ""} ${d.suEquo ? "" : "disabled"} onchange="VAP.d.dest[${i}].on = this.checked">
      <span><b>${vaaEsc(d.cliente?.nome || "")}</b><small>${vaaEsc(d.cosa)} · ${d.suEquo ? "in chat su Equo" : "non è su Equo: usa «Condividi»"}</small></span></label>`).join("")}
    <div class="vaa-tot"><span>Totale</span><span>${tot > 0 ? formatEuro(tot) : "—"}</span></div>
    <div class="auth-error" id="vap-doc-err" style="display:none"></div>
    <button class="btn btn-primary vaa-ok" id="vap-invia" onclick="vapInvia()">Invia i documenti</button>
    <button class="btn btn-outline vaa-dopo" onclick="vapCondividi()">Condividi i PDF</button>
    <button class="btn btn-outline vap-altro" onclick="vapAltroDopoChiusa()">+ C'è un altro cavallo</button>`;
  openModal("modal-vap-doc");
}
function vapApriScheda(id){
  const e = (VAP.d?.righe || []).find(r => r.l.id === id)?.l; if(!e) return;
  closeModal("modal-vap-doc");
  if(typeof vsApriDaEvento === "function") vsApriDaEvento(e.id, e); else if(typeof apriAzioniEvento === "function") apriAzioniEvento(id);
}
async function vapAltroDopoChiusa(){
  if(VAP.occupato) return; VAP.occupato = true; setTimeout(() => { VAP.occupato = false; }, 1500);
  const d = VAP.d;
  const { data, error } = await DB.insertInterventoMascalcia({ cliente_mascalcia_id: d.cid, tipo_ferratura: "visita", tipo_altro: VAP_DECIDERE, data_intervento: d.giorno, ora: null, stato: "programmato", stato_pagamento: "da_saldare" });
  if(error || !data) return showToast("Errore: " + (error?.message || "riprova"));
  closeModal("modal-vap-doc"); await vaaAggiorna(); vaaFatto(data);
}
function vapNomePro(){ return currentUser?.datiPagamentoNome || currentUser?.fullName || currentUser?.full_name || currentUser?.email || "Veterinario"; }
// PDF: certificato di vaccinazione (un cavallo) o riepilogo e conto (tutti i lavori), colori del mockup C
async function vapPdf(tipo, righe){
  const JsPDF = await caricaJsPdf();
  const doc = new JsPDF({ unit: "mm", format: "a4" });
  const M = 18, W = 210, notte = [29, 45, 80], tif = [127, 209, 201], grigio = [103, 112, 134], testo = [26, 34, 54];
  const d = VAP.d, dt = new Date(d.giorno + "T12:00").toLocaleDateString("it-IT"), pagante = clienteDiId(d.cid);
  doc.setFillColor(...notte); doc.rect(0, 0, W, 30, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(17);
  doc.text(tipo === "cert" ? "Certificato di vaccinazione" : "Riepilogo della visita", M, 15);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...tif);
  doc.text(`${vapNomePro()} · ${dt}`, M, 23);
  let y = 42; doc.setTextColor(...testo);
  const riga = (k, v) => { if(!v) return; doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...grigio); doc.text(k, M, y);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...testo); const t = doc.splitTextToSize(String(v), W - M - 70); doc.text(t, M + 52, y); y += 6.5 * t.length; };
  if(tipo === "cert"){
    const r = righe[0], prop = clienteDiId(r.cav.propId);
    riga("Cavallo", r.cav.nome); riga("Microchip", r.cav.microchip); riga("Codice Equo", r.cav.codice);
    riga("Proprietario", prop?.nome); riga("Dove", pagante && pagante.id !== prop?.id ? pagante.nome : ""); riga("Data", dt);
    y += 3; doc.setDrawColor(...tif); doc.line(M, y, W - M, y); y += 8;
    riga("Vaccinazione", r.l.tipo_altro || "Vaccino");
    riga("Prossimo richiamo", r.l.prossima_scadenza ? new Date(r.l.prossima_scadenza + "T12:00").toLocaleDateString("it-IT") : "");
  } else {
    riga("Cliente", pagante?.nome); riga("Data", dt); y += 4;
    righe.forEach(r => {
      if(y > 270){ doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...notte); doc.text(r.cav.nome, M, y);
      doc.text(Number(r.l.importo) > 0 ? "€ " + Number(r.l.importo).toFixed(2).replace(".", ",") : "—", W - M, y, { align: "right" }); y += 5;
      doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...grigio);
      const t = doc.splitTextToSize([vapEtTipo(r.l.tipo_ferratura), r.l.tipo_altro && r.l.tipo_altro !== VAP_DECIDERE ? r.l.tipo_altro : ""].filter(Boolean).join(" · ") + (r.cav.microchip ? " · chip " + r.cav.microchip : ""), W - 2 * M);
      doc.text(t, M, y); y += 5 * t.length + 3;
    });
    doc.setDrawColor(...tif); doc.line(M, y, W - M, y); y += 7;
    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(...notte); doc.text("Totale", M, y);
    doc.text(d.tot > 0 ? "€ " + d.tot.toFixed(2).replace(".", ",") : "—", W - M, y, { align: "right" });
  }
  const nome = (tipo === "cert" ? "Vaccino " + righe[0].cav.nome : "Riepilogo " + (pagante?.nome || "visita")) + " " + d.giorno + ".pdf";
  return { blob: doc.output("blob"), nome };
}
async function vapCondividi(){
  try{
    const d = VAP.d, files = [];
    if(d.cert) for(const r of d.vacc){ const p = await vapPdf("cert", [r]); files.push(new File([p.blob], p.nome, { type: "application/pdf" })); }
    if(d.conto){ const p = await vapPdf("conto", d.righe); files.push(new File([p.blob], p.nome, { type: "application/pdf" })); }
    if(!files.length) return showToast("Scegli almeno un documento");
    if(navigator.canShare && navigator.canShare({ files })){ try{ await navigator.share({ files, title: "Documenti della visita" }); return; }catch(err){ if(err?.name === "AbortError") return; } }
    for(const f of files){ const url = URL.createObjectURL(f), a = document.createElement("a"); a.href = url; a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000); }
  }catch(err){ console.error("vap condividi:", err); showToast("Impossibile creare i PDF: " + (err?.message || err)); }
}
async function vapInvia(){
  const d = VAP.d, btn = document.getElementById("vap-invia"), err = document.getElementById("vap-doc-err");
  const scelti = d.dest.filter(x => x.on && x.suEquo);
  if(!scelti.length){ if(err){ err.textContent = "Nessun destinatario su Equo: usa «Condividi i PDF»."; err.style.display = "block"; } return; }
  if(btn) btn.disabled = true;
  const avvisi = [], inviati = new Set(), dt = new Date(d.giorno + "T12:00").toLocaleDateString("it-IT");
  const accesso = c => c.centro_id && !c.cliente_user_id ? { centro_id: c.centro_id, motivo: "chat" } : { user_id: c.cliente_user_id, motivo: "chat" };
  try{
    showToast("Preparo e invio i documenti…");
    if(d.cert) for(const r of d.vacc){
      const { blob } = await vapPdf("cert", [r]);
      const { id, error, numero } = await DB.caricaDocumentoPrivato({ blob, mime: "application/pdf", categoria: "vaccino", cavallo_nome: r.cav.nome, data_documento: d.giorno,
        cavallo_cliente_id: r.cav.id, horse_id: r.cav.horse_id || null, autore_ruolo: "veterinario", sanitario_obbligatorio: true });
      if(!id){ avvisi.push(r.cav.nome + ": certificato non salvato (" + (error?.message || "errore") + ")"); continue; }
      const nomeFile = DB.nomeFileDocumento({ mime: "application/pdf", data_documento: d.giorno, categoria: "vaccino", numero }, r.cav.nome);
      for(const x of scelti.filter(x => x.cliente.id === r.cav.propId || x.conto)){
        const acc = await DB.condividiDocumento(id, accesso(x.cliente));
        if(!acc?.ok){ avvisi.push(r.cav.nome + " → " + x.cliente.nome + (String(acc?.errore || "").startsWith("decide_proprietario") ? ": lo vedrà se il proprietario lo condivide" : ": non condiviso")); continue; }
        const { error: em } = await DB.insertMessaggioMascalcia({ cliente_mascalcia_id: x.cliente.id, tipo: "documento", testo: "Certificato di vaccinazione di " + r.cav.nome + " (" + dt + ")", file_url: "equo-doc:" + id, file_nome: nomeFile });
        if(em) avvisi.push(x.cliente.nome + ": messaggio non inviato"); else inviati.add(x.cliente.nome);
      }
    }
    const pag = scelti.find(x => x.conto);
    if(d.conto && pag){
      const testo = `Riepilogo della visita del ${dt}:\n` + d.righe.map(r => `· ${r.cav.nome}: ${r.l.tipo_altro || vapEtTipo(r.l.tipo_ferratura)}${Number(r.l.importo) > 0 ? " — " + formatEuro(Number(r.l.importo)) : ""}`).join("\n")
        + (d.tot > 0 ? `\nTotale ${formatEuro(d.tot)}` : "");
      const { error: em } = await DB.insertMessaggioMascalcia({ cliente_mascalcia_id: pag.cliente.id, tipo: "testo", testo });
      if(em) avvisi.push(pag.cliente.nome + ": riepilogo non inviato"); else inviati.add(pag.cliente.nome);
    }
    const box = document.getElementById("modal-vap-doc-corpo");
    if(box) box.innerHTML = `<div class="vr-ok"><span class="vr-spunta">✓</span><b>Documenti ${inviati.size ? "inviati" : "salvati"}</b>
      <span>${inviati.size ? "In chat a " + vaaEsc([...inviati].join(", ")) + "." : "Sono nella cartella dei cavalli."}</span></div>
      ${avvisi.length ? `<div class="vs-nota">${avvisi.map(vaaEsc).join("<br>")}</div>` : ""}
      <button class="btn btn-primary vaa-ok" onclick="closeModal('modal-vap-doc')">Chiudi</button>`;
  }catch(e2){ console.error("vap invia:", e2); if(err){ err.textContent = "Impossibile inviare: " + (e2?.message || e2); err.style.display = "block"; } }
  finally{ if(btn) btn.disabled = false; }
}

async function vaaAggiorna(){
  for(const f of ["renderAgendaSettimana", "renderIncassi", "renderProDeadlines"]) if(typeof window[f] === "function") try{ await window[f](); }catch(_){}
  if(document.getElementById("vh") && typeof renderHomeVet === "function") try{ renderHomeVet(); }catch(_){}
}

/* ======================= 5. «da completare» in Home ======================= */
// lavori aperti dei giorni passati, più quelli di oggi rimandati con «Più tardi» (ultimi 60 giorni, letti una volta)
function vaaCaricaPassate(){
  if(VAP.passate || VAP.caricando || typeof DB?.listInterventiPeriodo !== "function") return;
  VAP.caricando = true;
  const oggi = vapOggi(), da = isoLocale(new Date(Date.now() - 60 * 864e5));
  DB.listInterventiPeriodo(da, oggi).then(l => { VAP.passate = (l || []).filter(vaaAperto); VAP.caricando = false;
    if(VAP.passate.length && document.getElementById("vh") && typeof renderHomeVet === "function") renderHomeVet(); })
    .catch(() => { VAP.caricando = false; VAP.passate = []; });
}
function vaaDaCompletare(eventi){
  const oggi = vapOggi();
  let rim = []; try{ rim = JSON.parse(localStorage.getItem(VAA_RIMANDATE) || "[]"); }catch(_){}
  vaaCaricaPassate();
  const tutte = [...(VAP.passate || []), ...(eventi || [])].filter((e, i, a) => a.findIndex(x => x.id === e.id) === i);
  return tutte.filter(e => vaaAperto(e) && e.data_intervento && (e.data_intervento < oggi || (e.data_intervento === oggi && rim.includes(e.id))));
}
function vaaBannerHtml(eventi){
  const l = vaaDaCompletare(eventi); if(!l.length) return "";
  const e = l[0], nome = vapNomeCliente(e.cliente_mascalcia_id) || e.clienti_mascalcia?.nome || "Cliente";
  return `<button class="vaa-banner" onclick="vaaCompleta('${e.id}')"><b>${l.length === 1 ? "1 lavoro da completare" : l.length + " lavori da completare"}</b>
    <span>${vaaEsc(nome)} · ${vaaEsc(vapNomeLavoro(e))}: segna chi era il cavallo, così il conto e i libretti sono giusti. <u>Completa</u></span></button>`;
}
function vaaCompleta(id){
  const hp = typeof hpAppuntamenti !== "undefined" ? hpAppuntamenti || [] : [];
  const e = [...(VAP.passate || []), ...hp, ...(DEMO_MODE ? demoState.interventiMascalcia || [] : [])].find(x => x.id === id);
  if(e) vaaFatto(e);
}

export { VAA, VAP, VAP_DECIDERE, vapScelta, vapVia, vapDopoApertura, vapApriAperto, vapCercaDove, vapCambiaDove, vapDove, vapDoveNuovo, vapQuando, vapQuanti, vapTipoSlot, vapCrea, vapPrevedi,
  vaaEtichetta, vaaAperto, vapNomeLavoro, vaaFatto, vapNome, vapScegliCavallo, vapTogliCavallo, vapChip, vapTipo, vaaVacc, vaaRichiamo, vaaDopo, vaaSalva, vapAggiungiLavoro, vapTogliAggiunto,
  vapDocumenti, vapApriScheda, vapAltroDopoChiusa, vapInvia, vapCondividi, vaaDaCompletare, vaaBannerHtml, vaaCompleta };
