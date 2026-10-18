// Equo · visita: conteggio anonimo di visite e click di equohub.com e scuderia.equohub.com.
// I siti chiamano /api/v (proxy nei loro netlify.toml) → questa funzione.
// Niente cookie e niente IP salvato: «visitatore» è un hash che cambia ogni giorno.
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const SITI = ["sito", "scuderia"];
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch|go-http|java\//i;
const testo = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max) || null;

exports.handler = async (event) => {
  const ok = { statusCode: 204, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "" };
  const h = event.headers || {};
  const ua = h["user-agent"] || "";
  if (!ua || BOT.test(ua)) return ok;
  let b = {};
  try { b = JSON.parse(event.body || "{}"); } catch (_) { return ok; }
  if (!SITI.includes(b.sito) || !["visita", "click"].includes(b.tipo)) return ok;

  const ip = h["x-nf-client-connection-ip"] || (h["x-forwarded-for"] || "").split(",")[0].trim() || "";
  const giorno = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
  const sale = process.env.ANALYTICS_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "equo";
  const visitatore = crypto.createHash("sha256").update([sale, ip, ua, giorno].join("|")).digest("hex").slice(0, 16);

  const riga = {
    sito: b.sito,
    tipo: b.tipo,
    pagina: testo(b.pagina, 200),
    nome: b.tipo === "click" ? testo(b.nome, 120) : null,
    sorgente: testo(b.sorgente, 120),
    dispositivo: b.dispositivo === "mobile" ? "mobile" : "desktop",
    visitatore,
  };
  try {
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    await sb.from("sito_visite").insert(riga);
  } catch (_) { /* le statistiche non devono mai rompere il sito */ }
  return ok;
};
