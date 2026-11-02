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

  /* -- Documenti privati (2/11/2026, SQL 32 · claude/Equo_Privacy_documenti.md): spazio «documenti», niente link pubblici.
        Vede: autore, proprietario, chi ha un accesso; decide: proprietario → struttura → autore. -- */
  async caricaDocumentoPrivato({ blob, nomeFile, mime, categoria, titolo, horse_id, cavallo_cliente_id, scuderia_cavallo_id, visita_id, autore_ruolo, sanitario_obbligatorio }){
    const riga = { categoria: categoria || "documento", titolo: String(titolo || nomeFile || "Documento").slice(0, 160), horse_id: horse_id || null,
      cavallo_cliente_id: cavallo_cliente_id || null, scuderia_cavallo_id: scuderia_cavallo_id || null, visita_id: visita_id || null,
      autore_ruolo: autore_ruolo || null, sanitario_obbligatorio: !!sanitario_obbligatorio, mime: mime || blob?.type || null, byte: blob?.size || null };
    if(DEMO_MODE){
      const id = "doc-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      (demoState.documenti = demoState.documenti || []).push({ id, ...riga, autore_user_id: currentUser.id, url: URL.createObjectURL(blob), accessi: [] });
      return { id, error: null };
    }
    const est = (String(nomeFile || "").match(/\.([a-z0-9]{2,5})$/i) || [, (riga.mime || "").split("/")[1] || "bin"])[1].toLowerCase();
    const rnd = crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2);
    const path = `${currentUser.id}/${rnd}.${est}`;
    const up = await sb.storage.from("documenti").upload(path, blob, { contentType: riga.mime || "application/octet-stream" });
    if(up.error){ console.error("caricaDocumentoPrivato:", up.error); return { id: null, error: up.error }; }
    const { data, error } = await sb.from("documenti").insert({ ...riga, path, autore_user_id: currentUser.id }).select("id").single();
    if(error){ console.error("caricaDocumentoPrivato:", error); await sb.storage.from("documenti").remove([path]); return { id: null, error }; }
    return { id: data.id, error: null };
  },
  async apriUrlDocumento(id, secondi = 300){
    if(DEMO_MODE){ const d = (demoState.documenti || []).find(x => x.id === id); return d ? { url: d.url, error: null } : { url: null, error: "accesso" }; }
    const { data, error } = await sb.from("documenti").select("path").eq("id", id).maybeSingle();
    if(error || !data) return { url: null, error: error ? "rete" : "accesso" };
    const s = await sb.storage.from("documenti").createSignedUrl(data.path, secondi);
    return s.error ? { url: null, error: "accesso" } : { url: s.data.signedUrl, error: null };
  },
  async condividiDocumento(id, { user_id = null, centro_id = null, motivo = "condivisione" } = {}){
    if(DEMO_MODE){ const d = (demoState.documenti || []).find(x => x.id === id); if(d) d.accessi.push({ id: "acc-" + d.accessi.length, user_id, centro_id, motivo }); return { ok: !!d }; }
    const { data, error } = await sb.rpc("equo_doc_condividi", { p_doc: id, p_user: user_id, p_centro: centro_id, p_motivo: motivo });
    return error ? { ok: false, errore: error.message } : data;
  },
  async revocaAccessoDocumento(accessoId){
    if(DEMO_MODE){ (demoState.documenti || []).forEach(d => { d.accessi = d.accessi.filter(a => a.id !== accessoId); }); return { ok: true }; }
    const { data, error } = await sb.rpc("equo_doc_revoca", { p_accesso: accessoId });
    return error ? { ok: false, errore: error.message } : data;
  },
  async chiVedeDocumento(id){
    if(DEMO_MODE){ const d = (demoState.documenti || []).find(x => x.id === id); return d ? { decide: "autore", puoi_decidere: true, accessi: d.accessi } : null; }
    const { data, error } = await sb.rpc("equo_doc_chi_vede", { p_doc: id });
    return error ? null : data;
  },
});
