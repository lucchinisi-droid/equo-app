// Ingresso dei moduli centro: l'ordine e quello originale dei file.
import { askRemoveMember, confirmRemoveMember, loadTeam, onMemberLivelloChange, onMemberRuoloChange, openMemberForm, renderTeam, saveMember } from "./010-team.js";
import { askDeleteContatto, confirmDeleteContatto, copyJoinCode, loadContatti, openContattoForm, refreshContattiModule, saveContatto, toggleContattoAltro } from "./011-contatti-utili.js";
import { copyDatiFiscali, openDatiFiscaliForm, saveDatiFiscali } from "./012-dati-societari-e-pagamenti-solo-admin.js";
import { askHardReset, confirmHardReset, richiediCodiceReset, toggleHardReset } from "./013-hard-reset-solo-admin-con-codice-usa-e-g.js";
import { apriModificaCentro, refreshStatisticheModule, renderStatistiche, renderZonaCentro, salvaDatiCentro, stAggiornaRadar, stCalcolaSim, stScriviCliente } from "./055-zona-del-centro-serve-al-radar-di-merlin.js";

// API PUBBLICA (centro): le funzioni chiamate dai pulsanti dell'HTML, dal testo generato e dalle altre parti dell'app.
// Se un pulsante nuovo chiama una funzione di questo ruolo, va aggiunta qui (il controllo automatico lo segnala).
Object.assign(window, {
  apriModificaCentro,
  askDeleteContatto,
  askHardReset,
  askRemoveMember,
  confirmDeleteContatto,
  confirmHardReset,
  confirmRemoveMember,
  copyDatiFiscali,
  copyJoinCode,
  loadContatti,
  loadTeam,
  onMemberLivelloChange,
  onMemberRuoloChange,
  openContattoForm,
  openDatiFiscaliForm,
  openMemberForm,
  refreshContattiModule,
  refreshStatisticheModule,
  renderStatistiche,
  renderTeam,
  renderZonaCentro,
  richiediCodiceReset,
  salvaDatiCentro,
  saveContatto,
  saveDatiFiscali,
  saveMember,
  stAggiornaRadar,
  stCalcolaSim,
  stScriviCliente,
  toggleContattoAltro,
  toggleHardReset
});
