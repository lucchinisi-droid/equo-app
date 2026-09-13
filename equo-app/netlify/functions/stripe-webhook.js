// SCHELETRO — non ancora collegato alla UI.
// Env richiesta: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

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
      case "checkout.session.completed":
      case "customer.subscription.updated": {
        const session = stripeEvent.data.object;
        const email = session.customer_email || session.customer_details?.email;
        if (email) {
          await supabase.from("profiles").update({ plan: "pro" }).eq("email", email);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = stripeEvent.data.object;
        // TODO: risalire all'utente da sub.customer e riportarlo a plan "free".
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
