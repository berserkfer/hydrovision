import type { Metadata } from "next";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "HydroVision — Monitoreo Río Reque",
  description:
    "Plataforma inteligente para el monitoreo de la calidad del agua del río Reque, Lambayeque, Perú.",
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
        </ThemeProvider>
      </body>
    </html>
  );
}
