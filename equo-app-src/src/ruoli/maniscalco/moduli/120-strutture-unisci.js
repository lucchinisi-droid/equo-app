// Equo App · maniscalco · STRUTTURE DA UNIRE E CAVALLI «DA VERIFICARE» (9/11/2026 · SQL 47)
// Nasce dal caso Giulius Caesar: il maniscalco aveva già la struttura tra i suoi clienti e il collegamento ne creava un'altra.
//  · accettando l'invito di una struttura, Equo propone i clienti che sembrano la stessa (nome simile, telefono, collegata in passato):
//    se il maniscalco ne sceglie uno, schede, cavalli e lavori si uniscono;
//  · nella scheda della struttura collegata: proposta di unione con i clienti simili, cavalli che la struttura dice
//    «non sono nostri» (da verificare per 30 giorni, poi si possono eliminare) e cavalli in attesa di conferma.

const suEsc = s => escapeHtml(s == null ? "" : String(s));

// Finestra «È la stessa struttura?»: risolve con l'id del cliente da unire, null (struttura nuova) o false (annulla)
async function proSceltaUnione(clienteId){
  let simili = [];
  try{ const { data } = await sb.rpc("pro_strutture_simili", { p_cliente_id: clienteId }); simili = data || []; }catch(_){ simili = []; }
  if(!simili.length) return null;
  const c = (typeof clientiMascalcia !== "undefined" ? clientiMascalcia : []).find(x => x.id === clienteId) || {};
  return new Promise(risolvi => {
    let ov = document.getElementById("modal-unisci-struttura");
    if(!ov){ ov = document.createElement("div"); ov.id = "modal-unisci-struttura"; ov.className = "modal-overlay"; document.body.appendChild(ov); }
    ov.innerHTML = `<div class="modal" style="max-width:440px">
      <div class="modal-title">È la stessa struttura?</div>
      <p style="font-size:13.5px;line-height:1.5;margin:0 0 10px">Hai già tra i clienti una struttura che sembra <b>${suEsc(c.nome || "questa")}</b>. Se è la stessa, unisco le schede: cavalli e lavori finiscono nel collegamento, senza doppioni.</p>
      ${simili.map((s, i) => `<label style="display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-top:1px solid var(--border);cursor:pointer">
        <input type="radio" name="su-scelta" value="${s.id}" ${i === 0 ? "checked" : ""} style="margin-top:3px">
        <span><b>${suEsc(s.nome)}</b><br><small class="muted">${s.cavalli} cavalli · ${s.lavori} lavori · ${suEsc(s.motivo)}</small></span></label>`).join("")}
      <label style="display:flex;gap:10px;align-items:center;padding:9px 0;border-top:1px solid var(--border);cursor:pointer">
        <input type="radio" name="su-scelta" value=""> <span>No, è una struttura nuova</span></label>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button type="button" class="btn btn-outline" style="flex:1" id="su-annulla">Annulla</button>
        <button type="button" class="btn btn-primary" style="flex:1" id="su-ok">Accetta</button></div></div>`;
    const chiudi = v => { ov.classList.remove("active"); risolvi(v); };
    ov.querySelector("#su-annulla").onclick = () => chiudi(false);
    ov.querySelector("#su-ok").onclick = () => chiudi(ov.querySelector('input[name="su-scelta"]:checked')?.value || null);
    ov.classList.add("active");
  });
}

// riquadro nella scheda della struttura collegata
async function proAvvisiStruttura(clienteId){
  const info = document.getElementById("detail-cliente-info");
  if(!info || DEMO_MODE) return;
  let box = document.getElementById("pro-avvisi-struttura");
  if(!box){ box = document.createElement("div"); box.id = "pro-avvisi-struttura"; info.parentNode.insertBefore(box, info.nextSibling); }
  box.innerHTML = "";
  const { data } = await sb.rpc("pro_struttura_avvisi", { p_cliente_id: clienteId });
  if(!data || currentClienteId !== clienteId) return;
  const parti = [];
  const cliente = data.tipo === "cliente";   // 9/11/2026 (SQL 53): cliente privato collegato con l'app
  (data.simili || []).forEach(s => parti.push(`<div style="padding:8px 0;border-top:1px solid var(--border)">
    <div style="font-size:13.5px">Hai anche <b>${suEsc(s.nome)}</b> tra i clienti (${s.cavalli} cavalli, ${s.lavori} lavori · ${suEsc(s.motivo)}): ${cliente ? "è la stessa persona? Unendo, i suoi cavalli e i lavori passano qui e lui li riceve da accettare." : "è la stessa struttura?"}</div>
    <div style="display:flex;gap:6px;margin-top:6px"><button type="button" class="btn btn-primary btn-sm" onclick="proUnisciStruttura('${clienteId}','${s.id}',this)">Sì, unisci</button>
      <button type="button" class="btn btn-outline btn-sm" onclick="proNonUnire('${clienteId}','${s.id}',this)">${cliente ? "No, è un altro" : "No, è diversa"}</button></div></div>`));
  (data.rifiutati || []).forEach(r => parti.push(`<div style="padding:8px 0;border-top:1px solid var(--border)">
    <div style="font-size:13.5px"><b>${suEsc(r.nome)}</b>: la struttura dice che non è suo. <span class="muted" style="font-size:12px">Da verificare</span></div>
    <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">
      <button type="button" class="btn btn-outline btn-sm" onclick="proCavalloRifiutato('${r.id}','tieni',this)">È suo: riproponi</button>
      <button type="button" class="btn btn-ghost btn-sm" ${r.eliminabile ? "" : 'title="Si può eliminare 30 giorni dopo la risposta della struttura"'} onclick="proCavalloRifiutato('${r.id}','elimina',this)">Elimina</button></div></div>`));
  if(Number(data.in_attesa) > 0) parti.push(`<div class="muted" style="padding:8px 0;border-top:1px solid var(--border);font-size:12.5px">⏳ ${data.in_attesa} ${Number(data.in_attesa) === 1 ? "cavallo è" : "cavalli sono"} in attesa che la struttura confermi che sono suoi.</div>`);
  if(!parti.length) return;
  box.innerHTML = `<div class="card" style="margin:10px 0;border-color:rgba(232,176,75,.7)"><div style="font-weight:800;margin-bottom:2px">${cliente ? "Forse è un cliente che hai già" : "Da sistemare con la struttura"}</div>${parti.join("")}</div>`;
}
async function proUnisciStruttura(collegato, vecchio, btn){
  if(btn) btn.disabled = true;
  const { data, error } = await sb.rpc("pro_unisci_struttura", { p_collegato: collegato, p_vecchio: vecchio });
  if(error || !data?.ok){ if(btn) btn.disabled = false; return showToast("Unione non riuscita: riprova"); }
  showToast(`Fatto: ${data.uniti} cavalli uniti, ${data.spostati} spostati, ${data.lavori} lavori nella scheda collegata`);
  if(typeof loadClientiMascalcia === "function") await loadClientiMascalcia();
  if(typeof openClienteDetail === "function") openClienteDetail(collegato);
}
async function proNonUnire(collegato, vecchio, btn){
  if(btn) btn.disabled = true;
  await sb.rpc("pro_non_unire", { p_collegato: collegato, p_vecchio: vecchio });
  proAvvisiStruttura(collegato);
}
async function proCavalloRifiutato(riga, azione, btn){
  if(btn) btn.disabled = true;
  const { data } = await sb.rpc("pro_cavallo_rifiutato", { p_riga: riga, p_azione: azione });
  if(!data?.ok){ if(btn) btn.disabled = false; return showToast((data && data.errore) || "Non riuscito: riprova"); }
  showToast(data.fatto === "riproposto" ? "Riproposto alla struttura" : data.fatto === "archiviato" ? "Archiviato: lo storico dei lavori resta" : "Eliminato");
  if(typeof loadClientiMascalcia === "function") await loadClientiMascalcia();
  if(currentClienteId) proAvvisiStruttura(currentClienteId);
}

export { proSceltaUnione, proAvvisiStruttura, proUnisciStruttura, proNonUnire, proCavalloRifiutato };
