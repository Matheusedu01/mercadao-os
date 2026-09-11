import type { Metadata, Viewport } from "next";
import { Sora, Public_Sans } from "next/font/google";
import { ServiceWorkerRegistro } from "@/components/service-worker-registro";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mercadão O.S.",
  description: "Sistema de ordens de serviço — Mercadão Atacadista",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mercadão O.S.",
  },
};

export const viewport: Viewport = {
  themeColor: "#2D3033",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${sora.variable} ${publicSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <ServiceWorkerRegistro />
      </body>
    </html>
  );
}
