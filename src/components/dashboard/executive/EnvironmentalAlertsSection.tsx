"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import type { ExecutiveAlert } from "@/types/executive";
import { cn } from "@/lib/utils";

interface EnvironmentalAlertsSectionProps {
  alerts: ExecutiveAlert[];
}

const ALERT_BG: Record<ExecutiveAlert["level"], string> = {
  normal: "border-emerald-200 bg-emerald-50/50",
  atencion: "border-amber-200 bg-amber-50/50",
  advertencia: "border-orange-200 bg-orange-50/50",
  critico: "border-red-200 bg-red-50/50",
};

export function EnvironmentalAlertsSection({ alerts }: EnvironmentalAlertsSectionProps) {
  return (
    <section className="hv-animate-fade-in space-y-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Alertas ambientales
        </h2>
        <p className="text-xs text-slate-400">Clasificación automática con explicación</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {alerts.map((alert) => (
          <Card
            key={alert.id}
            className={cn(
              "transition-all duration-300 hover:shadow-md",
              ALERT_BG[alert.level]
            )}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <span>{alert.emoji}</span>
                {alert.title}
              </CardTitle>
              <CardDescription className="font-medium text-slate-600">
                {alert.levelLabel}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs leading-relaxed text-slate-600">{alert.explanation}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
