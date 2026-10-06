// Equo · contatto-sito: moduli del sito equohub.com (Veterinari e trainer, Scuderia smart).
// Il sito chiama /api/contatto (proxy in equo-sito/netlify.toml) → questa funzione.
// - nessun account: la riga si scrive in richieste_contatto con la service role;
// - l'email a gestione.equo@gmail.com parte dal trigger del database (notify-richiesta-contatto);
// - anti-spam: campo nascosto «sito_web», tempo minimo di compilazione, limiti per email, per rete e globali.

const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const ORIGINI_OK = ["https://equohub.com", "https://www.equohub.com"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROFESSIONI = ["veterinario", "istruttore"];
const INTERESSI = ["telecamere", "gps", "display", "monitor", "altro"];

const cors = (origin) => ({
  "Access-Control-Allow-Origin": ORIGINI_OK.includes(origin) ? origin : ORIGINI_OK[0],
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  Vary: "Origin",
});
const testo = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

exports.handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin || "";
  const risposta = (status, obj) => ({ statusCode: status, headers: { "Content-Type": "application/json", ...cors(origin) }, body: JSON.stringify(obj) });
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors(origin), body: "" };
  if (event.httpMethod !== "POST") return risposta(405, { errore: "Metodo non ammesso" });

  let b = {};
  try { b = JSON.parse(event.body || "{}"); } catch (_) { return risposta(400, { errore: "Richiesta non valida" }); }

  // trappole per i robot: rispondiamo «ok» senza salvare
  if (testo(b.sito_web, 200)) return risposta(200, { ok: true });
  if (Number(b.ms) > 0 && Number(b.ms) < 2500) return risposta(200, { ok: true });

  const modulo = b.modulo === "scuderia_smart" ? "scuderia_smart" : b.modulo === "candidatura" ? "candidatura" : null;
  if (!modulo) return risposta(400, { errore: "Modulo sconosciuto" });

  const r = {
    tipo: modulo,
    origine: modulo === "candidatura" ? "sito_candidatura" : "sito_scuderia_smart",
    nome: testo(b.nome, 160),
    email: testo(b.email, 200).toLowerCase(),
    telefono: testo(b.telefono, 40),
    citta: testo(b.citta, 120),
    provincia: testo(b.provincia, 60),
    messaggio: testo(b.messaggio, 1500) || null,
    consenso_privacy: b.privacy === true ? new Date().toISOString() : null,
  };
  const dettagli = { pagina: testo(b.pagina, 300) || null };
  if (modulo === "candidatura") {
    r.professione = PROFESSIONI.includes(b.professione) ? b.professione : null;
    dettagli.specializzazione = testo(b.specializzazione, 200) || null;
    dettagli.esperienza = testo(b.esperienza, 60) || null;
  } else {
    r.nome_struttura = testo(b.struttura, 160);
    dettagli.ruolo = testo(b.ruolo, 80) || null;
    dettagli.box = testo(b.box, 20) || null;
    dettagli.interessi = (Array.isArray(b.interessi) ? b.interessi : []).filter((x) => INTERESSI.includes(x));
  }
  r.dettagli = dettagli;

  const manca = [];
  if (!r.nome) manca.push("nome e cognome");
  if (modulo === "candidatura" && !r.professione) manca.push("professione");
  if (modulo === "scuderia_smart" && !r.nome_struttura) manca.push("nome della struttura");
  if (!r.citta) manca.push("città");
  if (!r.provincia) manca.push("provincia");
  if (!r.email) manca.push("email");
  if (!r.telefono) manca.push("telefono");
  if (manca.length) return risposta(400, { errore: "Compila: " + manca.join(", ") + "." });
  if (!EMAIL_RE.test(r.email)) return risposta(400, { errore: "Controlla l'indirizzo email." });
  if (r.telefono.replace(/\D/g, "").length < 6) return risposta(400, { errore: "Controlla il numero di telefono." });
  if (!r.consenso_privacy) return risposta(400, { errore: "Per inviare serve accettare l'informativa privacy." });

  const ip = String(event.headers["x-nf-client-connection-ip"] || event.headers["x-forwarded-for"] || "").split(",")[0].trim();
  r.ip_hash = ip ? crypto.createHash("sha256").update(ip + (process.env.CHAT_WEBHOOK_SECRET || "equo")).digest("hex").slice(0, 32) : null;

  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const daUnGiorno = new Date(Date.now() - 864e5).toISOString();
  const daUnOra = new Date(Date.now() - 36e5).toISOString();
  const conta = async (filtro) => {
    let q = admin.from("richieste_contatto").select("id", { count: "exact", head: true }).like("origine", "sito_%");
    q = filtro(q);
    const { count } = await q;
    return count || 0;
  };
  if (await conta((q) => q.eq("email", r.email).gte("created_at", daUnGiorno)) >= 3) return risposta(429, { errore: "Abbiamo già ricevuto le tue richieste di oggi: ti ricontattiamo al più presto." });
  if (r.ip_hash && await conta((q) => q.eq("ip_hash", r.ip_hash).gte("created_at", daUnOra)) >= 5) return risposta(429, { errore: "Troppe richieste in poco tempo: riprova più tardi." });
  if (await conta((q) => q.gte("created_at", daUnOra)) >= 40) return risposta(429, { errore: "In questo momento non riusciamo a ricevere altre richieste: riprova tra un'ora o scrivi a gestione.equo@gmail.com." });

  const { error } = await admin.from("richieste_contatto").insert(r);
  if (error) {
    console.warn("contatto-sito:", error.message);
    return risposta(500, { errore: "Invio non riuscito. Riprova o scrivi a gestione.equo@gmail.com." });
  }
  return risposta(200, { ok: true });
};
