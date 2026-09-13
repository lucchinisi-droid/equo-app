// Proxy verso Claude API per l'assistente equestre in-app.
// Env richiesta su Netlify: ANTHROPIC_API_KEY
//
// Supporta tool-use: l'AI può PROPORRE la creazione di un evento sanitario
// (vaccino/coggins/ferratura/sverminazione) a partire dalla chat. La proposta
// torna al client come "proposedEvent" e va sempre confermata dall'utente:
// questa funzione non scrive mai direttamente su Supabase.

const TOOLS = [
  {
    name: "create_health_event",
    description:
      "Propone la creazione di un evento sanitario nel libretto di un cavallo (vaccino, test Coggins, ferratura o sverminazione). " +
      "Usalo solo quando l'utente chiede esplicitamente di aggiungere/registrare/segnare un evento con una data, " +
      "oppure conferma una data che tu hai proposto. Non inventare date: se manca la data, chiedila prima di chiamare il tool.",
    input_schema: {
      type: "object",
      properties: {
        horse_name: {
          type: "string",
          description: "Nome del cavallo a cui si riferisce l'evento, tra quelli elencati nel contesto.",
        },
        type: {
          type: "string",
          enum: ["vaccino", "coggins", "ferratura", "sverminazione"],
          description: "Tipo di evento sanitario.",
        },
        date: {
          type: "string",
          description: "Data dell'evento in formato ISO YYYY-MM-DD.",
        },
        next_due_date: {
          type: "string",
          description: "Data della prossima scadenza, in formato ISO YYYY-MM-DD, se nota o deducibile (es. richiamo vaccino a 6/12 mesi). Facoltativa.",
        },
        notes: {
          type: "string",
          description: "Note aggiuntive facoltative (es. nome del veterinario/maniscalco, tipo di vaccino).",
        },
      },
      required: ["horse_name", "type", "date"],
    },
  },
];

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { message, horses, history } = JSON.parse(event.body || "{}");
    if (!message || typeof message !== "string") {
      return { statusCode: 400, body: JSON.stringify({ error: "Messaggio mancante" }) };
    }

    const today = new Date().toISOString().slice(0, 10);
    const horseNames = Array.isArray(horses) ? horses.map((h) => h.name).filter(Boolean) : [];

    const systemPrompt =
      "Sei l'assistente equestre di Equo, un esperto virtuale di gestione e cura del cavallo. " +
      "Rispondi in italiano, in modo chiaro e pratico. Non sostituisci un veterinario: se il dubbio " +
      "riguarda un problema di salute concreto, consiglia di contattarne uno.\n\n" +
      `Data di oggi: ${today}.\n` +
      (horseNames.length
        ? `Cavalli dell'utente: ${horseNames.join(", ")}.\n`
        : "L'utente non ha ancora registrato nessun cavallo.\n") +
      "Se l'utente ti chiede di segnare/aggiungere un vaccino, un test Coggins, una ferratura o una sverminazione " +
      "con una data chiara, usa lo strumento create_health_event invece di rispondere solo a parole. " +
      "Se manca il cavallo o la data, chiedili prima.";

    const messages = Array.isArray(history) && history.length
      ? [...history, { role: "user", content: message }]
      : [{ role: "user", content: message }];

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 600,
        system: systemPrompt,
        tools: TOOLS,
        messages,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Errore Claude API:", data);
      return { statusCode: 500, body: JSON.stringify({ error: "Errore assistente AI" }) };
    }

    const blocks = Array.isArray(data.content) ? data.content : [];
    const textBlock = blocks.find((b) => b.type === "text");
    const toolBlock = blocks.find((b) => b.type === "tool_use" && b.name === "create_health_event");

    let reply = textBlock?.text || "";
    let proposedEvent = null;

    if (toolBlock) {
      const input = toolBlock.input || {};
      proposedEvent = {
        horse_name: input.horse_name || "",
        type: input.type || "",
        date: input.date || "",
        next_due_date: input.next_due_date || null,
        notes: input.notes || null,
      };
      if (!reply) {
        reply = `Ho preparato una proposta di evento per ${proposedEvent.horse_name}. Confermi?`;
      }
    }

    if (!reply && !proposedEvent) {
      reply = "Non sono riuscito a rispondere, riprova.";
    }

    return { statusCode: 200, body: JSON.stringify({ reply, proposedEvent }) };
  } catch (e) {
    console.error("Errore ai-proxy:", e);
    return { statusCode: 500, body: JSON.stringify({ error: "Errore interno" }) };
  }
};
