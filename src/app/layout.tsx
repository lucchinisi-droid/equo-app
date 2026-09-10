import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Equo — Prenditi cura del tuo cavallo",
  description:
    "Gestione sanitaria e amministrativa del cavallo: libretto digitale, scadenze, spese e assistente AI equestre.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#3f5d3a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="antialiased">{children}</body>
    </html>
  );
}
