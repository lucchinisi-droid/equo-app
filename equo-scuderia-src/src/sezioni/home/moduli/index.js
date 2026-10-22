// Ingresso dei moduli home: l'ordine e quello originale dei file.
import { aggiornaContatoriNav, impostaContatoreNav, startContatoriNav } from "./048-contatori-a-semaforo-nel-menu-verde-0-tu.js";
import { refreshHomeModule } from "./051-home-cruscotto.js";
import "./052-post-it-promemoria.js";
import { closeSidebar, comingSoonHtml, deleteNota, openHomeDetail, openNotaForm, openSidebar, quandoApriSezione, saveNota, selectNotaColore, showModule } from "./053-drag-drop-post-it-mouse-e-touch.js";

// API PUBBLICA (home): le funzioni chiamate dai pulsanti dell'HTML, dal testo generato e dalle altre parti dell'app.
// Se un pulsante nuovo chiama una funzione di questo ruolo, va aggiunta qui (il controllo automatico lo segnala).
Object.assign(window, {
  aggiornaContatoriNav,
  closeSidebar,
  comingSoonHtml,
  deleteNota,
  impostaContatoreNav,
  openHomeDetail,
  openNotaForm,
  openSidebar,
  quandoApriSezione,
  refreshHomeModule,
  saveNota,
  selectNotaColore,
  showModule,
  startContatoriNav
});
