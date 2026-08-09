/** @deprecated Usar MapMonitoringSection. Conservado por compatibilidad. */
"use client";

import dynamic from "next/dynamic";
import type { StationSummary } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

/**
 * Carga diferida del mapa Leaflet para evitar errores de SSR en Next.js.
 * Leaflet requiere acceso al objeto `window`, no disponible durante el render del servidor.
 */
const MonitoringMap = dynamic(
  () => import("@/components/map/MonitoringMap").then((mod) => mod.MonitoringMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-sm text-slate-500">
        Cargando mapa…
      </div>
    ),
  }
);

interface MapPlaceholderProps {
  summaries: StationSummary[];
}

/**
 * Contenedor del módulo de mapa en el dashboard.
 * Mantiene el mismo tamaño (h-72) y estructura de tarjeta del prototipo Fase 1.
 */
export function MapPlaceholder({ summaries }: MapPlaceholderProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Mapa del río Reque</CardTitle>
        <CardDescription>
          Estaciones P1–P6 · Lambayeque, Perú · Datos simulados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MonitoringMap summaries={summaries} />
      </CardContent>
    </Card>
  );
}
