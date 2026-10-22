/* ---------- DB · Home del professionista: da richiamare, prossimi appuntamenti e scadenze ---------- */
Object.assign(DB, {
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
});
