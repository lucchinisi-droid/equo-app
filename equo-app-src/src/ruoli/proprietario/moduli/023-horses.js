// Equo App · proprietario · modulo (moduli ES, costruiti con Vite in ruoli/proprietario/costruito.js)
import { caricaCavalliBloccati, caricaProposteCavalli } from "./024-codice-cavallo-2c-proposte-livelli-confe.js";
import { controllaStessoCavallo, renderHome } from "./025-scheda-unica-stesso-nome-in-scuderia-dec.js";
import { renderHorsesList } from "./026-ultimo-messaggio-home.js";
/* ---------- HORSES ---------- */
async function loadHorses(){
  horses = await DB.listHorses();
  renderHome();
  renderHorsesList();
  controllaStessoCavallo();
  caricaProposteCavalli();
  caricaCavalliBloccati();
}


export { loadHorses };
