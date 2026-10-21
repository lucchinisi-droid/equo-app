/* ---------------- categorie personalizzate ---------------- */
let magCatEdit = null;
async function magAggiungiSottocategoria(cat, nome){
  const k = (mag.categorie || []).find(x => x.chiave === cat);
  if(!k || (k.sottocategorie || []).includes(nome)) return; // per le categorie di base la sottocategoria vive negli articoli
  const nuove = [...(k.sottocategorie || []), nome];
  if(!DEMO_MODE){ const { error } = await sb.from("mag_categorie").update({ sottocategorie: nuove }).eq("id", k.id); if(error){ console.error(error); return; } }
  k.sottocategorie = nuove;
}
function magApriCategoria(id){
  if(!magPuoGestire()){ showToast("Solo l'amministratore o un membro di livello 2-3 può creare categorie."); return; }
  magCatEdit = id ? (mag.categorie || []).find(k => k.id === id) : null;
  const k = magCatEdit || { icona: "fa-box", colore: MAG_COLORI_CAT[(mag.categorie || []).length % MAG_COLORI_CAT.length], durevole: false, unita: "pz", sottocategorie: [] };
  document.getElementById("mag-cat-titolo").textContent = magCatEdit ? "Modifica categoria" : "Nuova categoria";
  document.getElementById("mag-cat-nome").value = k.nome || "";
  document.getElementById("mag-cat-sub").value = (k.sottocategorie || []).join(", ");
  document.getElementById("mag-cat-unita").innerHTML = MAG_UNITA.map(u => `<option>${u}</option>`).join("");
  document.getElementById("mag-cat-unita").value = k.unita || "pz";
  document.querySelectorAll('input[name="mag-cat-tipo"]').forEach(r => r.checked = (r.value === "durevole") === !!k.durevole);
  document.getElementById("mag-cat-icone").innerHTML = MAG_ICONE_CAT.map(ic => `<button type="button" class="mag-scelta-ic ${ic === k.icona ? "sel" : ""}" data-ic="${ic}" onclick="magCatScegli(this)"><i class="fa-solid ${ic}"></i></button>`).join("");
  document.getElementById("mag-cat-colori").innerHTML = MAG_COLORI_CAT.map(c => `<button type="button" class="mag-scelta-col ${c === k.colore ? "sel" : ""}" data-col="${c}" style="background:${c}" onclick="magCatScegli(this)"></button>`).join("");
  const nasc = document.getElementById("mag-cat-nascondi");
  nasc.style.display = magCatEdit ? "" : "none";
  nasc.innerHTML = magCatEdit?.nascosta ? '<i class="fa-solid fa-eye"></i> Mostra' : '<i class="fa-solid fa-eye-slash"></i> Nascondi';
  document.getElementById("mag-cat-err").style.display = "none";
  magCatAnteprima();
  openModal("modal-mag-categoria");
}
function magCatScegli(btn){
  btn.parentElement.querySelectorAll("button").forEach(b => b.classList.remove("sel"));
  btn.classList.add("sel");
  magCatAnteprima();
}
function magCatAnteprima(){
  const ic = document.querySelector("#mag-cat-icone .sel")?.dataset.ic || "fa-box";
  const col = document.querySelector("#mag-cat-colori .sel")?.dataset.col || "#6b746f";
  const nome = document.getElementById("mag-cat-nome").value.trim() || "Nuova categoria";
  const durevole = document.querySelector('input[name="mag-cat-tipo"]:checked')?.value === "durevole";
  document.getElementById("mag-cat-anteprima").innerHTML = `<span class="ic" style="background:${col}"><i class="fa-solid ${ic}"></i></span><i class="mag-sem verde"></i><div class="nome">${escapeHtml(nome)}</div><div class="info">${durevole ? "beni durevoli" : "scorte di consumo"}</div><div class="salute"><i style="width:100%;background:#2f8a4e"></i></div>`;
}
async function magSalvaCategoria(){
  const err = document.getElementById("mag-cat-err"); err.style.display = "none";
  const nome = document.getElementById("mag-cat-nome").value.trim().replace(/\s+/g, " ").slice(0, 60);
  if(!nome){ err.textContent = "Scrivi il nome della categoria."; err.style.display = "block"; return; }
  const doppia = Object.entries(magCats()).find(([key, c]) => c.nome.toLowerCase() === nome.toLowerCase() && (!magCatEdit || key !== magCatEdit.chiave));
  if(doppia){ err.textContent = "Esiste già una categoria con questo nome."; err.style.display = "block"; return; }
  const sub = [...new Set(document.getElementById("mag-cat-sub").value.split(/[,\n]/).map(x => x.trim().replace(/\s+/g, " ").slice(0, 60)).filter(Boolean))];
  const row = {
    nome, icona: document.querySelector("#mag-cat-icone .sel")?.dataset.ic || "fa-box",
    colore: document.querySelector("#mag-cat-colori .sel")?.dataset.col || "#6b746f",
    durevole: document.querySelector('input[name="mag-cat-tipo"]:checked')?.value === "durevole",
    unita: document.getElementById("mag-cat-unita").value, sottocategorie: sub.length ? sub : ["Altro"],
  };
  if(!magCatEdit){
    const base = nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 30) || "cat";
    row.chiave = "c_" + (base.length >= 2 ? base : base + "x") + "_" + Math.random().toString(36).slice(2, 6);
    row.centro_id = currentCentro.id;
    row.ordine = (mag.categorie || []).length;
  }
  let salvata;
  if(DEMO_MODE){
    if(magCatEdit){ Object.assign(magCatEdit, row); salvata = magCatEdit; }
    else { salvata = { id: "dk" + Math.random().toString(36).slice(2), nascosta: false, ...row }; mag.categorie.push(salvata); }
    demoState.mag.categorie = JSON.parse(JSON.stringify(mag.categorie));
  } else {
    const r = magCatEdit ? await sb.from("mag_categorie").update(row).eq("id", magCatEdit.id).select().single()
                         : await sb.from("mag_categorie").insert(row).select().single();
    if(r.error){ err.textContent = "Non salvata: " + r.error.message; err.style.display = "block"; return; }
    salvata = r.data;
    const i = mag.categorie.findIndex(x => x.id === salvata.id); if(i >= 0) mag.categorie[i] = salvata; else mag.categorie.push(salvata);
  }
  const eraModifica = !!magCatEdit;
  closeModal("modal-mag-categoria");
  magUI.cat = salvata.chiave; magUI.sub = "";
  magCalcola(); magRenderTutto();
  showToast(eraModifica ? "Categoria aggiornata." : `Categoria "${nome}" creata: ora aggiungi i suoi articoli.`);
}
async function magNascondiCategoria(){
  if(!magCatEdit) return;
  const nascosta = !magCatEdit.nascosta;
  if(nascosta && !confirm(`Nascondere "${magCatEdit.nome}"? Non comparirà più tra le schede e nei nuovi articoli; gli articoli già presenti restano visibili in "Tutto il magazzino".`)) return;
  if(DEMO_MODE) magCatEdit.nascosta = nascosta;
  else {
    const { error } = await sb.from("mag_categorie").update({ nascosta }).eq("id", magCatEdit.id);
    if(error){ showToast("Non riuscito: " + error.message); return; }
    magCatEdit.nascosta = nascosta;
  }
  if(nascosta && magUI.cat === magCatEdit.chiave){ magUI.cat = "tutte"; magUI.sub = ""; }
  closeModal("modal-mag-categoria"); magCalcola(); magRenderTutto();
  showToast(nascosta ? "Categoria nascosta." : "Categoria di nuovo visibile.");
}

