import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import "./globals.css";

export const metadata: Metadata = {
  title: "HydroVision — Predicción Satelital Dren 4000",
  description:
    "Plataforma inteligente de monitoreo y predicción satelital de calidad del agua — Dren 4000, Santa Rosa, Lambayeque, Perú.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0891b2",
};

const themeInitScript = `(function(){try{var t=localStorage.getItem('hv-theme');if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.dataset.theme='light';}else{document.documentElement.classList.add('dark');document.documentElement.dataset.theme='dark';}}catch(e){document.documentElement.classList.add('dark');document.documentElement.dataset.theme='dark';}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <ToastProvider />
          <ServiceWorkerRegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}
