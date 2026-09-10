import Link from "next/link";
import Image from "next/image";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Wallet, Bot, MapPin, Sparkles } from "lucide-react";

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

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-4">
        <Image src="/logo-equo.png" alt="Equo" width={140} height={47} priority className="h-9 w-auto" />
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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          <Sparkles className="size-3.5" /> Solo per i primi 250 iscritti
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Ricevi in anteprima la <span className="text-primary">versione beta</span> dell&apos;app
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          I primi <strong className="text-foreground">250 iscritti</strong> avranno{" "}
          <strong className="text-foreground">6 mesi della versione Pro gratis</strong>. Equo tiene traccia di
          vaccini, spese e scadenze del tuo cavallo al posto tuo — e ti avvisa prima che sia troppo tardi.
        </p>
        <WaitlistForm />
        <p className="text-sm text-muted-foreground">Nessuna carta di credito richiesta · 5 minuti per iscriverti</p>
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

      <footer className="flex flex-col items-center gap-3 border-t px-6 py-8 text-center text-sm text-muted-foreground">
        <Image src="/icona-equo.png" alt="Equo" width={28} height={28} className="opacity-70" />
        © {new Date().getFullYear()} Equo. Tutti i diritti riservati.
      </footer>
    </div>
  );
}
