// Equo App · magazzino · modulo (moduli ES, costruiti con Vite in ruoli/magazzino/costruito.js)
import { magStatoGruppo } from "./023-dati.js";
import { magVista } from "./025-vista-semplice-completa-magazzino-e-stat.js";
import { magRenderCategorie } from "./027-categorie-e-sottocategorie.js";
import { magRender } from "./028-articoli.js";
/* ---------------- colpo d'occhio ---------------- */
function magRenderHero(){
  const g = magStatoGruppo(mag.articoli);
  const tot = mag.articoli.length;
  const perc = tot ? Math.round(g.verde / tot * 100) : 100;
  const R = 62, C = 2 * Math.PI * R;
  const seg = (n, col, off) => n ? `<circle cx="75" cy="75" r="${R}" fill="none" stroke="${col}" stroke-width="14" stroke-dasharray="${(n / tot) * C - 3} ${C}" stroke-dashoffset="${-off}" stroke-linecap="round"/>` : "";
  let off = 0; let archi = "";
  [[g.verde, "#2f8a4e"], [g.giallo, "#e0a100"], [g.rosso, "var(--danger)"]].forEach(([n, col]) => { if(tot){ archi += seg(n, col, off); off += (n / tot) * C; } });
  document.getElementById("mag-ring").innerHTML = `<svg viewBox="0 0 150 150"><circle cx="75" cy="75" r="${R}" fill="none" stroke="var(--muted-bg)" stroke-width="14"/>${archi}</svg>
    <div class="centro"><b>${tot ? perc + "%" : "—"}</b><span>${tot ? "in ordine" : "vuoto"}</span></div>`;
  document.getElementById("mag-legenda").innerHTML = `<span><i class="mag-sem verde"></i><b>${g.verde}</b> ok</span><span><i class="mag-sem giallo"></i><b>${g.giallo}</b> attenzione</span><span><i class="mag-sem rosso"></i><b>${g.rosso}</b> critici</span>`;

  // KPI
  const valore = mag.articoli.reduce((t, a) => t + (mag.calc[a.id]?.valore || 0), 0);
  const riordino = mag.articoli.filter(a => mag.calc[a.id]?.daOrdinare > 0);
  const lottiScad = mag.articoli.reduce((t, a) => t + (mag.calc[a.id]?.inScadenza.length || 0) + (mag.calc[a.id]?.scaduti.length || 0), 0);
  const settimane = magConsumiSettimane();
  const cons30 = mag.movimenti.filter(m => m.tipo === "scarico" && m.created_at >= new Date(Date.now() - 30 * 86400000).toISOString())
    .reduce((t, m) => t + Number(m.quantita || 0) * Number((mag.articoli.find(a => a.id === m.articolo_id)?.costo_unitario) || 0), 0);
  const spark = magSparkline(settimane.map(s => s.totale));
  const kpi = (cls, icon, l, v, s, onclick, extra = "") => `<div class="mag-kpi ${cls}" onclick="${onclick}"><div class="l"><i class="fa-solid ${icon}"></i> ${l}</div><div class="v">${v}</div><div class="s">${s}</div>${extra}</div>`;
  document.getElementById("mag-kpis").innerHTML =
    kpi("rosso", "fa-triangle-exclamation", "Critici", g.rosso, g.rosso ? "esauriti o sotto soglia" : "nessuno 👏", "magFiltraStato('rosso')") +
    kpi("giallo", "fa-hourglass-half", "Attenzione", g.giallo, "in esaurimento o da controllare", "magFiltraStato('giallo')") +
    kpi("blu", "fa-truck-ramp-box", "Da riordinare", riordino.length, riordino.length ? `${new Set(riordino.map(a => a.fornitore_id || "-")).size} fornitori` : "tutto coperto", "magVista('ordini')") +
    kpi(lottiScad ? "giallo" : "verde", "fa-calendar-xmark", "Lotti in scadenza", lottiScad, "scaduti o entro 30 giorni", "magFiltraStato('scadenze')") +
    kpi("verde", "fa-coins", "Valore scorte", magEuro(valore), `consumi 30 gg: ${magEuro(cons30)}`, "magFiltraStato('')", spark);

  // Da fare adesso
  const todo = [];
  const perForn = {};
  riordino.forEach(a => { const k = a.fornitore_id || "-"; (perForn[k] = perForn[k] || []).push(a); });
  Object.entries(perForn).forEach(([fid, arts]) => {
    const f = mag.fornitori.find(x => x.id === fid);
    todo.push({ sem: arts.some(a => mag.calc[a.id].stato === "rosso") ? "rosso" : "giallo", t: `Riordina ${arts.length} ${arts.length === 1 ? "articolo" : "articoli"}${f ? " da " + escapeHtml(f.nome) : ""}`,
      s: arts.slice(0, 3).map(a => escapeHtml(a.nome)).join(", ") + (arts.length > 3 ? "…" : ""), btn: `<button class="btn btn-sm btn-outline" onclick="magVista('ordini')">Prepara</button>` });
  });
  mag.articoli.forEach(a => {
    const c = mag.calc[a.id];
    c.scaduti.forEach(l => todo.push({ sem: "rosso", t: `${escapeHtml(a.nome)}: lotto scaduto`, s: `${l.lotto ? "Lotto " + escapeHtml(l.lotto) + " · " : ""}scaduto il ${magDataIt(l.scadenza)} · ${magFmt(l.qta)} ${escapeHtml(a.unita)}`, btn: `<button class="btn btn-sm btn-outline" onclick="magApriDettaglio('${a.id}')">Vedi</button>` }));
    c.inScadenza.forEach(l => todo.push({ sem: "giallo", t: `${escapeHtml(a.nome)}: scade tra ${magGiorniA(l.scadenza)} gg`, s: `${l.lotto ? "Lotto " + escapeHtml(l.lotto) + " · " : ""}${magFmt(l.qta)} ${escapeHtml(a.unita)} · usalo per primo`, btn: `<button class="btn btn-sm btn-outline" onclick="magApriDettaglio('${a.id}')">Vedi</button>` }));
    if(["da_riparare","da_lavare","da_sostituire"].includes(a.condizione)) todo.push({ sem: a.condizione === "da_sostituire" ? "rosso" : "giallo", t: `${escapeHtml(a.nome)}: ${MAG_COND[a.condizione].toLowerCase()}`, s: magUbiNome(a.ubicazione_id) || "", btn: `<button class="btn btn-sm btn-outline" onclick="magApriDettaglio('${a.id}')">Vedi</button>` });
  });
  const inviati = mag.ordini.filter(o => o.stato === "inviato");
  inviati.forEach(o => { const f = mag.fornitori.find(x => x.id === o.fornitore_id); todo.push({ sem: "giallo", t: `Ordine in arrivo${f ? " da " + escapeHtml(f.nome) : ""}`, s: `${(o.righe || []).length} righe · inviato il ${magDataIt(o.inviato_at)}`, btn: `<button class="btn btn-sm btn-outline" onclick="magRiceviOrdine('${o.id}')">Ricevuto</button>` }); });
  todo.sort((x, y) => (x.sem === "rosso" ? 0 : 1) - (y.sem === "rosso" ? 0 : 1));
  document.getElementById("mag-todo").innerHTML = todo.length ? todo.slice(0, 12).map(x => `
    <div class="mag-todo-item"><i class="mag-sem ${x.sem}${x.sem === "rosso" ? " pulse" : ""}"></i><div class="t"><b>${x.t}</b><small>${escapeHtml(x.s)}</small></div>${x.btn}</div>`).join("")
    : `<div class="mag-todo-vuoto"><i class="fa-solid fa-circle-check" style="color:#2f8a4e;font-size:22px"></i> Tutto in ordine: nessuna scorta critica, nessun lotto in scadenza.</div>`;

  // grafico consumi (valore € a settimana, per categoria)
  const max = Math.max(1, ...settimane.map(s => s.totale));
  const catUsate = [...new Set(settimane.flatMap(s => Object.keys(s.perCat)))];
  document.getElementById("mag-bars").innerHTML = settimane.map(s => `
    <div class="mag-bar" title="${s.etichetta}: ${magEuro(s.totale)}">
      <div class="col" style="height:${Math.max(3, s.totale / max * 100)}%">${catUsate.map(k => s.perCat[k] ? `<i style="height:${s.perCat[k] / (s.totale || 1) * 100}%;background:${magCats()[k].colore}"></i>` : "").join("")}</div>
      <small>${s.etichetta}</small></div>`).join("");
  document.getElementById("mag-bars-leg").innerHTML = catUsate.length
    ? catUsate.map(k => `<span><i style="background:${magCats()[k].colore}"></i>${escapeHtml(magCats()[k].nome)}</span>`).join("")
    : "<span>Registra gli scarichi per vedere i consumi (inserisci anche il costo unitario degli articoli).</span>";
}
function magConsumiSettimane(){
  const out = [];
  const lun = new Date(); lun.setHours(0, 0, 0, 0); lun.setDate(lun.getDate() - ((lun.getDay() + 6) % 7));
  for(let i = 7; i >= 0; i--){
    const da = new Date(lun); da.setDate(da.getDate() - i * 7);
    const a = new Date(da); a.setDate(a.getDate() + 7);
    const s = { etichetta: da.getDate() + "/" + (da.getMonth() + 1), totale: 0, perCat: {} };
    mag.movimenti.forEach(m => {
      if(m.tipo !== "scarico") return;
      const t = new Date(m.created_at); if(t < da || t >= a) return;
      const art = mag.articoli.find(x => x.id === m.articolo_id); if(!art) return;
      const v = Number(m.quantita || 0) * Number(art.costo_unitario || 0);
      s.totale += v; s.perCat[art.categoria] = (s.perCat[art.categoria] || 0) + v;
    });
    out.push(s);
  }
  return out;
}
function magSparkline(valori){
  if(!valori.some(v => v > 0)) return "";
  const max = Math.max(...valori), w = 70, h = 26;
  const pts = valori.map((v, i) => `${(i / (valori.length - 1) * w).toFixed(1)},${(h - 2 - v / max * (h - 4)).toFixed(1)}`).join(" ");
  return `<svg class="spark" viewBox="0 0 ${w} ${h}"><polyline points="${pts}" fill="none" stroke="#2f8a4e" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}
function magFiltraStato(s){
  magVista("giacenze");
  magUI.cat = "tutte"; magUI.sub = "";
  document.getElementById("mag-filtro").value = s;
  magRenderCategorie(); magRender();
  document.getElementById("mag-cats").scrollIntoView({ behavior: "smooth", block: "start" });
}


export { magFiltraStato, magRenderHero };
