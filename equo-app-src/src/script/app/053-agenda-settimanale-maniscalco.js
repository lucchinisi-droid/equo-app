/* ---------- AGENDA SETTIMANALE (maniscalco) ---------- */
const AG_GIORNI = ["Lun","Mar","Mer","Gio","Ven","Sab","Dom"];
const AG_MESI = ["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"];
const AG_MESI_LUNGHI = ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
let agSettimanaOffset = 0;          // 0 = settimana corrente, +1 successiva, -1 precedente
let agGiorniAperti = null;          // Set di date ISO espanse
let agEventiCache = {};             // id -> intervento
let agEventoAzioniId = null;
let agRenderToken = 0;

function agLunedi(offset){
  const oggi = new Date();
  const d = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());
  const dow = (d.getDay() + 6) % 7; // 0 = lunedì
  d.setDate(d.getDate() - dow + offset * 7);
  return d;
}
function agEtichettaSettimana(lun){
  const dom = new Date(lun.getFullYear(), lun.getMonth(), lun.getDate() + 6);
  if(lun.getMonth() === dom.getMonth()) return `${lun.getDate()} – ${dom.getDate()} ${AG_MESI_LUNGHI[dom.getMonth()]} ${dom.getFullYear()}`;
  return `${lun.getDate()} ${AG_MESI[lun.getMonth()]} – ${dom.getDate()} ${AG_MESI[dom.getMonth()]} ${dom.getFullYear()}`;
}
function agNomeCavallo(i){
  if(i.cavalli_clienti_mascalcia?.nome) return i.cavalli_clienti_mascalcia.nome;
  const elenco = i.clienti_mascalcia?.nome_cavallo || "";
  return !i.cavallo_cliente_id && elenco && !elenco.includes(",") ? elenco : "";
}
// solo per le schermate del maniscalco: aggiunge «ferri nuovi» / «rimessa» (i testi per i clienti usano agDescrizioneTipo)
function agDescrizioneTipoPro(i){
  const t = agDescrizioneTipo(i);
  if(i.ferri_nuovi === false) return t + " · rimessa";
  if(i.ferri_nuovi === true && i.quantita_ferri) return t.replace(/(\d+) ferri$/, "$1 ferri nuovi");
  return t;
}
function agDescrizioneTipo(i){
  let t = TIPO_FERRATURA_LABELS[i.tipo_ferratura] || i.tipo_ferratura || "";
  if(i.tipo_ferratura === "altro" && i.tipo_altro) t = i.tipo_altro;
  const extra = [];
  if(i.numero_ferro) extra.push("n. " + i.numero_ferro + (i.misura_sistema ? " " + MISURA_SISTEMA_LABEL[i.misura_sistema] : ""));
  if(i.quantita_ferri) extra.push(i.quantita_ferri + " ferri");
  return [t, ...extra].join(" · ");
}

async function renderAgendaSettimana(direzione){
  const box = document.getElementById("ag-week");
  if(!box) return;
  const token = ++agRenderToken;
  const lun = agLunedi(agSettimanaOffset);
  const giorni = Array.from({ length: 7 }, (_, k) => new Date(lun.getFullYear(), lun.getMonth(), lun.getDate() + k));
  const isoGiorni = giorni.map(isoLocale);
  const oggiIso = isoLocale(new Date());
  document.getElementById("ag-week-label").textContent = agEtichettaSettimana(lun);
  document.getElementById("ag-oggi-btn").style.display = agSettimanaOffset === 0 ? "none" : "inline-block";
  if(!agGiorniAperti) agGiorniAperti = new Set([oggiIso]);

  renderRichiestePendenti();
  const [eventi, scadenze] = await Promise.all([
    DB.listInterventiPeriodo(isoGiorni[0], isoGiorni[6]),
    DB.listScadenzePeriodo(isoGiorni[0], isoGiorni[6]),
    caricaUbicazioni()
  ]);
  if(token !== agRenderToken) return; // un render più recente è già partito
  agEventiCache = {};
  (typeof hpAppuntamenti !== "undefined" ? hpAppuntamenti : []).forEach(e => { agEventiCache[e.id] = e; });   // righe della Home pro
  eventi.forEach(e => { agEventiCache[e.id] = e; });

  scadenze.forEach(sc => { agEventiCache["sc:" + sc.id] = sc; });
  agGiorniDati = giorni.map((g, k) => {
    const iso = isoGiorni[k];
    return { iso, k, g, oggi: iso === oggiIso,
      ev: eventi.filter(e => e.data_intervento === iso),
      sc: scadenze.filter(sc => sc.prossima_scadenza === iso) };
  });
  agDisegnaGriglia();
  box.classList.remove("slide-l", "slide-r");
  if(direzione){ void box.offsetWidth; box.classList.add(direzione > 0 ? "slide-l" : "slide-r"); }
  agAttivaSwipe(box);
}

