/* ---------- DB · Cavalli dei clienti del maniscalco, spostamenti, ricerca centri ---------- */
Object.assign(DB, {
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
});
