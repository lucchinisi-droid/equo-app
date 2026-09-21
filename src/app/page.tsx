import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { HeroSection } from "@/components/home/hero-section";
import { AppFeatures } from "@/components/home/app-features";
import { ScuderiaFeatures } from "@/components/home/scuderia-features";
import { PwaDownloadGuide } from "@/components/home/pwa-download-guide";
import { PhotoGallery } from "@/components/home/photo-gallery";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      {/* Global Marketing Navigation */}
      <MarketingNavbar />

      <main className="flex-1">
        {/* 1. Hero Section with 14.png & CTAs */}
        <HeroSection />

        {/* 2. Equo App for Horse Owners (10.png, 5.png, 18.png) */}
        <AppFeatures />

        {/* 3. Equo Scuderia (Gestionale) with 17.png */}
        <ScuderiaFeatures />

        {/* 4. PWA Download & Installation Guide with 15.png */}
        <PwaDownloadGuide />

        {/* 5. Photographic Showcase (19.png, 6.png, 8.png, 7.png, 16.png, 12.png) */}
        <PhotoGallery />

        {/* 6. Waitlist & Early Bird Beta CTA */}
        <section className="py-20 bg-gradient-to-b from-background via-primary/5 to-muted/50 border-t border-border">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1.5 text-xs font-bold text-secondary-foreground">
              <Sparkles className="size-3.5 text-amber-500 fill-amber-500" />
              Offerta di Lancio per i primi 250 iscritti
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Entra subito nel programma Beta di Equo
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              I primi <strong className="text-foreground">250 iscritti</strong> riceveranno{" "}
              <strong className="text-foreground">6 mesi della versione Pro completamente gratuiti</strong>. Inserisci la tua email per riservare il tuo posto e accedere per primo alle novità.
            </p>

            <div className="pt-2 max-w-xl mx-auto">
              <WaitlistForm role="proprietario" />
            </div>

            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-primary" />
                <span>Nessuna carta di credito richiesta</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div>Disiscrizione in 1 click in qualsiasi momento</div>
            </div>
          </div>
        </section>
      </main>

      {/* Global Marketing Footer */}
      <MarketingFooter />
    </div>
  );
}
