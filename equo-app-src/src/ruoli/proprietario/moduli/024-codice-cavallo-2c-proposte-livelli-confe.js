// Equo App · proprietario · modulo (moduli ES, costruiti con Vite in ruoli/proprietario/costruito.js)
import { loadHorses } from "./023-horses.js";
import { openHorseDetail, renderHorsesList } from "./026-ultimo-messaggio-home.js";
/* ---------- CODICE CAVALLO 2C: proposte, livelli, conferme ---------- */
const LIVELLI_CODICE = { provvisorio: ["Provvisorio", "#5B6B62", "#E9EEEB"], validato: ["Validato", "#14573A", "#E3F1E9"], certificato: ["Certificato", "#7A5A00", "#F8EDD2"] };
function badgeLivelloCodice(l){
  const x = LIVELLI_CODICE[l] || LIVELLI_CODICE.provvisorio;
  return `<span style="font-size:11px;font-weight:700;color:${x[1]};background:${x[2]};border-radius:999px;padding:3px 9px">${x[0]}</span>`;
}
let proposteCav = [];
async function caricaProposteCavalli(){
  const box = document.getElementById("home-proposte");
  if(!box) return;
  if(DEMO_MODE){ box.innerHTML = ""; return; }
  try{
    const { data, error } = await sb.rpc("equo_proposte_cavalli_proprietario");
    proposteCav = (!error && Array.isArray(data)) ? data : [];
  } catch(e){ proposteCav = []; }
  renderProposteCavalli();
  caricaRichiesteLasciati();
  caricaReferenzeDaScrivere();
}
/* Referenze per l'Equo CV (26/10/2026): il tuo professionista ti chiede due righe; lui decide se pubblicarle */
let referenzeDaScrivere = [];
async function caricaReferenzeDaScrivere(){
  const box = document.getElementById("home-referenze");
  if(!box) return;
  if(DEMO_MODE){ box.innerHTML = ""; return; }
  try{ const { data, error } = await sb.rpc("equo_referenze_da_scrivere"); referenzeDaScrivere = (!error && Array.isArray(data)) ? data : []; }catch(e){ referenzeDaScrivere = []; }
  if(!referenzeDaScrivere.length){ box.innerHTML = ""; return; }
  box.innerHTML = referenzeDaScrivere.map(r => `<div class="card" style="margin-bottom:14px">
    <div class="section-title" style="margin-bottom:4px">⭐ ${escapeHtml(r.pro || "Il tuo professionista")} ti chiede una referenza</div>
    <div class="muted" style="font-size:13px;line-height:1.5;margin-bottom:8px">Due righe sul suo lavoro per il suo Equo CV. Compare con il tuo nome solo se lui decide di pubblicarla.</div>
    <textarea class="input" id="ref-${r.id}" maxlength="400" rows="3" placeholder="Es. Preciso e puntuale, segue i miei cavalli con grande attenzione."></textarea>
    <button class="btn btn-primary" style="width:100%;margin-top:8px" onclick="inviaReferenza('${r.id}', this)">Invia la referenza</button>
  </div>`).join("");
}
async function inviaReferenza(id, btn){
  const t = (document.getElementById("ref-" + id)?.value || "").trim();
  if(t.length < 5){ showToast("Scrivi almeno qualche parola."); return; }
  btn.disabled = true;
  const { data, error } = await sb.rpc("equo_scrivi_referenza", { p_id: id, p_testo: t });
  btn.disabled = false;
  if(error || !data?.ok){ showToast("Non inviata, riprova."); return; }
  showToast("Grazie! Referenza inviata.");
  caricaReferenzeDaScrivere();
}
/* «Non lo seguo più» (24/10/2026, caso Rio): il maniscalco chiede di non seguire più un tuo cavallo; tu confermi o rifiuti */
let richiesteLasciati = [];
async function caricaRichiesteLasciati(){
  const box = document.getElementById("home-lasciati");
  if(!box) return;
  if(DEMO_MODE){ box.innerHTML = ""; return; }
  try{
    const { data, error } = await sb.rpc("equo_richieste_lasciati");
    richiesteLasciati = (!error && Array.isArray(data)) ? data : [];
  } catch(e){ richiesteLasciati = []; }
  if(!richiesteLasciati.length){ box.innerHTML = ""; return; }
  box.innerHTML = `<div class="card" style="margin-bottom:14px">
    <div class="section-title" style="margin-bottom:4px">Richieste del maniscalco</div>
    <div class="muted" style="font-size:13px;line-height:1.5;margin-bottom:6px">Il maniscalco chiede di non seguire più questi cavalli. Se confermi, il cavallo esce dalla sua lista e i suoi appuntamenti ancora da fare si annullano; lo storico resta.</div>
    ${richiesteLasciati.map(r => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid var(--border,#DDE5E0)">
      <div style="min-width:0"><div style="font-weight:600">${escapeHtml(r.cavallo || "")}</div>
        <div class="muted" style="font-size:12px">${escapeHtml(r.maniscalco || "Il maniscalco")}${r.motivo ? " · «" + escapeHtml(r.motivo) + "»" : ""}</div></div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button class="btn btn-primary btn-sm" onclick="rispondiLasciato('${r.id}', true)">Conferma</button>
        <button class="btn btn-ghost btn-sm" onclick="rispondiLasciato('${r.id}', false)">Rifiuta</button>
      </div>
    </div>`).join("")}
  </div>`;
}
async function rispondiLasciato(id, conferma){
  const { data, error } = await sb.rpc("equo_rispondi_lasciato", { p_id: id, p_conferma: !!conferma });
  if(error || !data?.ok){ showToast("Operazione non riuscita. Riprova."); return; }
  showToast(conferma ? "Confermato: il maniscalco non segue più il cavallo" : "Rifiutato: il maniscalco continua a seguirlo");
  caricaRichiesteLasciati();
}
function renderProposteCavalli(){
  const box = document.getElementById("home-proposte");
  if(!box) return;
  if(!proposteCav.length){ box.innerHTML = ""; return; }
  const man = proposteCav[0].maniscalco || "Il tuo maniscalco";
  const righe = proposteCav.map(p => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid var(--border,#DDE5E0)">
      <div style="min-width:0"><div style="font-weight:600">${escapeHtml(p.nome || "")}</div>
        <div class="muted" style="font-size:12px">${escapeHtml([p.razza, p.codice].filter(Boolean).join(" · "))}${p.esiste_gia ? " · hai già un cavallo con questo nome: si uniscono" : ""}</div></div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button class="btn btn-primary btn-sm" onclick="accettaProposta('${p.proposta}')">Accetta</button>
        <button class="btn btn-ghost btn-sm" onclick="rifiutaProposta('${p.proposta}')">Non è mio</button>
      </div>
    </div>`).join("");
  box.innerHTML = `<div class="card" style="margin-bottom:14px">
    <div class="section-title" style="margin-bottom:4px">${escapeHtml(man)} ha preparato ${proposteCav.length === 1 ? "1 cavallo" : proposteCav.length + " cavalli"} per te</div>
    <div class="muted" style="font-size:13px;line-height:1.5;margin-bottom:6px">Accettali: non crei nulla da zero e non nascono schede doppie. Poi controlli e completi i dati.${isPremium() ? "" : " Con il piano Free è completo un solo cavallo: gli altri si aggiungono ma restano bloccati finché non passi a Premium."}</div>
    ${righe}
    ${proposteCav.length > 1 ? `<button class="btn btn-outline" style="width:100%;margin-top:8px" onclick="accettaTuttiProposte()">Accetta tutti</button>` : ""}
  </div>`;
}
async function accettaPropostaSilenzioso(id){
  const { data, error } = await sb.rpc("equo_accetta_cavallo_proposto", { p_proposta: id });
  if(error || !data) return { ok: false, motivo: "errore" };
  return data;
}
function messaggioProposta(res){
  if(res.motivo === "limite_cavalli_free") return "Con il piano Free puoi avere un solo cavallo: passa a Premium per accettare anche gli altri.";
  if(res.motivo === "proposta_non_trovata") return "Questa proposta non è più disponibile.";
  return "Operazione non riuscita. Riprova.";
}
async function accettaProposta(id){
  const res = await accettaPropostaSilenzioso(id);
  if(!res.ok){ showToast(messaggioProposta(res)); return; }
  showToast("Cavallo aggiunto. Controlla i dati e confermali.");
  await loadHorses();
  await caricaCavalliBloccati();
  if(res.horse_id && horses.some(h => h.id === res.horse_id)) openHorseDetail(res.horse_id);
}
async function accettaTuttiProposte(){
  let n = 0, stop = null;
  for(const p of [...proposteCav]){
    const res = await accettaPropostaSilenzioso(p.proposta);
    if(res.ok) n++; else { stop = res; break; }
  }
  if(n) showToast(n === 1 ? "1 cavallo aggiunto." : n + " cavalli aggiunti.");
  if(stop) { showToast(messaggioProposta(stop)); if(stop.motivo === "limite_cavalli_free") openModal("modal-limite-cavalli"); }
  await loadHorses();
}
async function rifiutaProposta(id){
  const { data } = await sb.rpc("equo_rifiuta_cavallo_proposto", { p_proposta: id });
  showToast(data?.ok ? "Fatto: il maniscalco potrà correggere la scheda." : "Operazione non riuscita.");
  caricaProposteCavalli();
}

/* piano Free: i cavalli accettati dal maniscalco oltre il primo restano bloccati finche non passi a Premium */
let cavalliBloccati = new Set();
// cavalli che il proprietario puo usare (esclusi quelli bloccati dal piano Free): per diario, lezioni e scelte di cavallo
function cavalliUsabili(){ return (horses || []).filter(h => !cavalliBloccati.has(h.id)); }
async function caricaCavalliBloccati(){
  if(DEMO_MODE) return;
  let ids = [];
  if(!isPremium()){
    try{ const { data, error } = await sb.rpc("equo_cavalli_bloccati"); if(!error && Array.isArray(data)) ids = data; } catch(e){}
  }
  const nuovo = ids.join(",");
  const vecchio = [...cavalliBloccati].join(",");
  cavalliBloccati = new Set(ids);
  if(nuovo !== vecchio) renderHorsesList();
}
function renderHorseBloccato(h){
  const box = document.getElementById("horse-lock-box");
  const v = document.getElementById("cavalli-detail-view");
  if(!box || !v) return;
  if(!h || !cavalliBloccati.has(h.id)){ box.innerHTML = ""; v.classList.remove("bloccato"); return; }
  v.classList.add("bloccato");
  box.innerHTML = `<div class="card" style="margin-bottom:14px;text-align:center;padding:18px">
    <div style="font-weight:700;margin-bottom:6px">Scheda e interventi di ${escapeHtml(h.name)} sono bloccati</div>
    <div class="muted" style="font-size:13px;line-height:1.55;margin-bottom:12px">Il tuo maniscalco continua a registrare gli interventi, che restano al sicuro. Con il piano Free è completo un solo cavallo: passa a Premium per sbloccare questa scheda, con tutto il suo storico.</div>
    <button class="btn btn-primary" style="width:100%" onclick="openModal('modal-limite-cavalli')">Sblocca con Premium</button></div>`;
}

/* livello del codice sulla scheda cavallo (proprietario) */
async function renderLivelloCavallo(h){
  const box = document.getElementById("horse-livello-box");
  if(!box) return;
  const liv = h.codice_livello || "provvisorio";
  const codice = h.codice_equo || "in assegnazione";
  const testa = `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px"><div><b class="cod-equo">${escapeHtml(codice)}</b></div>${badgeLivelloCodice(liv)}</div>`;
  box.innerHTML = `<div class="card" style="margin-bottom:12px">${testa}</div>`;
  if(DEMO_MODE) return;
  let st = null;
  try{ const r = await sb.rpc("equo_stato_codice", { p_horse: h.id }); st = r.data; } catch(e){}
  if(currentHorseId !== h.id || !st || !st.ok) return;
  const v = (ok, t) => `<div style="font-size:13.5px;padding:2px 0;color:${ok ? "#14573A" : "var(--muted)"}">${ok ? "✓" : "○"} ${t}</div>`;
  const dati = st.nome && st.razza && st.nascita;
  let corpo = v(st.nome, "Nome") + v(st.razza, "Razza") + v(st.nascita, "Data di nascita")
    + v(st.conferma_proprietario, "Tua conferma dei dati")
    + v(st.conferme_valide >= 2, "Seconda conferma da un professionista collegato (" + Math.min(st.conferme_valide, 2) + "/2)");
  let msg = "";
  if(liv === "provvisorio"){
    msg = !dati ? "Completa nome, razza e data di nascita per poter confermare."
      : (!st.io_ho_confermato ? "Controlla i dati e confermali. Con la conferma di un professionista il codice diventa definitivo."
      : "Tua conferma data. Manca la conferma di un professionista collegato (maniscalco, istruttore o scuderia).");
  } else if(liv === "validato"){
    msg = "Codice definitivo" + (st.codice_definitivo ? ": " + st.codice_definitivo : "") + ". Se cambi nome, razza o data di nascita, le conferme vanno rinnovate.";
  } else {
    msg = "Microchip verificato: il cavallo è Certificato.";
  }
  const btn = (dati && !st.io_ho_confermato)
    ? `<button class="btn btn-primary" style="width:100%;margin-top:8px" onclick="confermaDatiCavallo('${h.id}')">Confermo i dati</button>`
    : (!dati ? `<button class="btn btn-outline" style="width:100%;margin-top:8px" onclick="openHorseForm('${h.id}')">Completa i dati</button>` : "");
  box.innerHTML = `<div class="card" style="margin-bottom:12px">${testa}${corpo}<div class="muted" style="font-size:12.5px;line-height:1.5;margin-top:8px">${escapeHtml(msg)}</div>${btn}</div>`;
}
async function confermaDatiCavallo(id){
  const { data, error } = await sb.rpc("equo_conferma_cavallo", { p_horse: id });
  if(error || !data?.ok){ showToast(data?.motivo === "dati_incompleti" ? "Completa nome, razza e data di nascita." : "Conferma non riuscita. Riprova."); return; }
  showToast(data.livello === "validato" ? "Codice definitivo assegnato: " + (data.codice_definitivo || "") : "Conferma registrata.");
  await loadHorses();
  if(horses.some(h => h.id === id)) openHorseDetail(id);
}

/* professionista: cavalli da confermare (home maniscalco) */
let confermePro = [], confermeProTs = 0, confermeProBox = "hm-conferme";
// idBox: "hm-conferme" (Home maniscalco) o "tr-conferme" (Home allenatore)
async function caricaConfermePro(force, idBox){
  if(idBox) confermeProBox = idBox;
  const box = document.getElementById(confermeProBox);
  if(!box || DEMO_MODE) return;
  if(!force && Date.now() - confermeProTs < 60000) return;
  confermeProTs = Date.now();
  try{
    const { data, error } = await sb.rpc("equo_cavalli_da_confermare");
    confermePro = (!error && Array.isArray(data)) ? data : [];
  } catch(e){ confermePro = []; }
  if(!confermePro.length){ box.innerHTML = ""; return; }
  const righe = confermePro.map((c, i) => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;border-top:1px solid var(--border,#DDE5E0)">
      <div style="min-width:0"><div style="font-weight:600">${escapeHtml(c.nome || "")}</div>
        <div class="muted" style="font-size:12px">${escapeHtml(c.codice || "")}${c.motivo === "dati_modificati" ? " · dati cambiati, riconferma" : ""}</div></div>
      <button class="btn btn-primary btn-sm" onclick="confermaCavalloPro(${i})">Confermo</button>
    </div>`).join("");
  box.innerHTML = `<div class="card" style="margin:0 0 14px">
    <div class="section-title" style="margin-bottom:2px">Da confermare (${confermePro.length})</div>
    <div class="muted" style="font-size:12.5px;line-height:1.5;margin-bottom:4px">Conferma che nome, razza e data di nascita sono giusti: serve la tua conferma, con quella del proprietario, per il codice definitivo.</div>
    ${righe}</div>`;
}
async function confermaCavalloPro(i){
  const c = confermePro[i];
  if(!c) return;
  const { data, error } = await sb.rpc("equo_conferma_cavallo", { p_horse: c.horse_id || null, p_scuderia_cavallo: c.scuderia_cavallo_id || null });
  if(error || !data?.ok){ showToast("Conferma non riuscita. Riprova."); return; }
  showToast(data.livello === "validato" ? "Confermato: codice definitivo " + (data.codice_definitivo || "") : "Conferma registrata.");
  caricaConfermePro(true);
}

/* maniscalco: proponi i cavalli al proprietario collegato */
async function renderProposteCliente(c){
  const box = document.getElementById("cliente-proposte-box");
  if(!box) return;
  box.innerHTML = "";
  if(DEMO_MODE || !c || !c.cliente_user_id || isStruttura(c)) return;
  let lista = [];
  try{ const { data } = await sb.rpc("equo_proposte_inviate", { p_cliente: c.id }); lista = Array.isArray(data) ? data : []; } catch(e){}
  if(currentClienteId !== c.id) return;
  const n = s => lista.filter(p => p.stato === s).length;
  const riga = lista.length ? `In attesa: ${n("in_attesa")} · accettati: ${n("accettata")} · rifiutati: ${n("rifiutata")}` : "Nessun cavallo ancora proposto.";
  box.innerHTML = `<div class="card" style="margin:0 0 12px"><div style="font-weight:600;margin-bottom:2px">Cavalli proposti al proprietario</div>
    <div class="muted" style="font-size:12.5px;line-height:1.5;margin-bottom:8px">${riga}</div>
    <button class="btn btn-outline btn-sm" onclick="proponiCavalliCliente('${c.id}')">Proponi i cavalli al proprietario</button></div>`;
}
async function proponiCavalliCliente(clienteId){
  const { data, error } = await sb.rpc("equo_proponi_cavalli_cliente", { p_cliente: clienteId });
  if(error || !data?.ok){ showToast(data?.motivo === "cliente_non_collegato" ? "Il cliente non ha ancora collegato l'app." : "Operazione non riuscita."); return; }
  showToast(data.proposti ? data.proposti + (data.proposti === 1 ? " cavallo proposto." : " cavalli proposti.") : "Niente di nuovo da proporre.");
  const c = clientiMascalcia.find(x => x.id === clienteId);
  if(c) renderProposteCliente(c);
}



export { caricaReferenzeDaScrivere, inviaReferenza, caricaRichiesteLasciati, rispondiLasciato, accettaProposta, accettaTuttiProposte, caricaCavalliBloccati, caricaConfermePro, caricaProposteCavalli, cavalliBloccati, cavalliUsabili, confermaCavalloPro, confermaDatiCavallo, proponiCavalliCliente, renderHorseBloccato, renderLivelloCavallo, renderProposteCliente, rifiutaProposta };
