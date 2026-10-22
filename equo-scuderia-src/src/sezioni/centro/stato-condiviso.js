// Equo App · centro · STATO CONDIVISO: variabili che anche altre parti dell'app leggono o cambiano.
// Script classico caricato PRIMA dei moduli centro e dello script principale: qui solo dati, nessuna funzione.
// da 055-zona-del-centro-serve-al-radar-di-merlin.js
let statDati = null, radarAttesa = null;
// da 055-zona-del-centro-serve-al-radar-di-merlin.js
const MESI_BREVI = ["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"];
// da 055-zona-del-centro-serve-al-radar-di-merlin.js
const euro = (n, dec) => n == null || isNaN(n) ? "—" : "€ " + Number(n).toLocaleString("it-IT", { minimumFractionDigits: dec ? 2 : 0, maximumFractionDigits: dec ? 2 : 0 });
