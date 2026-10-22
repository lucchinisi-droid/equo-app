/* ===== DIARIO · fase 1 (14/10/2026): foto, note e vocali del cavallo ===== */
let diarioHorseId = null, diarioVoci = [], diarioTipo = "foto", diarioCat = "allenamento", diarioFile = null, diarioRec = null, diarioRecChunks = [], diarioRecBlob = null, diarioRecTimer = null, diarioUrl = {}, diarioFiltro = null, diarioDataNuova = null, diarioMeseOff = 0, diarioDetId = null, diarioDetCat = null, diarioSettOff = 0, diarioShareBlob = null;
const DIARIO_CATS = [["allenamento","Allenamento"],["passeggiata","Passeggiata"],["lezione","Lezione"],["cura","Cura"],["traguardo","Traguardo"],["altro","Altro"]];
function dKey(d){ return new Date(d).toLocaleDateString("sv-SE"); }
function dEtichetta(k){ return new Date(k + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }); }
function diarioCavallo(){
  const lista = cavalliUsabili();
  if(!lista.length) return null;
  if(!diarioHorseId || !lista.some(h => h.id === diarioHorseId)) diarioHorseId = (lista.some(h => h.id === currentHorseId) ? currentHorseId : lista[0].id);
  return lista.find(h => h.id === diarioHorseId);
}
const firmaTs = {};
async function firmaUrl(bucket, paths, mappa){ await firmaUrlBase(bucket, paths, mappa); await eseguiEstensioni(estensioniDopo, "firmaUrl", [bucket, paths, mappa]); }
async function firmaUrlBase(bucket, paths, mappa){
  const adesso = Date.now();
  const valido = (u) => u && !/undefined/.test(u);
  // rifirma anche gli indirizzi piu vecchi di 40 minuti (durano 60): l'app resta aperta a lungo
  const da = [...new Set(paths.filter(p => p && (!valido(mappa[p]) || adesso - (firmaTs[bucket + "|" + p] || 0) > 2400000)))];
  if(!da.length) return;
  try{
    const r = await sb.storage.from(bucket).createSignedUrls(da, 3600);
    if(r.error) console.warn("firma file:", r.error.message);
    (r.data || []).forEach(x => { if(x && x.path && valido(x.signedUrl)){ mappa[x.path] = x.signedUrl; firmaTs[bucket + "|" + x.path] = adesso; } });
  } catch(e){ console.warn("firma file:", e && e.message); }
  // se qualcuna non e stata firmata, riprova una per una
  for(const p of da.filter(p => !valido(mappa[p]) || firmaTs[bucket + "|" + p] !== adesso)){
    try{ const r = await sb.storage.from(bucket).createSignedUrl(p, 3600); if(r.error) console.warn("firma file:", r.error.message); if(r.data && valido(r.data.signedUrl)){ mappa[p] = r.data.signedUrl; firmaTs[bucket + "|" + p] = adesso; } } catch(e){}
  }
}
async function diarioFetch(horseId){
  if(DEMO_MODE) return [];
  const { data, error } = await sb.from("diario_voci").select("*").eq("horse_id", horseId).eq("nascosta", false).order("data_voce", { ascending: false }).limit(300);
  if(error){ showToast("Diario non disponibile: " + (error.message || "errore")); return []; }
  await firmaUrl("diario-media", (data || []).map(v => v.media_path), diarioUrl);
  return data || [];
}
function diarioStats(voci){
  const giorni = new Set(voci.map(v => dKey(v.data_voce)));
  let streak = 0; const d = new Date();
  if(!giorni.has(dKey(d))) d.setDate(d.getDate() - 1);
  while(giorni.has(dKey(d))){ streak++; d.setDate(d.getDate() - 1); }
  const m = dKey(new Date()).slice(0, 7);
  return { streak, mese: voci.filter(v => dKey(v.data_voce).slice(0, 7) === m).length, tot: voci.length };
}
function diarioFotoUrl(v){ return v.tipo === "foto" && v.media_path ? diarioUrl[v.media_path] : null; }
function diarioFotoGiorno(k){ const v = diarioVoci.find(x => dKey(x.data_voce) === k && x.tipo === "foto"); return v ? diarioFotoUrl(v) : null; }
const DIARIO_ICONE = { foto: "fa-camera", video: "fa-video", vocale: "fa-microphone", nota: "fa-pen" };
function diarioIconeGiorno(k){
  const tipi = [...new Set(diarioVoci.filter(x => dKey(x.data_voce) === k).map(x => x.tipo))];
  return tipi.length ? '<span class="ic">' + tipi.slice(0, 3).map(t => `<i class="fa-solid ${DIARIO_ICONE[t] || "fa-circle"}"></i>`).join("") + '</span>' : "";
}
function diarioSettVai(n){
  diarioSettOff = Math.min(0, Math.max(-52, diarioSettOff + n));
  diarioRender();
}
function diarioSheet(titolo, corpo){
  document.getElementById("dr-sheet-t").innerHTML = titolo;
  document.getElementById("dr-sheet-b").innerHTML = corpo;
  openModal("modal-dr-sheet");
}
async function diarioCarica(){
  const h = diarioCavallo(), box = document.getElementById("diario-corpo");
  if(!box) return;
  if(!h){ box.innerHTML = '<div class="dr-vuota">Aggiungi il tuo primo cavallo per iniziare il Diario.<br><br><button class="dr-btn o" onclick="showPage(\'cavalli\');openHorseForm()">Aggiungi cavallo</button></div>'; return; }
  box.innerHTML = '<div class="loading"><div class="spinner"></div> Caricamento...</div>';
  diarioVoci = await diarioFetch(h.id);
  await albumFetch(h.id);
  diarioRender();
}
// dopo ogni modifica: ricarica i dati e ridisegna Diario (se aperto) e Home
async function diarioAggiorna(){
  const h = diarioCavallo(); if(!h) return;
  diarioVoci = await diarioFetch(h.id);
  await albumFetch(h.id);
  if(document.getElementById("page-diario").classList.contains("active")) diarioRender();
  diarioHomeRender();
}
function diarioRender(){
  const h = diarioCavallo(), box = document.getElementById("diario-corpo");
  if(!h || !box) return;
  const st = diarioStats(diarioVoci);
  const chips = cavalliUsabili().length > 1 ? '<div class="dr-chips">' + cavalliUsabili().map(x => `<button class="dr-chip${x.id === h.id ? " on" : ""}" onclick="diarioScegli('${x.id}')">${escapeHtml(x.name)}</button>`).join("") + '</div>' : "";
  const sub = [h.codice_equo ? "Equo n. " + h.codice_equo : "", h.breed || ""].filter(Boolean).join(" · ");
  let sett = "";
  const giorniIt = ["D","L","M","M","G","V","S"];
  const fineSett = new Date(); fineSett.setDate(fineSett.getDate() + diarioSettOff * 7);
  const inizioSett = new Date(fineSett); inizioSett.setDate(inizioSett.getDate() - 6);
  const mese = (d) => d.toLocaleDateString("it-IT", { month: "short" });
  const etichettaSett = diarioSettOff === 0 ? "Ultimi 7 giorni" : inizioSett.getDate() + " " + mese(inizioSett) + " – " + fineSett.getDate() + " " + mese(fineSett);
  const oggiK = dKey(new Date());
  for(let i = 6; i >= 0; i--){
    const d = new Date(fineSett); d.setDate(d.getDate() - i);
    const k = dKey(d), n = diarioVoci.filter(x => dKey(x.data_voce) === k).length, f = diarioFotoGiorno(k);
    sett += `<div class="g">${giorniIt[d.getDay()]}<button class="m${n ? " f" : ""}${f ? " foto" : ""}${k === oggiK ? " og" : ""}" ${f ? `style="background-image:url('${f}')"` : ""} onclick="diarioGiorno('${k}')">${diarioIconeGiorno(k)}${d.getDate()}</button></div>`;
  }
  sett = `<div class="dr-sett-w"><div class="dr-sett-nav"><button onclick="diarioSettVai(-1)" aria-label="Settimana precedente">‹</button><span>${etichettaSett}</span><button onclick="diarioSettVai(1)" aria-label="Settimana successiva"${diarioSettOff >= 0 ? " disabled" : ""}>›</button></div><div class="dr-sett">${sett}</div></div>`;
  const visibili = diarioFiltro ? diarioVoci.filter(v => v.categoria === diarioFiltro) : diarioVoci;
  const cats = DIARIO_CATS.filter(c => diarioVoci.some(v => v.categoria === c[0]));
  const filtro = cats.length > 1 ? '<div class="dr-chips"><button class="dr-chip' + (!diarioFiltro ? " on" : "") + '" onclick="diarioFiltra(null)">Tutti</button>' + cats.map(c => `<button class="dr-chip${diarioFiltro === c[0] ? " on" : ""}" onclick="diarioFiltra('${c[0]}')">${c[1]}</button>`).join("") + '</div>' : "";
  const lista = (visibili.length ? visibili.map(diarioVoceHtml).join("") : (diarioVoci.length ? '<div class="dr-vuota">Nessun momento in questa categoria.</div>' : '<div class="dr-vuota">Il Diario di ' + escapeHtml(h.name) + ' è ancora vuoto.<br>Tocca il <b>+</b> per scrivere il primo momento: una foto, una nota o un vocale.</div>')) + (diarioVoci.length < 6 ? '<div class="eq-tit"><b>Da Equo</b><span>per iniziare</span></div>' + equoCardsHtml(Math.max(3, 7 - diarioVoci.length)) : "");
  box.innerHTML = chips +
    `<div class="dr-hero" style="background-image:url('${cavalloHero(h)}')" onclick="apriSchedaCavallo('${h.id}')"><span class="sch">Scheda e album</span><div class="c"><div class="n">${escapeHtml(h.name)}</div><div class="s">${escapeHtml(sub)}</div></div></div>` +
    `<div class="dr-stat"><button onclick="diarioInfo('streak')"><b>${st.streak}</b><span>giorni di fila</span></button><button onclick="diarioInfo('mese')"><b>${st.mese}</b><span>momenti del mese</span></button><button onclick="diarioInfo('tot')"><b>${st.tot}</b><span>nel Diario</span></button></div>` +
    sett + filtro + lista;
  const sw = box.querySelector(".dr-sett-w");
  if(sw){
    let x0 = null;
    sw.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
    sw.addEventListener("touchend", e => { if(x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if(Math.abs(dx) > 45) diarioSettVai(dx > 0 ? -1 : 1); });
  }
}
function diarioVoceHtml(v){
  const d = new Date(v.data_voce), quando = d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" }) + " · " + d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  const url = v.media_path ? diarioUrl[v.media_path] : null;
  const cat = DIARIO_CATS.find(c => c[0] === v.categoria);
  let corpo = "";
  if(v.tipo === "foto") corpo += url ? `<div class="im" style="background-image:url('${url}')"></div>` : '<div class="im" style="display:flex;flex-direction:column;gap:6px;align-items:center;justify-content:center;color:var(--muted);font-size:13px"><i class="fa-solid fa-camera" style="font-size:22px"></i>Foto non disponibile: tocca per riprovare</div>';
  corpo += '<div class="rg">';
  if(v.testo) corpo += `<div class="t">${escapeHtml(v.testo)}</div>`;
  if(v.tipo === "vocale" && url) corpo += `<audio controls preload="none" src="${url}" onclick="event.stopPropagation()"></audio>`;
  corpo += `<div class="m"><span>${quando}</span>${cat ? `<span class="tag">${cat[1]}</span>` : ""}<span class="nasc">Apri ›</span></div></div>`;
  return `<div class="dr-voce" onclick="diarioDettaglio('${v.id}')">${corpo}</div>`;
}
function diarioScegli(id){ diarioHorseId = id; diarioFiltro = null; diarioCarica(); }
function diarioFiltra(c){ diarioFiltro = c; closeModal("modal-dr-sheet"); diarioRender(); }
