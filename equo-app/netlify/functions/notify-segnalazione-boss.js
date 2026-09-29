// MESSAGGERO DEI BOSS — chiamata dai trigger su segnalazioni_boss.
//  - INSERT: un agente (Pegasus, Hammer, …) ha raccolto una richiesta/segnalazione di un utente →
//    email a gestione.equo@gmail.com con i dettagli, le ultime battute della conversazione e il comando per rispondere.
//  - UPDATE con risposta: i Boss hanno risposto con rispondi_segnalazione_boss() → push all'utente
//    (il messaggio è già nella chat dell'agente, scritto dalla funzione SQL); tocco sulla notifica = apre la chat AI.
// Sicurezza: si usa solo l'id del payload, la riga si rilegge con la service role e ogni invio avviene una volta sola.
const { createClient } = require("@supabase/supabase-js");
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const AGENTI = { pegasus: "Pegasus", hammer: "Hammer", equo: "Equo AI", athena: "Athena", ermes: "Ermes", merlino: "Merlino", galeno: "Galeno", ares: "Ares" };
const TIPI = { problema: "🐞 Problema / malfunzionamento", richiesta: "🙋 Richiesta", idea: "💡 Idea / miglioramento", domanda: "❓ Domanda" };

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  let payload;
  try { payload = JSON.parse(event.body || "{}"); } catch (e) { return { statusCode: 400, body: "Payload non valido" }; }
  const id = payload?.record?.id;
  if (!id) return { statusCode: 400, body: "id mancante" };
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: s } = await supabase.from("segnalazioni_boss").select("*").eq("id", id).maybeSingle();
  if (!s) return { statusCode: 200, body: JSON.stringify({ esito: "non_trovata" }) };
  const nomeAgente = AGENTI[s.agente] || s.agente;

  // ---- risposta dei Boss → push all'utente
  if (payload.type === "UPDATE") {
    if (!s.risposta || s.risposta_notificata_at) return { statusCode: 200, body: JSON.stringify({ esito: "niente_da_notificare" }) };
    let ok = false;
    if (process.env.ONESIGNAL_APP_ID && process.env.ONESIGNAL_REST_API_KEY) {
      const corpo = s.risposta.replace(/\s+/g, " ").trim();
      const link = { apri: "chat", c: "ai", id: s.id, v: s.vista };
      const res = await fetch("https://api.onesignal.com/notifications?c=push", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}` },
        body: JSON.stringify({ app_id: process.env.ONESIGNAL_APP_ID, target_channel: "push", include_aliases: { external_id: [s.user_id] },
          headings: { en: `${nomeAgente} · risposta dai Boss` }, contents: { en: corpo.length > 140 ? corpo.slice(0, 137) + "…" : corpo },
          data: link, url: "https://app.equohub.com/?" + new URLSearchParams(link).toString() }),
      });
      ok = res.ok;
      if (!res.ok) console.error("push risposta boss:", await res.text());
    }
    await supabase.from("segnalazioni_boss").update({ risposta_notificata_at: new Date().toISOString() }).eq("id", id);
    return { statusCode: 200, body: JSON.stringify({ esito: ok ? "push_inviata" : "push_non_inviata" }) };
  }

  // ---- nuova segnalazione → email ai Boss
  if (s.notificata_at) return { statusCode: 200, body: JSON.stringify({ esito: "gia_notificata" }) };
  const { data: p } = await supabase.from("profiles").select("full_name, email, ruolo, ruolo_secondario, piano").eq("id", s.user_id).maybeSingle();
  const riga = (k, v) => `<tr><td style="padding:6px 12px 6px 0;color:#667;vertical-align:top;white-space:nowrap">${k}</td><td style="padding:6px 0;font-weight:600">${v}</td></tr>`;
  const conversazione = (Array.isArray(s.contesto) ? s.contesto : []).map((m) =>
    `<div style="margin:6px 0;padding:8px 10px;border-radius:8px;background:${m.ruolo === "assistant" ? "#f1efe7" : "#fff7e6"}"><b>${m.ruolo === "assistant" ? esc(nomeAgente) : "Utente"}:</b> ${esc(String(m.testo || "").slice(0, 600))}</div>`).join("");
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;color:#14312a">
    <h2 style="margin:0 0 6px">${esc(TIPI[s.tipo] || s.tipo)}</h2>
    <p style="margin:0 0 14px;color:#667">Raccolta da <b>${esc(nomeAgente)}</b> il ${new Date(s.created_at).toLocaleString("it-IT", { timeZone: "Europe/Rome" })}</p>
    <table style="border-collapse:collapse;font-size:14px">
      ${riga("Riassunto", esc(s.riassunto))}
      ${s.parole_utente ? riga("Parole dell'utente", "“" + esc(s.parole_utente) + "”") : ""}
      ${s.dettagli ? riga("Dettagli", esc(s.dettagli)) : ""}
      ${riga("Utente", esc(`${p?.full_name || "—"} (${p?.email || "—"})`))}
      ${riga("Profili", esc([p?.ruolo, p?.ruolo_secondario].filter(Boolean).join(" + ") || "—") + " · piano " + esc(p?.piano || "free") + " · vista " + esc(s.vista))}
    </table>
    ${conversazione ? `<h3 style="margin:18px 0 6px;font-size:14px">Ultime battute della conversazione</h3>${conversazione}` : ""}
    <div style="margin-top:18px;padding:12px;border:1px dashed #c98f2e;border-radius:10px;font-size:13px">
      <b>Per rispondere</b> (la risposta arriva nella chat di ${esc(nomeAgente)} con una notifica), nell'SQL editor di Supabase:<br>
      <code style="display:block;margin-top:6px;background:#f4f0e7;padding:8px;border-radius:6px">select rispondi_segnalazione_boss('${esc(s.id)}', 'Scrivi qui la risposta');</code>
      Puoi anche rispondere direttamente a questa email: arriva all'utente come email normale.
    </div></div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: process.env.EMAIL_MITTENTE || "Equo <onboarding@resend.dev>", to: "gestione.equo@gmail.com", reply_to: p?.email || undefined,
      subject: `${TIPI[s.tipo] || "Segnalazione"} da ${p?.full_name || "un utente"} (via ${nomeAgente}): ${s.riassunto.slice(0, 60)}`, html }),
  });
  if (res.ok) await supabase.from("segnalazioni_boss").update({ notificata_at: new Date().toISOString() }).eq("id", id);
  return { statusCode: 200, body: JSON.stringify({ esito: res.ok ? "email_inviata" : "errore_resend", http_status: res.status }) };
};
