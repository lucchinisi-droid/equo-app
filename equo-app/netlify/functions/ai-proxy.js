// Proxy verso Claude API per l'assistente equestre in-app.
// Env richiesta su Netlify: ANTHROPIC_API_KEY

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { message } = JSON.parse(event.body || "{}");
    if (!message || typeof message !== "string") {
      return { statusCode: 400, body: JSON.stringify({ error: "Messaggio mancante" }) };
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 500,
        system:
          "Sei l'assistente equestre di Equo, un esperto virtuale di gestione e cura del cavallo. " +
          "Rispondi in italiano, in modo chiaro e pratico. Non sostituisci un veterinario: se il dubbio " +
          "riguarda un problema di salute concreto, consiglia di contattarne uno.",
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Errore Claude API:", data);
      return { statusCode: 500, body: JSON.stringify({ error: "Errore assistente AI" }) };
    }

    const reply = data.content?.[0]?.text || "Non sono riuscito a rispondere, riprova.";
    return { statusCode: 200, body: JSON.stringify({ reply }) };
  } catch (e) {
    console.error("Errore ai-proxy:", e);
    return { statusCode: 500, body: JSON.stringify({ error: "Errore interno" }) };
  }
};
