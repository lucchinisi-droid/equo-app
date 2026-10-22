/* ---------- RICHIESTE DI APPUNTAMENTO (Step 5d) ---------- */
const STATI_NON_CONFERMATI = ["richiesto", "rifiutato", "proposto", "annullato"];
let richiesteCache = {};

function formatDataBreve(iso){
  if(!iso) return "";
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${AG_GIORNI[(dt.getDay() + 6) % 7].toLowerCase()} ${d} ${AG_MESI[m - 1]}`;
}
// Testo del messaggio automatico in chat (richiesta / conferma / rifiuto)
function testoRichiesta(prefisso, i, nomeCavallo){
  let tipo = TIPO_FERRATURA_LABELS[i.tipo_ferratura] || i.tipo_ferratura || "";
  if(i.tipo_ferratura === "altro" && i.tipo_altro) tipo = i.tipo_altro;
  return `${prefisso}: ${tipo}${nomeCavallo ? " per " + nomeCavallo : ""}, ${formatDataBreve(i.data_intervento)}${i.ora ? " ore " + String(i.ora).slice(0, 5) : ""}.${i.note ? " Note: " + i.note : ""}`;
}

async function renderRichiestePendenti(){
  const box = document.getElementById("ag-richieste");
  if(!box) return;
  const tutte = await DB.listRichiestePendenti();
  richiesteCache = {};
  tutte.forEach(r => { richiesteCache[r.id] = r; });
  // appuntamenti chiesti da una struttura (più cavalli) = una sola richiesta
  const visti = {};
  const lista = [];
  tutte.forEach(r => {
    if(!r.gruppo_id){ lista.push(r); return; }
    if(visti[r.gruppo_id]){ visti[r.gruppo_id]._cavalli.push(agNomeCavallo(r)); return; }
    visti[r.gruppo_id] = { ...r, _cavalli: [agNomeCavallo(r)] };
    lista.push(visti[r.gruppo_id]);
  });
  if(!lista.length){ box.style.display = "none"; box.innerHTML = ""; return; }
  box.style.display = "block";
  box.innerHTML = `
    <div style="font-weight:800;font-size:14px;margin-bottom:4px">📅 ${lista.length === 1 ? "1 richiesta da confermare" : lista.length + " richieste da confermare"}</div>
    ${lista.map(r => `
      <div class="rich-item">
        <div style="flex:1;min-width:0;cursor:pointer" onclick="vaiAllaDataAgenda('${r.data_intervento}')">
          <div style="font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(r.clienti_mascalcia?.nome || "")}${(r._cavalli ? r._cavalli.filter(Boolean).join(", ") : agNomeCavallo(r)) ? " · " + escapeHtml(r._cavalli ? r._cavalli.filter(Boolean).join(", ") : agNomeCavallo(r)) : ""}</div>
          <div class="muted" style="font-size:12px">${formatDataBreve(r.data_intervento)}${r.ora ? " · " + String(r.ora).slice(0, 5) : ""} · ${escapeHtml(agDescrizioneTipoPro(r))}${r.note ? " · " + escapeHtml(r.note) : ""}</div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="rifiutaRichiesta('${r.id}')">Rifiuta</button>
        <button class="btn btn-primary btn-sm btn-conferma" onclick="accettaRichiesta('${r.id}')">Accetta</button>
      </div>`).join("")}`;
}

