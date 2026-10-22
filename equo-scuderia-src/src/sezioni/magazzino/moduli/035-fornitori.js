// Equo App · magazzino · modulo (moduli ES, costruiti con Vite in ruoli/magazzino/costruito.js)
import { magStatoGruppo } from "./023-dati.js";
import { magRenderTutto } from "./025-vista-semplice-completa-magazzino-e-stat.js";
/* ---------------- fornitori ---------------- */
let magFornEdit = null;
function magRenderFornitori(){
  const box = document.getElementById("mag-fornitori");
  let html = magPuoGestire() ? `<div><button class="btn btn-primary" onclick="magApriFornitore()"><i class="fa-solid fa-plus"></i> Nuovo fornitore</button></div>` : "";
  if(!mag.fornitori.length) html += `<div class="card empty-state"><i class="fa-solid fa-handshake"></i><div>Aggiungi i tuoi fornitori (consorzio agrario, farmacia veterinaria, selleria…): gli ordini partono da qui via WhatsApp o email.</div></div>`;
  html += mag.fornitori.map(f => {
    const arts = mag.articoli.filter(a => a.fornitore_id === f.id), g = magStatoGruppo(arts);
    const tel = (f.telefono || "").replace(/[^\d+]/g, "");
    return `<div class="card mag-forn"><i class="mag-sem ${arts.length ? g.colore : "verde"}"></i><div class="t"><b>${escapeHtml(f.nome)}</b>
      <small>${escapeHtml([f.referente, f.telefono, f.email].filter(Boolean).join(" · ") || "Nessun contatto")}</small>
      <small>${arts.length} articoli${g.rosso + g.giallo ? ` · <span style="color:var(--danger)">${g.rosso + g.giallo} da riordinare/controllare</span>` : ""}${f.note ? " · " + escapeHtml(f.note) : ""}</small></div>
      ${tel ? `<a class="btn btn-sm btn-outline" href="tel:${escapeHtml(tel)}"><i class="fa-solid fa-phone"></i></a><a class="btn btn-sm btn-outline" target="_blank" rel="noopener" href="https://wa.me/${escapeHtml(tel.replace(/^\+/, ""))}"><i class="fa-brands fa-whatsapp"></i></a>` : ""}
      ${f.email ? `<a class="btn btn-sm btn-outline" href="mailto:${escapeHtml(f.email)}"><i class="fa-solid fa-envelope"></i></a>` : ""}
      ${magPuoGestire() ? `<button class="btn btn-sm btn-ghost" onclick="magApriFornitore('${f.id}')"><i class="fa-solid fa-pen"></i></button>` : ""}</div>`;
  }).join("");
  box.innerHTML = html;
}
function magApriFornitore(id){
  magFornEdit = id ? mag.fornitori.find(f => f.id === id) : null;
  const f = magFornEdit || {};
  document.getElementById("mag-forn-titolo").textContent = magFornEdit ? "Modifica fornitore" : "Nuovo fornitore";
  ["nome","referente","telefono","email","note"].forEach(k => document.getElementById("mag-forn-" + k).value = f[k] || "");
  document.getElementById("mag-forn-archivia").style.display = magFornEdit ? "" : "none";
  document.getElementById("mag-forn-err").style.display = "none";
  openModal("modal-mag-fornitore");
}
async function magSalvaFornitore(){
  const err = document.getElementById("mag-forn-err"); err.style.display = "none";
  const row = { centro_id: currentCentro.id };
  ["nome","referente","telefono","email","note"].forEach(k => row[k] = document.getElementById("mag-forn-" + k).value.trim() || null);
  if(!row.nome){ err.textContent = "Scrivi il nome del fornitore."; err.style.display = "block"; return; }
  if(DEMO_MODE){ if(magFornEdit) Object.assign(magFornEdit, row); else mag.fornitori.push({ id: "df" + Math.random().toString(36).slice(2), ...row }); demoState.mag.fornitori = JSON.parse(JSON.stringify(mag.fornitori)); }
  else {
    const r = magFornEdit ? await sb.from("mag_fornitori").update(row).eq("id", magFornEdit.id).select().single() : await sb.from("mag_fornitori").insert(row).select().single();
    if(r.error){ err.textContent = "Non salvato: " + r.error.message; err.style.display = "block"; return; }
    const i = mag.fornitori.findIndex(x => x.id === r.data.id); if(i >= 0) mag.fornitori[i] = r.data; else mag.fornitori.push(r.data);
  }
  closeModal("modal-mag-fornitore"); magRenderTutto(); showToast("Fornitore salvato.");
}
async function magArchiviaFornitore(){
  if(!magFornEdit || !confirm(`Archiviare "${magFornEdit.nome}"?`)) return;
  if(DEMO_MODE){ mag.fornitori = mag.fornitori.filter(f => f.id !== magFornEdit.id); demoState.mag.fornitori = JSON.parse(JSON.stringify(mag.fornitori)); }
  else { const { error } = await sb.from("mag_fornitori").update({ archiviato: true }).eq("id", magFornEdit.id); if(error){ showToast("Non riuscito: " + error.message); return; } mag.fornitori = mag.fornitori.filter(f => f.id !== magFornEdit.id); }
  closeModal("modal-mag-fornitore"); magRenderTutto();
}


export { magApriFornitore, magArchiviaFornitore, magRenderFornitori, magSalvaFornitore };
