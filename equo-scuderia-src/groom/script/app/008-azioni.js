/* ---------- azioni ---------- */
function tocca(boxId, tipo){
  const b = dati.box.find(x => x.id === boxId); if(!b) return;
  const a = fattaIn(b, tipo);
  if(a){
    foglio(`<h3><span style="color:${ICONE[tipo].c}">${glifo(ICONE[tipo].i)}</span> ${esc(L().att[tipo])} · ${esc(b.cavallo)}</h3><p>${esc(tr("fatto_da", { n: a.da || "", o: a.ora || "" }))}</p>
      <p style="color:var(--testo);font-weight:600">${tr("togli_q")}</p><div class="azioni"><button onclick="chiudiFoglio()">${tr("no")}</button><button class="pri" onclick="chiudiFoglio();segna('${boxId}','${tipo}',false)">${tr("si_togli")}</button></div>`);
    return;
  }
  segna(boxId, tipo, true);
}
function segna(boxId, tipo, fatto){
  const b = dati.box.find(x => x.id === boxId); if(!b) return;
  if(navigator.vibrate) try{ navigator.vibrate(fatto ? 30 : [20, 40, 20]); } catch(e){}
  b.fatte = (b.fatte || []).filter(a => a.tipo !== tipo);
  const quando = new Date().toISOString();
  if(fatto) b.fatte.push({ tipo, ora: oraAdesso(), da: dati.groom });
  // una sola voce in coda per box+attività: vince l'ultimo tocco
  coda = coda.filter(x => !(x.box === boxId && x.tipo === tipo));
  coda.push({ box: boxId, tipo, fatto, quando });
  if(!DEMO){ scrivi(K_CODA, coda); scrivi(K_CACHE, dati); }
  disegna();
  svuotaCoda().then(() => disegna());
}
function apriNota(boxId){
  const b = dati.box.find(x => x.id === boxId);
  foglio(`<h3><span class="nota-btn" style="width:34px;height:34px;display:grid;place-items:center;font-size:16px">N</span> ${esc(b.cavallo)}</h3><div class="nota-testo">${esc(b.nota)}</div>
    <div class="azioni"><button class="ver" onclick="chiudiFoglio()">${tr("chiudi")}</button></div>`);
}
function foglio(html){ chiudiFoglio(); const v = document.createElement("div"); v.className = "velo"; v.onclick = e => { if(e.target === v) chiudiFoglio(); }; v.innerHTML = `<div class="foglio">${html}</div>`; document.body.appendChild(v); }
function chiudiFoglio(){ fermaCamera(); document.querySelectorAll(".velo").forEach(v => v.remove()); }
function apriLingue(){
  foglio(`<h3><i class="fa-solid fa-language"></i> ${tr("lingua")}</h3><div class="lingue">${Object.entries(LINGUE).map(([k, n]) =>
    `<button class="${S.lang === k ? "on" : ""}" onclick="scegliLingua('${k}')" dir="${k === "ar" ? "rtl" : "ltr"}"><span>${n}</span>${S.lang === k ? '<i class="fa-solid fa-check"></i>' : ""}</button>`).join("")}</div>`);
}
async function scegliLingua(k){
  S.lang = k; S.langScelta = true; if(!DEMO) scrivi(K_STATO, S); applicaLingua(); chiudiFoglio();
  if(dati && S.pin){ disegna(); if(!DEMO) rpc("groom_lingua", { p_token: S.t, p_pin: S.pin, p_lingua: k }).catch(() => {}); }
  else avvio();
}
function apriMenu(){
  foglio(`<h3><i class="fa-solid fa-user"></i> ${esc(dati?.groom || "")}</h3><p>${esc(dati?.centro || "")}</p>
    <div class="azioni"><button onclick="chiudiFoglio()">${tr("chiudi")}</button><button class="pri" onclick="chiediEsci()"><i class="fa-solid fa-right-from-bracket"></i> ${tr("esci")}</button></div>`);
}
function chiediEsci(){ foglio(`<h3>${tr("esci")}</h3><p>${tr("esci_q")}</p><div class="azioni"><button onclick="chiudiFoglio()">${tr("no")}</button><button class="pri" onclick="esciDavvero()">${tr("esci")}</button></div>`); }
function esciDavvero(silenzioso){ const lang = S.lang; S = { lang }; coda = []; dati = null; scrivi(K_STATO, S); scrivi(K_CODA, []); scrivi(K_CACHE, null); clearInterval(timerPoll); timerPoll = null; chiudiFoglio(); if(!silenzioso){ history.replaceState(null, "", "/groom"); schermoBenvenuto(); } }

