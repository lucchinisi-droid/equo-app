// Equo App · maniscalco e veterinario · ARCHIVIO (13/11/2026, SQL 69, mockup «Archivio e Disegno» 1-5 e 8)
// Menu › Archivio: tutto quello che il professionista ha caricato (foto, lastre, PDF, referti), anche dalla scheda del cavallo.
//  · cartelle personali («+ Cartella»: solo sue), «Rinomina» (il nome lo vedono tutti, sotto resta quello di Equo), ricerca e filtri;
//  · «Chi lo vede» per persona: Per sempre / 7 giorni / Nascosto, si cambia quando si vuole (decide l'autore, decisione 13/11);
//  · «Elimina» resta recuperabile 30 giorni («Eliminati» in fondo);
//  · apertura per chi riceve: avviso privacy con la spunta (registrata), foto dentro Equo con segni e filigrana (nome e data).
import { dsApri, dsCanvasConSegni, dsCaricaImmagine, dsDisegnaSegni, dsFiligrana, dsAdatta, dsNormalizza } from "./124-disegna.js";

const arcEsc = s => escapeHtml(s == null ? "" : String(s));
const arcToast = t => { if(typeof showToast === "function") showToast(t); };
const ARC = { dati: { cartelle: [], documenti: [] }, filtro: "tutti", q: "", cartella: null, ordine: "data", sel: null, mini: {}, eliminati: false, carica: null, chi: null, aperto: false };
const ARC_FILTRI = [["tutti", "Tutti"], ["foto", "Foto"], ["lastre", "Lastre"], ["pdf", "PDF e referti"], ["disegnati", "Disegnati"]];
const ARC_AVVISO = "Questo documento è protetto dalla normativa sulla privacy e dai diritti del professionista che lo ha inviato. Non puoi condividerlo, inoltrarlo o pubblicarlo senza la sua autorizzazione.";
const arcIo = () => currentUser?.id;
const arcVet = () => typeof eVeterinario === "function" && eVeterinario();
const arcData = d => d ? new Date(String(d).slice(0, 10) + "T12:00").toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }).replace(".", "") : "";
const arcDemoDocs = () => (demoState.documenti = demoState.documenti || []);

// ---------- dati ----------
const arcDB = {
  async lista(){
    if(DEMO_MODE){
      const cart = (demoState.docCartelle = demoState.docCartelle || []);
      const limite = Date.now() - 30 * 864e5;
      const docs = arcDemoDocs().filter(d => d.autore_user_id === arcIo() && (!d.eliminato_il || new Date(d.eliminato_il).getTime() > limite)).map(d => {
        const acc = (d.accessi || []).filter(a => !a.revocato_il && (!a.scade_il || new Date(a.scade_il) > new Date()));
        const cv = (typeof cavalliMieiLista !== "undefined" ? cavalliMieiLista : []).find(c => c.id === d.cavallo_cliente_id);
        const cli = cv && typeof clientiAttivi === "function" ? clientiAttivi().find(c => c.id === cv.cliente_mascalcia_id) : null;
        return { ...d, n_segni: d.segni?.items?.length || 0, cavallo_nome: cv?.nome || String(d.titolo || "").split(" · ")[0], cliente_nome: cli?.nome || "",
          sempre: acc.filter(a => !a.scade_il).length, a_tempo: acc.filter(a => a.scade_il).length, scade_il: acc.filter(a => a.scade_il).map(a => a.scade_il).sort()[0] || null, avviso_privacy: d.avviso_privacy !== false };
      }).sort((a, b) => String(b.creato_il).localeCompare(String(a.creato_il)));
      return { cartelle: cart.map(c => ({ ...c, n: docs.filter(d => d.cartella_id === c.id && !d.eliminato_il).length })), documenti: docs };
    }
    const { data, error } = await sb.rpc("equo_archivio_lista");
    if(error){ console.warn("archivio:", error.message); return { errore: error.message }; }
    return data || { cartelle: [], documenti: [] };
  },
  async aggiorna(id, campi){
    if(DEMO_MODE){ const d = arcDemoDocs().find(x => x.id === id); if(d) Object.assign(d, campi); return { error: d ? null : { message: "non trovato" } }; }
    const { error } = await sb.from("documenti").update(campi).eq("id", id);
    return { error };
  },
  async creaCartella(nome){
    if(DEMO_MODE){ const c = { id: "cart-" + Date.now().toString(36), nome, autore_user_id: arcIo() }; (demoState.docCartelle = demoState.docCartelle || []).push(c); return { id: c.id }; }
    const { data, error } = await sb.from("documenti_cartelle").insert({ nome }).select("id").single();
    return error ? { error } : { id: data.id };
  },
  async rinominaCartella(id, nome){
    if(DEMO_MODE){ const c = (demoState.docCartelle || []).find(x => x.id === id); if(c) c.nome = nome; return { error: null }; }
    const { error } = await sb.from("documenti_cartelle").update({ nome }).eq("id", id); return { error };
  },
  async eliminaCartella(id){
    if(DEMO_MODE){ demoState.docCartelle = (demoState.docCartelle || []).filter(x => x.id !== id); arcDemoDocs().forEach(d => { if(d.cartella_id === id) d.cartella_id = null; }); return { error: null }; }
    const { error } = await sb.from("documenti_cartelle").delete().eq("id", id); return { error };
  },
  async persone(id){
    if(DEMO_MODE){
      const d = arcDemoDocs().find(x => x.id === id); if(!d) return null;
      const cv = (typeof cavalliMieiLista !== "undefined" ? cavalliMieiLista : []).find(c => c.id === d.cavallo_cliente_id);
      const cli = cv && typeof clientiAttivi === "function" ? clientiAttivi().find(c => c.id === cv.cliente_mascalcia_id) : null;
      const acc = (d.accessi || []).filter(a => !a.revocato_il && (!a.scade_il || new Date(a.scade_il) > new Date()));
      const modo = (u, c) => { const a = acc.find(x => (u && x.user_id === u) || (c && x.centro_id === c)); return a ? { modo: a.scade_il ? "7g" : "sempre", scade_il: a.scade_il || null } : { modo: "nascosto", scade_il: null }; };
      const p = [];
      if(cli?.cliente_user_id) p.push({ tipo: "proprietario", user_id: cli.cliente_user_id, nome: cli.nome, ruolo: "Proprietario", ...modo(cli.cliente_user_id) });
      if(cli?.centro_id) p.push({ tipo: "struttura", centro_id: cli.centro_id, nome: cli.nome, ruolo: "Struttura", bloccato: !!d.sanitario_obbligatorio, ...modo(null, cli.centro_id) });
      if(!cli) p.push({ tipo: "proprietario", user_id: "demo-prop", nome: "Proprietario", ruolo: "Proprietario", ...modo("demo-prop") });
      acc.filter(a => !p.some(x => (a.user_id && x.user_id === a.user_id) || (a.centro_id && x.centro_id === a.centro_id)))
        .forEach(a => p.push({ tipo: "altro", user_id: a.user_id || null, centro_id: a.centro_id || null, nome: a.nome || "Collega", ruolo: a.motivo === "consulto" ? "Consulto" : "Ricevuto", ...modo(a.user_id, a.centro_id) }));
      return { persone: p, sanitario: !!d.sanitario_obbligatorio, avviso_privacy: d.avviso_privacy !== false, decide: "autore" };
    }
    const { data, error } = await sb.rpc("equo_doc_persone", { p_doc: id });
    return error ? { errore: error.message } : data;
  },
  async imposta(id, chi, modo, motivo = "condivisione"){
    if(DEMO_MODE){
      const d = arcDemoDocs().find(x => x.id === id); if(!d) return { ok: false };
      d.accessi = (d.accessi || []).filter(a => !((chi.user_id && a.user_id === chi.user_id) || (chi.centro_id && a.centro_id === chi.centro_id)));
      if(modo !== "nascosto") d.accessi.push({ id: "acc-" + Math.random().toString(36).slice(2, 8), user_id: chi.user_id || null, centro_id: chi.centro_id || null, nome: chi.nome, motivo,
        scade_il: modo === "7g" ? new Date(Date.now() + 7 * 864e5).toISOString() : null });
      return { ok: true };
    }
    const { data, error } = await sb.rpc("equo_doc_imposta", { p_doc: id, p_user: chi.user_id || null, p_centro: chi.centro_id || null, p_modo: modo, p_motivo: motivo });
    return error ? { ok: false, errore: error.message } : data;
  },
  async ripristina(id){
    if(DEMO_MODE){ const d = arcDemoDocs().find(x => x.id === id); if(d) d.eliminato_il = null; return { ok: !!d }; }
    const { data, error } = await sb.rpc("equo_doc_ripristina", { p_doc: id });
    return error ? { ok: false, errore: error.message } : data;
  },
  async apri(id){
    if(DEMO_MODE){
      const d = arcDemoDocs().find(x => x.id === id && !x.eliminato_il); if(!d) return { ok: false, errore: "accesso" };
      const mio = d.autore_user_id === arcIo();
      return { ok: true, ...d, mio, autore_nome: mio ? (currentUser?.nome || "Tu") : "Il professionista", io: currentUser?.nome || "Demo",
        avviso: d.avviso_privacy !== false && !mio && !(d.avvisiAccettati || []).includes(arcIo()) };
    }
    const { data, error } = await sb.rpc("equo_doc_apri", { p_doc: id });
    if(error){
      // database senza l'SQL 69: come prima
      if(/equo_doc_apri|schema cache|does not exist/i.test(error.message || "")){
        const r = await sb.from("documenti").select("id, path, mime, titolo, autore_user_id, horse_id, cavallo_cliente_id, data_documento").eq("id", id).maybeSingle();
        return r.data ? { ok: true, ...r.data, bucket: "documenti", mio: r.data.autore_user_id === arcIo(), avviso: false } : { ok: false, errore: "accesso" };
      }
      return { ok: false, errore: "rete" };
    }
    return data || { ok: false, errore: "accesso" };
  },
  async accettaAvviso(id){
    if(DEMO_MODE){ const d = arcDemoDocs().find(x => x.id === id); if(d) (d.avvisiAccettati = d.avvisiAccettati || []).push(arcIo()); return { ok: true }; }
    const { data, error } = await sb.rpc("equo_doc_accetta_avviso", { p_doc: id });
    return error ? { ok: false } : data;
  },
  async urlDi(info, secondi = 600){
    if(DEMO_MODE) return info.url || arcDemoDocs().find(x => x.id === info.id)?.url || null;
    const s = await sb.storage.from(info.bucket || "documenti").createSignedUrl(info.path, secondi);
    return s.error ? null : s.data.signedUrl;
  },
  // anteprime: un link per tutte le foto (per spazio)
  async anteprime(docs){
    const foto = docs.filter(d => /^image\//.test(d.mime || "") && !ARC.mini[d.id]).slice(0, 40);
    if(!foto.length) return;
    if(DEMO_MODE){ foto.forEach(d => { ARC.mini[d.id] = d.url; }); return; }
    for(const b of ["documenti", "cavalli-allegati"]){
      const l = foto.filter(d => (d.bucket || "documenti") === b); if(!l.length) continue;
      const { data } = await sb.storage.from(b).createSignedUrls(l.map(d => d.path), 3600);
      (data || []).forEach((x, i) => { if(x.signedUrl) ARC.mini[l[i].id] = x.signedUrl; });
    }
  },
  async fotoStessoCavallo(id){
    const d = ARC.dati.documenti.find(x => x.id === id) || (await this.apri(id));
    if(!d) return [];
    let lista = [];
    if(typeof DB.listaDocumenti === "function") lista = await DB.listaDocumenti({ horse_id: d.horse_id || null, cavallo_cliente_id: d.cavallo_cliente_id || null });
    ARC.dati.documenti.filter(x => !x.eliminato_il && ((d.horse_id && x.horse_id === d.horse_id) || (d.cavallo_cliente_id && x.cavallo_cliente_id === d.cavallo_cliente_id)))
      .forEach(x => { if(!lista.some(y => y.id === x.id)) lista.push(x); });
    lista = lista.filter(x => x.id !== id && /^image\//.test(x.mime || ""));
    await this.anteprime(lista.map(x => ({ ...x, path: x.path || ARC.dati.documenti.find(y => y.id === x.id)?.path, bucket: x.bucket || ARC.dati.documenti.find(y => y.id === x.id)?.bucket })).filter(x => x.path || DEMO_MODE));
    return lista.map(x => ({ ...x, mini: ARC.mini[x.id] || null }));
  },
  async colleghi(){
    if(DEMO_MODE) return [{ altro_id: "demo-collega", nome: "Laura F.", ruolo: arcVet() ? "maniscalco" : "veterinario" }];
    const { data, error } = await sb.rpc("lista_colleghi");
    return error ? [] : (data || []);
  }
};

// ---------- pagina ----------
function arcPagina(){
  let ov = document.getElementById("arc-pagina");
  if(!ov){ ov = document.createElement("div"); ov.id = "arc-pagina"; ov.className = "arc-pagina"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "Archivio"); document.body.appendChild(ov); }
  return ov;
}
async function apriArchivio(){
  if(typeof closeModal === "function" && document.getElementById("modal-menu")?.classList.contains("active")) closeModal("modal-menu");
  ARC.aperto = true; ARC.cartella = null; ARC.sel = null;
  const ov = arcPagina(); ov.classList.add("aperto");
  ov.innerHTML = '<div class="arc-carico">Carico l\'Archivio…</div>';
  await arcRicarica();
}
async function arcRicarica(){
  if(!ARC.aperto){
    // fuori dall'Archivio (scheda del cavallo): aggiorna gli allegati aperti
    if(typeof ricaricaAllegatiAperti === "function") ricaricaAllegatiAperti();
    const l = await arcDB.lista(); if(!l?.errore) ARC.dati = { cartelle: l.cartelle || [], documenti: l.documenti || [] };
    return;
  }
  const d = await arcDB.lista();
  if(d?.errore){
    arcPagina().innerHTML = `${arcTesta()}<div class="arc-vuoto">${/equo_archivio_lista|schema cache|does not exist/i.test(d.errore) ? "L'Archivio non è ancora attivo: manca un aggiornamento del database (SQL 69)." : "Archivio non disponibile ora. Riprova più tardi."}</div>`;
    return;
  }
  ARC.dati = { cartelle: d.cartelle || [], documenti: d.documenti || [] };
  arcRender();
  await arcDB.anteprime(ARC.dati.documenti.filter(x => !x.eliminato_il));
  if(ARC.aperto) arcRender();
}
function arcChiudi(){ ARC.aperto = false; const ov = document.getElementById("arc-pagina"); if(ov){ ov.classList.remove("aperto"); ov.innerHTML = ""; } }
function arcTesta(){
  const c = ARC.cartella && ARC.dati.cartelle.find(x => x.id === ARC.cartella);
  return `<div class="arc-testa">
    <button class="arc-ico" aria-label="${c ? "Torna all'Archivio" : "Chiudi"}" onclick="${c ? "arcApriCartella(null)" : "arcChiudi()"}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button>
    <div class="arc-testa-t"><div class="arc-sotto">${c ? "Archivio › Cartella" : "Menu › Archivio"}</div><div class="arc-tit">${arcEsc(c ? c.nome : "Archivio")}</div></div>
    ${c ? `<button class="arc-ico" aria-label="Opzioni della cartella" onclick="arcOpzioniCartella('${c.id}')">⋯</button>` : ""}
    <button class="arc-carica" onclick="arcCarica()"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Carica</button>
  </div>`;
}
function arcVisibile(d){
  const fino = d.scade_il ? new Date(d.scade_il).toLocaleDateString("it-IT", { day: "numeric", month: "short" }).replace(".", "") : "";
  if(!d.sempre && !d.a_tempo) return { t: d.sanitario ? "Nascosto · la scuderia lo vede (sanitario)" : "Nascosto · solo tu", k: "nasc" };
  if(!d.sempre) return { t: `7 giorni · fino al ${fino}` + (d.a_tempo > 1 ? ` · ${d.a_tempo} persone` : ""), k: "tempo" };
  return { t: `Per sempre · ${d.sempre} ${d.sempre === 1 ? "persona" : "persone"}` + (d.a_tempo ? ` · ${d.a_tempo} a 7 giorni` : ""), k: "sempre" };
}
function arcFiltrati(){
  const q = ARC.q.trim().toLowerCase();
  let l = ARC.dati.documenti.filter(d => !d.eliminato_il);
  if(ARC.cartella) l = l.filter(d => d.cartella_id === ARC.cartella);
  l = l.filter(d => ({ tutti: true, foto: /^image\//.test(d.mime || "") && d.categoria !== "lastra", lastre: d.categoria === "lastra", pdf: /pdf/.test(d.mime || "") || d.categoria === "referto", disegnati: d.n_segni > 0 })[ARC.filtro]);
  if(q) l = l.filter(d => [d.nome, d.titolo, d.cavallo_nome, d.cliente_nome, d.nota].some(x => String(x || "").toLowerCase().includes(q)));
  const nome = d => String(d.nome || d.titolo || "");
  if(ARC.ordine === "nome") l.sort((a, b) => nome(a).localeCompare(nome(b), "it", { sensitivity: "base" }));
  else if(ARC.ordine === "cavallo") l.sort((a, b) => String(a.cavallo_nome || "").localeCompare(String(b.cavallo_nome || ""), "it", { sensitivity: "base" }) || String(b.creato_il).localeCompare(String(a.creato_il)));
  return l;
}
function arcRiga(d){
  const v = arcVisibile(d), mini = ARC.mini[d.id], selez = ARC.sel instanceof Set;
  const sotto = d.nome ? d.titolo : [d.cliente_nome, d.cartella_id && !ARC.cartella ? "Cartella «" + (ARC.dati.cartelle.find(c => c.id === d.cartella_id)?.nome || "") + "»" : ""].filter(Boolean).join(" · ") || arcData(d.data_documento);
  const tipo = /pdf/.test(d.mime || "") ? "PDF" : /^video\//.test(d.mime || "") ? "VIDEO" : /^image\//.test(d.mime || "") ? "" : "FILE";
  return `<div class="arc-riga${selez && ARC.sel.has(d.id) ? " sel" : ""}">
    ${selez ? `<input type="checkbox" class="arc-spunta" aria-label="Seleziona ${arcEsc(d.nome || d.titolo)}" ${ARC.sel.has(d.id) ? "checked" : ""} onchange="arcSpunta('${d.id}')">` : ""}
    <button class="arc-thumb${d.categoria === "lastra" ? " lastra" : ""}" onclick="docVisualizza('${d.id}')" aria-label="Apri ${arcEsc(d.nome || d.titolo)}">
      ${mini ? `<img src="${arcEsc(urlSicuro(mini))}" alt="" loading="lazy">` : `<span>${tipo}</span>`}
      ${d.n_segni ? '<i class="arc-matita" aria-label="Disegnata"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l4-1 11-11-3-3L5 16z"/></svg></i>' : ""}
    </button>
    <button class="arc-righe" onclick="${selez ? `arcSpunta('${d.id}')` : `arcAzioni('${d.id}')`}">
      <b>${arcEsc(d.nome || d.titolo)}</b><small>${arcEsc(sotto)}</small>
      <span class="arc-vis ${v.k}"><i></i>${arcEsc(v.t)}</span>
    </button>
    ${selez ? "" : `<button class="arc-piu" aria-label="Azioni" onclick="arcAzioni('${d.id}')">⋯</button>`}
  </div>`;
}
function arcRender(){
  const ov = arcPagina(); if(!ARC.aperto) return;
  const l = arcFiltrati(), tot = ARC.dati.documenti.filter(d => !d.eliminato_il).length, elim = ARC.dati.documenti.filter(d => d.eliminato_il);
  const selez = ARC.sel instanceof Set;
  ov.innerHTML = `${arcTesta()}
    ${ARC.cartella ? "" : `<div class="arc-conta">${tot} ${tot === 1 ? "contenuto" : "contenuti"} · ${ARC.dati.cartelle.length} ${ARC.dati.cartelle.length === 1 ? "cartella" : "cartelle"} · solo tuoi</div>`}
    <label class="arc-cerca"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
      <input type="search" id="arc-q" placeholder="Cerca per cavallo, cliente o nome" value="${arcEsc(ARC.q)}" oninput="arcCerca(this.value)" aria-label="Cerca nell'Archivio"></label>
    <div class="arc-chips">${ARC_FILTRI.map(([k, t]) => `<button class="arc-chip${ARC.filtro === k ? " on" : ""}" aria-pressed="${ARC.filtro === k}" onclick="arcFiltro('${k}')">${t}</button>`).join("")}</div>
    ${ARC.cartella ? "" : `<div class="arc-sez"><span>Cartelle</span><button class="arc-nuova" onclick="arcNuovaCartella()">+ Cartella</button></div>
    <div class="arc-cartelle">${ARC.dati.cartelle.length ? ARC.dati.cartelle.map(c => `<button class="arc-cartella" onclick="arcApriCartella('${c.id}')">
      <svg viewBox="0 0 26 22" aria-hidden="true"><path d="M2 4a2 2 0 0 1 2-2h6l2 3h10a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/></svg>
      <b>${arcEsc(c.nome)}</b><small>${c.n} ${c.n === 1 ? "contenuto" : "contenuti"}</small></button>`).join("") : '<div class="arc-nota">Nessuna cartella. Le cartelle sono solo tue: chi riceve un file non le vede.</div>'}</div>`}
    <div class="arc-sez"><span>Contenuti</span><span class="arc-sez-dx">
      <button class="arc-link" onclick="arcSelezione()">${selez ? "Fine" : "Seleziona"}</button>
      <button class="arc-link" onclick="arcOrdine()">Ordina: <b>${{ data: "Data", nome: "Nome", cavallo: "Cavallo" }[ARC.ordine]} ▾</b></button></span></div>
    <div class="arc-lista">${l.length ? l.map(arcRiga).join("") : `<div class="arc-vuoto">${tot ? "Nessun contenuto con questi filtri." : "Qui trovi le foto, le lastre e i documenti che carichi: dalla scheda del cavallo, da «Segna un problema», dalle visite o con «Carica»."}</div>`}</div>
    ${!ARC.cartella && elim.length ? `<div class="arc-elim"><button class="arc-link" onclick="ARC.eliminati = !ARC.eliminati; arcRender()">Eliminati negli ultimi 30 giorni (${elim.length}) ${ARC.eliminati ? "▴" : "▾"}</button>
      ${ARC.eliminati ? elim.map(d => `<div class="arc-riga elim"><span class="arc-righe"><b>${arcEsc(d.nome || d.titolo)}</b><small>Eliminato il ${arcData(d.eliminato_il)} · si recupera fino al ${arcData(new Date(new Date(d.eliminato_il).getTime() + 30 * 864e5).toISOString())}</small></span>
        <button class="arc-btn" onclick="arcRipristina('${d.id}')">Ripristina</button></div>`).join("") : ""}</div>` : ""}
    ${selez ? `<div class="arc-selbar"><span>${ARC.sel.size} ${ARC.sel.size === 1 ? "selezionato" : "selezionati"}</span><button class="arc-btn pri" ${ARC.sel.size ? "" : "disabled"} onclick="arcSposta(null)">Sposta in cartella</button></div>` : ""}`;
}
function arcCerca(v){ ARC.q = v; const pos = document.getElementById("arc-q")?.selectionStart; arcRender(); const i = document.getElementById("arc-q"); if(i){ i.focus(); try{ i.setSelectionRange(pos, pos); }catch(_){} } }
function arcFiltro(k){ ARC.filtro = k; arcRender(); }
function arcOrdine(){ ARC.ordine = { data: "nome", nome: "cavallo", cavallo: "data" }[ARC.ordine]; arcRender(); }
function arcApriCartella(id){ ARC.cartella = id; ARC.sel = null; arcRender(); }
function arcSelezione(){ ARC.sel = ARC.sel instanceof Set ? null : new Set(); arcRender(); }
function arcSpunta(id){ if(!(ARC.sel instanceof Set)) return; ARC.sel.has(id) ? ARC.sel.delete(id) : ARC.sel.add(id); arcRender(); }

// ---------- fogli dal basso ----------
function arcFoglio(id, html){
  let ov = document.getElementById(id);
  if(!ov){
    ov = document.createElement("div"); ov.className = "modal-overlay arc-ov"; ov.id = id;
    ov.onclick = ev => { if(ev.target === ov) closeModal(id); };
    ov.innerHTML = `<div class="modal arc-modal" role="dialog" aria-modal="true" aria-labelledby="${id}-tit"><div class="modal-handle"></div><div id="${id}-corpo"></div></div>`;
    document.body.appendChild(ov);
  }
  document.getElementById(id + "-corpo").innerHTML = html;
  openModal(id);
  return ov;
}
const arcDoc = id => ARC.dati.documenti.find(d => d.id === id);
async function arcAzioni(id){
  if(!arcDoc(id)){ const l = await arcDB.lista(); if(!l?.errore) ARC.dati = { cartelle: l.cartelle || [], documenti: l.documenti || [] }; await arcDB.anteprime(ARC.dati.documenti.filter(x => x.id === id)); }
  const d = arcDoc(id); if(!d) return arcToast("Puoi gestire solo i contenuti che hai caricato tu.");
  const img = /^image\//.test(d.mime || ""), cart = ARC.dati.cartelle.find(c => c.id === d.cartella_id), v = arcVisibile(d);
  const mb = d.byte ? (d.byte > 1048576 ? (d.byte / 1048576).toFixed(1).replace(".", ",") + " MB" : Math.max(1, Math.round(d.byte / 1024)) + " KB") : "";
  const az = [
    img ? ["arcDisegna", "Disegna e misura", "Penna, frecce, testo, misure, angoli, prima/dopo", "M4 20l4-1 11-11-3-3L5 16z M14 6l3 3", "evid"] : null,
    ["arcRinomina", "Rinomina", "Il nome nuovo lo vedono tutti; sotto resta quello di Equo", "M4 7h16M4 12h10M4 17h7 M17 14l3 3-3 3"],
    ["arcSposta", "Sposta in cartella", cart ? "Ora in «" + cart.nome + "»" : "Ora in nessuna cartella", "M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"],
    ["arcChiLoVede", "Chi lo vede", v.t, "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"],
    ["arcMandaChat", "Manda in chat", "A chi lo mandi riceve l'accesso, con l'avviso privacy", "M4 12l16-8-6 16-2-6z"],
    ["arcScarica", "Scarica", img && d.n_segni ? "Con i segni o solo l'originale" : "Il file originale", "M12 4v11 M7 10l5 5 5-5 M5 20h14"],
    ["arcElimina", "Elimina", "Si può recuperare per 30 giorni", "M5 7h14 M9 7V5h6v2 M7 7l1 13h8l1-13", "rosso"]
  ].filter(Boolean);
  arcFoglio("modal-arc-azioni", `<div class="arc-az-testa"><span class="arc-thumb grande${d.categoria === "lastra" ? " lastra" : ""}">${ARC.mini[d.id] ? `<img src="${arcEsc(urlSicuro(ARC.mini[d.id]))}" alt="">` : ""}</span>
      <div><div class="modal-title" id="modal-arc-azioni-tit">${arcEsc(d.nome || d.titolo)}</div><small>${arcEsc(d.nome ? d.titolo : arcData(d.data_documento))}</small>
      <small>${[cart ? "Cartella: " + cart.nome : "", mb, d.n_segni ? d.n_segni + (d.n_segni === 1 ? " segno" : " segni") : ""].filter(Boolean).map(arcEsc).join(" · ")}</small></div></div>
    ${az.map(([f, t, s, ic, k]) => `<button class="arc-az${k ? " " + k : ""}" onclick="closeModal('modal-arc-azioni'); ${f}('${id}')">
      <span class="arc-az-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ic}"/></svg></span><span class="arc-az-t"><b>${t}</b><small>${arcEsc(s)}</small></span><span aria-hidden="true">›</span></button>`).join("")}`);
}
function arcDisegna(id){ dsApri(id); }
function arcRinomina(id){
  const d = arcDoc(id); if(!d) return;
  arcFoglio("modal-arc-nome", `<div class="modal-title" id="modal-arc-nome-tit">Rinomina</div>
    <label class="arc-campo">Nome<input id="arc-nome-in" maxlength="80" value="${arcEsc(d.nome || "")}" placeholder="${arcEsc(d.titolo)}"></label>
    <div class="arc-info">Lo vedono tutti quelli che possono aprirlo. Sotto, più piccolo, resta il nome di Equo:<br><b>${arcEsc(d.titolo)}</b>${d.nome ? "<br>Lascia vuoto per tornare al nome di Equo." : ""}</div>
    <div class="arc-bott"><button class="arc-btn" onclick="closeModal('modal-arc-nome')">Annulla</button><button class="arc-btn pri" onclick="arcSalvaNome('${id}')">Salva</button></div>`);
  setTimeout(() => document.getElementById("arc-nome-in")?.focus(), 80);
}
async function arcSalvaNome(id){
  const v = (document.getElementById("arc-nome-in")?.value || "").trim().slice(0, 80);
  const { error } = await arcDB.aggiorna(id, { nome: v || null });
  if(error) return arcToast("Nome non salvato: " + (error.message || "riprova"));
  closeModal("modal-arc-nome"); arcToast("Nome salvato"); arcRicarica();
}
// sposta uno (id) o i selezionati (null)
function arcSposta(id){
  const ids = id ? [id] : [...(ARC.sel || [])]; if(!ids.length) return;
  const att = id ? arcDoc(id)?.cartella_id || null : undefined;
  ARC.spostaIds = ids;
  arcFoglio("modal-arc-sposta", `<div class="modal-title" id="modal-arc-sposta-tit">Sposta in cartella${ids.length > 1 ? " · " + ids.length + " contenuti" : ""}</div>
    ${ARC.dati.cartelle.map(c => `<button class="arc-opz${att === c.id ? " on" : ""}" onclick="arcSpostaIn('${c.id}')"><svg viewBox="0 0 26 22" aria-hidden="true"><path d="M2 4a2 2 0 0 1 2-2h6l2 3h10a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/></svg>${arcEsc(c.nome)}</button>`).join("")}
    <button class="arc-opz${att === null ? " on" : ""}" onclick="arcSpostaIn(null)">Nessuna cartella</button>
    <button class="arc-nuova larga" onclick="closeModal('modal-arc-sposta'); arcNuovaCartella(true)">+ Nuova cartella</button>`);
}
async function arcSpostaIn(cartella){
  const ids = ARC.spostaIds || [];
  for(const i of ids){ const { error } = await arcDB.aggiorna(i, { cartella_id: cartella }); if(error) return arcToast("Non spostato: " + (error.message || "riprova")); }
  closeModal("modal-arc-sposta"); ARC.sel = null; arcToast(ids.length > 1 ? ids.length + " contenuti spostati" : "Spostato"); arcRicarica();
}
function arcNuovaCartella(conSposta){
  const n = conSposta ? (ARC.spostaIds || []).length : (ARC.sel instanceof Set ? ARC.sel.size : 0);
  if(!conSposta && n) ARC.spostaIds = [...ARC.sel];
  arcFoglio("modal-arc-cartella", `<div class="modal-title" id="modal-arc-cartella-tit">Nuova cartella</div>
    <label class="arc-campo">Nome della cartella<input id="arc-cart-in" maxlength="60" placeholder="es. Da ricontrollare"></label>
    ${n ? `<label class="arc-check"><input type="checkbox" id="arc-cart-sposta" checked> Sposta qui ${n === 1 ? "il contenuto scelto" : "i " + n + " contenuti selezionati"}</label>` : ""}
    <div class="arc-nota">Le cartelle sono solo tue: servono a tenere in ordine. Chi riceve un contenuto non le vede.</div>
    <div class="arc-bott"><button class="arc-btn" onclick="closeModal('modal-arc-cartella')">Annulla</button><button class="arc-btn pri" onclick="arcCreaCartella()">Crea</button></div>`);
  setTimeout(() => document.getElementById("arc-cart-in")?.focus(), 80);
}
async function arcCreaCartella(){
  const nome = (document.getElementById("arc-cart-in")?.value || "").trim().slice(0, 60);
  if(!nome) return arcToast("Scrivi il nome della cartella");
  const r = await arcDB.creaCartella(nome);
  if(r.error) return arcToast(/documenti_cartelle|schema cache|does not exist/i.test(r.error.message || "") ? "Manca un aggiornamento del database (SQL 69)." : "Cartella non creata: " + r.error.message);
  closeModal("modal-arc-cartella");
  if(document.getElementById("arc-cart-sposta")?.checked && (ARC.spostaIds || []).length){ await arcSpostaIn(r.id); return; }
  arcToast("Cartella creata"); arcRicarica();
}
function arcOpzioniCartella(id){
  const c = ARC.dati.cartelle.find(x => x.id === id); if(!c) return;
  arcFoglio("modal-arc-opzc", `<div class="modal-title" id="modal-arc-opzc-tit">${arcEsc(c.nome)}</div>
    <label class="arc-campo">Rinomina la cartella<input id="arc-opzc-in" maxlength="60" value="${arcEsc(c.nome)}"></label>
    <div class="arc-bott"><button class="arc-btn rosso" onclick="arcEliminaCartella('${id}')">Elimina cartella</button><button class="arc-btn pri" onclick="arcSalvaCartella('${id}')">Salva</button></div>
    <div class="arc-nota">Eliminando la cartella i contenuti non si cancellano: tornano nell'Archivio.</div>`);
}
async function arcSalvaCartella(id){
  const nome = (document.getElementById("arc-opzc-in")?.value || "").trim().slice(0, 60); if(!nome) return;
  const { error } = await arcDB.rinominaCartella(id, nome); if(error) return arcToast("Non salvato, riprova.");
  closeModal("modal-arc-opzc"); arcRicarica();
}
async function arcEliminaCartella(id){
  const { error } = await arcDB.eliminaCartella(id); if(error) return arcToast("Non eliminata, riprova.");
  closeModal("modal-arc-opzc"); ARC.cartella = null; arcToast("Cartella eliminata: i contenuti sono nell'Archivio"); arcRicarica();
}

// ---------- chi lo vede ----------
async function arcChiLoVede(id){
  const d = arcDoc(id) || { id };
  arcFoglio("modal-arc-chi", '<div class="modal-title" id="modal-arc-chi-tit">Chi lo vede</div><div class="arc-nota">Carico…</div>');
  const r = await arcDB.persone(id);
  if(!r || r.errore){ document.getElementById("modal-arc-chi-corpo").innerHTML = `<div class="modal-title" id="modal-arc-chi-tit">Chi lo vede</div><div class="arc-nota">${r?.errore && /equo_doc_persone|schema cache/i.test(r.errore) ? "Manca un aggiornamento del database (SQL 69)." : "Puoi decidere chi lo vede solo per i contenuti che hai caricato tu."}</div>`; return; }
  ARC.chi = { id, persone: (r.persone || []).map(p => ({ ...p, nuovo: p.modo })), avviso: r.avviso_privacy !== false, avvisoNuovo: r.avviso_privacy !== false, sanitario: r.sanitario, titolo: d.nome || d.titolo };
  arcChiRender();
}
function arcChiRender(){
  const c = ARC.chi; if(!c) return;
  const fino = new Date(Date.now() + 7 * 864e5).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }).replace(".", "");
  const ini = n => String(n || "?").split(/\s+/).map(x => x[0]).join("").slice(0, 2).toUpperCase();
  document.getElementById("modal-arc-chi-corpo").innerHTML = `<div class="modal-title" id="modal-arc-chi-tit">Chi lo vede</div>
    ${c.titolo ? `<div class="arc-nota">${arcEsc(c.titolo)}</div>` : ""}
    <div class="arc-autore"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg><span><b>Tu</b> (autore) lo vedi sempre</span></div>
    ${c.persone.length ? c.persone.map((p, i) => `<div class="arc-persona">
      <div class="arc-p-testa"><span class="arc-ini">${arcEsc(ini(p.nome))}</span><span><b>${arcEsc(p.nome)}</b><small>${arcEsc(p.ruolo)}${p.tipo === "collega" ? " · segue il cavallo" : ""}</small></span></div>
      <div class="arc-seg" role="group" aria-label="Chi lo vede: ${arcEsc(p.nome)}">${[["sempre", "Per sempre"], ["7g", "7 giorni"], ["nascosto", "Nascosto"]].map(([k, t]) =>
        `<button class="${p.nuovo === k ? "on" : ""}" aria-pressed="${p.nuovo === k}" onclick="arcChiScegli(${i}, '${k}')">${t}</button>`).join("")}</div>
      ${p.bloccato ? '<div class="arc-nota">Documento sanitario obbligatorio: la scuderia lo vede comunque.</div>'
        : p.nuovo === "7g" ? `<div class="arc-nota">Fino al ${p.nuovo === p.modo && p.scade_il ? new Date(p.scade_il).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }).replace(".", "") : fino}, poi si chiude da solo</div>` : ""}
    </div>`).join("") : '<div class="arc-nota">Il cavallo non ha ancora un proprietario, una scuderia o colleghi su Equo.</div>'}
    <button class="arc-nuova larga" onclick="arcConsulto()">+ Aggiungi un collega per un consulto</button>
    <div class="arc-switch"><span><b>Avviso privacy prima di aprire</b><small>Chi lo riceve deve spuntare «Ho letto e accetto»</small></span>
      <label class="switch"><input type="checkbox" ${c.avvisoNuovo ? "checked" : ""} onchange="ARC.chi.avvisoNuovo = this.checked" aria-label="Avviso privacy prima di aprire"><span class="switch-track"><span class="switch-thumb"></span></span></label></div>
    <div class="arc-nota">Nel libretto del cavallo compare solo l'intervento con la data, mai gli allegati. Togliere l'accesso non cancella le copie già scaricate.</div>
    <button class="arc-btn pri larga" id="arc-chi-salva" onclick="arcChiSalva()">Salva</button>`;
}
function arcChiScegli(i, k){ const p = ARC.chi?.persone[i]; if(p){ p.nuovo = k; arcChiRender(); } }
async function arcConsulto(){
  const l = await arcDB.colleghi();
  const gia = new Set((ARC.chi?.persone || []).map(p => p.user_id).filter(Boolean));
  const liberi = l.filter(x => !gia.has(x.altro_id));
  arcFoglio("modal-arc-consulto", `<div class="modal-title" id="modal-arc-consulto-tit">Collega per un consulto</div>
    ${liberi.length ? liberi.map(x => `<button class="arc-opz" onclick="arcConsultoScegli('${x.altro_id}')"><span class="arc-ini">${arcEsc(String(x.nome || "?").slice(0, 2).toUpperCase())}</span>${arcEsc(x.nome || "Collega")}<small>${arcEsc(x.ruolo || "")}</small></button>`).join("")
      : '<div class="arc-nota">Nessun collega nella chat tra colleghi. Aggiungilo da Messaggi › Colleghi con il suo codice.</div>'}`);
  ARC.colleghiLista = l;
}
function arcConsultoScegli(uid){
  const x = (ARC.colleghiLista || []).find(y => y.altro_id === uid); if(!x || !ARC.chi) return;
  ARC.chi.persone.push({ tipo: "altro", user_id: uid, nome: x.nome || "Collega", ruolo: "Consulto · " + (x.ruolo || "collega"), modo: "nascosto", nuovo: "sempre", motivo: "consulto" });
  closeModal("modal-arc-consulto"); arcChiRender();
}
async function arcChiSalva(){
  const c = ARC.chi; if(!c) return;
  const b = document.getElementById("arc-chi-salva"); if(b) b.disabled = true;
  try{
    for(const p of c.persone.filter(x => x.nuovo !== x.modo)){   // 7 giorni già attivo e non toccato: non si allunga
      const r = await arcDB.imposta(c.id, p, p.nuovo, p.motivo === "consulto" ? "consulto" : "condivisione");
      if(!r?.ok) throw new Error(r?.errore || "non salvato");
    }
    if(c.avvisoNuovo !== c.avviso){ const { error } = await arcDB.aggiorna(c.id, { avviso_privacy: c.avvisoNuovo }); if(error) throw error; }
    closeModal("modal-arc-chi"); ARC.chi = null; arcToast("Salvato"); arcRicarica();
  }catch(err){ arcToast(/equo_doc_imposta|schema cache/i.test(String(err?.message || err)) ? "Manca un aggiornamento del database (SQL 69)." : "Non salvato: " + (err?.message || err)); }
  finally{ if(b) b.disabled = false; }
}

// ---------- manda in chat, scarica, elimina, carica ----------
function arcClienteDi(d){
  const cv = (typeof cavalliMieiLista !== "undefined" ? cavalliMieiLista : []).find(c => c.id === d.cavallo_cliente_id || (d.horse_id && c.horse_id === d.horse_id));
  const cli = cv && typeof clientiAttivi === "function" ? clientiAttivi().find(c => c.id === cv.cliente_mascalcia_id) : null;
  return cli || null;
}
async function arcMandaChat(id){
  const d = arcDoc(id); if(!d) return;
  const cli = arcClienteDi(d);
  if(!cli) return arcToast("Non trovo il cliente di questo cavallo: usa «Scarica».");
  if(!cli.cliente_user_id && !cli.centro_id) return arcToast(`${cli.nome} non è su Equo: usa «Scarica» e mandalo tu.`);
  if(typeof chiediSiNo === "function" && !(await chiediSiNo(`Mandare a ${cli.nome}?`, "Lo trova nella chat con te. Lo vedrà per sempre: puoi cambiarlo quando vuoi in «Chi lo vede».", { si: "Manda", no: "Annulla" }))) return;
  const chi = cli.cliente_user_id ? { user_id: cli.cliente_user_id } : { centro_id: cli.centro_id };
  const r = await arcDB.imposta(id, chi, "sempre", "chat");
  if(!r?.ok) return arcToast("Non condiviso: " + (r?.errore || "riprova"));
  const tipo = /^image\//.test(d.mime || "") ? "foto" : /^video\//.test(d.mime || "") ? "video" : "documento";
  const { error } = await DB.insertMessaggioMascalcia({ cliente_mascalcia_id: cli.id, tipo, testo: d.nome || d.titolo, file_url: "equo-doc:" + id, file_nome: DB.nomeFileDocumento ? DB.nomeFileDocumento(d, d.cavallo_nome) : (d.nome || d.titolo) });
  if(error) return arcToast("Accesso dato, ma il messaggio non è partito: riprova.");
  arcToast("Mandato a " + cli.nome); arcRicarica();
}
function arcScaricaBlob(blob, nome){
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}
async function arcScarica(id){
  const d = arcDoc(id); if(!d) return;
  const img = /^image\//.test(d.mime || ""), nome = DB.nomeFileDocumento ? DB.nomeFileDocumento(d, d.cavallo_nome) : "Equo_documento";
  let conSegni = false;
  if(img && d.n_segni && typeof chiediSiNo === "function") conSegni = await chiediSiNo("Come lo scarichi?", "Con i segni e le misure disegnati sopra, oppure la foto originale.", { si: "Con i segni", no: "Solo l'originale" });
  const info = await arcDB.apri(id), url = info?.ok ? await arcDB.urlDi(info) : null;
  if(!url) return arcToast("Non riesco a scaricarlo, riprova.");
  try{
    if(conSegni){
      const im = await dsCaricaImmagine(url), cv = dsCanvasConSegni(im, info.segni, { maxLato: 2400 });
      const blob = await new Promise(r => cv.toBlob(r, "image/jpeg", 0.92)); if(!blob) throw new Error("immagine");
      return arcScaricaBlob(blob, nome.replace(/\.[a-z0-9]+$/i, "") + "_segni.jpg");
    }
    const blob = await (await fetch(url)).blob(); arcScaricaBlob(blob, nome);
  }catch(_){ window.open(url, "_blank", "noopener"); }
}
async function arcElimina(id){
  const d = arcDoc(id); if(!d) return;
  if(typeof chiediSiNo === "function" && !(await chiediSiNo("Eliminare «" + (d.nome || d.titolo) + "»?", "Sparisce per tutti. Per 30 giorni lo ritrovi in fondo all'Archivio, «Eliminati», e puoi ripristinarlo.", { si: "Elimina", no: "Annulla" }))) return;
  const { error } = DB.eliminaDocumento ? await DB.eliminaDocumento(id) : await arcDB.aggiorna(id, { eliminato_il: new Date().toISOString() });
  if(error) return arcToast("Non eliminato, riprova.");
  arcToast("Eliminato · recuperabile per 30 giorni"); arcRicarica();
}
async function arcRipristina(id){
  const r = await arcDB.ripristina(id);
  if(!r?.ok) return arcToast(r?.errore === "scaduto" ? "Sono passati più di 30 giorni: non si può più ripristinare." : "Non ripristinato, riprova.");
  arcToast("Ripristinato"); arcRicarica();
}
const ARC_TIPI = [["foto_clinica", "Foto"], ["lastra", "Lastra"], ["ecografia", "Ecografia"], ["documento", "Documento"]];
function arcCarica(){
  const cav = (typeof cavalliCartella === "function" ? cavalliCartella() : []).filter(c => c.id);
  ARC.carica = { cav: null, tipo: "foto_clinica", q: "", lista: cav, file: null };
  arcCaricaRender();
}
function arcCaricaRender(){
  const c = ARC.carica; if(!c) return;
  const q = c.q.trim().toLowerCase(), l = c.lista.filter(x => !q || String(x.nome || "").toLowerCase().includes(q)).slice(0, 30);
  const html = `<div class="modal-title" id="modal-arc-carica-tit">Carica nell'Archivio</div>
    <div class="arc-lab">Per quale cavallo?</div>
    ${c.cav ? `<button class="arc-opz on" onclick="ARC.carica.cav = null; arcCaricaRender()">${arcEsc(c.cav.nome)} <small>cambia</small></button>`
      : `<input class="arc-in" id="arc-car-q" type="search" placeholder="Cerca il cavallo" value="${arcEsc(c.q)}" oninput="ARC.carica.q = this.value; arcCaricaRender(); const i = document.getElementById('arc-car-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length)" aria-label="Cerca il cavallo">
        <div class="arc-car-lista">${l.map(x => `<button class="arc-opz" onclick="arcCaricaCavallo('${x.id}')">${arcEsc(x.nome)}</button>`).join("") || '<div class="arc-nota">Nessun cavallo trovato.</div>'}</div>`}
    <div class="arc-lab">Tipo</div>
    <div class="arc-chips">${ARC_TIPI.map(([k, t]) => `<button class="arc-chip${c.tipo === k ? " on" : ""}" onclick="ARC.carica.tipo = '${k}'; arcCaricaRender()">${t}</button>`).join("")}</div>
    <div class="arc-nota">Nasce nascosto: lo vedi solo tu finché non scegli «Chi lo vede». Foto, lastre (JPG, PNG) e PDF fino a 50 MB.</div>
    <input type="file" id="arc-car-file" accept="image/*,application/pdf" hidden onchange="arcCaricaFile(this)">
    <button class="arc-btn pri larga" ${c.cav ? "" : "disabled"} onclick="document.getElementById('arc-car-file').click()">Scegli il file e carica</button>`;
  if(document.getElementById("modal-arc-carica")?.classList.contains("active")) document.getElementById("modal-arc-carica-corpo").innerHTML = html;
  else arcFoglio("modal-arc-carica", html);
}
function arcCaricaCavallo(id){ const c = ARC.carica; if(!c) return; c.cav = c.lista.find(x => x.id === id) || null; arcCaricaRender(); }
async function arcCaricaFile(input){
  const f = input.files && input.files[0]; input.value = "";
  const c = ARC.carica; if(!f || !c?.cav) return;
  if(f.size > 50 * 1048576) return arcToast("File troppo grande: massimo 50 MB");
  if(!/^(image\/|application\/pdf)/.test(f.type || "")) return arcToast("Puoi caricare foto, lastre in JPG/PNG o PDF");
  arcToast("Caricamento in corso…");
  let blob = f;
  if(/^image\//.test(f.type) && typeof vaRiduci === "function"){ try{ blob = await vaRiduci(f) || f; }catch(_){ blob = f; } }
  const r = await DB.caricaDocumentoPrivato({ blob, mime: blob.type || f.type, categoria: c.tipo, cavallo_nome: c.cav.nome, horse_id: c.cav.horse_id || null, cavallo_cliente_id: c.cav.id,
    autore_ruolo: arcVet() ? "veterinario" : "maniscalco" });
  if(!r?.id) return arcToast("Caricamento non riuscito: " + (r?.error?.message || "riprova"));
  closeModal("modal-arc-carica"); ARC.carica = null; arcToast("Caricato · nascosto, solo tu lo vedi"); arcRicarica();
}

// ---------- apertura per chi lo riceve (e per l'autore) ----------
function arcAvviso(titolo){
  return new Promise(res => {
    const fine = v => { closeModal("modal-arc-avviso"); res(v); };
    arcFoglio("modal-arc-avviso", `<div class="arc-av-testa"><span class="arc-av-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg></span>
        <div class="modal-title" id="modal-arc-avviso-tit">Documento protetto</div></div>
      ${titolo ? `<div class="arc-nota">${arcEsc(titolo)}</div>` : ""}
      <p class="arc-av-testo">${arcEsc(ARC_AVVISO)}</p>
      <label class="arc-check grande"><input type="checkbox" id="arc-av-ok" onchange="document.getElementById('arc-av-apri').disabled = !this.checked"> Ho letto e accetto</label>
      <div class="arc-nota">Le foto si aprono con il tuo nome e la data in filigrana. La tua conferma viene registrata.</div>
      <div class="arc-bott"><button class="arc-btn" id="arc-av-no">Non ora</button><button class="arc-btn pri" id="arc-av-apri" disabled>Apri il documento</button></div>`);
    document.getElementById("arc-av-no").onclick = () => fine(false);
    document.getElementById("arc-av-apri").onclick = () => fine(!!document.getElementById("arc-av-ok")?.checked);
    const ov = document.getElementById("modal-arc-avviso"); ov.onclick = ev => { if(ev.target === ov) fine(false); };
  });
}
async function docVisualizza(id){
  const info = await arcDB.apri(id);
  if(!info?.ok){ arcToast(info?.errore === "accesso" ? "Non hai accesso a questo documento: chi l'ha caricato può avertelo tolto." : "Non riesco ad aprire il documento, riprova."); return; }
  if(info.avviso){
    if(!(await arcAvviso(info.nome || info.titolo))) return;
    await arcDB.accettaAvviso(id);
  }
  const url = await arcDB.urlDi(info);
  if(!url){ arcToast("Non riesco ad aprire il documento, riprova."); return; }
  const fino = info.scade_il ? "Disponibile fino al " + new Date(info.scade_il).toLocaleDateString("it-IT", { day: "numeric", month: "short" }).replace(".", "") : "";
  let ov = document.getElementById("arc-vedi");
  if(!ov){ ov = document.createElement("div"); ov.id = "arc-vedi"; ov.className = "arc-vedi"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); document.body.appendChild(ov); }
  const img = /^image\//.test(info.mime || ""), s = dsNormalizza(info.segni);
  ov.innerHTML = `<div class="arc-vedi-top"><button class="ds-ico" aria-label="Chiudi" onclick="docChiudi()"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <div class="ds-tit"><b>${arcEsc(info.nome || info.titolo || "Documento")}</b><small>${arcEsc(info.mio ? "Tuo" : "Da " + (info.autore_nome || "un professionista"))}${fino ? " · " + fino : ""}</small></div>
      ${info.mio && img ? `<button class="ds-salva" onclick="docChiudi(); dsApri('${id}')">Disegna</button>` : ""}</div>
    ${img ? `<div class="arc-vedi-stage" id="arc-vedi-stage"><canvas id="arc-vedi-cv" role="img" aria-label="${arcEsc(info.nome || info.titolo || "Foto")}"></canvas>
        ${s.items.length ? `<button class="ds-mostra on" id="arc-vedi-segni" onclick="docSegni()" aria-pressed="true"><span class="ds-sw"><span></span></span>Segni</button>` : ""}</div>
        ${info.mio ? "" : '<div class="arc-vedi-nota">Documento protetto: non condividerlo senza il permesso di chi l\'ha inviato.</div>'}`
      : `<div class="arc-vedi-file"><b>${/pdf/.test(info.mime || "") ? "PDF" : /^video\//.test(info.mime || "") ? "Video" : "File"}</b>
        <p>${info.mio ? "" : "Documento protetto: non condividerlo senza il permesso di chi l'ha inviato."}</p>
        <a class="arc-btn pri" href="${arcEsc(urlSicuro(url))}" target="_blank" rel="noopener">Apri il documento</a><small>Il link vale 10 minuti.</small></div>`}`;
  ov.classList.add("aperto");
  if(!img) return;
  try{
    const im = await dsCaricaImmagine(url);
    ARC.vedi = { im, segni: s, mostra: true, filigrana: info.mio ? null : (info.io || "Equo") + " · " + new Date().toLocaleDateString("it-IT") };
    docDisegna();
  }catch(_){ arcToast("Non riesco a caricare la foto, riprova."); }
}
function docDisegna(){
  const v = ARC.vedi, cv = document.getElementById("arc-vedi-cv"), st = document.getElementById("arc-vedi-stage"); if(!v || !cv || !st) return;
  const dpr = window.devicePixelRatio || 1, cw = st.clientWidth, ch = st.clientHeight;
  cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); cv.style.width = cw + "px"; cv.style.height = ch + "px";
  const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const r = dsAdatta(cw, ch, v.im.naturalWidth, v.im.naturalHeight);
  ctx.drawImage(v.im, r.x, r.y, r.w, r.h);
  if(v.mostra) dsDisegnaSegni(ctx, v.segni, r, v.im.naturalWidth, v.im.naturalHeight, { scala: 1.1 });
  if(v.filigrana){ ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); ctx.translate(r.x, r.y); dsFiligrana(ctx, r.w, r.h, v.filigrana); ctx.restore(); }
}
function docSegni(){ if(!ARC.vedi) return; ARC.vedi.mostra = !ARC.vedi.mostra; const b = document.getElementById("arc-vedi-segni"); if(b){ b.classList.toggle("on", ARC.vedi.mostra); b.setAttribute("aria-pressed", ARC.vedi.mostra); } docDisegna(); }
function docChiudi(){ const ov = document.getElementById("arc-vedi"); if(ov){ ov.classList.remove("aperto"); ov.innerHTML = ""; } ARC.vedi = null; }

export { ARC, arcDB, arcEsc, arcToast, arcRicarica, apriArchivio, arcChiudi, arcRender, arcCerca, arcFiltro, arcOrdine, arcApriCartella, arcSelezione, arcSpunta,
  arcAzioni, arcDisegna, arcRinomina, arcSalvaNome, arcSposta, arcSpostaIn, arcNuovaCartella, arcCreaCartella, arcOpzioniCartella, arcSalvaCartella, arcEliminaCartella,
  arcChiLoVede, arcChiScegli, arcConsulto, arcConsultoScegli, arcChiSalva, arcMandaChat, arcScarica, arcElimina, arcRipristina,
  arcCarica, arcCaricaCavallo, arcCaricaFile, arcCaricaRender, docVisualizza, docSegni, docChiudi, docDisegna, ARC_AVVISO };
