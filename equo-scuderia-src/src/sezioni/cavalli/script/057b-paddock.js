/* =====================================================================
   PADDOCK (9/11/2026 · SQL 49) — script normale: funzioni globali.
   Un paddock ha nome, zona e capienza e ospita più cavalli insieme.
   Un cavallo può avere il box e stare nel paddock "di giorno", oppure vivere solo nel paddock.
   Box + paddock condividono il limite del pacchetto (ADVANCE 20, PREMIUM 100).
   Capienza superata: si può aggiungere lo stesso, la card diventa rossa e compare l'avviso «sovraffollato».
   Icone del giorno: fieno, acqua e pulizia valgono per il paddock; quelle di ogni cavallo seguono il cavallo
   (sono le stesse righe dei box: se Luna ha mangiato, lo vedi sia nel box sia nel paddock).
   ===================================================================== */
let paddockList = [], paddockCav = [], paddockAttivita = [], paddockPannelloId = null, paddockCanale = null, paddockNuovoForm = false;
const PADDOCK_ICONE = ["fieno", "acqua", "box_pulito"];   // icone del paddock intero
const PADDOCK_MOTIVI = { pulizia: "Pulizia", riparazione: "Recinzione / riparazione", terreno: "Terreno (fango, allagato)", altro: "Altro" };
const padIconaNome = k => k === "box_pulito" ? "Pulito" : BOX_ICONE[k].nome;
const padCavalliDi = id => paddockCav.filter(r => r.paddock_id === id).map(r => ({ r, c: cavalliList.find(x => x.id === r.cavallo_id) })).filter(x => x.c);
const padDiCavallo = cavId => { const r = paddockCav.find(x => x.cavallo_id === cavId); return r ? paddockList.find(p => p.id === r.paddock_id) : null; };
const padBoxDi = cavId => boxList.find(b => b.cavallo_id === cavId) || boxList.find(b => b.assegnato_cavallo_id === cavId) || null;
const padSovraffollati = () => paddockList.filter(p => padCavalliDi(p.id).length > p.capienza);

async function loadPaddock(){
  if(DEMO_MODE){
    if(!demoState.paddock){
      const l = demoState.cavalli?.[1];
      demoState.paddock = [{ id: "pd1", centro_id: "demo-centro", nome: "Paddock grande", zona: "Dietro la scuderia", capienza: 3, manutenzione: false, ordine: 0 },
                           { id: "pd2", centro_id: "demo-centro", nome: "Recinto nord", zona: null, capienza: 2, manutenzione: false, ordine: 1 }];
      demoState.paddockCav = l ? [{ id: "pc1", paddock_id: "pd1", cavallo_id: l.id, dal: new Date().toISOString() }] : [];
      demoState.paddockAtt = [{ paddock_id: "pd1", cavallo_id: null, tipo: "fieno", giorno: oggiRoma(), fatto_il: new Date().toISOString(), fatto_da_nome: "Sara" }];
    }
    paddockList = demoState.paddock; paddockCav = demoState.paddockCav; paddockAttivita = demoState.paddockAtt;
    return;
  }
  if(!currentCentro?.id) return;
  const [p, c, a] = await Promise.all([
    sb.from("scuderia_paddock").select("*").eq("centro_id", currentCentro.id).order("ordine").order("nome"),
    sb.from("scuderia_paddock_cavalli").select("id, paddock_id, cavallo_id, dal").eq("centro_id", currentCentro.id),
    sb.from("scuderia_box_attivita").select("paddock_id, cavallo_id, tipo, giorno, fatto_il, fatto_da_nome, fonte").eq("centro_id", currentCentro.id).eq("giorno", oggiRoma()).not("paddock_id", "is", null).is("cavallo_id", null),
  ]);
  // prima dell'SQL 49 le tabelle non esistono: la sezione paddock resta semplicemente vuota
  paddockList = p.error ? [] : (p.data || []);
  paddockCav = c.error ? [] : (c.data || []);
  paddockAttivita = a.error ? [] : (a.data || []);
}
function paddockAscolta(){
  if(DEMO_MODE || !currentCentro?.id || paddockCanale) return;
  const ricarica = () => { clearTimeout(boxRicaricaTimer); boxRicaricaTimer = setTimeout(async () => { await loadBox(); renderBox(); if(boxPannelloId) boxRenderPannello(); }, 350); };
  paddockCanale = sb.channel("paddock-" + currentCentro.id)
    .on("postgres_changes", { event: "*", schema: "public", table: "scuderia_paddock", filter: "centro_id=eq." + currentCentro.id }, ricarica)
    .on("postgres_changes", { event: "*", schema: "public", table: "scuderia_paddock_cavalli", filter: "centro_id=eq." + currentCentro.id }, ricarica)
    .subscribe();
}

// i box si caricano e si disegnano insieme ai paddock (così ogni aggiornamento, anche in modalità stalla, li tiene allineati)
(function(){
  const loadBoxOrig = loadBox, renderBoxOrig = renderBox, refreshOrig = refreshBoxSezione;
  loadBox = async function(){ await Promise.all([loadBoxOrig(), loadPaddock()]); };
  renderBox = function(){ renderBoxOrig(); renderPaddock(); };
  refreshBoxSezione = async function(){ await refreshOrig(); paddockAscolta(); };
})();

function padAttivitaDi(padId, tipo){ return paddockAttivita.find(a => a.paddock_id === padId && !a.cavallo_id && a.tipo === tipo && a.giorno === oggiRoma()); }
function padCavAttivitaDi(cavId, tipo){ return boxAttivita.find(a => a.cavallo_id === cavId && a.tipo === tipo && a.giorno === oggiRoma()); }
function padIconeCavallo(){ return boxIconeAttive().filter(k => k !== "paddock" && k !== "box_pulito"); }
function padOra(a){ return a ? new Date(a.fatto_il).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) + (a.fatto_da_nome ? " · " + a.fatto_da_nome.split(" ")[0] : "") : "da fare"; }

function padStato(p){
  const n = padCavalliDi(p.id).length;
  if(n > p.capienza) return { cls: "rosso", tip: `Paddock sovraffollato: ${n} cavalli su ${p.capienza} posti` };
  if(p.manutenzione && !n) return { cls: "manut", tip: "Paddock in manutenzione" };
  if(n) return { cls: "verde", tip: `${n} cavall${n === 1 ? "o" : "i"} su ${p.capienza} posti` };
  return { cls: "blu", tip: "Paddock vuoto: tocca per aggiungere cavalli" };
}
function padCardHtml(p){
  // Opzione D (9/11/2026): angoli tondi, verde pieno, cancello a sbarre; la capienza è una griglia di posti
  const cav = padCavalliDi(p.id), st = padStato(p), n = cav.length, over = n > p.capienza;
  const classe = boxBloccati() ? "bloccato" : st.cls;
  const MAX = 8, totale = Math.max(p.capienza, n), mostra = Math.min(totale, MAX);
  const posti = [];
  for(let i = 0; i < mostra; i++){
    if(i === MAX - 1 && totale > MAX){ posti.push(`<div class="pd-posto pd-altri">+${totale - MAX + 1}</div>`); break; }
    const x = cav[i];
    if(x){
      const c = x.c, box = padBoxDi(c.id), inPiu = i >= p.capienza;
      posti.push(`<div class="pd-posto pad-cav ${inPiu ? "x" : ""}" data-cav="${c.id}" data-pad="${p.id}" data-tip="${escapeHtml(c.nome + (box ? " · ha il box " + box.numero + ": qui di giorno" : " · vive nel paddock") + (inPiu ? " · oltre la capienza" : "") + (boxPuoGestire() ? " · tieni premuto per spostarlo" : ""))}">
        ${c.foto_url ? `<span class="f" style="background-image:${cssUrl(c.foto_url)}"></span>` : `<span class="f nf">${escapeHtml((c.nome || "?").trim().charAt(0).toUpperCase())}</span>`}
        <span class="n">${escapeHtml(c.nome)}</span>${box ? `<span class="g">B${box.numero}</span>` : ""}</div>`);
    } else posti.push(`<div class="pd-posto v">${p.manutenzione ? "" : "libero"}</div>`);
  }
  const righe = Math.ceil(posti.length / 2);
  let corpo;
  if(p.manutenzione && !n){
    corpo = `<div class="pd-manut">${iconHtml("fa-screwdriver-wrench")}<b>In manutenzione</b><span>${PADDOCK_MOTIVI[p.manutenzione_motivo] || "Lavori"}${p.manutenzione_fino ? " · fino al " + formatDate(p.manutenzione_fino) : ""}</span></div>`;
  } else corpo = `<div class="pd-posti" style="grid-template-rows:repeat(${righe},minmax(0,1fr))">${posti.join("")}</div>`;
  const icone = n ? `<div class="pd-icone">${PADDOCK_ICONE.map(k => { const d = BOX_ICONE[k], a = padAttivitaDi(p.id, k);
    return `<button class="box-ic ${a ? "on" : ""}" style="--ic-col:${d.col}" data-tip="${escapeHtml(padIconaNome(k) + " (tutto il paddock)" + (a ? " · fatto alle " + padOra(a) : " · da fare oggi: tocca per segnarlo"))}" onclick="event.stopPropagation();paddockToggleIcona('${p.id}','${k}')">${iconHtml(d.icon)}</button>`; }).join("")}
    <span class="pd-conta ${over ? "over" : ""}">${n}/${p.capienza}</span></div>` : "";
  return `<div class="box-card pad-card ${classe}" data-pad="${p.id}" data-tip="${escapeHtml(st.tip)}" onclick="${boxBloccati() ? "apriUpsell('box')" : `paddockApri('${p.id}')`}">
    <div class="pd-testa"><span class="pd-tag ${over ? "over" : ""}">${over ? n + "/" + p.capienza : "PADDOCK"}</span><span class="pd-nome">${escapeHtml(p.nome)}</span></div>
    ${corpo}${icone}
    <div class="pd-cancello" aria-hidden="true"></div>
    ${boxBloccati() ? `<div class="box-lucchetto"><i class="fa-solid fa-lock"></i>Disponibile da ADVANCE</div>` : ""}
  </div>`;
}
function renderPaddock(){
  const el = document.getElementById("paddock-griglia"); if(!el) return;
  const conta = document.getElementById("paddock-conta"), avv = document.getElementById("paddock-avviso");
  const tot = paddockCav.length, over = padSovraffollati();
  if(conta) conta.innerHTML = `<span><b>${paddockList.length}</b> paddock</span><span data-tip="Cavalli nei paddock in questo momento"><i class="fa-solid fa-horse"></i> ${tot} cavall${tot === 1 ? "o" : "i"}</span>`
    + (over.length ? `<span style="color:var(--danger);font-weight:700"><i class="l br"></i>${over.length} sovraffollat${over.length === 1 ? "o" : "i"}</span>` : "");
  if(avv){
    avv.style.display = over.length ? "" : "none";
    avv.innerHTML = over.length ? `<i class="fa-solid fa-triangle-exclamation"></i> <b>Paddock sovraffollat${over.length === 1 ? "o" : "i"}:</b> ` + over.map(p => `<a href="#" onclick="event.preventDefault();paddockApri('${p.id}')">${escapeHtml(p.nome)} (${padCavalliDi(p.id).length} su ${p.capienza})</a>`).join(", ") : "";
  }
  const puoAgg = !boxBloccati() && boxPuoGestire() && (boxList.length + paddockList.length) < boxLimite();
  el.innerHTML = paddockList.map(padCardHtml).join("") + (puoAgg ? `<div class="box-card box-nuovo pad-nuovo" onclick="paddockNuovo()" data-tip="Crea un paddock: nome, zona e quanti cavalli può ospitare"><i class="fa-solid fa-plus" style="font-size:20px"></i> Nuovo paddock</div>` : "");
  const vuoto = document.getElementById("paddock-vuoto");
  if(vuoto) vuoto.style.display = !paddockList.length && !puoAgg ? "" : "none";
}

/* ---- pannello del paddock ---- */
function paddockApri(id){ paddockNuovoForm = false; paddockPannelloId = id; paddockRenderPannello(); openModal("modal-paddock"); }
function paddockNuovo(){
  if(boxBloccati()){ apriUpsell("box"); return; }
  if(boxList.length + paddockList.length >= boxLimite()){ showToast(`Hai già ${boxLimite()} posti tra box e paddock: è il massimo del tuo pacchetto${boxLimite() < 100 ? " (PREMIUM arriva a 100)" : ""}.`); return; }
  paddockNuovoForm = true; paddockPannelloId = null; paddockRenderPannello(); openModal("modal-paddock");
  setTimeout(() => document.getElementById("pad-nome")?.focus(), 60);
}
function padCampiHtml(p){
  return `<div class="grid grid-2"><div class="field"><label>Nome</label><input class="input" id="pad-nome" maxlength="60" value="${escapeHtml(p?.nome || "")}" placeholder="Es. Paddock grande"></div>
    <div class="field"><label>Quanti cavalli può ospitare</label><input class="input" id="pad-capienza" type="number" min="1" max="60" value="${p?.capienza || 4}"></div></div>
    <div class="field"><label>Zona (facoltativa)</label><input class="input" id="pad-zona" maxlength="60" value="${escapeHtml(p?.zona || "")}" placeholder="Es. Dietro la scuderia"></div>`;
}
function paddockRenderPannello(){
  const tit = document.getElementById("paddock-pannello-titolo"), corpo = document.getElementById("paddock-pannello-corpo");
  if(paddockNuovoForm){
    tit.innerHTML = `<span class="box-targa pad-targa">PADDOCK</span> Nuovo paddock`;
    corpo.innerHTML = padCampiHtml(null) + `<p style="font-size:12.5px;color:var(--muted);margin:0 0 12px">Se ci metti più cavalli della capienza puoi farlo lo stesso: il paddock viene segnalato come sovraffollato.</p>
      <button class="btn btn-primary btn-block" onclick="paddockSalva(null)"><i class="fa-solid fa-check"></i> Crea paddock</button>`;
    return;
  }
  const p = paddockList.find(x => x.id === paddockPannelloId); if(!p){ closeModal("modal-paddock"); paddockPannelloId = null; return; }
  const gest = boxPuoGestire(), cav = padCavalliDi(p.id), n = cav.length;
  tit.innerHTML = `<span class="box-targa pad-targa">PADDOCK</span> ${escapeHtml(p.nome)}`;
  let h = `<div class="pad-riga-cap"><span class="pad-capienza ${n > p.capienza ? "over" : ""}">${n}/${p.capienza}</span> ${escapeHtml(p.zona || "")}</div>`;
  if(n > p.capienza) h += `<div class="bp-avviso rosso"><i class="fa-solid fa-triangle-exclamation"></i> Sovraffollato: ci sono ${n} cavalli e i posti sono ${p.capienza}.</div>`;
  if(p.manutenzione){
    h += `<div class="bp-avviso giallo"><i class="fa-solid fa-screwdriver-wrench"></i> In manutenzione · ${PADDOCK_MOTIVI[p.manutenzione_motivo] || "Lavori"}${p.manutenzione_fino ? " · fino al " + formatDate(p.manutenzione_fino) : ""}${p.manutenzione_nota ? "<br>" + escapeHtml(p.manutenzione_nota) : ""}</div>`
      + (gest ? `<button class="btn btn-primary btn-block" style="margin-bottom:12px" onclick="paddockAggiorna('${p.id}', { manutenzione: false })"><i class="fa-solid fa-check"></i> Fine manutenzione</button>` : "");
  }
  if(n || !p.manutenzione){
    h += `<label class="pad-etichetta">Oggi · tutto il paddock</label>
      <div class="bp-ic-griglia" style="grid-template-columns:repeat(3,minmax(0,1fr))">${PADDOCK_ICONE.map(k => { const d = BOX_ICONE[k], a = padAttivitaDi(p.id, k);
        return `<button class="bp-ic ${a ? "on" : ""}" style="--ic-col:${d.col}" onclick="paddockToggleIcona('${p.id}','${k}')"><span class="i">${iconHtml(d.icon)}</span><b>${padIconaNome(k)}</b><small>${escapeHtml(padOra(a))}</small></button>`; }).join("")}</div>`;
  }
  h += `<label class="pad-etichetta">Cavalli nel paddock</label>`;
  h += n ? cav.map(({ c }) => { const box = padBoxDi(c.id);
    return `<div class="pad-riga">
      <div class="pad-riga-testa">${c.foto_url ? `<span class="f" style="background-image:${cssUrl(c.foto_url)}"></span>` : `<span class="f nf"><i class="fa-solid fa-horse-head"></i></span>`}
        <div style="min-width:0;flex:1"><div style="font-weight:800;display:flex;gap:6px;align-items:center">${escapeHtml(c.nome)} ${pallinoHtml(c.id)}</div>
        <div style="font-size:12px;color:var(--muted)">${box ? `Ha il box ${box.numero}: qui di giorno` : "Vive nel paddock"}${c.proprietario ? " · " + escapeHtml(c.proprietario) : ""}</div></div>
        <button class="btn btn-ghost btn-sm" data-tip="Scheda cavallo" onclick="closeModal('modal-paddock');paddockPannelloId=null;showModule('cavalli');openCavalloDetail('${c.id}')"><i class="fa-solid fa-horse-head"></i></button>
        ${gest ? `<button class="btn btn-ghost btn-sm" style="color:var(--danger)" data-tip="${box ? "Rientra nel box " + box.numero : "Togli dal paddock"}" onclick="paddockTogli('${c.id}')"><i class="fa-solid fa-right-from-bracket"></i></button>` : ""}</div>
      <div class="pad-ic-cav">${padIconeCavallo().map(k => { const d = BOX_ICONE[k], a = padCavAttivitaDi(c.id, k);
        return `<button class="box-ic ${a ? "on" : ""}" style="--ic-col:${d.col}" data-tip="${escapeHtml(d.nome + " · " + padOra(a))}" onclick="paddockToggleIconaCavallo('${p.id}','${c.id}','${k}')">${iconHtml(d.icon)}</button>`; }).join("")}</div>
    </div>`; }).join("") : `<p style="color:var(--muted);font-size:13px;margin:0 0 12px">Nessun cavallo.</p>`;
  if(gest && !p.manutenzione){
    const liberi = cavalliList.filter(c => !paddockCav.some(r => r.cavallo_id === c.id)).sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "it"));
    h += liberi.length ? `<div class="field" style="margin-top:6px"><label>Aggiungi un cavallo</label><div style="display:flex;gap:8px">
        <select class="input" id="pad-scegli">${liberi.map(c => { const box = padBoxDi(c.id); return `<option value="${c.id}">${escapeHtml(c.nome)}${box ? " · box " + box.numero + " (di giorno)" : ""}</option>`; }).join("")}</select>
        <button class="btn btn-primary" onclick="paddockMetti(document.getElementById('pad-scegli').value, '${p.id}')">Aggiungi</button></div></div>`
      : `<p style="color:var(--muted);font-size:13px">Tutti i cavalli sono già in un paddock.</p>`;
  }
  if(gest){
    h += `<details style="margin:10px 0"><summary style="cursor:pointer;font-weight:700;font-size:13.5px">Nome, zona e capienza</summary><div style="margin-top:10px">${padCampiHtml(p)}
        <button class="btn btn-variazione btn-sm" onclick="paddockSalva('${p.id}')">Salva</button></div></details>`;
    if(!p.manutenzione) h += `<details style="margin:0 0 10px"><summary style="cursor:pointer;font-weight:700;font-size:13.5px">Metti in manutenzione</summary>
        <div class="grid grid-2" style="margin-top:10px"><div class="field"><label>Motivo</label><select class="input" id="pad-man-motivo">${Object.entries(PADDOCK_MOTIVI).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></div>
        <div class="field"><label>Fino al (facoltativo)</label><input class="input" type="date" id="pad-man-fino"></div></div>
        <div class="field"><label>Nota (facoltativa)</label><input class="input" id="pad-man-nota" maxlength="300" placeholder="Es. recinzione da sistemare"></div>
        ${n ? `<p style="font-size:12.5px;color:var(--muted);margin:0 0 8px">I cavalli presenti restano dove sono: spostali tu prima, se serve.</p>` : ""}
        <button class="btn btn-variazione btn-sm" onclick="paddockManutenzione('${p.id}')"><i class="fa-solid fa-screwdriver-wrench"></i> Metti in manutenzione</button></details>`;
    h += `<button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="paddockElimina('${p.id}')"><i class="fa-solid fa-trash"></i> Elimina paddock</button>`;
  }
  corpo.innerHTML = h;
}

/* ---- azioni ---- */
async function paddockSalva(id){
  const nome = document.getElementById("pad-nome").value.trim(), zona = document.getElementById("pad-zona").value.trim() || null;
  const capienza = Math.max(1, Math.min(60, parseInt(document.getElementById("pad-capienza").value, 10) || 1));
  if(!nome){ showToast("Scrivi il nome del paddock."); return; }
  if(DEMO_MODE){
    if(id) Object.assign(demoState.paddock.find(x => x.id === id), { nome, zona, capienza });
    else { id = "pd" + Date.now(); demoState.paddock.push({ id, centro_id: "demo-centro", nome, zona, capienza, manutenzione: false, ordine: demoState.paddock.length }); }
  } else if(id){
    const { error } = await sb.from("scuderia_paddock").update({ nome, zona, capienza }).eq("id", id);
    if(error){ showToast(error.message); return; }
  } else {
    const { data, error } = await sb.from("scuderia_paddock").insert({ centro_id: currentCentro.id, nome, zona, capienza, ordine: paddockList.length }).select("id").single();
    if(error){ showToast(error.message); return; }
    id = data.id;
  }
  const nuovo = paddockNuovoForm;
  await loadPaddock(); renderBox();
  paddockNuovoForm = false; paddockPannelloId = id; paddockRenderPannello();
  showToast(nuovo ? `Paddock «${nome}» creato: ora aggiungi i cavalli.` : "Paddock aggiornato.");
}
async function paddockAggiorna(id, campi){
  if(DEMO_MODE){ const p = demoState.paddock.find(x => x.id === id); Object.assign(p, campi); if(campi.manutenzione === false){ p.manutenzione_motivo = null; p.manutenzione_nota = null; p.manutenzione_fino = null; } }
  else { const { error } = await sb.from("scuderia_paddock").update(campi).eq("id", id); if(error){ showToast(error.message); return false; } }
  await loadPaddock(); renderBox(); if(paddockPannelloId) paddockRenderPannello(); return true;
}
async function paddockManutenzione(id){
  const campi = { manutenzione: true, manutenzione_motivo: document.getElementById("pad-man-motivo").value,
    manutenzione_fino: document.getElementById("pad-man-fino").value || null, manutenzione_nota: document.getElementById("pad-man-nota").value.trim() || null };
  if(await paddockAggiorna(id, campi)) showToast("Paddock in manutenzione.");
}
async function paddockElimina(id){
  const p = paddockList.find(x => x.id === id), n = padCavalliDi(id).length;
  if(!confirm(`Eliminare il paddock «${p?.nome}»?${n ? ` I ${n} cavalli presenti escono dal paddock (restano nell'anagrafica e nei loro box).` : ""}`)) return;
  for(const { c } of padCavalliDi(id)) await padStatoBox(c.id, false);
  if(DEMO_MODE){ demoState.paddock = demoState.paddock.filter(x => x.id !== id); demoState.paddockCav = demoState.paddockCav.filter(r => r.paddock_id !== id); }
  else { const { error } = await sb.from("scuderia_paddock").delete().eq("id", id); if(error){ showToast(error.message); return; } }
  closeModal("modal-paddock"); paddockPannelloId = null;
  await loadPaddock(); renderBox(); showToast("Paddock eliminato.");
}
// se il cavallo ha un box, il box mostra «Al paddock» mentre è fuori e «In box» quando rientra
async function padStatoBox(cavId, alPaddock){
  const b = boxList.find(x => x.cavallo_id === cavId); if(!b) return;
  const nuovo = alPaddock ? "paddock" : "in_box";
  if(alPaddock ? b.stato_cavallo === "in_box" : b.stato_cavallo === "paddock") await boxAggiorna(b.id, { stato_cavallo: nuovo });
}
// mette un cavallo in un paddock (da nessun posto, da un altro paddock o da un box)
async function paddockMetti(cavId, padId){
  const p = paddockList.find(x => x.id === padId), c = cavalliList.find(x => x.id === cavId);
  if(!p || !c) return false;
  if(p.manutenzione){ showToast(`${p.nome} è in manutenzione: non puoi metterci cavalli.`); return false; }
  const prima = paddockCav.find(r => r.cavallo_id === cavId);
  if(prima?.paddock_id === padId) return false;
  if(DEMO_MODE){
    if(prima) prima.paddock_id = padId; else demoState.paddockCav.push({ id: "pc" + Date.now(), paddock_id: padId, cavallo_id: cavId, dal: new Date().toISOString() });
  } else {
    const r = prima ? await sb.from("scuderia_paddock_cavalli").update({ paddock_id: padId }).eq("id", prima.id)
                    : await sb.from("scuderia_paddock_cavalli").insert({ centro_id: currentCentro.id, paddock_id: padId, cavallo_id: cavId });
    if(r.error){ showToast(r.error.message); return false; }
  }
  await loadPaddock();
  await padStatoBox(cavId, true);
  renderBox(); if(paddockPannelloId) paddockRenderPannello(); if(boxPannelloId) boxRenderPannello();
  const n = padCavalliDi(padId).length, box = padBoxDi(cavId);
  showToast(n > p.capienza ? `${c.nome} in ${p.nome}. Attenzione: ora è sovraffollato (${n} su ${p.capienza}).`
    : `${c.nome} in ${p.nome}${box ? " (di giorno, il box " + box.numero + " resta suo)" : ""}.`);
  return true;
}
// toglie il cavallo dal paddock: se ha un box, rientra lì
async function paddockTogli(cavId, zitto){
  const r = paddockCav.find(x => x.cavallo_id === cavId), c = cavalliList.find(x => x.id === cavId); if(!r) return true;
  if(DEMO_MODE) demoState.paddockCav = demoState.paddockCav.filter(x => x !== r);
  else { const { error } = await sb.from("scuderia_paddock_cavalli").delete().eq("id", r.id); if(error){ showToast(error.message); return false; } }
  await loadPaddock();
  await padStatoBox(cavId, false);
  renderBox(); if(paddockPannelloId) paddockRenderPannello();
  const box = padBoxDi(cavId);
  if(!zitto) showToast(box ? `${c?.nome || "Il cavallo"} rientra nel box ${box.numero}.` : `${c?.nome || "Il cavallo"} tolto dal paddock.`);
  return true;
}
// dal trascinamento: da un paddock a un box
async function paddockVersoBox(cavId, boxId){
  const b = boxList.find(x => x.id === boxId); if(!b) return;
  if(b.cavallo_id === cavId){ await paddockTogli(cavId); return; }
  if(b.cavallo_id || b.manutenzione){ await boxMuovi(cavId, null, boxId); return; }   // mostra il messaggio giusto (occupato / manutenzione)
  const da = boxList.find(x => x.cavallo_id === cavId);
  if(await boxMuovi(cavId, da ? da.id : null, boxId)) await paddockTogli(cavId, true);
}
async function paddockToggleIcona(padId, tipo){
  if(boxBloccati()){ apriUpsell("box"); return; }
  const esiste = padAttivitaDi(padId, tipo);
  if(DEMO_MODE){
    if(esiste) demoState.paddockAtt = demoState.paddockAtt.filter(a => a !== esiste);
    else demoState.paddockAtt.push({ paddock_id: padId, cavallo_id: null, tipo, giorno: oggiRoma(), fatto_il: new Date().toISOString(), fatto_da_nome: currentMembro?.nome_visualizzato || "Tu" });
    paddockAttivita = demoState.paddockAtt;
  } else {
    if(esiste) paddockAttivita = paddockAttivita.filter(a => a !== esiste);
    else paddockAttivita = [...paddockAttivita, { paddock_id: padId, cavallo_id: null, tipo, giorno: oggiRoma(), fatto_il: new Date().toISOString(), fatto_da_nome: currentMembro?.nome_visualizzato || "" }];
    renderPaddock(); if(paddockPannelloId) paddockRenderPannello();
    const r = esiste ? await sb.from("scuderia_box_attivita").delete().eq("paddock_id", padId).is("cavallo_id", null).eq("tipo", tipo).eq("giorno", oggiRoma())
                     : await sb.from("scuderia_box_attivita").insert({ centro_id: currentCentro.id, paddock_id: padId, cavallo_id: null, tipo });
    if(r.error) showToast(r.error.message);
    await loadPaddock();
  }
  renderPaddock(); if(paddockPannelloId) paddockRenderPannello();
}
// icone del singolo cavallo nel paddock: sono le stesse del box (seguono il cavallo)
async function paddockToggleIconaCavallo(padId, cavId, tipo){
  if(boxBloccati()){ apriUpsell("box"); return; }
  const esiste = padCavAttivitaDi(cavId, tipo);
  if(DEMO_MODE){
    if(esiste) demoState.boxAttivita = demoState.boxAttivita.filter(a => a !== esiste);
    else demoState.boxAttivita.push({ box_id: null, paddock_id: padId, cavallo_id: cavId, tipo, giorno: oggiRoma(), fatto_il: new Date().toISOString(), fatto_da_nome: currentMembro?.nome_visualizzato || "Tu" });
    boxAttivita = demoState.boxAttivita;
  } else {
    if(esiste) boxAttivita = boxAttivita.filter(a => a !== esiste);
    else boxAttivita = [...boxAttivita, { box_id: null, paddock_id: padId, cavallo_id: cavId, tipo, giorno: oggiRoma(), fatto_il: new Date().toISOString(), fatto_da_nome: currentMembro?.nome_visualizzato || "" }];
    renderBox(); if(paddockPannelloId) paddockRenderPannello();
    const r = esiste ? await sb.from("scuderia_box_attivita").delete().eq("cavallo_id", cavId).eq("tipo", tipo).eq("giorno", oggiRoma())
                     : await sb.from("scuderia_box_attivita").insert({ centro_id: currentCentro.id, paddock_id: padId, cavallo_id: cavId, tipo });
    if(r.error) showToast(r.error.message);
    await loadBox();
  }
  renderBox(); if(paddockPannelloId) paddockRenderPannello();
}

// «dove vive» nella scheda del cavallo: «Box 4», «Box 4 · di giorno nel Paddock grande», «Vive nel Paddock grande»
function doveViveCavallo(cavId){
  const box = boxList.find(b => b.cavallo_id === cavId), pad = padDiCavallo(cavId);
  if(box && pad) return `Box ${box.numero} · di giorno in ${pad.nome}`;
  if(box) return `Box ${box.numero}`;
  if(pad) return `Vive in ${pad.nome}`;
  return null;
}
