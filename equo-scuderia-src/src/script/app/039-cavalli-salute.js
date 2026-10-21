/* ---------- CAVALLI & SALUTE ---------- */
async function refreshCavalliModule(){
  await loadCavalli();
  await loadEventiAll();
  document.getElementById("cavalli-detail-view").style.display = "none";
  document.getElementById("cavalli-list-view").style.display = "block";
  currentCavalloId = null;
  renderCavalliList();
  refreshBoxSezione();
}

let cavalliUsciti = [], cavalliArrivi = [];
async function loadCavalli(){
  if(DEMO_MODE){ cavalliList = demoState.cavalli.filter(c => !c.uscito_il); cavalliUsciti = demoState.cavalli.filter(c => c.uscito_il); cavalliArrivi = demoState.arrivi || []; return; }
  const campi = "id, centro_id, nome, razza, mantello, data_nascita, microchip, proprietario, note, tipo_proprieta, gruppo_sanguigno, foto_url, pdf_url, pdf_generato_at, updated_at, proprietario_membro_id, codice_equo";
  // cavalli usciti (spostati altrove con «Sposta»): non si cancellano, restano in fondo come «Usciti dal centro»
  const [att, usc, arr] = await Promise.all([
    sb.from("scuderia_cavalli").select(campi).eq("centro_id", currentCentro.id).is("uscito_il", null).order("nome", { ascending: true }),
    sb.from("scuderia_cavalli").select("id, nome, razza, proprietario, codice_equo, uscito_il, uscito_verso").eq("centro_id", currentCentro.id).not("uscito_il", "is", null).order("uscito_il", { ascending: false }).limit(50),
    sb.from("cavalli_arrivi").select("id, nome_cavallo, proprietario_nome, richiesto_nome, richiesto_ruolo, dal, created_at").eq("centro_id", currentCentro.id).eq("stato", "in_attesa").order("created_at", { ascending: true })
  ]);
  cavalliUsciti = usc.error ? [] : (usc.data || []);
  cavalliArrivi = arr.error ? [] : (arr.data || []);
  if(!att.error){ cavalliList = att.data || []; return; }
  const { data, error } = await sb.from("scuderia_cavalli").select(campi).eq("centro_id", currentCentro.id).order("nome", { ascending: true });
  if(!error){ cavalliList = data || []; return; }
  // ripiego se la colonna proprietario_membro_id non esistesse
  const r = await sb.from("scuderia_cavalli")
    .select("id, centro_id, nome, razza, mantello, data_nascita, microchip, proprietario, note, tipo_proprieta, gruppo_sanguigno, foto_url, pdf_url, pdf_generato_at, updated_at, codice_equo")
    .eq("centro_id", currentCentro.id).order("nome", { ascending: true });
  if(!r.error) cavalliList = r.data || [];
}

async function loadEventiAll(){
  if(DEMO_MODE){ eventiAll = demoState.eventi; aggiornaContatoriNav(); return; }
  const { data, error } = await sb.from("scuderia_eventi_sanitari")
    .select("*")
    .eq("centro_id", currentCentro.id)
    .order("data_evento", { ascending: false });
  if(!error) eventiAll = data || [];
  aggiornaContatoriNav();
}

function scadenzarioFor(cavalloId){
  const eventiCavallo = eventiAll.filter(e => e.cavallo_id === cavalloId);
  const result = {};
  TIPO_ORDER.forEach(tipo => {
    const eventi = eventiCavallo.filter(e => e.tipo === tipo)
      .sort((a,b) => new Date(b.data_evento) - new Date(a.data_evento));
    const ultimo = eventi[0] || null;
    result[tipo] = { ultimo, status: statusFor(ultimo) };
  });
  return result;
}

function statusFor(evento){
  if(!evento) return "gray";
  if(!evento.data_scadenza) return "gray";
  const oggi = new Date(); oggi.setHours(0,0,0,0);
  const scad = new Date(evento.data_scadenza);
  const giorni = Math.round((scad - oggi) / 86400000);
  if(giorni < 0) return "red";
  if(giorni <= (PREAVVISO_GIORNI[evento.tipo] ?? SOGLIE_CONTATORI.saluteGiorni)) return "yellow";
  return "green";
}

function worstStatus(cavalloId){
  const scad = scadenzarioFor(cavalloId);
  const order = { red:0, yellow:1, gray:2, green:3 };
  let worst = "green";
  TIPO_ORDER.forEach(tipo => { if(order[scad[tipo].status] < order[worst]) worst = scad[tipo].status; });
  return worst;
}

const STATUS_LABELS = { red:"Scaduto", yellow:"In scadenza", green:"In regola", gray:"Da registrare" };

// categorie apribili/chiudibili: lo stato resta su questo dispositivo
let sezioniCavalliChiuse = (() => { try{ return JSON.parse(localStorage.getItem("equo-scud-sez-chiuse") || "[]"); }catch(e){ return []; } })();
function toggleSezioneCavalli(sez){
  sezioniCavalliChiuse = sezioniCavalliChiuse.includes(sez) ? sezioniCavalliChiuse.filter(x => x !== sez) : [...sezioniCavalliChiuse, sez];
  try{ localStorage.setItem("equo-scud-sez-chiuse", JSON.stringify(sezioniCavalliChiuse)); }catch(e){}
  renderCavalliList();
}
function renderArriviUsciti(){
  const ab = document.getElementById("cavalli-arrivi"), ub = document.getElementById("cavalli-usciti");
  if(ab) ab.innerHTML = cavalliArrivi.map(a => `<div class="arrivo-card">
      <div class="arrivo-t">🐴 ${escapeHtml(a.nome_cavallo)} in arrivo</div>
      <div class="arrivo-d">${escapeHtml(a.richiesto_nome || "Qualcuno")} (${a.richiesto_ruolo === "maniscalco" ? "maniscalco" : "proprietario"}) segna che <b>${escapeHtml(a.nome_cavallo)}</b>${a.proprietario_nome ? " di <b>" + escapeHtml(a.proprietario_nome) + "</b>" : ""} sta da voi dal ${formatDate(a.dal)}. Accogliendolo entra nei vostri cavalli (Pensione) con la sua scheda Equo e il suo storico.</div>
      <div class="arrivo-az"><button class="btn btn-primary" onclick="rispondiArrivo('${a.id}', true, this)">Accogli</button><button class="btn btn-outline" onclick="rispondiArrivo('${a.id}', false, this)">Non è da noi</button></div>
    </div>`).join("");
  if(ub) ub.innerHTML = cavalliUsciti.length ? `<details class="usciti-box"><summary>Usciti dal centro · ${cavalliUsciti.length}</summary>
      ${cavalliUsciti.map(c => `<div class="uscito-riga"><b>${escapeHtml(c.nome)}</b><span>${escapeHtml([c.proprietario, c.codice_equo].filter(Boolean).join(" · "))}</span>
        <span>uscito il ${formatDate(String(c.uscito_il).slice(0, 10))}${c.uscito_verso ? " · verso " + escapeHtml(c.uscito_verso) : ""}</span></div>`).join("")}
      <p class="usciti-nota">La scheda e lo storico restano: se il cavallo torna e qualcuno lo indica in Equo, con «Accogli» si riattiva la stessa scheda.</p></details>` : "";
}
async function rispondiArrivo(id, accogli, btn){
  const a = cavalliArrivi.find(x => x.id === id);
  if(!a) return;
  if(!accogli && btn.dataset.conferma !== "1"){ btn.dataset.conferma = "1"; btn.textContent = "Tocca ancora: non è da noi"; setTimeout(() => { btn.dataset.conferma = ""; btn.textContent = "Non è da noi"; }, 4000); return; }
  btn.closest(".arrivo-az").querySelectorAll("button").forEach(b => b.disabled = true);
  if(DEMO_MODE){
    demoState.arrivi = (demoState.arrivi || []).filter(x => x.id !== id);
    if(accogli) demoState.cavalli.push({ id: "dcav-" + Date.now(), nome: a.nome_cavallo, proprietario: a.proprietario_nome, tipo_proprieta: "pensione", centro_id: currentCentro.id });
  } else {
    const { data, error } = await sb.rpc("equo_rispondi_arrivo", { p_id: id, p_accogli: accogli });
    if(error || !data?.ok){ showToast((data && data.errore) || (error && error.message) || "Non riuscito, riprova."); btn.closest(".arrivo-az").querySelectorAll("button").forEach(b => b.disabled = false); return; }
  }
  showToast(accogli ? `${a.nome_cavallo} accolto: lo trovi in Pensione` : `Segnalato: ${a.nome_cavallo} non è da voi. Chi l'aveva indicato riceve l'avviso.`);
  await refreshCavalliModule();
}
function renderCavalliList(){
  renderArriviUsciti();
  const empty = document.getElementById("cavalli-empty");
  empty.style.display = cavalliList.length === 0 ? "block" : "none";
  document.getElementById("cavalli-sezioni").style.display = cavalliList.length === 0 ? "none" : "block";

  ["proprieta","pensione","soci"].forEach(sezione => {
    const grid = document.getElementById("cavalli-grid-" + sezione);
    const sezioneEl = document.querySelector(`.cavalli-sezione[data-sezione="${sezione}"]`);
    const emptySezione = sezioneEl.querySelector(".empty-state-sezione");
    const list = cavalliList.filter(c => (c.tipo_proprieta || "proprieta") === sezione);
    grid.innerHTML = "";
    sezioneEl.style.display = cavalliList.length === 0 ? "none" : "block";
    emptySezione.style.display = list.length === 0 ? "block" : "none";
    const chiusa = sezioniCavalliChiuse.includes(sezione);
    sezioneEl.classList.toggle("chiusa", chiusa);
    sezioneEl.querySelector(".cav-sez-n").textContent = " · " + list.length;
    const urgenti = list.filter(c => pallinoCavallo(c.id).col === "rosso").length;
    sezioneEl.querySelector(".cav-sez-alert").innerHTML = chiusa && urgenti ? `<span class="sem-dot rosso" data-tip="${urgenti} ${urgenti === 1 ? "cavallo ha" : "cavalli hanno"} scadenze superate"></span>` : "";

    list.forEach(c => {
      const worst = worstStatus(c.id);
      const sub = [c.razza, c.mantello].filter(Boolean).join(" · ") || "Dati non specificati";
      const div = document.createElement("div");
      div.className = "card cavallo-card";
      div.onclick = () => openCavalloDetail(c.id);
      div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
          ${c.foto_url ? `<div style="width:40px;height:40px;border-radius:8px;background-image:${cssUrl(c.foto_url)};background-size:cover;background-position:center;flex-shrink:0"></div>` : ""}
          <div style="flex:1">
            <h3 style="margin:0 0 2px;display:flex;align-items:center;gap:8px">${escapeHtml(c.nome)} ${pallinoHtml(c.id)}</h3>
            <div style="color:var(--muted);font-size:13px">${escapeHtml(sub)}</div>
          </div>
          <span class="badge-pill badge-${worst}" data-tip="Stato dello scadenzario (vaccino, Coggins, ferratura, sverminazione)">${STATUS_LABELS[worst]}</span>
        </div>`;
      grid.appendChild(div);
    });
  });
}

function openCavalloDetail(id){
  currentCavalloId = id;
  document.getElementById("cavalli-list-view").style.display = "none";
  document.getElementById("cavalli-detail-view").style.display = "block";
  renderCavalloDetail();
  caricaAllegatiScud(id);
}

function closeCavalloDetail(){
  currentCavalloId = null;
  document.getElementById("cavalli-detail-view").style.display = "none";
  document.getElementById("cavalli-list-view").style.display = "block";
  renderCavalliList();
}

