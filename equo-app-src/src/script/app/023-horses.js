/* ---------- HORSES ---------- */
async function loadHorses(){
  horses = await DB.listHorses();
  renderHome();
  renderHorsesList();
  controllaStessoCavallo();
  caricaProposteCavalli();
  caricaCavalliBloccati();
}

