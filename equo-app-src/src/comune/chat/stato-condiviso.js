// Equo App · chat · STATO CONDIVISO: variabili che anche altre parti dell'app leggono o cambiano.
// Script classico caricato PRIMA dei moduli chat e dello script principale: qui solo dati, nessuna funzione.
// da 062-chat-mascalcia-stile-whatsapp.js
const EMOJI_LIST = ["😀","😂","😊","😉","😍","🙂","😅","😎","🤔","👍","🙏","👏","💪","🤝","❤️","🔥",
  "✅","⏰","📅","📍","🐴","🐎","🧑‍🌾","🔨","👢","🩺","💬","📞","🚗","☀️","🌧️","⚠️"];
// da 068-messaggi-a-cartelle-stile-telegram-clien.js
const chatContatori = { proprietari: { n: 0, nonLetti: 0 }, clienti: { n: 0, nonLetti: 0 }, scuderie: { n: 0, nonLetti: 0 }, colleghi: { n: 0, nonLetti: 0 } };
// da 070-notifiche-badge-messaggi-non-letti.js
let chatBadgePollTimer = null;
