// Equo App · home · modulo (moduli ES, costruiti con Vite in ruoli/home/costruito.js)
import { loadNote, renderNote } from "./052-post-it-promemoria.js";
import { renderHomeQuickAccess, renderHomeStats } from "./053-drag-drop-post-it-mouse-e-touch.js";
/* ---------- HOME (cruscotto) ---------- */
const QUICK_ACCESS_ITEMS = [
  { key:"centro", icon:"fa-house-chimney", titolo:"Il tuo Centro", testo:"Anagrafica centro, team e codice invito." },
  { key:"cavalli", icon:"fa-horse-head", titolo:"Cavalli & Salute", testo:"Anagrafica cavalli e scadenzario sanitario." },
  { key:"lezioni", icon:"fa-calendar-days", titolo:"Lezioni & Prenotazioni", testo:"Calendario delle lezioni del centro." },
  { key:"pacchetti", icon:"fa-ticket", titolo:"Pacchetti & Abbonamenti", testo:"Carnet, abbonamenti e cruscotto scadenze." },
  { key:"comunicazioni", icon:"fa-comments", titolo:"Messaggi", testo:"Messaggi al team e chat con i clienti." },
  { key:"magazzino", icon:"fa-boxes-stacked", titolo:"Magazzino", testo:"Scorte, depositi e riordini con il semaforo." },
  { key:"statistiche", icon:"fa-chart-line", titolo:"Statistiche", testo:"Incassi, clienti a rischio, margini e radar della concorrenza." },
  { key:"professionisti", icon:"fa-user-doctor", titolo:"Professionisti", testo:"Maniscalchi collegati: chat e appuntamenti con doppia conferma." },
  { key:"store", icon:"fa-store", titolo:"Store", testo:"Vendita di prodotti e servizi ai clienti.", soon:true },
  { key:"fatturazione", icon:"fa-file-invoice", titolo:"Fatturazione SDI", testo:"Fatture elettroniche conformi SDI.", soon:true },
  { key:"ai", icon:"fa-wand-magic-sparkles", titolo:"Agenti AI", testo:"Athena inclusa, Merlino per numeri e strategia; in arrivo Ermes, Galeno, Hammer, Ares." },
];

async function refreshHomeModule(){
  try{ meteoScud(); }catch(e){ console.warn("meteo:", e); }
  await Promise.all([
    cavalliList.length === 0 ? loadCavalli() : Promise.resolve(),
    loadEventiAll(), loadLezioni(), loadPacchetti(), loadMessaggi(), loadNote(),
  ]);
  renderHomeStats();
  renderHomeQuickAccess();
  renderNote();
}


export { QUICK_ACCESS_ITEMS, refreshHomeModule };
