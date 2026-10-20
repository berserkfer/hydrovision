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
    ? ENVIRONMENTAL_RISK_LABELS[riskAssessment.level]
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

const STATUS_MARK: Record<KpiCardConfig["status"], string> = {
  good: "bg-emerald-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
  neutral: "bg-[var(--hv-foreground-dim)]",
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
      <div className="grid overflow-hidden rounded-[5px] border border-[var(--hv-border)] bg-[var(--hv-surface)] sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <article
              key={card.label}
              className={cn(
                "relative p-5",
                i > 0 && "border-t border-[var(--hv-border)] sm:border-t-0",
                i % 2 === 1 && "sm:border-l",
                i >= 2 && "sm:border-t xl:border-t-0",
                i > 0 && "xl:border-l",
                "border-[var(--hv-border)]"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="hv-eyebrow text-[9.5px]">{card.label}</p>
                <Icon className="h-4 w-4 text-[var(--hv-foreground-dim)]" strokeWidth={1.4} aria-hidden />
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-[34px] font-light leading-none tracking-[-0.02em] text-[var(--hv-ink)] tabular-nums">
                  {card.value}
                </span>
                {card.unit && (
                  <span className="hv-num text-[11px] text-[var(--hv-foreground-dim)]">{card.unit}</span>
                )}
              </div>
              <p className={cn("mt-3 flex items-center gap-1.5 text-xs font-medium", TREND_COLOR[card.trendDirection])}>
                <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_MARK[card.status])} aria-hidden />
                {card.trend}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
