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
  // nome dato da Equo, non dal telefono (2/11/2026, SQL 33): «Aurora · 2 nov 2026 · Lastra · Piede ASx (2) · nota»
  DOC_TIPI: { referto: "Referto", lastra: "Lastra", ecografia: "Ecografia", esame: "Esame", foto_clinica: "Foto clinica", video: "Video",
    documento_sanitario: "Documento sanitario", documento: "Documento", seduta: "Seduta", coggins: "Coggins", vaccino: "Vaccino", passaporto: "Passaporto" },
  DOC_ZONE: { as: "Arto ASx", ad: "Arto ADx", ps: "Arto PSx", pd: "Arto PDx", piede_as: "Piede ASx", piede_ad: "Piede ADx", piede_ps: "Piede PSx", piede_pd: "Piede PDx",
    testa: "Testa", bocca: "Bocca e denti", occhi: "Occhi", collo: "Collo", dorso: "Dorso", torace: "Torace", addome: "Addome", pelle: "Pelle", intero: "Cavallo intero" },
  titoloDocumento({ cavallo, data, categoria, zona, numero, nota }){
    const d = data ? new Date(String(data).slice(0, 10) + "T12:00").toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }).replace(".", "") : "";
    return [cavallo, d, (this.DOC_TIPI[categoria] || "Documento") + (zona && this.DOC_ZONE[zona] ? " · " + this.DOC_ZONE[zona] : "") + (numero > 1 ? " (" + numero + ")" : ""), nota]
      .filter(Boolean).join(" · ").slice(0, 160);
  },
  nomeFileDocumento(doc, cavallo){
    const pulisci = t => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
    const est = ({ "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "image/heif": "heif", "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm", "video/3gpp": "3gp", "application/dicom": "dcm" })[doc.mime] || "bin";
    return ["Equo", pulisci(cavallo), String(doc.data_documento || "").slice(0, 10), pulisci(this.DOC_TIPI[doc.categoria] || "Documento"), doc.zona ? pulisci(this.DOC_ZONE[doc.zona]) : "", doc.numero > 1 ? doc.numero : ""]
      .filter(Boolean).join("_") + "." + est;
  },
  async caricaDocumentoPrivato({ blob, mime, categoria, cavallo_nome, data_documento, zona, nota, horse_id, cavallo_cliente_id, scuderia_cavallo_id, visita_id, autore_ruolo, sanitario_obbligatorio }){
    categoria = categoria || "documento";
    const data = String(data_documento || isoLocale(new Date())).slice(0, 10);
    nota = nota ? String(nota).trim().slice(0, 120) : null;
    let numero = 1;
    if(DEMO_MODE) numero = (demoState.documenti || []).filter(x => !x.eliminato_il && x.data_documento === data && x.categoria === categoria && (x.zona || "") === (zona || "")
      && ((horse_id && x.horse_id === horse_id) || (cavallo_cliente_id && x.cavallo_cliente_id === cavallo_cliente_id))).reduce((m, x) => Math.max(m, x.numero || 0), 0) + 1;
    else { const r = await sb.rpc("equo_doc_prossimo_numero", { p_horse: horse_id || null, p_cavcli: cavallo_cliente_id || null, p_data: data, p_categoria: categoria, p_zona: zona || null }); if(!r.error && r.data) numero = r.data; }
    const riga = { categoria, data_documento: data, zona: zona || null, nota, numero, titolo: this.titoloDocumento({ cavallo: cavallo_nome, data, categoria, zona, numero, nota }) || "Documento",
      horse_id: horse_id || null, cavallo_cliente_id: cavallo_cliente_id || null, scuderia_cavallo_id: scuderia_cavallo_id || null, visita_id: visita_id || null,
      autore_ruolo: autore_ruolo || null, sanitario_obbligatorio: !!sanitario_obbligatorio, mime: mime || blob?.type || null, byte: blob?.size || null };
    if(DEMO_MODE){
      const id = "doc-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      (demoState.documenti = demoState.documenti || []).push({ id, ...riga, autore_user_id: currentUser.id, url: URL.createObjectURL(blob), accessi: [], creato_il: new Date().toISOString() });
      return { id, error: null, titolo: riga.titolo, numero };
    }
    const est = this.nomeFileDocumento(riga, "").split(".").pop();
    const rnd = crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2);
    const path = `${currentUser.id}/${rnd}.${est}`;     // nel percorso nessun nome del telefono
    const up = await sb.storage.from("documenti").upload(path, blob, { contentType: riga.mime || "application/octet-stream" });
    if(up.error){ console.error("caricaDocumentoPrivato:", up.error); return { id: null, error: up.error }; }
    const { data: ins, error } = await sb.from("documenti").insert({ ...riga, path, autore_user_id: currentUser.id }).select("id").single();
    if(error){ console.error("caricaDocumentoPrivato:", error); await sb.storage.from("documenti").remove([path]); return { id: null, error }; }
    return { id: ins.id, error: null, titolo: riga.titolo, numero };
  },
  // archivio: documenti che vedo di un cavallo (o di una visita)
  async listaDocumenti({ horse_id, cavallo_cliente_id, visita_id } = {}){
    const campi = "id, categoria, titolo, data_documento, zona, nota, numero, mime, byte, visita_id, autore_user_id, autore_ruolo, horse_id, cavallo_cliente_id, sanitario_obbligatorio, creato_il";
    if(DEMO_MODE) return (demoState.documenti || []).filter(d => !d.eliminato_il && (visita_id ? d.visita_id === visita_id : ((horse_id && d.horse_id === horse_id) || (cavallo_cliente_id && d.cavallo_cliente_id === cavallo_cliente_id))))
      .sort((a, b) => String(b.data_documento).localeCompare(String(a.data_documento)) || String(b.creato_il).localeCompare(String(a.creato_il)));
    let q = sb.from("documenti").select(campi).is("eliminato_il", null);
    if(visita_id) q = q.eq("visita_id", visita_id);
    else { const f = [horse_id ? "horse_id.eq." + horse_id : "", cavallo_cliente_id ? "cavallo_cliente_id.eq." + cavallo_cliente_id : ""].filter(Boolean).join(","); if(!f) return []; q = q.or(f); }
    const { data, error } = await q.order("data_documento", { ascending: false }).order("creato_il", { ascending: false }).limit(200);
    if(error){ console.warn("listaDocumenti:", error.message); return []; }
    return data || [];
  },
  // cambia tipo, zona o nota (solo l'autore): il nome si rifà da solo
  async aggiornaDocumento(id, { categoria, zona, nota, cavallo_nome }){
    const att = DEMO_MODE ? (demoState.documenti || []).find(d => d.id === id) : (await sb.from("documenti").select("categoria, zona, nota, numero, data_documento").eq("id", id).maybeSingle()).data;
    if(!att) return { error: { message: "documento non trovato" } };
    const n = { categoria: categoria || att.categoria, zona: zona === undefined ? att.zona : (zona || null), nota: nota === undefined ? att.nota : (nota ? String(nota).trim().slice(0, 120) : null) };
    n.titolo = this.titoloDocumento({ cavallo: cavallo_nome, data: att.data_documento, categoria: n.categoria, zona: n.zona, numero: att.numero, nota: n.nota });
    if(DEMO_MODE){ Object.assign(att, n); return { error: null }; }
    const { error } = await sb.from("documenti").update(n).eq("id", id);
    return { error };
  },
  async eliminaDocumento(id){
    if(DEMO_MODE){ const d = (demoState.documenti || []).find(x => x.id === id); if(d) d.eliminato_il = new Date().toISOString(); return { error: null }; }
    const { error } = await sb.from("documenti").update({ eliminato_il: new Date().toISOString() }).eq("id", id);
    return { error };
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
