/* =====================================================================
   VISITE DEL VETERINARIO nella scheda del cavallo (11/11/2026 · Fase 4 · SQL 67) — script normale: funzioni globali.
   La scuderia vede SOLO data, tipo di visita e veterinario (mai diagnosi, note o referti: quelli li vede il proprietario).
   Dati da scuderia_visite_veterinario(p_cavallo): visite fatte o fissate negli ultimi 2 anni, dai veterinari collegati
   alla scuderia e da quelli del proprietario (se il cavallo è condiviso nell'ecosistema Equo).
   ===================================================================== */
async function vvAlCavallo(cavId){
  const box = document.getElementById("cav-visite-vet-box"); if(!box) return;
  box.innerHTML = "";
  let lista = [];
  if(DEMO_MODE){
    if(!demoState.visiteVet){
      const c = (demoState.cavalli || [])[0], g = n => { const d = new Date(Date.now() - n * 864e5); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
      demoState.visiteVet = c ? [{ cav: c.id, data: g(-6), tipo: "Visita", veterinario: "Dott. Riccardo Mastrovalerio", stato: "programmato" },
        { cav: c.id, data: g(14), tipo: "Vaccino · influenza-tetano", veterinario: "Dott. Riccardo Mastrovalerio", stato: "fatto" },
        { cav: c.id, data: g(70), tipo: "Ecografia", veterinario: "Dott.ssa Laura Bolaffio", stato: "fatto" }] : [];
    }
    lista = (demoState.visiteVet || []).filter(v => v.cav === cavId);
  } else {
    const { data, error } = await sb.rpc("scuderia_visite_veterinario", { p_cavallo: cavId });
    if(error){ console.warn("scuderia_visite_veterinario:", error.message); return; }
    lista = data || [];
  }
  if(currentCavalloId !== cavId) return;
  if(!lista.length){ box.innerHTML = ""; return; }
  const dt = d => d ? new Date(String(d).slice(0, 10) + "T12:00").toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }) : "";
  const anno = d => d ? String(d).slice(0, 4) : "";
  const oggi = new Date().getFullYear().toString();
  box.innerHTML = `<div class="card vv-box"><div class="vv-testa"><h3><i class="fa-solid fa-stethoscope" style="color:var(--primary)"></i> Visite del veterinario</h3>
      <small><i class="fa-solid fa-lock"></i> diagnosi e referti li vede solo il proprietario</small></div>
    ${lista.slice(0, 20).map(v => `<div class="vv-riga"><span class="vv-data">${escapeHtml(dt(v.data))}${anno(v.data) !== oggi ? `<br><small style="font-weight:400;color:var(--muted)">${escapeHtml(anno(v.data))}</small>` : ""}</span>
      <span class="vv-tipo">${escapeHtml(v.tipo || "Visita")}${v.stato !== "fatto" ? '<span class="vv-prog">fissata</span>' : ""}</span>
      <span class="vv-vet">${escapeHtml(v.veterinario || "Veterinario")}</span></div>`).join("")}</div>`;
}
