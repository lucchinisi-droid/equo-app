// Badge "Equo Certified" dei professionisti.
// Chiamata da un trigger Supabase (supabase_functions.http_request) SOLO quando
// profiles.certificazione_stato cambia verso 'in_verifica', 'verificato' o 'respinto'.
//
// - in_verifica → email a gestione.equo@gmail.com con i dati del professionista
//                 e il link al servizio gratuito dell'Agenzia delle Entrate
// - verificato  → push al professionista ("Sei Equo Certified!")
// - respinto    → push al professionista con il motivo
//
// Sicurezza: non ci si fida del payload. Si usa solo l'id, i dati si rileggono
// dal DB con la service role; l'email parte solo se la richiesta è davvero
// in verifica e non è già stata notificata (certificazione_notificata_at).
// Chiamarla a mano non permette quindi di mandare email arbitrarie.
//
// Env su Netlify (già presenti): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// RESEND_API_KEY, ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY.

const { createClient } = require("@supabase/supabase-js");

const EMAIL_ADMIN = "gestione.equo@gmail.com";
const URL_VERIFICA_PIVA = "https://telematici.agenziaentrate.gov.it/VerificaPIVA/Scegli.do?parameter=verificaPiva";
const ONESIGNAL_URL = "https://api.onesignal.com/notifications?c=push";

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const TIPO_SOGGETTO = { persona_fisica: "Persona fisica", ditta_individuale: "Ditta individuale", partita_iva: "Partita IVA" };

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };

  let payload;
  try { payload = JSON.parse(event.body || "{}"); } catch (e) { return { statusCode: 400, body: "Payload non valido" }; }
  const id = payload?.record?.id;
  if (!id) return { statusCode: 400, body: "id mancante" };

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: p, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, ruolo, avatar_url, dati_pagamento_tipo, dati_pagamento_nome, dati_pagamento_piva_cf, certificazione_stato, certificazione_motivo, certificazione_richiesta_at, certificazione_notificata_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !p) return { statusCode: 200, body: JSON.stringify({ esito: "profilo_non_trovato" }) };

  try {
    if (p.certificazione_stato === "in_verifica") {
      if (p.certificazione_notificata_at && p.certificazione_richiesta_at && new Date(p.certificazione_notificata_at) >= new Date(p.certificazione_richiesta_at)) {
        return { statusCode: 200, body: JSON.stringify({ esito: "gia_notificata" }) };
      }
      const esito = await inviaEmailAdmin(p);
      if (esito.ok) {
        await supabase.from("profiles").update({ certificazione_notificata_at: new Date().toISOString() }).eq("id", id);
      }
      return { statusCode: 200, body: JSON.stringify({ esito: "email_admin", ...esito }) };
    }
    if (p.certificazione_stato === "verificato") {
      const push = await inviaPush(id, "🎉 Sei Equo Certified!", "Il badge è attivo: i tuoi clienti lo vedono accanto al tuo nome.");
      return { statusCode: 200, body: JSON.stringify({ esito: "push_verificato", push }) };
    }
    if (p.certificazione_stato === "respinto") {
      const push = await inviaPush(id, "Badge Equo Certified non approvato", (p.certificazione_motivo || "Controlla i tuoi dati fiscali") + " — correggi e richiedi di nuovo dall'app.");
      return { statusCode: 200, body: JSON.stringify({ esito: "push_respinto", push }) };
    }
    return { statusCode: 200, body: JSON.stringify({ esito: "nessuna_azione" }) };
  } catch (e) {
    console.error("notify-certificazione:", e);
    return { statusCode: 500, body: JSON.stringify({ esito: "errore", messaggio: String(e?.message || e) }) };
  }
};

async function inviaEmailAdmin(p) {
  const piva = String(p.dati_pagamento_piva_cf || "").toUpperCase().replace(/\s+/g, "").replace(/^IT/, "");
  const data = p.certificazione_richiesta_at ? new Date(p.certificazione_richiesta_at).toLocaleString("it-IT", { timeZone: "Europe/Rome" }) : "—";
  const riga = (k, v) => `<tr><td style="padding:6px 12px 6px 0;color:#667;white-space:nowrap">${k}</td><td style="padding:6px 0;font-weight:600">${v}</td></tr>`;
  const sqlOk = `update profiles set certificazione_stato = 'verificato', certificazione_verificata_at = now() where id = '${p.id}';`;
  const sqlKo = `update profiles set certificazione_stato = 'respinto', certificazione_motivo = 'Il nome non coincide con il titolare della P.IVA' where id = '${p.id}';`;
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;color:#14312a">
    <h2 style="margin:0 0 4px">Nuova richiesta Equo Certified</h2>
    <p style="margin:0 0 16px;color:#667">Richiesta del ${esc(data)}</p>
    ${p.avatar_url ? `<img src="${esc(p.avatar_url)}" alt="" width="72" height="72" style="border-radius:50%;object-fit:cover;margin-bottom:12px">` : ""}
    <table style="border-collapse:collapse;font-size:14px">
      ${riga("Nome account", esc(p.full_name || "—"))}
      ${riga("Email", esc(p.email || "—"))}
      ${riga("Ruolo", esc(p.ruolo || "—"))}
      ${riga("Tipo soggetto", esc(TIPO_SOGGETTO[p.dati_pagamento_tipo] || p.dati_pagamento_tipo || "—"))}
      ${riga("Nome / ragione sociale", esc(p.dati_pagamento_nome || "—"))}
      ${riga("P.IVA", `<span style="font-family:monospace;font-size:15px">${esc(piva || "—")}</span>`)}
      ${riga("ID utente", `<span style="font-family:monospace;font-size:12px">${esc(p.id)}</span>`)}
    </table>
    <h3 style="margin:22px 0 6px">Come verificare (30 secondi)</h3>
    <ol style="padding-left:18px;line-height:1.6;font-size:14px;margin:0">
      <li>Apri il <a href="${URL_VERIFICA_PIVA}">servizio Verifica Partita IVA dell'Agenzia delle Entrate</a> e inserisci <b>${esc(piva)}</b>.</li>
      <li>Controlla che lo stato sia <b>ATTIVA</b> e che il titolare coincida con <b>${esc(p.dati_pagamento_nome || p.full_name || "")}</b>.</li>
      <li>In Supabase → SQL Editor esegui una delle due righe qui sotto (oppure cambia lo stato dalla vista <i>certificazioni_da_verificare</i> / tabella profiles).</li>
    </ol>
    <p style="margin:14px 0 4px;font-size:13px"><b>Approva:</b></p>
    <pre style="background:#f4f1ea;padding:10px;border-radius:8px;font-size:12px;white-space:pre-wrap">${esc(sqlOk)}</pre>
    <p style="margin:10px 0 4px;font-size:13px"><b>Respingi</b> (cambia il motivo se serve, il professionista lo vede nell'app):</p>
    <pre style="background:#f4f1ea;padding:10px;border-radius:8px;font-size:12px;white-space:pre-wrap">${esc(sqlKo)}</pre>
    <p style="color:#99a;font-size:12px;margin-top:18px">Email automatica di Equo · app.equohub.com</p>
  </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({
      from: "Equo <onboarding@resend.dev>",
      to: EMAIL_ADMIN,
      subject: `Equo Certified: ${p.dati_pagamento_nome || p.full_name || "nuovo professionista"} (${piva || "P.IVA"})`,
      html,
    }),
  });
  const body = await res.text();
  if (!res.ok) console.error("Errore Resend:", body);
  return { ok: res.ok, http_status: res.status, resend: body.slice(0, 300) };
}

async function inviaPush(userId, titolo, corpo) {
  if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_REST_API_KEY) return { attempted: false };
  const res = await fetch(ONESIGNAL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}` },
    body: JSON.stringify({
      app_id: process.env.ONESIGNAL_APP_ID,
      target_channel: "push",
      include_aliases: { external_id: [userId] },
      headings: { en: titolo },
      contents: { en: String(corpo || "").slice(0, 140) },
    }),
  });
  return { attempted: true, http_status: res.status };
}
