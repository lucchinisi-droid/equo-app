// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { clientiAttivi, loadClientiMascalcia } from "./032-richiamo-prossimo-intervento-sempre-in-g.js";
import { renderClientiList } from "./033-clienti-a-cartelle-stile-telegram-cavall.js";
import { loadClienteInterventi } from "./037-scheda-cliente-a-box-scheda-del-cavallo.js";
import { isoLocale } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { clienteCollegatoEquo } from "./052-ferro-standard-nella-scheda-del-cavallo.js";
import { AG_MESI, renderAgendaSettimana } from "./053-agenda-settimanale-maniscalco.js";
import { formatDataBreve } from "./054-richieste-di-appuntamento-step-5d.js";
import { caricaCavalliMiei } from "./086-indice-dei-cavalli-dei-clienti-professio.js";
import { wgMostraMappe, wgNaviga } from "./100-naviga.js";
/* ---------- SPOSTA CAVALLO: dove sta il cavallo (a casa / in una scuderia) ----------
   Chi paga non cambia: cambia solo il luogo. Lo spostamento è uno per tutto l'ecosistema
   (RPC equo_sposta_cavallo) e resta nello storico. L'agenda del maniscalco raggruppa per luogo. */
/* -> stato-condiviso.js */
function ubicDi(r, clienteId){
  const o = { cliente_mascalcia_id: (r && r.cliente_mascalcia_id) || clienteId || null };
  UBIC_CAMPI.forEach(k => { o[k] = r ? r[k] ?? null : null; });
  return o;
}
/* -> stato-condiviso.js */
async function caricaUbicazioni(forza){
  if(!forza && cavalliMieiCache && Date.now() - cavalliMieiTs < 60000) return cavalliMieiCache;
  try { cavalliMieiCache = await DB.listCavalliMiei(); } catch(e){ cavalliMieiCache = cavalliMieiCache || []; }
  cavalliMieiTs = Date.now(); cavalliMieiById = {}; cavalliMieiByHorse = {};
  (cavalliMieiCache || []).forEach(c => { cavalliMieiById[c.id] = c; if(c.horse_id && !cavalliMieiByHorse[c.horse_id]) cavalliMieiByHorse[c.horse_id] = c; });
  return cavalliMieiCache;
}
function clienteDiId(id){ return (clientiMascalcia || []).find(x => x.id === id) || null; }
function eLuogoScuderia(c){ return !!(c && (c.tipo_cliente === "struttura" || c.centro_id)); }
function nomeLuogoCliente(c){ return c ? (eLuogoScuderia(c) ? c.nome : "A casa · " + c.nome) : "Cliente"; }
// luogo attuale di una riga cavallo del maniscalco → { key, nome, indirizzo, clienteId, scuderia, casa, dal }
function luogoDi(r){
  const cli = clienteDiId(r?.cliente_mascalcia_id);
  const dal = r?.ubicazione_dal || null;
  if(r?.ubicazione_tipo === "scuderia"){
    const u = clienteDiId(r.ubicazione_cliente_id);
    return { key: r.ubicazione_cliente_id ? "c:" + r.ubicazione_cliente_id : "n:" + (r.ubicazione_nome || ""), nome: u?.nome || r.ubicazione_nome || "Scuderia",
      indirizzo: u?.indirizzo || null, clienteId: r.ubicazione_cliente_id || null, scuderia: true, casa: false, dal };
  }
  if(r?.ubicazione_tipo === "casa"){
    const struttura = eLuogoScuderia(cli);
    return { key: "casa:" + r.cliente_mascalcia_id + ":" + (r.ubicazione_indirizzo || ""), nome: "A casa · " + (r.ubicazione_nome || (struttura ? "privato" : cli?.nome || "")),
      indirizzo: r.ubicazione_indirizzo || (struttura ? null : cli?.indirizzo || null), clienteId: struttura ? null : r.cliente_mascalcia_id, scuderia: false, casa: true, dal };
  }
  return { key: "c:" + (r?.cliente_mascalcia_id || ""), nome: nomeLuogoCliente(cli), indirizzo: cli?.indirizzo || null, clienteId: cli?.id || null,
    scuderia: eLuogoScuderia(cli), casa: !eLuogoScuderia(cli), dal };
}
// luogo di un appuntamento: i lavori fatti ricordano dove sono stati fatti, gli altri seguono il cavallo
function luogoEvento(e, attuale){
  if(!attuale && e.stato === "fatto" && e.luogo_nome){
    const lc = e.luogo_cliente_id ? clienteDiId(e.luogo_cliente_id) : null;
    if(lc) return { key: "c:" + lc.id, nome: nomeLuogoCliente(lc), indirizzo: lc.indirizzo || null, clienteId: lc.id, scuderia: eLuogoScuderia(lc) };
    if(/^A casa/.test(e.luogo_nome)) return luogoDi({ cliente_mascalcia_id: e.cliente_mascalcia_id });
    return { key: "n:" + e.luogo_nome, nome: e.luogo_nome, indirizzo: null, clienteId: null, scuderia: true };
  }
  const riga = (e.cavallo_cliente_id && cavalliMieiById[e.cavallo_cliente_id]) || (e.horse_id && cavalliMieiByHorse[e.horse_id]) || null;
  return luogoDi(riga ? { ...ubicDi(riga), cliente_mascalcia_id: riga.ubicazione_tipo ? riga.cliente_mascalcia_id : e.cliente_mascalcia_id } : { cliente_mascalcia_id: e.cliente_mascalcia_id });
}
function navigaLuogo(l){
  if(!l) return;
  if(l.indirizzo) return wgMostraMappe({ nome: l.nome }, l.indirizzo);
  if(l.clienteId) return wgNaviga(l.clienteId);
  wgMostraMappe({ nome: l.nome }, l.nome, "Indirizzo non indicato: ricerca per nome, controlla nelle mappe che sia il posto giusto.");
}
async function wgNavigaEvento(id){
  const e = agEventiCache[id] || (typeof hpAppuntamenti !== "undefined" ? hpAppuntamenti : []).find(x => x.id === id);
  if(!e) return;
  await caricaUbicazioni();
  navigaLuogo(luogoEvento(e, true));
}

// riquadro «Dove sta» nella scheda cavallo del maniscalco
function doveStaHtml(l, azione){
  const sotto = [l.indirizzo, l.dal ? "dal " + formatDataBreve(l.dal) : ""].filter(Boolean).join(" · ");
  return `<div class="dove-sta"><span class="ic">${l.scuderia ? "🐴" : "🏠"}</span>
    <div class="c"><b>${escapeHtml(l.nome)}</b>${sotto ? `<span>${escapeHtml(sotto)}</span>` : ""}</div>${azione || ""}</div>`;
}
function renderDoveCavalloPro(cv){
  const box = document.getElementById("cavpro-dove");
  if(!box) return;
  box.innerHTML = doveStaHtml(luogoDi(cv.ub || { cliente_mascalcia_id: currentClienteId }), `<button class="btn btn-primary btn-sm" onclick="apriSpostaCavalloPro()">Sposta</button>`);
}

// ---------- finestra «Sposta» (maniscalco e proprietario) ----------
let spCtx = null, spCercaT = null;
function spOverlay(){
  let ov = document.getElementById("modal-sposta");
  if(!ov){
    ov = document.createElement("div"); ov.className = "modal-overlay"; ov.id = "modal-sposta";
    ov.addEventListener("click", ev => { if(ev.target === ov) closeModal("modal-sposta"); });
    document.body.appendChild(ov);
  }
  return ov;
}
async function apriSpostaCavalloPro(){
  const cv = schedaCavalli.find(c => c.key === schedaCavalloKey);
  if(!cv) return;
  let id = cv.id;
  if(!id){ ({ cavallo_cliente_id: id } = await DB.risolviCavalloPerIntervento(currentClienteId, cv)); if(id) cv.id = id; }
  if(!id){ showToast("Non riuscito, riprova."); return; }
  await caricaUbicazioni();
  const ub = cv.ub || { cliente_mascalcia_id: currentClienteId };
  const att = luogoDi(ub), pagante = clienteDiId(ub.cliente_mascalcia_id || currentClienteId);
  const scuderie = clientiAttivi().filter(c => eLuogoScuderia(c)).sort((a, b) => a.nome.localeCompare(b.nome, "it"))
    .map(c => ({ v: "cli:" + c.id, nome: c.nome, sotto: [c.indirizzo, (() => { const n = (cavalliMieiCache || []).filter(x => x.cliente_mascalcia_id === c.id || x.ubicazione_cliente_id === c.id).length; return n ? n + (n === 1 ? " cavallo che segui" : " cavalli che segui") : ""; })()].filter(Boolean).join(" · "),
      equo: !!(c.centro_id && c.collegamento_stato === "attivo"), attuale: att.key === "c:" + c.id }));
  spCtx = { vista: "maniscalco", id, nome: cv.nome, att, pagante, scuderie, casaInd: eLuogoScuderia(pagante) ? "" : (pagante?.indirizzo || ""),
    collegato: clienteCollegatoEquo(pagante?.id) };
  spDisegna();
}
async function apriSpostaCavalloProprietario(){
  const h = (horses || []).find(x => x.id === currentHorseId);
  if(!h) return;
  let mie = [];
  if(!DEMO_MODE){ try { const r = await sb.rpc("prop_indirizzi_scuderie"); mie = r.data || []; } catch(e){} }
  else mie = (demoState.stables || []).map(s => ({ id: s.id, nome: s.name, citta: "" }));
  spCtx = { vista: "proprietario", id: h.id, nome: h.name, att: { nome: luogoProprietario(h).nome, key: h.ubicazione_centro_id ? "centro:" + h.ubicazione_centro_id : "" },
    scuderie: mie.map(c => ({ v: "centro:" + c.id, nome: c.nome, sotto: [c.indirizzo, c.citta].filter(Boolean).join(", "), equo: true, attuale: h.ubicazione_centro_id === c.id })),
    casaInd: h.ubicazione_tipo === "casa" ? (h.ubicazione_indirizzo || "") : "" };
  spDisegna();
}
function spDisegna(){
  const c = spCtx, pro = c.vista === "maniscalco";
  const ov = spOverlay();
  ov.innerHTML = `<div class="modal sp-modal"><div class="modal-handle"></div>
    <div class="modal-title" style="margin-bottom:2px">Dove va ${escapeHtml(c.nome)}?</div>
    <div class="muted" style="font-size:12.5px;margin-bottom:12px">Adesso: ${escapeHtml(c.att.nome || "non indicato")}</div>
    <label class="sp-o"><input type="radio" name="sp-dest" value="casa" onchange="spAggiorna()"><span class="c"><b>🏠 A casa / privato</b><span>${pro ? `Indirizzo di ${escapeHtml(c.pagante?.nome || "proprietario")} o un altro` : "Il tuo indirizzo o un altro"}</span></span></label>
    <div class="sp-extra" id="sp-casa-extra" hidden><input class="input" id="sp-casa-ind" maxlength="160" placeholder="Indirizzo (facoltativo)" value="${escapeHtml(c.casaInd || "")}"></div>
    <div class="sp-sez">${pro ? "Le tue scuderie" : "Scuderie su Equo"}</div>
    <input class="input" id="sp-cerca" placeholder="${pro ? "Cerca scuderia, maneggio, centro ippico…" : "Cerca per nome o città…"}" oninput="spCerca()" autocomplete="off" style="margin-bottom:6px">
    <div id="sp-lista" class="sp-lista"></div>
    <label class="sp-o"><input type="radio" name="sp-dest" value="nuova" onchange="spAggiorna()"><span class="c"><b>${pro ? "+ Nuova scuderia" : "Altra scuderia"}</b><span>${pro ? "Nome e indirizzo, la crei adesso" : "Non è su Equo: scrivi nome e indirizzo"}</span></span></label>
    <div class="sp-extra" id="sp-nuova-extra" hidden>
      <input class="input" id="sp-nuova-nome" maxlength="80" placeholder="Nome (es. Maneggio Il Poggio)" style="margin-bottom:6px">
      <input class="input" id="sp-nuova-ind" maxlength="160" placeholder="Indirizzo (facoltativo)"></div>
    <label class="sp-dal">Dal giorno <input type="date" class="input" id="sp-dal" value="${isoLocale(new Date())}"></label>
    <div class="sp-info" id="sp-info" hidden></div>
    <div class="auth-error" id="sp-err" style="display:none"></div>
    <button class="btn btn-primary" id="sp-ok" style="width:100%;margin-top:12px" onclick="confermaSposta(this)">Sposta ${escapeHtml(c.nome)}</button>
    <button class="btn btn-outline" style="width:100%;margin-top:8px" onclick="closeModal('modal-sposta')">Annulla</button></div>`;
  spLista(c.scuderie);
  openModal("modal-sposta");
}
function spLista(lista){
  const box = document.getElementById("sp-lista");
  if(!box) return;
  const scelto = document.querySelector('input[name="sp-dest"]:checked')?.value;
  box.innerHTML = lista.length ? lista.map(s => `<label class="sp-o${s.attuale ? " attuale" : ""}"><input type="radio" name="sp-dest" value="${s.v}"${scelto === s.v ? " checked" : ""}${s.attuale ? " disabled" : ""} onchange="spAggiorna()">
      <span class="c"><b>${escapeHtml(s.nome)}</b><span>${s.attuale ? "è qui adesso" : escapeHtml(s.sotto || "")}</span></span>${s.equo ? `<span class="sp-pill">${spCtx.vista === "maniscalco" ? "Equo Scuderia" : "Equo"}</span>` : ""}</label>`).join("")
    : `<div class="muted" style="font-size:12.5px;padding:4px 2px 8px">${spCtx.vista === "maniscalco" ? "Nessuna scuderia con questo nome: usa «+ Nuova scuderia»." : "Scrivi almeno 2 lettere per cercare, oppure usa «Altra scuderia»."}</div>`;
}
function spCerca(){
  const q = document.getElementById("sp-cerca").value.trim();
  if(spCtx.vista === "maniscalco"){
    const n = s => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    spLista(spCtx.scuderie.filter(s => !q || n(s.nome + " " + s.sotto).includes(n(q))));
    return;
  }
  clearTimeout(spCercaT);
  if(q.length < 2){ spLista(spCtx.scuderie); return; }
  spCercaT = setTimeout(async () => {
    const r = await DB.cercaCentri(q);
    if(document.getElementById("sp-cerca")?.value.trim() !== q) return;
    spLista(r.map(c => ({ v: "centro:" + c.id, nome: c.nome, sotto: [c.citta, c.provincia ? "(" + c.provincia + ")" : ""].filter(Boolean).join(" "), equo: true, attuale: spCtx.att.key === "centro:" + c.id })));
  }, 300);
}
function spScelta(){
  const v = document.querySelector('input[name="sp-dest"]:checked')?.value || "";
  const s = [...(spCtx.scuderie || [])].find(x => x.v === v) || null;
  const nome = v === "casa" ? "A casa" : v === "nuova" ? (document.getElementById("sp-nuova-nome")?.value.trim() || "la nuova scuderia")
    : (s?.nome || document.querySelector(`input[name="sp-dest"][value="${v}"]`)?.closest(".sp-o")?.querySelector("b")?.textContent || "");
  return { v, nome, equo: !!(document.querySelector(`input[name="sp-dest"][value="${v}"]`)?.closest(".sp-o")?.querySelector(".sp-pill")) };
}
function spAggiorna(){
  const sc = spScelta(), c = spCtx;
  document.getElementById("sp-casa-extra").hidden = sc.v !== "casa";
  document.getElementById("sp-nuova-extra").hidden = sc.v !== "nuova";
  if(sc.v === "nuova") setTimeout(() => document.getElementById("sp-nuova-nome")?.focus(), 50);
  document.querySelectorAll("#modal-sposta .sp-o").forEach(l => l.classList.toggle("on", !!l.querySelector("input:checked")));
  const info = document.getElementById("sp-info");
  if(!sc.v){ info.hidden = true; return; }
  const righe = c.vista === "maniscalco" ? [
    `Resta cliente <b>${escapeHtml(c.pagante?.nome || "lo stesso")}</b>: incassi e chat non cambiano.`,
    `I prossimi appuntamenti di ${escapeHtml(c.nome)} passano sotto <b>${escapeHtml(sc.v === "casa" ? "A casa" : sc.nome)}</b> in agenda.`,
    c.collegato ? `${escapeHtml(c.pagante.nome)} riceve un messaggio e lo vede nel libretto.` : "",
    sc.equo ? `${escapeHtml(sc.nome)} usa Equo Scuderia: riceve la richiesta di accogliere ${escapeHtml(c.nome)}.` : ""
  ] : [
    `I maniscalchi che seguono ${escapeHtml(c.nome)} lo vedono subito e ricevono un messaggio.`,
    sc.equo ? `${escapeHtml(sc.nome)} riceve la richiesta di accogliere ${escapeHtml(c.nome)}.` : "",
    "Resta nel libretto del cavallo."
  ];
  info.innerHTML = righe.filter(Boolean).map(t => "✓ " + t).join("<br>");
  info.hidden = false;
}
async function confermaSposta(btn){
  const sc = spScelta(), c = spCtx;
  const err = document.getElementById("sp-err");
  const errore = m => { err.textContent = m; err.style.display = "block"; };
  err.style.display = "none";
  if(!sc.v) return errore("Scegli dove va " + c.nome + ".");
  const p = { vista: c.vista, id: c.id, dest: sc.v === "casa" ? "casa" : sc.v === "nuova" ? "nuova" : "scuderia", dal: document.getElementById("sp-dal").value || null };
  if(sc.v === "casa") p.indirizzo = document.getElementById("sp-casa-ind").value.trim() || null;
  if(sc.v === "nuova"){
    p.nome = document.getElementById("sp-nuova-nome").value.trim();
    p.indirizzo = document.getElementById("sp-nuova-ind").value.trim() || null;
    if(!p.nome) return errore("Scrivi il nome della scuderia.");
  }
  if(sc.v.startsWith("cli:")) p.cliente = sc.v.slice(4);
  if(sc.v.startsWith("centro:")) p.centro = sc.v.slice(7);
  btn.disabled = true;
  const r = await DB.spostaCavallo(p);
  btn.disabled = false;
  if(!r || !r.ok) return errore((r && r.errore) || "Non riuscito, riprova.");
  closeModal("modal-sposta");
  const trovalo = c.vista === "maniscalco" && r.luogo !== "A casa" ? ` · lo trovi anche nella scheda di ${r.luogo}, sotto «Qui stanno»` : "";
  showToast(`${c.nome}: ${r.luogo === "A casa" ? "a casa" : "ora sta a " + r.luogo}${r.arrivo ? " · la scuderia riceve la richiesta" : ""}${trovalo}`);
  if(c.vista === "maniscalco"){
    if(r.scuderia_cliente_id && !clienteDiId(r.scuderia_cliente_id)) await loadClientiMascalcia();
    await caricaUbicazioni(true);
    await caricaCavalliMiei();
    if(typeof renderClientiList === "function") renderClientiList();
    if(currentClienteId) await loadClienteInterventi(currentClienteId);
    if(typeof renderAgendaSettimana === "function") renderAgendaSettimana();
  } else {
    await loadHorses();
    if(currentHorseId) await openHorseDetail(currentHorseId);
  }
}

// ---------- proprietario: riquadro «Dove sta» ----------
function luogoProprietario(h){
  if(h?.ubicazione_tipo === "scuderia") return { nome: h.ubicazione_nome || "Scuderia", scuderia: true, indirizzo: h.ubicazione_indirizzo, dal: h.ubicazione_dal };
  if(h?.ubicazione_tipo === "casa") return { nome: "A casa", scuderia: false, indirizzo: h.ubicazione_indirizzo, dal: h.ubicazione_dal };
  return { nome: "Non indicato", scuderia: false, indirizzo: null, dal: null, vuoto: true };
}
async function renderDoveStaProprietario(h){
  const box = document.getElementById("horse-dove");
  if(!box) return;
  const l = luogoProprietario(h);
  box.innerHTML = doveStaHtml({ ...l, nome: l.vuoto ? "Dove sta? Non ancora indicato" : (l.scuderia ? "Sta a: " + l.nome : l.nome) },
    `<button class="btn btn-primary btn-sm" onclick="apriSpostaCavalloProprietario()">${l.vuoto ? "Indica" : "Sposta"}</button>`);
  const arr = await DB.arriviCavallo(h.id);
  if(currentHorseId !== h.id) return;
  if(arr.some(a => a.stato === "in_attesa")) box.insertAdjacentHTML("beforeend", `<div class="dove-attesa">⏳ In attesa che ${escapeHtml(l.nome)} confermi l'arrivo.</div>`);
  else if(arr[0] && arr[0].stato === "rifiutato" && Date.now() - new Date(arr[0].risposto_il || 0).getTime() < 7 * 864e5)
    box.insertAdjacentHTML("beforeend", `<div class="dove-attesa no">⚠️ La scuderia ha risposto che ${escapeHtml(h.name)} non è da loro: è tornato dov'era.</div>`);
}
function spostamentoHtml(s){
  const d = new Date(s.creato);
  const ic = { spostamento: "📍", uscita: "↗️", arrivo: "✅", arrivo_rifiutato: "⚠️" }[s.tipo] || "📍";
  return `<div class="sposta-voce"><span class="data"><b>${d.getDate()}</b>${AG_MESI[d.getMonth()]} ${d.getFullYear()}</span><span class="t">${ic} ${escapeHtml(s.descrizione)}</span></div>`;
}


export { apriSpostaCavalloPro, apriSpostaCavalloProprietario, caricaUbicazioni, clienteDiId, confermaSposta, eLuogoScuderia, luogoDi, luogoEvento, luogoProprietario, navigaLuogo, renderDoveCavalloPro, renderDoveStaProprietario, spAggiorna, spCerca, spostamentoHtml, ubicDi, wgNavigaEvento };
