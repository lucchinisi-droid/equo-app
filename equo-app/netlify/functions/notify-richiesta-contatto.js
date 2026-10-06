// Email a gestione.equo@gmail.com per ogni nuova richiesta di contatto:
//  - tipo "struttura": chi al primo accesso sceglie "Gestisco un centro/scuderia"
//  - tipo "profilo":   chi dal menu chiede di aggiungere/cambiare un profilo (seconda professione, struttura…)
//  - tipo "candidatura": veterinari e trainer (sito equohub.com o app, al primo accesso / aggiungi profilo)
//  - tipo "scuderia_smart": richiesta informazioni kit Scuderia smart (sito equohub.com)
// Ogni email dice DA DOVE è partita la richiesta (campo origine).
// Chiamata da trigger Supabase (supabase_functions.http_request) all'insert su richieste_contatto.
// Sicurezza: si usa solo l'id del payload; la riga si rilegge con la service role e si invia una sola volta.
const { createClient } = require("@supabase/supabase-js");
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const RICHIESTE = { seconda_professione: "Aggiungere una seconda professione", cambio_professione: "Cambiare professione", struttura: "Aggiungere un profilo struttura", altro: "Altro" };
const ORIGINI = {
  sito_candidatura: "Sito equohub.com · modulo «Veterinari e trainer»",
  sito_scuderia_smart: "Sito equohub.com · modulo «Scuderia smart»",
  app_primo_accesso: "Equo App · primo accesso (scelta del profilo)",
  app_aggiungi_profilo: "Equo App · menu profilo → «+ Aggiungi profilo»",
  app_menu: "Equo App · menu profilo",
};
const ORIGINE_BREVE = { sito_candidatura: "Sito", sito_scuderia_smart: "Sito", app_primo_accesso: "App", app_aggiungi_profilo: "App", app_menu: "App" };
const INTERESSI = { telecamere: "Telecamere", gps: "GPS", display: "Display touch", monitor: "Monitor", altro: "Altro" };
const RUOLI = { proprietario: "Proprietario", maniscalco: "Maniscalco", veterinario: "Veterinario", istruttore: "Istruttore/Trainer", gestore_struttura: "Gestore struttura" };

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  // solo il database Equo può chiamare questa funzione (stesso segreto dei webhook della chat)
  const segreto = event.headers["x-webhook-secret"] || event.headers["X-Webhook-Secret"];
  if (!process.env.CHAT_WEBHOOK_SECRET || segreto !== process.env.CHAT_WEBHOOK_SECRET) return { statusCode: 401, body: "Non autorizzato" };
  let payload;
  try { payload = JSON.parse(event.body || "{}"); } catch (e) { return { statusCode: 400, body: "Payload non valido" }; }
  const id = payload?.record?.id;
  if (!id) return { statusCode: 400, body: "id mancante" };
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: r } = await supabase.from("richieste_contatto").select("*").eq("id", id).maybeSingle();
  if (!r) return { statusCode: 200, body: JSON.stringify({ esito: "non_trovata" }) };
  if (r.notificata_at) return { statusCode: 200, body: JSON.stringify({ esito: "gia_notificata" }) };
  const { data: p } = r.user_id ? await supabase.from("profiles").select("full_name, email, ruolo, ruolo_secondario, certificazione_stato").eq("id", r.user_id).maybeSingle() : { data: null };
  const account = p ? `${p.full_name || "—"} (${p.email || "—"})` : r.user_id ? "—" : "Nessuno (richiesta dal sito)";
  const origineKey = r.origine || (r.tipo === "struttura" ? "app_primo_accesso" : "app_menu");
  const provenienza = ORIGINI[origineKey] || origineKey;
  const d = r.dettagli || {};
  const luogo = [r.citta, r.provincia ? `(${r.provincia})` : ""].filter(Boolean).join(" ");
  const tel = r.telefono ? `<a href="tel:${esc(String(r.telefono).replace(/[^\d+]/g, ""))}">${esc(r.telefono)}</a>` : "—";
  const mail = r.email ? `<a href="mailto:${esc(r.email)}">${esc(r.email)}</a>` : "—";
  const profili = p ? [p.ruolo, p.ruolo_secondario].filter(Boolean).map((x) => RUOLI[x] || x).join(" + ") || "nessuno" : "—";
  const riga = (k, v) => `<tr><td style="padding:6px 12px 6px 0;color:#667;vertical-align:top">${k}</td><td style="padding:6px 0;font-weight:600">${v}</td></tr>`;
  let titolo, subject, righe;
  if (r.tipo === "candidatura") {
    const prof = RUOLI[r.professione] || r.professione || "professionista";
    titolo = `Candidatura ${prof.toLowerCase()}`;
    subject = `[${ORIGINE_BREVE[origineKey] || "Equo"}] Candidatura ${prof.toLowerCase()}: ${r.nome || "—"} (${luogo || "—"})`;
    righe = riga("Provenienza", esc(provenienza)) + riga("Nome e cognome", esc(r.nome)) + riga("Professione", esc(prof)) +
      (d.specializzazione ? riga("Specializzazione", esc(d.specializzazione)) : "") + (d.esperienza ? riga("Esperienza", esc(d.esperienza)) : "") +
      riga("Città", esc(luogo)) + riga("Email", mail) + riga("Telefono", tel) + (r.messaggio ? riga("Messaggio", esc(r.messaggio)) : "") +
      riga("Account Equo", esc(account)) + (d.pagina ? riga("Pagina", esc(d.pagina)) : "") +
      riga("Consenso privacy", esc(r.consenso_privacy ? new Date(r.consenso_privacy).toLocaleString("it-IT", { timeZone: "Europe/Rome" }) : "—"));
  } else if (r.tipo === "scuderia_smart") {
    titolo = "Richiesta informazioni · Scuderia smart";
    subject = `[${ORIGINE_BREVE[origineKey] || "Equo"}] Scuderia smart: ${r.nome_struttura || "—"} (${luogo || "—"})`;
    const interessi = (Array.isArray(d.interessi) ? d.interessi : []).map((x) => INTERESSI[x] || x).join(", ");
    righe = riga("Provenienza", esc(provenienza)) + riga("Nome e cognome", esc(r.nome)) + (d.ruolo ? riga("Ruolo", esc(d.ruolo)) : "") +
      riga("Struttura", esc(r.nome_struttura)) + riga("Città", esc(luogo)) + riga("Email", mail) + riga("Telefono", tel) +
      (d.box ? riga("Box / cavalli", esc(d.box)) : "") + (interessi ? riga("Interessato a", esc(interessi)) : "") +
      (r.messaggio ? riga("Messaggio", esc(r.messaggio)) : "") + (d.pagina ? riga("Pagina", esc(d.pagina)) : "") +
      riga("Consenso privacy", esc(r.consenso_privacy ? new Date(r.consenso_privacy).toLocaleString("it-IT", { timeZone: "Europe/Rome" }) : "—"));
  } else if (r.tipo === "struttura") {
    titolo = "Nuova struttura da ricontattare";
    subject = `Struttura da ricontattare: ${r.nome_struttura || "—"} (${r.citta || "—"})`;
    righe = riga("Provenienza", esc(provenienza)) + riga("Struttura", esc(r.nome_struttura)) + riga("Via", esc(r.via || "—")) + riga("Città", esc(r.citta)) +
      riga("Email", esc(r.email)) + riga("Telefono", esc(r.telefono)) + (r.messaggio ? riga("Note", esc(r.messaggio)) : "") + riga("Account Equo", esc(account));
  } else {
    titolo = "Richiesta di un altro profilo";
    subject = `Richiesta profilo: ${RICHIESTE[r.richiesta] || "altro"} · ${r.nome || p?.full_name || "utente"}`;
    righe = riga("Provenienza", esc(provenienza)) + riga("Richiesta", esc(RICHIESTE[r.richiesta] || "—")) + (r.professione ? riga("Professione", esc(RUOLI[r.professione] || r.professione)) : "") +
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
