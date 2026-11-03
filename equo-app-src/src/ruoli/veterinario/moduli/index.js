// Ingresso dei moduli del veterinario (29/10/2026). Il veterinario è un ruolo dentro la stessa app:
// stesse tabelle, stessi sistemi del maniscalco (agenda, «Fatto», conti, chat, collegamenti). Qui solo ciò che è suo.
import { renderHomeVet, vhGiornata, vhDetta, vhMeteo, vhVai, vhRigheHtml } from "./01-home.js";
import { vdPrepara } from "./02-demo.js";
import { vetEtichettaGruppo, vetTestiAgenda } from "./03-agenda.js";
import { vetRenderClienti, vetFiltroClienti, vetVaiLettera } from "./04-clienti.js";
import { vmDecora, vmFiltra, vmNuovoMessaggio } from "./05-messaggi.js";
import { galenoTestata } from "./06-galeno.js";
import { vsMostraScheda, vsApriDaEvento, vsMostraScelta, vsMostraMiei, vsNuova, vsTab, vsCambia, vsScegli, vsMulti, vsConcludi, vsChiudi, vsIndietro,
  vsModelloDaEsempio, vsModelloDa, vsModificaModello, vsAccendi, vsSposta, vsAggiungiCampo, vsSalvaModello, vsDemoPrepara, VS, VsDB } from "./07-scheda-visita.js";
import { vaNomeLive, vaScegli, vaFile, vaSalva, vaAnnulla, vaImposta, vaCarica, vaApri, vaSezioneHtml, vaModifica, vaSalvaModifica, vaElimina, vaChiVede, vaTogli, vaFaiVedere, vaReset, VA } from "./09-allegati.js";
import { vrApri, vrInvia, vrCondividi, vrCreaPdf, vrSezioni, vrParteScritta, vrDestinatari, VR } from "./08-referto.js";
import { vdVisiteRecenti, vdSezioneHtml, vdContesto, vdDetta, vdDaHome, vdApriDaEvento, vdDopoScheda, vdReset, VD } from "./10-dettatura.js";
import { ptCarica, ptReset, ptSezioneHtml, ptDisegna, ptNuovaVoce, ptModificaVoce, ptCampo, ptVolte, ptOrario, ptTornaScheda, ptSalvaVoce, ptEliminaVoce, ptConferme,
  ptAvvia, ptAvviaDaReferto, ptCambiaStato, ptRigheReferto, ptAttesaReferto, ptAggiungiVoci, ptCaricaInCorso, ptConteggi, ptClientiInTerapia, ptElenco, ptApriVisita,
  ptAttesaFino, ptPeriodo, PT } from "./11-piano-terapia.js";
import { vcSezioniHtml, vcCarica, vcDisegna, vcApriVisita, vcScegli, vcFile, vcImposta, vcAnnulla, vcSalva, vcNomeLive, VC } from "./12-scheda-cavallo.js";
import { mpCampoHtml, mpInterno, mpRidisegna, mpAttiva, mpAttivaTutte, mpReset, mpTesto, mpVista, mpTipo, mpZoom, mpElencoNomi, mpCerca, mpSeleziona, mpChiudi,
  mpNome, mpNomePrima, mpRinomina, mpGrado, mpTogli, mpCambiaTipo, mpNota, mpFoto, mpNuovo, mpDente, mpDenteVicino, mpZonaScegli, mpZonaSegno, mpNotaOggetto,
  mpOggettoSvuota, mpSelezionaZona, mpImmaginiPdf, mpDisegnoSvg, mpNomeDente, MP, MP_PUNTI, MP_DENTI, MP_SET } from "./13-mappe.js";

import { VAA, vaaDopoCliente, vaaModo, vaaEtichetta, vaaAperto, vaaFatto, vaaSpunta, vaaPrezzo, vaaPrezzoBase, vaaNuovi, vaaVacc, vaaRichiamo, vaaDopo, vaaSalva,
  vaaDaCompletare, vaaBannerHtml, vaaCompleta } from "./14-visita-aperta.js";

// API PUBBLICA del veterinario: le funzioni chiamate dai pulsanti dell'HTML e dalle altre parti dell'app.
Object.assign(window, {
  renderHomeVet,
  vhGiornata,
  vhDetta,
  vhMeteo,
  vhVai, vhRigheHtml,
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
  vaNomeLive, vaScegli, vaFile, vaSalva, vaAnnulla, vaImposta, vaCarica, vaApri, vaSezioneHtml, vaModifica, vaSalvaModifica, vaElimina, vaChiVede, vaTogli, vaFaiVedere, vaReset, VA,
  vsMostraScheda, vrApri, vrInvia, vrCondividi, vrCreaPdf, vrSezioni, vrParteScritta, vrDestinatari, VR,
  vdVisiteRecenti, vdSezioneHtml, vdContesto, vdDetta, vdDaHome, vdApriDaEvento, vdDopoScheda, vdReset, VD,
  ptCarica, ptReset, ptSezioneHtml, ptDisegna, ptNuovaVoce, ptModificaVoce, ptCampo, ptVolte, ptOrario, ptTornaScheda, ptSalvaVoce, ptEliminaVoce, ptConferme,
  ptAvvia, ptAvviaDaReferto, ptCambiaStato, ptRigheReferto, ptAttesaReferto, ptAggiungiVoci, ptCaricaInCorso, ptConteggi, ptClientiInTerapia, ptElenco, ptApriVisita,
  ptAttesaFino, ptPeriodo, PT,
  mpCampoHtml, mpInterno, mpRidisegna, mpAttiva, mpAttivaTutte, mpReset, mpTesto, mpVista, mpTipo, mpZoom, mpElencoNomi, mpCerca, mpSeleziona, mpChiudi,
  mpNome, mpNomePrima, mpRinomina, mpGrado, mpTogli, mpCambiaTipo, mpNota, mpFoto, mpNuovo, mpDente, mpDenteVicino, mpZonaScegli, mpZonaSegno, mpNotaOggetto,
  mpOggettoSvuota, mpSelezionaZona, mpImmaginiPdf, mpDisegnoSvg, mpNomeDente, MP, MP_PUNTI, MP_DENTI, MP_SET,
  vcSezioniHtml, vcCarica, vcDisegna, vcApriVisita, vcScegli, vcFile, vcImposta, vcAnnulla, vcSalva, vcNomeLive, VC,
  vsApriDaEvento, vsMostraScelta, vsMostraMiei, vsNuova, vsTab, vsCambia, vsScegli, vsMulti, vsConcludi, vsChiudi, vsIndietro,
  vsModelloDaEsempio, vsModelloDa, vsModificaModello, vsAccendi, vsSposta, vsAggiungiCampo, vsSalvaModello, vsDemoPrepara, VS, VsDB,
  VAA, vaaDopoCliente, vaaModo, vaaEtichetta, vaaAperto, vaaFatto, vaaSpunta, vaaPrezzo, vaaPrezzoBase, vaaNuovi, vaaVacc, vaaRichiamo, vaaDopo, vaaSalva,
  vaaDaCompletare, vaaBannerHtml, vaaCompleta
});
