/**
 * ExecutiveKpiService — métricas agregadas del panel superior ejecutivo.
 */

import { getDataStore } from "@/data/store-access";
import type { DashboardStats } from "@/types";
import type { ExecutiveKpiMetrics } from "@/types/executive";
import type { EnvironmentalRiskAssessment } from "@/types/risk";
import { ENVIRONMENTAL_RISK_LABELS } from "@/types/risk";

function countCampaignsForRiver(riverId: string): number {
  return getDataStore().campanas.filter((c) => c.rioId === riverId).length;
}

function countSamplesForRiver(riverId: string): number {
  const stationIds = new Set(
    getDataStore().estaciones.filter((e) => e.rioId === riverId).map((e) => e.id)
  );
  return getDataStore().muestras.filter((m) => stationIds.has(m.estacionId)).length;
}

export class ExecutiveKpiService {
  build(
    stats: DashboardStats,
    riverId: string,
    riskAssessment: EnvironmentalRiskAssessment | null
  ): ExecutiveKpiMetrics {
    const ecaCompliancePercent =
      stats.totalStations > 0
        ? Number(((stats.compliantCount / stats.totalStations) * 100).toFixed(1))
        : 0;

    const averageRiskIndex = riskAssessment ? Math.round(riskAssessment.index) : 0;
    const averageRiskLabel = riskAssessment
      ? ENVIRONMENTAL_RISK_LABELS[riskAssessment.level]
      : "Sin datos";

    return {
      stationCount: stats.totalStations,
      campaignCount: countCampaignsForRiver(riverId),
      sampleCount: countSamplesForRiver(riverId),
      ecaCompliancePercent,
      averageRiskIndex,
      averageRiskLabel,
      lastUpdate: stats.lastUpdate,
    };
  }
}

export const executiveKpiService = new ExecutiveKpiService();
