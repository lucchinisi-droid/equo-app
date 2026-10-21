/* ---------- TOAST ---------- */
let toastTimer = null;
function showToast(msg){
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("active");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("active"), Math.max(2800, String(msg).length * 55)); // i messaggi lunghi restano visibili più a lungo
}

