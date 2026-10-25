// OFFICINA MOBILE · km del giro (27/10/2026) — Funzione in Beta, calcoli approssimativi.
// POST { punti: [ { testo?: "indirizzo", lat?, lon? }, ... ] } (in ordine: base, tappe, base) → { km, metodo, trovati, mancanti }
// - serve il LOGIN; massimo 60 calcoli al giorno per utente (ai_prenota, chiave "km:<utente>");
// - indirizzi senza coordinate: Google Places (GOOGLE_MAPS_API_KEY, come «Naviga»), risultati salvati in geo_cache;
// - percorso su strada con OSRM (servizio pubblico); se non risponde: linea d'aria × 1,3 (metodo "stima").
const { createClient } = require("@supabase/supabase-js");
const MAX_AL_GIORNO = 60;
const risposta = (status, obj) => ({ statusCode: status, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) });
const norm = (t) => String(t || "").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 200);
const coordDaTesto = (t) => { const m = String(t || "").match(/(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/); if (!m) return null; const lat = Number(m[1]), lon = Number(m[2]); return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat, lon } : null; };
function lineaAria(a, b) {
  const R = 6371, r = (x) => x * Math.PI / 180;
  const dLat = r(b.lat - a.lat), dLon = r(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function coordinate(admin, testo, vicino) {
  const k = norm(testo);
  if (!k) return null;
  const { data: c } = await admin.from("geo_cache").select("lat, lon, trovato").eq("testo", k).maybeSingle();
  if (c) return c.trovato ? { lat: c.lat, lon: c.lon } : null;
  const chiave = process.env.GOOGLE_MAPS_API_KEY;
  if (!chiave) return null;
  try {
    const richiesta = { textQuery: testo, languageCode: "it", regionCode: "IT", maxResultCount: 1 };
    if (vicino) richiesta.locationBias = { circle: { center: { latitude: vicino.lat, longitude: vicino.lon }, radius: 50000 } };
    const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": chiave, "X-Goog-FieldMask": "places.location" },
      body: JSON.stringify(richiesta) });
    const d = await r.json().catch(() => ({}));
    const loc = d.places?.[0]?.location;
    const out = loc ? { lat: loc.latitude, lon: loc.longitude } : null;
    if (r.ok) await admin.from("geo_cache").upsert({ testo: k, lat: out?.lat ?? null, lon: out?.lon ?? null, trovato: !!out });
    return out;
  } catch (_) { return null; }
}

async function percorsoStrada(punti) {
  try {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 6000);
    const url = "https://router.project-osrm.org/route/v1/driving/" + punti.map((p) => `${p.lon.toFixed(5)},${p.lat.toFixed(5)}`).join(";") + "?overview=false";
    const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "EquoApp/1.0 (app.equohub.com)" } });
    clearTimeout(t);
    const d = await r.json();
    if (d.code === "Ok" && d.routes?.[0]) return d.routes[0].distance / 1000;
  } catch (_) {}
  return null;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return risposta(405, { error: "Metodo non ammesso" });
  const token = (event.headers.authorization || event.headers.Authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return risposta(401, { error: "Accesso richiesto" });
  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: u, error: eUser } = await admin.auth.getUser(token);
  if (eUser || !u?.user) return risposta(401, { error: "Sessione scaduta" });
  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch (_) { return risposta(400, { error: "Richiesta non valida" }); }
  const ingresso = (Array.isArray(body.punti) ? body.punti : []).slice(0, 25);
  if (ingresso.length < 2) return risposta(200, { km: 0, metodo: "nessuno", trovati: 0, mancanti: 0 });
  const giorno = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
  const { data: n, error: eLim } = await admin.rpc("ai_prenota", { p_chiave: `km:${u.user.id}`, p_mese: giorno, p_limite: MAX_AL_GIORNO, p_base: 0 });
  if (!eLim && Number(n) < 0) return risposta(200, { limite_raggiunto: true });

  const punti = []; let mancanti = 0, vicino = null;
  for (const p of ingresso) {
    let c = Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lon)) && (p.lat || p.lon) ? { lat: Number(p.lat), lon: Number(p.lon) } : coordDaTesto(p.testo);
    if (!c && p.testo) c = await coordinate(admin, String(p.testo).slice(0, 200), vicino);
    if (c) { punti.push(c); vicino = vicino || c; } else mancanti++;
  }
  // tappe consecutive uguali (stesso posto): una sola
  const pulite = punti.filter((p, i) => i === 0 || lineaAria(p, punti[i - 1]) > 0.05);
  if (pulite.length < 2) return risposta(200, { km: 0, metodo: "nessuno", trovati: punti.length, mancanti });
  let km = await percorsoStrada(pulite), metodo = "strade";
  if (km == null) { km = pulite.slice(1).reduce((t, p, i) => t + lineaAria(pulite[i], p), 0) * 1.3; metodo = "stima"; }
  return risposta(200, { km: Math.round(km * 10) / 10, metodo, trovati: punti.length, mancanti });
};

exports._interni = { lineaAria, coordDaTesto };
