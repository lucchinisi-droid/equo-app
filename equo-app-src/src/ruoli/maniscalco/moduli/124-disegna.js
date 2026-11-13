// Equo App · maniscalco e veterinario · DISEGNA E MISURA su foto e lastre (13/11/2026, SQL 69, mockup «Archivio e Disegno» 6-7)
// L'originale non cambia mai: i segni sono un livello sopra (documenti.segni), si riaprono, si correggono, si spostano, si cancellano.
// segni = { v: 1, cal: { mmPx, mm, rif, p: [[x,y],[x,y]] } | null, items: [{ id, t, c, s, p: [[x,y]…], testo?, nota? }] }
// punti normalizzati 0–1 sull'immagine originale; le misure si calcolano sui pixel veri (naturalWidth/Height).
// Strumenti: penna · freccia · cerchio · testo · misura · angolo (3 tocchi) · bilancia · prima/dopo; «Calibra» per avere i cm.
import { arcDB, arcEsc, arcToast, arcRicarica } from "./123-archivio.js";

const DS_COLORI = [{ c: "#f0c05e", n: "Giallo" }, { c: "#7FD1C9", n: "Azzurro" }, { c: "#e2685f", n: "Rosso" }, { c: "#ffffff", n: "Bianco" }];
const DS_STRUMENTI = [
  { t: "penna", n: "Penna", ic: "M4 20l4-1 11-11-3-3L5 16z" },
  { t: "freccia", n: "Freccia", ic: "M5 19L19 5 M10 5h9v9" },
  { t: "cerchio", n: "Forma", ic: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" },
  { t: "testo", n: "Testo", ic: "M5 6h14 M12 6v13 M9 19h6" },
  { t: "misura", n: "Misura", ic: "M3 17L17 3l4 4L7 21z M7 13l2 2 M10 10l2 2 M13 7l2 2" },
  { t: "angolo", n: "Angolo", ic: "M4 20h16 M4 20L16 5 M10 20a6 6 0 0 0-2-5" },
  { t: "bilancia", n: "Bilancia", ic: "M12 4v16 M5 8h14 M5 8l-3 6h6z M19 8l-3 6h6z" },
  { t: "confronto", n: "Prima/dopo", ic: "M3 5h8v14H3z M13 5h8v14h-8z" }
];
const DS_NOMI = { penna: "Disegno", freccia: "Freccia", cerchio: "Forma", testo: "Testo", misura: "Misura", angolo: "Angolo", bilancia: "Bilanciamento" };
const DS = { doc: null, img: null, segni: null, tool: "penna", col: DS_COLORI[0].c, sp: 3, storia: [], rifai: [], mostra: true, sel: null, bozza: null, cal: false, modificato: false };

// ---------- calcoli ----------
const dsNum = (n, dec = 1) => Number(n).toLocaleString("it-IT", { minimumFractionDigits: dec, maximumFractionDigits: dec });
function dsNat(p, W, H){ return [p[0] * W, p[1] * H]; }
function dsDist(a, b, W, H){ const [x1, y1] = dsNat(a, W, H), [x2, y2] = dsNat(b, W, H); return Math.hypot(x2 - x1, y2 - y1); }
function dsAngolo(a, v, b, W, H){
  const [ax, ay] = dsNat(a, W, H), [vx, vy] = dsNat(v, W, H), [bx, by] = dsNat(b, W, H);
  const a1 = Math.atan2(ay - vy, ax - vx), a2 = Math.atan2(by - vy, bx - vx);
  let d = Math.abs(a1 - a2) * 180 / Math.PI; if(d > 180) d = 360 - d; return d;
}
// valore leggibile di un segno (null se non è una misura)
function dsValore(it, W, H, cal){
  if(!it || !W || !H) return null;
  if(it.t === "misura" && it.p.length >= 2){
    const px = dsDist(it.p[0], it.p[1], W, H);
    return cal?.mmPx ? { testo: dsNum(px * cal.mmPx / 10) + " cm", num: px * cal.mmPx / 10, u: "cm" } : { testo: "calibra per i cm", num: null };
  }
  if(it.t === "angolo" && it.p.length >= 3){ const g = dsAngolo(it.p[0], it.p[1], it.p[2], W, H); return { testo: Math.round(g) + "°", num: g, u: "°" }; }
  if(it.t === "bilancia" && it.p.length >= 2){
    const [x1, y1] = dsNat(it.p[0], W, H), [x2, y2] = dsNat(it.p[1], W, H);
    let g = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI; if(g > 90) g -= 180; if(g < -90) g += 180;
    const mm = cal?.mmPx ? Math.abs(y2 - y1) * cal.mmPx : null;
    return { testo: dsNum(Math.abs(g)) + "°" + (mm != null ? " · " + Math.round(mm) + " mm" : ""), num: mm != null ? mm : Math.abs(g), u: mm != null ? "mm" : "°" };
  }
  return null;
}
function dsEtichetta(it, W, H, cal){
  const v = dsValore(it, W, H, cal);
  if(it.t === "testo") return it.testo || "Testo";
  if(v) return (it.nota ? it.nota + " " : "") + v.testo;
  return it.nota || DS_NOMI[it.t] || "Segno";
}
function dsNormalizza(s){
  const x = s && typeof s === "object" ? s : {};
  return { v: 1, cal: x.cal && x.cal.mmPx > 0 ? x.cal : null, items: Array.isArray(x.items) ? x.items.filter(i => i && Array.isArray(i.p)) : [] };
}

// ---------- disegno (usato anche dal visualizzatore e dal PDF) ----------
// r = riquadro dell'immagine sul canvas { x, y, w, h }; W,H = pixel veri dell'immagine
function dsDisegnaSegni(ctx, segni, r, W, H, opz = {}){
  const s = dsNormalizza(segni), k = opz.scala || Math.max(1, Math.min(r.w, r.h) / 360);
  const P = p => [r.x + p[0] * r.w, r.y + p[1] * r.h];
  const etichetta = (x, y, t, col) => {
    ctx.font = `700 ${Math.round(12 * k)}px "DM Sans", sans-serif`;
    const w = ctx.measureText(t).width + 12 * k, h = 20 * k;
    ctx.fillStyle = col; ctx.beginPath(); (ctx.roundRect ? ctx.roundRect(x - w / 2, y - h / 2, w, h, 5 * k) : ctx.rect(x - w / 2, y - h / 2, w, h)); ctx.fill();
    ctx.fillStyle = col === "#ffffff" || col === "#f0c05e" || col === "#7FD1C9" ? "#1c160c" : "#ffffff";
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(t, x, y + 0.5 * k);
  };
  const numero = (x, y, n, col) => {
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 9 * k, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col === "#e2685f" ? "#ffffff" : "#1c160c"; ctx.font = `700 ${Math.round(11 * k)}px "DM Sans", sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(n), x, y + 0.5 * k);
  };
  if(opz.cal && s.cal?.p?.length === 2){
    const [a, b] = [P(s.cal.p[0]), P(s.cal.p[1])];
    ctx.save(); ctx.setLineDash([6 * k, 5 * k]); ctx.strokeStyle = "#7FD1C9"; ctx.lineWidth = 2 * k;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.restore();
    etichetta((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 14 * k, "rif. " + s.cal.mm + " mm", "#7FD1C9");
  }
  s.items.forEach((it, i) => {
    const col = it.c || "#f0c05e", lw = (it.s || 3) * k * 0.8, pts = it.p.map(P);
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.lineJoin = "round";
    if(opz.sel === it.id){ ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 8 * k; }
    if(it.t === "penna" && pts.length){
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(p => ctx.lineTo(p[0], p[1])); ctx.stroke();
    } else if((it.t === "freccia" || it.t === "misura" || it.t === "bilancia") && pts.length >= 2){
      const [a, b] = pts;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      if(it.t === "freccia"){
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 12 * k + lw * 2;
        ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - L * Math.cos(ang - 0.45), b[1] - L * Math.sin(ang - 0.45));
        ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - L * Math.cos(ang + 0.45), b[1] - L * Math.sin(ang + 0.45)); ctx.stroke();
      } else {
        [a, b].forEach(p => { ctx.beginPath(); ctx.arc(p[0], p[1], 4 * k + lw / 2, 0, Math.PI * 2); ctx.fill(); });
        if(it.t === "bilancia"){
          ctx.save(); ctx.setLineDash([5 * k, 5 * k]); ctx.globalAlpha = 0.7; ctx.lineWidth = Math.max(1, lw / 2);
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], a[1]); ctx.stroke(); ctx.restore();
        }
        const v = dsValore(it, W, H, segni?.cal); if(v) etichetta((a[0] + b[0]) / 2 + 16 * k, (a[1] + b[1]) / 2 - 14 * k, v.testo, col);
      }
    } else if(it.t === "cerchio" && pts.length >= 2){
      const [a, b] = pts;
      ctx.beginPath(); ctx.ellipse((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.abs(b[0] - a[0]) / 2 || 1, Math.abs(b[1] - a[1]) / 2 || 1, 0, 0, Math.PI * 2); ctx.stroke();
    } else if(it.t === "angolo" && pts.length >= 2){
      const v = pts[1] || pts[0];
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(v[0], v[1]); if(pts[2]) ctx.lineTo(pts[2][0], pts[2][1]); ctx.stroke();
      if(pts[2]){
        const a1 = Math.atan2(pts[0][1] - v[1], pts[0][0] - v[0]), a2 = Math.atan2(pts[2][1] - v[1], pts[2][0] - v[0]);
        let d = a2 - a1; while(d > Math.PI) d -= 2 * Math.PI; while(d < -Math.PI) d += 2 * Math.PI;
        ctx.beginPath(); ctx.arc(v[0], v[1], 26 * k, a1, a1 + d, d < 0); ctx.stroke();
        const val = dsValore(it, W, H, segni?.cal), m = a1 + d / 2;
        if(val) etichetta(v[0] + Math.cos(m) * 48 * k, v[1] + Math.sin(m) * 48 * k, val.testo, col);
      }
    } else if(it.t === "testo" && pts.length){
      etichetta(pts[0][0], pts[0][1], it.testo || "Testo", col);
    }
    ctx.restore();
    if(!opz.senzaNumeri && pts.length && it.t !== "testo") numero(pts[0][0] - 14 * k, pts[0][1] - 14 * k, i + 1, col);
  });
}
// filigrana: nome di chi guarda e data, in diagonale su tutta l'immagine
function dsFiligrana(ctx, w, h, testo){
  if(!testo) return;
  ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 1;
  const f = Math.max(14, Math.round(Math.min(w, h) / 22)); ctx.font = `700 ${f}px "DM Sans", sans-serif`; ctx.textAlign = "center";
  ctx.translate(w / 2, h / 2); ctx.rotate(-Math.PI / 6);
  const passo = f * 5, larg = Math.hypot(w, h);
  for(let y = -larg / 2; y < larg / 2; y += passo) for(let x = -larg / 2; x < larg / 2; x += ctx.measureText(testo).width + f * 3){ ctx.strokeText(testo, x, y); ctx.fillText(testo, x, y); }
  ctx.restore();
}
// immagine con i segni (per «Scarica con i segni», confronto, PDF): canvas fino a 2000 px
function dsCanvasConSegni(img, segni, opz = {}){
  const W = img.naturalWidth || img.width, H = img.naturalHeight || img.height, k = Math.min(1, (opz.maxLato || 2000) / Math.max(W, H));
  const cv = document.createElement("canvas"); cv.width = Math.round(W * k); cv.height = Math.round(H * k);
  const ctx = cv.getContext("2d"); ctx.drawImage(img, 0, 0, cv.width, cv.height);
  if(segni) dsDisegnaSegni(ctx, segni, { x: 0, y: 0, w: cv.width, h: cv.height }, W, H, { scala: Math.max(1, Math.min(cv.width, cv.height) / 360) });
  if(opz.filigrana) dsFiligrana(ctx, cv.width, cv.height, opz.filigrana);
  return cv;
}
function dsCaricaImmagine(url){
  return new Promise((res, rej) => { const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => res(im); im.onerror = () => rej(new Error("immagine")); im.src = url; });
}
// riquadro dell'immagine adattata al canvas
function dsAdatta(cw, ch, W, H){ const k = Math.min(cw / W, ch / H); const w = W * k, h = H * k; return { x: (cw - w) / 2, y: (ch - h) / 2, w, h }; }

// ---------- editor ----------
function dsFoglio(){
  let ov = document.getElementById("ds-editor");
  if(!ov){ ov = document.createElement("div"); ov.id = "ds-editor"; ov.className = "ds-editor"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "Disegna e misura"); document.body.appendChild(ov); }
  return ov;
}
async function dsApri(docId){
  const info = await arcDB.apri(docId);
  if(!info?.ok) return arcToast("Non riesco ad aprire la foto, riprova.");
  if(!info.mio) return arcToast("Puoi disegnare solo sulle foto che hai caricato tu.");
  if(!/^image\//.test(info.mime || "")) return arcToast("Si disegna sulle foto e sulle lastre in formato immagine (JPG, PNG). Per i PDF usa «Scarica».");
  const url = await arcDB.urlDi(info);
  if(!url) return arcToast("Non riesco ad aprire la foto, riprova.");
  try{ DS.img = await dsCaricaImmagine(url); }catch(_){ return arcToast("Non riesco a caricare la foto, riprova."); }
  Object.assign(DS, { doc: info, segni: dsNormalizza(info.segni), tool: "penna", storia: [], rifai: [], mostra: true, sel: null, bozza: null, cal: false, modificato: false });
  dsRender(); dsIniziaStage();
}
function dsTitolo(){ return DS.doc?.nome || String(DS.doc?.titolo || "Foto").split(" · ").slice(0, 2).join(" · "); }
function dsRender(){
  const ov = dsFoglio(), s = DS.segni, n = s.items.length;
  ov.innerHTML = `<div class="ds-top">
      <button class="ds-ico" aria-label="Chiudi" onclick="dsChiudi()"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <div class="ds-tit"><b>${arcEsc(dsTitolo())}</b><small>L'originale non cambia</small></div>
      <button class="ds-ico" aria-label="Annulla" onclick="dsAnnulla()" ${DS.storia.length ? "" : "disabled"}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg></button>
      <button class="ds-ico" aria-label="Rifai" onclick="dsRifai()" ${DS.rifai.length ? "" : "disabled"}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/></svg></button>
      <button class="ds-salva" id="ds-salva" onclick="dsSalva()">Salva</button>
    </div>
    <div class="ds-cal">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17L17 3l4 4L7 21z M7 13l2 2 M10 10l2 2 M13 7l2 2"/></svg>
      <span>${DS.cal ? "Traccia una linea su qualcosa di misura nota" : s.cal ? `Calibrata su <b>${arcEsc(s.cal.rif || s.cal.mm + " mm")}</b>` : "Non calibrata: le misure non sono in cm"}</span>
      <button onclick="dsCalibra()">${DS.cal ? "Annulla" : s.cal ? "Cambia" : "Calibra"}</button>
    </div>
    <div class="ds-stage" id="ds-stage"><canvas id="ds-canvas" role="img" aria-label="Foto con i segni"></canvas>
      <button class="ds-mostra${DS.mostra ? " on" : ""}" onclick="dsMostra()" aria-pressed="${DS.mostra}"><span class="ds-sw"><span></span></span>Segni</button>
      <div class="ds-aiuto" id="ds-aiuto">${arcEsc(dsAiuto())}</div>
    </div>
    <div class="ds-segni" id="ds-segni">${n ? s.items.map((it, i) => `<button class="ds-chip${DS.sel === it.id ? " on" : ""}" onclick="dsSeleziona('${it.id}')"><span style="background:${it.c}">${i + 1}</span>${arcEsc(dsEtichetta(it, DS.img.naturalWidth, DS.img.naturalHeight, s.cal))}</button>`).join("")
      : '<span class="ds-vuoto">Nessun segno: scegli uno strumento e tocca la foto.</span>'}</div>
    ${DS.sel ? `<div class="ds-selbar"><span>Segno ${s.items.findIndex(x => x.id === DS.sel) + 1}: trascina sulla foto per spostarlo</span>
      <button onclick="dsNota()">Nota</button><button onclick="dsTogli()">Elimina</button><button onclick="dsSeleziona(null)">Fatto</button></div>` : ""}
    <div class="ds-tools">${DS_STRUMENTI.map(t => `<button class="ds-tool${DS.tool === t.t && !DS.sel ? " on" : ""}" onclick="dsStrumento('${t.t}')" aria-pressed="${DS.tool === t.t}">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="${t.ic}"/></svg><span>${t.n}</span></button>`).join("")}</div>
    <div class="ds-stile"><span>Colore</span>${DS_COLORI.map(c => `<button class="ds-col${DS.col === c.c ? " on" : ""}" style="background:${c.c}" aria-label="${c.n}" onclick="dsColore('${c.c}')"></button>`).join("")}
      <label class="ds-sp">Spessore <input type="range" min="2" max="8" step="1" value="${DS.sp}" oninput="DS.sp = Number(this.value)" aria-label="Spessore"></label></div>`;
  ov.classList.add("aperto");
}
function dsAiuto(){
  if(DS.cal) return "Calibra: trascina da un capo all'altro del riferimento (marker, larghezza del ferro, righello).";
  if(DS.sel) return "";
  if(DS.tool === "angolo") return ["Angolo: tocca il primo punto", "Ora tocca il vertice", "Ora tocca il secondo punto"][DS.bozza?.p?.length || 0];
  return { penna: "Disegna con il dito", freccia: "Trascina dalla coda alla punta", cerchio: "Trascina per fare il cerchio", testo: "Tocca dove vuoi scrivere",
    misura: DS.segni.cal ? "Trascina da un punto all'altro" : "Trascina: per i cm prima «Calibra»", bilancia: "Trascina tra i due punti da confrontare (es. talloni)" }[DS.tool] || "";
}
function dsAggiornaAiuto(){ const a = document.getElementById("ds-aiuto"); if(a) a.textContent = dsAiuto(); }
let dsRect = null;
function dsIniziaStage(){
  const st = document.getElementById("ds-stage"), cv = document.getElementById("ds-canvas"); if(!st || !cv) return;
  const dpr = window.devicePixelRatio || 1, cw = st.clientWidth, ch = st.clientHeight;
  cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); cv.style.width = cw + "px"; cv.style.height = ch + "px";
  dsRect = dsAdatta(cw, ch, DS.img.naturalWidth, DS.img.naturalHeight);
  let giu = null;
  const punto = ev => { const b = cv.getBoundingClientRect(); return [Math.min(1, Math.max(0, (ev.clientX - b.left - dsRect.x) / dsRect.w)), Math.min(1, Math.max(0, (ev.clientY - b.top - dsRect.y) / dsRect.h))]; };
  cv.onpointerdown = ev => {
    ev.preventDefault(); try{ cv.setPointerCapture(ev.pointerId); }catch(_){}
    const p = punto(ev); giu = p;
    if(DS.sel){ dsMemoria(); DS.bozza = { sposta: DS.sel, da: p }; return; }
    if(DS.cal){ DS.bozza = { t: "cal", p: [p, p] }; return; }
    if(DS.tool === "angolo"){ return; }
    if(DS.tool === "testo"){ dsTesto(p); return; }
    DS.bozza = { id: "s" + Date.now().toString(36), t: DS.tool, c: DS.col, s: DS.sp, p: DS.tool === "penna" ? [p] : [p, p] };
    dsDisegna();
  };
  cv.onpointermove = ev => {
    if(!giu || !DS.bozza) return;
    const p = punto(ev);
    if(DS.bozza.sposta){
      const it = DS.segni.items.find(x => x.id === DS.bozza.sposta); if(!it) return;
      const dx = p[0] - DS.bozza.da[0], dy = p[1] - DS.bozza.da[1]; DS.bozza.da = p;
      it.p = it.p.map(q => [Math.min(1, Math.max(0, q[0] + dx)), Math.min(1, Math.max(0, q[1] + dy))]); DS.modificato = true;
    } else if(DS.bozza.t === "penna"){ DS.bozza.p.push(p); }
    else { DS.bozza.p[1] = p; }
    dsDisegna();
  };
  cv.onpointerup = ev => {
    const p = punto(ev), da = giu; giu = null;
    if(DS.tool === "angolo" && !DS.sel && !DS.cal){
      DS.bozza = DS.bozza && DS.bozza.t === "angolo" ? DS.bozza : { id: "s" + Date.now().toString(36), t: "angolo", c: DS.col, s: DS.sp, p: [] };
      DS.bozza.p.push(p);
      if(DS.bozza.p.length === 3){ dsAggiungi(DS.bozza); DS.bozza = null; } else { dsDisegna(); dsAggiornaAiuto(); }
      return;
    }
    const b = DS.bozza; DS.bozza = null;
    if(!b){ return; }
    if(b.sposta){ dsRender(); dsIniziaStage(); return; }
    const corto = b.t !== "penna" && da && Math.hypot(p[0] - da[0], p[1] - da[1]) < 0.01;
    if(b.t === "cal"){ if(corto){ dsDisegna(); return; } dsChiediRiferimento(b.p); return; }
    if(corto || (b.t === "penna" && b.p.length < 2)){ dsDisegna(); return; }
    dsAggiungi(b);
  };
  dsDisegna();
}
function dsDisegna(){
  const cv = document.getElementById("ds-canvas"); if(!cv || !DS.img) return;
  const ctx = cv.getContext("2d"), dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.drawImage(DS.img, dsRect.x, dsRect.y, dsRect.w, dsRect.h);
  const W = DS.img.naturalWidth, H = DS.img.naturalHeight;
  if(DS.mostra){
    const items = DS.bozza && !DS.bozza.sposta && DS.bozza.t !== "cal" ? DS.segni.items.concat([DS.bozza]) : DS.segni.items;
    dsDisegnaSegni(ctx, { ...DS.segni, items }, dsRect, W, H, { sel: DS.sel, cal: DS.cal, scala: 1.1 });
  }
  if(DS.bozza?.t === "cal") dsDisegnaSegni(ctx, { cal: { mmPx: 1, mm: "?", p: DS.bozza.p }, items: [] }, dsRect, W, H, { cal: true, scala: 1.1 });
}
function dsMemoria(){ DS.storia.push(JSON.stringify(DS.segni)); if(DS.storia.length > 60) DS.storia.shift(); DS.rifai = []; }
function dsAggiungi(it){ dsMemoria(); DS.segni.items.push(it); DS.modificato = true; dsRender(); dsIniziaStage(); }
function dsAnnulla(){ if(!DS.storia.length) return; DS.rifai.push(JSON.stringify(DS.segni)); DS.segni = JSON.parse(DS.storia.pop()); DS.sel = null; DS.modificato = true; dsRender(); dsIniziaStage(); }
function dsRifai(){ if(!DS.rifai.length) return; DS.storia.push(JSON.stringify(DS.segni)); DS.segni = JSON.parse(DS.rifai.pop()); DS.modificato = true; dsRender(); dsIniziaStage(); }
function dsStrumento(t){
  if(t === "confronto") return dsConfronto(DS.doc.id);
  DS.tool = t; DS.sel = null; DS.cal = false; DS.bozza = null; dsRender(); dsIniziaStage();
}
function dsColore(c){ DS.col = c; const it = DS.sel && DS.segni.items.find(x => x.id === DS.sel); if(it){ dsMemoria(); it.c = c; DS.modificato = true; } dsRender(); dsIniziaStage(); }
function dsMostra(){ DS.mostra = !DS.mostra; dsRender(); dsIniziaStage(); }
function dsSeleziona(id){ DS.sel = id && DS.sel !== id ? id : null; DS.cal = false; DS.bozza = null; dsRender(); dsIniziaStage(); }
function dsTogli(){ const i = DS.segni.items.findIndex(x => x.id === DS.sel); if(i < 0) return; dsMemoria(); DS.segni.items.splice(i, 1); DS.sel = null; DS.modificato = true; dsRender(); dsIniziaStage(); }
function dsCalibra(){ DS.cal = !DS.cal; DS.sel = null; DS.bozza = null; dsRender(); dsIniziaStage(); }
// piccolo foglio con un campo (testo, nota, riferimento): niente prompt() del browser
function dsChiedi({ titolo, testo, valore, placeholder, tipo, scelte }){
  return new Promise(res => {
    let ov = document.getElementById("ds-chiedi");
    if(!ov){ ov = document.createElement("div"); ov.id = "ds-chiedi"; ov.className = "ds-chiedi"; document.body.appendChild(ov); }
    ov.innerHTML = `<div class="ds-chiedi-box" role="dialog" aria-modal="true" aria-labelledby="ds-chiedi-t"><b id="ds-chiedi-t">${arcEsc(titolo)}</b>${testo ? `<p>${arcEsc(testo)}</p>` : ""}
      ${scelte ? `<div class="ds-scelte">${scelte.map((s, i) => `<button data-i="${i}">${arcEsc(s.n)}</button>`).join("")}</div>` : ""}
      <input id="ds-chiedi-in" type="${tipo || "text"}" ${tipo === "number" ? 'inputmode="decimal" step="0.1" min="0.1"' : 'maxlength="60"'} value="${arcEsc(valore ?? "")}" placeholder="${arcEsc(placeholder || "")}" aria-label="${arcEsc(titolo)}">
      <div class="ds-chiedi-b"><button class="no">Annulla</button><button class="si">OK</button></div></div>`;
    ov.classList.add("aperto");
    const inp = ov.querySelector("input"), fine = v => { ov.classList.remove("aperto"); res(v); };
    ov.querySelector(".no").onclick = () => fine(null);
    ov.querySelector(".si").onclick = () => fine(inp.value);
    inp.onkeydown = e => { if(e.key === "Enter") fine(inp.value); };
    ov.querySelectorAll(".ds-scelte button").forEach(b => { b.onclick = () => { const s = scelte[+b.dataset.i]; if(s.v != null){ inp.value = s.v; } inp.focus(); }; });
    setTimeout(() => inp.focus(), 50);
  });
}
async function dsTesto(p){
  const t = await dsChiedi({ titolo: "Scrivi sulla foto", placeholder: "es. talloni bassi" });
  if(t && t.trim()) dsAggiungi({ id: "s" + Date.now().toString(36), t: "testo", c: DS.col, s: DS.sp, p: [p], testo: t.trim().slice(0, 60) });
}
async function dsNota(){
  const it = DS.segni.items.find(x => x.id === DS.sel); if(!it) return;
  const t = await dsChiedi({ titolo: "Nota del segno " + (DS.segni.items.indexOf(it) + 1), valore: it.nota || "", placeholder: "es. parete, angolo punta" });
  if(t == null) return;
  dsMemoria(); it.nota = t.trim().slice(0, 60) || undefined; DS.modificato = true; dsRender(); dsIniziaStage();
}
async function dsChiediRiferimento(p){
  const v = await dsChiedi({ titolo: "Quanto misura il riferimento?", testo: "In millimetri. Scegli o scrivi la misura vera di quello che hai tracciato.",
    tipo: "number", placeholder: "mm", valore: DS.segni.cal?.mm || "",
    scelte: [{ n: "Marker 25 mm", v: 25 }, { n: "Ferro 135 mm", v: 135 }, { n: "Righello 100 mm", v: 100 }] });
  const mm = parseFloat(String(v || "").replace(",", "."));
  if(!(mm > 0)){ DS.cal = false; dsRender(); dsIniziaStage(); return; }
  const px = dsDist(p[0], p[1], DS.img.naturalWidth, DS.img.naturalHeight);
  if(px < 3){ arcToast("Linea troppo corta, riprova."); return; }
  dsMemoria();
  const rif = mm === 25 ? "marker 25 mm" : mm === 135 ? "ferro 13,5 cm" : mm === 100 ? "righello 10 cm" : dsNum(mm, mm % 1 ? 1 : 0) + " mm";
  DS.segni.cal = { mmPx: mm / px, mm, rif, p }; DS.cal = false; DS.modificato = true; dsRender(); dsIniziaStage();
}
async function dsSalva(){
  const b = document.getElementById("ds-salva"); if(b) b.disabled = true;
  const segni = DS.segni.items.length || DS.segni.cal ? DS.segni : null;
  const { error } = await arcDB.aggiorna(DS.doc.id, { segni });
  if(b) b.disabled = false;
  if(error) return arcToast(/column|segni|schema cache/i.test(error.message || "") ? "Manca un aggiornamento del database (SQL 69)." : "Non salvato: " + (error.message || "riprova"));
  DS.modificato = false; arcToast("Segni salvati"); dsChiudi(true);
}
async function dsChiudi(salvato){
  if(DS.modificato && !salvato && typeof chiediSiNo === "function"
     && !(await chiediSiNo("Uscire senza salvare?", "I segni nuovi andranno persi.", { si: "Esci", no: "Resta" }))) return;
  const ov = document.getElementById("ds-editor"); if(ov){ ov.classList.remove("aperto"); ov.innerHTML = ""; }
  DS.img = null; DS.modificato = false;
  if(typeof arcRicarica === "function") arcRicarica();
}

// ---------- prima / dopo ----------
const CF = { a: null, b: null, modo: "affiancate", trasp: 0.5 };
async function dsConfronto(docId){
  if(DS.modificato){ const { error } = await arcDB.aggiorna(DS.doc.id, { segni: DS.segni }); if(!error) DS.modificato = false; }
  const lista = await arcDB.fotoStessoCavallo(docId);
  if(!lista.length) return arcToast("Non ci sono altre foto di questo cavallo da confrontare.");
  let ov = document.getElementById("ds-confronto");
  if(!ov){ ov = document.createElement("div"); ov.id = "ds-confronto"; ov.className = "ds-confronto"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); document.body.appendChild(ov); }
  ov.innerHTML = `<div class="arc-testa"><button class="arc-ico" aria-label="Indietro" onclick="dsConfrontoChiudi()"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button>
    <div><div class="arc-tit">Prima / dopo</div><div class="arc-sotto">Scegli la foto da confrontare</div></div></div>
    <div class="cf-scegli">${lista.map(d => `<button class="arc-riga" onclick="dsConfrontoScegli('${docId}', '${d.id}')"><span class="arc-thumb">${d.mini ? `<img src="${arcEsc(urlSicuro(d.mini))}" alt="">` : ""}</span>
      <span class="arc-righe"><b>${arcEsc(d.nome || d.titolo)}</b><small>${arcEsc(d.nome ? d.titolo : (d.cavallo_nome || ""))}</small></span></button>`).join("")}</div>`;
  ov.classList.add("aperto");
}
async function dsConfrontoScegli(idA, idB){
  const [a, b] = await Promise.all([idA, idB].map(async id => { const info = await arcDB.apri(id); const url = info?.ok ? await arcDB.urlDi(info) : null; return { info, img: url ? await dsCaricaImmagine(url).catch(() => null) : null }; }));
  if(!a.img || !b.img) return arcToast("Non riesco a caricare le foto, riprova.");
  // la più vecchia è «prima»
  const vecchia = x => String(x.info.data_documento || x.info.creato_il || "");
  [CF.a, CF.b] = vecchia(a) <= vecchia(b) ? [a, b] : [b, a];
  CF.a.segni = dsNormalizza(CF.a.info.segni); CF.b.segni = dsNormalizza(CF.b.info.segni);
  dsConfrontoRender();
}
function dsConfrontoValori(){
  const val = x => { const W = x.img.naturalWidth, H = x.img.naturalHeight; return x.segni.items.map(it => ({ it, v: dsValore(it, W, H, x.segni.cal) })).filter(o => o.v && o.v.num != null); };
  const A = val(CF.a), B = val(CF.b), righe = [];
  ["angolo", "misura", "bilancia"].forEach(t => {
    const la = A.filter(o => o.it.t === t), lb = B.filter(o => o.it.t === t);
    for(let i = 0; i < Math.max(la.length, lb.length); i++){
      const x = la[i], y = lb[i], u = (x || y).v.u;
      const d = x && y ? y.v.num - x.v.num : null;
      righe.push({ n: (x?.it.nota || y?.it.nota) || ({ angolo: "Angolo", misura: "Misura", bilancia: "Bilanciamento" }[t] + (Math.max(la.length, lb.length) > 1 ? " " + (i + 1) : "")),
        a: x ? x.v.testo : "—", b: y ? y.v.testo : "—", d: d == null ? "" : (d > 0 ? "+" : d < 0 ? "−" : "") + (u === "cm" ? dsNum(Math.abs(d)) + " cm" : u === "mm" ? Math.round(Math.abs(d)) + " mm" : Math.round(Math.abs(d)) + "°") });
    }
  });
  return righe;
}
function dsConfrontoRender(){
  const ov = document.getElementById("ds-confronto"); if(!ov) return;
  const data = x => { const d = x.info.data_documento || String(x.info.creato_il || "").slice(0, 10); return d ? new Date(d + "T12:00").toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }).replace(".", "") : ""; };
  const righe = dsConfrontoValori(), calibrate = CF.a.segni.cal && CF.b.segni.cal;
  ov.innerHTML = `<div class="arc-testa"><button class="arc-ico" aria-label="Indietro" onclick="dsConfrontoChiudi()"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button>
      <div><div class="arc-tit">Prima / dopo</div><div class="arc-sotto">${arcEsc(CF.a.info.titolo?.split(" · ")[0] || "")}</div></div></div>
    <div class="arc-seg" role="group" aria-label="Vista"><button class="${CF.modo === "affiancate" ? "on" : ""}" onclick="dsConfrontoModo('affiancate')">Affiancate</button><button class="${CF.modo === "sovrapposte" ? "on" : ""}" onclick="dsConfrontoModo('sovrapposte')">Sovrapposte</button></div>
    ${CF.modo === "affiancate" ? `<div class="cf-due">${[CF.a, CF.b].map((x, i) => `<div><canvas class="cf-cv" id="cf-cv-${i}"></canvas><b>${i ? "Dopo" : "Prima"} · ${arcEsc(data(x))}</b><small>${x.segni.cal ? "Calibrata · " + arcEsc(x.segni.cal.rif || "") : "Non calibrata"}</small></div>`).join("")}</div>`
      : `<div class="cf-uno"><canvas class="cf-cv" id="cf-cv-s"></canvas><label class="cf-trasp">Prima <input type="range" min="0" max="1" step="0.05" value="${CF.trasp}" oninput="CF.trasp = Number(this.value); dsConfrontoDisegna()" aria-label="Trasparenza"> Dopo</label></div>`}
    <div class="cf-tab">${righe.length ? righe.map(r => `<div class="cf-r"><span>${arcEsc(r.n)}</span><span class="m">${arcEsc(r.a)}</span><span>→</span><b>${arcEsc(r.b)}</b><span class="d">${arcEsc(r.d)}</span></div>`).join("")
      : '<div class="cf-vuoto">Nessuna misura da confrontare: usa Misura, Angolo o Bilancia su tutte e due le foto, o «Copia i segni».</div>'}</div>
    <div class="cf-nota">${calibrate ? "Tutte e due le foto sono calibrate: le misure in cm si possono confrontare." : "Le misure in cm si confrontano solo se le due foto sono calibrate (angoli sì)."} «Copia i segni» riporta i segni della foto di prima su quella di dopo.</div>
    <div class="cf-bott"><button class="arc-btn" onclick="dsCopiaSegni()">Copia i segni</button><button class="arc-btn pri" id="cf-salva" onclick="dsSalvaConfronto()">Salva il confronto</button></div>`;
  dsConfrontoDisegna();
}
function dsConfrontoModo(m){ CF.modo = m; dsConfrontoRender(); }
function dsConfrontoDisegna(){
  const disegna = (cv, x, alpha) => {
    if(!cv || !x?.img) return; const dpr = window.devicePixelRatio || 1, cw = cv.clientWidth || 160, ch = cv.clientHeight || 220;
    if(cv.width !== Math.round(cw * dpr)){ cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
    const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = dsAdatta(cw, ch, x.img.naturalWidth, x.img.naturalHeight);
    ctx.globalAlpha = alpha; ctx.drawImage(x.img, r.x, r.y, r.w, r.h); ctx.globalAlpha = 1;
    dsDisegnaSegni(ctx, x.segni, r, x.img.naturalWidth, x.img.naturalHeight, { scala: 0.8 });
  };
  if(CF.modo === "affiancate"){ [0, 1].forEach(i => { const cv = document.getElementById("cf-cv-" + i); if(cv) cv.getContext("2d").clearRect(0, 0, cv.width, cv.height); disegna(cv, i ? CF.b : CF.a, 1); }); }
  else { const cv = document.getElementById("cf-cv-s"); if(!cv) return; cv.getContext("2d").clearRect(0, 0, cv.width, cv.height); disegna(cv, CF.a, 1); disegna(cv, CF.b, CF.trasp); }
}
async function dsCopiaSegni(){
  if(!CF.b.info.mio) return arcToast("Puoi copiare i segni solo su una foto tua.");
  if(!CF.a.segni.items.length) return arcToast("La foto di prima non ha segni da copiare.");
  CF.b.segni.items = CF.b.segni.items.concat(CF.a.segni.items.map(it => ({ ...it, id: "s" + Math.random().toString(36).slice(2, 9), p: it.p.map(q => q.slice()) })));
  const { error } = await arcDB.aggiorna(CF.b.info.id, { segni: CF.b.segni });
  if(error) return arcToast("Segni non salvati, riprova.");
  arcToast("Segni copiati: spostali dove servono con «Disegna»"); dsConfrontoRender();
}
async function dsSalvaConfronto(){
  const btn = document.getElementById("cf-salva"); if(btn) btn.disabled = true;
  try{
    const ca = dsCanvasConSegni(CF.a.img, CF.a.segni, { maxLato: 1200 }), cb = dsCanvasConSegni(CF.b.img, CF.b.segni, { maxLato: 1200 });
    const h = Math.max(ca.height, cb.height), testa = 56, cv = document.createElement("canvas");
    cv.width = ca.width + cb.width + 24; cv.height = h + testa;
    const ctx = cv.getContext("2d"); ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.drawImage(ca, 0, testa); ctx.drawImage(cb, ca.width + 24, testa);
    ctx.fillStyle = "#1c160c"; ctx.font = '700 28px "DM Sans", sans-serif'; ctx.textBaseline = "middle";
    ctx.fillText("Prima · " + (CF.a.info.data_documento || ""), 8, testa / 2); ctx.fillText("Dopo · " + (CF.b.info.data_documento || ""), ca.width + 32, testa / 2);
    const blob = await new Promise(r => cv.toBlob(r, "image/jpeg", 0.9));
    if(!blob) throw new Error("immagine");
    const d = CF.b.info, r = await DB.caricaDocumentoPrivato({ blob, mime: "image/jpeg", categoria: "foto_clinica", cavallo_nome: (d.titolo || "").split(" · ")[0], nota: "Prima/dopo",
      horse_id: d.horse_id || null, cavallo_cliente_id: d.cavallo_cliente_id || null, autore_ruolo: (typeof eVeterinario === "function" && eVeterinario()) ? "veterinario" : "maniscalco" });
    if(!r?.id) throw new Error(r?.error?.message || "salvataggio");
    arcToast("Confronto salvato nell'Archivio"); dsConfrontoChiudi(); if(typeof arcRicarica === "function") arcRicarica();
  }catch(err){ arcToast(/tainted|insecure|SecurityError/i.test(String(err?.message || err)) ? "Non riesco a unire le foto su questo telefono." : "Confronto non salvato: " + (err?.message || err)); }
  finally{ if(btn) btn.disabled = false; }
}
function dsConfrontoChiudi(){ const ov = document.getElementById("ds-confronto"); if(ov){ ov.classList.remove("aperto"); ov.innerHTML = ""; } if(document.getElementById("ds-editor")?.classList.contains("aperto")) dsDisegna(); }

export { DS, CF, dsValore, dsEtichetta, dsNormalizza, dsDisegnaSegni, dsFiligrana, dsCanvasConSegni, dsCaricaImmagine, dsAdatta,
  dsApri, dsChiudi, dsSalva, dsStrumento, dsColore, dsMostra, dsSeleziona, dsTogli, dsNota, dsCalibra, dsAnnulla, dsRifai,
  dsConfronto, dsConfrontoScegli, dsConfrontoModo, dsConfrontoDisegna, dsCopiaSegni, dsSalvaConfronto, dsConfrontoChiudi };
