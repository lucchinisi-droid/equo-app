"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles, LogIn, ExternalLink, ChevronDown, Smartphone, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarketingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-[1.02]">
          <Image
            src="/logo-equo.png"
            alt="Equo"
            width={220}
            height={65}
            priority
            className="h-11 sm:h-13 w-auto object-contain"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <Link
            href="/"
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive("/") && pathname === "/"
                ? "text-primary bg-primary/10 font-semibold"
                : "text-foreground/80 hover:text-foreground hover:bg-muted"
            }`}
          >
            Home
          </Link>

          {/* Servizi Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setServicesDropdownOpen(true)}
            onMouseLeave={() => setServicesDropdownOpen(false)}
          >
            <Link
              href="/servizi"
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/servizi")
                  ? "text-primary bg-primary/10 font-semibold"
                  : "text-foreground/80 hover:text-foreground hover:bg-muted"
              }`}
            >
              Servizi
              <ChevronDown className={`size-4 transition-transform duration-200 ${servicesDropdownOpen ? "rotate-180" : ""}`} />
            </Link>

            {servicesDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 rounded-xl border border-border bg-card p-2 shadow-lg animate-in fade-in zoom-in-95 duration-150">
                <Link
                  href="/servizi/app"
                  onClick={() => setServicesDropdownOpen(false)}
                  className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-muted transition-colors group"
                >
                  <div className="rounded-md bg-primary/10 p-2 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Smartphone className="size-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Equo App</div>
                    <div className="text-xs text-muted-foreground">Per proprietari e cavalieri</div>
                  </div>
                </Link>
                <Link
                  href="/servizi/scuderia"
                  onClick={() => setServicesDropdownOpen(false)}
                  className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-muted transition-colors group"
                >
                  <div className="rounded-md bg-secondary p-2 text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Building2 className="size-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Equo Scuderia</div>
                    <div className="text-xs text-muted-foreground">Gestionale per centri ippici</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/blog"
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive("/blog")
                ? "text-primary bg-primary/10 font-semibold"
                : "text-foreground/80 hover:text-foreground hover:bg-muted"
            }`}
          >
            Blog
          </Link>

          <Link
            href="/contatti"
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive("/contatti")
                ? "text-primary bg-primary/10 font-semibold"
                : "text-foreground/80 hover:text-foreground hover:bg-muted"
            }`}
          >
            Contatti
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Prova la Demo */}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary font-medium"
          >
            <a
              href="https://equo-app.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5"
            >
              <Sparkles className="size-3.5 text-amber-500 fill-amber-400" />
              <span>Prova la Demo</span>
            </a>
          </Button>

          {/* Accedi al Gestionale */}
          <Button asChild size="sm" className="shadow-sm font-semibold">
            <a
              href="https://equo-app.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5"
            >
              <LogIn className="size-3.5" />
              <span>Accedi al Gestionale</span>
            </a>
          </Button>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <Button
            asChild
            size="sm"
            className="text-xs px-2.5 h-8 font-semibold"
          >
            <a
              href="https://equo-app.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Gestionale
            </a>
          </Button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-foreground/80 hover:bg-muted hover:text-foreground focus:outline-none"
            aria-label="Apri menu"
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
          <div className="space-y-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-base font-medium ${
                isActive("/") && pathname === "/" ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-muted"
              }`}
            >
              Home
            </Link>
            <Link
              href="/servizi/app"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-base font-medium ${
                isActive("/servizi/app") ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-muted"
              }`}
            >
              🐴 Equo App (Proprietari)
            </Link>
            <Link
              href="/servizi/scuderia"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-base font-medium ${
                isActive("/servizi/scuderia") ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-muted"
              }`}
            >
              🏡 Equo Scuderia (Gestionale)
            </Link>
            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-base font-medium ${
                isActive("/blog") ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-muted"
              }`}
            >
              Blog & Guide
            </Link>
            <Link
              href="/contatti"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-base font-medium ${
                isActive("/contatti") ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-muted"
              }`}
            >
              Contatti & Assistenza
            </Link>
          </div>

          <div className="pt-3 border-t border-border flex flex-col gap-2.5">
            <Button
              asChild
              variant="outline"
              className="w-full justify-center border-primary/40 text-primary font-semibold"
            >
              <a
                href="https://equo-app.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Sparkles className="size-4 mr-2 text-amber-500 fill-amber-400" />
                Vedi Versione Demo Live
              </a>
            </Button>
            <Button
              asChild
              className="w-full justify-center font-bold"
            >
              <a
                href="https://equo-app.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogIn className="size-4 mr-2" />
                Accedi al Gestionale
              </a>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
