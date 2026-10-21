/* ---------------- modulo ---------------- */
async function refreshMagazzinoModule(){
  if(!mag.caricato){
    document.getElementById("mag-grid").innerHTML = '<div class="empty-state" style="grid-column:1/-1"><i class="fa-solid fa-spinner fa-spin"></i><div>Carico il magazzino…</div></div>';
  }
  await loadMagazzino();
  document.getElementById("mag-btn-articolo").style.display = magPuoGestire() ? "" : "none";
  magRenderTutto();
}
