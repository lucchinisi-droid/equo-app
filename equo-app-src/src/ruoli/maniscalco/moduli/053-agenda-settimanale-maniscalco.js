// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { caricaUbicazioni } from "./050-sposta-cavallo-dove-sta-il-cavallo-a-cas.js";
import { MISURA_SISTEMA_LABEL, aggiungiGiorniIso, isoLocale } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { renderRichiestePendenti } from "./054-richieste-di-appuntamento-step-5d.js";
import { agDisegnaGriglia } from "./055-appuntamenti-con-strutture-equo-scuderia.js";
import { pmCaricaSettimana } from "./111-promemoria-personali.js";
import { agAttivaSwipe } from "./056-ordine-del-giro-trascina-un-cavallo-nel.js";
/* ---------- AGENDA SETTIMANALE (maniscalco) ---------- */
const AG_GIORNI = ["Lun","Mar","Mer","Gio","Ven","Sab","Dom"];
const AG_MESI = ["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"];
const AG_MESI_LUNGHI = ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
/* -> stato-condiviso.js */          // 0 = settimana corrente, +1 successiva, -1 precedente
/* -> stato-condiviso.js */          // Set di date ISO espanse
/* -> stato-condiviso.js */             // id -> intervento
/* -> stato-condiviso.js */
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
// 28/10/2026: un solo testo quando il cavallo non è indicato
function agNomeCavalloTesto(i){ return agNomeCavallo(i) || "Cavallo non indicato"; }
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

// La domenica è RIPOSO (26/10/2026): una scadenza che cade di domenica si mostra e si propone il lunedì
function agGiornoLavoro(iso){
  if(!iso) return iso;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getDay() === 0 ? aggiungiGiorniIso(iso, 1) : iso;
}
// 28/10/2026: «Fissa appuntamento» da una scadenza, da qualunque punto (Agenda, Home → Scadenze, Agenda completa):
// la scadenza se è futura, altrimenti oggi; se cade di domenica, il lunedì
function agDataPerFissare(iso){
  const oggi = isoLocale(new Date());
  return agGiornoLavoro(!iso || iso < oggi ? oggi : iso);
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
  const pmAttesa = pmCaricaSettimana(isoGiorni[0], isoGiorni[6]).catch(() => []);   // promemoria personali, in parallelo
  const [eventi, scadenze] = await Promise.all([
    DB.listInterventiPeriodo(isoGiorni[0], isoGiorni[6]),
    DB.listScadenzePeriodo(aggiungiGiorniIso(isoGiorni[0], -1), isoGiorni[6]),   // dalla domenica prima: la domenica è riposo, le sue scadenze vanno al lunedì
    caricaUbicazioni()
  ]);
  const promemoria2 = await pmAttesa;
  if(token !== agRenderToken) return; // un render più recente è già partito
  agEventiCache = {};
  (typeof hpAppuntamenti !== "undefined" ? hpAppuntamenti : []).forEach(e => { agEventiCache[e.id] = e; });   // righe della Home pro
  eventi.forEach(e => { agEventiCache[e.id] = e; });

  scadenze.forEach(sc => { sc.data_vista = agGiornoLavoro(sc.prossima_scadenza); agEventiCache["sc:" + sc.id] = sc; });
  agGiorniDati = giorni.map((g, k) => {
    const iso = isoGiorni[k];
    return { iso, k, g, oggi: iso === oggiIso,
      ev: eventi.filter(e => e.data_intervento === iso),
      sc: scadenze.filter(sc => sc.data_vista === iso),
      pm: promemoria2.filter(p => isoLocale(new Date(p.quando)) === iso) };
  });
  agDisegnaGriglia();
  if(typeof agAggiornaSchede === "function") agAggiornaSchede();
  box.classList.remove("slide-l", "slide-r");
  if(direzione){ void box.offsetWidth; box.classList.add(direzione > 0 ? "slide-l" : "slide-r"); }
  agAttivaSwipe(box);
}


export { agDataPerFissare, agNomeCavalloTesto, AG_GIORNI, AG_MESI, AG_MESI_LUNGHI, agDescrizioneTipo, agDescrizioneTipoPro, agGiornoLavoro, agLunedi, agNomeCavallo, renderAgendaSettimana };
