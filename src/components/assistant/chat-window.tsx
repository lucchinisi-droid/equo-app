"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

export function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Ciao! Sono l'assistente esperto equestre di Equo 🐴 Chiedimi pure di alimentazione, comportamento, scadenze sanitarie o gestione della scuderia.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Mi dispiace, si è verificato un errore. Riprova." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Errore di connessione. Riprova più tardi." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex h-[calc(100vh-11rem)] flex-col md:h-[calc(100vh-7rem)]">
      <CardContent className="flex flex-1 flex-col gap-4 overflow-y-auto pt-6">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full",
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              )}
            >
              {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
            </div>
            <div
              className={cn(
                "max-w-[80%] rounded-xl px-4 py-2 text-sm whitespace-pre-wrap",
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && <p className="text-xs text-muted-foreground">L'assistente sta scrivendo...</p>}
        <div ref={bottomRef} />
      </CardContent>
      <div className="flex items-end gap-2 border-t p-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Scrivi un messaggio..."
          className="min-h-[44px] resize-none"
          rows={1}
        />
        <Button onClick={sendMessage} disabled={loading || !input.trim()} size="icon">
          <Send className="size-4" />
        </Button>
      </div>
    </Card>
  );
}
