import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { blogPosts, getPostBySlug, getRelatedPosts } from "@/lib/blog-data";
import { ArrowLeft, Clock, Calendar, Share2, Sparkles, Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Articolo non trovato — Equo" };

  return {
    title: `${post.title} — Equo Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const related = getRelatedPosts(slug, 2);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MarketingNavbar />

      <main className="flex-1 py-12 sm:py-16">
        <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Breadcrumb / Back button */}
          <div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" />
              Torna al Blog
            </Link>
          </div>

          {/* Header Metadata */}
          <div className="space-y-4 text-center sm:text-left">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {post.category}
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.2]">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-muted-foreground pt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                {post.date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {post.readTime}
              </span>
              <span>•</span>
              <span className="font-semibold text-foreground">Scritto da {post.author.name}</span>
            </div>
          </div>

          {/* Main Hero Image */}
          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-border h-80 sm:h-[450px]">
            <Image
              src={post.image}
              alt={post.title}
              fill
              priority
              className="object-cover"
            />
          </div>

          {/* Article Excerpt Callout */}
          <div className="rounded-2xl border-l-4 border-primary bg-primary/5 p-6 text-foreground font-medium text-base sm:text-lg italic leading-relaxed">
            &ldquo;{post.excerpt}&rdquo;
          </div>

          {/* Content Paragraphs */}
          <div className="space-y-6 text-foreground/90 text-base sm:text-lg leading-relaxed">
            {post.content.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          {/* Tags */}
          <div className="pt-6 border-t border-border flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground mr-2">Argomenti:</span>
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg bg-muted px-3 py-1 text-xs font-medium text-foreground/80"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Author Box */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
            <div className="size-16 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center shrink-0">
              {post.author.name.charAt(0)}
            </div>
            <div className="text-center sm:text-left space-y-1">
              <div className="text-base font-bold text-foreground">{post.author.name}</div>
              <div className="text-xs text-primary font-semibold">{post.author.role}</div>
              <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                Autore e collaboratore per l&apos;ecosistema informativo di Equo. Promuove la cultura del benessere del cavallo e la semplificazione delle attività in scuderia.
              </p>
            </div>
          </div>

          {/* In-article CTA */}
          <div className="rounded-3xl bg-gradient-to-r from-primary/15 via-primary/5 to-secondary/30 border border-primary/20 p-8 text-center space-y-4 shadow-sm">
            <Sparkles className="size-6 text-primary mx-auto" />
            <h3 className="text-xl font-bold text-foreground">
              Non perdere mai più una scadenza del tuo cavallo
            </h3>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Equo calcola automaticamente i richiami di vaccini, test Coggins e ferrature e ti invia notifiche in anticipo.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="default" className="font-bold">
                <a
                  href="https://equo-app.netlify.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <Download className="size-4" />
                  <span>Prova Equo App Gratis</span>
                </a>
              </Button>
            </div>
          </div>

          {/* Related Articles */}
          {related.length > 0 && (
            <div className="pt-10 border-t border-border space-y-6">
              <h3 className="text-2xl font-bold text-foreground">Articoli Correlati</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {related.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/blog/${item.slug}`}
                    className="group rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="relative h-40 rounded-xl overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="text-xs font-semibold text-primary">{item.category}</div>
                      <h4 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                        {item.title}
                      </h4>
                    </div>
                    <div className="pt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.readTime}</span>
                      <span className="font-bold text-primary inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Leggi →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      <MarketingFooter />
    </div>
  );
}
