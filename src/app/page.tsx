import Link from "next/link";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Wallet, Bot, MapPin, Check } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Libretto sanitario digitale",
    desc: "Vaccini, Coggins test, ferratura e sverminazioni con promemoria automatico via email. Niente più fogli persi in scuderia.",
  },
  {
    icon: Wallet,
    title: "Registro spese",
    desc: "Pensione, mangimi, veterinario, maniscalco: sai sempre quanto ti costa davvero il tuo cavallo, mese per mese.",
  },
  {
    icon: Bot,
    title: "Assistente AI equestre",
    desc: "Un esperto virtuale h24 per dubbi su alimentazione, comportamento e gestione — sempre nel telefono.",
  },
  {
    icon: MapPin,
    title: "Servizi vicino a te",
    desc: "Clinica 24h o maniscalco più vicini, un tap per chiamare o farti indicare la strada.",
  },
];

const proofPoints = [
  "Gratis per i primi iscritti",
  "Nessuna carta di credito richiesta",
  "5 minuti per creare il libretto del tuo cavallo",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-xl font-bold text-primary">Equo 🐴</span>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Accedi</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Registrati</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-16 text-center sm:py-24">
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          In arrivo — iscriviti alla waitlist
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Il tuo cavallo, <span className="text-primary">senza più carta e senza scadenze dimenticate</span>
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Equo tiene traccia di vaccini, spese e scadenze del tuo cavallo al posto tuo, e ti avvisa prima
          che sia troppo tardi. Un assistente AI esperto sempre a portata di mano.
        </p>
        <WaitlistForm />
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {proofPoints.map((p) => (
            <li key={p} className="flex items-center gap-1.5">
              <Check className="size-4 text-primary" /> {p}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 sm:grid-cols-2">
        {features.map(({ icon: Icon, title, desc }) => (
          <Card key={title}>
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Icon className="size-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24 text-center">
        <Card className="bg-secondary/40">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <p className="text-xl font-semibold">Gestisci una scuderia?</p>
            <p className="max-w-md text-muted-foreground">
              Equo funziona anche per gestori di scuderie con più cavalli e più proprietari da coordinare.
              Scrivici per una demo dedicata.
            </p>
            <WaitlistForm />
          </CardContent>
        </Card>
      </section>

      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Equo. Tutti i diritti riservati.
      </footer>
    </div>
  );
}
