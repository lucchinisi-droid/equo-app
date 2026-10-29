// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { clientiAttivi, loadClientiMascalcia } from "./032-richiamo-prossimo-intervento-sempre-in-g.js";
import { apriNuovoCliente, badgeCollegamentoCliente, isManiscalcoUtente, openClienteDetail, renderCavalliEditCliente } from "./034-strutture-collegate-a-equo-scuderia-prof.js";
import { cavalliQuiStanno, descrFerroBreve, iniziale, statoCavalloPro } from "./037-scheda-cliente-a-box-scheda-del-cavallo.js";
import { apriSchedaCavalloPro } from "./038-avviso-sembra-lo-stesso-cavallo.js";
import { razzaImposta, razzaValore } from "./039-razza-menu-con-ricerca-stesso-codice-in.js";
import { isoLocale } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { chiediSiNo } from "./052-ferro-standard-nella-scheda-del-cavallo.js";
import { formatDataBreve } from "./054-richieste-di-appuntamento-step-5d.js";
import { cavalliMieiLista, nomiCavalliCliente, paroleCercaCliente } from "./086-indice-dei-cavalli-dei-clienti-professio.js";
import { creaCavalloUnico, onbDiChiAggiorna, onbDiChiScelto, onbUbicaInScuderia } from "./116-onboarding.js";
/* ---------- CLIENTI A CARTELLE (stile Telegram): Cavalli · Clienti · Scuderie ----------
   Il primo spazio di ogni cartella è l'aggiunta rapida. La ricerca (cercaFiltro «clienti») cerca nella cartella aperta. */
/* -> stato-condiviso.js */
try{ cliCartella = localStorage.getItem("equo-cli-cartella") || "cavalli"; }catch(_){}
// tutti i cavalli che segue il maniscalco: righe sue + cavalli dei proprietari su Equo non ancora in scheda
function cavalliCartella(){
  const attiviId = new Set(clientiAttivi().map(c => c.id));
  const righe = (cavalliMieiLista || []).filter(c => attiviId.has(c.cliente_mascalcia_id)).map(c => ({ ...c, key: "m:" + c.id }));
  const conHorse = new Set(righe.map(r => r.horse_id).filter(Boolean));
  cliCavalliEquo.forEach(h => { if(!conHorse.has(h.horse_id) && attiviId.has(h.cliente_mascalcia_id)) righe.push(h); });
  return righe.sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" }));
}
async function caricaCartellaCavalli(){
  // cavalli dei proprietari collegati che non hanno ancora una scheda del maniscalco + interventi per pallino e prossima data
  const collegati = clientiAttivi().filter(c => c.cliente_user_id && !c.centro_id);
  const [eq, inter] = await Promise.all([
    Promise.all(collegati.map(c => DEMO_MODE ? Promise.resolve([]) : sb.rpc("cavalli_condivisi_cliente", { p_cliente_id: c.id }).then(r => (r.data || []).map(h => ({ key: "h:" + h.id, id: null, horse_id: h.id, nome: h.name, microchip: h.microchip, razza: h.breed, cliente_mascalcia_id: c.id, tipo: "equo" }))).catch(() => []))),
    DB.listInterventiMascalciaTutti().catch(() => [])
  ]);
  cliCavalliEquo = eq.flat();
  cliInterventi = (inter || []).concat(await DB.listProssimiAppuntamenti(200).catch(() => []));
}
function sceltaCartellaClienti(k){
  cliCartella = k;
  try{ localStorage.setItem("equo-cli-cartella", k); }catch(_){}
  if(typeof cercaAzzera === "function") cercaAzzera("clienti");
  renderClientiList();
}
function renderClientiList(){
  const box = document.getElementById("clienti-list");
  if(!box) return;
  // 29/10/2026: il veterinario vede un solo elenco A–Z con i filtri (mockup Clienti 1 · Elenco), stessi dati e stesse schede
  if(typeof eVeterinario === "function" && eVeterinario() && typeof vetRenderClienti === "function") return vetRenderClienti(box);
  const attivi = clientiAttivi();
  const alfabetico = (a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" });
  const proprietari = attivi.filter(c => !isStruttura(c)).sort(alfabetico);
  const scuderie = attivi.filter(isStruttura).sort(alfabetico);
  const cavalli = cavalliCartella();
  if(!["cavalli", "clienti", "scuderie"].includes(cliCartella)) cliCartella = "cavalli";
  document.getElementById("cli-cartelle").innerHTML = [["cavalli", "Cavalli", cavalli.length], ["clienti", "Clienti", proprietari.length], ["scuderie", "Scuderie", scuderie.length]]
    .map(([k, t, n]) => `<button role="tab" aria-selected="${cliCartella === k}" class="${cliCartella === k ? "on" : ""}" onclick="sceltaCartellaClienti('${k}')">${t}<span class="n">${n}</span></button>`).join("");
  document.getElementById("cli-cartella-sotto").textContent = { cavalli: "Tutti i cavalli che segui", clienti: "Proprietari", scuderie: "Scuderie, maneggi e centri ippici" }[cliCartella];
  const collega = document.getElementById("cli-collega-btn");
  if(collega) collega.style.display = cliCartella === "scuderie" && isManiscalcoUtente() ? "" : "none";
  const f = typeof cercaFiltri !== "undefined" && cercaFiltri.clienti;
  if(f) f.inp.placeholder = { cavalli: "Cerca cavallo, cliente o microchip", clienti: "Cerca cliente, cavallo o telefono", scuderie: "Cerca scuderia o cavallo" }[cliCartella];

  const nuovo = (t, sotto, az) => `<div class="cli-riga nuovo cerca-ignora" onclick="${az}"><span class="cli-av">+</span><span class="cli-c"><b>${t}</b><span>${sotto}</span></span></div>`;
  const nomeCli = id => (clientiMascalcia.find(c => c.id === id) || {}).nome || "";
  let html = "";
  if(cliCartella === "cavalli"){
    html = nuovo("Aggiungi cavallo", "nuovo o con codice Equo", "apriNuovoCavalloCartella()");
    let lettera = "";
    const oggi = isoLocale(new Date());
    cavalli.forEach(cv => {
      const l = (cv.nome || "?").trim().charAt(0).toUpperCase();
      if(l !== lettera){ lettera = l; html += `<div class="cli-lettera">${escapeHtml(l)}</div>`; }
      const st = statoCavalloPro(cv, cliInterventi);
      const cli = clientiMascalcia.find(c => c.id === cv.cliente_mascalcia_id);
      const ferro = descrFerroBreve(cv);
      const pros = st.prossimo ? (st.prossimo.data < oggi ? "scaduta" : formatDataBreve(st.prossimo.data)) : "";
      html += `<div class="cli-riga" data-cerca="${escapeHtml([cv.microchip, cv.codice_equo, cli?.nome, cv.ubicazione_nome].filter(Boolean).join(" "))}" onclick="apriCavalloDaCartella('${cv.cliente_mascalcia_id}', '${cv.id || ""}', '${cv.horse_id || ""}')">
        <span class="cli-av">${iniziale(cv.nome)}${st.sem ? `<i class="cav-sem ${st.sem}"></i>` : ""}</span>
        <span class="cli-c"><b>${escapeHtml(cv.nome || "")}</b><span>${cli && isStruttura(cli) ? "📍 " : ""}${escapeHtml(nomeCli(cv.cliente_mascalcia_id))}${cv.tipo === "equo" ? " · su Equo" : ""}${cv.ubicazione_tipo === "scuderia" && cv.ubicazione_cliente_id && cv.ubicazione_cliente_id !== cv.cliente_mascalcia_id ? " · 📍 sta a " + escapeHtml(nomeCli(cv.ubicazione_cliente_id) || cv.ubicazione_nome || "una scuderia") : ""}</span></span>
        <span class="cli-dx">${escapeHtml(ferro || "")}${pros ? `<b class="${st.sem === "rosso" ? "rosso" : ""}">${escapeHtml(pros)}</b>` : ""}</span></div>`;
    });
    if(!cavalli.length) html += '<div class="cli-vuoto cerca-ignora">Nessun cavallo ancora: aggiungilo qui sopra o dalla scheda di un cliente.</div>';
  } else {
    const struttura = cliCartella === "scuderie";
    const lista = struttura ? scuderie : proprietari;
    html = struttura ? nuovo("Aggiungi scuderia", "scuderia, maneggio o centro ippico", "apriNuovoCliente('struttura')")
                     : nuovo("Aggiungi cliente", "proprietario di uno o più cavalli", "apriNuovoCliente('proprietario')");
    lista.forEach(c => {
      const nomi = nomiCavalliCliente(c);
      const qui = struttura ? cavalliQuiStanno(c.id) : [];
      const sottoTesto = [nomi.length ? nomi.join(", ") : (qui.length ? "" : (struttura ? "Nessun cavallo indicato" : "Cavallo non indicato")), qui.length ? `${qui.length} ${qui.length === 1 ? "cavallo" : "cavalli"} di altri clienti: ${qui.map(x => x.nome).slice(0, 4).join(", ")}${qui.length > 4 ? "…" : ""}` : ""].filter(Boolean).join(" · ");
      html += `<div class="cli-riga" data-cerca="${escapeHtml(paroleCercaCliente(c) + " " + qui.map(x => x.nome).join(" "))}" onclick="openClienteDetail('${c.id}')">
        <span class="cli-av"><i class="fa-solid ${struttura ? "fa-building" : "fa-user"}"></i></span>
        <span class="cli-c"><b>${escapeHtml(c.nome)}</b><span>${escapeHtml(sottoTesto)}</span></span>
        ${badgeCollegamentoCliente(c) || '<span class="cli-dx">›</span>'}</div>
        ${c.collegamento_stato === "da_confermare_pro" ? `<div class="cli-invito">
          <div style="font-size:13px;line-height:1.5;margin-bottom:10px"><strong>${escapeHtml(c.nome)}</strong> ti ha invitato a collegarti come maniscalco su Equo Scuderia: chat e appuntamenti con la scuderia con doppia conferma.</div>
          <div style="display:flex;gap:8px"><button class="btn btn-primary btn-sm btn-conferma" style="flex:1" onclick="rispondiInvitoStruttura('${c.id}', true, this)">Accetta</button>
          <button class="btn btn-outline btn-sm" style="flex:1" onclick="rispondiInvitoStruttura('${c.id}', false, this)">Rifiuta</button></div></div>` : ""}`;
    });
    if(!lista.length) html += `<div class="cli-vuoto cerca-ignora">${struttura ? "Nessuna scuderia ancora. Aggiungi le scuderie e i centri ippici in cui lavori." : "Nessun proprietario ancora."}</div>`;
  }
  box.innerHTML = html;
  // archiviati in fondo alla loro cartella
  const arch = (clientiMascalcia || []).filter(c => c.archiviato_il && cliCartella !== "cavalli" && (cliCartella === "scuderie") === isStruttura(c));
  const card = c => `<div class="cli-riga" onclick="openClienteDetail('${c.id}')"><span class="cli-av"><i class="fa-solid ${isStruttura(c) ? "fa-building" : "fa-user"}"></i></span><span class="cli-c"><b>${escapeHtml(c.nome)}</b><span>${escapeHtml(c.nome_cavallo || "")}</span></span><span class="cli-dx">›</span></div>`;
  document.getElementById("clienti-archiviati-box").innerHTML = arch.length ? `<details class="clienti-archiviati" style="margin-top:14px">
      <summary class="clienti-sez-title" style="cursor:pointer;padding:6px 0">ARCHIVIATI (${arch.length})</summary>
      <div class="muted" style="font-size:12.5px;line-height:1.5;margin:4px 0 8px">Cavalli e storico sono al sicuro. Apri un cliente per ripristinarlo.</div>
      <div class="cli-lista" style="opacity:.72">${arch.sort(alfabetico).map(card).join("")}</div></details>` : "";
}
// dalla cartella Cavalli: si apre la scheda del cavallo (dentro il suo cliente); «indietro» torna alla cartella
/* -> stato-condiviso.js */
async function apriCavalloDaCartella(clienteId, cvId, horseId){
  if(!clienteId) return;
  await openClienteDetail(clienteId);
  const cv = schedaCavalli.find(c => (cvId && c.id === cvId) || (horseId && c.horse_id === horseId));
  if(!cv) return;
  schedaDaCartella = true;
  await apriSchedaCavalloPro(cv.key);
}

// «Aggiungi cavallo» dalla cartella Cavalli: nome, microchip, razza, di chi è (o codice Equo)
// 28/10/2026: unica finestra per aggiungere un cavallo; da scheda cliente e «Modifica» arriva con il cliente già scelto
function apriNuovoCavalloCartella(clienteId){
  ["ncav-nome", "ncav-chip", "ncav-codice"].forEach(id => { document.getElementById(id).value = ""; });
  razzaImposta("ncav-razza", "");
  const alf = (a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" });
  const pr = clientiAttivi().filter(c => !isStruttura(c)).sort(alf), sc = clientiAttivi().filter(isStruttura).sort(alf);
  document.getElementById("ncav-cliente").innerHTML = '<option value="">Scegli il cliente o la scuderia…</option>'
    + (pr.length ? `<optgroup label="Clienti">${pr.map(c => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("")}</optgroup>` : "")
    + (sc.length ? `<optgroup label="Scuderie">${sc.map(c => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("")}</optgroup>` : "")
    + '<option value="__nuovo_p">+ Nuovo cliente</option><option value="__nuovo_s">+ Nuova scuderia</option>';
  document.getElementById("ncav-errore").style.display = "none";
  const sel = document.getElementById("ncav-cliente");
  const pre = typeof clienteId === "string" && clientiAttivi().some(c => c.id === clienteId) ? clienteId : "";
  sel.value = pre;
  onbDiChiAggiorna(pre);
  openModal("modal-nuovo-cavallo");
}
function ncavClienteCambiato(sel){
  if(sel.value === "__nuovo_p" || sel.value === "__nuovo_s"){
    const tipo = sel.value === "__nuovo_s" ? "struttura" : "proprietario";
    sel.value = "";
    closeModal("modal-nuovo-cavallo");
    showToast(tipo === "struttura" ? "Crea la scuderia: poi aggiungi il cavallo dalla sua scheda" : "Crea il cliente: poi aggiungi il cavallo dalla sua scheda");
    apriNuovoCliente(tipo);
  }
}
async function salvaNuovoCavalloCartella(btn){
  const err = document.getElementById("ncav-errore"); err.style.display = "none";
  const errore = t => { err.textContent = t; err.style.display = "block"; };
  const dove = document.getElementById("ncav-cliente").value;
  // 27/10/2026 «Di chi è?»: cavallo in una scuderia ma di un cliente privato → scheda al proprietario, ubicazione la scuderia
  const diChi = onbDiChiScelto(), clienteId = diChi || dove;
  const codice = document.getElementById("ncav-codice").value.trim();
  const nome = document.getElementById("ncav-nome").value.trim();
  if(!clienteId) return errore("Scegli di chi è o dove sta il cavallo.");
  if(!codice && !nome) return errore("Scrivi il nome del cavallo (oppure il suo codice Equo).");
  btn.disabled = true;
  try{
    if(codice){
      if(DEMO_MODE) return errore("In demo l'aggiunta con codice non è disponibile.");
      let { data, error } = await sb.rpc("pro_cavallo_da_codice", { p_cliente_id: clienteId, p_codice: codice, p_conferma: false });
      if(error) return errore("Errore: " + error.message);
      if(data && data.chiedi){
        const ok = await chiediSiNo(`Spostare ${data.nome}?`, `${data.nome} (${data.codice}) ora è tra i cavalli di ${data.da}. Sì: lo sposti in ${data.a}, storico e interventi restano con il cavallo.`);
        if(!ok) return;
        ({ data, error } = await sb.rpc("pro_cavallo_da_codice", { p_cliente_id: clienteId, p_codice: codice, p_conferma: true }));
        if(error) return errore("Errore: " + error.message);
      }
      if(!data?.ok) return errore(data?.errore || "Non riuscito, riprova.");
      if(diChi && data.codice){
        const r = (await DB.listCavalliCliente(clienteId)).find(x => x.id && x.codice_equo === data.codice);
        if(r) await onbUbicaInScuderia(r.id, dove);
      }
      showToast(data.azione === "gia" ? `${data.nome} è già tra i cavalli di questo cliente.` : `${data.nome} aggiunto (codice ${data.codice}).`);
    } else {
      const razza = razzaValore("ncav-razza");
      if(razza === false) return;
      const chip = document.getElementById("ncav-chip").value.trim() || null;
      // 28/10/2026: strada unica (controllo doppioni, «Di chi è?») · 116-onboarding.js
      const r = await creaCavalloUnico({ cliente_mascalcia_id: clienteId, nome, microchip: chip, razza }, { ubicazioneDa: diChi ? dove : null });
      if(r.annullato){ closeModal("modal-nuovo-cavallo"); return; }
      if(r.error) return errore("Errore: " + r.error.message);
      showToast(`${nome} aggiunto`);
    }
    // tiene allineato il testo dei cavalli del cliente
    const cav = await DB.listCavalliCliente(clienteId);
    await DB.updateClienteMascalcia(clienteId, { nome_cavallo: cav.map(x => x.nome).join(", ") });
    closeModal("modal-nuovo-cavallo");
    await loadClientiMascalcia();
    // aperta da «Modifica» o dalla scheda del cliente: si aggiornano l'elenco e la scheda
    if(document.getElementById("modal-edit-cliente")?.classList.contains("active")) await renderCavalliEditCliente();
    if(currentClienteId && document.getElementById("clienti-detail-view")?.style.display === "block") await openClienteDetail(currentClienteId);
  } finally { btn.disabled = false; }
}
// clienti archiviati: in fondo, chiusi; cavalli e storico restano e si possono ripristinare
function sezioneArchiviati(card, alfabetico){
  const arch = (clientiMascalcia || []).filter(c => c.archiviato_il).sort(alfabetico);
  if(!arch.length) return "";
  return `<details class="clienti-archiviati" style="margin-top:16px">
      <summary class="clienti-sez-title" style="cursor:pointer;padding:6px 0">CLIENTI ARCHIVIATI (${arch.length})</summary>
      <div class="muted" style="font-size:12.5px;line-height:1.5;margin:4px 0 8px">Cavalli e storico sono al sicuro. Apri un cliente per ripristinarlo.</div>
      <div style="opacity:.72">${arch.map(card).join("")}</div>
    </details>`;
}

function isStruttura(c){ return c && c.tipo_cliente === "struttura"; }
function isStrutturaCollegata(clienteId){
  const c = clientiMascalcia.find(x => x.id === clienteId);
  return !!(c && c.centro_id && c.collegamento_stato === "attivo");
}


export { apriCavalloDaCartella, apriNuovoCavalloCartella, caricaCartellaCavalli, cavalliCartella, isStruttura, isStrutturaCollegata, ncavClienteCambiato, renderClientiList, salvaNuovoCavalloCartella, sceltaCartellaClienti };
