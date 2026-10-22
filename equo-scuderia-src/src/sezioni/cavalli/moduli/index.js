// Ingresso dei moduli cavalli: l'ordine e quello originale dei file.
import { closeCavalloDetail, loadCavalli, loadEventiAll, openCavalloDetail, refreshCavalliModule, renderCavalliList, rispondiArrivo, scadenzarioFor, toggleSezioneCavalli, worstStatus } from "./039-cavalli-salute.js";
import { apriAllegatoScud, caricaAllegatoScud, eliminaAllegatoScud, renderCavalloDetail } from "./040-allegati-del-cavallo-condivisi-con-propr.js";
import { apriInviaSchedaChat, handleSchedaPdf, inviaSchedaChat, openCavalloForm, scaricaSchedaPdf, stampaSchedaPdf } from "./041-scheda-cavallo-pdf-brandizzato-equo-qr-s.js";
import { collegaProprietarioDaCodice, razzaSegnala, saveCavallo } from "./042-razza-menu-con-ricerca-stesso-codice-in.js";
import { confermaImportCavalli, currentMembroId, loadMessaggi, openMessaggioForm, proponiImportCavalli, renderMessaggi, saltaImportCavalli, saveMessaggio, toggleDestinatarioMsg } from "./050-import-cavalli-dopo-collegamento-proprie.js";
import { boxApri, boxApriNota, boxAssegna, boxLibera, boxRenderPannello, boxRiserva, boxSalvaNota, boxSposta } from "./058-pannello-del-box.js";
import { boxElimina, boxManutenzione } from "./059-trascinamento-tieni-premuto-un-cavallo-e.js";
import { boxApriImpostazioni, boxSalvaImpostazioni } from "./060-impostazioni-icone-4-facoltative.js";
import { boxModalitaStalla, groomApriNuovo, groomAttiva, groomCaricaTeam, groomCondividi, groomCopia, groomElimina, groomMostraQr, groomNuovoQr, groomSalvaNuovo, groomStampaBox, groomStampaQr, openModal, refreshGroomModule } from "./061-modalita-stalla-schermo-intero-per-table.js";

// API PUBBLICA (cavalli): le funzioni chiamate dai pulsanti dell'HTML, dal testo generato e dalle altre parti dell'app.
// Se un pulsante nuovo chiama una funzione di questo ruolo, va aggiunta qui (il controllo automatico lo segnala).
Object.assign(window, {
  apriAllegatoScud,
  apriInviaSchedaChat,
  boxApri,
  boxApriImpostazioni,
  boxApriNota,
  boxAssegna,
  boxElimina,
  boxLibera,
  boxManutenzione,
  boxModalitaStalla,
  boxRenderPannello,
  boxRiserva,
  boxSalvaImpostazioni,
  boxSalvaNota,
  boxSposta,
  caricaAllegatoScud,
  closeCavalloDetail,
  collegaProprietarioDaCodice,
  confermaImportCavalli,
  currentMembroId,
  eliminaAllegatoScud,
  groomApriNuovo,
  groomAttiva,
  groomCaricaTeam,
  groomCondividi,
  groomCopia,
  groomElimina,
  groomMostraQr,
  groomNuovoQr,
  groomSalvaNuovo,
  groomStampaBox,
  groomStampaQr,
  handleSchedaPdf,
  inviaSchedaChat,
  loadCavalli,
  loadEventiAll,
  loadMessaggi,
  openCavalloDetail,
  openCavalloForm,
  openMessaggioForm,
  openModal,
  proponiImportCavalli,
  razzaSegnala,
  refreshCavalliModule,
  refreshGroomModule,
  renderCavalliList,
  renderCavalloDetail,
  renderMessaggi,
  rispondiArrivo,
  saltaImportCavalli,
  saveCavallo,
  saveMessaggio,
  scadenzarioFor,
  scaricaSchedaPdf,
  stampaSchedaPdf,
  toggleDestinatarioMsg,
  toggleSezioneCavalli,
  worstStatus
});
