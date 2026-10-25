// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { giorniTra } from "./032-richiamo-prossimo-intervento-sempre-in-g.js";
import { isStrutturaCollegata } from "./033-clienti-a-cartelle-stile-telegram-cavall.js";
import { euroTondo } from "./047-incassi-saldati-per-periodo-da-saldare-p.js";
import { aggiungiGiorniIso, isoLocale } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { openInterventoModal } from "./052-ferro-standard-nella-scheda-del-cavallo.js";
import { agGiornoLavoro, agNomeCavallo, renderAgendaSettimana } from "./053-agenda-settimanale-maniscalco.js";
import { formatDataBreve } from "./054-richieste-di-appuntamento-step-5d.js";
import { agDisegnaGriglia, agendaCompleta, apriPropostaStruttura, azioneGruppoStruttura } from "./055-appuntamenti-con-strutture-equo-scuderia.js";
import { caricaContiAperti } from "./058-scheda-cliente-pulsante-elenco-dei-conti.js";
/* ---------- AGENDA SEMPLICE | AGENDA COMPLETA (26/10/2026) ----------
   Interruttore in alto nella pagina Agenda (scelta salvata sul telefono, si parte da Semplice).
   Completa = 4 schede: Appuntamenti (la settimana, senza scadenze) · Da programmare (scadenze scadute e dei prossimi 30 giorni,
   per cliente, con «Fissa» / «Fissa tutti») · Non fatti (appuntamenti con la data passata rimasti da fare) · Da saldare (per cliente).
   La domenica è riposo: la data proposta da «Fissa» non cade mai di domenica (si può sempre cambiare). */
let agScheda = (() => { try { return localStorage.getItem("equo-agenda-scheda") || "app"; } catch(e){ return "app"; } })();
let agProgFiltro = "tutti";
let agDati = { prog: [], nonfatti: [], saldare: [] };
let agDsAperto = null;
let agTokenSchede = 0;
const oggiIso = () => isoLocale(new Date());
const nascosti = () => typeof incassiNascosti === "function" && incassiNascosti();

function scegliVistaAgenda(v){
  try { localStorage.setItem("equo-agenda-vista", v === "completa" ? "completa" : "semplice"); } catch(e){}
  if(v !== "completa") agScheda = "app";
  agApplicaVistaAgenda();
  agDisegnaGriglia();
  agAggiornaSchede();
}
function scegliSchedaAgenda(s){
  agScheda = s;
  try { localStorage.setItem("equo-agenda-scheda", s); } catch(e){}
  agApplicaVistaAgenda();
  agDisegnaScheda();
}
function agApplicaVistaAgenda(){
  const comp = agendaCompleta();
  if(!comp) agScheda = "app";
  document.querySelectorAll("#ag-vista button").forEach(b => { const on = b.dataset.v === (comp ? "completa" : "semplice"); b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on)); });
  const schede = document.getElementById("ag-schede");
  if(schede) schede.hidden = !comp;
  document.querySelectorAll("#ag-schede button").forEach(b => b.classList.toggle("on", b.dataset.s === agScheda));
  for(const s of ["app", "prog", "nonfatti", "saldare"]){
    const el = document.getElementById("ag-sez-" + s);
    if(el) el.hidden = s !== agScheda;
  }
}

// numeri delle schede e contenuto della scheda aperta (solo con l'Agenda completa)
async function agAggiornaSchede(){
  agApplicaVistaAgenda();
  if(!agendaCompleta() || DEMO_MODE && !currentUser) return;
  const token = ++agTokenSchede, oggi = oggiIso();
  const [prog, nonfatti, saldare] = await Promise.all([
    DB.listScadenzePeriodo(aggiungiGiorniIso(oggi, -365), aggiungiGiorniIso(oggi, 30)),
    agListaNonFatti(oggi), agListaDaSaldare()
  ]);
  if(token !== agTokenSchede) return;
  agDati = { prog: prog.sort((a, b) => a.prossima_scadenza.localeCompare(b.prossima_scadenza)), nonfatti, saldare };
  const settimana = (typeof agGiorniDati !== "undefined" ? agGiorniDati : []).reduce((t, d) => t + d.ev.filter(e => e.stato !== "fatto").length, 0);
  const metti = (id, v, vuoto) => { const el = document.getElementById(id); if(el){ el.textContent = v; el.classList.toggle("zero", !!vuoto); } };
  metti("ag-n-app", settimana, !settimana);
  metti("ag-n-prog", prog.length, !prog.length);
  metti("ag-n-nonfatti", nonfatti.length, !nonfatti.length);
  const tot = saldare.reduce((t, i) => t + (Number(i.importo) || 0), 0);
  metti("ag-n-saldare", nascosti() ? (saldare.length || "0") : euroTondo(tot), !saldare.length);
  agDisegnaScheda();
}
async function agListaNonFatti(oggi){
  if(DEMO_MODE) return (demoState.interventiMascalcia || []).filter(i => i.stato === "programmato" && i.data_intervento < oggi)
    .map(i => ({ ...i, clienti_mascalcia: { nome: demoState.clientiMascalcia.find(c => c.id === i.cliente_mascalcia_id)?.nome }, cavalli_clienti_mascalcia: { nome: (demoState.cavalliClientiMascalcia || []).find(c => c.id === i.cavallo_cliente_id)?.nome } }));
  const { data, error } = await sb.from("interventi_mascalcia").select("*, clienti_mascalcia(nome, nome_cavallo), cavalli_clienti_mascalcia(nome)")
    .eq("maniscalco_id", currentUser.id).eq("stato", "programmato").lt("data_intervento", oggi)
    .order("data_intervento", { ascending: false }).limit(500);
  if(error) console.warn("agListaNonFatti:", error.message);
  return data || [];
}
async function agListaDaSaldare(){
  if(DEMO_MODE) return (demoState.interventiMascalcia || []).filter(i => i.stato === "fatto" && i.stato_pagamento !== "saldato")
    .map(i => ({ ...i, clienti_mascalcia: { nome: demoState.clientiMascalcia.find(c => c.id === i.cliente_mascalcia_id)?.nome }, cavalli_clienti_mascalcia: { nome: (demoState.cavalliClientiMascalcia || []).find(c => c.id === i.cavallo_cliente_id)?.nome } }));
  const { data, error } = await sb.from("interventi_mascalcia").select("*, clienti_mascalcia(nome), cavalli_clienti_mascalcia(nome)")
    .eq("maniscalco_id", currentUser.id).eq("stato", "fatto").neq("stato_pagamento", "saldato")
    .order("data_intervento", { ascending: true }).limit(2000);
  if(error) console.warn("agListaDaSaldare:", error.message);
  return data || [];
}

function agDisegnaScheda(){
  if(!agendaCompleta()) return;
  if(agScheda === "prog") agDisegnaProg();
  else if(agScheda === "nonfatti") agDisegnaNonFatti();
  else if(agScheda === "saldare") agDisegnaSaldare();
}
const nomeCli = x => x.clienti_mascalcia?.nome || "Cliente";
const nomeCav = x => agNomeCavallo(x) || "Cavallo non indicato";
const tipoLav = x => (TIPO_FERRATURA_LABELS[x.tipo_ferratura] || x.tipo_ferratura || "Intervento") + (x.tipo_ferratura === "altro" && x.tipo_altro ? " · " + x.tipo_altro : "");
function perCliente(lista){
  const m = new Map();
  lista.forEach(x => { const k = x.cliente_mascalcia_id || "?"; if(!m.has(k)) m.set(k, { id: k, nome: nomeCli(x), righe: [] }); m.get(k).righe.push(x); });
  return [...m.values()];
}
// data proposta: la scadenza (o oggi se è già passata), mai di domenica
function agDataProposta(iso){ const oggi = oggiIso(); return agGiornoLavoro(!iso || iso < oggi ? oggi : iso); }

/* DA PROGRAMMARE */
function agDisegnaProg(){
  const box = document.getElementById("ag-sez-prog");
  if(!box) return;
  const oggi = oggiIso();
  const conta = { tutti: agDati.prog.length, scaduti: 0, d7: 0, d30: 0 };
  agDati.prog.forEach(sc => { const g = giorniTra(oggi, sc.prossima_scadenza); if(g < 0) conta.scaduti++; else if(g <= 7) conta.d7++; else conta.d30++; });
  const filtro = sc => { const g = giorniTra(oggi, sc.prossima_scadenza); return agProgFiltro === "tutti" || (agProgFiltro === "scaduti" ? g < 0 : agProgFiltro === "d7" ? g >= 0 && g <= 7 : g > 7); };
  const gruppi = perCliente(agDati.prog.filter(filtro));
  const pill = sc => { const g = giorniTra(oggi, sc.prossima_scadenza);
    return g < 0 ? `<span class="ag-pill r">scaduta da ${-g} ${g === -1 ? "giorno" : "giorni"}</span>` : g === 0 ? '<span class="ag-pill o">oggi</span>' : `<span class="ag-pill ${g <= 7 ? "o" : "v"}">tra ${g} ${g === 1 ? "giorno" : "giorni"}</span>`; };
  box.innerHTML = `<p class="ag-nota">Cavalli con la scadenza passata o nei prossimi 30 giorni, secondo l'intervallo della loro scheda. «Fissa» crea l'appuntamento (la domenica è riposo: la data proposta slitta al lunedì, puoi cambiarla).</p>
    <div class="ag-filtri">${[["tutti", "Tutti"], ["scaduti", "Scaduti"], ["d7", "7 giorni"], ["d30", "30 giorni"]].map(([k, t]) => `<button type="button" class="${agProgFiltro === k ? "on" : ""}" onclick="agFiltroProg('${k}')">${t} <b>${conta[k]}</b></button>`).join("")}</div>
    ${gruppi.length ? gruppi.map(g => `<div class="ag-gruppo">
        <div class="ag-gruppo-t"><div><b>${escapeHtml(g.nome)}</b><small>${g.righe.length} ${g.righe.length === 1 ? "cavallo" : "cavalli"}</small></div>${g.righe.length > 1 && g.id !== "?" ? `<button type="button" class="btn btn-outline btn-sm" onclick="agFissaTutti('${g.id}')">Fissa tutti</button>` : ""}</div>
        ${g.righe.map(sc => `<div class="ag-riga"><div class="ag-riga-c"><b>${escapeHtml(nomeCav(sc))}</b><small>${escapeHtml(tipoLav(sc))} · ${giorniTra(oggi, sc.prossima_scadenza) < 0 ? "scaduta" : "scade"} ${formatDataBreve(sc.prossima_scadenza)}</small></div>${pill(sc)}<button type="button" class="btn btn-primary btn-sm" onclick="agFissaScadenza('${sc.id}')">Fissa</button></div>`).join("")}
      </div>`).join("") : `<div class="ag-vuoto">✓ ${agDati.prog.length ? "Nessun cavallo in questo filtro" : "Nessun cavallo da programmare"}</div>`}`;
}
function agFiltroProg(k){ agProgFiltro = k; agDisegnaProg(); }
function agPresetScadenza(sc, data){
  return { tipo_ferratura: sc.tipo_ferratura, tipo_altro: sc.tipo_altro, misura_sistema: sc.misura_sistema, numero_ferro: sc.numero_ferro,
    quantita_ferri: sc.quantita_ferri, data_intervento: data, cavallo_cliente_id: sc.cavallo_cliente_id, horse_id: sc.horse_id };
}
function agFissaScadenza(id){
  const sc = agDati.prog.find(x => x.id === id);
  if(!sc) return;
  openInterventoModal(sc.cliente_mascalcia_id, null, agPresetScadenza(sc, agDataProposta(sc.prossima_scadenza)));
}
function agFissaTutti(clienteId, daGiorno){
  const righe = daGiorno ? agScadDelGiorno(daGiorno).filter(x => x.cliente_mascalcia_id === clienteId) : agDati.prog.filter(x => x.cliente_mascalcia_id === clienteId);
  if(!righe.length) return;
  if(daGiorno) closeModal("modal-da-fissare");
  const prima = righe.slice().sort((a, b) => a.prossima_scadenza.localeCompare(b.prossima_scadenza))[0];
  const preset = agPresetScadenza(prima, daGiorno || agDataProposta(prima.prossima_scadenza));
  if(isStrutturaCollegata(clienteId)) return apriPropostaStruttura(clienteId, { ...preset, cavalli: righe.map(r => r.cavallo_cliente_id).filter(Boolean) });
  openInterventoModal(clienteId, null, { ...preset, cavalli: righe.map(r => r.cavallo_cliente_id ? "m:" + r.cavallo_cliente_id : r.horse_id ? "h:" + r.horse_id : null).filter(Boolean) });
}

/* DA FISSARE DEL GIORNO (27/10/2026): si apre toccando il piccolo «N ⚠» della casella o «Vedi» nel giorno aperto */
function agScadDelGiorno(iso){
  const d = (typeof agGiorniDati !== "undefined" ? agGiorniDati : []).find(x => x.iso === iso);
  return d ? d.sc : [];
}
function apriDaFissare(iso){
  const lista = agScadDelGiorno(iso);
  if(!lista.length) return;
  const [y, m, g] = iso.split("-").map(Number);
  document.getElementById("df-tit").textContent = `Da fissare · ${formatDataBreve(iso)}`;
  const oggi = oggiIso();
  document.getElementById("df-lista").innerHTML = perCliente(lista).map(gr => `<div class="ag-gruppo">
      <div class="ag-gruppo-t"><div><b>${escapeHtml(gr.nome)}</b><small>${gr.righe.length} ${gr.righe.length === 1 ? "cavallo" : "cavalli"}</small></div>${gr.righe.length > 1 && gr.id !== "?" ? `<button type="button" class="btn btn-outline btn-sm" onclick="agFissaTutti('${gr.id}', '${iso}')">Fissa tutti</button>` : ""}</div>
      ${gr.righe.map(sc => { const gg = giorniTra(oggi, sc.prossima_scadenza);
        return `<div class="ag-riga"><div class="ag-riga-c"><b>${escapeHtml(nomeCav(sc))}</b><small>${escapeHtml(tipoLav(sc))} · ultimo ${formatDataBreve(sc.data_intervento)}${sc.prossima_scadenza !== iso ? " · scade " + formatDataBreve(sc.prossima_scadenza) : ""}</small></div>${gg < 0 ? `<span class="ag-pill r">scaduta</span>` : ""}<button type="button" class="btn btn-primary btn-sm" onclick="closeModal('modal-da-fissare');fissaDaScadenza('${sc.id}')">Fissa</button></div>`; }).join("")}
    </div>`).join("");
  openModal("modal-da-fissare");
}

/* NON FATTI */
function agGruppiNonFatti(){
  const m = new Map();
  agDati.nonfatti.forEach(e => { const k = e.data_intervento + "|" + (e.cliente_mascalcia_id || "?"); if(!m.has(k)) m.set(k, { k, data: e.data_intervento, nome: nomeCli(e), righe: [] }); m.get(k).righe.push(e); });
  return [...m.values()].sort((a, b) => b.data.localeCompare(a.data));
}
function agDisegnaNonFatti(){
  const box = document.getElementById("ag-sez-nonfatti");
  if(!box) return;
  const oggi = oggiIso();
  agDati.nonfatti.forEach(e => { if(typeof agEventiCache !== "undefined") agEventiCache[e.id] = e; });
  const gruppi = agGruppiNonFatti();
  box.innerHTML = `<p class="ag-nota">Appuntamenti con la data passata che non hai segnato né fatti né annullati. Sistemali con un tocco: «Fatto» sul singolo cavallo, oppure sposta o annulla tutto il gruppo.</p>
    ${gruppi.length ? gruppi.map((g, n) => { const gg = giorniTra(g.data, oggi);
      return `<div class="ag-gruppo">
        <div class="ag-gruppo-t"><div><b>${escapeHtml(formatDataBreve(g.data))} · ${escapeHtml(g.nome)}</b><small>${g.righe.length} ${g.righe.length === 1 ? "cavallo" : "cavalli"}</small></div><span class="ag-pill r">${gg === 1 ? "ieri" : gg + " giorni fa"}</span></div>
        ${g.righe.map(e => `<div class="ag-riga"><div class="ag-riga-c" onclick="apriAzioniEvento('${e.id}')"><b>${escapeHtml(nomeCav(e))}</b><small>${escapeHtml(tipoLav(e))}${e.gruppo_id ? " · con la scuderia" : ""}</small></div><button type="button" class="btn btn-primary btn-sm" onclick="segnaFattoAgenda('${e.id}')">Fatto</button><button type="button" class="ag-piu" onclick="apriAzioniEvento('${e.id}')" aria-label="Altre azioni">⋯</button></div>`).join("")}
        <div class="agc-azioni"><label class="ag-sposta"><span>Sposta al</span><input type="date" id="ag-nf-data-${n}" min="${oggi}" value="${agDataProposta(oggi)}"></label><button type="button" class="btn btn-outline btn-sm" onclick="agNfSposta(${n})">Sposta</button><button type="button" class="btn btn-outline btn-sm ag-rosso" onclick="agNfAnnulla(${n})">Annulla</button></div>
      </div>`; }).join("") : '<div class="ag-vuoto">✓ Tutto in ordine</div>'}`;
}
async function agNfAggiorna(righe, upd, testo){
  const conScuderia = [...new Set(righe.filter(e => e.gruppo_id).map(e => e.gruppo_id))];
  const libere = righe.filter(e => !e.gruppo_id);
  for(const e of libere){
    const { error } = await DB.updateInterventoMascalcia(e.id, upd);
    if(error){ showToast("Errore: " + error.message); break; }
  }
  if(conScuderia.length && upd.stato === "annullato") for(const g of conScuderia) await azioneGruppoStruttura(g, "annulla");
  else if(conScuderia.length) showToast("Gli appuntamenti con la scuderia si spostano dal tasto ⋯ (la scuderia deve riconfermare)");
  if(libere.length) showToast(testo);
  await renderAgendaSettimana();
}
async function agNfSposta(n){
  const g = agGruppiNonFatti()[n];
  const data = document.getElementById("ag-nf-data-" + n)?.value;
  if(!g || !data) return;
  if(data < oggiIso()){ showToast("Scegli oggi o un giorno futuro"); return; }
  await agNfAggiorna(g.righe, { data_intervento: data }, `Spostato a ${formatDataBreve(data)}`);
}
async function agNfAnnulla(n){
  const g = agGruppiNonFatti()[n];
  if(!g) return;
  if(!confirm(`Annullare ${g.righe.length === 1 ? "questo appuntamento" : "questi " + g.righe.length + " appuntamenti"} di ${formatDataBreve(g.data)} (${g.nome})?`)) return;
  await agNfAggiorna(g.righe, { stato: "annullato" }, "Appuntamento annullato");
}

/* DA SALDARE */
function agDisegnaSaldare(){
  const box = document.getElementById("ag-sez-saldare");
  if(!box) return;
  if(nascosti()){ box.innerHTML = '<div class="ag-vuoto">Hai nascosto gli incassi: mostrali dal menu (serve il PIN).</div>'; return; }
  const oggi = oggiIso();
  const gruppi = perCliente(agDati.saldare).map(g => ({ ...g, tot: g.righe.reduce((t, i) => t + (Number(i.importo) || 0), 0), vecchio: g.righe[0]?.data_intervento }))
    .sort((a, b) => (a.vecchio || "").localeCompare(b.vecchio || ""));
  const tot = gruppi.reduce((t, g) => t + g.tot, 0);
  box.innerHTML = `<div class="ag-totale"><div><small>Da incassare · ${gruppi.length} ${gruppi.length === 1 ? "cliente" : "clienti"} · ${agDati.saldare.length} ${agDati.saldare.length === 1 ? "lavoro" : "lavori"}</small><b>${euroTondo(tot)}</b></div></div>
    <div id="ag-conti-aperti"></div>
    <p class="ag-nota">Dal debito più vecchio. Tocca un cliente per vedere i lavori e segnarli saldati.</p>
    ${gruppi.length ? gruppi.map(g => { const gg = g.vecchio ? giorniTra(g.vecchio, oggi) : 0, aperto = agDsAperto === g.id;
      return `<div class="agc-cli${aperto ? " aperto" : ""}">
        <button type="button" class="agc-cli-t" onclick="agDsApri('${g.id}')"><span class="ag-ini">${escapeHtml((g.nome.match(/\b\p{L}/gu) || ["?"]).slice(0, 2).join("").toUpperCase())}</span>
          <span class="ag-riga-c"><b>${escapeHtml(g.nome)}</b><small>${g.righe.length} ${g.righe.length === 1 ? "lavoro" : "lavori"} · dal ${formatDataBreve(g.vecchio)}</small></span>
          <span class="ag-eu">${euroTondo(g.tot)}${gg > 30 ? `<small>da ${gg} giorni</small>` : ""}</span></button>
        ${aperto ? `<div class="agc-cli-d">${g.righe.map(i => `<div class="ag-riga"><div class="ag-riga-c"><b>${escapeHtml(nomeCav(i))}</b><small>${escapeHtml(tipoLav(i))} · ${formatDataBreve(i.data_intervento)}</small></div><span class="ag-eu">${i.importo != null ? euroTondo(i.importo) : "—"}</span><button type="button" class="btn btn-primary btn-sm" onclick="agDsSaldato('${i.id}', this)">Saldato</button></div>`).join("")}
          ${g.id !== "?" ? `<div class="agc-azioni"><button type="button" class="btn btn-outline btn-sm" onclick="apriNuovoConto('${g.id}')">Fai il conto</button><button type="button" class="btn btn-outline btn-sm" onclick="apriResoconto('${g.id}')">Resoconto PDF</button></div>` : ""}</div>` : ""}
      </div>`; }).join("") : '<div class="ag-vuoto">✓ Tutto incassato</div>'}`;
  caricaContiAperti("ag-conti-aperti");
}
function agDsApri(id){ agDsAperto = agDsAperto === id ? null : id; agDisegnaSaldare(); }
async function agDsSaldato(id, btn){
  btn.disabled = true;
  const { error } = await DB.updateInterventoMascalcia(id, { stato_pagamento: "saldato" });
  if(error){ btn.disabled = false; showToast("Errore: " + error.message); return; }
  showToast("Segnato come saldato");
  agDati.saldare = agDati.saldare.filter(i => i.id !== id);
  agAggiornaSchede();
  if(typeof renderIncassi === "function") renderIncassi();
}

// invito clienti in fondo all'Agenda: codice personale + link (come «Condividi codice»)
async function condividiInvitoAgenda(){
  if(!currentUser.codiceProfessionista && !DEMO_MODE) currentUser.codiceProfessionista = await DB.ensureCodiceProfessionista();
  if(typeof shareCodicePersonale === "function") shareCodicePersonale();
}

export { apriDaFissare, agAggiornaSchede, agApplicaVistaAgenda, agDsApri, agDsSaldato, agFiltroProg, agFissaScadenza, agFissaTutti, agNfAnnulla, agNfSposta, condividiInvitoAgenda, scegliSchedaAgenda, scegliVistaAgenda };
