// RADAR DI MERLINO — ogni lunedì: avvia il radar per i centri con Radar incluso e Merlino attivo
// (se non è già stato generato negli ultimi 6 giorni e il centro ha impostato la zona).
const { createClient } = require("@supabase/supabase-js");
const { zonaCentro, avviaRadar } = require("../lib/radar-comune");

exports.handler = async () => {
  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: centri } = await admin.from("centri").select("id, indirizzo, citta, provincia, regione");
  let avviati = 0;
  for (const c of centri || []) {
    if (!zonaCentro(c)) continue;
    const { data: l } = await admin.rpc("centro_limiti", { p_centro_id: c.id });
    if (!l?.radar || !(l.agenti || []).includes("merlino")) continue;
    const { data: ult } = await admin.from("merlino_radar").select("created_at").eq("centro_id", c.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (ult && Date.now() - new Date(ult.created_at).getTime() < 6 * 86400000) continue;
    // stesso blocco del pulsante: niente radar doppi se il giro parte due volte o uno è già in corso
    const { data: libero, error: eLock } = await admin.rpc("radar_prenota", { p_centro_id: c.id, p_minuti: 20 });
    if (!eLock && libero !== true) continue;
    if (await avviaRadar(c.id, null)) avviati++;
  }
  return { statusCode: 200, body: JSON.stringify({ avviati }) };
};
