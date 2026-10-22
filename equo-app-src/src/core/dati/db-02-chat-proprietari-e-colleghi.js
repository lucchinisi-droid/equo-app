/* ---------- DB · Chat tra proprietari e tra colleghi professionisti ---------- */
Object.assign(DB, {
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
});
