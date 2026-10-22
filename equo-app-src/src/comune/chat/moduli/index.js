// Ingresso dei moduli chat: l'ordine e quello originale dei file.
import { closeChatThread, formatChatDay, insertEmoji, openChatThread, toggleEmojiPicker } from "./062-chat-mascalcia-stile-whatsapp.js";
import { annullaRisposta, citazioneHtml, consumaRisposta, vaiAlMessaggio } from "./063-risposta-a-un-messaggio-stile-whatsapp.js";
import { attrBolla, avviaSpunte, oraBolla } from "./064-spunte-di-lettura-pallini.js";
import { aggiornaChatLive, applicaThread, avviaChatLive, bollaInAttesa, bollaNonInviata, fermaChatLive, inizioThread } from "./065-chat-fluida-stile-whatsapp.js";
import { allegatoScelto, apriMenuAllegati, chiudiMenuAllegati, scegliAllegato, sendMascalciaMessage } from "./066-allegati-in-chat-foto-da-fotocamera-gall.js";
import { cancelVoiceRecording, loadInboxMascalcia, shareInviteCodeFromChat, startVoiceRecording, stopAndSendVoiceRecording } from "./067-note-vocali.js";
import { renderChatCartelle, renderChatCartelleBase, sceltaCartellaChat } from "./068-messaggi-a-cartelle-stile-telegram-clien.js";
import { computeChatUnreadTotal, contaNonLettiScuderia, refreshChatBadge, segnaLettiChatApp } from "./070-notifiche-badge-messaggi-non-letti.js";
import { apriChatCollega, apriNuovoCollega, avviaChatCollega, cancelOwnerVoiceRecording, closeOwnerChatThread, handleOwnerChatMediaChange, invitaCollega, loadColleghiList, openOwnerChatThread, sendOwnerChatMessage, startNewChat, startOwnerVoiceRecording, stopAndSendOwnerVoiceRecording } from "./077-chat-tra-colleghi-vista-professionista.js";
import { shareContentExternally } from "./078-condivisione-esterna-watermark-share-she.js";

// API PUBBLICA (chat): le funzioni chiamate dai pulsanti dell'HTML, dal testo generato e dalle altre parti dell'app.
// Se un pulsante nuovo chiama una funzione di questo ruolo, va aggiunta qui (il controllo automatico lo segnala).
Object.assign(window, {
  aggiornaChatLive,
  allegatoScelto,
  annullaRisposta,
  applicaThread,
  apriChatCollega,
  apriMenuAllegati,
  apriNuovoCollega,
  attrBolla,
  avviaChatCollega,
  avviaChatLive,
  avviaSpunte,
  bollaInAttesa,
  bollaNonInviata,
  cancelOwnerVoiceRecording,
  cancelVoiceRecording,
  chiudiMenuAllegati,
  citazioneHtml,
  closeChatThread,
  closeOwnerChatThread,
  computeChatUnreadTotal,
  consumaRisposta,
  contaNonLettiScuderia,
  fermaChatLive,
  formatChatDay,
  handleOwnerChatMediaChange,
  inizioThread,
  insertEmoji,
  invitaCollega,
  loadColleghiList,
  loadInboxMascalcia,
  openChatThread,
  openOwnerChatThread,
  oraBolla,
  refreshChatBadge,
  renderChatCartelle,
  renderChatCartelleBase,
  scegliAllegato,
  sceltaCartellaChat,
  segnaLettiChatApp,
  sendMascalciaMessage,
  sendOwnerChatMessage,
  shareContentExternally,
  shareInviteCodeFromChat,
  startNewChat,
  startOwnerVoiceRecording,
  startVoiceRecording,
  stopAndSendOwnerVoiceRecording,
  stopAndSendVoiceRecording,
  toggleEmojiPicker,
  vaiAlMessaggio
});
