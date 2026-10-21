/* ---------- MASCALCIA (clienti + interventi del professionista) ---------- */
let clientiMascalcia = [];
let proUnreadTotal = 0;
let currentClienteId = null;
const TIPO_FERRATURA_LABELS = { ferratura: "Ferratura", mezza_ferratura: "Mezza ferratura", pareggio: "Pareggio", altro: "Altro" };
const TIPO_FERRATURA_INTERVALLI = { ferratura: 35, mezza_ferratura: 35, pareggio: 56 }; // giorni alla prossima scadenza (valori di partenza)

