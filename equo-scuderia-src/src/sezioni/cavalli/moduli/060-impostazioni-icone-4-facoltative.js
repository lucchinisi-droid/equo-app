// Equo App · cavalli · modulo (moduli ES, costruiti con Vite in ruoli/cavalli/costruito.js)
import { openModal } from "./061-modalita-stalla-schermo-intero-per-table.js";
/* ---- impostazioni icone (4 facoltative) ---- */
function boxApriImpostazioni(){
  const extra = currentCentro?.box_icone_extra || [];
  document.getElementById("box-impost-lista").innerHTML = Object.entries(BOX_ICONE).map(([k, d]) => `<label style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border);font-size:14px">
    <input type="checkbox" value="${k}" ${!d.extra ? "checked disabled" : extra.includes(k) ? "checked" : ""}> <span class="box-ic on" style="--ic-col:${d.col};opacity:1">${iconHtml(d.icon)}</span> ${d.nome} <small style="color:var(--muted);margin-left:auto">${d.extra ? "facoltativa" : "sempre"}</small></label>`).join("");
  openModal("modal-box-impost");
}
async function boxSalvaImpostazioni(){
  const extra = [...document.querySelectorAll("#box-impost-lista input:not([disabled]):checked")].map(i => i.value);
  if(!DEMO_MODE){ const { error } = await sb.from("centri").update({ box_icone_extra: extra }).eq("id", currentCentro.id); if(error){ showToast(error.message); return; } }
  currentCentro.box_icone_extra = extra; closeModal("modal-box-impost"); renderBox(); showToast("Icone del giorno aggiornate.");
}

export { boxApriImpostazioni, boxSalvaImpostazioni };
