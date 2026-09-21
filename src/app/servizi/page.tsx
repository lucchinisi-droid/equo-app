import Link from "next/link";
import Image from "next/image";
import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { Button } from "@/components/ui/button";
import {
  Smartphone,
  Building2,
  Check,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Calendar,
  Wallet,
  Bot,
  Users,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";

export const metadata = {
  title: "I Nostri Servizi — Equo App ed Equo Scuderia",
  description: "Scopri le soluzioni digitali di Equo: l'app per la cura individuale del cavallo e il software gestionale per scuderie e centri ippici.",
};

export default function ServiziOverviewPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MarketingNavbar />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="bg-gradient-to-b from-primary/10 via-background to-background py-16 sm:py-24 text-center">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3.5 py-1 text-xs font-bold text-primary uppercase tracking-wider">
              Soluzioni per l&apos;Equitazione
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Due strumenti progettati per integrarsi alla perfezione
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Che tu sia il proprietario di un cavallo o il gestore di un centro ippico con decine di box, Equo ha la risposta su misura per te.
            </p>
          </div>
        </section>

        {/* The Two Main Products Grid */}
        <section className="py-12 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Product 1: Equo App */}
              <div className="rounded-3xl border border-border bg-card p-8 sm:p-10 shadow-lg flex flex-col justify-between space-y-8 hover:border-primary/50 transition-all">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <Smartphone className="size-7" />
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      Per Privati & Cavalieri
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-3xl font-extrabold text-foreground">Equo App</h2>
                    <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                      L&apos;applicazione mobile-first per gestire salute, scadenze e costi del tuo cavallo in totale serenità.
                    </p>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden h-52 border border-border">
                    <Image
                      src="/images/18.png"
                      alt="Equo App"
                      fill
                      className="object-cover"
                    />
                  </div>

                  <ul className="space-y-3 pt-2 text-sm text-foreground">
                    <li className="flex items-start gap-3">
                      <Check className="size-4 text-primary shrink-0 mt-0.5" />
                      <span><strong>Libretto Sanitario Digitale:</strong> vaccini, Coggins test, visite e cicli di ferratura.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="size-4 text-primary shrink-0 mt-0.5" />
                      <span><strong>Promemoria Automatici:</strong> notifiche ed email prima delle scadenze sanitarie.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="size-4 text-primary shrink-0 mt-0.5" />
                      <span><strong>Registro Spese:</strong> controllo del budget mensile con ripartizione per categorie.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="size-4 text-primary shrink-0 mt-0.5" />
                      <span><strong>Assistente AI Equestre:</strong> risposte h24 su etologia, salute e nutrizione.</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <Button asChild className="w-full sm:w-auto font-bold">
                    <Link href="/servizi/app" className="inline-flex items-center justify-center gap-2">
                      <span>Dettaglio Equo App</span>
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full sm:w-auto">
                    <a
                      href="https://equo-app.netlify.app"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Installa PWA
                    </a>
                  </Button>
                </div>
              </div>

              {/* Product 2: Equo Scuderia */}
              <div className="rounded-3xl border-2 border-primary/30 bg-card p-8 sm:p-10 shadow-xl flex flex-col justify-between space-y-8 hover:border-primary transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[11px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">
                  Consigliato per Maneggi
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="size-14 rounded-2xl bg-secondary text-secondary-foreground flex items-center justify-center">
                      <Building2 className="size-7" />
                    </div>
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
                      Gestionale Centri Ippici
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-3xl font-extrabold text-foreground">Equo Scuderia</h2>
                    <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                      La piattaforma cloud per automatizzare la segreteria, monitorare i box e bilanciare il lavoro dei cavalli della scuola.
                    </p>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden h-52 border border-border">
                    <Image
                      src="/images/17.png"
                      alt="Equo Scuderia"
                      fill
                      className="object-cover"
                    />
                  </div>

                  <ul className="space-y-3 pt-2 text-sm text-foreground">
                    <li className="flex items-start gap-3">
                      <Check className="size-4 text-primary shrink-0 mt-0.5" />
                      <span><strong>Calendario Lezioni Condiviso:</strong> allievi prenotano via app e scalano i carnet in automatico.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="size-4 text-primary shrink-0 mt-0.5" />
                      <span><strong>Assegnazione Cavalli Equa:</strong> bilanciamento del carico di lavoro giornaliero della scuola.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="size-4 text-primary shrink-0 mt-0.5" />
                      <span><strong>Cruscotto a Semaforo:</strong> panoramica istantanea su certificati medici, patenti e Coggins.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="size-4 text-primary shrink-0 mt-0.5" />
                      <span><strong>Estratto Conto Mensile:</strong> invio automatico riepilogo spese pensione e servizi ai proprietari.</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <Button asChild className="w-full sm:w-auto font-bold shadow-md">
                    <Link href="/servizi/scuderia" className="inline-flex items-center justify-center gap-2">
                      <span>Dettaglio Gestionale</span>
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full sm:w-auto border-primary/40 text-primary font-semibold">
                    <a
                      href="https://equo-app.netlify.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="size-4 text-amber-500 fill-amber-400" />
                      <span>Prova Demo Live</span>
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="py-16 bg-muted/40 border-t border-border">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-3 mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                Confronto Funzionalità
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Scegli la combinazione ideale per le tue esigenze equestri
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/50 text-xs font-bold uppercase text-foreground">
                  <tr>
                    <th className="py-4 px-6">Funzionalità</th>
                    <th className="py-4 px-6 text-center text-primary">Equo App</th>
                    <th className="py-4 px-6 text-center text-secondary-foreground">Equo Scuderia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  <tr>
                    <td className="py-4 px-6 font-medium">Libretto Sanitario Digitale</td>
                    <td className="py-4 px-6 text-center"><Check className="size-4 text-emerald-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="size-4 text-emerald-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium">Promemoria Scadenze (Vaccini, Coggins, Maniscalco)</td>
                    <td className="py-4 px-6 text-center"><Check className="size-4 text-emerald-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="size-4 text-emerald-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium">Registro Spese Personale</td>
                    <td className="py-4 px-6 text-center"><Check className="size-4 text-emerald-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="size-4 text-emerald-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium">Assistente AI Equestre h24</td>
                    <td className="py-4 px-6 text-center"><Check className="size-4 text-emerald-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="size-4 text-emerald-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium">Prenotazione Lezioni da Smartphone</td>
                    <td className="py-4 px-6 text-center"><Check className="size-4 text-emerald-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="size-4 text-emerald-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium">Gestione Box e Registro Pensioni</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">—</td>
                    <td className="py-4 px-6 text-center"><Check className="size-4 text-emerald-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium">Cruscotto Semaforo Sanitario Multi-Cavallo</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">—</td>
                    <td className="py-4 px-6 text-center"><Check className="size-4 text-emerald-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium">Assegnazione Intelligente Cavalli della Scuola</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">—</td>
                    <td className="py-4 px-6 text-center"><Check className="size-4 text-emerald-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium">Fatturazione ed Estratto Conto Proprietari</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">—</td>
                    <td className="py-4 px-6 text-center"><Check className="size-4 text-emerald-500 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
