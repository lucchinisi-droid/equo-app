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
