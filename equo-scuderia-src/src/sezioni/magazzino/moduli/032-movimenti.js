// Equo App · magazzino · modulo (moduli ES, costruiti con Vite in ruoli/magazzino/costruito.js)
/* ---------------- movimenti ---------------- */
function magRigaMovimento(m, compatto){
  const a = mag.articoli.find(x => x.id === m.articolo_id);
  const q = Number(m.quantita || 0);
  const segno = m.tipo === "carico" || (m.tipo === "rettifica" && q > 0) ? "+" : m.tipo === "trasferimento" ? "" : "−";
  const cls = segno === "+" ? "piu" : segno === "−" ? "meno" : "";
  const icone = { carico: "fa-truck-ramp-box", scarico: "fa-arrow-up-from-bracket", rettifica: "fa-scale-balanced", trasferimento: "fa-right-left" };
  const cav = m.cavallo_id ? (cavalliList || []).find(c => c.id === m.cavallo_id) : null;
  const dettagli = [
    new Date(m.created_at).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
    m.creato_da_nome, m.lotto ? "lotto " + m.lotto : null, cav ? "🐴 " + cav.nome : null,
    m.tipo === "trasferimento" ? "→ " + (magUbiNome(m.ubicazione_a) || "nuova ubicazione") : null, m.nota,
  ].filter(Boolean).map(escapeHtml).join(" · ");
  return `<div class="mag-mov"><span class="ic ${m.tipo}"><i class="fa-solid ${icone[m.tipo]}"></i></span>
    <div class="t">${compatto ? `<b>${MAG_TIPI_MOV[m.tipo]}</b>` : `<b>${escapeHtml(a?.nome || "Articolo archiviato")}</b> <span style="color:var(--muted)">· ${MAG_TIPI_MOV[m.tipo]}</span>`}<small>${dettagli}</small></div>
    <div class="q ${cls}">${m.tipo === "trasferimento" ? "" : segno + magFmt(Math.abs(q)) + " " + escapeHtml(a?.unita || "")}</div></div>`;
}
function magRenderMovimenti(){
  const box = document.getElementById("mag-mov-lista");
  const q = (document.getElementById("mag-mov-cerca").value || "").trim().toLowerCase();
  const tipo = document.getElementById("mag-mov-tipo").value;
  let lista = mag.movimenti.filter(m => !tipo || m.tipo === tipo);
  if(q) lista = lista.filter(m => {
    const a = mag.articoli.find(x => x.id === m.articolo_id);
    const cav = (cavalliList || []).find(c => c.id === m.cavallo_id);
    return [a?.nome, m.creato_da_nome, m.nota, m.lotto, cav?.nome].filter(Boolean).join(" ").toLowerCase().includes(q);
  });
  lista = lista.slice(0, 300);
  if(!lista.length){ box.innerHTML = `<div class="empty-state"><i class="fa-solid fa-arrow-right-arrow-left"></i><div>Nessun movimento${q || tipo ? " con questi filtri" : " ancora: usa \"Movimento rapido\" per registrare carichi e scarichi"}.</div></div>`; return; }
  let giorno = null, html = "";
  lista.forEach(m => {
    const g = new Date(m.created_at).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
    if(g !== giorno){ html += `<div class="mag-giorno">${g}</div>`; giorno = g; }
    html += magRigaMovimento(m);
  });
  box.innerHTML = html;
}


export { magRenderMovimenti, magRigaMovimento };
