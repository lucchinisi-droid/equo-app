// Equo App · magazzino · modulo (moduli ES, costruiti con Vite in ruoli/magazzino/costruito.js)
import { loadMagazzino } from "./023-dati.js";
import { magRenderTutto } from "./025-vista-semplice-completa-magazzino-e-stat.js";
/* ---------------- modulo ---------------- */
async function refreshMagazzinoModule(){
  if(!mag.caricato){
    document.getElementById("mag-grid").innerHTML = '<div class="empty-state" style="grid-column:1/-1"><i class="fa-solid fa-spinner fa-spin"></i><div>Carico il magazzino…</div></div>';
  }
  await loadMagazzino();
  document.getElementById("mag-btn-articolo").style.display = magPuoGestire() ? "" : "none";
  magRenderTutto();
}

export { refreshMagazzinoModule };
