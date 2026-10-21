/* ---------------- categorie e sottocategorie ---------------- */
function magRenderCategorie(){
  const tutte = magStatoGruppo(mag.articoli);
  const tile = (key, nome, icona, colore, arts, g) => {
    const tot = arts.length || 1;
    const cnt = g.rosso ? `<span class="cnt">${g.rosso}</span>` : g.giallo ? `<span class="cnt g">${g.giallo}</span>` : "";
    return `<button class="mag-cat ${magUI.cat === key ? "active" : ""}" onclick="magSelCat('${key}')">
      <span class="ic" style="background:${colore}">${icona}</span>${cnt}<i class="mag-sem ${arts.length ? g.colore : "verde"}${g.rosso ? " pulse" : ""}"></i>
      <div class="nome">${escapeHtml(nome)}</div><div class="info">${arts.length} ${arts.length === 1 ? "articolo" : "articoli"}</div>
      <div class="salute"><i style="width:${g.verde / tot * 100}%;background:#2f8a4e"></i><i style="width:${g.giallo / tot * 100}%;background:#e0a100"></i><i style="width:${g.rosso / tot * 100}%;background:var(--danger)"></i></div>
    </button>`;
  };
  let html = tile("tutte", "Tutto il magazzino", '<i class="fa-solid fa-boxes-stacked"></i>', "var(--primary)", mag.articoli, tutte);
  Object.entries(magCats()).forEach(([k, c]) => {
    if(c.nascosta) return;
    const arts = mag.articoli.filter(a => a.categoria === k);
    html += tile(k, c.nome, iconHtml(c.icon), c.colore, arts, magStatoGruppo(arts));
  });
  if(magPuoGestire()) html += `<button class="mag-cat mag-cat-nuova" onclick="magApriCategoria()"><span class="ic"><i class="fa-solid fa-plus"></i></span><div class="nome">Nuova categoria</div><div class="info">es. Trattori, Eventi, Bar…</div></button>`;
  document.getElementById("mag-cats").innerHTML = html;
  // sottocategorie
  const box = document.getElementById("mag-subcats");
  if(magUI.cat === "tutte"){ box.innerHTML = ""; box.style.display = "none"; return; }
  box.style.display = "flex";
  const c = magCats()[magUI.cat];
  const arts = mag.articoli.filter(a => a.categoria === magUI.cat);
  const subs = [...new Set([...c.sub, ...arts.map(a => a.sottocategoria)])];
  box.innerHTML = `<button class="mag-chip ${!magUI.sub ? "active" : ""}" onclick="magSelSub('')">Tutte</button>` + subs.map(s => {
    const as = arts.filter(a => a.sottocategoria === s);
    const g = magStatoGruppo(as);
    return `<button class="mag-chip ${magUI.sub === s ? "active" : ""}" onclick="magSelSub(${escapeHtml(JSON.stringify(s))})">${as.length ? `<i class="mag-sem ${g.colore}"></i>` : ""}${escapeHtml(s)} <span style="opacity:.6">${as.length}</span></button>`;
  }).join("") + (c.custom && magPuoGestire() ? `<button class="mag-chip" style="margin-left:auto" onclick="magApriCategoria('${c.custom.id}')"><i class="fa-solid fa-pen"></i> Modifica categoria</button>` : "");
}
function magSelCat(k){ magUI.cat = k; magUI.sub = ""; magRenderCategorie(); magRender(); }
function magSelSub(s){ magUI.sub = s; magRenderCategorie(); magRender(); }
function magLayout(l){
  magUI.layout = l;
  try{ localStorage.setItem("equo-mag-layout", l); }catch(e){}
  magRender();
}

