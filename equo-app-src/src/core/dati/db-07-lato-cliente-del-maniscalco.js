/* ---------- DB · Lato cliente del maniscalco (proprietario su Equo App) ---------- */
Object.assign(DB, {
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
});
