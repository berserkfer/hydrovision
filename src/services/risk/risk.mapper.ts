/**
 * Mapeo de datos de monitoreo → entrada del motor de riesgo.
 */

import { getDataStore } from "@/data/store-access";
import type { StationSummary } from "@/types";
import type { EnvironmentalRiskInput } from "@/types/risk";

export function mapSummaryToRiskInput(summary: StationSummary): EnvironmentalRiskInput {
  const m = summary.latestMeasurement;
  const estacion = getDataStore().estaciones.find((e) => e.codigo === m.stationId);
  const params = estacion
    ? getDataStore().parametros.find((p) => p.estacionId === estacion.id)
    : null;

  return {
    ph: m.ph,
    temperatura: m.temperature,
    oxigenoDisuelto: m.dissolvedOxygen,
    conductividad: m.conductivity,
    turbidez: m.turbidity,
    solidosDisueltos: params?.solidosDisueltosTotales ?? m.conductivity * 0.65,
    caudal: params?.caudal ?? 3.5,
  };
}

export function aggregateSummariesToRiskInput(
  summaries: StationSummary[]
): EnvironmentalRiskInput | null {
  if (summaries.length === 0) return null;

  const inputs = summaries.map(mapSummaryToRiskInput);
  const n = inputs.length;

  return {
    ph: inputs.reduce((s, i) => s + i.ph, 0) / n,
    temperatura: inputs.reduce((s, i) => s + i.temperatura, 0) / n,
    oxigenoDisuelto: inputs.reduce((s, i) => s + i.oxigenoDisuelto, 0) / n,
    conductividad: inputs.reduce((s, i) => s + i.conductividad, 0) / n,
    turbidez: inputs.reduce((s, i) => s + i.turbidez, 0) / n,
    solidosDisueltos: inputs.reduce((s, i) => s + i.solidosDisueltos, 0) / n,
    caudal: inputs.reduce((s, i) => s + i.caudal, 0) / n,
  };
}
