// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { giorniRichiamoSuggeriti, prendiFerriScelti, prendiImportiScelti, prendiPagamentoScelto, richiamoPerFatto } from "./032-richiamo-prossimo-intervento-sempre-in-g.js";
import { renderProDeadlines } from "./040-home-pro-prossimi-appuntamenti-da-richia.js";
import { renderIncassi } from "./047-incassi-saldati-per-periodo-da-saldare-p.js";
import { aggiungiGiorniIso, isoLocale } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { chiediSiNo } from "./052-ferro-standard-nella-scheda-del-cavallo.js";
import { renderAgendaSettimana } from "./053-agenda-settimanale-maniscalco.js";
import { formatDataBreve } from "./054-richieste-di-appuntamento-step-5d.js";
/* ---------- «FATTO»: UNA SOLA REGOLA (28/10/2026, punto 3 dell'unificazione) ----------
   segnaFatto(e): Agenda (tasto Fatto), finestra dell'appuntamento, Giro della zona, Agenda completa.
     · appuntamento futuro: «L'hai già fatto oggi?» con il Sì/No di Equo (prima era la finestrella del telefono);
     · appuntamento con la scuderia nel futuro: si segna il giorno dell'intervento;
     · riquadro del Fatto: prossima ferratura, importo, Saldato / Da saldare, ferri nuovi (vista Completa).
   prossimaAutomatica(): la stessa regola quando non c'è il riquadro (Modalità Lavoro, Hammer):
     giorni del cavallo / della scuderia / predefiniti; con importo 0 (lavoro straordinario) la prossima resta come prima. */

async function fattoInAnticipo(e){
  const oggi = isoLocale(new Date());
  if(!e || !e.data_intervento || e.data_intervento <= oggi) return {};
  if(e.gruppo_id){ showToast("È un appuntamento con la scuderia: segnalo fatto il giorno dell'intervento."); return null; }
  const ok = await chiediSiNo(`Già fatto oggi?`, `L'appuntamento è per ${formatDataBreve(e.data_intervento)}. «Sì» lo segna fatto con la data di oggi.`);
  return ok ? { data_intervento: oggi } : null;
}

// i dati del lavoro fatto presi dal riquadro (richiamoPerFatto); null = annullato prima
async function datiDalRiquadro(e, anticipo){
  const upd = { stato: "fatto", ...anticipo };
  const ps = await richiamoPerFatto({ ...e, ...anticipo });
  if(TIPO_FERRATURA_INTERVALLI[e.tipo_ferratura]) upd.prossima_scadenza = ps;
  const pag = prendiPagamentoScelto(); if(pag) upd.stato_pagamento = pag;
  const imp = prendiImportiScelti(); if(imp) upd.importo = imp[0];
  const fs = prendiFerriScelti(); if(fs){ upd.ferri_nuovi = fs.nuovi; if(fs.nuovi) upd.quantita_ferri = fs.n; }
  return upd;
}

async function segnaFatto(e, opz = {}){
  if(!e) return { ok: false };
  const anticipo = await fattoInAnticipo(e);
  if(anticipo === null) return { ok: false };
  if(opz.prima) opz.prima();
  const upd = await datiDalRiquadro(e, anticipo);
  const { error } = await DB.updateInterventoMascalcia(e.id, upd);
  if(error){ showToast("Errore: " + error.message); return { ok: false, error }; }
  showToast("Segnato come fatto");
  await renderAgendaSettimana();
  await renderIncassi();
  await renderProDeadlines();
  return { ok: true, upd };
}

// prossima scadenza senza riquadro (Modalità Lavoro, Hammer): stessa regola dappertutto
async function prossimaAutomatica(e, dataFatto, importo){
  if(!TIPO_FERRATURA_INTERVALLI[e.tipo_ferratura]) return undefined;
  const s = await giorniRichiamoSuggeriti(e.tipo_ferratura, e.cavallo_cliente_id, e.horse_id, e.id, e.cliente_mascalcia_id);
  if(Number(importo) === 0 && importo !== null && importo !== "" && s.prima) return s.prima;
  return s.giorni ? aggiungiGiorniIso(dataFatto || e.data_intervento, s.giorni) : null;
}

export { fattoInAnticipo, prossimaAutomatica, segnaFatto };
