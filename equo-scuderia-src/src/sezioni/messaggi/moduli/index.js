// Ingresso dei moduli messaggi: l'ordine e quello originale dei file.
import { chattaConMembro, closeChatModal, loadAndRenderChat, openChatModal, segnaLettiChat } from "./014-chat-interna-membro-equo-app-struttura.js";
import { oraBollaScuderia } from "./015-spunte-di-lettura-pallini-come-in-equo-a.js";
import { annullaRisposta, citazioneHtml, consumaRisposta, corpoMessaggioChat, inviaAllegatoChat, inviaChatMessaggio, registraMsgCit, riduciFotoChat, vaiAlMessaggio } from "./016-risposta-a-un-messaggio-stile-whatsapp-c.js";
import { askDeleteCavallo, askDeleteEvento, avviaNuovaChatCliente, confirmDeleteCavallo, confirmDeleteEvento, formatDate, openEventoForm, openNuovaChatClienteForm, saveEvento, toggleEventoAltro } from "./043-nuova-chat-cliente-dal-codice-senza-pass.js";
import "./047-chatta-con-i-tuoi-clienti.js";
import { apriConfirmChatCliente, chattaConProprietarioAppenaCollegato, refreshChatUnread, renderClientiChatList, startChatUnreadPolling } from "./049-non-letti-chat-basati-su-chat-messaggi-l.js";

// API PUBBLICA (messaggi): le funzioni chiamate dai pulsanti dell'HTML, dal testo generato e dalle altre parti dell'app.
// Se un pulsante nuovo chiama una funzione di questo ruolo, va aggiunta qui (il controllo automatico lo segnala).
Object.assign(window, {
  annullaRisposta,
  apriConfirmChatCliente,
  askDeleteCavallo,
  askDeleteEvento,
  avviaNuovaChatCliente,
  chattaConMembro,
  chattaConProprietarioAppenaCollegato,
  citazioneHtml,
  closeChatModal,
  confirmDeleteCavallo,
  confirmDeleteEvento,
  consumaRisposta,
  corpoMessaggioChat,
  formatDate,
  inviaAllegatoChat,
  inviaChatMessaggio,
  loadAndRenderChat,
  openChatModal,
  openEventoForm,
  openNuovaChatClienteForm,
  oraBollaScuderia,
  refreshChatUnread,
  registraMsgCit,
  renderClientiChatList,
  riduciFotoChat,
  saveEvento,
  segnaLettiChat,
  startChatUnreadPolling,
  toggleEventoAltro,
  vaiAlMessaggio
});
