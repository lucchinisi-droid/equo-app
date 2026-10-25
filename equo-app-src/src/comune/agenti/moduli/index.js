// Ingresso dei moduli agenti: l'ordine e quello originale dei file.
import "./080-ai-chat.js";
import { aggiungiAllegatiAi, hpCaso, hpChiedi, hpFineCaso, hpPreparaPannello, hpScelta, hpStorico, hpTogliContesto, renderAllegatiAi, riduciImmagine, rimuoviAllegatoAi } from "./081-equo-ai-allegati-step-2-foto-ridotte-a-m.js";
import { aiApriArchivio, aiAvviaControlloImportanti, aiCercaArchivio, aiChiudiArchivio, aiControllaImportanti, aiEliminaChat, aiFissaChat, aiMenuChat, aiNuovaChat, aiRiapriChat, aiRinominaChat, aiServeRicarica, aiTornaAOggi, caricaChatAiGiorni } from "./083-chat-a-giorni.js";
import { aggiornaViteManiscalco, aiNaviga, cancelEventProposal, confermaAzioneAi, confirmEventProposal, hpAnalizza, hpApriFoto, hpChiudiFoto, hpCondividi, hpElimina, hpFotoScelta, hpPdf, hpScatto, sendChatMessage } from "./082-analizza-una-foto-focus.js";

// API PUBBLICA (agenti): le funzioni chiamate dai pulsanti dell'HTML, dal testo generato e dalle altre parti dell'app.
// Se un pulsante nuovo chiama una funzione di questo ruolo, va aggiunta qui (il controllo automatico lo segnala).
Object.assign(window, {
  aggiornaViteManiscalco,
  aggiungiAllegatiAi,
  aiNaviga,
  cancelEventProposal,
  confermaAzioneAi,
  confirmEventProposal,
  hpAnalizza,
  hpApriFoto,
  hpCaso,
  hpChiedi,
  hpChiudiFoto,
  hpCondividi,
  hpElimina,
  hpFineCaso,
  hpFotoScelta,
  hpPdf,
  hpPreparaPannello,
  hpScatto,
  hpScelta,
  hpStorico,
  hpTogliContesto,
  renderAllegatiAi,
  riduciImmagine,
  rimuoviAllegatoAi,
  sendChatMessage,
  aiApriArchivio,
  aiAvviaControlloImportanti,
  aiCercaArchivio,
  aiChiudiArchivio,
  aiControllaImportanti,
  aiEliminaChat,
  aiFissaChat,
  aiMenuChat,
  aiNuovaChat,
  aiRiapriChat,
  aiRinominaChat,
  aiServeRicarica,
  aiTornaAOggi,
  caricaChatAiGiorni
});
