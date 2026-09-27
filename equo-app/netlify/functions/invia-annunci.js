// ANNUNCI TRAMITE GLI AGENTI — invio push (funzione PROGRAMMATA ogni 15 minuti, vedi netlify.toml).
// Gli annunci si pubblicano da Supabase con: select pubblica_annuncio('testo', 'ruolo', 'piano', true);
// La funzione SQL mette già il messaggio nella chat dell'agente; qui si manda solo la notifica push
// agli annunci con push = true non ancora inviati. Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY.

const { createClient } = require("@supabase/supabase-js");

const TITOLI = { proprietario: "Pegasus · novità in Equo", maniscalco: "Hammer · novità in Equo" };
const LOTTO = 2000; // limite OneSignal di external_id per notifica

// testo della push: niente markdown, max 140 caratteri
const testoPush = (t) => {
  const s = String(t || "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " ").trim();
  return s.length > 140 ? s.slice(0, 137).trimEnd() + "…" : s;
};

async function inviaPush(ids, titolo, corpo) {
  const res = await fetch("https://api.onesignal.com/notifications?c=push", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}` },
    body: JSON.stringify({ app_id: process.env.ONESIGNAL_APP_ID, target_channel: "push", include_aliases: { external_id: ids },
      headings: { en: titolo }, contents: { en: corpo }, web_url: "https://app.equohub.com" }),
  });
  if (!res.ok) console.error("invia-annunci push:", await res.text());
  return res.ok;
}

exports.handler = async () => {
  if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_REST_API_KEY) return { statusCode: 200, body: "push non configurate" };
  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: annunci, error } = await admin.from("annunci").select("id, testo, ruolo").eq("push", true).is("push_inviata_il", null).order("created_at", { ascending: true }).limit(5);
  if (error) { console.error("invia-annunci:", error); return { statusCode: 500, body: "errore" }; }
  const esiti = [];
  for (const a of annunci || []) {
    // si "prenota" l'annuncio prima di inviare: un secondo giro non lo rimanda
    const { data: preso } = await admin.from("annunci").update({ push_inviata_il: new Date().toISOString() }).eq("id", a.id).is("push_inviata_il", null).select("id");
    if (!preso || !preso.length) continue;
    const { data: dest } = await admin.from("annunci_destinatari").select("user_id").eq("annuncio_id", a.id).limit(50000);
    const ids = [...new Set((dest || []).map((d) => d.user_id))];
    let ok = 0;
    for (let i = 0; i < ids.length; i += LOTTO) if (await inviaPush(ids.slice(i, i + LOTTO), TITOLI[a.ruolo] || "Novità in Equo", testoPush(a.testo))) ok++;
    esiti.push({ id: a.id, destinatari: ids.length, lotti_ok: ok });
  }
  console.log("invia-annunci", JSON.stringify(esiti));
  return { statusCode: 200, body: JSON.stringify(esiti) };
};

exports._interni = { testoPush };
