import Link from "next/link";
import Image from "next/image";
import { Sparkles, Download, ArrowRight, ShieldCheck, Bot, Building2, Smartphone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background pt-8 pb-16 lg:pt-14 lg:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Text & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5 text-amber-500 fill-amber-400" />
              <span>Nuova Release: Equo App & Gestionale Scuderia</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Prenditi cura del tuo cavallo.{" "}
              <span className="text-primary block mt-1">Semplifica la tua scuderia.</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
              L&apos;unico ecosistema digitale integrato: un&apos;<strong>App tascabile</strong> per i proprietari (libretto sanitario, spese e assistente AI 24/7) e un <strong>Gestionale completo</strong> per maneggi e centri ippici (lezioni, box e cruscotto a semaforo).
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Button asChild size="lg" className="w-full sm:w-auto text-base font-bold shadow-md hover:scale-[1.02] transition-transform">
                <a href="#scarica-app" className="inline-flex items-center gap-2">
                  <Download className="size-4" />
                  <span>Scarica Equo App</span>
                </a>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-base font-semibold border-primary/40 text-primary hover:bg-primary/10 transition-colors"
              >
                <a
                  href="https://equo-app.netlify.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <Sparkles className="size-4 text-amber-500 fill-amber-400" />
                  <span>Prova la Demo Live</span>
                  <ArrowRight className="size-4" />
                </a>
              </Button>
            </div>

            {/* Micro badges */}
            <div className="pt-6 border-t border-border/70 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground/80">Scadenze & Vaccini</span>
              </div>
              <div className="flex items-center gap-2">
                <Bot className="size-5 text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground/80">AI Equestre h24</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="size-5 text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground/80">Gestionale Box</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="size-5 text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground/80">Prenotazione Lezioni</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl overflow-hidden shadow-2xl border-4 border-background/60 group">
              <Image
                src="/images/14.png"
                alt="Equo - Prenditi cura del tuo cavallo"
                width={700}
                height={700}
                priority
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Glassmorphism Floating Pill */}
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-black/40 backdrop-blur-md p-3.5 text-white border border-white/20 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-3 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <div className="text-xs font-semibold">Demo Gestionale Attiva</div>
                      <div className="text-[11px] text-white/80">Nessuna registrazione richiesta</div>
                    </div>
                  </div>
                  <a
                    href="https://equo-app.netlify.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-white px-3 py-1 text-xs font-bold text-black hover:bg-white/90 transition-colors"
                  >
                    Apri Demo
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
