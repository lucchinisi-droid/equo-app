// Ingresso dei moduli lezioni-pacchetti-comunicazioni: l'ordine e quello originale dei file.
import { aggiornaCavalieriSuggeriti, askDeleteLezione, cavalloNome, confirmDeleteLezione, lezioneCavalloCambiato, loadLezioni, membroNome, openLezioneForm, refreshLezioniModule, saveLezione, setLezioneStato, setLezioniFilter } from "./044-lezioni-prenotazioni.js";
import { askDeletePacchetto, confirmDeletePacchetto, loadPacchetti, openPacchettoForm, refreshPacchettiModule, savePacchetto, statusPacchetto, toggleTipoPacchetto } from "./045-pacchetti-abbonamenti.js";
import { refreshComunicazioniModule } from "./046-comunicazioni.js";

// API PUBBLICA (lezioni-pacchetti-comunicazioni): le funzioni chiamate dai pulsanti dell'HTML, dal testo generato e dalle altre parti dell'app.
// Se un pulsante nuovo chiama una funzione di questo ruolo, va aggiunta qui (il controllo automatico lo segnala).
Object.assign(window, {
  aggiornaCavalieriSuggeriti,
  askDeleteLezione,
  askDeletePacchetto,
  cavalloNome,
  confirmDeleteLezione,
  confirmDeletePacchetto,
  lezioneCavalloCambiato,
  loadLezioni,
  loadPacchetti,
  membroNome,
  openLezioneForm,
  openPacchettoForm,
  refreshComunicazioniModule,
  refreshLezioniModule,
  refreshPacchettiModule,
  saveLezione,
  savePacchetto,
  setLezioneStato,
  setLezioniFilter,
  statusPacchetto,
  toggleTipoPacchetto
});
