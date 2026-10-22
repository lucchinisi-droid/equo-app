/* ---------- DB · Servizi vicino, segnalazioni, chat e documenti della mascalcia ---------- */
Object.assign(DB, {
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
});
