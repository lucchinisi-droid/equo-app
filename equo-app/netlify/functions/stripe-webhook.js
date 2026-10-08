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

  // livello del Premium dal PREZZO DI LISTINO pagato (non dallo sconto): da professionista vale per entrambi i profili
  const PREZZI_PRO = [process.env.STRIPE_PRICE_PRO_MENSILE, process.env.STRIPE_PRICE_PRO_ANNUALE].filter(Boolean);
  const livelloAbbonamento = (sub) => {
    const prezzo = sub && sub.items && sub.items.data && sub.items.data[0] && sub.items.data[0].price;
    return prezzo && PREZZI_PRO.includes(prezzo.id) ? "professionista" : "proprietario";
  };
  // registro dei pagamenti: una riga per pagamento, mai due per lo stesso (chiave Stripe unica)
  const registra = async (riga, chiave) => {
    const { error } = await supabase.from("pagamenti").upsert(riga, { onConflict: chiave, ignoreDuplicates: true });
    if (error) throw new Error("Supabase registro pagamenti: " + error.message);
  };
  const UPGRADE_LIFETIME_CENT = 5000;   // link «differenza lifetime»: 99 € − 49 €
  const PRO_LIFETIME_CENT = 9900;

  try {
    switch (stripeEvent.type) {
      // Checkout completato: abbonamento mensile/annuale (mode "subscription") oppure
      // lifetime pagato da Payment Link (mode "payment", utente da client_reference_id).
      case "checkout.session.completed": {
        const session = stripeEvent.data.object;
        const userId = session.client_reference_id;
        if (!userId) { console.warn("checkout senza client_reference_id:", session.id); break; }
        const { data: prof, error: eProf } = await supabase.from("profiles").select("piano, premium_livello, stripe_subscription_id, stripe_customer_id").eq("id", userId).maybeSingle();
        if (eProf) throw new Error("Supabase: " + eProf.message);
        if (!prof) { console.warn("checkout per utente inesistente:", userId); break; }

        // Lifetime: Payment Link (mode "payment"); l'app aggiunge ?client_reference_id=<userId> al link.
        if (session.mode === "payment" && session.payment_status === "paid") {
          const righe = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 });
          const listino = Math.max(0, ...((righe && righe.data) || []).map((r) => Number(r.price && r.price.unit_amount) || 0));
          let livello = "proprietario", tipo = "lifetime";
          if (listino >= PRO_LIFETIME_CENT) livello = "professionista";
          else if (listino === UPGRADE_LIFETIME_CENT) {
            tipo = "upgrade";
            // la differenza vale solo per chi ha già il lifetime da proprietario (senza abbonamento in corso)
            if (prof.piano === "premium" && prof.premium_livello === "proprietario" && !prof.stripe_subscription_id) livello = "professionista";
            else console.warn("ATTENZIONE differenza lifetime pagata da chi non ha il lifetime proprietario:", userId, session.id);
          }
          // registro dei pagamenti (numero cronologico assegnato dal database); ripetere l'evento non crea doppioni
          await registra({
            categoria: tipo === "upgrade" ? "professionista" : livello,
            tipo: tipo === "upgrade" ? "passaggio" : "lifetime",
            evento: tipo === "upgrade" ? "passaggio" : "acquisto",
            user_id: userId, importo_cent: Number(session.amount_total) || 0, listino_cent: listino, valuta: session.currency || "eur",
            stripe_payment_intent: session.payment_intent || null, stripe_session_id: session.id,
            note: tipo === "upgrade" && livello !== "professionista" ? "differenza pagata senza lifetime proprietario: attivato solo il livello proprietario" : null,
          }, session.payment_intent ? "stripe_payment_intent" : "stripe_session_id");
          // aveva un abbonamento mensile/annuale: lo chiudiamo, altrimenti continuerebbe a pagare
          await cancellaAbbonamento(stripe, prof.stripe_subscription_id);
          await aggiorna({ piano: "premium", premium_livello: livello, stripe_customer_id: session.customer || prof.stripe_customer_id || null, stripe_subscription_id: null }, "id", userId);
          break;
        }
        if (session.mode === "subscription") {
          // un abbonamento precedente diverso dal nuovo non deve restare attivo
          if (prof.stripe_subscription_id && prof.stripe_subscription_id !== session.subscription) {
            await cancellaAbbonamento(stripe, prof.stripe_subscription_id);
          }
          const sub = session.subscription ? await stripe.subscriptions.retrieve(session.subscription) : null;
          await aggiorna({ piano: "premium", premium_livello: livelloAbbonamento(sub), stripe_customer_id: session.customer || null, stripe_subscription_id: session.subscription || null }, "id", userId);
        }
        break;
      }
      // Fattura pagata di un abbonamento: primo pagamento, rinnovo o differenza del passaggio a professionista
      case "invoice.paid": {
        const inv = stripeEvent.data.object;
        if (!inv.subscription || !(Number(inv.amount_paid) > 0)) break;
        const righe = (inv.lines && inv.lines.data) || [];
        const riga = righe.find((l) => !l.proration && l.price) || righe.find((l) => l.price) || {};
        const prezzo = riga.price || {};
        const categoria = PREZZI_PRO.includes(prezzo.id) ? "professionista" : "proprietario";
        const periodo = prezzo.recurring && prezzo.recurring.interval === "year" ? "annuale" : "mensile";
        const motivo = inv.billing_reason;
        const evento = motivo === "subscription_create" ? "acquisto" : motivo === "subscription_update" ? "passaggio" : "rinnovo";
        // utente: dai metadati dell'abbonamento (messi al checkout), altrimenti dal profilo collegato
        let userId = (inv.subscription_details && inv.subscription_details.metadata && inv.subscription_details.metadata.user_id) || null;
        if (!userId) {
          const { data: p } = await supabase.from("profiles").select("id").or(`stripe_subscription_id.eq.${inv.subscription},stripe_customer_id.eq.${inv.customer}`).limit(1).maybeSingle();
          userId = p && p.id;
        }
        await registra({
          categoria: evento === "passaggio" ? "professionista" : categoria,
          tipo: evento === "passaggio" ? "passaggio" : periodo,
          evento, user_id: userId || null,
          importo_cent: Number(inv.amount_paid) || 0, listino_cent: evento === "passaggio" ? null : (Number(prezzo.unit_amount) || null), valuta: inv.currency || "eur",
          stripe_subscription_id: inv.subscription, stripe_invoice_id: inv.id,
          stripe_payment_intent: typeof inv.payment_intent === "string" ? inv.payment_intent : (inv.payment_intent && inv.payment_intent.id) || null,
          pagato_il: new Date(((inv.status_transitions && inv.status_transitions.paid_at) || inv.created) * 1000).toISOString(),
        }, "stripe_invoice_id");
        break;
      }
      // Abbonamento cambiato: passaggio a Premium professionista (pagato) oppure stato non più valido
      case "customer.subscription.updated": {
        const sub = stripeEvent.data.object;
        if (["unpaid", "canceled", "incomplete_expired", "paused"].includes(sub.status)) {
          await aggiorna({ piano: "free", premium_livello: null, stripe_subscription_id: null }, "stripe_subscription_id", sub.id);
        } else if (["active", "trialing", "past_due"].includes(sub.status)) {
          // con un cambio in attesa di pagamento (pending_update) i prezzi restano quelli vecchi: livello invariato
          await aggiorna({ premium_livello: livelloAbbonamento(sub) }, "stripe_subscription_id", sub.id);
        }
        break;
      }
      // Rete di sicurezza: se un abbonamento viene cancellato da Stripe (mancato pagamento
      // dopo i retry, cancellazione fatta a mano dal Dashboard, ecc.) e non è passato dal
      // nostro cancel-subscription.js, riportiamo comunque l'utente a Free.
      case "customer.subscription.deleted": {
        const sub = stripeEvent.data.object;
        await aggiorna({ piano: "free", premium_livello: null, stripe_subscription_id: null }, "stripe_subscription_id", sub.id);
        break;
      }
      // Rimborso totale di un pagamento una tantum: si toglie ciò che era stato comprato
      case "charge.refunded": {
        const ch = stripeEvent.data.object;
        if (!ch.refunded) { console.warn("Rimborso parziale: controlla a mano", ch.id); break; }   // solo rimborsi totali
        let q = supabase.from("pagamenti").select("id, user_id, tipo, stripe_subscription_id");
        q = ch.payment_intent ? q.eq("stripe_payment_intent", ch.payment_intent) : q.eq("stripe_invoice_id", ch.invoice || "-");
        const { data: pag } = await q.maybeSingle();
        if (!pag) { console.warn("Rimborso di un pagamento non presente nel registro: controlla a mano", ch.id, ch.customer); break; }
        await supabase.from("pagamenti").update({ stato: "rimborsato", rimborsato_il: new Date().toISOString() }).eq("id", pag.id);
        // abbonamenti: il piano non si tocca in automatico (decidi tu); pagamenti una tantum: si toglie ciò che era stato comprato
        if (pag.stripe_subscription_id) { console.warn("Rimborso di un abbonamento: piano invariato, controlla a mano", ch.id); break; }
        if (pag.tipo === "passaggio") await aggiorna({ premium_livello: "proprietario" }, "id", pag.user_id);
        else await aggiorna({ piano: "free", premium_livello: null }, "id", pag.user_id);
        break;
      }
      // Contestazione (chargeback): il Premium si sospende e l'eventuale abbonamento si chiude
      case "charge.dispute.created": {
        const dsp = stripeEvent.data.object;
        let userId = null;
        if (dsp.payment_intent) {
          const { data: pag } = await supabase.from("pagamenti").select("id, user_id").eq("stripe_payment_intent", dsp.payment_intent).maybeSingle();
          userId = pag && pag.user_id;
          if (pag) await supabase.from("pagamenti").update({ stato: "contestato", contestato_il: new Date().toISOString() }).eq("id", pag.id);
        }
        if (!userId && dsp.charge) {
          const ch = await stripe.charges.retrieve(typeof dsp.charge === "string" ? dsp.charge : dsp.charge.id);
          if (ch && ch.invoice) await supabase.from("pagamenti").update({ stato: "contestato", contestato_il: new Date().toISOString() }).eq("stripe_invoice_id", ch.invoice);
          if (ch && ch.customer) {
            const { data: p } = await supabase.from("profiles").select("id").eq("stripe_customer_id", ch.customer).maybeSingle();
            userId = p && p.id;
          }
        }
        console.warn("CONTESTAZIONE Stripe:", dsp.id, "utente:", userId || "non trovato", "importo:", dsp.amount);
        if (!userId) break;
        const { data: p2 } = await supabase.from("profiles").select("stripe_subscription_id").eq("id", userId).maybeSingle();
        await cancellaAbbonamento(stripe, p2 && p2.stripe_subscription_id);
        await aggiorna({ piano: "free", premium_livello: null, stripe_subscription_id: null }, "id", userId);
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
