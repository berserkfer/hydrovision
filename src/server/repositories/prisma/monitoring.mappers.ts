/**
 * Mappers Prisma → DTOs de API para el dominio de monitoreo.
 * Dirección oficial: Prisma → Mapper → Domain/DTO → motores científicos.
 */

import { EstadoCampana, EstadoECA } from "@/constants/enums";
import type { ParametrosFisicoquimicos } from "@/models/monitoring";
import type {
  CampanaChartPoint,
  CampanaDetail,
  CampanaEcaResumen,
  CampanaParametroResumen,
  CampanaSummary,
  CampaignStats,
} from "@/types/campaign";
import type { CreateMuestraPayload, MuestraDetail, MuestraSummary, SampleStats } from "@/types/sampling";
import { estadoECAToCompliance } from "@/types/sampling";
import type { ComplianceStatus } from "@/types";
import type {
  Campaign,
  EnvironmentalAssessment,
  Measurement,
  Muestreo,
  Parameter,
  River,
  Station,
  Usuario,
  Watershed,
} from "@prisma/client";
import { aggregateMedicionesToParametros } from "@/database/mappers/hydrovision-store.mapper";
import { PARAMETRO_CATALOG_BY_CODIGO } from "@/database/constants/parametros-catalog";
import type { MeasurementRow } from "@/server/repositories/measurement.repository";

const PRISMA_ESTADO_CAMPANA: Record<string, EstadoCampana> = {
  planned: EstadoCampana.PLANIFICADA,
  active: EstadoCampana.EN_CURSO,
  completed: EstadoCampana.FINALIZADA,
  cancelled: EstadoCampana.CANCELADA,
};

const DOMAIN_ESTADO_CAMPANA: Record<EstadoCampana, Campaign["estado"]> = {
  [EstadoCampana.PLANIFICADA]: "planned",
  [EstadoCampana.EN_CURSO]: "active",
  [EstadoCampana.FINALIZADA]: "completed",
  [EstadoCampana.CANCELADA]: "cancelled",
};

export type CampaignListRow = Campaign & {
  rio: River;
  cuenca: Watershed;
  responsable: Usuario;
  muestreos: Array<{ id: string; puntoMonitoreoId: string }>;
  mediciones: Array<{ id: string }>;
};

export type MuestreoListRow = Muestreo & {
  campana: Campaign;
  puntoMonitoreo: Station;
  responsable: Usuario;
  evaluacion: EnvironmentalAssessment | null;
};

export type MeasurementListRow = Measurement & {
  parametro: Parameter;
  muestreo: Muestreo;
};

export type ParameterListRow = Parameter & {
  limites: Array<{ limiteMin: number | null; limiteMax: number | null }>;
};

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toIso(date: Date): string {
  return date.toISOString();
}

export function mapPrismaEstadoCampana(estado: Campaign["estado"]): EstadoCampana {
  return PRISMA_ESTADO_CAMPANA[estado] ?? EstadoCampana.PLANIFICADA;
}

export function mapDomainEstadoCampana(estado: EstadoCampana): Campaign["estado"] {
  return DOMAIN_ESTADO_CAMPANA[estado] ?? "planned";
}

export function mapCampaignToSummary(row: CampaignListRow, stationCount?: number): CampanaSummary {
  const distinctStations = new Set(row.muestreos.map((m) => m.puntoMonitoreoId));
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    fechaInicio: toDateOnly(row.fechaInicio),
    fechaFin: toDateOnly(row.fechaFin),
    responsableId: row.responsableId,
    responsableNombre: row.responsable.nombre,
    cuencaId: row.cuencaId,
    cuencaNombre: row.cuenca.nombre,
    rioId: row.rioId,
    rioNombre: row.rio.nombre,
    estacionCount: stationCount ?? distinctStations.size,
    parametroCount: row.mediciones.length,
    muestraCount: row.muestreos.length,
    estado: mapPrismaEstadoCampana(row.estado),
    observaciones: row.observaciones ?? "",
  };
}

function buildParametrosResumen(
  muestreos: Muestreo[],
  mediciones: Array<Measurement & { parametro: Parameter }>
): CampanaParametroResumen[] {
  const aggregated = aggregateMedicionesToParametros(muestreos, mediciones);
  if (aggregated.length === 0) return [];

  const defs: Array<{ key: keyof ParametrosFisicoquimicos; label: string; unit: string }> = [
    { key: "ph", label: "pH", unit: "—" },
    { key: "turbidez", label: "Turbidez", unit: "NTU" },
    { key: "conductividad", label: "Conductividad", unit: "µS/cm" },
    { key: "oxigenoDisuelto", label: "Oxígeno disuelto", unit: "mg/L" },
    { key: "temperatura", label: "Temperatura", unit: "°C" },
  ];

  return defs.map(({ key, label, unit }) => {
    const values = aggregated
      .map((p) => Number(p[key]))
      .filter((v) => !Number.isNaN(v) && v !== 0);
    const promedio = values.reduce((a, b) => a + b, 0) / (values.length || 1);
    return {
      key: String(key),
      label,
      unit,
      promedio: Number(promedio.toFixed(2)),
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 0,
    };
  });
}

function buildEcaResumen(evaluaciones: EnvironmentalAssessment[]): CampanaEcaResumen {
  return {
    cumple: evaluaciones.filter((e) => e.estado === "compliant").length,
    enAlerta: evaluaciones.filter((e) => e.estado === "alert").length,
    noCumple: evaluaciones.filter((e) => e.estado === "non_compliant").length,
    total: evaluaciones.length,
  };
}

function buildMuestrasPorMes(muestreos: Muestreo[]): CampanaChartPoint[] {
  const byMonth = new Map<string, number>();
  muestreos.forEach((m) => {
    const month = toIso(m.fechaMuestreo).slice(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0) + 1);
  });
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ label: month.slice(5), value }));
}

export function mapCampaignToDetail(
  row: CampaignListRow,
  estaciones: Station[],
  muestreos: Muestreo[],
  mediciones: Array<Measurement & { parametro: Parameter }>,
  evaluaciones: EnvironmentalAssessment[]
): CampanaDetail {
  const summary = mapCampaignToSummary(row, estaciones.length);
  const ecaResumen = buildEcaResumen(evaluaciones);

  return {
    ...summary,
    objetivo: row.objetivo,
    descripcion: row.observaciones ?? row.objetivo,
    estaciones: estaciones.map((e) => ({
      id: e.id,
      codigo: e.codigo,
      nombre: e.nombre,
      tramo: e.tramo,
      estadoOperativo: e.estado,
    })),
    parametros: buildParametrosResumen(muestreos, mediciones),
    ecaResumen,
    muestrasPorMes: buildMuestrasPorMes(muestreos),
    ecaPorEstado: [
      { label: "Cumple", value: ecaResumen.cumple },
      { label: "Alerta", value: ecaResumen.enAlerta },
      { label: "No cumple", value: ecaResumen.noCumple },
    ],
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function mapCampaignStats(campaigns: Campaign[]): CampaignStats {
  return {
    total: campaigns.length,
    enCurso: campaigns.filter((c) => c.estado === "active").length,
    planificadas: campaigns.filter((c) => c.estado === "planned").length,
    finalizadas: campaigns.filter((c) => c.estado === "completed").length,
    canceladas: campaigns.filter((c) => c.estado === "cancelled").length,
  };
}

function mapEvaluacionToCompliance(evaluacion: EnvironmentalAssessment | null): ComplianceStatus {
  if (!evaluacion) return "compliant";
  return estadoECAToCompliance(evaluacion.estado as EstadoECA);
}

export function mapMuestreoToSummary(row: MuestreoListRow): MuestraSummary {
  return {
    id: row.id,
    codigoMuestra: row.codigoMuestra,
    fechaMuestreo: toIso(row.fechaMuestreo),
    campanaId: row.campanaId,
    campanaNombre: row.campana.nombre,
    campanaCodigo: row.campana.codigo,
    estacionId: row.puntoMonitoreoId,
    estacionCodigo: row.puntoMonitoreo.codigo,
    estacionNombre: row.puntoMonitoreo.nombre,
    responsableId: row.responsableId,
    responsableNombre: row.responsable.nombre,
    estadoECA: mapEvaluacionToCompliance(row.evaluacion),
    clima: row.clima,
    colorAparente: row.colorAparente,
  };
}

export function mapMuestreoToDetail(
  row: MuestreoListRow,
  parametros: ParametrosFisicoquimicos
): MuestraDetail {
  const summary = mapMuestreoToSummary(row);
  const evaluacion = row.evaluacion;
  const violados = (evaluacion?.parametrosViolados as string[] | undefined) ?? [];
  const alerta = (evaluacion?.parametrosEnAlerta as string[] | undefined) ?? [];

  return {
    ...summary,
    observaciones: row.observaciones ?? "",
    parametros: {
      ph: parametros.ph,
      temperatura: parametros.temperatura,
      conductividad: parametros.conductividad,
      oxigenoDisuelto: parametros.oxigenoDisuelto,
      turbidez: parametros.turbidez,
      solidosDisueltosTotales: parametros.solidosDisueltosTotales,
      caudal: parametros.caudal,
      colorAparente: row.colorAparente,
    },
    parametrosViolados: violados,
    parametrosEnAlerta: alerta,
    normativaReferencia:
      evaluacion?.normativaReferencia ??
      "ECA Agua — Cuerpos receptores (referencia orientativa)",
    evaluadoEn: evaluacion ? toIso(evaluacion.evaluadoEn) : toIso(row.fechaMuestreo),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function mapSampleStats(summaries: MuestraSummary[]): SampleStats {
  return {
    total: summaries.length,
    cumple: summaries.filter((s) => s.estadoECA === "compliant").length,
    alerta: summaries.filter((s) => s.estadoECA === "alert").length,
    noCumple: summaries.filter((s) => s.estadoECA === "non_compliant").length,
  };
}

export function mapMeasurementToRow(row: MeasurementListRow): MeasurementRow {
  const catalog = PARAMETRO_CATALOG_BY_CODIGO[row.parametro.codigo as keyof typeof PARAMETRO_CATALOG_BY_CODIGO];
  return {
    id: row.id,
    muestraId: row.muestreoId,
    estacionId: row.puntoMonitoreoId,
    parametroCodigo: row.parametro.codigo,
    parametroNombre: catalog?.nombre ?? row.parametro.nombre,
    valor: row.valor,
    unidad: row.unidad,
    fechaMedicion: toDateOnly(row.fechaMedicion),
    metodoAnalisis: row.metodoAnalisis ?? undefined,
    laboratorio: row.laboratorio ?? undefined,
    equipoUtilizado: row.equipoUtilizado ?? undefined,
    observaciones: row.observaciones ?? undefined,
    nivelConfianza: row.nivelConfianza ?? undefined,
  };
}

export type ParameterCatalogRow = {
  id: string;
  codigo: string;
  nombre: string;
  unidad: string;
  descripcion?: string;
  limiteEcaMin?: number;
  limiteEcaMax?: number;
};

export function mapParameterToCatalogRow(row: ParameterListRow): ParameterCatalogRow {
  const limit = row.limites[0];
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    unidad: row.unidad,
    descripcion: row.descripcion ?? undefined,
    limiteEcaMin: limit?.limiteMin ?? undefined,
    limiteEcaMax: limit?.limiteMax ?? undefined,
  };
}

/** Campos del formulario de muestreo → códigos Prisma Parameter */
export const SAMPLE_PAYLOAD_TO_PARAM_CODE: Array<[keyof CreateMuestraPayload, keyof typeof PARAMETRO_CATALOG_BY_CODIGO]> = [
  ["ph", "ph"],
  ["turbidez", "turbidity"],
  ["conductividad", "conductivity"],
  ["oxigenoDisuelto", "dissolved_oxygen"],
  ["temperatura", "temperature"],
  ["solidosDisueltosTotales", "total_dissolved_solids"],
  ["caudal", "flow_rate"],
];

export function addMonths(isoDate: string, months: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1 + months, day);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
