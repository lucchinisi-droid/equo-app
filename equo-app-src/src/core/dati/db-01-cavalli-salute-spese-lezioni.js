/* ---------- DB · Cavalli, eventi sanitari, spese e lezioni del proprietario ---------- */
Object.assign(DB, {
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
});
