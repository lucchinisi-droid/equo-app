/* ---------- POP-UP DI SISTEMA: OFFLINE e AGGIORNAMENTO ----------
   Offline: pop-up al centro + pillola in alto finché la connessione non torna.
   Aggiornamento: pop-up con "Cosa c'è di nuovo" (testo da version.json, scritto al deploy da novita.json).
   Il numero di versione mostrato (v1.0) NON cambia qui: lo decide solo Simone. */
let ultimoOnline = Date.now(), popOfflineMostrato = false, aggNovita = null;
try{ const t = Number(localStorage.getItem(CHIAVE_ULTIMO_ONLINE)); if(t) ultimoOnline = t; }catch(e){}
function segnaOnline(){ if(!navigator.onLine) return; ultimoOnline = Date.now(); try{ localStorage.setItem(CHIAVE_ULTIMO_ONLINE, String(ultimoOnline)); }catch(e){} }
setInterval(segnaOnline, 60000); segnaOnline();
function oraBreve(t){
  const d = new Date(t), oggi = new Date();
  const ora = d.toLocaleTimeString("it-IT", { hour:"2-digit", minute:"2-digit" });
  return d.toDateString() === oggi.toDateString() ? `alle ${ora}` : `il ${d.toLocaleDateString("it-IT", { day:"numeric", month:"long" })} alle ${ora}`;
}
function mostraPopOffline(){
  document.getElementById("eq-pop-off-testo").innerHTML = TESTO_OFFLINE();
  document.getElementById("eq-pop-off-ora").textContent = `Stai vedendo i dati aggiornati ${oraBreve(ultimoOnline)}.`;
  document.getElementById("eq-pop-offline").classList.add("attivo");
}
function chiudiPop(q){
  document.getElementById(q === "offline" ? "eq-pop-offline" : "eq-pop-agg").classList.remove("attivo");
  if(q === "offline" && !navigator.onLine) document.getElementById("eq-pill-offline").classList.add("attivo");
  if(q === "agg") document.getElementById("eq-pill-agg").classList.add("attivo");
}
function vaiOffline(){
  document.getElementById("eq-pill-agg").classList.remove("attivo");
  if(!popOfflineMostrato){ popOfflineMostrato = true; mostraPopOffline(); }
  else document.getElementById("eq-pill-offline").classList.add("attivo");
}
function tornaOnline(){
  segnaOnline();
  document.getElementById("eq-pop-offline").classList.remove("attivo");
  document.getElementById("eq-pill-offline").classList.remove("attivo");
  if(popOfflineMostrato){ popOfflineMostrato = false; showToast("Sei di nuovo online: dati aggiornati."); }
  if(typeof dopoRitornoOnline === "function") dopoRitornoOnline();
}
window.addEventListener("offline", vaiOffline);
window.addEventListener("online", tornaOnline);
if(!navigator.onLine) setTimeout(vaiOffline, 400);

function mostraPopAggiornamento(){
  document.getElementById("eq-pill-agg").classList.remove("attivo");
  document.getElementById("eq-pop-agg-testo").textContent = TESTO_AGGIORNAMENTO;
  const voci = Array.isArray(aggNovita?.voci) ? aggNovita.voci : [];
  document.getElementById("eq-pop-agg-novita").style.display = voci.length ? "block" : "none";
  document.getElementById("eq-pop-agg-lista").innerHTML = voci.map(v => `<li>${escapeHtml(v)}</li>`).join("");
  document.getElementById("eq-pop-agg").classList.add("attivo");
}
function segnalaAggiornamento(dati){
  aggNovita = dati || null;
  if(document.getElementById("eq-pop-agg").classList.contains("attivo") || document.getElementById("eq-pill-agg").classList.contains("attivo")) return;
  if(!navigator.onLine) return;
  mostraPopAggiornamento();
}
function aggiornaOra(){
  document.getElementById("eq-pop-agg").classList.remove("attivo");
  // ?aggiorna= dice al service worker di aspettare la versione nuova dalla rete (anche se lenta) invece della copia salvata
  const u = new URL(location.href); u.searchParams.set("aggiorna", Date.now().toString(36));
  location.replace(u.toString());
}
// tolgo ?aggiorna= dall'indirizzo dopo l'aggiornamento
try { const u = new URL(location.href); if(u.searchParams.has("aggiorna")){ u.searchParams.delete("aggiorna"); history.replaceState(history.state, "", u.pathname + u.search + u.hash); } } catch(e){}

// ---- Aggiornamento: Netlify scrive il codice di build a ogni deploy (scrivi-build.js) → pop-up "È disponibile un aggiornamento"
// È un codice INTERNO, non una versione mostrata all'utente.
const EQUO_BUILD = "__EQUO_BUILD__";
let ultimoControlloBuild = 0;
async function controllaAggiornamentoApp(){
  if(EQUO_BUILD.startsWith("__") || DEMO_MODE) return;
  if(Date.now() - ultimoControlloBuild < 5 * 60 * 1000) return;
  ultimoControlloBuild = Date.now();
  try{
    const res = await fetch("/version.json?t=" + Date.now(), { cache: "no-store" });
    if(!res.ok) return;
    const dati = await res.json();
    if(dati.build && dati.build !== EQUO_BUILD) segnalaAggiornamento(dati.novita);
  } catch(e){ /* offline: riproverà */ }
}
document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible") controllaAggiornamentoApp(); });
setInterval(controllaAggiornamentoApp, 30 * 60 * 1000);
setTimeout(controllaAggiornamentoApp, 5000);

/* =====================================================================
   SEMAFORO SCADENZE (preavviso diverso per tipo) — riquadri, pallino del cavallo, contatore del menu
   ===================================================================== */
const PREAVVISO_GIORNI = { vaccino:30, coggins:30, sverminazione:14, ferratura:10, altro:10 };
function giorniA(iso){ const o = new Date(); o.setHours(0,0,0,0); const d = new Date(iso + "T00:00"); return Math.round((d - o) / 86400000); }
function pallinoCavallo(cavalloId){
  const ultimi = {};
  eventiAll.filter(e => e.cavallo_id === cavalloId).forEach(e => {
    const k = e.tipo + "|" + (e.tipo === "altro" ? (e.tipo_altro || "") : "");
    if(!ultimi[k] || e.data_evento > ultimi[k].data_evento) ultimi[k] = e;
  });
  const conScad = Object.values(ultimi).filter(e => e.data_scadenza).map(e => ({ e, g: giorniA(e.data_scadenza), nome: e.tipo === "altro" ? (e.tipo_altro || "Altro") : TIPO_LABELS[e.tipo] }));
  if(!conScad.length) return { col: "grigio", testo: "Nessuna scadenza registrata per questo cavallo." };
  const scadute = conScad.filter(x => x.g < 0).sort((a, b) => a.g - b.g);
  if(scadute.length) return { col: "rosso", testo: scadute.map(x => `${x.nome} scaduto da ${-x.g} ${-x.g === 1 ? "giorno" : "giorni"}`).join(" · ") };
  const vicine = conScad.filter(x => x.g <= (PREAVVISO_GIORNI[x.e.tipo] ?? 10)).sort((a, b) => a.g - b.g);
  if(vicine.length) return { col: "ocra", testo: vicine.map(x => `${x.nome} ${x.g === 0 ? "scade oggi" : "tra " + x.g + (x.g === 1 ? " giorno" : " giorni")}`).join(" · ") };
  const prossima = conScad.sort((a, b) => a.g - b.g)[0];
  return { col: "verde", testo: `Tutto in regola · prossima: ${prossima.nome} il ${formatDate(prossima.e.data_scadenza)}` };
}
function pallinoHtml(cavalloId){
  const p = pallinoCavallo(cavalloId);
  return `<span class="sem-dot ${p.col}" data-tip="${escapeHtml(p.testo)}"></span>`;
}

/* =====================================================================
   BOX / STALLA — box disegnati, stato del cavallo, icone del giorno.
   Pronto per GPS / telecamere / display touch: ogni azione ha una "fonte" (oggi manuale).
   Pacchetti: START visibili ma bloccati, ADVANCE 20 box, PREMIUM 100 (controllo anche nel database).
   ===================================================================== */
let boxNote = {};   // cavallo_id -> nota "N" (segue il cavallo)
let boxList = [], boxAttivita = [], boxCanale = null, boxRicaricaTimer = null, boxPannelloId = null, boxOrologioTimer = null;
const BOX_ICONE = {
  pasto_mattina: { nome:"Pasto mattina", icon:"fa-bowl-food", col:"#b7862b", tip:"Pasto del mattino: tocca quando il cavallo ha mangiato." },
  pasto_sera:    { nome:"Pasto sera", icon:"fa-bowl-rice", col:"#8a5a2b", tip:"Pasto della sera: tocca quando il cavallo ha mangiato." },
  fieno:         { nome:"Fieno", icon:"fa-wheat-awn", col:"#9a7b2f", tip:"Razione di fieno data." },
  acqua:         { nome:"Acqua", icon:"fa-droplet", col:"#2f79b7", tip:"Acqua controllata / abbeveratoio pulito." },
  paddock:       { nome:"Paddock", icon:"fa-tree", col:"#3f7a45", tip:"È uscito al paddock o al campo oggi." },
  lavorato:      { nome:"Lavorato", icon:"fa-horse", col:"#1d4a35", tip:"È stato lavorato oggi (lezione, allenamento, longia)." },
  farmaco:       { nome:"Farmaco", icon:"fa-pills", col:"#c0473d", tip:"Farmaco o terapia somministrati oggi." },
  box_pulito:    { nome:"Box pulito", icon:"fa-broom", col:"#6b4fa0", tip:"Box pulito e lettiera sistemata oggi." },
  integratore:   { nome:"Integratore", icon:"fa-capsules", col:"#5d8f4e", tip:"Integratore dato oggi.", extra:true },
  coperta:       { nome:"Coperta", icon:"fa-rug", col:"#7a6a55", tip:"Coperta messa (o cambiata) oggi.", extra:true },
  zoccoli:       { nome:"Zoccoli", icon:"svg:horseshoe", col:"#5f6b73", tip:"Zoccoli puliti e controllati oggi.", extra:true },
  grooming:      { nome:"Grooming", icon:"fa-brush", col:"#b0567a", tip:"Governato / strigliato oggi.", extra:true },
};
const BOX_STATI = {
  in_box:      { nome:"In box", icon:"fa-house" },
  paddock:     { nome:"Al paddock", icon:"fa-tree" },
  lavoro:      { nome:"In lavoro", icon:"fa-horse" },
  maniscalco:  { nome:"Dal maniscalco", icon:"svg:horseshoe" },
  veterinario: { nome:"Visita veterinaria", icon:"fa-stethoscope" },
  riposo:      { nome:"A riposo", icon:"fa-bed" },
  isolamento:  { nome:"In isolamento", icon:"fa-shield-virus" },
  fuori_sede:  { nome:"Fuori sede", icon:"fa-truck" },
};
const BOX_MOTIVI = { pulizia:"Pulizia", disinfezione:"Disinfezione", riparazione:"Riparazione", altro:"Altro" };
const oggiRoma = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
const boxBloccati = () => !!(pianoCentro && Number(pianoCentro.box) === 0);
const boxLimite = () => pianoCentro ? Number(pianoCentro.box ?? 100) : 100;
const boxPuoGestire = () => DEMO_MODE || currentMembro?.ruolo === "admin" || ["admin","2","3"].includes(String(currentMembro?.livello)) || currentCentro?.owner_id === currentUser?.id;
function boxIconeAttive(){ const extra = currentCentro?.box_icone_extra || []; return Object.keys(BOX_ICONE).filter(k => !BOX_ICONE[k].extra || extra.includes(k)); }

async function loadBox(){
  if(DEMO_MODE){
    if(!demoState.box){
      const [a, l] = demoState.cavalli;
      demoState.box = [1,2,3,4,5].map(n => ({ id:"bx" + n, centro_id:"demo-centro", numero:n, nome:null, zona:n <= 3 ? "Scuderia A" : "Scuderia B",
        cavallo_id: n === 1 ? a?.id : n === 2 ? l?.id : null, stato_cavallo: n === 2 ? "paddock" : "in_box", manutenzione: n === 4, manutenzione_motivo: n === 4 ? "pulizia" : null, manutenzione_nota:null, manutenzione_fino:null }));
      demoState.box[0].assegnato_cavallo_id = a?.id || null;
      demoState.boxAttivita = [{ box_id:"bx1", cavallo_id:a?.id, tipo:"pasto_mattina", giorno:oggiRoma(), fatto_il:new Date().toISOString(), fatto_da_nome:"Marco" }, { box_id:"bx1", cavallo_id:a?.id, tipo:"acqua", giorno:oggiRoma(), fatto_il:new Date().toISOString(), fatto_da_nome:"Marco" },
        { box_id:"bx2", cavallo_id:l?.id, tipo:"pasto_mattina", giorno:oggiRoma(), fatto_il:new Date().toISOString(), fatto_da_nome:"Sara" }, { box_id:"bx2", cavallo_id:l?.id, tipo:"paddock", giorno:oggiRoma(), fatto_il:new Date().toISOString(), fatto_da_nome:"Sara" }];
    }
    boxList = demoState.box; boxAttivita = demoState.boxAttivita;
    boxNote = {}; (demoState.cavalli || []).forEach(c => { if(c.nota_box) boxNote[c.id] = c.nota_box; });
    return;
  }
  const [b, a, n] = await Promise.all([
    sb.from("scuderia_box").select("*").eq("centro_id", currentCentro.id).order("numero"),
    sb.from("scuderia_box_attivita").select("box_id, cavallo_id, tipo, giorno, fatto_il, fatto_da_nome, fonte").eq("centro_id", currentCentro.id).eq("giorno", oggiRoma()),
    sb.from("scuderia_cavalli").select("id, nota_box").eq("centro_id", currentCentro.id).not("nota_box", "is", null),
  ]);
  if(!b.error) boxList = b.data || [];
  if(!a.error) boxAttivita = a.data || [];
  if(!n.error){ boxNote = {}; (n.data || []).forEach(c => { boxNote[c.id] = c.nota_box; }); }
}
function boxAscolta(){
  if(DEMO_MODE || !currentCentro?.id || boxCanale) return;
  const ricarica = () => { clearTimeout(boxRicaricaTimer); boxRicaricaTimer = setTimeout(async () => { await loadBox(); renderBox(); if(boxPannelloId) boxRenderPannello(); }, 350); };
  boxCanale = sb.channel("box-" + currentCentro.id)
    .on("postgres_changes", { event: "*", schema: "public", table: "scuderia_box", filter: "centro_id=eq." + currentCentro.id }, ricarica)
    .on("postgres_changes", { event: "*", schema: "public", table: "scuderia_box_attivita", filter: "centro_id=eq." + currentCentro.id }, ricarica)
    .subscribe();
}
async function refreshBoxSezione(){ await loadBox(); renderBox(); boxAscolta(); }

// le attività del giorno seguono il CAVALLO: spostandolo, le sue spunte vanno con lui
function boxAttivitaDi(boxId, tipo){
  const cav = boxList.find(x => x.id === boxId)?.cavallo_id;
  return boxAttivita.find(a => (cav ? a.cavallo_id === cav : (a.box_id === boxId && !a.cavallo_id)) && a.tipo === tipo && a.giorno === oggiRoma());
}
// colore del bordo e testi del box
function boxStato(b){
  const c = b.cavallo_id ? cavalliList.find(x => x.id === b.cavallo_id) : null;
  const ass = b.assegnato_cavallo_id ? cavalliList.find(x => x.id === b.assegnato_cavallo_id) : null;
  const propAss = ass ? (ass.proprietario || "") : "";
  let cls, tip, sotto = "";
  if(b.manutenzione && !c){ cls = "manut"; tip = "Bordo bianco: box in manutenzione"; }
  else if(ass){
    if(c && c.id === ass.id){ cls = "verde"; tip = `Bordo verde: box di proprietà${propAss ? " di " + propAss : ""} con il suo cavallo dentro`; }
    else if(c){ cls = "giallo"; tip = `Bordo giallo: box di ${propAss || ass.nome}, dentro c'è un cavallo non suo`; sotto = c.proprietario ? "Cavallo di " + c.proprietario : "Cavallo fuori dal suo box"; }
    else { cls = "rosso"; tip = `Bordo rosso: box di proprietà${propAss ? " di " + propAss : ""}, ${ass.nome} non è dentro`; }
  } else if(c){
    const suo = boxList.find(x => x.assegnato_cavallo_id === c.id && x.id !== b.id);
    if(suo){ cls = "giallo"; tip = `Bordo giallo: ${c.nome} non è nel suo box (box ${suo.numero})`; sotto = c.proprietario ? "Cavallo di " + c.proprietario : "Il suo box è il " + suo.numero; }
    else { cls = "verde"; tip = "Bordo verde: cavallo nel suo posto"; }
  } else { cls = "blu"; tip = "Bordo blu: box libero, tocca per aggiungere un cavallo"; }
  const proprietario = ass ? (propAss ? "Proprietario " + propAss : "Box di " + ass.nome) : c?.proprietario ? "Proprietario " + c.proprietario : (b.nome || "");
  return { c, ass, cls, tip, sotto, proprietario };
}
function boxCardHtml(b){
  const { c, cls: stCls, tip: tipBordo, sotto, proprietario } = boxStato(b);
  const classe = boxBloccati() ? "bloccato" : stCls;
  let centro;
  if(c){
    const st = BOX_STATI[b.stato_cavallo] || BOX_STATI.in_box;
    centro = `${c.foto_url ? `<div class="box-foto" style="background-image:${cssUrl(c.foto_url)}"></div>` : `<div class="box-nopic" data-tip="Nessuna foto: aggiungila dalla scheda del cavallo">NO<br>PICTURE</div>`}
      <div class="box-nome"><span class="t">${escapeHtml(c.nome)}</span>${pallinoHtml(c.id)}</div>
      <span class="box-chip" data-tip="Dov'è ora: si cambia dal pannello del box">${iconHtml(st.icon)} ${st.nome}</span>
      ${sotto ? `<span class="box-ospite" data-tip="Il cavallo è in un box che non è il suo">${escapeHtml(sotto)}</span>` : ""}`;
  } else if(b.manutenzione){
    centro = `<div class="box-manut-ic">${iconHtml("fa-screwdriver-wrench")}</div><div class="box-nome"><span class="t">In manutenzione</span></div>
      <div class="box-sub">${BOX_MOTIVI[b.manutenzione_motivo] || "Lavori"}${b.manutenzione_fino ? " · fino al " + formatDate(b.manutenzione_fino) : ""}</div>`;
  } else {
    centro = `<div class="box-vuoto-ic">${iconHtml("fa-plus")}</div><div class="box-nome"><span class="t">Libero</span></div><div class="box-sub">${stCls === "rosso" ? "Box riservato: il suo cavallo non è qui" : "Tocca per aggiungere un cavallo"}</div>`;
  }
  const icone = c ? `<div class="box-icone">${boxIconeAttive().map(k => { const d = BOX_ICONE[k], a = boxAttivitaDi(b.id, k);
      return `<button class="box-ic ${a ? "on" : ""}" style="--ic-col:${d.col}" data-tip="${escapeHtml(d.nome + (a ? " · fatto alle " + new Date(a.fatto_il).toLocaleTimeString("it-IT", { hour:"2-digit", minute:"2-digit" }) + (a.fatto_da_nome ? " da " + a.fatto_da_nome + (a.fonte === "groom" ? " (groom)" : "") : "") : " · da fare oggi: tocca per segnarlo"))}"
        onclick="event.stopPropagation();boxToggleIcona('${b.id}','${k}')">${iconHtml(d.icon)}</button>`; }).join("")}</div>` : "";
  const nota = c ? boxNote[c.id] : null;
  const notaBtn = c ? `<button class="box-nota ${nota ? "on" : ""}" data-tip="${escapeHtml(nota ? "Nota su " + c.nome + ": " + nota : "Nessuna nota su " + c.nome + ": tocca per scriverne una")}" onclick="event.stopPropagation();boxApriNota('${c.id}')">N</button>` : "";
  return `<div class="box-card ${classe}" data-box="${b.id}" ${c ? `data-cav="${c.id}"` : ""} data-tip="${escapeHtml(tipBordo + (c && boxPuoGestire() ? " · tieni premuto e trascina per spostarlo" : ""))}" onclick="${boxBloccati() ? "apriUpsell('box')" : `boxApri('${b.id}')`}">
    <div class="box-trave"><span class="box-targa">BOX ${b.numero}</span><span class="box-zona">${escapeHtml(proprietario)}</span></div>
    <div class="box-corpo">${notaBtn}<div class="box-centro">${centro}</div>${icone}</div>
    <div class="box-porta" aria-hidden="true"></div>
    ${boxBloccati() ? `<div class="box-lucchetto"><i class="fa-solid fa-lock"></i>Disponibile da ADVANCE</div>` : ""}
  </div>`;
}
function renderBox(){
  const el = document.getElementById("box-griglia"); if(!el) return;
  const n = { verde: 0, giallo: 0, rosso: 0, blu: 0, manut: 0 };
  boxList.forEach(b => { n[boxStato(b).cls]++; });
  document.getElementById("box-conta").innerHTML = `<span data-tip="Box creati / massimo del tuo pacchetto"><b>${boxList.length}</b> box${boxBloccati() ? "" : " su " + boxLimite()}</span>
    <span data-tip="Box di proprietà con il suo cavallo, o cavallo nel suo posto"><i class="l bv"></i>${n.verde} al loro posto</span>
    <span data-tip="Cavallo in un box che non è il suo"><i class="l bg"></i>${n.giallo} fuori posto</span>
    <span data-tip="Box di proprietà senza il suo cavallo dentro"><i class="l br"></i>${n.rosso} riservati vuoti</span>
    <span data-tip="Box libero, non assegnato"><i class="l bb"></i>${n.blu} liberi</span>
    <span data-tip="Box in manutenzione"><i class="l bm"></i>${n.manut} in manutenzione</span>`;
  const puoAgg = !boxBloccati() && boxPuoGestire() && boxList.length < boxLimite();
  el.innerHTML = boxList.map(boxCardHtml).join("") + (puoAgg ? `<div class="box-card box-nuovo" onclick="boxNuovo()" data-tip="Crea un nuovo box con il primo numero libero (da 1 a 100)"><i class="fa-solid fa-plus" style="font-size:20px"></i> Nuovo box</div>` : "");
  document.getElementById("box-btn-impost").style.display = !boxBloccati() && boxPuoGestire() ? "" : "none";
}

async function boxNuovo(){
  if(boxBloccati()){ apriUpsell("box"); return; }
  if(boxList.length >= boxLimite()){ showToast(`Hai già ${boxLimite()} box: è il massimo del tuo pacchetto${boxLimite() < 100 ? " (PREMIUM arriva a 100)" : ""}.`); return; }
  const usati = new Set(boxList.map(b => b.numero));
  let n = 1; while(usati.has(n) && n <= 100) n++;
  if(n > 100){ showToast("Hai raggiunto il limite di 100 box."); return; }
  if(DEMO_MODE){ demoState.box.push({ id:"bx" + Date.now(), centro_id:"demo-centro", numero:n, cavallo_id:null, stato_cavallo:"in_box", manutenzione:false }); demoState.box.sort((a, b) => a.numero - b.numero); }
  else {
    const { error } = await sb.from("scuderia_box").insert({ centro_id: currentCentro.id, numero: n });
    if(error){ showToast(error.message); return; }
  }
  showToast(`Box ${n} creato.`);
  await refreshBoxSezione();
}
async function boxAggiorna(id, campi){
  if(DEMO_MODE){ const b = demoState.box.find(x => x.id === id); Object.assign(b, campi); if(campi.cavallo_id === null) b.stato_cavallo = "in_box"; if(campi.manutenzione === false){ b.manutenzione_motivo = null; b.manutenzione_nota = null; b.manutenzione_fino = null; } }
  else {
    const { error } = await sb.from("scuderia_box").update(campi).eq("id", id);
    if(error){ showToast(error.message); return false; }
  }
  await loadBox(); renderBox(); return true;
}
async function boxToggleIcona(boxId, tipo){
  if(boxBloccati()){ apriUpsell("box"); return; }
  const esiste = boxAttivitaDi(boxId, tipo);
  if(DEMO_MODE){
    if(esiste) demoState.boxAttivita = demoState.boxAttivita.filter(a => a !== esiste);
    else demoState.boxAttivita.push({ box_id: boxId, cavallo_id: boxList.find(x => x.id === boxId)?.cavallo_id || null, tipo, giorno: oggiRoma(), fatto_il: new Date().toISOString(), fatto_da_nome: currentMembro?.nome_visualizzato || "Tu" });
    boxAttivita = demoState.boxAttivita;
  } else {
    // aggiornamento immediato a schermo, poi il database
    if(esiste) boxAttivita = boxAttivita.filter(a => a !== esiste);
    const cav = boxList.find(x => x.id === boxId)?.cavallo_id || null;
    if(!esiste) boxAttivita = [...boxAttivita, { box_id: boxId, cavallo_id: cav, tipo, giorno: oggiRoma(), fatto_il: new Date().toISOString(), fatto_da_nome: currentMembro?.nome_visualizzato || "" }];
    renderBox(); if(boxPannelloId) boxRenderPannello();
    const r = esiste
      ? (cav ? await sb.from("scuderia_box_attivita").delete().eq("cavallo_id", cav).eq("tipo", tipo).eq("giorno", oggiRoma())
             : await sb.from("scuderia_box_attivita").delete().eq("box_id", boxId).is("cavallo_id", null).eq("tipo", tipo).eq("giorno", oggiRoma()))
      : await sb.from("scuderia_box_attivita").insert({ centro_id: currentCentro.id, box_id: boxId, cavallo_id: cav, tipo });
    if(r.error){ showToast(r.error.message); }
    await loadBox();
  }
  renderBox(); if(boxPannelloId) boxRenderPannello();
}

