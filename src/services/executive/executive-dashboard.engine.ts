/**
 * ExecutiveDashboardEngine — orquestador del Dashboard Ejecutivo.
 * Desacoplado de la interfaz; consume servicios existentes sin modificarlos.
 */

import type { DashboardStats, StationSummary } from "@/types";
import type { RiverContext } from "@/types/geography";
import type { ExecutiveDashboardSnapshot, ExecutiveHeaderData } from "@/types/executive";
import {
  WATERSHED_QUALITY_LABELS,
} from "@/types/executive";
import type { EnvironmentalRiskAssessment } from "@/types/risk";
import { ENVIRONMENTAL_RISK_EMOJI, ENVIRONMENTAL_RISK_LABELS } from "@/types/risk";
import { actionRecommendationService } from "./action-recommendation.service";
import { alertService } from "./alert.service";
import { environmentalIndicatorService } from "./environmental-indicator.service";
import { executiveKpiService } from "./executive-kpi.service";
import { executiveSummaryService } from "./executive-summary.service";

function resolveQualityStatus(stats: DashboardStats): ExecutiveHeaderData["qualityStatus"] {
  if (stats.nonCompliantCount > 0) return "critico";
  if (stats.alertCount > 0) return "alerta";
  if (stats.compliantCount === stats.totalStations) return "optimo";
  return "aceptable";
}

export interface ExecutiveDashboardInput {
  stats: DashboardStats;
  summaries: StationSummary[];
  riverContext: RiverContext;
  riskAssessment: EnvironmentalRiskAssessment | null;
}

export class ExecutiveDashboardEngine {
  build(input: ExecutiveDashboardInput): ExecutiveDashboardSnapshot {
    const { stats, summaries, riverContext, riskAssessment } = input;
    const qualityStatus = resolveQualityStatus(stats);

    const header: ExecutiveHeaderData = {
      projectName: "HydroVision",
      watershedName: riverContext.watershed.name,
      riverName: riverContext.river.name,
      lastMonitoringDate: stats.lastUpdate,
      qualityStatus,
      qualityStatusLabel: WATERSHED_QUALITY_LABELS[qualityStatus],
      riskLevel: riskAssessment?.level ?? null,
      riskLevelLabel: riskAssessment
        ? ENVIRONMENTAL_RISK_LABELS[riskAssessment.level]
        : "Sin evaluación",
      riskEmoji: riskAssessment
        ? ENVIRONMENTAL_RISK_EMOJI[riskAssessment.level]
        : "⚪",
    };

    return {
      header,
      kpis: executiveKpiService.build(stats, riverContext.river.id, riskAssessment),
      parameterCards: environmentalIndicatorService.buildCards(summaries),
      summary: executiveSummaryService.build(stats, summaries, riskAssessment),
      alerts: alertService.generate(
        stats,
        summaries,
        riskAssessment,
        riverContext.watershed.name
      ),
      actions: actionRecommendationService.generate(riskAssessment),
      evaluatedAt: new Date().toISOString(),
      isSimulated: true,
    };
  }
}

export const executiveDashboardEngine = new ExecutiveDashboardEngine();
