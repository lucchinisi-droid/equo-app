// Equo App · veterinario · REFERTO PDF della visita (2/11/2026, passo 2)
// Dalla scheda della visita: anteprima («Referto pronto»), chi lo riceve, «Scorri per firmare e inviare».
// Il PDF va nello spazio PRIVATO «documenti» (SQL 32): in chat arriva come «equo-doc:<id>» e si apre solo con un link temporaneo,
// per chi ha l'accesso (claude/Equo_Privacy_documenti.md). «Condividi» manda il file fuori da Equo (WhatsApp, email): scelta del veterinario.
// 2/11/2026 (passo 4): il referto è come un esame vero: prima i DATI della scheda, poi la PARTE SCRITTA
//   «Relazione del veterinario» (relazione dettata + diagnosi/conclusioni) e «Terapia e indicazioni» (terapia dettata + campi
//   terapia, cosa fare, ricontrollo, REV, DPA, sospensione): questi campi escono dai dati per non comparire due volte.
// Arrivano dopo: maniscalco come destinatario, piano terapeutico.

import { VS, vsSalvaSubito, vsTesta, vsNomeCavallo, vsMostraScheda, vsChiudi } from "./07-scheda-visita.js";
import { VA } from "./09-allegati.js";

const vrEsc = s => escapeHtml(s == null ? "" : String(s));

/* ---- testo del referto dai campi compilati ---- */
function vrValore(c, v){
  if(v == null || v === "" || (Array.isArray(v) && !v.length)) return null;
  if(c.t === "mappa") return typeof mpTesto === "function" ? mpTesto(c, v) : null;   // mappe del cavallo (13)
  if(Array.isArray(v)) return v.join(", ");
  if(c.t === "sino") return v ? "Sì" : "No";
  if(c.t === "scala") return v + "/" + (c.max || 5);
  if(c.t === "data") { const [y, m, d] = String(v).split("-"); return d ? `${d}/${m}/${y}` : String(v); }
  return String(v);
}
// campi che nel referto vanno nella parte scritta (sezioni 3 e 4) e non nei dati
const VR_REL = ["diagnosi", "conclusioni"];
const VR_TER = ["terapia", "cosa_fare", "ricontrollo", "rev", "dpa", "sospensione"];
function vrSezioni(){
  const v = VS.visita, d = v.dati || {}, mtc = v.modello === "mtc";
  const out = [];
  (VS.campi || []).forEach(c => {
    if(VR_REL.includes(c.k) || VR_TER.includes(c.k)) return;
    const val = vrValore(c, d[c.k]); if(val == null) return;
    const nomeSez = mtc ? ({ mtc: "Valutazione MTC", fisio: "Fisioterapia", tratt: "Trattamento" }[c.tab] + " · " + c.s) : (c.s || "Visita");
    let s = out.find(x => x.n === nomeSez); if(!s){ s = { n: nomeSez, r: [] }; out.push(s); }
    s.r.push([c.e, val]);
  });
  return out;
}
// parte scritta: { relazione, rel: [[campo, valore]], indicazioni, ter: [[campo, valore]] }
function vrParteScritta(){
  const d = VS.visita?.dati || {}, campi = VS.campi || [];
  const righe = chiavi => chiavi.map(k => { const c = campi.find(x => x.k === k); const val = c ? vrValore(c, d[k]) : null; return val == null ? null : [c.e, val]; }).filter(Boolean);
  // piano terapeutico (11): voci e fine del tempo di attesa
  const piano = typeof ptRigheReferto === "function" ? ptRigheReferto() : [], attesa = typeof ptAttesaReferto === "function" ? ptAttesaReferto() : "";
  return { relazione: String(d.relazione || "").trim(), rel: righe(VR_REL), indicazioni: String(d.indicazioni || "").trim(), ter: righe(VR_TER), piano, attesa };
}
const vrScrittaVuota = p => !p.relazione && !p.rel.length && !p.indicazioni && !p.ter.length && !p.piano.length;
function vrCavallo(){
  const e = VS.e;
  const cv = (typeof cavalliCartella === "function" ? cavalliCartella() : []).find(x => x.id === e.cavallo_cliente_id) || {};
  const eta = cv.anno_nascita ? (new Date().getFullYear() - Number(cv.anno_nascita)) + " anni" : cv.data_nascita ? (new Date().getFullYear() - Number(String(cv.data_nascita).slice(0, 4))) + " anni" : "";
  return { nome: cv.nome || vsNomeCavallo(e) || "Cavallo", razza: cv.razza || "", sesso: cv.sesso || "", eta, microchip: cv.microchip || "", codice: cv.codice_equo || "",
    proprietarioId: cv.cliente_mascalcia_id || e.cliente_mascalcia_id, luogoId: cv.ubicazione_cliente_id || null };
}
const vrCliente = id => (typeof clienteDiId === "function" ? clienteDiId(id) : null);
const vrStruttura = c => !!(c && (c.tipo_cliente === "struttura" || c.centro_id));
function vrNomePro(){ return currentUser?.datiPagamentoNome || currentUser?.fullName || currentUser?.full_name || currentUser?.email || "Veterinario"; }

// destinatari: proprietario del cavallo e scuderia dove sta (se diversa)
function vrDestinatari(){
  const cav = vrCavallo(), e = VS.e, l = [];
  const prop = vrCliente(cav.proprietarioId);
  if(prop && !vrStruttura(prop)) l.push({ k: "prop", cliente: prop, nome: prop.nome, ruolo: "Proprietario", suEquo: !!prop.cliente_user_id, on: !!prop.cliente_user_id });
  const strId = cav.luogoId || (vrStruttura(vrCliente(e.cliente_mascalcia_id)) ? e.cliente_mascalcia_id : null);
  const str = vrCliente(strId);
  if(str && vrStruttura(str) && !l.some(x => x.cliente.id === str.id))
    l.push({ k: "str", cliente: str, nome: str.nome, ruolo: prop && !vrStruttura(prop) ? "Scuderia dove sta il cavallo" : "Proprietario (scuderia)", suEquo: !!(str.centro_id || str.cliente_user_id), on: !prop && !!(str.centro_id || str.cliente_user_id) });
  return l;
}

/* ---- anteprima ---- */
let VR = { dest: [], alleg: new Set() };
async function vrApri(){
  await vsSalvaSubito();
  if(!VS.visita?.id) return showToast("Scrivi prima qualcosa nella scheda");
  VS.schermo = "referto";
  const cav = vrCavallo(), sez = vrSezioni(), d = VS.visita.dati || {}, ps = vrParteScritta();
  if(!sez.length && vrScrittaVuota(ps)) return showToast("La scheda è vuota: non c'è niente da mettere nel referto");
  VR.dest = vrDestinatari(); VR.cond = VS.e?.referto_proprietario !== false;   // Fase 4 (SQL 67): il veterinario sceglie, acceso di serie
  VR.dest.forEach(x => { if(x.k === "prop" && !VR.cond) x.on = false; });
  VR.alleg = new Set([...VR.alleg].filter(id => VA.lista.some(a => a.id === id)));
  vsTesta("Referto pronto", cav.nome + " · " + VS.visita.modello_nome);
  const gia = d._referto ? `<div class="vs-nota">Referto già inviato il ${new Date(d._referto.il).toLocaleDateString("it-IT")}${d._referto.a?.length ? " a " + vrEsc(d._referto.a.join(", ")) : ""}: se lo rimandi, arriva la versione nuova.</div>` : "";
  document.getElementById("vs-corpo").innerHTML = `
    <div class="vs-galeno">Ho preparato il referto con i dati della scheda${ps.relazione ? " e la tua relazione" : ""}. <b>Rileggilo:</b> lo mandi tu, nessuno lo vede prima.</div>${gia}
    <div class="vr-foglio">
      <div class="vr-testa"><b>Referto · ${vrEsc(cav.nome)}</b><span>${new Date((VS.visita.data_visita || isoLocale(new Date())) + "T12:00").toLocaleDateString("it-IT")} · PDF</span></div>
      ${sez.map(s => `<div class="vr-sez"><h4>${vrEsc(s.n)}</h4>${s.r.map(([k, v]) => `<div class="vr-r"><span>${vrEsc(k)}</span><b>${vrEsc(v)}</b></div>`).join("")}</div>`).join("")}
      <div class="vr-sez vr-scritta"><h4>Relazione del veterinario</h4>
        <textarea id="vr-relazione" rows="${Math.min(12, Math.max(3, Math.ceil(ps.relazione.length / 45)))}" placeholder="Scrivila qui o dettala" oninput="vsCambia('relazione', this.value)">${vrEsc(ps.relazione)}</textarea>
        ${ps.rel.map(([k, v]) => `<div class="vr-r"><span>${vrEsc(k)}</span><b>${vrEsc(v)}</b></div>`).join("")}</div>
      <div class="vr-sez vr-scritta"><h4>Terapia e indicazioni</h4>
        <textarea id="vr-indicazioni" rows="${Math.min(10, Math.max(2, Math.ceil(ps.indicazioni.length / 45)))}" placeholder="Farmaci, dosi, durata, cosa fare a casa" oninput="vsCambia('indicazioni', this.value)">${vrEsc(ps.indicazioni)}</textarea>
        ${ps.ter.map(([k, v]) => `<div class="vr-r"><span>${vrEsc(k)}</span><b>${vrEsc(v)}</b></div>`).join("")}
        ${ps.piano.length ? `<div class="vr-piano"><h5>Piano terapeutico</h5>${ps.piano.map(([k, v]) => `<div class="vr-r"><span>${vrEsc(k)}</span><b>${vrEsc(v)}</b></div>`).join("")}${ps.attesa ? `<div class="vr-attesa">${vrEsc(ps.attesa)}</div>` : ""}</div>` : ""}</div>
      <button type="button" class="vd-detta piccolo" onclick="vdDetta()"><span class="c"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5"/></svg></span><span><b>Detta</b><small>Galeno scrive relazione e terapia</small></span></button>
    </div>
    ${VA.lista.length ? `<div class="vs-h">Allegati da mandare con il referto</div>${VA.lista.map(a => `<label class="vr-dest"><input type="checkbox" ${VR.alleg.has(a.id) ? "checked" : ""} onchange="this.checked ? VR.alleg.add('${a.id}') : VR.alleg.delete('${a.id}')"><span><b>${vrEsc(a.titolo)}</b><small>${vrEsc(DB.DOC_TIPI[a.categoria] || "Documento")}</small></span></label>`).join("")}` : ""}
    ${VR.dest.some(x => x.k === "prop") ? `<label class="vr-cond${VR.cond ? " on" : ""}" id="vr-cond"><input type="checkbox" ${VR.cond ? "checked" : ""} onchange="vrCond(this.checked)"><span class="vr-sw"></span>
      <span><b>Condividi il referto col proprietario</b><small>${VR.cond ? "Lo riceve in chat e resta nei documenti del suo cavallo." : "Resta privato: il proprietario vede solo data e tipo della visita."}</small></span></label>` : ""}
    <div class="vs-h">Chi lo riceve</div>
    ${VR.dest.length ? VR.dest.map((x, i) => `<label class="vr-dest${x.suEquo ? "" : " fuori"}"><input type="checkbox" id="vr-dest-${i}" ${x.on ? "checked" : ""} ${x.suEquo && !(x.k === "prop" && !VR.cond) ? "" : "disabled"} onchange="VR.dest[${i}].on = this.checked">
      <span><b>${vrEsc(x.nome)}</b><small>${vrEsc(x.ruolo)}${x.suEquo ? " · in chat su Equo" : " · non è su Equo: usa «Condividi»"}</small></span></label>`).join("")
      : '<div class="vs-nota">Nessun destinatario su Equo per questo cavallo: usa «Condividi» per mandarlo con WhatsApp o email.</div>'}
    <div class="vs-nota">Il referto resta nella cartella del cavallo in uno spazio privato: lo vedono tu e il proprietario, e chi lo riceve. Il proprietario può togliere l'accesso a chi vuole (non a te).</div>
    <div class="vr-scorri" id="vr-scorri" role="slider" aria-label="Scorri per firmare e inviare" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"
      onkeydown="if(event.key==='Enter')vrInvia()"><span class="vr-man" id="vr-man">›</span><span class="vr-tx">Scorri per firmare e inviare</span></div>`;
  document.getElementById("vs-piede").innerHTML = '<button class="vs-btn" onclick="vsMostraScheda()">Torna alla scheda</button><button class="vs-btn" onclick="vrCondividi()">Condividi</button>';
  vrScorri();
}
// 3/11/2026 (Simone: «il tasto non funziona»): oltre a scorrere, un tocco chiede conferma e invia; il gesto interrotto
// dal telefono (pointercancel) riporta il cursore all'inizio invece di lasciarlo a metà.
function vrScorri(){
  const s = document.getElementById("vr-scorri"), m = document.getElementById("vr-man"); if(!s || !m) return;
  let x0 = null, maxDx = 0;
  const torna = () => { m.style.transition = ""; m.style.left = "5px"; x0 = null; };
  s.addEventListener("pointerdown", e => { x0 = e.clientX; maxDx = 0; m.style.transition = "none"; try{ s.setPointerCapture(e.pointerId); }catch(_){} });
  s.addEventListener("pointermove", e => { if(x0 === null) return; maxDx = Math.max(maxDx, Math.abs(e.clientX - x0)); m.style.left = Math.max(5, Math.min(s.clientWidth - 53, 5 + e.clientX - x0)) + "px"; });
  s.addEventListener("pointercancel", torna);
  s.addEventListener("pointerup", async e => {
    if(x0 === null) return; m.style.transition = "";
    const dx = e.clientX - x0, fatto = dx > s.clientWidth * 0.5, tocco = maxDx < 10 && Math.abs(dx) < 10; x0 = null;
    if(fatto){ m.style.left = (s.clientWidth - 53) + "px"; return vrInvia(); }
    m.style.left = "5px";
    if(tocco && typeof chiediSiNo === "function" && await chiediSiNo("Firmi e invii il referto?", vrTestoConferma(), { si: "Firma e invia", no: "Annulla" })) vrInvia();
  });
}
function vrTestoConferma(){
  const n = (VR.dest || []).filter(x => x.on && x.suEquo).map(x => x.nome);
  return n.length ? "Lo ricevono in chat: " + n.join(", ") + "." : "Nessuno lo riceve in chat: resta nella cartella del cavallo. Per mandarlo fuori da Equo usa «Condividi».";
}

/* ---- PDF (colori del mockup C: blu notte e Tiffany) ---- */
async function vrCreaPdf(){
  const JsPDF = await caricaJsPdf();
  const doc = new JsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 18, notte = [29, 45, 80], tif = [127, 209, 201], grigio = [103, 112, 134], testo = [26, 34, 54], chiaro = [247, 244, 238];
  const cav = vrCavallo(), sez = vrSezioni(), prop = vrCliente(cav.proprietarioId);
  // disegni compilati (mappe, arti, zoccoli, lingua, denti: 13-mappe.js), dopo i dati
  const disegni = typeof mpImmaginiPdf === "function" ? await mpImmaginiPdf().catch(() => []) : [];
  const dataVisita = new Date((VS.visita.data_visita || isoLocale(new Date())) + "T12:00").toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  const testa = () => {
    doc.setFillColor(...notte); doc.rect(0, 0, W, 30, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.text("Referto veterinario", M, 18);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(dataVisita, W - M, 18, { align: "right" });
    doc.setFillColor(...tif); doc.rect(0, 30, W, 1.4, "F");
  };
  const piede = () => {
    doc.setDrawColor(230, 224, 212); doc.setLineWidth(0.2); doc.line(M, 278, W - M, 278);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.2); doc.setTextColor(...grigio);
    doc.text("Documento clinico riservato. Generato con Equo (equohub.com). Conferma in app, non firma digitale qualificata.", M, 283);
  };
  testa();
  let y = 44;
  doc.setTextColor(...notte); doc.setFont("helvetica", "bold"); doc.setFontSize(19); doc.text(cav.nome, M, y);
  y += 6; doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(...grigio);
  doc.text([cav.razza, cav.sesso, cav.eta].filter(Boolean).join(" · ") || " ", M, y);
  y += 8;
  const info = [["Proprietario", prop?.nome || "—"], ["Veterinario", vrNomePro() + (currentUser?.certificazioneStato === "verificato" ? " · Equo Certified" : "")],
    ["Visita", VS.visita.modello_nome || "Visita"], cav.microchip ? ["Microchip", cav.microchip] : null, cav.codice ? ["Codice Equo", cav.codice] : null].filter(Boolean);
  doc.setFontSize(10.5);
  info.forEach(([k, v]) => { doc.setFont("helvetica", "bold"); doc.setTextColor(...grigio); doc.text(k, M, y); doc.setFont("helvetica", "normal"); doc.setTextColor(...testo); doc.text(String(v), M + 34, y); y += 6; });
  y += 4;
  const nuovaPagina = () => { piede(); doc.addPage(); testa(); y = 42; };
  sez.forEach(s => {
    if(y > 255) nuovaPagina();
    doc.setFillColor(...chiaro); doc.rect(M, y - 5, W - M * 2, 8, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...notte); doc.text(s.n.toUpperCase(), M + 3, y); y += 8;
    s.r.forEach(([k, v]) => {
      const righe = doc.splitTextToSize(String(v), W - M * 2 - 60);
      const h = Math.max(6.2, righe.length * 5 + 1.6);
      if(y + h > 272) nuovaPagina();
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...grigio); doc.text(doc.splitTextToSize(k, 54), M + 3, y);
      doc.setTextColor(...testo); doc.text(righe, M + 60, y);
      y += h;
    });
    y += 3;
  });
  if(disegni.length){
    if(y > 225) nuovaPagina();
    doc.setFillColor(...chiaro); doc.rect(M, y - 5, W - M * 2, 8, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...notte); doc.text("DISEGNI", M + 3, y); y += 8;
    const larg = (W - M * 2 - 6) / 2;   // due per riga; denti e lingua da soli
    let col = 0, hRiga = 0;
    const aCapo = () => { y += hRiga + 4; col = 0; hRiga = 0; };
    disegni.forEach(im => {
      const box = im.grande ? [W - M * 2, 125] : [larg, 72];
      const s = Math.min(box[0] / im.w, box[1] / im.h), w = im.w * s, h = im.h * s;
      if(im.grande && col) aCapo();
      if(y + h + 6 > 272){ nuovaPagina(); col = 0; hRiga = 0; }
      const x0 = im.grande ? M : M + col * (larg + 6), lw = im.grande ? W - M * 2 : larg;
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...grigio); doc.text(im.titolo, x0 + lw / 2, y, { align: "center" });
      doc.addImage(im.url, "JPEG", x0 + (lw - w) / 2, y + 2, w, h);
      hRiga = Math.max(hRiga, h + 4);
      if(im.grande || col === 1) aCapo(); else col = 1;
    });
    if(col) aCapo();
    y += 3;
  }
  // parte scritta: relazione e terapia in prosa, a tutta larghezza, poi i campi che le completano
  const ps = vrParteScritta();
  const titoloSez = t => { if(y > 255) nuovaPagina(); doc.setFillColor(...chiaro); doc.rect(M, y - 5, W - M * 2, 8, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...notte); doc.text(t, M + 3, y); y += 8; };
  const paragrafi = t => String(t || "").split(/\n+/).map(x => x.trim()).filter(Boolean).forEach(par => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(...testo);
    doc.splitTextToSize(par, W - M * 2 - 6).forEach(r => { if(y > 272) nuovaPagina(); doc.text(r, M + 3, y); y += 5.4; });
    y += 2;
  });
  const righeCampi = l => l.forEach(([k, v]) => {
    const righe = doc.splitTextToSize(String(v), W - M * 2 - 60), h = Math.max(6.2, righe.length * 5 + 1.6);
    if(y + h > 272) nuovaPagina();
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...grigio); doc.text(doc.splitTextToSize(k, 54), M + 3, y);
    doc.setFont("helvetica", "normal"); doc.setTextColor(...testo); doc.text(righe, M + 60, y); y += h;
  });
  if(ps.relazione || ps.rel.length){ titoloSez("RELAZIONE DEL VETERINARIO"); paragrafi(ps.relazione); righeCampi(ps.rel); y += 3; }
  if(ps.indicazioni || ps.ter.length || ps.piano.length){
    titoloSez("TERAPIA E INDICAZIONI"); paragrafi(ps.indicazioni); righeCampi(ps.ter);
    if(ps.piano.length){
      if(y > 262) nuovaPagina();
      doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...notte); doc.text("Piano terapeutico", M + 3, y); y += 6;
      righeCampi(ps.piano);
      if(ps.attesa){ if(y > 272) nuovaPagina(); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...testo); doc.text(ps.attesa, M + 3, y); y += 6; }
    }
    y += 3;
  }
  const alleg = VA.lista.filter(a => VR.alleg.has(a.id));
  if(alleg.length){
    if(y > 245) nuovaPagina();
    doc.setFillColor(...chiaro); doc.rect(M, y - 5, W - M * 2, 8, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...notte); doc.text("ALLEGATI", M + 3, y); y += 8;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...testo);
    alleg.forEach(a => { if(y > 272) nuovaPagina(); doc.text("· " + a.titolo, M + 3, y); y += 6; });
  }
  if(y > 250) nuovaPagina();
  y += 8; doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...testo);
  doc.text("Confermato in app da " + vrNomePro() + " il " + new Date().toLocaleString("it-IT", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) + ".", M, y);
  piede();
  const pulisci = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  const nome = DB.nomeFileDocumento({ mime: "application/pdf", data_documento: VS.visita.data_visita, categoria: "referto" }, cav.nome);   // void pulisci
  void pulisci;
  return { blob: doc.output("blob"), nome, titolo: "Referto " + cav.nome + " · " + dataVisita };
}

/* ---- «Condividi»: il file fuori da Equo (WhatsApp, email, salva) ---- */
async function vrCondividi(){
  try{
    showToast("Creo il PDF…");
    const { blob, nome } = await vrCreaPdf();
    const file = new File([blob], nome, { type: "application/pdf" });
    if(navigator.canShare && navigator.canShare({ files: [file] })){
      try{ await navigator.share({ files: [file], title: nome }); return; }catch(err){ if(err?.name === "AbortError") return; }
    }
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  }catch(err){ console.error("referto:", err); showToast("Impossibile creare il PDF: " + (err?.message || err)); }
}

/* ---- «Scorri per firmare e inviare»: PDF nello spazio privato, accessi, messaggi in chat ---- */
async function vrInvia(){
  if(VR.invio) return; VR.invio = true;
  try{
    const scelti = VR.dest.filter(x => x.on && x.suEquo && !(x.k === "prop" && VR.cond === false));
    showToast("Preparo e invio il referto…");
    const { blob, nome, titolo } = await vrCreaPdf();
    const v = VS.visita, e = VS.e;
    const { id, error, numero } = await DB.caricaDocumentoPrivato({ blob, mime: "application/pdf", categoria: "referto", cavallo_nome: vrCavallo().nome, data_documento: v.data_visita,
      cavallo_cliente_id: v.cavallo_cliente_id || e.cavallo_cliente_id || null, horse_id: v.horse_id || e.horse_id || null, visita_id: v.id, autore_ruolo: "veterinario" });
    if(!id){ showToast(/documenti|bucket|not found|does not exist/i.test(error?.message || "") ? "Lo spazio privato dei documenti non è ancora attivo (SQL 32)." : "Errore nel salvare il referto: " + (error?.message || "riprova")); return; }
    const nomeFile = DB.nomeFileDocumento({ mime: "application/pdf", data_documento: v.data_visita, categoria: "referto", numero }, vrCavallo().nome);
    const alleg = VA.lista.filter(a => VR.alleg.has(a.id));
    const inviati = [], avvisi = [];
    for(const x of scelti){
      const c = x.cliente;
      const acc = c.centro_id && !c.cliente_user_id ? await DB.condividiDocumento(id, { centro_id: c.centro_id, motivo: "chat" })
        : c.cliente_user_id ? await DB.condividiDocumento(id, { user_id: c.cliente_user_id, motivo: "chat" }) : { ok: false };
      if(!acc?.ok){ avvisi.push(x.nome + (String(acc?.errore || "").startsWith("decide_proprietario") ? ": lo vedrà se il proprietario lo condivide" : ": non condiviso")); continue; }
      const { error: em } = await DB.insertMessaggioMascalcia({ cliente_mascalcia_id: c.id, tipo: "documento",
        testo: "Referto della visita di " + vrCavallo().nome + " (" + new Date((v.data_visita || isoLocale(new Date())) + "T12:00").toLocaleDateString("it-IT") + ")", file_url: "equo-doc:" + id, file_nome: nomeFile });
      if(em){ avvisi.push(x.nome + ": messaggio non inviato"); continue; }
      inviati.push(x.nome);
      // allegati scelti: stesso destinatario, stesso accesso, un messaggio ciascuno
      for(const a of alleg){
        const dest = c.centro_id && !c.cliente_user_id ? { centro_id: c.centro_id, motivo: "chat" } : { user_id: c.cliente_user_id, motivo: "chat" };
        const ra = await DB.condividiDocumento(a.id, dest);
        if(!ra?.ok){ avvisi.push(a.titolo + " → " + x.nome + ": non condiviso"); continue; }
        await DB.insertMessaggioMascalcia({ cliente_mascalcia_id: c.id, tipo: /^image\//.test(a.mime || "") ? "foto" : /^video\//.test(a.mime || "") ? "video" : "documento",
          testo: a.titolo, file_url: "equo-doc:" + a.id, file_nome: DB.nomeFileDocumento(a, vrCavallo().nome) });
      }
    }
    // piano terapeutico ancora in bozza: parte con il referto (il riassunto è nel PDF)
    if(typeof ptAvviaDaReferto === "function"){ try{ await ptAvviaDaReferto(); }catch(err){ avvisi.push("Piano terapeutico non avviato: " + (err?.message || err)); } }
    // non condiviso col proprietario: il file lo vedono solo l'autore e chi l'ha ricevuto (SQL 67)
    if(VR.cond === false){ const r = await vrDB.refertoSoloAutore(id, true); if(r?.error) avvisi.push("Il referto non è segnato come privato: manca un aggiornamento del database (SQL 67)."); }
    if(e?.id && (e.referto_proprietario !== false) !== (VR.cond !== false)) await vrSalvaScelta(e, VR.cond !== false);
    v.dati = { ...(v.dati || {}), _referto: { il: new Date().toISOString(), a: inviati, documento_id: id, allegati: alleg.length, privato: VR.cond === false } };
    await vsSalvaSubito();
    vrFatto(inviati, avvisi);
  }catch(err){ console.error("referto:", err); showToast("Impossibile inviare il referto: " + (err?.message || err)); }
  finally{ VR.invio = false; }
}
function vrFatto(inviati, avvisi){
  VS.schermo = "referto-fatto";
  vsTesta("Fatto", vrCavallo().nome);
  const prop = VR.dest.find(x => x.k === "prop" && inviati.includes(x.nome));
  document.getElementById("vs-corpo").innerHTML = `<div class="vr-ok"><span class="vr-spunta">✓</span><b>Referto ${inviati.length ? "inviato" : "salvato"}</b>
    <span>${inviati.length ? "In chat a " + vrEsc(inviati.join(", ")) + "." : "È nella cartella del cavallo, nello spazio privato."} Lo trovi anche nella scheda della visita.</span></div>
    ${avvisi.length ? `<div class="vs-nota">${avvisi.map(vrEsc).join("<br>")}</div>` : ""}`;
  document.getElementById("vs-piede").innerHTML = (prop ? `<button class="vs-btn" onclick="vsChiudi();openChatThread('${prop.cliente.id}')">Apri la chat</button>` : "") + '<button class="vs-btn pri" onclick="vsChiudi()">Chiudi</button>';
}

/* ---- Fase 4 (SQL 67): «Condividi il referto col proprietario» ---- */
function vrCond(on){
  VR.cond = !!on;
  const box = document.getElementById("vr-cond");
  if(box){ box.classList.toggle("on", VR.cond); const sm = box.querySelector("small"); if(sm) sm.textContent = VR.cond ? "Lo riceve in chat e resta nei documenti del suo cavallo." : "Resta privato: il proprietario vede solo data e tipo della visita."; }
  VR.dest.forEach((x, i) => { if(x.k !== "prop") return; x.on = VR.cond && x.suEquo; const c = document.getElementById("vr-dest-" + i); if(c){ c.checked = x.on; c.disabled = !VR.cond || !x.suEquo; } });
}
// la scelta resta sulla visita (intervento) e vale anche per i referti già mandati di quella visita
async function vrSalvaScelta(e, on){
  if(!e?.id) return { error: null };
  e.referto_proprietario = !!on;
  if(DEMO_MODE){
    const i = (demoState.interventiMascalcia || []).find(x => x.id === e.id); if(i) i.referto_proprietario = !!on;
    (demoState.documenti || []).filter(d => d.categoria === "referto" && d.intervento_id === e.id).forEach(d => { d.solo_autore = !on; });
    return { error: null };
  }
  const { error } = await DB.updateInterventoMascalcia(e.id, { referto_proprietario: !!on });
  if(error) return { error };
  const { data: vis } = await sb.from("visite_pro").select("id").eq("intervento_id", e.id);
  if(vis?.length){
    await sb.from("documenti").update({ solo_autore: !on }).in("visita_id", vis.map(x => x.id)).eq("categoria", "referto").eq("autore_user_id", currentUser.id);
    // 13/11/2026 (SQL 69): sui suoi documenti decide il veterinario → accesso del proprietario dato o tolto
    const prop = (typeof vrDestinatari === "function" ? vrDestinatari() : []).find(x => x.k === "prop")?.cliente;
    if(prop?.cliente_user_id){
      const { data: refs } = await sb.from("documenti").select("id").in("visita_id", vis.map(x => x.id)).eq("categoria", "referto").eq("autore_user_id", currentUser.id);
      for(const r of refs || []) await sb.rpc("equo_doc_imposta", { p_doc: r.id, p_user: prop.cliente_user_id, p_centro: null, p_modo: on ? "sempre" : "nascosto", p_motivo: "chat" }).then(() => {}, () => {});
    }
  }
  return { error: null };
}
const vrDB = {
  async refertoSoloAutore(id, solo){
    if(DEMO_MODE){ const d = (demoState.documenti || []).find(x => x.id === id); if(d) d.solo_autore = !!solo; return { error: null }; }
    const { error } = await sb.from("documenti").update({ solo_autore: !!solo }).eq("id", id);
    return { error };
  }
};

export { vrCond, vrSalvaScelta, vrApri, vrInvia, vrCondividi, vrCreaPdf, vrSezioni, vrParteScritta, vrDestinatari, VR };
