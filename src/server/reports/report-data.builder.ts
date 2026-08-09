/**
 * Construcción del dataset de exportación — Sprint 3G
 */

import { EstadoECA } from "@/constants/enums";
import { ESTADO_ECA_LABELS } from "@/constants/enums";
import { getDataStore } from "@/data/store-access";
import { resolveNombre } from "@/utils";
import type { ReportChartSection } from "@/types/report-management";
import type {
  ExportCampaignRow,
  ExportEvaluationRow,
  ExportFilterOptions,
  ExportMeasurementRow,
  ExportParameterRow,
  ExportPreviewDto,
  ExportReportFilters,
  ExportSections,
  ExportStationRow,
  ExportStatistics,
  ReportExportBundle,
} from "./report.types";
import { DEFAULT_EXPORT_SECTIONS } from "./report.types";

const PARAMETER_DEFS: Array<{
  code: string;
  label: string;
  unit: string;
  category: string;
  field: keyof import("@/models/monitoring").ParametrosFisicoquimicos;
}> = [
  { code: "ph", label: "pH", unit: "—", category: "fisicoquimico", field: "ph" },
  { code: "turbidity", label: "Turbidez", unit: "NTU", category: "fisicoquimico", field: "turbidez" },
  { code: "conductivity", label: "Conductividad", unit: "µS/cm", category: "fisicoquimico", field: "conductividad" },
  { code: "dissolved_oxygen", label: "Oxígeno disuelto", unit: "mg/L", category: "fisicoquimico", field: "oxigenoDisuelto" },
  { code: "temperature", label: "Temperatura", unit: "°C", category: "fisicoquimico", field: "temperatura" },
  { code: "bod5", label: "DBO5", unit: "mg/L", category: "organico", field: "dbo5" },
  { code: "cod", label: "DQO", unit: "mg/L", category: "organico", field: "dqo" },
  { code: "coliforms", label: "Coliformes", unit: "NMP/100mL", category: "microbiologico", field: "coliformes" },
  { code: "total_dissolved_solids", label: "Sólidos disueltos", unit: "mg/L", category: "fisicoquimico", field: "solidosDisueltosTotales" },
  { code: "flow_rate", label: "Caudal", unit: "m³/s", category: "hidrologico", field: "caudal" },
];

const CATEGORY_LABELS: Record<string, string> = {
  fisicoquimico: "Fisicoquímico",
  organico: "Orgánico",
  microbiologico: "Microbiológico",
  hidrologico: "Hidrológico",
};

function inDateRange(date: string, start: string, end: string): boolean {
  const d = date.slice(0, 10);
  return d >= start && d <= end;
}

function mapEstadoAmbiental(estado: EstadoECA): string {
  return ESTADO_ECA_LABELS[estado] ?? estado;
}

function applyFilters(filters: ExportReportFilters) {
  const store = getDataStore();
  let estaciones = store.estaciones;
  let campanas = store.campanas;

  if (filters.cuencaId) {
    estaciones = estaciones.filter((e) => e.cuencaId === filters.cuencaId);
    campanas = campanas.filter((c) => c.cuencaId === filters.cuencaId);
  }
  if (filters.rioId) {
    estaciones = estaciones.filter((e) => e.rioId === filters.rioId);
    campanas = campanas.filter((c) => c.rioId === filters.rioId);
  }
  if (filters.estacionId) {
    estaciones = estaciones.filter((e) => e.id === filters.estacionId);
  }
  if (filters.campanaId) {
    campanas = campanas.filter((c) => c.id === filters.campanaId);
  }

  const estacionIds = new Set(estaciones.map((e) => e.id));
  const campanaIds = new Set(campanas.map((c) => c.id));

  let clasificaciones = store.clasificaciones.filter((c) => estacionIds.has(c.estacionId));
  if (filters.estadoAmbiental) {
    clasificaciones = clasificaciones.filter((c) => c.estado === filters.estadoAmbiental);
    const allowed = new Set(clasificaciones.map((c) => c.estacionId));
    estaciones = estaciones.filter((e) => allowed.has(e.id));
  }

  const estacionIdsFinal = new Set(estaciones.map((e) => e.id));

  let muestras = store.muestras.filter(
    (m) =>
      estacionIdsFinal.has(m.estacionId) &&
      campanaIds.has(m.campanaId) &&
      inDateRange(m.fechaMuestreo, filters.fechaInicio, filters.fechaFin)
  );

  if (filters.estacionId) {
    muestras = muestras.filter((m) => m.estacionId === filters.estacionId);
  }
  if (filters.campanaId) {
    muestras = muestras.filter((m) => m.campanaId === filters.campanaId);
  }

  return { store, estaciones, campanas, muestras, clasificaciones: clasificaciones.filter((c) => estacionIdsFinal.has(c.estacionId)) };
}

function buildMeasurements(
  filters: ExportReportFilters,
  ctx: ReturnType<typeof applyFilters>
): ExportMeasurementRow[] {
  const rows: ExportMeasurementRow[] = [];
  const { store, estaciones, campanas, muestras, clasificaciones } = ctx;
  const estacionById = new Map(estaciones.map((e) => [e.id, e]));
  const campanaById = new Map(campanas.map((c) => [c.id, c]));
  const clasifByEstacion = new Map(clasificaciones.map((c) => [c.estacionId, c]));

  let paramDefs = PARAMETER_DEFS;
  if (filters.parametroCodigo) {
    paramDefs = paramDefs.filter((p) => p.code === filters.parametroCodigo);
  }
  if (filters.categoria) {
    paramDefs = paramDefs.filter((p) => p.category === filters.categoria);
  }

  for (const muestra of muestras) {
    const param = store.parametros.find((p) => p.muestraId === muestra.id);
    if (!param) continue;
    const estacion = estacionById.get(muestra.estacionId);
    const campana = campanaById.get(muestra.campanaId);
    if (!estacion || !campana) continue;

    const clasif = clasifByEstacion.get(estacion.id);
    const estadoEca = clasif ? mapEstadoAmbiental(clasif.estado) : "Sin evaluación";

    for (const def of paramDefs) {
      const raw = param[def.field];
      if (typeof raw !== "number" || Number.isNaN(raw)) continue;
      rows.push({
        estacionCodigo: estacion.codigo,
        campanaCodigo: campana.codigo,
        fecha: muestra.fechaMuestreo.slice(0, 10),
        parametroCodigo: def.code,
        parametroNombre: def.label,
        categoria: CATEGORY_LABELS[def.category] ?? def.category,
        valor: raw,
        unidad: def.unit,
        estadoEca,
      });
    }
  }

  return rows;
}

function buildStatistics(
  measurements: ExportMeasurementRow[],
  stations: ExportStationRow[],
  campaigns: ExportCampaignRow[],
  evaluations: ExportEvaluationRow[]
): ExportStatistics {
  const values = measurements.map((m) => m.valor);
  const mean = values.length ? values.reduce((a, b) => a + b, 0) / values.length : undefined;
  const min = values.length ? Math.min(...values) : undefined;
  const max = values.length ? Math.max(...values) : undefined;
  const variance =
    mean != null && values.length > 1
      ? values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (values.length - 1)
      : undefined;

  const cumple = evaluations.filter((e) => e.estado.includes("Cumple")).length;
  const totalEval = evaluations.length;

  return {
    totalRegistros: measurements.length + stations.length + campaigns.length + evaluations.length,
    totalMediciones: measurements.length,
    totalEstaciones: stations.length,
    totalCampanas: campaigns.length,
    totalEvaluaciones: evaluations.length,
    cumplimientoEcaPct: totalEval ? Math.round((cumple / totalEval) * 100) : 0,
    valorPromedio: mean != null ? Math.round(mean * 100) / 100 : undefined,
    valorMin: min,
    valorMax: max,
    desviacionEstandar: variance != null ? Math.round(Math.sqrt(variance) * 100) / 100 : undefined,
  };
}

function buildCharts(
  measurements: ExportMeasurementRow[],
  evaluations: ExportEvaluationRow[]
): ReportChartSection[] {
  const byMonth = new Map<string, number[]>();
  measurements.forEach((m) => {
    const month = m.fecha.slice(0, 7);
    const arr = byMonth.get(month) ?? [];
    arr.push(m.valor);
    byMonth.set(month, arr);
  });

  const trendData = Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, vals]) => ({
      label,
      value: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100,
    }));

  const byParam = new Map<string, number[]>();
  measurements.forEach((m) => {
    const arr = byParam.get(m.parametroNombre) ?? [];
    arr.push(m.valor);
    byParam.set(m.parametroNombre, arr);
  });

  const paramCompare = Array.from(byParam.entries())
    .slice(0, 6)
    .map(([label, vals]) => ({
      label,
      value: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100,
    }));

  const ecaCounts = {
    Cumple: evaluations.filter((e) => e.estado.includes("Cumple")).length,
    Alerta: evaluations.filter((e) => e.estado.includes("alerta")).length,
    "No cumple": evaluations.filter((e) => e.estado.includes("No cumple")).length,
  };

  const estadoDist = Object.entries(ecaCounts)
    .filter(([, v]) => v > 0)
    .map(([label, value]) => ({ label, value }));

  return [
    {
      title: "Tendencia temporal",
      description: "Promedio mensual de mediciones filtradas",
      type: "line",
      data: trendData.length ? trendData : [{ label: "Sin datos", value: 0 }],
    },
    {
      title: "Comparación de parámetros",
      description: "Valor promedio por parámetro",
      type: "bar",
      data: paramCompare.length ? paramCompare : [{ label: "Sin datos", value: 0 }],
    },
    {
      title: "Cumplimiento ECA",
      description: "Distribución de estados de evaluación",
      type: "pie",
      data: estadoDist.length ? estadoDist : [{ label: "Sin evaluaciones", value: 1 }],
    },
    {
      title: "Distribución de estados",
      description: "Estados ambientales agregados",
      type: "pie",
      data: estadoDist.length ? estadoDist : [{ label: "Sin datos", value: 1 }],
    },
  ];
}

export function getExportFilterOptions(): ExportFilterOptions {
  const store = getDataStore();
  return {
    cuencas: store.cuencas.map((c) => ({ value: c.id, label: c.nombre })),
    rios: store.rios.map((r) => ({ value: r.id, label: r.nombre })),
    estaciones: store.estaciones.map((e) => ({
      value: e.id,
      label: `${e.codigo} — ${e.tramo}`,
    })),
    campanas: store.campanas.map((c) => ({ value: c.id, label: c.codigo })),
    parametros: PARAMETER_DEFS.map((p) => ({
      value: p.code,
      label: p.label,
      categoria: p.category,
    })),
    categorias: Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
    estadosAmbientales: [
      { value: EstadoECA.CUMPLE, label: ESTADO_ECA_LABELS[EstadoECA.CUMPLE] },
      { value: EstadoECA.EN_ALERTA, label: ESTADO_ECA_LABELS[EstadoECA.EN_ALERTA] },
      { value: EstadoECA.NO_CUMPLE, label: ESTADO_ECA_LABELS[EstadoECA.NO_CUMPLE] },
    ],
  };
}

export function buildExportPreview(filters: ExportReportFilters): ExportPreviewDto {
  const bundle = buildExportBundle(filters, DEFAULT_EXPORT_SECTIONS, "Investigador HydroVision");
  const dates = bundle.measurements.map((m) => m.fecha).sort();

  return {
    recordCount: bundle.preview.statistics.totalRegistros,
    dateRange: dates.length ? { inicio: dates[0], fin: dates[dates.length - 1] } : null,
    estaciones: bundle.stations.map((s) => s.codigo),
    parametros: [...new Set(bundle.measurements.map((m) => m.parametroNombre))],
    statistics: bundle.preview.statistics,
    charts: bundle.charts,
    filtersApplied: filters,
    isEmpty: bundle.measurements.length === 0,
    message: bundle.measurements.length === 0 ? "No hay registros para los filtros seleccionados." : undefined,
  };
}

export function buildExportBundle(
  filters: ExportReportFilters,
  sections: ExportSections,
  responsable: string
): ReportExportBundle {
  const ctx = applyFilters(filters);
  const { store, estaciones, campanas, clasificaciones } = ctx;

  const stations: ExportStationRow[] = estaciones.map((e) => ({
    codigo: e.codigo,
    nombre: e.nombre ?? e.tramo,
    rio: resolveNombre(e.rioId, store.rios),
    cuenca: resolveNombre(e.cuencaId, store.cuencas),
    tramo: e.tramo,
    latitud: e.coordenadas.latitude,
    longitud: e.coordenadas.longitude,
    estado: e.estadoOperativo,
  }));

  const campaigns: ExportCampaignRow[] = campanas.map((c) => ({
    codigo: c.codigo,
    nombre: c.nombre,
    cuenca: resolveNombre(c.cuencaId, store.cuencas),
    rio: resolveNombre(c.rioId, store.rios),
    fechaInicio: c.fechaInicio,
    fechaFin: c.fechaFin,
    estado: c.estado,
    responsable: resolveNombre(c.responsableId, store.usuarios),
  }));

  const parameters: ExportParameterRow[] = PARAMETER_DEFS.map((p) => ({
    codigo: p.code,
    nombre: p.label,
    categoria: CATEGORY_LABELS[p.category] ?? p.category,
    unidad: p.unit,
  }));

  const measurements = buildMeasurements(filters, ctx);

  const evaluations: ExportEvaluationRow[] = clasificaciones.map((c) => {
    const estacion = estaciones.find((e) => e.id === c.estacionId);
    const riskIndex =
      c.estado === EstadoECA.NO_CUMPLE ? 85 : c.estado === EstadoECA.EN_ALERTA ? 55 : 20;
    return {
      estacionCodigo: estacion?.codigo ?? c.estacionId,
      estacionNombre: estacion?.tramo ?? c.estacionId,
      fecha: c.evaluadoEn.slice(0, 10),
      estado: mapEstadoAmbiental(c.estado),
      indiceRiesgo: riskIndex,
      parametrosViolados: (c.parametrosViolados ?? []).join(", ") || "—",
      parametrosEnAlerta: (c.parametrosEnAlerta ?? []).join(", ") || "—",
    };
  });

  const statistics = buildStatistics(measurements, stations, campaigns, evaluations);
  const charts = buildCharts(measurements, evaluations);

  const cuencaLabel = filters.cuencaId
    ? resolveNombre(filters.cuencaId, store.cuencas)
    : "Todas las cuencas";

  const conclusions = [
    `Se exportaron ${measurements.length} mediciones de ${stations.length} estaciones en el periodo ${filters.fechaInicio} — ${filters.fechaFin}.`,
    `Cumplimiento ECA agregado: ${statistics.cumplimientoEcaPct}%.`,
    measurements.length === 0
      ? "No se encontraron mediciones; revise los filtros de fecha o geografía."
      : "Los datos pueden utilizarse para análisis científico e informes técnicos.",
    "Se recomienda complementar con monitoreo continuo y validación en laboratorio acreditado.",
  ];

  return {
    generatedAt: new Date().toISOString(),
    responsable,
    titulo: `Exportación Ambiental — ${cuencaLabel}`,
    filters,
    sections,
    preview: {
      recordCount: statistics.totalRegistros,
      dateRange: measurements.length
        ? {
            inicio: measurements.map((m) => m.fecha).sort()[0],
            fin: measurements.map((m) => m.fecha).sort().reverse()[0],
          }
        : null,
      estaciones: stations.map((s) => s.codigo),
      parametros: [...new Set(measurements.map((m) => m.parametroNombre))],
      statistics,
      charts,
      filtersApplied: filters,
      isEmpty: measurements.length === 0,
    },
    stations,
    campaigns,
    parameters,
    measurements,
    evaluations,
    charts,
    conclusions,
  };
}

export { PARAMETER_DEFS, CATEGORY_LABELS };
