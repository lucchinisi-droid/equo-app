// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { aggiungiGiorniIso, isoLocale } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { chiediSiNo } from "./052-ferro-standard-nella-scheda-del-cavallo.js";
import { formatDataBreve } from "./054-richieste-di-appuntamento-step-5d.js";
import { renderIncassi } from "./047-incassi-saldati-per-periodo-da-saldare-p.js";
import { ContoDB, contoCodice } from "./057-pdf-appuntamento-invio-in-chat-maniscalc.js";
import { caricaContiCliente } from "./058-scheda-cliente-pulsante-elenco-dei-conti.js";
import { loadClienteInterventi } from "./037-scheda-cliente-a-box-scheda-del-cavallo.js";
/* ---------- PAGAMENTI IN PIÙ VOLTE: ACCONTI E RATE (27/10/2026) ----------
   Ogni pagamento ricevuto è una riga di incassi_tranche (importo, giorno, modalità, nota), su un lavoro o su un conto
   (sul conto si divide da solo sui lavori, dal più vecchio). Lo stato si calcola: Da saldare → Acconto → Saldato.
   Rate facoltative in incassi_rate: solo promemoria, non vincolanti. Il vecchio tasto «Saldato» resta: chiude il lavoro
   e il resto conta come incassato quel giorno. Scritture solo tramite le funzioni del database (schema-pagamenti-a-rate.sql). */
const PAG_MODI = [["contanti", "Contanti"], ["bonifico", "Bonifico"], ["pos", "POS"], ["assegno", "Assegno"], ["altro", "Altro"]];
let pagTranche = [], pagRate = [];
let pag = null;   // stato della finestra «Registra pagamento»

const r2 = n => Math.round((Number(n) || 0) * 100) / 100;
const pagEuro = n => (Number(n) || 0).toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: r2(n) % 1 ? 2 : 0 });
const oggiIso = () => isoLocale(new Date());
const nomeModo = k => (PAG_MODI.find(m => m[0] === k) || [k, k])[1];

async function pagCarica(){
  if(DEMO_MODE){ demoState.tranche = demoState.tranche || []; demoState.rate = demoState.rate || []; pagTranche = demoState.tranche; pagRate = demoState.rate; return; }
  if(!currentUser) return;
  const [t, r] = await Promise.all([
    sb.from("incassi_tranche").select("*").eq("professionista_id", currentUser.id).order("pagato_il", { ascending: true }).limit(5000),
    sb.from("incassi_rate").select("*").eq("professionista_id", currentUser.id).order("n", { ascending: true }).limit(2000)
  ]);
  if(t.error && !/does not exist|schema cache/i.test(t.error.message || "")) console.warn("incassi_tranche:", t.error.message);
  pagTranche = t.error ? [] : (t.data || []);
  pagRate = r.error ? [] : (r.data || []);
}
function pagTrancheDi(interventoId){ return pagTranche.filter(t => t.intervento_id === interventoId); }
function pagPagato(interventoId){ return r2(pagTrancheDi(interventoId).reduce((s, t) => s + Number(t.importo), 0)); }
function pagResiduo(i){ return Math.max(0, r2((Number(i?.importo) || 0) - pagPagato(i?.id))); }
function pagPagatoConto(contoId){ return r2(pagTranche.filter(t => t.conto_id === contoId).reduce((s, t) => s + Number(t.importo), 0)); }
function pagRateDi(interventoId, contoId){ return pagRate.filter(r => interventoId ? r.intervento_id === interventoId : r.conto_id === contoId).sort((a, b) => a.n - b.n); }
// quante rate sono coperte da quanto pagato, e la prossima (con quanto manca davvero)
function pagPiano(rate, pagato){
  if(!rate || !rate.length) return null;
  let cum = 0, pagate = 0, prossima = null;
  for(const r of rate){
    cum = r2(cum + Number(r.importo));
    if(cum <= pagato + 0.005) pagate++;
    else if(!prossima) prossima = { n: r.n, importo: r2(cum - pagato), scadenza: r.scadenza };
  }
  return { rate: rate.length, pagate, prossima };
}
function pagPianoIntervento(i){ return pagPiano(pagRateDi(i.id), pagPagato(i.id)); }
function pagPianoConto(c){ return pagPiano(pagRateDi(null, c.id), pagPagatoConto(c.id)); }

// Incassi: ogni pagamento conta nel giorno in cui arriva; il lavoro chiuso con «Saldato» aggiunge il resto quel giorno
function pagVociIncasso(lista){
  const perInt = new Map();
  pagTranche.forEach(t => { if(!perInt.has(t.intervento_id)) perInt.set(t.intervento_id, []); perInt.get(t.intervento_id).push(t); });
  const out = [];
  (lista || []).forEach(i => {
    const tr = perInt.get(i.id) || [];
    tr.forEach(t => out.push({ ...i, importo: Number(t.importo), _giorno: t.pagato_il, _tranche: t }));
    if(i.stato === "fatto" && i.stato_pagamento === "saldato"){
      if(!tr.length) out.push(i);
      else { const resto = r2((Number(i.importo) || 0) - tr.reduce((s, t) => s + Number(t.importo), 0)); if(resto > 0.005) out.push({ ...i, importo: resto, _resto: true }); }
    }
  });
  return out;
}

// riga sotto un lavoro (Incassi → Da incassare): acconto, barra, rata in arrivo o scaduta, storico
function pagHtmlLavoro(i){
  const pagato = pagPagato(i.id), tot = Number(i.importo) || 0, piano = pagPianoIntervento(i);
  let h = `<button type="button" class="pag-link" onclick="pagApri('${i.id}')">${pagato > 0 || piano ? "Pagamenti e rate" : "Acconto o rate"} ›</button>`;
  if(pagato > 0 && tot > 0) h += `<span class="pag-barra" role="progressbar" aria-valuemin="0" aria-valuemax="${tot}" aria-valuenow="${pagato}"><i style="width:${Math.min(100, pagato / tot * 100).toFixed(1)}%"></i></span>
    <span class="pag-nota">Acconto: pagati ${pagEuro(pagato)} di ${pagEuro(tot)}${piano ? ` · ${piano.pagate} ${piano.pagate === 1 ? "rata" : "rate"} su ${piano.rate}` : ""}</span>`;
  else if(piano) h += `<span class="pag-nota">${piano.rate} rate · nessuna ancora pagata</span>`;
  if(piano?.prossima) h += pagHtmlProssima(piano.prossima, `'${i.id}', null`);
  return h;
}
function pagHtmlProssima(p, args){
  const oggi = oggiIso();
  if(p.scadenza < oggi){
    const gg = Math.round((new Date(oggi + "T12:00") - new Date(p.scadenza + "T12:00")) / 86400000);
    return `<span class="pag-scaduta"><span>Rata ${p.n} scaduta da ${gg} ${gg === 1 ? "giorno" : "giorni"} · ${pagEuro(p.importo)}</span><button type="button" onclick="pagSollecita(${args}, this)">Promemoria</button></span>`;
  }
  return `<span class="pag-nota">Prossima rata: ${pagEuro(p.importo)} entro il ${formatDataBreve(p.scadenza)}</span>`;
}
// conti aperti: quanto pagato e prossima rata
function pagHtmlConto(c){
  const pagato = pagPagatoConto(c.id), piano = pagPianoConto(c);
  if(!(pagato > 0) && !piano) return "";
  const tot = Number(c.totale) || 0;
  return `<small class="pag-conto">${pagato > 0 ? `Pagati ${pagEuro(pagato)} di ${pagEuro(tot)}` : ""}${pagato > 0 && piano ? " · " : ""}${piano ? `${piano.pagate} rate su ${piano.rate}${piano.prossima ? " · prossima " + formatDataBreve(piano.prossima.scadenza) : ""}` : ""}</small>`;
}

/* ---- finestra «Registra pagamento» ---- */
async function pagApri(interventoId, contoId){
  await pagCarica();
  let t;
  if(contoId){
    const c = await ContoDB.completo(contoId);
    if(!c){ showToast("Conto non trovato"); return; }
    const pagato = pagPagatoConto(c.id);
    t = { tipo: "conto", id: c.id, titolo: "Conto " + contoCodice(c), sotto: (clientiMascalcia.find(x => x.id === c.cliente_mascalcia_id)?.nome || "") + " · " + c.n_lavori + (c.n_lavori === 1 ? " lavoro" : " lavori"),
      totale: Number(c.totale) || 0, pagato, residuo: Math.max(0, r2((Number(c.totale) || 0) - pagato)), aperto: c.stato === "da_incassare",
      storico: pagStorico(pagTranche.filter(x => x.conto_id === c.id)), rate: pagRateDi(null, c.id) };
  } else {
    const i = (incTutti || []).find(x => x.id === interventoId) || (await pagLeggiIntervento(interventoId));
    if(!i){ showToast("Lavoro non trovato"); return; }
    if(!(Number(i.importo) > 0)){ showToast("Scrivi prima l'importo del lavoro"); return; }
    const pagato = pagPagato(i.id);
    t = { tipo: "lavoro", id: i.id, titolo: [i.cavalli_clienti_mascalcia?.nome, TIPO_FERRATURA_LABELS[i.tipo_ferratura] || i.tipo_ferratura].filter(Boolean).join(" · ") || "Lavoro",
      sotto: (i.clienti_mascalcia?.nome || clientiMascalcia.find(x => x.id === i.cliente_mascalcia_id)?.nome || "") + " · " + formatDataBreve(i.data_intervento),
      totale: Number(i.importo), pagato, residuo: pagResiduo(i), aperto: i.stato_pagamento !== "saldato",
      storico: pagStorico(pagTrancheDi(i.id)), rate: pagRateDi(i.id) };
  }
  const piano = pagPiano(t.rate, t.pagato);
  pag = { t, importo: piano?.prossima ? Math.min(piano.prossima.importo, t.residuo) : t.residuo, data: oggiIso(), modo: "contanti", nota: "", rateAperte: false, nRate: 2, righe: null };
  pagRender();
  openModal("modal-pagamento");
}
async function pagLeggiIntervento(id){
  if(DEMO_MODE) return (demoState.interventiMascalcia || []).find(x => x.id === id) || null;
  const { data } = await sb.from("interventi_mascalcia").select("*, clienti_mascalcia(nome), cavalli_clienti_mascalcia(nome)").eq("id", id).maybeSingle();
  return data || null;
}
// un pagamento sul conto è diviso tra più lavori: nello storico si vede una riga sola per gruppo
function pagStorico(lista){
  const g = new Map();
  lista.forEach(x => { const k = x.gruppo || x.id; if(!g.has(k)) g.set(k, { gruppo: k, importo: 0, pagato_il: x.pagato_il, modo: x.modo, nota: x.nota }); g.get(k).importo = r2(g.get(k).importo + Number(x.importo)); });
  return [...g.values()].sort((a, b) => a.pagato_il.localeCompare(b.pagato_il));
}
function pagDividi(totale, n, primaData){
  const base = Math.floor(totale / n * 100) / 100, righe = [];
  for(let k = 0; k < n; k++) righe.push({ importo: k === n - 1 ? r2(totale - base * (n - 1)) : base, scadenza: pagMesiDopo(primaData, k) });
  return righe;
}
function pagMesiDopo(iso, n){ const d = new Date(iso + "T12:00"); const g = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); d.setDate(Math.min(g, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); return isoLocale(d); }
function pagRestoDopo(){ return Math.max(0, r2(pag.t.residuo - (Number(pag.importo) || 0))); }

function pagRender(){
  const t = pag.t, el = document.getElementById("pag-corpo");
  document.getElementById("pag-titolo").textContent = t.titolo;
  const piano = pagPiano(t.rate, t.pagato);
  const chip = (on, onclick, testo) => `<button type="button" class="pag-chip${on ? " on" : ""}" onclick="${onclick}">${testo}</button>`;
  let h = `<div class="pag-testa"><span>${escapeHtml(t.sotto)}</span><b>Totale ${pagEuro(t.totale)}</b></div>`;
  if(t.pagato > 0) h += `<div class="pag-testa"><span>Già pagati ${pagEuro(t.pagato)}</span><b>Restano ${pagEuro(t.residuo)}</b></div>
    <span class="pag-barra"><i style="width:${Math.min(100, t.pagato / (t.totale || 1) * 100).toFixed(1)}%"></i></span>`;
  if(t.aperto && t.residuo > 0){
    h += `<div class="input-group"><label class="input-label" for="pag-importo">Importo ricevuto</label>
        <input class="input pag-imp" id="pag-importo" type="number" inputmode="decimal" min="0" step="0.01" value="${pag.importo}" oninput="pagImporto(this.value)">
        <div class="pag-chips">${chip(false, `pagImporto(${t.residuo}, true)`, "Tutto · " + pagEuro(t.residuo))}${piano?.prossima && piano.prossima.importo < t.residuo ? chip(false, `pagImporto(${piano.prossima.importo}, true)`, `Rata ${piano.prossima.n} · ${pagEuro(piano.prossima.importo)}`) : ""}${chip(false, `pagImporto(${r2(t.residuo / 2)}, true)`, "Metà")}</div></div>
      <div class="input-row-2">
        <div class="input-group"><label class="input-label" for="pag-data">Giorno del pagamento</label><input class="input" id="pag-data" type="date" value="${pag.data}" max="${oggiIso()}" onchange="pagSet('data',this.value)"></div>
        <div class="input-group"><label class="input-label" for="pag-nota">Nota</label><input class="input" id="pag-nota" maxlength="200" placeholder="facoltativa" value="${escapeHtml(pag.nota)}" oninput="pagSet('nota',this.value)"></div>
      </div>
      <div class="input-group"><span class="input-label">Modalità</span><div class="pag-chips">${PAG_MODI.map(([k, n]) => chip(pag.modo === k, `pagSet('modo','${k}',true)`, n)).join("")}</div></div>`;
    // rate
    h += `<div class="pag-blocco"><div class="pag-blocco-t"><b>Rate</b><span>facoltative, non vincolanti</span></div>`;
    if(!pag.rateAperte){
      h += piano ? `<div class="pag-rate">${t.rate.map((r, k) => `<div class="${k < piano.pagate ? "ok" : ""}"><span>${k < piano.pagate ? "✓ " : ""}Rata ${r.n} · ${formatDataBreve(r.scadenza)}</span><b>${pagEuro(r.importo)}</b></div>`).join("")}</div>
          <div class="pag-azioni-l"><button type="button" class="pag-link" onclick="pagApriRate()">Cambia le rate</button><button type="button" class="pag-link" onclick="pagTogliRate()">Togli le rate</button></div>`
        : `<p class="pag-p">Puoi dividere quello che resta in più rate con le loro scadenze: le vedi in Incassi e ricevi l'avviso se una scade.</p>
          <button type="button" class="btn btn-outline btn-sm" onclick="pagApriRate()">Dividi in rate</button>`;
    } else {
      const resto = pagRestoDopo(), somma = r2(pag.righe.reduce((s, r) => s + (Number(r.importo) || 0), 0));
      const giaDopo = r2(t.pagato + (Number(pag.importo) || 0));
      h += `<p class="pag-p">${giaDopo > 0 ? `Quello già pagato (${pagEuro(giaDopo)}${Number(pag.importo) > 0 ? ", compreso questo pagamento" : ""}) conta come prima rata. ` : ""}Dividi i <b>${pagEuro(resto)}</b> che restano:</p>
        <div class="input-group"><label class="input-label" for="pag-n">Numero di rate</label><select class="input" id="pag-n" onchange="pagNumeroRate(this.value)">${[1, 2, 3, 4, 5, 6].map(n => `<option value="${n}"${n === pag.nRate ? " selected" : ""}>${n}</option>`).join("")}</select></div>
        <div class="pag-righe">${pag.righe.map((r, k) => `<div class="pag-riga"><span>${k + 1}ª</span>
          <input class="input" aria-label="Importo rata ${k + 1}" type="number" step="0.01" min="0" value="${r.importo}" oninput="pagRiga(${k},'importo',this.value)">
          <input class="input" aria-label="Scadenza rata ${k + 1}" type="date" value="${r.scadenza}" onchange="pagRiga(${k},'scadenza',this.value)"></div>`).join("")}</div>
        <div class="pag-somma ${Math.abs(somma - resto) < 0.01 ? "ok" : "no"}" id="pag-somma">${pagTestoSomma(somma, resto)}</div>
        <div class="pag-azioni-l"><button type="button" class="pag-link" onclick="pagNumeroRate()">Ricalcola</button><button type="button" class="pag-link" onclick="pagSet('rateAperte',false,true)">Lascia stare le rate</button></div>`;
    }
    h += `</div>
      <button type="button" class="btn btn-primary" id="pag-registra" style="width:100%;margin-top:12px" onclick="pagRegistra()">${pagTestoRegistra()}</button>
      ${pag.rateAperte ? `<button type="button" class="btn btn-outline" style="width:100%;margin-top:8px" onclick="pagSalvaSoloRate()">Salva solo le rate, senza pagamento</button>` : ""}`;
  } else {
    h += `<p class="pag-p" style="margin-top:10px">${t.aperto ? "Niente da incassare." : "Già saldato."}</p>`;
  }
  if(t.storico.length) h += `<div class="pag-sez">Pagamenti ricevuti</div><div class="pag-storico">${t.storico.map(s => `<div><span>${formatDataBreve(s.pagato_il)} · ${escapeHtml(nomeModo(s.modo))}${s.nota ? " · " + escapeHtml(s.nota) : ""}</span><b>${pagEuro(s.importo)}</b>
      <button type="button" aria-label="Elimina questo pagamento" title="Elimina questo pagamento" onclick="pagElimina('${s.gruppo}')">✕</button></div>`).join("")}</div>`;
  el.innerHTML = h;
}
function pagTestoSomma(somma, resto){ return Math.abs(somma - resto) < 0.01 ? `Somma delle rate: ${pagEuro(somma)} ✓` : `Somma delle rate ${pagEuro(somma)} su ${pagEuro(resto)} che restano`; }
function pagTestoRegistra(){
  const v = Number(pag.importo) || 0;
  if(v <= 0) return pag.rateAperte ? "Salva le rate" : "Scrivi l'importo ricevuto";
  return v >= pag.t.residuo - 0.005 ? `Registra ${pagEuro(v)} · saldato` : `Registra ${pagEuro(v)}`;
}
function pagSet(campo, v, ridisegna){ pag[campo] = v; if(ridisegna) pagRender(); }
function pagImporto(v, ridisegna){
  pag.importo = r2(Math.max(0, Number(String(v).replace(",", ".")) || 0));
  if(ridisegna || pag.rateAperte){ if(pag.rateAperte) pag.righe = pagDividi(pagRestoDopo(), pag.nRate, pagMesiDopo(pag.data, 1)); pagRender(); return; }
  const b = document.getElementById("pag-registra"); if(b) b.textContent = pagTestoRegistra();
}
function pagApriRate(){
  const resto = pagRestoDopo();
  if(resto <= 0){ showToast("Con questo pagamento il lavoro è saldato: non restano rate da fare"); return; }
  pag.rateAperte = true; pag.nRate = pag.nRate || 2;
  pag.righe = pagDividi(resto, pag.nRate, pagMesiDopo(pag.data, 1));
  pagRender();
}
function pagNumeroRate(n){ pag.nRate = Math.max(1, Math.min(6, Number(n ?? pag.nRate) || 2)); pag.righe = pagDividi(pagRestoDopo(), pag.nRate, pag.righe?.[0]?.scadenza || pagMesiDopo(pag.data, 1)); pagRender(); }
function pagRiga(k, campo, v){
  pag.righe[k][campo] = campo === "importo" ? r2(Number(String(v).replace(",", ".")) || 0) : v;
  if(campo === "scadenza") return;
  const resto = pagRestoDopo(), somma = r2(pag.righe.reduce((s, r) => s + (Number(r.importo) || 0), 0)), el = document.getElementById("pag-somma");
  if(el){ el.textContent = pagTestoSomma(somma, resto); el.className = "pag-somma " + (Math.abs(somma - resto) < 0.01 ? "ok" : "no"); }
}
// il piano salvato copre tutto il totale: il già pagato (compreso il pagamento di adesso) è la prima rata
function pagPianoDaSalvare(conPagamento){
  const gia = r2(pag.t.pagato + (conPagamento ? (Number(pag.importo) || 0) : 0));
  const righe = pag.righe.filter(r => Number(r.importo) > 0 && r.scadenza).map(r => ({ importo: r2(r.importo), scadenza: r.scadenza }));
  return (gia > 0 ? [{ importo: gia, scadenza: conPagamento && Number(pag.importo) > 0 ? pag.data : (pag.t.storico[pag.t.storico.length - 1]?.pagato_il || oggiIso()) }] : []).concat(righe);
}
async function pagRegistra(){
  const v = r2(pag.importo);
  if(v <= 0 && !pag.rateAperte){ showToast("Scrivi l'importo ricevuto"); return; }
  if(v > pag.t.residuo + 0.005){ showToast(`L'importo supera quanto resta (${pagEuro(pag.t.residuo)})`); return; }
  if(pag.data > oggiIso()){ showToast("Il giorno del pagamento è nel futuro"); return; }
  const b = document.getElementById("pag-registra"); if(b) b.disabled = true;
  try{
    if(pag.rateAperte){ const e = await PagDB.salvaRate(pag.t, pagPianoDaSalvare(v > 0)); if(e) throw e; }
    let saldato = false;
    if(v > 0){
      const { data, error } = await PagDB.registra(pag.t, v, pag.data, pag.modo, pag.nota);
      if(error) throw error;
      saldato = !!data?.saldato;
    }
    closeModal("modal-pagamento");
    showToast(v <= 0 ? "Rate salvate" : saldato ? "Pagamento registrato: saldato" : `Registrati ${pagEuro(v)} · restano ${pagEuro(r2(pag.t.residuo - v))}`);
    await pagDopo();
  }catch(e){ if(b) b.disabled = false; showToast(pagErrore(e)); }
}
async function pagSalvaSoloRate(){
  const e = await PagDB.salvaRate(pag.t, pagPianoDaSalvare(false));
  if(e){ showToast(pagErrore(e)); return; }
  closeModal("modal-pagamento"); showToast("Rate salvate"); await pagDopo();
}
async function pagTogliRate(){
  if(!await chiediSiNo("Togliere le rate?", "I pagamenti già registrati restano; spariscono solo le scadenze.")) return;
  const e = await PagDB.salvaRate(pag.t, []);
  if(e){ showToast(pagErrore(e)); return; }
  showToast("Rate tolte"); await pagCarica(); pag.t.rate = []; pagRender(); pagDopo();
}
async function pagElimina(gruppo){
  if(!await chiediSiNo("Eliminare questo pagamento?", "Usalo solo se l'hai registrato per sbaglio: l'importo torna da incassare.")) return;
  const e = await PagDB.elimina(gruppo);
  if(e){ showToast(pagErrore(e)); return; }
  closeModal("modal-pagamento"); showToast("Pagamento eliminato"); await pagDopo();
}
async function pagSollecita(interventoId, contoId, btn){
  if(btn) btn.disabled = true;
  const { data, error } = await PagDB.sollecita(interventoId, contoId);
  if(error){ if(btn) btn.disabled = false; showToast(pagErrore(error)); return; }
  showToast(data?.ok ? "Promemoria mandato in chat al cliente" : "Il cliente non è su Equo: ricordaglielo tu (WhatsApp o telefono)");
}
function pagErrore(e){
  const m = String(e?.message || e || "");
  if(/equo_registra_pagamento|equo_salva_rate|incassi_tranche|could not find the function/i.test(m)) return "Manca un aggiornamento del database: avvisa l'assistenza Equo.";
  return m ? m.replace(/^.*?ERROR:\s*/, "") : "Non riuscito, riprova.";
}
async function pagDopo(){
  await pagCarica();
  if(typeof renderIncassi === "function") await renderIncassi();
  if(currentClienteId){ caricaContiCliente(currentClienteId); loadClienteInterventi(currentClienteId); }
  if(typeof agAggiornaSchede === "function") agAggiornaSchede();
}

const PagDB = {
  async registra(t, importo, data, modo, nota){
    if(DEMO_MODE) return pagDemoRegistra(t, importo, data, modo, nota);
    const { data: d, error } = await sb.rpc("equo_registra_pagamento", { p_intervento: t.tipo === "lavoro" ? t.id : null, p_conto: t.tipo === "conto" ? t.id : null, p_importo: importo, p_data: data, p_modo: modo, p_nota: nota || null });
    if(error) console.error("equo_registra_pagamento:", error);
    return { data: d, error };
  },
  async salvaRate(t, rate){
    if(DEMO_MODE){
      demoState.rate = (demoState.rate || []).filter(r => t.tipo === "lavoro" ? r.intervento_id !== t.id : r.conto_id !== t.id);
      rate.forEach((r, k) => demoState.rate.push({ id: "dr-" + Date.now().toString(36) + k, intervento_id: t.tipo === "lavoro" ? t.id : null, conto_id: t.tipo === "conto" ? t.id : null, n: k + 1, importo: r.importo, scadenza: r.scadenza }));
      return null;
    }
    const { error } = await sb.rpc("equo_salva_rate", { p_intervento: t.tipo === "lavoro" ? t.id : null, p_conto: t.tipo === "conto" ? t.id : null, p_rate: rate });
    if(error) console.error("equo_salva_rate:", error);
    return error || null;
  },
  async elimina(gruppo){
    if(DEMO_MODE){
      const via = demoState.tranche.filter(x => x.gruppo === gruppo);
      demoState.tranche = demoState.tranche.filter(x => x.gruppo !== gruppo);
      via.forEach(x => { const i = demoState.interventiMascalcia.find(y => y.id === x.intervento_id); if(i && i.stato_pagamento === "saldato"){ i.stato_pagamento = "da_saldare"; i.saldato_il = null; } });
      return null;
    }
    const { error } = await sb.rpc("equo_elimina_pagamento", { p_gruppo: gruppo });
    if(error) console.error("equo_elimina_pagamento:", error);
    return error || null;
  },
  async sollecita(interventoId, contoId){
    if(DEMO_MODE) return { data: { ok: true }, error: null };
    return await sb.rpc("equo_sollecita_rata", { p_intervento: interventoId || null, p_conto: contoId || null });
  }
};
function pagDemoRegistra(t, importo, data, modo, nota){
  const gruppo = "dg-" + Date.now().toString(36);
  const salda = i => { i.stato_pagamento = "saldato"; i.saldato_il = new Date(data + "T12:00").toISOString(); };
  if(t.tipo === "lavoro"){
    const i = demoState.interventiMascalcia.find(x => x.id === t.id);
    demoState.tranche.push({ id: gruppo, gruppo, intervento_id: t.id, conto_id: null, importo, pagato_il: data, modo, nota });
    const ok = pagPagato(t.id) + importo >= Number(i.importo) - 0.005;
    if(ok) salda(i);
    return { data: { ok: true, saldato: ok }, error: null };
  }
  const c = (demoState.conti || []).find(x => x.id === t.id);
  let resto = importo;
  (c?.righe || []).slice().sort((a, b) => a.data_intervento.localeCompare(b.data_intervento)).forEach(r => {
    const i = demoState.interventiMascalcia.find(x => x.id === r.intervento_id);
    if(!i || i.stato_pagamento === "saldato" || resto <= 0.005) return;
    const manca = r2(Number(r.importo) - pagPagato(i.id)), q = Math.min(manca, resto);
    if(q <= 0) return;
    demoState.tranche.push({ id: gruppo + r.intervento_id, gruppo, intervento_id: i.id, conto_id: c.id, importo: q, pagato_il: data, modo, nota });
    resto = r2(resto - q);
    if(q >= manca - 0.005) salda(i);
  });
  const tutto = (c?.righe || []).every(r => demoState.interventiMascalcia.find(x => x.id === r.intervento_id)?.stato_pagamento === "saldato");
  if(tutto && c){ c.stato = "pagato"; c.pagato_il = new Date(data + "T12:00").toISOString(); }
  return { data: { ok: true, saldato: tutto }, error: null };
}

export { pagApri, pagApriRate, pagCarica, pagElimina, pagHtmlConto, pagHtmlLavoro, pagImporto, pagNumeroRate, pagPagato, pagPagatoConto, pagRegistra, pagRender, pagResiduo, pagRiga, pagSalvaSoloRate, pagSet, pagSollecita, pagTogliRate, pagVociIncasso };
