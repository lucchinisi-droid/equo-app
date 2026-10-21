/* ---------- REGISTRO DI UTILIZZO (interno, tabelle app_sessioni + app_eventi) ----------
   Una sessione = da quando l'app è aperta a quando resta chiusa/in background per più di 30 minuti.
   Ogni minuto in primo piano aggiorna "ultimo_segnale" → durata = ultimo_segnale - inizio.
   Le schermate visitate vanno in app_eventi (a gruppi, per non fare una scrittura a ogni tocco).
   In demo non registra nulla; un errore del registro non blocca mai l'app. */
const Registro = {
  app: "scuderia", sid: null, timer: null, coda: [], ultimaPagina: null, nascostoDa: null, vista: null,
  async avvia(vista){
    try{
      this.vista = vista || this.vista;
      if(DEMO_MODE || !currentUser?.id || typeof sb === "undefined") return;
      if(this.sid) return;
      const ua = navigator.userAgent || "";
      const disp = /iphone|ipad/i.test(ua) ? "iPhone/iPad" : /android/i.test(ua) ? "Android" : /mac/i.test(ua) ? "Mac" : /windows/i.test(ua) ? "Windows" : "altro";
      const standalone = window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone;
      const { data } = await sb.from("app_sessioni").insert({ user_id: currentUser.id, app: this.app, vista: this.vista || null,
        dispositivo: disp + (standalone ? " · app installata" : " · browser") }).select("id").single();
      this.sid = data?.id || null;
      if(!this.sid) return;
      clearInterval(this.timer);
      this.timer = setInterval(() => this.battito(), 60000);
      if(this.ultimaPagina) this.pagina(this.ultimaPagina, true);
    }catch(e){ console.warn("registro avvia:", e); }
  },
  battito(){
    try{
      if(!this.sid || document.hidden) return;
      sb.from("app_sessioni").update({ ultimo_segnale: new Date().toISOString() }).eq("id", this.sid).then(() => {});
      this.svuota();
    }catch(e){}
  },
  pagina(nome, forza){
    if(!nome || (nome === this.ultimaPagina && !forza)) return;
    this.ultimaPagina = nome;
    if(!this.sid) return;
    this.coda.push({ sessione_id: this.sid, user_id: currentUser.id, app: this.app, tipo: "pagina", nome: String(nome).slice(0, 60) });
    if(this.coda.length >= 8) this.svuota();
  },
  azione(nome){
    if(!this.sid || !nome) return;
    this.coda.push({ sessione_id: this.sid, user_id: currentUser.id, app: this.app, tipo: "azione", nome: String(nome).slice(0, 60) });
    if(this.coda.length >= 8) this.svuota();
  },
  svuota(){
    try{
      if(!this.coda.length || typeof sb === "undefined") return;
      const righe = this.coda.splice(0);
      sb.from("app_eventi").insert(righe).then(() => {});
    }catch(e){}
  },
  ferma(){
    this.battito(); this.svuota();
    clearInterval(this.timer); this.timer = null; this.sid = null; this.ultimaPagina = null;
  }
};
document.addEventListener("visibilitychange", () => {
  if(document.hidden){ Registro.battito(); Registro.svuota(); Registro.nascostoDa = Date.now(); return; }
  // tornato in primo piano dopo più di 30 minuti → nuova sessione
  if(Registro.sid && Registro.nascostoDa && Date.now() - Registro.nascostoDa > 30 * 60000){ Registro.ferma(); Registro.avvia(); }
  else Registro.battito();
  Registro.nascostoDa = null;
});
window.addEventListener("pagehide", () => { Registro.battito(); Registro.svuota(); });

let currentUser = null;   // { id, email }
let currentCentro = null; // { id, nome, indirizzo, telefono, join_code, owner_id }
let currentMembro = null; // { ruolo, nome_visualizzato }
let teamList = [];
let memberToRemove = null;
let editingMemberId = null;
let demoIdCounter = 1;

let cavalliList = [];
let eventiAll = [];
let currentCavalloId = null;
let editingCavalloId = null;
let cavalloToDelete = null;
let eventoToDelete = null;

let lezioniList = [];
let lezioniFilter = "prossime";
let lezioneToDelete = null;
let editingLezioneId = null;

let pacchettiList = [];
let pacchettoToDelete = null;
let editingPacchettoId = null;

let messaggiList = [];

let noteList = [];

let contattiList = [];
let editingContattoId = null;
let contattoToDelete = null;

let datiFiscali = null;

// data "AAAA-MM-GG" del giorno locale (in Italia): toISOString() userebbe l'ora UTC e tra mezzanotte
// e l'1-2 di notte darebbe ancora la data di ieri
function isoLoc(d){ const p = n => String(n).padStart(2, "0"); return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }
function isoDaysFromNow(n){
  const d = new Date();
  d.setDate(d.getDate() + n);
  return isoLoc(d);
}

let demoState = {
  centro: { id:"demo-centro", nome:"Centro Ippico Demo", indirizzo:"Via delle Scuderie 12, Colleferro (RM)", telefono:"+39 06 1234567", join_code:"EQUO-DEMO1", owner_id:"demo-user" },
  membri: [
    { id:"m1", user_id:"demo-user", ruolo:"admin", nome_visualizzato:"Tu (admin)", livello:"admin", permessi:{} },
    { id:"m2", user_id:"u2", ruolo:"istruttore", nome_visualizzato:"Marco Bianchi", livello:"3", permessi:{ eventi:true, lezioni:true } },
    { id:"m3", user_id:"u3", ruolo:"allievo", nome_visualizzato:"Giulia Verdi", livello:"1", permessi:{} },
  ],
  cavalli: [
    { id:"c1", centro_id:"demo-centro", nome:"Ares", tipo_proprieta:"pensione", razza:"Maremmano", mantello:"Baio", data_nascita:"2015-04-10", microchip:"380271000123456", gruppo_sanguigno:"", proprietario:"Giulia Verdi", note:"", foto_url:null, pdf_url:null, pdf_generato_at:null, updated_at: isoDaysFromNow(-10) },
    { id:"c2", centro_id:"demo-centro", nome:"Luna", tipo_proprieta:"proprieta", razza:"Quarter Horse", mantello:"Sauro", data_nascita:"2018-09-02", microchip:"380271000987654", gruppo_sanguigno:"", proprietario:"Centro Ippico Demo", note:"Cavallo da scuola, carattere docile", foto_url:null, pdf_url:null, pdf_generato_at:null, updated_at: isoDaysFromNow(-10) },
  ],
  eventi: [
    { id:"e1", centro_id:"demo-centro", cavallo_id:"c1", tipo:"vaccino", data_evento: isoDaysFromNow(-300), data_scadenza: isoDaysFromNow(65), note:"" },
    { id:"e2", centro_id:"demo-centro", cavallo_id:"c1", tipo:"coggins", data_evento: isoDaysFromNow(-200), data_scadenza: isoDaysFromNow(-5), note:"" },
    { id:"e3", centro_id:"demo-centro", cavallo_id:"c1", tipo:"ferratura", data_evento: isoDaysFromNow(-20), data_scadenza: isoDaysFromNow(20), note:"" },
    { id:"e4", centro_id:"demo-centro", cavallo_id:"c2", tipo:"vaccino", data_evento: isoDaysFromNow(-100), data_scadenza: isoDaysFromNow(180), note:"" },
    { id:"e5", centro_id:"demo-centro", cavallo_id:"c2", tipo:"sverminazione", data_evento: isoDaysFromNow(-80), data_scadenza: isoDaysFromNow(10), note:"" },
  ],
  lezioni: [
    { id:"l1", centro_id:"demo-centro", data: isoDaysFromNow(2), ora_inizio:"16:00", istruttore_id:"m2", cavallo_id:"c1", allievo_id:"m3", stato:"confermata", note:"" },
    { id:"l2", centro_id:"demo-centro", data: isoDaysFromNow(-3), ora_inizio:"10:30", istruttore_id:"m2", cavallo_id:"c2", allievo_id:"m3", stato:"completata", note:"" },
    { id:"l3", centro_id:"demo-centro", data: isoDaysFromNow(5), ora_inizio:"18:00", istruttore_id:"m2", cavallo_id:null, allievo_id:"m3", stato:"prenotata", note:"Prima lezione di prova" },
  ],
  pacchetti: [
    { id:"p1", centro_id:"demo-centro", cliente:"Giulia Verdi", membro_id:"m3", tipo:"carnet", unita_totali:10, unita_usate:7, data_inizio: isoDaysFromNow(-40), data_scadenza: isoDaysFromNow(20), prezzo:250, note:"" },
    { id:"p2", centro_id:"demo-centro", cliente:"Marco Bianchi", membro_id:"m2", tipo:"abbonamento", unita_totali:null, unita_usate:null, data_inizio: isoDaysFromNow(-10), data_scadenza: isoDaysFromNow(-2), prezzo:80, note:"Mensile" },
  ],
  messaggi: [
    { id:"msg1", centro_id:"demo-centro", mittente_id:"m1", mittente_nome:"Tu (admin)", destinatario_tipo:"tutti", destinatario_ruolo:null, destinatario_nome:null, testo:"Ricordo a tutti che sabato il maneggio chiude alle 18:00 per manutenzione.", priorita:"normale", created_at: isoDaysFromNow(-2) },
    { id:"msg2", centro_id:"demo-centro", mittente_id:"m1", mittente_nome:"Tu (admin)", destinatario_tipo:"ruolo", destinatario_ruolo:"istruttore", destinatario_nome:null, testo:"Riunione istruttori lunedì alle 9:00 in ufficio.", priorita:"urgente", created_at: isoDaysFromNow(-1) },
  ],
  note: [
    { id:"n1", centro_id:"demo-centro", testo:"Ordinare mangime entro venerdì", colore:"giallo", created_at: isoDaysFromNow(-1) },
    { id:"n2", centro_id:"demo-centro", testo:"Chiamare il veterinario per Ares", colore:"rosa", created_at: isoDaysFromNow(-2) },
  ],
  contatti: [
    { id:"ct1", centro_id:"demo-centro", tipo:"commercialista", tipo_altro:null, nome:"Studio Rossi & Associati", telefono:"+39 06 9876543", email:"info@studiorossi.it", note:"" },
    { id:"ct2", centro_id:"demo-centro", tipo:"giardiniere", tipo_altro:null, nome:"Luca Ferrari", telefono:"+39 333 1234567", email:"", note:"Passa ogni martedì" },
    { id:"ct3", centro_id:"demo-centro", tipo:"altro", tipo_altro:"Elettricista", nome:"Paolo Neri", telefono:"+39 347 7654321", email:"", note:"" },
  ],
  datiFiscali: {
    id:"df1", centro_id:"demo-centro",
    denominazione:"Centro Ippico Demo S.r.l.", piva:"01234567890", cod_rea:"RM-1234567",
    iban:"IT60X0542811101000000123456", pec:"centroippicodemo@pec.it", sdi:"ABC1234",
    indirizzo:"Via delle Scuderie 12, Colleferro (RM)", telefono_fisso:"+39 06 1234567", cellulare:"+39 333 0001122",
  },
  chat: {
    m3: [
      { id:"chat1", mittente_user_id:"u3", testo:"Ciao! Mi resta ancora qualche lezione nel carnet?", created_at: isoDaysFromNow(-1) },
      { id:"chat2", mittente_user_id:"demo-user", testo:"Ciao Giulia, sì te ne restano 3! Vuoi rinnovare il carnet?", created_at: isoDaysFromNow(-1) },
    ],
  },
};

