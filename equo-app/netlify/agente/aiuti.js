// Equo · agenti AI (netlify/functions/agent.js) · funzioni di aiuto: clienti, cavalli, date, testo, utente dal token
const { previsione: meteoPrevisione } = require("../functions/meteo");
const { TIPO_INTERVENTO_LABEL } = require("./strumenti");

const SEL_INTERVENTO = "id, cliente_mascalcia_id, cavallo_cliente_id, horse_id, tipo_ferratura, tipo_altro, data_intervento, ora, stato, gruppo_id, prossima_scadenza, importo, stato_pagamento, note, clienti_mascalcia(nome, cliente_user_id), cavalli_clienti_mascalcia(nome)";
const descrTipo = (i) => (i.tipo_ferratura === "altro" && i.tipo_altro) ? i.tipo_altro : (TIPO_INTERVENTO_LABEL[i.tipo_ferratura] || i.tipo_ferratura);
const STATO_LABEL = { richiesto: "richiesta da confermare", programmato: "programmato", fatto: "fatto", proposto: "proposto alla struttura, in attesa della sua conferma", annullato: "annullato" };
const rigaIntervento = (i) => ({ id: i.id, data: i.data_intervento, ora: i.ora ? String(i.ora).slice(0, 5) : null, cliente: i.clienti_mascalcia?.nome || null,
  cavallo: i.cavalli_clienti_mascalcia?.nome || null, tipo: descrTipo(i), stato: STATO_LABEL[i.stato] || i.stato,
  importo: i.importo != null ? Number(i.importo) : null, pagamento: i.stato_pagamento === "saldato" ? "saldato" : "da saldare", note: i.note || null });

async function clientiManiscalco(ctx) {
  if (ctx._clienti) return ctx._clienti;
  const { data, error } = await ctx.db.from("clienti_mascalcia").select("id, nome, telefono, cliente_user_id, tipo_cliente").eq("maniscalco_id", ctx.userId).is("archiviato_il", null).order("nome", { ascending: true });
  if (error) throw error;
  ctx._clienti = data || [];
  return ctx._clienti;
}
function trovaPerNome(lista, nome, campo = "nome") {
  const n = String(nome || "").trim().toLowerCase();
  if (!n) return [];
  const esatti = lista.filter((x) => (x[campo] || "").toLowerCase() === n);
  return esatti.length ? esatti : lista.filter((x) => (x[campo] || "").toLowerCase().includes(n));
}
async function cavalliCliente(ctx, cliente) {
  const { data: man } = await ctx.db.from("cavalli_clienti_mascalcia").select("id, nome, microchip, horse_id").eq("cliente_mascalcia_id", cliente.id).order("nome", { ascending: true });
  const out = (man || []).map((c) => ({ id: c.id, horse_id: c.horse_id, nome: c.nome, microchip: c.microchip, su_equo: !!c.horse_id }));
  if (cliente.cliente_user_id) {
    const { data: cond } = await ctx.db.rpc("cavalli_condivisi_cliente", { p_cliente_id: cliente.id });
    (cond || []).forEach((h) => { if (!out.some((c) => c.horse_id === h.id)) out.push({ id: null, horse_id: h.id, nome: h.name, microchip: h.microchip, su_equo: true }); });
  }
  return out;
}
async function interventoDelManiscalco(ctx, id) {
  if (!/^[0-9a-f-]{36}$/i.test(String(id || ""))) return null;
  const { data } = await ctx.db.from("interventi_mascalcia").select(SEL_INTERVENTO).eq("id", id).eq("maniscalco_id", ctx.userId).maybeSingle();
  return data || null;
}
async function risolviCliente(ctx, nome) {
  const trovati = trovaPerNome(await clientiManiscalco(ctx), nome);
  if (!trovati.length) return { errore: `Nessun cliente "${nome}". Se è nuovo, il maniscalco lo crea dall'agenda (tasto +) e poi puoi segnare l'appuntamento.` };
  if (trovati.length > 1) return { errore: `Più clienti corrispondono a "${nome}": ${trovati.map((c) => c.nome).join(", ")}. Chiedi quale.` };
  return { cliente: trovati[0] };
}

// testo da mostrare: l'ultimo tratto di testo dopo l'ultimo strumento (con la ricerca web la risposta
// arriva spezzata in più blocchi di testo con citazioni: i blocchi consecutivi si uniscono)
function testoDaBlocchi(blocchi) {
  const tratti = []; let cur = "";
  for (const b of blocchi) {
    if (b.type === "text") cur += b.text;
    else { if (cur.trim()) tratti.push(cur); cur = ""; }
  }
  if (cur.trim()) tratti.push(cur);
  return (tratti[tratti.length - 1] || "").trim();
}
function linkCitati(blocchi) {
  const visti = new Map();
  for (const b of blocchi) for (const c of (b.type === "text" && Array.isArray(b.citations) ? b.citations : [])) {
    if (c.url && !visti.has(c.url)) visti.set(c.url, c.title || c.url);
  }
  return [...visti].slice(0, 4).map(([url, titolo]) => ({ url, titolo }));
}

// ---------------------------------------------------------------- utilità
const oggiISO = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
const isoValida = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || "") && !isNaN(new Date(v + "T12:00:00Z"));
const aggiungiGiorni = (iso, g) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + g); return d.toISOString().slice(0, 10); };
// CORS: Athena viene chiamata anche da Equo Scuderia (scuderia.equohub.com), che è un altro dominio
async function utenteDaToken(event, admin) {
  const h = event.headers.authorization || event.headers.Authorization || "";
  const token = h.replace(/^Bearer\s+/i, "");
  if (!token) return { user: null, token: null };
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return { user: null, token: null };
  return { user: data.user, token };
}

function trovaCavallo(cavalli, nome) {
  if (!nome) return null;
  const n = nome.trim().toLowerCase();
  return cavalli.find((c) => (c.name || "").toLowerCase() === n) || cavalli.find((c) => (c.name || "").toLowerCase().includes(n)) || null;
}

// ---------------------------------------------------------------- esecuzione strumenti
// Con gli incassi nascosti togliamo importi, pagamenti e totali in euro da ogni risultato degli strumenti
const CHIAVI_SOLDI = /importo|pagamento|euro|incass|saldat|valore/i;
function senzaImporti(v) {
  if (Array.isArray(v)) return v.map(senzaImporti);
  if (v && typeof v === "object") {
    const o = {};
    for (const [k, x] of Object.entries(v)) if (!CHIAVI_SOLDI.test(k)) o[k] = senzaImporti(x);
    return o;
  }
  return v;
}

// ---- METEO (stessa fonte e cache della funzione meteo della Home)
const METEO_NOMI = { sereno: "sereno", variabile: "poco nuvoloso", nubi: "nuvoloso", nebbia: "nebbia", pioviggine: "pioggia debole", pioggia: "pioggia",
  pioggia_forte: "pioggia forte", temporale: "temporale", neve: "neve", nevischio: "neve mista a pioggia" };
const meteoGiorno = (iso) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
const meteoOra = (iso) => new Date(iso).toLocaleTimeString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });
const meteoGiornoIt = (d) => new Date(d + "T12:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
const indirizzoCompleto = (r) => r?.indirizzo ? [r.indirizzo, [r.citta, r.provincia ? `(${r.provincia})` : ""].filter(Boolean).join(" ")].filter(Boolean).join(", ") : null;

// luogo → posizione per il meteo (stesse regole di naviga_verso)

module.exports = { METEO_NOMI, SEL_INTERVENTO, aggiungiGiorni, cavalliCliente, clientiManiscalco, descrTipo, indirizzoCompleto, interventoDelManiscalco, isoValida, linkCitati, meteoGiorno, meteoGiornoIt, meteoOra, oggiISO, rigaIntervento, risolviCliente, senzaImporti, testoDaBlocchi, trovaCavallo, trovaPerNome, utenteDaToken };
