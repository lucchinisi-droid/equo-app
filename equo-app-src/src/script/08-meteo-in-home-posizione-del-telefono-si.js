
/* Meteo in Home: posizione del telefono (si chiede il permesso solo con un tocco; poi si usa l'ultima posizione nota) */
let meteoPosChiesta = false;
function meteoUltimaPos(){ try{ return JSON.parse(localStorage.getItem("equo-meteo-pos") || "null"); }catch(e){ return null; } }
async function meteoPosizioneTelefono(){
  if(DEMO_MODE) return { demo: true };
  if(!navigator.geolocation) return { messaggio: { testo: "Questo dispositivo non fornisce la posizione per il meteo.", icona: "fa-location-crosshairs" } };
  const ult = meteoUltimaPos();
  let stato = "prompt";
  try{ stato = (await navigator.permissions.query({ name: "geolocation" })).state; }catch(e){ stato = ult ? "granted" : "prompt"; }
  if(stato === "denied") return ult || { messaggio: { testo: "Posizione non consentita: attivala nelle impostazioni del telefono per vedere il meteo.", icona: "fa-location-dot" } };
  if(stato === "prompt" && !meteoPosChiesta){
    if(ult) return ult;
    return { messaggio: { testo: "Meteo dei prossimi 7 giorni:", link: "tocca per usare la tua posizione", icona: "fa-cloud-sun", azione: () => { meteoPosChiesta = true; meteoHome(true); } } };
  }
  const p = await new Promise(res => navigator.geolocation.getCurrentPosition(x => res(x), () => res(null), { enableHighAccuracy: false, timeout: 10000, maximumAge: 30 * 60e3 }));
  if(!p) return ult || { messaggio: { testo: "Non riesco a leggere la posizione.", link: "Riprova", icona: "fa-location-dot", azione: () => { meteoPosChiesta = true; meteoHome(true); } } };
  const pos = { lat: Math.round(p.coords.latitude * 100) / 100, lon: Math.round(p.coords.longitude * 100) / 100 };
  try{ localStorage.setItem("equo-meteo-pos", JSON.stringify(pos)); }catch(e){}
  return pos;
}
function meteoHome(forza){
  if(typeof EquoMeteo === "undefined" || !currentUser) return;
  const pro = document.getElementById("page-pro-home")?.classList.contains("active");
  const el = document.getElementById(pro ? (document.body.classList.contains("home-man") ? "hm-meteo" : "meteo-pro") : "meteo-owner");
  if(!el) return;
  EquoMeteo.monta(el, {
    endpoint: "/.netlify/functions/meteo",
    token: async () => { try{ return (await sb.auth.getSession()).data.session?.access_token || ""; }catch(e){ return ""; } },
    posizione: meteoPosizioneTelefono,
  });
  if(forza) EquoMeteo.ricarica(el);
}
document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible") try{ meteoHome(); }catch(e){} });

/* ===== DIARIO · fase 1 (14/10/2026): foto, note e vocali del cavallo ===== */
let diarioHorseId = null, diarioVoci = [], diarioTipo = "foto", diarioCat = "allenamento", diarioFile = null, diarioRec = null, diarioRecChunks = [], diarioRecBlob = null, diarioRecTimer = null, diarioUrl = {}, diarioFiltro = null, diarioDataNuova = null, diarioMeseOff = 0, diarioDetId = null, diarioDetCat = null, diarioSettOff = 0, diarioShareBlob = null;
const DIARIO_CATS = [["allenamento","Allenamento"],["passeggiata","Passeggiata"],["lezione","Lezione"],["cura","Cura"],["traguardo","Traguardo"],["altro","Altro"]];
function dKey(d){ return new Date(d).toLocaleDateString("sv-SE"); }
function dEtichetta(k){ return new Date(k + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }); }
function diarioCavallo(){
  if(!horses || !horses.length) return null;
  if(!diarioHorseId || !horses.some(h => h.id === diarioHorseId)) diarioHorseId = (horses.some(h => h.id === currentHorseId) ? currentHorseId : horses[0].id);
  return horses.find(h => h.id === diarioHorseId);
}
const firmaTs = {};
async function firmaUrl(bucket, paths, mappa){
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
  const chips = horses.length > 1 ? '<div class="dr-chips">' + horses.map(x => `<button class="dr-chip${x.id === h.id ? " on" : ""}" onclick="diarioScegli('${x.id}')">${escapeHtml(x.name)}</button>`).join("") + '</div>' : "";
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
/* ---- sezioni dei tasti ---- */
function diarioInfo(tipo){
  const h = diarioCavallo(), st = diarioStats(diarioVoci);
  if(tipo === "streak"){
    let righe = "";
    for(let i = 13; i >= 0; i--){ const d = new Date(); d.setDate(d.getDate() - i); const k = dKey(d), n = diarioVoci.some(x => dKey(x.data_voce) === k); righe += `<button class="dr-dot${n ? " on" : ""}" onclick="diarioGiorno('${k}')">${d.getDate()}</button>`; }
    diarioSheet("Giorni di fila", `<div style="font-family:Fraunces,serif;font-size:34px;font-weight:700">${st.streak}</div><div class="muted" style="font-size:13.5px;line-height:1.5;margin:4px 0 12px">Conta i giorni consecutivi in cui scrivi almeno un momento nel Diario di ${escapeHtml(h.name)}. Anche una riga basta. Se salti un giorno la serie riparte.</div><div class="dr-dots">${righe}</div><div class="muted" style="font-size:12px;margin:6px 0 14px">Ultimi 14 giorni · tocca un giorno per aprirlo</div><button class="btn btn-primary" style="width:100%" onclick="closeModal('modal-dr-sheet');diarioApri('foto')">Scrivi un momento oggi</button>`);
  } else if(tipo === "mese"){
    diarioMeseVista(0);
  } else {
    const righe = DIARIO_CATS.map(c => [c, diarioVoci.filter(v => v.categoria === c[0]).length]).filter(x => x[1]);
    const tipi = ["foto","nota","vocale"].map(t => [t, diarioVoci.filter(v => v.tipo === t).length]);
    diarioSheet("Tutto il Diario", `<div class="muted" style="font-size:13.5px;margin-bottom:10px">${st.tot} momenti di ${escapeHtml(h.name)}: ${tipi[0][1]} foto, ${tipi[1][1]} note, ${tipi[2][1]} vocali. Scegli una categoria per vederli.</div>` +
      (righe.length ? righe.map(x => `<button class="dr-riga" onclick="diarioFiltra('${x[0][0]}')"><span>${x[0][1]}</span><b>${x[1]}</b></button>`).join("") : '<div class="dr-vuota">Ancora nessun momento.</div>') +
      `<button class="btn btn-outline" style="width:100%;margin-top:10px" onclick="diarioFiltra(null)">Mostra tutti</button>`);
  }
}
function diarioMeseVista(off){
  diarioMeseOff += off; if(!off) diarioMeseOff = 0;
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + diarioMeseOff);
  const y = base.getFullYear(), m = base.getMonth(), giorni = new Date(y, m + 1, 0).getDate(), primo = (new Date(y, m, 1).getDay() + 6) % 7;
  let celle = ""; for(let i = 0; i < primo; i++) celle += "<span></span>";
  for(let g = 1; g <= giorni; g++){
    const k = y + "-" + String(m + 1).padStart(2, "0") + "-" + String(g).padStart(2, "0"), n = diarioVoci.filter(x => dKey(x.data_voce) === k).length, f = diarioFotoGiorno(k);
    celle += `<button class="m${n ? " f" : ""}${f ? " foto" : ""}" ${f ? `style="background-image:url('${f}')"` : ""} onclick="diarioGiorno('${k}')">${diarioIconeGiorno(k)}${g}</button>`;
  }
  const nome = base.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  const nMese = diarioVoci.filter(x => dKey(x.data_voce).slice(0, 7) === y + "-" + String(m + 1).padStart(2, "0")).length;
  diarioSheet(`<span style="display:flex;align-items:center;gap:10px"><button class="dr-chip" onclick="diarioMeseVista(-1)">‹</button><span style="flex:1;text-align:center;text-transform:capitalize">${nome}</span><button class="dr-chip" onclick="diarioMeseVista(1)">›</button></span>`,
    `<div class="muted" style="font-size:13px;margin-bottom:8px;text-align:center">${nMese} ${nMese === 1 ? "momento" : "momenti"} · tocca un giorno</div><div class="dr-sett" style="grid-template-columns:repeat(7,1fr)">${["L","M","M","G","V","S","D"].map(x => `<div class="g">${x}</div>`).join("")}${celle}</div>`);
}
function diarioGiorno(k){
  const del = diarioVoci.filter(x => dKey(x.data_voce) === k);
  const futuro = k > dKey(new Date());
  diarioSheet(`<span style="text-transform:capitalize">${dEtichetta(k)}</span>`,
    (del.length ? del.map(v => { const url = v.media_path ? diarioUrl[v.media_path] : null; const c = DIARIO_CATS.find(x => x[0] === v.categoria);
      return `<button class="dr-riga" style="gap:12px" onclick="diarioDettaglio('${v.id}')"><span class="dr-mini" ${v.tipo === "foto" && url ? `style="background-image:url('${url}')"` : ""}>${v.tipo === "foto" && url ? "" : `<i class="fa-solid ${DIARIO_ICONE[v.tipo] || "fa-circle"}"></i>`}</span><span style="flex:1;text-align:left"><b style="display:block;font-size:14px">${v.tipo === "foto" ? "Foto" : v.tipo === "vocale" ? "Vocale" : "Nota"}${c ? " · " + c[1] : ""}</b><span class="muted" style="font-size:12.5px">${escapeHtml((v.testo || "").slice(0, 60)) || new Date(v.data_voce).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</span></span><span>›</span></button>`; }).join("")
      : '<div class="dr-vuota">Nessun momento in questo giorno.</div>') +
    (futuro ? "" : `<button class="btn btn-primary" style="width:100%;margin-top:10px" onclick="closeModal('modal-dr-sheet');diarioApri('foto','${k}')">Aggiungi un momento${k === dKey(new Date()) ? "" : " per questo giorno"}</button>`));
}
async function diarioDettaglio(id){
  const v = diarioVoci.find(x => x.id === id); if(!v) return;
  if(v.media_path && !diarioUrl[v.media_path]) await firmaUrl("diario-media", [v.media_path], diarioUrl);
  diarioDetId = id; diarioDetCat = v.categoria || null;
  const url = v.media_path ? diarioUrl[v.media_path] : null;
  diarioShareBlob = null;
  if(v.tipo === "foto" && url){ fetch(url).then(r => r.blob()).then(diarioMarchia).then(b => { diarioShareBlob = { id, b }; }).catch(() => {}); }
  const d = new Date(v.data_voce);
  diarioSheet(`<span style="text-transform:capitalize">${d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}</span>`,
    (v.tipo === "foto" && url ? `<img src="${url}" alt="" style="width:100%;max-height:320px;object-fit:cover;border-radius:16px;margin-bottom:10px">` : "") +
    (v.tipo === "vocale" && url ? `<audio controls src="${url}" style="width:100%;margin-bottom:10px"></audio>` : "") +
    `<div class="muted" style="font-size:12px;margin-bottom:8px">${d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })} · visibile solo a te</div>` +
    `<textarea class="input" id="dr-det-testo" rows="3" maxlength="2000" placeholder="Aggiungi una riga">${escapeHtml(v.testo || "")}</textarea>` +
    `<div class="dr-chips" style="margin-top:10px" id="dr-det-cats">${DIARIO_CATS.map(c => `<button type="button" class="dr-chip${c[0] === diarioDetCat ? " on" : ""}" onclick="diarioDetCatScegli('${c[0]}')">${c[1]}</button>`).join("")}</div>` +
    `<button class="btn btn-primary" style="width:100%;margin-bottom:8px" onclick="diarioDetSalva()">Salva modifiche</button>` +
    (v.tipo === "foto" ? `<button class="btn btn-outline" style="width:100%;margin-bottom:8px" onclick="diarioNellAlbum()">Metti nell'album del cavallo</button>` : "") +
    (v.tipo === "foto" || v.tipo === "nota" ? `<button class="btn btn-outline" style="width:100%;margin-bottom:8px" onclick="diarioCondividi('${v.id}')"><i class="fa-brands fa-instagram"></i> Condividi su Instagram</button>` : "") +
    `<button class="btn btn-outline" style="width:100%" onclick="diarioNascondi('${v.id}')">Nascondi dal Diario</button>`);
}
/* logo Equo + Equohub.com in basso a destra, solo sulla copia che si condivide (la foto salvata non cambia) */
function diarioCaricaImg(src){ return new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ko(new Error("immagine")); i.src = src; }); }
async function diarioMarchia(blob){
  try{
    const url = URL.createObjectURL(blob);
    const [foto, logo] = await Promise.all([diarioCaricaImg(url), diarioCaricaImg("assets/equo/logo-share.png")]);
    URL.revokeObjectURL(url);
    const W = foto.naturalWidth, H = foto.naturalHeight, c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d"); g.drawImage(foto, 0, 0, W, H);
    const lato = Math.min(W, H), L = Math.round(lato * 0.15), m = Math.round(lato * 0.035), f = Math.round(L * 0.25);
    g.font = "700 " + f + "px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
    const testo = "Equohub.com", tw = g.measureText(testo).width, bloccoW = Math.max(L, tw);
    const cx = W - m - bloccoW / 2, yLogo = H - m - f - Math.round(f * 0.45) - L;
    g.save(); g.shadowColor = "rgba(0,0,0,.45)"; g.shadowBlur = Math.round(L * 0.12); g.shadowOffsetY = Math.round(L * 0.02);
    g.drawImage(logo, Math.round(cx - L / 2), yLogo, L, L);
    g.fillStyle = "#ffffff"; g.textAlign = "center"; g.textBaseline = "top";
    g.fillText(testo, cx, yLogo + L + Math.round(f * 0.35));
    g.restore();
    return await new Promise((ok, ko) => c.toBlob(b => b ? ok(b) : ko(new Error("marchio")), "image/jpeg", 0.9));
  } catch(e){ return blob; }
}
async function diarioCondividi(id){
  const v = diarioVoci.find(x => x.id === id); if(!v) return;
  const h = horses.find(x => x.id === v.horse_id) || {};
  const testo = [v.testo, (h.name ? h.name + " · " : "") + "Equo", "#equo #cavalli"].filter(Boolean).join("\n");
  try{
    if(v.tipo === "nota"){
      if(navigator.share){ await navigator.share({ text: testo }); }
      else if(navigator.clipboard){ await navigator.clipboard.writeText(testo); showToast("Testo copiato: incollalo su Instagram"); }
      return;
    }
    let blob = diarioShareBlob && diarioShareBlob.id === id ? diarioShareBlob.b : null;
    if(!blob){
      await firmaUrl("diario-media", [v.media_path], diarioUrl);
      const u = diarioUrl[v.media_path]; if(!u) throw new Error("foto non disponibile");
      blob = await diarioMarchia(await (await fetch(u)).blob());
    }
    const file = new File([blob], "equo-" + (h.name || "cavallo").replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".jpg", { type: "image/jpeg" });
    if(navigator.canShare && navigator.canShare({ files: [file] })){
      await navigator.share({ files: [file], text: testo });
    } else {
      // computer o browser senza condivisione file: salva la foto e copia il testo
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
      try{ if(navigator.clipboard) await navigator.clipboard.writeText(testo); } catch(e){}
      showToast("Foto salvata e testo copiato: aprila e pubblicala su Instagram");
    }
  } catch(e){
    if(e && e.name === "AbortError") return;
    showToast("Non riesco a condividere: " + ((e && e.message) || "errore"));
  }
}
function diarioDetCatScegli(c){ diarioDetCat = c; document.querySelectorAll("#dr-det-cats .dr-chip").forEach(b => b.classList.toggle("on", b.getAttribute("onclick").includes("'" + c + "'"))); }
async function diarioDetSalva(){
  const { error } = await sb.from("diario_voci").update({ testo: document.getElementById("dr-det-testo").value.trim() || null, categoria: diarioDetCat }).eq("id", diarioDetId);
  if(error){ showToast("Non riesco a salvare: " + error.message); return; }
  closeModal("modal-dr-sheet"); showToast("Modifiche salvate"); await diarioAggiorna();
}
async function diarioNellAlbum(){
  const v = diarioVoci.find(x => x.id === diarioDetId); if(!v || !v.media_path) return;
  try{
    const dl = await sb.storage.from("diario-media").download(v.media_path);
    if(dl.error) throw dl.error;
    const path = currentUser.id + "/" + v.horse_id + "/" + Date.now() + "-d.jpg";
    const up = await sb.storage.from("cavalli-album").upload(path, dl.data, { contentType: "image/jpeg", upsert: false });
    if(up.error) throw up.error;
    const rows = await albumFetch(v.horse_id);
    const { error } = await sb.from("cavalli_album").insert({ horse_id: v.horse_id, path, mime: "image/jpeg", byte: dl.data.size, copertina: !rows.some(r => r.copertina) });
    if(error) throw error;
    closeModal("modal-dr-sheet"); showToast("Foto aggiunta all'album di " + (diarioCavallo() || {}).name);
    await albumFetch(v.horse_id); diarioHomeRender();
  } catch(e){ showToast("Non riesco: " + (e.message || "errore") + " (hai eseguito l'SQL dell'album?)"); }
}
async function diarioNascondi(id){
  if(!confirm("Nascondere questo momento dal Diario? Resta nello storico del cavallo ma non lo vedrai più.")) return;
  const { error } = await sb.from("diario_voci").update({ nascosta: true }).eq("id", id);
  if(error){ showToast("Non riesco a nasconderlo: " + error.message); return; }
  closeModal("modal-dr-sheet"); await diarioAggiorna();
}
/* ---- composer ---- */
function diarioApri(tipo, data){
  if(!horses || !horses.length){ showToast("Aggiungi prima un cavallo"); showPage("cavalli"); return; }
  diarioCavallo();
  diarioFile = null; diarioRecBlob = null; diarioDataNuova = data || null;
  document.getElementById("dr-titolo").textContent = data ? "Nuovo momento · " + new Date(data + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "Nuovo momento";
  document.getElementById("dr-testo").value = "";
  document.getElementById("dr-file").value = "";
  document.getElementById("dr-anteprima").style.display = "none";
  document.getElementById("dr-audio").style.display = "none";
  document.getElementById("dr-rec-lab").textContent = "Tocca per registrare (massimo 3 minuti)";
  document.getElementById("dr-cavallo").innerHTML = horses.map(h => `<option value="${h.id}"${h.id === diarioHorseId ? " selected" : ""}>${escapeHtml(h.name)}</option>`).join("");
  document.getElementById("dr-cats").innerHTML = DIARIO_CATS.map(c => `<button type="button" class="dr-chip${c[0] === diarioCat ? " on" : ""}" onclick="diarioCatScegli('${c[0]}')">${c[1]}</button>`).join("");
  diarioTipoScegli(tipo || "foto");
  document.getElementById("dr-salva").disabled = false;
  openModal("modal-diario");
}
function diarioVideoPremium(){
  closeModal("modal-diario");
  diarioSheet("Video del tuo cavallo", `<div class="eq-card" style="margin:0 0 12px"><div class="im" style="aspect-ratio:16/10;background-image:url('assets/equo/e-16.jpg')"><span class="bd">Premium</span></div></div><div class="muted" style="font-size:14px;line-height:1.5;margin-bottom:12px">I video delle lezioni e il filmato del mese sono per chi ha Premium. Sono in preparazione: appena pronti li trovi qui. Intanto foto, note e vocali sono liberi.</div>` + (isPremium() ? "" : `<button class="btn btn-primary" style="width:100%;margin-bottom:8px" onclick="closeModal('modal-dr-sheet');togglePiano()">Scopri Premium</button>`) + `<button class="btn btn-outline" style="width:100%" onclick="closeModal('modal-dr-sheet');diarioApri('foto')">Torna al nuovo momento</button>`);
}
function diarioCatScegli(c){ diarioCat = c; document.querySelectorAll("#dr-cats .dr-chip").forEach(b => b.classList.toggle("on", b.getAttribute("onclick").includes("'" + c + "'"))); }
function diarioTipoScegli(t){
  diarioTipo = t;
  document.querySelectorAll("#dr-tipi .dr-chip[data-t]").forEach(b => b.classList.toggle("on", b.dataset.t === t));
  document.getElementById("dr-box-foto").style.display = t === "foto" ? "block" : "none";
  document.getElementById("dr-box-vocale").style.display = t === "vocale" ? "block" : "none";
  document.getElementById("dr-testo").placeholder = t === "nota" ? "Scrivi la nota di oggi…" : "Una riga su questo momento (facoltativa)";
}
function diarioFilePronto(inp){
  const f = inp.files && inp.files[0]; if(!f) return;
  diarioFile = f;
  const img = document.getElementById("dr-anteprima");
  img.src = URL.createObjectURL(f); img.style.display = "block";
}
function diarioComprimi(file){
  return new Promise((ok, ko) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const max = 1600, r = Math.min(1, max / Math.max(im.width, im.height));
      const c = document.createElement("canvas"); c.width = Math.round(im.width * r); c.height = Math.round(im.height * r);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      c.toBlob(b => { URL.revokeObjectURL(url); b ? ok(b) : ko(new Error("compressione")); }, "image/jpeg", 0.82);
    };
    im.onerror = () => { URL.revokeObjectURL(url); ko(new Error("immagine non leggibile")); };
    im.src = url;
  });
}
async function diarioRegistra(){
  const btn = document.getElementById("dr-rec"), lab = document.getElementById("dr-rec-lab");
  if(diarioRec){ diarioRec.stop(); return; }
  try{
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    diarioRecChunks = [];
    diarioRec = new MediaRecorder(stream);
    diarioRec.ondataavailable = e => { if(e.data.size) diarioRecChunks.push(e.data); };
    diarioRec.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      clearInterval(diarioRecTimer);
      diarioRecBlob = new Blob(diarioRecChunks, { type: diarioRec.mimeType || "audio/webm" });
      diarioRec = null; btn.classList.remove("on");
      const a = document.getElementById("dr-audio"); a.src = URL.createObjectURL(diarioRecBlob); a.style.display = "block";
      lab.textContent = "Registrato. Tocca per rifare";
    };
    diarioRec.start(); btn.classList.add("on");
    let s = 0; lab.textContent = "Registro… 0:00 (tocca per fermare)";
    diarioRecTimer = setInterval(() => { s++; lab.textContent = "Registro… " + Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0") + " (tocca per fermare)"; if(s >= 180) diarioRec && diarioRec.stop(); }, 1000);
  } catch(e){ showToast("Microfono non disponibile: controlla i permessi del telefono"); }
}
async function diarioSalva(){
  const horseId = document.getElementById("dr-cavallo").value, testo = document.getElementById("dr-testo").value.trim();
  if(diarioTipo === "foto" && !diarioFile){ showToast("Scegli prima una foto"); return; }
  if(diarioTipo === "nota" && !testo){ showToast("Scrivi qualcosa"); return; }
  if(diarioTipo === "vocale" && !diarioRecBlob){ showToast("Registra prima il vocale"); return; }
  if(DEMO_MODE){ showToast("Il Diario non è disponibile nella demo"); return; }
  const btn = document.getElementById("dr-salva"); btn.disabled = true;
  try{
    let path = null, mime = null, byte = null;
    if(diarioTipo !== "nota"){
      const blob = diarioTipo === "foto" ? await diarioComprimi(diarioFile) : diarioRecBlob;
      mime = diarioTipo === "foto" ? "image/jpeg" : (blob.type || "audio/webm");
      const ext = diarioTipo === "foto" ? "jpg" : (mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : "webm");
      path = currentUser.id + "/" + horseId + "/" + Date.now() + "." + ext;
      const up = await sb.storage.from("diario-media").upload(path, blob, { contentType: mime, upsert: false });
      if(up.error) throw up.error;
      byte = blob.size;
    }
    const riga = { horse_id: horseId, tipo: diarioTipo, categoria: diarioCat, testo: testo || null, media_path: path, media_mime: mime, media_byte: byte, privacy: "solo_io" };
    if(diarioDataNuova) riga.data_voce = new Date(diarioDataNuova + "T12:00:00").toISOString();
    const { error } = await sb.from("diario_voci").insert(riga);
    if(error) throw error;
    closeModal("modal-diario");
    diarioHorseId = horseId;
    showToast("Momento salvato nel Diario");
    await diarioAggiorna();
  } catch(e){ showToast("Non riesco a salvare: " + (e.message || "errore")); }
  finally{ btn.disabled = false; }
}
/* ---- carta «Oggi» nella Home ---- */
async function diarioHomeRender(){
  const box = document.getElementById("home-oggi"); if(!box) return;
  const h = diarioCavallo();
  if(!h){ box.innerHTML = ""; return; }
  if(diarioVoci.length === 0 || diarioVoci[0].horse_id !== h.id) diarioVoci = await diarioFetch(h.id);
  if(!albumCache[h.id]) await albumFetch(h.id);
  const st = diarioStats(diarioVoci), foto = cavalloHero(h);
  const oggi = diarioVoci.some(v => dKey(v.data_voce) === dKey(new Date()));
  const titolo = oggi ? "Hai già scritto oggi. Aggiungi un altro momento?" : (diarioVoci.length ? "Com'è andata oggi?" : "Scrivi il primo momento nel Diario.");
  const fa = new Date(); fa.setFullYear(fa.getFullYear() - 1);
  const ric = diarioVoci.find(v => diarioFotoUrl(v) && Math.abs(new Date(v.data_voce) - fa) < 3 * 864e5);
  box.innerHTML =
    `<div class="dr-oggi" style="background-image:url('${foto}')"><div class="c"><small>Oggi con ${escapeHtml(h.name)}${st.streak > 1 ? " · " + st.streak + " giorni di fila" : ""}</small><div class="t">${titolo}</div>` +
    `<div class="r"><button class="dr-btn o" onclick="diarioApri('foto')"><svg class="ic-d"><use href="#i-camera"/></svg>Foto</button><button class="dr-btn g" onclick="diarioApri('vocale')"><svg class="ic-d"><use href="#i-mic"/></svg>Vocale</button><button class="dr-btn g" onclick="diarioApri('nota')"><svg class="ic-d"><use href="#i-nota"/></svg>Nota</button></div></div></div>` +
    (diarioVoci.length ? `<div class="dr-ultimi"><div class="eq-tit" style="margin:0 2px 6px"><b>Ultimi momenti</b><span onclick="showPage('diario')" style="cursor:pointer">Apri il Diario ›</span></div><div class="dr-strip">${diarioVoci.slice(0, 8).map(v => { const u = v.media_path ? diarioUrl[v.media_path] : null; return `<button class="dr-mini2" ${v.tipo === "foto" && u ? `style="background-image:url('${u}')"` : ""} onclick="showPage('diario');setTimeout(()=>diarioDettaglio('${v.id}'),350)">${v.tipo === "vocale" ? "🎙" : v.tipo === "nota" ? "✎" : (u ? "" : "▫")}</button>`; }).join("")}</div></div>` : "") +
    `<div class="dr-rapidi"><button class="dr-chip" onclick="apriSchedaCavallo(${horses.length === 1 ? "'" + h.id + "'" : "null"})">${horses.length === 1 ? "Scheda di " + escapeHtml(h.name) : "I miei cavalli"}</button><button class="dr-chip" onclick="document.querySelector('[data-page=&quot;spese&quot;]').click()">Spese</button></div>` +
    (diarioVoci.length < 6 ? '<div class="eq-tit" style="margin-top:2px"><b>Da Equo</b><span>per iniziare</span></div><div class="eq-scroll">' + equoCardsHtml(7) + '</div>' : "") +
    (ric ? `<div class="dr-ricordo" style="background-image:url('${diarioFotoUrl(ric)}')" onclick="showPage('diario');setTimeout(()=>diarioDettaglio('${ric.id}'),350)"><div class="c"><small>Un anno fa</small><div class="t">${escapeHtml(ric.testo || "Un momento con " + h.name)}</div></div></div>` : "");
}
/* ---- contenuti Equo (quando il Diario è vuoto o quasi): ogni card apre una sezione ---- */
const EQUO_HERO = ["assets/equo/hero-1.jpg","assets/equo/hero-2.jpg","assets/equo/hero-3.jpg","assets/equo/hero-4.jpg"];
const EQUO_CARDS = [
  { img: "assets/equo/e-17.jpg", t: "Ogni giorno conta", d: "Una foto, una nota o un vocale: il Diario si costruisce un momento alla volta.", l: "Il Diario è la storia quotidiana del tuo cavallo: una foto dopo la passeggiata, una nota sull'allenamento, un vocale appena scendi di sella. Ogni momento resta legato al codice Equo del cavallo, per sempre. Non serve scrivere tanto: anche una riga basta.", bt: [["Scrivi il primo momento", "diarioApri('foto')"]] },
  { img: "assets/equo/e-13.jpg", t: "Un cavallo, un codice per sempre", d: "Vaccini, ferrature e visite restano nel suo storico, anche se cambia scuderia.", l: "Ogni cavallo ha il suo codice Equo. Vaccini, ferrature, visite e momenti restano nello storico del cavallo anche se cambia scuderia, maniscalco o proprietario. Conta solo il numero del codice, non le lettere.", bt: [["Apri la scheda del cavallo", "apriSchedaCavallo()"]] },
  { img: "assets/equo/e-18.jpg", t: "Il libretto sempre con te", d: "Registra vaccini e scadenze: Equo ti avvisa prima che scadano.", l: "Nella scheda del cavallo c'è il libretto sanitario: vaccini, Coggins, ferrature, sverminazioni. Aggiungi una data e Equo ti ricorda la prossima scadenza.", bt: [["Aggiungi un vaccino o una scadenza", "apriSchedaCavallo();setTimeout(openAddEventModal,600)"], ["Apri la scheda", "apriSchedaCavallo()"]] },
  { img: "assets/equo/e-14.jpg", t: "Il maniscalco su Equo", d: "Le ferrature registrate dal maniscalco arrivano nel libretto del cavallo.", l: "Se il tuo maniscalco usa Equo, le ferrature che registra compaiono nel libretto del tuo cavallo, con data e prossima scadenza. Puoi scrivergli direttamente dalla Chat.", bt: [["Vai alla Chat", "showPage('chat')"]] },
  { img: "assets/equo/e-19.jpg", t: "Porta la tua scuderia su Equo", d: "Lezioni, box e messaggi in un posto solo.", l: "Se la tua scuderia o il tuo centro ippico usa Equo Scuderia, collega il cavallo con il codice che ti dà il centro: prenoti le lezioni dall'app e ricevi i messaggi della scuderia.", bt: [["Collega la scuderia con un codice", "openModal('modal-join-stable')"]] },
  { img: "assets/equo/e-15.jpg", t: "Giorni di fila", d: "Scrivi un momento ogni giorno e guarda crescere la serie.", l: "Ogni giorno in cui scrivi almeno un momento aggiunge un giorno alla tua serie. Anche una riga basta: tocca «Giorni di fila» nel Diario per vedere gli ultimi 14 giorni.", bt: [["Scrivi un momento oggi", "diarioApri('foto')"], ["Vedi i tuoi giorni", "showPage('diario');setTimeout(()=>diarioInfo('streak'),400)"]] },
  { img: "assets/equo/e-16.jpg", t: "Il filmato del mese", d: "Con Premium, a fine mese Equo monta i tuoi momenti migliori.", l: "Con Premium puoi aggiungere anche i video e, a fine mese, Equo monta i tuoi momenti migliori in un filmato da condividere con la cornice Equo. Foto, note e vocali restano liberi per tutti.", bt: [["Scopri Premium", "isPremium() ? showToast('Hai già Premium: il filmato arriva presto') : togglePiano()"]] }
];
function equoCardsHtml(n){
  return EQUO_CARDS.slice(0, n).map((c, i) => `<div class="eq-card" onclick="equoApri(${i})"><div class="im" style="background-image:url('${c.img}')"><span class="bd">Da Equo</span></div><div class="tx"><b>${c.t}</b><p>${c.d}</p><span class="eq-vai">Scopri ›</span></div></div>`).join("");
}
function equoApri(i){
  const c = EQUO_CARDS[i]; if(!c) return;
  diarioSheet(c.t, `<div class="eq-card" style="margin:0 0 12px"><div class="im" style="background-image:url('${c.img}')"><span class="bd">Da Equo</span></div></div><div style="font-size:14.5px;line-height:1.55;margin-bottom:14px">${c.l}</div>` + c.bt.map((b, j) => `<button class="btn ${j ? "btn-outline" : "btn-primary"}" style="width:100%;margin-bottom:8px" onclick="closeModal('modal-dr-sheet');${b[1].replace(/"/g, "&quot;")}">${b[0]}</button>`).join("") + `<button class="btn btn-outline" style="width:100%" onclick="closeModal('modal-dr-sheet')">Chiudi</button>`);
}
/* ---- album foto del cavallo (condiviso con l'app: copertina di Diario e Home) ---- */
let albumCache = {}, albumUrlMap = {};
async function albumFetch(horseId){
  if(DEMO_MODE){ albumCache[horseId] = []; return []; }
  const { data, error } = await sb.from("cavalli_album").select("*").eq("horse_id", horseId).eq("nascosta", false).order("created_at", { ascending: false }).limit(60);
  const rows = error ? [] : (data || []);
  await firmaUrl("cavalli-album", rows.map(r => r.path), albumUrlMap);
  albumCache[horseId] = rows;
  return rows;
}
function cavalloHero(h){
  const rows = albumCache[h.id] || [], cov = rows.find(r => r.copertina) || rows[0];
  if(cov && albumUrlMap[cov.path]) return albumUrlMap[cov.path];
  const f = (diarioVoci || []).filter(v => v.horse_id === h.id).map(diarioFotoUrl).find(Boolean);
  if(f) return f;
  const i = Math.max(0, horses.findIndex(x => x.id === h.id));
  return EQUO_HERO[i % EQUO_HERO.length];
}
function apriSchedaCavallo(id){
  const h = id ? horses.find(x => x.id === id) : (horses.length === 1 ? horses[0] : diarioCavallo());
  showPage("cavalli");
  if(h) openHorseDetail(h.id);
}
async function albumRender(horseId){
  const box = document.getElementById("horse-album"); if(!box) return;
  const rows = await albumFetch(horseId);
  box.innerHTML = '<div class="f piu" onclick="document.getElementById(\'album-file\').click()"><svg class="ic-d" style="width:28px;height:28px"><use href="#i-plus"/></svg></div>' +
    rows.map(r => `<div class="f${r.copertina ? " cop" : ""}" style="background-image:url('${albumUrlMap[r.path] || ""}')" onclick="albumApriFoto('${r.id}')">${r.copertina ? '<span class="cb">Copertina</span>' : ""}</div>`).join("");
}
async function albumCarica(inp){
  const files = Array.from(inp.files || []); inp.value = "";
  if(!files.length || !currentHorseId) return;
  if(DEMO_MODE){ showToast("L'album non è disponibile nella demo"); return; }
  showToast("Carico " + files.length + " foto…");
  let ok = 0;
  const rows0 = albumCache[currentHorseId] || [];
  let haCop = rows0.some(r => r.copertina);
  for(const f of files){
    try{
      const blob = await diarioComprimi(f);
      const path = currentUser.id + "/" + currentHorseId + "/" + Date.now() + "-" + ok + ".jpg";
      const up = await sb.storage.from("cavalli-album").upload(path, blob, { contentType: "image/jpeg", upsert: false });
      if(up.error) throw up.error;
      const { error } = await sb.from("cavalli_album").insert({ horse_id: currentHorseId, path, mime: "image/jpeg", byte: blob.size, copertina: !haCop });
      if(error) throw error;
      haCop = true; ok++;
    } catch(e){ showToast("Foto non caricata: " + (e.message || "errore")); }
  }
  if(ok) showToast(ok + (ok > 1 ? " foto aggiunte all'album" : " foto aggiunta all'album"));
  await albumRender(currentHorseId); diarioHomeRender();
}
let albumFotoId = null;
function albumApriFoto(id){
  const r = (albumCache[currentHorseId] || []).find(x => x.id === id); if(!r) return;
  albumFotoId = id;
  document.getElementById("album-img").src = albumUrlMap[r.path] || "";
  document.getElementById("album-cop").style.display = r.copertina ? "none" : "block";
  openModal("modal-album-foto");
}
async function albumCopertina(){
  const id = albumFotoId; if(!id) return;
  await sb.from("cavalli_album").update({ copertina: false }).eq("horse_id", currentHorseId).eq("copertina", true);
  const { error } = await sb.from("cavalli_album").update({ copertina: true }).eq("id", id);
  if(error){ showToast("Non riesco: " + error.message); return; }
  closeModal("modal-album-foto"); showToast("Copertina aggiornata");
  await albumRender(currentHorseId); diarioHomeRender();
}
async function albumNascondi(){
  const id = albumFotoId; if(!id) return;
  if(!confirm("Nascondere questa foto dall'album?")) return;
  const { error } = await sb.from("cavalli_album").update({ nascosta: true, copertina: false }).eq("id", id);
  if(error){ showToast("Non riesco: " + error.message); return; }
  closeModal("modal-album-foto");
  await albumRender(currentHorseId); diarioHomeRender();
}
/* ---- aggancio a Home e navigazione ---- */
(function(){
  const _rh = renderHome; renderHome = function(){ _rh(); try{ diarioHomeRender(); }catch(e){} };
  quandoApriPagina(function(p){ if(p === "diario") diarioCarica(); });
  const _od = openHorseDetail; openHorseDetail = async function(id){ await _od(id); try{ albumRender(id); }catch(e){} };
})();

