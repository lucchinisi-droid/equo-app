// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
/* ---------- conferma a scorrimento (niente tocco singolo) ---------- */
function mlSlider(testo, fn, tipo){
  return `<div class="ml-slider ${tipo}" data-fn="${fn}"><button type="button" class="ml-pom" aria-label="${escapeHtml(testo)}">${tipo === "verde" ? ML_IC.check : ML_IC.dx}</button><b>${escapeHtml(testo)}</b></div>`;
}
function mlAttivaSlider(root){
  root.querySelectorAll(".ml-slider").forEach(sl => {
    const pom = sl.querySelector(".ml-pom");
    let x0 = null, dx = 0;
    const max = () => sl.clientWidth - pom.offsetWidth - 16;
    const fine = ok => {
      x0 = null;
      if(ok){ pom.style.transform = `translateX(${max()}px)`; const f = window[sl.dataset.fn]; setTimeout(() => f && f(), 120); }
      else { pom.style.transition = "transform .25s"; pom.style.transform = ""; setTimeout(() => pom.style.transition = "", 260); }
    };
    pom.addEventListener("pointerdown", ev => { x0 = ev.clientX; dx = 0; pom.setPointerCapture(ev.pointerId); });
    pom.addEventListener("pointermove", ev => { if(x0 == null) return; dx = Math.max(0, Math.min(max(), ev.clientX - x0)); pom.style.transform = `translateX(${dx}px)`; });
    pom.addEventListener("pointerup", () => { if(x0 != null) fine(dx > max() * 0.8); });
    pom.addEventListener("pointercancel", () => fine(false));
    pom.addEventListener("keydown", ev => { if(ev.key === "Enter"){ ev.preventDefault(); fine(true); } });   // tastiera (accessibilità)
  });
}


export { mlAttivaSlider, mlSlider };
