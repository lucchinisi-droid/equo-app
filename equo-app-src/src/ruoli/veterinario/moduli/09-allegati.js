// Equo App · veterinario · ALLEGATI DELLA VISITA: foto, video, lastre, ecografie, esami (2/11/2026, passo 3)
// Tutto nello spazio privato «documenti» (SQL 32), con il nome dato da Equo (SQL 33): «Aurora · 2 nov 2026 · Lastra · Piede ASx (2)».
// Vede: autore e proprietario; chi decide gli altri accessi: proprietario → struttura → autore (claude/Equo_Privacy_documenti.md).
// Limiti: 50 MB per file; video fino a 3 minuti (decisione di Simone); foto ridotte a 2000 px; i DICOM si caricano e si scaricano.

import { VS, vsSalvaSubito, vsNomeCavallo } from "./07-scheda-visita.js";

const VA_TIPI = ["foto_clinica", "video", "lastra", "ecografia", "esame", "documento"];
const VA_ZONE = ["as", "ad", "ps", "pd", "piede_as", "piede_ad", "piede_ps", "piede_pd", "testa", "bocca", "occhi", "collo", "dorso", "torace", "addome", "pelle", "intero"];
const VA_MAX_BYTE = 50 * 1024 * 1024, VA_MAX_SEC = 185;
const VA = { lista: [], altri: [], mini: {}, attesa: null, aperto: null, chi: {}, ultimaZona: null, carico: false };
const vaEsc = s => escapeHtml(s == null ? "" : String(s));
const vaJs = s => vaEsc(JSON.stringify(s));
const vaGenere = d => /^image\//.test(d.mime || "") ? "foto" : /^video\//.test(d.mime || "") ? "video" : "documento";
const vaEtichetta = d => /^image\//.test(d.mime || "") ? "FOTO" : /^video\//.test(d.mime || "") ? "VIDEO" : d.mime === "application/dicom" ? "DICOM" : "PDF";

function vaInput(id, accept, capture){
  let i = document.getElementById(id);
  if(!i){ i = document.createElement("input"); i.type = "file"; i.id = id; i.hidden = true; i.accept = accept; if(capture) i.setAttribute("capture", capture);
    i.addEventListener("change", ev => { const f = ev.target.files && ev.target.files[0]; ev.target.value = ""; if(f) vaFile(f); }); document.body.appendChild(i); }
  return i;
}
function vaScegli(fonte){
  ({ foto: () => vaInput("va-in-foto", "image/*", "environment"), galleria: () => vaInput("va-in-galleria", "image/*,video/*"),
     video: () => vaInput("va-in-video", "video/*", "environment"), file: () => vaInput("va-in-file", "application/pdf,application/dicom,.dcm,image/*") })[fonte]().click();
}
function vaDurata(file){
  return new Promise(ok => { const v = document.createElement("video"), u = URL.createObjectURL(file); v.preload = "metadata";
    v.onloadedmetadata = () => { URL.revokeObjectURL(u); ok(v.duration || 0); }; v.onerror = () => { URL.revokeObjectURL(u); ok(0); }; v.src = u; });
}
// file scelto: controlli, poi la riga «tipo · zona · nota» da confermare
async function vaFile(file){
  const video = /^video\//.test(file.type) || /\.(mp4|mov|m4v|webm|3gp)$/i.test(file.name || "");
  const pdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
  const dicom = file.type === "application/dicom" || /\.dcm$/i.test(file.name || "");
  const img = /^image\//.test(file.type) || /\.(jpe?g|png|heic|heif|webp)$/i.test(file.name || "");
  if(!video && !pdf && !dicom && !img) return showToast("Puoi allegare foto, video, PDF o lastre (DICOM)");
  if(file.size > VA_MAX_BYTE) return showToast("File troppo pesante (massimo 50 MB)" + (video ? ": riprendi a qualità più bassa o accorcia il video" : ""));
  if(video){ const d = await vaDurata(file); if(d > VA_MAX_SEC) return showToast("Video troppo lungo: massimo 3 minuti"); }
  const categoria = video ? "video" : dicom ? "lastra" : pdf ? "documento" : "foto_clinica";
  const mime = file.type || (dicom ? "application/dicom" : pdf ? "application/pdf" : video ? "video/mp4" : "image/jpeg");
  VA.attesa = { file, mime, categoria, zona: VA.ultimaZona, nota: "" };
  vaRidisegna();
  document.getElementById("va-attesa")?.scrollIntoView({ block: "center", behavior: "smooth" });
}
// foto ridotte (lato lungo 2000 px, JPEG): se il telefono non le sa leggere (es. HEIC su Android) resta l'originale
async function vaRiduci(file){
  try{
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const b = await new Promise(r => c.toBlob(r, "image/jpeg", 0.85));
    return b ? { blob: b, mime: "image/jpeg" } : { blob: file, mime: file.type };
  }catch(_){ return { blob: file, mime: file.type || "image/jpeg" }; }
}
async function vaSalva(){
  const a = VA.attesa; if(!a || VA.carico) return;
  const v = VS.visita, e = VS.e;
  VA.carico = true; vaRidisegna();
  try{
    await vsSalvaSubito(true);
    if(!v.id){ showToast("Non riesco a salvare la scheda: riprova"); return; }
    const { blob, mime } = /^image\/(jpe?g|png|webp|heic|heif)$/i.test(a.mime) ? await vaRiduci(a.file) : { blob: a.file, mime: a.mime };
    const r = await DB.caricaDocumentoPrivato({ blob, mime, categoria: a.categoria, zona: a.zona, nota: a.nota, cavallo_nome: vsNomeCavallo(e),
      data_documento: v.data_visita, visita_id: v.id, cavallo_cliente_id: v.cavallo_cliente_id || e.cavallo_cliente_id || null, horse_id: v.horse_id || e.horse_id || null, autore_ruolo: "veterinario" });
    if(!r.id){ showToast("Caricamento non riuscito: " + (r.error?.message || "riprova")); return; }
    VA.ultimaZona = a.zona; VA.attesa = null;
    showToast("Salvato: " + (r.titolo || "allegato"));
    await vaCarica();
  }finally{ VA.carico = false; vaRidisegna(); }
}
function vaNomeLive(){ const a = VA.attesa, el = document.querySelector(".va-anteprima-nome b");
  if(a && el) el.textContent = DB.titoloDocumento({ cavallo: vsNomeCavallo(VS.e), data: VS.visita?.data_visita, categoria: a.categoria, zona: a.zona, nota: a.nota }); }
function vaAnnulla(){ VA.attesa = null; vaRidisegna(); }
function vaImposta(k, val){ if(VA.attesa){ VA.attesa[k] = VA.attesa[k] === val && k === "zona" ? null : val; vaRidisegna(); } }

/* ---- elenco ---- */
async function vaCarica(){
  const v = VS.visita, e = VS.e; if(!v) return;
  const [miei, tutti] = await Promise.all([v.id ? DB.listaDocumenti({ visita_id: v.id }) : [], DB.listaDocumenti({ cavallo_cliente_id: v.cavallo_cliente_id || e?.cavallo_cliente_id, horse_id: v.horse_id || e?.horse_id })]);
  VA.lista = miei.filter(d => d.categoria !== "referto");
  VA.altri = tutti.filter(d => d.visita_id !== v.id || !v.id);
  vaRidisegna();
  for(const d of VA.lista.concat(VA.altri.slice(0, 8))) if(vaGenere(d) === "foto" && !VA.mini[d.id]){
    const { url } = await DB.apriUrlDocumento(d.id, 600); if(url){ VA.mini[d.id] = url; vaRidisegna(); }
  }
}
function vaRiga(d, mia){
  const aperto = VA.aperto === d.id, chi = VA.chi[d.id];
  const mio = d.autore_user_id === currentUser?.id;
  const mini = VA.mini[d.id] ? `<img src="${vaEsc(urlSicuro(VA.mini[d.id]))}" alt="">` : `<span>${vaEtichetta(d)}</span>`;
  return `<div class="va-doc${aperto ? " aperto" : ""}">
    <button class="va-mini" onclick="apriDocumentoPrivato('${d.id}')" aria-label="Apri ${vaEsc(d.titolo)}">${mini}</button>
    <button class="va-tit" onclick="vaApri('${d.id}')"><b>${vaEsc(d.titolo)}</b><small>${vaEsc(DB.DOC_TIPI[d.categoria] || "Documento")}${d.autore_ruolo && !mio ? " · " + vaEsc(d.autore_ruolo) : ""}</small></button>
    ${aperto ? `<div class="va-azioni">
      <button onclick="apriDocumentoPrivato('${d.id}')">Apri</button>
      ${mio ? `<button onclick="vaModifica('${d.id}')">Cambia tipo o zona</button>` : ""}
      <button onclick="vaChiVede('${d.id}')">Chi lo vede</button>
      ${mio && mia ? `<button class="urg" onclick="vaElimina('${d.id}')">Elimina</button>` : ""}
    </div>${chi ? vaChiHtml(d, chi) : ""}` : ""}
  </div>`;
}
function vaApri(id){ VA.aperto = VA.aperto === id ? null : id; vaRidisegna(); }
function vaSezioneHtml(){
  const a = VA.attesa, sola = VS.visita?.stato === "conclusa";
  const chip = (on, az, t) => `<button type="button" class="vs-chip${on ? " on" : ""}" aria-pressed="${on}" onclick="${az}">${vaEsc(t)}</button>`;
  const attesa = a ? `<div class="va-attesa" id="va-attesa"><b>${vaEsc(a.mime.startsWith("image/") ? "Foto" : a.mime.startsWith("video/") ? "Video" : "File")} da salvare</b>
      <span class="vs-lab">Tipo</span><div class="vs-chips">${VA_TIPI.map(t => chip(a.categoria === t, `vaImposta('categoria', ${vaJs(t)})`, DB.DOC_TIPI[t])).join("")}</div>
      <span class="vs-lab">Zona (facoltativa)</span><div class="vs-chips">${VA_ZONE.map(z => chip(a.zona === z, `vaImposta('zona', ${vaJs(z)})`, DB.DOC_ZONE[z])).join("")}</div>
      <div class="vs-campo pieno"><label for="va-nota">Nota (facoltativa)</label><input id="va-nota" maxlength="120" value="${vaEsc(a.nota)}" placeholder="es. proiezione laterale" oninput="VA.attesa.nota = this.value; vaNomeLive()"></div>
      <div class="va-anteprima-nome">Nome: <b>${vaEsc(DB.titoloDocumento({ cavallo: vsNomeCavallo(VS.e), data: VS.visita?.data_visita, categoria: a.categoria, zona: a.zona, nota: a.nota }))}</b></div>
      <div class="va-bott"><button class="vs-btn" onclick="vaAnnulla()">Annulla</button><button class="vs-btn pri" onclick="vaSalva()"${VA.carico ? " disabled" : ""}>${VA.carico ? "Salvo…" : "Salva"}</button></div></div>` : "";
  return `<section class="vs-sez" id="va-box"><h3>Foto, video e lastre</h3>
    ${sola ? "" : `<div class="va-tasti"><button onclick="vaScegli('foto')">Scatta foto</button><button onclick="vaScegli('galleria')">Dalla galleria</button><button onclick="vaScegli('video')">Video</button><button onclick="vaScegli('file')">File · PDF, lastre</button></div>`}
    ${attesa}
    ${VA.lista.length ? VA.lista.map(d => vaRiga(d, true)).join("") : (a ? "" : '<div class="vs-nota">Nessun allegato in questa visita. Video fino a 3 minuti, file fino a 50 MB. Le lastre DICOM si salvano e si scaricano: per vederle serve il tuo programma.</div>')}
    ${VA.altri.length ? `<details class="va-altri"><summary>Documenti di questo cavallo · ${VA.altri.length}</summary>${VA.altri.map(d => vaRiga(d, false)).join("")}</details>` : ""}
    <div class="vs-nota">Privati: li vedete tu e il proprietario. Il nome lo dà Equo (cavallo, data, tipo, zona).</div>
  </section>`;
}
function vaRidisegna(){ const b = document.getElementById("va-box"); if(b) b.outerHTML = vaSezioneHtml(); }

/* ---- cambia tipo o zona (il nome si rifà da solo) ---- */
function vaModifica(id){
  const d = VA.lista.concat(VA.altri).find(x => x.id === id); if(!d) return;
  VA.attesa = { modifica: id, file: null, mime: d.mime || "", categoria: d.categoria, zona: d.zona, nota: d.nota || "" };
  vaRidisegna();
  const b = document.querySelector("#va-attesa .va-bott .pri"); if(b){ b.textContent = "Salva le modifiche"; b.setAttribute("onclick", "vaSalvaModifica()"); }
}
async function vaSalvaModifica(){
  const a = VA.attesa; if(!a?.modifica) return;
  const { error } = await DB.aggiornaDocumento(a.modifica, { categoria: a.categoria, zona: a.zona, nota: a.nota, cavallo_nome: vsNomeCavallo(VS.e) });
  if(error) return showToast("Errore: " + error.message);
  VA.attesa = null; await vaCarica();
}
async function vaElimina(id){
  if(!await chiediSiNo("Eliminare questo allegato?", "Sparisce dalla visita e da chi lo vede. Le copie già scaricate restano a chi le ha.")) return;
  const { error } = await DB.eliminaDocumento(id);
  if(error) return showToast("Errore: " + error.message);
  VA.aperto = null; await vaCarica();
}

/* ---- «Chi lo vede» ---- */
async function vaChiVede(id){ VA.chi[id] = await DB.chiVedeDocumento(id) || { errore: true }; vaRidisegna(); }
function vaChiHtml(d, c){
  if(c.errore) return '<div class="vs-nota">Puoi vedere chi ha accesso solo ai file tuoi o che gestisci.</div>';
  const righe = [];
  if(c.autore) righe.push(`<div class="va-chi-r"><span><b>${vaEsc(c.autore.nome)}</b><small>Autore · lo vede sempre</small></span></div>`);
  if(c.proprietario) righe.push(`<div class="va-chi-r"><span><b>${vaEsc(c.proprietario.nome)}</b><small>Proprietario · lo vede sempre</small></span></div>`);
  else righe.push('<div class="va-chi-r"><span><b>Proprietario</b><small>Non è su Equo: lo vedrà quando si collega</small></span></div>');
  (c.accessi || []).forEach(a => righe.push(`<div class="va-chi-r"><span><b>${vaEsc(a.nome || "—")}</b><small>${vaEsc({ chat: "Ricevuto in chat", consulto: "Consulto", urgenza: "Accesso d'urgenza" }[a.motivo] || "Condiviso")}${a.da ? " da " + vaEsc(a.da) : ""}</small></span>${c.puoi_decidere ? `<button onclick="vaTogli('${d.id}', '${a.id}')">Togli</button>` : ""}</div>`));
  const str = typeof vrDestinatari === "function" ? vrDestinatari().find(x => x.k === "str" && x.cliente.centro_id) : null;
  const giaStr = str && (c.accessi || []).some(a => a.centro_id === str.cliente.centro_id);
  const fai = str && !giaStr ? (c.puoi_decidere ? `<button class="vs-btn" onclick="vaFaiVedere('${d.id}', '${str.cliente.centro_id}')">Fai vedere a ${vaEsc(str.nome)}</button>`
    : `<div class="vs-nota">Chi altro lo vede lo decide ${c.decide === "proprietario" ? "il proprietario" : "la scuderia"}.</div>`) : "";
  return `<div class="va-chi">${righe.join("")}${fai}<div class="vs-nota">Togliere l'accesso non cancella le copie già scaricate o girate fuori da Equo.</div></div>`;
}
async function vaTogli(docId, accId){
  const r = await DB.revocaAccessoDocumento(accId);
  if(!r?.ok) return showToast("Non puoi togliere questo accesso");
  await vaChiVede(docId);
}
async function vaFaiVedere(docId, centroId){
  const r = await DB.condividiDocumento(docId, { centro_id: centroId, motivo: "condivisione" });
  if(!r?.ok) return showToast(String(r?.errore || "").startsWith("decide_") ? "Lo decide il proprietario" : "Non riuscito");
  await vaChiVede(docId);
}

// nuova scheda aperta: si azzera e si carica
function vaReset(){ VA.lista = []; VA.altri = []; VA.attesa = null; VA.aperto = null; VA.chi = {}; }

export { vaNomeLive, vaScegli, vaFile, vaSalva, vaAnnulla, vaImposta, vaCarica, vaApri, vaSezioneHtml, vaModifica, vaSalvaModifica, vaElimina, vaChiVede, vaTogli, vaFaiVedere, vaReset, VA };
