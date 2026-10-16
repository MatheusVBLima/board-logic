import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SvgFilters } from "@/components/SvgFilters";

export const metadata: Metadata = {
  title: "Board Lógica",
  description: "Simulador de circuitos lógicos isométrico: arraste portas, chaves e LEDs para o board, ligue os fios e veja o sinal acender.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c0d0e",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap" />
      </head>
      <body><SvgFilters />{children}</body>
    </html>
  );
}
