// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { renderProDeadlines } from "./040-home-pro-prossimi-appuntamenti-da-richia.js";
import { renderIncassi } from "./047-incassi-saldati-per-periodo-da-saldare-p.js";
import { chiediSiNo } from "./052-ferro-standard-nella-scheda-del-cavallo.js";
import { renderAgendaSettimana } from "./053-agenda-settimanale-maniscalco.js";
import { mlRender } from "./090-disegno.js";
import { tcDopoTappa } from "./114-torna-a-casa.js";
import { prossimaAutomatica } from "./117-segna-fatto.js";
/* ---------- fasi ---------- */
async function mlPausaNotifiche(on){
  if(DEMO_MODE || !currentUser) return;
  const { error } = await sb.from("profiles").update({ lavoro_fino: on ? new Date(Date.now() + 4 * 3600e3).toISOString() : null }).eq("id", currentUser.id);
  if(error) console.warn("lavoro_fino:", error.message);
}
function mlAlLavoro(){ ml.fase = "durante"; mlSalva(); mlRender(); mlPausaNotifiche(true); }
function mlHoFinito(){ ml.fase = "dopo"; mlSalva(); mlRender(); }
async function mlAnnulla(){
  if(!(await chiediSiNo("Uscire dalla modalità Lavoro?", "La tappa resta in agenda da fare; le notifiche tornano attive."))) return;
  ml = null; mlProb = null; mlSalva(); mlRender(); mlPausaNotifiche(false);
}
async function mlChiudi(){
  const oggi = mlOggi();
  let errori = 0;
  for(const e of mlEventi){
    if(e.stato === "fatto") continue;
    const upd = { stato: "fatto" };
    if(e.data_intervento !== oggi) upd.data_intervento = oggi;
    if(!incassiNascosti()){
      const v = ml.importi[e.id];
      upd.importo = v === "" || v == null || isNaN(Number(v)) ? null : Math.round(Number(v) * 100) / 100;
      upd.stato_pagamento = ml.pag;
    }
    // 28/10/2026: stessa regola di Hammer (117-segna-fatto.js): con 0 € la prossima data resta quella di prima
    const ps = await prossimaAutomatica(e, oggi, upd.importo);
    if(ps !== undefined) upd.prossima_scadenza = ps;
    const { error } = await DB.updateInterventoMascalcia(e.id, upd);
    if(error){ errori++; console.error("chiudi tappa:", error); }
  }
  // i cavalli segnati «Regolare» chiudono i loro problemi aperti
  if(!DEMO_MODE){
    const conProblema = new Set((ml.problemi || []).map(p => p.cav));
    const regolari = [...new Set(mlEventi.map(mlCavId).filter(id => id && !conProblema.has(id)))];
    if(regolari.length){
      const { error } = await sb.from("cavalli_problemi_piede").update({ risolto_il: new Date().toISOString() }).in("cavallo_cliente_id", regolari).is("risolto_il", null);
      if(error) console.warn("problemi risolti:", error.message);
    }
  }
  await mlPausaNotifiche(false);
  const n = mlEventi.length;
  ml = null; mlProb = null; mlSalva(); mlRender();
  showToast(errori ? `Tappa chiusa, ma ${errori} lavori non salvati: controlla in agenda` : `Tappa chiusa: ${n} ${n === 1 ? "lavoro fatto" : "lavori fatti"}`);
  try{ await renderProDeadlines(); await renderIncassi(); if(typeof renderAgendaSettimana === "function") await renderAgendaSettimana(); }catch(e){}
  tcDopoTappa().catch(e => console.warn("torna a casa:", e));   // ultima tappa di oggi: «Giornata finita · Torna a casa»
}


export { mlAlLavoro, mlAnnulla, mlChiudi, mlHoFinito, mlPausaNotifiche };
