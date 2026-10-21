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

let demoIdCounter = 1;
const demoState = {
  horses: [
    { id: "demo-1", name: "Aurora", breed: "Maremmano", birth_date: "2018-04-12", stable_id: null, tipo_proprieta: "proprieta", mantello: "Baio", microchip: "", gruppo_sanguigno: "", note: "" },
  ],
  events: {
    "demo-1": [
      { id: "de-1", type: "vaccino", date: "2026-06-01", next_due_date: "2026-12-01", notes: "Dr. Bianchi" },
      { id: "de-2", type: "ferratura", date: "2026-08-10", next_due_date: "2026-09-25", notes: "" },
    ],
  },
  expenses: [
    { id: "dx-1", horse_id: "demo-1", horse_name: "Aurora", category: "pensione", amount: 220, date: "2026-09-01", notes: "" },
    { id: "dx-2", horse_id: "demo-1", horse_name: "Aurora", category: "maniscalco", amount: 60, date: "2026-08-10", notes: "" },
  ],
  stables: [{ id: "demo-stable-1", name: "Scuderia Le Querce", join_code: "EQUO-DEMO" }],
  lezioniManuali: [
    { id: "dl-1", horse_id: "demo-1", data: "2026-09-24", tipo: "lezione", note: "Con l'istruttore Luca", created_at: "2026-09-16" },
  ],
  altriProprietari: [
    { id: "demo-owner-2", full_name: "Giulia Verdi", avatar_url: null, codice_proprietario: "EQUO-OWN-DEMO" },
  ],
  conversazioniProprietari: [
    { id: "co-1", proprietario_a_id: "demo-user", proprietario_b_id: "demo-owner-2", created_at: "2026-09-10T10:00:00" },
  ],
  messaggiProprietari: [
    { id: "mo-1", conversazione_id: "co-1", mittente_id: "demo-owner-2", tipo: "testo", testo: "Ciao! Portiamo i cavalli al maneggio sabato?", media_url: null, letto: false, created_at: "2026-09-17T09:00:00" },
    { id: "mo-2", conversazione_id: "co-1", mittente_id: "demo-user", tipo: "testo", testo: "Perfetto, ci sono!", media_url: null, letto: true, created_at: "2026-09-16T18:20:00" },
  ],
  services: [
    { id: "ds-1", tipo: "veterinario", nome: "Clinica Veterinaria Equina Demo", indirizzo: "Via delle Scuderie 1", telefono: "0212345678", lat: 45.4642, lng: 9.19, note: "H24", fonte: "curato" },
  ],
  paymentMethods: [],
  clientiMascalcia: [
    { id: "dc-1", nome: "Marco Bianchi", nome_cavallo: "Aurora", telefono: "333 1112222", note: "", cliente_user_id: null, codice_invito: "EQUO-DC1AB", tipo_cliente: "proprietario", created_at: "2026-08-01" },
    { id: "dc-s1", nome: "Scuderia Le Querce", nome_cavallo: "", telefono: "06 1234567", note: "", cliente_user_id: null, codice_invito: "EQUO-DC2QR", tipo_cliente: "struttura", created_at: "2026-08-05" },
  ],
  cavalliClientiMascalcia: [
    { id: "dcv-1", cliente_mascalcia_id: "dc-1", nome: "Aurora", microchip: null, horse_id: null, created_at: "2026-08-01" },
  ],
  interventiMascalcia: [
    { id: "di-1", cliente_mascalcia_id: "dc-1", cavallo_cliente_id: "dcv-1", horse_id: null, tipo_ferratura: "ferratura", tipo_altro: null, misura_sistema: "italiana", numero_ferro: "4", quantita_ferri: 4, data_intervento: "2026-08-10", ora: "09:00", stato: "fatto", prossima_scadenza: "2026-09-14", importo: 90, stato_pagamento: "saldato", note: "", created_at: "2026-08-10" },
    { id: "di-2", cliente_mascalcia_id: "dc-1", cavallo_cliente_id: "dcv-1", horse_id: null, tipo_ferratura: "pareggio", tipo_altro: null, misura_sistema: null, numero_ferro: null, quantita_ferri: null, data_intervento: "2026-09-05", ora: "10:30", stato: "fatto", prossima_scadenza: "2026-10-31", importo: 60, stato_pagamento: "saldato", note: "", created_at: "2026-09-05" },
    { id: "di-3", cliente_mascalcia_id: "dc-1", cavallo_cliente_id: "dcv-1", horse_id: null, tipo_ferratura: "ferratura", tipo_altro: null, misura_sistema: "italiana", numero_ferro: "4", quantita_ferri: 4, data_intervento: "2026-09-16", ora: "15:00", stato: "fatto", prossima_scadenza: "2026-10-21", importo: 95, stato_pagamento: "da_saldare", note: "", created_at: "2026-09-16" },
  ],
  messaggiMascalcia: [
    { id: "dm-1", cliente_mascalcia_id: "dc-1", mittente_tipo: "cliente", testo: "Ciao! Quando puoi passare per Aurora?", letto: false, created_at: "2026-09-15T09:00:00" },
    { id: "dm-2", cliente_mascalcia_id: "dc-1", mittente_tipo: "maniscalco", testo: "Ciao Marco, ti confermo per venerdì mattina.", letto: true, created_at: "2026-09-14T18:20:00" },
  ],
};

const DB = {
  async listHorses(){
    if(DEMO_MODE) return demoState.horses;
    const { data, error } = await sb.from("horses").select("*").eq("owner_id", currentUser.id).order("created_at", { ascending: true });
    return error ? [] : (data || []);
  },
  async insertHorse(payload){
    // piano Free del proprietario: 1 cavallo (il controllo vero è anche nel database)
    if(!isPremium() && (horses || []).length >= LIMITE_CAVALLI_FREE){ openModal("modal-limite-cavalli"); return { error: { message: "Il piano Free comprende " + LIMITE_CAVALLI_FREE + " cavallo." }, data: null }; }
    if(DEMO_MODE){
      const id = "demo-" + (++demoIdCounter);
      demoState.horses.push({ id, stable_id: null, ...payload });
      return { error: null, data: { id } };
    }
    const { data, error } = await sb.from("horses").insert({ owner_id: currentUser.id, ...payload }).select().single();
    if(error && /LIMITE_CAVALLI_FREE/.test(error.message || "")){ openModal("modal-limite-cavalli"); return { error: { message: "Il piano Free comprende " + LIMITE_CAVALLI_FREE + " cavallo." }, data: null }; }
    return { error, data };
  },
  async updateHorse(id, payload){
    if(DEMO_MODE){
      const idx = demoState.horses.findIndex(h => h.id === id);
      if(idx >= 0) demoState.horses[idx] = { ...demoState.horses[idx], ...payload };
      return { error: null };
    }
    const { error } = await sb.from("horses").update(payload).eq("id", id);
    return { error };
  },
  async deleteHorse(id){
    if(DEMO_MODE){
      demoState.horses = demoState.horses.filter(h => h.id !== id);
      delete demoState.events[id];
      return;
    }
    await sb.from("horses").delete().eq("id", id);
  },
  async listEvents(horseId){
    if(DEMO_MODE) return (demoState.events[horseId] || []).slice().sort((a,b) => new Date(b.date) - new Date(a.date));
    const { data, error } = await sb.from("health_events").select("*").eq("horse_id", horseId).order("date", { ascending: false });
    return error ? [] : (data || []);
  },
  async insertEvent({ horse_id, type, date, next_due_date, notes }){
    if(DEMO_MODE){
      if(!demoState.events[horse_id]) demoState.events[horse_id] = [];
      demoState.events[horse_id].push({ id: "de-" + (++demoIdCounter), type, date, next_due_date, notes });
      return { error: null };
    }
    const { error } = await sb.from("health_events").insert({ horse_id, type, date, next_due_date, notes });
    return { error };
  },
    async updateEvent(id, { horse_id, type, date, next_due_date, notes }){
    if(DEMO_MODE){
      const list = demoState.events[horse_id] || [];
      const ev = list.find(e => e.id === id);
      if(ev){ Object.assign(ev, { type, date, next_due_date, notes }); }
      return { error: null };
    }
    const { error } = await sb.from("health_events").update({ type, date, next_due_date, notes }).eq("id", id);
    return { error };
  },
    async deleteEvent(id, horse_id){
    if(DEMO_MODE){
      demoState.events[horse_id] = (demoState.events[horse_id] || []).filter(e => e.id !== id);
      return;
    }
    const { error } = await sb.from("health_events").delete().eq("id", id);
    if(error) showToast(error.message || "Eliminazione non riuscita");
  },
  async listUpcomingDeadlines(horseIds, limit){
    if(DEMO_MODE){
      const all = [];
      horseIds.forEach(hid => {
        const horse = demoState.horses.find(h => h.id === hid);
        (demoState.events[hid] || []).forEach(ev => {
          if(ev.next_due_date) all.push({ ...ev, horses: { name: horse?.name } });
        });
      });
      return all.sort((a,b) => new Date(a.next_due_date) - new Date(b.next_due_date)).slice(0, limit);
    }
    const { data, error } = await sb.from("health_events").select("*, horses(name)")
      .in("horse_id", horseIds).not("next_due_date", "is", null)
      .order("next_due_date", { ascending: true }).limit(limit);
    return error ? [] : (data || []);
  },
  // Ricerca (lente): tutto il libretto sanitario dei cavalli del proprietario
  async listEventiTutti(horseIds){
    if(!horseIds || !horseIds.length) return [];
    if(DEMO_MODE){
      const out = [];
      horseIds.forEach(hid => (demoState.events[hid] || []).forEach(ev => out.push({ ...ev, horse_id: ev.horse_id || hid })));
      return out.sort((a,b) => new Date(b.date) - new Date(a.date));
    }
    const { data, error } = await sb.from("health_events").select("*").in("horse_id", horseIds).order("date", { ascending: false }).limit(500);
    return error ? [] : (data || []);
  },
  async listExpenses(){
    if(DEMO_MODE) return demoState.expenses.slice().sort((a,b) => new Date(b.date) - new Date(a.date)).map(e => ({ ...e, horses: { name: e.horse_name } }));
    const { data, error } = await sb.from("expenses").select("*, horses(name)").eq("owner_id", currentUser.id).order("date", { ascending: false }).limit(50);
    return error ? [] : (data || []);
  },
  async insertExpense({ horse_id, category, amount, date, notes }){
    if(DEMO_MODE){
      const horse = demoState.horses.find(h => h.id === horse_id);
      demoState.expenses.push({ id: "dx-" + (++demoIdCounter), horse_id, horse_name: horse?.name || "", category, amount, date, notes });
      return { error: null };
    }
    const { error } = await sb.from("expenses").insert({ owner_id: currentUser.id, horse_id, category, amount, date, notes });
    return { error };
  },
    async updateExpense(id, { horse_id, category, amount, date, notes }){
    if(DEMO_MODE){
      const exp = demoState.expenses.find(e => e.id === id);
      if(exp){
        const horse = demoState.horses.find(h => h.id === horse_id);
        Object.assign(exp, { horse_id, horse_name: horse?.name || "", category, amount, date, notes });
      }
      return { error: null };
    }
    const { error } = await sb.from("expenses").update({ horse_id, category, amount, date, notes }).eq("id", id);
    return { error };
  },
    async deleteExpense(id){
    if(DEMO_MODE){
      demoState.expenses = demoState.expenses.filter(e => e.id !== id);
      return;
    }
    await sb.from("expenses").delete().eq("id", id);
  },
  async listLezioni(){
    if(DEMO_MODE) return demoState.lezioniManuali.slice().sort((a,b) => new Date(b.data) - new Date(a.data)).map(l => ({ ...l, horses: { name: (demoState.horses.find(h => h.id === l.horse_id) || {}).name } }));
    const { data, error } = await sb.from("lezioni_manuali").select("*, horses(name)").eq("owner_id", currentUser.id).order("data", { ascending: false });
    return error ? [] : (data || []);
  },
  async insertLezione({ horse_id, data, tipo, note }){
    if(DEMO_MODE){
      demoState.lezioniManuali.push({ id: "dl-" + (++demoIdCounter), horse_id, data, tipo, note, created_at: new Date().toISOString() });
      return { error: null };
    }
    const { error } = await sb.from("lezioni_manuali").insert({ owner_id: currentUser.id, horse_id, data, tipo, note });
    return { error };
  },
  async updateLezione(id, { horse_id, data, tipo, note }){
    if(DEMO_MODE){
      const idx = demoState.lezioniManuali.findIndex(l => l.id === id);
      if(idx >= 0) demoState.lezioniManuali[idx] = { ...demoState.lezioniManuali[idx], horse_id, data, tipo, note };
      return { error: null };
    }
    const { error } = await sb.from("lezioni_manuali").update({ horse_id, data, tipo, note }).eq("id", id);
    return { error };
  },
  async deleteLezione(id){
    if(DEMO_MODE){
      demoState.lezioniManuali = demoState.lezioniManuali.filter(l => l.id !== id);
      return { error: null };
    }
    const { error } = await sb.from("lezioni_manuali").delete().eq("id", id);
    return { error };
  },
  /* -- Chat tra proprietari -- */
  async findProprietarioByCodice(codice){
    if(DEMO_MODE) return demoState.altriProprietari.find(p => p.codice_proprietario === codice.toUpperCase()) || null;
    // Via RPC sicura: il client non può leggere profiles di altri utenti per via
    // dell'RLS, quindi la ricerca per codice passa da una funzione lato server.
    const { data, error } = await sb.rpc("lookup_profilo_da_codice_app", { p_codice: codice });
    if(error || !data) return null;
    const row = Array.isArray(data) ? data[0] : data;
    return row || null;
  },
  /* -- Chat tra colleghi professionisti (stesse tabelle, conversazioni_proprietari.tipo = 'colleghi') -- */
  async listColleghi(){
    if(DEMO_MODE){
      return (demoState.colleghi || []).map(c => {
        const msgs = demoState.messaggiProprietari.filter(m => m.conversazione_id === c.conversazione_id).slice().sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
        return { ...c, ultimoMessaggio: msgs[0] || null, unread: msgs.filter(m => m.mittente_id !== "demo-user" && !m.letto).length };
      });
    }
    const { data, error } = await sb.rpc("lista_colleghi");
    if(error){ console.error("listColleghi:", error); return []; }
    const lista = data || [];
    if(!lista.length) return [];
    const { data: messaggi, error: mErr } = await sb.from("messaggi_proprietari").select("*").in("conversazione_id", lista.map(c => c.conversazione_id)).order("created_at", { ascending: false }).limit(300);
    if(mErr) console.error("listColleghi (messaggi):", mErr);
    return lista.map(c => {
      const msgs = (messaggi || []).filter(m => m.conversazione_id === c.conversazione_id);
      return { ...c, ultimoMessaggio: msgs[0] || null, unread: msgs.filter(m => m.mittente_id !== currentUser.id && !m.letto).length };
    }).sort((a,b) => new Date(b.ultimoMessaggio?.created_at || 0) - new Date(a.ultimoMessaggio?.created_at || 0));
  },
  async creaChatCollega(codice){
    if(DEMO_MODE){
      demoState.colleghi = demoState.colleghi || [];
      if(codice !== "EQUO-PRO-DEMO") return { ok: false, errore: "codice_non_valido" };
      let c = demoState.colleghi[0];
      if(!c){
        const conv = { id: "co-" + (++demoIdCounter), proprietario_a_id: "demo-user", proprietario_b_id: "demo-vet", tipo: "colleghi", created_at: new Date().toISOString() };
        demoState.conversazioniProprietari.push(conv);
        c = { conversazione_id: conv.id, altro_id: "demo-vet", nome: "Dott.ssa Giulia Neri", ruolo: "veterinario", avatar_url: null, certificato: true };
        demoState.colleghi.push(c);
      }
      return { ok: true, conversazione_id: c.conversazione_id, nome: c.nome, ruolo: c.ruolo };
    }
    const { data, error } = await sb.rpc("crea_chat_collega", { p_codice: codice });
    if(error){ console.error("creaChatCollega:", error); return { ok: false, errore: error.message }; }
    return data || { ok: false, errore: "errore" };
  },
  async getOrCreateConversazione(altroId){
    if(DEMO_MODE){
      let c = demoState.conversazioniProprietari.find(c => (c.proprietario_a_id === "demo-user" && c.proprietario_b_id === altroId) || (c.proprietario_a_id === altroId && c.proprietario_b_id === "demo-user"));
      if(!c){
        c = { id: "co-" + (++demoIdCounter), proprietario_a_id: "demo-user", proprietario_b_id: altroId, created_at: new Date().toISOString() };
        demoState.conversazioniProprietari.push(c);
      }
      return c.id;
    }
    const { data: esistente } = await sb.from("conversazioni_proprietari").select("id")
      .or(`and(proprietario_a_id.eq.${currentUser.id},proprietario_b_id.eq.${altroId}),and(proprietario_a_id.eq.${altroId},proprietario_b_id.eq.${currentUser.id})`)
      .maybeSingle();
    if(esistente) return esistente.id;
    const { data, error } = await sb.from("conversazioni_proprietari").insert({ proprietario_a_id: currentUser.id, proprietario_b_id: altroId }).select("id").single();
    if(error) return null;
    return data.id;
  },
  async listConversazioniProprietario(){
    if(DEMO_MODE){
      return demoState.conversazioniProprietari.filter(c => c.tipo !== "colleghi").map(c => {
        const altroId = c.proprietario_a_id === "demo-user" ? c.proprietario_b_id : c.proprietario_a_id;
        const altro = demoState.altriProprietari.find(p => p.id === altroId) || { full_name: "Proprietario" };
        const msgs = demoState.messaggiProprietari.filter(m => m.conversazione_id === c.id).slice().sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
        const unread = msgs.filter(m => m.mittente_id !== "demo-user" && !m.letto).length;
        return { id: c.id, altro, ultimoMessaggio: msgs[0] || null, unread };
      }).sort((a,b) => new Date(b.ultimoMessaggio?.created_at || 0) - new Date(a.ultimoMessaggio?.created_at || 0));
    }
    let { data: convos, error: convErr } = await sb.from("conversazioni_proprietari").select("*")
      .or(`proprietario_a_id.eq.${currentUser.id},proprietario_b_id.eq.${currentUser.id}`);
    if(convErr) console.error("listConversazioniProprietario (conversazioni):", convErr);
    const convosProp = (convos || []).filter(c => c.tipo !== "colleghi"); // le chat tra colleghi stanno nella vista professionista
    if(convosProp.length === 0) return [];
    convos = convosProp;
    const ids = convos.map(c => c.id);
    // Via RPC sicura: il client non può leggere profiles di altri utenti per via
    // dell'RLS, quindi i nomi arrivano da una funzione lato server che restituisce
    // solo i profili delle persone con cui si ha già una conversazione.
    const [{ data: profili, error: nomiErr }, { data: messaggi, error: msgErr }] = await Promise.all([
      sb.rpc("get_nomi_conversazioni_proprietario"),
      sb.from("messaggi_proprietari").select("*").in("conversazione_id", ids).order("created_at", { ascending: false }).limit(300),
    ]);
    if(nomiErr) console.error("listConversazioniProprietario (nomi):", nomiErr);
    if(msgErr) console.error("listConversazioniProprietario (messaggi):", msgErr);
    return convos.map(c => {
      const altroId = c.proprietario_a_id === currentUser.id ? c.proprietario_b_id : c.proprietario_a_id;
      const p = (profili || []).find(p => p.altro_id === altroId);
      // nome vuoto nel profilo dell'altro → "Utente Equo" (il vecchio "Proprietario" sembrava un errore)
      const altro = p ? { id: p.altro_id, full_name: p.full_name || "Utente Equo", avatar_url: p.avatar_url } : { id: altroId, full_name: "Utente Equo" };
      const msgsConvo = (messaggi || []).filter(m => m.conversazione_id === c.id);
      const unread = msgsConvo.filter(m => m.mittente_id !== currentUser.id && !m.letto).length;
      return { id: c.id, altro, ultimoMessaggio: msgsConvo[0] || null, unread };
    }).sort((a,b) => new Date(b.ultimoMessaggio?.created_at || 0) - new Date(a.ultimoMessaggio?.created_at || 0));
  },
  async listThreadProprietario(conversazioneId){
    if(DEMO_MODE) return demoState.messaggiProprietari.filter(m => m.conversazione_id === conversazioneId).slice().sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
    const { data, error } = await sb.from("messaggi_proprietari").select("*").eq("conversazione_id", conversazioneId).order("created_at", { ascending: true });
    return error ? [] : (data || []);
  },
  async insertMessaggioProprietario({ conversazione_id, tipo, testo, media_url, file_nome }){
    tipo = tipo || "testo";
    const extra = file_nome ? { file_nome } : {};
    const risposta = consumaRisposta();
    if(DEMO_MODE){
      demoState.messaggiProprietari.push({ id: "mo-" + (++demoIdCounter), conversazione_id, mittente_id: "demo-user", tipo, testo: testo || null, media_url: media_url || null, ...extra, risposta, letto: true, created_at: new Date().toISOString() });
      return { error: null };
    }
    const { error } = await sb.from("messaggi_proprietari").insert({ conversazione_id, mittente_id: currentUser.id, tipo, testo: testo || null, media_url: media_url || null, ...extra, ...(risposta ? { risposta } : {}), letto: true });
    if(error) console.error("insertMessaggioProprietario:", error);
    return { error };
  },
  async markLettiProprietario(conversazioneId){
    if(DEMO_MODE){
      demoState.messaggiProprietari.forEach(m => { if(m.conversazione_id === conversazioneId && m.mittente_id !== "demo-user") m.letto = true; });
      return;
    }
    await sb.from("messaggi_proprietari").update({ letto: true }).eq("conversazione_id", conversazioneId).neq("mittente_id", currentUser.id).eq("letto", false);
  },
  async uploadMediaProprietario(fileOrBlob, conversazioneId, tipo, ext){
    if(DEMO_MODE){
      return { url: URL.createObjectURL(fileOrBlob), error: null };
    }
    const path = `${currentUser.id}/${conversazioneId}/${Date.now()}.${ext}`;
    const { error } = await sb.storage.from("proprietari-chat-media").upload(path, fileOrBlob, { contentType: fileOrBlob.type || undefined });
    if(error) return { url: null, error };
    const { data } = sb.storage.from("proprietari-chat-media").getPublicUrl(path);
    return { url: data?.publicUrl || null, error: null };
  },
  async ensureCodiceProprietario(){
    if(currentUser.codiceProprietario) return currentUser.codiceProprietario;
    const codice = "EQUO-OWN-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    if(DEMO_MODE){
      currentUser.codiceProprietario = codice;
      return codice;
    }
    const { error } = await sb.from("profiles").update({ codice_proprietario: codice }).eq("id", currentUser.id);
    if(!error) currentUser.codiceProprietario = codice;
    return currentUser.codiceProprietario;
  },

  /* -- Chat con la/le scuderie collegate (riusa chat_messaggi già usata da Equo Scuderia) -- */
  async listScuderieCollegate(){
    if(DEMO_MODE) return [];
    // RPC sicura (SQL fix sicurezza 27/09): il proprietario non può più leggere la tabella centri
    const { data, error } = await sb.rpc("mie_scuderie_collegate");
    if(error){
      console.error("listScuderieCollegate:", error);
      // SQL non ancora eseguita: vecchio metodo
      const old = await sb.from("scuderia_membri").select("id, centro_id, centri(nome)").eq("user_id", currentUser.id);
      if(old.error){ console.error("listScuderieCollegate (fallback):", old.error); return []; }
      return (old.data || []).map(m => ({ membro_id: m.id, centro_id: m.centro_id, nome: m.centri?.nome || "La tua scuderia" }));
    }
    return (data || []).map(m => ({ membro_id: m.membro_id, centro_id: m.centro_id, nome: m.nome || "La tua scuderia" }));
  },
  async listMessaggiScuderia(membroId){
    if(DEMO_MODE) return [];
    const { data, error } = await sb.from("chat_messaggi").select("*").eq("membro_id", membroId).order("created_at", { ascending: true });
    if(error) console.error("listMessaggiScuderia:", error);
    return error ? [] : (data || []);
  },
  async inviaMessaggioScuderia({ centro_id, membro_id, testo, tipo = "testo", file_url = null, file_nome = null }){
    if(DEMO_MODE) return { error: null };
    const row = { centro_id, membro_id, mittente_user_id: currentUser.id, testo: testo || null };
    const risposta = consumaRisposta(); if(risposta) row.risposta = risposta;
    if(tipo !== "testo") Object.assign(row, { tipo, file_url, file_nome });
    const { error } = await sb.from("chat_messaggi").insert(row);
    if(error) console.error("inviaMessaggioScuderia:", error);
    return { error };
  },
  // Allegati chat (foto ridotte a max 1600px, PDF fino a 10 MB) nel contenitore "chat-allegati/<uid>/..."
  async uploadAllegatoChat(file, cartella, tipo){
    const isPdf = tipo === "documento", isVideo = tipo === "video";
    const extVideo = ((file.name || "").split(".").pop() || "mp4").toLowerCase();
    const nome = isPdf ? (file.name || "Documento.pdf") : isVideo ? "Video." + extVideo : "Foto.jpg";
    if(DEMO_MODE) return { url: URL.createObjectURL(file), nome, error: null };
    let blob = file;
    if(tipo === "foto"){ try{ blob = await (await fetch(await riduciImmagine(file))).blob(); } catch(e){ console.error("riduci foto:", e); } }
    const rnd = crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2);
    const path = `${currentUser.id}/${cartella}/${rnd}.${isPdf ? "pdf" : isVideo ? extVideo : "jpg"}`;
    const contentType = isPdf ? "application/pdf" : isVideo ? (file.type || "video/mp4") : "image/jpeg";
    const { error } = await sb.storage.from("chat-allegati").upload(path, blob, { contentType });
    if(error){ console.error("uploadAllegatoChat:", error); return { url: null, nome, error }; }
    const { data } = sb.storage.from("chat-allegati").getPublicUrl(path);
    return { url: data?.publicUrl || null, nome, error: null };
  },
  async inviaAllegatoAlManiscalco(clienteId, tipo, file_url, file_nome){
    if(DEMO_MODE){
      demoState.messaggiMascalcia.push({ id: "dm-" + Date.now().toString(36) + (++demoIdCounter), cliente_mascalcia_id: clienteId, mittente_tipo: "cliente", tipo, file_url, file_nome, letto: false, created_at: new Date().toISOString() });
      return { error: null };
    }
    const { data, error } = await sb.rpc("invia_allegato_mascalcia_cliente", { p_cliente_id: clienteId, p_tipo: tipo, p_file_url: file_url, p_file_nome: file_nome });
    if(error){ console.error("inviaAllegatoAlManiscalco:", error); return { error }; }
    if(data && data.ok === false){ console.error("inviaAllegatoAlManiscalco:", data); return { error: { message: data.errore || "invio non riuscito" } }; }
    return { error: null };
  },

  async findStableByCode(code){
    if(DEMO_MODE) return demoState.stables.find(s => s.join_code === code) || null;
    const { data } = await sb.from("stables").select("id, name").eq("join_code", code).maybeSingle();
    return data || null;
  },
  async linkHorseToStable(horseId, stableId){
    if(DEMO_MODE){
      const horse = demoState.horses.find(h => h.id === horseId);
      if(horse) horse.stable_id = stableId;
      return;
    }
    await sb.from("horses").update({ stable_id: stableId }).eq("id", horseId);
  },

  /* -- Mascalcia (clienti + interventi del professionista) -- */
  async listClientiMascalcia(){
    if(DEMO_MODE) return demoState.clientiMascalcia.slice().sort((a,b) => a.nome.localeCompare(b.nome));
    const { data, error } = await sb.from("clienti_mascalcia").select("*").eq("maniscalco_id", currentUser.id).order("nome", { ascending: true });
    return error ? [] : (data || []);
  },
  async insertClienteMascalcia({ nome, nome_cavallo, telefono, note, tipo_cliente = "proprietario" }){
    // piano Free: massimo 10 clienti (il controllo vero è anche nel database)
    if(!isPremium()){
      let n = (typeof clientiMascalcia !== "undefined" ? clientiMascalcia.length : 0);
      if(typeof clientiMascalcia !== "undefined") n = clientiAttivi().length;
      if(!DEMO_MODE){ const { count } = await sb.from("clienti_mascalcia").select("id", { count: "exact", head: true }).eq("maniscalco_id", currentUser.id).is("archiviato_il", null); if(typeof count === "number") n = count; }
      if(n >= LIMITE_CLIENTI_FREE){ mostraLimiteClienti(); return { error: { message: "Hai raggiunto i " + LIMITE_CLIENTI_FREE + " clienti del piano Free." }, data: null }; }
    }
    const codice_invito = "EQUO-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    if(DEMO_MODE){
      const nuovo = { id: "dc-" + (++demoIdCounter), nome, nome_cavallo, telefono, note, cliente_user_id: null, codice_invito, tipo_cliente, created_at: new Date().toISOString() };
      demoState.clientiMascalcia.push(nuovo);
      return { error: null, data: nuovo };
    }
    const { data, error } = await sb.from("clienti_mascalcia").insert({ maniscalco_id: currentUser.id, nome, nome_cavallo, telefono, note, codice_invito, tipo_cliente }).select().single();
    if(error && /LIMITE_CLIENTI_FREE/.test(error.message || "")){ mostraLimiteClienti(); return { error: { message: "Hai raggiunto i " + LIMITE_CLIENTI_FREE + " clienti del piano Free." }, data: null }; }
    return { error, data };
  },
  async updateClienteMascalcia(id, payload){
    if(DEMO_MODE){
      const c = demoState.clientiMascalcia.find(x => x.id === id);
      if(c) Object.assign(c, payload);
      return { error: null };
    }
    const { error } = await sb.from("clienti_mascalcia").update(payload).eq("id", id);
    if(error) console.error("updateClienteMascalcia:", error);
    return { error };
  },
  async updateCavalloCliente(id, campi){
    if(DEMO_MODE){ const c = demoState.cavalliClientiMascalcia.find(x => x.id === id); if(c) Object.assign(c, campi); return { error: null }; }
    const { error } = await sb.from("cavalli_clienti_mascalcia").update(campi).eq("id", id);
    return { error };
  },
  async deleteCavalloCliente(id){
    if(DEMO_MODE){
      demoState.cavalliClientiMascalcia = demoState.cavalliClientiMascalcia.filter(x => x.id !== id);
      return { error: null };
    }
    const { error } = await sb.from("cavalli_clienti_mascalcia").delete().eq("id", id);
    if(error) console.error("deleteCavalloCliente:", error);
    return { error };
  },
  async deleteClienteMascalcia(id){
    if(DEMO_MODE){
      demoState.clientiMascalcia = demoState.clientiMascalcia.filter(c => c.id !== id);
      demoState.interventiMascalcia = demoState.interventiMascalcia.filter(i => i.cliente_mascalcia_id !== id);
      return;
    }
    // il database rifiuta (CLIENTE_CON_STORICO) se il cliente ha cavalli, interventi o messaggi: si archivia
    const { error } = await sb.from("clienti_mascalcia").delete().eq("id", id);
    if(error) console.warn("deleteClienteMascalcia:", error.message);
    return { error };
  },
  // solo per un cliente appena creato da un appuntamento non salvato: i suoi cavalli sono nuovi anche loro
  async deleteCavalliClienteNuovo(clienteId){
    if(DEMO_MODE){ demoState.cavalliClientiMascalcia = demoState.cavalliClientiMascalcia.filter(x => x.cliente_mascalcia_id !== clienteId); return; }
    await sb.from("cavalli_clienti_mascalcia").delete().eq("cliente_mascalcia_id", clienteId);
  },
  async archiviaClienteMascalcia(id, archivia){
    const valore = archivia ? new Date().toISOString() : null;
    if(DEMO_MODE){ const c = demoState.clientiMascalcia.find(x => x.id === id); if(c) c.archiviato_il = valore; return { error: null }; }
    const { error } = await sb.from("clienti_mascalcia").update({ archiviato_il: valore }).eq("id", id);
    if(error) console.warn("archiviaClienteMascalcia:", error.message);
    return { error };
  },
  async spostaCavalli(ids, clienteId){
    if(DEMO_MODE){
      demoState.cavalliClientiMascalcia.forEach(x => { if(ids.includes(x.id)) x.cliente_mascalcia_id = clienteId; });
      return { ok: true, spostati: ids.length };
    }
    const { data, error } = await sb.rpc("pro_sposta_cavalli", { p_cavalli: ids, p_cliente: clienteId });
    if(error) return { ok: false, errore: "Spostamento non riuscito. Riprova." };
    return data || { ok: false };
  },
  async listInterventiMascalcia(clienteId){
    if(DEMO_MODE) return demoState.interventiMascalcia.filter(i => i.cliente_mascalcia_id === clienteId && i.stato !== "rifiutato")
      .map(i => { const cv = demoState.cavalliClientiMascalcia.find(x => x.id === i.cavallo_cliente_id); return { ...i, cavalli_clienti_mascalcia: cv ? { nome: cv.nome } : null }; })
      .sort((a,b) => new Date(b.data_intervento) - new Date(a.data_intervento));
    const { data, error } = await sb.from("interventi_mascalcia").select("*, cavalli_clienti_mascalcia(nome)").eq("cliente_mascalcia_id", clienteId).not("stato", "in", "(rifiutato,annullato)").order("data_intervento", { ascending: false });
    return error ? [] : (data || []);
  },
  async insertInterventoMascalcia({ cliente_mascalcia_id, cavallo_cliente_id = null, horse_id = null, tipo_ferratura, tipo_altro, misura_sistema = null, numero_ferro, quantita_ferri, ferri_nuovi = null, data_intervento, ora = null, stato = "fatto", prossima_scadenza, importo, stato_pagamento, note }){
    const row = { cliente_mascalcia_id, cavallo_cliente_id, horse_id, tipo_ferratura, tipo_altro, misura_sistema, numero_ferro, quantita_ferri, data_intervento, ora, stato, prossima_scadenza, importo, stato_pagamento, note };
    if(ferri_nuovi !== null) row.ferri_nuovi = ferri_nuovi;
    if(DEMO_MODE){
      const nuovo = { id: "di-" + Date.now().toString(36) + (++demoIdCounter), ...row, created_at: new Date().toISOString() };
      demoState.interventiMascalcia.push(nuovo);
      return { error: null, data: nuovo };
    }
    const { data, error } = await sb.from("interventi_mascalcia").insert({ maniscalco_id: currentUser.id, ...row }).select().single();
    if(error) console.error("insertInterventoMascalcia:", error);
    return { error, data };
  },
  async updateInterventoMascalcia(id, payload){
    if(DEMO_MODE){
      const i = demoState.interventiMascalcia.find(x => x.id === id);
      if(i) Object.assign(i, payload);
      return { error: null };
    }
    const { error } = await sb.from("interventi_mascalcia").update(payload).eq("id", id);
    if(error) console.error("updateInterventoMascalcia:", error);
    return { error };
  },
  // storico del singolo cavallo con questo maniscalco (anche presso altri clienti)
  async listInterventiCavallo(cv){
    if(!cv || (!cv.id && !cv.horse_id)) return [];
    const ordina = l => l.sort((a, b) => (b.data_intervento || "").localeCompare(a.data_intervento || "") || String(b.ora || "").localeCompare(String(a.ora || "")));
    if(DEMO_MODE) return ordina(demoState.interventiMascalcia.filter(i => !["rifiutato", "annullato"].includes(i.stato) && ((cv.id && i.cavallo_cliente_id === cv.id) || (cv.horse_id && i.horse_id === cv.horse_id)))
      .map(i => ({ ...i, clienti_mascalcia: { nome: (demoState.clientiMascalcia.find(c => c.id === i.cliente_mascalcia_id) || {}).nome } })));
    const filtro = [cv.id ? "cavallo_cliente_id.eq." + cv.id : null, cv.horse_id ? "horse_id.eq." + cv.horse_id : null].filter(Boolean).join(",");
    const { data, error } = await sb.from("interventi_mascalcia").select("*, clienti_mascalcia(nome)").eq("maniscalco_id", currentUser.id).or(filtro).not("stato", "in", "(rifiutato,annullato)").order("data_intervento", { ascending: false });
    if(error) console.error("listInterventiCavallo:", error);
    return ordina(data || []);
  },
  async deleteInterventoMascalcia(id){
    if(DEMO_MODE){
      demoState.interventiMascalcia = demoState.interventiMascalcia.filter(x => x.id !== id);
      return { error: null };
    }
    const { error } = await sb.from("interventi_mascalcia").delete().eq("id", id);
    if(error) console.error("deleteInterventoMascalcia:", error);
    return { error };
  },
  async segnaInterventoFatto(id){
    return DB.updateInterventoMascalcia(id, { stato: "fatto" });
  },
  // Appuntamenti/interventi tra due date (incluse), formato "YYYY-MM-DD", per l'agenda settimanale
  async listInterventiPeriodo(daIso, aIso){
    if(DEMO_MODE){
      return demoState.interventiMascalcia
        .filter(i => i.data_intervento >= daIso && i.data_intervento <= aIso && i.stato !== "rifiutato")
        .map(i => {
          const c = demoState.clientiMascalcia.find(x => x.id === i.cliente_mascalcia_id);
          const cv = demoState.cavalliClientiMascalcia.find(x => x.id === i.cavallo_cliente_id);
          return { ...i, clienti_mascalcia: { nome: c?.nome, nome_cavallo: c?.nome_cavallo, cliente_user_id: c?.cliente_user_id }, cavalli_clienti_mascalcia: cv ? { nome: cv.nome } : null };
        })
        .sort((a,b) => (a.data_intervento + (a.ora || "")).localeCompare(b.data_intervento + (b.ora || "")));
    }
    const { data, error } = await sb.from("interventi_mascalcia")
      .select("*, clienti_mascalcia(nome, nome_cavallo, cliente_user_id), cavalli_clienti_mascalcia(nome)")
      .eq("maniscalco_id", currentUser.id).not("stato", "in", "(rifiutato,annullato)")
      .gte("data_intervento", daIso).lte("data_intervento", aIso)
      .order("data_intervento", { ascending: true }).order("ora", { ascending: true, nullsFirst: false });
    if(error){ console.error("listInterventiPeriodo:", error); return []; }
    return data || [];
  },
  // Promemoria: interventi fatti la cui prossima_scadenza cade nel periodo, solo se è l'ultimo intervento per quel cavallo/cliente
  async listScadenzePeriodo(daIso, aIso){
    const chiave = i => i.cavallo_cliente_id || ("c:" + i.cliente_mascalcia_id);
    let righe, successivi;
    if(DEMO_MODE){
      const tutti = demoState.interventiMascalcia;
      righe = tutti.filter(i => i.stato !== "programmato" && i.prossima_scadenza && i.prossima_scadenza >= daIso && i.prossima_scadenza <= aIso)
        .map(i => {
          const c = demoState.clientiMascalcia.find(x => x.id === i.cliente_mascalcia_id);
          const cv = demoState.cavalliClientiMascalcia.find(x => x.id === i.cavallo_cliente_id);
          return { ...i, clienti_mascalcia: { nome: c?.nome, nome_cavallo: c?.nome_cavallo }, cavalli_clienti_mascalcia: cv ? { nome: cv.nome } : null };
        });
      successivi = tutti.filter(i => !STATI_NON_CONFERMATI.includes(i.stato));
    } else {
      const { data, error } = await sb.from("interventi_mascalcia")
        .select("*, clienti_mascalcia(nome, nome_cavallo), cavalli_clienti_mascalcia(nome)")
        .eq("maniscalco_id", currentUser.id).eq("stato", "fatto")
        .gte("prossima_scadenza", daIso).lte("prossima_scadenza", aIso);
      if(error){ console.error("listScadenzePeriodo:", error); return []; }
      righe = data || [];
      if(!righe.length) return [];
      const minData = righe.map(r => r.data_intervento).sort()[0];
      const clienti = [...new Set(righe.map(r => r.cliente_mascalcia_id))];
      const res = await sb.from("interventi_mascalcia").select("id, cliente_mascalcia_id, cavallo_cliente_id, data_intervento")
        .eq("maniscalco_id", currentUser.id).in("cliente_mascalcia_id", clienti).gt("data_intervento", minData)
        .not("stato", "in", "(richiesto,rifiutato,proposto,annullato)");
      if(res.error) console.error("listScadenzePeriodo (successivi):", res.error);
      successivi = res.data || [];
    }
    return righe.filter(r => !successivi.some(x => x.id !== r.id && chiave(x) === chiave(r) && x.data_intervento > r.data_intervento));
  },
  /* -- Cavalli dei clienti del maniscalco (opzione B+C) -- */
  // Ritorna i cavalli selezionabili per un cliente:
  //  - "equo": cavalli veri del proprietario collegato (tabella horses, solo se condiviso_ecosistema)
  //  - "manuale": cavalli inseriti a mano dal maniscalco (cavalli_clienti_mascalcia) non ancora abbinati a un cavallo vero
  async listCavalliCliente(clienteId){
    if(!clienteId) return [];
    if(DEMO_MODE){
      return demoState.cavalliClientiMascalcia.filter(c => c.cliente_mascalcia_id === clienteId)
        .map(c => ({ key: "m:" + c.id, tipo: "manuale", id: c.id, nome: c.nome, microchip: c.microchip, horse_id: c.horse_id, codice_equo: c.codice_equo || null, razza: c.razza || null, ferro_sistema: c.ferro_sistema || null, ferro_numero: c.ferro_numero || null,
          ferratura_tipo: c.ferratura_tipo || "completa", ferro_tipo: c.ferro_tipo || "standard", ferro_note: c.ferro_note || null, ferro_tipo_post: c.ferro_tipo_post || null, scuderia_cavallo_id: c.scuderia_cavallo_id || null, ub: ubicDi(c) }));
    }
    const [manRes, eqRes] = await Promise.all([
      sb.from("cavalli_clienti_mascalcia").select("*").eq("cliente_mascalcia_id", clienteId).order("nome", { ascending: true }),
      sb.rpc("cavalli_condivisi_cliente", { p_cliente_id: clienteId })
    ]);
    if(manRes.error) console.error("listCavalliCliente (manuali):", manRes.error);
    if(eqRes.error) console.error("listCavalliCliente (condivisi):", eqRes.error);
    let manuali = manRes.data || [];
    const condivisi = eqRes.data || [];
    if(!manRes.error && !eqRes.error && !manuali.length && !condivisi.length){
      const cli = (typeof clientiMascalcia !== "undefined" ? clientiMascalcia : []).find(x => x.id === clienteId);
      if(cli && cli.nome_cavallo){
        // una sola creazione anche se il modulo e la scheda cliente chiedono i cavalli insieme
        window.__cavalliInCreazione = window.__cavalliInCreazione || {};
        if(!window.__cavalliInCreazione[clienteId]) window.__cavalliInCreazione[clienteId] = creaCavalliDaTesto(clienteId, cli.nome_cavallo);
        manuali = await window.__cavalliInCreazione[clienteId];
      }
    }
    const idCondivisi = new Set(condivisi.map(h => h.id));
    const senzaCopia = condivisi.filter(h => !manuali.some(m => m.horse_id === h.id)).map(h => h.id);
    let altrove = [];
    if(senzaCopia.length){
      let r = await sb.from("cavalli_clienti_mascalcia").select("*, clienti_mascalcia(nome)").in("horse_id", senzaCopia);
      if(r.error) r = await sb.from("cavalli_clienti_mascalcia").select("id, horse_id, codice_equo, ferro_sistema, ferro_numero, ferratura_tipo, ferro_tipo, ferro_note, scuderia_cavallo_id, microchip, cliente_mascalcia_id, clienti_mascalcia(nome)").in("horse_id", senzaCopia);
      altrove = r.data || [];
    }
    const out = condivisi.map(h => {
      const mirror = manuali.find(m => m.horse_id === h.id) || altrove.find(m => m.horse_id === h.id);
      const presso = mirror && mirror.cliente_mascalcia_id && mirror.cliente_mascalcia_id !== clienteId ? (mirror.clienti_mascalcia?.nome || "un altro cliente") : null;
      return { key: "h:" + h.id, tipo: "equo", id: mirror ? mirror.id : null, nome: h.name, microchip: h.microchip, horse_id: h.id, codice_equo: mirror?.codice_equo || h.codice_equo || null, razza: h.breed || null, presso, ferro_sistema: mirror?.ferro_sistema || null, ferro_numero: mirror?.ferro_numero || null,
        ferratura_tipo: mirror?.ferratura_tipo || "completa", ferro_tipo: mirror?.ferro_tipo || "standard", ferro_note: mirror?.ferro_note || null, ferro_tipo_post: mirror?.ferro_tipo_post || null, scuderia_cavallo_id: mirror?.scuderia_cavallo_id || null, nascita: h.birth_date || null, ub: ubicDi(mirror, clienteId) };
    });
    manuali.filter(m => !m.horse_id || !idCondivisi.has(m.horse_id)).forEach(m => {
      out.push({ key: "m:" + m.id, tipo: "manuale", id: m.id, nome: m.nome, microchip: m.microchip, horse_id: m.horse_id, codice_equo: m.codice_equo || null, razza: m.razza || null, ferro_sistema: m.ferro_sistema || null, ferro_numero: m.ferro_numero || null,
        ferratura_tipo: m.ferratura_tipo || "completa", ferro_tipo: m.ferro_tipo || "standard", ferro_note: m.ferro_note || null, ferro_tipo_post: m.ferro_tipo_post || null, scuderia_cavallo_id: m.scuderia_cavallo_id || null, ub: ubicDi(m) });
    });
    return out;
  },
  async insertCavalloCliente({ cliente_mascalcia_id, nome, microchip = null, horse_id = null, razza = null, ferratura_tipo = null }){
    const row = { cliente_mascalcia_id, nome, microchip: microchip ? microchip.trim().toUpperCase() : null, horse_id };
    if(razza) row.razza = razza;
    if(ferratura_tipo && ferratura_tipo !== "completa") row.ferratura_tipo = ferratura_tipo;
    if(DEMO_MODE){
      const nuovo = { id: "dcv-" + Date.now().toString(36) + (++demoIdCounter), ...row, created_at: new Date().toISOString() };
      demoState.cavalliClientiMascalcia.push(nuovo);
      return { error: null, data: nuovo };
    }
    const { data, error } = await sb.from("cavalli_clienti_mascalcia").insert({ maniscalco_id: currentUser.id, ...row }).select().single();
    if(error) console.error("insertCavalloCliente:", error);
    return { error, data };
  },
  // Dato un cavallo scelto dal menù (listCavalliCliente), ritorna { cavallo_cliente_id, horse_id } da salvare sull'intervento.
  // Per un cavallo "equo" senza riga locale ne crea una "specchio" (nome sempre leggibile dal maniscalco, RLS horses intatte).
  async risolviCavalloPerIntervento(clienteId, cavallo){
    if(!cavallo) return { cavallo_cliente_id: null, horse_id: null };
    if(cavallo.id) return { cavallo_cliente_id: cavallo.id, horse_id: cavallo.horse_id || null };
    const { data, error } = await DB.insertCavalloCliente({ cliente_mascalcia_id: clienteId, nome: cavallo.nome, microchip: cavallo.microchip, horse_id: cavallo.horse_id });
    if(error || !data) return { cavallo_cliente_id: null, horse_id: cavallo.horse_id || null };
    return { cavallo_cliente_id: data.id, horse_id: cavallo.horse_id || null };
  },
  // Ricerca: tutti i cavalli dei clienti del professionista (per cercare un cliente dal nome del cavallo)
  async listCavalliMiei(){
    if(DEMO_MODE) return (demoState.cavalliClientiMascalcia || []).map(c => ({ id: c.id, cliente_mascalcia_id: c.cliente_mascalcia_id, nome: c.nome, microchip: c.microchip || null, horse_id: c.horse_id || null, codice_equo: c.codice_equo || null, ferro_sistema: c.ferro_sistema || null, ferro_numero: c.ferro_numero || null, ferratura_tipo: c.ferratura_tipo || "completa", ferro_tipo: c.ferro_tipo || "standard", ...ubicDi(c) }));
    let { data, error } = await sb.from("cavalli_clienti_mascalcia").select("id, cliente_mascalcia_id, nome, microchip, horse_id, codice_equo, ferro_sistema, ferro_numero, ferratura_tipo, ferro_tipo, " + UBIC_CAMPI.join(", ")).eq("maniscalco_id", currentUser.id).order("nome", { ascending: true });
    if(error && /ubicazione/.test(error.message || "")) ({ data, error } = await sb.from("cavalli_clienti_mascalcia").select("id, cliente_mascalcia_id, nome, microchip, horse_id, codice_equo, ferro_sistema, ferro_numero, ferratura_tipo, ferro_tipo").eq("maniscalco_id", currentUser.id).order("nome", { ascending: true }));
    if(error) console.error("listCavalliMiei:", error);
    return error ? [] : (data || []);
  },
  // SPOSTA CAVALLO
  async spostaCavallo(p){
    if(DEMO_MODE){
      const oggi = p.dal || isoLocale(new Date());
      let nome = p.dest === "casa" ? "A casa" : p.nome || "";
      if(p.vista === "maniscalco"){
        const r = demoState.cavalliClientiMascalcia.find(x => x.id === p.id);
        if(!r) return { ok: false, errore: "Cavallo non trovato." };
        const prima = luogoDi(ubicDi(r)).nome;
        let cli = p.cliente || null;
        if(p.dest === "nuova"){ cli = "dc-n" + Date.now(); demoState.clientiMascalcia.push({ id: cli, nome: p.nome, nome_cavallo: "", telefono: "", note: "", cliente_user_id: null, codice_invito: "EQUO-NEW", tipo_cliente: "struttura", indirizzo: p.indirizzo || null, created_at: oggi }); }
        if(cli) nome = demoState.clientiMascalcia.find(x => x.id === cli)?.nome || nome;
        Object.assign(r, cli === r.cliente_mascalcia_id || (p.dest === "casa" && !p.indirizzo) ? { ubicazione_tipo: null, ubicazione_cliente_id: null, ubicazione_nome: null, ubicazione_indirizzo: null }
          : p.dest === "casa" ? { ubicazione_tipo: "casa", ubicazione_cliente_id: null, ubicazione_nome: null, ubicazione_indirizzo: p.indirizzo }
          : { ubicazione_tipo: "scuderia", ubicazione_cliente_id: cli, ubicazione_nome: nome, ubicazione_indirizzo: null }, { ubicazione_dal: oggi });
        (demoState.spostamenti = demoState.spostamenti || []).unshift({ chiave: r.id, creato: new Date().toISOString(), tipo: "spostamento", descrizione: `Spostato da «${prima}» a «${nome}» dal ${formatDate(oggi)} · Demo (maniscalco)` });
        return { ok: true, luogo: nome, scuderia_cliente_id: p.dest === "nuova" ? cli : null };
      }
      const h = demoState.horses.find(x => x.id === p.id);
      if(!h) return { ok: false, errore: "Cavallo non trovato." };
      if(p.centro) nome = (demoState.stables || []).find(x => x.id === p.centro)?.name || "Scuderia";
      const prima = luogoProprietario(h).nome;
      Object.assign(h, { ubicazione_tipo: p.dest === "casa" ? "casa" : "scuderia", ubicazione_centro_id: p.centro || null, ubicazione_nome: p.dest === "casa" ? null : nome, ubicazione_indirizzo: p.indirizzo || null, ubicazione_dal: oggi });
      (demoState.spostamenti = demoState.spostamenti || []).unshift({ chiave: h.id, creato: new Date().toISOString(), tipo: "spostamento", descrizione: `Spostato da «${prima}» a «${nome}» dal ${formatDate(oggi)} · Demo (proprietario)` });
      return { ok: true, luogo: nome, arrivo: !!p.centro };
    }
    const { data, error } = await sb.rpc("equo_sposta_cavallo", { p_vista: p.vista, p_id: p.id, p_dest: p.dest, p_cliente: p.cliente || null, p_centro: p.centro || null,
      p_nome: p.nome || null, p_indirizzo: p.indirizzo || null, p_dal: p.dal || null });
    if(error) return { ok: false, errore: /equo_sposta_cavallo/.test(error.message || "") ? "Funzione non ancora attiva: serve l'aggiornamento del database." : error.message };
    return data;
  },
  async spostamentiCavallo(vista, id){
    if(!id) return [];
    if(DEMO_MODE) return (demoState.spostamenti || []).filter(s => s.chiave === id);
    const { data, error } = await sb.rpc("equo_spostamenti_cavallo", { p_vista: vista, p_id: id });
    return error ? [] : (data || []);
  },
  async arriviCavallo(horseId){
    if(DEMO_MODE || !horseId) return [];
    const { data, error } = await sb.from("cavalli_arrivi").select("stato, created_at, risposto_il").eq("horse_id", horseId).order("created_at", { ascending: false }).limit(3);
    return error ? [] : (data || []);
  },
  async cercaCentri(q){
    if(DEMO_MODE) return (demoState.stables || []).filter(s => s.name.toLowerCase().includes(q.toLowerCase())).map(s => ({ id: s.id, nome: s.name, citta: "Velletri", provincia: "RM" }));
    const { data, error } = await sb.rpc("equo_cerca_centri", { p_q: q });
    return error ? [] : (data || []);
  },
  async listInterventiMascalciaTutti(){
    if(DEMO_MODE){
      return demoState.interventiMascalcia.filter(i => !STATI_NON_CONFERMATI.includes(i.stato))
        .map(i => { const cv = demoState.cavalliClientiMascalcia.find(x => x.id === i.cavallo_cliente_id); return { ...i, clienti_mascalcia: { nome: demoState.clientiMascalcia.find(c => c.id === i.cliente_mascalcia_id)?.nome }, cavalli_clienti_mascalcia: cv ? { nome: cv.nome } : null }; })
        .sort((a,b) => new Date(b.data_intervento) - new Date(a.data_intervento));
    }
    const { data, error } = await sb.from("interventi_mascalcia").select("*, clienti_mascalcia(nome), cavalli_clienti_mascalcia(nome)")
      .eq("maniscalco_id", currentUser.id).not("stato", "in", "(richiesto,rifiutato,proposto,annullato)").order("data_intervento", { ascending: false });
    return error ? [] : (data || []);
  },
  // Home pro → "Da richiamare": l'ultimo richiamo aperto per ogni cavallo (vedi funzione SQL richiami_maniscalco)
  async listRichiami(giorni = 60){
    if(DEMO_MODE){
      const oggi = isoLocale(new Date());
      const chiave = i => i.cavallo_cliente_id || i.horse_id || ("c:" + i.cliente_mascalcia_id);
      const tutti = demoState.interventiMascalcia;
      const inAgenda = new Set(tutti.filter(i => ["programmato","richiesto","proposto"].includes(i.stato)).map(chiave));
      const ultimi = {};
      tutti.filter(i => i.stato === "fatto").forEach(i => { const k = chiave(i); if(!ultimi[k] || i.data_intervento > ultimi[k].data_intervento) ultimi[k] = i; });
      const st = demoState.richiamiStato || (demoState.richiamiStato = {});
      return Object.entries(ultimi).filter(([k, i]) => i.prossima_scadenza && !inAgenda.has(k) && !st[i.id]?.chiuso_il)
        .map(([k, i]) => {
          const c = demoState.clientiMascalcia.find(x => x.id === i.cliente_mascalcia_id);
          const cv = demoState.cavalliClientiMascalcia.find(x => x.id === i.cavallo_cliente_id);
          const scad = st[i.id]?.rimandato_al || i.prossima_scadenza;
          return { intervento_id: i.id, cliente_mascalcia_id: i.cliente_mascalcia_id, cliente_nome: c?.nome, tipo_cliente: c?.tipo_cliente,
            cavallo_cliente_id: i.cavallo_cliente_id, horse_id: i.horse_id, cavallo_nome: cv?.nome || c?.nome_cavallo || "",
            tipo_ferratura: i.tipo_ferratura, tipo_altro: i.tipo_altro, misura_sistema: i.misura_sistema, numero_ferro: i.numero_ferro, quantita_ferri: i.quantita_ferri,
            data_intervento: i.data_intervento, prossima_scadenza: i.prossima_scadenza, scadenza: scad, rimandato: !!st[i.id]?.rimandato_al, giorni: giorniTra(oggi, scad) };
        }).filter(r => r.giorni <= giorni).sort((a, b) => a.scadenza.localeCompare(b.scadenza));
    }
    const { data, error } = await sb.rpc("richiami_maniscalco", { p_giorni: giorni });
    if(error){ console.error("listRichiami:", error); return []; }
    return data || [];
  },
  async setRichiamoStato(interventoId, campi){
    if(DEMO_MODE){
      const st = demoState.richiamiStato || (demoState.richiamiStato = {});
      st[interventoId] = { ...(st[interventoId] || {}), ...campi };
      return { error: null };
    }
    const { error } = await sb.from("richiami_stato").upsert({ intervento_id: interventoId, maniscalco_id: currentUser.id, ...campi, updated_at: new Date().toISOString() });
    return { error };
  },
  // Home pro → "Prossimi appuntamenti": da fare / da confermare, compresi quelli passati non ancora segnati come fatti (ultimi 60 giorni)
  async listProssimiAppuntamenti(limit = 50){
    const da = aggiungiGiorniIso(isoLocale(new Date()), -60);
    if(DEMO_MODE){
      return demoState.interventiMascalcia
        .filter(i => ["programmato","richiesto","proposto"].includes(i.stato) && i.data_intervento >= da)
        .map(i => {
          const c = demoState.clientiMascalcia.find(x => x.id === i.cliente_mascalcia_id);
          const cv = demoState.cavalliClientiMascalcia.find(x => x.id === i.cavallo_cliente_id);
          return { ...i, clienti_mascalcia: { nome: c?.nome, nome_cavallo: c?.nome_cavallo, cliente_user_id: c?.cliente_user_id }, cavalli_clienti_mascalcia: cv ? { nome: cv.nome } : null };
        })
        .sort((a,b) => (a.data_intervento + (a.ora || "99")).localeCompare(b.data_intervento + (b.ora || "99"))).slice(0, limit);
    }
    const { data, error } = await sb.from("interventi_mascalcia")
      .select("*, clienti_mascalcia(nome, nome_cavallo, cliente_user_id), cavalli_clienti_mascalcia(nome)")
      .eq("maniscalco_id", currentUser.id).in("stato", ["programmato","richiesto","proposto"])
      .gte("data_intervento", da)
      .order("data_intervento", { ascending: true }).order("ora", { ascending: true, nullsFirst: false }).limit(limit);
    if(error){ console.error("listProssimiAppuntamenti:", error); return []; }
    return data || [];
  },
  async listProssimeScadenzeMascalcia(limit){
    if(DEMO_MODE){
      const all = demoState.interventiMascalcia
        .filter(i => i.prossima_scadenza)
        .map(i => ({ ...i, clienti_mascalcia: { nome: demoState.clientiMascalcia.find(c => c.id === i.cliente_mascalcia_id)?.nome, nome_cavallo: demoState.clientiMascalcia.find(c => c.id === i.cliente_mascalcia_id)?.nome_cavallo } }));
      return all.sort((a,b) => new Date(a.prossima_scadenza) - new Date(b.prossima_scadenza)).slice(0, limit);
    }
    const { data, error } = await sb.from("interventi_mascalcia").select("*, clienti_mascalcia(nome, nome_cavallo)")
      .eq("maniscalco_id", currentUser.id).not("prossima_scadenza", "is", null)
      .order("prossima_scadenza", { ascending: true }).limit(limit);
    return error ? [] : (data || []);
  },
  /* --- Lato CLIENTE del maniscalco (proprietario su Equo App) --- */
  async riscattaCodiceManiscalco(codice){
    if(DEMO_MODE){
      const c = demoState.clientiMascalcia.find(x => (x.codice_invito || "").toUpperCase() === codice);
      if(!c) return { ok: false, errore: "codice_non_valido" };
      if(c.cliente_user_id && c.cliente_user_id !== currentUser.id) return { ok: false, errore: "codice_gia_usato" };
      c.cliente_user_id = currentUser.id;
      return { ok: true, cliente_mascalcia_id: c.id, nome_maniscalco: "Luca Ferri (demo)" };
    }
    const { data, error } = await sb.rpc("riscatta_codice_maniscalco", { p_codice: codice });
    if(error){ console.error("riscattaCodiceManiscalco:", error); return { ok: false, errore: "errore", messaggio: error.message }; }
    return data || { ok: false, errore: "errore" };
  },
  async listManiscalchiCollegati(){
    if(DEMO_MODE){
      return demoState.clientiMascalcia.filter(c => c.cliente_user_id === currentUser.id).map(c => {
        const msgs = demoState.messaggiMascalcia.filter(m => m.cliente_mascalcia_id === c.id).sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
        const u = msgs[msgs.length - 1];
        return { cliente_mascalcia_id: c.id, maniscalco_id: "demo-farrier", nome_maniscalco: "Luca Ferri (demo)", certificato: true,
          non_letti: msgs.filter(m => m.mittente_tipo === "maniscalco" && !m.letto).length,
          ultimo_testo: u?.testo || null, ultimo_tipo: u?.tipo || null, ultimo_mittente: u?.mittente_tipo || null, ultimo_file_nome: u?.file_nome || null, ultimo_at: u?.created_at || null };
      });
    }
    const { data, error } = await sb.rpc("lista_maniscalchi_collegati");
    if(error){ console.error("listManiscalchiCollegati:", error); return []; }
    return Array.isArray(data) ? data : [];
  },
  async inviaMessaggioAlManiscalco(clienteId, testo){
    const risposta = consumaRisposta();
    if(DEMO_MODE){
      demoState.messaggiMascalcia.push({ id: "dm-" + Date.now().toString(36) + (++demoIdCounter), cliente_mascalcia_id: clienteId, mittente_tipo: "cliente", tipo: "testo", testo, risposta, letto: false, created_at: new Date().toISOString() });
      return { error: null };
    }
    const { data, error } = await sb.rpc("invia_messaggio_mascalcia_cliente", { p_cliente_id: clienteId, p_testo: testo, ...(risposta ? { p_risposta: risposta } : {}) });
    if(error){ console.error("inviaMessaggioAlManiscalco:", error); return { error }; }
    if(data && data.ok === false){ console.error("inviaMessaggioAlManiscalco:", data); return { error: { message: data.errore || "invio non riuscito" } }; }
    return { error: null };
  },
  async segnaLettiDalManiscalco(clienteId){
    if(DEMO_MODE){
      demoState.messaggiMascalcia.forEach(m => { if(m.cliente_mascalcia_id === clienteId && m.mittente_tipo === "maniscalco") m.letto = true; });
      return;
    }
    const { error } = await sb.rpc("segna_letti_mascalcia_cliente", { p_cliente_id: clienteId });
    if(error) console.error("segnaLettiDalManiscalco:", error);
  },
  // Cavalli inseriti a mano dal maniscalco per questo cliente, non ancora legati a un cavallo vero,
  // con proposta di abbinamento (1. stesso microchip, 2. stesso nome).
  async listCavalliDaAbbinare(clienteId){
    if(DEMO_MODE){
      const norm = x => (x || "").trim().toUpperCase();
      return demoState.cavalliClientiMascalcia.filter(cv => cv.cliente_mascalcia_id === clienteId && !cv.horse_id).map(cv => {
        const mc = norm(cv.microchip) ? demoState.horses.find(h => norm(h.microchip) === norm(cv.microchip)) : null;
        const mn = demoState.horses.find(h => norm(h.name) === norm(cv.nome));
        return { id: cv.id, nome: cv.nome, microchip: cv.microchip, proposto_horse_id: (mc || mn)?.id || null, match_tipo: mc ? "microchip" : mn ? "nome" : null };
      });
    }
    const { data, error } = await sb.rpc("cavalli_maniscalco_da_abbinare", { p_cliente_id: clienteId });
    if(error){ console.error("listCavalliDaAbbinare:", error); return []; }
    return Array.isArray(data) ? data : [];
  },
  async abbinaCavalloManiscalco(cavalloClienteId, horseId){
    if(DEMO_MODE){
      const cv = demoState.cavalliClientiMascalcia.find(x => x.id === cavalloClienteId);
      if(!cv) return { error: { message: "cavallo_non_trovato" } };
      if(demoState.cavalliClientiMascalcia.some(x => x.cliente_mascalcia_id === cv.cliente_mascalcia_id && x.horse_id === horseId && x.id !== cv.id)) return { error: { message: "gia_abbinato" } };
      cv.horse_id = horseId;
      demoState.interventiMascalcia.forEach(i => { if(i.cavallo_cliente_id === cavalloClienteId) i.horse_id = horseId; });
      return { error: null };
    }
    const { data, error } = await sb.rpc("abbina_cavallo_maniscalco", { p_cavallo_cliente_id: cavalloClienteId, p_horse_id: horseId });
    if(error){ console.error("abbinaCavalloManiscalco:", error); return { error }; }
    if(data && data.ok === false){ console.error("abbinaCavalloManiscalco:", data); return { error: { message: data.errore } }; }
    return { error: null };
  },
  /* --- Richieste di appuntamento (Step 5d) --- */
  // Maniscalco: tutte le richieste ancora da confermare
  async listRichiestePendenti(){
    if(DEMO_MODE){
      return demoState.interventiMascalcia.filter(i => i.stato === "richiesto").map(i => {
        const c = demoState.clientiMascalcia.find(x => x.id === i.cliente_mascalcia_id);
        const cv = demoState.cavalliClientiMascalcia.find(x => x.id === i.cavallo_cliente_id);
        return { ...i, clienti_mascalcia: { nome: c?.nome, nome_cavallo: c?.nome_cavallo, cliente_user_id: c?.cliente_user_id }, cavalli_clienti_mascalcia: cv ? { nome: cv.nome } : null };
      }).sort((a,b) => (a.data_intervento + (a.ora || "")).localeCompare(b.data_intervento + (b.ora || "")));
    }
    const { data, error } = await sb.from("interventi_mascalcia")
      .select("*, clienti_mascalcia(nome, nome_cavallo, cliente_user_id), cavalli_clienti_mascalcia(nome)")
      .eq("maniscalco_id", currentUser.id).eq("stato", "richiesto")
      .order("data_intervento", { ascending: true });
    if(error){ console.error("listRichiestePendenti:", error); return []; }
    return data || [];
  },
  // Proprietario: appuntamenti (richiesti, confermati, rifiutati) col suo maniscalco
  async listAppuntamentiCliente(clienteId){
    if(DEMO_MODE){
      const limite = aggiungiGiorniIso(isoLocale(new Date()), -7);
      return demoState.interventiMascalcia.filter(i => i.cliente_mascalcia_id === clienteId && ["richiesto","programmato","rifiutato"].includes(i.stato) && i.data_intervento >= limite)
        .map(i => ({ ...i, nome_cavallo: demoState.cavalliClientiMascalcia.find(x => x.id === i.cavallo_cliente_id)?.nome || null }))
        .sort((a,b) => (a.data_intervento + (a.ora || "")).localeCompare(b.data_intervento + (b.ora || "")));
    }
    const { data, error } = await sb.rpc("appuntamenti_maniscalco_cliente", { p_cliente_id: clienteId });
    if(error){ console.error("listAppuntamentiCliente:", error); return []; }
    return Array.isArray(data) ? data : [];
  },
  async richiediAppuntamento({ cliente_mascalcia_id, horse_id, nome_cavallo, tipo, tipo_altro, data, ora, note }){
    if(DEMO_MODE){
      let cv = horse_id ? demoState.cavalliClientiMascalcia.find(x => x.cliente_mascalcia_id === cliente_mascalcia_id && x.horse_id === horse_id) : null;
      const hz = horse_id ? demoState.horses.find(h => h.id === horse_id) : null;
      const nomeCv = hz ? hz.name : nome_cavallo;
      if(!cv && hz && (hz.microchip || "").trim()){
        cv = demoState.cavalliClientiMascalcia.find(x => x.cliente_mascalcia_id === cliente_mascalcia_id && !x.horse_id && (x.microchip || "").trim().toUpperCase() === hz.microchip.trim().toUpperCase());
        if(cv) cv.horse_id = horse_id;
      }
      if(!cv && nomeCv){
        cv = demoState.cavalliClientiMascalcia.find(x => x.cliente_mascalcia_id === cliente_mascalcia_id && !x.horse_id && (x.nome || "").toLowerCase() === nomeCv.toLowerCase());
        if(!cv){ cv = { id: "dcv-" + (++demoIdCounter), cliente_mascalcia_id, nome: nomeCv, microchip: null, horse_id: horse_id || null }; demoState.cavalliClientiMascalcia.push(cv); }
      }
      demoState.interventiMascalcia.push({ id: "di-" + Date.now().toString(36) + (++demoIdCounter), cliente_mascalcia_id, cavallo_cliente_id: cv?.id || null, horse_id: horse_id || null,
        tipo_ferratura: tipo, tipo_altro: tipo === "altro" ? tipo_altro : null, data_intervento: data, ora: ora || null, stato: "richiesto", stato_pagamento: "da_saldare", note: note || null, created_at: new Date().toISOString() });
      demoState.messaggiMascalcia.push({ id: "dm-" + (++demoIdCounter), cliente_mascalcia_id, mittente_tipo: "cliente", tipo: "testo",
        testo: testoRichiesta("📅 Richiesta appuntamento", { tipo_ferratura: tipo, tipo_altro, data_intervento: data, ora, note }, nomeCv), letto: false, created_at: new Date().toISOString() });
      return { error: null };
    }
    const { data: res, error } = await sb.rpc("richiedi_appuntamento_maniscalco", {
      p_cliente_id: cliente_mascalcia_id, p_horse_id: horse_id || null, p_nome_cavallo: nome_cavallo || null,
      p_tipo: tipo, p_tipo_altro: tipo_altro || null, p_data: data, p_ora: ora || null, p_note: note || null });
    if(error){ console.error("richiediAppuntamento:", error); return { error }; }
    if(res && res.ok === false){ console.error("richiediAppuntamento:", res); return { error: { message: res.errore } }; }
    return { error: null };
  },
  async annullaRichiesta(interventoId){
    if(DEMO_MODE){
      const i = demoState.interventiMascalcia.find(x => x.id === interventoId && x.stato === "richiesto");
      if(!i) return { error: { message: "non_trovata" } };
      demoState.interventiMascalcia = demoState.interventiMascalcia.filter(x => x.id !== interventoId);
      demoState.messaggiMascalcia.push({ id: "dm-" + (++demoIdCounter), cliente_mascalcia_id: i.cliente_mascalcia_id, mittente_tipo: "cliente", tipo: "testo",
        testo: "Richiesta annullata: appuntamento del " + formatDataBreve(i.data_intervento) + ".", letto: false, created_at: new Date().toISOString() });
      return { error: null };
    }
    const { data: res, error } = await sb.rpc("annulla_richiesta_maniscalco", { p_intervento_id: interventoId });
    if(error){ console.error("annullaRichiesta:", error); return { error }; }
    if(res && res.ok === false) return { error: { message: res.errore } };
    return { error: null };
  },
  // Maniscalco: collega un suo cliente all'account Equo App del proprietario tramite codice_proprietario
  async collegaClienteDaCodice(clienteId, codice){
    if(DEMO_MODE){
      const prof = demoState.altriProprietari.find(x => x.codice_proprietario === codice);
      if(!prof) return { ok: false, errore: "codice_non_valido" };
      const altro = demoState.clientiMascalcia.find(c => c.cliente_user_id === prof.id && c.id !== clienteId);
      if(altro) return { ok: false, errore: "gia_tuo_cliente", nome_cliente: altro.nome };
      const c = demoState.clientiMascalcia.find(x => x.id === clienteId);
      if(c.cliente_user_id && c.cliente_user_id !== prof.id) return { ok: false, errore: "gia_collegato_altro" };
      c.cliente_user_id = prof.id;
      demoState.messaggiMascalcia.push({ id: "dm-" + (++demoIdCounter), cliente_mascalcia_id: clienteId, mittente_tipo: "maniscalco", tipo: "testo",
        testo: "Ciao! Ti ho aggiunto come mio cliente su Equo: da qui puoi scrivermi e prenotare gli appuntamenti.", letto: false, created_at: new Date().toISOString() });
      return { ok: true, nome_proprietario: prof.full_name };
    }
    const { data, error } = await sb.rpc("collega_cliente_mascalcia_da_codice", { p_cliente_id: clienteId, p_codice: codice });
    if(error){ console.error("collegaClienteDaCodice:", error); return { ok: false, errore: "errore", messaggio: error.message }; }
    return data || { ok: false, errore: "errore" };
  },
  async richiediCertificazione(){
    if(DEMO_MODE) return { error: null };
    const { error } = await sb.from("profiles").update({ certificazione_stato: "in_verifica" }).eq("id", currentUser.id);
    if(error) console.error("richiediCertificazione:", error);
    return { error };
  },
  async listServices(){
    if(DEMO_MODE) return demoState.services;
    const { data, error } = await sb.from("services").select("*");
    return error ? [] : (data || []);
  },
  async insertSegnalazioneManeggio(payload){
    if(DEMO_MODE) return { error: null };
    const { error } = await sb.from("segnalazioni_maneggio").insert(payload);
    return { error };
  },
  async listInboxMascalcia(){
    if(DEMO_MODE){
      return demoState.messaggiMascalcia.slice().sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
        .map(m => ({ ...m, clienti_mascalcia: { nome: demoState.clientiMascalcia.find(c => c.id === m.cliente_mascalcia_id)?.nome, nome_cavallo: demoState.clientiMascalcia.find(c => c.id === m.cliente_mascalcia_id)?.nome_cavallo } }));
    }
    const { data, error } = await sb.from("messaggi_mascalcia").select("*, clienti_mascalcia(nome, nome_cavallo, centro_id, collegamento_stato, tipo_cliente)")
      .eq("maniscalco_id", currentUser.id).order("created_at", { ascending: false }).limit(200);
    return error ? [] : (data || []);
  },
  async listThreadMascalcia(clienteId){
    if(DEMO_MODE) return demoState.messaggiMascalcia.filter(m => m.cliente_mascalcia_id === clienteId).slice().sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
    const { data, error } = await sb.from("messaggi_mascalcia").select("*").eq("cliente_mascalcia_id", clienteId).order("created_at", { ascending: true });
    return error ? [] : (data || []);
  },
  async insertMessaggioMascalcia({ cliente_mascalcia_id, tipo, testo, audio_url, file_url, file_nome }){
    tipo = tipo || "testo";
    const extra = file_url ? { file_url, file_nome: file_nome || null } : {};
    const risposta = consumaRisposta();
    if(DEMO_MODE){
      demoState.messaggiMascalcia.push({ id: "dm-" + Date.now().toString(36) + (++demoIdCounter), cliente_mascalcia_id, mittente_tipo: "maniscalco", tipo, testo: testo || null, audio_url: audio_url || null, ...extra, risposta, letto: false, created_at: new Date().toISOString() });
      return { error: null };
    }
    const { error } = await sb.from("messaggi_mascalcia").insert({ maniscalco_id: currentUser.id, cliente_mascalcia_id, mittente_tipo: "maniscalco", tipo, testo: testo || null, audio_url: audio_url || null, ...extra, ...(risposta ? { risposta } : {}), letto: false });
    if(error) console.error("insertMessaggioMascalcia:", error);
    return { error };
  },
  async uploadDocumentoMascalcia(blob, clienteId){
    if(DEMO_MODE) return { url: URL.createObjectURL(blob), error: null };
    const rnd = (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2));
    const path = `${currentUser.id}/${clienteId}/${rnd}.pdf`;
    const { error } = await sb.storage.from("mascalcia-documenti").upload(path, blob, { contentType: "application/pdf" });
    if(error){ console.error("uploadDocumentoMascalcia:", error); return { url: null, error }; }
    const { data } = sb.storage.from("mascalcia-documenti").getPublicUrl(path);
    return { url: data?.publicUrl || null, error: null };
  },
  async markLettiMascalcia(clienteId){
    if(DEMO_MODE){
      demoState.messaggiMascalcia.forEach(m => { if(m.cliente_mascalcia_id === clienteId && m.mittente_tipo === "cliente") m.letto = true; });
      return;
    }
    await sb.from("messaggi_mascalcia").update({ letto: true }).eq("cliente_mascalcia_id", clienteId).eq("mittente_tipo", "cliente").eq("letto", false);
  },
  async uploadNotaVocaleMascalcia(blob, clienteId){
    if(DEMO_MODE){
      return { url: URL.createObjectURL(blob), error: null };
    }
    const path = `${currentUser.id}/${clienteId}/${Date.now()}.webm`;
    const { error } = await sb.storage.from("mascalcia-note-vocali").upload(path, blob, { contentType: blob.type || "audio/webm" });
    if(error) return { url: null, error };
    const { data } = sb.storage.from("mascalcia-note-vocali").getPublicUrl(path);
    return { url: data?.publicUrl || null, error: null };
  },

  /* -- Profilo: avatar, dati di pagamento, codice personale -- */
  async uploadAvatar(file){
    if(DEMO_MODE){
      return { url: URL.createObjectURL(file), error: null };
    }
    const ext = (file.name || "").split(".").pop() || "jpg";
    const path = `${currentUser.id}/avatar.${ext}`;
    const { error } = await sb.storage.from("avatar-utenti").upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
    if(error) return { url: null, error };
    const { data } = sb.storage.from("avatar-utenti").getPublicUrl(path);
    const url = data?.publicUrl ? data.publicUrl + "?t=" + Date.now() : null; // cache-bust dopo un re-upload
    if(url) await sb.from("profiles").update({ avatar_url: url }).eq("id", currentUser.id);
    return { url, error: null };
  },
  async updateDatiPagamento({ tipo, nome, piva_cf, iban, paypal }){
    if(DEMO_MODE){
      Object.assign(currentUser, { datiPagamentoTipo: tipo, datiPagamentoNome: nome, datiPagamentoPivaCf: piva_cf, datiPagamentoIban: iban, datiPagamentoPaypal: paypal });
      return { error: null };
    }
    const { error } = await sb.from("profiles").update({
      dati_pagamento_tipo: tipo, dati_pagamento_nome: nome, dati_pagamento_piva_cf: piva_cf,
      dati_pagamento_iban: iban, dati_pagamento_paypal: paypal,
    }).eq("id", currentUser.id);
    return { error };
  },
  async ensureCodiceProfessionista(){
    // PRO = maniscalchi, TRA = allenatori, MED = veterinari
    const ruoliPro = [currentUser.ruolo, currentUser.ruoloSecondario];
    const pref = ruoliPro.includes("maniscalco") ? "PRO" : ruoliPro.includes("istruttore") ? "TRA" : ruoliPro.includes("veterinario") ? "MED" : "PRO";
    if(pref === "TRA" && !DEMO_MODE && !String(currentUser.codiceProfessionista || "").startsWith("EQUO-TRA-")){
      const r = await sb.rpc("equo_mio_codice_trainer");
      if(!r.error && r.data) currentUser.codiceProfessionista = r.data;
      return currentUser.codiceProfessionista;
    }
    if(currentUser.codiceProfessionista) return currentUser.codiceProfessionista;
    const codice = "EQUO-" + pref + "-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    if(DEMO_MODE){
      currentUser.codiceProfessionista = codice;
      return codice;
    }
    const { error } = await sb.from("profiles").update({ codice_professionista: codice }).eq("id", currentUser.id);
    if(!error) currentUser.codiceProfessionista = codice;
    return currentUser.codiceProfessionista;
  },
};

