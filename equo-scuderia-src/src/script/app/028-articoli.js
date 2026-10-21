/* ---------------- articoli ---------------- */
function magRender(){
  const grid = document.getElementById("mag-grid");
  if(!grid) return;
  document.getElementById("mag-vista-griglia").classList.toggle("active", magUI.layout === "griglia");
  document.getElementById("mag-vista-elenco").classList.toggle("active", magUI.layout === "elenco");
  grid.classList.toggle("mag-list", magUI.layout === "elenco");
  const q = (document.getElementById("mag-cerca").value || "").trim().toLowerCase();
  const filtro = document.getElementById("mag-filtro").value;
  const ordina = document.getElementById("mag-ordina").value;
  let lista = mag.articoli.filter(a => (magUI.cat === "tutte" || a.categoria === magUI.cat) && (!magUI.sub || a.sottocategoria === magUI.sub));
  if(q) lista = lista.filter(a => [a.nome, a.marca, a.formato, a.sottocategoria, magUbiNome(a.ubicazione_id), magCats()[a.categoria]?.nome].filter(Boolean).join(" ").toLowerCase().includes(q));
  if(filtro === "scadenze") lista = lista.filter(a => mag.calc[a.id].inScadenza.length || mag.calc[a.id].scaduti.length);
  else if(filtro) lista = lista.filter(a => mag.calc[a.id].stato === filtro);
  const peso = { rosso: 0, giallo: 1, verde: 2 };
  lista.sort((x, y) => {
    const cx = mag.calc[x.id], cy = mag.calc[y.id];
    if(ordina === "nome") return x.nome.localeCompare(y.nome);
    if(ordina === "copertura") return (cx.copertura ?? 9999) - (cy.copertura ?? 9999);
    if(ordina === "valore") return cy.valore - cx.valore;
    return (peso[cx.stato] - peso[cy.stato]) || x.nome.localeCompare(y.nome);
  });
  const vuoto = document.getElementById("mag-vuoto");
  if(!lista.length){
    grid.innerHTML = "";
    vuoto.style.display = "block";
    vuoto.innerHTML = !mag.articoli.length
      ? `<i class="fa-solid fa-boxes-stacked"></i><div style="font-weight:700;color:var(--text);margin-bottom:6px">Il magazzino è vuoto</div>
         <div style="max-width:440px;margin:0 auto 14px">Inizia dai depositi (fienile, selleria, armadio farmaci…), poi aggiungi gli articoli con la quantità che hai oggi. Da lì in poi basta registrare carichi e scarichi.</div>
         ${magPuoGestire() ? `<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn btn-outline" onclick="magVista('depositi')"><i class="fa-solid fa-warehouse"></i> Crea i depositi</button><button class="btn btn-primary" onclick="magApriArticolo()"><i class="fa-solid fa-plus"></i> Primo articolo</button></div>` : ""}`
      : `<i class="fa-solid fa-magnifying-glass"></i><div>Nessun articolo con questi filtri.</div>`;
    return;
  }
  vuoto.style.display = "none";
  grid.innerHTML = lista.map((a, i) => magCardArticolo(a, i)).join("");
}
function magCardArticolo(a, i){
  const c = mag.calc[a.id];
  const cat = magCats()[a.categoria];
  const soglia = Number(a.soglia_minima || 0);
  const target = Math.max(Number(a.scorta_ottimale || 0), soglia * 2, c.giacenza, 1);
  const perc = Math.max(0, Math.min(100, c.giacenza / target * 100));
  const colore = c.stato === "rosso" ? "var(--danger)" : c.stato === "giallo" ? "#e0a100" : "#2f8a4e";
  const tags = [];
  const ubi = magUbiNome(a.ubicazione_id); if(ubi) tags.push(`<span class="mag-tag"><i class="fa-solid fa-location-dot"></i>${escapeHtml(ubi)}</span>`);
  if(c.lottiAttivi[0]?.scadenza){ const l = c.lottiAttivi[0]; const gg = magGiorniA(l.scadenza);
    tags.push(`<span class="mag-tag ${gg < 0 ? "rosso" : gg <= 30 ? "giallo" : ""}"><i class="fa-solid fa-calendar"></i>${gg < 0 ? "scaduto" : "scad. " + magDataIt(l.scadenza)}</span>`); }
  if(a.condizione && a.condizione !== "ok" && c.motivo !== MAG_COND[a.condizione]) tags.push(`<span class="mag-tag ${a.condizione === "da_sostituire" ? "rosso" : "giallo"}">${MAG_COND[a.condizione]}</span>`);
  if(a.cavallo_id){ const cv = (cavalliList || []).find(x => x.id === a.cavallo_id); if(cv) tags.push(`<span class="mag-tag"><i class="fa-solid fa-horse-head"></i>${escapeHtml(cv.nome)}</span>`); }
  const copertura = c.copertura !== null ? `≈ ${c.copertura} gg di scorta<br>${magFmt(c.mediaGiorno, 1)} ${escapeHtml(a.unita)}/giorno` : cat?.durevole ? "" : "nessun consumo<br>negli ultimi 30 gg";
  return `<div class="mag-art ${c.stato}" style="animation-delay:${Math.min(i, 20) * 18}ms" onclick="magApriDettaglio('${a.id}')">
    <div class="top">${magIcona(a.categoria)}<div style="min-width:0;flex:1"><div class="nome">${escapeHtml(a.nome)}</div>
      <div class="sub">${escapeHtml([a.sottocategoria, a.marca, a.formato].filter(Boolean).join(" · "))}</div></div><i class="mag-sem ${c.stato}${c.stato === "rosso" ? " pulse" : ""}"></i></div>
    <div class="qta"><b>${magFmt(c.giacenza)}</b><span>${escapeHtml(a.unita)}</span>${magEquivalente(c.giacenza, a) ? `<span class="equiv">${magEquivalente(c.giacenza, a)}</span>` : ""}<div class="copertura">${copertura}</div></div>
    <div class="mag-livello" title="Giacenza rispetto alla scorta ottimale"><i style="width:${perc}%;background:${colore}"></i>${soglia > 0 ? `<span class="soglia" style="left:${Math.min(100, soglia / target * 100)}%"></span>` : ""}</div>
    <div class="motivo">${c.stato === "verde" ? "" : escapeHtml(c.motivo)}</div>
    ${tags.length ? `<div class="meta">${tags.join("")}</div>` : ""}
    <div class="azioni" onclick="event.stopPropagation()">
      <button class="meno" onclick="magApriMovimento('${a.id}','scarico')"><i class="fa-solid fa-minus"></i> Usa</button>
      <button class="piu" onclick="magApriMovimento('${a.id}','carico')"><i class="fa-solid fa-plus"></i> Carica</button>
    </div>
  </div>`;
}

