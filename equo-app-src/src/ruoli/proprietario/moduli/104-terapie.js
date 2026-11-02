// Equo App · proprietario · TERAPIE DEL VETERINARIO (2/11/2026, piano terapeutico · SQL 34)
// Il piano lo scrive il veterinario e lo vede il proprietario solo dopo l'invio (core/dati/db-01: terapieInCorso, terapiaFatto).
// Home: «Terapie di oggi» con le somministrazioni del giorno («Fatto» se il veterinario chiede la conferma).
// Scheda del cavallo: «Terapia in corso» con tutte le voci, fino a quando, tempo di attesa DPA.
// Il promemoria all'ora giusta lo manda la funzione Netlify invia-terapie (push, o email se la push non parte).
// Si aggancia con le estensioni (renderHome, openHorseDetail): nessun file del proprietario cambia.

const terEsc = s => escapeHtml(s == null ? "" : String(s));
const TER = { piani: [], il: 0, promessa: null };
const terOra = iso => new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
const terGiorno = d => isoLocale(new Date(d));
const terDataBreve = iso => iso ? new Date(iso + "T12:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "";

function terCarica(forza){
  if(TER.promessa) return TER.promessa;
  if(!forza && TER.il && Date.now() - TER.il < 60000) return Promise.resolve(TER.piani);
  TER.promessa = DB.terapieInCorso({ comePro: false, horseIds: (typeof horses !== "undefined" ? horses : []).map(h => h.id) })
    .catch(() => []).then(l => { TER.piani = l || []; TER.il = Date.now(); TER.promessa = null; return TER.piani; });
  return TER.promessa;
}
// somministrazioni di oggi (e quelle di ieri sera non ancora confermate, finché non sono «saltate»)
function terDiOggi(p){
  const oggi = terGiorno(Date.now()), ora = Date.now();
  return p.somm.filter(s => terGiorno(s.previsto_il) === oggi || (!s.fatto_il && statoSomministrazione(s, ora) === "da_fare" && new Date(s.previsto_il).getTime() < ora));
}
function terVoce(p, id){ return p.voci.find(v => v.id === id) || {}; }
function terRigaSomm(p, s){
  const v = terVoce(p, s.voce_id), st = statoSomministrazione(s), passata = new Date(s.previsto_il).getTime() <= Date.now() + 30 * 60000;
  const dx = st === "fatta" ? '<span class="ter-fatta">✓ Fatto</span>'
    : st === "saltata" ? '<span class="ter-saltata">saltata</span>'
    : p.chiedi_conferme && p.stato === "attivo" ? `<button type="button" class="btn btn-primary btn-sm ter-btn" ${passata ? "" : "disabled"} onclick="terFatto('${s.id}')">Fatto</button>` : "";
  return `<div class="ter-somm${st === "fatta" ? " ok" : ""}"><span class="o">${terOra(s.previsto_il)}</span><span class="c"><b>${terEsc(v.nome || "")}</b>${v.dose ? `<small>${terEsc(v.dose)}${v.via ? " · " + terEsc(v.via.toLowerCase()) : ""}</small>` : ""}${v.note ? `<small>${terEsc(v.note)}</small>` : ""}</span>${dx}</div>`;
}
function terFine(p){
  const f = p.voci.map(v => { const d = new Date((v.inizio || isoLocale(new Date())) + "T12:00"); d.setDate(d.getDate() + Math.max(1, v.giorni || 1) - 1); return isoLocale(d); }).sort();
  return f[f.length - 1] || "";
}

/* ---------------- Home: «Terapie di oggi» ---------------- */
async function terRenderHome(){
  const home = document.getElementById("page-home"); if(!home || !currentUser) return;
  let box = document.getElementById("home-terapie");
  if(!box){
    box = document.createElement("div"); box.id = "home-terapie";
    const dopo = document.getElementById("home-oggi");
    if(dopo && dopo.parentNode) dopo.parentNode.insertBefore(box, dopo.nextSibling); else home.prepend(box);
  }
  const piani = await terCarica();
  if(!piani.length){ box.innerHTML = ""; return; }
  box.innerHTML = `<div class="card ter-card"><div class="ter-tit">💊 Terapie di oggi</div>${piani.map(p => {
    const oggi = terDiOggi(p);
    return `<div class="ter-piano"><div class="ter-cav"><b>${terEsc(p.cavallo_nome || "Cavallo")}</b><small>${p.stato === "sospeso" ? "sospesa dal veterinario" : "fino al " + terEsc(terDataBreve(terFine(p)))}</small></div>
      ${p.stato === "sospeso" ? '<div class="muted ter-vuoto">Per ora non dare la terapia: il veterinario ti avvisa quando riprendere.</div>'
        : oggi.length ? oggi.map(s => terRigaSomm(p, s)).join("") : '<div class="muted ter-vuoto">Oggi niente da dare.</div>'}
      ${p.horse_id && (typeof horses !== "undefined" ? horses : []).some(h => h.id === p.horse_id) ? `<button type="button" class="ter-link" onclick="openHorseDetail('${p.horse_id}');showPage('cavalli')">Vedi tutto il piano ›</button>` : ""}</div>`;
  }).join("")}</div>`;
  // arrivati dalla notifica (?apri=terapie): si porta la card in vista
  try{ const q = new URLSearchParams(location.search); if(q.get("apri") === "terapie"){ history.replaceState({}, "", location.pathname); box.scrollIntoView({ block: "start", behavior: "smooth" }); } }catch(_){}
}

/* ---------------- scheda del cavallo: «Terapia in corso» ---------------- */
async function terRenderCavallo(horseId){
  const vista = document.getElementById("cavalli-detail-view"); if(!vista) return;
  let box = document.getElementById("horse-terapia");
  if(!box){
    box = document.createElement("div"); box.id = "horse-terapia";
    const dove = document.getElementById("horse-dove");
    if(dove && dove.parentNode) dove.parentNode.insertBefore(box, dove.nextSibling); else vista.appendChild(box);
  }
  box.innerHTML = "";
  const piani = (await terCarica()).filter(p => p.horse_id === (horseId || currentHorseId));
  if((horseId || currentHorseId) !== currentHorseId) return;
  box.innerHTML = piani.map(p => {
    const att = p.attesa_fino ? new Date(p.attesa_fino + "T12:00").toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : "";
    const oggi = terDiOggi(p);
    return `<div class="card ter-card" style="margin-bottom:14px"><div class="ter-tit">💊 Terapia in corso${p.stato === "sospeso" ? " · sospesa" : ""}</div>
      <div class="muted ter-sotto">Piano del veterinario · fino al ${terEsc(terDataBreve(terFine(p)))}</div>
      ${p.voci.map(v => `<div class="ter-voce"><b>${terEsc(v.nome)}${v.dose ? " · " + terEsc(v.dose) : ""}${v.via ? " · " + terEsc(v.via.toLowerCase()) : ""}</b><small>${terEsc(testoVoceTerapia(v))}${v.note ? " · " + terEsc(v.note) : ""}</small></div>`).join("")}
      ${att ? `<div class="ter-attesa">Cavallo DPA: tempo di attesa fino al <b>${terEsc(att)}</b></div>` : ""}
      ${oggi.length && p.stato === "attivo" ? `<div class="ter-oggi-t">Oggi</div>${oggi.map(s => terRigaSomm(p, s)).join("")}` : ""}
      ${p.chiedi_conferme ? '<div class="muted ter-nota">Il veterinario ti chiede di toccare «Fatto» quando dai la terapia.</div>' : ""}</div>`;
  }).join("");
}

/* ---------------- «Fatto» ---------------- */
async function terFatto(id){
  const { data, error } = await DB.terapiaFatto(id, true);
  if(error || data === false) return showToast(/troppo_presto/.test(error?.message || "") ? "È troppo presto per segnarla" : "Non salvato: riprova");
  showToast("Segnata come fatta");
  await terCarica(true);
  terRenderHome();
  if(document.getElementById("cavalli-detail-view")?.style.display !== "none" && currentHorseId) terRenderCavallo(currentHorseId);
}

// aggancio a Home e scheda del cavallo (il modulo può caricarsi prima delle estensioni: si aggancia a pagina pronta)
function terAggancia(){
  try{
    estendiDopo("renderHome", function(){ terRenderHome(); });
    estendiDopo("openHorseDetail", function(id){ terRenderCavallo(id); });
  }catch(err){ console.error("terapie:", err); }
}
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", terAggancia, { once: true }); else terAggancia();

export { terCarica, terRenderHome, terRenderCavallo, terFatto, TER };
