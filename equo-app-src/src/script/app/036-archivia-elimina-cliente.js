/* ---------- ARCHIVIA / ELIMINA CLIENTE ----------
   Regola: il cavallo è al centro e il suo storico resta a vita. Un cliente con cavalli, interventi o messaggi
   non si cancella: si archivia (anche il database lo impedisce). Si elimina solo un cliente vuoto. */
let archiviaModo = "archivia", archiviaCavalli = [];
async function deleteCurrentCliente(){
  if(!currentClienteId) return;
  const c = clientiMascalcia.find(x => x.id === currentClienteId);
  if(!c) return;
  if(c.archiviato_il) return ripristinaClienteCorrente();
  const [cav, inter] = await Promise.all([DB.listCavalliCliente(c.id), DB.listInterventiMascalcia(c.id)]);
  archiviaCavalli = cav.filter(x => x.id && !x.presso);
  const nCav = cav.filter(x => !x.presso).length;
  impostaDialogoArchivia(c, nCav === 0 && inter.length === 0 ? "elimina" : "archivia", cav.filter(x => !x.presso), inter.length);
  closeModal("modal-edit-cliente");
  openModal("modal-archivia-cliente");
}

function impostaDialogoArchivia(c, modo, cavalli, nInterventi){
  archiviaModo = modo;
  const nome = escapeHtml(c.nome || "il cliente");
  const err = document.getElementById("archivia-cliente-error"); err.style.display = "none";
  document.getElementById("archivia-cliente-sposta").style.display = "none";
  const ok = document.getElementById("archivia-cliente-ok"); ok.disabled = false;
  const altri = clientiAttivi().filter(x => x.id !== c.id);
  document.getElementById("archivia-cliente-btn-sposta").style.display = modo === "archivia" && archiviaCavalli.length && altri.length ? "block" : "none";
  if(modo === "elimina"){
    document.getElementById("archivia-cliente-titolo").textContent = "Elimina cliente";
    document.getElementById("archivia-cliente-testo").innerHTML = `<strong>${nome}</strong> non ha cavalli né interventi: puoi eliminarlo definitivamente (ad esempio se l'hai creato per sbaglio).`;
    ok.textContent = "Elimina cliente"; ok.className = "btn btn-danger";
    return;
  }
  const nomiCav = (cavalli || []).map(x => escapeHtml(x.nome)).join(", ");
  const parti = [];
  if(nomiCav) parti.push(`${(cavalli.length === 1 ? "il cavallo " : "i cavalli ")}<strong>${nomiCav}</strong>`);
  if(nInterventi) parti.push(nInterventi === 1 ? "l'intervento registrato" : `i ${nInterventi} interventi registrati`);
  document.getElementById("archivia-cliente-titolo").textContent = "Archivia cliente";
  document.getElementById("archivia-cliente-testo").innerHTML =
    `${parti.length ? parti.join(" e ").replace(/^./, x => x.toUpperCase()) + (parti.length > 1 || (cavalli || []).length > 1 || nInterventi > 1 ? " restano" : " resta") + " nello storico: non si cancella niente." : "Lo storico resta: non si cancella niente."}<br>`
    + `<strong>${nome}</strong> sparisce dalla lista e dalle scadenze; lo ritrovi in fondo a Clienti in «Clienti archiviati» e puoi ripristinarlo.`
    + (archiviaCavalli.length && altri.length ? `<br><span class="muted">Se i cavalli ora li segui presso un altro cliente (es. la scuderia dove stanno), spostali prima.</span>` : "");
  ok.textContent = "Archivia cliente"; ok.className = "btn btn-primary";
}

function mostraSpostaCavalli(){
  const c = clientiMascalcia.find(x => x.id === currentClienteId);
  if(!c) return;
  document.getElementById("archivia-cliente-cavalli").innerHTML = archiviaCavalli.map(x =>
    `<label style="display:flex;align-items:center;gap:8px;font-size:13.5px"><input type="checkbox" value="${x.id}" checked> ${escapeHtml(x.nome)}${x.codice_equo ? ` <span class="muted" style="font-size:11.5px">${escapeHtml(x.codice_equo)}</span>` : ""}</label>`).join("");
  const alf = (a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" });
  const altri = clientiAttivi().filter(x => x.id !== c.id).sort(alf);
  document.getElementById("archivia-cliente-dest").innerHTML = '<option value="">Scegli dove spostarli…</option>'
    + altri.map(x => `<option value="${x.id}">${escapeHtml(x.nome)}${isStruttura(x) ? " (scuderia)" : ""}</option>`).join("");
  document.getElementById("archivia-cliente-sposta").style.display = "block";
  document.getElementById("archivia-cliente-btn-sposta").style.display = "none";
}

async function spostaCavalliCliente(btn){
  const err = document.getElementById("archivia-cliente-error"); err.style.display = "none";
  const ids = [...document.querySelectorAll("#archivia-cliente-cavalli input:checked")].map(i => i.value);
  const dest = document.getElementById("archivia-cliente-dest").value;
  if(!ids.length){ err.textContent = "Scegli almeno un cavallo."; err.style.display = "block"; return; }
  if(!dest){ err.textContent = "Scegli il cliente in cui spostarli."; err.style.display = "block"; return; }
  btn.disabled = true;
  const res = await DB.spostaCavalli(ids, dest);
  btn.disabled = false;
  if(!res || !res.ok){ err.textContent = (res && res.errore) || "Spostamento non riuscito. Riprova."; err.style.display = "block"; return; }
  const nomeDest = clientiMascalcia.find(x => x.id === dest)?.nome || "l'altro cliente";
  showToast(`${res.spostati === 1 ? "Cavallo spostato" : (res.spostati || ids.length) + " cavalli spostati"} in «${nomeDest}»`);
  await loadClientiMascalcia();
  await deleteCurrentCliente();  // aggiorna il riquadro: ora si può archiviare (o eliminare, se è rimasto vuoto)
}

async function confermaArchiviaCliente(btn){
  const id = currentClienteId;
  const c = clientiMascalcia.find(x => x.id === id);
  if(!c) return;
  const err = document.getElementById("archivia-cliente-error"); err.style.display = "none";
  btn.disabled = true;
  if(archiviaModo === "elimina"){
    const { error } = await DB.deleteClienteMascalcia(id);
    if(error){
      // ha messaggi o altro storico: allora si archivia
      btn.disabled = false;
      impostaDialogoArchivia(c, "archivia", [], 0);
      err.textContent = "Questo cliente ha dei messaggi in chat: non si può eliminare, ma puoi archiviarlo.";
      err.style.display = "block";
      return;
    }
    showToast("Cliente eliminato");
  } else {
    const { error } = await DB.archiviaClienteMascalcia(id, true);
    if(error){ btn.disabled = false; err.textContent = "Archiviazione non riuscita. Riprova."; err.style.display = "block"; return; }
    showToast("Cliente archiviato: cavalli e storico restano");
  }
  closeModal("modal-archivia-cliente");
  closeClienteDetail();
  await loadClientiMascalcia();
}

async function ripristinaClienteCorrente(){
  const id = currentClienteId;
  if(!isPremium() && clientiAttivi().length >= LIMITE_CLIENTI_FREE){ mostraLimiteClienti(); return; }
  const { error } = await DB.archiviaClienteMascalcia(id, false);
  if(error){
    if(String(error.message || "").includes("LIMITE_CLIENTI_FREE")) mostraLimiteClienti();
    else showToast("Ripristino non riuscito. Riprova.");
    return;
  }
  closeModal("modal-edit-cliente");
  showToast("Cliente ripristinato");
  await loadClientiMascalcia();
  await openClienteDetail(id);
}

let storicoFiltroCavallo = "tutti";
