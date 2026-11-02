// Equo App · veterinario · PIANO TERAPEUTICO (2/11/2026, passo 5 del piano di Simone · SQL 34)
// Nella scheda della visita: voci del piano (farmaco con dose scritta dal veterinario, via, orari, giorni; cure, esercizi, riposo),
// tempo di attesa per i cavalli DPA («fino a quando»), conferme del proprietario (accese di base per le terapie oltre 7 giorni).
// «Avvia e manda»: il proprietario su Equo lo vede in Home e nella scheda del cavallo, riceve il promemoria all'ora giusta
// (funzione invia-terapie) e, se richiesto, conferma con «Fatto». Senza proprietario su Equo il piano va solo nel referto.
// Sospendi · Riprendi · Chiudi: il proprietario riceve l'avviso in chat. Saltata = non confermata dopo 12 ore.
// Home del veterinario: «Terapie in corso» (fatte e saltate); Clienti: filtro «In terapia».

import { VS, vsSalvaSubito, vsTesta, vsNomeCavallo, vsMostraScheda, vsFoglio, vsChiudi, vsApriDaEvento } from "./07-scheda-visita.js";

const ptEsc = s => escapeHtml(s == null ? "" : String(s));
const PT = { piano: null, caricato: false, voce: null, inCorso: null, promessa: null, giro: 0 };
const PT_TIPI = [["farmaco", "Farmaco"], ["cura", "Cura"], ["esercizio", "Esercizio"], ["riposo", "Riposo"], ["altro", "Altro"]];
const PT_VIE = ["Bocca", "Intramuscolo", "Endovena", "Sottocute", "Locale", "Occhio", "Inalazione"];
const PT_ORARI = { 1: ["08:00"], 2: ["08:00", "20:00"], 3: ["08:00", "14:00", "20:00"], 4: ["08:00", "12:00", "16:00", "20:00"] };
const PT_STATO = { bozza: "Bozza: non ancora mandato", attivo: "In corso", sospeso: "Sospeso", concluso: "Concluso" };
const ptData = iso => iso ? new Date(iso + "T12:00").toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : "";
const ptDataBreve = iso => iso ? new Date(iso + "T12:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "";

/* ---------------- dati ---------------- */
function ptReset(){ PT.piano = null; PT.caricato = false; PT.voce = null; }
async function ptCarica(){
  const v = VS.visita; ptReset(); const giro = PT.giroCarica = (PT.giroCarica || 0) + 1;
  const piano = v?.id ? await DB.pianoDiVisita(v.id) : null;
  if(giro !== PT.giroCarica) return;   // nel frattempo si è aperta un'altra scheda
  PT.piano = piano; PT.caricato = true; ptDisegna();
}
function ptVoci(){ return PT.piano?.voci || []; }
// fine del tempo di attesa (DPA): ultimo giorno della voce + giorni di attesa, la più lontana
function ptAttesaFino(voci){
  let fino = null;
  (voci || ptVoci()).forEach(v => { if(v.tipo !== "farmaco" || !(v.attesa_giorni > 0)) return;
    const d = new Date(fineVoceTerapia(v) + "T12:00"); d.setDate(d.getDate() + Number(v.attesa_giorni)); const iso = isoLocale(d); if(!fino || iso > fino) fino = iso; });
  return fino;
}
function ptPeriodo(voci){
  const l = voci || ptVoci(); if(!l.length) return null;
  return { dal: l.map(v => v.inizio).sort()[0], al: l.map(fineVoceTerapia).sort().slice(-1)[0] };
}
// proprietario su Equo (stesso criterio del referto)
function ptProprietario(){
  try{ return (vrDestinatari() || []).find(x => x.k === "prop" && x.suEquo) || null; }catch(_){ return null; }
}
async function ptAssicuraPiano(){
  if(PT.piano?.id) return PT.piano;
  await vsSalvaSubito(true);
  const v = VS.visita, e = VS.e; if(!v?.id) throw new Error("scheda non salvata");
  const cav = (typeof cavalliCartella === "function" ? cavalliCartella() : []).find(x => x.id === (v.cavallo_cliente_id || e?.cavallo_cliente_id)) || {};
  const { data, error } = await DB.salvaPiano({ visita_id: v.id, cliente_id: v.cliente_id || e?.cliente_mascalcia_id || null,
    cavallo_cliente_id: v.cavallo_cliente_id || e?.cavallo_cliente_id || null, horse_id: v.horse_id || e?.horse_id || cav.horse_id || null,
    cavallo_nome: vsNomeCavallo(e) || cav.nome || null, stato: "bozza", chiedi_conferme: false });
  if(error) throw new Error(DB._terSql(error) ? "Il piano terapeutico non è ancora attivo: manca l'aggiornamento del database (SQL 34)." : error.message);
  PT.piano = { ...data, voci: [] };
  return PT.piano;
}
// salva i campi del piano che derivano dalle voci (attesa, conferme di base) e rifà le somministrazioni se è attivo
async function ptAggiornaPiano(extra){
  const p = PT.piano; if(!p?.id) return;
  const campi = { id: p.id, attesa_fino: ptAttesaFino(), ...(extra || {}) };
  // conferme: accese di base se una voce dura più di 7 giorni (finché il veterinario non le tocca)
  if(!p._confermeToccate && !("chiedi_conferme" in campi) && ptVoci().some(v => (v.giorni || 1) > 7 && (v.orari || []).length)) campi.chiedi_conferme = true;
  const { data, error } = await DB.salvaPiano(campi);
  if(error) throw new Error(error.message);
  Object.assign(p, data || campi);
  if(p.stato === "attivo" || "stato" in (extra || {})) await DB.generaSomministrazioni(p.id);
  PT.inCorso = null;   // l'elenco delle terapie in corso si ricarica
}

/* ---------------- sezione nella scheda ---------------- */
function ptSezioneHtml(){ return '<section class="vs-sez pt-sez" id="pt-box"><h3>Piano terapeutico</h3><div class="vs-nota">Carico…</div></section>'; }
function ptRiga(v, i){
  const ic = { farmaco: "💊", cura: "🩹", esercizio: "🐴", riposo: "🛏", altro: "•" }[v.tipo] || "•";
  const att = v.tipo === "farmaco" && v.attesa_giorni > 0 ? ` · attesa ${v.attesa_giorni} giorni` : "";
  return `<button type="button" class="pt-voce" onclick="ptModificaVoce(${i})"><span class="ic" aria-hidden="true">${ic}</span>
    <span class="c"><b>${ptEsc(v.nome)}${v.dose ? " · " + ptEsc(v.dose) : ""}${v.via ? " · " + ptEsc(v.via.toLowerCase()) : ""}</b>
    <small>${ptEsc(testoVoceTerapia(v))}${ptEsc(att)}</small>${v.note ? `<small>${ptEsc(v.note)}</small>` : ""}</span><span class="fr">›</span></button>`;
}
async function ptAndamento(){
  const p = PT.piano; if(!p?.id || p.stato === "bozza") return "";
  const x = ((await ptCaricaInCorso()).piani || []).find(t => t.id === p.id); if(!x) return "";
  const ora = Date.now(), passate = x.somm.filter(s => new Date(s.previsto_il).getTime() <= ora);
  const fatte = passate.filter(s => s.fatto_il).length, saltate = passate.filter(s => statoSomministrazione(s, ora) === "saltata").length;
  const prossima = x.somm.find(s => !s.fatto_il && new Date(s.previsto_il).getTime() > ora);
  return [p.chiedi_conferme ? `${fatte} ${fatte === 1 ? "fatta" : "fatte"}` : "", p.chiedi_conferme && saltate ? `<b class="pt-saltate">${saltate} ${saltate === 1 ? "saltata" : "saltate"}</b>` : "",
    prossima ? "prossima " + new Date(prossima.previsto_il).toLocaleString("it-IT", { weekday: "short", hour: "2-digit", minute: "2-digit" }) : ""].filter(Boolean).join(" · ");
}
async function ptDisegna(){
  const box = document.getElementById("pt-box"); if(!box || VS.schermo !== "scheda") return;
  if(!PT.caricato){ box.innerHTML = '<h3>Piano terapeutico</h3><div class="vs-nota">Carico…</div>'; return; }
  const p = PT.piano, voci = ptVoci(), per = ptPeriodo(voci), att = ptAttesaFino(voci), prop = ptProprietario();
  const stato = p?.stato || "bozza", chiuso = stato === "concluso";
  const giro = ++PT.giro;
  const andamento = await ptAndamento();
  if(giro !== PT.giro || VS.schermo !== "scheda" || !document.getElementById("pt-box")) return;
  const azioni = !voci.length ? "" : stato === "bozza"
      ? `<button type="button" class="vs-btn pri" onclick="ptAvvia()">${prop ? "Avvia e manda a " + ptEsc(prop.nome) : "Avvia il piano"}</button>`
    : stato === "attivo" ? `<div class="pt-azioni"><button type="button" class="vs-btn" onclick="ptCambiaStato('sospeso')">Sospendi</button><button type="button" class="vs-btn" onclick="ptCambiaStato('concluso')">Chiudi il piano</button></div>`
    : stato === "sospeso" ? `<div class="pt-azioni"><button type="button" class="vs-btn pri" onclick="ptCambiaStato('attivo')">Riprendi</button><button type="button" class="vs-btn" onclick="ptCambiaStato('concluso')">Chiudi il piano</button></div>` : "";
  box.innerHTML = `<h3>Piano terapeutico${p ? ` <span class="pt-stato ${stato}">${ptEsc(PT_STATO[stato])}</span>` : ""}</h3>
    ${per ? `<div class="pt-periodo">Dal ${ptEsc(ptDataBreve(per.dal))} al ${ptEsc(ptDataBreve(per.al))}${andamento ? " · " + andamento : ""}</div>` : ""}
    ${att ? `<div class="pt-attesa">Cavallo DPA · fine del tempo di attesa: <b>${ptEsc(ptData(att))}</b></div>` : ""}
    ${voci.map(ptRiga).join("")}
    ${chiuso ? "" : `<div class="pt-aggiungi"><button type="button" class="vs-chip" onclick="ptNuovaVoce('farmaco')">+ Farmaco</button><button type="button" class="vs-chip" onclick="ptNuovaVoce('cura')">+ Cura o esercizio</button></div>`}
    ${voci.length && !chiuso ? `<label class="pt-conferme"><input type="checkbox" ${p?.chiedi_conferme ? "checked" : ""} onchange="ptConferme(this.checked)">
      <span><b>Chiedi al proprietario di confermare</b><small>Tocca «Fatto» a ogni somministrazione; dopo 12 ore senza conferma è «saltata».</small></span></label>` : ""}
    ${voci.length && !prop && !chiuso ? '<div class="vs-nota">Il proprietario non usa Equo: il piano va nel referto (PDF o «Condividi»), senza promemoria.</div>' : ""}
    ${!voci.length ? '<div class="vs-nota">Aggiungi i farmaci con dose, orari e giorni, oppure cure ed esercizi. La dose la scrivi tu: Equo non la calcola.</div>' : ""}
    ${azioni}`;
}

/* ---------------- voce: nuova / modifica ---------------- */
function ptNuovaVoce(tipo){
  const oggi = isoLocale(new Date());
  PT.voce = { tipo, nome: "", dose: "", via: tipo === "farmaco" ? "" : null, orari: tipo === "farmaco" ? PT_ORARI[1].slice() : [], ogni_giorni: 1, giorni: tipo === "farmaco" ? 5 : 7,
    inizio: oggi, attesa_giorni: null, note: "" };
  ptMostraVoce();
}
function ptModificaVoce(i){ const v = ptVoci()[i]; if(!v || PT.piano?.stato === "concluso") return; PT.voce = JSON.parse(JSON.stringify(v)); ptMostraVoce(); }
function ptMostraVoce(){
  VS.schermo = "piano-voce";
  const v = PT.voce, f = v.tipo === "farmaco", n = (v.orari || []).length;
  vsTesta(v.id ? "Modifica la voce" : f ? "Nuovo farmaco" : "Nuova cura o esercizio", vsNomeCavallo(VS.e) || "Piano terapeutico");
  const chip = (on, az, t) => `<button type="button" class="vs-chip${on ? " on" : ""}" aria-pressed="${!!on}" onclick="${az}">${ptEsc(t)}</button>`;
  document.getElementById("vs-corpo").innerHTML = `
    <div class="vs-campo pieno"><span class="vs-lab">Tipo</span><div class="vs-chips">${PT_TIPI.map(([k, t]) => chip(v.tipo === k, `ptCampo('tipo','${k}')`, t)).join("")}</div></div>
    <div class="vs-campo pieno"><label for="pt-nome">${f ? "Farmaco (nome commerciale o principio attivo)" : "Cosa fare"}</label><input id="pt-nome" maxlength="120" value="${ptEsc(v.nome)}" placeholder="${f ? "es. fenilbutazone" : "es. impacco al piede, passeggio a mano 10 minuti"}" oninput="PT.voce.nome=this.value"></div>
    ${f ? `<div class="vs-campo pieno"><label for="pt-dose">Dose</label><input id="pt-dose" maxlength="120" value="${ptEsc(v.dose || "")}" placeholder="come la scrivi in ricetta, es. 1 bustina" oninput="PT.voce.dose=this.value"></div>
    <div class="vs-campo pieno"><span class="vs-lab">Via</span><div class="vs-chips">${PT_VIE.map(t => chip(v.via === t, `ptCampo('via',${ptEsc(JSON.stringify(t))})`, t)).join("")}</div></div>` : ""}
    <div class="vs-campo pieno"><span class="vs-lab">Quante volte</span><div class="vs-chips">${[1, 2, 3, 4].map(k => chip(n === k, `ptVolte(${k})`, k === 1 ? "1 volta" : k + " volte")).join("")}${chip(n === 0, "ptVolte(0)", f ? "Al bisogno" : "Senza orario")}</div></div>
    ${n ? `<div class="vs-campo pieno"><span class="vs-lab">Orari</span><div class="pt-orari">${v.orari.map((o, i) => `<input type="time" value="${ptEsc(o)}" aria-label="Orario ${i + 1}" onchange="ptOrario(${i}, this.value)">`).join("")}</div></div>
    <div class="vs-campo pieno"><span class="vs-lab">Ogni quanto</span><div class="vs-chips">${[[1, "Ogni giorno"], [2, "A giorni alterni"], [7, "Una volta a settimana"]].map(([k, t]) => chip(v.ogni_giorni === k, `ptCampo('ogni_giorni',${k})`, t)).join("")}</div></div>` : ""}
    <div class="vs-campo"><label for="pt-giorni">Per quanti giorni</label><input id="pt-giorni" type="number" inputmode="numeric" min="1" max="365" value="${ptEsc(v.giorni)}" oninput="PT.voce.giorni=Math.max(1,Math.min(365,parseInt(this.value,10)||1))"></div>
    <div class="vs-campo"><label for="pt-inizio">Dal</label><input id="pt-inizio" type="date" value="${ptEsc(v.inizio)}" onchange="PT.voce.inizio=this.value||PT.voce.inizio"></div>
    <div class="vs-campo pieno"><div class="vs-chips">${[3, 5, 7, 10, 14, 30].map(g => chip(v.giorni === g, `ptCampo('giorni',${g})`, g + " giorni")).join("")}</div></div>
    ${f ? `<div class="vs-campo pieno"><label for="pt-attesa">Tempo di attesa per cavallo DPA (giorni)</label><input id="pt-attesa" type="number" inputmode="numeric" min="0" max="400" value="${ptEsc(v.attesa_giorni ?? "")}" placeholder="vuoto se non DPA" oninput="PT.voce.attesa_giorni=this.value===''?null:Math.max(0,Math.min(400,parseInt(this.value,10)||0))"></div>` : ""}
    <div class="vs-campo pieno"><label for="pt-note">Note per il proprietario</label><input id="pt-note" maxlength="300" value="${ptEsc(v.note || "")}" placeholder="es. dopo il pasto" oninput="PT.voce.note=this.value"></div>
    <div class="vs-nota">La dose la scrivi tu e la controlli sull'RCP del prodotto: Equo non calcola dosi.</div>`;
  document.getElementById("vs-piede").innerHTML = (v.id ? '<button class="vs-btn" onclick="ptEliminaVoce()">Elimina</button>' : '<button class="vs-btn" onclick="ptTornaScheda()">Annulla</button>')
    + '<button class="vs-btn pri" onclick="ptSalvaVoce()">Salva</button>';
}
function ptLeggiCampi(){
  const v = PT.voce; if(!v) return;
  const val = id => document.getElementById(id)?.value;
  if(val("pt-nome") != null) v.nome = val("pt-nome");
  if(val("pt-dose") != null) v.dose = val("pt-dose");
  if(val("pt-note") != null) v.note = val("pt-note");
}
function ptCampo(k, val){
  ptLeggiCampi(); const v = PT.voce;
  if(k === "tipo"){ v.tipo = val; if(val !== "farmaco"){ v.via = null; v.dose = ""; v.attesa_giorni = null; } }
  else v[k] = k === "via" && v.via === val ? null : val;
  const s = document.getElementById("vs-corpo").scrollTop; ptMostraVoce(); document.getElementById("vs-corpo").scrollTop = s;
}
function ptVolte(n){ ptLeggiCampi(); PT.voce.orari = n ? (PT_ORARI[n] || []).slice() : []; const s = document.getElementById("vs-corpo").scrollTop; ptMostraVoce(); document.getElementById("vs-corpo").scrollTop = s; }
function ptOrario(i, val){ if(/^\d\d:\d\d$/.test(val)) PT.voce.orari[i] = val; }
function ptTornaScheda(){ PT.voce = null; vsMostraScheda(); }
async function ptSalvaVoce(){
  ptLeggiCampi(); const v = PT.voce;
  v.nome = String(v.nome || "").trim(); v.dose = String(v.dose || "").trim() || null; v.note = String(v.note || "").trim() || null;
  if(!v.nome) return showToast(v.tipo === "farmaco" ? "Scrivi il nome del farmaco" : "Scrivi cosa fare");
  v.orari = [...new Set((v.orari || []).filter(o => /^\d\d:\d\d$/.test(o)))].sort();
  try{
    const p = await ptAssicuraPiano();
    const { voci, ...riga } = { ...v, piano_id: p.id, ordine: v.id ? v.ordine : ptVoci().length };
    const { data, error } = await DB.salvaVoceTerapia(riga);
    if(error) throw new Error(error.message);
    const i = p.voci.findIndex(x => x.id === data.id); if(i >= 0) p.voci[i] = data; else p.voci.push(data);
    await ptAggiornaPiano();
    if(p.stato === "attivo") await ptAvvisaProprietario("aggiornato");
    PT.voce = null; vsMostraScheda(); showToast(p.stato === "attivo" ? "Piano aggiornato" : "Aggiunto al piano");
  }catch(err){ showToast(err.message || "Non salvato"); }
}
async function ptEliminaVoce(){
  const v = PT.voce; if(!v?.id) return ptTornaScheda();
  if(typeof chiediSiNo === "function" && !(await chiediSiNo("Togli dal piano?", v.nome))) return;
  const { error } = await DB.eliminaVoceTerapia(v.id); if(error) return showToast("Non eliminato: " + error.message);
  PT.piano.voci = ptVoci().filter(x => x.id !== v.id);
  try{ await ptAggiornaPiano(); if(PT.piano.stato === "attivo") await ptAvvisaProprietario("aggiornato"); }catch(err){ showToast(err.message); }
  ptTornaScheda();
}
async function ptConferme(on){
  if(!PT.piano) return; PT.piano._confermeToccate = true;
  try{ await ptAggiornaPiano({ chiedi_conferme: !!on }); }catch(err){ showToast(err.message); }
}

/* ---------------- avvio, sospensione, chiusura ---------------- */
function ptRiassunto(){
  const voci = ptVoci(), per = ptPeriodo(voci), att = ptAttesaFino(voci);
  return voci.map(v => "• " + v.nome + (v.dose ? " " + v.dose : "") + (v.via ? " (" + v.via.toLowerCase() + ")" : "") + ": " + testoVoceTerapia(v)).join("\n")
    + (per ? `\nDal ${ptDataBreve(per.dal)} al ${ptDataBreve(per.al)}.` : "") + (att ? `\nCavallo DPA: tempo di attesa fino al ${ptData(att)}.` : "");
}
async function ptAvvisaProprietario(cosa){
  const prop = ptProprietario(); if(!prop) return false;
  const cav = PT.piano?.cavallo_nome || vsNomeCavallo(VS.e) || "il cavallo";
  const testo = cosa === "avviato" ? `💊 Piano terapeutico di ${cav}\n${ptRiassunto()}\n\nLo trovi in Equo nella Home e nella scheda del cavallo, con i promemoria all'ora giusta.${PT.piano.chiedi_conferme ? " Quando dai la terapia tocca «Fatto»." : ""}`
    : cosa === "aggiornato" ? `💊 Ho aggiornato il piano terapeutico di ${cav}:\n${ptRiassunto()}`
    : cosa === "sospeso" ? `💊 Il piano terapeutico di ${cav} è sospeso: per ora non dare la terapia. Ti avviso quando riprendere.`
    : cosa === "attivo" ? `💊 Il piano terapeutico di ${cav} riprende da oggi:\n${ptRiassunto()}`
    : `💊 Il piano terapeutico di ${cav} è concluso.`;
  const { error } = await DB.insertMessaggioMascalcia({ cliente_mascalcia_id: prop.cliente.id, tipo: "testo", testo });
  if(error){ console.warn("piano, messaggio:", error.message); return false; }
  return true;
}
// «Avvia e manda»: attivo, visibile al proprietario, somministrazioni previste, avviso in chat
async function ptAvvia(conMessaggio = true){
  const p = PT.piano; if(!p?.id || !ptVoci().length) return false;
  try{
    await ptAggiornaPiano({ stato: "attivo", inviato_il: p.inviato_il || new Date().toISOString() });
    const msg = conMessaggio ? await ptAvvisaProprietario("avviato") : false;
    if(conMessaggio) showToast(msg ? "Piano avviato e mandato in chat" : "Piano avviato");
    if(VS.schermo === "scheda") ptDisegna();
    return true;
  }catch(err){ showToast(err.message || "Non avviato"); return false; }
}
// dal referto: se il piano è ancora in bozza parte insieme al referto (il riassunto è già nel PDF)
async function ptAvviaDaReferto(){ if(PT.piano?.stato === "bozza" && ptVoci().length) return ptAvvia(false); return false; }
async function ptCambiaStato(stato){
  const p = PT.piano; if(!p?.id) return;
  if(stato === "concluso" && typeof chiediSiNo === "function" && !(await chiediSiNo("Chiudi il piano?", "Le somministrazioni future non arrivano più al proprietario."))) return;
  try{ await ptAggiornaPiano({ stato }); await ptAvvisaProprietario(stato); showToast(stato === "sospeso" ? "Piano sospeso" : stato === "attivo" ? "Piano ripreso" : "Piano chiuso"); }
  catch(err){ showToast(err.message || "Non riuscito"); }
  vsMostraScheda();
}

/* ---------------- per il referto e per Galeno ---------------- */
// righe per il referto: [[cosa, quando]] + fine attesa
function ptRigheReferto(){
  return ptVoci().map(v => [v.nome + (v.dose ? " · " + v.dose : "") + (v.via ? " · " + v.via.toLowerCase() : ""), testoVoceTerapia(v) + (v.note ? " · " + v.note : "")]);
}
function ptAttesaReferto(){ const a = ptAttesaFino(); return a ? "Cavallo DPA: tempo di attesa fino al " + ptData(a) : ""; }
// voci proposte da Galeno con la dettatura: {tipo, nome, dose, via, volte_giorno, giorni, note}
async function ptAggiungiVoci(lista){
  const oggi = isoLocale(new Date());
  const p = await ptAssicuraPiano();
  for(const x of lista || []){
    const n = Math.max(0, Math.min(4, parseInt(x.volte_giorno, 10) || 0));
    const riga = { piano_id: p.id, ordine: p.voci.length, tipo: PT_TIPI.some(t => t[0] === x.tipo) ? x.tipo : "farmaco", nome: String(x.nome || "").trim().slice(0, 120),
      dose: x.dose ? String(x.dose).slice(0, 120) : null, via: PT_VIE.find(t => t.toLowerCase() === String(x.via || "").toLowerCase()) || (x.via ? String(x.via).slice(0, 40) : null),
      orari: n ? PT_ORARI[n].slice() : [], ogni_giorni: 1, giorni: Math.max(1, Math.min(365, parseInt(x.giorni, 10) || 1)), inizio: oggi, attesa_giorni: null, note: x.note ? String(x.note).slice(0, 300) : null };
    if(!riga.nome) continue;
    const { data, error } = await DB.salvaVoceTerapia(riga); if(error) throw new Error(error.message);
    p.voci.push(data);
  }
  await ptAggiornaPiano();
  if(p.stato === "attivo") await ptAvvisaProprietario("aggiornato");
}

/* ---------------- Home: «Terapie in corso» · Clienti: «In terapia» ---------------- */
// piani del veterinario (attivi e sospesi), tenuti un minuto; una sola lettura alla volta
function ptCaricaInCorso(forza){
  if(PT.promessa) return PT.promessa;
  if(PT.inCorso && !forza && Date.now() - PT.inCorso.il < 60000) return Promise.resolve(PT.inCorso);
  PT.promessa = DB.terapieInCorso({ comePro: true }).catch(() => []).then(piani => { PT.inCorso = { il: Date.now(), piani }; PT.promessa = null; return PT.inCorso; });
  return PT.promessa;
}
function ptConteggi(){
  const l = PT.inCorso?.piani || [], ora = Date.now();
  return { n: l.filter(p => p.stato === "attivo").length, saltate: l.reduce((t, p) => t + (p.chiedi_conferme ? p.somm.filter(s => statoSomministrazione(s, ora) === "saltata").length : 0), 0) };
}
function ptClientiInTerapia(){
  const ids = new Set(), cav = typeof cavalliCartella === "function" ? cavalliCartella() : [];
  (PT.inCorso?.piani || []).forEach(p => { if(p.cliente_id) ids.add(p.cliente_id); const c = cav.find(x => x.id === p.cavallo_cliente_id); if(c) ids.add(c.cliente_mascalcia_id); });
  return ids;
}
// elenco «Terapie in corso» nel foglio della scheda
async function ptElenco(){
  vsFoglio().classList.add("aperto"); document.body.classList.add("vs-aperto");
  VS.schermo = "terapie"; vsTesta("Terapie in corso", "I tuoi piani attivi e sospesi");
  document.getElementById("vs-corpo").innerHTML = '<div class="vs-vuoto">Carico…</div>'; document.getElementById("vs-piede").innerHTML = '<button class="vs-btn" onclick="vsChiudi()">Chiudi</button>';
  const { piani } = await ptCaricaInCorso(true), ora = Date.now();
  document.getElementById("vs-corpo").innerHTML = piani.length ? piani.map(p => {
    const per = ptPeriodo(p.voci), sal = p.chiedi_conferme ? p.somm.filter(s => statoSomministrazione(s, ora) === "saltata").length : 0;
    const fatte = p.somm.filter(s => s.fatto_il).length, ev = p.visite_pro?.intervento_id || (DEMO_MODE ? ptDemoIntervento(p.visita_id) : null);
    return `<button type="button" class="pt-voce" ${ev ? `onclick="ptApriVisita('${ev}')"` : "disabled"}><span class="ic" aria-hidden="true">💊</span><span class="c">
      <b>${ptEsc(p.cavallo_nome || "Cavallo")}${p.stato === "sospeso" ? " · sospeso" : ""}</b><small>${ptEsc(p.voci.map(v => v.nome).join(", "))}</small>
      <small>${per ? "fino al " + ptEsc(ptDataBreve(per.al)) : ""}${p.chiedi_conferme ? ` · ${fatte} fatte` : ""}${sal ? ` · <b class="pt-saltate">${sal} ${sal === 1 ? "saltata" : "saltate"}</b>` : ""}</small></span><span class="fr">›</span></button>`; }).join("")
    : '<div class="vs-nota">Nessuna terapia in corso. Il piano si scrive nella scheda della visita.</div>';
}
function ptDemoIntervento(visitaId){ try{ return (demoState.visitePro?.visite || []).find(v => v.id === visitaId)?.intervento_id || null; }catch(_){ return null; } }
function ptApriVisita(id){ vsApriDaEvento(id); }

export { ptCarica, ptReset, ptSezioneHtml, ptDisegna, ptNuovaVoce, ptModificaVoce, ptCampo, ptVolte, ptOrario, ptTornaScheda, ptSalvaVoce, ptEliminaVoce, ptConferme,
  ptAvvia, ptAvviaDaReferto, ptCambiaStato, ptRigheReferto, ptAttesaReferto, ptAggiungiVoci, ptCaricaInCorso, ptConteggi, ptClientiInTerapia, ptElenco, ptApriVisita,
  ptAttesaFino, ptPeriodo, PT };
