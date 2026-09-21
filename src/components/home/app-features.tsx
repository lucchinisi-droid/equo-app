import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Wallet, Bot, MapPin, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppFeatures() {
  return (
    <section className="py-20 bg-background border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary uppercase tracking-wider">
            🐴 Per Proprietari & Cavalieri
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Equo App: Tutto il tuo cavallo, sempre a portata di mano
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Dimentica scontrini sparsi nel baule, fogli del veterinario smarriti e date di scadenza dimenticate. Equo trasforma la gestione quotidiana in un&apos;esperienza fluida e serena.
          </p>
        </div>

        {/* Feature 1: Libretto Sanitario + Foto Maniscalco */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-20">
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="size-6" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
              Libretto Sanitario Digitale & Promemoria Automatici
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Vaccini, Coggins test, visite veterinarie, sverminazioni e cicli di ferratura: ogni evento ha la sua scheda digitale. Equo calcola in automatico la prossima scadenza e ti invia promemoria per tempo.
            </p>
            <ul className="space-y-2.5 pt-2">
              <li className="flex items-center gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="size-4 text-primary shrink-0" />
                <span>Validità Coggins test e vaccini FISE sempre aggiornati</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="size-4 text-primary shrink-0" />
                <span>Promemoria automatici via email e notifica prima che sia tardi</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="size-4 text-primary shrink-0" />
                <span>Storico ferrature con dettagli su ferri e maniscalco di fiducia</span>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-border group">
              <Image
                src="/images/10.png"
                alt="Maniscalco al lavoro e ferratura"
                width={650}
                height={650}
                className="w-full h-[380px] sm:h-[420px] object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <div className="text-sm font-semibold">Monitoraggio Ferrature & Cure</div>
                <div className="text-xs text-white/80">Traccia ogni intervento del maniscalco e del veterinario</div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Assistente AI Equestre + Foto Cavaliere tramonto */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-20">
          <div className="lg:col-span-6 lg:order-2 space-y-5">
            <div className="inline-flex items-center justify-center size-12 rounded-xl bg-amber-500/10 text-amber-600">
              <Bot className="size-6" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
              Assistente AI Equestre h24 nel tuo telefono
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Un dubbio su un comportamento strano? Vuoi capire se un piccolo sintomo richiede una visita veterinaria urgente, o cerchi consigli sulla corretta razione di fieno? Il nostro assistente intelligente risponde alle tue domande in linguaggio naturale, in ogni momento.
            </p>
            <ul className="space-y-2.5 pt-2">
              <li className="flex items-center gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="size-4 text-amber-500 shrink-0" />
                <span>Risposte verificate basate su letteratura etologica e veterinaria</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="size-4 text-amber-500 shrink-0" />
                <span>Propone e salva eventi sanitari direttamente nella tua timeline</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="size-4 text-amber-500 shrink-0" />
                <span>Riconoscimento delle urgenze per guidarti al veterinario più vicino</span>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-6 lg:order-1">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-border group">
              <Image
                src="/images/5.png"
                alt="Relazione cavallo e cavaliere"
                width={650}
                height={650}
                className="w-full h-[380px] sm:h-[420px] object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <div className="text-sm font-semibold">Consulenza Etologica & Sanitaria</div>
                <div className="text-xs text-white/80">L&apos;alleato discreto per la salute e il benessere del tuo cavallo</div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3: Registro Spese + Foto Cavallo prato fiorito */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center justify-center size-12 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Wallet className="size-6" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
              Registro Spese & Controllo del Budget Mensile
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Pensione, mangimi, integratori, lezioni, visite veterinarie e attrezzatura: registrare una spesa richiede solo 5 secondi. Visualizza grafici chiari e scopri esattamente dove va il tuo budget.
            </p>
            <ul className="space-y-2.5 pt-2">
              <li className="flex items-center gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Ripartizione automatica per categorie (Sanità, Pensione, Attrezzatura)</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Confronto mese su mese e storico spese per ogni singolo cavallo</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Esportazione immediata per la contabilità o per dividere i costi</span>
              </li>
            </ul>

            <div className="pt-4">
              <Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                <Link href="/servizi/app" className="inline-flex items-center gap-2 font-semibold">
                  <span>Esplora tutti i dettagli di Equo App</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-border group">
              <Image
                src="/images/18.png"
                alt="Cavallo nel prato fiorito con logo Equo"
                width={650}
                height={650}
                className="w-full h-[380px] sm:h-[420px] object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
