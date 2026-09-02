"use client";

import { AlertTriangle, Droplets, Gauge, Shield } from "lucide-react";
import type { DashboardStats } from "@/types";
import type { ExecutiveKpiMetrics } from "@/types/executive";
import type { EnvironmentalRiskAssessment } from "@/types/risk";
import { ENVIRONMENTAL_RISK_LABELS } from "@/types/risk";
import { cn } from "@/lib/utils";

interface ControlCenterKpiCardsProps {
  stats: DashboardStats;
  kpis: ExecutiveKpiMetrics;
  riskAssessment: EnvironmentalRiskAssessment | null;
  activeAlertsCount: number;
}

interface KpiCardConfig {
  label: string;
  value: string;
  unit?: string;
  trend: string;
  trendDirection: "up" | "down" | "stable";
  status: "good" | "warning" | "critical" | "neutral";
  icon: typeof Droplets;
}

function resolveGeneralIndex(kpis: ExecutiveKpiMetrics, riskAssessment: EnvironmentalRiskAssessment | null): number {
  const riskComponent = riskAssessment ? Math.max(0, 100 - Math.round(riskAssessment.index)) : 50;
  return Math.round((kpis.ecaCompliancePercent + riskComponent) / 2);
}

function buildKpis(
  stats: DashboardStats,
  kpis: ExecutiveKpiMetrics,
  riskAssessment: EnvironmentalRiskAssessment | null,
  activeAlertsCount: number
): KpiCardConfig[] {
  const waterQuality = Math.round(kpis.ecaCompliancePercent);
  const generalIndex = resolveGeneralIndex(kpis, riskAssessment);
  const riskLabel = riskAssessment
    ? ENVIRONMENTAL_RISK_LABELS[riskAssessment.level].toUpperCase()
    : "N/D";

  const waterTrend =
    stats.nonCompliantCount > 0 ? "Deterioro" : stats.alertCount > 0 ? "Estable" : "Mejora";
  const riskTrend = riskAssessment && riskAssessment.index > 50 ? "Al alza" : "Controlado";

  return [
    {
      label: "Calidad del agua",
      value: String(waterQuality),
      unit: "índice",
      trend: waterTrend,
      trendDirection: stats.nonCompliantCount > 0 ? "down" : stats.alertCount > 0 ? "stable" : "up",
      status: stats.nonCompliantCount > 0 ? "critical" : stats.alertCount > 0 ? "warning" : "good",
      icon: Droplets,
    },
    {
      label: "Riesgo ambiental",
      value: riskLabel,
      trend: riskTrend,
      trendDirection: riskAssessment && riskAssessment.index > 50 ? "up" : "down",
      status:
        riskAssessment?.level === "muy_alto" || riskAssessment?.level === "alto"
          ? "critical"
          : riskAssessment?.level === "moderado"
            ? "warning"
            : "good",
      icon: Shield,
    },
    {
      label: "Índice general",
      value: String(generalIndex),
      unit: "/100",
      trend: generalIndex >= 75 ? "Favorable" : generalIndex >= 50 ? "Moderado" : "Atención",
      trendDirection: generalIndex >= 75 ? "up" : generalIndex >= 50 ? "stable" : "down",
      status: generalIndex >= 75 ? "good" : generalIndex >= 50 ? "warning" : "critical",
      icon: Gauge,
    },
    {
      label: "Alertas activas",
      value: String(activeAlertsCount),
      trend: activeAlertsCount === 0 ? "Sin novedades" : `${activeAlertsCount} pendiente(s)`,
      trendDirection: activeAlertsCount > 0 ? "up" : "stable",
      status: activeAlertsCount >= 3 ? "critical" : activeAlertsCount > 0 ? "warning" : "good",
      icon: AlertTriangle,
    },
  ];
}

const STATUS_BORDER: Record<KpiCardConfig["status"], string> = {
  good: "border-emerald-500/30",
  warning: "border-amber-500/30",
  critical: "border-red-500/30",
  neutral: "border-[var(--hv-border)]",
};

const STATUS_ACCENT: Record<KpiCardConfig["status"], string> = {
  good: "text-emerald-600 bg-emerald-500/10 ring-emerald-500/20 dark:text-emerald-400",
  warning: "text-amber-600 bg-amber-500/10 ring-amber-500/20 dark:text-amber-400",
  critical: "text-red-600 bg-red-500/10 ring-red-500/20 dark:text-red-400",
  neutral: "text-[var(--hv-foreground-muted)] bg-[var(--hv-surface-secondary)] ring-[var(--hv-border)]",
};

const TREND_COLOR: Record<KpiCardConfig["trendDirection"], string> = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-red-600 dark:text-red-400",
  stable: "text-[var(--hv-foreground-dim)]",
};

export function ControlCenterKpiCards({
  stats,
  kpis,
  riskAssessment,
  activeAlertsCount,
}: ControlCenterKpiCardsProps) {
  const cards = buildKpis(stats, kpis, riskAssessment, activeAlertsCount);

  return (
    <section aria-label="Resumen general">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.label}
              className={cn(
                "hv-card rounded-2xl border bg-[var(--hv-surface)] p-5 transition-all duration-300 hover:border-[var(--hv-primary)]/30",
                STATUS_BORDER[card.status]
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--hv-foreground-muted)]">
                    {card.label}
                  </p>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold tabular-nums tracking-tight text-[var(--hv-foreground)]">
                      {card.value}
                    </span>
                    {card.unit && (
                      <span className="text-xs font-medium text-[var(--hv-foreground-dim)]">
                        {card.unit}
                      </span>
                    )}
                  </div>
                  <p className={cn("mt-2 text-xs font-medium", TREND_COLOR[card.trendDirection])}>
                    {card.trend}
                  </p>
                </div>
                <div className={cn("rounded-xl p-2.5 ring-1 ring-inset", STATUS_ACCENT[card.status])}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
