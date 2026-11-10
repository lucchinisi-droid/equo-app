/* ---------- INCASSI (6/11/2026 · SQL 44) ----------
   Tutto ciò che va pagato è un ADDEBITO intestato a chi paga (per i minori il genitore/referente):
   pacchetti venduti, rette mensili, lezioni singole (se la scuderia lo sceglie), extra dal listino, e per l'ASD
   tesseramenti, iscrizioni alle gare e trasferte divise fra gli iscritti. I PAGAMENTI, anche parziali, si scalano dal
   più vecchio. Il CONTO del mese raccoglie gli addebiti di un cliente: bozza → inviato (chat + App Equo) → pagato.
   Due casse separate: scuderia e ASD. Gestiscono: amministratore e livello 3 con il permesso «incassi».
   Pacchetti & Abbonamenti è una scheda di Incassi (resta la sezione «pacchetti», con la barra delle schede sopra).
   Il conto è un riepilogo, NON una fattura né una ricevuta fiscale. */
const INC = { tab: "riepilogo", cassa: "scuderia", mese: null, dati: null, asd: null, filtro: "aperti", azione: null };
const INC_TABS = [
  ["riepilogo", "fa-chart-simple", "Riepilogo"], ["addebiti", "fa-file-invoice-dollar", "Da incassare"], ["conti", "fa-receipt", "Conti"],
  ["pagamenti", "fa-cash-register", "Pagamenti"], ["pacchetti", "fa-ticket", "Pacchetti"], ["asd", "fa-medal", "ASD"],
  ["listino", "fa-tags", "Listino"], ["impostazioni", "fa-gear", "Impostazioni"],
];
const INC_METODI = { contanti: "Contanti", bonifico: "Bonifico", pos: "POS / carta", assegno: "Assegno", altro: "Altro" };
const INC_ORIGINI = { manuale: "Extra", pacchetto: "Pacchetto", retta: "Retta", lezione: "Lezione", gara: "Gara", tesseramento: "Tesseramento", trasferta: "Trasferta" };
const INC_CATEGORIE = { pensione: "Pensione", lezione: "Lezioni", servizio: "Servizi ed extra", asd: "ASD" };
const INC_MESI = ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];

function puoGestireIncassi(){
  if(!currentMembro) return false;
  if(currentMembro.ruolo === "admin" || currentMembro.livello === "admin") return true;
  return currentMembro.livello === "3" && !!(currentMembro.permessi && currentMembro.permessi.incassi);
}
const incEuro = n => (Number(n) || 0).toLocaleString("it-IT", { style: "currency", currency: "EUR" });
const incNum = v => { const n = parseFloat(String(v ?? "").replace(/\s/g, "").replace(",", ".")); return isFinite(n) ? n : null; };
const incOggi = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const incData = iso => iso ? new Date(String(iso).slice(0, 10) + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }) : "";
const incMeseNome = iso => { const d = new Date(String(iso).slice(0, 10) + "T12:00:00"); return INC_MESI[d.getMonth()] + " " + d.getFullYear(); };
const incCassaNome = c => c === "asd" ? (INC.dati?.impostazioni?.asd_nome || "ASD") : "Scuderia";
function incCliente(id){ return (INC.dati?.clienti || []).find(c => c.id === id) || {}; }
function incNomeCliente(id){ return incCliente(id).nome || "Cliente"; }
function incStatoChip(importo, pagato){
  const res = (Number(importo) || 0) - (Number(pagato) || 0);
  if((Number(importo) || 0) <= 0) return "";
  if(res <= 0.004) return '<span class="inc-chip ok">pagato</span>';
  if((Number(pagato) || 0) > 0) return `<span class="inc-chip parz">mancano ${incEuro(res)}</span>`;
  return '<span class="inc-chip no">da pagare</span>';
}
function incConferma(btn, testo){
  if(btn && btn.dataset.conferma !== "1"){
    btn.dataset.conferma = "1"; const prima = btn.innerHTML; btn.textContent = testo || "Tocca ancora";
    setTimeout(() => { if(btn){ btn.dataset.conferma = ""; btn.innerHTML = prima; } }, 3500);
    return false;
  }
  return true;
}

/* ---------- caricamento ---------- */
async function refreshIncassiModule(){
  if(!INC.mese){ const d = new Date(); INC.mese = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`; }
  if(!puoGestireIncassi()){ setTimeout(() => showModule("pacchetti"), 0); return; }
  document.getElementById("inc-mese-label").textContent = incMeseNome(INC.mese);
  await incCarica();
  if(INC.tab === "asd") await incCaricaAsd();
  incRender();
}
async function incCarica(){
  if(DEMO_MODE){ INC.dati = incDemoDati(); return; }
  const { data, error } = await sb.rpc("incassi_dati", { p_centro: currentCentro.id, p_mese: INC.mese });
  if(error || !data || data.errore){ console.error("incassi_dati:", error || data); INC.dati = null; return; }
  INC.dati = data;
  if(!INC.dati.impostazioni.asd_attiva) INC.cassa = "scuderia";
}
async function incCaricaAsd(){
  if(DEMO_MODE){ INC.asd = incDemoAsd(); await incCaricaAsdFull(); return; }
  const { data, error } = await sb.rpc("asd_dati", { p_centro: currentCentro.id });
  if(error || !data || data.errore){ console.error("asd_dati:", error || data); INC.asd = { tesseramenti: [], certificati: [], gare: [] }; return; }
  INC.asd = data;
  await incCaricaAsdFull();
}
async function incAggiorna(){ await incCarica(); if(INC.tab === "asd") await incCaricaAsd(); incRender(); }
function incCambiaMese(d){
  const [y, m] = INC.mese.split("-").map(Number);
  const n = new Date(y, m - 1 + d, 1);
  INC.mese = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-01`;
  document.getElementById("inc-mese-label").textContent = incMeseNome(INC.mese);
  incAggiorna();
}
function incTabbarHtml(attiva){
  return INC_TABS
    .map(t => `<button class="${t[0] === attiva ? "active" : ""}" onclick="incVai('${t[0]}')"><i class="fa-solid ${t[1]}"></i>${t[2]}</button>`).join("");
}
async function incVai(tab){
  if(tab === "pacchetti"){ showModule("pacchetti"); return; }
  INC.tab = tab;
  if(document.getElementById("module-incassi").style.display === "none"){ showModule("incassi"); return; }
  if(tab === "asd") await incCaricaAsd();
  incRender();
}
function incScegliCassa(c){ INC.cassa = c; incRender(); }

/* ---------- disegno ---------- */
function incRender(){
  document.getElementById("inc-tabbar").innerHTML = incTabbarHtml(INC.tab);
  const corpo = document.getElementById("inc-corpo");
  if(!INC.dati){ corpo.innerHTML = '<div class="card inc-vuoto">Non riesco a caricare gli incassi. Riprova tra poco.</div>'; return; }
  const asd = INC.dati.impostazioni.asd_attiva;
  const bar = document.getElementById("inc-cassa-bar");
  const conCassa = asd && ["riepilogo", "addebiti", "conti", "pagamenti"].includes(INC.tab);
  bar.style.display = conCassa ? "flex" : "none";
  bar.innerHTML = conCassa ? ["scuderia", "asd"].map(c => `<button class="${INC.cassa === c ? "active" : ""}" onclick="incScegliCassa('${c}')">${escapeHtml(incCassaNome(c))}</button>`).join("") : "";
  const f = { riepilogo: incRenderRiepilogo, addebiti: incRenderAddebiti, conti: incRenderConti, pagamenti: incRenderPagamenti,
              asd: incRenderAsd, listino: incRenderListino, impostazioni: incRenderImpostazioni }[INC.tab] || incRenderRiepilogo;
  corpo.innerHTML = f();
}

function incRenderRiepilogo(){
  const d = INC.dati, r = (d.riepilogo || []).find(x => x.cassa === INC.cassa) || {};
  const saldi = (d.saldi || []).filter(s => s.cassa === INC.cassa);
  const metodi = Object.entries(r.per_metodo || {}).map(([k, v]) => `${INC_METODI[k] || k} ${incEuro(v)}`).join(" · ");
  const tile = (l, v, cls) => `<div class="inc-tile ${cls || ""}"><div class="l">${l}</div><div class="v">${incEuro(v)}</div></div>`;
  return `<div class="inc-tiles">
      ${tile("Emesso a " + INC_MESI[Number(INC.mese.slice(5, 7)) - 1], r.emesso)}${tile("Incassato a " + INC_MESI[Number(INC.mese.slice(5, 7)) - 1], r.incassato, "verde")}
      ${tile("Da incassare (in totale)", r.da_incassare)}${tile("In ritardo (oltre 30 giorni)", r.in_ritardo, Number(r.in_ritardo) > 0 ? "rosso" : "")}</div>
    ${metodi ? `<p class="inc-nota">Incassato per metodo: ${escapeHtml(metodi)}</p>` : ""}
    <div class="card">
      <div class="inc-sez" style="margin-top:0">Chi deve pagare <span style="font-weight:600;font-size:12.5px;color:var(--muted)">${saldi.filter(s => Number(s.residuo) > 0).length} clienti</span></div>
      ${saldi.length ? saldi.map(s => {
        const c = incCliente(s.membro_id);
        const giorni = s.dal ? Math.floor((Date.now() - new Date(s.dal + "T12:00:00").getTime()) / 864e5) : 0;
        return `<div class="inc-riga"><div class="t"><b>${escapeHtml(c.nome || "Cliente")}</b>
            <small>${Number(s.residuo) > 0 ? `il più vecchio dal ${incData(s.dal)}${giorni > 30 ? ` · <span style="color:var(--danger);font-weight:700">${giorni} giorni</span>` : ""}` : ""}${Number(s.credito) > 0 ? ` · credito ${incEuro(s.credito)}` : ""}${c.app ? "" : " · senza app"}</small></div>
          <div class="n">${Number(s.residuo) > 0 ? incEuro(s.residuo) : '<span class="inc-chip ok">in credito</span>'}</div>
          <div class="a">
            <button class="btn btn-outline btn-sm" onclick="incEstratto('${s.membro_id}')">Dettaglio</button>
            ${Number(s.residuo) > 0 ? `<button class="btn btn-primary btn-sm" onclick="incApriPagamento('${s.membro_id}')">Incassa</button>` : ""}
            ${Number(s.residuo) > 0 && c.app ? `<button class="btn btn-ghost btn-sm" title="Promemoria in chat" onclick="incSollecita('${s.membro_id}', this)"><i class="fa-solid fa-bell"></i></button>` : ""}
          </div></div>`;
      }).join("") : '<div class="inc-vuoto">Nessuno deve pagare niente. 🎉</div>'}
    </div>`;
}

function incRigaAddebito(a, conAzioni){
  const c = incCliente(a.membro_id), per = a.beneficiario_id && a.beneficiario_id !== a.membro_id ? incNomeCliente(a.beneficiario_id) : "";
  const pagato = Number(a.importo) - Number(a.residuo);
  return `<div class="inc-riga"><div class="t"><b>${escapeHtml(a.descrizione)}</b>
      <small>${incData(a.data)} · ${escapeHtml(c.nome || "Cliente")}${per ? ` (per ${escapeHtml(per)})` : ""}${a.cavallo ? " · " + escapeHtml(a.cavallo) : ""}${a.conto ? " · conto " + escapeHtml(a.conto) : ""}
        <span class="inc-chip">${INC_ORIGINI[a.origine] || a.origine}</span></small></div>
    <div class="n">${incEuro(a.importo)} ${incStatoChip(a.importo, pagato)}</div>
    ${conAzioni ? `<div class="a">
      ${Number(a.residuo) > 0 ? `<button class="btn btn-primary btn-sm" onclick="incApriPagamento('${a.membro_id}', '${a.id}')">Incassa</button>` : ""}
      ${a.origine === "manuale" ? `<button class="btn btn-ghost btn-sm" title="Elimina" onclick="incEliminaAddebito('${a.id}', this)"><i class="fa-solid fa-trash"></i></button>` : ""}
    </div>` : ""}</div>`;
}
function incRenderAddebiti(){
  const tutti = (INC.dati.addebiti || []).filter(a => a.cassa === INC.cassa);
  const lista = INC.filtro === "aperti" ? tutti.filter(a => Number(a.residuo) > 0) : tutti.filter(a => a.data >= INC.mese && a.data < incMeseDopo());
  return `<div class="inc-sez" style="margin-top:0"><span style="display:flex;gap:6px">
      <button class="btn btn-sm ${INC.filtro === "aperti" ? "btn-primary" : "btn-outline"}" onclick="INC.filtro='aperti';incRender()">Da pagare</button>
      <button class="btn btn-sm ${INC.filtro === "mese" ? "btn-primary" : "btn-outline"}" onclick="INC.filtro='mese';incRender()">Tutti di ${INC_MESI[Number(INC.mese.slice(5, 7)) - 1]}</button></span>
      <button class="btn btn-primary btn-sm" onclick="incApriAddebito()"><i class="fa-solid fa-plus"></i> Nuovo addebito</button></div>
    <p class="inc-nota">Pacchetti, rette, lezioni singole e ASD entrano da soli. Qui aggiungi gli extra (integratori, tosatura, trasporto…).</p>
    <div class="card">${lista.length ? lista.map(a => incRigaAddebito(a, true)).join("") : '<div class="inc-vuoto">Niente qui.</div>'}</div>`;
}
function incMeseDopo(){ const [y, m] = INC.mese.split("-").map(Number); const n = new Date(y, m, 1); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-01`; }

function incRenderConti(){
  const conti = (INC.dati.conti || []).filter(c => c.cassa === INC.cassa);
  const statoConto = c => Number(c.totale) > 0 && Number(c.residuo) <= 0.004 ? '<span class="inc-chip ok">pagato</span>'
    : c.stato === "inviato" ? `<span class="inc-chip parz">inviato${Number(c.pagato) > 0 ? " · mancano " + incEuro(c.residuo) : ""}</span>` : '<span class="inc-chip">bozza</span>';
  let html = `<div class="inc-sez" style="margin-top:0">Conti di ${incMeseNome(INC.mese)}
      <button class="btn btn-primary btn-sm" onclick="incGeneraConti(this)"><i class="fa-solid fa-wand-magic-sparkles"></i> Prepara i conti</button></div>
    <p class="inc-nota">«Prepara i conti» aggiunge le rette del mese e mette in un conto per cliente tutto quello che è ancora da pagare. Controlli la bozza, poi la invii: il cliente la trova nell'App Equo.</p>
    <div class="card">${conti.length ? conti.map(c => `<div class="inc-riga"><div class="t"><b>${escapeHtml(incNomeCliente(c.membro_id))}</b>
        <small>n. ${escapeHtml(c.numero)} · ${c.righe} ${c.righe === 1 ? "voce" : "voci"} ${statoConto(c)}</small></div>
        <div class="n">${incEuro(c.totale)}</div>
        <div class="a"><button class="btn btn-outline btn-sm" onclick="incApriConto('${c.id}')">Apri</button></div></div>`).join("")
      : '<div class="inc-vuoto">Nessun conto per questo mese. Tocca «Prepara i conti».</div>'}</div>`;
  if(INC.cassa === "scuderia"){
    const cav = INC.dati.cavalli || [];
    const opzClienti = sel => `<option value="">— proprietario della scheda —</option>` + (INC.dati.clienti || []).map(c => `<option value="${c.id}"${c.id === sel ? " selected" : ""}>${escapeHtml(c.nome || "")}</option>`).join("");
    html += `<div class="inc-sez">Rette mensili dei cavalli</div>
      <p class="inc-nota">La retta entra nel conto di chi la paga (di solito il proprietario del cavallo). Lascia vuoto per i cavalli senza retta.</p>
      <div class="card">${cav.length ? cav.map(c => `<div class="inc-riga"><div class="t"><b>${escapeHtml(c.nome)}</b><small>${c.intestatario ? "paga " + escapeHtml(incNomeCliente(c.intestatario)) : "nessun proprietario collegato: scegli chi paga"}</small></div>
          <div class="a"><input class="input" id="inc-retta-${c.id}" inputmode="decimal" placeholder="€ / mese" value="${c.retta != null ? String(c.retta).replace(".", ",") : ""}" style="width:110px;padding:7px 10px">
            <select class="input" id="inc-int-${c.id}" style="width:190px;padding:7px 10px">${opzClienti(c.intestatario_scelto)}</select>
            <button class="btn btn-outline btn-sm" onclick="incSalvaRetta('${c.id}', this)">Salva</button></div></div>`).join("")
        : '<div class="inc-vuoto">Nessun cavallo in scheda.</div>'}</div>`;
  }
  return html;
}

function incRenderPagamenti(){
  const lista = (INC.dati.pagamenti || []).filter(p => p.cassa === INC.cassa);
  const tot = lista.reduce((t, p) => t + Number(p.importo), 0);
  return `<div class="inc-sez" style="margin-top:0">Incassi di ${incMeseNome(INC.mese)} · ${incEuro(tot)}
      <span style="display:flex;gap:6px"><button class="btn btn-outline btn-sm" onclick="incEsporta()"><i class="fa-solid fa-file-csv"></i> Esporta per il commercialista</button>
      <button class="btn btn-primary btn-sm" onclick="incApriPagamento()"><i class="fa-solid fa-plus"></i> Registra</button></span></div>
    <div class="card">${lista.length ? lista.map(p => `<div class="inc-riga"><div class="t"><b>${escapeHtml(incNomeCliente(p.membro_id))}</b>
        <small>${incData(p.data)} · ${INC_METODI[p.metodo] || p.metodo} · ${escapeHtml(p.per || "")}${p.note ? " · " + escapeHtml(p.note) : ""}</small></div>
        <div class="n">${incEuro(p.importo)}</div>
        <div class="a">${p.cassa === "asd" ? `<button class="btn btn-outline btn-sm" onclick="asdRicevuta('${p.id}', this)"><i class="fa-solid fa-receipt"></i> ${p.ricevuta ? escapeHtml(p.ricevuta) : "Ricevuta"}</button>` : ""}
          ${p.ricevuta ? "" : `<button class="btn btn-ghost btn-sm" title="Elimina" onclick="incEliminaPagamento('${p.id}', this)"><i class="fa-solid fa-trash"></i></button>`}</div></div>`).join("")
      : '<div class="inc-vuoto">Nessun incasso registrato in questo mese.</div>'}</div>`;
}

function incRenderListino(){
  const l = INC.dati.listino || [];
  const gruppi = Object.keys(INC_CATEGORIE).filter(k => k !== "asd" || INC.dati.impostazioni.asd_attiva);
  return `<div class="inc-sez" style="margin-top:0">Listino del centro <button class="btn btn-primary btn-sm" onclick="incApriVoce()"><i class="fa-solid fa-plus"></i> Nuova voce</button></div>
    <p class="inc-nota">Le voci servono per aggiungere gli extra in un tocco. La prima voce attiva di «Lezioni» è il prezzo della lezione singola.</p>
    ${gruppi.map(g => {
      const v = l.filter(x => x.categoria === g);
      return `<div class="inc-sez">${INC_CATEGORIE[g]}</div><div class="card">${v.length ? v.map(x => `<div class="inc-riga"${x.attivo ? "" : ' style="opacity:.55"'}><div class="t"><b>${escapeHtml(x.nome)}</b>
          <small>${x.unita ? escapeHtml(x.unita) + " · " : ""}${x.cassa === "asd" ? escapeHtml(incCassaNome("asd")) : "Scuderia"}${x.attivo ? "" : " · non attiva"}</small></div>
          <div class="n">${incEuro(x.prezzo)}</div>
          <div class="a"><button class="btn btn-ghost btn-sm" onclick="incApriVoce('${x.id}')"><i class="fa-solid fa-pen"></i></button></div></div>`).join("")
        : '<div class="inc-vuoto">Nessuna voce.</div>'}</div>`;
    }).join("")}`;
}

function incRenderImpostazioni(){
  const s = INC.dati.impostazioni;
  return `<div class="card" style="max-width:560px">
    <div class="field"><label style="display:flex;align-items:center;gap:8px;text-transform:none;font-size:14px;color:var(--text)"><input type="checkbox" id="inc-set-asd" ${s.asd_attiva ? "checked" : ""} onchange="document.getElementById('inc-set-asd-box').style.display=this.checked?'block':'none'"> Il centro ha anche un'ASD (cassa separata)</label></div>
    <div id="inc-set-asd-box" style="display:${s.asd_attiva ? "block" : "none"}">
      <div class="field"><label>Nome dell'ASD</label><input class="input" id="inc-set-asd-nome" value="${escapeHtml(s.asd_nome || "")}" placeholder="Es. ASD Julius Cesar"></div>
      <div class="field"><label>Lezioni e pacchetti incassati da</label><select class="input" id="inc-set-cassa-lez">
        <option value="scuderia"${s.cassa_lezioni !== "asd" ? " selected" : ""}>Scuderia</option><option value="asd"${s.cassa_lezioni === "asd" ? " selected" : ""}>ASD</option></select></div>
    </div>
    <div class="field"><label>Lezioni singole (fuori dal carnet)</label><select class="input" id="inc-set-lez">
      <option value="nessuno"${s.lezioni_addebito === "nessuno" ? " selected" : ""}>Non le addebito da Equo</option>
      <option value="conto"${s.lezioni_addebito === "conto" ? " selected" : ""}>Vanno nel conto del mese</option>
      <option value="subito"${s.lezioni_addebito === "subito" ? " selected" : ""}>Le incasso alla lezione</option></select>
      <p class="inc-nota" style="margin-top:6px">In entrambi i casi, quando la lezione è segnata come fatta nasce l'addebito al prezzo della voce «Lezioni» del listino. Se la incassi subito, registri il pagamento e non finisce nel conto.</p></div>
    <button class="btn btn-primary" onclick="incSalvaImpostazioni(this)">Salva</button>
    <p class="inc-nota" style="margin-top:14px"><i class="fa-solid fa-circle-info"></i> Il conto è un riepilogo per il cliente, non una fattura né una ricevuta fiscale.</p></div>`;
}

/* ---------- ASD ---------- */
function incScadenzaChip(iso){
  if(!iso) return "";
  const gg = Math.floor((new Date(iso + "T12:00:00").getTime() - Date.now()) / 864e5);
  if(gg < 0) return `<span class="inc-chip no">scaduto il ${incData(iso)}</span>`;
  if(gg <= 30) return `<span class="inc-chip parz">scade il ${incData(iso)}</span>`;
  return `<span class="inc-chip ok">fino al ${incData(iso)}</span>`;
}
function incRenderAsd(){
  if(!INC.dati.impostazioni.asd_attiva) return `<div class="card" style="max-width:620px">
      <div class="inc-sez" style="margin-top:0"><span><i class="fa-solid fa-medal"></i> Gestione ASD</span></div>
      <p style="font-size:14px;line-height:1.55;margin:0 0 10px">Se il centro ha anche un'associazione sportiva dilettantistica, qui la gestisci con una <b>cassa separata</b> da quella della scuderia:</p>
      <ul style="font-size:13.5px;line-height:1.7;margin:0 0 14px;padding-left:20px">
        <li>certificati medici (agonistici e non) con le scadenze a semaforo;</li>
        <li>tesseramenti FISE, ASI, CSEN… con numero, scadenza e quota;</li>
        <li>gare: iscritti con cavallo, categoria, iscrizione e box;</li>
        <li>spese di trasferta divise da sole fra gli iscritti;</li>
        <li>quote e iscrizioni diventano addebiti dell'ASD, con conti e pagamenti separati.</li></ul>
      <div class="field"><label>Nome dell'ASD</label><input class="input" id="inc-asd-nome-att" placeholder="Es. ASD Julius Cesar"></div>
      <button class="btn btn-primary" onclick="incAttivaAsd(this)"><i class="fa-solid fa-check"></i> Attiva l'ASD</button></div>`;
  const a = INC.asd || { tesseramenti: [], certificati: [], gare: [] };
  const certScaduti = a.certificati.filter(c => new Date(c.scadenza + "T23:59:59") < new Date()).length;
  return `<div class="inc-sez" style="margin-top:0">Gestione ASD Basic</div><p class="inc-nota">Quote, iscrizioni e trasferte diventano addebiti della cassa «${escapeHtml(incCassaNome("asd"))}».${certScaduti ? ` <b style="color:var(--danger)">${certScaduti} certificati medici scaduti.</b>` : ""}</p>
    <div class="inc-sez">Certificati medici <button class="btn btn-primary btn-sm" onclick="incApriCertificato()"><i class="fa-solid fa-plus"></i> Certificato</button></div>
    <div class="card">${a.certificati.length ? a.certificati.map(c => `<div class="inc-riga"><div class="t"><b>${escapeHtml(c.nome)}</b>
        <small>${c.tipo === "agonistico" ? "Agonistico" : "Non agonistico"}${c.medico ? " · " + escapeHtml(c.medico) : ""} ${incScadenzaChip(c.scadenza)}</small></div>
        <div class="a"><button class="btn btn-ghost btn-sm" title="Elimina" onclick="incAsdElimina('scuderia_certificati','${c.id}', this)"><i class="fa-solid fa-trash"></i></button></div></div>`).join("")
      : '<div class="inc-vuoto">Nessun certificato registrato.</div>'}</div>
    <div class="inc-sez">Tesseramenti <button class="btn btn-primary btn-sm" onclick="incApriTesseramento()"><i class="fa-solid fa-plus"></i> Tesseramento</button></div>
    <div class="card">${a.tesseramenti.length ? a.tesseramenti.map(t => `<div class="inc-riga"><div class="t"><b>${escapeHtml(t.nome)}</b>
        <small>${escapeHtml(t.ente)}${t.tipo ? " · " + escapeHtml(t.tipo) : ""}${t.numero ? " · n. " + escapeHtml(t.numero) : ""} ${incScadenzaChip(t.scadenza)}</small></div>
        <div class="n">${Number(t.quota) > 0 ? incEuro(t.quota) : ""}</div>
        <div class="a"><button class="btn btn-ghost btn-sm" title="Elimina" onclick="incAsdElimina('scuderia_tesseramenti','${t.id}', this)"><i class="fa-solid fa-trash"></i></button></div></div>`).join("")
      : '<div class="inc-vuoto">Nessun tesseramento.</div>'}</div>
    <div class="inc-sez">Gare e trasferte <button class="btn btn-primary btn-sm" onclick="incApriGara()"><i class="fa-solid fa-plus"></i> Gara</button></div>
    ${a.gare.length ? a.gare.map(g => {
      const spese = g.spese.reduce((t, s) => t + Number(s.importo), 0), persone = new Set(g.iscritti.map(i => i.membro_id)).size;
      return `<div class="card" style="margin-bottom:12px">
        <div class="inc-riga" style="padding-top:0"><div class="t"><b>${escapeHtml(g.nome)}</b><small>${incData(g.data_inizio)}${g.data_fine && g.data_fine !== g.data_inizio ? " – " + incData(g.data_fine) : ""}${g.luogo ? " · " + escapeHtml(g.luogo) : ""}</small></div>
          <div class="a"><button class="btn btn-outline btn-sm" onclick="incApriIscritto('${g.id}')"><i class="fa-solid fa-user-plus"></i> Iscritto</button>
            <button class="btn btn-outline btn-sm" onclick="incApriSpesa('${g.id}')"><i class="fa-solid fa-van-shuttle"></i> Spesa</button>
            <button class="btn btn-ghost btn-sm" title="Elimina la gara" onclick="incAsdElimina('scuderia_gare','${g.id}', this)"><i class="fa-solid fa-trash"></i></button></div></div>
        ${g.iscritti.map(i => `<div class="inc-riga"><div class="t"><b>${escapeHtml(i.nome)}</b><small>${i.cavallo ? escapeHtml(i.cavallo) : "senza cavallo"}${i.categoria ? " · " + escapeHtml(i.categoria) : ""}</small></div>
          <div class="n">${incEuro(Number(i.quota) + Number(i.box))}${Number(i.box) > 0 ? ` <small style="font-weight:400;color:var(--muted)">(box ${incEuro(i.box)})</small>` : ""}</div>
          <div class="a"><button class="btn btn-ghost btn-sm" title="Togli" onclick="incAsdElimina('scuderia_gare_iscritti','${i.id}', this)"><i class="fa-solid fa-xmark"></i></button></div></div>`).join("") || '<div class="inc-vuoto">Nessun iscritto.</div>'}
        ${g.spese.length ? `<div style="font-size:12.5px;color:var(--muted);margin-top:8px">Trasferta: ${g.spese.map(s => `${escapeHtml(s.descrizione)} ${incEuro(s.importo)} <a href="#" onclick="event.preventDefault();incAsdElimina('scuderia_gare_spese','${s.id}', this)" title="Togli">✕</a>`).join(" · ")}
          = <b style="color:var(--text)">${incEuro(spese)}</b>${persone ? `, ${incEuro(spese / persone)} a testa (${persone} ${persone === 1 ? "persona" : "persone"})` : ""}</div>` : ""}
      </div>`;
    }).join("") : '<div class="card inc-vuoto">Nessuna gara. Aggiungi la gara, poi gli iscritti con cavallo e quota; le spese di trasferta si dividono da sole fra gli iscritti.</div>'}`
    + incRenderAsdFull();
}

async function incAttivaAsd(btn){
  if(DEMO_MODE){ showToast("In demo le modifiche non vengono salvate."); return; }
  const nome = incVal("inc-asd-nome-att");
  if(!nome){ showToast("Scrivi il nome dell'ASD."); return; }
  btn.disabled = true;
  const s = INC.dati.impostazioni;
  const r = await incRpc("incassi_impostazioni", { p_centro: currentCentro.id, p_asd_attiva: true, p_asd_nome: nome, p_lezioni_addebito: s.lezioni_addebito || "nessuno", p_cassa_lezioni: s.cassa_lezioni || "scuderia" });
  btn.disabled = false;
  if(r.errore){ showToast(r.errore); return; }
  showToast("ASD attivata: ora ha la sua cassa.");
  await incCarica(); await incCaricaAsd(); incRender();
}

/* ---------- finestra generica ---------- */
function incFinestra(titolo, corpo, salvaTesto, salva){
  document.getElementById("inc-modal-titolo").textContent = titolo;
  document.getElementById("inc-modal-corpo").innerHTML = corpo;
  document.getElementById("inc-modal-errore").style.display = "none";
  INC.azione = salva;
  document.getElementById("inc-modal-piede").innerHTML = salva
    ? `<button class="btn btn-outline" style="flex:1" onclick="closeModal('modal-inc')">Annulla</button><button class="btn btn-primary" style="flex:1" id="inc-modal-ok" onclick="incEseguiFinestra()">${salvaTesto}</button>` : "";
  openModal("modal-inc");
}
async function incEseguiFinestra(){
  const btn = document.getElementById("inc-modal-ok"), err = document.getElementById("inc-modal-errore");
  err.style.display = "none";
  if(DEMO_MODE){ closeModal("modal-inc"); showToast("In demo le modifiche non vengono salvate."); return; }
  btn.disabled = true;
  try{
    const msg = await INC.azione();
    if(msg && msg.errore){ err.textContent = msg.errore; err.style.display = "block"; return; }
    closeModal("modal-inc");
    if(msg && msg.toast) showToast(msg.toast);
    await incAggiorna();
    if(typeof incassiDecoraPacchetti === "function" && document.getElementById("module-pacchetti")?.style.display !== "none") incassiDecoraPacchetti();
  } catch(e){ console.error("incassi:", e); err.textContent = "Operazione non riuscita: " + (e?.message || "riprova"); err.style.display = "block"; }
  finally{ btn.disabled = false; }
}
const incVal = id => (document.getElementById(id)?.value || "").trim();
const incRpc = async (nome, args) => { const { data, error } = await sb.rpc(nome, args); if(error) return { errore: error.message }; if(data && data.ok === false) return { errore: data.errore || "Operazione non riuscita." }; return data || {}; };
function incOpzClienti(sel, vuoto){
  return (vuoto ? `<option value="">${vuoto}</option>` : "") + (INC.dati?.clienti || []).filter(c => c.ruolo !== "istruttore" || c.id === sel)
    .map(c => `<option value="${c.id}"${c.id === sel ? " selected" : ""}>${escapeHtml(c.nome || "")}${c.paga && c.paga !== c.id ? " (paga " + escapeHtml(incNomeCliente(c.paga)) + ")" : ""}</option>`).join("");
}
function incOpzCavalli(sel){
  return '<option value="">— nessuno —</option>' + (INC.dati?.cavalli || []).map(c => `<option value="${c.id}"${c.id === sel ? " selected" : ""}>${escapeHtml(c.nome)}</option>`).join("");
}
function incCampoCassa(id, sel){
  if(!INC.dati?.impostazioni?.asd_attiva) return "";
  return `<div class="field"><label>Cassa</label><select class="input" id="${id}"><option value="scuderia"${sel !== "asd" ? " selected" : ""}>Scuderia</option><option value="asd"${sel === "asd" ? " selected" : ""}>${escapeHtml(incCassaNome("asd"))}</option></select></div>`;
}

/* nuovo pagamento: libero (acconto, scalato dal più vecchio), su un addebito o su un conto */
function incApriPagamento(membro, addebito, conto){
  if(!INC.dati){ showToast("Apri prima la sezione Incassi."); return; }
  const a = addebito ? (INC.dati.addebiti || []).find(x => x.id === addebito) : null;
  const cassa = a ? a.cassa : INC.cassa;
  const suggerito = a ? a.residuo : conto ? (INC.contoAperto?.residuo || "") : membro ? ((INC.dati.saldi || []).find(s => s.membro_id === membro && s.cassa === cassa)?.residuo || "") : "";
  incFinestra(a ? "Incassa: " + a.descrizione : conto ? "Incassa il conto " + (INC.contoAperto?.numero || "") : "Registra un incasso", `
    ${a || conto ? `<p class="inc-nota">${escapeHtml(incNomeCliente(membro))}</p>` : `<div class="field"><label>Cliente</label><select class="input" id="inc-p-cliente">${incOpzClienti(membro, "— scegli —")}</select></div>${incCampoCassa("inc-p-cassa", cassa)}`}
    <div class="inc-form-2">
      <div class="field"><label>Importo €</label><input class="input" id="inc-p-importo" inputmode="decimal" value="${suggerito ? String(Number(suggerito).toFixed(2)).replace(".", ",") : ""}"></div>
      <div class="field"><label>Data</label><input class="input" type="date" id="inc-p-data" value="${incOggi()}"></div></div>
    <div class="field"><label>Metodo</label><select class="input" id="inc-p-metodo">${Object.entries(INC_METODI).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></div>
    <div class="field"><label>Nota <span style="text-transform:none;font-weight:400">(facoltativa)</span></label><input class="input" id="inc-p-note" maxlength="200" placeholder="Es. riferimento del bonifico"></div>
    ${a || conto ? "" : '<p class="inc-nota">Senza un addebito scelto, l\'incasso si scala dalle voci più vecchie del cliente.</p>'}`,
    "Registra", async () => {
      const importo = incNum(incVal("inc-p-importo"));
      const m = membro || incVal("inc-p-cliente");
      if(!m) return { errore: "Scegli il cliente." };
      if(!importo || importo <= 0) return { errore: "Scrivi l'importo." };
      const r = await incRpc("incassi_registra_pagamento", { p_centro: currentCentro.id, p_membro: m, p_cassa: document.getElementById("inc-p-cassa")?.value || cassa,
        p_importo: importo, p_metodo: incVal("inc-p-metodo"), p_data: incVal("inc-p-data") || incOggi(), p_addebito: addebito || null, p_conto: conto || null, p_note: incVal("inc-p-note") || null });
      if(r.errore) return r;
      if(conto && document.getElementById("modal-inc")) setTimeout(() => incApriConto(conto), 300);
      return { toast: "Incasso di " + incEuro(importo) + " registrato." };
    });
}

function incApriAddebito(){
  const voci = (INC.dati.listino || []).filter(v => v.attivo);
  incFinestra("Nuovo addebito", `
    <div class="field"><label>Cliente</label><select class="input" id="inc-a-cliente">${incOpzClienti(null, "— scegli —")}</select></div>
    ${voci.length ? `<div class="field"><label>Dal listino</label><select class="input" id="inc-a-voce" onchange="incVoceScelta(this.value)"><option value="">— scrivi a mano —</option>${voci.map(v => `<option value="${v.id}">${escapeHtml(v.nome)} · ${incEuro(v.prezzo)}${v.unita ? " / " + escapeHtml(v.unita) : ""}</option>`).join("")}</select></div>` : ""}
    <div class="field"><label>Descrizione</label><input class="input" id="inc-a-descr" maxlength="120" placeholder="Es. Tosatura"></div>
    <div class="inc-form-2">
      <div class="field"><label>Quantità</label><input class="input" id="inc-a-qta" inputmode="decimal" value="1"></div>
      <div class="field"><label>Prezzo €</label><input class="input" id="inc-a-prezzo" inputmode="decimal"></div>
      <div class="field"><label>Cavallo</label><select class="input" id="inc-a-cavallo">${incOpzCavalli(null)}</select></div>
      <div class="field"><label>Data</label><input class="input" type="date" id="inc-a-data" value="${incOggi()}"></div></div>
    ${incCampoCassa("inc-a-cassa", INC.cassa)}
    <p class="inc-nota">Per un minore l'addebito va al genitore o referente indicato nella sua scheda cliente.</p>`,
    "Aggiungi", async () => {
      const m = incVal("inc-a-cliente"), d = incVal("inc-a-descr"), p = incNum(incVal("inc-a-prezzo")), q = incNum(incVal("inc-a-qta")) || 1;
      if(!m) return { errore: "Scegli il cliente." };
      if(!d) return { errore: "Scrivi cosa addebiti." };
      if(p == null || p < 0) return { errore: "Scrivi il prezzo." };
      const r = await incRpc("incassi_salva_addebito", { p_centro: currentCentro.id, p_id: null, p_membro: m, p_cassa: document.getElementById("inc-a-cassa")?.value || "scuderia",
        p_cavallo: incVal("inc-a-cavallo") || null, p_descrizione: d, p_quantita: q, p_prezzo: p, p_data: incVal("inc-a-data") || incOggi() });
      return r.errore ? r : { toast: "Addebito aggiunto: " + incEuro(p * q) + "." };
    });
}
function incVoceScelta(id){
  const v = (INC.dati.listino || []).find(x => x.id === id); if(!v) return;
  document.getElementById("inc-a-descr").value = v.nome;
  document.getElementById("inc-a-prezzo").value = String(Number(v.prezzo).toFixed(2)).replace(".", ",");
  const c = document.getElementById("inc-a-cassa"); if(c) c.value = v.cassa;
}

async function incEliminaAddebito(id, btn){
  if(!incConferma(btn, "Elimina?")) return;
  if(DEMO_MODE){ showToast("In demo le modifiche non vengono salvate."); return; }
  const r = await incRpc("incassi_elimina_addebito", { p_id: id });
  if(r.errore){ showToast(r.errore); return; }
  showToast("Addebito eliminato."); incAggiorna();
}
async function incEliminaPagamento(id, btn){
  if(!incConferma(btn, "Elimina?")) return;
  if(DEMO_MODE){ showToast("In demo le modifiche non vengono salvate."); return; }
  const r = await incRpc("incassi_elimina_pagamento", { p_id: id });
  if(r.errore){ showToast(r.errore); return; }
  showToast("Incasso eliminato."); incAggiorna();
}
async function incSollecita(membro, btn){
  if(DEMO_MODE){ showToast("In demo il promemoria non parte."); return; }
  if(btn) btn.disabled = true;
  const r = await incRpc("incassi_sollecita", { p_centro: currentCentro.id, p_membro: membro, p_cassa: INC.cassa });
  if(btn) btn.disabled = false;
  showToast(r.errore || ("Promemoria inviato in chat: " + incEuro(r.importo) + " da saldare."));
}
async function incGeneraConti(btn){
  if(DEMO_MODE){ showToast("In demo i conti non si generano."); return; }
  btn.disabled = true;
  const r = await incRpc("incassi_genera_conti", { p_centro: currentCentro.id, p_mese: INC.mese, p_cassa: INC.cassa });
  btn.disabled = false;
  if(r.errore){ showToast(r.errore); return; }
  showToast(r.conti || r.righe ? `Fatto: ${r.rette ? r.rette + " rette, " : ""}${r.conti} conti nuovi, ${r.righe} voci messe nei conti.` : "Niente di nuovo da mettere nei conti.");
  incAggiorna();
}
async function incSalvaRetta(cav, btn){
  if(DEMO_MODE){ showToast("In demo le modifiche non vengono salvate."); return; }
  const v = incNum(incVal("inc-retta-" + cav));
  btn.disabled = true;
  const r = await incRpc("incassi_retta_cavallo", { p_cavallo: cav, p_retta: v && v > 0 ? v : null, p_intestatario: incVal("inc-int-" + cav) || null });
  btn.disabled = false;
  showToast(r.errore || (v ? "Retta salvata: " + incEuro(v) + " al mese." : "Retta tolta."));
  if(!r.errore) incAggiorna();
}
async function incSalvaImpostazioni(btn){
  if(DEMO_MODE){ showToast("In demo le modifiche non vengono salvate."); return; }
  btn.disabled = true;
  const asd = document.getElementById("inc-set-asd").checked;
  const r = await incRpc("incassi_impostazioni", { p_centro: currentCentro.id, p_asd_attiva: asd, p_asd_nome: incVal("inc-set-asd-nome") || null,
    p_lezioni_addebito: incVal("inc-set-lez"), p_cassa_lezioni: asd ? incVal("inc-set-cassa-lez") : "scuderia" });
  btn.disabled = false;
  showToast(r.errore || "Impostazioni salvate.");
  if(!r.errore) incAggiorna();
}

/* listino */
function incApriVoce(id){
  const v = id ? (INC.dati.listino || []).find(x => x.id === id) : { categoria: "servizio", cassa: "scuderia", attivo: true };
  incFinestra(id ? "Modifica voce" : "Nuova voce del listino", `
    <div class="field"><label>Nome</label><input class="input" id="inc-v-nome" maxlength="80" value="${escapeHtml(v.nome || "")}" placeholder="Es. Integratore articolare"></div>
    <div class="inc-form-2">
      <div class="field"><label>Prezzo €</label><input class="input" id="inc-v-prezzo" inputmode="decimal" value="${v.prezzo != null ? String(Number(v.prezzo).toFixed(2)).replace(".", ",") : ""}"></div>
      <div class="field"><label>Unità <span style="text-transform:none;font-weight:400">(facoltativa)</span></label><input class="input" id="inc-v-unita" maxlength="30" value="${escapeHtml(v.unita || "")}" placeholder="a sacco, al mese…"></div>
      <div class="field"><label>Categoria</label><select class="input" id="inc-v-cat">${Object.entries(INC_CATEGORIE).filter(([k]) => k !== "asd" || INC.dati.impostazioni.asd_attiva).map(([k, n]) => `<option value="${k}"${v.categoria === k ? " selected" : ""}>${n}</option>`).join("")}</select></div>
      <div class="field"><label>Attiva</label><select class="input" id="inc-v-attivo"><option value="1"${v.attivo ? " selected" : ""}>Sì</option><option value="0"${v.attivo ? "" : " selected"}>No</option></select></div></div>
    ${incCampoCassa("inc-v-cassa", v.cassa)}`,
    "Salva", async () => {
      const riga = { centro_id: currentCentro.id, nome: incVal("inc-v-nome"), prezzo: incNum(incVal("inc-v-prezzo")), unita: incVal("inc-v-unita") || null,
        categoria: incVal("inc-v-cat"), attivo: incVal("inc-v-attivo") === "1", cassa: document.getElementById("inc-v-cassa")?.value || (incVal("inc-v-cat") === "asd" ? "asd" : "scuderia") };
      if(!riga.nome) return { errore: "Scrivi il nome." };
      if(riga.prezzo == null || riga.prezzo < 0) return { errore: "Scrivi il prezzo." };
      const q = id ? sb.from("scuderia_listino").update(riga).eq("id", id) : sb.from("scuderia_listino").insert(riga);
      const { error } = await q;
      return error ? { errore: error.message } : { toast: "Listino aggiornato." };
    });
}

/* conto: dettaglio, PDF, invio */
async function incApriConto(id){
  let c;
  if(DEMO_MODE){ c = incDemoConto(id); }
  else {
    const { data, error } = await sb.rpc("incassi_conto", { p_id: id });
    if(error || !data || data.errore){ showToast("Non riesco ad aprire il conto."); return; }
    c = data;
  }
  INC.contoAperto = c;
  const pagato = Number(c.totale) > 0 && Number(c.residuo) <= 0.004;
  incFinestra(`Conto ${c.numero} · ${c.intestatario}`, `
    <p class="inc-nota">${escapeHtml(c.emittente)} · ${incMeseNome(c.mese)} · ${pagato ? '<span class="inc-chip ok">pagato</span>' : c.stato === "inviato" ? `<span class="inc-chip parz">inviato il ${incData(c.inviato_il)}</span>` : '<span class="inc-chip">bozza: il cliente non lo vede ancora</span>'}</p>
    <table class="inc-conto-tab">${(c.righe || []).map(r => `<tr><td>${escapeHtml(r.descrizione)}${r.per ? `<br><small style="color:var(--muted)">per ${escapeHtml(r.per)}</small>` : ""}</td>
      <td class="n">${Number(r.quantita) !== 1 ? `${String(Number(r.quantita)).replace(".", ",")} × ${incEuro(r.prezzo)}<br>` : ""}<b>${incEuro(r.importo)}</b><br>${incStatoChip(r.importo, r.pagato)}</td></tr>`).join("")}
      <tr><td><b>Totale</b></td><td class="n"><b>${incEuro(c.totale)}</b></td></tr>
      ${Number(c.pagato) > 0 ? `<tr><td>Già pagato</td><td class="n">${incEuro(c.pagato)}</td></tr><tr><td><b>Da pagare</b></td><td class="n"><b>${incEuro(c.residuo)}</b></td></tr>` : ""}</table>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:14px">
      <button class="btn btn-outline btn-sm" onclick="incPdfConto()"><i class="fa-solid fa-file-pdf"></i> PDF</button>
      ${!pagato ? `<button class="btn btn-outline btn-sm" onclick="closeModal('modal-inc');setTimeout(()=>incApriPagamento('${c.membro_id || ""}', null, '${c.id}'), 200)"><i class="fa-solid fa-euro-sign"></i> Incassa</button>` : ""}
      ${c.stato !== "inviato" ? `<button class="btn btn-primary btn-sm" onclick="incInviaConto('${c.id}', this)"><i class="fa-solid fa-paper-plane"></i> Invia al cliente</button>` : ""}
    </div>
    <p class="inc-nota" style="margin-top:12px">Riepilogo per il cliente: non è una fattura né una ricevuta fiscale.</p>`, null, null);
}
async function incInviaConto(id, btn){
  if(DEMO_MODE){ showToast("In demo il conto non parte."); return; }
  btn.disabled = true;
  const r = await incRpc("incassi_invia_conto", { p_id: id });
  btn.disabled = false;
  if(r.errore){ showToast(r.errore); return; }
  closeModal("modal-inc");
  showToast(r.app ? "Conto inviato: il cliente lo trova nell'App Equo e ha ricevuto un messaggio in chat." : "Conto segnato come inviato. Il cliente non ha l'app: mandagli il PDF.");
  incAggiorna();
}
function incPdfConto(){
  const c = INC.contoAperto; if(!c) return;
  if(!window.jspdf){ showToast("Generatore PDF non disponibile, riprova."); return; }
  const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
  let y = 20;
  doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.text(c.emittente || "", 15, y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(110);
  const ind = [c.centro?.indirizzo, [c.centro?.citta, c.centro?.provincia ? "(" + c.centro.provincia + ")" : ""].filter(Boolean).join(" "), c.centro?.telefono].filter(Boolean).join(" · ");
  if(ind){ y += 6; doc.text(ind, 15, y); }
  doc.setTextColor(0); y += 14;
  doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text(`Riepilogo conto n. ${c.numero} · ${incMeseNome(c.mese)}`, 15, y);
  y += 7; doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.text("Intestato a: " + (c.intestatario || ""), 15, y);
  y += 10; doc.setDrawColor(200); doc.line(15, y, 195, y); y += 6;
  doc.setFontSize(10);
  (c.righe || []).forEach(r => {
    const testo = doc.splitTextToSize((r.descrizione || "") + (r.per ? ` (per ${r.per})` : ""), 120);
    doc.text(testo, 15, y);
    if(Number(r.quantita) !== 1) doc.text(`${String(Number(r.quantita)).replace(".", ",")} × ${incEuro(r.prezzo)}`, 150, y, { align: "right" });
    doc.text(incEuro(r.importo), 195, y, { align: "right" });
    y += 5.5 * testo.length + 1.5;
    if(y > 265){ doc.addPage(); y = 20; }
  });
  y += 2; doc.line(15, y, 195, y); y += 7;
  doc.setFont("helvetica", "bold"); doc.text("Totale", 15, y); doc.text(incEuro(c.totale), 195, y, { align: "right" });
  if(Number(c.pagato) > 0){
    y += 6; doc.setFont("helvetica", "normal"); doc.text("Già pagato", 15, y); doc.text(incEuro(c.pagato), 195, y, { align: "right" });
    y += 6; doc.setFont("helvetica", "bold"); doc.text("Da pagare", 15, y); doc.text(incEuro(c.residuo), 195, y, { align: "right" });
  }
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(120);
  doc.text("Documento riepilogativo: non costituisce fattura né ricevuta fiscale. Generato con Equo Scuderia.", 15, 285);
  doc.save(`Conto_${c.numero}_${(c.intestatario || "").replace(/[^\w]+/g, "_")}.pdf`);
}
function incEstratto(membro){
  const voci = (INC.dati.addebiti || []).filter(a => a.membro_id === membro && a.cassa === INC.cassa && Number(a.residuo) > 0);
  const s = (INC.dati.saldi || []).find(x => x.membro_id === membro && x.cassa === INC.cassa) || {};
  incFinestra(incNomeCliente(membro) + " · da pagare", `
    <div>${voci.length ? voci.map(a => incRigaAddebito(a, false)).join("") : '<div class="inc-vuoto">Niente da pagare.</div>'}</div>
    <div class="inc-riga"><div class="t"><b>Totale da pagare</b>${Number(s.credito) > 0 ? `<small>credito ${incEuro(s.credito)}</small>` : ""}</div><div class="n">${incEuro(s.residuo)}</div></div>
    <div style="display:flex;gap:6px;margin-top:12px"><button class="btn btn-primary btn-sm" onclick="closeModal('modal-inc');setTimeout(()=>incApriPagamento('${membro}'),200)">Incassa</button>
      <button class="btn btn-outline btn-sm" onclick="closeModal('modal-inc');chattaConMembro('${membro}')"><i class="fa-solid fa-comment-dots"></i> Chatta</button></div>`, null, null);
}
function incEsporta(){
  if(pianoCentro && pianoCentro.incassi_auto === false){ apriUpsell("incassi_auto"); return; }
  const righe = [["Data", "Cliente", "Cassa", "Metodo", "Importo", "Riferimento", "Nota"]].concat(
    (INC.dati.pagamenti || []).map(p => [p.data, incNomeCliente(p.membro_id), incCassaNome(p.cassa), INC_METODI[p.metodo] || p.metodo, String(Number(p.importo).toFixed(2)).replace(".", ","), p.per || "", p.note || ""]));
  const csv = "﻿" + righe.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `Incassi_${INC.mese.slice(0, 7)}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ASD: finestre */
function incApriCertificato(){
  incFinestra("Certificato medico", `
    <div class="field"><label>Atleta</label><select class="input" id="inc-c-cliente">${incOpzClienti(null, "— scegli —")}</select></div>
    <div class="inc-form-2">
      <div class="field"><label>Tipo</label><select class="input" id="inc-c-tipo"><option value="non_agonistico">Non agonistico</option><option value="agonistico">Agonistico</option></select></div>
      <div class="field"><label>Scade il</label><input class="input" type="date" id="inc-c-scad"></div>
      <div class="field"><label>Rilasciato il</label><input class="input" type="date" id="inc-c-ril"></div>
      <div class="field"><label>Medico <span style="text-transform:none;font-weight:400">(facoltativo)</span></label><input class="input" id="inc-c-medico" maxlength="80"></div></div>`,
    "Salva", async () => {
      const r = { centro_id: currentCentro.id, membro_id: incVal("inc-c-cliente"), tipo: incVal("inc-c-tipo"), scadenza: incVal("inc-c-scad"), rilasciato_il: incVal("inc-c-ril") || null, medico: incVal("inc-c-medico") || null };
      if(!r.membro_id) return { errore: "Scegli l'atleta." };
      if(!r.scadenza) return { errore: "Scrivi quando scade." };
      const { error } = await sb.from("scuderia_certificati").insert(r);
      return error ? { errore: error.message } : { toast: "Certificato registrato." };
    });
}
function incApriTesseramento(){
  incFinestra("Tesseramento", `
    <div class="field"><label>Tesserato</label><select class="input" id="inc-t-cliente">${incOpzClienti(null, "— scegli —")}</select></div>
    <div class="inc-form-2">
      <div class="field"><label>Ente</label><input class="input" id="inc-t-ente" value="FISE" maxlength="40" list="inc-enti"><datalist id="inc-enti"><option>FISE</option><option>ASI</option><option>CSEN</option><option>UISP</option><option>ENDAS</option><option>OPES</option></datalist></div>
      <div class="field"><label>Tipo / patente</label><input class="input" id="inc-t-tipo" maxlength="40" placeholder="Es. Patente A"></div>
      <div class="field"><label>Numero tessera</label><input class="input" id="inc-t-num" maxlength="40"></div>
      <div class="field"><label>Quota €</label><input class="input" id="inc-t-quota" inputmode="decimal" placeholder="0 se non la incassate voi"></div>
      <div class="field"><label>Dal</label><input class="input" type="date" id="inc-t-dal" value="${incOggi()}"></div>
      <div class="field"><label>Scade il</label><input class="input" type="date" id="inc-t-scad"></div></div>`,
    "Salva", async () => {
      const r = { centro_id: currentCentro.id, membro_id: incVal("inc-t-cliente"), ente: incVal("inc-t-ente") || "FISE", tipo: incVal("inc-t-tipo") || null, numero: incVal("inc-t-num") || null,
        quota: incNum(incVal("inc-t-quota")) || 0, data_inizio: incVal("inc-t-dal") || null, scadenza: incVal("inc-t-scad") || null };
      if(!r.membro_id) return { errore: "Scegli il tesserato." };
      const { error } = await sb.from("scuderia_tesseramenti").insert(r);
      return error ? { errore: error.message } : { toast: r.quota > 0 ? "Tesseramento registrato: la quota è fra gli addebiti dell'ASD." : "Tesseramento registrato." };
    });
}
function incApriGara(){
  incFinestra("Nuova gara", `
    <div class="field"><label>Nome</label><input class="input" id="inc-g-nome" maxlength="80" placeholder="Es. Trofeo dei Pratoni"></div>
    <div class="field"><label>Luogo</label><input class="input" id="inc-g-luogo" maxlength="80"></div>
    <div class="inc-form-2">
      <div class="field"><label>Dal</label><input class="input" type="date" id="inc-g-dal"></div>
      <div class="field"><label>Al</label><input class="input" type="date" id="inc-g-al"></div>
      <div class="field"><label>Iscrizione € (per binomio)</label><input class="input" id="inc-g-quota" inputmode="decimal"></div>
      <div class="field"><label>Box € (per cavallo)</label><input class="input" id="inc-g-box" inputmode="decimal"></div></div>`,
    "Crea", async () => {
      const r = { centro_id: currentCentro.id, nome: incVal("inc-g-nome"), luogo: incVal("inc-g-luogo") || null, data_inizio: incVal("inc-g-dal"), data_fine: incVal("inc-g-al") || null,
        quota_default: incNum(incVal("inc-g-quota")) || 0, box_default: incNum(incVal("inc-g-box")) || 0 };
      if(!r.nome) return { errore: "Scrivi il nome della gara." };
      if(!r.data_inizio) return { errore: "Scrivi la data." };
      const { error } = await sb.from("scuderia_gare").insert(r);
      return error ? { errore: error.message } : { toast: "Gara creata: aggiungi gli iscritti." };
    });
}
function incApriIscritto(gara){
  const g = (INC.asd?.gare || []).find(x => x.id === gara) || {};
  incFinestra("Iscritto · " + (g.nome || "gara"), `
    <div class="field"><label>Cavaliere</label><select class="input" id="inc-i-cliente">${incOpzClienti(null, "— scegli —")}</select></div>
    <div class="inc-form-2">
      <div class="field"><label>Cavallo</label><select class="input" id="inc-i-cavallo">${incOpzCavalli(null)}</select></div>
      <div class="field"><label>Categoria</label><input class="input" id="inc-i-cat" maxlength="40" placeholder="Es. B110"></div>
      <div class="field"><label>Iscrizione €</label><input class="input" id="inc-i-quota" inputmode="decimal" value="${Number(g.quota_default) ? String(g.quota_default).replace(".", ",") : ""}"></div>
      <div class="field"><label>Box €</label><input class="input" id="inc-i-box" inputmode="decimal" value="${Number(g.box_default) ? String(g.box_default).replace(".", ",") : ""}"></div></div>`,
    "Iscrivi", async () => {
      const r = { gara_id: gara, centro_id: currentCentro.id, membro_id: incVal("inc-i-cliente"), cavallo_id: incVal("inc-i-cavallo") || null, categoria: incVal("inc-i-cat") || null,
        quota: incNum(incVal("inc-i-quota")) || 0, box: incNum(incVal("inc-i-box")) || 0 };
      if(!r.membro_id) return { errore: "Scegli il cavaliere." };
      const { error } = await sb.from("scuderia_gare_iscritti").insert(r);
      return error ? { errore: error.message } : { toast: "Iscritto: quota e trasferta sono fra gli addebiti dell'ASD." };
    });
}
function incApriSpesa(gara){
  incFinestra("Spesa di trasferta", `
    <div class="field"><label>Cosa</label><input class="input" id="inc-s-descr" maxlength="80" placeholder="Es. Van e gasolio, autostrada, albergo"></div>
    <div class="field"><label>Importo €</label><input class="input" id="inc-s-imp" inputmode="decimal"></div>
    <p class="inc-nota">Il totale delle spese si divide in parti uguali fra i cavalieri iscritti e si ricalcola da solo se qualcuno si aggiunge o si ritira.</p>`,
    "Aggiungi", async () => {
      const r = { gara_id: gara, centro_id: currentCentro.id, descrizione: incVal("inc-s-descr"), importo: incNum(incVal("inc-s-imp")) };
      if(!r.descrizione) return { errore: "Scrivi la spesa." };
      if(r.importo == null || r.importo < 0) return { errore: "Scrivi l'importo." };
      const { error } = await sb.from("scuderia_gare_spese").insert(r);
      return error ? { errore: error.message } : { toast: "Spesa aggiunta e divisa fra gli iscritti." };
    });
}
async function incAsdElimina(tabella, id, btn){
  if(!incConferma(btn, "Elimina?")) return;
  if(DEMO_MODE){ showToast("In demo le modifiche non vengono salvate."); return; }
  const { error } = await sb.from(tabella).delete().eq("id", id);
  if(error){ showToast("Non eliminato: " + error.message); return; }
  showToast("Eliminato."); incAggiorna();
}

/* ---------- Pacchetti: barra delle schede e stato del pagamento ---------- */
async function incassiDecoraPacchetti(){
  if(!puoGestireIncassi()) return;
  const celle = document.querySelectorAll("[data-pac-pag]");
  if(!celle.length) return;
  let stato = {};
  if(DEMO_MODE){ (demoState.pacchetti || []).forEach((p, i) => { if(p.prezzo) stato[p.id] = { addebito_id: null, importo: p.prezzo, pagato: i % 2 ? p.prezzo : 0, residuo: i % 2 ? 0 : p.prezzo }; }); }
  else {
    const { data, error } = await sb.rpc("incassi_stato_pacchetti", { p_centro: currentCentro.id });
    if(error){ console.warn("stato pacchetti:", error.message); return; }
    stato = data || {};
  }
  INC.statoPac = stato;
  celle.forEach(td => {
    const s = stato[td.dataset.pacPag], p = (typeof pacchettiList !== "undefined" ? pacchettiList : []).find(x => x.id === td.dataset.pacPag);
    if(!s){ td.innerHTML = p && !Number(p.prezzo) ? '<span style="color:var(--muted);font-size:12px">senza prezzo</span>' : ""; return; }
    td.innerHTML = incStatoChip(s.importo, s.pagato)
      + (Number(s.residuo) > 0 && p?.membro_id ? ` <button class="btn btn-ghost btn-sm" onclick="incIncassaPacchetto('${td.dataset.pacPag}')">Incassa</button>` : "");
  });
}
async function incIncassaPacchetto(pacId){
  if(!INC.dati) await incCarica();
  const s = INC.statoPac?.[pacId], p = (pacchettiList || []).find(x => x.id === pacId);
  if(!s || !p) return;
  if(s.addebito_id && !(INC.dati.addebiti || []).some(a => a.id === s.addebito_id)){
    INC.dati.addebiti = (INC.dati.addebiti || []).concat([{ id: s.addebito_id, membro_id: p.membro_id, cassa: INC.dati.impostazioni.cassa_lezioni || "scuderia", descrizione: "Pacchetto", importo: s.importo, residuo: s.residuo, origine: "pacchetto" }]);
  }
  const a = (INC.dati.addebiti || []).find(x => x.id === s.addebito_id);
  incApriPagamento(a ? a.membro_id : p.membro_id, s.addebito_id || null);
}
function incassiPreparaPacchetti(){
  const mod = document.getElementById("module-pacchetti");
  if(!mod) return;
  let bar = document.getElementById("inc-tabbar-pac");
  if(!bar){
    bar = document.createElement("div"); bar.id = "inc-tabbar-pac"; bar.className = "inc-tabbar";
    mod.insertBefore(bar, mod.querySelector(".page-header")?.nextSibling || mod.firstChild);
  }
  bar.style.display = puoGestireIncassi() ? "flex" : "none";
  bar.innerHTML = incTabbarHtml("pacchetti");
  document.querySelectorAll('.nav-item[data-module="incassi"]').forEach(b => b.classList.add("active"));
  document.querySelectorAll('.pac-col-pag').forEach(el => el.style.display = puoGestireIncassi() ? "" : "none");
}
if(typeof quandoApriSezione === "function"){
  quandoApriSezione(key => {
    if(key === "incassi") refreshIncassiModule();
    if(key === "pacchetti") incassiPreparaPacchetti();
    const t = document.getElementById("topbar-title");
    if(t && (key === "incassi" || key === "pacchetti")) t.textContent = key === "incassi" ? "Incassi" : "Incassi · Pacchetti";
  });
} else {
  document.addEventListener("DOMContentLoaded", () => quandoApriSezione(key => { if(key === "incassi") refreshIncassiModule(); if(key === "pacchetti") incassiPreparaPacchetti(); }));
}

/* ---------- dati della demo ---------- */
function incDemoDati(){
  const membri = (demoState.membri || []).filter(m => m.ruolo !== "istruttore");
  const cav = (demoState.cavalli || []).filter(c => !c.uscito_il);
  const cl = membri.filter(m => ["allievo", "proprietario"].includes(m.ruolo));
  const m0 = (cl[0] || membri[0] || {}).id, m1 = (cl[1] || cl[0] || membri[0] || {}).id;
  const mese = INC.mese, g = n => mese.slice(0, 8) + String(n).padStart(2, "0");
  const addebiti = [
    { id: "da1", membro_id: m0, beneficiario_id: m0, cassa: "scuderia", cavallo: cav[0]?.nome, origine: "retta", descrizione: `Retta ${incMeseNome(mese)} · ${cav[0]?.nome || "Ares"}`, quantita: 1, prezzo: 380, importo: 380, residuo: 180, data: g(1), conto: "C-2026-001", conto_id: "dc1" },
    { id: "da2", membro_id: m0, beneficiario_id: m0, cassa: "scuderia", cavallo: cav[0]?.nome, origine: "manuale", descrizione: "Integratore articolare", quantita: 2, prezzo: 35, importo: 70, residuo: 70, data: g(8), conto: "C-2026-001", conto_id: "dc1" },
    { id: "da3", membro_id: m1, beneficiario_id: m1, cassa: "scuderia", origine: "pacchetto", descrizione: "Carnet 10 lezioni", quantita: 1, prezzo: 250, importo: 250, residuo: 0, data: g(3) },
    { id: "da4", membro_id: m1, beneficiario_id: m1, cassa: "scuderia", origine: "lezione", descrizione: "Lezione singola del " + g(5).slice(8) + "/" + mese.slice(5, 7), quantita: 1, prezzo: 30, importo: 30, residuo: 30, data: g(5) },
    { id: "da5", membro_id: m0, beneficiario_id: m0, cassa: "asd", origine: "tesseramento", descrizione: "Tesseramento FISE · Patente A", quantita: 1, prezzo: 45, importo: 45, residuo: 45, data: g(2) },
  ];
  const pagamenti = [
    { id: "dp1", membro_id: m0, cassa: "scuderia", data: g(4), importo: 200, metodo: "bonifico", per: "Conto C-2026-001" },
    { id: "dp2", membro_id: m1, cassa: "scuderia", data: g(3), importo: 250, metodo: "pos", per: "Carnet 10 lezioni" },
  ];
  const somma = (arr, f) => arr.reduce((t, x) => t + Number(f(x) || 0), 0);
  const saldi = [];
  [m0, m1].filter((v, i, a) => v && a.indexOf(v) === i).forEach(m => ["scuderia", "asd"].forEach(c => {
    const v = addebiti.filter(a => a.membro_id === m && a.cassa === c && a.residuo > 0);
    if(v.length) saldi.push({ membro_id: m, cassa: c, residuo: somma(v, a => a.residuo), credito: 0, dal: v.map(a => a.data).sort()[0] });
  }));
  const riep = c => ({ cassa: c, emesso: somma(addebiti.filter(a => a.cassa === c), a => a.importo), incassato: somma(pagamenti.filter(p => p.cassa === c), p => p.importo),
    da_incassare: somma(addebiti.filter(a => a.cassa === c), a => a.residuo), in_ritardo: 0, per_metodo: pagamenti.filter(p => p.cassa === c).reduce((o, p) => (o[p.metodo] = (o[p.metodo] || 0) + p.importo, o), {}) });
  return {
    mese, impostazioni: { asd_attiva: true, asd_nome: "ASD " + (demoState.centro?.nome || "Centro Ippico Demo"), lezioni_addebito: "conto", cassa_lezioni: "scuderia", auto: true, centro: demoState.centro?.nome },
    listino: [{ id: "dl1", nome: "Pensione box + paddock", categoria: "pensione", prezzo: 380, unita: "al mese", cassa: "scuderia", attivo: true },
              { id: "dl2", nome: "Lezione singola", categoria: "lezione", prezzo: 30, cassa: "scuderia", attivo: true },
              { id: "dl3", nome: "Integratore articolare", categoria: "servizio", prezzo: 35, unita: "a sacco", cassa: "scuderia", attivo: true },
              { id: "dl4", nome: "Tosatura", categoria: "servizio", prezzo: 60, cassa: "scuderia", attivo: true },
              { id: "dl5", nome: "Quota associativa annuale", categoria: "asd", prezzo: 50, cassa: "asd", attivo: true }],
    clienti: membri.map(m => ({ id: m.id, nome: m.nome_visualizzato, ruolo: m.ruolo, app: !!m.user_id, paga: m.id })),
    cavalli: cav.map((c, i) => ({ id: c.id, nome: c.nome, tipo: c.tipo_proprieta, retta: i === 0 ? 380 : null, intestatario: i === 0 ? m0 : null, intestatario_scelto: null })),
    addebiti, pagamenti,
    conti: [{ id: "dc1", membro_id: m0, cassa: "scuderia", numero: "C-2026-001", stato: "inviato", inviato_il: g(2), righe: 2, totale: 450, pagato: 200, residuo: 250 }],
    saldi, riepilogo: [riep("scuderia"), riep("asd")],
  };
}
function incDemoConto(id){
  const c = (INC.dati.conti || []).find(x => x.id === id) || {};
  return { ...c, mese: INC.mese, intestatario: incNomeCliente(c.membro_id), emittente: demoState.centro?.nome || "Centro Ippico Demo",
    centro: { nome: demoState.centro?.nome, citta: "Roma", telefono: "06 1234567" },
    righe: (INC.dati.addebiti || []).filter(a => a.conto_id === id).map(a => ({ descrizione: a.descrizione, quantita: a.quantita, prezzo: a.prezzo, importo: a.importo, pagato: a.importo - a.residuo, residuo: a.residuo })) };
}
function incDemoAsd(){
  const cl = (INC.dati?.clienti || []).filter(c => ["allievo", "proprietario"].includes(c.ruolo));
  const a = cl[0] || {}, b = cl[1] || cl[0] || {};
  const tra = n => { const d = new Date(Date.now() + n * 864e5); return d.toISOString().slice(0, 10); };
  return {
    tesseramenti: [{ id: "dt1", nome: a.nome, ente: "FISE", tipo: "Patente A", numero: "123456", scadenza: tra(220), quota: 45 }],
    certificati: [{ id: "dce1", nome: a.nome, tipo: "agonistico", scadenza: tra(18) }, { id: "dce2", nome: b.nome, tipo: "non_agonistico", scadenza: tra(-5) }],
    gare: [{ id: "dg1", nome: "Trofeo dei Pratoni", luogo: "Rocca di Papa", data_inizio: tra(12), data_fine: tra(13), quota_default: 60, box_default: 40,
      iscritti: [{ id: "di1", membro_id: a.id, nome: a.nome, cavallo: (INC.dati?.cavalli || [])[0]?.nome, categoria: "B110", quota: 60, box: 40 },
                 { id: "di2", membro_id: b.id, nome: b.nome, cavallo: (INC.dati?.cavalli || [])[1]?.nome, categoria: "B100", quota: 60, box: 40 }],
      spese: [{ id: "ds1", descrizione: "Van e gasolio", importo: 140 }, { id: "ds2", descrizione: "Autostrada", importo: 22 }] }]
  };
}

/* ---------- Gestione ASD Full (PREMIUM · SQL 45) ----------
   Dati dell'ASD, libro soci, quota associativa annuale, ricevute numerate dei pagamenti ASD,
   uscite e rendiconto semplificato dell'anno, scadenzario. In ADVANCE si vede con il lucchetto. */
const ASD_QUALIFICHE = { ordinario: "Socio ordinario", fondatore: "Socio fondatore", onorario: "Socio onorario", atleta: "Atleta", dirigente: "Dirigente", istruttore: "Istruttore / tecnico" };
const ASD_USCITE = { affiliazione: "Affiliazione", tesseramenti: "Tesseramenti versati", gare: "Gare e iscrizioni", istruttori: "Istruttori e compensi sportivi", impianti: "Impianti e affitti",
  attrezzature: "Attrezzature", assicurazione: "Assicurazione", utenze: "Utenze", trasferte: "Trasferte", altro: "Altro" };
const ASD_ENTRATE = { quota: "Quote associative", tesseramento: "Tesseramenti", gara: "Iscrizioni alle gare", trasferta: "Rimborsi trasferte", lezione: "Corsi e lezioni",
  pacchetto: "Corsi e lezioni (pacchetti)", manuale: "Altre entrate", retta: "Altre entrate" };
const asdFullOk = () => DEMO_MODE || !pianoCentro || pianoCentro.asd_full !== false;
const asdAnno = () => Number((INC.mese || incOggi()).slice(0, 4));

async function incCaricaAsdFull(){
  if(!asdFullOk()){ INC.full = null; return; }
  if(DEMO_MODE){ INC.full = asdDemoFull(); return; }
  const { data, error } = await sb.rpc("asd_full_dati", { p_centro: currentCentro.id, p_anno: asdAnno() });
  if(error || !data || data.errore){ console.warn("asd_full_dati:", error || data); INC.full = null; return; }
  INC.full = data;
}

function incRenderAsdFull(){
  const premium = '<span class="inc-chip" style="background:#1d4a35;color:#fff">PREMIUM</span>';
  if(!asdFullOk()) return `<div class="inc-sez" style="margin-top:26px">Gestione ASD Full ${premium}</div>
    <div class="card"><p style="margin:0 0 8px;font-size:14px">Nel tuo pacchetto c'è la <b>Gestione ASD Basic</b>. Con PREMIUM hai anche:</p>
      <ul style="font-size:13.5px;line-height:1.7;margin:0 0 12px;padding-left:20px"><li>libro soci con numero, qualifica, ammissione e cessazione (PDF);</li>
        <li>quota associativa annuale per tutti i soci e chi deve ancora rinnovare;</li><li>ricevute numerate per i pagamenti dell'ASD;</li>
        <li>uscite e rendiconto dell'anno (PDF e CSV);</li><li>scadenzario: affiliazione, tesseramenti, assemblea, RASD, assicurazione.</li></ul>
      <button class="btn btn-primary btn-sm" onclick="apriUpsell('asd_full')"><i class="fa-solid fa-lock"></i> Passa a PREMIUM</button></div>`;
  const f = INC.full;
  if(!f) return '<div class="card inc-vuoto" style="margin-top:20px">Non riesco a caricare la Gestione ASD Full. Riprova tra poco.</div>';
  const d = f.dati || {}, soci = f.soci || [], attivi = soci.filter(s => !s.cessato_il);
  const annoSoc = d.mese_inizio > 1 ? `${d.anno_sociale}/${Number(d.anno_sociale) + 1}` : String(d.anno_sociale);
  const nonPagate = attivi.filter(s => !s.quota || Number(s.quota.pagato) < Number(s.quota.importo)).length;
  const quotaChip = s => !s.quota ? '<span class="inc-chip">quota non generata</span>' : incStatoChip(s.quota.importo, s.quota.pagato).replace("da pagare", "quota da pagare").replace(">pagato<", ">quota pagata<");
  const certChip = s => s.certificato ? incScadenzaChip(s.certificato).replace("fino al", "cert. fino al").replace("scade il", "cert. scade il").replace("scaduto il", "cert. scaduto il") : '<span class="inc-chip no">senza certificato</span>';
  const r = f.rendiconto || { entrate: {}, uscite: {} };
  const entrate = {}; Object.entries(r.entrate || {}).forEach(([k, v]) => { const l = ASD_ENTRATE[k] || "Altre entrate"; entrate[l] = (entrate[l] || 0) + Number(v); });
  const totE = Object.values(entrate).reduce((t, v) => t + v, 0), totU = Object.values(r.uscite || {}).reduce((t, v) => t + Number(v), 0);
  const riga = (l, v) => `<div class="inc-riga" style="padding:7px 0"><div class="t">${escapeHtml(l)}</div><div class="n">${incEuro(v)}</div></div>`;
  return `<div class="inc-sez" style="margin-top:26px">Gestione ASD Full ${premium}</div>
    <div class="card">
      <div class="inc-riga" style="padding-top:0"><div class="t"><b>${escapeHtml(d.nome || "ASD")}</b>
        <small>${d.cf ? "C.F. " + escapeHtml(d.cf) : '<span style="color:var(--danger)">codice fiscale mancante</span>'}${d.rasd ? " · RASD " + escapeHtml(d.rasd) : ""}${d.affiliazioni ? " · " + escapeHtml(d.affiliazioni) : ""}${d.sede ? "<br>" + escapeHtml(d.sede) : ""}<br>
        Quota associativa ${d.quota ? incEuro(d.quota) : "non impostata"} · anno sociale da ${INC_MESI[(d.mese_inizio || 1) - 1]}</small></div>
        <div class="a"><button class="btn btn-outline btn-sm" onclick="asdApriDati()"><i class="fa-solid fa-pen"></i> Dati dell'ASD</button></div></div></div>

    <div class="inc-sez">Libro soci · ${attivi.length} ${attivi.length === 1 ? "socio" : "soci"}
      <span style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-outline btn-sm" onclick="asdPdfLibroSoci()"><i class="fa-solid fa-file-pdf"></i> PDF</button>
        <button class="btn btn-outline btn-sm" onclick="asdGeneraQuote(this)"><i class="fa-solid fa-wand-magic-sparkles"></i> Quote ${escapeHtml(annoSoc)}</button>
        <button class="btn btn-primary btn-sm" onclick="asdApriSocio()"><i class="fa-solid fa-user-plus"></i> Socio</button></span></div>
    ${attivi.length && nonPagate ? `<p class="inc-nota"><b style="color:var(--danger)">${nonPagate} ${nonPagate === 1 ? "socio deve" : "soci devono"} ancora pagare la quota ${escapeHtml(annoSoc)}.</b> «Quote ${escapeHtml(annoSoc)}» la addebita a chi non l'ha ancora.</p>` : ""}
    <div class="card">${soci.length ? soci.map(s => `<div class="inc-riga"${s.cessato_il ? ' style="opacity:.55"' : ""}><div class="t"><b>n. ${s.numero} · ${escapeHtml(s.nome)}</b>
        <small>${ASD_QUALIFICHE[s.qualifica] || s.qualifica} · ammesso il ${incData(s.ammesso_il)}${s.cessato_il ? ` · cessato il ${incData(s.cessato_il)}${s.motivo ? " (" + escapeHtml(s.motivo) + ")" : ""}` : ` ${quotaChip(s)} ${certChip(s)}`}</small></div>
        <div class="a">${s.cessato_il ? "" : `<button class="btn btn-ghost btn-sm" onclick="asdCessaSocio('${s.id}')">Cessa</button>`}</div></div>`).join("")
      : '<div class="inc-vuoto">Nessun socio nel libro. Aggiungi i soci dai clienti del centro: il numero si assegna da solo.</div>'}</div>

    <div class="inc-sez">Rendiconto ${r.anno || asdAnno()}
      <span style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-outline btn-sm" onclick="asdPdfRendiconto()"><i class="fa-solid fa-file-pdf"></i> PDF</button>
        <button class="btn btn-outline btn-sm" onclick="asdCsvRendiconto()"><i class="fa-solid fa-file-csv"></i> CSV</button>
        <button class="btn btn-primary btn-sm" onclick="asdApriUscita()"><i class="fa-solid fa-plus"></i> Uscita</button></span></div>
    <div class="grid grid-2" style="gap:12px">
      <div class="card"><div style="font-weight:800;margin-bottom:4px">Entrate incassate</div>${Object.entries(entrate).map(([l, v]) => riga(l, v)).join("") || '<div class="inc-vuoto">Nessuna.</div>'}
        <div class="inc-riga" style="padding:8px 0 0"><div class="t"><b>Totale</b></div><div class="n">${incEuro(totE)}</div></div>
        ${Number(r.da_incassare) > 0 ? `<p class="inc-nota" style="margin:6px 0 0">Ancora da incassare per l'anno: ${incEuro(r.da_incassare)}</p>` : ""}</div>
      <div class="card"><div style="font-weight:800;margin-bottom:4px">Uscite</div>${Object.entries(r.uscite || {}).map(([k, v]) => riga(ASD_USCITE[k] || k, v)).join("") || '<div class="inc-vuoto">Nessuna.</div>'}
        <div class="inc-riga" style="padding:8px 0 0"><div class="t"><b>Totale</b></div><div class="n">${incEuro(totU)}</div></div></div></div>
    <div class="card" style="margin-top:12px"><div class="inc-riga" style="padding:0"><div class="t"><b>${totE - totU >= 0 ? "Avanzo" : "Disavanzo"} ${r.anno || asdAnno()}</b><small>rendiconto semplificato per cassa: quello ufficiale lo approva l'assemblea con il commercialista</small></div>
      <div class="n" style="color:${totE - totU >= 0 ? "#2f8a4e" : "var(--danger)"}">${incEuro(totE - totU)}</div></div></div>
    ${(f.uscite || []).length ? `<div class="card" style="margin-top:12px"><div style="font-weight:800;margin-bottom:4px">Uscite registrate</div>${f.uscite.map(u => `<div class="inc-riga"><div class="t"><b>${escapeHtml(u.descrizione)}</b>
        <small>${incData(u.data)} · ${ASD_USCITE[u.categoria] || u.categoria} · ${INC_METODI[u.metodo] || u.metodo}</small></div><div class="n">${incEuro(u.importo)}</div>
        <div class="a"><button class="btn btn-ghost btn-sm" title="Elimina" onclick="incAsdElimina('scuderia_asd_uscite','${u.id}', this)"><i class="fa-solid fa-trash"></i></button></div></div>`).join("")}</div>` : ""}
    <p class="inc-nota" style="margin-top:8px">Le trasferte delle gare entrano da sole fra le uscite.</p>

    <div class="inc-sez">Scadenzario
      <span style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-outline btn-sm" onclick="asdScadenzeTipiche(this)">Aggiungi le scadenze tipiche</button>
        <button class="btn btn-primary btn-sm" onclick="asdApriScadenza()"><i class="fa-solid fa-plus"></i> Scadenza</button></span></div>
    <div class="card">${(f.scadenze || []).length ? f.scadenze.map(x => `<div class="inc-riga"${x.fatto_il ? ' style="opacity:.55"' : ""}><div class="t"><b>${escapeHtml(x.titolo)}</b>
        <small>${x.fatto_il ? "fatto il " + incData(x.fatto_il) : x.data ? incScadenzaChip(x.data) : '<span class="inc-chip parz">imposta la data</span>'}${x.note ? " · " + escapeHtml(x.note) : ""}</small></div>
        <div class="a">${x.fatto_il ? "" : `<button class="btn btn-outline btn-sm" onclick="asdApriScadenza('${x.id}')">Data</button><button class="btn btn-primary btn-sm" onclick="asdScadenzaFatta('${x.id}', this)">Fatto</button>`}
          <button class="btn btn-ghost btn-sm" title="Elimina" onclick="incAsdElimina('scuderia_asd_scadenze','${x.id}', this)"><i class="fa-solid fa-trash"></i></button></div></div>`).join("")
      : '<div class="inc-vuoto">Nessuna scadenza. «Aggiungi le scadenze tipiche» mette quelle di ogni anno: tu inserisci le date.</div>'}</div>`;
}

function asdApriDati(){
  const d = INC.full?.dati || {};
  incFinestra("Dati dell'ASD", `
    <div class="inc-form-2">
      <div class="field"><label>Codice fiscale</label><input class="input" id="asd-d-cf" maxlength="16" value="${escapeHtml(d.cf || "")}" style="text-transform:uppercase"></div>
      <div class="field"><label>Numero RASD</label><input class="input" id="asd-d-rasd" maxlength="40" value="${escapeHtml(d.rasd || "")}"></div></div>
    <div class="field"><label>Sede legale</label><input class="input" id="asd-d-sede" maxlength="160" value="${escapeHtml(d.sede || "")}"></div>
    <div class="field"><label>Affiliazioni</label><input class="input" id="asd-d-aff" maxlength="120" value="${escapeHtml(d.affiliazioni || "")}" placeholder="Es. FISE, CSEN"></div>
    <div class="inc-form-2">
      <div class="field"><label>Quota associativa annuale €</label><input class="input" id="asd-d-quota" inputmode="decimal" value="${d.quota != null ? String(d.quota).replace(".", ",") : ""}"></div>
      <div class="field"><label>L'anno sociale inizia a</label><select class="input" id="asd-d-mese">${INC_MESI.map((m, i) => `<option value="${i + 1}"${(d.mese_inizio || 1) === i + 1 ? " selected" : ""}>${m}</option>`).join("")}</select></div></div>
    <p class="inc-nota">Questi dati compaiono sulle ricevute e sul libro soci.</p>`,
    "Salva", async () => {
      const r = await incRpc("asd_salva_dati", { p_centro: currentCentro.id, p_cf: incVal("asd-d-cf"), p_sede: incVal("asd-d-sede"), p_rasd: incVal("asd-d-rasd"),
        p_affiliazioni: incVal("asd-d-aff"), p_quota: incNum(incVal("asd-d-quota")), p_mese: Number(incVal("asd-d-mese")) || 1 });
      return r.errore ? r : { toast: "Dati dell'ASD salvati." };
    });
}
function asdApriSocio(){
  const giaSoci = new Set((INC.full?.soci || []).map(s => s.membro_id));
  const opz = (INC.dati?.clienti || []).filter(c => !giaSoci.has(c.id)).map(c => `<option value="${c.id}">${escapeHtml(c.nome || "")}</option>`).join("");
  incFinestra("Nuovo socio", `
    <div class="field"><label>Persona</label><select class="input" id="asd-s-membro"><option value="">— scegli —</option>${opz}</select>
      <p class="inc-nota" style="margin-top:6px">Se non c'è, aggiungila prima nella sezione Clienti.</p></div>
    <div class="inc-form-2">
      <div class="field"><label>Qualifica</label><select class="input" id="asd-s-qual">${Object.entries(ASD_QUALIFICHE).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></div>
      <div class="field"><label>Ammesso il</label><input class="input" type="date" id="asd-s-amm" value="${incOggi()}"></div></div>`,
    "Aggiungi al libro", async () => {
      const r = { centro_id: currentCentro.id, membro_id: incVal("asd-s-membro"), qualifica: incVal("asd-s-qual"), ammesso_il: incVal("asd-s-amm") || incOggi() };
      if(!r.membro_id) return { errore: "Scegli la persona." };
      const { data, error } = await sb.from("scuderia_asd_soci").insert(r).select("numero").single();
      return error ? { errore: /duplicate|unique/i.test(error.message) ? "È già nel libro soci." : error.message } : { toast: "Socio n. " + data.numero + " aggiunto al libro." };
    });
}
function asdCessaSocio(id){
  const s = (INC.full?.soci || []).find(x => x.id === id) || {};
  incFinestra("Cessazione · n. " + s.numero + " " + (s.nome || ""), `
    <div class="field"><label>Cessato il</label><input class="input" type="date" id="asd-c-data" value="${incOggi()}"></div>
    <div class="field"><label>Motivo</label><select class="input" id="asd-c-mot"><option>Recesso</option><option>Mancato rinnovo della quota</option><option>Esclusione</option><option>Decesso</option><option>Altro</option></select></div>
    <p class="inc-nota">Il socio resta nel libro con la data di cessazione: il libro soci non si cancella.</p>`,
    "Registra", async () => {
      const { error } = await sb.from("scuderia_asd_soci").update({ cessato_il: incVal("asd-c-data") || incOggi(), motivo_cessazione: incVal("asd-c-mot") }).eq("id", id);
      return error ? { errore: error.message } : { toast: "Cessazione registrata." };
    });
}
async function asdGeneraQuote(btn){
  if(DEMO_MODE){ showToast("In demo le quote non si generano."); return; }
  const d = INC.full?.dati || {};
  if(!d.quota){ showToast("Imposta prima la quota associativa nei «Dati dell'ASD»."); asdApriDati(); return; }
  btn.disabled = true;
  const r = await incRpc("asd_genera_quote", { p_centro: currentCentro.id, p_anno: Number(d.anno_sociale) });
  btn.disabled = false;
  if(r.errore){ showToast(r.errore); return; }
  showToast(r.quote ? `Quote ${r.anno}: ${r.quote} ${r.quote === 1 ? "addebitata" : "addebitate"} ai soci.` : `Le quote ${r.anno} erano già state addebitate a tutti i soci attivi.`);
  incAggiorna();
}
function asdApriUscita(){
  incFinestra("Uscita dell'ASD", `
    <div class="field"><label>Descrizione</label><input class="input" id="asd-u-descr" maxlength="120" placeholder="Es. Affiliazione FISE 2027"></div>
    <div class="inc-form-2">
      <div class="field"><label>Importo €</label><input class="input" id="asd-u-imp" inputmode="decimal"></div>
      <div class="field"><label>Data</label><input class="input" type="date" id="asd-u-data" value="${incOggi()}"></div>
      <div class="field"><label>Categoria</label><select class="input" id="asd-u-cat">${Object.entries(ASD_USCITE).filter(([k]) => k !== "trasferte").map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></div>
      <div class="field"><label>Pagata con</label><select class="input" id="asd-u-met">${Object.entries(INC_METODI).map(([k, v]) => `<option value="${k}"${k === "bonifico" ? " selected" : ""}>${v}</option>`).join("")}</select></div></div>`,
    "Registra", async () => {
      const r = { centro_id: currentCentro.id, descrizione: incVal("asd-u-descr"), importo: incNum(incVal("asd-u-imp")), data: incVal("asd-u-data") || incOggi(), categoria: incVal("asd-u-cat"), metodo: incVal("asd-u-met") };
      if(!r.descrizione) return { errore: "Scrivi la descrizione." };
      if(!r.importo || r.importo <= 0) return { errore: "Scrivi l'importo." };
      const { error } = await sb.from("scuderia_asd_uscite").insert(r);
      return error ? { errore: error.message } : { toast: "Uscita registrata." };
    });
}
function asdApriScadenza(id){
  const x = id ? (INC.full?.scadenze || []).find(s => s.id === id) || {} : {};
  incFinestra(id ? x.titolo : "Nuova scadenza", `
    ${id ? "" : '<div class="field"><label>Cosa</label><input class="input" id="asd-x-tit" maxlength="120" placeholder="Es. Rinnovo affiliazione FISE"></div>'}
    <div class="field"><label>Entro il</label><input class="input" type="date" id="asd-x-data" value="${x.data || ""}"></div>
    <div class="field"><label>Nota <span style="text-transform:none;font-weight:400">(facoltativa)</span></label><input class="input" id="asd-x-note" maxlength="200" value="${escapeHtml(x.note || "")}"></div>`,
    "Salva", async () => {
      const r = { data: incVal("asd-x-data") || null, note: incVal("asd-x-note") || null };
      let q;
      if(id) q = sb.from("scuderia_asd_scadenze").update(r).eq("id", id);
      else { r.titolo = incVal("asd-x-tit"); r.centro_id = currentCentro.id; if(!r.titolo) return { errore: "Scrivi la scadenza." }; q = sb.from("scuderia_asd_scadenze").insert(r); }
      const { error } = await q;
      return error ? { errore: error.message } : { toast: "Scadenza salvata." };
    });
}
async function asdScadenzaFatta(id, btn){
  if(DEMO_MODE){ showToast("In demo le modifiche non vengono salvate."); return; }
  btn.disabled = true;
  const { error } = await sb.from("scuderia_asd_scadenze").update({ fatto_il: incOggi() }).eq("id", id);
  btn.disabled = false;
  if(error){ showToast(error.message); return; }
  showToast("Segnata come fatta."); incAggiorna();
}
async function asdScadenzeTipiche(btn){
  if(DEMO_MODE){ showToast("In demo le modifiche non vengono salvate."); return; }
  btn.disabled = true;
  const r = await incRpc("asd_scadenze_tipiche", { p_centro: currentCentro.id });
  btn.disabled = false;
  showToast(r.errore || (r.aggiunte ? `Aggiunte ${r.aggiunte} scadenze: inserisci le date.` : "Erano già tutte in elenco."));
  if(!r.errore) incAggiorna();
}

/* ricevuta di un pagamento della cassa ASD */
async function asdRicevuta(pagamentoId, btn){
  if(!asdFullOk()){ apriUpsell("asd_full"); return; }
  let r;
  if(DEMO_MODE){ const p = (INC.dati.pagamenti || []).find(x => x.id === pagamentoId) || {};
    r = { ok: true, numero: "R-" + asdAnno() + "-001", data: p.data, importo: p.importo, metodo: p.metodo, causale: p.per, socio: incNomeCliente(p.membro_id), socio_numero: 1,
          asd: { nome: INC.dati.impostazioni.asd_nome, cf: "90012345678", sede: "Via dei Cavalli 1, Roma", rasd: "123456" } }; }
  else {
    if(btn) btn.disabled = true;
    r = await incRpc("asd_ricevuta", { p_pagamento: pagamentoId });
    if(btn) btn.disabled = false;
    if(r.errore){ showToast(r.errore); return; }
  }
  if(!window.jspdf){ showToast("Generatore PDF non disponibile, riprova."); return; }
  const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a5", orientation: "landscape" });
  if(typeof logoCentroNelPdf === "function") logoCentroNelPdf(doc, 198, 8);   // logo del centro (configurazione, SQL 59)
  let y = 16;
  doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text(r.asd?.nome || "ASD", 12, y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(100);
  const dati = [r.asd?.sede, r.asd?.cf ? "C.F. " + r.asd.cf : "", r.asd?.rasd ? "RASD n. " + r.asd.rasd : ""].filter(Boolean).join(" · ");
  if(dati){ y += 5; doc.text(dati, 12, y); }
  doc.setTextColor(0); y += 12;
  doc.setFont("helvetica", "bold"); doc.setFontSize(12.5); doc.text(`Ricevuta n. ${r.numero}`, 12, y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.text(`del ${incData(r.data)}`, 198, y, { align: "right" });
  y += 10;
  const righe = [["Ricevuto da", (r.socio || "") + (r.socio_numero ? `  (socio n. ${r.socio_numero})` : "")], ["Importo", incEuro(r.importo)],
    ["Causale", r.causale || ""], ["Pagato con", INC_METODI[r.metodo] || r.metodo || ""]];
  righe.forEach(([k, v]) => { doc.setFont("helvetica", "bold"); doc.text(k, 12, y); doc.setFont("helvetica", "normal"); doc.text(doc.splitTextToSize(String(v), 140), 52, y); y += 8; });
  y += 6; doc.text("Firma per l'associazione ____________________________", 12, y);
  doc.setFontSize(7.5); doc.setTextColor(120);
  doc.text("Se l'importo supera 77,47 € e non è pagato con strumento tracciabile, sull'originale va applicata la marca da bollo da 2 €. Verificare il regime con il commercialista.", 12, 140, { maxWidth: 186 });
  doc.save(`Ricevuta_${r.numero}.pdf`);
  if(!DEMO_MODE) incAggiorna();
}

/* PDF del libro soci */
function asdPdfLibroSoci(){
  const f = INC.full; if(!f) return;
  if(!window.jspdf){ showToast("Generatore PDF non disponibile, riprova."); return; }
  const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  let y = 16;
  doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text("Libro soci · " + (f.dati?.nome || "ASD"), 12, y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(100);
  y += 5; doc.text([f.dati?.cf ? "C.F. " + f.dati.cf : "", f.dati?.rasd ? "RASD n. " + f.dati.rasd : "", "aggiornato al " + incData(incOggi())].filter(Boolean).join(" · "), 12, y);
  doc.setTextColor(0); y += 10;
  const col = [12, 30, 115, 170, 205, 240];
  const intest = ["N.", "Cognome e nome", "Qualifica", "Ammesso il", "Cessato il", "Motivo"];
  doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); intest.forEach((t, i) => doc.text(t, col[i], y));
  y += 2; doc.setDrawColor(190); doc.line(12, y, 285, y); y += 5; doc.setFont("helvetica", "normal");
  (f.soci || []).forEach(s => {
    [String(s.numero), s.nome || "", ASD_QUALIFICHE[s.qualifica] || s.qualifica, incData(s.ammesso_il), s.cessato_il ? incData(s.cessato_il) : "", s.motivo || ""]
      .forEach((t, i) => doc.text(doc.splitTextToSize(t, (col[i + 1] || 285) - col[i] - 2)[0] || "", col[i], y));
    y += 6.5;
    if(y > 195){ doc.addPage(); y = 16; }
  });
  doc.save(`Libro_soci_${incOggi()}.pdf`);
}

/* rendiconto dell'anno: PDF e CSV */
function asdVociRendiconto(){
  const r = INC.full?.rendiconto || { entrate: {}, uscite: {} };
  const e = {}; Object.entries(r.entrate || {}).forEach(([k, v]) => { const l = ASD_ENTRATE[k] || "Altre entrate"; e[l] = (e[l] || 0) + Number(v); });
  const u = Object.entries(r.uscite || {}).map(([k, v]) => [ASD_USCITE[k] || k, Number(v)]);
  return { anno: r.anno || asdAnno(), entrate: Object.entries(e), uscite: u, totE: Object.values(e).reduce((t, v) => t + v, 0), totU: u.reduce((t, x) => t + x[1], 0), daInc: Number(r.da_incassare) || 0 };
}
function asdPdfRendiconto(){
  if(!window.jspdf){ showToast("Generatore PDF non disponibile, riprova."); return; }
  const v = asdVociRendiconto(), d = INC.full?.dati || {};
  const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
  let y = 18;
  doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.text(`Rendiconto ${v.anno} · ${d.nome || "ASD"}`, 15, y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(100); y += 5;
  doc.text([d.cf ? "C.F. " + d.cf : "", d.rasd ? "RASD n. " + d.rasd : "", "rendiconto semplificato per cassa"].filter(Boolean).join(" · "), 15, y);
  doc.setTextColor(0); y += 12;
  const blocco = (titolo, voci, tot) => {
    doc.setFont("helvetica", "bold"); doc.setFontSize(11.5); doc.text(titolo, 15, y); y += 7; doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    if(!voci.length){ doc.text("—", 15, y); y += 6; }
    voci.forEach(([l, n]) => { doc.text(l, 15, y); doc.text(incEuro(n), 195, y, { align: "right" }); y += 6; });
    doc.line(15, y - 3, 195, y - 3); doc.setFont("helvetica", "bold"); doc.text("Totale", 15, y + 1); doc.text(incEuro(tot), 195, y + 1, { align: "right" }); y += 12;
  };
  doc.setDrawColor(200);
  blocco("Entrate incassate", v.entrate, v.totE);
  blocco("Uscite", v.uscite, v.totU);
  doc.setFontSize(12); doc.text(v.totE - v.totU >= 0 ? "Avanzo" : "Disavanzo", 15, y); doc.text(incEuro(v.totE - v.totU), 195, y, { align: "right" });
  if(v.daInc > 0){ y += 8; doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text("Ancora da incassare per l'anno: " + incEuro(v.daInc), 15, y); }
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(120);
  doc.text("Documento di lavoro generato con Equo Scuderia: il rendiconto ufficiale è quello approvato dall'assemblea, predisposto con il commercialista.", 15, 285, { maxWidth: 180 });
  doc.save(`Rendiconto_${v.anno}.pdf`);
}
function asdCsvRendiconto(){
  const v = asdVociRendiconto();
  const righe = [["Tipo", "Voce", "Importo"]].concat(v.entrate.map(([l, n]) => ["Entrata", l, n]), v.uscite.map(([l, n]) => ["Uscita", l, n]),
    [["", "Totale entrate", v.totE], ["", "Totale uscite", v.totU], ["", v.totE - v.totU >= 0 ? "Avanzo" : "Disavanzo", v.totE - v.totU]]);
  const csv = "﻿" + righe.map(r => r.map(x => `"${typeof x === "number" ? x.toFixed(2).replace(".", ",") : String(x).replace(/"/g, '""')}"`).join(";")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `Rendiconto_${v.anno}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function asdDemoFull(){
  const cl = (INC.dati?.clienti || []).filter(c => ["allievo", "proprietario"].includes(c.ruolo));
  const tra = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  const anno = new Date().getMonth() >= 8 ? new Date().getFullYear() : new Date().getFullYear() - 1;
  return {
    dati: { nome: INC.dati?.impostazioni?.asd_nome || "ASD Demo", cf: "90012345678", sede: "Via dei Cavalli 1, Roma", rasd: "123456", affiliazioni: "FISE", quota: 50, mese_inizio: 9, anno_sociale: anno },
    soci: cl.map((c, i) => ({ id: "ds" + i, membro_id: c.id, nome: c.nome, numero: i + 1, qualifica: i ? "atleta" : "fondatore", ammesso_il: "2024-09-15",
      quota: { importo: 50, pagato: i ? 0 : 50 }, certificato: i ? tra(-5) : tra(18) })),
    uscite: [{ id: "du1", data: tra(-40), descrizione: "Affiliazione FISE", categoria: "affiliazione", importo: 300, metodo: "bonifico" },
             { id: "du2", data: tra(-12), descrizione: "Istruttore gare", categoria: "istruttori", importo: 250, metodo: "bonifico" }],
    scadenze: [{ id: "dx1", titolo: "Rinnovo dell'affiliazione (federazione o ente di promozione)", data: tra(25) },
               { id: "dx2", titolo: "Assemblea dei soci: approvazione del rendiconto", data: null },
               { id: "dx3", titolo: "Rinnovo dell'assicurazione", data: tra(70) }],
    rendiconto: { anno: new Date().getFullYear(), entrate: { quota: 450, tesseramento: 315, gara: 600 }, uscite: { affiliazione: 300, istruttori: 250, trasferte: 162 }, da_incassare: 150, incassato_cassa: 1365 }
  };
}
