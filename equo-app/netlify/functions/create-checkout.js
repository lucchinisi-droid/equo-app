// Crea una Stripe Checkout Session per l'abbonamento Premium (mensile o annuale).
// I lifetime NON passano da qui: hanno un Payment Link diretto con limite posti,
// collegato lato client.
//
// Env richieste su Netlify: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_PRICE_PROP_MENSILE,
// STRIPE_PRICE_PROP_ANNUALE, STRIPE_PRICE_PRO_MENSILE, STRIPE_PRICE_PRO_ANNUALE

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

// ruoli professionali: chi ne ha uno (principale o secondario) paga sempre il prezzo da professionista
const RUOLI_PRO = ["maniscalco", "veterinario", "istruttore"];

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
    const { periodo } = JSON.parse(event.body || "{}");
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const user = await utenteDaToken(event, supabase);
    if (!user) return { statusCode: 401, body: JSON.stringify({ error: "Non autenticato" }) };
    const userId = user.id;
    const email = user.email;
    // niente doppio abbonamento: chi ha già Premium non può aprirne un secondo
    const { data: prof, error: eProf } = await supabase.from("profiles").select("piano, ruolo, ruolo_secondario, stripe_customer_id, stripe_subscription_id").eq("id", userId).maybeSingle();
    if (eProf) throw eProf;
    // il prezzo lo decide il server dal profilo (mai dalla vista o dal body): un account con un ruolo
    // professionale paga il prezzo da professionista e il Premium vale per entrambi i profili
    const piano = prof && (RUOLI_PRO.includes(prof.ruolo) || RUOLI_PRO.includes(prof.ruolo_secondario)) ? "professionista" : "proprietario";
    const priceId = PRICE_MAP[piano] && PRICE_MAP[piano][periodo];
    if (!priceId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Combinazione piano/periodo non valida" }) };
    }
    if (prof && prof.piano === "premium") {
      return { statusCode: 409, body: JSON.stringify({ error: "Hai già Equo Premium attivo." }) };
    }

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      // stesso cliente Stripe di prima (storico pagamenti unico), altrimenti per email
      ...(prof && prof.stripe_customer_id ? { customer: prof.stripe_customer_id } : { customer_email: email }),
      client_reference_id: userId,
      // l'utente resta scritto sull'abbonamento: serve al registro dei pagamenti per i rinnovi
      subscription_data: { metadata: { user_id: userId } },
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
