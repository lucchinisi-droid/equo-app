// Ingresso dei moduli del veterinario (29/10/2026). Il veterinario è un ruolo dentro la stessa app:
// stesse tabelle, stessi sistemi del maniscalco (agenda, «Fatto», conti, chat, collegamenti). Qui solo ciò che è suo.
import { renderHomeVet, vhGiornata, vhDetta, vhMeteo } from "./01-home.js";
import { vdPrepara } from "./02-demo.js";
import { vetEtichettaGruppo, vetTestiAgenda } from "./03-agenda.js";
import { vetRenderClienti, vetFiltroClienti, vetVaiLettera } from "./04-clienti.js";
import { vmDecora, vmFiltra, vmNuovoMessaggio } from "./05-messaggi.js";
import { galenoTestata } from "./06-galeno.js";
import { vsApriDaEvento, vsMostraScelta, vsMostraMiei, vsNuova, vsTab, vsCambia, vsScegli, vsMulti, vsConcludi, vsChiudi, vsIndietro,
  vsModelloDaEsempio, vsModelloDa, vsModificaModello, vsAccendi, vsSposta, vsAggiungiCampo, vsSalvaModello, vsDemoPrepara, VS, VsDB } from "./07-scheda-visita.js";

// API PUBBLICA del veterinario: le funzioni chiamate dai pulsanti dell'HTML e dalle altre parti dell'app.
Object.assign(window, {
  renderHomeVet,
  vhGiornata,
  vhDetta,
  vhMeteo,
  vdPrepara,
  vetEtichettaGruppo,
  vetTestiAgenda,
  vetRenderClienti,
  vetFiltroClienti,
  vetVaiLettera,
  vmDecora,
  vmFiltra,
  vmNuovoMessaggio,
  galenoTestata,
  vsApriDaEvento, vsMostraScelta, vsMostraMiei, vsNuova, vsTab, vsCambia, vsScegli, vsMulti, vsConcludi, vsChiudi, vsIndietro,
  vsModelloDaEsempio, vsModelloDa, vsModificaModello, vsAccendi, vsSposta, vsAggiungiCampo, vsSalvaModello, vsDemoPrepara, VS, VsDB
});
