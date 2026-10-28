// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { chiediConferma } from "./052-ferro-standard-nella-scheda-del-cavallo.js";
import { aggiungiGiorniIso, isoLocale } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { formatDataBreve } from "./054-richieste-di-appuntamento-step-5d.js";
import { apriNuovoConto } from "./059-foglio-fai-il-conto.js";
/* ---------- PROMEMORIA PERSONALI (27/10/2026) ----------
   «Ricordami di…»: li crea Hammer (scheda da confermare) o il maniscalco dal tasto + → «Promemoria».
   Tabella promemoria_personali; all'ora giusta la funzione Netlify «invia-promemoria» fa scrivere Hammer in chat
   (messaggio importante) e manda la push, o l'email se la push non parte.
   Si vedono in Home («Da ricordare»), nel giorno dell'Agenda e nel messaggio di Hammer, con «Fatto», «Domani» e il tasto dell'azione. */
const PM_AZIONI = { conto: "Fai il conto", chat: "Scrivi al cliente", naviga: "Naviga" };
let pmCache = {};            // id -> promemoria
let pmInModifica = null;
const pmOra = q => new Date(q).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
const pmGiorno = q => isoLocale(new Date(q));
const pmNomeCliente = p => p?.clienti_mascalcia?.nome || clientiMascalcia?.find?.(c => c.id === p?.cliente_mascalcia_id)?.nome || "";

const PmDB = {
  async periodo(daIso, aIso){
    if(DEMO_MODE) return (demoState.promemoria || []).filter(p => p.stato !== "annullato" && pmGiorno(p.quando) >= daIso && pmGiorno(p.quando) <= aIso);
    const da = new Date(daIso + "T00:00:00").toISOString(), a = new Date(aIso + "T23:59:59").toISOString();
    const { data, error } = await sb.from("promemoria_personali").select("*, clienti_mascalcia(nome)").eq("user_id", currentUser.id)
      .neq("stato", "annullato").gte("quando", da).lte("quando", a).order("quando", { ascending: true }).limit(200);
    if(error){ if(!/does not exist|schema cache/i.test(error.message || "")) console.warn("promemoria:", error.message); return []; }
    return data || [];
  },
  // Home: da fare fino a stasera (anche quelli rimasti indietro)
  async daFareFinoAOggi(){
    if(DEMO_MODE) return (demoState.promemoria || []).filter(p => p.stato === "attivo" && pmGiorno(p.quando) <= isoLocale(new Date()));
    const fine = new Date(isoLocale(new Date()) + "T23:59:59").toISOString();
    const { data, error } = await sb.from("promemoria_personali").select("*, clienti_mascalcia(nome)").eq("user_id", currentUser.id)
      .eq("stato", "attivo").lte("quando", fine).order("quando", { ascending: true }).limit(30);
    if(error) return [];
    return data || [];
  },
  async uno(id){
    if(pmCache[id]) return pmCache[id];
    if(DEMO_MODE) return (demoState.promemoria || []).find(p => p.id === id) || null;
    const { data } = await sb.from("promemoria_personali").select("*, clienti_mascalcia(nome)").eq("id", id).maybeSingle();
    if(data) pmCache[id] = data;
    return data || null;
  },
  async salva(id, campi){
    if(DEMO_MODE){
      demoState.promemoria = demoState.promemoria || [];
      if(id){ Object.assign(demoState.promemoria.find(p => p.id === id) || {}, campi); return { error: null }; }
      demoState.promemoria.push({ id: "pm" + Date.now(), stato: "attivo", user_id: currentUser.id, ...campi }); return { error: null };
    }
    const q = id ? sb.from("promemoria_personali").update(campi).eq("id", id) : sb.from("promemoria_personali").insert({ user_id: currentUser.id, ...campi });
    const { error } = await q;
    if(id) delete pmCache[id];
    return { error };
  }
};
const pmTabellaMancante = e => /does not exist|schema cache|promemoria_personali/i.test(e?.message || "");

/* ---- finestra Nuovo / Modifica ---- */
function pmApriNuovo(preset){
  pmInModifica = null;
  pmRiempi(preset || {});
}
async function pmModifica(id){
  const p = await PmDB.uno(id); if(!p) return;
  pmInModifica = p;
  pmRiempi({ testo: p.testo, data: pmGiorno(p.quando), ora: pmOra(p.quando), cliente_mascalcia_id: p.cliente_mascalcia_id, azione: p.azione });
}
function pmRiempi(x){
  document.getElementById("pm-tit").textContent = pmInModifica ? "Modifica promemoria" : "Nuovo promemoria";
  document.getElementById("pm-testo").value = x.testo || "";
  document.getElementById("pm-data").value = x.data || aggiungiGiorniIso(isoLocale(new Date()), 1);
  document.getElementById("pm-data").min = isoLocale(new Date());
  document.getElementById("pm-ora").value = x.ora || "08:00";
  const sel = document.getElementById("pm-cliente");
  const cli = (clientiMascalcia || []).filter(c => !c.archiviato_il).slice().sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" }));
  sel.innerHTML = '<option value="">Nessun cliente</option>' + cli.map(c => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("");
  sel.value = x.cliente_mascalcia_id || "";
  document.getElementById("pm-azione").value = x.azione || "";
  pmAggiornaAzione(); pmAggiornaQuando();
  document.getElementById("pm-errore").style.display = "none";
  document.getElementById("pm-elimina").style.display = pmInModifica ? "" : "none";
  openModal("modal-promemoria");
  if(!pmInModifica) setTimeout(() => document.getElementById("pm-testo").focus(), 250);
}
function pmQuando(g){ document.getElementById("pm-data").value = aggiungiGiorniIso(isoLocale(new Date()), g); pmAggiornaQuando(); }
function pmAggiornaQuando(){
  const v = document.getElementById("pm-data").value, oggi = isoLocale(new Date());
  document.querySelectorAll("#pm-quando button").forEach(b => b.classList.toggle("on", v === aggiungiGiorniIso(oggi, Number(b.dataset.q))));
}
function pmAggiornaAzione(){
  const c = document.getElementById("pm-cliente").value;
  document.getElementById("pm-azione-box").style.display = c ? "" : "none";
  if(!c) document.getElementById("pm-azione").value = "";
}
async function pmSalva(){
  const err = document.getElementById("pm-errore");
  const testo = document.getElementById("pm-testo").value.replace(/\s+/g, " ").trim();
  const data = document.getElementById("pm-data").value, ora = document.getElementById("pm-ora").value || "08:00";
  const mostra = t => { err.textContent = t; err.style.display = "block"; };
  if(!testo) return mostra("Scrivi cosa devo ricordarti.");
  if(!data) return mostra("Scegli il giorno.");
  const quando = new Date(data + "T" + ora);
  if(quando.getTime() < Date.now() - 60000) return mostra("Scegli un'ora che non sia già passata.");
  const cliente = document.getElementById("pm-cliente").value || null;
  const campi = { testo: testo.slice(0, 300), quando: quando.toISOString(), cliente_mascalcia_id: cliente, azione: cliente ? (document.getElementById("pm-azione").value || null) : null, stato: "attivo" };
  if(!pmInModifica) campi.creato_da = "utente";
  const btn = document.getElementById("pm-salva"); btn.disabled = true;
  const { error } = await PmDB.salva(pmInModifica?.id || null, campi);
  btn.disabled = false;
  if(error) return mostra(pmTabellaMancante(error) ? "I promemoria saranno disponibili dopo l'aggiornamento di Equo." : "Non salvato: " + error.message);
  closeModal("modal-promemoria");
  showToast(`Promemoria ${pmInModifica ? "aggiornato" : "salvato"}: ${formatDataBreve(data)} ore ${ora}`);
  pmInModifica = null;
  pmAggiornaViste();
}
async function pmElimina(){
  if(!pmInModifica) return;
  if(!await chiediConferma("Eliminare questo promemoria?")) return;
  const { error } = await PmDB.salva(pmInModifica.id, { stato: "annullato" });
  if(error){ showToast("Errore: " + error.message); return; }
  closeModal("modal-promemoria"); pmInModifica = null;
  showToast("Promemoria eliminato");
  pmAggiornaViste();
}

/* ---- azioni: Fatto, Domani, tasto del promemoria ---- */
async function pmFatto(id, btn){
  if(btn) btn.disabled = true;
  const p = await PmDB.uno(id);
  const fatto = p?.stato === "fatto";
  const { error } = await PmDB.salva(id, { stato: fatto ? "attivo" : "fatto" });
  if(error){ if(btn) btn.disabled = false; showToast("Errore: " + error.message); return; }
  showToast(fatto ? "Rimesso da fare" : "✓ Fatto");
  pmSegnaInChat(id, fatto ? null : "✓ Fatto");
  pmAggiornaViste();
}
async function pmDomani(id, btn){
  if(btn) btn.disabled = true;
  const p = await PmDB.uno(id); if(!p){ if(btn) btn.disabled = false; return; }
  // domani alla stessa ora (o alle 8 se l'ora era già passata da un pezzo); la domenica è riposo → lunedì
  const base = new Date(Math.max(Date.now(), new Date(p.quando).getTime()));
  const d = new Date(base); d.setDate(d.getDate() + 1);
  if(d.getDay() === 0) d.setDate(d.getDate() + 1);
  const ora = pmOra(p.quando);
  const quando = new Date(isoLocale(d) + "T" + ora);
  const { error } = await PmDB.salva(id, { quando: quando.toISOString(), stato: "attivo" });
  if(error){ if(btn) btn.disabled = false; showToast("Errore: " + error.message); return; }
  showToast(`Rimandato a ${formatDataBreve(isoLocale(d))} ore ${ora}`);
  pmSegnaInChat(id, `↻ Rimandato a ${formatDataBreve(isoLocale(d))} ore ${ora}`);
  pmAggiornaViste();
}
async function pmEsegui(id){
  const p = await PmDB.uno(id); if(!p) return;
  const cid = p.cliente_mascalcia_id;
  if(!cid || !p.azione) return pmModifica(id);
  if(typeof closeAiSheet === "function" && document.body.classList.contains("ai-aperta")) closeAiSheet();
  if(p.azione === "conto") return apriNuovoConto(cid);
  if(p.azione === "chat"){ if(typeof showPage === "function") showPage("pro-inbox"); return typeof openChatThread === "function" ? openChatThread(cid) : null; }
  if(p.azione === "naviga") return typeof wgNaviga === "function" ? wgNaviga(cid) : null;
}
// nel messaggio di Hammer: i tasti lasciano il posto all'esito
function pmSegnaInChat(id, esito){
  document.querySelectorAll(`.pm-tasti[data-pm="${id}"]`).forEach(el => {
    if(esito) el.innerHTML = `<span class="pm-esito">${escapeHtml(esito)}</span>`;
  });
}
function pmTastiHtml(p, compatto){
  const az = p.azione && p.cliente_mascalcia_id ? `<button type="button" class="btn btn-primary btn-sm" onclick="pmEsegui('${p.id}')">${PM_AZIONI[p.azione]}</button>` : "";
  if(p.stato === "fatto") return `<span class="pm-esito">✓ Fatto</span>`;
  return `${az}<button type="button" class="btn btn-outline btn-sm" onclick="pmFatto('${p.id}', this)">Fatto</button>${compatto ? "" : `<button type="button" class="btn btn-outline btn-sm" onclick="pmDomani('${p.id}', this)">Domani</button>`}`;
}
// tasti per il messaggio importante di Hammer (azione salvata nel messaggio)
function pmTastiChat(azione){
  if(!azione || azione.tipo !== "promemoria" || !azione.id) return "";
  const p = { id: azione.id, azione: azione.azione, cliente_mascalcia_id: azione.cliente_mascalcia_id, stato: "attivo" };
  return `<div class="pm-tasti" data-pm="${azione.id}">${pmTastiHtml(p)}</div>`;
}

/* ---- Home: «Da ricordare» ---- */
async function pmRenderHome(){
  const box = document.getElementById("hm-promemoria");
  if(!box || !currentUser) return;
  const lista = await PmDB.daFareFinoAOggi();
  lista.forEach(p => { pmCache[p.id] = p; });
  const oggi = isoLocale(new Date());
  box.innerHTML = !lista.length ? "" : `<div class="pm-home">
    <div class="pm-home-t"><b>🔔 Da ricordare</b><button type="button" onclick="pmApriNuovo()">+ Nuovo</button></div>
    ${lista.map(p => { const g = pmGiorno(p.quando), cli = pmNomeCliente(p);
      return `<div class="pm-riga"><div class="pm-riga-c" onclick="pmModifica('${p.id}')"><b>${escapeHtml(p.testo)}</b><small>${g < oggi ? `<span class="pm-ritardo">${formatDataBreve(g)}</span> · ` : ""}ore ${pmOra(p.quando)}${cli ? " · " + escapeHtml(cli) : ""}</small></div><div class="pm-tasti">${pmTastiHtml(p, true)}</div></div>`; }).join("")}
  </div>`;
}

/* ---- Agenda: promemoria del giorno ---- */
async function pmCaricaSettimana(daIso, aIso){
  const lista = await PmDB.periodo(daIso, aIso);
  lista.forEach(p => { pmCache[p.id] = p; });
  return lista;
}
function pmPannelloGiorno(lista){
  if(!lista || !lista.length) return "";
  return `<div class="pm-giorno"><div class="pm-giorno-t">🔔 Promemoria</div>
    ${lista.map(p => { const cli = pmNomeCliente(p);
      return `<div class="pm-riga${p.stato === "fatto" ? " fatto" : ""}"><span class="pm-ora">${pmOra(p.quando)}</span><div class="pm-riga-c" onclick="pmModifica('${p.id}')"><b>${escapeHtml(p.testo)}</b>${cli ? `<small>${escapeHtml(cli)}</small>` : ""}</div><div class="pm-tasti">${pmTastiHtml(p, true)}</div></div>`; }).join("")}
  </div>`;
}

function pmAggiornaViste(){
  pmCache = {};
  pmRenderHome();
  if(typeof renderAgendaSettimana === "function" && document.getElementById("page-pro-agenda")?.classList.contains("active")) renderAgendaSettimana();
}

// dalla scheda di Hammer (confermata): salva il promemoria
async function pmSalvaDaHammer(x){
  const quando = new Date(x.data + "T" + (x.ora || "08:00"));
  if(quando.getTime() < Date.now() - 60000) return { error: { message: "l'ora è già passata" } };
  const r = await PmDB.salva(null, { testo: x.testo, quando: quando.toISOString(), cliente_mascalcia_id: x.cliente_mascalcia_id || null, azione: x.cliente_mascalcia_id ? (x.azione || null) : null, creato_da: "hammer", stato: "attivo" });
  if(r.error && pmTabellaMancante(r.error)) return { error: { message: "i promemoria saranno disponibili dopo l'aggiornamento di Equo" } };
  if(!r.error) pmAggiornaViste();
  return r;
}

export { PmDB, pmAggiornaAzione, pmAggiornaQuando, pmApriNuovo, pmCaricaSettimana, pmDomani, pmElimina, pmEsegui, pmFatto, pmModifica, pmPannelloGiorno, pmQuando, pmRenderHome, pmSalva, pmSalvaDaHammer, pmTastiChat };
