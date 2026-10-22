// Equo App · magazzino · modulo (moduli ES, costruiti con Vite in ruoli/magazzino/costruito.js)
import { magRigaMovimento } from "./032-movimenti.js";
/* ---------------- dettaglio articolo ---------------- */
function magApriDettaglio(id){
  const a = mag.articoli.find(x => x.id === id); if(!a) return;
  const c = mag.calc[a.id];
  const f = mag.fornitori.find(x => x.id === a.fornitore_id);
  const movs = mag.movimenti.filter(m => m.articolo_id === id).slice(0, 12);
  document.getElementById("mag-det-corpo").innerHTML = `
    <div class="mag-det-head">${magIcona(a.categoria).replace('class="ic"', 'class="ic"')}
      <div style="flex:1;min-width:0"><div style="font-size:18px;font-weight:800">${escapeHtml(a.nome)}</div>
      <div style="color:var(--muted);font-size:12.5px">${escapeHtml([magCats()[a.categoria]?.nome, a.sottocategoria, a.marca, a.formato].filter(Boolean).join(" · "))}</div></div>
      <span class="badge-pill ${c.stato === "rosso" ? "badge-red" : c.stato === "giallo" ? "badge-yellow" : "badge-green"}"><i class="mag-sem ${c.stato}" style="width:8px;height:8px"></i> ${escapeHtml(c.motivo)}</span></div>
    <div class="mag-det-nums">
      <div><b>${magFmt(c.giacenza)}</b><small>${escapeHtml(a.unita)} in magazzino${magEquivalente(c.giacenza, a) ? "<br>" + magEquivalente(c.giacenza, a) : ""}</small></div>
      <div><b>${magFmt(a.soglia_minima)}</b><small>soglia minima</small></div>
      <div><b>${c.copertura !== null ? c.copertura + " gg" : "—"}</b><small>di scorta</small></div>
      <div><b>${a.costo_unitario ? magEuro(c.valore) : "—"}</b><small>valore</small></div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-sm btn-outline" onclick="closeModal('modal-mag-dettaglio');magApriMovimento('${a.id}','scarico')" style="color:var(--danger)"><i class="fa-solid fa-minus"></i> Usa / scarica</button>
      <button class="btn btn-sm btn-outline" onclick="closeModal('modal-mag-dettaglio');magApriMovimento('${a.id}','carico')" style="color:#2f8a4e"><i class="fa-solid fa-plus"></i> Carica</button>
      <button class="btn btn-sm btn-outline" onclick="closeModal('modal-mag-dettaglio');magApriMovimento('${a.id}','rettifica')"><i class="fa-solid fa-scale-balanced"></i> Inventario</button>
      ${magPuoGestire() ? `<button class="btn btn-sm btn-ghost btn-variazione" onclick="closeModal('modal-mag-dettaglio');magApriArticolo('${a.id}')"><i class="fa-solid fa-pen"></i> Modifica</button>` : ""}
    </div>
    <div class="mag-det-sez">Dove e da chi</div>
    <div style="font-size:13.5px;line-height:1.7">
      <div><i class="fa-solid fa-location-dot" style="width:18px;color:var(--muted)"></i> ${escapeHtml(magUbiNome(a.ubicazione_id) || "Ubicazione non indicata")}</div>
      <div><i class="fa-solid fa-handshake" style="width:18px;color:var(--muted)"></i> ${f ? escapeHtml(f.nome) + (f.telefono ? ` · <a href="tel:${escapeHtml(f.telefono)}">${escapeHtml(f.telefono)}</a>` : "") : "Fornitore non indicato"}</div>
      ${a.costo_unitario ? `<div><i class="fa-solid fa-tag" style="width:18px;color:var(--muted)"></i> ${magEuro(a.costo_unitario)} per ${escapeHtml(a.unita)}</div>` : ""}
      ${c.consumo30 ? `<div><i class="fa-solid fa-chart-line" style="width:18px;color:var(--muted)"></i> Consumo ultimi 30 giorni: ${magFmt(c.consumo30)} ${escapeHtml(a.unita)} (${magFmt(c.mediaGiorno, 1)} al giorno)</div>` : ""}
      ${a.note ? `<div><i class="fa-solid fa-note-sticky" style="width:18px;color:var(--muted)"></i> ${escapeHtml(a.note)}</div>` : ""}
    </div>
    ${c.lottiAttivi.length ? `<div class="mag-det-sez">Lotti in magazzino (usa prima quelli in alto)</div>` + c.lottiAttivi.map(l => {
      const gg = l.scadenza ? magGiorniA(l.scadenza) : null;
      return `<div class="mag-lotto"><span><b>${escapeHtml(l.lotto || "senza lotto")}</b> · ${magFmt(l.qta)} ${escapeHtml(a.unita)}</span>
        <span class="mag-tag ${gg !== null && gg < 0 ? "rosso" : gg !== null && gg <= 30 ? "giallo" : ""}">${l.scadenza ? (gg < 0 ? "scaduto il " : "scade il ") + magDataIt(l.scadenza) : "senza scadenza"}</span></div>`; }).join("") : ""}
    <div class="mag-det-sez">Ultimi movimenti</div>
    ${movs.length ? movs.map(m => magRigaMovimento(m, true)).join("") : `<div style="color:var(--muted);font-size:13px">Nessun movimento registrato.</div>`}`;
  openModal("modal-mag-dettaglio");
}


export { magApriDettaglio };
