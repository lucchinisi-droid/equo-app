// TICKET DI ASSISTENZA (Home dell'app Equo e di Equo Scuderia → "Serve aiuto?" → "Apri un ticket")
// Chiamata da trigger Supabase (supabase_functions.http_request) all'insert su ticket_assistenza:
//  1) email a gestione.equo@gmail.com con tutti i dati (reply_to = email dell'utente: si risponde direttamente dalla posta);
//  2) email di conferma all'utente con il numero del ticket.
// Sicurezza: si usa solo l'id del payload; la riga si rilegge con la service role e si invia una sola volta.
const { createClient } = require("@supabase/supabase-js");
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const CATEGORIE = { problema: "Problema / errore", domanda: "Domanda sull'uso", account: "Account e accesso", pagamenti: "Abbonamento e pagamenti", suggerimento: "Suggerimento", altro: "Altro" };
const RUOLI = { proprietario: "Proprietario", maniscalco: "Maniscalco", veterinario: "Veterinario", istruttore: "Istruttore/Trainer", gestore_struttura: "Gestore struttura" };

async function inviaEmail(dati) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: process.env.EMAIL_MITTENTE || "Equo <onboarding@resend.dev>", ...dati }),
  });
  if (!res.ok) console.error("ticket email:", res.status, await res.text());
  return res.ok;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  let payload;
  try { payload = JSON.parse(event.body || "{}"); } catch (e) { return { statusCode: 400, body: "Payload non valido" }; }
  const id = payload?.record?.id;
  if (!id) return { statusCode: 400, body: "id mancante" };
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: t } = await supabase.from("ticket_assistenza").select("*").eq("id", id).maybeSingle();
  if (!t) return { statusCode: 200, body: JSON.stringify({ esito: "non_trovato" }) };
  if (t.notificata_at) return { statusCode: 200, body: JSON.stringify({ esito: "gia_notificato" }) };

  const { data: p } = await supabase.from("profiles").select("full_name, email, ruolo, ruolo_secondario, piano").eq("id", t.user_id).maybeSingle();
  let centro = null;
  if (t.centro_id) { const { data: c } = await supabase.from("centri").select("nome").eq("id", t.centro_id).maybeSingle(); centro = c?.nome || null; }
  const profili = p ? [p.ruolo, p.ruolo_secondario].filter(Boolean).map((x) => RUOLI[x] || x).join(" + ") || "—" : "—";
  const dove = t.app === "scuderia" ? `Equo Scuderia${centro ? " · " + centro : ""}` : `App Equo · vista ${t.vista || "—"}`;
  const numero = `#${t.numero}`;
  const riga = (k, v) => `<tr><td style="padding:6px 12px 6px 0;color:#667;vertical-align:top;white-space:nowrap">${k}</td><td style="padding:6px 0;font-weight:600">${v}</td></tr>`;

  const htmlBoss = `<div style="font-family:Arial,sans-serif;max-width:600px;color:#14312a">
    <h2 style="margin:0 0 4px">Ticket di assistenza ${numero}</h2>
    <p style="margin:0 0 14px;color:#667">${esc(CATEGORIE[t.categoria] || t.categoria)} · ${esc(dove)}</p>
    <table style="border-collapse:collapse;font-size:14px">
      ${riga("Oggetto", esc(t.oggetto))}
      ${riga("Nome", esc(t.nome || p?.full_name || "—"))}
      ${riga("Email", esc(t.email))}
      ${t.telefono ? riga("Telefono", esc(t.telefono)) : ""}
      ${riga("Account", esc(`${p?.full_name || "—"} (${p?.email || "—"}) · ${profili} · piano ${p?.piano || "free"}`))}
      ${t.dispositivo ? riga("Dispositivo", `<span style="font-weight:400;font-size:12px">${esc(t.dispositivo)}</span>`) : ""}
    </table>
    <div style="margin-top:14px;padding:12px 14px;background:#f5f1e8;border-radius:10px;white-space:pre-wrap;font-size:14px;line-height:1.5">${esc(t.descrizione)}</div>
    <p style="font-size:12px;color:#667;margin-top:14px">Rispondi direttamente a questa email: la risposta arriva all'utente. Ticket salvato in Supabase (tabella ticket_assistenza, id ${esc(t.id)}).</p></div>`;

  const okBoss = await inviaEmail({ to: "gestione.equo@gmail.com", reply_to: t.email || p?.email || undefined,
    subject: `[Ticket ${numero}] ${CATEGORIE[t.categoria] || t.categoria}: ${t.oggetto}`, html: htmlBoss });

  // conferma all'utente (non blocca l'esito se fallisce)
  const nome = (t.nome || p?.full_name || "").split(" ")[0];
  const htmlUtente = `<div style="font-family:Arial,sans-serif;max-width:560px;color:#14312a;line-height:1.5">
    <h2 style="margin:0 0 10px">Abbiamo ricevuto la tua richiesta ${numero}</h2>
    <p>Ciao${nome ? " " + esc(nome) : ""}, grazie per averci scritto. Il team Equo ti risponderà a questo indirizzo il prima possibile.</p>
    <p style="margin:14px 0 6px;color:#667;font-size:13px">Riepilogo</p>
    <div style="padding:12px 14px;background:#f5f1e8;border-radius:10px;font-size:14px"><b>${esc(t.oggetto)}</b><br><span style="white-space:pre-wrap">${esc(t.descrizione.length > 600 ? t.descrizione.slice(0, 600) + "…" : t.descrizione)}</span></div>
    <p style="font-size:13px;color:#667;margin-top:14px">Vuoi aggiungere qualcosa? Rispondi semplicemente a questa email citando il numero ${numero}.</p>
    <p style="font-size:13px;color:#667">— Il team Equo</p></div>`;
  // conferma SOLO all'email dell'account (verificata al login), mai all'indirizzo scritto nel modulo:
  // altrimenti chiunque potrebbe far partire email Equo verso indirizzi di terzi
  if (p?.email) await inviaEmail({ to: p.email, reply_to: "gestione.equo@gmail.com", subject: `Equo · abbiamo ricevuto il tuo ticket ${numero}`, html: htmlUtente });

  if (okBoss) await supabase.from("ticket_assistenza").update({ notificata_at: new Date().toISOString() }).eq("id", id);
  return { statusCode: 200, body: JSON.stringify({ esito: okBoss ? "email_inviata" : "errore_resend" }) };
};
