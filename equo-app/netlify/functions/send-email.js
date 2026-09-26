// Invio email transazionali/reminder via Resend.
// Env richiesta su Netlify: RESEND_API_KEY, INTERNAL_EMAIL_SECRET
//
// BLOCCATA il 27/09: prima accettava richieste da chiunque (chiunque poteva mandare
// email a nome di Equo). Ora risponde solo se l'header "x-internal-secret" coincide con
// la variabile INTERNAL_EMAIL_SECRET su Netlify; se la variabile non esiste, è disattivata.
// Non è usata dall'app. Le email automatiche passano da funzioni dedicate (es. notify-certificazione.js).

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }
  const secret = event.headers["x-internal-secret"] || event.headers["X-Internal-Secret"];
  if (!process.env.INTERNAL_EMAIL_SECRET || secret !== process.env.INTERNAL_EMAIL_SECRET) {
    return { statusCode: 401, body: "Non autorizzato" };
  }

  try {
    const { to, subject, html } = JSON.parse(event.body || "{}");
    if (!to || !subject || !html) {
      return { statusCode: 400, body: JSON.stringify({ error: "Parametri mancanti" }) };
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Equo <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Errore Resend:", err);
      return { statusCode: 500, body: JSON.stringify({ error: "Errore invio email" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (e) {
    console.error("Errore send-email:", e);
    return { statusCode: 500, body: JSON.stringify({ error: "Errore interno" }) };
  }
};
