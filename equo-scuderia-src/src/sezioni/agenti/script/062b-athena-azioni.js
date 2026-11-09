/* ---------- ATHENA: AZIONI CON CONFERMA (9/11/2026) ----------
   Athena prepara le schede (netlify/agente/azioni-scuderia.js); qui si mostrano sotto la risposta e partono SOLO con «Conferma».
   Ogni azione usa i permessi di chi è collegato (RLS e funzioni del database): lezioni, incassi, eventi sanitari,
   messaggi ai clienti, nuovo cliente, richiesta di appuntamento al maniscalco;
   dal 9/11 sera anche box/paddock, nuovo cavallo, pacchetti, conferme, maniscalco dei cavalli, magazzino, avvisi allo staff. */
const ATH_ICONE = { sc_lezione: "fa-calendar-check", sc_incasso: "fa-euro-sign", sc_evento: "fa-syringe", sc_messaggio: "fa-comment-dots", sc_cliente: "fa-user-plus", sc_appuntamento: "fa-hammer",
  sc_box: "fa-warehouse", sc_cavallo: "fa-horse", sc_pacchetto: "fa-ticket", sc_conferma: "fa-circle-check", sc_incarico: "fa-user-gear", sc_magazzino: "fa-boxes-stacked", sc_comunicazione: "fa-bullhorn" };
let athAzioni = {};

function athenaMostraAzioni(azioni, bolla){
  const schede = (azioni || []).filter(a => ATH_ICONE[a.tipo]);
  if(!schede.length || !bolla) return;
  const box = document.createElement("div");
  box.className = "ath-schede";
  box.innerHTML = schede.map(a => {
    const id = "ath" + Math.random().toString(36).slice(2, 9);
    athAzioni[id] = a;
    return `<div class="ath-scheda" id="${id}">
      <div class="ath-scheda-testa"><i class="fa-solid ${ATH_ICONE[a.tipo]}"></i> <b>${escapeHtml(a.dati.titolo || "")}</b></div>
      <div class="ath-scheda-testo">${escapeHtml(a.dati.testo || "").replace(/\n/g, "<br>")}</div>
      <div class="ath-scheda-bottoni"><button class="btn btn-primary btn-sm" onclick="athenaConfermaAzione('${id}', this)"><i class="fa-solid fa-check"></i> Conferma</button>
        <button class="btn btn-ghost btn-sm" onclick="athenaScartaAzione('${id}')">Annulla</button></div></div>`;
  }).join("") + (schede.length > 1 ? `<button class="btn btn-outline btn-sm ath-tutte" onclick="athenaConfermaTutte(this)">Conferma tutte (${schede.length})</button>` : "");
  bolla.after(box);
  document.getElementById("athena-box").scrollTop = 1e9;
}
function athenaEsito(id, ok, testo){
  const el = document.getElementById(id); if(!el) return;
  el.classList.add(ok ? "fatta" : "errore");
  el.querySelector(".ath-scheda-bottoni").innerHTML = `<span class="ath-esito">${ok ? '<i class="fa-solid fa-circle-check"></i> ' : '<i class="fa-solid fa-triangle-exclamation"></i> '}${escapeHtml(testo)}</span>`
    + (ok ? "" : `<button class="btn btn-ghost btn-sm" onclick="athenaConfermaAzione('${id}', this)">Riprova</button>`);
}
function athenaScartaAzione(id){
  const el = document.getElementById(id); if(!el) return;
  delete athAzioni[id];
  el.classList.add("scartata");
  el.querySelector(".ath-scheda-bottoni").innerHTML = '<span class="ath-esito">Annullata: non ho fatto nulla.</span>';
}
async function athenaConfermaTutte(btn){
  btn.disabled = true;
  for(const id of [...btn.parentElement.querySelectorAll(".ath-scheda")].map(x => x.id)){
    if(athAzioni[id] && !document.getElementById(id).classList.contains("fatta")) await athenaConfermaAzione(id);
  }
  btn.remove();
}
async function athenaConfermaAzione(id, btn){
  const a = athAzioni[id]; if(!a) return;
  if(btn) btn.disabled = true;
  if(DEMO_MODE){ athenaEsito(id, true, "Fatto (demo: non salvato)."); return; }
  let esito;
  try{ esito = await athenaEsegui(a); }
  catch(e){ esito = { ok: false, testo: e?.message || "Non riuscito, riprova." }; }
  if(esito.ok) delete athAzioni[id];
  athenaEsito(id, esito.ok, esito.testo);
}
const athErr = (error, data) => ({ ok: false, testo: (data && (data.errore || data.error)) || error?.message || "Non riuscito, riprova." });

async function athenaEsegui(a){
  const d = a.dati, c = currentCentro.id;
  switch(a.tipo){
    case "sc_lezione": {
      const r = d.op === "nuova" ? await sb.from("scuderia_lezioni").insert({ centro_id: c, ...d.payload })
        : await sb.from("scuderia_lezioni").update(d.payload).eq("id", d.lezione_id).eq("centro_id", c);
      if(r.error) return athErr(r.error);
      if(typeof loadLezioni === "function"){ try{ await loadLezioni(); if(typeof renderLezioni === "function") renderLezioni(); }catch(e){} }
      return { ok: true, testo: { nuova: "Lezione aggiunta.", sposta: "Lezione spostata.", annulla: "Lezione annullata.", fatta: "Segnata come fatta." }[d.op] || "Fatto." };
    }
    case "sc_incasso": {
      const { data, error } = await sb.rpc("incassi_registra_pagamento", { p_centro: c, p_membro: d.membro_id, p_cassa: d.cassa, p_importo: d.importo,
        p_metodo: d.metodo, p_data: d.data, p_addebito: null, p_conto: null, p_note: d.note });
      if(error || (data && data.ok === false)) return athErr(error, data);
      return { ok: true, testo: "Incasso registrato." };
    }
    case "sc_evento": {
      const r = await sb.from("scuderia_eventi_sanitari").insert({ centro_id: c, cavallo_id: d.cavallo_id, tipo: d.tipo, tipo_altro: d.tipo_altro,
        data_evento: d.data_evento, data_scadenza: d.data_scadenza, note: d.note, creato_da: typeof currentMembroId === "function" ? currentMembroId() : null });
      if(r.error) return athErr(r.error);
      if(typeof loadEventiAll === "function"){ try{ await loadEventiAll(); }catch(e){} }
      return { ok: true, testo: "Registrato nella scheda del cavallo." };
    }
    case "sc_messaggio": {
      const r = await sb.from("chat_messaggi").insert({ centro_id: c, membro_id: d.membro_id, mittente_user_id: currentUser.id, tipo: "testo", testo: d.testo });
      if(r.error) return athErr(r.error);
      return { ok: true, testo: "Messaggio inviato." };
    }
    case "sc_cliente": {
      const { data, error } = await sb.rpc("salva_cliente", { p_centro: c, p_membro: null, p_ruolo: d.ruolo, p_nome: d.nome, p_telefono: d.telefono,
        p_email: d.email, p_data_nascita: d.data_nascita, p_referente: null, p_note: d.note, p_consenso: false });
      if(error){
        const m = error.message || "";
        if(m.includes("MINORE_SENZA_REFERENTE")) return { ok: false, testo: "È minorenne: crealo da Clienti scegliendo il genitore o referente." };
        if(m.includes("clienti, il massimo")) return { ok: false, testo: "Hai raggiunto i clienti del tuo pacchetto." };
        return athErr(error);
      }
      if(typeof loadTeam === "function"){ try{ await loadTeam(); if(typeof caricaClienti === "function") caricaClienti(); }catch(e){} }
      return { ok: true, testo: "Cliente creato. Ricorda di spuntare il consenso privacy nella sua scheda." };
    }
    case "sc_appuntamento": {
      const { data, error } = await sb.rpc("scuderia_proponi_appuntamento", { p_cliente_id: d.cliente_id, p_tipo: d.tipo, p_tipo_altro: d.tipo_altro,
        p_data: d.data, p_ora: d.ora, p_cavalli: d.cavalli && d.cavalli.length ? d.cavalli : null, p_note: d.note });
      if(error || (data && data.ok === false)) return athErr(error, data);
      return { ok: true, testo: "Richiesta inviata al maniscalco: la trovi in Professionisti." };
    }
    case "sc_box": {
      let r;
      const ricarica = async () => { if(typeof loadBox === "function"){ try{ await loadBox(); if(typeof renderBox === "function") renderBox(); }catch(e){} } };
      const statoBox = async (stato, da) => { await sb.from("scuderia_box").update({ stato_cavallo: stato }).eq("centro_id", c).eq("cavallo_id", d.cavallo_id).eq("stato_cavallo", da); };
      if(d.op === "metti_box"){
        const { data: b } = await sb.from("scuderia_box").select("cavallo_id, manutenzione").eq("id", d.box_id).single();
        if(b && b.cavallo_id && b.cavallo_id !== d.cavallo_id) return { ok: false, testo: "Nel frattempo il box è stato occupato." };
        if(b && b.manutenzione) return { ok: false, testo: "Il box è in manutenzione." };
        let stato = "in_box";
        if(d.da_box_id){
          const { data: da } = await sb.from("scuderia_box").select("stato_cavallo").eq("id", d.da_box_id).single();
          stato = da?.stato_cavallo || "in_box";
          r = await sb.from("scuderia_box").update({ cavallo_id: null }).eq("id", d.da_box_id).eq("centro_id", c); if(r.error) return athErr(r.error);
        }
        r = await sb.from("scuderia_box").update({ cavallo_id: d.cavallo_id, stato_cavallo: stato, manutenzione: false }).eq("id", d.box_id).eq("centro_id", c);
        if(r.error) return athErr(r.error);
        await ricarica(); return { ok: true, testo: "Cavallo nel box." };
      }
      if(d.op === "metti_paddock"){
        const { data: gia } = await sb.from("scuderia_paddock_cavalli").select("id").eq("cavallo_id", d.cavallo_id).maybeSingle();
        r = gia ? await sb.from("scuderia_paddock_cavalli").update({ paddock_id: d.paddock_id }).eq("id", gia.id)
                : await sb.from("scuderia_paddock_cavalli").insert({ centro_id: c, paddock_id: d.paddock_id, cavallo_id: d.cavallo_id });
        if(r.error) return athErr(r.error);
        await statoBox("paddock", "in_box");
        await ricarica(); return { ok: true, testo: "Cavallo nel paddock (il suo box, se ce l'ha, resta suo)." };
      }
      if(d.op === "togli_paddock"){
        r = await sb.from("scuderia_paddock_cavalli").delete().eq("cavallo_id", d.cavallo_id).eq("centro_id", c);
        if(r.error) return athErr(r.error);
        await statoBox("in_box", "paddock");
        await ricarica(); return { ok: true, testo: "Tolto dal paddock." };
      }
      if(d.op === "icona"){
        let q = sb.from("scuderia_box_attivita").select("id").eq("centro_id", c).eq("tipo", d.icona).eq("giorno", oggiRoma());
        q = d.cavallo_id ? q.eq("cavallo_id", d.cavallo_id) : q.is("cavallo_id", null).eq("paddock_id", d.paddock_id);
        const { data: gia } = await q.limit(1);
        if(gia && gia.length) return { ok: true, testo: "Era già segnato oggi." };
        r = await sb.from("scuderia_box_attivita").insert({ centro_id: c, box_id: d.box_id, paddock_id: d.paddock_id, cavallo_id: d.cavallo_id, tipo: d.icona });
        if(r.error) return athErr(r.error);
        await ricarica(); return { ok: true, testo: "Segnato." };
      }
      if(d.op === "manutenzione" || d.op === "fine_manutenzione"){
        const upd = d.op === "manutenzione" ? { manutenzione: true, manutenzione_motivo: d.motivo, manutenzione_fino: d.fino } : { manutenzione: false, manutenzione_fino: null, manutenzione_nota: null };
        r = await sb.from("scuderia_box").update(upd).eq("id", d.box_id).eq("centro_id", c);
        if(r.error) return athErr(r.error);
        await ricarica(); return { ok: true, testo: d.op === "manutenzione" ? "Box in manutenzione." : "Box di nuovo libero." };
      }
      break;
    }
    case "sc_cavallo": {
      const r = await sb.from("scuderia_cavalli").insert({ centro_id: c, ...d.payload }).select("id").single();
      if(r.error){
        const m = r.error.message || "";
        if(/limite|massimo|pacchetto/i.test(m)) return { ok: false, testo: "Hai raggiunto i cavalli del tuo pacchetto." };
        return athErr(r.error);
      }
      if(typeof loadCavalli === "function"){ try{ await loadCavalli(); if(typeof renderCavalliList === "function") renderCavalliList(); }catch(e){} }
      return { ok: true, testo: "Cavallo aggiunto." + (d.payload.proprietario ? " Se il proprietario era nuovo trovi la sua scheda in Clienti, da completare." : "") };
    }
    case "sc_pacchetto": {
      const r = await sb.from("scuderia_pacchetti").insert({ centro_id: c, ...d.payload });
      if(r.error) return athErr(r.error);
      if(typeof loadPacchetti === "function"){ try{ await loadPacchetti(); if(typeof renderPacchetti === "function") renderPacchetti(); }catch(e){} }
      return { ok: true, testo: "Pacchetto registrato." };
    }
    case "sc_conferma": {
      let data, error;
      if(d.op === "codice") ({ data, error } = await sb.rpc("equo_conferma_cavallo", { p_horse: null, p_scuderia_cavallo: d.id }));
      else if(d.op === "verifica") ({ data, error } = await sb.rpc("equo_cavallo_scelta", { p_horse: null, p_sc: d.id, p_azione: "conferma", p_campo: null, p_valore: null }));
      else ({ data, error } = await sb.rpc("scuderia_proposta_rispondi", { p_riga: d.id, p_azione: "conferma", p_scheda: d.scheda, p_categoria: null }));
      if(error || (data && data.ok === false)){
        if(data && data.motivo === "dati_incompleti") return { ok: false, testo: "Mancano nome, razza o data di nascita: completali nella scheda del cavallo." };
        return athErr(error, data);
      }
      for(const f of ["loadCavalli", "renderCavalliList", "caricaDaConfermareScud"]) if(typeof window[f] === "function"){ try{ await window[f](); }catch(e){} }
      return { ok: true, testo: { codice: "Dati confermati.", verifica: "Dati confermati.", proposta: "Cavallo collegato." }[d.op] };
    }
    case "sc_incarico": {
      const { data, error } = await sb.rpc("scuderia_incarico_azione", { p_centro: c, p_azione: d.azione, p_cavalli: d.cavalli, p_cliente: d.cliente,
        p_dal: d.dal, p_al: d.al, p_motivo: d.motivo, p_incarico: null });
      if(error || !data || data.ok === false) return athErr(error, data);
      if(typeof caricaIncarichi === "function"){ try{ await caricaIncarichi(); if(typeof renderIncarichi === "function") renderIncarichi(); }catch(e){} }
      return { ok: true, testo: typeof mncTestoEsito === "function" ? mncTestoEsito(data) : "Fatto." };
    }
    case "sc_magazzino": {
      const r = await sb.from("mag_movimenti").insert(d.righe.map(x => ({ centro_id: c, ...x })));
      if(r.error) return athErr(r.error);
      if(typeof loadMagazzino === "function"){ try{ await loadMagazzino(); }catch(e){} }
      return { ok: true, testo: "Movimento registrato." };
    }
    case "sc_comunicazione": {
      const r = await sb.from("scuderia_messaggi").insert({ centro_id: c, mittente_id: typeof currentMembroId === "function" ? currentMembroId() : null,
        destinatario_tipo: d.destinatario_tipo, destinatario_ruolo: d.destinatario_ruolo, destinatario_membro_id: d.destinatario_membro_id, testo: d.testo, priorita: d.priorita });
      if(r.error) return athErr(r.error);
      if(typeof refreshComunicazioniModule === "function"){ try{ await refreshComunicazioniModule(); }catch(e){} }
      return { ok: true, testo: "Avviso pubblicato." };
    }
  }
  return { ok: false, testo: "Azione non riconosciuta." };
}
