// PROMEMORIA PERSONALI (27/10/2026) — funzione PROGRAMMATA ogni 5 minuti (netlify.toml).
// Per ogni promemoria arrivato all'ora (promemoria_personali, stato attivo, non ancora inviato):
// 1) Hammer lo scrive nella chat del giorno come MESSAGGIO IMPORTANTE (sopra l'icona compare «Messaggio importante»);
// 2) notifica push OneSignal (external_id = id utente);
// 3) se la push non parte (nessun dispositivo iscritto, notifiche spente, iPhone senza app installata) → email con Resend.
// Il promemoria si «prenota» prima di inviarlo (inviato_il), così due giri sovrapposti non lo mandano due volte.
const { createClient } = require("@supabase/supabase-js");
const URL_APP = "https://app.equohub.com";
const TEMPO_MAX_MS = 20000;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const quandoIt = (iso) => new Date(iso).toLocaleString("it-IT", { timeZone: "Europe/Rome", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
const AZIONE_TESTO = { conto: "Fai il conto", chat: "Scrivi al cliente", naviga: "Naviga" };

function testoChat(p, cliente) {
  return `⏰ **Promemoria** — ${p.testo}` + (cliente ? `\n\nCliente: ${cliente}` : "")
    + `\n\n*Me l'avevi chiesto per ${quandoIt(p.quando)}.* Tocca «Fatto» quando hai finito, oppure «Domani» per rimandarlo.`;
}

async function inviaPush(p, cliente) {
  if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_REST_API_KEY) return false;
  try {
    const res = await fetch("https://api.onesignal.com/notifications?c=push", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}` },
      body: JSON.stringify({ app_id: process.env.ONESIGNAL_APP_ID, target_channel: "push", include_aliases: { external_id: [p.user_id] },
        headings: { en: "⏰ Promemoria · Hammer" }, contents: { en: (p.testo + (cliente ? " · " + cliente : "")).slice(0, 140) },
        data: { apri: "chat", c: "ai", id: "promemoria", v: p.vista }, url: `${URL_APP}/?apri=chat&c=ai&id=promemoria&v=${p.vista}` }),
    });
    const j = await res.json().catch(() => ({}));
    // OneSignal risponde 200 anche senza destinatari: in quel caso id vuoto o errors («not subscribed»)
    const ok = res.ok && !!j.id && !(Array.isArray(j.errors) ? j.errors.length : j.errors);
    if (!ok) console.log("promemoria push non consegnata:", p.id, JSON.stringify(j).slice(0, 200));
    return ok;
  } catch (e) { console.error("promemoria push:", e); return false; }
}

async function inviaEmail(to, nome, p, cliente) {
  if (!to || !process.env.RESEND_API_KEY || !process.env.EMAIL_MITTENTE) return false;
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:auto;color:#1c2b22;font-size:15px;line-height:1.5">
<p>Ciao${nome ? " " + esc(String(nome).split(" ")[0]) : ""},</p>
<p style="font-size:17px;margin:14px 0"><b>⏰ ${esc(p.testo)}</b></p>
${cliente ? `<p>Cliente: <b>${esc(cliente)}</b></p>` : ""}
<p style="color:#6b7a70">Promemoria che avevi chiesto a Hammer per ${esc(quandoIt(p.quando))}.</p>
<p style="margin:22px 0"><a href="${URL_APP}/?apri=chat&c=ai&id=promemoria&v=${p.vista}" style="background:#a8721c;color:#fff;padding:11px 18px;border-radius:10px;text-decoration:none;font-weight:600">Apri Equo${p.azione && AZIONE_TESTO[p.azione] ? " · " + AZIONE_TESTO[p.azione] : ""}</a></p>
<p style="color:#6b7a70;font-size:12px">Ti arriva per email perché le notifiche di Equo su questo telefono non sono attive. Attivale da Equo (menu profilo) per riceverle lì.</p></div>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({ from: process.env.EMAIL_MITTENTE, reply_to: process.env.EMAIL_RISPOSTE || "gestione.equo@gmail.com",
        to: [to], subject: `⏰ Promemoria: ${p.testo.slice(0, 80)}`, html }),
    });
    if (!res.ok) console.error("promemoria email:", await res.text());
    return res.ok;
  } catch (e) { console.error("promemoria email:", e); return false; }
}

async function invia(admin, p) {
  // prenotazione: solo un giro lo prende
  const { data: preso } = await admin.from("promemoria_personali").update({ inviato_il: new Date().toISOString() })
    .eq("id", p.id).eq("stato", "attivo").is("inviato_il", null).select("id").maybeSingle();
  if (!preso) return "gia_preso";
  const cliente = p.clienti_mascalcia?.nome || null;
  const agente = p.vista === "professionista" ? "hammer" : "pegasus";
  const { error: eMsg } = await admin.from("ai_messaggi").insert({ user_id: p.user_id, vista: p.vista, agente, ruolo: "assistant", importante: true,
    contenuto: testoChat(p, cliente), azione: { tipo: "promemoria", id: p.id, azione: p.azione || null, cliente_mascalcia_id: p.cliente_mascalcia_id || null, nome_cliente: cliente } });
  if (eMsg) console.error("promemoria chat:", p.id, eMsg.message);
  const push = await inviaPush(p, cliente);
  let email = false;
  if (!push) {
    const { data: prof } = await admin.from("profiles").select("email, full_name").eq("id", p.user_id).maybeSingle();
    email = await inviaEmail(prof?.email, prof?.full_name, p, cliente);
  }
  await admin.from("promemoria_personali").update({ inviato_push: push, inviato_email: email }).eq("id", p.id);
  return push ? "push" : email ? "email" : "solo_chat";
}

exports.handler = async () => {
  const inizio = Date.now();
  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data, error } = await admin.from("promemoria_personali")
    .select("id, user_id, vista, testo, quando, azione, cliente_mascalcia_id, clienti_mascalcia(nome)")
    .eq("stato", "attivo").is("inviato_il", null).lte("quando", new Date().toISOString())
    .gte("quando", new Date(Date.now() - 3 * 86400000).toISOString())   // più vecchi di 3 giorni: non si mandano più
    .order("quando", { ascending: true }).limit(300);
  if (error) { console.error("invia-promemoria:", error.message); return { statusCode: 200, body: "tabella non pronta" }; }
  const esiti = {};
  for (const p of data || []) {
    if (Date.now() - inizio > TEMPO_MAX_MS) { esiti.rimandati = (esiti.rimandati || 0) + 1; continue; }
    const r = await invia(admin, p).catch((e) => { console.error("invia-promemoria", p.id, e); return "errore"; });
    esiti[r] = (esiti[r] || 0) + 1;
  }
  if ((data || []).length) console.log("invia-promemoria", JSON.stringify(esiti));
  return { statusCode: 200, body: JSON.stringify(esiti) };
};

exports._interni = { testoChat, invia };
