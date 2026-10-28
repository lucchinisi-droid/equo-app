// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { chiediConferma } from "./052-ferro-standard-nella-scheda-del-cavallo.js";
import { caricaJsPdf } from "./057-pdf-appuntamento-invio-in-chat-maniscalc.js";
import { disegnaQrPdf, etichettaPro } from "./108-invito-qr.js";
/* ---------- CARD DEI PROFESSIONISTI: EQUO PASS ed EQUO CV (26/10/2026) ----------
   Dalla barra in alto (quarta icona). L'Equo CV si compila qui ed è salvato in pro_cv (dati jsonb); l'Equo Pass prende i
   dati dal CV. Entrambi hanno il QR del codice personale (link che apre Equo e collega) e si scaricano o condividono in PDF.
   - Numeri Equo: calcolati dal database (equo_numeri_pro), il professionista sceglie quali mostrare.
   - Corsi e certificati: «Verificato da Equo» solo se presenti in pro_cv_verifiche (li scrive Equo).
   - Referenze: il professionista le chiede a un cliente collegato; il cliente le scrive dalla sua Home; si pubblicano solo se lui vuole.
   - Pagina pubblica app.equohub.com/pro/<indirizzo>: solo Premium (controllo anche nel database).
   - «Scrivi con Hammer» / «Versione in inglese»: funzione Netlify cv-scrivi (15 al giorno). */
const ECV_SPEC = {
  maniscalco: ["Ferratura correttiva", "Ferratura ortopedica", "Pareggio naturale", "Ferri incollati", "Puledri", "Cavalli sportivi", "Eventi e gare", "Trotto", "Galoppo", "Western", "Endurance", "Ferri in alluminio"],
  veterinario: ["Medicina sportiva", "Ortopedia", "Chirurgia", "Riproduzione", "Odontoiatria", "Diagnostica per immagini", "Medicina interna", "Fisioterapia", "Agopuntura"],
  istruttore: ["Salto ostacoli", "Dressage", "Completo", "Monta western", "Endurance", "Volteggio", "Doma", "Bambini e principianti", "Preparazione gare"],
};
const ECV_LINGUE = ["Italiano", "Inglese", "Francese", "Spagnolo", "Tedesco", "Portoghese"];
const ECV_MODELLI = { classico: [29, 42, 58], moderno: [22, 53, 43], elegante: [43, 31, 8] };
const ECV_NOME_MODELLI = { classico: "Classico", moderno: "Moderno", elegante: "Elegante" };
let ecv = null, ecvVista = "scelta", ecvTimer = null, ecvGirato = false, ecvUrl = {};

const e_ = s => escapeHtml(s == null ? "" : String(s));
const ecvCorta = s => { const t = String(s || "").replace(/^Ferratura /, ""); return t.charAt(0).toUpperCase() + t.slice(1); };
const ecvId = () => Math.random().toString(36).slice(2, 10);
function ecvRuolo(){ const r = currentUser?.vistaAttiva || currentUser?.ruolo; return ECV_SPEC[r] ? r : "maniscalco"; }
function ecvNome(){ return currentUser?.fullName || currentUser?.full_name || currentUser?.datiPagamentoNome || "Il tuo nome"; }
function ecvIniziali(){ return ecvNome().split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0].toUpperCase()).join(""); }
function ecvCodice(){ return currentUser?.codiceProfessionista || ""; }
function ecvLink(){ return ecvCodice() ? "https://app.equohub.com/?invito=" + encodeURIComponent(ecvCodice()) : "https://app.equohub.com"; }
function ecvAvatar(){ return currentUser?.avatarUrl || currentUser?.avatar_url || null; }
function ecvBase(){
  return { titolo: "", presentazione: "", presentazione_en: "", contatti: { telefono: { v: "", m: true }, email: { v: currentUser?.email || "", m: true }, instagram: { v: "", m: true }, sito: { v: "", m: true }, indirizzo: { v: "", m: false } },
    zone: [], trasferte: false, mostra_zona: true, spec: [], formazione: [], esperienze: [], lingue: ["Italiano"],
    numeri: { cavalli: true, interventi: true, clienti: true, discipline: true }, modello: "classico", lingua_pdf: "it" };
}
function ecvDati(){ return ecv.dati; }
function ecvCompleto(){
  const d = ecvDati();
  const voci = [d.titolo, d.presentazione, Object.values(d.contatti || {}).some(c => c && c.v), (d.zone || []).length, (d.spec || []).length, (d.formazione || []).length, (d.esperienze || []).length, (d.lingue || []).length];
  return Math.round(voci.filter(Boolean).length / voci.length * 100);
}

// ---------------- dati ----------------
async function ecvCarica(){
  if(DEMO_MODE){
    if(!ecv) ecv = { dati: Object.assign(ecvBase(), { titolo: "Maniscalco · ferratura correttiva e sportiva", presentazione: "Seguo cavalli sportivi e da diporto. Lavoro con veterinari e istruttori per ferrature correttive e ortopediche.", zone: ["Roma"], spec: ["Ferratura correttiva", "Cavalli sportivi"], esperienze: [{ id: "e1", titolo: "Concorso ippico nazionale", ruolo: "Servizio di mascalcia", luogo: "Roma", anno: "2022", foto: [] }] }),
      slug: "demo-maniscalco", pubblica: false, premium: false, verifiche: new Set(), numeri: { cavalli: 24, interventi: 180, clienti: 9, dal: 2026, discipline: ["Salto ostacoli"] }, referenze: [{ id: "r1", autore: "Marco R.", tipo: "proprietario", testo: "Preciso e puntuale.", stato: "da_approvare" }] };
    return true;
  }
  const { data, error } = await sb.rpc("equo_mio_cv");
  if(error || !data){ showToast(/equo_mio_cv/.test(error?.message || "") ? "Funzione non ancora attiva: serve l'aggiornamento del database." : "Non riesco a caricare il CV, riprova."); return false; }
  const base = ecvBase(), d = data.dati || {};
  ecv = { dati: Object.assign(base, d, { contatti: Object.assign(base.contatti, d.contatti || {}), numeri: Object.assign(base.numeri, d.numeri || {}) }),
    slug: data.slug, pubblica: !!data.pubblica, premium: !!data.premium, verifiche: new Set(data.verifiche || []), numeri: data.numeri || {}, referenze: data.referenze || [], aggiornato_il: data.aggiornato_il };
  const paths = [...(ecv.dati.esperienze || []).flatMap(x => x.foto || []), ...(ecv.dati.formazione || []).map(x => x.file).filter(Boolean)];
  if(paths.length){ try{ const r = await sb.storage.from("pro-cv").createSignedUrls(paths, 3600); (r.data || []).forEach(x => { if(x.signedUrl) ecvUrl[x.path] = x.signedUrl; }); }catch(e){} }
  return true;
}
function ecvSalva(subito){
  clearTimeout(ecvTimer);
  const st = document.getElementById("ecv-salvato"); if(st) st.textContent = "Salvataggio…";
  const fai = async () => {
    if(DEMO_MODE){ if(st) st.textContent = "Salvato ✓"; return; }
    const { error } = await sb.from("pro_cv").update({ dati: ecv.dati }).eq("user_id", currentUser.id);
    if(st) st.textContent = error ? "Non salvato: riprova" : "Salvato ✓";
    if(!error) ecv.aggiornato_il = new Date().toISOString();
  };
  if(subito) return fai();
  ecvTimer = setTimeout(fai, 700);
}
function ecvCampo(chiave, valore){
  const d = ecvDati(), parti = chiave.split(".");
  let o = d; parti.slice(0, -1).forEach(p => { o[p] = o[p] || {}; o = o[p]; });
  o[parti[parti.length - 1]] = valore;
  ecvSalva();
  ecvAggiornaCompleto();
}
function ecvAggiornaCompleto(){
  const p = ecvCompleto();
  document.querySelectorAll(".ecv-perc").forEach(el => el.textContent = p + "%");
  document.querySelectorAll(".ecv-barra i").forEach(el => el.style.width = p + "%");
}

// ---------------- apertura e viste ----------------
async function apriCardPro(vista){
  const box = document.getElementById("ecv"); if(!box) return;
  box.classList.add("on"); document.body.classList.add("ecv-aperta");
  document.getElementById("ecv-corpo").innerHTML = '<div class="ecv-attesa"><div class="spinner"></div></div>';
  if(!ecv && !(await ecvCarica())){ chiudiCardPro(); return; }
  if(!ecvCodice() && typeof DB !== "undefined" && DB.ensureCodiceProfessionista){ try{ await DB.ensureCodiceProfessionista(); }catch(e){} }
  ecvMostra(vista || "scelta");
}
function chiudiCardPro(){ document.getElementById("ecv")?.classList.remove("on"); document.body.classList.remove("ecv-aperta"); ecvGirato = false; }
function ecvMostra(v){
  ecvVista = v;
  const tit = { scelta: "Card", pass: "Equo Pass", cv: "Equo CV" }[v];
  document.getElementById("ecv-tit").textContent = tit;
  document.getElementById("ecv-indietro").style.visibility = v === "scelta" ? "hidden" : "visible";
  const c = document.getElementById("ecv-corpo");
  c.innerHTML = v === "pass" ? ecvHtmlPass() : v === "cv" ? ecvHtmlCv() : ecvHtmlScelta();
  c.scrollTop = 0; document.getElementById("ecv").scrollTop = 0;
}
function ecvIndietro(){ ecvMostra("scelta"); }

function ecvHtmlScelta(){
  return `<div class="ecv-sotto">Il tuo biglietto da visita su Equo. Il Pass prende i dati dal CV: aggiorni il CV e il Pass si aggiorna da solo.</div>
  <div class="ecv-tessere">
    <button type="button" class="ecv-tessera" onclick="ecvMostra('pass')"><span class="ecv-ico">🪪</span><span><b>Equo Pass</b><small>Il tuo badge con foto, ruolo e QR. Mostralo o condividilo.</small></span><span class="ecv-fr">›</span></button>
    <button type="button" class="ecv-tessera" onclick="ecvMostra('cv')"><span class="ecv-ico">📄</span><span><b>Equo CV</b><small>Il tuo curriculum: specializzazioni, formazione, eventi, numeri Equo. Completo al <span class="ecv-perc">${ecvCompleto()}%</span>.</small></span><span class="ecv-fr">›</span></button>
    <button type="button" class="ecv-tessera" onclick="ecvMostra('cv');setTimeout(()=>{const s=document.getElementById('ecv-sez-pubblica');if(s){s.open=true;s.scrollIntoView({behavior:'smooth'});}},80)"><span class="ecv-ico ecv-ico-p">🌐</span><span><b>Pagina pubblica <span class="ecv-badge p">PREMIUM</span></b><small>${ecv.pubblica ? "Online: " : ""}app.equohub.com/pro/${e_(ecv.slug || "")}</small></span><span class="ecv-fr">›</span></button>
  </div>`;
}

// ---------------- EQUO PASS ----------------
function ecvZonaTesto(){
  const d = ecvDati();
  if(!d.mostra_zona) return "Italia";
  const z = (d.zone || []).slice(0, 2).join(" · ");
  return (z || "Italia") + (d.trasferte ? " · trasferte" : "");
}
function ecvNumeriVisibili(){
  const d = ecvDati(), n = ecv.numeri || {}, out = [];
  if(d.numeri.cavalli && n.cavalli) out.push([Number(n.cavalli).toLocaleString("it-IT"), "cavalli seguiti"]);
  if(d.numeri.interventi && n.interventi) out.push([Number(n.interventi).toLocaleString("it-IT"), "interventi registrati"]);
  if(d.numeri.clienti && n.clienti) out.push([Number(n.clienti).toLocaleString("it-IT"), "scuderie e clienti"]);
  if(n.dal) out.push([String(n.dal), "su Equo dal"]);
  return out.slice(0, 4);
}
function ecvQrSvg(testo){
  if(typeof QRCode !== "function") return "";
  const d = document.createElement("div"); new QRCode(d, { text: testo, width: 120, height: 120 });
  return d.querySelector("svg")?.outerHTML || "";
}
function ecvHtmlPass(){
  const d = ecvDati(), av = ecvAvatar(), cert = currentUser?.certificazioneStato === "verificato";
  const esp = (d.esperienze || []).slice(0, 2), num = ecvNumeriVisibili();
  return `<div class="ecv-sotto" style="text-align:center">Tocca il Pass per girarlo.</div>
  <div class="ecv-pass-zona"><div class="ecv-pass${ecvGirato ? " girato" : ""}" id="ecv-pass" onclick="ecvGiraPass()">
    <div class="ecv-lato">
      <div class="ecv-foro"></div>
      <div class="ecv-band"><div class="ecv-logo"><img src="assets/equo-card-cavallo.png" alt=""><div><b>Equo</b><span>PASS</span></div></div><div class="ecv-anno">${new Date().getFullYear()}</div></div>
      <div class="ecv-pcorpo">
        <div class="ecv-foto"${av ? ` style="background-image:url('${e_(av)}')"` : ""}>${av ? "" : e_(ecvIniziali())}</div>
        <div class="ecv-pdati">
          <div class="ecv-ruolo">${e_(etichettaPro().toUpperCase())}</div>
          <div class="ecv-nome">${e_(ecvNome())}</div>
          <div class="ecv-zona">${e_(ecvZonaTesto())}</div>
          ${cert ? '<div class="ecv-cert"><i>✓</i>EQUO CERTIFIED</div>' : ""}
        </div>
      </div>
      <div class="ecv-spec">${(d.spec || []).slice(0, 4).map(s => `<span>${e_(ecvCorta(s))}</span>`).join("")}</div>
      <div class="ecv-piede"><div class="ecv-cod">${e_(ecvCodice())}<small>Inquadra per collegarti su Equo</small></div><div class="ecv-qr">${ecvQrSvg(ecvLink())}</div></div>
    </div>
    <div class="ecv-lato ecv-retro">
      <div class="ecv-foro"></div>
      ${num.length ? `<div class="ecv-rtit">NUMERI EQUO · VERIFICATI</div><div class="ecv-numeri">${num.map(([v, t]) => `<div><b>${e_(v)}</b><small>${e_(t)}</small></div>`).join("")}</div>` : ""}
      <div class="ecv-rtit">ESPERIENZA</div>
      <div class="ecv-rlista">${esp.map(x => `<div><b>${e_(x.titolo)}</b><span>${e_([x.luogo, x.anno].filter(Boolean).join(" "))}</span></div>`).join("") || '<div><span>Aggiungi esperienze ed eventi nel CV</span></div>'}
        ${(d.lingue || []).length ? `<div><b>Lingue</b><span>${e_(d.lingue.join(" · "))}</span></div>` : ""}
        ${(ecv.numeri?.discipline || []).length && d.numeri.discipline ? `<div><b>Discipline</b><span>${e_(ecv.numeri.discipline.join(" · "))}</span></div>` : ""}</div>
      <div class="ecv-verifica">Inquadra il QR sul fronte: apre Equo e ti collega a ${e_(ecvNome().split(" ")[0])}.</div>
    </div>
  </div></div>
  <div class="ecv-azioni"><button type="button" class="princ" onclick="ecvPdfPass()">Scarica PDF</button><button type="button" onclick="ecvPdfPass(true)">Condividi</button></div>
  <div class="ecv-azioni"><button type="button" disabled>Aggiungi al Wallet · presto</button><button type="button" onclick="ecvMostra('cv')">Modifica dati</button></div>
  <div class="ecv-nota">Il QR resta sempre lo stesso: anche un Pass stampato mesi fa porta al tuo profilo aggiornato.</div>`;
}
function ecvGiraPass(){ ecvGirato = !ecvGirato; document.getElementById("ecv-pass")?.classList.toggle("girato", ecvGirato); }

// ---------------- EQUO CV (modifica) ----------------
function ecvInt(chiave, on, extra){ return `<button type="button" class="ecv-int${on ? " on" : ""}" onclick="ecvInterruttore(this,'${chiave}')" aria-label="Mostra o nascondi"${extra || ""}></button>`; }
function ecvInterruttore(el, chiave){ el.classList.toggle("on"); ecvCampo(chiave, el.classList.contains("on")); if(ecvVista === "pass") ecvMostra("pass"); }
function ecvChips(lista, scelte, fn){ return `<div class="ecv-chips">${lista.map(v => `<button type="button" class="${scelte.includes(v) ? "on" : ""}" onclick="${fn}(this)">${e_(v)}</button>`).join("")}</div>`; }
function ecvToggleLista(chiave, el){
  const d = ecvDati(), v = el.textContent, arr = d[chiave] = d[chiave] || [];
  const i = arr.indexOf(v); if(i >= 0) arr.splice(i, 1); else arr.push(v);
  el.classList.toggle("on", i < 0); ecvSalva(); ecvAggiornaCompleto();
}
function ecvSpec(el){ ecvToggleLista("spec", el); }
function ecvLingua(el){ ecvToggleLista("lingue", el); }
function ecvAggiungiVoce(chiave, idInput){
  const inp = document.getElementById(idInput), v = (inp.value || "").trim().slice(0, 50);
  if(!v) return;
  const arr = ecvDati()[chiave] = ecvDati()[chiave] || [];
  if(!arr.includes(v)) arr.push(v);
  inp.value = ""; ecvSalva(); ecvAggiornaCompleto(); ecvRidisegnaSez(chiave);
}
function ecvTogliVoce(chiave, i){ ecvDati()[chiave].splice(i, 1); ecvSalva(); ecvAggiornaCompleto(); ecvRidisegnaSez(chiave); }
function ecvRidisegnaSez(chiave){
  const el = document.getElementById("ecv-lista-" + chiave); if(!el) return;
  el.innerHTML = ecvHtmlLista(chiave);
}
function ecvHtmlLista(chiave){
  const d = ecvDati();
  if(chiave === "zone") return (d.zone || []).map((z, i) => `<span class="ecv-tag">${e_(z)}<button type="button" onclick="ecvTogliVoce('zone',${i})" aria-label="Togli">×</button></span>`).join("") || '<span class="ecv-muted">Nessuna zona: sul Pass compare «Italia».</span>';
  if(chiave === "spec"){
    const pred = ECV_SPEC[ecvRuolo()], extra = (d.spec || []).filter(s => !pred.includes(s));
    return ecvChips(pred.concat(extra), d.spec || [], "ecvSpec");
  }
  if(chiave === "formazione") return (d.formazione || []).map(x => {
    const ver = ecv.verifiche.has(x.id);
    return `<div class="ecv-voce"><span class="ecv-mini v">🎓</span><span class="ecv-vtxt"><b>${e_(x.titolo)}</b><small>${e_([x.ente, x.anno].filter(Boolean).join(" · "))}${x.file ? " · attestato allegato" : ""}</small>
      <span class="ecv-badge ${ver ? "v" : x.file ? "a" : "g"}">${ver ? "VERIFICATO DA EQUO" : x.file ? "IN VERIFICA" : "ALLEGA L'ATTESTATO PER LA VERIFICA"}</span></span>
      <button type="button" class="ecv-x" onclick="ecvTogliElemento('formazione','${x.id}')" aria-label="Elimina">×</button></div>`; }).join("") || '<div class="ecv-muted">Aggiungi diplomi, corsi e certificati.</div>';
  if(chiave === "esperienze") return (d.esperienze || []).map(x => `<div class="ecv-voce"><span class="ecv-mini">${(x.foto || []).length && ecvUrl[x.foto[0]] ? `<img src="${e_(ecvUrl[x.foto[0]])}" alt="">` : "🏆"}</span><span class="ecv-vtxt"><b>${e_(x.titolo)}</b><small>${e_([x.ruolo, x.luogo, x.anno].filter(Boolean).join(" · "))}${(x.foto || []).length ? " · " + x.foto.length + " foto" : ""}</small></span>
      <button type="button" class="ecv-x" onclick="ecvTogliElemento('esperienze','${x.id}')" aria-label="Elimina">×</button></div>`).join("") || '<div class="ecv-muted">Aggiungi gare, eventi, scuderie e collaborazioni.</div>';
  if(chiave === "referenze") return (ecv.referenze || []).map(r => `<div class="ecv-voce"><span class="ecv-vtxt"><b>${e_(r.autore || "Cliente")}</b><small>${r.testo ? "«" + e_(r.testo) + "»" : "Richiesta inviata: in attesa che la scriva"}</small>
      <span class="ecv-badge ${r.stato === "pubblicata" ? "v" : r.stato === "da_approvare" ? "a" : "g"}">${r.stato === "pubblicata" ? "PUBBLICATA" : r.stato === "da_approvare" ? "NUOVA · DA APPROVARE" : r.stato === "nascosta" ? "NASCOSTA" : "RICHIESTA"}</span></span>
      ${r.testo ? `<button type="button" class="ecv-int${r.stato === "pubblicata" ? " on" : ""}" onclick="ecvReferenza(this,'${r.id}')" aria-label="Pubblica o nascondi" style="margin-left:auto"></button>` : ""}</div>`).join("") || '<div class="ecv-muted">Nessuna referenza: chiedila a un cliente collegato su Equo.</div>';
  return "";
}
async function ecvTogliElemento(chiave, id){
  const arr = ecvDati()[chiave] || [];
  const i = arr.findIndex(x => x.id === id); if(i < 0) return;
  if(!await chiediConferma("Eliminare questa voce dal CV?")) return;
  arr.splice(i, 1); ecvSalva(); ecvAggiornaCompleto(); ecvRidisegnaSez(chiave);
}
async function ecvCaricaFile(file){
  if(DEMO_MODE) return null;
  if(file.size > 8 * 1048576){ showToast("File troppo grande (massimo 8 MB)."); return null; }
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
  const path = `${currentUser.id}/${Date.now()}-${ecvId()}.${ext}`;
  const { error } = await sb.storage.from("pro-cv").upload(path, file, { contentType: file.type || undefined });
  if(error){ showToast("Caricamento non riuscito: " + (error.message || "")); return null; }
  try{ const r = await sb.storage.from("pro-cv").createSignedUrl(path, 3600); if(r.data?.signedUrl) ecvUrl[path] = r.data.signedUrl; }catch(e){}
  return path;
}
async function ecvAggiungiFormazione(btn){
  const t = document.getElementById("ecv-f-titolo").value.trim();
  if(!t){ showToast("Scrivi il nome del corso o del diploma."); return; }
  btn.disabled = true;
  try{
    const f = document.getElementById("ecv-f-file").files[0];
    const file = f ? await ecvCaricaFile(f) : null;
    (ecvDati().formazione = ecvDati().formazione || []).push({ id: ecvId(), titolo: t.slice(0, 120), ente: document.getElementById("ecv-f-ente").value.trim().slice(0, 120), anno: document.getElementById("ecv-f-anno").value.trim().slice(0, 4), file });
    ["ecv-f-titolo", "ecv-f-ente", "ecv-f-anno", "ecv-f-file"].forEach(id => document.getElementById(id).value = "");
    ecvSalva(true); ecvAggiornaCompleto(); ecvRidisegnaSez("formazione");
  } finally { btn.disabled = false; }
}
async function ecvAggiungiEsperienza(btn){
  const t = document.getElementById("ecv-e-titolo").value.trim();
  if(!t){ showToast("Scrivi il nome dell'evento o dell'esperienza."); return; }
  btn.disabled = true;
  try{
    const files = [...document.getElementById("ecv-e-foto").files].slice(0, 3), foto = [];
    for(const f of files){ const p = await ecvCaricaFile(f); if(p) foto.push(p); }
    (ecvDati().esperienze = ecvDati().esperienze || []).unshift({ id: ecvId(), titolo: t.slice(0, 120), ruolo: document.getElementById("ecv-e-ruolo").value.trim().slice(0, 120), luogo: document.getElementById("ecv-e-luogo").value.trim().slice(0, 80), anno: document.getElementById("ecv-e-anno").value.trim().slice(0, 15), foto });
    ["ecv-e-titolo", "ecv-e-ruolo", "ecv-e-luogo", "ecv-e-anno", "ecv-e-foto"].forEach(id => document.getElementById(id).value = "");
    ecvSalva(true); ecvAggiornaCompleto(); ecvRidisegnaSez("esperienze");
  } finally { btn.disabled = false; }
}
async function ecvReferenza(el, id){
  const on = !el.classList.contains("on"), stato = on ? "pubblicata" : "nascosta";
  const r = (ecv.referenze || []).find(x => x.id === id);
  if(DEMO_MODE){ if(r) r.stato = stato; ecvRidisegnaSez("referenze"); return; }
  const { data, error } = await sb.rpc("equo_referenza_stato", { p_id: id, p_stato: stato });
  if(error || !data?.ok){ showToast("Operazione non riuscita, riprova."); return; }
  if(r) r.stato = stato; ecvRidisegnaSez("referenze");
}
async function ecvChiediReferenza(){
  const sel = document.getElementById("ecv-ref-cliente"); if(!sel || !sel.value) { showToast("Scegli un cliente collegato su Equo."); return; }
  if(DEMO_MODE){ showToast("In demo la richiesta non parte."); return; }
  const { data, error } = await sb.rpc("equo_chiedi_referenza", { p_cliente: sel.value });
  if(error || !data?.ok){ showToast(data?.motivo === "non_collegato" ? "Il cliente non è ancora collegato su Equo." : "Richiesta non inviata, riprova."); return; }
  showToast("Richiesta inviata: il cliente la trova nella sua Home e in chat.");
  await ecvCarica(); ecvRidisegnaSez("referenze");
}
async function ecvHammer(azione, btn){
  const d = ecvDati();
  if(DEMO_MODE){ showToast("In demo Hammer non scrive."); return; }
  const testoBtn = btn.textContent; btn.disabled = true; btn.textContent = "✨ Hammer sta scrivendo…";
  try{
    const tk = (await sb.auth.getSession()).data.session?.access_token || "";
    const r = await fetch("/.netlify/functions/cv-scrivi", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + tk },
      body: JSON.stringify({ azione, dati: { ruolo: etichettaPro(), titolo: d.titolo, presentazione: d.presentazione, spec: d.spec, zone: d.zone, trasferte: d.trasferte, lingue: d.lingue,
        esperienze: (d.esperienze || []).map(x => ({ t: x.titolo, r: x.ruolo, l: x.luogo, a: x.anno })), formazione: (d.formazione || []).map(x => ({ t: x.titolo, e: x.ente, a: x.anno })), numeri: ecv.numeri } }) });
    const j = await r.json().catch(() => ({}));
    if(!r.ok || !j.testo){ showToast(j.error || "Hammer non ha risposto, riprova."); return; }
    const campo = azione === "traduci" ? "presentazione_en" : "presentazione";
    ecvCampo(campo, j.testo);
    const ta = document.getElementById(azione === "traduci" ? "ecv-pres-en" : "ecv-pres");
    if(ta){ ta.value = j.testo; ta.closest(".ecv-campo").style.display = ""; }
  } catch(e){ showToast("Hammer non è raggiungibile ora."); }
  finally { btn.disabled = false; btn.textContent = testoBtn; }
}
async function ecvPubblica(el){
  if(!ecv.premium){ el.classList.remove("on"); if(typeof apriUpgradePro === "function") apriUpgradePro(); return; }
  const on = !el.classList.contains("on");
  if(DEMO_MODE){ ecv.pubblica = on; el.classList.toggle("on", on); return; }
  const { error } = await sb.from("pro_cv").update({ pubblica: on }).eq("user_id", currentUser.id);
  if(error){ showToast("Non salvato, riprova."); return; }
  ecv.pubblica = on; el.classList.toggle("on", on);
  showToast(on ? "Pagina pubblica online" : "Pagina pubblica nascosta");
}
async function ecvSlug(){
  const inp = document.getElementById("ecv-slug"), v = (inp.value || "").trim().toLowerCase();
  if(v === ecv.slug) return;
  if(DEMO_MODE){ ecv.slug = v; return; }
  const { data, error } = await sb.from("pro_cv").update({ slug: v || null }).eq("user_id", currentUser.id).select("slug").single();
  if(error){ showToast(/SLUG_USATO/.test(error.message || "") ? "Questo indirizzo è già usato: scegline un altro." : "Indirizzo non valido: usa lettere, numeri e trattini."); inp.value = ecv.slug; return; }
  ecv.slug = data.slug; inp.value = data.slug; showToast("Indirizzo salvato");
}
function ecvCopiaLink(){
  const l = "https://app.equohub.com/pro/" + ecv.slug;
  if(navigator.share){ navigator.share({ text: l }).catch(() => {}); return; }
  try{ navigator.clipboard.writeText(l); showToast("Link copiato"); }catch(e){ showToast(l); }
}
function ecvHtmlCv(){
  const d = ecvDati(), c = d.contatti, n = ecv.numeri || {};
  const clientiCollegati = (typeof clientiMascalcia !== "undefined" ? clientiMascalcia : []).filter(x => x.cliente_user_id && !x.archiviato_il);
  const cont = (k, label, ph) => `<div class="ecv-riga"><div class="ecv-campo" style="flex:1;margin:0"><label>${label}</label><input value="${e_(c[k]?.v || "")}" placeholder="${ph}" onchange="ecvCampo('contatti.${k}.v', this.value.trim())"></div>${ecvInt("contatti." + k + ".m", c[k]?.m !== false)}</div>`;
  const numRiga = (k, label, v) => `<div class="ecv-riga"><div>${label}<small>${e_(v)}</small></div>${ecvInt("numeri." + k, d.numeri[k] !== false)}</div>`;
  return `
  <div class="ecv-compl"><b class="ecv-perc">${ecvCompleto()}%</b><div class="ecv-barra"><i style="width:${ecvCompleto()}%"></i></div><small id="ecv-salvato">Salvato ✓</small></div>
  <div class="ecv-azioni" style="padding-top:0"><button type="button" class="princ" onclick="ecvPdfCv()">Scarica PDF</button><button type="button" onclick="ecvPdfCv(true)">Condividi</button><button type="button" onclick="ecvMostra('pass')">Vedi il Pass</button></div>

  <details class="ecv-sez" open><summary>👤 Profilo</summary><div class="ecv-dentro">
    <div class="ecv-campo"><label>Titolo (sotto il nome)</label><input value="${e_(d.titolo)}" maxlength="90" placeholder="es. ${e_(etichettaPro())} · ferratura correttiva e sportiva" onchange="ecvCampo('titolo', this.value.trim())"></div>
    <div class="ecv-campo"><label>Presentazione</label><textarea id="ecv-pres" maxlength="900" placeholder="Chi sei, come lavori, con chi collabori…" onchange="ecvCampo('presentazione', this.value.trim())">${e_(d.presentazione)}</textarea></div>
    <div class="ecv-campo"${d.presentazione_en ? "" : ' style="display:none"'}><label>Presentazione in inglese</label><textarea id="ecv-pres-en" maxlength="1200" onchange="ecvCampo('presentazione_en', this.value.trim())">${e_(d.presentazione_en)}</textarea></div>
    <button type="button" class="ecv-hammer" onclick="ecvHammer('presentazione', this)">✨ Scrivi con Hammer</button><button type="button" class="ecv-hammer" onclick="ecvHammer('traduci', this)">🇬🇧 Versione in inglese</button>
    <div class="ecv-muted" style="margin-top:4px">Foto e nome vengono dal tuo profilo (menu profilo).</div>
  </div></details>

  <details class="ecv-sez"><summary>📇 Contatti</summary><div class="ecv-dentro">
    ${cont("telefono", "Telefono", "333 123 4567")}${cont("email", "Email", "nome@esempio.it")}${cont("instagram", "Instagram", "@nome")}${cont("sito", "Sito web", "www.esempio.it")}${cont("indirizzo", "Indirizzo o officina", "Comune (provincia)")}
    <div class="ecv-muted">L'interruttore decide se il contatto compare su Pass e CV. Sulla pagina pubblica telefono, email e indirizzo non compaiono mai: li vede chi si collega su Equo.</div>
  </div></details>

  <details class="ecv-sez"><summary>📍 Dove lavoro</summary><div class="ecv-dentro">
    <div class="ecv-campo"><label>Zone abituali (puoi metterne più di una)</label><div class="ecv-riga" style="border:0;padding:0"><input id="ecv-zona" placeholder="es. Roma, Frosinone…" maxlength="40" onkeydown="if(event.key==='Enter'){event.preventDefault();ecvAggiungiVoce('zone','ecv-zona')}"><button type="button" class="ecv-piccolo" onclick="ecvAggiungiVoce('zone','ecv-zona')">Aggiungi</button></div></div>
    <div id="ecv-lista-zone" class="ecv-tags">${ecvHtmlLista("zone")}</div>
    <div class="ecv-riga"><div>Disponibile per trasferte ed eventi<small>sul Pass: «trasferte»</small></div>${ecvInt("trasferte", !!d.trasferte)}</div>
    <div class="ecv-riga"><div>Mostra la zona su Pass e CV<small>se spento compare solo «Italia»</small></div>${ecvInt("mostra_zona", d.mostra_zona !== false)}</div>
  </div></details>

  <details class="ecv-sez"><summary>🔧 Specializzazioni</summary><div class="ecv-dentro">
    <div id="ecv-lista-spec">${ecvHtmlLista("spec")}</div>
    <div class="ecv-riga" style="border:0"><input id="ecv-spec-nuova" placeholder="Un'altra specializzazione" maxlength="50"><button type="button" class="ecv-piccolo" onclick="ecvAggiungiVoce('spec','ecv-spec-nuova')">Aggiungi</button></div>
  </div></details>

  <details class="ecv-sez"><summary>🎓 Formazione e certificazioni</summary><div class="ecv-dentro">
    <div id="ecv-lista-formazione">${ecvHtmlLista("formazione")}</div>
    <div class="ecv-nuovo"><input id="ecv-f-titolo" placeholder="Diploma, corso o certificato" maxlength="120"><div class="ecv-due"><input id="ecv-f-ente" placeholder="Scuola o ente" maxlength="120"><input id="ecv-f-anno" placeholder="Anno" inputmode="numeric" maxlength="4"></div>
      <label class="ecv-file">Attestato (PDF o foto, per la verifica di Equo)<input type="file" id="ecv-f-file" accept="application/pdf,image/*"></label>
      <button type="button" class="ecv-agg" onclick="ecvAggiungiFormazione(this)">+ Aggiungi corso o certificato</button></div>
  </div></details>

  <details class="ecv-sez"><summary>🏆 Esperienze, eventi e gare</summary><div class="ecv-dentro">
    <div id="ecv-lista-esperienze">${ecvHtmlLista("esperienze")}</div>
    <div class="ecv-nuovo"><input id="ecv-e-titolo" placeholder="Evento, gara o esperienza (es. FEI Jumping European Championship)" maxlength="120"><input id="ecv-e-ruolo" placeholder="Il tuo ruolo (es. Farrier ufficiale)" maxlength="120">
      <div class="ecv-due"><input id="ecv-e-luogo" placeholder="Luogo" maxlength="80"><input id="ecv-e-anno" placeholder="Anno (es. 2023 o 2018 — oggi)" maxlength="15"></div>
      <label class="ecv-file">Foto (fino a 3)<input type="file" id="ecv-e-foto" accept="image/*" multiple></label>
      <button type="button" class="ecv-agg" onclick="ecvAggiungiEsperienza(this)">+ Aggiungi esperienza o evento</button></div>
  </div></details>

  <details class="ecv-sez"><summary>🌍 Lingue</summary><div class="ecv-dentro">${ecvChips(ECV_LINGUE.concat((d.lingue || []).filter(l => !ECV_LINGUE.includes(l))), d.lingue || [], "ecvLingua")}</div></details>

  <details class="ecv-sez"><summary>📊 Numeri Equo</summary><div class="ecv-dentro">
    ${numRiga("cavalli", "Cavalli seguiti", n.cavalli ?? 0)}${numRiga("interventi", "Interventi registrati", n.interventi ?? 0)}${numRiga("clienti", "Scuderie e clienti", n.clienti ?? 0)}${numRiga("discipline", "Discipline principali", (n.discipline || []).join(" · ") || "–")}
    <div class="ecv-muted">Non si scrivono a mano: vengono dal lavoro registrato in Equo. Scegli tu quali mostrare.</div>
  </div></details>

  <details class="ecv-sez"><summary>💬 Referenze</summary><div class="ecv-dentro">
    <div id="ecv-lista-referenze">${ecvHtmlLista("referenze")}</div>
    ${clientiCollegati.length ? `<div class="ecv-riga" style="border:0"><select id="ecv-ref-cliente"><option value="">Scegli un cliente collegato…</option>${clientiCollegati.map(x => `<option value="${x.id}">${e_(x.nome)}</option>`).join("")}</select><button type="button" class="ecv-piccolo" onclick="ecvChiediReferenza()">Chiedi</button></div>` : '<div class="ecv-muted">Le referenze si chiedono ai clienti collegati su Equo.</div>'}
    <div class="ecv-muted">Il cliente la scrive dalla sua Home; la pubblichi solo se vuoi.</div>
  </div></details>

  <details class="ecv-sez"><summary>🎨 Aspetto del PDF</summary><div class="ecv-dentro">
    <div class="ecv-modelli">${Object.keys(ECV_MODELLI).map(m => `<button type="button" class="${(d.modello || "classico") === m ? "on" : ""}" onclick="ecvModello(this,'${m}')"><i style="background:linear-gradient(90deg,rgb(${ECV_MODELLI[m].join(",")}) 36%,#fff 36%)"></i>${ECV_NOME_MODELLI[m]}</button>`).join("")}</div>
    <div class="ecv-riga"><div>Lingua del PDF</div><select onchange="ecvCampo('lingua_pdf', this.value)"><option value="it"${d.lingua_pdf === "it" ? " selected" : ""}>Italiano</option><option value="en"${d.lingua_pdf === "en" ? " selected" : ""}>Inglese</option></select></div>
  </div></details>

  <details class="ecv-sez" id="ecv-sez-pubblica"><summary>🌐 Pagina pubblica <span class="ecv-badge p">PREMIUM</span></summary><div class="ecv-dentro">
    <div class="ecv-muted" style="margin-bottom:8px">Il tuo CV online: la vede chi inquadra il tuo QR senza avere Equo, con il pulsante «Collegati». Puoi metterla su Instagram o WhatsApp.</div>
    <div class="ecv-riga"><div>Pagina online<small>${ecv.premium ? "visibile a tutti" : "disponibile con Premium"}</small></div><button type="button" class="ecv-int${ecv.pubblica ? " on" : ""}" onclick="ecvPubblica(this)" aria-label="Pagina pubblica"></button></div>
    <div class="ecv-campo"><label>Indirizzo</label><div class="ecv-riga" style="border:0;padding:0"><span class="ecv-muted" style="white-space:nowrap">app.equohub.com/pro/</span><input id="ecv-slug" value="${e_(ecv.slug || "")}" maxlength="60" onchange="ecvSlug()"></div></div>
    <div class="ecv-azioni" style="padding:4px 0 0">${ecv.premium ? `<button type="button" onclick="ecvCopiaLink()">Condividi il link</button><button type="button" onclick="window.open('https://app.equohub.com/pro/'+encodeURIComponent('${e_(ecv.slug || "")}'),'_blank')">Apri</button>` : `<button type="button" class="princ ecv-prem" onclick="apriUpgradePro()">Passa a Premium</button>`}</div>
  </div></details>
  <div class="ecv-nota">Ultimo aggiornamento: ${ecv.aggiornato_il ? new Date(ecv.aggiornato_il).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : "oggi"} · compare sul PDF</div>`;
}
function ecvModello(el, m){ document.querySelectorAll(".ecv-modelli button").forEach(b => b.classList.remove("on")); el.classList.add("on"); ecvCampo("modello", m); }

// ---------------- PDF ----------------
async function ecvImmagine(url){
  if(!url) return null;
  try{
    const b = await (await fetch(url, { mode: "cors" })).blob();
    return await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => res(null); r.readAsDataURL(b); });
  }catch(e){ return null; }
}
function ecvFormato(dataUrl){ return /^data:image\/png/.test(dataUrl || "") ? "PNG" : "JPEG"; }
async function ecvCondividiPdf(doc, nome, condividi){
  const blob = doc.output("blob");
  const file = new File([blob], nome, { type: "application/pdf" });
  if(condividi && navigator.canShare && navigator.canShare({ files: [file] })){
    try{ await navigator.share({ files: [file], title: nome }); return; }catch(e){ if(e?.name === "AbortError") return; }
  }
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
const ecvTesto = s => String(s || "").replace(/[^\x20-\x7E -ÿ€–—«»’‘“”…·]/g, "").trim();
function ecvNomeFile(tipo){ return "Equo-" + tipo + "-" + ecvNome().replace(/[^A-Za-z0-9]+/g, "-") + ".pdf"; }
async function ecvPdfPass(condividi){
  showToast("Creo il PDF del Pass…");
  try{
    const JsPDF = await caricaJsPdf();
    const W = 86, H = 135, doc = new JsPDF({ unit: "mm", format: [W, H] });
    const d = ecvDati(), oro = [201, 143, 46], scuro = [43, 31, 8], grigio = [122, 106, 74];
    doc.setFillColor(251, 246, 234); doc.rect(0, 0, W, H, "F");
    doc.setFillColor(...scuro); doc.rect(0, 0, W, 30, "F"); doc.triangle(0, 30, W, 30, W / 2, 38, "F");
    doc.setFillColor(...oro); doc.rect(0, 29.4, W, .6, "F");
    doc.setFillColor(210, 200, 175); doc.roundedRect(W / 2 - 7, 3, 14, 2.2, 1.1, 1.1, "F");
    const logo = await ecvImmagine("assets/equo-card-cavallo.png");
    if(logo) doc.addImage(logo, "PNG", 6, 9, 11, 11);
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text("Equo", 19, 15);
    doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.text("P A S S", 19, 19);
    doc.setFontSize(7); doc.text(String(new Date().getFullYear()), W - 7, 15, { align: "right" });
    const av = await ecvImmagine(ecvAvatar());
    doc.setFillColor(205, 192, 165); doc.roundedRect(6, 42, 27, 33, 3, 3, "F");
    if(av){ try{ doc.addImage(av, ecvFormato(av), 6, 42, 27, 33); }catch(e){} }
    else { doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.text(ecvIniziali(), 19.5, 61, { align: "center" }); }
    let y = 42;
    doc.setFillColor(...oro); doc.rect(36, y, W - 42, 6, "F"); doc.setTextColor(...scuro); doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.text(ecvTesto(etichettaPro().toUpperCase()), 38, y + 4.2);
    y += 8; const nome = doc.splitTextToSize(ecvTesto(ecvNome().toUpperCase()), W - 46);
    doc.setFillColor(...scuro); doc.rect(36, y, W - 42, 4 + nome.length * 4.4, "F"); doc.setTextColor(255, 255, 255); doc.setFontSize(9.5); doc.text(nome, 38, y + 5);
    y += 6 + nome.length * 4.4; doc.setFillColor(239, 228, 204); doc.rect(36, y, W - 42, 6, "F"); doc.setTextColor(...scuro); doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.text(ecvTesto(ecvZonaTesto()), 38, y + 4.1, { maxWidth: W - 46 });
    if(currentUser?.certificazioneStato === "verificato"){ y += 9; doc.setTextColor(29, 122, 76); doc.setFont("helvetica", "bold"); doc.setFontSize(6.8); doc.text("EQUO CERTIFIED", 38, y + 2); }
    let x = 6; y = 82; doc.setFontSize(6.3); doc.setFont("helvetica", "bold");
    (d.spec || []).slice(0, 4).forEach(s => { const t = ecvTesto(ecvCorta(s)); const w = doc.getTextWidth(t) + 4; if(x + w > W - 6){ x = 6; y += 6; } doc.setFillColor(...scuro); doc.roundedRect(x, y, w, 4.6, 1, 1, "F"); doc.setTextColor(242, 217, 166); doc.text(t, x + 2, y + 3.2); x += w + 1.6; });
    disegnaQrPdf(doc, ecvLink(), W - 29, H - 30, 23);
    doc.setTextColor(...scuro); doc.setFont("courier", "bold"); doc.setFontSize(8); doc.text(ecvTesto(ecvCodice()), 6, H - 11);
    doc.setFont("helvetica", "normal"); doc.setFontSize(5.8); doc.setTextColor(...grigio); doc.text("Inquadra per collegarti su Equo", 6, H - 7);
    // retro
    doc.addPage([W, H]); doc.setFillColor(251, 246, 234); doc.rect(0, 0, W, H, "F");
    let yr = 14; const num = ecvNumeriVisibili();
    if(num.length){ doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(...grigio); doc.text("NUMERI EQUO · VERIFICATI", 6, yr); yr += 3;
      num.forEach(([v, t], i) => { const cx = 6 + (i % 2) * 38, cy = yr + Math.floor(i / 2) * 15; doc.setFillColor(239, 228, 204); doc.roundedRect(cx, cy, 36, 13, 2, 2, "F"); doc.setTextColor(...scuro); doc.setFontSize(12); doc.text(ecvTesto(v), cx + 3, cy + 6.5); doc.setFont("helvetica", "normal"); doc.setFontSize(5.8); doc.setTextColor(...grigio); doc.text(ecvTesto(t), cx + 3, cy + 10.5); doc.setFont("helvetica", "bold"); });
      yr += Math.ceil(num.length / 2) * 15 + 6; }
    doc.setFontSize(6.5); doc.setTextColor(...grigio); doc.text("ESPERIENZA", 6, yr); yr += 4;
    const righe = (d.esperienze || []).slice(0, 4).map(e => [e.titolo, [e.luogo, e.anno].filter(Boolean).join(" ")]);
    if((d.lingue || []).length) righe.push(["Lingue", d.lingue.join(" · ")]);
    righe.forEach(([a, b]) => { doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(...scuro); doc.text(doc.splitTextToSize(ecvTesto(a), 44)[0] || "", 6, yr); doc.setFont("helvetica", "normal"); doc.setTextColor(...grigio); doc.text(ecvTesto(b), W - 6, yr, { align: "right" }); doc.setDrawColor(234, 223, 198); doc.line(6, yr + 1.8, W - 6, yr + 1.8); yr += 6; });
    doc.setFontSize(5.8); doc.setTextColor(...grigio); doc.text("Equo Pass · equohub.com", W / 2, H - 7, { align: "center" });
    await ecvCondividiPdf(doc, ecvNomeFile("Pass"), condividi);
  }catch(e){ console.error("ecvPdfPass:", e); showToast("Impossibile creare il PDF: " + (e?.message || e)); }
}
async function ecvPdfCv(condividi){
  showToast("Creo il PDF del CV…");
  try{
    const JsPDF = await caricaJsPdf();
    const doc = new JsPDF({ unit: "mm", format: "a4" });
    const d = ecvDati(), W = 210, H = 297, SX = 70, col = ECV_MODELLI[d.modello] || ECV_MODELLI.classico, en = d.lingua_pdf === "en";
    const T = en ? { prof: "PROFILE", esp: "EXPERIENCE AND EVENTS", form: "EDUCATION AND CERTIFICATIONS", num: "EQUO NUMBERS", ref: "REFERENCES", cont: "CONTACTS", zona: "WHERE I WORK", spec: "SPECIALTIES", lingue: "LANGUAGES", qr: "Scan to connect on Equo", ver: "verified by Equo", agg: "Equo CV · updated on ", trasf: "Available for travel and events", nota: "Equo numbers are calculated from the work recorded in the app" }
      : { prof: "PROFILO", esp: "ESPERIENZE ED EVENTI", form: "FORMAZIONE E CERTIFICAZIONI", num: "NUMERI EQUO", ref: "REFERENZE", cont: "CONTATTI", zona: "DOVE LAVORO", spec: "SPECIALIZZAZIONI", lingue: "LINGUE", qr: "Inquadra e collegati su Equo", ver: "verificato da Equo", agg: "Equo CV · aggiornato il ", trasf: "Disponibile per trasferte ed eventi", nota: "I numeri Equo sono calcolati dal lavoro registrato in app" };
    doc.setFillColor(...col); doc.rect(0, 0, SX, H, "F");
    const av = await ecvImmagine(ecvAvatar());
    doc.setFillColor(205, 192, 165); doc.circle(SX / 2, 30, 17, "F");
    if(av){ try{ doc.addImage(av, ecvFormato(av), SX / 2 - 17, 13, 34, 34); }catch(e){} doc.setDrawColor(...col); doc.setLineWidth(4); doc.circle(SX / 2, 30, 19, "S"); doc.setLineWidth(.2); }
    else { doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.text(ecvIniziali(), SX / 2, 33, { align: "center" }); }
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(12.5);
    const nomeR = doc.splitTextToSize(ecvTesto(ecvNome().toUpperCase()), SX - 12); doc.text(nomeR, SX / 2, 56, { align: "center" });
    let y = 56 + nomeR.length * 5.5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.2);
    const tit = doc.splitTextToSize(ecvTesto((d.titolo || etichettaPro()).toUpperCase()), SX - 12); doc.text(tit, SX / 2, y, { align: "center" }); y += tit.length * 3.5 + 2;
    if(currentUser?.certificazioneStato === "verificato"){ doc.setFillColor(29, 154, 93); doc.roundedRect(SX / 2 - 15, y, 30, 5, 2.5, 2.5, "F"); doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.text("EQUO CERTIFIED", SX / 2, y + 3.5, { align: "center" }); y += 8; }
    const testa = (t) => { y += 5; doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(255, 255, 255); doc.text(t, 7, y); doc.setDrawColor(255, 255, 255); doc.setLineWidth(.25); doc.line(7, y + 1.5, SX - 7, y + 1.5); y += 6; doc.setFont("helvetica", "normal"); doc.setFontSize(7.6); };
    const contatti = ["telefono", "email", "instagram", "sito", "indirizzo"].filter(k => d.contatti[k]?.v && d.contatti[k]?.m !== false).map(k => d.contatti[k].v);
    if(contatti.length){ testa(T.cont); contatti.forEach(v => { doc.text(doc.splitTextToSize(ecvTesto(v), SX - 14), 7, y); y += 4.6; }); }
    testa(T.zona); doc.text(doc.splitTextToSize(ecvTesto(d.mostra_zona === false ? "Italia" : (d.zone || []).join(" · ") || "Italia"), SX - 14), 7, y); y += 4.6;
    if(d.trasferte){ doc.text(doc.splitTextToSize(T.trasf, SX - 14), 7, y); y += 8; }
    if((d.spec || []).length){ testa(T.spec); d.spec.slice(0, 9).forEach(s => { doc.text(doc.splitTextToSize("• " + ecvTesto(s), SX - 14), 7, y); y += 4.4; }); }
    if((d.lingue || []).length){ testa(T.lingue); doc.text(doc.splitTextToSize(ecvTesto(d.lingue.join(" · ")), SX - 14), 7, y); y += 4.6; }
    doc.setFillColor(255, 255, 255); doc.roundedRect(SX / 2 - 17, H - 58, 34, 34, 2, 2, "F");
    disegnaQrPdf(doc, ecvLink(), SX / 2 - 14.5, H - 55.5, 29);
    doc.setTextColor(255, 255, 255); doc.setFontSize(6.5); doc.text(T.qr, SX / 2, H - 19, { align: "center" });
    doc.setFont("courier", "bold"); doc.text(ecvTesto(ecvCodice()), SX / 2, H - 15, { align: "center" });
    // colonna destra
    const X = SX + 10, L = W - X - 12; let yr = 20;
    const sez = (t) => { if(yr > H - 30){ doc.addPage(); yr = 20; } doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...col); doc.text(t, X, yr); doc.setDrawColor(...col); doc.setLineWidth(.5); doc.line(X, yr + 1.8, W - 12, yr + 1.8); doc.setLineWidth(.2); yr += 8; doc.setTextColor(40, 40, 46); doc.setFont("helvetica", "normal"); doc.setFontSize(8.8); };
    const pres = en && d.presentazione_en ? d.presentazione_en : d.presentazione;
    if(pres){ sez(T.prof); const r = doc.splitTextToSize(ecvTesto(pres), L); doc.text(r, X, yr); yr += r.length * 4.2 + 4; }
    if((d.esperienze || []).length){ sez(T.esp); d.esperienze.forEach(e => { if(yr > H - 20){ doc.addPage(); yr = 20; } doc.setFont("helvetica", "bold"); doc.text(doc.splitTextToSize(ecvTesto(e.ruolo || e.titolo), L)[0], X, yr); yr += 4.3; doc.setFont("helvetica", "normal"); doc.setTextColor(110, 110, 110); doc.text(doc.splitTextToSize(ecvTesto([e.ruolo ? e.titolo : "", e.luogo, e.anno].filter(Boolean).join(" · ")), L), X, yr); doc.setTextColor(40, 40, 46); yr += 6.5; }); yr += 2; }
    if((d.formazione || []).length){ sez(T.form); d.formazione.forEach(f => { if(yr > H - 20){ doc.addPage(); yr = 20; } const ver = ecv.verifiche.has(f.id); doc.setFont("helvetica", "bold"); doc.text(doc.splitTextToSize(ecvTesto(f.titolo), L)[0], X, yr); yr += 4.3; doc.setFont("helvetica", "normal"); doc.setTextColor(110, 110, 110); doc.text(ecvTesto([f.ente, f.anno, ver ? T.ver : ""].filter(Boolean).join(" · ")), X, yr); doc.setTextColor(40, 40, 46); yr += 6.5; }); yr += 2; }
    const num = ecvNumeriVisibili().filter(n => !/su Equo dal/.test(n[1]));
    if(num.length){ sez(T.num); const w = (L - (num.length - 1) * 3) / num.length; num.forEach(([v, t], i) => { const cx = X + i * (w + 3); doc.setFillColor(242, 239, 232); doc.roundedRect(cx, yr - 4, w, 15, 2, 2, "F"); doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(...col); doc.text(ecvTesto(v), cx + w / 2, yr + 3, { align: "center" }); doc.setFont("helvetica", "normal"); doc.setFontSize(6.8); doc.setTextColor(90, 90, 90); doc.text(ecvTesto(t), cx + w / 2, yr + 8, { align: "center" }); }); yr += 18; doc.setFontSize(8.8); doc.setTextColor(40, 40, 46); }
    const refs = (ecv.referenze || []).filter(r => r.stato === "pubblicata" && r.testo);
    if(refs.length){ sez(T.ref); refs.slice(0, 4).forEach(r => { doc.setFont("helvetica", "italic"); const t = doc.splitTextToSize("«" + ecvTesto(r.testo) + "» — " + ecvTesto(r.autore || ""), L); if(yr + t.length * 4.2 > H - 16){ doc.addPage(); yr = 20; } doc.text(t, X, yr); yr += t.length * 4.2 + 3; }); doc.setFont("helvetica", "normal"); }
    const pagine = doc.getNumberOfPages();
    for(let p = 1; p <= pagine; p++){ doc.setPage(p); doc.setFontSize(6.5); doc.setTextColor(140, 140, 140); doc.text(T.agg + new Date(ecv.aggiornato_il || Date.now()).toLocaleDateString(en ? "en-GB" : "it-IT") + " · " + T.nota, W - 12, H - 7, { align: "right" }); }
    await ecvCondividiPdf(doc, ecvNomeFile("CV"), condividi);
  }catch(e){ console.error("ecvPdfCv:", e); showToast("Impossibile creare il PDF: " + (e?.message || e)); }
}

export { apriCardPro, chiudiCardPro, ecvAggiungiEsperienza, ecvAggiungiFormazione, ecvAggiungiVoce, ecvCampo, ecvChiediReferenza, ecvCopiaLink, ecvGiraPass, ecvHammer, ecvIndietro, ecvInterruttore, ecvLingua, ecvModello, ecvMostra, ecvPdfCv, ecvPdfPass, ecvPubblica, ecvReferenza, ecvSlug, ecvSpec, ecvTogliElemento, ecvTogliVoce };
