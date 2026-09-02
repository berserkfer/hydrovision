/**
 * Mock de reportes ambientales — Sprint 2F
 */

import { MOCK_LAST_UPDATE } from "@/config";
import { EstadoCampana, EstadoECA } from "@/constants/enums";
import { getDataStore } from "@/data/store-access";
import { getComplianceLabel } from "@/lib/eca/classifier";
import { resolveNombre } from "@/utils";
import type {
  EnvironmentalReportDocument,
  ReportExecutiveStats,
  ReportFilterOptions,
  ReportFilters,
  ReportSectionContent,
  ReportTabId,
} from "@/types/report-management";
import { DEFAULT_REPORT_FILTERS } from "@/types/report-management";

function applyGeographicFilters(filters: ReportFilters) {
  const store = getDataStore();
  let estaciones = store.estaciones;
  let campanas = store.campanas;
  let rios = store.rios;

  if (filters.cuencaId) {
    estaciones = estaciones.filter((e) => e.cuencaId === filters.cuencaId);
    campanas = campanas.filter((c) => c.cuencaId === filters.cuencaId);
    rios = rios.filter((r) => r.cuencaId === filters.cuencaId);
  }
  if (filters.rioId) {
    estaciones = estaciones.filter((e) => e.rioId === filters.rioId);
    campanas = campanas.filter((c) => c.rioId === filters.rioId);
    rios = rios.filter((r) => r.id === filters.rioId);
  }
  if (filters.estacionId) {
    estaciones = estaciones.filter((e) => e.id === filters.estacionId);
  }
  if (filters.campanaId) {
    campanas = campanas.filter((c) => c.id === filters.campanaId);
  }

  return { estaciones, campanas, rios, store };
}

function buildExecutiveSection(
  filters: ReportFilters,
  responsable: string
): ReportSectionContent {
  const { estaciones, campanas, store } = applyGeographicFilters(filters);
  const clasificaciones = store.clasificaciones.filter((c) =>
    estaciones.some((e) => e.id === c.estacionId)
  );
  const cumple = clasificaciones.filter((c) => c.estado === EstadoECA.CUMPLE).length;
  const total = clasificaciones.length || 1;

  return {
    tabId: "executive",
    title: "Resumen Ejecutivo — Monitoreo Ambiental",
    generatedAt: MOCK_LAST_UPDATE,
    responsable,
    summary: `Informe consolidado del periodo ${filters.fechaInicio} al ${filters.fechaFin}. Se evaluaron ${estaciones.length} estaciones y ${campanas.length} campañas en la cuenca seleccionada. Cumplimiento ECA global: ${Math.round((cumple / total) * 100)}%. Datos simulados para tesis.`,
    conclusions: [
      "La calidad del agua se mantiene dentro de rangos aceptables en la mayoría de estaciones monitoreadas.",
      "Se identifican puntos de atención en tramos con incremento de turbidez post-eventos de lluvia.",
      "Se recomienda continuar el monitoreo satelital para complementar muestreos de campo.",
      "Los índices de riesgo ambiental sugieren priorizar seguimiento en estaciones P3 y P5.",
    ],
    tables: [
      {
        title: "Indicadores clave",
        headers: ["Indicador", "Valor", "Estado"],
        rows: [
          { id: "k1", cells: ["Estaciones monitoreadas", String(estaciones.length), "Activo"] },
          { id: "k2", cells: ["Campañas en periodo", String(campanas.length), "Activo"] },
          { id: "k3", cells: ["Cumplimiento ECA", `${Math.round((cumple / total) * 100)}%`, cumple / total > 0.7 ? "Aceptable" : "Atención"] },
          { id: "k4", cells: ["Muestras registradas", String(store.muestras.length), "Simulado"] },
        ],
      },
    ],
    charts: [
      {
        title: "Distribución ECA",
        description: "Clasificación agregada de estaciones",
        type: "pie",
        data: [
          { label: "Cumple", value: clasificaciones.filter((c) => c.estado === EstadoECA.CUMPLE).length },
          { label: "Alerta", value: clasificaciones.filter((c) => c.estado === EstadoECA.EN_ALERTA).length },
          { label: "No cumple", value: clasificaciones.filter((c) => c.estado === EstadoECA.NO_CUMPLE).length },
        ],
      },
      {
        title: "Evolución mensual",
        description: "Tendencia de cumplimiento simulada",
        type: "line",
        data: [
          { label: "Ene", value: 72 },
          { label: "Feb", value: 75 },
          { label: "Mar", value: 68 },
          { label: "Abr", value: 80 },
          { label: "May", value: 78 },
          { label: "Jun", value: 82 },
        ],
      },
    ],
  };
}

function buildWaterQualitySection(filters: ReportFilters, responsable: string): ReportSectionContent {
  const { estaciones, store } = applyGeographicFilters(filters);
  const estacionIds = new Set(estaciones.map((e) => e.id));
  const params = store.parametros.filter((p) => estacionIds.has(p.estacionId));

  return {
    tabId: "waterQuality",
    title: "Calidad del Agua — Parámetros Fisicoquímicos",
    generatedAt: MOCK_LAST_UPDATE,
    responsable,
    summary: `Análisis de ${params.length} registros de parámetros en el periodo seleccionado. Incluye pH, oxígeno disuelto, turbidez, conductividad, DBO5 y DQO.`,
    conclusions: [
      "El pH se mantiene en rango neutro en la mayoría de estaciones.",
      "Oxígeno disuelto presenta variabilidad en tramos urbanos e industriales.",
      "Turbidez elevada correlaciona con eventos de escorrentía.",
    ],
    tables: [
      {
        title: "Promedios por parámetro",
        headers: ["Parámetro", "Promedio", "Unidad", "Estado"],
        rows: params.length
          ? [
              {
                id: "ph",
                cells: [
                  "pH",
                  String((params.reduce((s, p) => s + (p.ph ?? 0), 0) / params.length).toFixed(2)),
                  "—",
                  "Cumple",
                ],
              },
              {
                id: "od",
                cells: [
                  "Oxígeno disuelto",
                  String((params.reduce((s, p) => s + (p.oxigenoDisuelto ?? 0), 0) / params.length).toFixed(2)),
                  "mg/L",
                  "Cumple",
                ],
              },
              {
                id: "turb",
                cells: [
                  "Turbidez",
                  String((params.reduce((s, p) => s + (p.turbidez ?? 0), 0) / params.length).toFixed(1)),
                  "NTU",
                  "Alerta",
                ],
              },
            ]
          : [{ id: "empty", cells: ["—", "—", "—", "Sin datos"] }],
      },
    ],
    charts: [
      {
        title: "Perfil fisicoquímico",
        description: "Promedios normalizados por estación",
        type: "bar",
        data: estaciones.slice(0, 6).map((e, i) => ({
          label: e.codigo,
          value: Number((6.5 + i * 0.3).toFixed(2)),
        })),
      },
    ],
  };
}

function buildCampaignsSection(filters: ReportFilters, responsable: string): ReportSectionContent {
  const { campanas, store } = applyGeographicFilters(filters);

  return {
    tabId: "campaigns",
    title: "Campañas de Monitoreo",
    generatedAt: MOCK_LAST_UPDATE,
    responsable,
    summary: `Resumen de ${campanas.length} campañas de monitoreo en el ámbito filtrado.`,
    conclusions: [
      "Las campañas de temporada seca completaron muestreo en todas las estaciones planificadas.",
      "Campañas planificadas requieren asignación de recursos de campo.",
    ],
    tables: [
      {
        title: "Campañas del periodo",
        headers: ["Código", "Nombre", "Inicio", "Fin", "Estado"],
        rows: campanas.map((c) => ({
          id: c.id,
          cells: [
            c.codigo,
            c.nombre,
            c.fechaInicio,
            c.fechaFin,
            c.estado === EstadoCampana.EN_CURSO ? "En curso" : c.estado === EstadoCampana.FINALIZADA ? "Finalizada" : "Planificada",
          ],
        })),
      },
    ],
    charts: [
      {
        title: "Muestras por campaña",
        description: "Volumen de muestreo simulado",
        type: "bar",
        data: campanas.map((c) => ({
          label: c.codigo.replace("CAMP-", ""),
          value: store.muestras.filter((m) => m.campanaId === c.id).length,
        })),
      },
    ],
  };
}

function buildStationsSection(filters: ReportFilters, responsable: string): ReportSectionContent {
  const { estaciones, store } = applyGeographicFilters(filters);

  return {
    tabId: "stations",
    title: "Estaciones de Monitoreo",
    generatedAt: MOCK_LAST_UPDATE,
    responsable,
    summary: `Inventario de ${estaciones.length} estaciones activas en la red de monitoreo.`,
    conclusions: [
      "Todas las estaciones mantienen operatividad simulada.",
      "Se recomienda calibración de sensores en estaciones de mantenimiento.",
    ],
    tables: [
      {
        title: "Red de estaciones",
        headers: ["Código", "Nombre", "Río", "Tramo", "Estado"],
        rows: estaciones.map((e) => ({
          id: e.id,
          cells: [
            e.codigo,
            e.nombre,
            resolveNombre(e.rioId, store.rios),
            e.tramo,
            e.estadoOperativo === "active" ? "Activa" : e.estadoOperativo === "maintenance" ? "Mantenimiento" : "Inactiva",
          ],
        })),
      },
    ],
    charts: [
      {
        title: "Estaciones por río",
        description: "Distribución geográfica",
        type: "bar",
        data: Object.entries(
          estaciones.reduce<Record<string, number>>((acc, e) => {
            const rio = resolveNombre(e.rioId, store.rios);
            acc[rio] = (acc[rio] ?? 0) + 1;
            return acc;
          }, {})
        ).map(([label, value]) => ({ label: label.replace("Río ", ""), value })),
      },
    ],
  };
}

function buildSatelliteSection(filters: ReportFilters, responsable: string): ReportSectionContent {
  const { estaciones, store } = applyGeographicFilters(filters);
  const estacionIds = new Set(estaciones.map((e) => e.id));
  const indices = store.indicesSatelitales.filter((i) => estacionIds.has(i.estacionId));

  return {
    tabId: "satellite",
    title: "Índices Satelitales",
    generatedAt: MOCK_LAST_UPDATE,
    responsable,
    summary: `Análisis de ${indices.length} registros de índices espectrales (NDVI, NDWI, MNDWI, NDTI). Fuente simulada: Sentinel-2 / Landsat.`,
    conclusions: [
      "NDVI indica cobertura vegetal estable en riberas.",
      "NDWI muestra variaciones estacionales en cuerpos de agua.",
      "Cobertura nubosa promedio inferior al 15% en imágenes seleccionadas.",
    ],
    tables: [
      {
        title: "Índices por estación",
        headers: ["Estación", "NDVI", "NDWI", "MNDWI", "Fuente"],
        rows: indices.slice(0, 8).map((idx) => {
          const est = store.estaciones.find((e) => e.id === idx.estacionId);
          return {
            id: idx.id,
            cells: [
              est?.codigo ?? "—",
              idx.ndvi.toFixed(3),
              idx.ndwi.toFixed(3),
              idx.mndwi.toFixed(3),
              idx.fuente,
            ],
          };
        }),
      },
    ],
    charts: [
      {
        title: "NDVI promedio",
        description: "Índice de vegetación por estación",
        type: "line",
        data: indices.slice(0, 8).map((idx, i) => ({
          label: store.estaciones.find((e) => e.id === idx.estacionId)?.codigo ?? `P${i + 1}`,
          value: idx.ndvi,
        })),
      },
    ],
  };
}

function buildRiskSection(filters: ReportFilters, responsable: string): ReportSectionContent {
  const { estaciones, store } = applyGeographicFilters(filters);
  const clasificaciones = store.clasificaciones.filter((c) =>
    estaciones.some((e) => e.id === c.estacionId)
  );

  return {
    tabId: "risk",
    title: "Riesgo Ambiental",
    generatedAt: MOCK_LAST_UPDATE,
    responsable,
    summary: "Evaluación integrada de riesgo ambiental basada en cumplimiento ECA, parámetros críticos e índices satelitales simulados.",
    conclusions: [
      "Riesgo bajo en estaciones de sector alto y medio del río.",
      "Riesgo moderado en tramos con influencia agrícola e industrial.",
      "Se sugiere activar protocolo de alerta en estaciones con incumplimiento ECA.",
    ],
    tables: [
      {
        title: "Matriz de riesgo",
        headers: ["Estación", "Clasificación ECA", "Nivel de riesgo", "Acción"],
        rows: clasificaciones.slice(0, 8).map((c) => {
          const est = store.estaciones.find((e) => e.id === c.estacionId);
          const risk = c.estado === EstadoECA.NO_CUMPLE ? "Alto" : c.estado === EstadoECA.EN_ALERTA ? "Moderado" : "Bajo";
          return {
            id: c.id,
            cells: [
              est?.codigo ?? "—",
              getComplianceLabel(c.estado as "compliant" | "alert" | "non_compliant"),
              risk,
              risk === "Alto" ? "Investigar fuente" : "Monitoreo rutinario",
            ],
          };
        }),
      },
    ],
    charts: [
      {
        title: "Niveles de riesgo",
        description: "Distribución por estación",
        type: "pie",
        data: [
          { label: "Bajo", value: clasificaciones.filter((c) => c.estado === EstadoECA.CUMPLE).length },
          { label: "Moderado", value: clasificaciones.filter((c) => c.estado === EstadoECA.EN_ALERTA).length },
          { label: "Alto", value: clasificaciones.filter((c) => c.estado === EstadoECA.NO_CUMPLE).length },
        ],
      },
    ],
  };
}

export function getMockReportFilterOptions(): ReportFilterOptions {
  const store = getDataStore();
  return {
    cuencas: store.cuencas.map((c) => ({ value: c.id, label: c.nombre })),
    rios: store.rios.map((r) => ({ value: r.id, label: r.nombre })),
    estaciones: store.estaciones.map((e) => ({
      value: e.id,
      label: `${e.codigo} — ${e.tramo}`,
    })),
    campanas: store.campanas.map((c) => ({ value: c.id, label: c.codigo })),
  };
}

export function getMockRiosByCuenca(cuencaId: string) {
  return getDataStore()
    .rios.filter((r) => r.cuencaId === cuencaId)
    .map((r) => ({ value: r.id, label: r.nombre }));
}

export function getMockExecutiveStats(filters: ReportFilters): ReportExecutiveStats {
  const { estaciones, campanas, store } = applyGeographicFilters(filters);
  const clasificaciones = store.clasificaciones.filter((c) =>
    estaciones.some((e) => e.id === c.estacionId)
  );
  const cumple = clasificaciones.filter((c) => c.estado === EstadoECA.CUMPLE).length;

  return {
    totalEstaciones: estaciones.length,
    totalCampanas: campanas.length,
    cumplimientoEca: clasificaciones.length ? Math.round((cumple / clasificaciones.length) * 100) : 0,
    alertasActivas: clasificaciones.filter((c) => c.estado === EstadoECA.EN_ALERTA).length,
    indiceRiesgoPromedio: 42,
  };
}

export function buildMockEnvironmentalReport(
  filters: ReportFilters = DEFAULT_REPORT_FILTERS
): EnvironmentalReportDocument {
  const store = getDataStore();
  const responsable = resolveNombre("usr-investigador", store.usuarios);

  const sections: Record<ReportTabId, ReportSectionContent> = {
    executive: buildExecutiveSection(filters, responsable),
    waterQuality: buildWaterQualitySection(filters, responsable),
    campaigns: buildCampaignsSection(filters, responsable),
    stations: buildStationsSection(filters, responsable),
    satellite: buildSatelliteSection(filters, responsable),
    risk: buildRiskSection(filters, responsable),
  };

  const cuencaLabel = filters.cuencaId
    ? resolveNombre(filters.cuencaId, store.cuencas)
    : "Todas las cuencas";

  return {
    id: `rep-${Date.now()}`,
    titulo: `Reporte Ambiental — ${cuencaLabel}`,
    generatedAt: MOCK_LAST_UPDATE,
    responsable,
    resumenGlobal: sections.executive.summary,
    sections,
    filtersApplied: filters,
    isSimulated: true,
  };
}

export function getMockReportSection(
  tabId: ReportTabId,
  filters: ReportFilters
): ReportSectionContent {
  return buildMockEnvironmentalReport(filters).sections[tabId];
}
