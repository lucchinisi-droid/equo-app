/* ---- trascinamento: tieni premuto un cavallo e portalo in un altro box ---- */
const boxDrag = { timer: null, attivo: false, cav: null, da: null, x0: 0, y0: 0, ghost: null, target: null, blocca: false };
function boxDragReset(){
  clearTimeout(boxDrag.timer);
  if(boxDrag.ghost) boxDrag.ghost.remove();
  document.querySelectorAll(".box-card.drop-ok, .box-card.drop-no, .box-card.in-trascinamento").forEach(el => el.classList.remove("drop-ok", "drop-no", "in-trascinamento"));
  document.body.classList.remove("box-trascina");
  Object.assign(boxDrag, { timer: null, attivo: false, cav: null, da: null, ghost: null, target: null });
  window.__boxDrag = false;
}
document.addEventListener("pointerdown", e => {
  const card = e.target.closest && e.target.closest(".box-card[data-cav]");
  if(!card || e.target.closest(".box-ic, .box-nota") || !boxPuoGestire() || boxBloccati()) return;
  if(e.pointerType === "mouse" && e.button !== 0) return;
  boxDragReset();
  Object.assign(boxDrag, { cav: card.dataset.cav, da: card.dataset.box, x0: e.clientX, y0: e.clientY });
  boxDrag.timer = setTimeout(() => {
    boxDrag.attivo = true; window.__boxDrag = true;
    document.getElementById("eq-tip")?.classList.remove("vis");
    card.classList.add("in-trascinamento"); document.body.classList.add("box-trascina");
    const c = cavalliList.find(x => x.id === boxDrag.cav);
    const g = document.createElement("div"); g.className = "box-ghost";
    g.innerHTML = `${c?.foto_url ? `<span class="f" style="background-image:${cssUrl(c.foto_url)}"></span>` : `<i class="fa-solid fa-horse-head"></i>`}<b>${escapeHtml(c?.nome || "")}</b>`;
    g.style.left = boxDrag.x0 + "px"; g.style.top = boxDrag.y0 + "px";
    document.body.appendChild(g); boxDrag.ghost = g;
    try{ navigator.vibrate?.(15); }catch(x){}
  }, e.pointerType === "mouse" ? 260 : 420);
});
document.addEventListener("pointermove", e => {
  if(!boxDrag.cav) return;
  if(!boxDrag.attivo){ if(Math.hypot(e.clientX - boxDrag.x0, e.clientY - boxDrag.y0) > 8) boxDragReset(); return; }
  boxDrag.ghost.style.left = e.clientX + "px"; boxDrag.ghost.style.top = e.clientY + "px";
  const el = document.elementFromPoint(e.clientX, e.clientY)?.closest(".box-card[data-box]");
  document.querySelectorAll(".box-card.drop-ok, .box-card.drop-no").forEach(x => { if(x !== el) x.classList.remove("drop-ok", "drop-no"); });
  boxDrag.target = el && el.dataset.box !== boxDrag.da ? el.dataset.box : null;
  if(boxDrag.target){ const b = boxList.find(x => x.id === boxDrag.target); el.classList.add(b && !b.cavallo_id && !b.manutenzione ? "drop-ok" : "drop-no"); }
});
document.addEventListener("touchmove", e => { if(boxDrag.attivo) e.preventDefault(); }, { passive: false });
document.addEventListener("pointerup", async () => {
  if(!boxDrag.cav) return;
  const { attivo, cav, da, target } = boxDrag;
  boxDragReset();
  if(!attivo) return;
  boxDrag.blocca = true; setTimeout(() => { boxDrag.blocca = false; }, 400);
  if(target) await boxMuovi(cav, da, target);
});
document.addEventListener("pointercancel", () => { if(!boxDrag.attivo) boxDragReset(); });
document.addEventListener("click", e => { if(boxDrag.blocca && e.target.closest && e.target.closest(".box-card")){ e.preventDefault(); e.stopPropagation(); boxDrag.blocca = false; } }, true);
document.addEventListener("contextmenu", e => { if(e.target.closest && e.target.closest(".box-card[data-cav]") && boxPuoGestire()) e.preventDefault(); });

async function boxManutenzione(id){
  const campi = { manutenzione: true, manutenzione_motivo: document.getElementById("box-man-motivo").value,
    manutenzione_fino: document.getElementById("box-man-fino").value || null, manutenzione_nota: document.getElementById("box-man-nota").value.trim() || null };
  if(await boxAggiorna(id, campi)){ showToast("Box in manutenzione."); boxRenderPannello(); }
}
async function boxElimina(id){
  const b = boxList.find(x => x.id === id);
  if(!confirm(`Eliminare il box ${b?.numero}?`)) return;
  if(DEMO_MODE) demoState.box = demoState.box.filter(x => x.id !== id);
  else { const { error } = await sb.from("scuderia_box").delete().eq("id", id); if(error){ showToast(error.message); return; } }
  closeModal("modal-box"); boxPannelloId = null; showToast("Box eliminato."); await refreshBoxSezione();
}
