// Riceve gli eventi Stripe e aggiorna profiles.piano di conseguenza.
// Env richieste: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Regola: se il salvataggio su Supabase fallisce rispondiamo 500, così Stripe ritenta l'evento
// (fino a 3 giorni). Gli aggiornamenti sono idempotenti: ripetere lo stesso evento non fa danni.

const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

// Cancella un abbonamento rimasto "orfano" (passaggio a lifetime o nuovo abbonamento).
// Se su Stripe non esiste più va bene così; ogni altro errore fa ritentare l'evento.
async function cancellaAbbonamento(stripe, subId) {
  if (!subId) return;
  try {
    await stripe.subscriptions.cancel(subId);
  } catch (e) {
    if (e && (e.code === "resource_missing" || /No such subscription|canceled/i.test(e.message || ""))) return;
    throw e;
  }
}

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
  const aggiorna = async (campi, colonna, valore) => {
    const { data, error } = await supabase.from("profiles").update(campi).eq(colonna, valore).select("id");
    if (error) throw new Error("Supabase: " + error.message);
    return data || [];
  };

  try {
    switch (stripeEvent.type) {
      // Checkout completato: abbonamento mensile/annuale (mode "subscription") oppure
      // lifetime pagato da Payment Link (mode "payment", utente da client_reference_id).
      case "checkout.session.completed": {
        const session = stripeEvent.data.object;
        const userId = session.client_reference_id;
        if (!userId) { console.warn("checkout senza client_reference_id:", session.id); break; }
        const { data: prof, error: eProf } = await supabase.from("profiles").select("stripe_subscription_id").eq("id", userId).maybeSingle();
        if (eProf) throw new Error("Supabase: " + eProf.message);
        if (!prof) { console.warn("checkout per utente inesistente:", userId); break; }

        // Lifetime: Payment Link (mode "payment"); l'app aggiunge ?client_reference_id=<userId> al link.
        if (session.mode === "payment" && session.payment_status === "paid") {
          // aveva un abbonamento mensile/annuale: lo chiudiamo, altrimenti continuerebbe a pagare
          await cancellaAbbonamento(stripe, prof.stripe_subscription_id);
          await aggiorna({ piano: "premium", stripe_customer_id: session.customer || null, stripe_subscription_id: null }, "id", userId);
          break;
        }
        if (session.mode === "subscription") {
          // un abbonamento precedente diverso dal nuovo non deve restare attivo
          if (prof.stripe_subscription_id && prof.stripe_subscription_id !== session.subscription) {
            await cancellaAbbonamento(stripe, prof.stripe_subscription_id);
          }
          await aggiorna({ piano: "premium", stripe_customer_id: session.customer || null, stripe_subscription_id: session.subscription || null }, "id", userId);
        }
        break;
      }
      // Rete di sicurezza: se un abbonamento viene cancellato da Stripe (mancato pagamento
      // dopo i retry, cancellazione fatta a mano dal Dashboard, ecc.) e non è passato dal
      // nostro cancel-subscription.js, riportiamo comunque l'utente a Free.
      case "customer.subscription.deleted": {
        const sub = stripeEvent.data.object;
        await aggiorna({ piano: "free", stripe_subscription_id: null }, "stripe_subscription_id", sub.id);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("Errore gestione evento Stripe (Stripe ritenterà):", stripeEvent.type, e.message || e);
    return { statusCode: 500, body: JSON.stringify({ error: "Salvataggio non riuscito, ritentare" }) };
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
