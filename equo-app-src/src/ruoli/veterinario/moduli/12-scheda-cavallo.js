// Equo App · veterinario · SCHEDA DEL CAVALLO (2/11/2026, richiesta di Simone)
// La scheda è quella del maniscalco (038); per il veterinario i tasti sono Tutto · Anagrafica · Clinica · Storico · Documenti.
//  · Clinica: terapia in corso (piano terapeutico), stato DPA (ultima visita che lo dice), visite precedenti (si aprono).
//  · Documenti: documenti privati del cavallo (referti, lastre, ecografie, esami, foto, video) per tipo, «+ Carica» anche
//    senza visita (tipo, zona, nota: nome dato da Equo; spazio privato); sotto gli «Allegati condivisi» di prima, in sola lettura.
// 038 chiama vcSezioniHtml(cv, vedi) al posto di Ferratura/Allegati e vcCarica(cv) dopo il disegno.

import { VsDB, vsApriDaEvento } from "./07-scheda-visita.js";
import { vaRiduci, vaDurata, VA_TIPI, VA_ZONE } from "./09-allegati.js";
import { ptPeriodo } from "./11-piano-terapia.js";

const vcEsc = s => escapeHtml(s == null ? "" : String(s));
const vcJs = s => vcEsc(JSON.stringify(s));
const VC = { cv: null, visite: [], piani: [], docs: [], attesa: null, carico: false, giro: 0 };
const VC_GRUPPI = [["referto", "Referti"], ["lastra", "Lastre"], ["ecografia", "Ecografie"], ["esame", "Esami"], ["foto_clinica", "Foto"], ["video", "Video"],
  ["coggins", "Coggins"], ["vaccino", "Vaccini"], ["passaporto", "Passaporto"], ["documento_sanitario", "Documenti sanitari"], ["documento", "Altri documenti"], ["seduta", "Sedute"]];
const vcData = iso => iso ? new Date(String(iso).slice(0, 10) + "T12:00").toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }) : "";

/* ---------------- sezioni (al posto di Ferratura e Allegati) ---------------- */
function vcSezioniHtml(cv, vedi){
  const sez = (k, id, titolo, azione) => vedi(k) ? `<div class="card cavpro-sez" id="${id}"><div class="cavpro-sez-testa"><span>${titolo}</span>${azione || ""}</div><div class="vc-corpo"><div class="muted" style="font-size:13px">Caricamento…</div></div></div>` : "";
  return { clinica: sez("cli", "vc-clinica", "Clinica"),
    documenti: sez("doc", "vc-documenti", "Documenti", `<button class="btn btn-outline btn-sm" onclick="vcScegli()">+ Carica</button>`)
      + (vedi("doc") ? `<div class="card cavpro-sez"><div class="cavpro-sez-testa"><span>Allegati condivisi</span></div><div id="vc-condivisi"><div class="muted" style="font-size:13px">Caricamento…</div></div>
        <div class="muted" style="font-size:11.5px;line-height:1.5;margin-top:8px">Gli allegati di prima: li vedono anche il proprietario collegato e la scuderia. I tuoi file nuovi vanno in «Documenti», nello spazio privato.</div></div>` : "") };
}
async function vcCarica(cv){
  if(!cv) return;
  VC.cv = cv; const giro = ++VC.giro;
  const [visite, piani, docs] = await Promise.all([VsDB.visiteCavallo(cv.id || null, cv.horse_id || null), DB.terapieInCorso({ comePro: true }).catch(() => []),
    DB.listaDocumenti({ cavallo_cliente_id: cv.id || null, horse_id: cv.horse_id || null })]);
  if(giro !== VC.giro) return;
  VC.visite = visite || []; VC.docs = docs || [];
  VC.piani = (piani || []).filter(p => (cv.id && p.cavallo_cliente_id === cv.id) || (cv.horse_id && p.horse_id === cv.horse_id));
  vcDisegna();
  if(document.getElementById("vc-condivisi") && typeof caricaAllegatiCavallo === "function") caricaAllegatiCavallo("vc-condivisi", "maniscalco", cv);
}
function vcDisegna(){ vcDisegnaClinica(); vcDisegnaDocumenti(); }

/* ---------------- Clinica ---------------- */
function vcDisegnaClinica(){
  const box = document.querySelector("#vc-clinica .vc-corpo"); if(!box) return;
  const ora = Date.now();
  const terapie = VC.piani.map(p => {
    const per = ptPeriodo(p.voci), fatte = p.somm.filter(s => s.fatto_il).length, sal = p.chiedi_conferme ? p.somm.filter(s => statoSomministrazione(s, ora) === "saltata").length : 0;
    return `<div class="vc-ter"><div class="vc-ter-t">💊 Terapia in corso${p.stato === "sospeso" ? " · sospesa" : ""}${per ? " · fino al " + vcEsc(vcData(per.al)) : ""}</div>
      ${p.voci.map(v => `<div class="vc-ter-v"><b>${vcEsc(v.nome)}${v.dose ? " · " + vcEsc(v.dose) : ""}</b><small>${vcEsc(testoVoceTerapia(v))}</small></div>`).join("")}
      ${p.attesa_fino ? `<div class="vc-attesa">Fine del tempo di attesa: <b>${vcEsc(vcData(p.attesa_fino))}</b></div>` : ""}
      ${p.chiedi_conferme ? `<div class="muted" style="font-size:12px">${fatte} ${fatte === 1 ? "fatta" : "fatte"}${sal ? ` · <b class="pt-saltate">${sal} ${sal === 1 ? "saltata" : "saltate"}</b>` : ""}</div>` : ""}</div>`;
  }).join("");
  const conDpa = VC.visite.find(v => v.dati && v.dati.dpa);
  const dpa = conDpa ? `<div class="vc-dpa"><span>Stato</span><b>${vcEsc(conDpa.dati.dpa)}</b><small>dalla visita del ${vcEsc(vcData(conDpa.data_visita))}</small></div>` : "";
  const visite = VC.visite.length ? VC.visite.slice(0, 12).map(v => { const d = v.dati || {}, cosa = d.diagnosi || d.conclusioni || d.sindrome || d.motivo || "";
      return `<button type="button" class="vc-visita" ${v.intervento_id ? `onclick="vcApriVisita('${v.intervento_id}')"` : "disabled"}><span class="d">${vcEsc(vcData(v.data_visita))}</span>
        <span class="c"><b>${vcEsc(v.modello_nome || "Visita")}${v.stato === "bozza" ? " · bozza" : ""}</b>${cosa ? `<small>${vcEsc(String(cosa).slice(0, 120))}</small>` : ""}</span>${v.intervento_id ? '<span class="fr">›</span>' : ""}</button>`; }).join("")
    : '<div class="muted" style="font-size:13px">Nessuna visita registrata per questo cavallo.</div>';
  box.innerHTML = terapie + dpa + `<div class="vc-h">Visite precedenti</div>` + visite;
}
function vcApriVisita(id){ vsApriDaEvento(id); }

/* ---------------- Documenti ---------------- */
function vcDisegnaDocumenti(){
  const box = document.querySelector("#vc-documenti .vc-corpo"); if(!box) return;
  const a = VC.attesa;
  const chip = (on, az, t) => `<button type="button" class="vs-chip${on ? " on" : ""}" aria-pressed="${!!on}" onclick="${az}">${vcEsc(t)}</button>`;
  const attesa = a ? `<div class="va-attesa vc-attesa-box" id="vc-attesa"><b>${a.mime.startsWith("image/") ? "Foto" : a.mime.startsWith("video/") ? "Video" : "File"} da salvare</b>
      <span class="vs-lab">Tipo</span><div class="vs-chips">${["referto", ...VA_TIPI].map(t => chip(a.categoria === t, `vcImposta('categoria', ${vcJs(t)})`, DB.DOC_TIPI[t] || t)).join("")}</div>
      <span class="vs-lab">Zona (facoltativa)</span><div class="vs-chips">${VA_ZONE.map(z => chip(a.zona === z, `vcImposta('zona', ${vcJs(z)})`, DB.DOC_ZONE[z])).join("")}</div>
      <div class="vs-campo pieno"><label for="vc-nota">Nota (facoltativa)</label><input id="vc-nota" maxlength="120" value="${vcEsc(a.nota)}" placeholder="es. esame del sangue del laboratorio" oninput="VC.attesa.nota=this.value;vcNomeLive()"></div>
      <div class="va-anteprima-nome">Nome: <b id="vc-nome">${vcEsc(vcTitolo())}</b></div>
      <div class="va-bott"><button class="vs-btn" onclick="vcAnnulla()">Annulla</button><button class="vs-btn pri" onclick="vcSalva()"${VC.carico ? " disabled" : ""}>${VC.carico ? "Salvo…" : "Salva"}</button></div></div>` : "";
  const gruppi = VC_GRUPPI.map(([k, t]) => [t, VC.docs.filter(d => d.categoria === k)]).filter(([, l]) => l.length);
  box.innerHTML = attesa + (gruppi.length ? gruppi.map(([t, l]) => `<div class="vc-h">${vcEsc(t)} · ${l.length}</div>${l.map(d => `<button type="button" class="vc-doc" onclick="apriDocumentoPrivato('${d.id}')">
      <span class="et">${/^image\//.test(d.mime || "") ? "FOTO" : /^video\//.test(d.mime || "") ? "VIDEO" : d.mime === "application/dicom" ? "DICOM" : "PDF"}</span>
      <span class="c"><b>${vcEsc(d.nome || d.titolo)}</b><small>${vcEsc(d.autore_user_id === currentUser?.id ? "tuo" : (d.autore_ruolo || "condiviso con te"))}</small></span></button>`).join("")}`).join("")
    : (a ? "" : '<div class="muted" style="font-size:13px">Nessun documento privato per questo cavallo. Referti, lastre e foto delle visite arrivano qui da soli.</div>'))
    + '<div class="muted" style="font-size:11.5px;line-height:1.5;margin-top:8px">Privati: li vedete tu e il proprietario. Si aprono con un link che dura pochi minuti.</div>';
}
function vcTitolo(){ const a = VC.attesa; return a ? DB.titoloDocumento({ cavallo: VC.cv?.nome, data: isoLocale(new Date()), categoria: a.categoria, zona: a.zona, nota: a.nota }) : ""; }
function vcNomeLive(){ const el = document.getElementById("vc-nome"); if(el) el.textContent = vcTitolo(); }
function vcScegli(){
  let i = document.getElementById("vc-in-file");
  if(!i){ i = document.createElement("input"); i.type = "file"; i.id = "vc-in-file"; i.hidden = true; i.accept = "image/*,video/*,application/pdf,application/dicom,.dcm";
    i.addEventListener("change", ev => { const f = ev.target.files && ev.target.files[0]; ev.target.value = ""; if(f) vcFile(f); }); document.body.appendChild(i); }
  i.click();
}
async function vcFile(file){
  const video = /^video\//.test(file.type) || /\.(mp4|mov|m4v|webm|3gp)$/i.test(file.name || "");
  const pdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
  const dicom = file.type === "application/dicom" || /\.dcm$/i.test(file.name || "");
  const img = /^image\//.test(file.type) || /\.(jpe?g|png|heic|heif|webp)$/i.test(file.name || "");
  if(!video && !pdf && !dicom && !img) return showToast("Puoi caricare foto, video, PDF o lastre (DICOM)");
  if(file.size > 50 * 1024 * 1024) return showToast("File troppo pesante (massimo 50 MB)");
  if(video && (await vaDurata(file)) > 185) return showToast("Video troppo lungo: massimo 3 minuti");
  const mime = file.type || (dicom ? "application/dicom" : pdf ? "application/pdf" : video ? "video/mp4" : "image/jpeg");
  VC.attesa = { file, mime, categoria: video ? "video" : dicom ? "lastra" : pdf ? "referto" : "foto_clinica", zona: null, nota: "" };
  vcDisegnaDocumenti();
  document.getElementById("vc-attesa")?.scrollIntoView({ block: "center", behavior: "smooth" });
}
function vcImposta(k, v){ const a = VC.attesa; if(!a) return; a.nota = document.getElementById("vc-nota")?.value ?? a.nota; a[k] = k === "zona" && a.zona === v ? null : v; vcDisegnaDocumenti(); }
function vcAnnulla(){ VC.attesa = null; vcDisegnaDocumenti(); }
async function vcSalva(){
  const a = VC.attesa, cv = VC.cv; if(!a || !cv || VC.carico) return;
  VC.carico = true; vcDisegnaDocumenti();
  try{
    const { blob, mime } = /^image\/(jpe?g|png|webp|heic|heif)$/i.test(a.mime) ? await vaRiduci(a.file) : { blob: a.file, mime: a.mime };
    const r = await DB.caricaDocumentoPrivato({ blob, mime, categoria: a.categoria, zona: a.zona, nota: a.nota, cavallo_nome: cv.nome, data_documento: isoLocale(new Date()),
      cavallo_cliente_id: cv.id || null, horse_id: cv.horse_id || null, autore_ruolo: "veterinario" });
    if(!r.id){ showToast(/documenti|bucket|does not exist/i.test(r.error?.message || "") ? "Lo spazio privato dei documenti non è ancora attivo." : "Caricamento non riuscito: " + (r.error?.message || "riprova")); return; }
    VC.attesa = null; showToast("Salvato: " + (r.titolo || "documento"));
    VC.docs = await DB.listaDocumenti({ cavallo_cliente_id: cv.id || null, horse_id: cv.horse_id || null });
  }finally{ VC.carico = false; vcDisegnaDocumenti(); }
}

export { vcSezioniHtml, vcCarica, vcDisegna, vcApriVisita, vcScegli, vcFile, vcImposta, vcAnnulla, vcSalva, vcNomeLive, VC };
