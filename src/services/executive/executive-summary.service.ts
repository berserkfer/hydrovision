/**
 * ExecutiveSummaryService — construye el resumen ejecutivo lateral.
 */

import type { DashboardStats, StationSummary } from "@/types";
import type { ExecutiveAction, ExecutiveSummaryData } from "@/types/executive";
import type { EnvironmentalRiskAssessment } from "@/types/risk";
import { ENVIRONMENTAL_RISK_LABELS } from "@/types/risk";

function buildWatershedStatus(stats: DashboardStats): { text: string; color: string } {
  if (stats.nonCompliantCount > 0) {
    return { text: "Estado crítico — intervención requerida", color: "text-red-600" };
  }
  if (stats.alertCount > 0) {
    return { text: "Estado en alerta — monitoreo reforzado", color: "text-amber-600" };
  }
  if (stats.compliantCount === stats.totalStations) {
    return { text: "Estado favorable — cumplimiento ECA general", color: "text-emerald-600" };
  }
  return { text: "Estado aceptable — seguimiento rutinario", color: "text-cyan-600" };
}

function findCriticalParameters(summaries: StationSummary[]): string[] {
  const paramCounts = new Map<string, number>();
  const labels: Record<string, string> = {
    ph: "pH",
    turbidity: "Turbidez",
    conductivity: "Conductividad",
    dissolvedOxygen: "Oxígeno disuelto",
    temperature: "Temperatura",
    bod5: "DBO5",
    cod: "DQO",
    coliforms: "Coliformes",
  };

  for (const s of summaries) {
    for (const p of [...s.compliance.violatedParameters, ...s.compliance.alertParameters]) {
      paramCounts.set(p, (paramCounts.get(p) ?? 0) + 1);
    }
  }

  return Array.from(paramCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([key]) => labels[key] ?? key);
}

export class ExecutiveSummaryService {
  build(
    stats: DashboardStats,
    summaries: StationSummary[],
    riskAssessment: EnvironmentalRiskAssessment | null
  ): ExecutiveSummaryData {
    const watershed = buildWatershedStatus(stats);
    const criticalParameters = findCriticalParameters(summaries);

    const alertStations = summaries
      .filter(
        (s) =>
          s.compliance.status === "alert" || s.compliance.status === "non_compliant"
      )
      .map((s) => ({ id: s.station.id, name: s.station.name }));

    const priorityRecommendations: ExecutiveAction[] = riskAssessment
      ? riskAssessment.recommendations.slice(0, 3).map((r) => ({
          id: r.id,
          priority: r.priority,
          text: r.text,
        }))
      : [
          {
            id: "exec-default",
            priority: "low" as const,
            text: "Continuar monitoreo mensual según plan de campaña.",
          },
        ];

    return {
      watershedStatus: watershed.text,
      watershedStatusColor: watershed.color,
      criticalParameters:
        criticalParameters.length > 0 ? criticalParameters : ["Ninguno detectado"],
      alertStations,
      nonCompliantCount: stats.nonCompliantCount,
      riskLevel: riskAssessment?.level ?? null,
      riskLevelLabel: riskAssessment
        ? ENVIRONMENTAL_RISK_LABELS[riskAssessment.level]
        : "Sin evaluación",
      riskIndex: riskAssessment ? Math.round(riskAssessment.index) : 0,
      priorityRecommendations,
    };
  }
}

export const executiveSummaryService = new ExecutiveSummaryService();
