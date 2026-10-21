/* ---------- Meteo accanto agli appuntamenti (indirizzo del cliente o della struttura collegata) ---------- */
const wgMeteo = {};   // cliente_id → { stato: "carico" | "ok" | "nd", d, motivo, t }
async function wgMeteoPos(c){
  if(DEMO_MODE) return { demo: true };
  const proprio = (c?.indirizzo || "").trim();
  if(proprio) return { indirizzo: proprio, luogo: c.nome };
  const st = await wgIndirizzoStruttura(c);
  if(st && (st.indirizzo || st.citta)) return { indirizzo: st.indirizzo || "", citta: [st.citta, st.provincia].filter(Boolean).join(", "), luogo: st.citta || c?.nome || "" };
  return null;
}
function wgMeteoCarica(ids){
  if(typeof EquoMeteo === "undefined") return;
  ids.forEach(id => {
    const m = wgMeteo[id];
    if(m && Date.now() - m.t < 30 * 60e3) return;
    wgMeteo[id] = { stato: "carico", t: Date.now() };
    (async () => {
      const c = wgClienteDi(id);
      const pos = c ? await wgMeteoPos(c) : null;
      if(!pos) wgMeteo[id] = { stato: "nd", motivo: "Meteo non disponibile: manca l'indirizzo del cliente (Clienti → Modifica → Indirizzo)", t: Date.now() };
      else {
        const d = await EquoMeteo.previsione(pos, { endpoint: "/.netlify/functions/meteo", token: async () => { try{ return (await sb.auth.getSession()).data.session?.access_token || ""; }catch(e){ return ""; } } });
        wgMeteo[id] = d && d.giorni ? { stato: "ok", d, t: Date.now() }
          : { stato: "nd", motivo: d && d.non_trovato ? "Meteo non disponibile: indirizzo del cliente non trovato" : "Meteo non disponibile in questo momento", t: d ? Date.now() : Date.now() - 25 * 60e3 };
      }
      try{ if(document.getElementById("wh-pro")) renderWidgetPro(); }catch(e){}
    })();
  });
}
function wgMeteoIcona(e){
  if(!e || typeof EquoMeteo === "undefined") return "";
  const m = wgMeteo[e.cliente_mascalcia_id];
  if(!m || m.stato === "carico") return "";
  if(m.stato === "nd") return `<span class="wg-meteo">${EquoMeteo.iconaNd(m.motivo)}</span>`;
  const o = EquoMeteo.alle(m.d, e.data_intervento, e.ora ? String(e.ora).slice(0, 5) : "10:00");
  if(!o) return `<span class="wg-meteo">${EquoMeteo.iconaNd("Meteo non disponibile per questa data")}</span>`;
  return `<span class="wg-meteo">${EquoMeteo.icona(o.sim, o.notte)}${o.temp != null ? `<small>${o.temp}°</small>` : ""}</span>`;
}

