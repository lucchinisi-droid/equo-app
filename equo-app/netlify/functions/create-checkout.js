// SCHELETRO — non ancora collegato alla UI, price ID da definire quando decidiamo il piano Equo Pro.
// Env richiesta: STRIPE_SECRET_KEY

const Stripe = require("stripe");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const { priceId, customerEmail } = JSON.parse(event.body || "{}");

    if (!priceId) {
      return { statusCode: 400, body: JSON.stringify({ error: "priceId mancante" }) };
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: customerEmail,
      success_url: `${process.env.URL}/?checkout=success`,
      cancel_url: `${process.env.URL}/?checkout=cancel`,
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (e) {
    console.error("Errore create-checkout:", e);
    return { statusCode: 500, body: JSON.stringify({ error: "Errore interno" }) };
  }
};
