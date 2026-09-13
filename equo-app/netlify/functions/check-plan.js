// SCHELETRO — non ancora collegato alla UI.
// Verifica lato server se un utente ha il piano Pro attivo.
// Env richiesta: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { userId } = JSON.parse(event.body || "{}");
    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ error: "userId mancante" }) };
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase.from("profiles").select("plan").eq("id", userId).maybeSingle();
    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ plan: data?.plan || "free" }),
    };
  } catch (e) {
    console.error("Errore check-plan:", e);
    return { statusCode: 500, body: JSON.stringify({ error: "Errore interno" }) };
  }
};
