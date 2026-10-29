// Ingresso dei moduli del veterinario (29/10/2026). Il veterinario è un ruolo dentro la stessa app:
// stesse tabelle, stessi sistemi del maniscalco (agenda, «Fatto», conti, chat, collegamenti). Qui solo ciò che è suo.
import { renderHomeVet, vhGiornata, vhDetta, vhMeteo } from "./01-home.js";
import { vdPrepara } from "./02-demo.js";

// API PUBBLICA del veterinario: le funzioni chiamate dai pulsanti dell'HTML e dalle altre parti dell'app.
Object.assign(window, {
  renderHomeVet,
  vhGiornata,
  vhDetta,
  vhMeteo,
  vdPrepara
});
