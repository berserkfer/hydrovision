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
  normal: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
  atencion: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
  advertencia: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]",
  critico: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]",
};

const LEVEL_BG: Record<ExecutiveAlert["level"], string> = {
  normal: "border-emerald-500/15 bg-emerald-500/5",
  atencion: "border-amber-500/15 bg-amber-500/5",
  advertencia: "border-orange-500/15 bg-orange-500/5",
  critico: "border-red-500/15 bg-red-500/5",
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
          <ul className="space-y-2">
            {visible.map((alert) => (
              <li
                key={alert.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg border px-3 py-2.5",
                  LEVEL_BG[alert.level]
                )}
              >
                <span
                  className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", LEVEL_DOT[alert.level])}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--hv-foreground)]">
                    <span className="mr-1" aria-hidden>
                      {alert.emoji}
                    </span>
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
