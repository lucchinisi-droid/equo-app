// Email a gestione.equo@gmail.com per ogni nuova richiesta di contatto:
//  - tipo "struttura": chi al primo accesso sceglie "Gestisco un centro/scuderia"
//  - tipo "profilo":   chi dal menu chiede di aggiungere/cambiare un profilo (seconda professione, struttura…)
// Chiamata da trigger Supabase (supabase_functions.http_request) all'insert su richieste_contatto.
// Sicurezza: si usa solo l'id del payload; la riga si rilegge con la service role e si invia una sola volta.
const { createClient } = require("@supabase/supabase-js");
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const RICHIESTE = { seconda_professione: "Aggiungere una seconda professione", cambio_professione: "Cambiare professione", struttura: "Aggiungere un profilo struttura", altro: "Altro" };
const RUOLI = { proprietario: "Proprietario", maniscalco: "Maniscalco", veterinario: "Veterinario", istruttore: "Istruttore/Trainer", gestore_struttura: "Gestore struttura" };

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  let payload;
  try { payload = JSON.parse(event.body || "{}"); } catch (e) { return { statusCode: 400, body: "Payload non valido" }; }
  const id = payload?.record?.id;
  if (!id) return { statusCode: 400, body: "id mancante" };
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: r } = await supabase.from("richieste_contatto").select("*").eq("id", id).maybeSingle();
  if (!r) return { statusCode: 200, body: JSON.stringify({ esito: "non_trovata" }) };
  if (r.notificata_at) return { statusCode: 200, body: JSON.stringify({ esito: "gia_notificata" }) };
  const { data: p } = await supabase.from("profiles").select("full_name, email, ruolo, ruolo_secondario, certificazione_stato").eq("id", r.user_id).maybeSingle();
  const account = p ? `${p.full_name || "—"} (${p.email || "—"})` : "—";
  const profili = p ? [p.ruolo, p.ruolo_secondario].filter(Boolean).map((x) => RUOLI[x] || x).join(" + ") || "nessuno" : "—";
  const riga = (k, v) => `<tr><td style="padding:6px 12px 6px 0;color:#667;vertical-align:top">${k}</td><td style="padding:6px 0;font-weight:600">${v}</td></tr>`;
  let titolo, subject, righe;
  if (r.tipo === "struttura") {
    titolo = "Nuova struttura da ricontattare";
    subject = `Struttura da ricontattare: ${r.nome_struttura || "—"} (${r.citta || "—"})`;
    righe = riga("Struttura", esc(r.nome_struttura)) + riga("Via", esc(r.via || "—")) + riga("Città", esc(r.citta)) +
      riga("Email", esc(r.email)) + riga("Telefono", esc(r.telefono)) + (r.messaggio ? riga("Note", esc(r.messaggio)) : "") + riga("Account Equo", esc(account));
  } else {
    titolo = "Richiesta di un altro profilo";
    subject = `Richiesta profilo: ${RICHIESTE[r.richiesta] || "altro"} · ${r.nome || p?.full_name || "utente"}`;
    righe = riga("Richiesta", esc(RICHIESTE[r.richiesta] || "—")) + (r.professione ? riga("Professione", esc(RUOLI[r.professione] || r.professione)) : "") +
      (r.nome_struttura ? riga("Struttura", esc(r.nome_struttura)) : "") + (r.citta ? riga("Città", esc(r.citta)) : "") +
      riga("Nome", esc(r.nome || "—")) + riga("Email", esc(r.email || "—")) + riga("Telefono", esc(r.telefono || "—")) +
      (r.messaggio ? riga("Messaggio", esc(r.messaggio)) : "") + riga("Account Equo", esc(account)) + riga("Profili attuali", esc(profili)) +
      riga("Badge", esc(p?.certificazione_stato === "verificato" ? "Equo Certified" : "—"));
  }
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;color:#14312a">
    <h2 style="margin:0 0 12px">${titolo}</h2>
    <table style="border-collapse:collapse;font-size:14px">${righe}</table>
    <p style="font-size:12px;color:#667;margin-top:14px">Richiesta salvata anche in Supabase (tabella richieste_contatto, id ${esc(r.id)}).</p></div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: process.env.EMAIL_MITTENTE || "Equo <onboarding@resend.dev>", to: "gestione.equo@gmail.com",
      reply_to: r.email || p?.email || undefined, subject, html }),
  });
  if (res.ok) await supabase.from("richieste_contatto").update({ notificata_at: new Date().toISOString() }).eq("id", id);
  return { statusCode: 200, body: JSON.stringify({ esito: res.ok ? "email_inviata" : "errore_resend", http_status: res.status }) };
};
