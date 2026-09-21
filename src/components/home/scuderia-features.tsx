import Link from "next/link";
import Image from "next/image";
import { Building2, Calendar, ShieldAlert, FileSpreadsheet, Sparkles, ArrowRight, CheckCircle2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ScuderiaFeatures() {
  return (
    <section className="py-20 bg-muted/40 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1 text-xs font-bold text-secondary-foreground uppercase tracking-wider">
            🏡 Per Maneggi, Scuole & Centri Ippici
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Equo Scuderia: Il gestionale completo che libera il tuo tempo
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Elimina le ore passate su fogli Excel, quaderni di segreteria e chat disordinate. Con Equo Scuderia hai sotto controllo lezioni, cavalli, adempimenti sanitari e contabilità in un unico cruscotto.
          </p>
        </div>

        {/* Big Spotlight: Image + Key Pillars */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
          {/* Visual Column with 17.png */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-background group">
              <Image
                src="/images/17.png"
                alt="Equo Scuderia - Corsia box maneggio"
                width={700}
                height={700}
                className="w-full h-[450px] sm:h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                <span className="inline-block rounded-full bg-primary/80 backdrop-blur-sm px-3 py-1 text-xs font-semibold">
                  Piattaforma Web & Cloud
                </span>
                <h4 className="text-xl font-bold">Un unico punto di controllo per la tua struttura</h4>
                <p className="text-xs text-white/80">
                  Accessibile da computer in segreteria, da tablet in campo o dallo smartphone dell&apos;istruttore.
                </p>
              </div>
            </div>
          </div>

          {/* Pillars Column */}
          <div className="lg:col-span-6 space-y-6">
            {/* Pillar 1: Calendario lezioni */}
            <div className="flex gap-4 p-4 rounded-2xl bg-card border border-border/70 hover:border-primary/40 transition-colors shadow-sm">
              <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Calendar className="size-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-foreground">Calendario Lezioni Condiviso & Carnet</h4>
                <p className="text-sm text-muted-foreground">
                  Gli allievi prenotano direttamente dall&apos;app in base alla disponibilità. Il carnet lezioni si scala in automatico, senza contestazioni.
                </p>
              </div>
            </div>

            {/* Pillar 2: Assegnazione bilanciata */}
            <div className="flex gap-4 p-4 rounded-2xl bg-card border border-border/70 hover:border-primary/40 transition-colors shadow-sm">
              <div className="size-11 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
                <Users className="size-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-foreground">Assegnazione Cavalli Equa e Intelligente</h4>
                <p className="text-sm text-muted-foreground">
                  Suggerisce l&apos;assegnazione dei cavalli della scuola tenendo conto del carico di lavoro giornaliero e settimanale, salvaguardando il benessere degli animali.
                </p>
              </div>
            </div>

            {/* Pillar 3: Cruscotto a semaforo */}
            <div className="flex gap-4 p-4 rounded-2xl bg-card border border-border/70 hover:border-primary/40 transition-colors shadow-sm">
              <div className="size-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="size-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-foreground">Cruscotto Sanitario a Semaforo</h4>
                <p className="text-sm text-muted-foreground">
                  Verde, giallo o rosso: visualizza subito lo stato di certificati medici, patenti e Coggins test per tutti i cavalli e cavalieri ospiti della scuderia.
                </p>
              </div>
            </div>

            {/* Pillar 4: Rendicontazione spese */}
            <div className="flex gap-4 p-4 rounded-2xl bg-card border border-border/70 hover:border-primary/40 transition-colors shadow-sm">
              <div className="size-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="size-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-foreground">Estratto Conto Spese Automatico</h4>
                <p className="text-sm text-muted-foreground">
                  Genera a fine mese il prospetto di pensione, servizi extra e lezioni per ciascun proprietario, azzerando le incomprensioni e i tempi di segreteria.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Banner: Demo & Contact */}
        <div className="rounded-3xl bg-card border-2 border-primary/20 p-8 sm:p-10 shadow-lg text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
            <Sparkles className="size-4 text-amber-500 fill-amber-400" />
            <span>Accesso Immediato Senza Account</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Vuoi testare il gestionale prima di decidere?
          </h3>

          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            Abbiamo preparato una <strong>modalità Demo interattiva</strong> pre-popolata con dati reali di una scuderia: puoi esplorare cavalli, calendario, spese e l&apos;assistente AI senza dover inserire email o carta di credito.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto font-bold text-base shadow-md hover:scale-105 transition-transform"
            >
              <a
                href="https://equo-app.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <Sparkles className="size-4 text-amber-300 fill-amber-300" />
                <span>Apri la Versione Demo Live</span>
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-base border-primary/30 text-primary hover:bg-primary/10"
            >
              <Link href="/contatti" className="inline-flex items-center gap-2 font-semibold">
                <span>Richiedi una Presentazione Guidata</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
