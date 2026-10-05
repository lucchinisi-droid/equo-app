// Annulla davvero l'abbonamento Stripe di un utente quando torna a Free (non solo il
// flag in app) — obbligatorio: altrimenti continuerebbe a pagare pur essendo tornato
// a Free lato Equo. Se l'utente non ha un abbonamento ricorrente attivo (es. lifetime,
// piano assegnato a mano, o demo) non c'è nulla da cancellare su Stripe: si aggiorna
// solo il piano.
//
// Env richieste: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

// Verifica il login: l'utente arriva dal token Supabase, mai dal body della richiesta.
async function utenteDaToken(event, supabase) {
  const h = event.headers.authorization || event.headers.Authorization || "";
  const token = h.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const user = await utenteDaToken(event, supabase);
    if (!user) return { statusCode: 401, body: JSON.stringify({ error: "Non autenticato" }) };
    const userId = user.id;
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
        // Abbonamento che su Stripe non esiste più (già cancellato a mano): si prosegue col downgrade.
        // Qualsiasi altro errore (rete, limiti Stripe…): NON si torna a Free, altrimenti l'utente
        // risulterebbe Free ma continuerebbe a pagare senza che nessuno se ne accorga.
        const giaChiuso = e && (e.code === "resource_missing" || /No such subscription|canceled/i.test(e.message || ""));
        if (!giaChiuso) {
          console.error("Cancellazione abbonamento Stripe non riuscita:", e.message);
          return { statusCode: 502, body: JSON.stringify({ error: "Non siamo riusciti ad annullare l'abbonamento. Il tuo piano Premium resta attivo: riprova tra poco o scrivici." }) };
        }
        console.warn("Abbonamento già chiuso su Stripe:", e.message);
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
