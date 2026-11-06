/* ---------- DB · Cavalli, eventi sanitari, spese e lezioni del proprietario ---------- */
Object.assign(DB, {
  async listHorses(){
    if(DEMO_MODE) return demoState.horses;
    const { data, error } = await sb.from("horses").select("*").eq("owner_id", currentUser.id).order("created_at", { ascending: true });
    return error ? [] : (data || []);
  },
  async insertHorse(payload){
    // piano Free del proprietario: 3 cavalli (LIMITE_CAVALLI_FREE) (il controllo vero è anche nel database)
    if(!isPremium() && (horses || []).length >= LIMITE_CAVALLI_FREE){ openModal("modal-limite-cavalli"); return { error: { message: "Il piano Free comprende " + LIMITE_CAVALLI_FREE + " cavalli." }, data: null }; }
    if(DEMO_MODE){
      const id = "demo-" + (++demoIdCounter);
      demoState.horses.push({ id, stable_id: null, ...payload });
      return { error: null, data: { id } };
    }
    const { data, error } = await sb.from("horses").insert({ owner_id: currentUser.id, ...payload }).select().single();
    if(error && /LIMITE_CAVALLI_FREE/.test(error.message || "")){ openModal("modal-limite-cavalli"); return { error: { message: "Il piano Free comprende " + LIMITE_CAVALLI_FREE + " cavalli." }, data: null }; }
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
});

/* ---------- DB · Piano terapeutico del veterinario (SQL 34, 2/11/2026) ----------
   Il veterinario scrive piano e voci (orari, giorni, dose scritta da lui); le somministrazioni previste le crea il database
   (equo_terapia_genera) e il «Fatto» passa da equo_terapia_fatto. Il proprietario vede il piano solo dopo l'invio.
   Saltata = non confermata 12 ore dopo l'orario (decisione di Simone). */
const TERAPIA_SALTATA_ORE = 12;
Object.assign(DB, {
  _ter(){ return (demoState.terapie = demoState.terapie || { piani: [], voci: [], somm: [] }); },
  _terSql(e){ return /piani_terapia|terapie_somministrazioni|equo_terapia|does not exist|schema cache/i.test(e?.message || ""); },
  // piano della visita (veterinario) con le voci
  async pianoDiVisita(visitaId){
    if(!visitaId) return null;
    if(DEMO_MODE){ const t = this._ter(); const p = t.piani.find(x => x.visita_id === visitaId); return p ? { ...p, voci: t.voci.filter(v => v.piano_id === p.id).sort((a, b) => a.ordine - b.ordine) } : null; }
    const { data, error } = await sb.from("piani_terapia").select("*, voci:piani_terapia_voci(*)").eq("visita_id", visitaId).eq("professionista_id", currentUser.id).maybeSingle();
    if(error){ if(!this._terSql(error)) console.warn("piani_terapia:", error.message); return null; }
    if(data) data.voci = (data.voci || []).sort((a, b) => a.ordine - b.ordine);
    return data;
  },
  async salvaPiano(p){
    const { voci, somm, visite_pro, ...campi } = p;
    if(DEMO_MODE){
      const t = this._ter();
      if(campi.id){ const r = t.piani.find(x => x.id === campi.id); Object.assign(r, campi, { aggiornato_il: new Date().toISOString() }); return { data: r, error: null }; }
      const r = { stato: "bozza", chiedi_conferme: false, ...campi, id: "pt" + Math.random().toString(36).slice(2, 10), professionista_id: currentUser.id, creato_il: new Date().toISOString() };
      t.piani.push(r); return { data: r, error: null };
    }
    const { id, creato_il, aggiornato_il, professionista_id, ...resto } = campi;
    const q = id ? sb.from("piani_terapia").update(resto).eq("id", id) : sb.from("piani_terapia").insert(resto);
    return await q.select().single();
  },
  async salvaVoceTerapia(v){
    if(DEMO_MODE){
      const t = this._ter();
      if(v.id){ const r = t.voci.find(x => x.id === v.id); Object.assign(r, v); return { data: r, error: null }; }
      const r = { ordine: 0, ogni_giorni: 1, giorni: 1, orari: [], ...v, id: "pv" + Math.random().toString(36).slice(2, 10) }; t.voci.push(r); return { data: r, error: null };
    }
    const { id, creato_il, ...resto } = v;
    const q = id ? sb.from("piani_terapia_voci").update(resto).eq("id", id) : sb.from("piani_terapia_voci").insert(resto);
    return await q.select().single();
  },
  async eliminaVoceTerapia(id){
    if(DEMO_MODE){ const t = this._ter(); t.voci = t.voci.filter(x => x.id !== id); t.somm = t.somm.filter(s => s.voce_id !== id); return { error: null }; }
    return await sb.from("piani_terapia_voci").delete().eq("id", id);
  },
  // somministrazioni previste future (si rifanno a ogni cambio; quelle passate e quelle fatte restano)
  async generaSomministrazioni(pianoId){
    if(DEMO_MODE){
      const t = this._ter(), p = t.piani.find(x => x.id === pianoId); if(!p) return { data: 0 };
      const ora = Date.now();
      t.somm = t.somm.filter(s => !(s.piano_id === pianoId && !s.fatto_il && new Date(s.previsto_il).getTime() > ora));
      if(p.stato !== "attivo") return { data: 0 };
      let n = 0;
      t.voci.filter(v => v.piano_id === pianoId).forEach(v => {
        for(let g = 0; g < (v.giorni || 1); g += Math.max(1, v.ogni_giorni || 1)){
          (v.orari || []).forEach(o => {
            const d = new Date(v.inizio + "T" + o + ":00"); d.setDate(d.getDate() + g);
            if(d.getTime() <= ora || t.somm.some(s => s.voce_id === v.id && s.previsto_il === d.toISOString())) return;
            t.somm.push({ id: "ps" + Math.random().toString(36).slice(2, 10), piano_id: pianoId, voce_id: v.id, previsto_il: d.toISOString(), fatto_il: null }); n++;
          });
        }
      });
      return { data: n };
    }
    const { data, error } = await sb.rpc("equo_terapia_genera", { p_piano: pianoId });
    if(error) console.warn("equo_terapia_genera:", error.message);
    return { data, error };
  },
  // piani attivi o sospesi visibili (veterinario: i suoi; proprietario: quelli mandati a lui), con voci e somministrazioni
  async terapieInCorso({ comePro = false, horseIds = null } = {}){
    const unisci = (piani, voci, somm) => piani.map(p => ({ ...p, voci: voci.filter(v => v.piano_id === p.id).sort((a, b) => a.ordine - b.ordine),
      somm: somm.filter(s => s.piano_id === p.id).sort((a, b) => String(a.previsto_il).localeCompare(String(b.previsto_il))) }));
    if(DEMO_MODE){
      const t = this._ter();
      const piani = t.piani.filter(p => ["attivo", "sospeso"].includes(p.stato) && (comePro ? p.professionista_id === currentUser.id
        : p.inviato_il && p.professionista_id !== currentUser.id && (!horseIds || horseIds.includes(p.horse_id))));
      return unisci(piani, t.voci, t.somm);
    }
    let q = sb.from("piani_terapia").select("*, visite_pro(intervento_id)").in("stato", ["attivo", "sospeso"]).order("creato_il", { ascending: false }).limit(200);
    q = comePro ? q.eq("professionista_id", currentUser.id) : q.neq("professionista_id", currentUser.id).not("inviato_il", "is", null);
    const { data: piani, error } = await q;
    if(error){ if(!this._terSql(error)) console.warn("terapie:", error.message); return []; }
    if(!piani || !piani.length) return [];
    const ids = piani.map(p => p.id);
    const [rv, rs] = await Promise.all([sb.from("piani_terapia_voci").select("*").in("piano_id", ids),
      sb.from("terapie_somministrazioni").select("id, piano_id, voce_id, previsto_il, fatto_il, fatto_da").in("piano_id", ids).order("previsto_il").limit(5000)]);
    return unisci(piani, rv.data || [], rs.data || []);
  },
  // diario del cavallo in scuderia (SQL 36): attività segnate dal groom o dal gestionale, solo per il proprietario
  async diarioScuderia(horseId, giorni = 7){
    if(!horseId) return null;
    if(DEMO_MODE){
      const primo = (typeof horses !== "undefined" ? horses : [])[0];
      if(!primo || primo.id !== horseId) return null;
      const oggi = isoLocale(new Date()), ieri = isoLocale(new Date(Date.now() - 86400000));
      return { scuderia: "Centro Ippico Demo", oggi, attiva: true,
        mostra: ["pasto_mattina", "pasto_sera", "fieno", "paddock", "lavorato", "farmaco", "box_pulito"],
        voci: [
          { giorno: oggi, tipo: "pasto_mattina", ora: "07:10", da: "Rahim" }, { giorno: oggi, tipo: "fieno", ora: "07:15", da: "Rahim" },
          { giorno: oggi, tipo: "paddock", ora: "10:30", da: "Ion" }, { giorno: oggi, tipo: "farmaco", ora: "12:00", da: "Rahim" },
          { giorno: ieri, tipo: "pasto_mattina", ora: "07:05", da: "Rahim" }, { giorno: ieri, tipo: "lavorato", ora: "16:00", da: "Ion" },
          { giorno: ieri, tipo: "box_pulito", ora: "17:20", da: "Ion" }, { giorno: ieri, tipo: "pasto_sera", ora: "18:30", da: "Rahim" } ] };
    }
    const { data, error } = await sb.rpc("mio_diario_scuderia", { p_horse: horseId, p_giorni: giorni });
    if(error){ if(!/mio_diario_scuderia|schema cache|does not exist/i.test(error.message || "")) console.warn("diario scuderia:", error.message); return null; }
    return data || null;
  },
  async terapiaFatto(id, fatto = true){
    if(DEMO_MODE){ const s = this._ter().somm.find(x => x.id === id); if(s){ s.fatto_il = fatto ? new Date().toISOString() : null; s.fatto_da = fatto ? currentUser.id : null; } return { data: !!s, error: null }; }
    const { data, error } = await sb.rpc("equo_terapia_fatto", { p_id: id, p_fatto: !!fatto });
    return { data, error };
  },
  // proposte di un professionista della scuderia per i miei cavalli (SQL 43): accetto o rifiuto
  async proposteProfessionisti(){
    if(DEMO_MODE) return [];
    const { data, error } = await sb.rpc("mie_proposte_professionisti");
    if(error){ if(!/mie_proposte_professionisti|does not exist|schema cache/i.test(error.message || "")) console.warn("proposte professionisti:", error.message); return []; }
    return data || [];
  },
  async rispondiPropostaProfessionista(id, accetta){
    const { data, error } = await sb.rpc("rispondi_proposta_professionista", { p_id: id, p_accetta: !!accetta });
    return { data, error };
  },
  // conti della scuderia inviati a me (SQL 44)
  async mieiConti(){
    if(DEMO_MODE) return [];
    const { data, error } = await sb.rpc("miei_conti");
    if(error){ if(!/miei_conti|does not exist|schema cache/i.test(error.message || "")) console.warn("conti scuderia:", error.message); return []; }
    return data || [];
  },
  async segnalaContoPagato(id, metodo){
    const { data, error } = await sb.rpc("segnala_conto_pagato", { p_id: id, p_metodo: metodo || null });
    return { data, error };
  }
});
// stato di una somministrazione: fatta · saltata (12 ore dopo l'orario senza conferma) · da fare
function statoSomministrazione(s, ora){
  if(s.fatto_il) return "fatta";
  return new Date(s.previsto_il).getTime() < (ora || Date.now()) - TERAPIA_SALTATA_ORE * 3600000 ? "saltata" : "da_fare";
}
// «2 volte al giorno (08:00, 20:00) · 5 giorni dal 2 nov»
function testoVoceTerapia(v){
  const n = (v.orari || []).length;
  const quando = !n ? "al bisogno" : (n === 1 ? "1 volta" : n + " volte") + (v.ogni_giorni > 1 ? (v.ogni_giorni === 2 ? " a giorni alterni" : " ogni " + v.ogni_giorni + " giorni") : " al giorno") + " (" + v.orari.join(", ") + ")";
  const dal = v.inizio ? new Date(v.inizio + "T12:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "";
  return [quando, (v.giorni || 1) + (v.giorni === 1 ? " giorno" : " giorni") + (dal ? " dal " + dal : "")].join(" · ");
}
// ultimo giorno della voce (data ISO)
function fineVoceTerapia(v){ const d = new Date((v.inizio || isoLocale(new Date())) + "T12:00"); d.setDate(d.getDate() + Math.max(1, v.giorni || 1) - 1); return isoLocale(d); }
