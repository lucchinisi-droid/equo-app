// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { iniziale } from "./037-scheda-cliente-a-box-scheda-del-cavallo.js";
import { hpListaRic } from "./040-home-pro-prossimi-appuntamenti-da-richia.js";
import { hpGiri, hpRigaGiro } from "./041-giro-della-zona-premium.js";
import { caricaUbicazioni, clienteDiId, luogoEvento, navigaLuogo } from "./050-sposta-cavallo-dove-sta-il-cavallo-a-cas.js";
import { isoLocale } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { agNomeCavallo } from "./053-agenda-settimanale-maniscalco.js";
import { agOrdinaGiro } from "./056-ordine-del-giro-trascina-un-cavallo-nel.js";
import { mlRender } from "./090-disegno.js";
import { mlPausaNotifiche } from "./092-fasi.js";
import { vistaCompleta } from "./097-versione-semplice-completa-dell-app-mani.js";
import { wgMeteoPos } from "./099-meteo-accanto-agli-appuntamenti-indirizz.js";
/* ---------- arrivo sul posto: se apri l'app vicino a una tappa di oggi ---------- */
let mlArrivoT = 0;
async function mlControllaArrivo(){
  if(ml || DEMO_MODE || !currentUser || !agenteAiHammer() || Date.now() - mlArrivoT < 5 * 60e3 || !navigator.geolocation) return;
  mlArrivoT = Date.now();
  let stato = "prompt";
  try{ stato = (await navigator.permissions.query({ name: "geolocation" })).state; }catch(e){ return; }
  if(stato !== "granted") return;                    // la posizione non si chiede qui: solo se è già permessa (meteo)
  const tappe = await mlTappeOggi();
  if(!tappe.length) return;
  const pos = await new Promise(res => navigator.geolocation.getCurrentPosition(x => res(x.coords), () => res(null), { maximumAge: 120000, timeout: 8000 }));
  if(!pos) return;
  const visti = (() => { try{ return JSON.parse(localStorage.getItem("equo-lavoro-visti") || "{}"); }catch(e){ return {}; } })();
  for(const t of tappe){
    const k = mlOggi() + "|" + t.l.key;
    if(visti[k]) continue;
    const c = t.l.clienteId ? clienteDiId(t.l.clienteId) : null;
    const p = t.l.indirizzo ? { indirizzo: t.l.indirizzo } : (c ? await wgMeteoPos(c) : null);
    if(!p) continue;
    const d = await EquoMeteo.previsione(p, { endpoint: "/.netlify/functions/meteo", token: async () => { try{ return (await sb.auth.getSession()).data.session?.access_token || ""; }catch(e){ return ""; } } });
    if(!d || d.lat == null) continue;
    const km = mlDistanza(pos.latitude, pos.longitude, d.lat, d.lon);
    if(km < 1.5){                                     // le coordinate del meteo sono arrotondate a ~1 km
      visti[k] = 1; try{ localStorage.setItem("equo-lavoro-visti", JSON.stringify(visti)); }catch(e){}
      return mlMostraArrivo(t);
    }
  }
}
function mlDistanza(a1, o1, a2, o2){ const R = 6371, r = x => x * Math.PI / 180; const dA = r(a2 - a1), dO = r(o2 - o1); const h = Math.sin(dA / 2) ** 2 + Math.cos(r(a1)) * Math.cos(r(a2)) * Math.sin(dO / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
/* -> stato-condiviso.js */
function mlMostraArrivo(t){
  mlArrivoKey = t.l.key;
  const nomi = [...new Set(t.eventi.map(e => agNomeCavallo(e)).filter(Boolean))];
  hmFoglio("Sei arrivato?", t.l.nome, `<div class="ml-arr">${nomi.map(n => `<span>${iniziale(n)} ${escapeHtml(n)}</span>`).join("")}</div>
    <button class="hm-tappa su" onclick="hmChiudi();mlApri(mlArrivoKey)"><span class="o">${ML_IC.ferro}</span><span class="c"><b>Inizia il lavoro</b><span>${t.eventi.length} ${t.eventi.length === 1 ? "cavallo" : "cavalli"} · leggi gli avvisi prima di cominciare</span></span></button>`);
}
// riaprendo l'app si torna alla tappa in corso (solo se è di oggi)
async function mlRiprendi(){
  if(ml || !currentUser) return;
  let s = null; try{ s = JSON.parse(localStorage.getItem("equo-lavoro") || "null"); }catch(e){}
  if(!s || s.uid !== currentUser.id) return;
  if(s.giorno !== mlOggi()){ try{ localStorage.removeItem("equo-lavoro"); }catch(e){} mlPausaNotifiche(false); return; }
  ml = s; await mlCarica(); mlRender();
}

// «Portami da…»: le tappe di oggi (una per luogo, nell'ordine del giro); tocca e si apre il navigatore
/* -> stato-condiviso.js */
async function hmPortami(){
  try{ await caricaUbicazioni(); }catch(e){}
  const oggi = isoLocale(new Date()), adesso = new Date().toTimeString().slice(0, 5);
  const app = agOrdinaGiro((hpAppuntamenti || []).filter(e => e.data_intervento === oggi && !["annullato", "rifiutato", "fatto"].includes(e.stato)));
  const per = new Map();
  app.forEach(e => {
    const l = luogoEvento(e, true);
    if(!per.has(l.key)) per.set(l.key, { l, ora: e.ora ? String(e.ora).slice(0, 5) : "", cavalli: [] });
    const t = per.get(l.key); const n = agNomeCavallo(e); if(n && !t.cavalli.includes(n)) t.cavalli.push(n);
  });
  hmTappe = [...per.values()];
  const prossima = hmTappe.findIndex(t => !t.ora || t.ora >= adesso);
  const corpo = hmTappe.map((t, i) => `<button class="hm-tappa${i === (prossima < 0 ? 0 : prossima) ? " su" : ""}" onclick="hmVai(${i})">
      <span class="o">${t.ora ? escapeHtml(t.ora) : HM_IC.cal}</span>
      <span class="c"><b>${escapeHtml(t.l.nome)}</b><span>${escapeHtml([t.cavalli.join(", "), t.l.indirizzo].filter(Boolean).join(" · "))}</span></span>
      <span class="vai">${HM_IC.nav}Vai</span></button>${agenteAiHammer() ? `<button class="hm-tappa ml-tappa" onclick="hmChiudi();mlApri(hmTappe[${i}].l.key)"><span class="o"><svg viewBox="0 0 24 24" fill="currentColor" style="width:20px;height:20px"><use href="#i-ferro"/></svg></span><span class="c"><b>Lavoro a ${escapeHtml(t.l.nome)}</b><span>avvisi prima di cominciare · chiudi la tappa dopo</span></span></button>` : ""}`).join("")
    + `<button class="hm-tappa" onclick="hmChiudi();apriCercaTutto()"><span class="o">${HM_IC.cerca}</span><span class="c"><b>Un altro cliente o scuderia…</b><span>cerca per nome</span></span></button>`;
  hmFoglio("Portami da…", hmTappe.length ? "Scegli la tappa: si apre il tuo navigatore" : "Oggi non hai appuntamenti da fare", corpo);
}
function hmVai(i){ const t = hmTappe[i]; if(!t) return; hmChiudi(); navigaLuogo(t.l); }
function hmScadenze(){
  const ric = hpRichiamiLista || [];
  const corpo = ric.length ? hpGiri().map(hpRigaGiro).join("") + hpListaRic(ric)
    : '<div class="muted" style="font-size:13.5px;padding:8px 0 4px">Nessun cavallo da richiamare nei prossimi 30 giorni.</div>';
  hmFoglio("Scadenze", "Cavalli da richiamare: in rosso quelli in ritardo", corpo);
}
function hmAltro(){
  const v = (ic, t, az, cls) => `<button class="${cls || ""}" onclick="hmChiudi();${az}"><span>${ic}</span>${t}</button>`;
  hmFoglio("Altro", "", `<div class="hm-griglia">
    ${v(HM_IC.wallet, "Incassi", "showPage('pro-incassi')", "solo-incassi")}
    ${v(HM_IC.cal, "Agenda", "showPage('pro-agenda')")}
    ${v(HM_IC.inbox, "Messaggi", "hmMessaggi()")}
    ${v(HM_IC.qr, "Il mio codice e QR", "openCodicePersonaleModal()")}
    ${v(HM_IC.slider, vistaCompleta() ? "Passa alla Semplice" : "Passa alla Completa", "cambiaVistaManiscalco(vistaCompleta() ? 'semplice' : 'completa')")}
    ${v(HM_IC.aiuto, "Aiuto", "apriTicketAssistenza()")}
    ${v(HM_IC.menu, "Menu e impostazioni", "openMenu()")}
  </div>`);
}


export { hmAltro, hmPortami, hmScadenze, hmVai, mlControllaArrivo, mlRiprendi };
