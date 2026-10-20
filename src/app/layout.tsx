import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-hv-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-hv-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HydroVision — Predicción Satelital Dren 4000",
  description:
    "Plataforma inteligente de monitoreo y predicción satelital de calidad del agua — Dren 4000, Santa Rosa, Lambayeque, Perú.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#f3f1eb",
};

const themeInitScript = `(function(){try{var t=localStorage.getItem('hv-theme-v2');if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.dataset.theme='dark';}else{document.documentElement.classList.remove('dark');document.documentElement.dataset.theme='light';}}catch(e){document.documentElement.dataset.theme='light';}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="hv-paper">
        <ThemeProvider>
          {children}
          <ToastProvider />
          <ServiceWorkerRegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}
