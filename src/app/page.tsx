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

const featureDetails = [
  {
    icon: ShieldCheck,
    title: "Libretto sanitario digitale",
    image: "/features/libretto-sanitario.jpg",
    paragraphs: [
      "Ogni cavallo ha una storia sanitaria fatta di vaccinazioni, test Coggins, sverminazioni e ferrature che si accumulano nel tempo — e che spesso finiscono su fogli sparsi, messaggi WhatsApp al maniscalco o promemoria mentali facili da dimenticare.",
      "Con Equo tutto questo diventa un libretto digitale sempre a portata di telefono: carichi la data dell'ultimo intervento, il veterinario o il maniscalco di riferimento, ed Equo calcola da solo la prossima scadenza.",
      "Quando una scadenza si avvicina ricevi un promemoria via email prima che diventi un problema — utile per la routine di tutti i giorni e indispensabile in caso di gare, trasferte o controlli.",
    ],
  },
  {
    icon: Wallet,
    title: "Registro spese",
    image: "/features/registro-spese.jpg",
    paragraphs: [
      "Pensione, mangime, integratori, visite veterinarie, ferratura, attrezzatura: mantenere un cavallo ha tanti costi ricorrenti, spesso pagati in momenti diversi e difficili da tenere a mente tutti insieme.",
      "Equo ti permette di registrare ogni spesa in pochi secondi, categorizzarla e vedere subito quanto stai spendendo per il tuo cavallo mese per mese — senza fogli Excel o scontrini persi in macchina.",
      "Nel tempo costruisci uno storico utile per pianificare il budget, confrontare i costi tra periodi diversi e, se gestisci più cavalli o una scuderia, capire dove intervenire per ottimizzare la spesa.",
    ],
  },
  {
    icon: Bot,
    title: "Assistente AI equestre",
    image: "/features/assistente-ai.jpg",
    paragraphs: [
      "Non sempre serve chiamare il veterinario per un dubbio: a volte basta un confronto rapido su alimentazione, comportamento, gestione quotidiana o su un piccolo campanello d'allarme da valutare.",
      "L'assistente AI di Equo è un esperto equestre virtuale disponibile 24 ore su 24, direttamente nell'app: gli scrivi la tua domanda e ricevi una risposta chiara, basata su conoscenze etologiche e di gestione del cavallo.",
      "Non sostituisce il tuo veterinario o il tuo istruttore, ma ti aiuta a capire quando serve il loro intervento e ti accompagna nelle mille piccole decisioni che si prendono ogni giorno prendendosi cura di un cavallo.",
    ],
  },
  {
    icon: MapPin,
    title: "Servizi vicino a te",
    image: "/features/servizi-vicino.jpg",
    paragraphs: [
      "Un'emergenza notturna, un ferro perso a pochi giorni da una gara, la necessità di trovare un nuovo maniscalco dopo un trasferimento: sapere a chi rivolgersi rapidamente fa la differenza.",
      "Equo include una mappa dei servizi equestri vicino a te — cliniche veterinarie 24 ore su 24, maniscalchi, maneggi — così puoi trovare chi ti serve senza perdere tempo a cercare tra contatti sparsi o gruppi Facebook.",
      "Con un tap chiami direttamente il contatto o apri le indicazioni stradali: pensato per i momenti in cui ogni minuto conta, ma utile anche solo per organizzare la routine di cura del tuo cavallo.",
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-4">
        <Image src="/logo-equo.png" alt="Equo" width={280} height={83} priority className="h-14 w-auto sm:h-16" />
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

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Cosa puoi fare con Equo</h2>
          <p className="mt-3 text-muted-foreground">
            Quattro strumenti pensati per la gestione quotidiana del tuo cavallo, tutti in un&apos;unica app.
          </p>
        </div>

        <div className="flex flex-col gap-16 sm:gap-24">
          {featureDetails.map(({ icon: Icon, title, image, paragraphs }, index) => (
            <div
              key={title}
              className={`flex flex-col items-center gap-8 sm:gap-12 md:flex-row ${
                index % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              <div className="w-full overflow-hidden rounded-2xl md:w-1/2">
                <Image
                  src={image}
                  alt={title}
                  width={1200}
                  height={1200}
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
              <div className="w-full md:w-1/2">
                <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-secondary">
                  <Icon className="size-5 text-secondary-foreground" />
                </div>
                <h3 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h3>
                <div className="mt-4 flex flex-col gap-3 text-muted-foreground">
                  {paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24 text-center">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <p className="text-xl font-semibold">Pronto a prenderti cura del tuo cavallo con Equo?</p>
            <p className="max-w-md text-muted-foreground">
              Iscriviti alla waitlist: sarai tra i primi ad accedere alla versione beta.
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
