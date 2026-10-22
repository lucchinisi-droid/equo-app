/* ---------- SCHEDA CLIENTE A BOX + SCHEDA DEL CAVALLO (maniscalco) ----------
   Il cavallo è al centro: un box per cavallo (il primo è «+ Aggiungi cavallo», poi in ordine alfabetico);
   lo storico è del singolo cavallo (anche se seguito presso un altro cliente). Niente più storico cumulativo del cliente. */
let schedaCavalli = [], schedaFoto = {}, schedaCavalloKey = null, schedaCavalloTab = "tutto", schedaStoricoCavallo = [], schedaSpostamenti = [];
async function loadClienteInterventi(clienteId){
  const grid = document.getElementById("cliente-cavalli-grid");
  if(!grid) return;
  if(!schedaCavalli.length || storicoClienteId !== clienteId) grid.innerHTML = '<div class="loading" style="grid-column:1/-1"><div class="spinner"></div> Caricamento...</div>';
  storicoClienteId = clienteId;
  const [cav, data] = await Promise.all([DB.listCavalliCliente(clienteId), DB.listInterventiMascalcia(clienteId)]);
  if(currentClienteId !== clienteId) return;
  schedaCavalli = cav || [];
  clienteInterventiCache = data || [];
  schedaFoto = {};
  const ids = schedaCavalli.map(x => x.id).filter(Boolean);
  if(ids.length && !DEMO_MODE){
    try{ const r = await sb.rpc("pro_foto_cavalli", { p_righe: ids }); (r.data || []).forEach(f => { schedaFoto[f.cavallo_cliente_id] = f.foto_url; }); }catch(e){}
  }
  renderBoxCavalliCliente();
  renderAvvisoSimili();
  renderInterventiSenzaCavallo();
  const boxQui = document.getElementById("cliente-qui-box"); if(boxQui) boxQui.innerHTML = "";
  caricaCavalliMiei().then(() => { if(currentClienteId === clienteId) renderCavalliQui(clienteId); }).catch(() => {});
  caricaContiCliente(clienteId);
  if(schedaCavalloKey && document.getElementById("cavallo-pro-view").style.display === "block") await apriSchedaCavalloPro(schedaCavalloKey, true);
}
// cavalli di ALTRI clienti che stanno in questo luogo (scuderia): restano del loro cliente, che paga; qui si vedono e si aprono
function cavalliQuiStanno(luogoId){
  return (cavalliMieiLista || []).filter(c => c.ubicazione_tipo === "scuderia" && c.ubicazione_cliente_id === luogoId && c.cliente_mascalcia_id !== luogoId)
    .sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" }));
}
function renderCavalliQui(clienteId){
  const box = document.getElementById("cliente-qui-box");
  if(!box) return;
  const lista = cavalliQuiStanno(clienteId);
  if(!lista.length){ box.innerHTML = ""; return; }
  box.innerHTML = `<div class="clienti-sez-head" style="margin-top:14px"><div class="clienti-sez-title">QUI STANNO (${lista.length})</div></div>
    <div class="muted" style="font-size:12.5px;line-height:1.5;margin:0 0 8px">Cavalli di altri clienti che hai spostato qui. Restano intestati al loro proprietario, che paga il lavoro.</div>
    <div class="cli-lista">${lista.map(c => {
      const prop = clienteDiId(c.cliente_mascalcia_id);
      return `<div class="cli-riga" onclick="apriCavalloDaCartella('${c.cliente_mascalcia_id}', '${c.id || ""}', '${c.horse_id || ""}')">
        <span class="cli-av">${iniziale(c.nome)}</span>
        <span class="cli-c"><b>${escapeHtml(c.nome || "")}</b><span>di ${escapeHtml(prop ? prop.nome : "un cliente")}${c.ubicazione_dal ? " · dal " + escapeHtml(formatDataBreve(c.ubicazione_dal)) : ""}</span></span>
        <span class="cli-dx">›</span></div>`; }).join("")}</div>`;
}
function interventiDelCavallo(cv, lista){
  return (lista || []).filter(i => (cv.id && i.cavallo_cliente_id === cv.id) || (cv.horse_id && i.horse_id === cv.horse_id));
}
// ultimo lavoro fatto e prossimo (appuntamento da fare, altrimenti la scadenza dell'ultimo lavoro)
function statoCavalloPro(cv, lista){
  const oggi = isoLocale(new Date());
  const mie = interventiDelCavallo(cv, lista);
  const fatti = mie.filter(i => i.stato === "fatto").sort((a, b) => (b.data_intervento || "").localeCompare(a.data_intervento || ""));
  const prossimi = mie.filter(i => ["programmato", "richiesto", "proposto"].includes(i.stato) && i.data_intervento >= oggi).sort((a, b) => a.data_intervento.localeCompare(b.data_intervento));
  const ultimo = fatti[0] || null;
  const prossimo = prossimi[0] ? { data: prossimi[0].data_intervento, testo: TIPO_FERRATURA_LABELS[prossimi[0].tipo_ferratura] || prossimi[0].tipo_ferratura, fissato: true }
    : ultimo && ultimo.prossima_scadenza ? { data: ultimo.prossima_scadenza, testo: "scadenza", fissato: false } : null;
  let sem = null;
  if(prossimo){
    const g = giorniTra(oggi, prossimo.data);
    sem = prossimo.fissato ? "verde" : g < 0 ? "rosso" : g <= 7 ? "arancio" : "verde";
  }
  return { ultimo, prossimo, sem };
}
function fotoCavalloPro(cv){ return cv.id ? schedaFoto[cv.id] || null : null; }
function iniziale(n){ return escapeHtml(String(n || "?").trim().charAt(0).toUpperCase() || "?"); }
function descrFerroBreve(cv){
  const p = [];
  if(cv.ferro_numero) p.push(siglaFerro(cv.ferro_sistema, cv.ferro_numero));
  if(cv.ferratura_tipo === "mezza") p.push("mezza");
  if(cv.ferratura_tipo === "pareggio") return "pareggio";
  if(cv.ferro_tipo === "correttivo" || cv.ferro_tipo_post === "correttivo") p.push("correttivo");
  return p.join(" · ");
}
