import { NextRequest, NextResponse } from "next/server";
import { anthropic, EQUO_SYSTEM_PROMPT } from "@/lib/claude/client";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { messages, horseId } = (await req.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
    horseId?: string;
  };

  if (!messages?.length) {
    return NextResponse.json({ error: "Messaggi mancanti" }, { status: 400 });
  }

  const lastUserMessage = messages[messages.length - 1];

  // Salva il messaggio utente
  await supabase.from("assistant_messages").insert({
    owner_id: user.id,
    horse_id: horseId ?? null,
    role: "user",
    content: lastUserMessage.content,
  });

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: EQUO_SYSTEM_PROMPT,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const reply = textBlock?.type === "text" ? textBlock.text : "";

    await supabase.from("assistant_messages").insert({
      owner_id: user.id,
      horse_id: horseId ?? null,
      role: "assistant",
      content: reply,
    });

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Errore Claude API:", err);
    return NextResponse.json({ error: "Errore nel generare la risposta" }, { status: 500 });
  }
}
