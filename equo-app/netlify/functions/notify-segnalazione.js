// Email a gestione.equo@gmail.com per ogni nuova segnalazione di maneggio
// (form "Segnalaci il tuo maneggio" → tabella segnalazioni_maneggio).
// Chiamata da trigger Supabase (supabase_functions.http_request) all'insert.
// Sicurezza: si usa solo l'id del payload; la riga si rilegge con la service role
// e si invia una sola volta (notificata_at).
const { createClient } = require("@supabase/supabase-js");
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  let payload;
  try { payload = JSON.parse(event.body || "{}"); } catch (e) { return { statusCode: 400, body: "Payload non valido" }; }
  const id = payload?.record?.id;
  if (!id) return { statusCode: 400, body: "id mancante" };
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: r } = await supabase.from("segnalazioni_maneggio").select("*").eq("id", id).maybeSingle();
  if (!r) return { statusCode: 200, body: JSON.stringify({ esito: "non_trovata" }) };
  if (r.notificata_at) return { statusCode: 200, body: JSON.stringify({ esito: "gia_notificata" }) };
  let chi = "—";
  if (r.segnalato_da) {
    const { data: p } = await supabase.from("profiles").select("full_name, email").eq("id", r.segnalato_da).maybeSingle();
    if (p) chi = `${p.full_name || ""} (${p.email || "—"})`;
  }
  const riga = (k, v) => `<tr><td style="padding:6px 12px 6px 0;color:#667">${k}</td><td style="padding:6px 0;font-weight:600">${v}</td></tr>`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;color:#14312a">
    <h2 style="margin:0 0 12px">Nuova segnalazione maneggio</h2>
    <table style="border-collapse:collapse;font-size:14px">
      ${riga("Struttura", esc(r.nome_struttura))}${riga("Città", esc(r.citta))}${riga("Via", esc(r.via || "—"))}
      ${riga("Telefono struttura", esc(r.telefono_struttura || "—"))}${riga("Contatto per il premio", esc(r.contatto_premio))}
      ${riga("Segnalato da", esc(chi))}
    </table>
    <p style="font-size:13px;color:#667;margin-top:14px">Se la struttura si registra, il segnalatore riceve 1 mese di Premium gratis.</p></div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: "Equo <onboarding@resend.dev>", to: "gestione.equo@gmail.com", subject: `Segnalazione maneggio: ${r.nome_struttura} (${r.citta})`, html }),
  });
  if (res.ok) await supabase.from("segnalazioni_maneggio").update({ notificata_at: new Date().toISOString() }).eq("id", id);
  return { statusCode: 200, body: JSON.stringify({ esito: res.ok ? "email_inviata" : "errore_resend", http_status: res.status }) };
};
