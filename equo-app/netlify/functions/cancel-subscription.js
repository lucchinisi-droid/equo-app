// Annulla davvero l'abbonamento Stripe di un utente quando torna a Free (non solo il
// flag in app) — obbligatorio: altrimenti continuerebbe a pagare pur essendo tornato
// a Free lato Equo. Se l'utente non ha un abbonamento ricorrente attivo (es. lifetime,
// piano assegnato a mano, o demo) non c'è nulla da cancellare su Stripe: si aggiorna
// solo il piano.
//
// Env richieste: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const Stripe = require("stripe");
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
    const { data: profile, error: readError } = await supabase
      .from("profiles")
      .select("stripe_subscription_id")
      .eq("id", userId)
      .maybeSingle();
    if (readError) throw readError;

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    if (profile && profile.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(profile.stripe_subscription_id);
      } catch (e) {
        // Se l'abbonamento su Stripe non esiste più (es. già cancellato manualmente),
        // non blocchiamo comunque il downgrade lato Equo.
        console.warn("Cancellazione abbonamento Stripe:", e.message);
      }
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ piano: "free", stripe_subscription_id: null })
      .eq("id", userId);
    if (updateError) throw updateError;

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error("Errore cancel-subscription:", e);
    return { statusCode: 500, body: JSON.stringify({ error: "Errore interno" }) };
  }
};
