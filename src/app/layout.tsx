import type { Metadata } from "next";
import { ToastProvider } from "@/components/providers/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "HydroVision — Monitoreo Río Reque",
  description:
    "Plataforma inteligente para el monitoreo de la calidad del agua del río Reque, Lambayeque, Perú.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
