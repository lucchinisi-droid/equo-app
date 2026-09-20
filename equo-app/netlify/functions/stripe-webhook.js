// Riceve gli eventi Stripe e aggiorna profiles.piano di conseguenza.
// Env richieste: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = event.headers["stripe-signature"];

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error("Firma webhook non valida:", e.message);
    return { statusCode: 400, body: `Webhook Error: ${e.message}` };
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    switch (stripeEvent.type) {
      // Checkout completato per un abbonamento mensile/annuale (i lifetime non passano
      // da Checkout Session, sono Payment Link a parte, quindi non generano questo evento
      // per Equo: se in futuro venissero mossi qui, mode sarebbe "payment" non "subscription").
      case "checkout.session.completed": {
        const session = stripeEvent.data.object;
        if (session.mode === "subscription") {
          const userId = session.client_reference_id;
          if (userId) {
            await supabase
              .from("profiles")
              .update({
                piano: "premium",
                stripe_customer_id: session.customer || null,
                stripe_subscription_id: session.subscription || null,
              })
              .eq("id", userId);
          }
        }
        break;
      }
      // Rete di sicurezza: se un abbonamento viene cancellato da Stripe (mancato pagamento
      // dopo i retry, cancellazione fatta a mano dal Dashboard, ecc.) e non è passato dal
      // nostro cancel-subscription.js, riportiamo comunque l'utente a Free.
      case "customer.subscription.deleted": {
        const sub = stripeEvent.data.object;
        await supabase
          .from("profiles")
          .update({ piano: "free", stripe_subscription_id: null })
          .eq("stripe_subscription_id", sub.id);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("Errore gestione evento Stripe:", e);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
