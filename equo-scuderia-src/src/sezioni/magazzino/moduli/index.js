// Ingresso dei moduli magazzino: l'ordine e quello originale dei file.
import { loadMagazzino } from "./023-dati.js";
import { refreshMagazzinoModule } from "./024-modulo.js";
import { magComprato, magRapido, magRenderSemplice, magVista, vistaCambia, vistaSemplice, vistaSincronizza } from "./025-vista-semplice-completa-magazzino-e-stat.js";
import { magFiltraStato } from "./026-colpo-d-occhio.js";
import { magLayout, magSelCat, magSelSub } from "./027-categorie-e-sottocategorie.js";
import { magRender } from "./028-articoli.js";
import { magApriDettaglio } from "./029-dettaglio-articolo.js";
import { magApriMovimento, magMovAnteprima, magMovCambiaArticolo, magMovRenderPick, magMovScegli, magMovStep, magMovTipo, magSalvaMovimento } from "./030-movimento-rapido.js";
import { magApriArticolo, magArchiviaArticolo, magArtCatCambiata, magArtSubCambiata, magSalvaArticolo } from "./031-articolo-nuovo-modifica.js";
import { magRenderMovimenti } from "./032-movimenti.js";
import { magCopiaOrdine, magCreaOrdine, magInviaOrdine, magRiceviOrdine } from "./033-riordini-e-ordini.js";
import { magApriUbicazione, magEliminaUbicazione, magSalvaUbicazione, magUbiTipoCambiato } from "./034-depositi.js";
import { magApriFornitore, magArchiviaFornitore, magSalvaFornitore } from "./035-fornitori.js";
import "./036-dati-demo.js";
import { magApriCategoria, magCatAnteprima, magCatScegli, magNascondiCategoria, magSalvaCategoria } from "./037-categorie-personalizzate.js";

// API PUBBLICA (magazzino): le funzioni chiamate dai pulsanti dell'HTML, dal testo generato e dalle altre parti dell'app.
// Se un pulsante nuovo chiama una funzione di questo ruolo, va aggiunta qui (il controllo automatico lo segnala).
Object.assign(window, {
  loadMagazzino,
  magApriArticolo,
  magApriCategoria,
  magApriDettaglio,
  magApriFornitore,
  magApriMovimento,
  magApriUbicazione,
  magArchiviaArticolo,
  magArchiviaFornitore,
  magArtCatCambiata,
  magArtSubCambiata,
  magCatAnteprima,
  magCatScegli,
  magComprato,
  magCopiaOrdine,
  magCreaOrdine,
  magEliminaUbicazione,
  magFiltraStato,
  magInviaOrdine,
  magLayout,
  magMovAnteprima,
  magMovCambiaArticolo,
  magMovRenderPick,
  magMovScegli,
  magMovStep,
  magMovTipo,
  magNascondiCategoria,
  magRapido,
  magRender,
  magRenderMovimenti,
  magRenderSemplice,
  magRiceviOrdine,
  magSalvaArticolo,
  magSalvaCategoria,
  magSalvaFornitore,
  magSalvaMovimento,
  magSalvaUbicazione,
  magSelCat,
  magSelSub,
  magUbiTipoCambiato,
  magVista,
  refreshMagazzinoModule,
  vistaCambia,
  vistaSemplice,
  vistaSincronizza
});
