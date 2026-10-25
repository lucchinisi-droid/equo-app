// Equo App · proprietario · modulo (moduli ES, costruiti con Vite in ruoli/proprietario/costruito.js)
/* ---------- EQUO CARD (26/10/2026) ----------
   Dalla barra in alto (quarta icona). Una card per ogni cavallo, da scorrere: davanti foto (copertina dell'album o foto del
   Diario; senza foto l'icona Equo), nome, razza, età, attività, codice e livello; toccandola si gira: QR (scheda pubblica del
   cavallo), microchip, anno di nascita e mantello, «Attività: …» (o «–»), proprietario, dove sta. Riflesso olografico che segue
   il dito o l'inclinazione del telefono.
   Sotto: gli anelli della salute.
   - Cura: ultimo evento di ogni tipo del libretto (ferratura, vaccino, Coggins, sverminazione): ogni scadenza superata toglie 45%.
   - Movimento: momenti del Diario di allenamento/passeggiata/lezione e lezioni del calendario negli ultimi 7 giorni, su un
     obiettivo settimanale (horses.obiettivo_settimana, predefinito 4).
   - Attenzioni: da quanto tempo c'è l'ultimo momento nel Diario.
   Database: horses.attivita, horses.obiettivo_settimana (schema-equo-card.sql). */
const EC_GRAD = [
  "linear-gradient(135deg,#1f5a46 0%,#0e3328 55%,#b8862c 140%)",
  "linear-gradient(135deg,#6b2340 0%,#3a1023 60%,#e0a35a 150%)",
  "linear-gradient(135deg,#23407a 0%,#101f45 60%,#c9a86a 150%)",
  "linear-gradient(135deg,#5b3a12 0%,#2b1a06 60%,#e8b04b 150%)",
  "linear-gradient(135deg,#2c4a52 0%,#122429 60%,#9fd0c0 150%)",
];
const EC_LIVELLO = { provvisorio: "PROVVISORIO", validato: "VALIDATO ✓", certificato: "CERTIFICATO ★" };
const EC_LOGO = "assets/equo-card-cavallo.png";
let ecDati = null, ecAttuale = -1, ecMov = false, ecRaf = null;

function ecEsc(s){ return escapeHtml(s == null ? "" : String(s)); }
function ecCodice(h){ return h.codice_definitivo || h.codice_equo || ""; }
function ecLinkPubblico(h){ return "https://app.equohub.com/cavallo/" + encodeURIComponent(ecCodice(h)); }
function ecAnni(h){ const a = h.birth_date ? Number(String(h.birth_date).slice(0, 4)) : null; return a ? Math.max(0, new Date().getFullYear() - a) : null; }
function ecFoto(h){
  try{
    const rows = (typeof albumCache !== "undefined" && albumCache[h.id]) || [];
    const cov = rows.find(r => r.copertina) || rows[0];
    if(cov && albumUrlMap[cov.path]) return albumUrlMap[cov.path];
    const v = (ecDati?.diario || []).find(x => x.horse_id === h.id && x.media_path && x.tipo === "foto");
    if(v && diarioUrl[v.media_path]) return diarioUrl[v.media_path];
  }catch(e){}
  return null;
}
function ecProprietario(){ const u = currentUser || {}; return u.fullName || u.full_name || u.nome || (u.email ? String(u.email).split("@")[0] : "") || "–"; }
function ecDove(h){
  if(h.ubicazione_tipo === "casa") return "A casa";
  return h.ubicazione_nome || (h.stable_id ? "In scuderia" : "–");
}
function ecQrSvg(testo){
  if(typeof QRCode !== "function") return "";
  const d = document.createElement("div");
  new QRCode(d, { text: testo, width: 120, height: 120 });
  const s = d.querySelector("svg");
  return s ? s.outerHTML : "";
}

// ---- dati per gli anelli ----
async function ecCaricaDati(lista){
  const ids = lista.map(h => h.id);
  const oggi = new Date(); oggi.setHours(0, 0, 0, 0);
  const da14 = new Date(oggi.getTime() - 14 * 864e5).toISOString();
  const sicuro = p => Promise.resolve().then(p).catch(() => []);
  const [eventi, diario, lezioni] = await Promise.all([
    sicuro(() => ids.length ? DB.listEventiTutti(ids) : []),
    sicuro(async () => {
      if(DEMO_MODE || !ids.length) return [];
      const { data, error } = await sb.from("diario_voci").select("id, horse_id, data_voce, categoria, tipo, media_path").in("horse_id", ids).eq("nascosta", false).gte("data_voce", da14).order("data_voce", { ascending: false }).limit(400);
      if(error) return [];
      try{ await firmaUrl("diario-media", (data || []).filter(v => v.tipo === "foto").map(v => v.media_path), diarioUrl); }catch(e){}
      return data || [];
    }),
    sicuro(() => DB.listLezioni()),
  ]);
  // copertine dell'album (prima volta)
  await Promise.all(ids.map(id => (typeof albumCache !== "undefined" && albumCache[id]) ? null : sicuro(() => albumFetch(id))));
  return { eventi: eventi || [], diario: diario || [], lezioni: lezioni || [] };
}
function ecGiorni(da, a){ return Math.round((new Date(a).setHours(0, 0, 0, 0) - new Date(da).setHours(0, 0, 0, 0)) / 864e5); }
function ecAnelli(h){
  const oggi = new Date(), d = ecDati || { eventi: [], diario: [], lezioni: [] };
  // CURA
  const ev = d.eventi.filter(e => e.horse_id === h.id);
  const ultimi = {};
  ev.forEach(e => { if(!ultimi[e.type] || String(e.date) > String(ultimi[e.type].date)) ultimi[e.type] = e; });
  const conScad = Object.values(ultimi).filter(e => e.next_due_date);
  const scaduti = conScad.filter(e => ecGiorni(oggi, e.next_due_date) < 0);
  let cura, curaTesto;
  if(!ev.length){ cura = 0; curaTesto = "Segna ferratura e vaccini nel libretto"; }
  else if(!conScad.length){ cura = 70; curaTesto = "Nessuna scadenza impostata nel libretto"; }
  else {
    cura = Math.max(0, 100 - 45 * scaduti.length);
    const nome = t => (typeof EVENT_LABELS !== "undefined" && EVENT_LABELS[t]) || t;
    curaTesto = scaduti.length
      ? scaduti.map(e => nome(e.type) + " scaduta da " + (-ecGiorni(oggi, e.next_due_date)) + " giorni").join(" · ").replace("Vaccino scaduta", "Vaccino scaduto").replace("Test Coggins scaduta", "Test Coggins scaduto")
      : conScad.sort((a, b) => String(a.next_due_date).localeCompare(String(b.next_due_date))).slice(0, 2).map(e => { const g = ecGiorni(oggi, e.next_due_date); return nome(e.type) + (g === 0 ? " oggi" : " tra " + g + " giorni"); }).join(" · ");
  }
  // MOVIMENTO
  const da7 = new Date(oggi.getTime() - 7 * 864e5);
  const uscite = d.diario.filter(v => v.horse_id === h.id && ["allenamento", "passeggiata", "lezione"].includes(v.categoria) && new Date(v.data_voce) >= da7).length
    + d.lezioni.filter(l => l.horse_id === h.id && new Date(l.data) >= da7 && new Date(l.data) <= oggi).length;
  const obiettivo = Math.max(1, Number(h.obiettivo_settimana) || 4);
  const mov = Math.min(100, Math.round(uscite / obiettivo * 100));
  const movTesto = uscite + " su " + obiettivo + " questa settimana" + (uscite >= obiettivo ? ": bravo!" : "");
  // ATTENZIONI
  const ultimo = d.diario.filter(v => v.horse_id === h.id).sort((a, b) => String(b.data_voce).localeCompare(String(a.data_voce)))[0];
  let att, attTesto;
  if(!ultimo){ att = 0; attTesto = "Nessun momento nel Diario da 2 settimane"; }
  else {
    const g = ecGiorni(ultimo.data_voce, oggi);
    att = g <= 2 ? 100 : g <= 7 ? 70 : 40;
    attTesto = "Ultimo momento nel Diario: " + (g === 0 ? "oggi" : g === 1 ? "ieri" : g + " giorni fa");
  }
  return { valori: [cura, mov, att], testi: [curaTesto, movTesto, attTesto], obiettivo };
}

// ---- disegno ----
function ecCardHtml(h, i){
  const anni = ecAnni(h), foto = ecFoto(h), liv = h.codice_livello || "provvisorio";
  const anno = h.birth_date ? String(h.birth_date).slice(0, 4) : "";
  return `<div class="ec-slot"><div class="ec-carta" data-i="${i}" onclick="ecGira(this)">
    <div class="ec-faccia" style="background:${EC_GRAD[i % EC_GRAD.length]}">
      <div class="ec-olo"></div><div class="ec-trama"></div><div class="ec-luce"></div>
      <div class="ec-alto"><div class="ec-marchio">Equo<small>CARD</small></div><div class="ec-livello">${EC_LIVELLO[liv] || liv.toUpperCase()}</div></div>
      <div class="ec-mezzo"><div class="ec-foto${foto ? " vera" : ""}">${foto ? `<img src="${ecEsc(foto)}" alt="">` : `<img src="${EC_LOGO}" alt="">`}</div>
        <div class="ec-txt"><div class="ec-nome">${ecEsc(h.name)}</div><div class="ec-dett">${ecEsc(h.breed || "Razza non indicata")}<br>${anni != null ? anni + (anni === 1 ? " anno" : " anni") : ""}</div>${h.attivita ? `<div class="ec-attivo">${ecEsc(h.attivita)}</div>` : ""}</div></div>
      <div class="ec-basso"><div class="ec-codice">${ecEsc(ecCodice(h))}</div><div class="ec-chip"></div></div>
    </div>
    <div class="ec-faccia ec-retro" style="background:${EC_GRAD[i % EC_GRAD.length]}">
      <div class="ec-olo"></div><div class="ec-trama"></div><div class="ec-luce"></div>
      <div class="ec-griglia"><div class="ec-qr">${ecCodice(h) ? ecQrSvg(ecLinkPubblico(h)) : '<div class="ec-qr-vuoto">Il QR arriva con il codice Equo del cavallo</div>'}</div>
        <div class="ec-dati">
          <div><span>Microchip</span>${ecEsc(h.microchip || "–")}</div>
          <div><span>Anno di nascita</span>${ecEsc([anno, h.mantello].filter(Boolean).join(" · ") || "–")}</div>
          <div><span>Attività</span>${ecEsc(h.attivita || "–")}</div>
          <div><span>Proprietario</span>${ecEsc(ecProprietario())}</div>
          <div><span>Dove sta</span>${ecEsc(ecDove(h))}</div>
        </div></div>
    </div>
  </div></div>`;
}
function ecLista(){ return (typeof cavalliUsabili === "function" ? cavalliUsabili() : (horses || [])) || []; }
async function apriEquoCard(){
  const lista = ecLista();
  const box = document.getElementById("equo-card");
  if(!box) return;
  box.classList.add("on");
  document.body.classList.add("ec-aperta");
  const giostra = document.getElementById("ec-giostra");
  if(!lista.length){
    giostra.innerHTML = `<div class="ec-vuoto">Aggiungi il tuo primo cavallo per avere la sua Equo Card.<br><button class="btn btn-primary" style="margin-top:12px" onclick="chiudiEquoCard();openHorseForm()">Aggiungi cavallo</button></div>`;
    document.getElementById("ec-punti").innerHTML = ""; document.getElementById("ec-salute").style.display = "none"; document.getElementById("ec-esito").style.display = "none";
    return;
  }
  document.getElementById("ec-salute").style.display = ""; document.getElementById("ec-esito").style.display = "";
  giostra.innerHTML = lista.map(ecCardHtml).join("");
  document.getElementById("ec-punti").innerHTML = lista.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("");
  ecAttuale = -1;
  giostra.scrollLeft = 0;
  ecMostraSalute(0);
  ecAnima();
  ecDati = await ecCaricaDati(lista);
  giostra.innerHTML = lista.map(ecCardHtml).join("");   // con le foto appena firmate
  ecAttuale = -1; ecMostraSalute(ecIndice());
}
function chiudiEquoCard(){
  document.getElementById("equo-card")?.classList.remove("on");
  document.body.classList.remove("ec-aperta");
  if(ecRaf) cancelAnimationFrame(ecRaf); ecRaf = null;
}
function ecIndice(){
  const g = document.getElementById("ec-giostra"), s = g && g.querySelector(".ec-slot");
  if(!s) return 0;
  return Math.max(0, Math.min(ecLista().length - 1, Math.round(g.scrollLeft / (s.offsetWidth + 14))));
}
function ecGira(el){ ecChiediMovimento(); el.classList.toggle("girata"); }
function ecMostraSalute(i){
  const lista = ecLista(); const h = lista[i];
  if(!h || i === ecAttuale) return;
  ecAttuale = i;
  document.querySelectorAll("#ec-punti i").forEach((p, k) => p.classList.toggle("on", k === i));
  const a = ecAnelli(h);
  document.getElementById("ec-s-tit").textContent = "Salute di " + h.name;
  const col = ["var(--ec-cura)", "var(--ec-mov)", "var(--ec-att)"], rr = [56, 42, 28], nomi = ["Cura", "Movimento", "Attenzioni"];
  const svg = document.getElementById("ec-anelli");
  svg.innerHTML = rr.map((r, k) => `<circle class="fondo" cx="66" cy="66" r="${r}" stroke="${col[k]}" stroke-width="11"/><circle class="val" cx="66" cy="66" r="${r}" stroke="${col[k]}" stroke-width="11" stroke-dasharray="${(2 * Math.PI * r).toFixed(2)}" stroke-dashoffset="${(2 * Math.PI * r).toFixed(2)}"/>`).join("");
  requestAnimationFrame(() => requestAnimationFrame(() => svg.querySelectorAll(".val").forEach((el, k) => { const L = 2 * Math.PI * rr[k]; el.style.strokeDashoffset = (L * (1 - a.valori[k] / 100)).toFixed(2); })));
  document.getElementById("ec-voci").innerHTML = nomi.map((n, k) => `<button type="button" class="ec-voce" onclick="ecAzione(${k})"><i style="background:${col[k]}"></i><span><b>${n} · ${a.valori[k]}%</b><small>${ecEsc(a.testi[k])}</small></span></button>`).join("");
  const tutti = a.valori.every(v => v >= 100), da = nomi.filter((_, k) => a.valori[k] < 70);
  document.getElementById("ec-esito").innerHTML = tutti ? `✨ <b>Tutti gli anelli chiusi!</b> ${ecEsc(h.name)} è in perfetta forma: cura, movimento e attenzioni al 100%.`
    : da.length ? `Da sistemare: <b>${da.map(x => x.toLowerCase()).join(", ").replace(/, ([^,]*)$/, " e $1")}</b>. Tocca una voce per sapere cosa fare.`
    : `Quasi perfetto: ancora un po' e chiudi tutti gli anelli di ${ecEsc(h.name)}.`;
  const box = document.getElementById("ec-salute"); box.classList.remove("ec-festa");
  document.getElementById("ec-coriandoli").innerHTML = "";
  if(tutti) setTimeout(() => { if(ecAttuale !== i) return; box.classList.add("ec-festa"); ecCoriandoli(); }, 1250);
}
function ecCoriandoli(){
  const cc = ["#f2b544", "#3fd18a", "#7cc4ff", "#ff8a5c", "#ffffff"];
  document.getElementById("ec-coriandoli").innerHTML = Array.from({ length: 34 }, () => `<i style="left:${Math.random() * 100}%;background:${cc[Math.floor(Math.random() * cc.length)]};animation-delay:${Math.random() * .5}s;animation-duration:${1.2 + Math.random() * .9}s"></i>`).join("");
}
// tocco su una voce: cosa fare
async function ecAzione(k){
  const h = ecLista()[Math.max(0, ecAttuale)]; if(!h) return;
  if(k === 0){ chiudiEquoCard(); if(typeof apriSchedaCavallo === "function") apriSchedaCavallo(h.id); return; }
  if(k === 2){ chiudiEquoCard(); showPage("diario"); return; }
  // Movimento: obiettivo settimanale
  const attuale = Math.max(1, Number(h.obiettivo_settimana) || 4);
  const v = prompt("Quante uscite a settimana vuoi fare con " + h.name + "? (allenamenti, passeggiate, lezioni)", String(attuale));
  if(v == null) return;
  const n = Math.round(Number(v));
  if(!(n >= 1 && n <= 14)){ showToast("Scrivi un numero da 1 a 14"); return; }
  if(DEMO_MODE){ h.obiettivo_settimana = n; }
  else {
    const { error } = await sb.from("horses").update({ obiettivo_settimana: n }).eq("id", h.id);
    if(error){ showToast(/obiettivo_settimana/.test(error.message || "") ? "Funzione non ancora attiva: serve l'aggiornamento del database." : "Non salvato, riprova."); return; }
    h.obiettivo_settimana = n;
  }
  ecAttuale = -1; ecMostraSalute(ecIndice());
}
// effetto olografico
function ecLuce(x, y){ document.querySelectorAll("#equo-card .ec-faccia").forEach(f => { f.style.setProperty("--mx", x); f.style.setProperty("--my", y); f.style.setProperty("--a", (x + y) * 3); }); }
function ecChiediMovimento(){
  if(ecMov) return; ecMov = true;
  const on = () => window.addEventListener("deviceorientation", e => { if(e.gamma == null || !document.body.classList.contains("ec-aperta")) return; ecLuce(50 + e.gamma * 1.6, 40 + (e.beta - 40) * 1.2); });
  try{
    if(typeof DeviceOrientationEvent !== "undefined" && DeviceOrientationEvent.requestPermission) DeviceOrientationEvent.requestPermission().then(s => { if(s === "granted") on(); }).catch(() => {});
    else on();
  }catch(e){}
}
function ecAnima(){
  let t = 0;
  const giro = () => { if(!document.body.classList.contains("ec-aperta")) return; if(!ecMov){ t += .012; ecLuce(50 + Math.sin(t) * 35, 35 + Math.cos(t * .8) * 25); } ecRaf = requestAnimationFrame(giro); };
  if(ecRaf) cancelAnimationFrame(ecRaf);
  ecRaf = requestAnimationFrame(giro);
}
function ecInit(){
  const g = document.getElementById("ec-giostra");
  if(!g || g.dataset.pronto) return;
  g.dataset.pronto = "1";
  g.addEventListener("scroll", () => ecMostraSalute(ecIndice()), { passive: true });
  g.addEventListener("pointermove", e => { const c = e.target.closest(".ec-carta"); if(!c) return; const r = c.getBoundingClientRect(); ecLuce(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100); });
}
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", ecInit); else setTimeout(ecInit, 0);

// ---- QR a schermo intero e condivisione (immagine della card) ----
function ecMostraQr(){
  const h = ecLista()[Math.max(0, ecAttuale)]; if(!h) return;
  if(!ecCodice(h)){ showToast("Questo cavallo non ha ancora un codice Equo."); return; }
  document.getElementById("ec-qr-g").innerHTML = ecQrSvg(ecLinkPubblico(h));
  document.getElementById("ec-qr-t").textContent = h.name + " · " + ecCodice(h);
  document.getElementById("ec-qrgrande").classList.add("on");
}
function ecCaricaImg(src){ return new Promise(res => { if(!src) return res(null); const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }); }
async function ecImmagineCard(h, i){
  const W = 1012, H = 638, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const x = cv.getContext("2d");
  const colori = [["#1f5a46", "#0e3328"], ["#6b2340", "#3a1023"], ["#23407a", "#101f45"], ["#5b3a12", "#2b1a06"], ["#2c4a52", "#122429"]][i % 5];
  const r = 44;
  x.beginPath(); x.moveTo(r, 0); x.arcTo(W, 0, W, H, r); x.arcTo(W, H, 0, H, r); x.arcTo(0, H, 0, 0, r); x.arcTo(0, 0, W, 0, r); x.closePath(); x.clip();
  const gr = x.createLinearGradient(0, 0, W, H); gr.addColorStop(0, colori[0]); gr.addColorStop(.62, colori[1]); gr.addColorStop(1, "#b8862c"); x.fillStyle = gr; x.fillRect(0, 0, W, H);
  x.fillStyle = "#fff"; x.font = "800 46px -apple-system,Helvetica,Arial"; x.fillText("Equo", 54, 92);
  x.font = "500 26px -apple-system,Helvetica,Arial"; x.globalAlpha = .8; x.fillText("CARD", 182, 92); x.globalAlpha = 1;
  const liv = EC_LIVELLO[h.codice_livello || "provvisorio"] || "";
  x.font = "700 24px -apple-system,Helvetica,Arial"; const lw = x.measureText(liv).width + 36;
  x.fillStyle = "rgba(255,255,255,.22)"; x.beginPath(); x.roundRect ? x.roundRect(W - 54 - lw, 56, lw, 50, 25) : x.rect(W - 54 - lw, 56, lw, 50); x.fill();
  x.fillStyle = "#fff"; x.fillText(liv, W - 54 - lw + 18, 90);
  const foto = await ecCaricaImg(ecFoto(h) || EC_LOGO);
  if(foto){ x.save(); x.beginPath(); x.arc(150, 300, 96, 0, Math.PI * 2); x.clip(); const s = Math.max(192 / foto.width, 192 / foto.height); x.drawImage(foto, 150 - foto.width * s / 2, 300 - foto.height * s / 2, foto.width * s, foto.height * s); x.restore(); }
  x.fillStyle = "#fff"; x.font = "800 70px -apple-system,Helvetica,Arial"; x.fillText(h.name || "", 284, 290);
  x.font = "400 32px -apple-system,Helvetica,Arial"; x.globalAlpha = .9;
  const anni = ecAnni(h); x.fillText([h.breed, anni != null ? anni + " anni" : null, h.attivita].filter(Boolean).join(" · "), 284, 342); x.globalAlpha = 1;
  x.font = "500 40px ui-monospace,Menlo,monospace"; x.fillText(ecCodice(h), 54, H - 54);
  if(ecCodice(h) && typeof QRCode === "function"){
    const d = document.createElement("div"); new QRCode(d, { text: ecLinkPubblico(h), width: 200, height: 200 });
    const qc = d.querySelector("canvas");
    if(qc){ x.fillStyle = "#fff"; x.fillRect(W - 54 - 200, H - 54 - 200, 200, 200); x.imageSmoothingEnabled = false; x.drawImage(qc, W - 54 - 190, H - 54 - 190, 180, 180); }
  }
  return new Promise(res => cv.toBlob(b => res(b), "image/png"));
}
async function ecCondividi(){
  const lista = ecLista(), i = Math.max(0, ecAttuale), h = lista[i]; if(!h) return;
  showToast("Preparo la card…");
  try{
    const blob = await ecImmagineCard(h, i);
    const file = new File([blob], "Equo-Card-" + String(h.name || "cavallo").replace(/[^A-Za-z0-9]+/g, "-") + ".png", { type: "image/png" });
    if(navigator.canShare && navigator.canShare({ files: [file] })){
      try{ await navigator.share({ files: [file], title: "Equo Card di " + h.name, text: ecCodice(h) ? ecLinkPubblico(h) : "" }); return; }
      catch(e){ if(e?.name === "AbortError") return; }
    }
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }catch(e){ showToast("Non riesco a creare l'immagine, riprova."); }
}

export { apriEquoCard, chiudiEquoCard, ecAzione, ecCondividi, ecGira, ecMostraQr };
