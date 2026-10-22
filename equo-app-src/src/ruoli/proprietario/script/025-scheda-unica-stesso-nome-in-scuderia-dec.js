/* ---------- SCHEDA UNICA: stesso nome in scuderia → decide il proprietario ---------- */
let stessoCavalloCoda = null, stessoCavalloAttuale = null;
async function controllaStessoCavallo(){
  if(DEMO_MODE || stessoCavalloCoda !== null || !horses.length) return;
  stessoCavalloCoda = [];
  try{
    const { data, error } = await sb.rpc("equo_proposte_collegamento");
    if(error || !data) return;
    stessoCavalloCoda = data;
    mostraStessoCavallo();
  } catch(e){}
}
function mostraStessoCavallo(){
  stessoCavalloAttuale = stessoCavalloCoda.shift() || null;
  if(!stessoCavalloAttuale){ closeModal("modal-stesso-cavallo"); return; }
  const p = stessoCavalloAttuale;
  document.getElementById("stesso-cavallo-testo").innerHTML =
    escapeHtml(p.centro_nome || "La tua scuderia") + " ha una scheda <b>«" + escapeHtml(p.scheda_nome) + "»</b>" +
    (p.codice_scheda ? " (" + escapeHtml(p.codice_scheda) + ")" : "") +
    ". È il tuo cavallo <b>" + escapeHtml(p.horse_nome) + "</b>?<br><br>Se sì, le due schede diventano un unico cavallo con un solo codice Equo (resta il numero più vecchio) e condividete registro sanitario e appuntamenti. Spese e note personali restano solo tue.";
  openModal("modal-stesso-cavallo");
}
async function rispondiStessoCavallo(stesso){
  const p = stessoCavalloAttuale;
  if(!p) return;
  const btn = document.getElementById("stesso-cavallo-ok");
  btn.disabled = true;
  try{
    const { data, error } = await sb.rpc("equo_conferma_collegamento", { p_horse: p.horse_id, p_scheda: p.scuderia_cavallo_id, p_stesso: stesso });
    if(error) throw error;
    if(stesso && data && data.ok){
      showToast(p.horse_nome + " ora è un unico cavallo: codice Equo n. " + data.numero);
      horses = await DB.listHorses();
      renderHorsesList();
      if(currentHorseId === p.horse_id) await openHorseDetail(p.horse_id);
    } else if(!stesso){
      showToast("Ok, restano due cavalli diversi");
    } else {
      showToast("Non è stato possibile unire le schede");
    }
  } catch(e){
    showToast(e.message || "Errore, riprova");
  } finally {
    btn.disabled = false;
  }
  mostraStessoCavallo();
}

function renderHome(){ renderHomeBase(); eseguiEstensioniSubito(estensioniDopo, "renderHome"); }
function renderHomeBase(){
  renderHomeGreeting();
  const setupBox = document.getElementById("home-setup");
  const mainBox = document.getElementById("home-main");
  if(horses.length === 0){
    setupBox.style.display = "block";
    mainBox.style.display = "none";
    document.getElementById("topbar-context").textContent = "Nessun cavallo";
    return;
  }
  setupBox.style.display = "none";
  mainBox.style.display = "block";
  document.getElementById("topbar-context").textContent = horses.length === 1 ? horses[0].name : horses.length + " cavalli";
  loadDeadlines();
  loadExpensesSummary();
  loadHomeLastMessage();
  caricaDaSaldare();
  if(typeof wgCaricaOwner === "function" && typeof vistaWidgetAttiva === "function" && vistaWidgetAttiva()) wgCaricaOwner();
}

