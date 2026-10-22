/* ---------- REGISTRO DI UTILIZZO (interno, tabelle app_sessioni + app_eventi) ----------
   Una sessione = da quando l'app è aperta a quando resta chiusa/in background per più di 30 minuti.
   Ogni minuto in primo piano aggiorna "ultimo_segnale" → durata = ultimo_segnale - inizio.
   Le schermate visitate vanno in app_eventi (a gruppi, per non fare una scrittura a ogni tocco).
   In demo non registra nulla; un errore del registro non blocca mai l'app. */
const Registro = {
  app: "app", sid: null, timer: null, coda: [], ultimaPagina: null, nascostoDa: null, vista: null,
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
