"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, Apple, Check, Share2, PlusSquare, MoreVertical, Sparkles, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PwaDownloadGuide() {
  const [activePlatform, setActivePlatform] = useState<"ios" | "android">("ios");

  return (
    <section id="scarica-app" className="py-20 bg-background border-t border-border scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Image banner 15.png */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-background group">
              <Image
                src="/images/15.png"
                alt="Equo App - Libertà di gestione ovunque ti trovi"
                width={650}
                height={650}
                className="w-full h-[440px] sm:h-[480px] object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold">
                  <Smartphone className="size-3.5" />
                  PWA Mobile-First
                </div>
                <h4 className="text-xl font-bold">Nessun App Store da scaricare</h4>
                <p className="text-xs text-white/80 leading-relaxed">
                  Leggera, istantanea, sempre aggiornata e fruibile sia su iOS che su Android con la stessa fluidità di un&apos;app nativa.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Download & Installation Instructions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary uppercase tracking-wider">
                📲 Installazione Immediata
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Come installare Equo App sul tuo smartphone
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Equo è sviluppata come <strong>Progressive Web App (PWA)</strong>: questo significa che non occupa gigabyte di memoria, non richiede aggiornamenti continui dagli store e si apre a tutto schermo come una normale app.
              </p>
            </div>

            {/* Platform Selector Tabs */}
            <div className="inline-flex rounded-xl bg-muted p-1 border border-border">
              <button
                type="button"
                onClick={() => setActivePlatform("ios")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  activePlatform === "ios"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Apple className="size-4" />
                iPhone / iPad (iOS)
              </button>
              <button
                type="button"
                onClick={() => setActivePlatform("android")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  activePlatform === "android"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Smartphone className="size-4" />
                Smartphone Android
              </button>
            </div>

            {/* Instruction Steps */}
            {activePlatform === "ios" ? (
              <div className="space-y-3.5 rounded-2xl bg-card border border-border/80 p-5 sm:p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">Apri Safari su iPhone</div>
                    <div className="text-xs text-muted-foreground">
                      Visita l&apos;indirizzo <strong className="text-foreground">equo-app.netlify.app</strong> con il browser Safari.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground inline-flex items-center gap-1.5">
                      Tocca il tasto Condividi <Share2 className="size-3.5 text-primary inline" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Lo trovi nella barra dei comandi in basso al centro (il quadrato con la freccia rivolta verso l&apos;alto).
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground inline-flex items-center gap-1.5">
                      Scegli &quot;Aggiungi alla schermata Home&quot; <PlusSquare className="size-3.5 text-primary inline" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Scorri verso il basso l&apos;elenco delle opzioni e tocca &quot;Aggiungi alla schermata Home&quot;, poi conferma in alto a destra con &quot;Aggiungi&quot;.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-1 border-t border-border/50">
                  <Check className="size-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-foreground font-medium">
                    Fatto! L&apos;icona di Equo comparirà sulla tua Home screen e si aprirà a schermo intero come un&apos;app vera e propria.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 rounded-2xl bg-card border border-border/80 p-5 sm:p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">Apri Chrome su Android</div>
                    <div className="text-xs text-muted-foreground">
                      Visita il sito <strong className="text-foreground">equo-app.netlify.app</strong>.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground inline-flex items-center gap-1.5">
                      Tocca i tre puntini <MoreVertical className="size-3.5 text-primary inline" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Tocca i tre puntini in alto a destra nel browser Chrome.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">
                      Seleziona &quot;Installa app&quot; o &quot;Aggiungi a Home&quot;
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Conferma l&apos;installazione: l&apos;app verrà aggiunta automaticamente al tuo drawer delle applicazioni.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-1 border-t border-border/50">
                  <Check className="size-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-foreground font-medium">
                    Pronta all&apos;uso! Accessibile con un tap anche senza connessione internet per consultare i dati del tuo cavallo.
                  </div>
                </div>
              </div>
            )}

            {/* Direct Open Button */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button asChild size="lg" className="w-full sm:w-auto font-bold text-base shadow-md">
                <a
                  href="https://equo-app.netlify.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <Download className="size-4" />
                  <span>Apri & Installa Equo App Ora</span>
                </a>
              </Button>

              <span className="text-xs text-muted-foreground text-center sm:text-left">
                Gratis per iniziare. Funziona su qualunque telefono o tablet.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
