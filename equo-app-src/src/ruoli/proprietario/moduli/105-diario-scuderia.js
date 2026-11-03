// Equo App · proprietario · DIARIO DEL CAVALLO IN SCUDERIA (3/11/2026 · SQL 36)
// Nella scheda del cavallo: cosa è stato fatto oggi (e negli ultimi 7 giorni) in scuderia, con l'ora e chi l'ha fatto.
// I dati li segna il groom dall'app Groom o lo staff dal gestionale; il centro sceglie cosa mostrare (centri.diario_attivita).
// Si vede solo se il cavallo è collegato a una scuderia su Equo (core/dati/db-01: diarioScuderia).
// Si aggancia con le estensioni (openHorseDetail): nessun file del proprietario cambia.

const DIA_ICONE = {
  pasto_mattina: ["Pasto del mattino", "fa-bowl-food", "#b7862b"], pasto_sera: ["Pasto della sera", "fa-bowl-rice", "#8a5a2b"],
  fieno: ["Fieno", "fa-wheat-awn", "#9a7b2f"], acqua: ["Acqua", "fa-droplet", "#2f79b7"], paddock: ["Paddock", "fa-tree", "#3f7a45"],
  lavorato: ["Lavorato", "fa-horse", "#1d4a35"], farmaco: ["Farmaco o terapia", "fa-pills", "#c0473d"], box_pulito: ["Box pulito", "fa-broom", "#6b4fa0"],
  integratore: ["Integratore", "fa-capsules", "#5d8f4e"], coperta: ["Coperta", "fa-rug", "#7a6a55"], zoccoli: ["Zoccoli puliti", "fa-shoe-prints", "#5f6b73"],
  grooming: ["Governato", "fa-brush", "#b0567a"],
};
const DIA = { horse: null, dati: null, giorno: null };
const diaEsc = s => escapeHtml(s == null ? "" : String(s));
function diaEtichetta(g, oggi){
  if(g === oggi) return "Oggi";
  if(g === isoLocale(new Date(new Date(oggi + "T12:00").getTime() - 86400000))) return "Ieri";
  return new Date(g + "T12:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric" });
}
function diaBox(){
  const vista = document.getElementById("cavalli-detail-view"); if(!vista) return null;
  let box = document.getElementById("horse-diario-scuderia");
  if(!box){
    box = document.createElement("div"); box.id = "horse-diario-scuderia";
    const dove = document.getElementById("horse-dove");
    if(dove && dove.parentNode) dove.parentNode.insertBefore(box, dove.nextSibling); else vista.appendChild(box);
  }
  return box;
}
async function diaRenderCavallo(horseId){
  const id = horseId || currentHorseId; const box = diaBox(); if(!box) return;
  box.innerHTML = "";
  const d = await DB.diarioScuderia(id);
  if(id !== currentHorseId || !d) return;
  DIA.horse = id; DIA.dati = d; DIA.giorno = d.oggi;
  diaDisegna();
}
function diaDisegna(){
  const box = diaBox(); const d = DIA.dati; if(!box || !d) return;
  const testa = `<div class="ter-tit">🐴 In scuderia · ${diaEsc(d.scuderia)}</div>`;
  if(!d.attiva){
    box.innerHTML = `<div class="card ter-card" style="margin-bottom:14px">${testa}<div class="muted ter-vuoto">La tua scuderia non segna ancora su Equo le attività di ogni giorno. Quando inizierà, qui vedrai pasti, paddock e terapie con l'ora.</div></div>`;
    return;
  }
  const giorni = []; for(let i = 0; i < 7; i++) giorni.push(isoLocale(new Date(new Date(d.oggi + "T12:00").getTime() - i * 86400000)));
  const conVoci = new Set((d.voci || []).map(v => v.giorno));
  const voci = (d.voci || []).filter(v => v.giorno === DIA.giorno).sort((a, b) => String(a.ora).localeCompare(String(b.ora)));
  const chip = g => `<button type="button" onclick="diaGiorno('${g}')" style="flex:0 0 auto;border:1px solid var(--border,#ddd);border-radius:999px;padding:5px 11px;font-size:12.5px;background:${g === DIA.giorno ? "var(--verde,#1d4a35)" : "transparent"};color:${g === DIA.giorno ? "#fff" : "inherit"};opacity:${conVoci.has(g) || g === DIA.giorno ? 1 : .55}">${diaEsc(diaEtichetta(g, d.oggi))}</button>`;
  const riga = v => { const ic = DIA_ICONE[v.tipo] || [v.tipo, "fa-circle-check", "#777"];
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border,#eee)"><span style="width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:${ic[2]}1f;color:${ic[2]}"><i class="fa-solid ${ic[1]}"></i></span><span style="flex:1"><b>${diaEsc(ic[0])}</b>${v.da ? `<small class="muted" style="display:block">da ${diaEsc(v.da)}</small>` : ""}</span><span style="font-variant-numeric:tabular-nums">${diaEsc(v.ora || "")}</span></div>`; };
  box.innerHTML = `<div class="card ter-card" style="margin-bottom:14px">${testa}
    <div style="display:flex;gap:6px;overflow-x:auto;padding:6px 0 8px;scrollbar-width:none">${giorni.map(chip).join("")}</div>
    ${voci.length ? voci.map(riga).join("") : `<div class="muted ter-vuoto">${DIA.giorno === d.oggi ? "Oggi ancora nessuna attività segnata." : "Nessuna attività segnata quel giorno."}</div>`}</div>`;
}
function diaGiorno(g){ DIA.giorno = g; diaDisegna(); }

function diaAggancia(){
  try{ estendiDopo("openHorseDetail", function(id){ diaRenderCavallo(id); }); }catch(err){ console.error("diario scuderia:", err); }
}
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", diaAggancia, { once: true }); else diaAggancia();

export { diaRenderCavallo, diaGiorno, DIA };
