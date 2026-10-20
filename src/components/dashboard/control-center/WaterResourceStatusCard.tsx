"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import type { WatershedQualityStatus } from "@/types/executive";
import { cn } from "@/lib/utils";

export type WaterResourceLevel = "bueno" | "atencion" | "critico";

interface WaterResourceStatusCardProps {
  qualityStatus: WatershedQualityStatus;
  description: string;
  riverName: string;
}

const LEVEL_CONFIG: Record<
  WaterResourceLevel,
  { emoji: string; label: string; ring: string; badge: string; text: string }
> = {
  bueno: {
    emoji: "🟢",
    label: "Bueno",
    ring: "ring-emerald-500/20",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    text: "Los indicadores disponibles se encuentran dentro de los rangos establecidos.",
  },
  atencion: {
    emoji: "🟡",
    label: "Atención",
    ring: "ring-amber-500/20",
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    text: "Se detectaron variaciones que requieren seguimiento. Revise los módulos de monitoreo.",
  },
  critico: {
    emoji: "🔴",
    label: "Crítico",
    ring: "ring-red-500/20",
    badge: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
    text: "Existen indicadores fuera de rango. Se recomienda evaluación inmediata.",
  },
};

function mapQualityToLevel(status: WatershedQualityStatus): WaterResourceLevel {
  if (status === "critico") return "critico";
  if (status === "alerta") return "atencion";
  return "bueno";
}

export function WaterResourceStatusCard({
  qualityStatus,
  description,
  riverName,
}: WaterResourceStatusCardProps) {
  const level = mapQualityToLevel(qualityStatus);
  const config = LEVEL_CONFIG[level];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Estado del recurso hídrico</CardTitle>
        <CardDescription>{riverName} · Datos simulados de demostración</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-1">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--hv-foreground-muted)]">
              Estado actual
            </p>
            <span
              className={cn(
                "mt-1 inline-flex rounded-[3px] border px-2.5 py-0.5 text-sm font-medium",
                config.badge
              )}
            >
              {config.label}
            </span>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-[var(--hv-foreground-muted)]">
          {description || config.text}
        </p>
      </CardContent>
    </Card>
  );
}
