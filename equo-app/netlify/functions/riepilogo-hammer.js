// HAMMER — riepilogo settimanale proattivo per i maniscalchi ("La tua settimana con Hammer").
// Funzione PROGRAMMATA (netlify.toml): il lunedì, stesse ore del riepilogo di Pegasus. Stessa logica:
// dati calcolati dal codice (niente invenzioni) + 1-2 righe di consiglio con Haiku, salvato nella chat di Hammer
// (ai_messaggi, vista professionista) e in ai_riepiloghi (vista 'professionista'). Premium: anche push ed email.
// Contenuto: agenda della settimana, richieste da confermare, ferrature/pareggi scaduti senza nuovo appuntamento
// (da richiamare), incassi da riscuotere, proposte alle strutture in attesa, incassato della settimana scorsa.
// Si disattiva dal menu profilo (vista professionista) → "Riepilogo settimanale di Hammer" (profiles.riepilogo_hammer).
const { createClient } = require("@supabase/supabase-js");
const MODELLO = process.env.EQUO_RIEPILOGO_MODEL || "claude-haiku-4-5-20251001";
const PREZZO = { in: 1, out: 5 };
const TEMPO_MAX_MS = 22000;
const IN_PARALLELO = 6;
const URL_APP = "https://app.equohub.com";
const TIPI = { ferratura: "Ferratura", mezza_ferratura: "Mezza ferratura", pareggio: "Pareggio" };
const oggiISO = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
const aggiungiGiorni = (iso, g) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + g); return d.toISOString().slice(0, 10); };
const lunediDi = (iso) => { const d = new Date(iso + "T12:00:00Z"); return aggiungiGiorni(iso, -((d.getUTCDay() + 6) % 7)); };
const dataIt = (iso, conGiorno = false) => new Date(iso + "T12:00:00Z").toLocaleDateString("it-IT", { ...(conGiorno ? { weekday: "short" } : {}), day: "numeric", month: "long", timeZone: "UTC" });
const euro = (n) => (Math.round(n * 100) / 100).toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " €";
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const tipo = (i) => i.tipo_ferratura === "altro" ? (i.tipo_altro || "Intervento") : (TIPI[i.tipo_ferratura] || i.tipo_ferratura || "Intervento");

// ---------------------------------------------------------------- dati di un maniscalco
async function datiManiscalco(admin, userId, oggi) {
  const fra7 = aggiungiGiorni(oggi, 7);
  const { data: tutti } = await admin.from("interventi_mascalcia")
    .select("id, cliente_mascalcia_id, cavallo_cliente_id, tipo_ferratura, tipo_altro, data_intervento, ora, stato, gruppo_id, prossima_scadenza, importo, stato_pagamento, clienti_mascalcia(nome), cavalli_clienti_mascalcia(nome)")
    .eq("maniscalco_id", userId).order("data_intervento", { ascending: false }).limit(3000);
  const lista = tutti || [];
  const cli = (i) => i.clienti_mascalcia?.nome || "cliente";
  const cav = (i) => i.cavalli_clienti_mascalcia?.nome || null;

  const agenda = lista.filter((i) => i.stato === "programmato" && i.data_intervento >= oggi && i.data_intervento <= fra7)
    .sort((a, b) => (a.data_intervento + (a.ora || "")).localeCompare(b.data_intervento + (b.ora || "")))
    .map((i) => ({ data: i.data_intervento, ora: i.ora ? String(i.ora).slice(0, 5) : null, cliente: cli(i), cavallo: cav(i), tipo: tipo(i) }));
  const richieste = lista.filter((i) => i.stato === "richiesto" && i.data_intervento >= aggiungiGiorni(oggi, -7))
    .map((i) => ({ data: i.data_intervento, cliente: cli(i), cavallo: cav(i), tipo: tipo(i) }));
  const gruppiProposti = new Set();
  const proposte = lista.filter((i) => i.stato === "proposto" && i.data_intervento >= oggi).filter((i) => {
    const k = i.gruppo_id || i.id; if (gruppiProposti.has(k)) return false; gruppiProposti.add(k); return true;
  }).map((i) => ({ data: i.data_intervento, cliente: cli(i) }));

  // scadute: ultimo intervento "fatto" per cavallo con prossima_scadenza passata e nessun intervento successivo
  const chiave = (i) => i.cavallo_cliente_id || "c:" + i.cliente_mascalcia_id;
  const visti = new Set(); const scadute = [];
  for (const i of lista.filter((x) => x.stato === "fatto" && x.prossima_scadenza)) {
    const k = chiave(i); if (visti.has(k)) continue; visti.add(k);
    if (i.prossima_scadenza >= oggi) continue;
    if (lista.some((x) => x.id !== i.id && chiave(x) === k && x.data_intervento > i.data_intervento && !["rifiutato", "annullato"].includes(x.stato))) continue;
    scadute.push({ cliente: cli(i), cavallo: cav(i), tipo: tipo(i), scadenza: i.prossima_scadenza,
      giorni: Math.round((new Date(oggi + "T12:00:00Z") - new Date(i.prossima_scadenza + "T12:00:00Z")) / 86400000) });
  }
  scadute.sort((a, b) => b.giorni - a.giorni);

  const daIncassare = lista.filter((i) => i.stato === "fatto" && i.stato_pagamento !== "saldato");
  const totDaIncassare = daIncassare.reduce((t, i) => t + Number(i.importo || 0), 0);
  const clientiDaIncassare = new Set(daIncassare.map((i) => i.cliente_mascalcia_id)).size;
  const lunScorso = aggiungiGiorni(lunediDi(oggi), -7), domScorsa = aggiungiGiorni(lunediDi(oggi), -1);
  const fattiSettimana = lista.filter((i) => i.stato === "fatto" && i.data_intervento >= lunScorso && i.data_intervento <= domScorsa);
  return {
    agenda, richieste, proposte, scadute,
    incassi: { da_incassare: totDaIncassare, clienti: clientiDaIncassare, senza_importo: daIncassare.filter((i) => i.importo == null).length },
    settimana_scorsa: { interventi: fattiSettimana.length, valore: fattiSettimana.reduce((t, i) => t + Number(i.importo || 0), 0) },
    ha_clienti: lista.length > 0,
  };
}
const haNovita = (d) => d.agenda.length + d.richieste.length + d.scadute.length + d.proposte.length > 0 || d.incassi.da_incassare > 0;

// ---------------------------------------------------------------- testo
function componiTesto(d, oggi, consiglio, premium) {
  const r = [`**La tua settimana con Hammer** 🔨 — ${dataIt(oggi, true)}`];
  if (d.richieste.length) r.push("", "📥 **Richieste da confermare**", ...d.richieste.slice(0, 10).map((x) => `- ${x.cliente}${x.cavallo ? " · " + x.cavallo : ""} · ${x.tipo} per ${dataIt(x.data, true)}`));
  if (d.agenda.length) r.push("", "📅 **In agenda nei prossimi 7 giorni**", ...d.agenda.slice(0, 15).map((x) => `- ${dataIt(x.data, true)}${x.ora ? " ore " + x.ora : ""} · ${x.cliente}${x.cavallo ? " · " + x.cavallo : ""} · ${x.tipo}`));
  if (d.scadute.length) r.push("", "⏰ **Da richiamare** (scaduti senza nuovo appuntamento)", ...d.scadute.slice(0, 10).map((x) => `- ${x.cliente}${x.cavallo ? " · " + x.cavallo : ""}: ${x.tipo.toLowerCase()} scaduta da ${x.giorni} ${x.giorni === 1 ? "giorno" : "giorni"}`),
    ...(d.scadute.length > 10 ? [`- …e altri ${d.scadute.length - 10}`] : []), "Chiedimi \"manda i promemoria ai clienti scaduti\" e preparo io i messaggi.");
  if (d.proposte.length) r.push("", "🏇 **Proposte alle strutture in attesa di conferma**", ...d.proposte.map((x) => `- ${x.cliente} · ${dataIt(x.data, true)}`));
  if (d.incassi.da_incassare > 0 || d.incassi.senza_importo) r.push("", `💶 **Da incassare**: ${euro(d.incassi.da_incassare)} da ${d.incassi.clienti} ${d.incassi.clienti === 1 ? "cliente" : "clienti"}` +
    (d.incassi.senza_importo ? ` (${d.incassi.senza_importo} interventi senza importo)` : ""));
  r.push("", `📊 Settimana scorsa: ${d.settimana_scorsa.interventi} interventi fatti${d.settimana_scorsa.valore ? " · " + euro(d.settimana_scorsa.valore) : ""}`);
  if (!haNovita(d)) r.push("", "Settimana libera in agenda e nessuna scadenza da richiamare.");
  if (consiglio) r.push("", `💡 ${consiglio}`);
  if (!premium) r.push("", "*Con Premium questo riepilogo ti arriva ogni lunedì anche con notifica ed email.*");
  return r.join("\n");
}

const ISTRUZIONI_CONSIGLIO = `Sei Hammer, l'agente di Equo per i maniscalchi: tono sintetico, concreto, da collega esperto; dai del tu.
Ricevi in JSON il riepilogo della settimana di lavoro di un maniscalco. Scrivi UN SOLO consiglio pratico per organizzare meglio la settimana o il lavoro, massimo 2 frasi (max 280 caratteri), in italiano, senza saluti, titoli o elenchi.
Regole: usa solo i dati ricevuti, non inventare nomi, date o importi. Priorità: richieste da confermare, clienti scaduti da richiamare (suggerisci di raggrupparli per zona o per scuderia), incassi da sollecitare, interventi senza importo da completare. Se è tutto in ordine, un consiglio di mestiere legato alla stagione (es. autunno: terreni bagnati e fango, talloni e fettone, ramponi). Mai farmaci.`;

async function consiglioAi(d, oggi) {
  if (!process.env.ANTHROPIC_API_KEY) return { testo: null, costo: 0 };
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODELLO, max_tokens: 200, system: ISTRUZIONI_CONSIGLIO,
        messages: [{ role: "user", content: JSON.stringify({ oggi, ...d, agenda: d.agenda.slice(0, 20), scadute: d.scadute.slice(0, 20) }) }] }),
    });
    const j = await res.json();
    if (!res.ok) { console.error("riepilogo hammer AI:", JSON.stringify(j).slice(0, 300)); return { testo: null, costo: 0 }; }
    const testo = (j.content || []).filter((b) => b.type === "text").map((b) => b.text).join(" ").replace(/\s+/g, " ").trim().slice(0, 400) || null;
    const u = j.usage || {};
    return { testo, costo: ((u.input_tokens || 0) * PREZZO.in + (u.output_tokens || 0) * PREZZO.out) / 1e6 };
  } catch (e) { console.error("riepilogo hammer AI:", e); return { testo: null, costo: 0 }; }
}

function testoPush(d) {
  const p = [];
  if (d.richieste.length) p.push(`${d.richieste.length} ${d.richieste.length === 1 ? "richiesta" : "richieste"} da confermare`);
  if (d.agenda.length) p.push(`${d.agenda.length} in agenda`);
  if (d.scadute.length) p.push(`${d.scadute.length} da richiamare`);
  if (d.incassi.da_incassare > 0) p.push(`${euro(d.incassi.da_incassare)} da incassare`);
  return (p.join(" · ") + ". Apri Equo per il riepilogo.").replace(/^\. /, "");
}
async function inviaPush(userId, corpo) {
  if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_REST_API_KEY) return false;
  const res = await fetch("https://api.onesignal.com/notifications?c=push", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}` },
    body: JSON.stringify({ app_id: process.env.ONESIGNAL_APP_ID, target_channel: "push", include_aliases: { external_id: [userId] },
      headings: { en: "Hammer · la tua settimana" }, contents: { en: corpo.slice(0, 140) },
      data: { apri: "chat", c: "ai", id: "riepilogo", v: "professionista" }, url: URL_APP + "/?apri=chat&c=ai&id=riepilogo&v=professionista" }),
  });
  if (!res.ok) console.error("riepilogo hammer push:", await res.text());
  return res.ok;
}
function htmlEmail(testo, nome) {
  const righe = testo.split("\n").map((r) => {
    let h = esc(r).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<i>$2</i>");
    if (/^- /.test(r)) return `<li style="margin:2px 0">${h.slice(2)}</li>`;
    return r.trim() ? `<p style="margin:10px 0 4px">${h}</p>` : "";
  }).join("").replace(/(<li[^>]*>.*?<\/li>)+/g, (m) => `<ul style="margin:0;padding-left:20px">${m}</ul>`);
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:auto;color:#1c2b22;font-size:15px;line-height:1.45">
<p>Ciao${nome ? " " + esc(nome.split(" ")[0]) : ""},</p>${righe}
<p style="margin:22px 0"><a href="${URL_APP}" style="background:#a8721c;color:#fff;padding:11px 18px;border-radius:10px;text-decoration:none;font-weight:600">Apri Equo</a></p>
<p style="color:#6b7a70;font-size:12px">Ricevi questa email perché hai Equo Premium. Puoi disattivare il riepilogo dal menu profilo → "Riepilogo settimanale di Hammer".</p></div>`;
}
async function inviaEmail(to, testo, nome) {
  if (!to || !process.env.RESEND_API_KEY || !process.env.EMAIL_MITTENTE) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: process.env.EMAIL_MITTENTE, reply_to: process.env.EMAIL_RISPOSTE || "gestione.equo@gmail.com",
      to: [to], subject: "🔨 La tua settimana con Hammer", html: htmlEmail(testo, nome) }),
  });
  if (!res.ok) console.error("riepilogo hammer email:", await res.text());
  return res.ok;
}

async function elaboraUtente(admin, p, oggi, settimana) {
  const premium = p.piano === "premium";
  const d = await datiManiscalco(admin, p.id, oggi);
  if (!d.ha_clienti) return "senza_lavoro";
  // incassi nascosti nell'app (interruttore con PIN): il riepilogo non riporta importi
  try {
    const { data: inc } = await admin.from("profiles").select("incassi_nascosti").eq("id", p.id).maybeSingle();
    if (inc?.incassi_nascosti) { d.incassi = { da_incassare: 0, clienti: 0, senza_importo: 0 }; d.settimana_scorsa.valore = 0; }
  } catch (_) { /* colonna non ancora creata */ }
  const ai = await consiglioAi(d, oggi);
  const testo = componiTesto(d, oggi, ai.testo, premium);
  const { error: errIns } = await admin.from("ai_riepiloghi").insert({ user_id: p.id, settimana, vista: "professionista", testo, costo_usd: ai.costo });
  if (errIns) return "gia_fatto";
  await admin.from("ai_messaggi").insert({ user_id: p.id, vista: "professionista", ruolo: "assistant", contenuto: testo });
  let push = false, email = false;
  if (premium && haNovita(d)) {
    push = await inviaPush(p.id, testoPush(d)).catch(() => false);
    email = await inviaEmail(p.email, testo, p.full_name).catch(() => false);
    await admin.from("ai_riepiloghi").update({ inviato_push: push, inviato_email: email }).eq("user_id", p.id).eq("settimana", settimana).eq("vista", "professionista");
  }
  return premium ? `premium push=${push} email=${email}` : "free";
}

exports.handler = async () => {
  const inizio = Date.now();
  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const oggi = oggiISO();
  const settimana = lunediDi(oggi);
  const { data: maniscalchi, error } = await admin.from("profiles").select("id, full_name, email, piano, riepilogo_hammer, ruolo, ruolo_secondario")
    .or("ruolo.eq.maniscalco,ruolo_secondario.eq.maniscalco").limit(20000);
  if (error) { console.error("riepilogo hammer: lettura profili", error); return { statusCode: 500, body: "errore" }; }
  const { data: fatti } = await admin.from("ai_riepiloghi").select("user_id").eq("settimana", settimana).eq("vista", "professionista").limit(20000);
  const giaFatti = new Set((fatti || []).map((f) => f.user_id));
  const coda = (maniscalchi || []).filter((p) => !giaFatti.has(p.id) && p.riepilogo_hammer !== false);
  const esiti = { disattivati: (maniscalchi || []).filter((p) => p.riepilogo_hammer === false).length };
  while (coda.length && Date.now() - inizio < TEMPO_MAX_MS) {
    const gruppo = coda.splice(0, IN_PARALLELO);
    const r = await Promise.all(gruppo.map((p) => elaboraUtente(admin, p, oggi, settimana).catch((e) => { console.error("riepilogo hammer", p.id, e); return "errore"; })));
    r.forEach((x) => { const k = x.split(" ")[0]; esiti[k] = (esiti[k] || 0) + 1; });
  }
  console.log("riepilogo hammer", settimana, JSON.stringify({ ...esiti, rimasti: coda.length, ms: Date.now() - inizio }));
  return { statusCode: 200, body: JSON.stringify({ settimana, ...esiti, rimasti: coda.length }) };
};

exports._interni = { datiManiscalco, componiTesto, testoPush, ISTRUZIONI_CONSIGLIO };
