import Link from "next/link";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Wallet, Bot, MapPin } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Libretto sanitario digitale",
    desc: "Vaccini, Coggins test, ferratura e sverminazioni con scadenziario automatico. Basta carta.",
  },
  {
    icon: Wallet,
    title: "Registro spese",
    desc: "Traccia pensione, mangimi e visite veterinarie per ogni cavallo, mese per mese.",
  },
  {
    icon: Bot,
    title: "Assistente AI equestre",
    desc: "Un esperto virtuale sempre disponibile per dubbi su gestione ed etologia.",
  },
  {
    icon: MapPin,
    title: "Servizi vicino a te",
    desc: "Trova cliniche 24h e maneggi vicino alla tua scuderia in un tap.",
  },
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
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Prenditi cura del tuo cavallo, <span className="text-primary">senza carta e senza pensieri</span>
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Equo digitalizza la gestione sanitaria e amministrativa del tuo cavallo: scadenze, spese e un
          assistente AI esperto, sempre con te.
        </p>
        <WaitlistForm />
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

      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Equo. Tutti i diritti riservati.
      </footer>
    </div>
  );
}
