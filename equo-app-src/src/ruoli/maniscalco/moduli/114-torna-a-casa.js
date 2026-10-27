// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { euroTondo } from "./047-incassi-saldati-per-periodo-da-saldare-p.js";
import { luogoEvento } from "./050-sposta-cavallo-dove-sta-il-cavallo-a-cas.js";
import { aggiungiGiorniIso, isoLocale } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { formatDataBreve } from "./054-richieste-di-appuntamento-step-5d.js";
import { agOrdinaGiro } from "./056-ordine-del-giro-trascina-un-cavallo-nel.js";
import { wgMostraMappe } from "./100-naviga.js";
import { coordDaIndirizzo } from "./106-posizione-attuale.js";
import { CARBURANTE, OF, OfDB, costoCarburante, ofCarica, ofGiornataProposta, ofLavoriGiorno, ofMezzo, ofOnboarding, ofSalvaGiornata } from "./112-officina-mobile.js";
/* ---------- TORNA A CASA E RIEPILOGO DELLA GIORNATA (27/10/2026) ----------
   Finito l'ultimo lavoro di oggi (modalità Lavoro o riquadro in Home) → «Torna a casa»: navigatore verso la base,
   la giornata salva ora e punto del rientro e ricalcola i km con il ritorno dalla posizione reale
   (base → tappe nell'ordine del giro → punto del rientro → base). Riaprendo l'app vicino a casa (o dopo 20 minuti
   se la posizione non c'è) compare il riepilogo: km, carburante, lavori, spese e guadagno netto; «Chiudi la giornata».
   Contachilometri facoltativo, una lettura al giorno: la sera nel riepilogo o la mattina dalla Home
   (officina_impostazioni.lettura_km). Con due letture a pochi giorni di distanza si usano i km veri.
   Colonne in officina_giornate: rientro_il, rientro_lat, rientro_lon, km_cruscotto, chiusa_il (schema-torna-a-casa.sql).
   Scritto per il maniscalco; quando veterinario e istruttore avranno il loro giro si sposta nella parte comune. */
const tcOggi = () => isoLocale(new Date());
const tcEsc = s => escapeHtml(s == null ? "" : String(s));
const tcKm = n => n == null ? "—" : Math.round(n).toLocaleString("it-IT");
const tcNum = v => { const n = Number(String(v ?? "").replace(/\./g, "").replace(",", ".")); return Number.isFinite(n) && String(v ?? "").trim() !== "" ? n : null; };
const tcOra = iso => new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
let tc = { lavori: [], finita: false, g: null, riepilogo: null };
let tcArrivoT = 0, tcAutoMostrato = "";

function tcDistanza(a1, o1, a2, o2){ const R = 6371, r = x => x * Math.PI / 180; const dA = r(a2 - a1), dO = r(o2 - o1); const h = Math.sin(dA / 2) ** 2 + Math.cos(r(a1)) * Math.cos(r(a2)) * Math.sin(dO / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
function tcBase(){
  const i = OF.imp; if(!i?.base_indirizzo && i?.base_lat == null) return null;
  const xy = i.base_lat != null ? { lat: i.base_lat, lon: i.base_lon } : coordDaIndirizzo(i.base_indirizzo);
  return { indirizzo: i.base_indirizzo || "", xy };
}
function tcPosizione(alta){
  if(DEMO_MODE || !navigator.geolocation) return Promise.resolve(null);
  return new Promise(res => navigator.geolocation.getCurrentPosition(p => res({ lat: p.coords.latitude, lon: p.coords.longitude }), () => res(null), { enableHighAccuracy: !!alta, timeout: 10000, maximumAge: 60000 }));
}
async function tcPermessoPosizione(){ try{ return (await navigator.permissions.query({ name: "geolocation" })).state; }catch(e){ return "prompt"; } }

async function tcCalcola(){
  await ofCarica();
  if(!OF.sqlOk) return tc;
  const oggi = tcOggi();
  const lavori = (await ofLavoriGiorno(oggi)).filter(e => e.stato !== "richiesto");
  tc.lavori = lavori;
  tc.finita = lavori.length > 0 && lavori.every(e => e.stato === "fatto");
  tc.g = OF.giornate[oggi] || null;
  return tc;
}
// ultima lettura del contachilometri prima di oggi (entro 4 giorni: oltre, nel mezzo ci sono troppi km non di lavoro)
function tcLetturaPrima(giorno){
  const d = Object.values(OF.giornate).filter(g => g && g.giorno < giorno && g.km_cruscotto != null).sort((a, b) => b.giorno.localeCompare(a.giorno))[0];
  return d && d.giorno >= aggiungiGiorniIso(giorno, -4) ? d : null;
}

/* ---- Home: «Km sul cruscotto stamattina», «Giornata finita · Torna a casa», «Sono arrivato» ---- */
async function tcRenderHome(){
  const box = document.getElementById("hm-torna");
  if(!box || !currentUser) return;
  try{ await tcCalcola(); }catch(e){ box.innerHTML = ""; return; }
  if(!OF.sqlOk){ box.innerHTML = ""; return; }
  const g = tc.g, ora = new Date().getHours();
  let h = "";
  if(OF.imp?.lettura_km === "mattina" && tc.lavori.length && g?.km_cruscotto == null && ora < 14)
    h += `<div class="tc-card tc-km"><div class="tc-t"><b>Km sul cruscotto stamattina</b><small>una lettura al giorno, prima di partire</small></div>
      <div class="tc-riga"><input class="input" id="tc-km-m" inputmode="numeric" placeholder="${ofMezzo(OF.imp?.mezzo_predefinito)?.km_attuali ?? "es. 128450"}" aria-label="Km sul cruscotto"><button type="button" class="btn btn-primary btn-sm" onclick="tcSalvaMattina(this)">Salva</button></div></div>`;
  if(tc.finita && !g?.chiusa_il){
    const n = tc.lavori.length;
    h += !g?.rientro_il
      ? `<div class="tc-card tc-fine"><div class="tc-t"><b>Giornata finita</b><small>${n} ${n === 1 ? "lavoro fatto" : "lavori fatti"} oggi · buon rientro</small></div>
          <button type="button" class="tc-casa" onclick="tcTornaACasa()">${TC_CASA} Torna a casa</button></div>`
      : `<div class="tc-card tc-fine"><div class="tc-t"><b>In viaggio verso casa</b><small>partito alle ${tcOra(g.rientro_il)} · ${tcKm(g.km)} km oggi</small></div>
          <div class="tc-riga"><button type="button" class="btn btn-outline btn-sm" onclick="tcNaviga()">Navigatore</button><button type="button" class="btn btn-primary btn-sm" onclick="tcRiepilogo()">Sono arrivato</button></div></div>`;
  }
  box.innerHTML = h;
  if(g?.rientro_il && !g.chiusa_il) tcControllaArrivo();
}
const TC_CASA = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11 12 3l9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>';

// modalità Lavoro: chiusa una tappa, se oggi non resta niente da fare
async function tcDopoTappa(){
  try{ await tcCalcola(); }catch(e){ return; }
  if(!OF.sqlOk || !tc.finita || tc.g?.rientro_il || tc.g?.chiusa_il) { tcRenderHome(); return; }
  const n = tc.lavori.length;
  hmFoglio("Giornata finita", `${n} ${n === 1 ? "lavoro fatto" : "lavori fatti"} oggi`, `
    <button class="hm-tappa su" onclick="hmChiudi();tcTornaACasa()"><span class="o">${TC_CASA}</span><span class="c"><b>Torna a casa</b><span>si apre il navigatore · Equo conta i km del rientro</span></span></button>
    <button class="hm-tappa" onclick="hmChiudi()"><span class="o">⋯</span><span class="c"><b>Più tardi</b><span>il tasto resta nella Home fino a stasera</span></span></button>`);
  tcRenderHome();
}

/* ---- «Torna a casa» ---- */
async function tcTornaACasa(){
  await ofCarica();
  if(!OF.sqlOk){ showToast("Arriva con l'aggiornamento di Equo."); return; }
  const base = tcBase();
  if(!base){ showToast("Prima dimmi da dove parti la mattina: la tua base"); ofOnboarding(1); return; }
  tcNaviga();
  const pos = await tcPosizione(true);
  await tcCalcola();
  const oggi = tcOggi();
  const stima = await tcStimaKm(tc.lavori, base, pos);
  const g = await ofGiornataProposta(oggi);
  if(stima != null){ g.km_stimati = stima; if(!g.km_corretti) g.km = stima; }
  if(OF.kmStime) OF.kmStime[oggi] = undefined;
  await ofSalvaGiornata(g, false);
  const riga = { giorno: oggi, rientro_il: new Date().toISOString(), rientro_lat: pos?.lat ?? null, rientro_lon: pos?.lon ?? null };
  const { error } = await OfDB.giornata(riga);
  if(error){ showToast(/rientro_|schema cache/i.test(error.message || "") ? "Manca un aggiornamento del database: avvisa l'assistenza Equo." : "Rientro non salvato: " + error.message); return; }
  OF.giornate[oggi] = { ...(OF.giornate[oggi] || {}), ...riga };
  tcAutoMostrato = "";
  showToast(stima != null ? `Buon rientro: ${tcKm(g.km)} km oggi` : "Buon rientro");
  tcRenderHome();
}
function tcNaviga(){
  const base = tcBase(); if(!base) return;
  const ind = base.xy && !coordDaIndirizzo(base.indirizzo) ? `${base.indirizzo || "Casa"} (${base.xy.lat}, ${base.xy.lon})` : base.indirizzo;
  wgMostraMappe({ nome: "casa" }, ind, "Equo salva l'ora del rientro e ricalcola i km di oggi.");
}
// km: base → tappe (ordine del giro) → punto da cui riparti → base
async function tcStimaKm(lavori, base, pos){
  const tappe = [];
  agOrdinaGiro(lavori).forEach(e => { const l = luogoEvento(e, false); const t = (l.indirizzo || l.nome || "").trim(); if(t && tappe[tappe.length - 1] !== t) tappe.push(t); });
  if(!tappe.length) return null;
  if(DEMO_MODE) return Math.round(18 + tappe.length * 21 + (pos ? 4 : 0));
  const b = base.xy ? { lat: base.xy.lat, lon: base.xy.lon } : { testo: base.indirizzo };
  const punti = [b, ...tappe.map(t => ({ testo: t })), ...(pos ? [{ lat: pos.lat, lon: pos.lon }] : []), b];
  try{
    const r = await fetch("/.netlify/functions/km-giro", { method: "POST", headers: await authHeaders(), body: JSON.stringify({ punti }) });
    const d = await r.json();
    return d.km != null ? Math.round(d.km * 10) / 10 : null;
  }catch(e){ return null; }
}

/* ---- arrivo a casa: il riepilogo compare da solo ---- */
async function tcControllaArrivo(){
  const g = OF.giornate?.[tcOggi()];
  if(!g?.rientro_il || g.chiusa_il || tcAutoMostrato === g.rientro_il || Date.now() - tcArrivoT < 90e3) return;
  if(document.getElementById("hm-foglio")?.classList.contains("on")) return;
  tcArrivoT = Date.now();
  const passati = (Date.now() - new Date(g.rientro_il).getTime()) / 60000;
  const base = tcBase();
  let aCasa = passati > 180;
  if(!aCasa && base?.xy && !DEMO_MODE && navigator.geolocation && await tcPermessoPosizione() === "granted"){
    const p = await tcPosizione(false);
    if(p) aCasa = tcDistanza(p.lat, p.lon, base.xy.lat, base.xy.lon) < 0.5;
    else aCasa = passati > 20;
  } else if(!aCasa) aCasa = passati > 20;
  if(!aCasa) return;
  tcAutoMostrato = g.rientro_il;
  tcRiepilogo();
}
document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible" && OF.caricato) tcControllaArrivo().catch(() => {}); });

/* ---- riepilogo della giornata ---- */
async function tcRiepilogo(){
  await tcCalcola();
  const oggi = tcOggi();
  const g = await ofGiornataProposta(oggi);
  const m = ofMezzo(g.mezzo_id);
  const prima = tcLetturaPrima(oggi);
  const lavoriFatti = tc.lavori.filter(e => e.stato === "fatto");
  const totLavori = lavoriFatti.reduce((t, e) => t + (Number(e.importo) || 0), 0);
  tc.riepilogo = { g, m, prima, kmStima: g.km_stimati ?? g.km, kmScelto: g.km, usaCruscotto: false, totLavori, nLavori: lavoriFatti.length };
  hmFoglio("Bentornato a casa", new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }), '<div id="tc-riep"></div>');
  tcDisegnaRiepilogo();
}
function tcDisegnaRiepilogo(){
  const box = document.getElementById("tc-riep"); if(!box || !tc.riepilogo) return;
  const r = tc.riepilogo, oggi = tcOggi(), lettura = OF.imp?.lettura_km || "";
  const nasc = typeof incassiNascosti === "function" && incassiNascosti();
  const km = r.kmScelto;
  const carb = costoCarburante(r.m, km);
  const altre = OF.spese.filter(s => s.data === oggi && s.fonte !== `carburante:${oggi}`);
  const totAltre = altre.reduce((t, s) => t + Number(s.importo), 0);
  const perCat = {}; altre.forEach(s => { perCat[s.categoria] = (perCat[s.categoria] || 0) + Number(s.importo); });
  const spese = totAltre + carb, netto = r.totLavori - spese;
  const nomeCat = { aiutanti: "Aiutante", materiali: "Materiali", mezzo: "Mezzo", altro: "Altre spese" };
  const base = tcBase();
  box.innerHTML = `
    <div class="tc-km-big"><b>${tcKm(km)}</b><span>km oggi${r.usaCruscotto ? " · dal contachilometri" : " · stima del giro (Beta)"}</span></div>
    ${lettura === "sera" ? `<div class="tc-lett"><label for="tc-km-s">Km sul cruscotto adesso</label><input class="input" id="tc-km-s" inputmode="numeric" placeholder="${r.m?.km_attuali != null ? tcKm(r.m.km_attuali + (km || 0)) : "es. 128450"}" value="${r.lettura ?? ""}" oninput="tcLettura(this.value)">
      <small id="tc-lett-n">${r.prima ? `ultima lettura ${formatDataBreve(r.prima.giorno)}: ${tcKm(r.prima.km_cruscotto)}` : "è la prima lettura: dalla prossima avrai i km veri"}</small></div>` : ""}
    ${r.kmCruscotto != null ? `<div class="tc-scelta">${[["stima", `Stima ${tcKm(r.kmStima)} km`], ["cruscotto", `Contachilometri ${tcKm(r.kmCruscotto)} km`]].map(([k, t]) => `<button type="button" class="${(k === "cruscotto") === r.usaCruscotto ? "on" : ""}" onclick="tcScegliKm('${k}')">${t}</button>`).join("")}</div>` : ""}
    <div class="tc-righe">
      <div><span>⛽ ${tcEsc(CARBURANTE[r.m?.alimentazione] || "Carburante")}</span><b>${carb ? "≈ " + euroTondo(carb) : r.m ? "—" : "nessun mezzo"}</b></div>
      ${!carb && km ? `<div class="tc-nota">Per il costo servono il consumo del mezzo e il prezzo al litro: <button type="button" onclick="hmChiudi();showPage('pro-officina')">Officina mobile</button></div>` : ""}
      ${Object.entries(perCat).map(([k, v]) => `<div><span>${tcEsc(nomeCat[k] || k)}</span><b>${euroTondo(v)}</b></div>`).join("")}
      ${nasc ? "" : `<div class="tc-sep"><span>Lavori fatti · ${r.nLavori}</span><b class="verde">${euroTondo(r.totLavori)}</b></div>
      <div><span>Spese del giorno</span><b class="rosso">− ${euroTondo(spese)}</b></div>
      <div class="tc-netto"><span>Guadagno netto</span><b>${euroTondo(netto)}</b></div>`}
    </div>
    <div class="tc-opz"><span>Contachilometri</span>${[["", "Non lo leggo"], ["sera", "La sera"], ["mattina", "La mattina"]].map(([k, t]) => `<button type="button" class="${lettura === k ? "on" : ""}" onclick="tcImpostaLettura('${k}')">${t}</button>`).join("")}</div>
    ${base && !base.xy && navigator.geolocation && !DEMO_MODE ? `<button type="button" class="tc-link" onclick="tcSalvaCasaQui(this)">📍 Sono a casa: salva questo punto come base (il riepilogo comparirà da solo)</button>` : ""}
    <button type="button" class="btn btn-primary" style="width:100%;margin-top:12px" onclick="tcChiudi(this)">Chiudi la giornata</button>
    <button type="button" class="btn btn-ghost" style="width:100%;margin-top:4px" onclick="hmChiudi()">Più tardi</button>`;
}
function tcLettura(v){
  const r = tc.riepilogo; if(!r) return;
  r.lettura = tcNum(v);
  const d = r.lettura != null && r.prima ? r.lettura - r.prima.km_cruscotto : null;
  const ok = d != null && d >= 0 && d <= 1500;
  const prima = r.kmCruscotto;
  r.kmCruscotto = ok ? d : null;
  if(!ok && r.usaCruscotto){ r.usaCruscotto = false; r.kmScelto = r.kmStima; }
  if(ok && prima == null){ r.usaCruscotto = true; r.kmScelto = d; }
  else if(ok && r.usaCruscotto) r.kmScelto = d;
  const n = document.getElementById("tc-lett-n");
  if(prima == null && r.kmCruscotto == null && n){ if(d != null && !ok) n.textContent = "la lettura non torna con l'ultima: controlla il numero"; return; }
  const el = document.getElementById("tc-km-s"), pos = el?.selectionStart;
  tcDisegnaRiepilogo();
  const nuovo = document.getElementById("tc-km-s"); if(nuovo){ nuovo.focus(); try{ nuovo.setSelectionRange(pos, pos); }catch(e){} }
}
function tcScegliKm(k){ const r = tc.riepilogo; if(!r) return; r.usaCruscotto = k === "cruscotto" && r.kmCruscotto != null; r.kmScelto = r.usaCruscotto ? r.kmCruscotto : r.kmStima; tcDisegnaRiepilogo(); }
async function tcImpostaLettura(k){
  const { data, error } = await OfDB.impostazioni({ lettura_km: k || null });
  if(error){ showToast(/lettura_km|schema cache/i.test(error.message || "") ? "Manca un aggiornamento del database: avvisa l'assistenza Equo." : "Non salvato: " + error.message); return; }
  OF.imp = data;
  showToast(k === "sera" ? "Ti chiedo i km la sera, nel riepilogo" : k === "mattina" ? "Ti chiedo i km la mattina, in Home" : "Niente lettura del contachilometri");
  tcDisegnaRiepilogo();
}
async function tcSalvaCasaQui(btn){
  if(btn) btn.disabled = true;
  const p = await tcPosizione(true);
  if(!p){ if(btn) btn.disabled = false; showToast("Posizione non trovata: attivala per Equo nelle impostazioni del telefono"); return; }
  const { data, error } = await OfDB.impostazioni({ base_lat: p.lat, base_lon: p.lon });
  if(error){ if(btn) btn.disabled = false; showToast("Non salvato: " + error.message); return; }
  OF.imp = data; OF.kmStime = {};
  showToast("Base salvata con la posizione esatta");
  tcDisegnaRiepilogo();
}
async function tcChiudi(btn){
  const r = tc.riepilogo; if(!r) return;
  if(btn) btn.disabled = true;
  const oggi = tcOggi(), g = r.g;
  if(r.kmScelto != null && r.kmScelto !== g.km){ g.km = r.kmScelto; g.km_corretti = r.usaCruscotto || r.kmScelto !== g.km_stimati; }
  if(!(await ofSalvaGiornata(g, false))){ if(btn) btn.disabled = false; return; }
  const riga = { giorno: oggi, chiusa_il: new Date().toISOString(), ...(r.lettura != null ? { km_cruscotto: Math.round(r.lettura) } : {}) };
  const { error } = await OfDB.giornata(riga);
  if(error){ if(btn) btn.disabled = false; showToast("Non salvata: " + error.message); return; }
  OF.giornate[oggi] = { ...(OF.giornate[oggi] || {}), ...riga };
  if(r.lettura != null && r.m){ r.m.km_attuali = Math.round(r.lettura); await OfDB.salva("officina_mezzi", { id: r.m.id, km_attuali: r.m.km_attuali, km_aggiornati_il: oggi }); }
  hmChiudi();
  showToast("Giornata chiusa. Buona serata!");
  tcRenderHome();
  if(typeof ofAggiornaRiepiloghi === "function") ofAggiornaRiepiloghi();
}
// lettura della mattina: corregge i km dell'ultima giornata (se è di pochi giorni fa) e aggiorna il mezzo
async function tcSalvaMattina(btn){
  const v = tcNum(document.getElementById("tc-km-m")?.value);
  if(v == null || v < 0){ showToast("Scrivi i km che leggi sul cruscotto"); return; }
  if(btn) btn.disabled = true;
  await ofCarica();
  const oggi = tcOggi(), prima = tcLetturaPrima(oggi);
  const prop = await ofGiornataProposta(oggi);
  const riga = { giorno: oggi, km_cruscotto: Math.round(v), ...(OF.giornate[oggi] ? {} : { mezzo_id: prop.mezzo_id, aiutante_id: prop.aiutante_id, automatica: true }) };
  const { error } = await OfDB.giornata(riga);
  if(error){ if(btn) btn.disabled = false; showToast(/km_cruscotto|schema cache/i.test(error.message || "") ? "Manca un aggiornamento del database: avvisa l'assistenza Equo." : "Non salvato: " + error.message); return; }
  OF.giornate[oggi] = { ...(OF.giornate[oggi] || {}), ...riga };
  let msg = "Km salvati";
  if(prima){
    const d = Math.round(v) - prima.km_cruscotto;
    if(d >= 0 && d <= 1500){
      const gp = await ofGiornataProposta(prima.giorno);
      if(gp.salvata){ gp.km = d; gp.km_corretti = true; await ofSalvaGiornata(gp, false); msg = `Km salvati: ${formatDataBreve(prima.giorno)} ${tcKm(d)} km dal contachilometri`; }
    }
  }
  const m = ofMezzo(riga.mezzo_id || OF.giornate[oggi].mezzo_id);
  if(m){ m.km_attuali = Math.round(v); await OfDB.salva("officina_mezzi", { id: m.id, km_attuali: m.km_attuali, km_aggiornati_il: oggi }); }
  showToast(msg);
  tcRenderHome();
}

export { tcChiudi, tcDopoTappa, tcImpostaLettura, tcLettura, tcNaviga, tcRenderHome, tcRiepilogo, tcSalvaCasaQui, tcSalvaMattina, tcScegliKm, tcTornaACasa };
