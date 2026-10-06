// Equo App · cerca-luogo: ricerca di un luogo (nome + città) per il pulsante «Naviga» del maniscalco.
// Restituisce 3-5 proposte (nome + indirizzo) da Google Places; il maniscalco sceglie quella giusta
// e l'app la salva nella scheda del cliente (così la ricerca si fa una volta sola per cliente).
//
// - serve il LOGIN (token Supabase);
// - massimo 20 ricerche al giorno per utente (contatore atomico ai_prenota, chiave "luoghi:<utente>");
// - la chiave Google resta qui (env GOOGLE_MAPS_API_KEY), mai nell'app.
//   Se la chiave non c'è risponde { non_configurato: true } e l'app apre la ricerca direttamente in Google Maps.

const { createClient } = require("@supabase/supabase-js");

const MAX_AL_GIORNO = 20;
const risposta = (status, obj) => ({ statusCode: status, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) });

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return risposta(405, { error: "Metodo non ammesso" });
  const token = (event.headers.authorization || event.headers.Authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return risposta(401, { error: "Accesso richiesto" });

  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: u, error: eUser } = await admin.auth.getUser(token);
  if (eUser || !u?.user) return risposta(401, { error: "Sessione scaduta" });

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch (_) { return risposta(400, { error: "Richiesta non valida" }); }
  const testo = String(body.testo || "").replace(/\s+/g, " ").trim().slice(0, 150);
  if (testo.length < 3) return risposta(400, { error: "Scrivi almeno 3 lettere" });

  const chiave = process.env.GOOGLE_MAPS_API_KEY;
  if (!chiave) return risposta(200, { non_configurato: true, risultati: [] });

  // limite giornaliero (giorno italiano): se la funzione SQL non risponde si prosegue
  const giorno = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
  const { data: n, error: eLim } = await admin.rpc("ai_prenota", { p_chiave: `luoghi:${u.user.id}`, p_mese: giorno, p_limite: MAX_AL_GIORNO, p_base: 0 });
  if (!eLim && Number(n) < 0) return risposta(200, { limite_raggiunto: true, risultati: [] });

  const richiesta = { textQuery: testo, languageCode: "it", regionCode: "IT", maxResultCount: 5 };
  const lat = Number(body.lat), lng = Number(body.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    richiesta.locationBias = { circle: { center: { latitude: lat, longitude: lng }, radius: 50000 } };
  }
  try {
    const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": chiave,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location",
      },
      body: JSON.stringify(richiesta),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.warn("cerca-luogo: Google ha risposto", r.status, JSON.stringify(d).slice(0, 300));
      return risposta(200, { errore: true, risultati: [] });
    }
    const risultati = (d.places || []).map((p) => ({
      nome: p.displayName?.text || "",
      indirizzo: p.formattedAddress || "",
      lat: p.location?.latitude ?? null,
      lng: p.location?.longitude ?? null,
    })).filter((p) => p.indirizzo);
    return risposta(200, { risultati });
  } catch (e) {
    console.warn("cerca-luogo:", e.message);
    return risposta(200, { errore: true, risultati: [] });
  }
};
