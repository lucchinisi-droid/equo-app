// Equo App · allenatore · modulo "stato": i dati condivisi dell'app allenatore, in un solo posto.
// Gli altri moduli li importano da qui ("import { TR, T2 } from './stato.js'") e ne cambiano i campi;
// l'oggetto in se non viene mai sostituito (per questo e "const").

// TR: sedute, video e cavalli seguiti (cavalli, sedute, media firmati, limite slot, seduta aperta,
// annotazioni e commenti dell'editor, strumenti della lavagna, registrazione vocale, vista proprietario).
export const TR={cavalli:[],sedute:[],media:{},slot:{usati:0,limite:10},cur:null,ann:[],comm:[],vurl:null,tool:null,forme:[],lavCol:"#e2ab45",lavK:"linea",lente:null,rec:null,caricato:false,owner:false};

// T2: agenda, lezioni e chat con i proprietari (lezioni, settimana e giorno scelti, messaggi,
// conversazione aperta, aggiornamento periodico, modulo nuova lezione, cache di caricamento).
export const T2={lez:[],week:null,sel:null,msgs:{},cur:null,poll:null,loadedL:false,sed:{},lezC:{},form:{dur:45,tipo:"lezione",id:null},lastFetch:0,dm:{},dl:false};
