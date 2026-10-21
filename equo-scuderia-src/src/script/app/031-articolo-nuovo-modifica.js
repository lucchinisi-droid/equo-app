/* ---------------- articolo: nuovo / modifica ---------------- */
let magArtEdit = null;
function magOpzioniUbicazioni(){
  const figli = (pid, liv) => mag.ubicazioni.filter(u => (u.parent_id || null) === pid).map(u => `<option value="${u.id}">${"  ".repeat(liv)}${liv ? "└ " : ""}${escapeHtml(u.nome)}</option>` + figli(u.id, liv + 1)).join("");
  return `<option value="">—</option>` + figli(null, 0);
}
function magApriArticolo(id){
  if(!magPuoGestire()){ showToast("Solo l'amministratore o un membro di livello 2-3 può gestire gli articoli."); return; }
  magArtEdit = id ? mag.articoli.find(a => a.id === id) : null;
  const a = magArtEdit || {};
  document.getElementById("mag-art-titolo").textContent = magArtEdit ? "Modifica articolo" : "Nuovo articolo";
  document.getElementById("mag-art-cat").innerHTML = Object.entries(magCats()).filter(([k, c]) => !c.nascosta || k === a.categoria).map(([k, c]) => `<option value="${k}">${escapeHtml(c.nome)}</option>`).join("");
  document.getElementById("mag-art-cat").value = a.categoria || (magUI.cat !== "tutte" ? magUI.cat : "alimentazione");
  magArtCatCambiata(a.sottocategoria || (magUI.sub || null), !magArtEdit);
  document.getElementById("mag-art-nome").value = a.nome || "";
  document.getElementById("mag-art-marca").value = a.marca || "";
  document.getElementById("mag-art-formato").value = a.formato || "";
  if(a.unita) document.getElementById("mag-art-unita").value = a.unita;
  magArtUnitaScelta = !!magArtEdit;
  magArtAggiornaUnita();
  document.getElementById("mag-art-costo").value = a.costo_unitario ?? "";
  document.getElementById("mag-art-soglia").value = a.soglia_minima ?? 0;
  document.getElementById("mag-art-ottimale").value = a.scorta_ottimale ?? "";
  document.getElementById("mag-art-ubicazione").innerHTML = magOpzioniUbicazioni();
  document.getElementById("mag-art-ubicazione").value = a.ubicazione_id || "";
  document.getElementById("mag-art-fornitore").innerHTML = `<option value="">—</option>` + mag.fornitori.map(f => `<option value="${f.id}">${escapeHtml(f.nome)}</option>`).join("");
  document.getElementById("mag-art-fornitore").value = a.fornitore_id || "";
  document.getElementById("mag-art-condizione").value = a.condizione || "";
  document.getElementById("mag-art-cavallo").innerHTML = `<option value="">—</option>` + (cavalliList || []).map(c => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("");
  document.getElementById("mag-art-cavallo").value = a.cavallo_id || "";
  if(magArtEdit) document.getElementById("mag-art-lotti").checked = !!a.gestisce_lotti;
  document.getElementById("mag-art-note").value = a.note || "";
  document.getElementById("mag-art-iniziale").value = 0;
  document.getElementById("mag-art-iniziale-box").style.display = magArtEdit ? "none" : "block";
  document.getElementById("mag-art-archivia").style.display = magArtEdit ? "" : "none";
  document.getElementById("mag-art-err").style.display = "none";
  openModal("modal-mag-articolo");
}
function magArtCatCambiata(subScelta, impostaDefault = true){
  const k = document.getElementById("mag-art-cat").value;
  const c = magCats()[k];
  const subs = [...new Set([...c.sub, ...(typeof subScelta === "string" && subScelta ? [subScelta] : [])])];
  const usate = mag.articoli.filter(a => a.categoria === k).map(a => a.sottocategoria);
  const tutte = [...new Set([...subs, ...usate])];
  document.getElementById("mag-art-sub").innerHTML = tutte.map(s => `<option>${escapeHtml(s)}</option>`).join("") +
    (magPuoGestire() ? `<option value="__nuova__">+ Nuova sottocategoria…</option>` : "");
  if(typeof subScelta === "string" && subScelta) document.getElementById("mag-art-sub").value = subScelta;
  document.getElementById("mag-art-sub-nuova").value = "";
  magArtSubCambiata();
  document.getElementById("mag-art-unita").innerHTML = MAG_UNITA.map(u => `<option>${u}</option>`).join("");
  if(impostaDefault !== false){
    document.getElementById("mag-art-unita").value = c.unita;
    magArtUnitaScelta = false;
    if(document.getElementById("mag-art-formato").value) magArtFormatoCambiato();
    document.getElementById("mag-art-lotti").checked = ["farmaci","integratori"].includes(k);
  }
  document.getElementById("mag-art-durevoli").style.display = c.durevole ? "grid" : "none";
}
function magArtSubCambiata(){
  const nuova = document.getElementById("mag-art-sub").value === "__nuova__";
  document.getElementById("mag-art-sub-nuova-box").style.display = nuova ? "block" : "none";
  if(nuova) setTimeout(() => document.getElementById("mag-art-sub-nuova").focus(), 30);
}
async function magSalvaArticolo(){
  const err = document.getElementById("mag-art-err"); err.style.display = "none";
  const v = id => document.getElementById(id).value;
  const num = id => v(id) === "" ? null : Number(v(id));
  const cat = v("mag-art-cat");
  let sottocategoria = v("mag-art-sub");
  if(sottocategoria === "__nuova__"){
    sottocategoria = v("mag-art-sub-nuova").trim().replace(/\s+/g, " ").slice(0, 60);
    if(!sottocategoria){ err.textContent = "Scrivi il nome della nuova sottocategoria."; err.style.display = "block"; return; }
    await magAggiungiSottocategoria(cat, sottocategoria);
  }
  const row = {
    centro_id: currentCentro.id, categoria: cat, sottocategoria, nome: v("mag-art-nome").trim(),
    marca: v("mag-art-marca").trim() || null, formato: v("mag-art-formato").trim() || null, unita: v("mag-art-unita"),
    costo_unitario: num("mag-art-costo"), soglia_minima: num("mag-art-soglia") || 0, scorta_ottimale: num("mag-art-ottimale"),
    ubicazione_id: v("mag-art-ubicazione") || null, fornitore_id: v("mag-art-fornitore") || null,
    condizione: magCats()[cat].durevole ? (v("mag-art-condizione") || null) : null,
    cavallo_id: magCats()[cat].durevole ? (v("mag-art-cavallo") || null) : null,
    gestisce_lotti: document.getElementById("mag-art-lotti").checked, note: v("mag-art-note").trim() || null,
  };
  if(!row.nome){ err.textContent = "Scrivi il nome dell'articolo."; err.style.display = "block"; return; }
  const iniziale = Number(v("mag-art-iniziale")) || 0;
  const btn = document.getElementById("mag-art-salva"); btn.disabled = true;
  let salvato = null, errore = null;
  if(DEMO_MODE){
    if(magArtEdit){ Object.assign(magArtEdit, row); salvato = magArtEdit; }
    else { salvato = { id: "da" + Math.random().toString(36).slice(2), created_at: new Date().toISOString(), archiviato: false, ...row }; mag.articoli.push(salvato); }
    demoState.mag = JSON.parse(JSON.stringify({ articoli: mag.articoli, movimenti: mag.movimenti, ubicazioni: mag.ubicazioni, fornitori: mag.fornitori, ordini: mag.ordini, categorie: mag.categorie }));
  } else {
    const r = magArtEdit ? await sb.from("mag_articoli").update(row).eq("id", magArtEdit.id).select().single()
                         : await sb.from("mag_articoli").insert(row).select().single();
    if(r.error) errore = r.error.message; else salvato = r.data;
    if(salvato){ const i = mag.articoli.findIndex(x => x.id === salvato.id); if(i >= 0) mag.articoli[i] = salvato; else mag.articoli.push(salvato); }
  }
  if(!errore && salvato && !magArtEdit && iniziale > 0){
    errore = await magInserisciMovimenti([{ centro_id: currentCentro.id, articolo_id: salvato.id, tipo: "carico", quantita: iniziale, costo_unitario: row.costo_unitario, fornitore_id: row.fornitore_id, nota: "Giacenza iniziale" }]);
  }
  btn.disabled = false;
  if(errore){ err.textContent = "Non salvato: " + errore; err.style.display = "block"; return; }
  closeModal("modal-mag-articolo");
  magCalcola(); magRenderTutto();
  showToast(magArtEdit ? "Articolo aggiornato." : "Articolo aggiunto al magazzino.");
}
async function magArchiviaArticolo(){
  if(!magArtEdit) return;
  if(!confirm(`Archiviare "${magArtEdit.nome}"? Sparisce dal magazzino ma lo storico dei movimenti resta.`)) return;
  if(DEMO_MODE){ mag.articoli = mag.articoli.filter(a => a.id !== magArtEdit.id); demoState.mag.articoli = demoState.mag.articoli.filter(a => a.id !== magArtEdit.id); }
  else {
    const { error } = await sb.from("mag_articoli").update({ archiviato: true }).eq("id", magArtEdit.id);
    if(error){ showToast("Non riuscito: " + error.message); return; }
    mag.articoli = mag.articoli.filter(a => a.id !== magArtEdit.id);
  }
  closeModal("modal-mag-articolo"); magCalcola(); magRenderTutto(); showToast("Articolo archiviato.");
}

