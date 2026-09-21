import Image from "next/image";
import Link from "next/link";
import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Calendar,
  ShieldAlert,
  FileSpreadsheet,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Laptop
} from "lucide-react";

export const metadata = {
  title: "Equo Scuderia — Software Gestionale per Centri Ippici e Maneggi",
  description: "La soluzione all-in-one per scuderie: calendario lezioni, gestione box, cruscotto a semaforo sanitario ed estratto conto automatico per i proprietari.",
};

const scuderiaPillars = [
  {
    icon: Calendar,
    title: "1. Gestione Lezioni & Prenotazioni Sincronizzate",
    desc: "Basta disdette dell'ultimo minuto perse su WhatsApp. Gli allievi visualizzano la disponibilità dell'istruttore direttamente dalla loro app e inviano la richiesta. Il carnet lezioni si scala automaticamente al termine della ripresa.",
  },
  {
    icon: Users,
    title: "2. Assegnazione Equa dei Cavalli della Scuola",
    desc: "Il sistema monitora il carico di lavoro orario e settimanale di ciascun cavallo, suggerendo all'istruttore le migliori combinazioni allievo-cavallo ed evitando il sovraffaticamento dei cavalli più docili.",
  },
  {
    icon: ShieldAlert,
    title: "3. Cruscotto Sanitario a Semaforo (Tesseramenti & Coggins)",
    desc: "In un colpo d'occhio vedi lo stato di tutta la scuderia: verde (in regola), giallo (in scadenza entro 15 giorni), rosso (scaduto). Saprai in anticipo quali certificati medici agonistici o vaccini necessitano di sollecito.",
  },
  {
    icon: FileSpreadsheet,
    title: "4. Rendicontazione Spese Pensione & Servizi Extra",
    desc: "A fine mese raccogli le spese di pensione, mangimi speciali, paddock, tosatura o lezioni extra. Il sistema genera un estratto conto trasparente e lo invia direttamente al proprietario, azzerando le discussioni.",
  },
];

export default function EquoScuderiaDetailPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MarketingNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-secondary/40 via-background to-background">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-bold text-secondary-foreground">
              <Building2 className="size-4 text-primary" />
              Equo Scuderia per Centri Ippici & Maneggi
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground">
              Meno tempo in segreteria. <br />
              <span className="text-primary">Più tempo in campo con i cavalli.</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Il primo software di gestione scuderia pensato da chi vive la vita di maneggio: automatizza prenotazioni, conformità sanitaria e conteggi spese in un unico cruscotto cloud accessibile da qualsiasi dispositivo.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button asChild size="lg" className="font-bold shadow-md">
                <a
                  href="https://equo-app.netlify.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <Sparkles className="size-4 text-amber-300 fill-amber-300" />
                  <span>Esplora la Demo Live Online</span>
                </a>
              </Button>

              <Button asChild variant="outline" size="lg" className="border-primary/40 text-primary">
                <Link href="/contatti" className="inline-flex items-center gap-2 font-semibold">
                  <span>Richiedi una Presentazione Guidata</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stable Visual Banner 17.png */}
        <section className="py-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-background h-[380px] sm:h-[480px]">
              <Image
                src="/images/17.png"
                alt="Corsia scuderia Equo Scuderia"
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white max-w-xl space-y-2">
                <span className="inline-block rounded-full bg-primary/90 px-3 py-1 text-xs font-bold">
                  Sviluppato per la vita reale di scuderia
                </span>
                <h3 className="text-2xl font-bold">
                  Funziona su tablet in campo, computer in segreteria e smartphone
                </h3>
                <p className="text-xs sm:text-sm text-white/80">
                  Nessun software da installare o server da mantenere. Tutto si sincronizza in tempo reale sul cloud.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Pillars Grid */}
        <section className="py-20 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
              <h2 className="text-3xl font-extrabold text-foreground">
                Tutto ciò che serve per governare la scuderia
              </h2>
              <p className="text-muted-foreground text-base">
                Quattro aree integrate per eliminare l&apos;errore umano e risparmiare ore ogni settimana.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {scuderiaPillars.map((pillar, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl border border-border bg-card p-8 shadow-sm hover:shadow-md transition-all space-y-4"
                >
                  <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <pillar.icon className="size-6" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{pillar.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{pillar.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow Showcase with 19.png */}
        <section className="py-20 bg-muted/40 border-t border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary uppercase tracking-wider">
                  Vantaggi Operativi
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
                  Perché i gestori di scuderia scelgono Equo
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-base font-bold text-foreground">Fino a 10 ore risparmiate a settimana</h4>
                      <p className="text-sm text-muted-foreground">Meno telefonate, niente controllo manuale dei carnet o rifacimento conteggi di fine mese.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-base font-bold text-foreground">Zero contestazioni sui pagamenti</h4>
                      <p className="text-sm text-muted-foreground">Ogni spesa e lezione è tracciata con data, orario e operatore. Trasparenza totale verso i soci e proprietari.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-base font-bold text-foreground">Conformità assicurativa e federale garantita</h4>
                      <p className="text-sm text-muted-foreground">Il cruscotto a semaforo ti avverte tempestivamente se un allievo monta con certificato medico scaduto.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Button asChild size="lg" className="font-bold">
                    <Link href="/contatti" className="inline-flex items-center gap-2">
                      <span>Richiedi una Demo Guidata</span>
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="relative rounded-3xl overflow-hidden shadow-xl border border-border h-[420px]">
                  <Image
                    src="/images/19.png"
                    alt="Pascolo scuderia Equo"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <div className="text-lg font-bold">Un ambiente sereno per cavalli e cavalieri</div>
                    <div className="text-xs text-white/80">L&apos;organizzazione efficiente crea una scuderia migliore per tutti</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Demo banner */}
        <section className="py-16 bg-primary text-primary-foreground text-center">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Prova la Demo Live in 30 secondi</h2>
            <p className="text-primary-foreground/90 text-base leading-relaxed">
              Esplora subito il cruscotto di Equo Scuderia con dati precaricati e scopri la facilità d&apos;uso.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" variant="secondary" className="font-bold text-base shadow-lg">
                <a
                  href="https://equo-app.netlify.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <Sparkles className="size-4 text-amber-600 fill-amber-500" />
                  <span>Avvia Demo Senza Registrazione</span>
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10">
                <Link href="/contatti">
                  Contattaci per una Prova
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
