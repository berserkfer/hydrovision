/**
 * Mock del Centro de Evaluación Ambiental — Sprint 2G
 */

import { MOCK_LAST_UPDATE } from "@/config";
import { getDataStore } from "@/data/store-access";
import {
  buildAutomaticDiagnosis,
  buildAutomaticRecommendations,
  buildGeneralStatus,
} from "@/lib/evaluation/diagnosis-engine";
import { classifyParameterValue, formatEcaLimit } from "@/lib/eca/parameter-classifier";
import { getParameterDefinition } from "@/lib/parameters/catalog";
import { resolveNombre } from "@/utils";
import type {
  CriticalParameterRow,
  EnvironmentalEvaluationDocument,
  EnvironmentalEvaluationFilters,
  EnvironmentalEvaluationOptions,
  EnvironmentalIndicatorCard,
  TemporalTrendPoint,
} from "@/types/environmental-evaluation";
import { DEFAULT_EVALUATION_FILTERS } from "@/types/environmental-evaluation";
import type { ParameterCode } from "@/types/parameter-management";

const CORE_CODES: ParameterCode[] = [
  "ph",
  "dissolvedOxygen",
  "turbidity",
  "conductivity",
  "bod5",
  "cod",
  "coliforms",
];

function seededSeries(base: number, variance: number, seed: string, months = 8): TemporalTrendPoint[] {
  const hash = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return Array.from({ length: months }, (_, i) => {
    const month = String(i + 1).padStart(2, "0");
    const wave = Math.sin((hash + i) * 0.6);
    return {
      fecha: `2025-${month}-15`,
      ph: Number((7.2 + wave * 0.3).toFixed(2)),
      oxigenoDisuelto: Number((base + wave * variance * 0.5).toFixed(2)),
      turbidez: Number((18 + i * 2 + wave * 4).toFixed(1)),
      conductividad: Number((420 + i * 15 + wave * 40).toFixed(0)),
    };
  });
}

function buildCriticalParameters(estacionId: string): CriticalParameterRow[] {
  const store = getDataStore();
  const paramRow = store.parametros.find((p) => p.estacionId === estacionId);
  if (!paramRow) return [];

  const rows: CriticalParameterRow[] = [];

  for (const code of CORE_CODES) {
    const def = getParameterDefinition(code);
    let value: number | undefined;

    switch (code) {
      case "ph":
        value = paramRow.ph;
        break;
      case "dissolvedOxygen":
        value = paramRow.oxigenoDisuelto;
        break;
      case "turbidity":
        value = paramRow.turbidez;
        break;
      case "conductivity":
        value = paramRow.conductividad;
        break;
      case "bod5":
        value = paramRow.dbo5;
        break;
      case "cod":
        value = paramRow.dqo;
        break;
      case "coliforms":
        value = paramRow.coliformes;
        break;
    }

    if (value === undefined) continue;
    const status = classifyParameterValue(code, value);
    if (status === "compliant") continue;

    rows.push({
      id: `${code}-${estacionId}`,
      parametro: def.name,
      valor: value,
      unidad: def.unit,
      limiteEca: formatEcaLimit(code),
      estado: status,
    });
  }

  return rows;
}

function buildIndicators(
  estacionId: string,
  critical: CriticalParameterRow[],
  paramRow: ReturnType<typeof getDataStore>["parametros"][0] | undefined,
  indices: ReturnType<typeof getDataStore>["indicesSatelitales"][0] | undefined
): EnvironmentalIndicatorCard[] {
  const compliant = CORE_CODES.length - critical.length;
  const ecaPercent = Math.round((compliant / CORE_CODES.length) * 100);

  return [
    {
      id: "water-quality",
      label: "Calidad del agua",
      value: ecaPercent >= 70 ? "Aceptable" : "Atención",
      subtitle: "Evaluación integrada simulada",
      trend: ecaPercent >= 70 ? "stable" : "down",
      status: ecaPercent >= 70 ? "compliant" : "alert",
    },
    {
      id: "eca",
      label: "Cumplimiento ECA",
      value: `${ecaPercent}%`,
      subtitle: "Parámetros nucleares",
      trend: ecaPercent >= 80 ? "up" : "down",
      status: ecaPercent >= 80 ? "compliant" : ecaPercent >= 60 ? "alert" : "non_compliant",
    },
    {
      id: "satellite",
      label: "Índice satelital",
      value: indices ? `NDVI ${indices.ndvi.toFixed(2)}` : "NDVI 0.35",
      subtitle: "Sentinel-2 simulado",
      trend: "stable",
      status: "neutral",
    },
    {
      id: "trend",
      label: "Tendencia histórica",
      value: critical.length === 0 ? "Estable" : "Deterioro leve",
      subtitle: "Últimos 8 meses",
      trend: critical.length === 0 ? "stable" : "down",
      status: "neutral",
    },
    {
      id: "out-of-norm",
      label: "Fuera de norma",
      value: String(critical.length),
      subtitle: "Parámetros en alerta o incumplimiento",
      trend: critical.length > 0 ? "up" : "stable",
      status: critical.length === 0 ? "compliant" : "non_compliant",
    },
  ];
}

export function getMockEvaluationOptions(): EnvironmentalEvaluationOptions {
  const store = getDataStore();
  return {
    estaciones: store.estaciones.map((e) => ({
      value: e.id,
      label: `${e.codigo} — ${e.tramo}`,
    })),
    campanas: store.campanas.map((c) => ({
      value: c.id,
      label: `${c.codigo} — ${c.nombre}`,
    })),
  };
}

export function buildMockEnvironmentalEvaluation(
  filters: EnvironmentalEvaluationFilters = DEFAULT_EVALUATION_FILTERS
): EnvironmentalEvaluationDocument {
  const store = getDataStore();
  const estacion =
    store.estaciones.find((e) => e.id === filters.estacionId) ?? store.estaciones[0];
  const campana = filters.campanaId
    ? store.campanas.find((c) => c.id === filters.campanaId)
    : store.campanas.find((c) => c.rioId === estacion.rioId);

  const paramRow = store.parametros.find((p) => p.estacionId === estacion.id);
  const indice = store.indicesSatelitales.find((i) => i.estacionId === estacion.id);
  const critical = buildCriticalParameters(estacion.id);
  const alertCount = critical.filter((c) => c.estado === "alert").length;

  const diagnosisInput = {
    criticalCount: critical.filter((c) => c.estado === "non_compliant").length,
    alertCount,
    turbidity: paramRow?.turbidez ?? 20,
    dissolvedOxygen: paramRow?.oxigenoDisuelto ?? 6,
    ecaCompliancePercent: Math.round(((CORE_CODES.length - critical.length) / CORE_CODES.length) * 100),
  };

  const generalStatus = buildGeneralStatus(diagnosisInput, MOCK_LAST_UPDATE);
  const diagnosis = buildAutomaticDiagnosis(diagnosisInput, critical);
  const recommendations = buildAutomaticRecommendations(generalStatus.nivelRiesgo, critical);

  const responsable = campana
    ? resolveNombre(campana.responsableId, store.usuarios)
    : "Equipo de monitoreo";

  return {
    id: `eval-${estacion.id}-${Date.now()}`,
    titulo: `Evaluación Ambiental — ${estacion.codigo}`,
    filters: { estacionId: estacion.id, campanaId: campana?.id ?? "" },
    generalStatus,
    indicators: buildIndicators(estacion.id, critical, paramRow, indice),
    stationSummary: {
      nombre: estacion.nombre,
      codigo: estacion.codigo,
      rio: resolveNombre(estacion.rioId, store.rios),
      cuenca: resolveNombre(estacion.cuencaId, store.cuencas),
      coordenadas: `${estacion.coordenadas.latitude}, ${estacion.coordenadas.longitude}`,
      ultimaCampana: campana?.nombre ?? "—",
      responsable,
    },
    criticalParameters: critical,
    temporalTrends: seededSeries(paramRow?.oxigenoDisuelto ?? 6, 0.8, estacion.id),
    diagnosis,
    recommendations,
    isSimulated: true,
  };
}

export function getDefaultEvaluationFilters(): EnvironmentalEvaluationFilters {
  const store = getDataStore();
  const firstStation = store.estaciones[0];
  const campana = store.campanas.find((c) => c.rioId === firstStation?.rioId);
  return {
    estacionId: firstStation?.id ?? "",
    campanaId: campana?.id ?? "",
  };
}