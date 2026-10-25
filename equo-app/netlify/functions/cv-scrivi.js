// Equo CV · «Scrivi con Hammer» e «Versione in inglese» (26/10/2026)
// POST { azione: "presentazione" | "traduci", dati: { ruolo, titolo, presentazione, spec[], zone[], esperienze[], formazione[], lingue[], numeri{} } }
// Verifica il login, massimo 15 richieste al giorno per professionista (contatore in pro_cv), risponde { testo }.
const { createClient } = require("@supabase/supabase-js");
const { utenteDaToken } = require("../agente/aiuti");
const { MODELLO } = require("../agente/configurazione");

const ORIGINI_OK = ["https://app.equohub.com"];
const LIMITE_GIORNO = 15;

exports.handler = async (event) => {
  const origine = event.headers.origin || event.headers.Origin || "";
  const cors = { "Access-Control-Allow-Origin": ORIGINI_OK.includes(origine) || /^https:\/\/[a-z0-9-]+--equo-app\.netlify\.app$/.test(origine) ? origine : "https://app.equohub.com",
    "Vary": "Origin", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "POST, OPTIONS" };
  const risposta = (s, o) => ({ statusCode: s, headers: { "Content-Type": "application/json", ...cors }, body: JSON.stringify(o) });
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors, body: "" };
  if (event.httpMethod !== "POST") return risposta(405, { error: "Method not allowed" });

  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { user } = await utenteDaToken(event, admin);
  if (!user) return risposta(401, { error: "Non autenticato" });
  let body;
  try { body = JSON.parse(event.body || "{}"); } catch (e) { return risposta(400, { error: "Richiesta non valida" }); }
  const azione = body.azione === "traduci" ? "traduci" : "presentazione";
  const d = body.dati && typeof body.dati === "object" ? body.dati : {};
  const corto = (v, n) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
  const lista = (v, n, m) => (Array.isArray(v) ? v : []).slice(0, n).map((x) => (typeof x === "object" ? Object.values(x).filter((y) => typeof y === "string" || typeof y === "number").join(", ") : String(x))).map((x) => corto(x, m)).filter(Boolean);

  // limite giornaliero
  const oggi = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
  const { data: cv } = await admin.from("pro_cv").select("hammer_giorno, hammer_n").eq("user_id", user.id).maybeSingle();
  const usati = cv && cv.hammer_giorno === oggi ? cv.hammer_n : 0;
  if (usati >= LIMITE_GIORNO) return risposta(429, { error: "Hai usato tutte le richieste di oggi: riprova domani." });
  await admin.from("pro_cv").upsert({ user_id: user.id, hammer_giorno: oggi, hammer_n: usati + 1 }, { onConflict: "user_id" });

  const profilo = [
    "Ruolo: " + corto(d.ruolo || "Maniscalco", 40),
    d.titolo ? "Titolo: " + corto(d.titolo, 120) : "",
    lista(d.spec, 12, 60).length ? "Specializzazioni: " + lista(d.spec, 12, 60).join(", ") : "",
    lista(d.zone, 8, 40).length ? "Zone: " + lista(d.zone, 8, 40).join(", ") + (d.trasferte ? " (disponibile per trasferte ed eventi)" : "") : "",
    lista(d.esperienze, 8, 160).length ? "Esperienze ed eventi: " + lista(d.esperienze, 8, 160).join(" | ") : "",
    lista(d.formazione, 8, 160).length ? "Formazione: " + lista(d.formazione, 8, 160).join(" | ") : "",
    lista(d.lingue, 6, 20).length ? "Lingue: " + lista(d.lingue, 6, 20).join(", ") : "",
    d.numeri ? "Numeri registrati su Equo: " + corto(JSON.stringify(d.numeri), 200) : "",
    d.presentazione ? "Presentazione attuale: " + corto(d.presentazione, 1200) : "",
  ].filter(Boolean).join("\n");
  const istruzioni = azione === "traduci"
    ? "Translate the following Italian professional bio of an equine professional into natural, professional English. Keep facts and names unchanged, keep it concise. Reply with the translated text only."
    : "Sei Hammer, l'assistente di Equo per i maniscalchi e i professionisti del cavallo. Scrivi in italiano la presentazione del curriculum del professionista: 3-4 frasi, prima persona, tono professionale e caldo, niente elenchi, niente emoji, massimo 550 caratteri. Usa SOLO i dati forniti, non inventare anni, titoli o eventi. Rispondi solo con il testo.";
  const contenuto = azione === "traduci" ? corto(d.presentazione, 1500) : profilo;
  if (!contenuto) return risposta(400, { error: azione === "traduci" ? "Scrivi prima la presentazione in italiano." : "Compila almeno qualche sezione del CV." });

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODELLO, max_tokens: 600, system: istruzioni, messages: [{ role: "user", content: contenuto }] }),
    });
    const j = await res.json();
    const testo = (j.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    if (!testo) return risposta(502, { error: "Hammer non ha risposto, riprova." });
    return risposta(200, { testo: testo.slice(0, 1600) });
  } catch (e) {
    return risposta(502, { error: "Hammer non è raggiungibile ora, riprova." });
  }
};
