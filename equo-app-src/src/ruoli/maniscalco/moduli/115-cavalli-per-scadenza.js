// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { isoLocale } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
/* ---------- SCELTA DEI CAVALLI PER SCADENZA (27/10/2026, proposta B «linea del tempo») ----------
   Nuovo appuntamento (e proposta a una scuderia su Equo) con 4 o più cavalli: la lista a spunte diventa una linea del tempo.
   In alto i contatori (scaduti · entro 10 giorni · con tempo) e i tasti rapidi; poi i gruppi di cavalli con scadenze
   entro 7 giorni l'una dall'altra, in ordine di data, con i segnaposto «Oggi» e «Appuntamento», e «Prendi tutti» per gruppo.
   Semaforo: rosso scaduto, arancione entro 10 giorni, verde più in là, grigio senza scadenza o già in agenda.
   Nessuna spunta automatica. Le caselle restano <input type="checkbox"> con la classe della finestra
   (int-cav-chk / prop-str-cav), così il resto del codice che legge le scelte non cambia.
   Scadenza = richiamo aperto del cavallo (funzione richiami_maniscalco: prossima scadenza o data rimandata). */
const CSC_SOGLIA = 10, CSC_FINESTRA = 7, CSC_MINIMO = 4;
let cscCache = { t: 0, richiami: [], agenda: [] };
const cscOggi = () => isoLocale(new Date());
const cscGiorni = (da, a) => Math.round((new Date(a + "T12:00") - new Date(da + "T12:00")) / 86400000);
const cscData = iso => { const d = new Date(iso + "T12:00"); return d.getDate() + " " + d.toLocaleDateString("it-IT", { month: "short" }).replace(".", ""); };

async function cscCarica(){
  if(Date.now() - cscCache.t < 60000) return cscCache;
  const oggi = cscOggi();
  let richiami = [], agenda = [];
  try{ richiami = await DB.listRichiami(400); }catch(e){ richiami = []; }
  if(DEMO_MODE){
    agenda = (demoState.interventiMascalcia || []).filter(i => ["programmato", "proposto", "richiesto"].includes(i.stato) && i.data_intervento >= oggi);
  } else {
    const { data } = await sb.from("interventi_mascalcia").select("cavallo_cliente_id, horse_id, data_intervento, stato")
      .eq("maniscalco_id", currentUser.id).in("stato", ["programmato", "proposto", "richiesto"]).gte("data_intervento", oggi)
      .order("data_intervento", { ascending: true }).limit(1000);
    agenda = data || [];
  }
  cscCache = { t: Date.now(), richiami, agenda };
  return cscCache;
}
function cscStessoCavallo(c, r){
  return (r.cavallo_cliente_id && (r.cavallo_cliente_id === c.id || r.cavallo_cliente_id === c.cavalloClienteId)) || (r.horse_id && (r.horse_id === c.horse_id || (c.tipo === "equo" && r.horse_id === c.id)));
}
const cscSem = g => g == null ? "g" : g < 0 ? "r" : g <= CSC_SOGLIA ? "a" : "v";
function cscQuando(g, data){ return g < 0 ? (-g) + (g === -1 ? " giorno fa" : " gg fa") : g === 0 ? "oggi" : g <= CSC_SOGLIA ? "tra " + g + " gg" : cscData(data); }

// cavalli: [{ key, id, horse_id?, tipo?, nome, sotto? }] · opz: { chk, preset (Set di key), dataId, cambio (nome della funzione globale) }
async function cscRender(box, cavalli, opz){
  if(!box || !cavalli || cavalli.length < CSC_MINIMO) return false;
  const { richiami, agenda } = await cscCarica();
  if(!box.isConnected) return false;
  const oggi = cscOggi();
  const righe = cavalli.map(c => {
    const ag = agenda.filter(a => cscStessoCavallo(c, a)).sort((a, b) => a.data_intervento.localeCompare(b.data_intervento))[0];
    const r = richiami.find(x => cscStessoCavallo(c, x));
    const scad = r ? (r.scadenza || r.prossima_scadenza) : null;
    return { ...c, agenda: ag ? ag.data_intervento : null, scad, g: scad ? cscGiorni(oggi, scad) : null };
  });
  const conData = righe.filter(c => !c.agenda && c.g != null).sort((a, b) => a.g - b.g || a.nome.localeCompare(b.nome, "it"));
  const fuori = righe.filter(c => c.agenda || c.g == null);
  const gruppi = [];
  conData.forEach(c => { const u = gruppi[gruppi.length - 1]; if(u && c.g - u[0].g <= CSC_FINESTRA) u.push(c); else gruppi.push([c]); });
  const dataApp = document.getElementById(opz.dataId)?.value || "";
  const gApp = dataApp && cscGiorni(oggi, dataApp) > 0 ? cscGiorni(oggi, dataApp) : null;   // oggi o nel passato: niente segnaposto
  const nR = conData.filter(c => c.g < 0).length, nA = conData.filter(c => c.g >= 0 && c.g <= CSC_SOGLIA).length, nV = conData.length - nR - nA;
  const chk = c => `<label class="csc-chip${c.agenda ? " spento" : ""}" data-g="${!c.agenda && c.g != null ? c.g : "x"}" title="${escapeHtml(c.nome)}${c.sotto ? " · " + escapeHtml(c.sotto) : ""}"><input type="checkbox" class="${opz.chk}" value="${escapeHtml(c.key)}"${opz.preset?.has(c.key) ? " checked" : ""} onchange="cscCambio(this)"><i class="csc-p ${c.agenda ? "g" : cscSem(c.g)}"></i>${escapeHtml(c.nome)}<small>${c.agenda ? "in agenda " + cscData(c.agenda) : c.g == null ? "senza scadenza" : cscQuando(c.g, c.scad)}${c.sotto ? " · " + escapeHtml(c.sotto) : ""}</small></label>`;
  const segno = (testo, cls) => `<div class="csc-segno ${cls}"><i></i><span></span><b>${testo}</b></div>`;
  let h = `<div class="csc-cont"><span><b class="r">${nR}</b>scaduti</span><span><b class="a">${nA}</b>entro ${CSC_SOGLIA} giorni</span><span><b class="v">${nV}</b>con tempo</span></div>
    <div class="csc-rapidi">
      ${nR ? `<button type="button" onclick="cscRapido(this,-1)">Scaduti · ${nR}</button>` : ""}
      ${nA ? `<button type="button" onclick="cscRapido(this,${CSC_SOGLIA})">Scaduti + entro ${CSC_SOGLIA} giorni · ${nR + nA}</button>` : ""}
      ${gApp != null && gApp >= 0 ? `<button type="button" onclick="cscRapido(this,${gApp + 3})">Entro il ${cscData(dataApp)} · ${conData.filter(c => c.g <= gApp + 3).length}</button>` : ""}
    </div><div class="csc-linea">`;
  let oggiMesso = false, appMesso = gApp == null;
  gruppi.forEach(l => {
    if(!oggiMesso && l[0].g >= 0){ h += segno("Oggi · " + cscData(oggi), "oggi"); oggiMesso = true; }
    if(!appMesso && l[0].g > gApp){ h += segno("Appuntamento · " + cscData(dataApp), "app"); appMesso = true; }
    const r = l.filter(c => c.g < 0).length, a = l.filter(c => c.g >= 0 && c.g <= CSC_SOGLIA).length, v = l.length - r - a;
    const da = cscData(l[0].scad), a2 = cscData(l[l.length - 1].scad);
    h += `<div class="csc-gr"><div class="csc-rail"><i class="csc-p ${cscSem(l[0].g)}"></i></div><div class="csc-card">
      <div class="csc-t"><span><b>${da === a2 ? da : da + " – " + a2}</b><small class="${cscSem(l[0].g)}">${[r ? r + (r === 1 ? " scaduto" : " scaduti") : "", a ? a + " in scadenza" : "", v ? v + " con tempo" : ""].filter(Boolean).join(" · ")}</small></span>
        <button type="button" class="csc-tutti" onclick="cscGruppo(this)">Prendi tutti ${l.length}</button></div>
      <div class="csc-chips">${l.map(chk).join("")}</div></div></div>`;
  });
  if(!oggiMesso) h += segno("Oggi · " + cscData(oggi), "oggi");
  if(!appMesso) h += segno("Appuntamento · " + cscData(dataApp), "app");
  h += `</div>`;
  if(fuori.length) h += `<div class="csc-fuori"><b>Fuori dalla linea</b><span>già in agenda o senza scadenza</span><div class="csc-chips">${fuori.sort((a, b) => (a.agenda ? 1 : 0) - (b.agenda ? 1 : 0) || a.nome.localeCompare(b.nome, "it")).map(chk).join("")}</div></div>`;
  box.classList.add("csc-on");
  box._csc = { cavalli, opz };
  box.dataset.cscCambio = opz.cambio || "";
  box.dataset.cscChk = opz.chk;
  box.innerHTML = h + (opz.coda || "");
  cscAggiorna(box);
  return true;
}
function cscBox(el){ return el.closest(".csc-on"); }
function cscAggiorna(box){
  box.querySelectorAll(".csc-gr").forEach(g => {
    const cb = [...g.querySelectorAll("input[type=checkbox]")], tutti = cb.length && cb.every(x => x.checked);
    const b = g.querySelector(".csc-tutti"); if(b){ b.textContent = tutti ? "Togli" : "Prendi tutti " + cb.length; b.classList.toggle("on", tutti); }
  });
}
function cscAvvisa(box){ cscAggiorna(box); const fn = box.dataset.cscCambio; if(fn && typeof window[fn] === "function") window[fn](); }
function cscCambio(el){ const box = cscBox(el); if(box) cscAvvisa(box); }
function cscGruppo(btn){
  const box = cscBox(btn), cb = [...btn.closest(".csc-gr").querySelectorAll("input[type=checkbox]")];
  const tutti = cb.every(x => x.checked);
  cb.forEach(x => { x.checked = !tutti; });
  cscAvvisa(box);
}
// tasti rapidi: spunta i cavalli con scadenza fino a «lim» giorni da oggi (se lo sono già tutti, li toglie)
function cscRapido(btn, lim){
  const box = cscBox(btn);
  const cb = [...box.querySelectorAll(".csc-gr input[type=checkbox]")].filter(x => { const g = Number(x.closest(".csc-chip").dataset.g); return Number.isFinite(g) && g <= lim; });
  const tutti = cb.length && cb.every(x => x.checked);
  cb.forEach(x => { x.checked = !tutti; });
  cscAvvisa(box);
}

// cambiata la data dell'appuntamento: si ridisegna la linea tenendo le spunte
function cscRidisegna(box){
  if(!box?._csc) return;
  const sel = new Set([...box.querySelectorAll("input[type=checkbox]:checked")].map(x => x.value));
  cscRender(box, box._csc.cavalli, { ...box._csc.opz, preset: sel }).then(ok => { if(ok){ const fn = box.dataset.cscCambio; if(fn && typeof window[fn] === "function") window[fn](); } });
}
document.addEventListener("change", e => {
  const id = e.target?.id;
  if(id === "intervento-data") cscRidisegna(document.getElementById("intervento-cavalli-multi"));
  else if(id === "prop-str-data") cscRidisegna(document.getElementById("prop-str-cavalli"));
});

export { cscCambio, cscGruppo, cscRapido, cscRender };
