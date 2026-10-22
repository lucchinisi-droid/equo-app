// Equo App · lezioni-pacchetti-comunicazioni · STATO CONDIVISO: variabili che anche altre parti dell'app leggono o cambiano.
// Script classico caricato PRIMA dei moduli lezioni-pacchetti-comunicazioni e dello script principale: qui solo dati, nessuna funzione.
// da 044-lezioni-prenotazioni.js
const STATO_LEZIONE_BADGE = { prenotata:"gray", confermata:"green", completata:"green", annullata:"red" };
// da 045-pacchetti-abbonamenti.js
const TIPO_PACCHETTO_LABELS = { carnet:"Carnet lezioni", abbonamento:"Abbonamento", pensione:"Pensione" };
