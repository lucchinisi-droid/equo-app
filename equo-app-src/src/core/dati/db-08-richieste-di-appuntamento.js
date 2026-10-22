/* ---------- DB · Richieste di appuntamento, collegamento cliente da codice, certificazione ---------- */
Object.assign(DB, {
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
});
