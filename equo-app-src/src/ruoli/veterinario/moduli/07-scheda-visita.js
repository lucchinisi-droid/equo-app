// Equo App · veterinario · SCHEDA DELLA VISITA con i modelli (2/11/2026, passo 1 del piano di Simone)
// Prototipo: ux/prova-veterinario («Che visita fai?», Visita standard, Agopuntura · MTC · Fisioterapia, I miei modelli).
// Dati: visite_pro e modelli_visita (SQL 31), visibili solo al veterinario che le scrive.
// Si apre dalle azioni della visita in Agenda e in Home («Scheda visita»); «Concludi la visita» usa il «Fatto» unico (segnaFatto).
// Referto (passo 2, 08), foto/video (3, 09), dettatura della relazione (4, 10), piano terapeutico (5, 11). Arriva dopo: disegno dei punti sul cavallo.

/* ===================== MODELLI ===================== */
// campo: { k, e: etichetta, t: tipo, s: sezione, o: opzioni, max, ph, tab, attivo }
// tipi: riga · testo · numero · scelta · multi · scala · sino · data
const ARTI = [["ad", "ADx"], ["as", "ASx"], ["pd", "PDx"], ["ps", "PSx"]];
const zoppiaArti = (s, tab) => ARTI.map(([a, n]) => ({ k: "zop_" + a, e: "Zoppia " + n, t: "scala", max: 5, s, tab, rosso: true }));

const CAMPI_STANDARD = [
  { k: "motivo", e: "Motivo della visita", t: "riga", s: "Anamnesi" },
  { k: "anamnesi", e: "Cosa dice il proprietario", t: "testo", s: "Anamnesi", ph: "da quando, com'è cambiato, cosa è stato fatto" },
  { k: "temp", e: "Temperatura °C", t: "numero", s: "Esame obiettivo generale", mezzo: true },
  { k: "fc", e: "FC (bpm)", t: "numero", s: "Esame obiettivo generale", mezzo: true },
  { k: "fr", e: "FR (atti/min)", t: "numero", s: "Esame obiettivo generale", mezzo: true },
  { k: "trc", e: "TRC (s)", t: "numero", s: "Esame obiettivo generale", mezzo: true },
  { k: "mucose", e: "Mucose", t: "scelta", o: ["Rosee", "Pallide", "Iperemiche", "Itteriche", "Cianotiche"], s: "Esame obiettivo generale" },
  { k: "motilita", e: "Motilità intestinale (4 quadranti)", t: "scelta", o: ["Normale", "Ridotta", "Aumentata", "Assente"], s: "Esame obiettivo generale" },
  ...zoppiaArti("Apparato locomotore"),
  { k: "flessione", e: "Test di flessione", t: "riga", s: "Apparato locomotore", ph: "es. positivo distale ASx" },
  { k: "polso", e: "Polso digitale", t: "riga", s: "Apparato locomotore" },
  { k: "diagnosi", e: "Diagnosi / ipotesi", t: "testo", s: "Diagnosi e piano" },
  { k: "cosa_fare", e: "Cosa fare", t: "testo", s: "Diagnosi e piano" },
  { k: "terapia", e: "Terapia", t: "testo", s: "Diagnosi e piano", ph: "farmaci, cure, esercizi" },
  { k: "ricontrollo", e: "Ricontrollo", t: "data", s: "Diagnosi e piano" },
  { k: "rev", e: "N. ricetta REV", t: "riga", s: "Diagnosi e piano", mezzo: true },
  { k: "dpa", e: "Stato del cavallo", t: "scelta", o: ["DPA", "Non DPA", "Da verificare"], s: "Diagnosi e piano" },
  { k: "sospensione", e: "Tempo di sospensione da annotare", t: "riga", s: "Diagnosi e piano", ph: "per i farmaci prescritti a un cavallo DPA" }
];

const PUNTI_DIAGNOSTICI = [["GV20", "Bai-hui"], ["BL13", "Shu Polmone"], ["BL15", "Shu Cuore"], ["BL18", "Shu Fegato"], ["BL20", "Shu Milza"], ["BL23", "Shu Rene"],
  ["BL25", "Shu Grosso intestino"], ["GB21", "Base del collo"], ["SI9", "Spalla"], ["GB34", "Grassella"], ["ST36", "Sotto la grassella"], ["C", "Cervicale"]];
const ZONE_PALPAZIONE = ["Nuca / atlante", "Collo (brachiocefalico)", "Trapezio", "Dorso (longissimo) sx", "Dorso (longissimo) dx", "Lombi", "Glutei", "Ischiotibiali"];
const TAB_MTC = [["mtc", "Valutazione MTC"], ["fisio", "Fisioterapia"], ["tratt", "Trattamento"]];
const CAMPI_MTC = [
  { k: "motivo", e: "Motivo della seduta", t: "riga", s: "Seduta", tab: "mtc" },
  { k: "cost", e: "Costituzione (5 elementi)", t: "scelta", o: ["Legno", "Fuoco", "Terra", "Metallo", "Acqua"], s: "Costituzione e Shen", tab: "mtc" },
  { k: "shen", e: "Shen (spirito)", t: "scelta", o: ["Calmo", "Vigile", "Ansioso", "Spento", "Aggressivo"], s: "Costituzione e Shen", tab: "mtc" },
  { k: "lingua", e: "Colore", t: "scelta", o: ["Rosa", "Pallida", "Rossa", "Viola"], s: "Lingua", tab: "mtc" },
  { k: "patina", e: "Patina", t: "scelta", o: ["Assente", "Sottile", "Spessa", "Gialla"], s: "Lingua", tab: "mtc" },
  { k: "umidita", e: "Umidità", t: "scelta", o: ["Secca", "Normale", "Umida"], s: "Lingua", tab: "mtc" },
  { k: "forma", e: "Forma", t: "multi", o: ["Gonfia", "Segni dei denti", "Fessure"], s: "Lingua", tab: "mtc" },
  { k: "polso_sx", e: "Polso sinistro", t: "riga", s: "Polso", tab: "mtc", ph: "profondità, forza, frequenza" },
  { k: "polso_dx", e: "Polso destro", t: "riga", s: "Polso", tab: "mtc", ph: "profondità, forza, frequenza" },
  { k: "polso_q", e: "Qualità del polso", t: "multi", o: ["Scivoloso", "A corda", "Sottile", "Irregolare"], s: "Polso", tab: "mtc" },
  ...PUNTI_DIAGNOSTICI.map(([p, n]) => ({ k: "scan_" + p, e: p + " · " + n, t: "scala", max: 3, s: "Scansione dei punti diagnostici (reattività 0–3)", tab: "mtc", rosso: true })),
  { k: "pr_yy", e: "Yin / Yang", t: "scelta", o: ["Yin", "Yang"], s: "Otto principi e sindrome", tab: "mtc" },
  { k: "pr_ie", e: "Interno / Esterno", t: "scelta", o: ["Interno", "Esterno"], s: "Otto principi e sindrome", tab: "mtc" },
  { k: "pr_fc", e: "Freddo / Calore", t: "scelta", o: ["Freddo", "Calore"], s: "Otto principi e sindrome", tab: "mtc" },
  { k: "pr_vp", e: "Vuoto / Pieno", t: "scelta", o: ["Vuoto", "Pieno"], s: "Otto principi e sindrome", tab: "mtc" },
  { k: "sindrome", e: "Sindrome", t: "riga", s: "Otto principi e sindrome", tab: "mtc", ph: "es. Stasi di Qi del Fegato" },
  ...zoppiaArti("Zoppia (AAEP 0–5)", "fisio"),
  { k: "postura", e: "Postura e appiombi", t: "multi", o: ["Appiombi regolari", "Carico avanti", "Sotto di sé dietro", "Collo invertito", "Dorso rigido"], s: "Postura e appiombi", tab: "fisio" },
  ...ZONE_PALPAZIONE.map((z, i) => ({ k: "palp_" + i, e: z, t: "scala", max: 3, s: "Palpazione muscolare (dolore 0–3)", tab: "fisio", rosso: true })),
  { k: "collo", e: "Collo (flessione laterale con la carota)", t: "scelta", o: ["Normale", "Ridotta a sx", "Ridotta a dx", "Ridotta entrambi"], s: "Mobilità e test", tab: "fisio" },
  { k: "riflessi", e: "Riflessi dorsali", t: "scelta", o: ["Normali", "Ridotti", "Dolorosi"], s: "Mobilità e test", tab: "fisio" },
  { k: "sella", e: "Sella", t: "scelta", o: ["Ok", "Da controllare", "Non adatta"], s: "Mobilità e test", tab: "fisio" },
  { k: "tecnica", e: "Tecnica", t: "multi", o: ["Ago secco", "Elettroagopuntura", "Acquapuntura", "Moxa", "Laserpuntura", "Tui-na"], s: "Agopuntura", tab: "tratt" },
  { k: "hz", e: "Frequenza (Hz)", t: "numero", s: "Agopuntura", tab: "tratt", mezzo: true, se: d => (d.tecnica || []).includes("Elettroagopuntura") },
  { k: "minuti", e: "Durata (min)", t: "numero", s: "Agopuntura", tab: "tratt", mezzo: true, se: d => (d.tecnica || []).includes("Elettroagopuntura") },
  { k: "punti", e: "Punti trattati", t: "multi", o: ["GV20", "BL18", "BL23", "BL25", "GB21", "GB34", "ST36", "SP6", "LI4", "KID1"], s: "Agopuntura", tab: "tratt" },
  { k: "punti_altri", e: "Altri punti", t: "riga", s: "Agopuntura", tab: "tratt" },
  { k: "fito", e: "Fitoterapia / formula", t: "riga", s: "Agopuntura", tab: "tratt", ph: "es. formula e durata" },
  { k: "alimenti", e: "Consigli alimentari (MTC)", t: "riga", s: "Agopuntura", tab: "tratt", ph: "es. alimenti tiepidi, meno concentrati" },
  { k: "fisio_t", e: "Tecniche di fisioterapia", t: "multi", o: ["Massaggio", "Stretching passivo", "Mobilizzazioni", "Linfodrenaggio", "Laser", "TENS", "Ultrasuoni", "Magnetoterapia", "Kinesio taping"], s: "Fisioterapia", tab: "tratt" },
  { k: "risposta", e: "Risposta al trattamento", t: "multi", o: ["Rilassamento", "Sbadigli", "Masticazione", "Sonnolenza", "Reattivo / agitato"], s: "Risposta al trattamento", tab: "tratt" },
  { k: "esercizi", e: "Esercizi a casa", t: "testo", s: "Esercizi a casa", tab: "tratt", ph: "es. stretching con la carota, 3 per lato, mattina e sera, 14 giorni" },
  { k: "prossima", e: "Prossima seduta", t: "scelta", o: ["1 settimana", "2 settimane", "3 settimane", "4 settimane"], s: "Prossima seduta", tab: "tratt" }
];

// esempi già pronti per «I miei modelli» (prototipo: Controllo zoppia · Pre-acquisto · Dentale · Vaccinazione): si copiano e si cambiano
const STD = k => ({ ...CAMPI_STANDARD.find(c => c.k === k) });
const ESEMPI_MODELLI = [
  { nome: "Controllo zoppia", base: "standard", campi: [STD("motivo"), STD("anamnesi"), ...zoppiaArti("Apparato locomotore"),
    { k: "flessione", e: "Test di flessione", t: "scelta", o: ["Negativo", "Positivo distale", "Positivo prossimale", "Dubbio"], s: "Apparato locomotore" },
    STD("polso"), { k: "blocchi", e: "Blocchi anestetici", t: "testo", s: "Apparato locomotore", attivo: false },
    STD("diagnosi"), STD("terapia"), STD("ricontrollo")] },
  { nome: "Pre-acquisto", base: "standard", campi: [
    { k: "committente", e: "Per conto di", t: "riga", s: "Visita" }, STD("motivo"), STD("temp"), STD("fc"), STD("fr"), STD("mucose"),
    { k: "auscultazione", e: "Cuore e polmoni", t: "testo", s: "Esame generale" }, { k: "occhi", e: "Occhi", t: "testo", s: "Esame generale" },
    ...zoppiaArti("Apparato locomotore"), { k: "flessioni", e: "Test di flessione", t: "testo", s: "Apparato locomotore" },
    { k: "esami", e: "Esami eseguiti o richiesti", t: "multi", o: ["Radiografie", "Ecografie", "Endoscopia", "Esami del sangue", "Antidoping"], s: "Esami" },
    { k: "conclusioni", e: "Conclusioni", t: "testo", s: "Conclusioni" }] },
  { nome: "Dentale", base: "standard", campi: [STD("motivo"), STD("anamnesi"),
    { k: "sedazione", e: "Sedazione", t: "sino", s: "Visita" }, { k: "reperti", e: "Reperti dentali", t: "testo", s: "Visita" },
    { k: "trattamento", e: "Trattamento", t: "testo", s: "Visita" }, STD("ricontrollo")] },
  { nome: "Vaccinazione", base: "standard", campi: [
    { k: "vaccini", e: "Vaccini", t: "multi", o: ["Influenza", "Tetano", "Rinopolmonite (EHV)", "West Nile"], s: "Vaccinazione" },
    { k: "prodotto", e: "Prodotto e lotto", t: "riga", s: "Vaccinazione" },
    { k: "passaporto", e: "Registrato sul passaporto", t: "sino", s: "Vaccinazione" },
    { k: "richiamo", e: "Prossimo richiamo", t: "data", s: "Vaccinazione" }] }
];
const TIPI_CAMPO = [["riga", "Testo breve"], ["testo", "Testo lungo"], ["numero", "Numero"], ["scelta", "Scelta"], ["multi", "Scelta multipla"],
  ["scala", "Scala 0–5"], ["scala3", "Scala 0–3"], ["sino", "Sì / No"], ["data", "Data"]];
const NOME_TIPO = Object.fromEntries(TIPI_CAMPO);

/* ===================== DATI ===================== */
const vsEsc = s => escapeHtml(s == null ? "" : String(s));
const vsSqlMancante = e => /visite_pro|modelli_visita|does not exist|schema cache/i.test(e?.message || "");
const VsDB = {
  demo(){ return (demoState.visitePro = demoState.visitePro || { visite: [], modelli: [] }); },
  async visitaDiEvento(id){
    if(DEMO_MODE) return this.demo().visite.find(v => v.intervento_id === id) || null;
    const { data, error } = await sb.from("visite_pro").select("*").eq("intervento_id", id).maybeSingle();
    if(error){ if(!vsSqlMancante(error)) console.warn("visite_pro", error.message); return null; }
    return data;
  },
  async visiteCavallo(cavId, horseId){
    if(DEMO_MODE) return this.demo().visite.filter(v => (cavId && v.cavallo_cliente_id === cavId) || (horseId && v.horse_id === horseId))
      .sort((a, b) => String(b.data_visita).localeCompare(String(a.data_visita)));
    const filtri = [cavId ? "cavallo_cliente_id.eq." + cavId : "", horseId ? "horse_id.eq." + horseId : ""].filter(Boolean).join(",");
    if(!filtri) return [];
    const { data, error } = await sb.from("visite_pro").select("id, data_visita, modello_nome, stato, dati, intervento_id").or(filtri).order("data_visita", { ascending: false }).limit(20);
    if(error){ if(!vsSqlMancante(error)) console.warn("visite_pro", error.message); return []; }
    return data || [];
  },
  async salvaVisita(v){
    if(DEMO_MODE){
      const t = this.demo().visite;
      if(v.id){ const r = t.find(x => x.id === v.id); Object.assign(r, v, { aggiornata_il: new Date().toISOString() }); return { data: r, error: null }; }
      const r = { ...v, id: "vp" + Math.random().toString(36).slice(2, 10), professionista_id: currentUser.id, creata_il: new Date().toISOString() }; t.push(r); return { data: r, error: null };
    }
    const { id, creata_il, aggiornata_il, professionista_id, ...campi } = v;
    const q = id ? sb.from("visite_pro").update(campi).eq("id", id) : sb.from("visite_pro").insert(campi);
    return await q.select().single();
  },
  async modelli(){
    if(DEMO_MODE) return this.demo().modelli.filter(m => !m.archiviato_il);
    const { data, error } = await sb.from("modelli_visita").select("*").is("archiviato_il", null).order("ordine").order("creato_il");
    if(error){ if(!vsSqlMancante(error)) console.warn("modelli_visita", error.message); return []; }
    return data || [];
  },
  async salvaModello(m){
    if(DEMO_MODE){
      const t = this.demo().modelli;
      if(m.id){ const r = t.find(x => x.id === m.id); Object.assign(r, m); return { data: r, error: null }; }
      const r = { ...m, id: "mv" + Math.random().toString(36).slice(2, 10), creato_il: new Date().toISOString() }; t.push(r); return { data: r, error: null };
    }
    const { id, creato_il, aggiornato_il, professionista_id, ...campi } = m;
    const q = id ? sb.from("modelli_visita").update(campi).eq("id", id) : sb.from("modelli_visita").insert(campi);
    return await q.select().single();
  }
};

/* ===================== STATO E FOGLIO ===================== */
const VS = { e: null, visita: null, campi: [], tab: "mtc", modelli: [], modello: null, timer: null, precedenti: [], schermo: "scelta" };

function vsFoglio(){
  let f = document.getElementById("vs-foglio");
  if(!f){
    f = document.createElement("div"); f.id = "vs-foglio"; f.className = "vs-foglio"; f.setAttribute("role", "dialog"); f.setAttribute("aria-modal", "true");
    f.innerHTML = '<div class="vs-testa"><button class="vs-indietro" onclick="vsIndietro()" aria-label="Indietro">‹</button><div class="vs-tt"><b id="vs-titolo"></b><small id="vs-sotto"></small></div><span class="vs-salvato" id="vs-salvato"></span></div><div class="vs-corpo" id="vs-corpo"></div><div class="vs-piede" id="vs-piede"></div>';
    document.body.appendChild(f);
  }
  return f;
}
function vsTesta(t, s){ document.getElementById("vs-titolo").textContent = t; document.getElementById("vs-sotto").textContent = s || ""; }
function vsChiudi(){ if(typeof vdReset === "function") vdReset(); vsSalvaSubito(); const f = document.getElementById("vs-foglio"); if(f) f.classList.remove("aperto"); document.body.classList.remove("vs-aperto"); }
function vsIndietro(){
  if(VS.schermo === "referto") return vsMostraScheda();
  if(VS.schermo === "referto-fatto" || VS.schermo === "terapie") return vsChiudi();
  if(VS.schermo === "piano-voce") return vsMostraScheda();
  if(VS.schermo === "modello-edit" || VS.schermo === "miei") return vsMostraScelta();
  if(VS.schermo === "scheda" && !VS.visita?.id && !Object.keys(VS.visita?.dati || {}).length) return vsMostraScelta();
  vsChiudi();
}
const vsNomeCavallo = e => { try{ return agNomeCavallo(e) || ""; }catch(_){ return ""; } };
const vsNomeCliente = e => e?.clienti_mascalcia?.nome || (typeof clienteDiId === "function" ? clienteDiId(e?.cliente_mascalcia_id)?.nome : "") || "";

// ingresso: dalla visita in agenda (id dell'intervento)
async function vsApriDaEvento(id, evento){
  // anche le visite vecchie dalla scheda del cavallo (storico già caricato) o dalla scelta di «Detta» (evento passato)
  const e = evento || (typeof agEventiCache !== "undefined" && agEventiCache[id]) || (hpAppuntamenti || []).find(x => x.id === id)
    || (typeof schedaStoricoCavallo !== "undefined" ? schedaStoricoCavallo : []).find(x => x.id === id);
  if(!e) return showToast("Visita non trovata");
  try{ closeModal("modal-azioni-evento"); }catch(_){}
  VS.e = e; VS.precedenti = []; vsDemoPrepara(); if(typeof vaReset === "function") vaReset(); if(typeof vdReset === "function") vdReset(); if(typeof ptReset === "function") ptReset();
  vsFoglio().classList.add("aperto"); document.body.classList.add("vs-aperto");
  document.getElementById("vs-corpo").innerHTML = '<div class="vs-vuoto">Carico la scheda…</div>';
  document.getElementById("vs-piede").innerHTML = "";
  const [v, modelli, prec] = await Promise.all([VsDB.visitaDiEvento(e.id), VsDB.modelli(), VsDB.visiteCavallo(e.cavallo_cliente_id, e.horse_id)]);
  VS.modelli = modelli; VS.precedenti = (prec || []).filter(p => p.intervento_id !== e.id);
  if(v){ VS.visita = v; return vsMostraScheda(); }
  vsMostraScelta();
}

/* ===================== «CHE VISITA FAI?» ===================== */
function vsMostraScelta(){
  VS.schermo = "scelta";
  const e = VS.e;
  vsTesta(vsNomeCavallo(e) || "Visita", [vsNomeCliente(e), e.tipo_altro].filter(Boolean).join(" · "));
  const mtcSuggerito = ["mtc", "fisio"].includes(e.tipo_ferratura);
  const carta = (az, tit, et, txt, sugg) => `<button class="vs-carta${sugg ? " sugg" : ""}" onclick="${az}"><span class="c"><b>${tit}</b><span class="et">${et}</span><span class="tx">${txt}</span></span><span class="fr">›</span></button>`;
  document.getElementById("vs-corpo").innerHTML = `${vsPrecedentiHtml()}
    <div class="vs-h">Che visita fai?</div>
    ${carta("vsNuova('standard')", "Visita standard", "Clinica", "Anamnesi, esame obiettivo, locomotore, diagnosi, terapia", !mtcSuggerito)}
    ${carta("vsMostraMiei()", "I miei modelli", "Personalizzata", (VS.modelli.length ? VS.modelli.map(m => m.nome).slice(0, 3).join(" · ") + " · " : "Controllo zoppia · Pre-acquisto · Dentale · ") + "+ crea il tuo")}
    ${carta("vsNuova('mtc')", "Agopuntura · MTC · Fisioterapia", "Specialistica", "Lingua e polso, scansione dei punti, zoppia e palpazione, trattamento ed esercizi a casa", mtcSuggerito)}`;
  document.getElementById("vs-piede").innerHTML = "";
}
function vsPrecedentiHtml(){
  if(!VS.precedenti.length) return "";
  const riga = p => { const d = p.dati || {}; const cosa = d.diagnosi || d.sindrome || d.motivo || d.conclusioni || ""; const [y, m, g] = String(p.data_visita).split("-");
    return `<div class="vs-prec-r"><span class="d">${g}/${m}/${String(y).slice(2)}</span><span class="t"><b>${vsEsc(p.modello_nome || "Visita")}</b>${cosa ? " · " + vsEsc(String(cosa).slice(0, 90)) : ""}</span>${p.stato === "bozza" ? '<span class="vs-et">bozza</span>' : ""}</div>`; };
  return `<details class="vs-prec"${VS.schermo === "scelta" ? " open" : ""}><summary>Visite precedenti di ${vsEsc(vsNomeCavallo(VS.e) || "questo cavallo")} · ${VS.precedenti.length}</summary>${VS.precedenti.slice(0, 5).map(riga).join("")}</details>`;
}

function vsCampiDi(modello){
  if(modello === "standard") return CAMPI_STANDARD;
  if(modello === "mtc") return CAMPI_MTC;
  const m = VS.modelli.find(x => x.id === modello);
  return m ? (m.campi || []).filter(c => c.attivo !== false) : CAMPI_STANDARD;
}
const vsNomeModello = m => m === "standard" ? "Visita standard" : m === "mtc" ? "Agopuntura · MTC · Fisioterapia" : (VS.modelli.find(x => x.id === m)?.nome || "Modello personale");

function vsNuova(modello){
  const e = VS.e, campi = vsCampiDi(modello);
  const personale = modello !== "standard" && modello !== "mtc";
  VS.visita = { intervento_id: e.id, cliente_id: e.cliente_mascalcia_id || null, cavallo_cliente_id: e.cavallo_cliente_id || null, horse_id: e.horse_id || null,
    professione: "veterinario", modello, modello_nome: vsNomeModello(modello), campi: personale ? campi : null, stato: "bozza",
    data_visita: e.data_intervento || isoLocale(new Date()), dati: (e.tipo_altro && campi.some(c => c.k === "motivo")) ? { motivo: e.tipo_altro } : {} };
  vsMostraScheda();
}

/* ===================== LA SCHEDA ===================== */
function vsMostraScheda(){
  VS.schermo = "scheda";
  const v = VS.visita;
  VS.campi = v.campi || vsCampiDi(v.modello);
  if(v.modello === "mtc" && !TAB_MTC.some(t => t[0] === VS.tab)) VS.tab = "mtc";
  vsTesta("Visita · " + (vsNomeCavallo(VS.e) || "cavallo"), v.modello_nome + (v.stato === "conclusa" ? " · conclusa" : ""));
  vsDisegnaCorpo();
  document.getElementById("vs-piede").innerHTML = v.stato === "conclusa"
    ? '<button class="vs-btn" onclick="vsChiudi()">Chiudi</button><button class="vs-btn pri" onclick="vrApri()">Referto</button>'
    : '<button class="vs-btn" onclick="vrApri()">Referto</button><button class="vs-btn pri" onclick="vsConcludi()">Concludi la visita</button>';
  if(typeof vaCarica === "function") vaCarica();
  if(typeof ptCarica === "function") ptCarica();   // piano terapeutico (11)
  if(typeof vdDopoScheda === "function") vdDopoScheda();   // «Detta» dalla Home: la dettatura parte appena c'è la scheda
}
function vsDisegnaCorpo(){
  const v = VS.visita, d = v.dati || {}, mtc = v.modello === "mtc";
  const campi = VS.campi.filter(c => (!mtc || c.tab === VS.tab) && (!c.se || c.se(d)));
  const sezioni = [];
  campi.forEach(c => { let s = sezioni.find(x => x.n === c.s); if(!s){ s = { n: c.s || "Visita", c: [] }; sezioni.push(s); } s.c.push(c); });
  const tabs = mtc ? `<div class="vs-tabs" role="tablist">${TAB_MTC.map(([k, t]) => `<button role="tab" aria-selected="${VS.tab === k}" class="${VS.tab === k ? "on" : ""}" onclick="vsTab('${k}')">${t}</button>`).join("")}</div>` : "";
  const sola = v.stato === "conclusa";
  document.getElementById("vs-corpo").innerHTML = vsPrecedentiHtml() + tabs
    + (sola ? '<div class="vs-nota">Visita conclusa: la scheda è in sola lettura.</div>' : "")
    + (d._referto ? `<div class="vs-nota">Referto inviato il ${new Date(d._referto.il).toLocaleDateString("it-IT")}${d._referto.a?.length ? " a " + vsEsc(d._referto.a.join(", ")) : ""}.</div>` : "")
    + sezioni.map(s => `<section class="vs-sez"><h3>${vsEsc(s.n)}</h3><div class="vs-griglia">${s.c.map(c => vsCampoHtml(c, d[c.k], sola)).join("")}</div></section>`).join("")
    + (typeof vdSezioneHtml === "function" ? vdSezioneHtml() : "")
    + (typeof ptSezioneHtml === "function" ? ptSezioneHtml() : "")
    + (typeof vaSezioneHtml === "function" ? vaSezioneHtml() : "");
  if(typeof ptDisegna === "function") ptDisegna();
}
function vsTab(k){ VS.tab = k; vsDisegnaCorpo(); document.getElementById("vs-corpo").scrollTop = 0; }

function vsCampoHtml(c, val, sola){
  const id = "vs-f-" + c.k, dis = sola ? " disabled" : "", lab = `<label for="${id}">${vsEsc(c.e)}</label>`;
  const cls = "vs-campo" + (c.mezzo ? " mezzo" : "");
  const chip = (o, on, az) => `<button type="button" class="vs-chip${on ? " on" : ""}" aria-pressed="${on}"${dis} onclick="${az}">${vsEsc(o)}</button>`;
  switch(c.t){
    case "testo": return `<div class="${cls} pieno">${lab}<textarea id="${id}" rows="3" placeholder="${vsEsc(c.ph || "")}"${dis} oninput="vsCambia('${c.k}', this.value)">${vsEsc(val || "")}</textarea></div>`;
    case "numero": return `<div class="${cls}">${lab}<input id="${id}" inputmode="decimal" value="${vsEsc(val ?? "")}" placeholder="${vsEsc(c.ph || "")}"${dis} oninput="vsCambia('${c.k}', this.value)"></div>`;
    case "data": return `<div class="${cls}">${lab}<input id="${id}" type="date" value="${vsEsc(val || "")}"${dis} onchange="vsCambia('${c.k}', this.value)"></div>`;
    case "scelta": return `<div class="${cls} pieno"><span class="vs-lab">${vsEsc(c.e)}</span><div class="vs-chips">${(c.o || []).map(o => chip(o, val === o, `vsScegli('${c.k}', ${vsJs(o)})`)).join("")}</div></div>`;
    case "multi": { const sel = Array.isArray(val) ? val : []; return `<div class="${cls} pieno"><span class="vs-lab">${vsEsc(c.e)}</span><div class="vs-chips">${(c.o || []).map(o => chip(o, sel.includes(o), `vsMulti('${c.k}', ${vsJs(o)})`)).join("")}</div></div>`; }
    case "scala": { const max = c.max || 5, n = Number(val) || 0;
      return `<div class="${cls} pieno vs-scala-r"><span class="vs-lab">${vsEsc(c.e)}</span><div class="vs-scala">${Array.from({ length: max + 1 }, (_, i) => `<button type="button" class="${i === n && val != null ? "on" : ""}${c.rosso && i >= Math.ceil(max / 2) ? " alto" : ""}" aria-pressed="${i === n && val != null}"${dis} onclick="vsScegli('${c.k}', ${i})">${i}</button>`).join("")}</div></div>`; }
    case "sino": return `<div class="${cls} pieno"><span class="vs-lab">${vsEsc(c.e)}</span><div class="vs-chips">${chip("Sì", val === true, `vsScegli('${c.k}', true)`)}${chip("No", val === false, `vsScegli('${c.k}', false)`)}</div></div>`;
    default: return `<div class="${cls}">${lab}<input id="${id}" value="${vsEsc(val || "")}" placeholder="${vsEsc(c.ph || "")}"${dis} oninput="vsCambia('${c.k}', this.value)"></div>`;
  }
}
const vsJs = s => vsEsc(JSON.stringify(s));

function vsCambia(k, val){ VS.visita.dati = { ...(VS.visita.dati || {}), [k]: val }; vsSalvaPresto(); }
function vsScegli(k, val){
  const d = VS.visita.dati || {};
  VS.visita.dati = { ...d, [k]: d[k] === val ? null : val };   // ritocco = togli
  vsSalvaPresto(); vsRidisegna();
}
function vsMulti(k, o){
  const d = VS.visita.dati || {}, l = Array.isArray(d[k]) ? d[k].slice() : [];
  const i = l.indexOf(o); if(i >= 0) l.splice(i, 1); else l.push(o);
  VS.visita.dati = { ...d, [k]: l }; vsSalvaPresto(); vsRidisegna();
}
function vsRidisegna(){ const b = document.getElementById("vs-corpo"), top = b.scrollTop; vsDisegnaCorpo(); b.scrollTop = top; }

/* ---- salvataggio automatico della bozza ---- */
function vsSalvaPresto(){ clearTimeout(VS.timer); vsStato("…"); VS.timer = setTimeout(vsSalvaSubito, 700); }
async function vsSalvaSubito(forza){
  clearTimeout(VS.timer); VS.timer = null;
  while(VS.salvando) await new Promise(r => setTimeout(r, 80));
  const v = VS.visita; if(!v) return;
  if(!v.id && !forza && !Object.values(v.dati || {}).some(x => x != null && x !== "" && !(Array.isArray(x) && !x.length))) return;
  VS.salvando = true;
  const { data, error } = await VsDB.salvaVisita({ ...v, campi: v.campi ? v.campi.map(({ se, ...c }) => c) : null });
  VS.salvando = false;
  if(error){ vsStato(""); showToast(vsSqlMancante(error) ? "La scheda visita non è ancora attiva: manca l'aggiornamento del database (SQL 31)." : "Errore nel salvare: " + error.message); return; }
  if(data && !v.id) v.id = data.id;
  vsStato("Salvato");
}
function vsStato(t){ const s = document.getElementById("vs-salvato"); if(s) s.textContent = t; }

/* ---- «Concludi la visita»: salva, segna «Fatto», propone il ricontrollo ---- */
async function vsConcludi(){
  const v = VS.visita, e = VS.e;
  if(!Object.values(v.dati || {}).some(x => x != null && x !== "" && !(Array.isArray(x) && !x.length))) return showToast("La scheda è vuota: scrivi almeno il motivo o la diagnosi");
  v.stato = "conclusa"; v.conclusa_il = new Date().toISOString();
  await vsSalvaSubito();
  if(!v.id){ v.stato = "bozza"; return; }
  vsChiudi();
  if(e && e.stato !== "fatto" && typeof segnaFatto === "function"){ const r = await segnaFatto(e); if(r && r.ok) e.stato = "fatto"; }
  else showToast("Visita conclusa");
  const d = v.dati || {};
  const quando = d.ricontrollo || d.richiamo || (d.prossima ? isoLocale(new Date(Date.now() + parseInt(d.prossima, 10) * 7 * 864e5)) : "");
  if(quando && typeof chiediSiNo === "function" && await chiediSiNo("Fisso il ricontrollo in agenda?", "Il " + new Date(quando + "T12:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }) + " per " + (vsNomeCavallo(e) || "il cavallo") + ".")){
    openInterventoModal(e.cliente_mascalcia_id, null, { tipo_ferratura: v.modello === "mtc" ? "mtc" : "visita", tipo_altro: "ricontrollo" + (d.motivo ? " · " + d.motivo : ""),
      data_intervento: quando, cavallo_cliente_id: e.cavallo_cliente_id || null, horse_id: e.horse_id || null });
  }
}

/* ===================== I MIEI MODELLI ===================== */
function vsMostraMiei(){
  VS.schermo = "miei";
  vsTesta("I miei modelli", "Scegli un modello o costruisci il tuo");
  const miei = VS.modelli.map(m => `<div class="vs-mod"><button class="vs-mod-usa" onclick="vsNuova('${m.id}')"><b>${vsEsc(m.nome)}</b><span>${(m.campi || []).filter(c => c.attivo !== false).length} campi</span></button><button class="vs-mod-mod" onclick="vsModificaModello('${m.id}')">Modifica</button></div>`).join("");
  const esempi = ESEMPI_MODELLI.filter(x => !VS.modelli.some(m => m.nome === x.nome));
  document.getElementById("vs-corpo").innerHTML = (miei ? `<div class="vs-h">I tuoi modelli</div>${miei}` : '<div class="vs-nota">Non hai ancora modelli tuoi: parti da un esempio o da zero.</div>')
    + (esempi.length ? `<div class="vs-h">Parti da un esempio</div><div class="vs-chips">${esempi.map(x => `<button class="vs-chip" onclick="vsModelloDaEsempio(${vsJs(x.nome)})">${vsEsc(x.nome)}</button>`).join("")}</div>` : "")
    + `<div class="vs-h">Oppure</div><div class="vs-chips"><button class="vs-chip" onclick="vsModelloDa('standard')">Copia la visita standard</button><button class="vs-chip" onclick="vsModelloDa('mtc')">Copia MTC · Fisio</button><button class="vs-chip" onclick="vsModelloDa('vuoto')">+ Nuovo vuoto</button></div>`;
  document.getElementById("vs-piede").innerHTML = "";
}
const vsCopiaCampi = l => l.map(({ se, ...c }) => ({ ...c, attivo: c.attivo !== false }));
function vsModelloDaEsempio(nome){ const x = ESEMPI_MODELLI.find(m => m.nome === nome); VS.modello = { nome: x.nome, base: x.base, campi: vsCopiaCampi(x.campi) }; vsMostraEditor(); }
function vsModelloDa(base){
  VS.modello = { nome: base === "mtc" ? "La mia seduta MTC" : base === "vuoto" ? "Nuovo modello" : "La mia visita", base,
    campi: base === "vuoto" ? [] : vsCopiaCampi(base === "mtc" ? CAMPI_MTC.map(c => ({ ...c, s: TAB_MTC.find(t => t[0] === c.tab)[1] + " · " + c.s })) : CAMPI_STANDARD) };
  vsMostraEditor();
}
function vsModificaModello(id){ const m = VS.modelli.find(x => x.id === id); VS.modello = JSON.parse(JSON.stringify(m)); vsMostraEditor(); }

function vsMostraEditor(){
  VS.schermo = "modello-edit";
  const m = VS.modello;
  vsTesta(m.id ? "Modifica modello" : "Nuovo modello", "Accendi i campi che usi, spegni gli altri");
  document.getElementById("vs-corpo").innerHTML = `<div class="vs-campo pieno"><label for="vs-mod-nome">Nome del modello</label><input id="vs-mod-nome" maxlength="80" value="${vsEsc(m.nome)}" oninput="VS.modello.nome = this.value"></div>
    <div class="vs-pila">${m.campi.map((c, i) => `<div class="vs-cm${c.attivo === false ? " spento" : ""}">
      <span class="sp"><b>${vsEsc(c.e)}</b><small>${vsEsc(NOME_TIPO[c.t === "scala" && c.max === 3 ? "scala3" : c.t] || c.t)} · ${vsEsc(c.s || "")}</small></span>
      <button class="vs-fr" aria-label="Sposta su" onclick="vsSposta(${i}, -1)"${i === 0 ? " disabled" : ""}>↑</button><button class="vs-fr" aria-label="Sposta giù" onclick="vsSposta(${i}, 1)"${i === m.campi.length - 1 ? " disabled" : ""}>↓</button>
      <button class="vs-inter${c.attivo !== false ? " on" : ""}" role="switch" aria-checked="${c.attivo !== false}" aria-label="Campo ${vsEsc(c.e)}" onclick="vsAccendi(${i})"><span></span></button></div>`).join("") || '<div class="vs-nota">Nessun campo: aggiungine uno.</div>'}</div>
    <details class="vs-nuovo-campo" id="vs-nuovo-campo"><summary>+ Aggiungi un campo</summary>
      <div class="vs-campo pieno"><label for="vs-nc-nome">Nome del campo</label><input id="vs-nc-nome" maxlength="60" placeholder="es. Ecografia tendine"></div>
      <div class="vs-campo pieno"><label for="vs-nc-tipo">Tipo</label><select id="vs-nc-tipo" onchange="document.getElementById('vs-nc-opz-b').hidden = !['scelta','multi'].includes(this.value)">${TIPI_CAMPO.map(([k, t]) => `<option value="${k}">${t}</option>`).join("")}</select></div>
      <div class="vs-campo pieno" id="vs-nc-opz-b" hidden><label for="vs-nc-opz">Scelte (separate da virgola)</label><input id="vs-nc-opz" placeholder="es. Negativo, Positivo, Dubbio"></div>
      <div class="vs-campo pieno"><label for="vs-nc-sez">Sezione</label><input id="vs-nc-sez" maxlength="60" value="${vsEsc(m.campi[m.campi.length - 1]?.s || "Visita")}"></div>
      <button class="vs-btn pri" onclick="vsAggiungiCampo()">Aggiungi</button></details>`;
  document.getElementById("vs-piede").innerHTML = '<button class="vs-btn" onclick="vsMostraMiei()">Annulla</button><button class="vs-btn pri" onclick="vsSalvaModello()">Salva il modello</button>';
}
function vsAccendi(i){ const c = VS.modello.campi[i]; c.attivo = c.attivo === false; vsMostraEditor(); }
function vsSposta(i, d){ const l = VS.modello.campi, j = i + d; if(j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; vsMostraEditor(); }
function vsAggiungiCampo(){
  const nome = document.getElementById("vs-nc-nome").value.trim(), tipo = document.getElementById("vs-nc-tipo").value;
  if(!nome) return showToast("Scrivi il nome del campo");
  const opz = document.getElementById("vs-nc-opz").value.split(",").map(s => s.trim()).filter(Boolean);
  if(["scelta", "multi"].includes(tipo) && opz.length < 2) return showToast("Scrivi almeno due scelte, separate da virgola");
  const base = nome.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 30) || "campo";
  let k = "u_" + base, n = 2; while(VS.modello.campi.some(c => c.k === k)) k = "u_" + base + "_" + n++;
  const c = { k, e: nome, t: tipo === "scala3" ? "scala" : tipo, s: document.getElementById("vs-nc-sez").value.trim() || "Visita", attivo: true };
  if(tipo === "scala3") c.max = 3; else if(tipo === "scala") c.max = 5;
  if(opz.length) c.o = opz;
  VS.modello.campi.push(c); vsMostraEditor();
}
async function vsSalvaModello(){
  const m = VS.modello;
  if(!String(m.nome || "").trim()) return showToast("Scrivi il nome del modello");
  if(!m.campi.some(c => c.attivo !== false)) return showToast("Accendi almeno un campo");
  const { data, error } = await VsDB.salvaModello({ id: m.id, nome: m.nome.trim(), base: m.base || "standard", campi: m.campi, ordine: m.ordine || 0 });
  if(error) return showToast(vsSqlMancante(error) ? "I modelli non sono ancora attivi: manca l'aggiornamento del database (SQL 31)." : "Errore: " + error.message);
  VS.modelli = await VsDB.modelli();
  showToast("Modello salvato");
  if(VS.e && data) return vsNuova(data.id);
  vsMostraMiei();
}

/* ===================== GANCIO: «Scheda visita» nelle azioni della visita ===================== */
let vsEventoAzioni = null;
try{
  estendiDopo("apriAzioniEvento", function(e){
    const box = document.querySelector("#modal-azioni-evento .ag-azioni"); if(!box) return;
    let b = document.getElementById("azioni-evento-scheda");
    if(!b){ b = document.createElement("button"); b.id = "azioni-evento-scheda"; b.className = "btn btn-primary vs-azione";
      b.onclick = () => vsApriDaEvento(vsEventoAzioni); box.insertBefore(b, box.firstChild); }
    const vet = typeof eVeterinario === "function" && eVeterinario();
    b.style.display = vet && e && !["annullato", "rifiutato", "richiesto", "proposto"].includes(e.stato) ? "" : "none";
    b.textContent = e && e.stato === "fatto" ? "Apri la scheda visita" : "Scheda visita";
    vsEventoAzioni = e ? e.id : null;
  });
}catch(err){ console.error("scheda visita:", err); }

// demo: una visita conclusa di Aurora la settimana scorsa, per le «Visite precedenti»
function vsDemoPrepara(){
  if(!DEMO_MODE) return;
  const d = VsDB.demo(); if(d.visite.length) return;
  const g = new Date(Date.now() - 7 * 864e5);
  d.visite.push({ id: "vp-demo1", intervento_id: null, cliente_id: "vc-gv", cavallo_cliente_id: "vv-au", horse_id: null, modello: "standard", modello_nome: "Visita standard",
    stato: "conclusa", data_visita: isoLocale(g), dati: { motivo: "Zoppia ASx", diagnosi: "Sospetto ascesso subsolare ASx", zop_as: 2 }, professione: "veterinario" });
}

export { vsFoglio, vsRidisegna, vsSalvaSubito, vsTesta, vsNomeCavallo, vsMostraScheda, vsApriDaEvento, vsMostraScelta, vsMostraMiei, vsNuova, vsTab, vsCambia, vsScegli, vsMulti, vsConcludi, vsChiudi, vsIndietro,
  vsModelloDaEsempio, vsModelloDa, vsModificaModello, vsAccendi, vsSposta, vsAggiungiCampo, vsSalvaModello, vsDemoPrepara, VS, VsDB };
