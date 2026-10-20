"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import type { ExecutiveAlert } from "@/types/executive";
import { cn } from "@/lib/utils";

interface RecentAlertsPanelProps {
  alerts: ExecutiveAlert[];
  maxItems?: number;
}

const LEVEL_DOT: Record<ExecutiveAlert["level"], string> = {
  normal: "bg-emerald-500",
  atencion: "bg-amber-500",
  advertencia: "bg-orange-500",
  critico: "bg-red-500",
};

const LEVEL_LABEL: Record<ExecutiveAlert["level"], string> = {
  normal: "Normal",
  atencion: "Atención",
  advertencia: "Advertencia",
  critico: "Crítico",
};

const LEVEL_BG: Record<ExecutiveAlert["level"], string> = {
  normal: "border-l-emerald-500",
  atencion: "border-l-amber-500",
  advertencia: "border-l-orange-500",
  critico: "border-l-red-500",
};

export function RecentAlertsPanel({ alerts, maxItems = 4 }: RecentAlertsPanelProps) {
  const visible = alerts.slice(0, maxItems);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Alertas recientes</CardTitle>
        <CardDescription>Solo alertas relevantes · simuladas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {visible.length === 0 ? (
          <p className="text-sm text-[var(--hv-foreground-muted)]">
            No hay alertas activas en este momento.
          </p>
        ) : (
          <ul className="space-y-3.5">
            {visible.map((alert) => (
              <li
                key={alert.id}
                className={cn(
                  "flex items-start gap-3 border-l-2 py-1 pl-3",
                  LEVEL_BG[alert.level]
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="mb-0.5 flex items-center gap-1.5 text-[9.5px] font-medium uppercase tracking-[0.16em] text-[var(--hv-foreground-dim)]" aria-hidden>
                    <span className={cn("h-1.5 w-1.5 rounded-full", LEVEL_DOT[alert.level])} />
                    {LEVEL_LABEL[alert.level]}
                  </p>
                  <p className="text-sm font-medium text-[var(--hv-foreground)]">
                    <span className="sr-only">{LEVEL_LABEL[alert.level]}: </span>
                    {alert.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-[var(--hv-foreground-muted)]">
                    {alert.explanation}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/evaluacion-ambiental"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--hv-primary)] transition-colors hover:opacity-80"
        >
          Ver todas las alertas
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
