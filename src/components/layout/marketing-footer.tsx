import Link from "next/link";
import Image from "next/image";
import { Sparkles, Mail, Heart, ShieldCheck, Smartphone, Building2 } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-card/60 text-card-foreground transition-colors">
      {/* Top Banner CTA */}
      <div className="border-b border-border/60 bg-primary/5 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Vuoi portare la tua scuderia o i tuoi cavalli nel futuro?
            </h3>
            <p className="text-sm text-muted-foreground">
              Prova la demo interattiva gratuita in 30 secondi, senza installazione o carta di credito.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://equo-app.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-all"
            >
              <Sparkles className="size-4 text-amber-300 fill-amber-300" />
              Lancia Demo Gestionale
            </a>
            <Link
              href="/contatti"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-all"
            >
              Contatta il Team
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Col (2 cols wide on desktop) */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/logo-equo.png"
                alt="Equo"
                width={200}
                height={60}
                className="h-12 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              L&apos;ecosistema digitale completo per la gestione sanitaria, amministrativa e organizzativa del cavallo e delle scuderie.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <ShieldCheck className="size-4 text-primary" />
              <span>Dati ospitati su infrastruttura europea protetta (GDPR compliant).</span>
            </div>
          </div>

          {/* Equo App */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-sm font-bold text-foreground tracking-wide uppercase">
              <Smartphone className="size-4 text-primary" />
              <span>Equo App</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/servizi/app" className="hover:text-foreground transition-colors">
                  Libretto Sanitario Digitale
                </Link>
              </li>
              <li>
                <Link href="/servizi/app" className="hover:text-foreground transition-colors">
                  Promemoria Vaccini & Coggins
                </Link>
              </li>
              <li>
                <Link href="/servizi/app" className="hover:text-foreground transition-colors">
                  Registro Spese & Budget
                </Link>
              </li>
              <li>
                <Link href="/servizi/app" className="hover:text-foreground transition-colors">
                  Assistente AI Equestre h24
                </Link>
              </li>
              <li>
                <a
                  href="https://equo-app.netlify.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  Installa PWA Mobile →
                </a>
              </li>
            </ul>
          </div>

          {/* Equo Scuderia */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-sm font-bold text-foreground tracking-wide uppercase">
              <Building2 className="size-4 text-primary" />
              <span>Equo Scuderia</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/servizi/scuderia" className="hover:text-foreground transition-colors">
                  Gestionale Maneggi & Centri Ippici
                </Link>
              </li>
              <li>
                <Link href="/servizi/scuderia" className="hover:text-foreground transition-colors">
                  Calendario Lezioni & Carnet
                </Link>
              </li>
              <li>
                <Link href="/servizi/scuderia" className="hover:text-foreground transition-colors">
                  Cruscotto a Semaforo Sanitario
                </Link>
              </li>
              <li>
                <Link href="/servizi/scuderia" className="hover:text-foreground transition-colors">
                  Estratto Conto Spese Proprietari
                </Link>
              </li>
              <li>
                <a
                  href="https://equo-app.netlify.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  Demo Gestionale Online →
                </a>
              </li>
            </ul>
          </div>

          {/* Risorse & Contatti */}
          <div className="space-y-3">
            <div className="text-sm font-bold text-foreground tracking-wide uppercase">
              Info & Contatti
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/blog" className="hover:text-foreground transition-colors">
                  Blog & Guide Pratiche
                </Link>
              </li>
              <li>
                <Link href="/contatti" className="hover:text-foreground transition-colors">
                  Richiedi Demo Personalizzata
                </Link>
              </li>
              <li>
                <Link href="/contatti" className="hover:text-foreground transition-colors">
                  Assistenza Tecnica
                </Link>
              </li>
              <li className="pt-1">
                <a
                  href="mailto:gestione.equo@gmail.com"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="size-3.5" />
                  gestione.equo@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>
            © {new Date().getFullYear()} Equo — Tutti i diritti riservati. PWA & Web App mobile-first.
          </div>
          <div className="flex items-center gap-1">
            Progettato con <Heart className="size-3.5 text-red-500 fill-red-500 inline" /> per chi vive con i cavalli.
          </div>
        </div>
      </div>
    </footer>
  );
}
