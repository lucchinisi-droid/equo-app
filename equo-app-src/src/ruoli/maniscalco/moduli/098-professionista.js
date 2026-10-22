// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { isStruttura } from "./033-clienti-a-cartelle-stile-telegram-cavall.js";
import { hpColoreRic, hpGiornoEtichetta, hpQuando, hpTipo } from "./040-home-pro-prossimi-appuntamenti-da-richia.js";
import { apriRichiamo, hpGiri, richiamoAzione } from "./041-giro-della-zona-premium.js";
import { isPremium } from "./042-incassi-pro.js";
import { luogoEvento } from "./050-sposta-cavallo-dove-sta-il-cavallo-a-cas.js";
import { aggiungiGiorniIso, isoLocale } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { agDescrizioneTipoPro, agNomeCavallo } from "./053-agenda-settimanale-maniscalco.js";
import { agOrdinaGiro } from "./056-ordine-del-giro-trascina-un-cavallo-nel.js";
import { wgMeteoCarica, wgMeteoIcona } from "./099-meteo-accanto-agli-appuntamenti-indirizz.js";
/* ---------- PROFESSIONISTA ---------- */
/* -> stato-condiviso.js */
function wgTipoApp(e){ return (typeof agDescrizioneTipoPro === "function" ? agDescrizioneTipoPro(e) : hpTipo(e)); }
function wgClienteDi(id){ return (clientiMascalcia || []).find(c => c.id === id) || null; }
// appuntamento messo in evidenza dal maniscalco (tocco su una riga di «Oggi»): resta finché non è fatto
let wgScelto = null;
function wgScegli(id){ wgScelto = id; renderWidgetPro(); }
function renderWidgetPro(){
  const box = document.getElementById("wh-pro");
  if(!box || !currentUser) return;
  const oggi = isoLocale(new Date());
  const adesso = new Date().toTimeString().slice(0, 5);
  const app = (hpAppuntamenti || []).filter(e => e.stato !== "annullato" && e.stato !== "rifiutato");
  const diOggi = agOrdinaGiro(app.filter(e => e.data_intervento === oggi));   // ordine del giro scelto in Agenda (poi l'orario)
  const prossimoOggi = diOggi.find(e => !e.ora || String(e.ora).slice(0, 5) >= adesso) || null;
  const futuri = agOrdinaGiro(app.filter(e => e.data_intervento > oggi));
  const scelto = wgScelto ? app.find(e => e.id === wgScelto && e.data_intervento >= oggi) : null;
  if(wgScelto && !scelto) wgScelto = null;
  const prossimo = scelto || prossimoOggi || futuri[0] || null;
  const cavalliOggi = diOggi.length;
  const strutture = new Set(diOggi.filter(e => isStruttura(wgClienteDi(e.cliente_mascalcia_id))).map(e => e.cliente_mascalcia_id)).size;
  const ric = (hpRichiamiLista || []).slice().sort((a, b) => a.giorni - b.giorni);
  const giri = typeof hpGiri === "function" ? hpGiri() : [];
  const giro = giri[0] || null;

  // OGGI (grande)
  const quando = e => {
    if(!e) return "";
    const ora = e.ora ? String(e.ora).slice(0, 5) : "";
    if(scelto && e.id === scelto.id) return e.data_intervento === oggi ? `In evidenza · oggi${ora ? " " + ora : ""}` : `In evidenza · ${hpGiornoEtichetta(e.data_intervento).toLowerCase()}${ora ? " " + ora : ""}`;
    if(e.data_intervento === oggi && ora){
      const [h, m] = ora.split(":").map(Number); const d = new Date(); d.setHours(h, m, 0, 0);
      const min = Math.round((d - new Date()) / 60000);
      return min > 0 && min < 180 ? `Prossimo · tra ${min} min · ${ora}` : `Prossimo · oggi ${ora}`;
    }
    return e.data_intervento === oggi ? "Prossimo · oggi" : `Prossimo · ${hpGiornoEtichetta(e.data_intervento).toLowerCase()}${ora ? " " + ora : ""}`;
  };
  wgMeteoCarica([...new Set([...diOggi, prossimo].filter(Boolean).map(e => e.cliente_mascalcia_id))]);
  let oggiHtml;
  if(prossimo){
    const c = wgClienteDi(prossimo.cliente_mascalcia_id);
    const cav = agNomeCavallo(prossimo);
    const lp = cavalliMieiCache ? luogoEvento(prossimo, true) : null;
    const dove = lp && lp.key !== "c:" + prossimo.cliente_mascalcia_id ? [lp.nome, lp.indirizzo, "di " + (prossimo.clienti_mascalcia?.nome || c?.nome || "")].filter(Boolean).join(" · ")
      : [prossimo.clienti_mascalcia?.nome || c?.nome, c?.indirizzo].filter(Boolean).join(" · ");
    const altri = diOggi.filter(e => e.id !== prossimo.id).slice(0, 6);
    oggiHtml = `
      <div class="wg-prossimo" onclick="apriAzioniEvento('${prossimo.id}')">
        <div class="wg-quando">${wgEsc(quando(prossimo))}</div>
        <div class="wg-chi">${wgEsc(cav || prossimo.clienti_mascalcia?.nome || "Appuntamento")} · ${wgEsc(wgTipoApp(prossimo).toLowerCase())}${wgMeteoIcona(prossimo)}</div>
        <div class="wg-dove">${wgEsc(dove)}</div>
        <div class="wg-azioni">
          <button class="oro" onclick="event.stopPropagation();wgNavigaEvento('${prossimo.id}')">${WG_IC.mappa}Naviga</button>
          <button onclick="event.stopPropagation();openChatThread('${prossimo.cliente_mascalcia_id}')">${WG_IC.msg}Chatta</button>
          ${prossimo.stato === "programmato" ? `<button onclick="event.stopPropagation();hpSegnaFatto('${prossimo.id}')">${WG_IC.ok}Fatto</button>` : `<button onclick="event.stopPropagation();apriAzioniEvento('${prossimo.id}')">Apri</button>`}
        </div>
      </div>
      ${altri.map(e => `<div class="wg-voce" onclick="wgScegli('${e.id}')">${e.ora ? `<span class="wg-ora">${String(e.ora).slice(0, 5)}</span>` : ""}<span class="wg-t">${wgEsc(agNomeCavallo(e) || "")} · ${wgEsc(wgTipoApp(e).toLowerCase())} <small>· ${wgEsc(e.clienti_mascalcia?.nome || "")}</small></span>${wgMeteoIcona(e)}<button class="wg-piu" aria-label="Modifica appuntamento" onclick="event.stopPropagation();apriAzioniEvento('${e.id}')">⋯</button></div>`).join("")}
      ${altri.length ? '<div class="wg-nota">Tocca un appuntamento per metterlo in evidenza con Naviga, Chatta e Fatto.</div>' : ""}
      ${!prossimoOggi && prossimo ? '<div class="wg-nota">Oggi nessun appuntamento: questo è il prossimo in agenda.</div>' : ""}`;
  } else {
    oggiHtml = `<div class="wg-vuoto">Nessun appuntamento in agenda.<br><button class="wg-link" onclick="openInterventoModal(null)">+ Fissane uno</button></div>`;
  }

  // DA RICHIAMARE (medio)
  const ricHtml = ric.length
    ? ric.slice(0, 3).map(r => `<div class="wg-ric" onclick="apriRichiamo('${r.intervento_id}')"><span class="wg-sem ${hpColoreRic(r)}"></span><span class="wg-t"><b>${wgEsc(r.cavallo_nome || "Cavallo")}</b> · ${wgEsc(r.cliente_nome || "")}<small>${wgEsc(hpTipo(r).toLowerCase())} · ${wgEsc(hpQuando(r))}</small></span><button class="wg-scrivi" onclick="event.stopPropagation();wgScriviRichiamo('${r.intervento_id}')">Scrivi</button></div>`).join("")
    : '<div class="wg-vuoto piccolo">Nessun cavallo da richiamare nei prossimi 30 giorni.</div>';

  // SETTIMANA (medio)
  const sett = wgPro.settimana;
  const lun = wgLunedi(oggi);
  const giorni = ["L", "M", "M", "G", "V", "S", "D"].map((g, i) => {
    const iso = aggiungiGiorniIso(lun, i);
    const n = sett ? (sett[iso] || 0) : 0;
    return { g, iso, n };
  });
  const max = Math.max(4, ...giorni.map(x => x.n));
  const totSett = giorni.reduce((t, x) => t + x.n, 0);
  if(wgPro.settimanaChiave !== lun) wgCaricaSettimana(lun);

  box.innerHTML = `
    <div class="wg wg-grande">
      <div class="wg-testa"><span class="wg-et">${WG_IC.cal}Oggi</span><span class="wg-meta">${cavalliOggi ? `${cavalliOggi} ${cavalliOggi === 1 ? "appuntamento" : "appuntamenti"}${strutture ? " · " + strutture + (strutture === 1 ? " scuderia" : " scuderie") : ""}` : ""}</span></div>
      ${oggiHtml}
    </div>
    <div class="wg wg-piccolo" onclick="document.querySelector('[data-page=&quot;pro-inbox&quot;]')?.click()">
      <span class="wg-et">${WG_IC.msg}Messaggi</span>${wgPro.unread ? `<span class="wg-badge">${wgPro.unread}</span>` : ""}
      <div class="wg-num">${wgPro.unread} <small>${wgPro.unread === 1 ? "non letto" : "non letti"}</small></div>
      <div class="wg-riga">${wgPro.ultimo ? `<b>${wgEsc(wgPro.ultimo.nome)}:</b> ${wgEsc(wgPro.ultimo.testo)}` : "Nessun messaggio"}</div>
    </div>
    <div class="wg wg-piccolo wg-pieno solo-incassi" onclick="showPage('pro-incassi')">
      <span class="wg-cerchio">${WG_IC.euro}</span>
      <div class="wg-num">${wgEuro(wgPro.incassatoMese)}</div>
      <div class="wg-riga">incassati a ${new Date().toLocaleDateString("it-IT", { month: "long" })}</div>
      <div class="wg-riga evid">${wgPro.daIncassareMese ? wgEuro(wgPro.daIncassareMese) + " da incassare" : "Tutto incassato"}</div>
      ${wgPro.previsto ? `<div class="wg-riga">${wgEuro(wgPro.previsto)} previsti in agenda</div>` : ""}
    </div>
    <div class="wg wg-medio">
      <div class="wg-testa"><span class="wg-et">${WG_IC.camp}Da richiamare</span>${ric.length > 3 ? `<button class="wg-link" onclick="apriListaHome('ric')">${ric.length} in tutto ›</button>` : ""}</div>
      ${ricHtml}
    </div>
    <div class="wg wg-piccolo wg-pieno wg-azione" onclick="openInterventoModal(null)">
      <span class="wg-cerchio grande">${WG_IC.piu}</span>
      <div class="wg-riga forte">Nuovo appuntamento</div>
    </div>
    <div class="wg wg-piccolo" onclick="${giro ? `apriGiro('${giro[0].cliente_mascalcia_id}')` : "showToast('Nessun giro da organizzare: ti avvisiamo quando più cavalli dello stesso cliente scadono insieme')"}">
      ${isPremium() ? "" : '<span class="wg-premium">PREMIUM</span>'}
      <span class="wg-et">${WG_IC.giro}Giro</span>
      <div class="wg-num">${giro ? giro.length : 0} <small>cavalli</small></div>
      <div class="wg-riga">${giro ? `da <b>${wgEsc(giro[0].cliente_nome || "")}</b>: un solo appuntamento` : "Nessun giro da organizzare"}</div>
    </div>
    <div class="wg wg-medio" onclick="showPage('pro-agenda')">
      <div class="wg-testa"><span class="wg-et">${WG_IC.sett}Settimana</span><span class="wg-meta">${sett ? totSett + (totSett === 1 ? " appuntamento" : " appuntamenti") : ""}</span></div>
      <div class="wg-barre">${giorni.map(x => `<div class="wg-barra${x.iso === oggi ? " oggi" : ""}"><b>${x.n || "–"}</b><i style="height:${x.n ? Math.max(12, Math.round(x.n / max * 100)) : 6}%"></i><small>${x.g}</small></div>`).join("")}</div>
    </div>`;
}
function wgLunedi(iso){
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return aggiungiGiorniIso(iso, -((dt.getDay() + 6) % 7));
}
let wgSettInCorso = false;
async function wgCaricaSettimana(lun){
  if(wgSettInCorso) return;
  wgSettInCorso = true;
  try{
    const lista = await DB.listInterventiPeriodo(lun, aggiungiGiorniIso(lun, 6));
    const per = {};
    (lista || []).filter(i => !["rifiutato", "annullato"].includes(i.stato)).forEach(i => { per[i.data_intervento] = (per[i.data_intervento] || 0) + 1; });
    wgPro.settimana = per; wgPro.settimanaChiave = lun;
  } catch(e){ wgPro.settimana = wgPro.settimana || {}; wgPro.settimanaChiave = lun; }
  finally { wgSettInCorso = false; }
  if(vistaWidgetAttiva() && vistaAi() === "professionista") renderWidgetPro();
}
function wgScriviRichiamo(id){
  apriRichiamo(id);
  richiamoAzione("scrivi");
}


export { renderWidgetPro, wgClienteDi, wgScegli, wgScriviRichiamo };
