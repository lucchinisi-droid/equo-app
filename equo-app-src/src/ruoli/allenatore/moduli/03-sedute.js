// Equo App · allenatore · modulo "sedute" (moduli ES, costruiti con Vite in ruoli/allenatore/costruito.js)
import { TR } from "./stato.js";
import { carica, righe, slotHtml } from "./01-dati.js";
import { pagina } from "./02-home.js";
 // ----- Sedute
 window.trRenderSedute=async function(){
  var p=pagina("tr-sedute");if(!TR.caricato)await carica();
  p.innerHTML='<div class="tr-h" style="display:flex;justify-content:space-between;align-items:center"><span>Sedute</span><button class="tr-btn" onclick="trNuova()">+ Nuova</button></div><div class="tr-sub">Il lavoro con i tuoi cavalli, video e analisi.</div>'+slotHtml()+'<div class="tr-card">'+righe(TR.sedute)+'</div>';
 };
