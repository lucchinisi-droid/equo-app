import Link from "next/link";
import Image from "next/image";
import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { blogPosts } from "@/lib/blog-data";
import { Clock, Calendar, ArrowRight, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Blog & Guide Equestri — Equo",
  description: "Articoli, approfondimenti e guide pratiche sulla salute del cavallo, adempimenti veterinari e gestione moderna della scuderia.",
};

export default function BlogPage() {
  const featuredPost = blogPosts.find((p) => p.featured) || blogPosts[0];
  const regularPosts = blogPosts.filter((p) => p.slug !== featuredPost.slug);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MarketingNavbar />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="py-16 bg-gradient-to-b from-primary/10 via-background to-background border-b border-border/40">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3.5 py-1 text-xs font-bold text-primary uppercase tracking-wider">
              <BookOpen className="size-3.5" />
              Equo Magazine & Guide
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Conoscenza equestre al servizio del tuo cavallo
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Consigli veterinari, approfondimenti burocratici su FISE e Coggins test, e strategie per ottimizzare la vita in scuderia.
            </p>
          </div>
        </section>

        {/* Featured Post */}
        {featuredPost && (
          <section className="py-12 bg-background">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-xl hover:border-primary/50 transition-all">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  <div className="lg:col-span-7 relative h-72 sm:h-96 lg:h-auto min-h-[320px]">
                    <Image
                      src={featuredPost.image}
                      alt={featuredPost.title}
                      fill
                      priority
                      className="object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow">
                      In Evidenza • {featuredPost.category}
                    </div>
                  </div>

                  <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="size-3.5" />
                          {featuredPost.date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-3.5" />
                          {featuredPost.readTime}
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-snug">
                        <Link href={`/blog/${featuredPost.slug}`} className="hover:text-primary transition-colors">
                          {featuredPost.title}
                        </Link>
                      </h2>

                      <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                        {featuredPost.excerpt}
                      </p>
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-border">
                      <div className="text-xs">
                        <div className="font-bold text-foreground">{featuredPost.author.name}</div>
                        <div className="text-muted-foreground">{featuredPost.author.role}</div>
                      </div>

                      <Button asChild size="sm" className="font-semibold">
                        <Link href={`/blog/${featuredPost.slug}`} className="inline-flex items-center gap-1.5">
                          <span>Leggi Guida</span>
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Regular Posts Grid */}
        <section className="py-12 bg-muted/20 border-t border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h3 className="text-2xl font-bold text-foreground mb-8">Tutti gli Articoli</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularPosts.map((post) => (
                <article
                  key={post.slug}
                  className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="relative h-52 w-full overflow-hidden">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                        {post.category}
                      </div>
                    </div>

                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{post.date}</span>
                        <span>•</span>
                        <span>{post.readTime}</span>
                      </div>

                      <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                        <Link href={`/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h4>

                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground/80">{post.author.name}</span>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="font-bold text-primary inline-flex items-center gap-1 hover:underline"
                    >
                      Leggi →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Blog CTA Banner */}
        <section className="py-16 bg-primary text-primary-foreground text-center">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-5">
            <Sparkles className="size-8 mx-auto text-amber-300" />
            <h2 className="text-3xl font-extrabold">Hai dubbi specifici sulla salute del tuo cavallo?</h2>
            <p className="text-primary-foreground/90 text-sm sm:text-base">
              L&apos;assistente AI di Equo è a tua disposizione 24 ore su 24 per rispondere alle tue domande e aiutarti a monitorare le scadenze veterinarie.
            </p>
            <div className="pt-2">
              <Button asChild size="lg" variant="secondary" className="font-bold">
                <a
                  href="https://equo-app.netlify.app"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Fai una domanda all&apos;AI su Equo App
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
