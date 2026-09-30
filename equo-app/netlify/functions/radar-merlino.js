// RADAR DI MERLINO — richiesta dalla pagina Statistiche di Equo Scuderia (via proxy /api/radar).
// Controlla login, appartenenza al centro, pacchetto (radar + Merlino attivo) e frequenza (1 ogni 20 ore),
// poi avvia la generazione in background (ricerca web lunga) in radar-merlino-background.js.
const { createClient } = require("@supabase/supabase-js");
const { zonaCentro, avviaRadar } = require("../lib/radar-comune");
const risposta = (status, obj) => ({ statusCode: status, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) });

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return risposta(405, { error: "Method not allowed" });
  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const token = String(event.headers.authorization || event.headers.Authorization || "").replace(/^Bearer\s+/i, "");
  const { data: u } = token ? await admin.auth.getUser(token) : { data: null };
  const user = u?.user;
  if (!user) return risposta(401, { error: "Non autenticato" });
  let body = {}; try { body = JSON.parse(event.body || "{}"); } catch (e) { /* vuoto */ }
  const centroId = String(body.centro_id || "");
  if (!/^[0-9a-f-]{36}$/i.test(centroId)) return risposta(400, { error: "Centro mancante" });
  const { data: c } = await admin.from("centri").select("id, owner_id, indirizzo, citta, provincia, regione").eq("id", centroId).maybeSingle();
  const { data: m } = await admin.from("scuderia_membri").select("ruolo").eq("centro_id", centroId).eq("user_id", user.id).maybeSingle();
  if (!c || ((!m || m.ruolo === "proprietario") && c.owner_id !== user.id)) return risposta(403, { error: "Non fai parte di questo centro" });
  const { data: l } = await admin.rpc("centro_limiti", { p_centro_id: centroId });
  if (!l?.radar || !(l.agenti || []).includes("merlino")) return risposta(403, { error: "Il Radar di Merlino è incluso in PREMIUM con Merlino.", bloccato: true });
  if (!zonaCentro(c)) return risposta(400, { error: "Imposta città, provincia e regione del centro in \"Il tuo Centro\": Merlino ne ha bisogno per cercare la concorrenza della zona.", manca_zona: true });
  const { data: ult } = await admin.from("merlino_radar").select("created_at").eq("centro_id", centroId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const oreMin = l.sbloccato ? 1 : 20;
  if (ult && Date.now() - new Date(ult.created_at).getTime() < oreMin * 3600000) {
    return risposta(200, { gia_recente: true, messaggio: `Il radar è stato aggiornato da poco: si può rigenerare ogni ${oreMin} ${oreMin === 1 ? "ora" : "ore"}.` });
  }
  const ok = await avviaRadar(centroId, user.id);
  return risposta(ok ? 202 : 500, ok ? { avviato: true } : { error: "Non sono riuscito ad avviare il radar, riprova." });
};
