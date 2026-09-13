"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function WaitlistForm({ role }: { role: "proprietario" | "scuderia" }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Errore, riprova.");
      } else {
        setStatus("success");
        setMessage("Sei in lista! Controlla la tua email.");
        setEmail("");
      }
    } catch {
      setStatus("error");
      setMessage("Errore di connessione.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "success") {
    return <p className="rounded-md bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground">{message}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          required
          placeholder="La tua email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Invio..." : "Iscriviti"}
        </Button>
      </div>
      {status === "error" && <p className="text-sm text-destructive">{message}</p>}
    </form>
  );
}
