/**
 * Mock de parámetros de calidad del agua — Sprint 2E
 */

import { getDataStore } from "@/data/store-access";
import type { ParametrosFisicoquimicos } from "@/models/monitoring";
import {
  classifyParameterValue,
  formatEcaLimit,
} from "@/lib/eca/parameter-classifier";
import {
  PARAMETER_CATALOG_BY_CODE,
  WATER_PARAMETER_CATALOG,
  type ParameterDefinition,
} from "@/lib/parameters/catalog";
import type {
  ParameterChartData,
  ParameterCode,
  ParameterDetailData,
  ParameterHistoryPoint,
  ParameterSummaryStats,
  ParameterTrend,
  WaterParameterRecord,
} from "@/types/parameter-management";

function resolveValue(
  paramRow: ParametrosFisicoquimicos,
  def: ParameterDefinition,
  seed: number
): number | undefined {
  if (def.storeField === "simulated") {
    const coliformes = paramRow.coliformes ?? 200;
    switch (def.code) {
      case "nitrates":
        return Number(((paramRow.dqo ?? 0) * 0.08 + (seed % 5)).toFixed(2));
      case "phosphates":
        return Number(((paramRow.turbidez ?? 0) * 0.012 + (seed % 3) * 0.02).toFixed(3));
      case "coliformThermotolerant":
        return Math.round(coliformes * (0.3 + (seed % 4) * 0.02));
      case "eColi":
        return Math.round(coliformes * (0.12 + (seed % 3) * 0.03));
      default:
        return undefined;
    }
  }

  const field = def.storeField as keyof ParametrosFisicoquimicos;
  const raw = paramRow[field];
  return typeof raw === "number" ? raw : undefined;
}

function computeTrend(
  code: ParameterCode,
  estacionId: string,
  value: number,
  allRecords: WaterParameterRecord[]
): ParameterTrend {
  const previous = allRecords
    .filter((r) => r.parameterCode === code && r.estacionId === estacionId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))[0];

  if (!previous) return "stable";
  const diff = value - previous.value;
  const threshold = Math.abs(previous.value) * 0.05 || 0.1;
  if (diff > threshold) return "up";
  if (diff < -threshold) return "down";
  return "stable";
}

function buildRecordsFromStore(): WaterParameterRecord[] {
  const store = getDataStore();
  const records: WaterParameterRecord[] = [];
  let seed = 0;

  for (const paramRow of store.parametros) {
    const muestra = store.muestras.find((m) => m.id === paramRow.muestraId);
    const estacion = store.estaciones.find((e) => e.id === paramRow.estacionId);
    const campana = muestra
      ? store.campanas.find((c) => c.id === muestra.campanaId)
      : undefined;

    if (!muestra || !estacion) continue;

    for (const def of WATER_PARAMETER_CATALOG) {
      seed += 1;
      const value = resolveValue(paramRow, def, seed);
      if (value === undefined) continue;

      const status = classifyParameterValue(def.code, value);
      const fecha = muestra.fechaMuestreo.slice(0, 10);

      records.push({
        id: `${def.code}-${paramRow.id}`,
        parameterCode: def.code,
        parameterName: def.name,
        category: def.category,
        unit: def.unit,
        value,
        ecaLimit: formatEcaLimit(def.code),
        status,
        trend: "stable",
        fecha,
        estacionId: estacion.id,
        estacionCodigo: estacion.codigo,
        estacionNombre: estacion.nombre,
        campanaId: campana?.id ?? "—",
        campanaCodigo: campana?.codigo ?? "—",
        campanaNombre: campana?.nombre ?? "Sin campaña",
        isSimulated: true,
      });
    }
  }

  return records.map((record) => ({
    ...record,
    trend: computeTrend(record.parameterCode, record.estacionId, record.value, records),
  }));
}

let cachedRecords: WaterParameterRecord[] | null = null;

function getRecords(): WaterParameterRecord[] {
  if (!cachedRecords) cachedRecords = buildRecordsFromStore();
  return cachedRecords;
}

/** Invalidar caché tras mutaciones del store (futuro) */
export function invalidateParameterMockCache() {
  cachedRecords = null;
}

export function getMockParameterRecords(): WaterParameterRecord[] {
  return getRecords();
}

export function getMockParameterRecordById(id: string): WaterParameterRecord | null {
  return getRecords().find((r) => r.id === id) ?? null;
}

export function getMockParameterSummaryStats(): ParameterSummaryStats {
  const records = getRecords();
  return {
    total: records.length,
    cumple: records.filter((r) => r.status === "compliant").length,
    enAlerta: records.filter((r) => r.status === "alert").length,
    noCumple: records.filter((r) => r.status === "non_compliant").length,
  };
}

export function getMockParameterFilterOptions() {
  const records = getRecords();
  const estaciones = Array.from(
    new Map(
      records.map((r) => [
        r.estacionId,
        { value: r.estacionId, label: `${r.estacionCodigo} — ${r.estacionNombre}` },
      ])
    ).values()
  );
  const campanas = Array.from(
    new Map(
      records
        .filter((r) => r.campanaId !== "—")
        .map((r) => [r.campanaId, { value: r.campanaId, label: r.campanaCodigo }])
    ).values()
  );
  const fechas = Array.from(new Set(records.map((r) => r.fecha))).sort((a, b) =>
    b.localeCompare(a)
  );
  return { estaciones, campanas, fechas };
}

export function getMockParameterDetail(code: ParameterCode): ParameterDetailData | null {
  const def = PARAMETER_CATALOG_BY_CODE[code];
  if (!def) return null;

  const records = getRecords()
    .filter((r) => r.parameterCode === code)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  if (records.length === 0) return null;

  const latest = records[0];
  const history: ParameterHistoryPoint[] = records.slice(0, 24).map((r) => ({
    fecha: r.fecha,
    value: r.value,
    estacionCodigo: r.estacionCodigo,
    status: r.status,
  }));

  return {
    definition: def,
    latestValue: latest.value,
    latestStatus: latest.status,
    latestFecha: latest.fecha,
    latestEstacion: latest.estacionCodigo,
    history,
    statusDistribution: {
      compliant: records.filter((r) => r.status === "compliant").length,
      alert: records.filter((r) => r.status === "alert").length,
      non_compliant: records.filter((r) => r.status === "non_compliant").length,
    },
  };
}

export function getMockParameterChartData(filters?: {
  estacionId?: string;
  campanaId?: string;
}): ParameterChartData {
  let records = getRecords();
  if (filters?.estacionId) {
    records = records.filter((r) => r.estacionId === filters.estacionId);
  }
  if (filters?.campanaId) {
    records = records.filter((r) => r.campanaId === filters.campanaId);
  }

  const byStation = new Map<string, { sum: number; count: number }>();
  records.forEach((r) => {
    const prev = byStation.get(r.estacionCodigo) ?? { sum: 0, count: 0 };
    byStation.set(r.estacionCodigo, { sum: prev.sum + r.value, count: prev.count + 1 });
  });

  const barByStation = Array.from(byStation.entries())
    .slice(0, 8)
    .map(([name, { sum, count }]) => ({
      name,
      value: Number((sum / count).toFixed(2)),
    }));

  const radarProfile = WATER_PARAMETER_CATALOG.slice(0, 6).map((def) => {
    const paramRecords = records.filter((r) => r.parameterCode === def.code);
    const avg =
      paramRecords.reduce((s, r) => s + r.value, 0) / (paramRecords.length || 1);
    const fullMark = def.ecaMax ?? def.ecaMin ?? avg * 1.5;
    return {
      parameter: def.name.slice(0, 12),
      value: Number(avg.toFixed(2)),
      fullMark: Number(fullMark.toFixed(2)),
    };
  });

  const byDate = new Map<string, { sum: number; count: number }>();
  records.forEach((r) => {
    const prev = byDate.get(r.fecha) ?? { sum: 0, count: 0 };
    byDate.set(r.fecha, { sum: prev.sum + r.value, count: prev.count + 1 });
  });

  const lineHistory = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([fecha, { sum, count }]) => ({
      fecha: fecha.slice(5),
      value: Number((sum / count).toFixed(2)),
    }));

  const byCampaign = new Map<string, { sum: number; count: number; cumple: number }>();
  records.forEach((r) => {
    if (r.campanaCodigo === "—") return;
    const prev = byCampaign.get(r.campanaCodigo) ?? { sum: 0, count: 0, cumple: 0 };
    byCampaign.set(r.campanaCodigo, {
      sum: prev.sum + r.value,
      count: prev.count + 1,
      cumple: prev.cumple + (r.status === "compliant" ? 1 : 0),
    });
  });

  const campaignComparison = Array.from(byCampaign.entries())
    .slice(0, 6)
    .map(([campana, { sum, count, cumple }]) => ({
      campana,
      promedio: Number((sum / count).toFixed(2)),
      cumple,
    }));

  return { barByStation, radarProfile, lineHistory, campaignComparison };
}

export function getMockRecordsByParameterCode(code: ParameterCode): WaterParameterRecord[] {
  return getRecords().filter((r) => r.parameterCode === code);
}
