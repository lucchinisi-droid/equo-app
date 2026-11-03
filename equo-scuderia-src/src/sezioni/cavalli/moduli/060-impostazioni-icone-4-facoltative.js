// Equo App · cavalli · modulo (moduli ES, costruiti con Vite in ruoli/cavalli/costruito.js)
import { openModal } from "./061-modalita-stalla-schermo-intero-per-table.js";
/* ---- impostazioni icone (4 facoltative) + cosa vede il proprietario (diario del cavallo, SQL 36) ---- */
const DIARIO_DEFAULT = ["pasto_mattina", "pasto_sera", "fieno", "paddock", "lavorato", "farmaco", "box_pulito"];
// centri.diario_attivita si legge qui e non all'accesso: se lo SQL 36 non è ancora eseguito il gestionale funziona lo stesso
async function boxDiarioAttivita(){
  if(Array.isArray(currentCentro?.diario_attivita)) return currentCentro.diario_attivita;
  if(!DEMO_MODE && currentCentro?.id){
    const { data, error } = await sb.from("centri").select("diario_attivita").eq("id", currentCentro.id).maybeSingle();
    if(!error && Array.isArray(data?.diario_attivita)){ currentCentro.diario_attivita = data.diario_attivita; return data.diario_attivita; }
  }
  return DIARIO_DEFAULT;
}
async function boxApriImpostazioni(){
  const extra = currentCentro?.box_icone_extra || [];
  const diario = await boxDiarioAttivita();
  document.getElementById("box-impost-lista").innerHTML = `<div style="display:flex;gap:10px;padding:0 0 6px;font-size:11.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em"><span style="flex:1">Icona</span><span style="width:76px;text-align:center">Nel box</span><span style="width:76px;text-align:center">Al proprietario</span></div>`
    + Object.entries(BOX_ICONE).map(([k, d]) => `<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border);font-size:14px">
    <span style="flex:1;display:flex;align-items:center;gap:10px"><span class="box-ic on" style="--ic-col:${d.col};opacity:1">${iconHtml(d.icon)}</span> ${d.nome}${d.extra ? ' <small style="color:var(--muted)">facoltativa</small>' : ""}</span>
    <label style="width:76px;text-align:center" title="${d.extra ? "Mostra questa icona sui box" : "Sempre presente sui box"}"><input type="checkbox" class="box-imp-box" value="${k}" ${!d.extra ? "checked disabled" : extra.includes(k) ? "checked" : ""}></label>
    <label style="width:76px;text-align:center" title="Il proprietario la vede nella scheda del suo cavallo"><input type="checkbox" class="box-imp-diario" value="${k}" ${diario.includes(k) ? "checked" : ""}></label></div>`).join("");
  openModal("modal-box-impost");
}
async function boxSalvaImpostazioni(){
  const extra = [...document.querySelectorAll("#box-impost-lista .box-imp-box:not([disabled]):checked")].map(i => i.value);
  const diario = [...document.querySelectorAll("#box-impost-lista .box-imp-diario:checked")].map(i => i.value);
  if(!DEMO_MODE){
    const { error } = await sb.from("centri").update({ box_icone_extra: extra }).eq("id", currentCentro.id); if(error){ showToast(error.message); return; }
    const r = await sb.from("centri").update({ diario_attivita: diario }).eq("id", currentCentro.id);
    if(r.error && !/diario_attivita/.test(r.error.message || "")){ showToast(r.error.message); return; }
  }
  currentCentro.box_icone_extra = extra; currentCentro.diario_attivita = diario;
  closeModal("modal-box-impost"); renderBox(); showToast("Icone del giorno aggiornate.");
}

export { boxApriImpostazioni, boxSalvaImpostazioni };
