/* ---------- DB · Mascalcia: clienti e interventi del maniscalco ---------- */
Object.assign(DB, {
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
  /* -- Importazione dalla vecchia app (24/10/2026): pop-up al primo accesso -- */
  async importScelteAperte(){
    if(DEMO_MODE) return [];
    const { data, error } = await sb.from("import_decisioni").select("id,ordine,tipo,titolo,testo,opzioni")
      .eq("maniscalco_id", currentUser.id).is("risolta_il", null).order("ordine", { ascending: true });
    if(error) console.warn("importScelteAperte:", error.message);
    return error ? [] : (data || []);
  },
  async importDateDaConfermare(){
    if(DEMO_MODE) return [];
    const { data, error } = await sb.from("interventi_mascalcia")
      .select("id,data_intervento,prossima_scadenza,cliente_mascalcia_id,cavallo_cliente_id,clienti_mascalcia(nome),cavalli_clienti_mascalcia(nome)")
      .eq("maniscalco_id", currentUser.id).eq("data_da_confermare", true).limit(1000);
    if(error) console.warn("importDateDaConfermare:", error.message);
    return error ? [] : (data || []);
  },
  async importConfermaDate(righe){
    return await sb.rpc("equo_import_conferma_date", { p: righe });
  },
  async importDecidi(id, scelta, importo){
    return await sb.rpc("equo_import_decidi", { p_id: id, p_scelta: scelta, p_importo: importo });
  },
  /* -- Scadenze della struttura (24/10/2026): ultimi interventi fatti dei cavalli di un cliente, allineamento -- */
  async ultimiFattiCliente(clienteId, tipi){
    if(DEMO_MODE) return (demoState.interventiMascalcia || []).filter(i => i.cliente_mascalcia_id === clienteId && i.stato === "fatto" && tipi.includes(i.tipo_ferratura))
      .map(i => ({ ...i, cavalli_clienti_mascalcia: { nome: (demoState.cavalliClientiMascalcia || []).find(c => c.id === i.cavallo_cliente_id)?.nome || null } }))
      .sort((a, b) => b.data_intervento.localeCompare(a.data_intervento));
    const { data, error } = await sb.from("interventi_mascalcia").select("id,data_intervento,prossima_scadenza,cavallo_cliente_id,horse_id,tipo_ferratura,cavalli_clienti_mascalcia(nome)")
      .eq("maniscalco_id", currentUser.id).eq("cliente_mascalcia_id", clienteId).eq("stato", "fatto").in("tipo_ferratura", tipi)
      .order("data_intervento", { ascending: false }).order("created_at", { ascending: false }).limit(1000);
    if(error) console.warn("ultimiFattiCliente:", error.message);
    return error ? [] : (data || []);
  },
  async allineaScadenze(ids, data){
    if(DEMO_MODE){ (demoState.interventiMascalcia || []).forEach(i => { if(ids.includes(i.id)) i.prossima_scadenza = data; }); return { error: null }; }
    const { error } = await sb.from("interventi_mascalcia").update({ prossima_scadenza: data }).in("id", ids).eq("maniscalco_id", currentUser.id);
    return { error };
  },
  /* -- Cambia proprietario e resoconto (24/10/2026) -- */
  async lavoriApertiCavalli(ids, clienteId){
    if(DEMO_MODE) return (demoState.interventiMascalcia || []).filter(i => ids.includes(i.cavallo_cliente_id) && i.cliente_mascalcia_id === clienteId && i.stato === "fatto" && i.stato_pagamento === "da_saldare");
    const { data, error } = await sb.from("interventi_mascalcia").select("id, importo").eq("maniscalco_id", currentUser.id)
      .in("cavallo_cliente_id", ids).eq("cliente_mascalcia_id", clienteId).eq("stato", "fatto").eq("stato_pagamento", "da_saldare");
    if(error || !data?.length) return [];
    const u = await sb.from("conti_mascalcia_righe").select("intervento_id, conti_mascalcia!inner(stato)").in("intervento_id", data.map(r => r.id)).neq("conti_mascalcia.stato", "annullato");
    const usati = new Set((u.data || []).map(r => r.intervento_id));
    return data.filter(r => !usati.has(r.id));
  },
  async cambiaProprietario(ids, clienteId, aperti){
    if(DEMO_MODE){
      let n = 0, lav = 0;
      (demoState.cavalliClientiMascalcia || []).forEach(cv => {
        if(!ids.includes(cv.id) || cv.cliente_mascalcia_id === clienteId) return;
        const da = (demoState.clientiMascalcia || []).find(c => c.id === cv.cliente_mascalcia_id);
        (demoState.interventiMascalcia || []).forEach(i => {
          if(i.cavallo_cliente_id !== cv.id) return;
          if(["programmato", "richiesto", "proposto"].includes(i.stato)) i.cliente_mascalcia_id = clienteId;
          else if(aperti && i.stato === "fatto" && i.stato_pagamento === "da_saldare" && i.cliente_mascalcia_id === cv.cliente_mascalcia_id){ i.luogo_cliente_id = i.luogo_cliente_id || cv.cliente_mascalcia_id; i.cliente_mascalcia_id = clienteId; lav++; }
        });
        if(!cv.ubicazione_tipo && da && (da.tipo_cliente === "struttura" || da.centro_id)) Object.assign(cv, { ubicazione_tipo: "scuderia", ubicazione_cliente_id: da.id, ubicazione_nome: da.nome, ubicazione_dal: new Date().toISOString().slice(0, 10) });
        cv.cliente_mascalcia_id = clienteId; n++;
      });
      return { ok: true, spostati: n, lavori: lav };
    }
    const { data, error } = await sb.rpc("pro_cambia_proprietario", { p_cavalli: ids, p_cliente: clienteId, p_aperti: !!aperti });
    if(error) return { ok: false, errore: /pro_cambia_proprietario/.test(error.message || "") ? "Manca un aggiornamento del database: avvisa l'assistenza Equo." : "Non riuscito, riprova." };
    return data || { ok: false };
  },
  // tutti gli interventi fatti di un cliente o di un luogo (scuderia), pagati e no, in un periodo
  async interventiResoconto(clienteId, da, a){
    if(DEMO_MODE) return (demoState.interventiMascalcia || []).filter(i => i.stato === "fatto" && (i.cliente_mascalcia_id === clienteId || i.luogo_cliente_id === clienteId)
        && (!da || i.data_intervento >= da) && (!a || i.data_intervento <= a))
      .map(i => ({ ...i, cavalli_clienti_mascalcia: { nome: (demoState.cavalliClientiMascalcia || []).find(c => c.id === i.cavallo_cliente_id)?.nome || null } }));
    let q = sb.from("interventi_mascalcia").select("id, data_intervento, tipo_ferratura, tipo_altro, importo, stato_pagamento, cliente_mascalcia_id, luogo_cliente_id, cavallo_cliente_id, horse_id, quantita_ferri, ferro_tipo, cavalli_clienti_mascalcia(nome)")
      .eq("maniscalco_id", currentUser.id).eq("stato", "fatto").or(`cliente_mascalcia_id.eq.${clienteId},luogo_cliente_id.eq.${clienteId}`);
    if(da) q = q.gte("data_intervento", da);
    if(a) q = q.lte("data_intervento", a);
    const { data, error } = await q.order("data_intervento", { ascending: true }).limit(2000);
    if(error) console.warn("interventiResoconto:", error.message);
    return error ? [] : (data || []);
  },
});
