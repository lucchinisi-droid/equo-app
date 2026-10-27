// Equo App · proprietario · STATO CONDIVISO: variabili che anche altre parti dell'app leggono o cambiano.
// Script classico caricato PRIMA dei moduli proprietario e dello script principale: qui solo dati, nessuna funzione.
// da 026-ultimo-messaggio-home.js
let homeLastMessageTarget = null;
// da 026-ultimo-messaggio-home.js
let editingHorseId = null;
// da 026-ultimo-messaggio-home.js
const LIMITE_CAVALLI_FREE = 3;   // 27/10/2026: da 1 a 3 cavalli
// da 027-health-events.js
const EVENT_LABELS = { vaccino: "Vaccino", coggins: "Test Coggins", ferratura: "Ferratura", sverminazione: "Sverminazione" };
// da 029-lezioni-manuali-calendario-proprietario.js
const LEZIONE_TIPO_LABELS = { lezione: "Lezione", allenamento: "Allenamento libero", gara: "Gara", altro: "Altro" };
// da 029-lezioni-manuali-calendario-proprietario.js
let editingLezioneId = null;
// da 069-chat-proprietario-proprietario.js
let currentConversazioneId = null;
// da 069-chat-proprietario-proprietario.js
let currentStableMembro = null;
// da 071-pagamenti-da-saldare-al-maniscalco-propr.js
let daSaldareStato = { righe: [], daRicordare: false, aperto: false, pagaAperto: null };
// da 073-chat-col-proprio-maniscalco-lato-proprie.js
let currentFarrier = null;
// da 079-expenses.js
let currentExpensesData = [];
// da 089-early-adopter-arrivo-dal-sito-ottobre-20.js
const WG_IC = {
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  msg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  euro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M17 6.5A6.5 6.5 0 1 0 17 17.5M4 10.5h9M4 13.5h9"/></svg>',
  camp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5h4"/></svg>',
  mappa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-8-8 18-2-8z"/></svg>',
  giro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/></svg>',
  sett: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 20V12M10 20V6M15 20v-9M20 20V9"/></svg>',
  scad: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.5-7-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7 3.5C19 16.5 12 21 12 21z"/></svg>',
  cav: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 20c0-5 1-8 4-11l-1-4 3 2 2-2 1 3c2 1 3 3 3 5l-2 1-2-1-1 7"/></svg>',
  lez: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-5 9 5-9 5z"/><path d="M7 11v5c3 2 7 2 10 0v-5"/></svg>',
  piu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
};
// da 089-early-adopter-arrivo-dal-sito-ottobre-20.js
const wgEsc = s => escapeHtml(String(s ?? ""));
// da 089-early-adopter-arrivo-dal-sito-ottobre-20.js
const wgEuro = n => "€ " + Math.round(Number(n) || 0).toLocaleString("it-IT");
// da 089-early-adopter-arrivo-dal-sito-ottobre-20.js
const HM_IC = {
  hammer: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg>',
  users: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  ferro: '<svg class="hm-svg pieno" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-ferro"/></svg>',
  cal: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2v4M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>',
  nav: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 22 2l-9 19-2-8z"/></svg>',
  cerca: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.3-4.3"/></svg>',
  wallet: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-wallet"/></svg>',
  inbox: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-inbox"/></svg>',
  menu: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  aiuto: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/></svg>',
  slider: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>',
  qr: '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/></svg>',
};
// da 089-early-adopter-arrivo-dal-sito-ottobre-20.js
const HM_NAV = `
  <button class="nav-btn" data-page="pro-home" onclick="showPage('pro-home')"><span class="icon"><svg><use href="#i-home"/></svg></span><small>Home</small></button>
  <button class="nav-btn" data-page="pro-agenda" onclick="showPage('pro-agenda')"><span class="icon"><svg><use href="#i-calendar"/></svg></span><small>Agenda</small></button>
  <button class="nav-btn nav-hammer" id="nav-hammer" onclick="openAiSheet()" aria-label="Hammer, agente di mascalcia"><span class="hm-ham">${HM_IC.hammer}<i class="hm-ham-dot"></i></span><small>Hammer</small></button>
  <button class="nav-btn" data-page="pro-inbox" onclick="hmMessaggi()"><span class="icon hm-ico">${HM_IC.inbox}</span><small>Messaggi</small><span class="inbox-nav-badge" id="inbox-nav-badge" style="display:none"></span></button>
  <button class="nav-btn" data-page="pro-clienti" data-cart="clienti" onclick="hmCartella('clienti')"><span class="icon hm-ico">${HM_IC.users}</span><small>Clienti</small></button>`;
// da 089-early-adopter-arrivo-dal-sito-ottobre-20.js
const ML_PIEDI = [["as", "Ant. sx", "anteriore sinistro"], ["ad", "Ant. dx", "anteriore destro"], ["ps", "Post. sx", "posteriore sinistro"], ["pd", "Post. dx", "posteriore destro"]];
// da 089-early-adopter-arrivo-dal-sito-ottobre-20.js
const ML_VOCI = [["ferro perso", "ferro"], ["parete sfaldata", "alert"], ["ascesso o dolore", "alert"], ["fettone", "alert"], ["zoppia", "alert"], ["altro", "nota"]];
// da 089-early-adopter-arrivo-dal-sito-ottobre-20.js
const ML_IC = {
  ferro: '<svg class="pi" viewBox="0 0 24 24"><use href="#i-ferro"/></svg>',
  alert: '<svg class="li" viewBox="0 0 24 24"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  nota: '<svg class="li" viewBox="0 0 24 24"><path d="M4 4h12l4 4v12H4z"/><path d="M8 12h8M8 16h5"/></svg>',
  check: '<svg class="li" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  dx: '<svg class="li" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  x: '<svg class="li" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  cam: '<svg class="li" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  hammer: '<svg class="li" viewBox="0 0 24 24"><path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg>',
  cal: '<svg class="li" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  chat: '<svg class="li" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  indietro: '<svg class="li" viewBox="0 0 24 24"><path d="M15 18 9 12l6-6"/></svg>'
};
// da 089-early-adopter-arrivo-dal-sito-ottobre-20.js
let ml = null;
// da 089-early-adopter-arrivo-dal-sito-ottobre-20.js
let mlEventi = [], mlInfo = {}, mlProb = null;
// da 089-early-adopter-arrivo-dal-sito-ottobre-20.js
const mlNomePiede = k => (ML_PIEDI.find(p => p[0] === k) || [k, k, k])[2];
// da 089-early-adopter-arrivo-dal-sito-ottobre-20.js
const mlSigla = k => String(k || "").toUpperCase();
