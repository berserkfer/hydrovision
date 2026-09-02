/**
 * IndicatorCalculator — calcula valores y puntuaciones de indicadores ambientales.
 */

import { MOCK_LAST_UPDATE } from "@/constants/app";
import { EstadoEstacion } from "@/constants/enums";
import { getDataStore } from "@/data/store-access";
import { buildSparklineTrend } from "@/lib/station/station-utils";
import { getCampaignStats } from "@/repositories/campaign.repository";
import { riskEngine } from "@/services/risk";
import type { DashboardStats, StationSummary } from "@/types";
import type { Indicator, IndicatorIconKey } from "@/types/indicators";
import { INDICATOR_CATEGORY_LABELS, INDICATOR_SCORE_LABELS } from "@/types/indicators";
import type { IndicatorDefinition } from "./indicator.repository";
import { indicatorRepository } from "./indicator.repository";
import {
  SCORE_COLORS,
  scoreToLevel,
  scoreToTrafficLight,
} from "./indicator.constants";

interface ComputedIndicatorValues {
  value: number;
  display: string;
  score: number;
  trendBase: number;
  trendVar: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function computeTrendDirection(trend: number[]): Indicator["trendDirection"] {
  if (trend.length < 2) return "stable";
  const diff = trend[trend.length - 1] - trend[0];
  const threshold = Math.abs(trend[0]) * 0.03 || 0.5;
  if (Math.abs(diff) < threshold) return "stable";
  return diff > 0 ? "up" : "down";
}

function buildIndicator(
  def: IndicatorDefinition,
  value: number,
  displayValue: string,
  score: number,
  trendBase: number,
  trendVariance: number
): Indicator {
  const status = scoreToLevel(score);
  const trend = buildSparklineTrend(trendBase, trendVariance);

  return {
    id: def.id,
    name: def.name,
    description: def.description,
    value,
    displayValue,
    unit: def.unit,
    score: Math.round(clamp(score, 0, 100)),
    status,
    statusLabel: INDICATOR_SCORE_LABELS[status],
    color: SCORE_COLORS[status],
    icon: def.icon as IndicatorIconKey,
    importance: def.importance,
    category: def.category,
    categoryLabel: INDICATOR_CATEGORY_LABELS[def.category],
    updatedAt: MOCK_LAST_UPDATE,
    trend,
    trendDirection: computeTrendDirection(trend),
    progressPercent: Math.round(clamp(score, 0, 100)),
    trafficLight: scoreToTrafficLight(score),
    isSimulated: true,
    source: "mock",
  };
}

function computeWaterQualityScore(summaries: StationSummary[]): number {
  if (summaries.length === 0) return 0;
  const avg = summaries.reduce((acc, s) => {
    const m = s.latestMeasurement;
    let partial = 0;
    if (m.ph !== undefined && m.ph >= 6.5 && m.ph <= 8.5) partial += 25;
    if (m.dissolvedOxygen !== undefined && m.dissolvedOxygen >= 5) partial += 25;
    if (m.turbidity !== undefined && m.turbidity <= 35) partial += 25;
    if (m.conductivity !== undefined && m.conductivity <= 900) partial += 25;
    return acc + partial;
  }, 0);
  return avg / summaries.length;
}

function countActiveStations(riverId: string): { active: number; total: number } {
  const stations = getDataStore().estaciones.filter((e) => e.rioId === riverId);
  const active = stations.filter((e) => e.estadoOperativo === EstadoEstacion.ACTIVA).length;
  return { active, total: stations.length };
}

function countSamplesForRiver(riverId: string): number {
  const ids = new Set(
    getDataStore().estaciones.filter((e) => e.rioId === riverId).map((e) => e.id)
  );
  return getDataStore().muestras.filter((m) => ids.has(m.estacionId)).length;
}

export class IndicatorCalculator {
  calculateAll(stats: DashboardStats, summaries: StationSummary[], riverId: string): Indicator[] {
    const catalog = indicatorRepository.getCatalog();
    const riskAssessment = riskEngine.evaluateRiver(summaries);
    const campaignStats = getCampaignStats();
    const { active: activeStations, total: stationTotal } = countActiveStations(riverId);
    const sampleCount = countSamplesForRiver(riverId);

    const ecaPercent =
      stats.totalStations > 0 ? (stats.compliantCount / stats.totalStations) * 100 : 0;

    const waterQualityScore = computeWaterQualityScore(summaries);
    const riskIndex = riskAssessment?.index ?? 50;
    const invertedRiskScore = clamp(100 - riskIndex, 0, 100);
    const activePercent = stationTotal > 0 ? (activeStations / stationTotal) * 100 : 0;
    const campaignCoverage =
      stationTotal > 0 ? clamp((sampleCount / stationTotal) * 100, 0, 100) : 0;
    const dataIntegrity = clamp(88 + (sampleCount % 5) * 2, 85, 98);
    const dataFreshness = 92;
    const temporalStability = clamp(
      100 - (stats.alertCount * 12 + stats.nonCompliantCount * 20),
      30,
      95
    );

    const computed: Record<string, ComputedIndicatorValues> = {
      "ind-water-quality": {
        value: waterQualityScore,
        display: waterQualityScore.toFixed(1),
        score: waterQualityScore,
        trendBase: waterQualityScore,
        trendVar: 2,
      },
      "ind-eca-rate": {
        value: ecaPercent,
        display: ecaPercent.toFixed(1),
        score: ecaPercent,
        trendBase: ecaPercent,
        trendVar: 1.5,
      },
      "ind-risk-index": {
        value: invertedRiskScore,
        display: invertedRiskScore.toFixed(0),
        score: invertedRiskScore,
        trendBase: invertedRiskScore,
        trendVar: 3,
      },
      "ind-risk-level": {
        value: riskIndex,
        display: riskAssessment?.levelLabel ?? "Sin datos",
        score: invertedRiskScore,
        trendBase: invertedRiskScore,
        trendVar: 2,
      },
      "ind-temporal-trend": {
        value: temporalStability,
        display: temporalStability.toFixed(1),
        score: temporalStability,
        trendBase: temporalStability,
        trendVar: 2,
      },
      "ind-stations-active": {
        value: activePercent,
        display: activePercent.toFixed(0),
        score: activePercent,
        trendBase: activePercent,
        trendVar: 1,
      },
      "ind-stations-alert": {
        value: stats.alertCount,
        display: String(stats.alertCount),
        score: clamp(100 - stats.alertCount * 15 - stats.nonCompliantCount * 25, 0, 100),
        trendBase: stats.alertCount,
        trendVar: 0.5,
      },
      "ind-campaigns-active": {
        value: campaignStats.enCurso,
        display: String(campaignStats.enCurso),
        score: clamp(50 + campaignStats.enCurso * 15, 50, 95),
        trendBase: campaignStats.enCurso,
        trendVar: 0.3,
      },
      "ind-campaigns-coverage": {
        value: campaignCoverage,
        display: campaignCoverage.toFixed(0),
        score: campaignCoverage,
        trendBase: campaignCoverage,
        trendVar: 2,
      },
      "ind-data-integrity": {
        value: dataIntegrity,
        display: dataIntegrity.toFixed(1),
        score: dataIntegrity,
        trendBase: dataIntegrity,
        trendVar: 1,
      },
      "ind-data-freshness": {
        value: dataFreshness,
        display: dataFreshness.toFixed(0),
        score: dataFreshness,
        trendBase: dataFreshness,
        trendVar: 0.5,
      },
    };

    return catalog.map((def) => {
      const data = computed[def.id];
      if (!data) {
        return buildIndicator(def, 0, "—", 0, 50, 1);
      }
      return buildIndicator(
        def,
        data.value,
        data.display,
        data.score,
        data.trendBase,
        data.trendVar
      );
    });
  }
}

export const indicatorCalculator = new IndicatorCalculator();
