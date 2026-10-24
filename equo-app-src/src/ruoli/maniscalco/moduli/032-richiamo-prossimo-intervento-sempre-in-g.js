// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { caricaCartellaCavalli, renderClientiList } from "./033-clienti-a-cartelle-stile-telegram-cavall.js";
import { renderProDeadlines } from "./040-home-pro-prossimi-appuntamenti-da-richia.js";
import { aggiungiGiorniIso } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { agNomeCavallo } from "./053-agenda-settimanale-maniscalco.js";
import { formatDataBreve } from "./054-richieste-di-appuntamento-step-5d.js";
import { caricaCavalliMiei } from "./086-indice-dei-cavalli-dei-clienti-professio.js";
import { intervalloStruttura } from "./102-scadenze-della-struttura.js";
import { intervalloCavallo, prezzoCavallo } from "./103-intervallo-prezzo-anagrafica-cavallo.js";
import { vistaCompleta } from "./097-versione-semplice-completa-dell-app-mani.js";
/* ---------- RICHIAMO (prossimo intervento) — sempre in GIORNI ----------
   Quando il maniscalco segna FATTO una ferratura/mezza ferratura/pareggio si apre il pop-up
   "Inserisco il prossimo intervento tra N giorni" → OK oppure CAMBIA (ruota 1-60 giorni).
   N = ultima scelta per quel cavallo → altrimenti i suoi "Richiami predefiniti" (profilo) → altrimenti 35/35/56.
   Se il cavallo è "su Equo" l'intervento entra da solo nel libretto del proprietario (trigger nel database). */
let richiamiPredefiniti = null, richiamoStato = null;
async function caricaRichiamiPredefiniti(){
  const box = document.getElementById("menu-richiami");
  const pro = currentUser && (currentUser.ruolo === "maniscalco" || currentUser.ruoloSecondario === "maniscalco");
  if(box) box.style.display = pro && vistaAi() === "professionista" ? "block" : "none";
  if(!richiamiPredefiniti){
    richiamiPredefiniti = { ...TIPO_FERRATURA_INTERVALLI };
    if(!DEMO_MODE && currentUser){
      const { data } = await sb.from("profiles").select("intervalli_richiamo").eq("id", currentUser.id).maybeSingle();
      if(data?.intervalli_richiamo) richiamiPredefiniti = { ...richiamiPredefiniti, ...data.intervalli_richiamo };
    }
  }
  Object.keys(TIPO_FERRATURA_INTERVALLI).forEach(k => { const el = document.getElementById("ric-def-" + k); if(el) el.value = richiamiPredefiniti[k]; });
}
async function salvaRichiamiPredefiniti(){
  const v = {};
  for(const k of Object.keys(TIPO_FERRATURA_INTERVALLI)){
    const n = Math.round(Number(document.getElementById("ric-def-" + k).value));
    if(!(n >= 1 && n <= 60)){ showToast("Scegli un numero di giorni tra 1 e 60."); return caricaRichiamiPredefiniti(); }
    v[k] = n;
  }
  richiamiPredefiniti = v;
  if(!DEMO_MODE && currentUser){
    const { error } = await sb.from("profiles").update({ intervalli_richiamo: v }).eq("id", currentUser.id);
    if(error){ showToast("Non sono riuscito a salvare, riprova."); return; }
  }
  showToast("Richiami predefiniti salvati");
}
function giorniTra(a, b){ const [y1,m1,d1] = a.split("-").map(Number), [y2,m2,d2] = b.split("-").map(Number); return Math.round((new Date(y2,m2-1,d2) - new Date(y1,m1-1,d1)) / 86400000); }
// giorni proposti per un nuovo richiamo: ultima scelta per quel cavallo e tipo → predefiniti del maniscalco
async function giorniRichiamoSuggeriti(tipo, cavallo_cliente_id, horse_id, escludiId, clienteId){
  if(!TIPO_FERRATURA_INTERVALLI[tipo]) return { giorni: null };
  if(!richiamiPredefiniti) await caricaRichiamiPredefiniti();
  const base = Number(richiamiPredefiniti?.[tipo]) || TIPO_FERRATURA_INTERVALLI[tipo];
  if(!cavallo_cliente_id && !horse_id) return { giorni: base };
  let prec = null;
  if(DEMO_MODE){
    prec = (demoState.interventiMascalcia || []).filter(i => i.id !== escludiId && i.stato === "fatto" && i.tipo_ferratura === tipo && i.prossima_scadenza
      && ((cavallo_cliente_id && i.cavallo_cliente_id === cavallo_cliente_id) || (horse_id && i.horse_id === horse_id)))
      .sort((a, b) => b.data_intervento.localeCompare(a.data_intervento))[0] || null;
  } else {
    let q = sb.from("interventi_mascalcia").select("id, data_intervento, prossima_scadenza, importo").eq("maniscalco_id", currentUser.id)
      .eq("stato", "fatto").eq("tipo_ferratura", tipo).not("prossima_scadenza", "is", null);
    q = cavallo_cliente_id ? q.eq("cavallo_cliente_id", cavallo_cliente_id) : q.eq("horse_id", horse_id);
    if(escludiId) q = q.neq("id", escludiId);
    const { data } = await q.order("data_intervento", { ascending: false }).limit(1);
    prec = (data || [])[0] || null;
  }
  const g = prec ? giorniTra(prec.data_intervento, prec.prossima_scadenza) : null;
  const prima = prec ? prec.prossima_scadenza : null;   // con 0 € la prossima data resta questa («come prima»)
  // intervallo fissato sul singolo cavallo (scheda del cavallo): vale prima di tutto
  const gc = intervalloCavallo(await cavalloPerIntervallo(cavallo_cliente_id, horse_id));
  if(gc) return { giorni: gc, daCavalloFisso: true, prima };
  // struttura con «Ferratura ogni N giorni»: vale per tutti i suoi cavalli (scadenze allineate)
  const gs = clienteId ? intervalloStruttura(clienteId) : null;
  if(gs) return { giorni: gs, daStruttura: true, prima };
  return g >= 1 && g <= 60 ? { giorni: g, daCavallo: true, prima } : { giorni: base, prima };
}
// intervallo e prezzo del cavallo letti dal database (sempre aggiornati, anche se cambiati da un altro telefono)
async function cavalloPerIntervallo(cavallo_cliente_id, horse_id){
  if(!cavallo_cliente_id && !horse_id) return null;
  if(DEMO_MODE) return (demoState.cavalliClientiMascalcia || []).find(c => (cavallo_cliente_id && c.id === cavallo_cliente_id) || (horse_id && c.horse_id === horse_id)) || null;
  try{
    let q = sb.from("cavalli_clienti_mascalcia").select("id, horse_id, intervallo_giorni, prezzo_ferratura, ferratura_tipo").eq("maniscalco_id", currentUser.id);
    q = cavallo_cliente_id ? q.eq("id", cavallo_cliente_id) : q.eq("horse_id", horse_id);
    const { data, error } = await q.limit(1);
    return error ? null : ((data || [])[0] || null);
  }catch(e){ return null; }
}
function intervalloPredefinito(tipo){ return Number(richiamiPredefiniti?.[tipo]) || TIPO_FERRATURA_INTERVALLI[tipo] || 35; }
function dataRichiamoTesto(iso, giorni){
  const [y, m, d] = aggiungiGiorniIso(iso, giorni).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
// apre il pop-up e restituisce i giorni scelti (Promise). giorni = null → solo importo e pagamento (es. «Altro»)
function chiediRichiamo({ tipo, tipo_altro, data_intervento, cavallo, giorni, daCavallo, daCavalloFisso, daStruttura, pagamento, importo, importi, prima, ferri }){
  return new Promise(resolve => {
    richiamoStato = { resolve, giorni, data_intervento, etichetta: [TIPO_INTERVENTO_LABEL_APP[tipo] || tipo_altro || "Intervento", cavallo].filter(Boolean).join(" · "), daCavallo, daCavalloFisso, daStruttura, pagamento,
      prima: prima && giorni != null ? prima : null, comePrima: false, ferri: ferri && vistaCompleta() ? { ...ferri, n: ferri.q || 4 } : null };
    const conRichiamo = giorni != null;
    document.getElementById("ric-tit").textContent = conRichiamo ? "Prossimo intervento" : "Intervento fatto";
    document.getElementById("ric-grande").style.display = conRichiamo ? "" : "none";
    document.getElementById("ric-btn-cambia").style.display = conRichiamo ? "" : "none";
    // importo di ogni cavallo + Saldato / Da saldare (solo se gli incassi sono visibili)
    const conPag = pagamento !== undefined && !incassiNascosti();
    document.getElementById("ric-pag").style.display = conPag ? "block" : "none";
    const righe = importi && importi.length ? importi : [{ nome: cavallo || "Importo", importo }];
    richiamoStato.nImporti = righe.length;
    const fmt = v => v != null && v !== "" && !isNaN(Number(v)) ? String(Number(v)) : "";
    // un cavallo: € e importo sulla stessa riga di Saldato / Da saldare; più cavalli: un importo per cavallo e il totale
    document.getElementById("ric-pag").classList.toggle("in-riga", righe.length === 1);
    if(conPag) document.getElementById("ric-pag").style.display = righe.length === 1 ? "flex" : "block";
    document.getElementById("ric-importi").innerHTML = righe.length === 1
      ? `<label class="ric-euro"><span>€</span><input type="number" step="0.01" min="0" inputmode="decimal" class="ric-imp" data-i="0" value="${fmt(righe[0].importo)}" placeholder="0" oninput="richiamoTotale()" aria-label="Importo"></label>`
      : righe.map((r, i) =>
      `<div class="ric-imp-riga"><span>${escapeHtml(r.nome || "Cavallo " + (i + 1))}</span><label class="ric-euro"><span>€</span><input type="number" step="0.01" min="0" inputmode="decimal" class="ric-imp" data-i="${i}" value="${fmt(r.importo)}" placeholder="0" oninput="richiamoTotale()"></label></div>`).join("")
      + '<div class="ric-imp-tot"><span>Totale</span><span id="ric-imp-tot"></span></div>';
    // ferri nuovi (solo Completa): la spunta fa comparire il numero, già a 4 o 2
    const rf = richiamoStato.ferri;
    document.getElementById("ric-ferri").style.display = rf ? "block" : "none";
    if(rf){
      document.getElementById("ric-ferri-chk").checked = rf.nuovi === true;
      document.getElementById("ric-ferri-su").textContent = `ferri nuovi (su ${rf.q}${rf.nome ? " di " + rf.nome : " per cavallo"})`;
      richiamoFerriRender();
    }
    richiamoTotale();
    document.getElementById("ric-pag-imp").textContent = "Pagamento";
    if(conPag) richiamoPagamento(pagamento === "saldato" ? "saldato" : "da_saldare");
    document.getElementById("ric-passo1").style.display = "block";
    document.getElementById("ric-passo2").style.display = "none";
    document.getElementById("ric-passo3").style.display = "none";
    if(conRichiamo) richiamoAggiornaTesti();
    else document.getElementById("ric-dettaglio").textContent = `${richiamoStato.etichetta} · ${formatDataBreve(data_intervento)}`;
    document.getElementById("eq-pop-richiamo").classList.add("attivo");
  });
}
function richiamoFerriRender(){
  const r = richiamoStato; if(!r || !r.ferri) return;
  const on = document.getElementById("ric-ferri-chk").checked;
  document.getElementById("ric-ferri-num").style.display = on ? "block" : "none";
  document.getElementById("ric-ferri-val").textContent = r.ferri.n;
}
function richiamoFerriN(d){ const r = richiamoStato; if(!r || !r.ferri) return; r.ferri.n = Math.max(1, Math.min(4, r.ferri.n + d)); richiamoFerriRender(); }
// scelta dei ferri nuovi (Completa), letta una volta sola: { nuovi: true/false, n }
let richiamoFerriScelti = null;
function prendiFerriScelti(){ const v = richiamoFerriScelti; richiamoFerriScelti = null; return v; }
function richiamoTotale(){
  // 0 € con un solo importo = lavoro fuori ciclo: la prossima data resta quella di prima
  const r = richiamoStato;
  if(r && r.prima){
    const inp = [...document.querySelectorAll("#ric-importi .ric-imp")];
    const zero = inp.length === 1 && inp[0].value !== "" && Number(inp[0].value) === 0;
    if(zero !== r.comePrima){ r.comePrima = zero; richiamoAggiornaTesti(); }
  }
  const el = document.getElementById("ric-imp-tot"); if(!el) return;
  const tot = [...document.querySelectorAll("#ric-importi .ric-imp")].reduce((t, x) => t + (Number(x.value) || 0), 0);
  el.textContent = formatEuro(tot);
}
// importi scelti nel pop-up (uno per cavallo; null = vuoto), letti una volta sola
let richiamoImportiScelti = null;
function prendiImportiScelti(){ const v = richiamoImportiScelti; richiamoImportiScelti = null; return v; }
// prezzo proposto: l'ultimo di quel cavallo per lo stesso tipo, altrimenti l'ultimo del cliente per lo stesso tipo
async function importiSuggeriti(e, cavalli){
  let storico = [];
  try{
    if(DEMO_MODE){
      storico = (demoState.interventiMascalcia || []).filter(i => i.cliente_mascalcia_id === e.cliente_mascalcia_id && i.tipo_ferratura === e.tipo_ferratura && i.importo != null && i.id !== e.id)
        .sort((a, b) => b.data_intervento.localeCompare(a.data_intervento));
    } else if(e.cliente_mascalcia_id || cavalli.some(c => c.cavallo_cliente_id)){
      let q = sb.from("interventi_mascalcia").select("id, cliente_mascalcia_id, cavallo_cliente_id, horse_id, importo, data_intervento")
        .eq("maniscalco_id", currentUser.id).eq("tipo_ferratura", e.tipo_ferratura).not("importo", "is", null);
      const ids = cavalli.map(c => c.cavallo_cliente_id).filter(Boolean);
      q = e.cliente_mascalcia_id && ids.length ? q.or(`cliente_mascalcia_id.eq.${e.cliente_mascalcia_id},cavallo_cliente_id.in.(${ids.join(",")})`)
        : e.cliente_mascalcia_id ? q.eq("cliente_mascalcia_id", e.cliente_mascalcia_id) : q.in("cavallo_cliente_id", ids);
      if(e.id) q = q.neq("id", e.id);
      const { data } = await q.order("data_intervento", { ascending: false }).limit(60);
      storico = data || [];
    }
  }catch(x){ storico = []; }
  const delCliente = storico.find(i => i.cliente_mascalcia_id === e.cliente_mascalcia_id);
  // prezzo abituale del cavallo (scheda del cavallo): vale prima dell'ultimo prezzo usato
  const abituali = await Promise.all(cavalli.map(c => c.importo != null && c.importo !== "" ? null : cavalloPerIntervallo(c.cavallo_cliente_id, c.horse_id).then(cv => prezzoCavallo(cv, e.tipo_ferratura))));
  return cavalli.map((c, n) => {
    if(c.importo != null && c.importo !== "") return Number(c.importo);
    if(abituali[n] != null) return abituali[n];
    const delCavallo = storico.find(i => (c.cavallo_cliente_id && i.cavallo_cliente_id === c.cavallo_cliente_id) || (c.horse_id && i.horse_id === c.horse_id));
    const v = (delCavallo || delCliente || {}).importo;
    return v != null ? Number(v) : null;
  });
}
const TIPO_INTERVENTO_LABEL_APP = { ferratura: "Ferratura", mezza_ferratura: "Mezza ferratura", pareggio: "Pareggio" };
function richiamoPagamento(v){
  if(richiamoStato) richiamoStato.pagamento = v;
  document.querySelectorAll("#ric-pag .ric-pag-scelte button").forEach(b => b.classList.toggle("on", b.dataset.p === v));
}
// scelta fatta nel pop-up (letta una volta sola da chi ha chiesto il richiamo)
let richiamoPagamentoScelto = null;
function prendiPagamentoScelto(){ const v = richiamoPagamentoScelto; richiamoPagamentoScelto = null; return v; }
function richiamoAggiornaTesti(){
  const r = richiamoStato; if(!r) return;
  const cp = document.getElementById("ric-come-prima");
  const gr = document.getElementById("ric-grande").firstChild;
  if(gr && gr.nodeType === 3) gr.textContent = r.comePrima && r.prima ? "La prossima data resta" : "Inserisco il prossimo intervento tra";
  if(r.comePrima && r.prima){
    const [y, m, d] = r.prima.split("-").map(Number);
    document.getElementById("ric-giorni-txt").textContent = "Come prima";
    document.getElementById("ric-dettaglio").textContent = `${r.etichetta} · ${new Date(y, m - 1, d).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}`;
    cp.style.display = "block";
    cp.textContent = "Lavoro senza compenso: non è la ferratura del ciclo, la prossima data resta quella di prima. Per cambiarla tocca CAMBIA.";
    return;
  }
  if(cp) cp.style.display = "none";
  if(r.giorni == null) return;
  document.getElementById("ric-giorni-txt").textContent = r.giorni + (r.giorni === 1 ? " giorno" : " giorni");
  const quando = dataRichiamoTesto(r.data_intervento, r.giorni);
  document.getElementById("ric-dettaglio").textContent = `${r.etichetta} · ${quando}` + (r.daCavalloFisso ? " (intervallo del cavallo)" : r.daStruttura ? " (intervallo della struttura)" : r.daCavallo ? " (come l'ultima volta)" : "");
  document.getElementById("ric-dettaglio2").textContent = `Prossimo intervento: ${quando}`;
}
function richiamoCambia(){
  if(richiamoStato) richiamoStato.comePrima = false, richiamoStato.prima = null;
  const ruota = document.getElementById("ric-ruota");
  ruota.innerHTML = '<div class="pad"></div>' + Array.from({ length: 60 }, (_, i) => `<div class="n" data-g="${i + 1}" onclick="richiamoVaiA(${i + 1})">${i + 1}</div>`).join("") + '<div class="pad"></div>';
  document.getElementById("ric-passo1").style.display = "none";
  document.getElementById("ric-passo3").style.display = "none";
  document.getElementById("ric-passo2").style.display = "block";
  requestAnimationFrame(() => { ruota.scrollTop = (richiamoStato.giorni - 1) * 40; richiamoRuotaScroll(); });
}
function richiamoVaiA(g){ document.getElementById("ric-ruota").scrollTo({ top: (g - 1) * 40, behavior: "smooth" }); }
function richiamoRuotaScroll(){
  const ruota = document.getElementById("ric-ruota");
  const g = Math.min(60, Math.max(1, Math.round(ruota.scrollTop / 40) + 1));
  if(richiamoStato) richiamoStato.giorni = g;
  ruota.querySelectorAll(".n").forEach(el => el.classList.toggle("sel", Number(el.dataset.g) === g));
  richiamoAggiornaTesti();
}
// sotto i 10 giorni non si blocca: si avvisa e si chiede di confermare o modificare
const RICHIAMO_MIN_GIORNI = 10;
function richiamoConferma(confermatoPoco){
  const r = richiamoStato; if(!r) return;
  if(!confermatoPoco && !r.comePrima && r.giorni != null && r.giorni < RICHIAMO_MIN_GIORNI){
    document.getElementById("ric-poco-txt").textContent = r.giorni + (r.giorni === 1 ? " giorno" : " giorni");
    document.getElementById("ric-poco-dett").textContent = `${r.etichetta} · ${dataRichiamoTesto(r.data_intervento, r.giorni)}. Di solito tra un intervento e l'altro passano almeno ${RICHIAMO_MIN_GIORNI} giorni: confermi?`;
    document.getElementById("ric-passo1").style.display = "none";
    document.getElementById("ric-passo2").style.display = "none";
    document.getElementById("ric-passo3").style.display = "block";
    return;
  }
  richiamoStato = null;
  richiamoPagamentoScelto = r.pagamento !== undefined && !incassiNascosti() ? (r.pagamento || null) : null;
  richiamoImportiScelti = r.pagamento !== undefined && !incassiNascosti()
    ? [...document.querySelectorAll("#ric-importi .ric-imp")].map(x => x.value === "" || isNaN(Number(x.value)) ? null : Math.round(Number(x.value) * 100) / 100)
    : null;
  richiamoFerriScelti = r.ferri ? { nuovi: !!document.getElementById("ric-ferri-chk").checked, n: r.ferri.n } : null;
  richiamoComePrimaScelto = r.comePrima && r.prima ? r.prima : null;
  document.getElementById("eq-pop-richiamo").classList.remove("attivo");
  r.resolve(r.giorni);
}
let richiamoComePrimaScelto = null;
// flusso completo per un intervento che sta per diventare FATTO: chiede i giorni del richiamo (se il tipo li prevede),
// l'importo di ogni cavallo e il pagamento; restituisce la data del richiamo (gli importi con prendiImportiScelti)
async function richiamoPerFatto(e){
  const s = await giorniRichiamoSuggeriti(e.tipo_ferratura, e.cavallo_cliente_id, e.horse_id, e.id, e.cliente_mascalcia_id);
  richiamoPagamentoScelto = null; richiamoImportiScelti = null; richiamoFerriScelti = null; richiamoComePrimaScelto = null;
  const conFerri = e.tipo_ferratura === "ferratura" || e.tipo_ferratura === "mezza_ferratura";
  const ferri = e.ferri !== undefined ? e.ferri : conFerri
    ? { q: Number(e.quantita_ferri) || (e.tipo_ferratura === "mezza_ferratura" ? 2 : 4), nome: e.cavallo || agNomeCavalloSicuro(e) || null, nuovi: e.ferri_nuovi } : null;
  if(!s.giorni && incassiNascosti() && !(ferri && vistaCompleta())) return e.prossima_scadenza || null;
  const cavalli = e.cavalli && e.cavalli.length ? e.cavalli
    : [{ nome: e.cavallo || agNomeCavalloSicuro(e), cavallo_cliente_id: e.cavallo_cliente_id, horse_id: e.horse_id, importo: e.importo }];
  const proposti = incassiNascosti() ? cavalli.map(() => null) : await importiSuggeriti(e, cavalli);
  const giorni = await chiediRichiamo({ tipo: e.tipo_ferratura, tipo_altro: e.tipo_altro, data_intervento: e.data_intervento,
    cavallo: e.cavallo || agNomeCavalloSicuro(e), giorni: s.giorni || null, daCavallo: s.daCavallo, daCavalloFisso: s.daCavalloFisso, daStruttura: s.daStruttura,
    pagamento: e.stato_pagamento || "da_saldare", prima: s.prima, ferri,
    importi: cavalli.map((c, i) => ({ nome: c.nome, importo: proposti[i] })) });
  const comePrima = richiamoComePrimaScelto; richiamoComePrimaScelto = null;
  if(comePrima) return comePrima;
  return giorni != null ? aggiungiGiorniIso(e.data_intervento, giorni) : (e.prossima_scadenza || null);
}
function agNomeCavalloSicuro(e){ try{ return typeof agNomeCavallo === "function" ? agNomeCavallo(e) : ""; }catch(x){ return ""; } }

async function loadClientiMascalcia(){
  const [cli] = await Promise.all([DB.listClientiMascalcia(), caricaCavalliMiei()]);
  clientiMascalcia = cli;
  renderClientiList();
  caricaCartellaCavalli().then(() => renderClientiList()).catch(() => {});
  await renderProDeadlines();
}

function clientiAttivi(){ return (clientiMascalcia || []).filter(c => !c.archiviato_il); }

export { agNomeCavalloSicuro, caricaRichiamiPredefiniti, intervalloPredefinito, clientiAttivi, giorniRichiamoSuggeriti, giorniTra, importiSuggeriti, loadClientiMascalcia, prendiFerriScelti, prendiImportiScelti, prendiPagamentoScelto, richiamoCambia, richiamoConferma, richiamoFerriN, richiamoFerriRender, richiamoPagamento, richiamoPerFatto, richiamoRuotaScroll, richiamoTotale, richiamoVaiA, salvaRichiamiPredefiniti };
