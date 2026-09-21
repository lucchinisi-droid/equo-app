import Image from "next/image";
import Link from "next/link";
import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Wallet,
  Bot,
  MapPin,
  CalendarCheck,
  Smartphone,
  Download,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "Equo App — Per Proprietari e Cavalieri",
  description: "L'applicazione mobile-first per prenderti cura del tuo cavallo: libretto sanitario, spese, scadenze e assistente AI 24/7.",
};

const appHighlights = [
  {
    icon: ShieldCheck,
    title: "Libretto Sanitario Digitale",
    desc: "Tieni traccia di vaccinazioni (influenza, tetano, herpes virus), Test Coggins, sverminazioni cicliche e ferrature. Ricevi notifiche preventive prima di ogni scadenza.",
    image: "/images/10.png",
  },
  {
    icon: Bot,
    title: "Assistente AI Equestre h24",
    desc: "Un consulente etologico e sanitario virtuale sempre in tasca. Chiedi informazioni su alimentazione, comportamenti insoliti e segnali precoci di disagio.",
    image: "/images/5.png",
  },
  {
    icon: Wallet,
    title: "Registro Spese & Budget",
    desc: "Pensione, mangimi, integratori, veterinario e maniscalco: registra ogni spesa in pochi secondi e consulta l'andamento mese per mese.",
    image: "/images/18.png",
  },
  {
    icon: CalendarCheck,
    title: "Prenotazione Lezioni & Carnet",
    desc: "Se la tua scuderia utilizza Equo Scuderia, prenoti le tue ore di lezione in un tap dall'app e visualizzi il saldo aggiornato del tuo abbonamento.",
    image: "/images/8.png",
  },
];

const faqs = [
  {
    q: "Devo pagare per scaricare Equo App?",
    a: "No, Equo App è gratuita per iniziare. I primi 250 iscritti al programma Beta ottengono inoltre 6 mesi della versione Pro completamente gratis.",
  },
  {
    q: "Come si installa l'app sul mio telefono?",
    a: "Equo è una Progressive Web App: apri il link equo-app.netlify.app da Safari (su iPhone) o Chrome (su Android) e tocca 'Aggiungi a schermata Home'. Si installerà in 5 secondi senza passare dagli store.",
  },
  {
    q: "Cosa succede se cambio telefono?",
    a: "I dati del tuo cavallo sono salvati in cloud sui nostri server sicuri europei Supabase: basta accedere con la tua email per ritrovare tutto esattamente come lo avevi lasciato.",
  },
  {
    q: "Posso gestire più di un cavallo con lo stesso account?",
    a: "Certamente! Puoi aggiungere schede distinte per ogni tuo cavallo, con libretto sanitario, archivio spese e calendario separati.",
  },
];

export default function EquoAppDetailPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MarketingNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-primary/10 via-background to-background">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-4 py-1.5 text-xs font-bold text-primary">
              <Smartphone className="size-4" />
              Equo App per Proprietari
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground">
              Il tuo compagno merita la miglior cura. <br />
              <span className="text-primary">Tu meriti zero stress.</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Dalle scadenze sanitarie obbligatorie al registro delle spese, fino al confronto immediato con l&apos;assistente AI equestre: tutto ciò che serve per vivere l&apos;equitazione con serenità.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button asChild size="lg" className="font-bold shadow-md">
                <a
                  href="https://equo-app.netlify.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <Download className="size-4" />
                  <span>Installa l&apos;App Gratis</span>
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a
                  href="https://equo-app.netlify.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-semibold"
                >
                  <Sparkles className="size-4 text-amber-500 fill-amber-400" />
                  <span>Prova Demo Online</span>
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Deep Dive Features */}
        <section className="py-16 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-20">
            {appHighlights.map((item, idx) => (
              <div
                key={idx}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-10 items-center ${
                  idx % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                <div className={`lg:col-span-6 space-y-4 ${idx % 2 === 1 ? "lg:order-2" : ""}`}>
                  <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <item.icon className="size-6" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground text-base leading-relaxed">{item.desc}</p>
                  <div className="pt-2">
                    <Button asChild variant="ghost" className="text-primary hover:text-primary font-semibold px-0">
                      <a
                        href="https://equo-app.netlify.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5"
                      >
                        <span>Prova questa funzione nella demo</span>
                        <ArrowRight className="size-4" />
                      </a>
                    </Button>
                  </div>
                </div>

                <div className={`lg:col-span-6 ${idx % 2 === 1 ? "lg:order-1" : ""}`}>
                  <div className="relative rounded-3xl overflow-hidden shadow-xl border border-border h-80 sm:h-96 group">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="py-20 bg-muted/30 border-t border-border">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-3 mb-12">
              <h2 className="text-3xl font-extrabold text-foreground">Domande Frequenti su Equo App</h2>
              <p className="text-muted-foreground">Tutto quello che c&apos;è da sapere sull&apos;app per i proprietari</p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-2">
                  <h3 className="text-base font-bold text-foreground">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 bg-primary text-primary-foreground text-center">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Inizia oggi a gestire il tuo cavallo con Equo</h2>
            <p className="text-primary-foreground/90 text-base leading-relaxed">
              Bastano 2 minuti per aggiungere il tuo primo cavallo e configurare i promemoria sanitari.
            </p>
            <div className="pt-2">
              <Button asChild size="lg" variant="secondary" className="font-bold text-base shadow-lg">
                <a
                  href="https://equo-app.netlify.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <Download className="size-4" />
                  <span>Apri Equo App Subito</span>
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
