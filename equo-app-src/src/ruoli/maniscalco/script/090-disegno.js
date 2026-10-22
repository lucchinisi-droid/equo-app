/* ---------- disegno ---------- */
function mlRender(){
  let el = document.getElementById("ml");
  if(!ml){ if(el) el.hidden = true; document.body.classList.remove("ml-on"); return; }
  if(!el){ el = document.createElement("div"); el.id = "ml"; el.className = "ml"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); document.body.appendChild(el); }
  el.hidden = false; document.body.classList.add("ml-on");
  const testa = (t, d) => `<div class="ml-barra"><span class="ml-pul"></span><b>${escapeHtml(t)}</b><span>${escapeHtml(d || "")}</span></div>`;
  if(mlProb) return mlRenderProblema(el, testa);
  if(ml.fase === "prima"){
    const card = mlEventi.map(e => {
      const r = mlRigaCavallo(e), id = mlCavId(e), inf = mlInfo[id] || { aperti: [] };
      const av = [];
      if(inf.avviso) av.push(`<div class="ml-al sic">${ML_IC.alert}<span>${escapeHtml(inf.avviso)}</span></div>`);
      inf.aperti.forEach(p => av.push(`<div class="ml-al pie"><span class="ml-sig">${mlSigla(p.piede)}</span><span>${escapeHtml(mlNomePiede(p.piede).replace(/^./, c => c.toUpperCase()))}: ${escapeHtml((p.voci || []).join(", ") || "da controllare")}${p.nota ? " — " + escapeHtml(p.nota) : ""} (${formatDataBreve(String(p.creato_il).slice(0, 10))}).${p.ricontrolla_il && p.ricontrolla_il <= mlOggi() ? " <b>Ricontrollare oggi.</b>" : ""}</span></div>`));
      if(!av.length) av.push(`<div class="ml-al ok">${ML_IC.check}<span>Nessun problema l'ultima volta.</span></div>`);
      return `<div class="ml-card"><div class="ml-h"><span class="ml-av">${iniziale(r.nome)}</span><b>${escapeHtml(r.nome)}</b><small>${escapeHtml(agDescrizioneTipoPro(e))}</small></div>${av.join("")}</div>`;
    }).join("");
    el.innerHTML = testa(ml.nome, mlEventi.length + (mlEventi.length === 1 ? " cavallo" : " cavalli"))
      + `<button class="ml-esci" onclick="mlAnnulla()" aria-label="Esci dalla modalità Lavoro">${ML_IC.x}</button>`
      + `<div class="ml-corpo">${card || '<div class="ml-vuoto">Nessun appuntamento in questa tappa.</div>'}</div>`
      + mlSlider("Ho letto · al lavoro", "mlAlLavoro", "oro");
  } else if(ml.fase === "durante"){
    el.innerHTML = `<button class="ml-esci" onclick="mlAnnulla()" aria-label="Esci dalla modalità Lavoro">${ML_IC.x}</button><div class="ml-quiete"><div class="ml-cer">${ML_IC.ferro}</div><h3>Al lavoro</h3><p>${escapeHtml(ml.nome)}<br>Notifiche dei messaggi in pausa finché non chiudi la tappa. Il telefono può restare in tasca.</p></div>`
      + mlSlider("Ho finito · chiudi la tappa", "mlHoFinito", "");
  } else {
    const righe = mlEventi.map(e => {
      const r = mlRigaCavallo(e), id = mlCavId(e);
      const pb = (ml.problemi || []).filter(p => p.ev === e.id);
      const imp = incassiNascosti() ? "" : `<label class="ml-imp"><span>€</span><input type="number" inputmode="decimal" step="0.01" min="0" value="${escapeHtml(ml.importi[e.id] ?? "")}" oninput="mlImporto('${e.id}', this.value)" aria-label="Importo ${escapeHtml(r.nome)}"></label>`;
      return `<div class="ml-riga"><span class="ml-av">${iniziale(r.nome)}</span><div class="ml-t"><b>${escapeHtml(r.nome)}</b><span>${escapeHtml(agDescrizioneTipoPro(e))}</span></div>${imp}
        ${pb.length ? `<button class="ml-st pb" onclick="mlApriProblema('${e.id}')">${pb.map(p => `<span class="ml-sig">${mlSigla(p.piede)}</span>`).join("")}Problema</button>`
          : `<span class="ml-st ok">${ML_IC.check}Regolare</span>${id ? `<button class="ml-pbb" onclick="mlApriProblema('${e.id}')" aria-label="Segna un problema su ${escapeHtml(r.nome)}">${ML_IC.alert}</button>` : ""}`}</div>`;
    }).join("");
    const tot = mlEventi.reduce((t, e) => t + (Number(ml.importi[e.id]) || 0), 0);
    el.innerHTML = testa("Chiudi la tappa", ml.nome)
      + `<button class="ml-esci" onclick="ml.fase='durante';mlSalva();mlRender()" aria-label="Indietro">${ML_IC.indietro}</button>`
      + `<div class="ml-corpo">${righe}
        ${incassiNascosti() ? "" : `<div class="ml-tot"><span>Totale tappa</span><b>${formatEuro(tot)}</b></div>
        <div class="ml-pag"><button class="${ml.pag === "saldato" ? "on" : ""}" onclick="mlPag('saldato')">Saldato<small>pagato ora</small></button><button class="${ml.pag === "da_saldare" ? "on" : ""}" onclick="mlPag('da_saldare')">Da saldare<small>lo segna da incassare</small></button></div>`}
        <div class="ml-prox">${ML_IC.cal}<span id="ml-prox">Prossima volta: come l'ultima volta per ogni cavallo</span></div></div>`
      + mlSlider("Scorri per chiudere", "mlChiudi", "verde");
    mlProssima();
  }
  mlAttivaSlider(el);
}
async function mlProssima(){
  const e = mlEventi.find(x => TIPO_FERRATURA_INTERVALLI[x.tipo_ferratura]);
  const el = document.getElementById("ml-prox"); if(!e || !el) return;
  const s = await giorniRichiamoSuggeriti(e.tipo_ferratura, e.cavallo_cliente_id, e.horse_id, e.id);
  if(s.giorni && document.getElementById("ml-prox")) el.textContent = `Prossima volta qui: tra ${s.giorni} giorni · ${formatDataBreve(aggiungiGiorniIso(mlOggi(), s.giorni))}`;
}
function mlImporto(id, v){ ml.importi[id] = v; mlSalva(); const t = document.querySelector("#ml .ml-tot b"); if(t) t.textContent = formatEuro(mlEventi.reduce((s, e) => s + (Number(ml.importi[e.id]) || 0), 0)); }
function mlPag(v){ ml.pag = v; mlSalva(); document.querySelectorAll("#ml .ml-pag button").forEach((b, i) => b.classList.toggle("on", (i === 0) === (v === "saldato"))); }

