"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PawPrint, Wallet, MessageCircle, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/horses", label: "Cavalli", icon: PawPrint },
  { href: "/expenses", label: "Spese", icon: Wallet },
  { href: "/assistant", label: "Assistente", icon: MessageCircle },
  { href: "/services", label: "Servizi", icon: MapPin },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden">
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px]",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
