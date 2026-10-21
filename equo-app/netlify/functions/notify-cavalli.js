// Avvisi push del codice cavallo (tabella notifiche_cavalli, scritta dal database):
// proposte di cavalli dal maniscalco e "Da confermare" quando cambiano nome, razza o data di nascita.
// Chiamata dal webhook Supabase "notify-cavalli" (stesso segreto CHAT_WEBHOOK_SECRET della chat).
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY,
//      ONESIGNAL_SCUDERIA_APP_ID / ONESIGNAL_SCUDERIA_REST_API_KEY (staff delle scuderie), CHAT_WEBHOOK_SECRET.
const { createClient } = require("@supabase/supabase-js");
const ONESIGNAL_URL = "https://api.onesignal.com/notifications?c=push";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  const secret = event.headers["x-webhook-secret"] || event.headers["X-Webhook-Secret"];
  if (!process.env.CHAT_WEBHOOK_SECRET || secret !== process.env.CHAT_WEBHOOK_SECRET) return { statusCode: 401, body: "Non autorizzato" };
  let payload;
  try { payload = JSON.parse(event.body || "{}"); } catch (e) { return { statusCode: 400, body: "Payload non valido" }; }
  const { table, record, type } = payload;
  if (type !== "INSERT" || table !== "notifiche_cavalli" || !record || !record.user_id) {
    return { statusCode: 200, body: JSON.stringify({ success: true, esito: "ignorato" }) };
  }
  try {
    const push = await inviaPush([record.user_id], record.titolo, record.testo, record.app === "scuderia" ? "scuderia" : "equo");
    return { statusCode: 200, body: JSON.stringify({ success: true, esito: push }) };
  } catch (err) {
    console.error("notify-cavalli:", err);
    return { statusCode: 200, body: JSON.stringify({ success: false, esito: "errore_interno: " + (err.message || String(err)) }) };
  }
};

async function inviaPush(externalIds, titolo, corpo, app = "equo") {
  // modalita Lavoro del maniscalco: chi e al lavoro non riceve la notifica (la trova nell'app)
  try {
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await sb.from("profiles").select("id").in("id", externalIds).gt("lavoro_fino", new Date().toISOString());
    if (!error && data && data.length) {
      const alLavoro = new Set(data.map((r) => r.id));
      externalIds = externalIds.filter((id) => !alLavoro.has(id));
      if (externalIds.length === 0) return { attempted: false, motivo: "al_lavoro" };
    }
  } catch (e) { console.warn("lavoro_fino:", e.message); }
  const scuderia = app === "scuderia" && process.env.ONESIGNAL_SCUDERIA_APP_ID && process.env.ONESIGNAL_SCUDERIA_REST_API_KEY;
  const appId = scuderia ? process.env.ONESIGNAL_SCUDERIA_APP_ID : process.env.ONESIGNAL_APP_ID;
  const restKey = scuderia ? process.env.ONESIGNAL_SCUDERIA_REST_API_KEY : process.env.ONESIGNAL_REST_API_KEY;
  const res = await fetch(ONESIGNAL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Key ${restKey}` },
    body: JSON.stringify({
      app_id: appId,
      target_channel: "push",
      include_aliases: { external_id: externalIds },
      headings: { en: titolo },
      contents: { en: String(corpo || "").slice(0, 140) || "Novita sui tuoi cavalli" },
      url: app === "scuderia" ? "https://scuderia.equohub.com/" : "https://app.equohub.com/",
    }),
  });
  const testo = await res.text();
  if (!res.ok) console.error("Errore OneSignal:", testo);
  let parsed; try { parsed = JSON.parse(testo); } catch (e) { parsed = testo; }
  return { attempted: true, http_status: res.status, onesignal: parsed };
}
