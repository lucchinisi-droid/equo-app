// Riceve il webhook di Supabase a ogni nuovo messaggio (chat_messaggi o
// messaggi_proprietari) e invia una notifica push OneSignal al destinatario
// giusto. La REST API Key OneSignal resta solo qui, mai nel codice client.
//
// Env richieste su Netlify (Site settings → Environment variables):
// - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (già usate da stripe-webhook.js)
// - ONESIGNAL_APP_ID
// - ONESIGNAL_REST_API_KEY
// - CHAT_WEBHOOK_SECRET   (stringa a piacere, la stessa da mettere nell'header
//   custom del webhook Supabase, per evitare che chiunque possa chiamare
//   questa function e far partire notifiche a caso)

const { createClient } = require("@supabase/supabase-js");

const ONESIGNAL_URL = "https://api.onesignal.com/notifications?c=push";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  // Verifica il segreto condiviso con il webhook Supabase.
  const secret = event.headers["x-webhook-secret"] || event.headers["X-Webhook-Secret"];
  if (!process.env.CHAT_WEBHOOK_SECRET || secret !== process.env.CHAT_WEBHOOK_SECRET) {
    return { statusCode: 401, body: "Non autorizzato" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: "Payload non valido" };
  }

  const { table, record, type } = payload;
  if (type !== "INSERT" || !record) {
    return { statusCode: 200, body: "Ignorato (non è un nuovo messaggio)." };
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    if (table === "chat_messaggi") {
      await gestisciChatScuderia(supabase, record);
    } else if (table === "messaggi_proprietari") {
      await gestisciChatProprietari(supabase, record);
    } else {
      return { statusCode: 200, body: "Tabella non gestita." };
    }
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("Errore notify-chat-message:", err);
    // 200 anche in errore: non vogliamo che Supabase continui a ritentare
    // all'infinito un webhook che fallisce sempre per lo stesso motivo.
    return { statusCode: 200, body: JSON.stringify({ error: "Errore interno, vedi log." }) };
  }
};

// Chat scuderia <-> proprietario/professionista (tabella chat_messaggi).
async function gestisciChatScuderia(supabase, record) {
  const { membro_id, mittente_user_id, testo, centro_id } = record;
  if (!membro_id || !mittente_user_id) return;

  const { data: membro } = await supabase
    .from("scuderia_membri")
    .select("user_id, nome_visualizzato, centro_id")
    .eq("id", membro_id)
    .maybeSingle();
  if (!membro) return;

  if (mittente_user_id === membro.user_id) {
    // Il messaggio arriva dal cliente: notifica tutto lo staff del centro
    // (chiunque tra loro apra la chat la segnerà come letta per tutti).
    const { data: staff } = await supabase
      .from("scuderia_membri")
      .select("user_id")
      .eq("centro_id", centro_id)
      .neq("ruolo", "proprietario")
      .not("user_id", "is", null);
    const destinatari = (staff || []).map((s) => s.user_id).filter((id) => id && id !== mittente_user_id);
    if (destinatari.length === 0) return;
    await inviaPush(destinatari, `Nuovo messaggio da ${membro.nome_visualizzato || "un cliente"}`, testo);
  } else {
    // Il messaggio arriva dallo staff: notifica il cliente/professionista.
    if (!membro.user_id) return;
    const { data: centro } = await supabase.from("centri").select("nome").eq("id", centro_id).maybeSingle();
    await inviaPush([membro.user_id], `Nuovo messaggio da ${centro?.nome || "la tua scuderia"}`, testo);
  }
}

// Chat proprietario <-> proprietario/professionista (tabella messaggi_proprietari).
async function gestisciChatProprietari(supabase, record) {
  const { conversazione_id, mittente_id, tipo, testo, media_url } = record;
  if (!conversazione_id || !mittente_id) return;

  const { data: conv } = await supabase
    .from("conversazioni_proprietari")
    .select("proprietario_a_id, proprietario_b_id")
    .eq("id", conversazione_id)
    .maybeSingle();
  if (!conv) return;

  const destinatarioId = mittente_id === conv.proprietario_a_id ? conv.proprietario_b_id : conv.proprietario_a_id;
  if (!destinatarioId) return;

  const { data: mittente } = await supabase.from("profiles").select("full_name").eq("id", mittente_id).maybeSingle();
  const corpo = tipo === "testo" ? testo : media_url ? "Ha inviato un allegato" : (testo || "Nuovo messaggio");
  await inviaPush([destinatarioId], `Nuovo messaggio da ${mittente?.full_name || "un utente Equo"}`, corpo);
}

async function inviaPush(externalIds, titolo, corpo) {
  if (!externalIds || externalIds.length === 0) return;
  const testoTroncato = (corpo || "").slice(0, 140);
  const res = await fetch(ONESIGNAL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: process.env.ONESIGNAL_APP_ID,
      target_channel: "push",
      include_aliases: { external_id: externalIds },
      headings: { en: titolo },
      contents: { en: testoTroncato || "Nuovo messaggio" },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("Errore invio push OneSignal:", err);
  }
}
