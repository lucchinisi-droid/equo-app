import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { ContactForm } from "@/components/contact/contact-form";
import { Mail, Sparkles, Clock, ShieldCheck, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Contattaci & Richiedi Demo — Equo",
  description: "Parla con il team di Equo: richiedi una dimostrazione gratuita per il tuo centro ippico o richiedi supporto per Equo App.",
};

const faqs = [
  {
    q: "Come posso vedere il gestionale in azione?",
    a: "Puoi aprire immediatamente la versione Demo Online cliccando sul pulsante qui a fianco: è attiva 24/7, già popolata con cavalli e lezioni fittizie, senza bisogno di registrazione.",
  },
  {
    q: "Come avviene l'attivazione per un centro ippico?",
    a: "Dopo una breve videochiamata di presentazione, ti aiutiamo a configurare l'anagrafica dei box, gli orari delle lezioni e a invitare i tuoi allievi e proprietari con un link dedicato.",
  },
  {
    q: "Posso esportare i dati in qualsiasi momento?",
    a: "Sì, tutti i dati sanitari, le spese e i calendari rimangono di tua esclusiva proprietà e possono essere esportati in formato aperto (PDF / Excel).",
  },
];

export default function ContattiPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MarketingNavbar />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="py-16 bg-gradient-to-b from-primary/10 via-background to-background border-b border-border/40">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3.5 py-1 text-xs font-bold text-primary uppercase tracking-wider">
              Siamo qui per aiutarti
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Parla con noi o richiedi una demo
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Che tu voglia digitalizzare il tuo maneggio o abbia curiosità su Equo App, risponderemo rapidamente a ogni tua domanda.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Column: Form (7 cols) */}
              <div className="lg:col-span-7">
                <ContactForm />
              </div>

              {/* Right Column: Fast Demo Access & Info (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Instant Demo Card */}
                <div className="rounded-3xl border-2 border-primary/30 bg-card p-6 sm:p-8 shadow-md space-y-4 relative overflow-hidden">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    <Sparkles className="size-3.5 text-amber-500 fill-amber-400" />
                    Accesso Istantaneo
                  </div>

                  <h3 className="text-xl font-bold text-foreground">
                    Non vuoi aspettare una risposta?
                  </h3>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Puoi esplorare l&apos;applicazione e il gestionale <strong>adesso</strong>: la nostra versione demo include cavalli di prova, calendario lezioni, registro spese e chat con l&apos;assistente AI.
                  </p>

                  <Button asChild size="lg" className="w-full font-bold shadow-md">
                    <a
                      href="https://equo-app.netlify.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2"
                    >
                      <Sparkles className="size-4 text-amber-300 fill-amber-300" />
                      <span>Lancia la Demo Live Subito</span>
                    </a>
                  </Button>
                </div>

                {/* Direct Contact Info */}
                <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-5">
                  <h4 className="text-base font-bold text-foreground">Recapiti Diretti</h4>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Mail className="size-4 text-primary shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-foreground">Email Ufficiale</div>
                        <a href="mailto:gestione.equo@gmail.com" className="hover:text-primary transition-colors">
                          gestione.equo@gmail.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Clock className="size-4 text-primary shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-foreground">Tempi di Risposta</div>
                        <div>Entro 24 ore lavorative (Lun - Sab)</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-muted-foreground">
                      <ShieldCheck className="size-4 text-primary shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-foreground">Sicurezza & Privacy</div>
                        <div>Server UE • Conforme GDPR</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick FAQs */}
                <div className="rounded-3xl border border-border bg-muted/40 p-6 sm:p-8 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <HelpCircle className="size-4 text-primary" />
                    <span>Domande Frequenti</span>
                  </div>

                  <div className="space-y-3">
                    {faqs.map((faq, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="text-xs font-bold text-foreground">{faq.q}</div>
                        <div className="text-xs text-muted-foreground leading-relaxed">{faq.a}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
