"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, CheckCircle2, Loader2, Send } from "lucide-react";

export function ContactForm() {
  const [role, setRole] = useState<"scuderia" | "proprietario">("scuderia");
  const [reason, setReason] = useState<string>("demo");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [stableName, setStableName] = useState("");
  const [horsesCount, setHorsesCount] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          reason,
          name,
          email,
          phone,
          stableName: role === "scuderia" ? stableName : undefined,
          horsesCount: role === "scuderia" ? horsesCount : undefined,
          message,
        }),
      });

      if (!res.ok) {
        throw new Error("Errore durante l'invio del messaggio. Riprova più tardi.");
      }

      setStatus("success");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "Qualcosa è andato storto. Contattaci a gestione.equo@gmail.com");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-3xl border border-primary/30 bg-card p-8 sm:p-12 text-center space-y-5 shadow-lg">
        <div className="size-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="size-8" />
        </div>
        <h3 className="text-2xl font-bold text-foreground">Messaggio Ricevuto con Successo!</h3>
        <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          Grazie per averci contattato, <strong>{name}</strong>. Il nostro team risponderà entro 24 ore lavorative all&apos;indirizzo <strong>{email}</strong>.
        </p>
        <div className="pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setStatus("idle");
              setName("");
              setEmail("");
              setPhone("");
              setStableName("");
              setMessage("");
            }}
          >
            Invia un altro messaggio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-lg space-y-6">
      {/* Role Selector */}
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Chi sei?
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("scuderia")}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all ${
              role === "scuderia"
                ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                : "border-border bg-background hover:bg-muted text-muted-foreground"
            }`}
          >
            <span className="text-base">🏡 Centro Ippico / Scuderia</span>
            <span className="text-xs text-muted-foreground mt-0.5">Gestione box, allievi e lezioni</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("proprietario")}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all ${
              role === "proprietario"
                ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                : "border-border bg-background hover:bg-muted text-muted-foreground"
            }`}
          >
            <span className="text-base">🐴 Proprietario / Cavaliere</span>
            <span className="text-xs text-muted-foreground mt-0.5">Cura e spese del mio cavallo</span>
          </button>
        </div>
      </div>

      {/* Reason */}
      <div className="space-y-2">
        <Label htmlFor="reason" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Motivo del contatto
        </Label>
        <select
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="demo">Richiesta Demo Guidata del Gestionale</option>
          <option value="commerciale">Informazioni su Prezzi e Piani</option>
          <option value="supporto">Supporto Tecnico su Equo App</option>
          <option value="partnership">Partnership / Collaborazione</option>
          <option value="altro">Altro</option>
        </select>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome e Cognome *</Label>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="es. Mario Rossi"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="mario.rossi@email.it"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Telefono (opzionale per richiamata)</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+39 333 1234567"
          />
        </div>

        {role === "scuderia" ? (
          <div className="space-y-2">
            <Label htmlFor="stableName">Nome Centro Ippico / Scuderia</Label>
            <Input
              id="stableName"
              value={stableName}
              onChange={(e) => setStableName(e.target.value)}
              placeholder="es. Scuderia Il Ciliegio"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="horsesCount">Numero di Cavalli Gestiti</Label>
            <Input
              id="horsesCount"
              type="number"
              min="1"
              value={horsesCount}
              onChange={(e) => setHorsesCount(e.target.value)}
              placeholder="es. 1 o 2"
            />
          </div>
        )}
      </div>

      {/* Message */}
      <div className="space-y-2">
        <Label htmlFor="message">Come possiamo aiutarti? *</Label>
        <Textarea
          id="message"
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Scrivi qui i dettagli della tua richiesta o le esigenze della tua scuderia..."
        />
      </div>

      {status === "error" && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-xs text-destructive">
          {errorMessage}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={status === "loading"}
        className="w-full font-bold text-base shadow-md"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="size-4 animate-spin mr-2" />
            Invio in corso...
          </>
        ) : (
          <>
            <Send className="size-4 mr-2" />
            Invia Richiesta
          </>
        )}
      </Button>

      <p className="text-[11px] text-muted-foreground text-center">
        I tuoi dati sono protetti e trattati nel rispetto del GDPR. Non inviamo spam.
      </p>
    </form>
  );
}
