// Email a gestione.equo@gmail.com per ogni nuova iscrizione completata
// (quando l'utente sceglie per la prima volta il ruolo: proprietario o professionista).
// Chiamata da trigger Supabase (supabase_functions.http_request) su profiles.
// Sicurezza: si usa solo l'id del payload, i dati si rileggono con la service role e
// l'email parte una sola volta per utente (profiles.iscrizione_notificata_at).
// Env su Netlify (già presenti): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY.

const { createClient } = require("@supabase/supabase-js");

const EMAIL_ADMIN = "gestione.equo@gmail.com";
const PROFESSIONISTI = ["maniscalco", "veterinario", "istruttore", "selleria"];
const RUOLO_LABEL = {
  proprietario: "Proprietario", maniscalco: "Maniscalco", veterinario: "Veterinario",
  istruttore: "Istruttore", selleria: "Selleria", gestore_struttura: "Gestore struttura",
};
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  let payload;
  try { payload = JSON.parse(event.body || "{}"); } catch (e) { return { statusCode: 400, body: "Payload non valido" }; }
  const id = payload?.record?.id;
  if (!id) return { statusCode: 400, body: "id mancante" };

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: p, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, ruolo, ruolo_secondario, referral_code, created_at, iscrizione_notificata_at")
    .eq("id", id).maybeSingle();
  if (error || !p) return { statusCode: 200, body: JSON.stringify({ esito: "profilo_non_trovato" }) };
  if (!p.ruolo) return { statusCode: 200, body: JSON.stringify({ esito: "ruolo_non_scelto" }) };
  if (p.iscrizione_notificata_at) return { statusCode: 200, body: JSON.stringify({ esito: "gia_notificata" }) };

  // email dall'auth se nel profilo manca (es. accesso con Google)
  let email = p.email;
  if (!email) {
    try { const { data } = await supabase.auth.admin.getUserById(id); email = data?.user?.email || null; } catch (e) { /* ignora */ }
  }

  // totali iscritti (solo profili con ruolo scelto)
  const conta = async (filtro) => {
    let q = supabase.from("profiles").select("id", { count: "exact", head: true }).not("ruolo", "is", null);
    if (filtro) q = filtro(q);
    const { count } = await q;
    return count ?? 0;
  };
  const [totale, proprietari, professionisti] = await Promise.all([
    conta(null),
    conta((q) => q.eq("ruolo", "proprietario")),
    conta((q) => q.in("ruolo", PROFESSIONISTI)),
  ]);

  const tipo = p.ruolo === "proprietario" ? "Proprietario" : PROFESSIONISTI.includes(p.ruolo) ? "Professionista" : "Altro";
  const quando = new Date().toLocaleString("it-IT", { timeZone: "Europe/Rome" });
  const riga = (k, v) => `<tr><td style="padding:6px 12px 6px 0;color:#667;white-space:nowrap">${k}</td><td style="padding:6px 0;font-weight:600">${v}</td></tr>`;
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;color:#14312a">
    <h2 style="margin:0 0 4px">Nuovo iscritto su Equo: ${esc(tipo)}</h2>
    <p style="margin:0 0 16px;color:#667">${esc(quando)}</p>
    <table style="border-collapse:collapse;font-size:14px">
      ${riga("Nome", esc(p.full_name || "—"))}
      ${riga("Email", esc(email || "—"))}
      ${riga("Ruolo", esc(RUOLO_LABEL[p.ruolo] || p.ruolo))}
      ${p.ruolo_secondario ? riga("Secondo profilo", esc(RUOLO_LABEL[p.ruolo_secondario] || p.ruolo_secondario)) : ""}
      ${riga("Codice referral", esc(p.referral_code || "—"))}
    </table>
    <div style="margin-top:18px;padding:12px 14px;background:#f4f1ea;border-radius:10px;font-size:14px">
      <b>Totale iscritti: ${totale}</b> · Proprietari: ${proprietari} · Professionisti: ${professionisti}
    </div>
    <p style="color:#99a;font-size:12px;margin-top:18px">Email automatica di Equo · app.equohub.com</p>
  </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({
      from: "Equo <onboarding@resend.dev>",
      to: EMAIL_ADMIN,
      subject: `Nuovo iscritto Equo: ${p.full_name || email || "utente"} (${RUOLO_LABEL[p.ruolo] || p.ruolo})`,
      html,
    }),
  });
  const body = await res.text();
  if (!res.ok) { console.error("Errore Resend:", body); return { statusCode: 200, body: JSON.stringify({ esito: "errore_resend", http_status: res.status, resend: body.slice(0, 300) }) }; }
  await supabase.from("profiles").update({ iscrizione_notificata_at: new Date().toISOString() }).eq("id", id);
  return { statusCode: 200, body: JSON.stringify({ esito: "email_inviata", totale }) };
};
