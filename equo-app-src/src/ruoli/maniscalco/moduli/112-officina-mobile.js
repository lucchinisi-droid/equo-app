// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { euroTondo } from "./047-incassi-saldati-per-periodo-da-saldare-p.js";
import { luogoEvento } from "./050-sposta-cavallo-dove-sta-il-cavallo-a-cas.js";
import { aggiungiGiorniIso, isoLocale } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { formatDataBreve } from "./054-richieste-di-appuntamento-step-5d.js";
import { agOrdinaGiro } from "./056-ordine-del-giro-trascina-un-cavallo-nel.js";
import { coordDaIndirizzo } from "./106-posizione-attuale.js";
/* ---------- OFFICINA MOBILE (27/10/2026) ----------
   Il lavoro dietro le quinte del maniscalco: mezzi (scadenze, tagliando a km o mesi), aiutanti, materiali, giornata di lavoro
   (mezzo, aiutante, km del giro in Beta, materiali usati) e spese → guadagno netto.
   Prima configurazione in 4 passi (Base · Mezzi · Aiutanti · Materiali), poi modifiche rapide della giornata.
   Spese automatiche: compenso dell'aiutante, carburante stimato dai km, materiali (anche dai «ferri nuovi» dei lavori).
   Scadenze del mezzo → promemoria personali (Hammer in chat + notifica/email), 15 giorni prima e il giorno stesso.
   Tabelle officina_* (schema-officina-mobile.sql); senza lo SQL la pagina dice che arriva con l'aggiornamento. */
const OGGI = () => isoLocale(new Date());
const OF = { caricato: false, sqlOk: true, imp: null, mezzi: [], aiutanti: [], materiali: [], spese: [], interventi: [], giornate: {},
  scheda: "mezzi", mese: OGGI().slice(0, 7), vista: "home", mezzoAperto: null, kmStime: {}, lavoriMese: null };
let ofForm = null;       // contesto della finestra aperta
const TIPI_MEZZO = { furgone: "Furgone", auto: "Auto", carrello: "Carrello", altro: "Altro" };
const ALIM = { diesel: "Diesel", benzina: "Benzina", gpl: "GPL", metano: "Metano", ibrido: "Ibrido", elettrico: "Elettrico" };
const CARBURANTE = { diesel: "Gasolio", benzina: "Benzina", gpl: "GPL", metano: "Metano", ibrido: "Benzina", elettrico: "Ricarica" };
const COMPENSO = { giornata: "a giornata", cavallo: "a cavallo", ora: "all'ora" };
const CAT_MAT = { ferri: "Ferri", chiodi: "Chiodi", prodotti: "Prodotti", attrezzi: "Attrezzi", altro: "Altro" };
const UNITA = { pezzo: "pezzo", paio: "paio", scatola: "scatola", barattolo: "barattolo", confezione: "confezione", kg: "kg", litro: "litro" };
const CAT_SPESA = { aiutanti: ["Aiutanti", "#2f5a3f"], carburante: ["Carburante", "#d76b3a"], materiali: ["Materiali", "#c9973f"], mezzo: ["Mezzo", "#8a7d66"], altro: ["Altro", "#5c7a8a"] };
const INT_TIPI = { tagliando: "Tagliando", revisione: "Revisione", pneumatici: "Gomme", pasticche: "Pasticche", cinghia: "Cinghia distribuzione",
  manutenzione_ordinaria: "Manutenzione ordinaria", manutenzione_straordinaria: "Manutenzione straordinaria", riparazione: "Riparazione", bombole: "Collaudo bombole", altro: "Altro" };
const INT_ICO = { tagliando: "⚙️", revisione: "📋", pneumatici: "🛞", pasticche: "🛑", cinghia: "⛓️", manutenzione_ordinaria: "🧰", manutenzione_straordinaria: "🔩", riparazione: "🔧", bombole: "🧯", altro: "•" };
// scelte rapide nel modulo «Nuovo materiale»: nome, categoria, unità
const MAT_RAPIDI = [["Ferri", "ferri", "paio"], ["Chiodi", "chiodi", "scatola"], ["Raspe", "attrezzi", "pezzo"], ["Nastro smerigliatrice", "attrezzi", "pezzo"],
  ["Scarpe antinfortunistiche", "altro", "paio"], ["Bombola gas", "altro", "pezzo"]];
const mesiTra = (a, b) => (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth();
const giorniA = iso => iso ? Math.round((new Date(iso + "T12:00") - new Date(OGGI() + "T12:00")) / 86400000) : null;
const num = v => { const n = Number(String(v ?? "").replace(",", ".")); return Number.isFinite(n) ? n : null; };
const fmtKm = n => n == null ? "—" : Math.round(n).toLocaleString("it-IT");
const meseNome = ym => { const [y, m] = ym.split("-").map(Number); return new Date(y, m - 1, 1).toLocaleDateString("it-IT", { month: "long", year: "numeric" }); };
const sqlMancante = e => /officina_|does not exist|schema cache|aiutante_/i.test(e?.message || "");
const esc = s => escapeHtml(s == null ? "" : String(s));

/* ===================== DATI ===================== */
const OfDB = {
  demo(){ return (demoState.officina = demoState.officina || { officina_impostazioni: [], officina_mezzi: [], officina_interventi: [], officina_aiutanti: [], officina_materiali: [], officina_giornate: [], officina_spese: [] }); },
  async lista(t, filtri){
    if(DEMO_MODE) return (this.demo()[t] || []).filter(r => !filtri || Object.entries(filtri).every(([k, v]) => r[k] === v));
    let q = sb.from(t).select("*").eq("user_id", currentUser.id);
    Object.entries(filtri || {}).forEach(([k, v]) => { q = q.eq(k, v); });
    const { data, error } = await q.limit(2000);
    if(error){ if(sqlMancante(error)) OF.sqlOk = false; else console.warn("officina", t, error.message); return []; }
    return data || [];
  },
  async salva(t, riga){
    if(DEMO_MODE){
      const tab = this.demo()[t];
      if(riga.id){ const r = tab.find(x => x.id === riga.id); Object.assign(r, riga); return { data: r, error: null }; }
      const r = { id: "of" + Math.random().toString(36).slice(2, 10), user_id: currentUser.id, creato_il: new Date().toISOString(), ...riga }; tab.push(r); return { data: r, error: null };
    }
    const { id, ...campi } = riga;
    const q = id ? sb.from(t).update(campi).eq("id", id) : sb.from(t).insert({ user_id: currentUser.id, ...campi });
    const { data, error } = await q.select().single();
    return { data, error };
  },
  async elimina(t, id){
    if(DEMO_MODE){ const d = this.demo(); d[t] = d[t].filter(r => r.id !== id); return { error: null }; }
    return await sb.from(t).delete().eq("id", id);
  },
  async impostazioni(campi){
    if(DEMO_MODE){ const d = this.demo(); if(!d.officina_impostazioni[0]) d.officina_impostazioni.push({ user_id: currentUser.id }); Object.assign(d.officina_impostazioni[0], campi); return { data: d.officina_impostazioni[0], error: null }; }
    const { data, error } = await sb.from("officina_impostazioni").upsert({ user_id: currentUser.id, ...campi, aggiornato_il: new Date().toISOString() }, { onConflict: "user_id" }).select().single();
    return { data, error };
  },
  async giornata(riga){
    if(DEMO_MODE){ const d = this.demo(); const r = d.officina_giornate.find(x => x.giorno === riga.giorno); if(r) Object.assign(r, riga); else d.officina_giornate.push({ user_id: currentUser.id, ...riga }); return { error: null }; }
    const { error } = await sb.from("officina_giornate").upsert({ user_id: currentUser.id, ...riga, salvata_il: new Date().toISOString() }, { onConflict: "user_id,giorno" });
    return { error };
  },
  // spesa automatica con la sua «fonte» (aiutante:giorno, carburante:giorno, materiali:giorno, int:id): si aggiorna, non si duplica
  async spesaAuto(fonte, riga){
    if(DEMO_MODE){
      const d = this.demo(); const r = d.officina_spese.find(x => x.fonte === fonte);
      if(!riga){ d.officina_spese = d.officina_spese.filter(x => x.fonte !== fonte); return { error: null }; }
      if(r) Object.assign(r, riga); else d.officina_spese.push({ id: "of" + Math.random().toString(36).slice(2, 10), user_id: currentUser.id, fonte, automatica: true, ...riga });
      return { error: null };
    }
    if(!riga) return await sb.from("officina_spese").delete().eq("user_id", currentUser.id).eq("fonte", fonte);
    return await sb.from("officina_spese").upsert({ user_id: currentUser.id, fonte, automatica: true, ...riga }, { onConflict: "user_id,fonte" });
  }
};

async function ofCarica(forza){
  if(OF.caricato && !forza) return;
  if(!currentUser) return;
  OF.sqlOk = true;
  const da = aggiungiGiorniIso(OGGI(), -400);
  const [imp, mezzi, aiutanti, materiali, interventi, giornate] = await Promise.all([
    OfDB.lista("officina_impostazioni"), OfDB.lista("officina_mezzi"), OfDB.lista("officina_aiutanti"),
    OfDB.lista("officina_materiali"), OfDB.lista("officina_interventi"), OfDB.lista("officina_giornate")
  ]);
  OF.imp = imp[0] || null;
  OF.mezzi = mezzi.filter(m => !m.archiviato).sort((a, b) => (a.creato_il || "").localeCompare(b.creato_il || ""));
  OF.aiutanti = aiutanti.filter(a => a.attivo !== false).sort((a, b) => a.nome.localeCompare(b.nome, "it"));
  OF.materiali = materiali.filter(m => m.attivo !== false).sort((a, b) => (a.categoria + a.nome).localeCompare(b.categoria + b.nome, "it"));
  OF.interventi = interventi.sort((a, b) => b.data.localeCompare(a.data));
  OF.giornate = {}; giornate.filter(g => g.giorno >= da).forEach(g => { OF.giornate[g.giorno] = g; });
  await ofCaricaSpese();
  OF.caricato = true;
}
async function ofCaricaSpese(){
  const tutte = await OfDB.lista("officina_spese");
  OF.spese = tutte.sort((a, b) => (b.data + (b.creato_il || "")).localeCompare(a.data + (a.creato_il || "")));
}
const ofConfigurata = () => !!OF.imp?.configurata_il;
const ofMezzo = id => OF.mezzi.find(m => m.id === id) || null;
const ofAiutante = id => OF.aiutanti.find(a => a.id === id) || null;
const ofMezzoPred = () => ofMezzo(OF.imp?.mezzo_predefinito) || OF.mezzi[0] || null;
const ofAiutantePred = () => ofAiutante(OF.imp?.aiutante_predefinito) || null;
const nomeMezzo = m => m ? ([m.marca, m.modello].filter(Boolean).join(" ") || TIPI_MEZZO[m.tipo] || "Mezzo") : "—";
const icoMezzo = m => m?.tipo === "auto" ? "🚗" : m?.tipo === "carrello" ? "🛻" : "🚐";

/* ===================== SCADENZE DEL MEZZO ===================== */
// revisione: 4 anni dall'immatricolazione, poi ogni 2 (prima data futura) se non è scritta
function revisioneCalcolata(m){
  if(m.revisione_data) return m.revisione_data;
  if(!m.immatricolazione) return null;
  const d = new Date(m.immatricolazione + "T12:00"); d.setFullYear(d.getFullYear() + 4);
  const oggi = new Date(OGGI() + "T12:00");
  while(d < oggi) d.setFullYear(d.getFullYear() + 2);
  return isoLocale(d);
}
// manutenzione a ciclo (tagliando, cinghia): vale quello che arriva prima, km o mesi
function ciclo(m, ogniKm, ogniMesi, ultData, ultKm){
  ogniKm = ogniKm || null; ogniMesi = ogniMesi || null;
  const kmFatti = m.km_attuali != null && ultKm != null ? m.km_attuali - ultKm : null;
  const kmMancano = ogniKm && kmFatti != null ? ogniKm - kmFatti : null;
  let data = null;
  if(ogniMesi && ultData){ const d = new Date(ultData + "T12:00"); d.setMonth(d.getMonth() + ogniMesi); data = isoLocale(d); }
  const pKm = ogniKm && kmFatti != null ? Math.min(1, Math.max(0, kmFatti / ogniKm)) : null;
  let pT = null;
  if(ogniMesi && ultData){ const tot = ogniMesi * 30.4, fatto = -giorniA(ultData); pT = Math.min(1, Math.max(0, fatto / tot)); }
  return { ogniKm, ogniMesi, kmFatti, kmMancano, data, perc: Math.max(pKm ?? 0, pT ?? 0), conDati: pKm != null || pT != null };
}
const tagliando = m => ciclo(m, m.tagliando_km, m.tagliando_mesi, m.ultimo_tagliando_data, m.ultimo_tagliando_km);
// cinghia: se non è mai stata cambiata si conta dall'immatricolazione (0 km)
function cinghia(m){
  if(!m.cinghia_km && !m.cinghia_anni) return { conDati: false };
  const daImm = !m.ultima_cinghia_data && m.ultima_cinghia_km == null;
  return { ...ciclo(m, m.cinghia_km, m.cinghia_anni ? m.cinghia_anni * 12 : null, daImm ? m.immatricolazione : m.ultima_cinghia_data, daImm ? (m.immatricolazione ? 0 : null) : m.ultima_cinghia_km), daImm };
}
function scadenzeMezzo(m){
  const out = [];
  const add = (k, titolo, data, extra) => { if(data) out.push({ k, titolo, data, giorni: giorniA(data), mezzo: m, ...(extra || {}) }); };
  add("revisione", "Revisione", revisioneCalcolata(m));
  const t = tagliando(m);
  if(t.conDati) out.push({ k: "tagliando", titolo: "Tagliando", data: t.data, giorni: t.data ? giorniA(t.data) : null, km: t.kmMancano, perc: t.perc, mezzo: m });
  const c = cinghia(m);
  if(c.conDati) out.push({ k: "cinghia", titolo: "Cinghia distribuzione", data: c.data, giorni: c.data ? giorniA(c.data) : null, km: c.kmMancano, perc: c.perc, mezzo: m });
  add("assicurazione", "Assicurazione", m.assicurazione_data);
  add("bollo", "Bollo", m.bollo_data);
  if(["gpl", "metano"].includes(m.alimentazione)) add("bombole", "Collaudo bombole", m.bombole_data);
  OF.interventi.filter(i => i.mezzo_id === m.id && i.stato === "da_fare").forEach(i => add("int:" + i.id, i.titolo, i.data, { intervento: i }));
  return out;
}
// colore e riempimento dell'anello: più vicino = più pieno e più caldo
function statoScadenza(s){
  if(s.k === "tagliando" || s.k === "cinghia"){
    const urg = (s.km != null && s.km <= (s.k === "cinghia" ? 3000 : 1000)) || (s.giorni != null && s.giorni <= 15);
    return { perc: s.perc ?? 0, colore: (s.km != null && s.km <= 0) || (s.giorni != null && s.giorni < 0) ? "#b5432f" : urg ? "#d76b3a" : "#c9973f" };
  }
  const g = s.giorni;
  const perc = g == null ? 0 : g <= 0 ? 1 : Math.max(0.05, 1 - g / 365);
  return { perc, colore: g < 0 ? "#b5432f" : g <= 15 ? "#d76b3a" : g <= 60 ? "#c9973f" : "#3d7a4f" };
}
const dataScad = iso => iso && iso.slice(0, 4) !== OGGI().slice(0, 4) ? new Date(iso + "T12:00").toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }) : formatDataBreve(iso);
function testoScadenza(s){
  if(s.k === "tagliando" || s.k === "cinghia"){
    const parti = [];
    if(s.km != null) parti.push(s.km <= 0 ? `superato di ${fmtKm(-s.km)} km` : `tra ${fmtKm(s.km)} km`);
    if(s.giorni != null) parti.push(s.giorni < 0 ? `scaduto da ${-s.giorni} gg` : `entro ${dataScad(s.data)}`);
    return parti.join(" · ") || (s.k === "cinghia" ? "imposta l'ultima sostituzione" : "imposta l'ultimo tagliando");
  }
  const g = s.giorni;
  return g < 0 ? `scaduta da ${-g} ${-g === 1 ? "giorno" : "giorni"}` : g === 0 ? "oggi" : g <= 60 ? `tra ${g} ${g === 1 ? "giorno" : "giorni"}` : dataScad(s.data);
}
function anello(perc, colore, d){
  d = d || 40; const r = d / 2 - 4, c = 2 * Math.PI * r;
  return `<svg width="${d}" height="${d}" viewBox="0 0 ${d} ${d}" aria-hidden="true"><circle cx="${d / 2}" cy="${d / 2}" r="${r}" stroke="#eadfc2" stroke-width="5" fill="none"/><circle cx="${d / 2}" cy="${d / 2}" r="${r}" stroke="${colore}" stroke-width="5" fill="none" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - perc)).toFixed(1)}" stroke-linecap="round" transform="rotate(-90 ${d / 2} ${d / 2})"/></svg>`;
}

// promemoria delle scadenze (15 giorni prima e il giorno stesso, alle 8): uno per scadenza, si aggiornano
async function ofPromemoriaScadenze(m){
  if(DEMO_MODE || !m || !OF.sqlOk) return;
  for(const s of scadenzeMezzo(m)){
    if(!s.data || s.k.startsWith("int:")) continue;
    for(const [quanto, etichetta] of [[15, "tra 15 giorni"], [0, "oggi"]]){
      const giorno = aggiungiGiorniIso(s.data, -quanto);
      const quando = new Date(giorno + "T08:00");
      const fonte = `mezzo:${m.id}:${s.k}:${quanto}`;
      if(quando.getTime() < Date.now()){ continue; }
      await sb.from("promemoria_personali").upsert({ user_id: currentUser.id, fonte, testo: `${s.titolo} ${nomeMezzo(m)}${m.targa ? " (" + m.targa + ")" : ""}: scade ${etichetta} (${dataScad(s.data)})`.slice(0, 300),
        quando: quando.toISOString(), stato: "attivo", creato_da: "utente" }, { onConflict: "user_id,fonte" }).then(r => { if(r.error && !sqlMancante(r.error)) console.warn("promemoria mezzo:", r.error.message); });
    }
  }
}
// tagliando a km: avviso quando mancano 1.000 km (una volta per tagliando)
async function ofControllaTagliandoKm(m){
  if(DEMO_MODE || !m) return;
  const c = cinghia(m);
  if(c.kmMancano != null && c.kmMancano <= 3000)
    await sb.from("promemoria_personali").upsert({ user_id: currentUser.id, fonte: `mezzo:${m.id}:cinghia_km:${m.ultima_cinghia_km ?? 0}`,
      testo: `Cinghia distribuzione ${nomeMezzo(m)}: ${c.kmMancano <= 0 ? "hai superato i km" : "mancano circa " + fmtKm(c.kmMancano) + " km"} (ogni ${fmtKm(c.ogniKm)} km · km in Beta)`,
      quando: new Date(Date.now() + 60000).toISOString(), stato: "attivo", creato_da: "utente" }, { onConflict: "user_id,fonte", ignoreDuplicates: true });
  const t = tagliando(m);
  if(t.kmMancano == null || t.kmMancano > 1000) return;
  await sb.from("promemoria_personali").upsert({ user_id: currentUser.id, fonte: `mezzo:${m.id}:tagliando_km:${m.ultimo_tagliando_km}`,
    testo: `Tagliando ${nomeMezzo(m)}: ${t.kmMancano <= 0 ? "hai superato i km" : "mancano circa " + fmtKm(t.kmMancano) + " km"} (ogni ${fmtKm(t.ogniKm)} km · km in Beta)`,
    quando: new Date(Date.now() + 60000).toISOString(), stato: "attivo", creato_da: "utente" }, { onConflict: "user_id,fonte", ignoreDuplicates: true });
}

/* ===================== GIORNATA DI LAVORO ===================== */
async function ofLavoriGiorno(giorno){
  const l = await DB.listInterventiPeriodo(giorno, giorno).catch(() => []);
  return l.filter(e => !["rifiutato", "annullato", "richiesto", "proposto"].includes(e.stato));
}
// km del giro (Beta): base → tappe nell'ordine del giro → base
async function ofStimaKm(giorno, lavori){
  if(OF.kmStime[giorno] !== undefined) return OF.kmStime[giorno];
  const lista = agOrdinaGiro(lavori || await ofLavoriGiorno(giorno));
  const tappe = [];
  lista.forEach(e => { const l = luogoEvento(e, false); const testo = (l.indirizzo || l.nome || "").trim(); if(testo && tappe[tappe.length - 1] !== testo) tappe.push(testo); });
  if(!tappe.length){ OF.kmStime[giorno] = { km: 0, metodo: "nessuno", tappe: 0 }; return OF.kmStime[giorno]; }
  const base = OF.imp?.base_lat ? { lat: OF.imp.base_lat, lon: OF.imp.base_lon } : OF.imp?.base_indirizzo ? { testo: OF.imp.base_indirizzo } : null;
  const punti = [...(base ? [base] : []), ...tappe.map(t => ({ testo: t })), ...(base ? [base] : [])];
  let r = { km: null, metodo: "nessuno" };
  if(DEMO_MODE) r = { km: Math.round(18 + tappe.length * 21), metodo: "stima" };
  else {
    try{
      const res = await fetch("/.netlify/functions/km-giro", { method: "POST", headers: await authHeaders(), body: JSON.stringify({ punti }) });
      r = await res.json();
    }catch(e){ r = { km: null, metodo: "errore" }; }
  }
  OF.kmStime[giorno] = { km: r.km ?? null, metodo: r.metodo, mancanti: r.mancanti || 0, tappe: tappe.length, senzaBase: !base, giro: tappe };
  return OF.kmStime[giorno];
}
// materiali usati: dai «ferri nuovi» dei lavori fatti, abbinati per misura ai ferri del magazzino
function ofMaterialiDaLavori(lavori){
  const out = {};
  lavori.filter(e => e.stato === "fatto" && e.ferri_nuovi === true && Number(e.quantita_ferri) > 0).forEach(e => {
    const mis = String(e.numero_ferro || "").toLowerCase().replace(/\s+/g, "");
    const m = OF.materiali.find(x => x.categoria === "ferri" && x.misura && String(x.misura).toLowerCase().replace(/\s+/g, "") === mis) || (OF.materiali.filter(x => x.categoria === "ferri").length === 1 ? OF.materiali.find(x => x.categoria === "ferri") : null);
    if(!m) return;
    const q = m.unita === "paio" ? Number(e.quantita_ferri) / 2 : Number(e.quantita_ferri);
    out[m.id] = (out[m.id] || 0) + q;
  });
  return Object.entries(out).map(([materiale_id, quantita]) => ({ materiale_id, quantita, auto: true }));
}
// proposta della giornata: quella salvata, altrimenti i predefiniti
async function ofGiornataProposta(giorno){
  const salvata = OF.giornate[giorno];
  const lavori = await ofLavoriGiorno(giorno);
  if(salvata) return { ...salvata, materiali: salvata.materiali || [], lavori, salvata: true };
  const km = await ofStimaKm(giorno, lavori);
  return { giorno, mezzo_id: ofMezzoPred()?.id || null, aiutante_id: ofAiutantePred()?.id || null, ore: 8, km: km.km, km_stimati: km.km, km_corretti: false,
    materiali: ofMaterialiDaLavori(lavori), lavori, salvata: false };
}
const cavalliFatti = lavori => (lavori || []).filter(e => e.stato === "fatto").length || (lavori || []).length;
function costoAiutante(a, g){
  if(!a) return 0;
  const n = Number(a.compenso) || 0;
  return a.compenso_tipo === "cavallo" ? n * cavalliFatti(g.lavori) : a.compenso_tipo === "ora" ? n * (Number(g.ore) || 0) : n;
}
function costoCarburante(m, km){
  const prezzo = Number(OF.imp?.prezzo_carburante) || 0, cons = Number(m?.consumo_l100) || 0;
  return km && prezzo && cons ? Math.round(km * cons / 100 * prezzo * 100) / 100 : 0;
}
// salva la giornata: spese automatiche, scorte, km del mezzo, aiutante sugli appuntamenti del giorno
async function ofSalvaGiornata(g, automatica){
  const prec = OF.giornate[g.giorno] || null;
  const riga = { giorno: g.giorno, mezzo_id: g.mezzo_id || null, aiutante_id: g.aiutante_id || null, ore: g.ore ?? null,
    km: g.km != null ? Math.round(g.km * 10) / 10 : null, km_stimati: g.km_stimati ?? null, km_corretti: !!g.km_corretti,
    materiali: (g.materiali || []).filter(x => Number(x.quantita) > 0).map(x => ({ materiale_id: x.materiale_id, quantita: Number(x.quantita), auto: !!x.auto })), automatica: !!automatica };
  const { error } = await OfDB.giornata(riga);
  if(error){ if(!automatica) showToast("Non salvata: " + error.message); return false; }
  OF.giornate[g.giorno] = { ...riga, user_id: currentUser.id };
  const a = ofAiutante(riga.aiutante_id), m = ofMezzo(riga.mezzo_id);
  const ca = costoAiutante(a, g);
  await OfDB.spesaAuto(`aiutante:${g.giorno}`, a && ca > 0 ? { data: g.giorno, categoria: "aiutanti", descrizione: `${a.nome} · ${a.compenso_tipo === "cavallo" ? cavalliFatti(g.lavori) + " cavalli" : a.compenso_tipo === "ora" ? (g.ore || 0) + " ore" : "giornata"}`, importo: ca } : null);
  const cc = costoCarburante(m, riga.km);
  await OfDB.spesaAuto(`carburante:${g.giorno}`, cc > 0 ? { data: g.giorno, categoria: "carburante", descrizione: `${CARBURANTE[m?.alimentazione] || "Carburante"} stimato · ${fmtKm(riga.km)} km (Beta)`, importo: cc, mezzo_id: m?.id || null } : null);
  const voci = riga.materiali.map(x => ({ ...x, m: OF.materiali.find(y => y.id === x.materiale_id) })).filter(x => x.m);
  const cm = Math.round(voci.reduce((t, x) => t + x.quantita * (Number(x.m.costo) || 0), 0) * 100) / 100;
  await OfDB.spesaAuto(`materiali:${g.giorno}`, cm > 0 ? { data: g.giorno, categoria: "materiali", descrizione: voci.map(x => `${x.m.nome} × ${String(x.quantita).replace(".", ",")}`).join(", ").slice(0, 120), importo: cm } : null);
  // scorte: si toglie solo la differenza rispetto all'ultimo salvataggio
  const prima = {}; (prec?.materiali || []).forEach(x => { prima[x.materiale_id] = (prima[x.materiale_id] || 0) + Number(x.quantita); });
  const ora = {}; riga.materiali.forEach(x => { ora[x.materiale_id] = (ora[x.materiale_id] || 0) + Number(x.quantita); });
  for(const id of new Set([...Object.keys(prima), ...Object.keys(ora)])){
    const delta = (ora[id] || 0) - (prima[id] || 0), mat = OF.materiali.find(y => y.id === id);
    if(delta && mat){ mat.scorta = Math.round((Number(mat.scorta) - delta) * 100) / 100; await OfDB.salva("officina_materiali", { id, scorta: mat.scorta }); }
  }
  // km del mezzo (solo la differenza) e controllo del tagliando
  const dKm = (riga.km || 0) - (prec && prec.mezzo_id === riga.mezzo_id ? (prec.km || 0) : 0);
  if(m && m.km_attuali != null && dKm){ m.km_attuali = Math.round(m.km_attuali + dKm); await OfDB.salva("officina_mezzi", { id: m.id, km_attuali: m.km_attuali, km_aggiornati_il: g.giorno }); await ofControllaTagliandoKm(m); }
  // aiutante sugli appuntamenti del giorno (quelli senza aiutante o con quello di prima)
  if(!DEMO_MODE && (g.lavori || []).length){
    const daAggiornare = g.lavori.filter(e => !e.aiutante_id || e.aiutante_id === prec?.aiutante_id).map(e => e.id);
    if(daAggiornare.length) await sb.from("interventi_mascalcia").update({ aiutante_id: a?.id || null, aiutante_nome: a?.nome || null }).in("id", daAggiornare).then(r => { if(r.error) console.warn("aiutante appuntamenti:", r.error.message); });
  }
  await ofCaricaSpese();
  return true;
}
// giorni passati con lavoro e senza giornata salvata: si chiudono da soli con i predefiniti (max 5 per volta)
let ofChiusuraInCorso = false;
async function ofChiudiGiorniPassati(){
  if(ofChiusuraInCorso || !ofConfigurata() || !OF.sqlOk) return;
  ofChiusuraInCorso = true;
  try{
    const inizio = [isoLocale(new Date(OF.imp.configurata_il)), aggiungiGiorniIso(OGGI(), -14)].sort().pop();
    let fatti = 0;
    for(let d = inizio; d < OGGI() && fatti < 5; d = aggiungiGiorniIso(d, 1)){
      if(OF.giornate[d]) continue;
      const g = await ofGiornataProposta(d);
      if(!g.lavori.some(e => e.stato === "fatto")) continue;
      await ofSalvaGiornata(g, true); fatti++;
    }
    if(fatti && document.getElementById("page-pro-officina")?.classList.contains("active")) ofDisegna();
  } finally { ofChiusuraInCorso = false; }
}

/* ===================== PAGINA ===================== */
async function ofApri(){
  const root = document.getElementById("of-root");
  if(!root) return;
  if(!OF.caricato) root.innerHTML = '<div class="loading"><div class="spinner"></div> Carico la tua officina…</div>';
  await ofCarica(true);
  OF.vista = "home";
  ofDisegna();
  ofChiudiGiorniPassati();
}
function ofDisegna(){
  const root = document.getElementById("of-root");
  if(!root) return;
  if(!OF.sqlOk){ root.innerHTML = `<div class="of-vuoto"><b>🚐 Officina mobile</b><span>Arriva con l'aggiornamento di Equo: tra poco potrai gestire furgone, aiutanti, materiali e spese.</span></div>`; return; }
  if(OF.vista === "mezzo" && ofMezzo(OF.mezzoAperto)) return ofDisegnaMezzo();
  if(!ofConfigurata() && !OF.mezzi.length && !OF.aiutanti.length) return ofDisegnaBenvenuto();
  const m = ofMezzoPred();
  const scad = OF.mezzi.flatMap(scadenzeMezzo).sort((a, b) => (a.giorni ?? 9999) - (b.giorni ?? 9999));
  const t = m ? tagliando(m) : null, rev = m ? scadenzeMezzo(m).find(s => s.k === "revisione") : null;
  root.innerHTML = `
    <div class="of-hero">
      <div class="of-hero-lin"></div>
      <div class="of-k">OFFICINA MOBILE</div>
      <h3>${m ? esc(nomeMezzo(m)) : "Nessun mezzo"}</h3>
      <div class="of-t">${m ? [m.targa, m.km_attuali != null ? fmtKm(m.km_attuali) + " km" : null, ALIM[m.alimentazione]].filter(Boolean).map(esc).join(" · ") : "Aggiungi il tuo furgone per le scadenze e i costi"}</div>
      ${ofDisegnoMezzo(m)}
      <div class="of-pill">${t?.conDati ? `<span>⚙️ Tagliando ${Math.round(t.perc * 100)}%</span>` : ""}${rev ? `<span>📋 Revisione ${rev.giorni < 0 ? "scaduta" : rev.giorni <= 60 ? "tra " + rev.giorni + " gg" : dataScad(rev.data)}</span>` : ""}${!m ? `<span onclick="ofFormMezzo()">+ Aggiungi mezzo</span>` : ""}</div>
    </div>
    <div class="of-oggi" id="of-oggi"><div class="loading"><div class="spinner"></div></div></div>
    ${scad.length ? `<div class="of-sez">Scadenze <span onclick="ofScheda('mezzi')">${OF.mezzi.length > 1 ? "per mezzo" : ""}</span></div>
    <div class="of-scad">${scad.slice(0, 6).map(s => { const st = statoScadenza(s); return `<button type="button" class="of-sc${st.colore === "#b5432f" || st.colore === "#d76b3a" ? " allerta" : ""}" onclick="ofApriMezzo('${s.mezzo.id}')">${anello(st.perc, st.colore)}<span><b>${esc(s.titolo)}</b><small>${esc(testoScadenza(s))}${OF.mezzi.length > 1 ? " · " + esc(nomeMezzo(s.mezzo)) : ""}</small></span></button>`; }).join("")}</div>` : ""}
    <div class="of-tabs" role="tablist">${[["mezzi", "Mezzi"], ["aiutanti", "Aiutanti"], ["materiali", "Materiali"], ["spese", "Spese"]].map(([k, t]) => `<button type="button" role="tab" class="${OF.scheda === k ? "on" : ""}" onclick="ofScheda('${k}')">${t}</button>`).join("")}</div>
    <div id="of-scheda"></div>
    ${!ofConfigurata() ? `<button type="button" class="of-link" onclick="ofOnboarding(1)">Completa la configurazione guidata →</button>` : ""}`;
  ofDisegnaScheda();
  ofDisegnaOggi();
}
function ofDisegnoMezzo(m){
  const carrello = m?.tipo === "carrello", auto = m?.tipo === "auto";
  return `<svg class="of-van" viewBox="0 0 200 100" fill="none" stroke="#e2b867" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${
    auto ? '<path d="M14 70V56c0-5 3-8 8-9l22-4 20-15h56l24 15 20 4c5 1 8 5 8 10v13"/><path d="M68 30l-14 15h72l-12-15z" opacity=".6"/><circle cx="50" cy="74" r="11"/><circle cx="150" cy="74" r="11"/><path d="M61 74h78M14 70h25M161 74h25"/>'
    : carrello ? '<path d="M30 70V40h110v30z"/><path d="M140 62h40"/><circle cx="85" cy="76" r="10"/><path d="M30 70h45M95 70h45"/><path d="M45 48h80M45 58h80" opacity=".5"/>'
    : '<path d="M10 72V38c0-6 4-10 10-10h92l26 22h34c8 0 14 6 14 14v8"/><path d="M112 28v22h52"/><path d="M28 36h66v16H28z" opacity=".6"/><circle cx="48" cy="76" r="11"/><circle cx="160" cy="76" r="11"/><path d="M59 76h90M10 72h27M171 76h15"/><path d="M146 58h12" opacity=".7"/>'
  }<path d="M18 90h170" stroke-dasharray="3 6" opacity=".5"/></svg>`;
}
function ofDisegnaBenvenuto(){
  document.getElementById("of-root").innerHTML = `
    <div class="of-hero of-benv"><div class="of-hero-lin"></div>
      <div class="of-k">NUOVO · OFFICINA MOBILE</div><h3>Il tuo lavoro dietro le quinte</h3>
      <div class="of-t">Furgone e scadenze, aiutanti, ferri e materiali, spese automatiche e guadagno netto. Bastano 2 minuti.</div>
      ${ofDisegnoMezzo(null)}
      <button type="button" class="of-cta" onclick="ofOnboarding(1)">Configura in 4 passi →</button>
    </div>
    <div class="of-passi-anteprima">${[["📍", "Base", "da dove parti al mattino, per i km"], ["🚐", "Mezzi", "furgone, scadenze e tagliando"], ["👥", "Aiutanti", "chi lavora con te e quanto costa"], ["🧲", "Materiali", "ferri, chiodi, prodotti e scorte"]].map(([i, t, s], n) => `<div><span>${i}</span><b>${n + 1} · ${t}</b><small>${s}</small></div>`).join("")}</div>`;
}

async function ofDisegnaOggi(){
  const box = document.getElementById("of-oggi");
  if(!box) return;
  const g = await ofGiornataProposta(OGGI());
  if(!g.salvata && ofScelteOggi) Object.assign(g, ofScelteOggi);
  OF.oggi = g;
  const m = ofMezzo(g.mezzo_id), a = ofAiutante(g.aiutante_id);
  const km = g.km, stima = OF.kmStime[OGGI()];
  const mat = (g.materiali || []).map(x => ({ ...x, m: OF.materiali.find(y => y.id === x.materiale_id) })).filter(x => x.m);
  box.innerHTML = `
    <div class="of-oggi-t"><b>Oggi, ${new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric" })}</b><button type="button" onclick="ofApriGiornata()">${g.salvata ? "Modifica" : "Tocca per cambiare"}</button></div>
    <div class="of-lab">MEZZO</div><div class="of-chips">${OF.mezzi.length ? OF.mezzi.map(x => `<button type="button" class="${x.id === g.mezzo_id ? "on" : ""}" onclick="ofOggiScegli('mezzo','${x.id}')">${icoMezzo(x)} ${esc(nomeMezzo(x))}</button>`).join("") : '<button type="button" onclick="ofFormMezzo()">+ Aggiungi mezzo</button>'}</div>
    <div class="of-lab">AIUTANTE</div><div class="of-chips">${OF.aiutanti.map(x => `<button type="button" class="${x.id === g.aiutante_id ? "on" : ""}" onclick="ofOggiScegli('aiutante','${x.id}')">${esc(x.nome)}${x.id === g.aiutante_id && costoAiutante(x, g) ? " · " + euroTondo(costoAiutante(x, g)) : ""}</button>`).join("")}<button type="button" class="${!g.aiutante_id ? "on" : ""}" onclick="ofOggiScegli('aiutante','')">Da solo</button>${!OF.aiutanti.length ? '<button type="button" onclick="ofFormAiutante()">+ Aiutante</button>' : ""}</div>
    <div class="of-km"><div><small>${stima?.tappe ? `Km di oggi dal giro (${stima.tappe} ${stima.tappe === 1 ? "tappa" : "tappe"}${stima.senzaBase ? "" : " + ritorno"})` : "Km di oggi"}</small><b>${km != null ? fmtKm(km) + " km" : "—"}</b><small>${km && m && costoCarburante(m, km) ? "≈ " + euroTondo(costoCarburante(m, km)) + " di " + (CARBURANTE[m.alimentazione] || "carburante").toLowerCase() : stima?.senzaBase ? "imposta la base per contare anche andata e ritorno" : stima?.tappe === 0 ? "nessuna tappa in agenda oggi" : ""}</small></div><span class="of-beta">BETA</span></div>
    <div class="of-beta-nota">Funzione in Beta · calcoli approssimativi${stima?.mancanti ? ` · ${stima.mancanti} indirizzi non trovati` : ""} · <button type="button" onclick="ofApriGiornata()">correggi</button></div>
    ${mat.length ? `<div class="of-lab">MATERIALI USATI</div><div class="of-chips">${mat.map(x => `<span class="of-chip-f">${esc(x.m.nome)} · ${String(x.quantita).replace(".", ",")} ${esc(UNITA[x.m.unita] || "")}</span>`).join("")}</div>` : ""}
    ${!g.salvata && g.lavori.length ? `<button type="button" class="of-cta piccolo" onclick="ofSalvaOggi()">Salva la giornata</button>` : g.salvata ? '<div class="of-salvata">✓ Giornata salvata: spese aggiornate</div>' : ""}`;
}
let ofScelteOggi = null;   // scelte di oggi non ancora salvate
async function ofOggiScegli(cosa, id){
  const g = OF.oggi; if(!g) return;
  const k = cosa === "mezzo" ? "mezzo_id" : "aiutante_id";
  g[k] = id || null;
  if(g.salvata){ await ofSalvaGiornata(g); showToast("Giornata aggiornata"); }
  else ofScelteOggi = { ...(ofScelteOggi || {}), [k]: g[k] };
  ofDisegnaOggi(); ofAggiornaRiepiloghi(); ofStriscia();
}
async function ofSalvaOggi(){
  const g = OF.oggi; if(!g) return;
  if(await ofSalvaGiornata(g)){ ofScelteOggi = null; showToast("Giornata salvata: spese aggiornate"); ofDisegnaOggi(); ofDisegnaScheda(); ofAggiornaRiepiloghi(); }
}

/* ---- schede ---- */
function ofScheda(k){ OF.scheda = k; OF.vista = "home"; document.querySelectorAll(".of-tabs button").forEach((b, i) => b.classList.toggle("on", ["mezzi", "aiutanti", "materiali", "spese"][i] === k)); ofDisegnaScheda(); }
function ofDisegnaScheda(){
  const box = document.getElementById("of-scheda");
  if(!box) return;
  if(OF.scheda === "mezzi") box.innerHTML = OF.mezzi.map(m => { const s = scadenzeMezzo(m).sort((a, b) => (a.giorni ?? 9999) - (b.giorni ?? 9999))[0];
      return `<button type="button" class="of-riga" onclick="ofApriMezzo('${m.id}')"><span class="of-ic">${icoMezzo(m)}</span><span class="of-c"><b>${esc(nomeMezzo(m))}${m.id === ofMezzoPred()?.id && OF.mezzi.length > 1 ? ' <i class="of-pred">PREDEFINITO</i>' : ""}</b><small>${[TIPI_MEZZO[m.tipo], m.targa, m.km_attuali != null ? fmtKm(m.km_attuali) + " km" : null].filter(Boolean).map(esc).join(" · ")}${s ? " · " + esc(s.titolo.toLowerCase()) + " " + esc(testoScadenza(s)) : ""}</small></span><span class="of-fr">›</span></button>`; }).join("")
    + `<button type="button" class="of-agg" onclick="ofFormMezzo()">+ Aggiungi mezzo</button>`;
  else if(OF.scheda === "aiutanti") box.innerHTML = OF.aiutanti.map(a => `<button type="button" class="of-riga" onclick="ofFormAiutante('${a.id}')"><span class="of-av">${esc((a.nome || "?").trim()[0].toUpperCase())}</span><span class="of-c"><b>${esc(a.nome)}${a.id === OF.imp?.aiutante_predefinito ? ' <i class="of-pred">PREDEFINITO</i>' : ""}</b><small>${euroTondo(a.compenso)} ${COMPENSO[a.compenso_tipo]} · ${ofGiorniAiutanteMese(a.id)} giorni a ${new Date().toLocaleDateString("it-IT", { month: "long" })}</small></span><span class="of-fr">›</span></button>`).join("")
    + `<button type="button" class="of-agg" onclick="ofFormAiutante()">+ Aggiungi aiutante</button>
       <div class="of-nota">Il cliente vede <b>«Intervento eseguito con l'aiutante ${esc(ofAiutantePred()?.nome || OF.aiutanti[0]?.nome || "Marco")}»</b> nel PDF e nel messaggio in chat; nell'appuntamento solo «con ${esc(ofAiutantePred()?.nome || OF.aiutanti[0]?.nome || "Marco")}».</div>`;
  else if(OF.scheda === "materiali"){
    const bassi = OF.materiali.filter(m => m.scorta_minima != null && Number(m.scorta) <= Number(m.scorta_minima));
    box.innerHTML = (bassi.length ? `<div class="of-allerta"><b>Stanno finendo:</b> ${bassi.map(m => `${esc(m.nome)} (${String(m.scorta).replace(".", ",")})`).join(" · ")}</div>` : "")
      + OF.materiali.map(m => { const max = Math.max(Number(m.scorta_minima || 0) * 3, Number(m.scorta) || 0, 1), basso = m.scorta_minima != null && Number(m.scorta) <= Number(m.scorta_minima);
        return `<div class="of-mat"><span class="of-mat-i">${{ ferri: "🧲", chiodi: "📌", prodotti: "🧴", attrezzi: "🛠️", altro: "📦" }[m.categoria]}</span><button type="button" class="of-c" onclick="ofFormMateriale('${m.id}')"><b>${esc(m.nome)}${m.misura ? " · n. " + esc(m.misura) : ""}</b><small>${euroTondo(m.costo)} ${UNITA[m.unita] === "paio" ? "al paio" : "a " + esc(UNITA[m.unita])}</small></button>
          <span class="of-liv${basso ? " basso" : ""}"><i style="width:${Math.round(Math.min(1, Math.max(0, Number(m.scorta) / max)) * 100)}%"></i></span>
          <span class="of-q"><button type="button" onclick="ofScorta('${m.id}',-1)" aria-label="Meno">−</button><b class="${basso ? "rosso" : ""}">${String(Number(m.scorta)).replace(".", ",")}</b><button type="button" onclick="ofScorta('${m.id}',1)" aria-label="Più">+</button></span></div>`; }).join("")
      + `<button type="button" class="of-agg" onclick="ofFormMateriale()">+ Aggiungi materiale</button>`;
  } else ofDisegnaSpese(box);
}
function ofGiorniAiutanteMese(id){ const ym = OGGI().slice(0, 7); return Object.values(OF.giornate).filter(g => g && g.aiutante_id === id && String(g.giorno).startsWith(ym)).length; }
async function ofScorta(id, d){
  const m = OF.materiali.find(x => x.id === id); if(!m) return;
  m.scorta = Math.max(0, Math.round((Number(m.scorta) + d) * 100) / 100);
  ofDisegnaScheda();
  const { error } = await OfDB.salva("officina_materiali", { id, scorta: m.scorta });
  if(error) showToast("Non salvato: " + error.message);
}

/* ---- spese e guadagno netto ---- */
async function ofLavoriMese(ym){
  if(OF.lavoriMese?.ym === ym) return OF.lavoriMese.tot;
  const [y, m] = ym.split("-").map(Number);
  const l = await DB.listInterventiPeriodo(ym + "-01", isoLocale(new Date(y, m, 0))).catch(() => []);
  const tot = l.filter(e => e.stato === "fatto").reduce((t, e) => t + (Number(e.importo) || 0), 0);
  OF.lavoriMese = { ym, tot };
  return tot;
}
async function ofDisegnaSpese(box){
  const ym = OF.mese;
  const spese = OF.spese.filter(s => s.data.startsWith(ym));
  const tot = spese.reduce((t, s) => t + Number(s.importo), 0);
  const perCat = {}; spese.forEach(s => { perCat[s.categoria] = (perCat[s.categoria] || 0) + Number(s.importo); });
  const nasc = typeof incassiNascosti === "function" && incassiNascosti();
  box.innerHTML = `<div class="of-mesi"><button type="button" onclick="ofMese(-1)" aria-label="Mese prima">‹</button><b>${meseNome(ym)}</b><button type="button" onclick="ofMese(1)" aria-label="Mese dopo">›</button></div>
    <div class="of-netto"><div class="of-lab2">GUADAGNO NETTO</div><div class="of-big" id="of-netto-v">${nasc ? "—" : "…"}</div>
      <div class="of-cmp"><span>Lavori fatti<b class="verde" id="of-lavori-v">…</b></span><span>Spese<b class="rosso">− ${euroTondo(tot)}</b></span></div>
      ${tot ? `<div class="of-ciamb">${ofCiambella(perCat, tot)}<div class="of-leg">${Object.entries(perCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div><i style="background:${CAT_SPESA[k][1]}"></i>${CAT_SPESA[k][0]} ${euroTondo(v)}${k === "carburante" ? ' <span class="of-beta">BETA</span>' : ""}</div>`).join("")}</div></div>` : ""}
    </div>
    <div class="of-sez">Spese del mese <span onclick="ofFormSpesa()">+ Spesa</span></div>
    ${spese.length ? spese.map(s => `<button type="button" class="of-voce" onclick="ofFormSpesa('${s.id}')"><span><b>${esc(s.descrizione)}</b><small>${formatDataBreve(s.data)} · ${CAT_SPESA[s.categoria][0]}</small></span><b>${euroTondo(s.importo)}${s.automatica ? '<i class="of-auto">AUTO</i>' : ""}</b></button>`).join("") : '<div class="of-nota">Nessuna spesa in questo mese.</div>'}`;
  if(nasc) return;
  const lav = await ofLavoriMese(ym);
  const lv = document.getElementById("of-lavori-v"), nv = document.getElementById("of-netto-v");
  if(lv) lv.textContent = euroTondo(lav);
  if(nv) nv.textContent = euroTondo(lav - tot);
}
function ofCiambella(perCat, tot){
  const r = 15.9, c = 2 * Math.PI * r; let off = 0;
  const archi = Object.entries(perCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => { const l = v / tot * c; const s = `<circle cx="21" cy="21" r="${r}" fill="none" stroke="${CAT_SPESA[k][1]}" stroke-width="6" stroke-dasharray="${l.toFixed(2)} ${(c - l).toFixed(2)}" stroke-dashoffset="${(-off + c / 4).toFixed(2)}"/>`; off += l; return s; }).join("");
  return `<svg width="88" height="88" viewBox="0 0 42 42" aria-hidden="true"><circle cx="21" cy="21" r="${r}" fill="none" stroke="#eadfc2" stroke-width="6"/>${archi}</svg>`;
}
function ofMese(d){ const [y, m] = OF.mese.split("-").map(Number); const n = new Date(y, m - 1 + d, 1); OF.mese = isoLocale(n).slice(0, 7); ofDisegnaScheda(); }

/* ---- scheda del mezzo ---- */
function ofApriMezzo(id){ OF.vista = "mezzo"; OF.mezzoAperto = id; ofDisegna(); document.getElementById("page-pro-officina")?.scrollTo?.(0, 0); window.scrollTo(0, 0); }
function ofTornaOfficina(){ OF.vista = "home"; ofDisegna(); }
function ofDisegnaMezzo(){
  const m = ofMezzo(OF.mezzoAperto), t = tagliando(m);
  const storia = OF.interventi.filter(i => i.mezzo_id === m.id).sort((a, b) => (a.stato === "da_fare" ? 0 : 1) - (b.stato === "da_fare" ? 0 : 1) || (a.stato === "da_fare" ? a.data.localeCompare(b.data) : b.data.localeCompare(a.data)));
  const scad = scadenzeMezzo(m).filter(s => !s.k.startsWith("int:"));
  document.getElementById("of-root").innerHTML = `
    <div class="of-testa-m"><button type="button" class="of-tondo" onclick="ofTornaOfficina()" aria-label="Indietro">‹</button><div><b>${esc(nomeMezzo(m))}</b><small>${[TIPI_MEZZO[m.tipo], ALIM[m.alimentazione], m.targa].filter(Boolean).map(esc).join(" · ")}</small></div><button type="button" class="of-tondo" onclick="ofFormMezzo('${m.id}')" aria-label="Modifica">✎</button></div>
    <div class="of-netto">
      <div class="of-lab2">TAGLIANDO · ${[t.ogniKm ? "OGNI " + fmtKm(t.ogniKm) + " KM" : null, t.ogniMesi ? t.ogniMesi + " MESI" : null].filter(Boolean).join(" O ") || "INTERVALLO NON IMPOSTATO"}</div>
      ${t.conDati ? `<div class="of-tg-r"><b>${t.kmFatti != null && t.ogniKm ? fmtKm(Math.max(0, t.kmFatti)) + " / " + fmtKm(t.ogniKm) + " km" : Math.round(t.perc * 100) + "%"}</b>${t.ogniKm ? '<span class="of-beta">KM BETA</span>' : ""}</div>
      <div class="of-barra"><i style="width:${Math.round(t.perc * 100)}%"></i></div>
      <div class="of-tg-s"><span>ultimo: ${[m.ultimo_tagliando_km != null ? fmtKm(m.ultimo_tagliando_km) + " km" : null, m.ultimo_tagliando_data ? dataScad(m.ultimo_tagliando_data) : null].filter(Boolean).join(" · ") || "—"}</span><span>${t.data ? "entro " + dataScad(t.data) : ""}</span></div>`
      : '<div class="of-nota" style="margin:6px 0">Scrivi quando hai fatto l\'ultimo tagliando (data e km) per vedere quanto manca.</div>'}
      <div class="of-az"><button type="button" class="btn btn-outline btn-sm" onclick="ofFormMezzo('${m.id}','tagliando')">Modifica intervallo</button><button type="button" class="btn btn-primary btn-sm" onclick="ofFormIntervento('${m.id}',null,'tagliando')">Tagliando fatto</button></div>
    </div>
    <div class="of-scad">${scad.filter(s => s.k !== "tagliando").map(s => { const st = statoScadenza(s); return `<div class="of-sc${st.colore === "#b5432f" || st.colore === "#d76b3a" ? " allerta" : ""}">${anello(st.perc, st.colore)}<span><b>${esc(s.titolo)}</b><small>${esc(testoScadenza(s))}</small></span></div>`; }).join("")}</div>
    <div class="of-sez">Storico e prossime <span onclick="ofFormIntervento('${m.id}')">+ intervento</span></div>
    <div class="of-time">${storia.length ? storia.map(i => `<button type="button" class="of-ev${i.stato === "da_fare" ? " dafare" : ""}" onclick="ofFormIntervento('${m.id}','${i.id}')"><b>${INT_ICO[i.tipo] || "•"} ${esc(i.titolo)}</b> · ${formatDataBreve(i.data)}${i.km ? " · " + fmtKm(i.km) + " km" : ""}<small>${i.stato === "da_fare" ? "Da fare" : INT_TIPI[i.tipo]}${i.importo != null ? " · " + euroTondo(i.importo) + " · spesa registrata" : ""}${i.note ? " · " + esc(i.note) : ""}</small></button>`).join("") : '<div class="of-nota">Ancora nessun intervento: aggiungi tagliandi, revisioni e riparazioni.</div>'}</div>
    <div class="of-box">
      <div class="of-rr"><span><b>Consumo medio</b><small>${m.consumo_l100 ? String(m.consumo_l100).replace(".", ",") + " l/100 km" : "non impostato"}${OF.imp?.prezzo_carburante ? " · " + (CARBURANTE[m.alimentazione] || "carburante").toLowerCase() + " " + String(OF.imp.prezzo_carburante).replace(".", ",") + " €/l" : ""}</small></span><button type="button" class="btn btn-outline btn-sm" onclick="ofFormMezzo('${m.id}')">Modifica</button></div>
      <div class="of-rr"><span><b>Mostra ai clienti</b><small>«${m.tipo === "furgone" ? "Furgone attrezzato " : ""}${esc(nomeMezzo(m))}» nella tua pagina pubblica</small></span><button type="button" class="of-tg${m.mostra_clienti ? " on" : ""}" onclick="ofMostraMezzo('${m.id}')" aria-label="Mostra ai clienti"></button></div>
    </div>`;
}
async function ofMostraMezzo(id){
  const m = ofMezzo(id); if(!m) return;
  m.mostra_clienti = !m.mostra_clienti;
  const { error } = await OfDB.salva("officina_mezzi", { id, mostra_clienti: m.mostra_clienti });
  if(error){ m.mostra_clienti = !m.mostra_clienti; showToast("Non salvato"); }
  else showToast(m.mostra_clienti ? "I clienti vedono il tuo mezzo nella pagina pubblica" : "Mezzo nascosto ai clienti");
  ofDisegna();
}

/* ===================== FINESTRE (una sola, con contenuto che cambia) ===================== */
function ofModale(titolo, corpo, tasti){
  document.getElementById("of-modal-tit").textContent = titolo;
  document.getElementById("of-modal-corpo").innerHTML = corpo;
  document.getElementById("of-modal-tasti").innerHTML = tasti || "";
  document.getElementById("of-modal-err").style.display = "none";
  openModal("modal-officina");
}
function ofErrore(t){ const e = document.getElementById("of-modal-err"); e.textContent = t; e.style.display = "block"; }
const val = id => (document.getElementById(id)?.value ?? "").trim();
const seg = (nome, opz, scelto) => `<div class="of-seg" data-seg="${nome}">${Object.entries(opz).map(([k, t]) => `<button type="button" data-v="${k}" class="${k === scelto ? "on" : ""}" onclick="ofSeg(this)">${t}</button>`).join("")}</div>`;
function ofSeg(b){ b.parentElement.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); const s = b.parentElement.dataset.seg; if(s === "alim") ofMostraBombole(); if(s === "tkm") document.getElementById("of-tkm-altro").style.display = b.dataset.v === "altro" ? "" : "none"; if(s === "ckm") document.getElementById("of-ckm-altro").style.display = b.dataset.v === "altro" ? "" : "none"; if(s === "itipo") ofTitoloDaTipo(b.dataset.v); if(s === "ctipo") ofAggiornaCompenso(); if(s === "mcat") ofAggiornaMisura(); }
const segVal = nome => document.querySelector(`.of-seg[data-seg="${nome}"] .on`)?.dataset.v || null;
const campo = (id, et, v, extra) => `<div class="of-campo"><label for="${id}">${et}</label><input class="input" id="${id}" value="${esc(v ?? "")}" ${extra || ""}></div>`;
const toggle = (id, et, sotto, on) => `<div class="of-rr"><span><b>${et}</b>${sotto ? `<small>${sotto}</small>` : ""}</span><button type="button" class="of-tg${on ? " on" : ""}" id="${id}" onclick="this.classList.toggle('on')" aria-label="${et}"></button></div>`;
const tgOn = id => !!document.getElementById(id)?.classList.contains("on");

/* ---- mezzo ---- */
function ofCampiMezzo(m){
  m = m || { tipo: "furgone", alimentazione: "diesel", tagliando_km: 15000, tagliando_mesi: 12 };
  const tkm = [10000, 15000, 20000, 30000].includes(Number(m.tagliando_km)) ? String(m.tagliando_km) : m.tagliando_km ? "altro" : "";
  const ckm = [120000, 150000, 180000, 240000].includes(Number(m.cinghia_km)) ? String(m.cinghia_km) : m.cinghia_km ? "altro" : "no";
  return `
    <div class="of-campo"><label>TIPO</label>${seg("tipo", TIPI_MEZZO, m.tipo)}</div>
    <div class="of-due">${campo("of-marca", "MARCA", m.marca, 'placeholder="es. Fiat" maxlength="40"')}${campo("of-modello", "MODELLO", m.modello, 'placeholder="es. Ducato" maxlength="60"')}</div>
    <div class="of-due">${campo("of-targa", "TARGA", m.targa, 'placeholder="AA 123 BB" maxlength="15" style="text-transform:uppercase"')}${campo("of-imm", "IMMATRICOLATO", m.immatricolazione ? m.immatricolazione.slice(0, 7) : "", 'type="month"')}</div>
    <div class="of-campo"><label>ALIMENTAZIONE</label>${seg("alim", ALIM, m.alimentazione)}</div>
    <div class="of-due">${campo("of-km", "KM ATTUALI", m.km_attuali, 'inputmode="numeric" placeholder="es. 128400"')}${campo("of-cons", "CONSUMO L/100 KM", m.consumo_l100 != null ? String(m.consumo_l100).replace(".", ",") : "", 'inputmode="decimal" placeholder="es. 9,5"')}</div>
    <div class="of-box" id="of-box-tagliando">
      <div class="of-rr"><span><b>Tagliando ogni</b><small>vale quello che arriva prima, km o mesi</small></span></div>
      ${seg("tkm", { 10000: "10.000", 15000: "15.000 km", 20000: "20.000", 30000: "30.000", altro: "Altro…" }, tkm)}
      <div class="of-campo" id="of-tkm-altro" style="${tkm === "altro" ? "" : "display:none"};margin-top:6px">${campo("of-tkm-n", "KM (es. 12000)", tkm === "altro" ? m.tagliando_km : "", 'inputmode="numeric"').replace('<div class="of-campo">', "").replace(/<\/div>$/, "")}</div>
      <div style="margin-top:6px">${seg("tmesi", { 6: "6 mesi", 12: "12 mesi", 24: "24 mesi", 0: "solo km" }, String(m.tagliando_mesi ?? 0))}</div>
      <div class="of-due" style="margin-top:8px">${campo("of-ult-data", "ULTIMO TAGLIANDO", m.ultimo_tagliando_data, 'type="date"')}${campo("of-ult-km", "A QUANTI KM", m.ultimo_tagliando_km, 'inputmode="numeric"')}</div>
    </div>
    <div class="of-box" id="of-box-cinghia">
      <div class="of-rr"><span><b>Cinghia distribuzione ogni</b><small>vale quello che arriva prima, km o anni · se non l'hai mai cambiata si conta dall'immatricolazione</small></span></div>
      ${seg("ckm", { 120000: "120.000", 150000: "150.000", 180000: "180.000", 240000: "240.000", altro: "Altro…", no: "Catena / non so" }, ckm)}
      <div class="of-campo" id="of-ckm-altro" style="${ckm === "altro" ? "" : "display:none"};margin-top:6px">${campo("of-ckm-n", "KM (es. 200000)", ckm === "altro" ? m.cinghia_km : "", 'inputmode="numeric"').replace('<div class="of-campo">', "").replace(/<\/div>$/, "")}</div>
      <div style="margin-top:6px">${seg("canni", { 5: "5 anni", 6: "6 anni", 8: "8 anni", 10: "10 anni", 0: "solo km" }, String(m.cinghia_anni ?? 0))}</div>
      <div class="of-due" style="margin-top:8px">${campo("of-cin-data", "ULTIMA SOSTITUZIONE", m.ultima_cinghia_data, 'type="date"')}${campo("of-cin-km", "A QUANTI KM", m.ultima_cinghia_km, 'inputmode="numeric"')}</div>
    </div>
    <div class="of-box">
      <div class="of-due">${campo("of-rev", "REVISIONE", m.revisione_data || "", 'type="date"')}${campo("of-ass", "ASSICURAZIONE", m.assicurazione_data, 'type="date"')}</div>
      <div class="of-nota" style="margin:-2px 0 6px">Senza data la revisione si calcola dall'immatricolazione: dopo 4 anni, poi ogni 2.</div>
      <div class="of-due">${campo("of-bollo", "BOLLO", m.bollo_data, 'type="date"')}<div id="of-bombole-box">${campo("of-bomb", "COLLAUDO BOMBOLE", m.bombole_data, 'type="date"')}</div></div>
      ${toggle("of-mostra", "Mostra ai clienti", "marca e modello nella tua pagina pubblica", m.mostra_clienti)}
      ${OF.mezzi.length > (m.id ? 1 : 0) ? toggle("of-pred-m", "Mezzo predefinito", "proposto ogni giorno", m.id ? m.id === OF.imp?.mezzo_predefinito : !OF.mezzi.length) : ""}
    </div>`;
}
function ofMostraBombole(){ const b = document.getElementById("of-bombole-box"); if(b) b.style.visibility = ["gpl", "metano"].includes(segVal("alim")) ? "visible" : "hidden"; }
function ofLeggiMezzo(){
  const tkm = segVal("tkm");
  const imm = val("of-imm");
  const kmAltro = num(val("of-tkm-n")), ckm = segVal("ckm"), ckmAltro = num(val("of-ckm-n"));
  const riga = {
    tipo: segVal("tipo") || "furgone", marca: val("of-marca") || null, modello: val("of-modello") || null, targa: val("of-targa").toUpperCase() || null,
    immatricolazione: imm ? imm + "-01" : null, alimentazione: segVal("alim"),
    km_attuali: num(val("of-km")) != null ? Math.round(num(val("of-km"))) : null, consumo_l100: num(val("of-cons")),
    tagliando_km: tkm === "altro" ? (kmAltro ? Math.round(kmAltro) : null) : tkm ? Number(tkm) : null,
    tagliando_mesi: Number(segVal("tmesi")) || null,
    ultimo_tagliando_data: val("of-ult-data") || null, ultimo_tagliando_km: num(val("of-ult-km")) != null ? Math.round(num(val("of-ult-km"))) : null,
    cinghia_km: ckm === "altro" ? (ckmAltro ? Math.round(ckmAltro) : null) : ckm && ckm !== "no" ? Number(ckm) : null,
    cinghia_anni: Number(segVal("canni")) || null,
    ultima_cinghia_data: val("of-cin-data") || null, ultima_cinghia_km: num(val("of-cin-km")) != null ? Math.round(num(val("of-cin-km"))) : null,
    revisione_data: val("of-rev") || null, assicurazione_data: val("of-ass") || null, bollo_data: val("of-bollo") || null,
    bombole_data: ["gpl", "metano"].includes(segVal("alim")) ? (val("of-bomb") || null) : null, mostra_clienti: tgOn("of-mostra")
  };
  if(!riga.marca && !riga.modello) return { errore: "Scrivi almeno marca o modello." };
  if(riga.tagliando_km != null && (riga.tagliando_km < 1000 || riga.tagliando_km > 100000)) return { errore: "Tagliando: scegli tra 1.000 e 100.000 km." };
  if(riga.cinghia_km != null && (riga.cinghia_km < 10000 || riga.cinghia_km > 400000)) return { errore: "Cinghia: scegli tra 10.000 e 400.000 km." };
  if(riga.km_attuali != null) riga.km_aggiornati_il = OGGI();
  return { riga, predefinito: document.getElementById("of-pred-m") ? tgOn("of-pred-m") : !OF.mezzi.length };
}
function ofFormMezzo(id, focus){
  const m = id ? ofMezzo(id) : null;
  ofForm = { tipo: "mezzo", id };
  ofModale(m ? "Modifica " + nomeMezzo(m) : "Nuovo mezzo", ofCampiMezzo(m),
    `${m ? `<button type="button" class="btn btn-ghost" style="color:var(--red)" onclick="ofArchiviaMezzo('${m.id}')">Archivia</button>` : ""}<button type="button" class="btn btn-primary" onclick="ofSalvaMezzo()">Salva</button>`);
  ofMostraBombole();
  if(focus === "tagliando" || focus === "cinghia") setTimeout(() => document.getElementById("of-box-" + focus)?.scrollIntoView({ block: "center" }), 200);
}
async function ofSalvaMezzo(dalWizard){
  const r = ofLeggiMezzo();
  if(r.errore){ ofErrore(r.errore); return false; }
  const { data, error } = await OfDB.salva("officina_mezzi", { ...(ofForm?.id ? { id: ofForm.id } : {}), ...r.riga, aggiornato_il: new Date().toISOString() });
  if(error){ ofErrore("Non salvato: " + error.message); return false; }
  if(r.predefinito || !OF.imp?.mezzo_predefinito){ const imp = await OfDB.impostazioni({ mezzo_predefinito: data.id }); if(!imp.error) OF.imp = imp.data; }
  const i = OF.mezzi.findIndex(x => x.id === data.id); if(i >= 0) OF.mezzi[i] = data; else OF.mezzi.push(data);
  ofPromemoriaScadenze(data);
  if(!dalWizard){ closeModal("modal-officina"); showToast("Mezzo salvato: scadenze e promemoria aggiornati"); ofDisegna(); ofAggiornaRiepiloghi(); }
  return true;
}
async function ofArchiviaMezzo(id){
  if(!confirm("Archiviare questo mezzo? Lo storico e le spese restano.")) return;
  await OfDB.salva("officina_mezzi", { id, archiviato: true });
  OF.mezzi = OF.mezzi.filter(m => m.id !== id); OF.vista = "home";
  closeModal("modal-officina"); ofDisegna(); ofAggiornaRiepiloghi();
}

/* ---- interventi sul mezzo ---- */
function ofFormIntervento(mezzoId, id, tipo){
  const i = id ? OF.interventi.find(x => x.id === id) : null, m = ofMezzo(mezzoId);
  ofForm = { tipo: "intervento", id, mezzoId };
  const t = i?.tipo || tipo || "altro";
  ofModale(i ? "Modifica intervento" : t === "tagliando" ? "Tagliando fatto" : t === "cinghia" ? "Cinghia cambiata" : "Nuovo intervento", `
    <div class="of-campo"><label>TIPO</label>${seg("itipo", INT_TIPI, t)}</div>
    ${campo("of-i-tit", "DESCRIZIONE", i?.titolo || (t !== "altro" ? INT_TIPI[t] : ""), 'maxlength="80" placeholder="es. Cambio gomme invernali"')}
    <div class="of-campo"><label>STATO</label>${seg("istato", { fatto: "Fatto", da_fare: "Da fare" }, i?.stato || "fatto")}</div>
    <div class="of-due">${campo("of-i-data", "DATA", i?.data || OGGI(), 'type="date"')}${campo("of-i-km", "KM DEL MEZZO", i?.km ?? m?.km_attuali ?? "", 'inputmode="numeric"')}</div>
    <div class="of-due">${campo("of-i-eur", "COSTO €", i?.importo != null ? String(i.importo).replace(".", ",") : "", 'inputmode="decimal" placeholder="es. 380"')}${campo("of-i-note", "OFFICINA / NOTE", i?.note, 'maxlength="300"')}</div>
    <div class="of-nota">Con il costo diventa una spesa «Mezzo». Tagliando, revisione e cinghia fatti aggiornano da soli le scadenze.</div>`,
    `${i ? `<button type="button" class="btn btn-ghost" style="color:var(--red)" onclick="ofEliminaIntervento('${i.id}')">Elimina</button>` : ""}<button type="button" class="btn btn-primary" onclick="ofSalvaIntervento()">Salva</button>`);
}
// cambiando tipo si aggiorna la descrizione, se era ancora quella proposta
function ofTitoloDaTipo(t){
  const el = document.getElementById("of-i-tit"); if(!el) return;
  if(!el.value || Object.values(INT_TIPI).includes(el.value)) el.value = t !== "altro" ? INT_TIPI[t] : "";
}
async function ofSalvaIntervento(){
  const f = ofForm, m = ofMezzo(f.mezzoId);
  const riga = { mezzo_id: f.mezzoId, tipo: segVal("itipo") || "altro", titolo: val("of-i-tit") || INT_TIPI[segVal("itipo")] || "Intervento", stato: segVal("istato") || "fatto",
    data: val("of-i-data") || OGGI(), km: num(val("of-i-km")) != null ? Math.round(num(val("of-i-km"))) : null, importo: num(val("of-i-eur")), note: val("of-i-note") || null };
  const { data, error } = await OfDB.salva("officina_interventi", { ...(f.id ? { id: f.id } : {}), ...riga });
  if(error){ ofErrore("Non salvato: " + error.message); return; }
  const k = OF.interventi.findIndex(x => x.id === data.id); if(k >= 0) OF.interventi[k] = data; else OF.interventi.unshift(data);
  await OfDB.spesaAuto(`int:${data.id}`, riga.stato === "fatto" && riga.importo ? { data: riga.data, categoria: "mezzo", descrizione: `${riga.titolo} · ${nomeMezzo(m)}`.slice(0, 120), importo: riga.importo, mezzo_id: m?.id || null } : null);
  // fatto: il tagliando riparte, la revisione si sposta di 2 anni, le bombole di 4
  if(m && riga.stato === "fatto"){
    const agg = {};
    if(riga.tipo === "tagliando"){ agg.ultimo_tagliando_data = riga.data; if(riga.km != null) agg.ultimo_tagliando_km = riga.km; }
    if(riga.tipo === "cinghia"){ agg.ultima_cinghia_data = riga.data; if(riga.km != null) agg.ultima_cinghia_km = riga.km; }
    if(riga.tipo === "revisione"){ const d = new Date(riga.data + "T12:00"); d.setFullYear(d.getFullYear() + 2); agg.revisione_data = isoLocale(d); }
    if(riga.tipo === "bombole"){ const d = new Date(riga.data + "T12:00"); d.setFullYear(d.getFullYear() + 4); agg.bombole_data = isoLocale(d); }
    if(riga.km != null && (m.km_attuali == null || riga.km > m.km_attuali)){ agg.km_attuali = riga.km; agg.km_aggiornati_il = OGGI(); }
    if(Object.keys(agg).length){ const r = await OfDB.salva("officina_mezzi", { id: m.id, ...agg }); if(!r.error) Object.assign(m, r.data || agg); ofPromemoriaScadenze(m); }
  }
  await ofCaricaSpese();
  closeModal("modal-officina"); showToast("Intervento salvato"); ofDisegna(); ofAggiornaRiepiloghi();
}
async function ofEliminaIntervento(id){
  if(!confirm("Eliminare questo intervento? Si toglie anche la sua spesa.")) return;
  await OfDB.elimina("officina_interventi", id); await OfDB.spesaAuto(`int:${id}`, null);
  OF.interventi = OF.interventi.filter(x => x.id !== id); await ofCaricaSpese();
  closeModal("modal-officina"); ofDisegna();
}

/* ---- aiutante ---- */
function ofCampiAiutante(a, prefisso){
  const p = prefisso || "of-a";
  return `${campo(p + "-nome", "NOME", a?.nome, 'maxlength="60" placeholder="es. Marco Neri"')}
    ${campo(p + "-tel", "TELEFONO (FACOLTATIVO)", a?.telefono, 'inputmode="tel" maxlength="30"')}
    <div class="of-campo"><label>COMPENSO</label>${seg("ctipo", { giornata: "A giornata", cavallo: "A cavallo", ora: "All'ora" }, a?.compenso_tipo || "giornata")}</div>
    ${campo(p + "-eur", "EURO A GIORNATA", a?.compenso != null ? String(a.compenso).replace(".", ",") : "", 'inputmode="decimal" placeholder="es. 80"')}`;
}
function ofAggiornaCompenso(){ const l = document.querySelector('label[for="of-a-eur"]'); if(l) l.textContent = { giornata: "EURO A GIORNATA", cavallo: "EURO A CAVALLO", ora: "EURO ALL'ORA" }[segVal("ctipo")] || "EURO"; }
function ofFormAiutante(id){
  const a = id ? ofAiutante(id) : null;
  ofForm = { tipo: "aiutante", id };
  ofModale(a ? "Modifica aiutante" : "Nuovo aiutante", ofCampiAiutante(a) + toggle("of-a-pred", "Aiutante predefinito", "proposto ogni giorno, lo cambi con un tocco", a ? a.id === OF.imp?.aiutante_predefinito : !OF.aiutanti.length)
    + `<div class="of-nota">Il cliente vede «Intervento eseguito con l'aiutante ${esc(a?.nome || "…")}» nel PDF e nel messaggio in chat.</div>`,
    `${a ? `<button type="button" class="btn btn-ghost" style="color:var(--red)" onclick="ofTogliAiutante('${a.id}')">Togli</button>` : ""}<button type="button" class="btn btn-primary" onclick="ofSalvaAiutante()">Salva</button>`);
  ofAggiornaCompenso();
}
async function ofSalvaAiutante(dalWizard){
  const nome = val("of-a-nome");
  if(!nome){ ofErrore("Scrivi il nome dell'aiutante."); return false; }
  const riga = { nome: nome.slice(0, 60), telefono: val("of-a-tel") || null, compenso_tipo: segVal("ctipo") || "giornata", compenso: num(val("of-a-eur")) || 0 };
  const { data, error } = await OfDB.salva("officina_aiutanti", { ...(ofForm?.id ? { id: ofForm.id } : {}), ...riga });
  if(error){ ofErrore("Non salvato: " + error.message); return false; }
  const i = OF.aiutanti.findIndex(x => x.id === data.id); if(i >= 0) OF.aiutanti[i] = data; else OF.aiutanti.push(data);
  const pred = document.getElementById("of-a-pred") ? tgOn("of-a-pred") : !OF.imp?.aiutante_predefinito;
  if(pred){ const r = await OfDB.impostazioni({ aiutante_predefinito: data.id }); if(!r.error) OF.imp = r.data; }
  else if(OF.imp?.aiutante_predefinito === data.id){ const r = await OfDB.impostazioni({ aiutante_predefinito: null }); if(!r.error) OF.imp = r.data; }
  if(!dalWizard){ closeModal("modal-officina"); showToast("Aiutante salvato"); ofDisegna(); }
  return true;
}
async function ofTogliAiutante(id){
  if(!confirm("Togliere questo aiutante? Le spese e gli appuntamenti passati restano.")) return;
  await OfDB.salva("officina_aiutanti", { id, attivo: false });
  OF.aiutanti = OF.aiutanti.filter(a => a.id !== id);
  if(OF.imp?.aiutante_predefinito === id){ const r = await OfDB.impostazioni({ aiutante_predefinito: null }); if(!r.error) OF.imp = r.data; }
  closeModal("modal-officina"); ofDisegna();
}

/* ---- materiale ---- */
function ofCampiMateriale(m){
  return `${m ? "" : `<div class="of-campo"><label>SCELTE RAPIDE</label><div class="of-seg of-rapidi">${MAT_RAPIDI.map((r, i) => `<button type="button" onclick="ofMatRapido(${i})">${esc(r[0])}</button>`).join("")}</div></div>`}
    <div class="of-campo"><label>CATEGORIA</label>${seg("mcat", CAT_MAT, m?.categoria || "ferri")}</div>
    <div class="of-due">${campo("of-m-nome", "NOME", m?.nome, 'maxlength="60" placeholder="es. Ferri anteriori"')}<div id="of-m-mis-box">${campo("of-m-mis", "MISURA", m?.misura, 'maxlength="20" placeholder="es. 2 o 4x0"')}</div></div>
    <div class="of-due"><div class="of-campo"><label for="of-m-un">UNITÀ</label><select class="input" id="of-m-un">${Object.entries(UNITA).map(([k, t]) => `<option value="${k}"${(m?.unita || "paio") === k ? " selected" : ""}>${t}</option>`).join("")}</select></div>${campo("of-m-eur", "COSTO € PER UNITÀ", m?.costo != null ? String(m.costo).replace(".", ",") : "", 'inputmode="decimal"')}</div>
    <div class="of-due">${campo("of-m-sc", "SCORTA ATTUALE", m?.scorta != null ? String(m.scorta).replace(".", ",") : "", 'inputmode="decimal"')}${campo("of-m-min", "AVVISAMI SOTTO", m?.scorta_minima != null ? String(m.scorta_minima).replace(".", ",") : "", 'inputmode="decimal"')}</div>
    <div class="of-nota">I ferri con la misura uguale a quella dei lavori («ferri nuovi») si scalano da soli dalla scorta e diventano spesa.</div>`;
}
function ofMatRapido(i){
  const [nome, cat, un] = MAT_RAPIDI[i] || [];
  if(!nome) return;
  document.getElementById("of-m-nome").value = nome;
  document.querySelector(`.of-seg[data-seg="mcat"] [data-v="${cat}"]`)?.click();
  const u = document.getElementById("of-m-un"); if(u) u.value = un;
  document.querySelectorAll(".of-rapidi button").forEach((b, k) => b.classList.toggle("on", k === i));
  document.getElementById(cat === "ferri" ? "of-m-mis" : "of-m-eur")?.focus();
}
function ofAggiornaMisura(){ const b = document.getElementById("of-m-mis-box"); if(b) b.style.visibility = segVal("mcat") === "ferri" ? "visible" : "hidden"; }
function ofFormMateriale(id){
  const m = id ? OF.materiali.find(x => x.id === id) : null;
  ofForm = { tipo: "materiale", id };
  ofModale(m ? "Modifica materiale" : "Nuovo materiale", ofCampiMateriale(m),
    `${m ? `<button type="button" class="btn btn-ghost" style="color:var(--red)" onclick="ofTogliMateriale('${m.id}')">Togli</button>` : ""}<button type="button" class="btn btn-primary" onclick="ofSalvaMateriale()">Salva</button>`);
  ofAggiornaMisura();
}
async function ofSalvaMateriale(dalWizard){
  const nome = val("of-m-nome");
  if(!nome){ ofErrore("Scrivi il nome del materiale."); return false; }
  const cat = segVal("mcat") || "altro";
  const riga = { categoria: cat, nome: nome.slice(0, 60), misura: cat === "ferri" ? (val("of-m-mis") || null) : null, unita: val("of-m-un") || "pezzo",
    costo: num(val("of-m-eur")) || 0, scorta: num(val("of-m-sc")) || 0, scorta_minima: num(val("of-m-min")) };
  const { data, error } = await OfDB.salva("officina_materiali", { ...(ofForm?.id ? { id: ofForm.id } : {}), ...riga });
  if(error){ ofErrore("Non salvato: " + error.message); return false; }
  const i = OF.materiali.findIndex(x => x.id === data.id); if(i >= 0) OF.materiali[i] = data; else OF.materiali.push(data);
  if(!dalWizard){ closeModal("modal-officina"); showToast("Materiale salvato"); ofDisegna(); }
  return true;
}
async function ofTogliMateriale(id){
  if(!confirm("Togliere questo materiale dall'elenco?")) return;
  await OfDB.salva("officina_materiali", { id, attivo: false });
  OF.materiali = OF.materiali.filter(m => m.id !== id);
  closeModal("modal-officina"); ofDisegna();
}

/* ---- spesa a mano ---- */
async function ofFormSpesa(id){
  if(!OF.caricato) await ofCarica();
  if(!OF.sqlOk){ showToast("Le spese arrivano con l'aggiornamento di Equo."); return; }
  const s = id ? OF.spese.find(x => x.id === id) : null;
  ofForm = { tipo: "spesa", id };
  ofModale(s ? "Modifica spesa" : "Nuova spesa", `
    <div class="of-campo"><label>CATEGORIA</label>${seg("scat", Object.fromEntries(Object.entries(CAT_SPESA).map(([k, v]) => [k, v[0]])), s?.categoria || "materiali")}</div>
    ${campo("of-s-desc", "DESCRIZIONE", s?.descrizione, 'maxlength="120" placeholder="es. Pneumatici invernali"')}
    <div class="of-due">${campo("of-s-eur", "IMPORTO €", s?.importo != null ? String(s.importo).replace(".", ",") : "", 'inputmode="decimal"')}${campo("of-s-data", "DATA", s?.data || OGGI(), 'type="date"')}</div>
    ${OF.mezzi.length ? `<div class="of-campo"><label for="of-s-mezzo">MEZZO (FACOLTATIVO)</label><select class="input" id="of-s-mezzo"><option value="">—</option>${OF.mezzi.map(m => `<option value="${m.id}"${s?.mezzo_id === m.id ? " selected" : ""}>${esc(nomeMezzo(m))}</option>`).join("")}</select></div>` : ""}
    ${s?.automatica ? '<div class="of-nota">Spesa automatica: se la cambi a mano, si ricalcola quando salvi di nuovo quella giornata.</div>' : ""}`,
    `${s ? `<button type="button" class="btn btn-ghost" style="color:var(--red)" onclick="ofEliminaSpesa('${s.id}')">Elimina</button>` : ""}<button type="button" class="btn btn-primary" onclick="ofSalvaSpesa()">Salva</button>`);
}
async function ofSalvaSpesa(){
  const desc = val("of-s-desc"), imp = num(val("of-s-eur"));
  if(!desc){ ofErrore("Scrivi cosa hai pagato."); return; }
  if(imp == null || imp < 0){ ofErrore("Scrivi l'importo."); return; }
  const riga = { categoria: segVal("scat") || "altro", descrizione: desc.slice(0, 120), importo: Math.round(imp * 100) / 100, data: val("of-s-data") || OGGI(), mezzo_id: val("of-s-mezzo") || null };
  const { error } = await OfDB.salva("officina_spese", { ...(ofForm?.id ? { id: ofForm.id } : {}), ...riga });
  if(error){ ofErrore("Non salvata: " + error.message); return; }
  await ofCaricaSpese();
  closeModal("modal-officina"); showToast("Spesa salvata"); OF.scheda = "spese"; OF.mese = riga.data.slice(0, 7);
  if(document.getElementById("page-pro-officina")?.classList.contains("active")) ofDisegna();
  ofAggiornaRiepiloghi();
}
async function ofEliminaSpesa(id){
  if(!confirm("Eliminare questa spesa?")) return;
  await OfDB.elimina("officina_spese", id); await ofCaricaSpese();
  closeModal("modal-officina"); ofDisegna(); ofAggiornaRiepiloghi();
}

/* ---- giornata (modifica rapida) ---- */
async function ofApriGiornata(giorno){
  if(!OF.caricato) await ofCarica();
  if(!OF.sqlOk){ showToast("Officina mobile arriva con l'aggiornamento di Equo."); return; }
  giorno = giorno || OGGI();
  const g = await ofGiornataProposta(giorno);
  ofForm = { tipo: "giornata", g };
  const stima = OF.kmStime[giorno];
  const mat = g.materiali || [];
  ofModale(giorno === OGGI() ? "La tua giornata" : "Giornata del " + formatDataBreve(giorno), `
    <div class="of-nota" style="margin-top:-4px">Vale per tutti gli appuntamenti del giorno; il singolo appuntamento si cambia aprendolo.</div>
    <div class="of-lab">MEZZO</div><div class="of-chips" data-seg="gm">${OF.mezzi.map(m => `<button type="button" data-v="${m.id}" class="${m.id === g.mezzo_id ? "on" : ""}" onclick="ofSeg(this)">${icoMezzo(m)} ${esc(nomeMezzo(m))}</button>`).join("") || '<span class="of-nota">Nessun mezzo</span>'}</div>
    <div class="of-lab">AIUTANTE</div><div class="of-chips" data-seg="ga">${OF.aiutanti.map(a => `<button type="button" data-v="${a.id}" class="${a.id === g.aiutante_id ? "on" : ""}" onclick="ofSeg(this)">${esc(a.nome)}</button>`).join("")}<button type="button" data-v="" class="${!g.aiutante_id ? "on" : ""}" onclick="ofSeg(this)">Da solo</button></div>
    ${OF.aiutanti.some(a => a.compenso_tipo === "ora") ? campo("of-g-ore", "ORE DI LAVORO (AIUTANTE ALL'ORA)", g.ore ?? 8, 'inputmode="decimal"') : ""}
    <div class="of-lab">CHILOMETRI <span class="of-beta">BETA</span></div>
    <div class="of-km"><div style="flex:1"><small>${stima?.giro?.length ? esc(["Base", ...stima.giro.map(t => t.split(",")[0]), stima.senzaBase ? null : "Base"].filter(Boolean).join(" → ")) : "Nessuna tappa in agenda"}</small>
      <input class="input of-km-inp" id="of-g-km" inputmode="decimal" value="${g.km != null ? String(g.km).replace(".", ",") : ""}" placeholder="km"></div></div>
    <div class="of-beta-nota">Funzione in Beta · calcoli approssimativi sulle strade${g.km_stimati != null ? ` · stima: ${fmtKm(g.km_stimati)} km` : ""}</div>
    <div class="of-lab">MATERIALI USATI</div>
    <div id="of-g-mat">${mat.map((x, i) => ofRigaMatGiorno(x, i)).join("")}</div>
    ${OF.materiali.length ? `<div class="of-due"><select class="input" id="of-g-add">${OF.materiali.map(m => `<option value="${m.id}">${esc(m.nome)}${m.misura ? " n. " + esc(m.misura) : ""}</option>`).join("")}</select><button type="button" class="btn btn-outline btn-sm" onclick="ofAggiungiMatGiorno()">+ Aggiungi</button></div>` : '<div class="of-nota">Aggiungi i materiali nella scheda «Materiali».</div>'}`,
    `<button type="button" class="btn btn-primary" style="width:100%" onclick="ofSalvaGiornataDaForm()">Salva la giornata</button>`);
}
function ofRigaMatGiorno(x, i){
  const m = OF.materiali.find(y => y.id === x.materiale_id);
  return `<div class="of-g-mat" data-i="${i}" data-id="${x.materiale_id}"><span>${esc(m?.nome || "Materiale")}${x.auto ? ' <i class="of-auto">DAI LAVORI</i>' : ""}</span><input class="input" inputmode="decimal" value="${String(x.quantita).replace(".", ",")}"><small>${esc(UNITA[m?.unita] || "")}</small></div>`;
}
function ofAggiungiMatGiorno(){
  const id = val("of-g-add"); if(!id) return;
  const box = document.getElementById("of-g-mat");
  box.insertAdjacentHTML("beforeend", ofRigaMatGiorno({ materiale_id: id, quantita: 1 }, box.children.length));
}
async function ofSalvaGiornataDaForm(){
  const g = ofForm.g;
  g.mezzo_id = document.querySelector('[data-seg="gm"] .on')?.dataset.v || null;
  g.aiutante_id = document.querySelector('[data-seg="ga"] .on')?.dataset.v || null;
  if(document.getElementById("of-g-ore")) g.ore = num(val("of-g-ore"));
  const km = num(val("of-g-km"));
  g.km_corretti = km != null && km !== g.km_stimati;
  g.km = km;
  g.materiali = [...document.querySelectorAll("#of-g-mat .of-g-mat")].map(r => ({ materiale_id: r.dataset.id, quantita: num(r.querySelector("input").value) || 0, auto: !!r.querySelector(".of-auto") }));
  if(await ofSalvaGiornata(g)){
    closeModal("modal-officina"); showToast("Giornata salvata: spese aggiornate");
    if(document.getElementById("page-pro-officina")?.classList.contains("active")) ofDisegna();
    ofAggiornaRiepiloghi(); ofStriscia();
  }
}

/* ===================== PRIMA CONFIGURAZIONE (4 passi) ===================== */
let ofPasso = 1;
async function ofOnboarding(p){
  if(!OF.caricato) await ofCarica();
  if(!OF.sqlOk){ showToast("Officina mobile arriva con l'aggiornamento di Equo."); return; }
  ofPasso = p || 1;
  const barra = `<div class="of-passi">${[1, 2, 3, 4].map(n => `<i class="${n <= ofPasso ? "ok" : ""}"></i>`).join("")}</div><div class="of-passo-k">PASSO ${ofPasso} DI 4 · ${["BASE", "MEZZI", "AIUTANTI", "MATERIALI"][ofPasso - 1]}</div>`;
  const avanti = (t, fn) => `<button type="button" class="btn btn-ghost" onclick="ofOnboarding(${ofPasso + 1 > 4 ? 4 : ofPasso + 1})${ofPasso === 4 ? ";ofFineOnboarding()" : ""}">Salta</button><button type="button" class="btn btn-primary" onclick="${fn}">${t}</button>`;
  if(ofPasso === 1){
    ofForm = { tipo: "base" };
    ofModale("La tua base", barra + `<div class="of-nota">Da dove parti la mattina (casa o officina). Serve a contare i chilometri del giro, andata e ritorno compresi.</div>
      ${campo("of-b-ind", "INDIRIZZO", OF.imp?.base_indirizzo, 'maxlength="300" placeholder="es. Via Roma 10, Colleferro"')}
      <div id="of-b-ind-pos-nota" class="pos-nota"></div>
      <button type="button" class="of-link" onclick="usaPosizioneQui('of-b-ind', this)">📍 Usa la mia posizione attuale</button>
      ${campo("of-b-carb", "PREZZO DEL CARBURANTE €/L (FACOLTATIVO)", OF.imp?.prezzo_carburante != null ? String(OF.imp.prezzo_carburante).replace(".", ",") : "", 'inputmode="decimal" placeholder="es. 1,72"')}
      <div class="of-nota">Serve per stimare il costo dei km (Beta). Lo cambi quando vuoi.</div>`, avanti("Avanti · Mezzi →", "ofSalvaBase()"));
  } else if(ofPasso === 2){
    ofForm = { tipo: "mezzo", id: OF.mezzi[0]?.id || null };
    ofModale("Il tuo furgone", barra + `<div class="of-nota">Lo usiamo per le scadenze e per stimare i costi dei chilometri. Puoi aggiungere altri mezzi dopo.</div>` + ofCampiMezzo(OF.mezzi[0]), avanti("Avanti · Aiutanti →", "ofPassoMezzo()"));
    ofMostraBombole();
  } else if(ofPasso === 3){
    ofForm = { tipo: "aiutante" };
    ofModale("Chi lavora con te", barra + `<div class="of-nota">Aggiungi i tuoi aiutanti: il compenso diventa una spesa automatica nei giorni in cui lavorano con te.</div>
      <div id="of-w-lista">${OF.aiutanti.map(a => `<div class="of-w-r">👤 <b>${esc(a.nome)}</b> · ${euroTondo(a.compenso)} ${COMPENSO[a.compenso_tipo]}${a.id === OF.imp?.aiutante_predefinito ? ' <i class="of-pred">PREDEFINITO</i>' : ""}</div>`).join("")}</div>
      ${ofCampiAiutante(null)}<button type="button" class="btn btn-outline btn-sm" style="width:100%;margin:2px 0 6px" onclick="ofWizardAggiungi('aiutante')">+ Aggiungi questo aiutante</button>`,
      `<button type="button" class="btn btn-ghost" onclick="ofOnboarding(4)">${OF.aiutanti.length ? "Avanti" : "Lavoro da solo"}</button><button type="button" class="btn btn-primary" onclick="ofPassoAiutante()">Avanti · Materiali →</button>`);
    ofAggiornaCompenso();
  } else {
    ofForm = { tipo: "materiale" };
    ofModale("Ferri e materiali", barra + `<div class="of-nota">Ferri (per misura), chiodi e prodotti con costo e scorta: ti avviso quando stanno finendo e diventano spese da soli.</div>
      <div id="of-w-lista">${OF.materiali.map(m => `<div class="of-w-r">${{ ferri: "🧲", chiodi: "📌", prodotti: "🧴", attrezzi: "🛠️", altro: "📦" }[m.categoria]} <b>${esc(m.nome)}${m.misura ? " n. " + esc(m.misura) : ""}</b> · ${euroTondo(m.costo)} · scorta ${String(m.scorta).replace(".", ",")}</div>`).join("")}</div>
      ${ofCampiMateriale(null)}<button type="button" class="btn btn-outline btn-sm" style="width:100%;margin:2px 0 6px" onclick="ofWizardAggiungi('materiale')">+ Aggiungi questo materiale</button>`,
      `<button type="button" class="btn btn-ghost" onclick="ofFineOnboarding()">Salta</button><button type="button" class="btn btn-primary" onclick="ofPassoMateriale()">Fine</button>`);
    ofAggiornaMisura();
  }
}
async function ofSalvaBase(){
  const ind = val("of-b-ind");
  const xy = coordDaIndirizzo(ind);
  const r = await OfDB.impostazioni({ base_indirizzo: ind || null, base_lat: xy?.lat ?? null, base_lon: xy?.lon ?? null, prezzo_carburante: num(val("of-b-carb")) });
  if(r.error){ ofErrore("Non salvato: " + r.error.message); return; }
  OF.imp = r.data; OF.kmStime = {};
  ofOnboarding(2);
}
async function ofPassoMezzo(){ if(!val("of-marca") && !val("of-modello")) return ofOnboarding(3); if(await ofSalvaMezzo(true)) ofOnboarding(3); }
async function ofWizardAggiungi(tipo){
  ofForm = { tipo };
  const ok = tipo === "aiutante" ? await ofSalvaAiutante(true) : await ofSalvaMateriale(true);
  if(ok){ showToast(tipo === "aiutante" ? "Aiutante aggiunto" : "Materiale aggiunto"); ofOnboarding(ofPasso); }
}
async function ofPassoAiutante(){ if(val("of-a-nome") && !(await ofSalvaAiutante(true))) return; ofOnboarding(4); }
async function ofPassoMateriale(){ if(val("of-m-nome") && !(await ofSalvaMateriale(true))) return; ofFineOnboarding(); }
async function ofFineOnboarding(){
  const r = await OfDB.impostazioni({ configurata_il: OF.imp?.configurata_il || new Date().toISOString() });
  if(!r.error) OF.imp = r.data;
  closeModal("modal-officina");
  showToast("Officina mobile pronta 🚐");
  if(typeof showPage === "function" && !document.getElementById("page-pro-officina")?.classList.contains("active")) showPage("pro-officina");
  else ofDisegna();
  ofAggiornaRiepiloghi();
}

/* ===================== HOME, AGENDA, APPUNTAMENTI ===================== */
// riga in Home sotto Incassi: «Revisione tra 12 giorni · oggi con Marco · 86 km»
async function ofAggiornaRiepiloghi(){
  const el = document.getElementById("hm-r-off");
  if(!el) return;
  if(!OF.caricato) await ofCarica();
  if(!OF.sqlOk){ el.textContent = "furgone, aiutanti, materiali e spese"; return; }
  if(!ofConfigurata() && !OF.mezzi.length){ el.textContent = "Configura furgone, aiutanti e materiali"; return; }
  const s = OF.mezzi.flatMap(scadenzeMezzo).filter(x => x.giorni != null).sort((a, b) => a.giorni - b.giorni)[0];
  const g = OF.giornate[OGGI()] || { aiutante_id: ofAiutantePred()?.id };
  const a = ofAiutante(g.aiutante_id), km = g.km ?? OF.kmStime[OGGI()]?.km;
  el.textContent = [s ? `${s.titolo} ${testoScadenza(s)}` : null, a ? "oggi con " + a.nome : "oggi da solo", km ? fmtKm(km) + " km" : null].filter(Boolean).join(" · ");
}
// striscia in Agenda (oggi): «🚐 Ducato · con Marco · 86 km» → modifica rapida
async function ofStriscia(){
  const el = document.getElementById("ag-officina");
  if(!el) return;
  if(!OF.caricato) await ofCarica();
  if(!OF.sqlOk || (!ofConfigurata() && !OF.mezzi.length)){ el.innerHTML = ""; return; }
  const g = OF.giornate[OGGI()] || { mezzo_id: ofMezzoPred()?.id, aiutante_id: ofAiutantePred()?.id };
  const m = ofMezzo(g.mezzo_id), a = ofAiutante(g.aiutante_id), km = g.km ?? OF.kmStime[OGGI()]?.km;
  el.innerHTML = `<button type="button" class="of-striscia" onclick="ofApriGiornata()"><span class="of-k">🚐 OGGI IN OFFICINA MOBILE</span><b>${esc(m ? nomeMezzo(m) : "Nessun mezzo")} · ${a ? "con " + esc(a.nome) : "da solo"}${km ? " · " + fmtKm(km) + " km" : ""}</b><small>tocca per cambiare</small></button>`;
}
// appuntamento: aiutante (predefinito = quello della giornata), campi da salvare
function ofAiutantePerData(giorno){ const g = OF.giornate[giorno]; return g ? ofAiutante(g.aiutante_id) : ofAiutantePred(); }
async function ofPreparaAiutanteAppuntamento(intervento){
  const box = document.getElementById("intervento-aiutante-box"), sel = document.getElementById("intervento-aiutante");
  if(!box || !sel) return;
  if(!OF.caricato) await ofCarica().catch(() => {});
  if(!OF.sqlOk || !OF.aiutanti.length){ box.style.display = "none"; sel.value = ""; return; }
  box.style.display = "";
  const giorno = document.getElementById("intervento-data")?.value || OGGI();
  const scelto = intervento ? (intervento.aiutante_id || "") : (ofAiutantePerData(giorno)?.id || "");
  const extra = intervento?.aiutante_id && !ofAiutante(intervento.aiutante_id) ? `<option value="${intervento.aiutante_id}">${esc(intervento.aiutante_nome || "Aiutante")}</option>` : "";
  sel.innerHTML = '<option value="">Da solo</option>' + extra + OF.aiutanti.map(a => `<option value="${a.id}">${esc(a.nome)}</option>`).join("");
  sel.value = scelto;
  sel.dataset.toccato = "";
}
function ofAggiornaAiutanteData(){
  const sel = document.getElementById("intervento-aiutante");
  if(!sel || sel.dataset.toccato || typeof interventoInModifica !== "undefined" && interventoInModifica?.id) return;
  const giorno = document.getElementById("intervento-data")?.value || OGGI();
  const a = ofAiutantePerData(giorno);
  sel.value = a && [...sel.options].some(o => o.value === a.id) ? a.id : "";
}
async function ofSalvaSpesaDaHammer(x){
  if(!OF.caricato) await ofCarica().catch(() => {});
  if(!OF.sqlOk) return { error: { message: "Officina mobile arriva con l'aggiornamento di Equo" } };
  const riga = { categoria: CAT_SPESA[x?.categoria] ? x.categoria : "altro", descrizione: String(x?.descrizione || "Spesa").slice(0, 120),
    importo: Math.round(Number(x?.importo || 0) * 100) / 100, data: /^\d{4}-\d{2}-\d{2}$/.test(x?.data || "") ? x.data : OGGI(), mezzo_id: ofMezzoPred()?.id || null };
  const { error } = await OfDB.salva("officina_spese", riga);
  if(error) return { error };
  await ofCaricaSpese();
  if(document.getElementById("page-pro-officina")?.classList.contains("active")) ofDisegna();
  ofAggiornaRiepiloghi();
  return { error: null };
}
function ofCampiAiutanteIntervento(inModifica){
  const box = document.getElementById("intervento-aiutante-box"), sel = document.getElementById("intervento-aiutante");
  if(!OF.sqlOk || !box || box.style.display === "none" || !sel) return {};
  const id = sel.value || null;
  if(!id && !inModifica?.aiutante_id && !sel.dataset.toccato) return {};
  const a = ofAiutante(id);
  return { aiutante_id: id, aiutante_nome: a?.nome || (id ? inModifica?.aiutante_nome || null : null) };
}

// registrazione rimandata: questo modulo gira prima del nucleo (020-nav), dove nasce quandoApriPagina
setTimeout(() => quandoApriPagina(p => {
  if(p === "pro-officina") ofApri();
  if(p === "pro-agenda") ofStriscia();
  if(p === "pro-home") ofAggiornaRiepiloghi();
}), 0);

export { OF, ofMatRapido, ofTitoloDaTipo, ofAggiornaAiutanteData, ofSalvaSpesaDaHammer, ofAggiornaRiepiloghi, ofAggiungiMatGiorno, ofApri, ofApriGiornata, ofApriMezzo, ofArchiviaMezzo, ofCampiAiutanteIntervento, ofEliminaIntervento, ofEliminaSpesa,
  ofFineOnboarding, ofFormAiutante, ofFormIntervento, ofFormMateriale, ofFormMezzo, ofFormSpesa, ofMese, ofMostraMezzo, ofOggiScegli, ofOnboarding, ofPassoAiutante,
  ofPassoMateriale, ofPassoMezzo, ofPreparaAiutanteAppuntamento, ofSalvaAiutante, ofSalvaBase, ofSalvaGiornataDaForm, ofSalvaIntervento, ofSalvaMateriale, ofSalvaMezzo,
  ofSalvaOggi, ofSalvaSpesa, ofScheda, ofScorta, ofSeg, ofStriscia, ofTogliAiutante, ofTogliMateriale, ofTornaOfficina, ofWizardAggiungi };
