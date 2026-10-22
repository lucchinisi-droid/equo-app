// Equo App · home · STATO CONDIVISO: variabili che anche altre parti dell'app leggono o cambiano.
// Script classico caricato PRIMA dei moduli home e dello script principale: qui solo dati, nessuna funzione.
// da 048-contatori-a-semaforo-nel-menu-verde-0-tu.js
const SOGLIE_CONTATORI = {
  pacchettiGiorni: 14,     // pacchetto in scadenza entro N giorni → giallo
  carnetUnitaRimaste: 1,   // carnet con N lezioni rimaste o meno → giallo
  saluteGiorni: 30,        // scadenza sanitaria entro N giorni → giallo
};
// da 048-contatori-a-semaforo-nel-menu-verde-0-tu.js
const oggiLocaleIso = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); };
// da 052-post-it-promemoria.js
let notaColoreSelezionato = "giallo";
// da 053-drag-drop-post-it-mouse-e-touch.js
const MODULE_TITLES = {
  home:"Home", centro:"Il tuo Centro", cavalli:"Cavalli & Salute", lezioni:"Lezioni & Prenotazioni",
  pacchetti:"Pacchetti & Abbonamenti", comunicazioni:"Messaggi",
  professionisti:"Professionisti", groom:"Gestione Groom", magazzino:"Magazzino", statistiche:"Statistiche", store:"Store", fatturazione:"Fatturazione SDI", ai:"Agenti AI",
};
