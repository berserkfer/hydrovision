import type { ParameterDisplayConfig, StationDetail, StationHistoryEntry } from "@/types/station";
import type { StationSummary } from "@/types";
import type { RiverContext } from "@/types/geography";
import { getComplianceLabel } from "@/lib/eca/classifier";

/** Genera TDS simulado a partir de conductividad (aprox. 0.65 × µS/cm) */
export function estimateTDS(conductivity: number): number {
  return Number((conductivity * 0.65).toFixed(1));
}

/** Genera caudal simulado (m³/s) según índice de estación */
export function estimateFlowRate(stationIndex: number): number {
  return Number((2.5 + stationIndex * 1.8 + (stationIndex % 2) * 0.5).toFixed(2));
}

/** Calcula porcentaje para barra de progreso normalizado */
export function normalizeParameter(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

/** Color de barra según proximidad al límite */
export function getProgressColor(percent: number): string {
  if (percent >= 85) return "bg-red-500";
  if (percent >= 65) return "bg-amber-500";
  return "bg-emerald-500";
}

/** Construye serie de tendencia simulada (6 puntos) */
export function buildSparklineTrend(base: number, variance: number): number[] {
  return Array.from({ length: 6 }, (_, i) =>
    Number((base + (i - 2.5) * variance * 0.4 + (i % 2) * variance * 0.15).toFixed(2))
  );
}

/** Historial reciente simulado por estación */
export function buildStationHistory(
  stationId: string,
  currentStatus: StationSummary["compliance"]["status"]
): StationHistoryEntry[] {
  const statuses: StationSummary["compliance"]["status"][] = [
    currentStatus,
    currentStatus === "compliant" ? "alert" : "compliant",
    "compliant",
    currentStatus,
    "alert",
  ];

  const observations = [
    "Muestreo de rutina completado.",
    "Incremento leve de turbidez observado.",
    "Condiciones normales en el tramo.",
    "Verificación de sensores in situ.",
    "Seguimiento post-evento de lluvia.",
  ];

  const dates = ["2025-06-15", "2025-06-01", "2025-05-15", "2025-05-01", "2025-04-15"];

  return dates.map((date, i) => ({
    date,
    status: statuses[i],
    observation: `[${stationId}] ${observations[i]}`,
  }));
}

/** Configura parámetros visuales para el panel de estación */
export function buildParameterConfigs(
  measurement: StationDetail["measurement"]
): ParameterDisplayConfig[] {
  const ph = measurement.ph ?? 0;
  const temperature = measurement.temperature ?? 0;
  const conductivity = measurement.conductivity ?? 0;
  const dissolvedOxygen = measurement.dissolvedOxygen ?? 0;
  const turbidity = measurement.turbidity ?? 0;
  const totalDissolvedSolids = measurement.totalDissolvedSolids ?? 0;

  return [
    {
      key: "ph",
      label: "pH",
      unit: "—",
      value: ph,
      min: 6,
      max: 9,
      icon: "ph",
      trend: buildSparklineTrend(ph, 0.15),
    },
    {
      key: "temperature",
      label: "Temperatura",
      unit: "°C",
      value: temperature,
      min: 18,
      max: 32,
      icon: "temperature",
      trend: buildSparklineTrend(temperature, 0.8),
    },
    {
      key: "conductivity",
      label: "Conductividad",
      unit: "µS/cm",
      value: conductivity,
      min: 0,
      max: 1500,
      icon: "conductivity",
      trend: buildSparklineTrend(conductivity, 40),
    },
    {
      key: "dissolvedOxygen",
      label: "Oxígeno disuelto",
      unit: "mg/L",
      value: dissolvedOxygen,
      min: 0,
      max: 10,
      icon: "oxygen",
      trend: buildSparklineTrend(dissolvedOxygen, 0.5),
    },
    {
      key: "turbidity",
      label: "Turbidez",
      unit: "NTU",
      value: turbidity,
      min: 0,
      max: 60,
      icon: "turbidity",
      trend: buildSparklineTrend(turbidity, 3),
    },
    {
      key: "tds",
      label: "Sólidos totales disueltos",
      unit: "mg/L",
      value: totalDissolvedSolids,
      min: 0,
      max: 1000,
      icon: "tds",
      trend: buildSparklineTrend(totalDissolvedSolids, 25),
    },
    {
      key: "flowRate",
      label: "Caudal",
      unit: "m³/s",
      value: measurement.flowRate,
      min: 0,
      max: 20,
      icon: "flow",
      trend: buildSparklineTrend(measurement.flowRate, 0.6),
    },
  ];
}

/** Construye el detalle completo de estación para el panel lateral */
export function buildStationDetail(
  summary: StationSummary,
  riverContext: RiverContext,
  stationIndex: number
): StationDetail {
  const m = summary.latestMeasurement;
  const measurement = {
    ph: m.ph,
    temperature: m.temperature,
    conductivity: m.conductivity,
    dissolvedOxygen: m.dissolvedOxygen,
    turbidity: m.turbidity,
    totalDissolvedSolids:
      m.conductivity !== undefined ? estimateTDS(m.conductivity) : undefined,
    flowRate: estimateFlowRate(stationIndex),
    sampledAt: m.sampledAt,
    isSimulated: true as const,
  };

  const geoStation = riverContext.river.stations[stationIndex];

  const entity = {
    code: summary.station.id,
    name: summary.station.name,
    latitude: summary.station.latitude,
    longitude: summary.station.longitude,
    altitude: geoStation?.altitude ?? 45,
    river: riverContext.river.name,
    watershed: riverContext.watershed.name,
    riverSegment: summary.station.riverSegment,
    installedAt: geoStation?.installedAt ?? "2022-03-15",
    operationalStatus: geoStation?.operationalStatus ?? "active",
    lastUpdatedAt: m.sampledAt,
    description: summary.station.description,
    isSimulated: true as const,
  };

  return {
    entity,
    measurement,
    compliance: summary.compliance,
    parameters: buildParameterConfigs(measurement),
    history: buildStationHistory(summary.station.id, summary.compliance.status),
    latestIndices: summary.latestIndices,
  };
}

export { getComplianceLabel };
