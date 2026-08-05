/**
 * AlertService — genera alertas ambientales con explicaciones automáticas.
 */

import type { DashboardStats, StationSummary } from "@/types";
import type { ExecutiveAlert, ExecutiveAlertLevel } from "@/types/executive";
import { EXECUTIVE_ALERT_EMOJI, EXECUTIVE_ALERT_LABELS } from "@/types/executive";
import type { EnvironmentalRiskAssessment } from "@/types/risk";

function resolveOverallAlertLevel(
  stats: DashboardStats,
  riskAssessment: EnvironmentalRiskAssessment | null
): ExecutiveAlertLevel {
  if (stats.nonCompliantCount > 0 || riskAssessment?.level === "muy_alto") return "critico";
  if (stats.alertCount >= 2 || riskAssessment?.level === "alto") return "advertencia";
  if (stats.alertCount > 0 || riskAssessment?.level === "moderado") return "atencion";
  return "normal";
}

export class AlertService {
  generate(
    stats: DashboardStats,
    summaries: StationSummary[],
    riskAssessment: EnvironmentalRiskAssessment | null,
    watershedName: string
  ): ExecutiveAlert[] {
    const overall = resolveOverallAlertLevel(stats, riskAssessment);
    const alerts: ExecutiveAlert[] = [];

    alerts.push({
      id: "alert-overall",
      level: overall,
      levelLabel: EXECUTIVE_ALERT_LABELS[overall],
      emoji: EXECUTIVE_ALERT_EMOJI[overall],
      title: `Estado general — ${EXECUTIVE_ALERT_LABELS[overall]}`,
      explanation: this.buildOverallExplanation(overall, stats, watershedName, riskAssessment),
    });

    if (stats.alertCount > 0) {
      alerts.push({
        id: "alert-stations",
        level: stats.nonCompliantCount > 0 ? "critico" : "atencion",
        levelLabel: stats.nonCompliantCount > 0 ? "Crítico" : "Atención",
        emoji: stats.nonCompliantCount > 0 ? "🔴" : "🟡",
        title: "Estaciones en alerta ECA",
        explanation: `${stats.alertCount} estación(es) presentan parámetros en zona de alerta según referencia ECA. ${stats.nonCompliantCount > 0 ? `${stats.nonCompliantCount} estación(es) fuera de cumplimiento.` : "Ninguna estación fuera de cumplimiento crítico."}`,
      });
    }

    if (riskAssessment && riskAssessment.level !== "bajo") {
      alerts.push({
        id: "alert-risk",
        level:
          riskAssessment.level === "muy_alto"
            ? "critico"
            : riskAssessment.level === "alto"
              ? "advertencia"
              : "atencion",
        levelLabel: riskAssessment.levelLabel,
        emoji:
          riskAssessment.level === "muy_alto"
            ? "🔴"
            : riskAssessment.level === "alto"
              ? "🟠"
              : "🟡",
        title: "Riesgo ambiental elevado",
        explanation: riskAssessment.explanation,
      });
    }

    const criticalParams = this.findCriticalParameters(summaries);
    if (criticalParams.length > 0) {
      alerts.push({
        id: "alert-params",
        level: "advertencia",
        levelLabel: "Advertencia",
        emoji: "🟠",
        title: "Parámetros críticos detectados",
        explanation: `Se identificaron valores fuera de rango en: ${criticalParams.join(", ")}. Se recomienda verificación in situ.`,
      });
    }

    if (alerts.length === 1 && overall === "normal") {
      alerts.push({
        id: "alert-routine",
        level: "normal",
        levelLabel: "Normal",
        emoji: "🟢",
        title: "Monitoreo rutinario",
        explanation: `La cuenca ${watershedName} mantiene condiciones dentro de parámetros aceptables. Continuar monitoreo programado.`,
      });
    }

    return alerts.slice(0, 4);
  }

  private buildOverallExplanation(
    level: ExecutiveAlertLevel,
    stats: DashboardStats,
    watershedName: string,
    riskAssessment: EnvironmentalRiskAssessment | null
  ): string {
    switch (level) {
      case "normal":
        return `La cuenca ${watershedName} presenta condiciones normales. ${stats.compliantCount} de ${stats.totalStations} estaciones cumplen ECA.`;
      case "atencion":
        return `La cuenca ${watershedName} requiere atención. ${stats.alertCount} estación(es) en alerta. Riesgo: ${riskAssessment?.levelLabel ?? "moderado"}.`;
      case "advertencia":
        return `Condiciones de advertencia en ${watershedName}. Múltiples indicadores fuera de rango óptimo. Índice de riesgo: ${Math.round(riskAssessment?.index ?? 0)}/100.`;
      case "critico":
        return `Estado crítico en ${watershedName}. ${stats.nonCompliantCount} estación(es) fuera de ECA. Acción inmediata recomendada.`;
    }
  }

  private findCriticalParameters(summaries: StationSummary[]): string[] {
    const counts = new Map<string, number>();

    for (const s of summaries) {
      for (const p of s.compliance.violatedParameters) {
        counts.set(p, (counts.get(p) ?? 0) + 1);
      }
      for (const p of s.compliance.alertParameters) {
        counts.set(p, (counts.get(p) ?? 0) + 1);
      }
    }

    const labels: Record<string, string> = {
      ph: "pH",
      turbidity: "Turbidez",
      conductivity: "Conductividad",
      dissolvedOxygen: "Oxígeno disuelto",
      temperature: "Temperatura",
    };

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key]) => labels[key] ?? key);
  }
}

export const alertService = new AlertService();
