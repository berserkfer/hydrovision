/**
 * EnvironmentalIndicatorService — tarjetas de indicadores ambientales agregados.
 */

import { classifyMeasurement, getComplianceLabel } from "@/lib/eca/classifier";
import { buildSparklineTrend } from "@/lib/station/station-utils";
import { estimateFlowRate } from "@/lib/station/station-utils";
import type { FieldMeasurement, StationSummary } from "@/types";
import type { ComplianceStatus } from "@/types";
import type { ExecutiveParameterCard, IndicatorTrendDirection } from "@/types/executive";
import { EXECUTIVE_PARAMETERS } from "./executive.constants";

const STATUS_COLORS: Record<ComplianceStatus, string> = {
  compliant: "text-emerald-600 bg-emerald-50",
  alert: "text-amber-600 bg-amber-50",
  non_compliant: "text-red-600 bg-red-50",
};

const TREND_SYMBOLS: Record<IndicatorTrendDirection, string> = {
  up: "↑",
  down: "↓",
  stable: "→",
};

const TREND_COLORS: Record<IndicatorTrendDirection, string> = {
  up: "text-cyan-600",
  down: "text-orange-600",
  stable: "text-slate-500",
};

function getMeasurementValue(
  summaries: StationSummary[],
  field: (typeof EXECUTIVE_PARAMETERS)[number]["measurementField"]
): number {
  if (summaries.length === 0) return 0;

  if (field === "flowRate") {
    const values = summaries.map((s, i) => {
      const idx = mockStationIndex(s);
      return estimateFlowRate(idx);
    });
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  const values = summaries.map((s) => s.latestMeasurement[field as keyof FieldMeasurement] as number);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function mockStationIndex(summary: StationSummary): number {
  const code = summary.station.id.replace(/\D/g, "");
  return parseInt(code, 10) || 1;
}

function evaluateParameterStatus(
  value: number,
  ecaField: (typeof EXECUTIVE_PARAMETERS)[number]["ecaParameter"]
): ComplianceStatus {
  if (!ecaField) return "compliant";

  const measurement: FieldMeasurement = {
    id: "exec-eval",
    stationId: "P1",
    sampledAt: new Date().toISOString(),
    ph: ecaField === "ph" ? value : 7,
    turbidity: ecaField === "turbidity" ? value : 10,
    conductivity: ecaField === "conductivity" ? value : 400,
    dissolvedOxygen: ecaField === "dissolvedOxygen" ? value : 6,
    temperature: ecaField === "temperature" ? value : 24,
    bod5: 8,
    cod: 20,
    isSimulated: true,
  };

  return classifyMeasurement(measurement).status;
}

function computeTrend(sparkline: number[]): {
  trend: IndicatorTrendDirection;
  variationPercent: number;
} {
  if (sparkline.length < 2) return { trend: "stable", variationPercent: 0 };

  const first = sparkline[0];
  const last = sparkline[sparkline.length - 1];
  const variationPercent =
    first !== 0 ? Number((((last - first) / Math.abs(first)) * 100).toFixed(1)) : 0;

  if (Math.abs(variationPercent) < 2) return { trend: "stable", variationPercent };
  return { trend: last > first ? "up" : "down", variationPercent };
}

export class EnvironmentalIndicatorService {
  buildCards(summaries: StationSummary[]): ExecutiveParameterCard[] {
    return EXECUTIVE_PARAMETERS.map((def) => {
      const value = getMeasurementValue(summaries, def.measurementField);
      const rounded = Number(value.toFixed(def.decimals));
      const sparkline = buildSparklineTrend(rounded, def.variance);
      const { trend, variationPercent } = computeTrend(sparkline);
      const status = evaluateParameterStatus(rounded, def.ecaParameter);

      return {
        key: def.key,
        label: def.label,
        value: rounded,
        unit: def.unit,
        status,
        statusLabel: getComplianceLabel(status),
        statusColorClass: STATUS_COLORS[status],
        icon: def.icon,
        trend,
        trendSymbol: TREND_SYMBOLS[trend],
        trendColorClass: TREND_COLORS[trend],
        variationPercent,
        sparkline,
      };
    });
  }
}

export const environmentalIndicatorService = new EnvironmentalIndicatorService();
