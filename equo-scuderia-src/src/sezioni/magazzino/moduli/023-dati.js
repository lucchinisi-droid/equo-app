// Equo App · magazzino · modulo (moduli ES, costruiti con Vite in ruoli/magazzino/costruito.js)
import { magDemoSeed } from "./036-dati-demo.js";
/* ---------------- dati ---------------- */
async function loadMagazzino(){
  if(!currentCentro) return;
  if(DEMO_MODE){
    if(!demoState.mag) demoState.mag = magDemoSeed();
    Object.assign(mag, JSON.parse(JSON.stringify(demoState.mag)));
  } else {
    const cid = currentCentro.id;
    const [a, m, u, f, o, kc] = await Promise.all([
      sb.from("mag_articoli").select("*").eq("centro_id", cid).eq("archiviato", false).order("nome"),
      sb.from("mag_movimenti").select("*").eq("centro_id", cid).order("created_at", { ascending: false }).limit(5000),
      sb.from("mag_ubicazioni").select("*").eq("centro_id", cid).order("ordine").order("nome"),
      sb.from("mag_fornitori").select("*").eq("centro_id", cid).eq("archiviato", false).order("nome"),
      sb.from("mag_ordini").select("*").eq("centro_id", cid).order("created_at", { ascending: false }).limit(100),
      sb.from("mag_categorie").select("*").eq("centro_id", cid).order("ordine").order("nome"),
    ]);
    [a, m, u, f, o].forEach(r => { if(r.error) console.error("magazzino:", r.error); });
    mag.articoli = a.data || []; mag.movimenti = m.data || []; mag.ubicazioni = u.data || [];
    mag.fornitori = f.data || []; mag.ordini = o.data || [];
    if(kc.error) console.error("magazzino categorie:", kc.error);
    mag.categorie = kc.data || [];
  }
  magCalcola();
  mag.caricato = true;
}

function magCalcola(){
  const oggi = oggiLocaleIso();
  const da30 = new Date(Date.now() - 30 * 86400000).toISOString();
  const calc = {};
  mag.articoli.forEach(a => { calc[a.id] = { giacenza: 0, lotti: {}, consumo30: 0, ultimoMov: null }; });
  // i movimenti arrivano dal più recente al più vecchio
  mag.movimenti.forEach(m => {
    const c = calc[m.articolo_id]; if(!c) return;
    const q = Number(m.quantita || 0);
    const delta = m.tipo === "carico" ? q : m.tipo === "scarico" ? -q : m.tipo === "rettifica" ? q : 0;
    c.giacenza += delta;
    if(!c.ultimoMov) c.ultimoMov = m.created_at;
    if(m.tipo === "scarico" && m.created_at >= da30) c.consumo30 += q;
    if(m.lotto || m.scadenza){
      const k = (m.lotto || "—") + "|" + (m.scadenza || "");
      const l = c.lotti[k] = c.lotti[k] || { lotto: m.lotto || null, scadenza: m.scadenza || null, qta: 0 };
      l.qta += delta;
    }
  });
  mag.articoli.forEach(a => {
    const c = calc[a.id];
    c.giacenza = Math.round(c.giacenza * 1000) / 1000;
    c.lottiAttivi = Object.values(c.lotti).filter(l => l.qta > 0.0001).sort((x, y) => (x.scadenza || "9999").localeCompare(y.scadenza || "9999"));
    c.mediaGiorno = c.consumo30 / 30;
    c.copertura = c.mediaGiorno > 0 ? Math.floor(c.giacenza / c.mediaGiorno) : null;
    c.valore = Math.max(c.giacenza, 0) * Number(a.costo_unitario || 0);
    const soglia = Number(a.soglia_minima || 0);
    const scaduti = c.lottiAttivi.filter(l => l.scadenza && l.scadenza < oggi);
    const inScadenza = c.lottiAttivi.filter(l => l.scadenza && l.scadenza >= oggi && magGiorniA(l.scadenza) <= 30);
    c.scaduti = scaduti; c.inScadenza = inScadenza;
    const durevole = magCats()[a.categoria]?.durevole;
    let stato = "verde", motivo = "In ordine";
    if(!durevole && c.giacenza <= 0){ stato = "rosso"; motivo = "Esaurito"; }
    else if(soglia > 0 && c.giacenza < soglia){ stato = "rosso"; motivo = "Sotto la soglia minima"; }
    else if(scaduti.length){ stato = "rosso"; motivo = "Lotto scaduto"; }
    else if(a.condizione === "da_sostituire"){ stato = "rosso"; motivo = "Da sostituire"; }
    else if(soglia > 0 && c.giacenza < soglia * 1.5){ stato = "giallo"; motivo = "In esaurimento"; }
    else if(c.copertura !== null && c.copertura < 7 && !durevole){ stato = "giallo"; motivo = `Scorta per ${c.copertura} ${c.copertura === 1 ? "giorno" : "giorni"}`; }
    else if(inScadenza.length){ stato = "giallo"; motivo = "Lotto in scadenza"; }
    else if(a.condizione === "da_riparare" || a.condizione === "da_lavare"){ stato = "giallo"; motivo = MAG_COND[a.condizione]; }
    c.stato = stato; c.motivo = motivo;
    // quantità suggerita per il riordino
    const target = Number(a.scorta_ottimale || 0) || soglia * 2;
    c.daOrdinare = (stato !== "verde" && !durevole && target > c.giacenza) ? Math.ceil(target - Math.max(c.giacenza, 0)) : 0;
  });
  mag.calc = calc;
  magAggiornaContatore();
}

function magStatoGruppo(articoli){
  const st = articoli.map(a => mag.calc[a.id]?.stato || "verde");
  return { rosso: st.filter(s => s === "rosso").length, giallo: st.filter(s => s === "giallo").length, verde: st.filter(s => s === "verde").length,
    colore: st.includes("rosso") ? "rosso" : st.includes("giallo") ? "giallo" : "verde" };
}

function magAggiornaContatore(){
  const g = magStatoGruppo(mag.articoli);
  if(typeof impostaContatoreNav === "function") impostaContatoreNav("magazzino-nav-badge", g.rosso + g.giallo, g.colore);
}


export { loadMagazzino, magCalcola, magStatoGruppo };
