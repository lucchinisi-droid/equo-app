// Equo · meteo: previsioni dei prossimi 7 giorni per la Home dell'app (posizione del telefono)
// e di Equo Scuderia (indirizzo del centro, via proxy /api/meteo).
//
// - serve il LOGIN (token Supabase): la funzione non è un servizio meteo pubblico;
// - fonte predefinita: Istituto meteorologico norvegese (MET Norway, licenza CC BY 4.0, gratis anche per uso commerciale,
//   con citazione della fonte). Ora per ora per i primi 2-3 giorni, poi ogni 6 ore;
// - fonte alternativa (quando c'è l'abbonamento): METEO_FONTE=openmeteo + METEO_API_KEY (+ METEO_MODELLI facoltativo,
//   es. il modello italiano ItaliaMeteo ICON-2I): ora per ora su tutti i 7 giorni. L'app non cambia;
// - indirizzo → coordinate (centri) e coordinate → nome del paese con OpenStreetMap Nominatim (pochi usi, con cache);
// - cache in memoria 30 minuti per previsione e 30 giorni per gli indirizzi.

const { createClient } = require("@supabase/supabase-js");

const UA = "EquoHub/1.0 (+https://equohub.com; gestione.equo@gmail.com)";
const MIN30 = 30 * 60 * 1000;
const cachePrev = new Map();   // "lat,lon" → { t, dati }
const cacheGeo = new Map();    // testo → { t, lat, lon, luogo }
const cacheLuogo = new Map();  // "lat,lon" → { t, luogo }

const risposta = (status, obj, extra = {}) => ({ statusCode: status, headers: { "Content-Type": "application/json", ...extra }, body: JSON.stringify(obj) });
const arrot = (n, d = 2) => Math.round(Number(n) * 10 ** d) / 10 ** d;
const giornoRoma = (iso) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
const oraRoma = (iso) => new Date(iso).toLocaleTimeString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });

// codici simbolo → famiglia di icone dell'app
function daSimboloMet(s){
  s = String(s || "");
  const notte = /_night|_polartwilight/.test(s);
  let k = "nubi";
  if(/thunder/.test(s)) k = "temporale";
  else if(/snow/.test(s)) k = "neve";
  else if(/sleet/.test(s)) k = "nevischio";
  else if(/heavyrain/.test(s)) k = "pioggia_forte";
  else if(/lightrain/.test(s)) k = "pioviggine";
  else if(/rain/.test(s)) k = "pioggia";
  else if(/fog/.test(s)) k = "nebbia";
  else if(/clearsky/.test(s)) k = "sereno";
  else if(/fair|partlycloudy/.test(s)) k = "variabile";
  else if(/cloudy/.test(s)) k = "nubi";
  return { k, notte };
}
function daCodiceWmo(c, giorno){
  c = Number(c);
  let k = "nubi";
  if(c === 0) k = "sereno";
  else if(c <= 2) k = "variabile";
  else if(c === 3) k = "nubi";
  else if(c === 45 || c === 48) k = "nebbia";
  else if(c >= 51 && c <= 57) k = "pioviggine";
  else if(c === 61 || c === 80) k = "pioviggine";
  else if(c === 63 || c === 81 || c === 66) k = "pioggia";
  else if(c === 65 || c === 82 || c === 67) k = "pioggia_forte";
  else if((c >= 71 && c <= 77) || c === 85 || c === 86) k = "neve";
  else if(c >= 95) k = "temporale";
  return { k, notte: giorno === 0 };
}
const GRAVITA = { sereno: 0, variabile: 1, nubi: 2, nebbia: 2, pioviggine: 3, pioggia: 4, nevischio: 4, neve: 5, pioggia_forte: 5, temporale: 6 };

// ore → giorni (data italiana): min/max, pioggia totale, icona del giorno (la più «seria» tra le 9 e le 18)
function riassumiGiorni(ore){
  const giorni = new Map();
  for(const o of ore){
    const g = giornoRoma(o.t);
    if(!giorni.has(g)) giorni.set(g, { data: g, min: null, max: null, mm: 0, sim: null, _grav: -1, _simTutto: null, _gravTutto: -1 });
    const d = giorni.get(g);
    if(o.temp != null){ d.min = d.min == null ? o.temp : Math.min(d.min, o.temp); d.max = d.max == null ? o.temp : Math.max(d.max, o.temp); }
    d.mm += Number(o.mm) || 0;
    const h = Number(oraRoma(o.t).slice(0, 2));
    const grav = GRAVITA[o.sim] ?? 2;
    if(h >= 9 && h <= 18 && grav > d._grav){ d._grav = grav; d.sim = o.sim; }
    if(grav > d._gravTutto){ d._gravTutto = grav; d._simTutto = o.sim; }
  }
  return [...giorni.values()].map(d => ({ data: d.data, min: d.min, max: d.max, mm: Math.round(d.mm * 10) / 10, sim: d.sim || d._simTutto || "nubi" })).slice(0, 8);
}

async function previsioneMet(lat, lon){
  const r = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`, { headers: { "User-Agent": UA } });
  if(!r.ok) throw new Error("met " + r.status);
  const d = await r.json();
  const serie = d?.properties?.timeseries || [];
  const ore = [];
  for(const s of serie){
    const det = s.data?.instant?.details || {};
    const h1 = s.data?.next_1_hours, h6 = s.data?.next_6_hours;
    const blocco = h1 || h6;
    if(!blocco) continue;
    // nella parte a 6 ore si tengono solo le righe ogni 6 ore (evita doppioni di pioggia)
    if(!h1 && ore.length && ore[ore.length - 1].passo === 6 && (new Date(s.time) - new Date(ore[ore.length - 1].t)) < 6 * 3600e3) continue;
    const { k, notte } = daSimboloMet(blocco.summary?.symbol_code);
    ore.push({
      t: s.time, passo: h1 ? 1 : 6,
      temp: det.air_temperature != null ? Math.round(det.air_temperature) : null,
      sim: k, notte,
      mm: blocco.details?.precipitation_amount ?? 0,
      vento: det.wind_speed != null ? Math.round(det.wind_speed * 3.6) : null,
      umid: det.relative_humidity != null ? Math.round(det.relative_humidity) : null,
    });
  }
  return { ore, fonte: "Istituto meteorologico norvegese (MET Norway) · CC BY 4.0" };
}

async function previsioneOpenMeteo(lat, lon){
  const chiave = process.env.METEO_API_KEY;
  const modelli = process.env.METEO_MODELLI || "best_match";
  const url = `https://customer-api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
    + `&hourly=temperature_2m,precipitation,weather_code,wind_speed_10m,relative_humidity_2m,is_day&forecast_days=8&timezone=UTC&timeformat=iso8601`
    + `&models=${encodeURIComponent(modelli)}&apikey=${encodeURIComponent(chiave)}`;
  const r = await fetch(url);
  if(!r.ok) throw new Error("openmeteo " + r.status);
  const d = await r.json();
  const h = d.hourly || {};
  const ore = (h.time || []).map((t, i) => {
    const { k, notte } = daCodiceWmo(h.weather_code?.[i], h.is_day?.[i]);
    return { t: t.endsWith("Z") ? t : t + "Z", passo: 1, temp: h.temperature_2m?.[i] != null ? Math.round(h.temperature_2m[i]) : null, sim: k, notte,
      mm: h.precipitation?.[i] ?? 0, vento: h.wind_speed_10m?.[i] != null ? Math.round(h.wind_speed_10m[i]) : null,
      umid: h.relative_humidity_2m?.[i] != null ? Math.round(h.relative_humidity_2m[i]) : null };
  }).filter(o => new Date(o.t) >= new Date(Date.now() - 3600e3));
  return { ore, fonte: "ItaliaMeteo / modelli europei via Open-Meteo · CC BY 4.0" };
}

async function geocodifica(testo){
  const chiave = testo.toLowerCase();
  const c = cacheGeo.get(chiave);
  if(c && Date.now() - c.t < 30 * 24 * 3600e3) return c;
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=it&accept-language=it&q=${encodeURIComponent(testo)}`, { headers: { "User-Agent": UA } });
  if(!r.ok) return null;
  const d = await r.json().catch(() => []);
  if(!d[0]) return null;
  const v = { t: Date.now(), lat: arrot(d[0].lat, 3), lon: arrot(d[0].lon, 3) };
  cacheGeo.set(chiave, v);
  return v;
}
async function nomeLuogo(lat, lon){
  const k = `${arrot(lat, 2)},${arrot(lon, 2)}`;
  const c = cacheLuogo.get(k);
  if(c && Date.now() - c.t < 30 * 24 * 3600e3) return c.luogo;
  try{
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&accept-language=it&lat=${lat}&lon=${lon}`, { headers: { "User-Agent": UA } });
    const d = await r.json().catch(() => ({}));
    const a = d.address || {};
    const luogo = a.city || a.town || a.village || a.municipality || a.county || "";
    cacheLuogo.set(k, { t: Date.now(), luogo });
    return luogo;
  } catch(_){ return ""; }
}

// calcolo della previsione (usato dalla funzione e dagli agenti AI, senza login: il login lo controlla chi chiama)
async function previsione(b){
  b = b || {};
  let lat = Number(b.lat), lon = Number(b.lon), luogo = String(b.luogo || "").slice(0, 80);
  if(!(Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && (b.lat != null))){
    const indirizzo = String(b.indirizzo || "").replace(/\s+/g, " ").trim().slice(0, 200);
    const citta = String(b.citta || "").replace(/\s+/g, " ").trim().slice(0, 120);
    if(!indirizzo && !citta) return { errore: "posizione_mancante" };
    let g = indirizzo ? await geocodifica([indirizzo, citta].filter(Boolean).join(", ")) : null;
    if(!g && citta) g = await geocodifica(citta);
    if(!g) return { non_trovato: true };
    lat = g.lat; lon = g.lon;
    luogo = luogo || citta.split(",")[0];
  }
  lat = arrot(lat, 2); lon = arrot(lon, 2);   // ~1 km: basta per il meteo e protegge la posizione esatta
  const chiave = `${lat},${lon}`;
  let prev = cachePrev.get(chiave);
  if(!prev || Date.now() - prev.t > MIN30){
    try{
      const usaAlt = process.env.METEO_FONTE === "openmeteo" && process.env.METEO_API_KEY;
      const dati = usaAlt ? await previsioneOpenMeteo(lat, lon) : await previsioneMet(lat, lon);
      prev = { t: Date.now(), dati };
      cachePrev.set(chiave, prev);
      if(cachePrev.size > 500) cachePrev.delete(cachePrev.keys().next().value);
    } catch(e){
      console.warn("meteo:", e.message);
      if(!prev) return { errore: true };
    }
  }
  if(!luogo) luogo = await nomeLuogo(lat, lon);
  const ore = prev.dati.ore.filter(o => new Date(o.t) >= new Date(Date.now() - 3600e3));
  return { luogo, lat, lon, fonte: prev.dati.fonte, aggiornato: new Date(prev.t).toISOString(), giorni: riassumiGiorni(ore).slice(0, 7), ore };
}
exports.previsione = previsione;
exports.riassumiGiorni = riassumiGiorni;

exports.handler = async (event) => {
  if(event.httpMethod === "OPTIONS") return { statusCode: 204, headers: { "Access-Control-Allow-Headers": "Content-Type, Authorization" }, body: "" };
  if(event.httpMethod !== "POST") return risposta(405, { error: "Metodo non ammesso" });
  const token = (event.headers.authorization || event.headers.Authorization || "").replace(/^Bearer\s+/i, "");
  if(!token) return risposta(401, { error: "Accesso richiesto" });
  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: u, error: eUser } = await admin.auth.getUser(token);
  if(eUser || !u?.user) return risposta(401, { error: "Sessione scaduta" });

  let b = {};
  try { b = JSON.parse(event.body || "{}"); } catch(_) { return risposta(400, { error: "Richiesta non valida" }); }
  const r = await previsione(b);
  if(r.errore === "posizione_mancante") return risposta(400, { error: "Posizione mancante" });
  return risposta(200, r, r.giorni ? { "Cache-Control": "private, max-age=900" } : {});
};
