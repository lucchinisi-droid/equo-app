// Crea una Stripe Checkout Session per l'abbonamento Premium (mensile o annuale).
// I lifetime NON passano da qui: hanno un Payment Link diretto con limite posti,
// collegato lato client.
//
// Env richieste su Netlify: STRIPE_SECRET_KEY, STRIPE_PRICE_PROP_MENSILE,
// STRIPE_PRICE_PROP_ANNUALE, STRIPE_PRICE_PRO_MENSILE, STRIPE_PRICE_PRO_ANNUALE

const Stripe = require("stripe");

const PRICE_MAP = {
  proprietario: {
    mensile: process.env.STRIPE_PRICE_PROP_MENSILE,
    annuale: process.env.STRIPE_PRICE_PROP_ANNUALE,
  },
  professionista: {
    mensile: process.env.STRIPE_PRICE_PRO_MENSILE,
    annuale: process.env.STRIPE_PRICE_PRO_ANNUALE,
  },
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { userId, email, piano, periodo } = JSON.parse(event.body || "{}");
    if (!userId || !email) {
      return { statusCode: 400, body: JSON.stringify({ error: "userId o email mancanti" }) };
    }
    const priceId = PRICE_MAP[piano] && PRICE_MAP[piano][periodo];
    if (!priceId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Combinazione piano/periodo non valida" }) };
    }

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      client_reference_id: userId,
      allow_promotion_codes: true,
      success_url: `${process.env.URL}/?checkout=success`,
      cancel_url: `${process.env.URL}/?checkout=cancel`,
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (e) {
    console.error("Errore create-checkout:", e);
    return { statusCode: 500, body: JSON.stringify({ error: "Errore interno" }) };
  }
};
