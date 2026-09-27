// PEGASUS — Step 4: riepilogo settimanale proattivo per i proprietari (vedi claude/equo-agenti-6.md).
// Funzione PROGRAMMATA (netlify.toml): il lunedì, ogni ora dalle 6 alle 9 UTC. Ogni giro elabora chi
// non ha ancora il riepilogo della settimana (tabella ai_riepiloghi), fino a ~22 s, così con molti
// utenti il lavoro si divide tra i giri senza superare il limite di tempo delle funzioni programmate.
//
// Per ogni proprietario con almeno un cavallo e riepilogo_settimanale = true:
//  - dati calcolati dal codice (niente invenzioni): scadenze scadute/in arrivo 14 gg, maniscalco e
//    calendario dei prossimi 7 gg, spese della settimana scorsa e del mese;
//  - 1-2 righe di consiglio scritte da Pegasus con Haiku (se l'API non risponde, si manda senza);
//  - salvato nella chat di Pegasus (ai_messaggi, vista proprietario) + ai_riepiloghi;
//  - Premium: anche push OneSignal ed email Resend, solo se c'è qualcosa da segnalare.
//    Free: solo in app, con l'invito a Premium.
// Non consuma i messaggi AI dell'utente. Costo stimato salvato in ai_riepiloghi.costo_usd.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY,
// RESEND_API_KEY, EMAIL_MITTENTE, EMAIL_RISPOSTE (facoltativa). Facoltativa: EQUO_RIEPILOGO_MODEL.

const { createClient } = require("@supabase/supabase-js");

const MODELLO = process.env.EQUO_RIEPILOGO_MODEL || "claude-haiku-4-5-20251001";
const PREZZO = { in: 1, out: 5 }; // $ per milione di token (Haiku 4.5)
const TEMPO_MAX_MS = 22000;
const IN_PARALLELO = 6;
const URL_APP = "https://app.equohub.com";
const TIPI_EVENTO = { vaccino: "Vaccino", coggins: "Test Coggins (AIE)", ferratura: "Ferratura", sverminazione: "Sverminazione" };
const TIPI_INTERVENTO = { ferratura: "Ferratura", mezza_ferratura: "Mezza ferratura", pareggio: "Pareggio" };

const oggiISO = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
const aggiungiGiorni = (iso, g) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + g); return d.toISOString().slice(0, 10); };
const lunediDi = (iso) => { const d = new Date(iso + "T12:00:00Z"); return aggiungiGiorni(iso, -((d.getUTCDay() + 6) % 7)); };
const dataIt = (iso, conGiorno = false) => new Date(iso + "T12:00:00Z").toLocaleDateString("it-IT", { ...(conGiorno ? { weekday: "short" } : {}), day: "numeric", month: "long", timeZone: "UTC" });
const euro = (n) => (Math.round(n * 100) / 100).toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " €";
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ---------------------------------------------------------------- dati di un utente
async function datiUtente(admin, userId, oggi) {
  const fra7 = aggiungiGiorni(oggi, 7), fra14 = aggiungiGiorni(oggi, 14);
  const { data: cavalli } = await admin.from("horses").select("id, name").eq("owner_id", userId).order("created_at", { ascending: true });
  const lista = cavalli || [];
  const nome = (id) => lista.find((c) => c.id === id)?.name || "—";
  const ids = lista.map((c) => c.id);

  // scadenze: ultimo evento per cavallo e tipo
  const { data: eventi } = ids.length ? await admin.from("health_events").select("type, date, next_due_date, horse_id").in("horse_id", ids).order("date", { ascending: false }) : { data: [] };
  const ultimo = {};
  (eventi || []).forEach((e) => { const k = e.horse_id + "|" + e.type; if (!ultimo[k]) ultimo[k] = e; });
  const conScadenza = Object.values(ultimo).filter((e) => e.next_due_date).sort((a, b) => a.next_due_date.localeCompare(b.next_due_date));
  const scadute = conScadenza.filter((e) => e.next_due_date < oggi).map((e) => ({ cavallo: nome(e.horse_id), tipo: TIPI_EVENTO[e.type] || e.type, scadenza: e.next_due_date }));
  const inArrivo = conScadenza.filter((e) => e.next_due_date >= oggi && e.next_due_date <= fra14).map((e) => ({ cavallo: nome(e.horse_id), tipo: TIPI_EVENTO[e.type] || e.type, scadenza: e.next_due_date }));
  const senzaEventi = lista.filter((c) => !(eventi || []).some((e) => e.horse_id === c.id)).map((c) => c.name);

  // maniscalco: interventi dei prossimi 7 giorni sulle schede cliente collegate a questo utente
  let maniscalco = [];
  const { data: clienti } = await admin.from("clienti_mascalcia").select("id, maniscalco_id").eq("cliente_user_id", userId);
  if ((clienti || []).length) {
    const { data: interventi } = await admin.from("interventi_mascalcia")
      .select("data_intervento, ora, stato, tipo_ferratura, tipo_altro, maniscalco_id, cavalli_clienti_mascalcia(nome)")
      .in("cliente_mascalcia_id", clienti.map((c) => c.id)).in("stato", ["programmato", "richiesto"])
      .gte("data_intervento", oggi).lte("data_intervento", fra7).order("data_intervento", { ascending: true });
    const idMan = [...new Set((interventi || []).map((i) => i.maniscalco_id))];
    const { data: prof } = idMan.length ? await admin.from("profiles").select("id, full_name, dati_pagamento_nome").in("id", idMan) : { data: [] };
    maniscalco = (interventi || []).map((i) => ({
      data: i.data_intervento, ora: i.ora ? String(i.ora).slice(0, 5) : null,
      tipo: i.tipo_ferratura === "altro" ? (i.tipo_altro || "Intervento") : (TIPI_INTERVENTO[i.tipo_ferratura] || i.tipo_ferratura),
      cavallo: i.cavalli_clienti_mascalcia?.nome || null, stato: i.stato === "richiesto" ? "in attesa di conferma" : "confermato",
      maniscalco: (prof || []).find((p) => p.id === i.maniscalco_id)?.full_name || (prof || []).find((p) => p.id === i.maniscalco_id)?.dati_pagamento_nome || "maniscalco",
    }));
  }

  // calendario (lezioni, allenamenti, gare) dei prossimi 7 giorni
  const { data: lezioni } = await admin.from("lezioni_manuali").select("data, tipo, horse_id, note").eq("owner_id", userId).gte("data", oggi).lte("data", fra7).order("data", { ascending: true });

  // spese: settimana scorsa (lun-dom) e mese in corso
  const lunScorso = aggiungiGiorni(lunediDi(oggi), -7), domScorsa = aggiungiGiorni(lunediDi(oggi), -1);
  const inizioMese = oggi.slice(0, 8) + "01";
  const da = lunScorso < inizioMese ? lunScorso : inizioMese;
  const { data: spese } = await admin.from("expenses").select("category, amount, date").eq("owner_id", userId).gte("date", da).lte("date", oggi);
  const somma = (f) => (spese || []).filter(f).reduce((s, e) => s + Number(e.amount || 0), 0);
  const speseSettimana = somma((e) => e.date >= lunScorso && e.date <= domScorsa);
  const speseMese = somma((e) => e.date >= inizioMese);

  return {
    cavalli: lista.map((c) => c.name), scadute, inArrivo, senzaEventi, maniscalco,
    calendario: (lezioni || []).map((l) => ({ data: l.data, tipo: l.tipo, cavallo: l.horse_id ? nome(l.horse_id) : null })),
    spese: { settimana: speseSettimana, mese: speseMese, nomeMese: new Date(oggi + "T12:00:00Z").toLocaleDateString("it-IT", { month: "long", timeZone: "UTC" }) },
  };
}

const haNovita = (d) => d.scadute.length + d.inArrivo.length + d.maniscalco.length + d.calendario.length > 0;

// ---------------------------------------------------------------- testo (markdown semplice per la chat)
function componiTesto(d, oggi, consiglio, premium) {
  const r = [`**La tua settimana con Pegasus** 🪽 — ${dataIt(oggi, true)}`];
  if (d.scadute.length) r.push("", "⚠️ **Scadute**", ...d.scadute.map((s) => `- ${s.cavallo} · ${s.tipo}: scaduto dal ${dataIt(s.scadenza)}`));
  if (d.inArrivo.length) r.push("", "📅 **In scadenza nei prossimi 14 giorni**", ...d.inArrivo.map((s) => `- ${s.cavallo} · ${s.tipo}: ${dataIt(s.scadenza, true)}`));
  if (d.maniscalco.length) r.push("", "🔨 **Maniscalco**", ...d.maniscalco.map((m) => `- ${dataIt(m.data, true)}${m.ora ? " ore " + m.ora : ""} · ${m.tipo}${m.cavallo ? " · " + m.cavallo : ""} (${m.stato}, ${m.maniscalco})`));
  if (d.calendario.length) r.push("", "🏇 **Calendario**", ...d.calendario.map((l) => `- ${dataIt(l.data, true)} · ${l.tipo}${l.cavallo ? " · " + l.cavallo : ""}`));
  if (!haNovita(d)) r.push("", "Settimana tranquilla: niente in scadenza nei prossimi 14 giorni e nessun appuntamento in calendario.");
  if (d.senzaEventi.length) r.push("", `ℹ️ ${d.senzaEventi.join(", ")} non ${d.senzaEventi.length === 1 ? "ha" : "hanno"} ancora vaccini o ferrature nel libretto: registrali (o mandami la foto del certificato) e ti avviso io prima delle scadenze.`);
  r.push("", `💶 **Spese**: settimana scorsa ${euro(d.spese.settimana)} · ${d.spese.nomeMese} finora ${euro(d.spese.mese)}`);
  if (consiglio) r.push("", `💡 ${consiglio}`);
  if (!premium) r.push("", "*Con Premium questo riepilogo ti arriva ogni lunedì anche con notifica ed email, insieme ai promemoria automatici delle scadenze.*");
  return r.join("\n");
}

// ---------------------------------------------------------------- consiglio AI (1-2 frasi)
const ISTRUZIONI_CONSIGLIO = `Sei Pegasus, l'agente di Equo che aiuta i proprietari a prendersi cura del proprio cavallo. Tono caldo, semplice e pratico, dai del tu, chiami i cavalli per nome.
Ricevi in JSON il riepilogo della settimana di un proprietario. Scrivi UN SOLO consiglio pratico per questa settimana, massimo 2 frasi (max 280 caratteri), in italiano, senza saluti né titoli né elenchi.
Regole: usa solo i dati ricevuti, non inventare date, nomi o importi. Se ci sono scadenze scadute, il consiglio riguarda quelle (chi chiamare, cosa prenotare). Altrimenti un consiglio di stagione legato al mese (es. autunno: muta, fieno, controllo peso e condizione corporea, denti prima dell'inverno). Mai farmaci o dosi. Se tutto è in ordine, puoi anche solo incoraggiare.`;

async function consiglioAi(d, oggi) {
  if (!process.env.ANTHROPIC_API_KEY) return { testo: null, costo: 0 };
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: MODELLO, max_tokens: 200, system: ISTRUZIONI_CONSIGLIO,
        messages: [{ role: "user", content: JSON.stringify({ oggi, ...d }) }],
      }),
    });
    const j = await res.json();
    if (!res.ok) { console.error("riepilogo AI:", JSON.stringify(j).slice(0, 300)); return { testo: null, costo: 0 }; }
    const testo = (j.content || []).filter((b) => b.type === "text").map((b) => b.text).join(" ").replace(/\s+/g, " ").trim().slice(0, 400) || null;
    const u = j.usage || {};
    return { testo, costo: ((u.input_tokens || 0) * PREZZO.in + (u.output_tokens || 0) * PREZZO.out) / 1e6 };
  } catch (e) { console.error("riepilogo AI:", e); return { testo: null, costo: 0 }; }
}

// ---------------------------------------------------------------- canali Premium
function testoPush(d) {
  const p = [];
  if (d.scadute.length) p.push(`${d.scadute.length} ${d.scadute.length === 1 ? "scadenza da sistemare" : "scadenze da sistemare"}`);
  if (d.inArrivo.length) p.push(`${d.inArrivo.length} in arrivo`);
  if (d.maniscalco.length) p.push(`maniscalco ${dataIt(d.maniscalco[0].data, true)}`);
  if (d.calendario.length) p.push(`${d.calendario.length} in calendario`);
  return (p.join(" · ") + ". Apri Equo per il riepilogo.").replace(/^\. /, "");
}

async function inviaPush(userId, corpo) {
  if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_REST_API_KEY) return false;
  const res = await fetch("https://api.onesignal.com/notifications?c=push", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}` },
    body: JSON.stringify({ app_id: process.env.ONESIGNAL_APP_ID, target_channel: "push", include_aliases: { external_id: [userId] },
      headings: { en: "Pegasus · la tua settimana" }, contents: { en: corpo.slice(0, 140) }, web_url: URL_APP }),
  });
  if (!res.ok) console.error("riepilogo push:", await res.text());
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
<p style="margin:22px 0"><a href="${URL_APP}" style="background:#2f6b4f;color:#fff;padding:11px 18px;border-radius:10px;text-decoration:none;font-weight:600">Apri Equo</a></p>
<p style="color:#6b7a70;font-size:12px">Ricevi questa email perché hai Equo Premium. Puoi disattivare il riepilogo dal menu profilo → "Riepilogo settimanale di Pegasus".</p></div>`;
}

async function inviaEmail(to, testo, nome) {
  if (!to || !process.env.RESEND_API_KEY || !process.env.EMAIL_MITTENTE) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: process.env.EMAIL_MITTENTE, reply_to: process.env.EMAIL_RISPOSTE || "gestione.equo@gmail.com",
      to: [to], subject: "🪽 La tua settimana con Pegasus", html: htmlEmail(testo, nome) }),
  });
  if (!res.ok) console.error("riepilogo email:", await res.text());
  return res.ok;
}

// ---------------------------------------------------------------- un utente
async function elaboraUtente(admin, p, oggi, settimana) {
  const premium = p.piano === "premium";
  const d = await datiUtente(admin, p.id, oggi);
  if (!d.cavalli.length) return "senza_cavalli";
  const ai = await consiglioAi(d, oggi);
  const testo = componiTesto(d, oggi, ai.testo, premium);
  // prima si "prenota" la settimana: se un altro giro l'ha già fatto, ci si ferma (niente doppioni)
  const { error: errIns } = await admin.from("ai_riepiloghi").insert({ user_id: p.id, settimana, testo, costo_usd: ai.costo });
  if (errIns) return "gia_fatto";
  await admin.from("ai_messaggi").insert({ user_id: p.id, vista: "proprietario", ruolo: "assistant", contenuto: testo });
  let push = false, email = false;
  if (premium && haNovita(d)) {
    push = await inviaPush(p.id, testoPush(d)).catch(() => false);
    email = await inviaEmail(p.email, testo, p.full_name).catch(() => false);
    await admin.from("ai_riepiloghi").update({ inviato_push: push, inviato_email: email }).eq("user_id", p.id).eq("settimana", settimana);
  }
  return premium ? `premium push=${push} email=${email}` : "free";
}

// ---------------------------------------------------------------- handler (programmato)
exports.handler = async () => {
  const inizio = Date.now();
  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const oggi = oggiISO();
  const settimana = lunediDi(oggi);

  const { data: proprietari, error } = await admin.from("horses").select("owner_id").limit(20000);
  if (error) { console.error("riepilogo: lettura cavalli", error); return { statusCode: 500, body: "errore" }; }
  const ids = [...new Set((proprietari || []).map((h) => h.owner_id).filter(Boolean))];
  const { data: fatti } = await admin.from("ai_riepiloghi").select("user_id").eq("settimana", settimana).limit(20000);
  const giaFatti = new Set((fatti || []).map((f) => f.user_id));
  const daFare = ids.filter((id) => !giaFatti.has(id));

  const esiti = {};
  let i = 0;
  for (let blocco = 0; blocco < daFare.length && Date.now() - inizio < TEMPO_MAX_MS; blocco += 50) {
    const { data: profili } = await admin.from("profiles").select("id, full_name, email, piano, riepilogo_settimanale").in("id", daFare.slice(blocco, blocco + 50));
    const coda = (profili || []).filter((p) => p.riepilogo_settimanale !== false);
    esiti.disattivati = (esiti.disattivati || 0) + ((profili || []).length - coda.length);
    while (coda.length && Date.now() - inizio < TEMPO_MAX_MS) {
      const gruppo = coda.splice(0, IN_PARALLELO);
      const r = await Promise.all(gruppo.map((p) => elaboraUtente(admin, p, oggi, settimana).catch((e) => { console.error("riepilogo", p.id, e); return "errore"; })));
      r.forEach((x) => { const k = x.split(" ")[0]; esiti[k] = (esiti[k] || 0) + 1; }); i += gruppo.length;
    }
  }
  const rimasti = Math.max(daFare.length - i - (esiti.disattivati || 0), 0);
  console.log("riepilogo settimanale", settimana, JSON.stringify({ ...esiti, rimasti, ms: Date.now() - inizio }));
  return { statusCode: 200, body: JSON.stringify({ settimana, ...esiti, rimasti }) };
};

// esportati solo per i test
exports._interni = { datiUtente, componiTesto, testoPush, htmlEmail, lunediDi, elaboraUtente, ISTRUZIONI_CONSIGLIO };
