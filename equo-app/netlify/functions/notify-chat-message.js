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
//
// NOTA DIAGNOSTICA (24/09): la risposta include sempre un campo "esito" che
// spiega cosa è successo (nessun destinatario, risposta OneSignal, ecc.).
// Si vede direttamente da Supabase con:
//   select created, status_code, content from net._http_response order by created desc limit 10;

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
    return { statusCode: 200, body: JSON.stringify({ success: true, esito: "ignorato_non_insert" }) };
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    let esito;
    if (table === "chat_messaggi") {
      esito = await gestisciChatScuderia(supabase, record);
    } else if (table === "messaggi_proprietari") {
      esito = await gestisciChatProprietari(supabase, record);
    } else if (table === "messaggi_mascalcia") {
      esito = await gestisciChatMascalcia(supabase, record);
    } else {
      return { statusCode: 200, body: JSON.stringify({ success: true, esito: "tabella_non_gestita" }) };
    }
    return { statusCode: 200, body: JSON.stringify({ success: true, esito }) };
  } catch (err) {
    console.error("Errore notify-chat-message:", err);
    // 200 anche in errore: non vogliamo che Supabase continui a ritentare
    // all'infinito un webhook che fallisce sempre per lo stesso motivo.
    return { statusCode: 200, body: JSON.stringify({ success: false, esito: "errore_interno: " + (err.message || String(err)) }) };
  }
};

// Chat scuderia <-> proprietario/professionista (tabella chat_messaggi).
async function gestisciChatScuderia(supabase, record) {
  const { membro_id, mittente_user_id, testo, centro_id } = record;
  if (!membro_id || !mittente_user_id) return "dati_mancanti_nel_record";

  const { data: membro } = await supabase
    .from("scuderia_membri")
    .select("user_id, nome_visualizzato, centro_id")
    .eq("id", membro_id)
    .maybeSingle();
  if (!membro) return "membro_non_trovato";

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
    if (destinatari.length === 0) return "cliente_a_staff_nessuno_staff_collegato";
    const push = await inviaPush(destinatari, `Nuovo messaggio da ${membro.nome_visualizzato || "un cliente"}`, testo);
    return "cliente_a_staff_dest=" + destinatari.length + " push=" + JSON.stringify(push);
  } else {
    // Il messaggio arriva dallo staff: notifica il cliente/professionista.
    if (!membro.user_id) return "staff_a_cliente_membro_senza_user_id";
    const { data: centro } = await supabase.from("centri").select("nome").eq("id", centro_id).maybeSingle();
    const push = await inviaPush([membro.user_id], `Nuovo messaggio da ${centro?.nome || "la tua scuderia"}`, testo);
    return "staff_a_cliente_dest=" + membro.user_id + " push=" + JSON.stringify(push);
  }
}

// Chat proprietario <-> proprietario/professionista (tabella messaggi_proprietari).
async function gestisciChatProprietari(supabase, record) {
  const { conversazione_id, mittente_id, tipo, testo, media_url } = record;
  if (!conversazione_id || !mittente_id) return "dati_mancanti_nel_record";

  const { data: conv } = await supabase
    .from("conversazioni_proprietari")
    .select("proprietario_a_id, proprietario_b_id")
    .eq("id", conversazione_id)
    .maybeSingle();
  if (!conv) return "conversazione_non_trovata";

  const destinatarioId = mittente_id === conv.proprietario_a_id ? conv.proprietario_b_id : conv.proprietario_a_id;
  if (!destinatarioId) return "destinatario_non_trovato";

  const { data: mittente } = await supabase.from("profiles").select("full_name").eq("id", mittente_id).maybeSingle();
  const corpo = tipo === "testo" ? testo : media_url ? "Ha inviato un allegato" : (testo || "Nuovo messaggio");
  const push = await inviaPush([destinatarioId], `Nuovo messaggio da ${mittente?.full_name || "un utente Equo"}`, corpo);
  return "dest=" + destinatarioId + " push=" + JSON.stringify(push);
}

// Chat maniscalco <-> suo cliente (tabella messaggi_mascalcia, modulo Mascalcia).
// Il cliente ha una chat solo se ha collegato il suo account Equo App
// (clienti_mascalcia.cliente_user_id valorizzato); altrimenti non riceve push
// (non ha un account a cui inviarle).
async function gestisciChatMascalcia(supabase, record) {
  const { cliente_mascalcia_id, maniscalco_id, mittente_tipo, tipo, testo, audio_url, file_nome } = record;
  if (!cliente_mascalcia_id || !maniscalco_id) return "dati_mancanti_nel_record";

  const { data: cliente } = await supabase
    .from("clienti_mascalcia")
    .select("nome, cliente_user_id")
    .eq("id", cliente_mascalcia_id)
    .maybeSingle();
  if (!cliente) return "cliente_non_trovato";

  const corpo = tipo === "testo" ? testo
    : tipo === "documento" ? "📄 " + (file_nome || "Documento PDF")
    : audio_url ? "Ha inviato un vocale" : (testo || "Nuovo messaggio");

  if (mittente_tipo === "maniscalco") {
    if (!cliente.cliente_user_id) return "maniscalco_a_cliente_non_collegato"; // il cliente non usa Equo App: nessuna push possibile
    const push = await inviaPush([cliente.cliente_user_id], "Nuovo messaggio dal tuo maniscalco", corpo);
    return "maniscalco_a_cliente_dest=" + cliente.cliente_user_id + " push=" + JSON.stringify(push);
  } else {
    const push = await inviaPush([maniscalco_id], `Nuovo messaggio da ${cliente.nome || "un cliente"}`, corpo);
    return "cliente_a_maniscalco_dest=" + maniscalco_id + " push=" + JSON.stringify(push);
  }
}

async function inviaPush(externalIds, titolo, corpo) {
  if (!externalIds || externalIds.length === 0) return { attempted: false, motivo: "nessun_destinatario" };
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
  const bodyText = await res.text();
  if (!res.ok) {
    console.error("Errore invio push OneSignal:", bodyText);
  }
  let parsed;
  try { parsed = JSON.parse(bodyText); } catch (e) { parsed = bodyText; }
  return { attempted: true, http_status: res.status, onesignal: parsed };
}
