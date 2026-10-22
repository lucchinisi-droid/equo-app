// Equo · agenti AI (netlify/functions/agent.js) · strumento meteo
const { previsione: meteoPrevisione } = require("../functions/meteo");
const { METEO_NOMI, clientiManiscalco, indirizzoCompleto, meteoGiorno, meteoGiornoIt, meteoOra, trovaPerNome } = require("./aiuti");

async function luogoMeteo(dest, ctx) {
  const generico = !dest || /^(qui|oggi|la mia |il mio )?(scuderia|maneggio|centro( ippico)?|circolo|struttura)?$/i.test(dest);
  if (ctx.vista === "scuderia") {
    const { data: c } = await ctx.admin.from("centri").select("nome, indirizzo, citta, provincia").eq("id", ctx.centroId).maybeSingle();
    const nomeCentro = String(c?.nome || "").toLowerCase();
    if (generico || (nomeCentro && (nomeCentro.includes(dest.toLowerCase()) || dest.toLowerCase().includes(nomeCentro)))) {
      if (!c?.indirizzo && !c?.citta) return { messaggio: `Il centro ${c?.nome || ""} non ha l'indirizzo: va inserito in "Il tuo Centro" (indirizzo, città, provincia). Intanto chiedi la località.` };
      return { pos: { indirizzo: c.indirizzo || "", citta: [c.citta, c.provincia].filter(Boolean).join(", "), luogo: c.citta || c.nome }, nome: c.nome };
    }
    return { pos: { citta: dest, luogo: dest }, nome: dest };
  }
  if (ctx.ambito === "maniscalco" && !ctx.centroId) {
    if (generico) return ctx.posizione ? { pos: { ...ctx.posizione }, nome: "dove ti trovi" } : { messaggio: "Non conosco la posizione del maniscalco: chiedi di quale cliente, struttura o località vuole il meteo." };
    const clienti = await clientiManiscalco(ctx);
    let trovati = trovaPerNome(clienti, dest);
    if (!trovati.length) {
      const { data: cav } = await ctx.db.from("cavalli_clienti_mascalcia").select("cliente_mascalcia_id").ilike("nome", `%${dest.replace(/[%_]/g, "")}%`).limit(10);
      const ids = [...new Set((cav || []).map((x) => x.cliente_mascalcia_id))];
      trovati = clienti.filter((x) => ids.includes(x.id));
    }
    if (trovati.length > 1) return { messaggio: `Più clienti corrispondono a "${dest}": ${trovati.slice(0, 6).map((x) => x.nome).join(", ")}. Chiedi quale.` };
    if (trovati.length === 1) {
      const c = trovati[0];
      const { data: ci } = await ctx.db.from("clienti_mascalcia").select("indirizzo, centro_id").eq("id", c.id).maybeSingle();
      let indirizzo = (ci?.indirizzo || "").trim() || null;
      if (!indirizzo && ci?.centro_id) {
        const { data: st } = await ctx.db.rpc("pro_indirizzi_strutture");
        indirizzo = indirizzoCompleto((st || []).find((x) => x.cliente_id === c.id));
      }
      if (!indirizzo) return { messaggio: `${c.nome} non ha un indirizzo: il maniscalco può aggiungerlo in Clienti → ${c.nome} → "Modifica" → Indirizzo (o con "Naviga", che lo salva). Intanto chiedi la località.` };
      return { pos: { indirizzo, luogo: c.nome }, nome: c.nome };
    }
    return { pos: { citta: dest, luogo: dest }, nome: dest };
  }
  // proprietario: scuderie collegate, altrimenti posizione del telefono o località
  const { data: sc } = await ctx.db.rpc("prop_indirizzi_scuderie");
  const scuderie = sc || [];
  const vuoto = !dest;
  if (vuoto && ctx.posizione) return { pos: { ...ctx.posizione }, nome: "dove ti trovi" };
  let trovate = generico ? scuderie : trovaPerNome(scuderie, dest);
  if (trovate.length > 1) return { messaggio: `Più scuderie corrispondono: ${trovate.map((x) => x.nome).join(", ")}. Chiedi quale.` };
  if (trovate.length === 1) {
    const r = trovate[0];
    if (!r.indirizzo && !r.citta) return { messaggio: `La scuderia ${r.nome} non ha inserito l'indirizzo in Equo Scuderia. Chiedi la località.` };
    return { pos: { indirizzo: r.indirizzo || "", citta: [r.citta, r.provincia].filter(Boolean).join(", "), luogo: r.citta || r.nome }, nome: r.nome };
  }
  if (generico) return { messaggio: "Non so dove si trova: chiedi la località (o di consentire la posizione nell'app)." };
  return { pos: { citta: dest, luogo: dest }, nome: dest };
}

async function strumentoMeteo(input, ctx) {
  const dest = String(input.luogo || "").trim().slice(0, 120);
  const l = await luogoMeteo(dest, ctx);
  if (l.messaggio) return l.messaggio;
  const r = await meteoPrevisione(l.pos);
  if (r.non_trovato) return `Non trovo "${dest}" sulla mappa: chiedi la località precisa (comune e provincia).`;
  if (!r.giorni) return "Il servizio meteo non risponde in questo momento: riprova tra poco.";
  const oggi = meteoGiorno(new Date().toISOString());
  const giorno = /^\d{4}-\d{2}-\d{2}$/.test(String(input.giorno || "")) ? input.giorno : oggi;
  const g = r.giorni.find((x) => x.data === giorno);
  const righe = [`Meteo per ${l.nome}${r.luogo && r.luogo !== l.nome ? " (" + r.luogo + ")" : ""}. Fonte: ${r.fonte}.`];
  if (!g) righe.push(`Nessuna previsione per il ${giorno}: disponibili solo i prossimi 7 giorni.`);
  else {
    righe.push(`${giorno === oggi ? "Oggi" : meteoGiornoIt(giorno)}: ${METEO_NOMI[g.sim] || g.sim}, min ${g.min}° max ${g.max}°, pioggia totale ${g.mm} mm.`);
    const ore = r.ore.filter((o) => meteoGiorno(o.t) === giorno).filter((o) => { const h = Number(meteoOra(o.t).slice(0, 2)); return h >= 6 && h <= 21; });
    const passo = ore.length > 8 ? 2 : 1;
    const dettagli = ore.filter((o, i) => i % passo === 0 || Number(o.mm) > 0 || ["temporale", "pioggia_forte", "neve"].includes(o.sim)).map((o) => `${meteoOra(o.t)} ${METEO_NOMI[o.sim] || o.sim} ${o.temp}°${Number(o.mm) > 0 ? " " + o.mm + "mm" : ""}${o.vento != null ? " vento " + o.vento + "km/h" : ""}`);
    if (dettagli.length) righe.push("Ore: " + dettagli.join("; ") + (ore.every((o) => o.passo === 6) ? " (previsione ogni 6 ore)" : ""));
  }
  righe.push("Prossimi giorni: " + r.giorni.filter((x) => x.data !== giorno).map((x) => `${meteoGiornoIt(x.data)} ${METEO_NOMI[x.sim] || x.sim} ${x.min}/${x.max}°${x.mm ? " " + x.mm + "mm" : ""}`).join("; "));
  return righe.join("\n");
}

module.exports = { strumentoMeteo };
