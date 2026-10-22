/* ---------- problema su un piede ---------- */
function mlApriProblema(evId){
  const e = mlEventi.find(x => x.id === evId); if(!e) return;
  const cav = mlCavId(e); if(!cav){ showToast("Questo appuntamento non ha un cavallo: aprilo in agenda per assegnarlo."); return; }
  mlProb = { ev: evId, cav, passo: 1, piedi: [], voci: [], nota: "", foto: null, fotoUrl: null, ric: 14, avvisa: false, vet: false };
  mlRender();
}
function mlRenderProblema(el, testa){
  const e = mlEventi.find(x => x.id === mlProb.ev), r = mlRigaCavallo(e), inf = mlInfo[mlProb.cav] || { anno: [] };
  const volte = k => inf.anno.filter(p => p.piede === k).length;
  if(mlProb.passo === 1){
    const piede = ([k, t]) => {
      const sel = mlProb.piedi.includes(k), n = volte(k);
      return `<button type="button" class="ml-piede p-${k}${sel ? " sel" : ""}" onclick="mlPiede('${k}')">${ML_IC.ferro}<b>${t}</b><small>${sel ? "PROBLEMA" : "REGOLARE"}</small>${sel ? `<i class="ml-ok">${ML_IC.check}</i>` : ""}${n ? `<em>già ${n} ${n === 1 ? "volta" : "volte"} quest'anno</em>` : ""}</button>`;
    };
    const dove = mlProb.piedi.length === 1 ? " · " + mlNomePiede(mlProb.piedi[0]).replace("anteriore", "ant.").replace("posteriore", "post.").replace("sinistro", "sx").replace("destro", "dx") : "";
    el.innerHTML = testa("Segna un problema", ml.nome)
      + `<button class="ml-esci" onclick="mlProb=null;mlRender()" aria-label="Annulla">${ML_IC.x}</button>`
      + `<div class="ml-corpo"><div class="ml-cav"><span class="ml-av grande">${iniziale(r.nome)}</span><div><h3>${escapeHtml(r.nome)}</h3><p>${escapeHtml(agDescrizioneTipoPro(e))}</p></div></div>
        <div class="ml-piedi">${ML_PIEDI.map(piede).join("")}<div class="ml-dd">▲<br>DAVANTI<br><br><br>DIETRO<br>▼</div></div>
        <div class="ml-lab">Cosa è successo${escapeHtml(dove)}</div>
        <div class="ml-voci">${ML_VOCI.map(([v, ic]) => `<button type="button" class="${mlProb.voci.includes(v) ? "on" : ""}" onclick="mlVoce('${v}')">${ML_IC[ic]}${v.replace(/^./, c => c.toUpperCase())}</button>`).join("")}</div></div>`
      + (mlProb.piedi.length && mlProb.voci.length ? mlSlider("Avanti", "mlProbAvanti", "oro") : `<div class="ml-sugg">Tocca il piede e cosa è successo</div>`);
  } else {
    const piedi = mlProb.piedi.map(mlNomePiede).join(" e ");
    const prima = inf.anno.filter(p => mlProb.piedi.includes(p.piede));
    const stor = prima.length ? `<b>Storico di ${mlProb.piedi.length > 1 ? "questi piedi" : "questo piede"}:</b> ${prima.length} ${prima.length === 1 ? "problema" : "problemi"} nell'ultimo anno (${prima.slice(0, 4).map(p => formatDataBreve(String(p.creato_il).slice(0, 10)) + " " + (p.voci || []).join(", ")).join("; ")}).`
      : "<b>Storico:</b> è la prima volta che segni un problema qui.";
    const coll = clienteCollegatoEquo(e.cliente_mascalcia_id);
    el.innerHTML = testa(r.nome + " · " + mlProb.piedi.map(mlSigla).join(" "), mlProb.voci.join(" · "))
      + `<button class="ml-esci" onclick="mlProb.passo=1;mlRender()" aria-label="Indietro">${ML_IC.indietro}</button>`
      + `<div class="ml-corpo"><div class="ml-lab">Se serve</div>
        <div class="ml-racc"><button type="button" class="${mlProb.foto ? "fatto" : ""}" onclick="document.getElementById('ml-foto').click()">${ML_IC.cam}Foto${mlProb.foto ? " ✓" : ""}</button>
          <button type="button" class="ham" onclick="mlHammer()">${ML_IC.hammer}Hammer</button></div>
        <input type="file" id="ml-foto" accept="image/*" capture="environment" hidden onchange="mlFoto(this)">
        ${mlProb.fotoUrl ? `<img class="ml-fotoprev" src="${mlProb.fotoUrl}" alt="">` : ""}
        <textarea class="ml-nota" rows="2" maxlength="300" placeholder="Nota (anche a voce: tocca il microfono della tastiera)" oninput="mlProb.nota=this.value">${escapeHtml(mlProb.nota)}</textarea>
        <div class="ml-stor">${stor}</div>
        <div class="ml-lab">E adesso</div>
        <div class="ml-ric">${ML_IC.cal}<span>Ricontrolla</span>${[0, 7, 14, 30].map(g => `<button type="button" class="${mlProb.ric === g ? "on" : ""}" onclick="mlProb.ric=${g};mlRender()">${g ? g + " gg" : "No"}</button>`).join("")}</div>
        ${coll ? `<button type="button" class="ml-tg${mlProb.avvisa ? " on" : ""}" onclick="mlProb.avvisa=!mlProb.avvisa;mlRender()">${ML_IC.chat}<span>Avvisa il proprietario</span><i></i></button>` : `<div class="ml-sugg piccolo">Il proprietario non usa Equo: l'avviso in chat non è possibile.</div>`}
        <button type="button" class="ml-tg${mlProb.vet ? " on" : ""}" onclick="mlProb.vet=!mlProb.vet;mlRender()">${ML_IC.alert}<span>Serve il veterinario</span><i></i></button>
        <div class="ml-sugg piccolo">Resta nello storico del ${escapeHtml(piedi)}. Il proprietario lo vede solo se lo avvisi.</div></div>`
      + mlSlider("Salva il problema", "mlSalvaProblema", "verde");
  }
  mlAttivaSlider(el);
}
function mlPiede(k){ const a = mlProb.piedi; const i = a.indexOf(k); if(i >= 0) a.splice(i, 1); else a.push(k); mlRender(); }
function mlVoce(v){ const a = mlProb.voci; const i = a.indexOf(v); if(i >= 0) a.splice(i, 1); else a.push(v); mlRender(); }
function mlProbAvanti(){ mlProb.passo = 2; mlRender(); }
async function mlFoto(input){
  const f = input.files && input.files[0]; input.value = "";
  if(!f) return;
  try{ mlProb.fotoUrl = await riduciImmagine(f); mlProb.foto = true; }catch(e){ showToast("Non riesco a leggere la foto, riprova."); return; }
  mlRender();
}
function mlHammer(){
  const e = mlEventi.find(x => x.id === mlProb.ev), r = mlRigaCavallo(e), inf = mlInfo[mlProb.cav] || { anno: [] };
  const testo = `Problema appena visto su ${r.nome} (${agDescrizioneTipoPro(e)}), piede ${mlProb.piedi.map(mlNomePiede).join(" e ")}: ${mlProb.voci.join(", ")}${mlProb.nota ? ". Nota: " + mlProb.nota : ""}.`
    + (inf.anno.length ? ` Problemi dell'ultimo anno: ${inf.anno.map(p => String(p.creato_il).slice(0, 10) + " " + mlNomePiede(p.piede) + " " + (p.voci || []).join(", ")).join("; ")}.` : "");
  openAiSheet().then(() => {
    hpContesto = { tipo: "cavallo", nome: r.nome, testo, cv: (typeof cavalliMieiById !== "undefined" && cavalliMieiById[mlProb.cav]) || { id: mlProb.cav, nome: r.nome }, clienteId: e.cliente_mascalcia_id };
    const sb2 = document.getElementById("hp-btn-storico"); if(sb2) sb2.hidden = false;
    const c = document.getElementById("hp-ctx"); if(c){ c.hidden = false; document.getElementById("hp-ctx-nome").textContent = hpContesto.nome; }
    const i = document.getElementById("chat-input"); if(i){ i.value = `Cosa mi consigli per il ${mlProb.piedi.map(mlNomePiede).join(" e ")} di ${r.nome}?`; }
    if(mlProb.fotoUrl){ aiAllegati = [{ media_type: "image/jpeg", data: mlProb.fotoUrl.split(",")[1], anteprima: mlProb.fotoUrl, nome: "piede.jpg" }]; renderAllegatiAi(); }
  });
}
async function mlSalvaProblema(){
  const p = mlProb, e = mlEventi.find(x => x.id === p.ev), r = mlRigaCavallo(e);
  const ric = p.ric ? aggiungiGiorniIso(mlOggi(), p.ric) : null;
  let fotoPath = null;
  try{
    if(p.fotoUrl && !DEMO_MODE){
      const blob = await (await fetch(p.fotoUrl)).blob();
      fotoPath = `${currentUser.id}/piede-${Date.now().toString(36)}.jpg`;
      const up = await sb.storage.from("cavalli-allegati").upload(fotoPath, blob, { contentType: "image/jpeg" });
      if(up.error){ console.warn("foto problema:", up.error.message); fotoPath = null; }
    }
    if(!DEMO_MODE){
      for(const k of p.piedi){
        const { error } = await sb.rpc("equo_segna_problema_piede", { p_cavallo: p.cav, p_piede: k, p_voci: p.voci, p_nota: p.nota || null, p_foto: fotoPath,
          p_ricontrolla: ric, p_avvisa: !!p.avvisa, p_vet: !!p.vet, p_intervento: e.id });
        if(error){ showToast(/does not exist|schema cache/.test(error.message || "") ? "Manca un aggiornamento del database: avvisa l'assistenza Equo." : "Non salvato: " + error.message); return; }
      }
    }
    // ricontrollo in agenda
    if(ric){
      const { error } = await DB.insertInterventoMascalcia({ cliente_mascalcia_id: e.cliente_mascalcia_id, cavallo_cliente_id: p.cav, horse_id: e.horse_id || null,
        tipo_ferratura: "altro", tipo_altro: "Ricontrollo " + p.piedi.map(mlNomePiede).join(" e ") + " · " + p.voci.join(", "), data_intervento: ric, stato: "programmato", note: p.nota || null });
      if(error) console.warn("ricontrollo:", error.message);
    }
    // avviso al proprietario (con la foto come allegato del cavallo)
    if(p.avvisa && clienteCollegatoEquo(e.cliente_mascalcia_id)){
      const testo = `🔎 ${r.nome} · ${p.piedi.map(mlNomePiede).join(" e ")}: ${p.voci.join(", ")}.${p.nota ? " " + p.nota : ""}`
        + (ric ? ` Lo ricontrollo il ${formatDataBreve(ric)}.` : "") + (p.vet ? " Ti consiglio di sentire anche il veterinario." : "");
      await DB.insertMessaggioMascalcia({ cliente_mascalcia_id: e.cliente_mascalcia_id, tipo: "testo", testo });
      if(fotoPath) await sb.rpc("equo_aggiungi_allegato", { p_vista: "maniscalco", p_id: p.cav, p_nome: `Problema ${p.piedi.map(mlSigla).join("-")} ${mlOggi()}.jpg`, p_path: fotoPath, p_mime: "image/jpeg", p_byte: null }).then(() => {}, () => {});
    }
  } catch(err){ console.error("problema piede:", err); showToast("Non salvato, riprova."); return; }
  ml.problemi = (ml.problemi || []).concat(p.piedi.map(k => ({ ev: p.ev, cav: p.cav, piede: k })));
  const inf = mlInfo[p.cav]; if(inf) p.piedi.forEach(k => inf.anno.unshift({ piede: k, voci: p.voci, creato_il: new Date().toISOString() }));
  mlProb = null; mlSalva(); mlRender();
  showToast(`Problema segnato su ${r.nome}`);
}

