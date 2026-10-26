// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { giorniTra, intervalloPredefinito } from "./032-richiamo-prossimo-intervento-sempre-in-g.js";
import { razzaImposta, razzaValore } from "./039-razza-menu-con-ricerca-stesso-codice-in.js";
import { apriSchedaCavalloPro, renderCorpoCavalloPro } from "./038-avviso-sembra-lo-stesso-cavallo.js";
import { cavalliMieiLista } from "./086-indice-dei-cavalli-dei-clienti-professio.js";
import { intervalloStruttura } from "./102-scadenze-della-struttura.js";
/* ---------- SCHEDA DEL CAVALLO: INTERVALLO, PREZZO, ANAGRAFICA (24/10/2026, richieste di Francesco Bizzarri e Alessandro Pica) ----------
   - intervallo di ferratura del singolo cavallo (cavalli_clienti_mascalcia.intervallo_giorni): vale prima di quello della struttura;
   - prezzo abituale del cavallo (prezzo_ferratura): importo proposto quando si segna fatto; solo del maniscalco;
   - «Modifica» dell'anagrafica apre i dati del cavallo (non la scheda del cliente). */
const INT_MIN = 7, INT_MAX = 180;
const TIPO_DI_LAVORO = { completa: "ferratura", mezza: "mezza_ferratura", pareggio: "pareggio" };

function intervalloCavallo(cv){
  const g = cv ? Number(cv.intervallo_giorni) : NaN;
  return g >= INT_MIN && g <= INT_MAX ? g : null;
}
// quello che Equo userebbe per la prossima scadenza: cavallo > struttura > ultima volta > predefinito
function intervalloEffettivo(cv, clienteId, storico){
  const gc = intervalloCavallo(cv);
  if(gc) return { giorni: gc, da: "cavallo" };
  const gs = intervalloStruttura(clienteId);
  if(gs) return { giorni: gs, da: "struttura" };
  const tipo = TIPO_DI_LAVORO[cv?.ferratura_tipo] || "ferratura";
  const ult = (storico || []).filter(i => i.stato === "fatto" && i.tipo_ferratura === tipo && i.prossima_scadenza)
    .sort((a, b) => b.data_intervento.localeCompare(a.data_intervento))[0];
  const gu = ult ? giorniTra(ult.data_intervento, ult.prossima_scadenza) : null;
  if(gu >= 1 && gu <= 60) return { giorni: gu, da: "ultima" };
  return { giorni: intervalloPredefinito(tipo), da: "predefinito" };
}
const TESTO_DA = { struttura: "della struttura", ultima: "come l'ultima volta", predefinito: "il tuo predefinito" };
// riquadro nella sezione Ferratura della scheda del cavallo
function riquadroIntervalloPrezzo(cv, clienteId, storico){
  const e = intervalloEffettivo(cv, clienteId, storico);
  const mio = e.da === "cavallo";
  const prezzo = cv.prezzo_ferratura != null && cv.prezzo_ferratura !== "" ? Number(cv.prezzo_ferratura) : null;
  return `<div class="cav-int">
      <span class="cav-int-ic" aria-hidden="true">📅</span>
      <span class="cav-int-t">Intervallo di ferratura: <b id="cav-int-val">${e.giorni} giorni</b>${mio ? "" : ` <small>(${TESTO_DA[e.da]})</small>`}</span>
      <span class="cav-int-step"><button type="button" onclick="cavIntervalloCambia(-1)" aria-label="Meno giorni">−</button><button type="button" onclick="cavIntervalloCambia(1)" aria-label="Più giorni">+</button></span>
    </div>
    <div class="cav-prezzo" id="cav-prezzo">${prezzoRigaHtml(prezzo)}</div>`;
}
// prezzo abituale: sempre visibile (anche con gli incassi nascosti: serve sul lavoro), si cambia toccandolo
function prezzoRigaHtml(prezzo){
  return `<button type="button" class="cav-prezzo-riga" onclick="cavPrezzoModifica()">Prezzo abituale: ${prezzo != null ? `<b>${escapeHtml(formatEuro(prezzo))}</b>` : '<i>non impostato</i>'} <span>✎</span></button>`;
}
function cavPrezzoModifica(){
  const cv = schedaCavalli.find(c => c.key === schedaCavalloKey);
  const box = document.getElementById("cav-prezzo");
  if(!cv || !box) return;
  const v = cv.prezzo_ferratura != null && cv.prezzo_ferratura !== "" ? Number(cv.prezzo_ferratura) : "";
  box.innerHTML = `<div class="cav-prezzo-edit"><label class="prezzi-campo"><span>€</span><input type="number" min="0" max="10000" step="0.5" inputmode="decimal" id="cav-prezzo-val" value="${v}" placeholder="es. 12"
      onkeydown="if(event.key==='Enter')cavPrezzoSalva();if(event.key==='Escape')renderCorpoCavalloPro()"></label>
    <button type="button" class="btn btn-primary btn-sm" onclick="cavPrezzoSalva()">Salva</button><button type="button" class="btn btn-outline btn-sm" onclick="renderCorpoCavalloPro()">Annulla</button></div>`;
  document.getElementById("cav-prezzo-val").focus();
}
async function cavPrezzoSalva(){
  const cv = schedaCavalli.find(c => c.key === schedaCavalloKey);
  const inp = document.getElementById("cav-prezzo-val");
  if(!cv || !inp) return;
  const raw = inp.value.trim();
  if(raw !== "" && !(Number(raw) >= 0 && Number(raw) <= 10000)){ showToast("Controlla il prezzo"); inp.focus(); return; }
  const v = raw === "" ? null : Math.round(Number(raw) * 100) / 100;
  const prima = cv.prezzo_ferratura == null || cv.prezzo_ferratura === "" ? null : Number(cv.prezzo_ferratura);
  if(prima === v){ renderCorpoCavalloPro(); return; }
  await salvaCampiCavallo(cv, { prezzo_ferratura: v }, v == null ? `${cv.nome}: prezzo abituale tolto` : `${cv.nome}: prezzo abituale ${formatEuro(v)}`);
}
let cavIntTimer = null;
function cavIntervalloCambia(d){
  const cv = schedaCavalli.find(c => c.key === schedaCavalloKey);
  if(!cv) return;
  const base = intervalloCavallo(cv) || intervalloEffettivo(cv, currentClienteId, schedaStoricoCavallo).giorni;
  const nuovo = Math.max(INT_MIN, Math.min(INT_MAX, base + d));
  cv.intervallo_giorni = nuovo;
  const v = document.getElementById("cav-int-val"); if(v) v.textContent = nuovo + " giorni";
  const nota = v?.parentNode?.querySelector("small"); if(nota) nota.remove();
  clearTimeout(cavIntTimer);
  cavIntTimer = setTimeout(() => salvaCampiCavallo(cv, { intervallo_giorni: nuovo }, `${cv.nome}: ferratura ogni ${nuovo} giorni`), 700);
}
async function salvaCampiCavallo(cv, campi, messaggio){
  let id = cv.id;
  if(!id){ ({ cavallo_cliente_id: id } = await DB.risolviCavalloPerIntervento(currentClienteId, cv)); }
  if(!id){ showToast("Non riuscito, riprova."); return false; }
  const { error } = await DB.updateCavalloCliente(id, campi);
  if(error){ showToast(/intervallo_giorni|prezzo_ferratura/.test(error.message || "") ? "Manca un aggiornamento del database: avvisa l'assistenza Equo." : "Errore: " + error.message); return false; }
  Object.assign(cv, campi, { id });
  [schedaCavalli, cavalliMieiLista].forEach(l => (l || []).forEach(x => { if(x !== cv && x.id === id) Object.assign(x, campi); }));
  if(messaggio) showToast(messaggio);
  if(document.getElementById("cavallo-pro-view")?.style.display === "block") renderCorpoCavalloPro();
  return true;
}
// prezzo abituale per un cavallo e un tipo di lavoro (solo se il lavoro è il suo solito)
function prezzoCavallo(cv, tipo){
  if(!cv || cv.prezzo_ferratura == null || cv.prezzo_ferratura === "") return null;
  if(tipo && TIPO_DI_LAVORO[cv.ferratura_tipo || "completa"] !== tipo) return null;
  const v = Number(cv.prezzo_ferratura);
  return v >= 0 ? v : null;
}

// «Modifica» dell'anagrafica: nome, microchip, razza, anno di nascita, mantello (cavalli inseriti dal maniscalco)
// + altezza, peso stimato, sesso, disciplina, segni particolari (per tutti, anche i cavalli collegati al proprietario)
const SESSO_TESTO = { femmina: "Femmina", castrone: "Castrone", stallone: "Stallone" };
let acavSessoScelto = null;
function acavSesso(v){
  acavSessoScelto = acavSessoScelto === v ? null : v;
  document.querySelectorAll("#acav-sesso button").forEach(b => b.classList.toggle("on", b.dataset.v === acavSessoScelto));
}
function apriAnagraficaCavallo(){
  const cv = schedaCavalli.find(c => c.key === schedaCavalloKey);
  if(!cv) return;
  const manuale = cv.tipo === "manuale" && !cv.horse_id && !cv.scuderia_cavallo_id;   // cavallo del proprietario o della scuderia: anagrafica loro
  document.getElementById("acav-tit").textContent = "Anagrafica · " + (cv.nome || "Cavallo");
  document.getElementById("acav-base").hidden = !manuale;
  document.getElementById("acav-equo-nota").hidden = manuale;
  if(manuale){
    document.getElementById("acav-nome").value = cv.nome || "";
    document.getElementById("acav-chip").value = cv.microchip || "";
    razzaImposta("acav-razza", cv.razza || "");
    document.getElementById("acav-anno").value = cv.anno_nascita || "";
    document.getElementById("acav-mantello").value = cv.mantello || "";
  }
  document.getElementById("acav-altezza").value = cv.altezza_cm || "";
  document.getElementById("acav-peso").value = cv.peso_kg || "";
  document.getElementById("acav-disciplina").value = cv.disciplina || "";
  document.getElementById("acav-segni").value = cv.segni_particolari || "";
  acavSessoScelto = null; acavSesso(cv.sesso || null);
  document.getElementById("acav-errore").style.display = "none";
  openModal("modal-anagrafica-cavallo");
}
async function salvaAnagraficaCavallo(btn){
  const cv = schedaCavalli.find(c => c.key === schedaCavalloKey);
  if(!cv) return;
  const manuale = cv.tipo === "manuale" && !cv.horse_id && !cv.scuderia_cavallo_id;
  const err = document.getElementById("acav-errore");
  const errore = t => { err.textContent = t; err.style.display = "block"; };
  const num = (id, min, max, nome) => {
    const v = document.getElementById(id).value.trim();
    if(v === "") return null;
    const n = Math.round(Number(v));
    if(!(n >= min && n <= max)) throw new Error(nome);
    return n;
  };
  const testo = id => document.getElementById(id).value.trim() || null;
  const campi = {};
  try{
    if(manuale){
      const nome = document.getElementById("acav-nome").value.trim();
      if(!nome) return errore("Scrivi il nome del cavallo.");
      const razza = razzaValore("acav-razza");
      if(razza === false) return;
      Object.assign(campi, { nome, microchip: testo("acav-chip"), razza: razza || null,
        anno_nascita: num("acav-anno", 1970, new Date().getFullYear(), "Controlla l'anno di nascita (es. 2017)."), mantello: testo("acav-mantello") });
    }
    Object.assign(campi, { altezza_cm: num("acav-altezza", 50, 220, "Controlla l'altezza: in centimetri al garrese (es. 165)."),
      peso_kg: num("acav-peso", 30, 1500, "Controlla il peso: in kg (es. 520)."),
      sesso: acavSessoScelto, disciplina: testo("acav-disciplina"), segni_particolari: testo("acav-segni") });
  }catch(e){ return errore(e.message); }
  err.style.display = "none";
  Object.keys(campi).forEach(k => { if(String(cv[k] ?? "") === String(campi[k] ?? "")) delete campi[k]; });
  if(!Object.keys(campi).length){ closeModal("modal-anagrafica-cavallo"); return; }
  btn.disabled = true;
  try{
    const ok = await salvaCampiCavallo(cv, campi, "Anagrafica di " + (campi.nome || cv.nome) + " salvata");
    if(!ok) return;
    closeModal("modal-anagrafica-cavallo");
    await apriSchedaCavalloPro(cv.key, true);
  } finally { btn.disabled = false; }
}
// righe dell'anagrafica per la scheda (solo i campi compilati)
function anagraficaRighe(cv){
  const anno = cv.anno_nascita || (cv.nascita ? Number(String(cv.nascita).slice(0, 4)) : null);
  const r = [];
  if(anno) r.push(["Anno di nascita", anno + " (" + Math.max(0, new Date().getFullYear() - anno) + " anni)"]);
  if(cv.sesso) r.push(["Sesso", SESSO_TESTO[cv.sesso] || cv.sesso]);
  if(cv.mantello) r.push(["Mantello", cv.mantello]);
  if(cv.altezza_cm) r.push(["Altezza", cv.altezza_cm + " cm"]);
  if(cv.peso_kg) r.push(["Peso stimato", "≈ " + cv.peso_kg + " kg"]);
  if(cv.disciplina) r.push(["Attività", cv.disciplina]);
  if(cv.segni_particolari) r.push(["Segni particolari", cv.segni_particolari]);
  return r;
}
// per Hammer (quello che il maniscalco sta guardando)
function testoAnagraficaCavallo(cv){
  return anagraficaRighe(cv || {}).map(([k, v]) => k.toLowerCase() + " " + v).join(", ");
}

export { cavPrezzoModifica, cavPrezzoSalva, acavSesso, anagraficaRighe, apriAnagraficaCavallo, testoAnagraficaCavallo, cavIntervalloCambia, intervalloCavallo, intervalloEffettivo, prezzoCavallo, riquadroIntervalloPrezzo, salvaAnagraficaCavallo, salvaCampiCavallo };
