/* ---------- DB · Chat con la scuderia collegata, allegati chat, collegamento a una scuderia ---------- */
Object.assign(DB, {
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
});
