// Passaggio da Premium PROPRIETARIO a Premium PROFESSIONISTA pagando solo la differenza.
// - Mensile / annuale: Stripe cambia il prezzo dello STESSO abbonamento (stessa data di rinnovo), calcola
//   il credito della parte non usata e addebita subito la differenza (proration "always_invoice").
//   Con payment_behavior "pending_if_incomplete" il cambio si applica SOLO se il pagamento riesce.
// - Lifetime: link di pagamento «differenza lifetime» (50 €), env STRIPE_LINK_UPGRADE_LIFETIME.
// Il livello in profiles lo aggiorna il webhook (customer.subscription.updated / checkout.session.completed).
//
// POST { azione: "anteprima" }  → { tipo, importo_cent, prossimo_rinnovo, nuovo_prezzo_cent, periodo } oppure { tipo: "lifetime", link }
// POST { azione: "conferma", proration_date } → { ok } oppure { serve_pagamento, url }
//
// Env: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_PRICE_PRO_MENSILE, STRIPE_PRICE_PRO_ANNUALE,
//      STRIPE_LINK_UPGRADE_LIFETIME (facoltativa: senza, il lifetime si passa scrivendo a Equo)

const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const RUOLI_PRO = ["maniscalco", "veterinario", "istruttore"];

async function utenteDaToken(event, supabase) {
  const h = event.headers.authorization || event.headers.Authorization || "";
  const token = h.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}
const json = (code, obj) => ({ statusCode: code, body: JSON.stringify(obj) });

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  try {
    const { azione, proration_date } = JSON.parse(event.body || "{}");
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const user = await utenteDaToken(event, supabase);
    if (!user) return json(401, { error: "Non autenticato" });

    const { data: prof, error: eProf } = await supabase.from("profiles")
      .select("piano, premium_livello, ruolo, ruolo_secondario, stripe_customer_id, stripe_subscription_id").eq("id", user.id).maybeSingle();
    if (eProf) throw eProf;
    if (!prof || prof.piano !== "premium" || prof.premium_livello !== "proprietario") return json(409, { error: "Il passaggio serve solo a chi ha il Premium da proprietario." });
    if (![prof.ruolo, prof.ruolo_secondario].some((r) => RUOLI_PRO.includes(r))) return json(409, { error: "Prima aggiungi il profilo da professionista." });

    // LIFETIME: si paga la differenza con il link apposito
    if (!prof.stripe_subscription_id) {
      const link = process.env.STRIPE_LINK_UPGRADE_LIFETIME;
      if (!link) return json(200, { tipo: "lifetime", link: null, importo_cent: 5000 });
      const u = new URL(link);
      u.searchParams.set("client_reference_id", user.id);
      if (user.email) u.searchParams.set("prefilled_email", user.email);
      return json(200, { tipo: "lifetime", link: u.toString(), importo_cent: 5000 });
    }

    // ABBONAMENTO: stesso periodo, prezzo da professionista
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const sub = await stripe.subscriptions.retrieve(prof.stripe_subscription_id);
    if (!sub || !["active", "trialing"].includes(sub.status)) return json(409, { error: "L'abbonamento non è attivo: controlla il pagamento e riprova." });
    if (sub.pending_update) return json(409, { error: "C'è già un passaggio in attesa di pagamento.", url: null });
    const item = sub.items.data[0];
    const periodo = item.price.recurring && item.price.recurring.interval === "year" ? "annuale" : "mensile";
    const nuovoPrezzo = periodo === "annuale" ? process.env.STRIPE_PRICE_PRO_ANNUALE : process.env.STRIPE_PRICE_PRO_MENSILE;
    if (!nuovoPrezzo) throw new Error("Prezzo professionista non configurato");
    if (item.price.id === nuovoPrezzo) return json(409, { error: "Hai già il prezzo da professionista." });

    if (azione === "anteprima") {
      const data = Math.floor(Date.now() / 1000);
      const anteprima = await stripe.invoices.retrieveUpcoming({
        customer: sub.customer, subscription: sub.id,
        subscription_items: [{ id: item.id, price: nuovoPrezzo }],
        subscription_proration_behavior: "always_invoice",
        subscription_proration_date: data,
      });
      // solo le righe di conguaglio = quanto viene addebitato adesso
      const importo = anteprima.lines.data.filter((l) => l.proration).reduce((t, l) => t + l.amount, 0);
      const prezzo = await stripe.prices.retrieve(nuovoPrezzo);
      return json(200, { tipo: "abbonamento", periodo, importo_cent: Math.max(0, importo), proration_date: data,
        prossimo_rinnovo: sub.current_period_end, nuovo_prezzo_cent: prezzo.unit_amount });
    }

    if (azione === "conferma") {
      const agg = await stripe.subscriptions.update(sub.id, {
        items: [{ id: item.id, price: nuovoPrezzo }],
        proration_behavior: "always_invoice",
        ...(proration_date ? { proration_date: Number(proration_date) } : {}),
        payment_behavior: "pending_if_incomplete",   // se il pagamento non riesce, l'abbonamento resta com'era
        expand: ["latest_invoice"],
      });
      if (agg.pending_update) {
        // pagamento da completare (es. verifica della banca): pagina sicura di Stripe; il cambio si applica dopo il pagamento
        const inv = agg.latest_invoice;
        return json(200, { serve_pagamento: true, url: inv && inv.hosted_invoice_url ? inv.hosted_invoice_url : null });
      }
      return json(200, { ok: true });
    }
    return json(400, { error: "Azione non valida" });
  } catch (e) {
    console.error("Errore upgrade-premium:", e && e.message ? e.message : e);
    return json(500, { error: "Non sono riuscito a completare il passaggio. Prima di riprovare, riapri l'app tra qualche minuto e controlla se il Premium professionista è già attivo." });
  }
};
