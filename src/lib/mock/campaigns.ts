/**
 * Mock de campañas de monitoreo — Sprint 2C / 2D
 * Fuente canónica de datos simulados para el módulo de campañas.
 */

import { MOCK_LAST_UPDATE } from "@/config";
import { EstadoCampana, EstadoECA, ESTADO_CAMPANA_LABELS } from "@/constants/enums";
import { getDataStore } from "@/data/store-access";
import type { CampanaMonitoreo } from "@/models/monitoring";
import type {
  CampanaDetail,
  CampanaEcaResumen,
  CampanaParametroResumen,
  CampanaSummary,
  CampaignStats,
  CreateCampanaInput,
} from "@/types/campaign";
import type { StationCampaignHistoryItem } from "@/types/station-management";
import { resolveNombre } from "@/utils";

/** Metadatos extendidos en memoria (formulario Sprint 2D) */
interface CampaignExtendedMeta {
  descripcion: string;
  observaciones: string;
  estacionIds: string[];
}

const campaignExtendedMeta = new Map<string, CampaignExtendedMeta>();

function getExtendedMeta(campanaId: string, campana: CampanaMonitoreo): CampaignExtendedMeta {
  const stored = campaignExtendedMeta.get(campanaId);
  if (stored) return stored;

  return {
    descripcion: `Campaña de monitoreo ambiental en ${resolveNombre(campana.rioId, getDataStore().rios)}.`,
    observaciones: campana.objetivo,
    estacionIds: getDataStore()
      .estaciones.filter((e) => e.rioId === campana.rioId)
      .map((e) => e.id),
  };
}

function countEstaciones(campana: CampanaMonitoreo): number {
  const meta = getExtendedMeta(campana.id, campana);
  return meta.estacionIds.length;
}

function countMuestras(campanaId: string): number {
  return getDataStore().muestras.filter((m) => m.campanaId === campanaId).length;
}

function countParametros(campanaId: string): number {
  const muestraIds = getDataStore()
    .muestras.filter((m) => m.campanaId === campanaId)
    .map((m) => m.id);
  return getDataStore().parametros.filter((p) => muestraIds.includes(p.muestraId)).length;
}

function toSummary(campana: CampanaMonitoreo): CampanaSummary {
  const meta = getExtendedMeta(campana.id, campana);
  return {
    id: campana.id,
    codigo: campana.codigo,
    nombre: campana.nombre,
    fechaInicio: campana.fechaInicio,
    fechaFin: campana.fechaFin,
    responsableId: campana.responsableId,
    responsableNombre: resolveNombre(campana.responsableId, getDataStore().usuarios),
    cuencaId: campana.cuencaId,
    cuencaNombre: resolveNombre(campana.cuencaId, getDataStore().cuencas),
    rioId: campana.rioId,
    rioNombre: resolveNombre(campana.rioId, getDataStore().rios),
    estacionCount: countEstaciones(campana),
    parametroCount: countParametros(campana.id),
    muestraCount: countMuestras(campana.id),
    estado: campana.estado,
    observaciones: meta.observaciones,
  };
}

function generateCodigo(): string {
  const year = new Date().getFullYear();
  const count = getDataStore().campanas.length + 1;
  return `CAMP-${year}-${String(count).padStart(2, "0")}`;
}

function addMonths(isoDate: string, months: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1 + months, day);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildParametrosResumen(campanaId: string): CampanaParametroResumen[] {
  const store = getDataStore();
  const muestraIds = store.muestras.filter((m) => m.campanaId === campanaId).map((m) => m.id);
  const params = store.parametros.filter((p) => muestraIds.includes(p.muestraId));
  if (params.length === 0) return [];

  const defs: { key: keyof (typeof params)[0]; label: string; unit: string }[] = [
    { key: "ph", label: "pH", unit: "—" },
    { key: "turbidez", label: "Turbidez", unit: "NTU" },
    { key: "conductividad", label: "Conductividad", unit: "µS/cm" },
    { key: "oxigenoDisuelto", label: "Oxígeno disuelto", unit: "mg/L" },
    { key: "temperatura", label: "Temperatura", unit: "°C" },
  ];

  return defs.map(({ key, label, unit }) => {
    const values = params.map((p) => Number(p[key])).filter((v) => !Number.isNaN(v));
    const promedio = values.reduce((a, b) => a + b, 0) / (values.length || 1);
    return {
      key: String(key),
      label,
      unit,
      promedio: Number(promedio.toFixed(2)),
      min: Math.min(...values),
      max: Math.max(...values),
    };
  });
}

function buildEcaResumen(campanaId: string): CampanaEcaResumen {
  const store = getDataStore();
  const muestraIds = store.muestras.filter((m) => m.campanaId === campanaId).map((m) => m.id);
  const clasificaciones = store.clasificaciones.filter((c) => muestraIds.includes(c.muestraId));

  return {
    cumple: clasificaciones.filter((c) => c.estado === EstadoECA.CUMPLE).length,
    enAlerta: clasificaciones.filter((c) => c.estado === EstadoECA.EN_ALERTA).length,
    noCumple: clasificaciones.filter((c) => c.estado === EstadoECA.NO_CUMPLE).length,
    total: clasificaciones.length,
  };
}

function buildMuestrasPorMes(campanaId: string) {
  const store = getDataStore();
  const muestras = store.muestras.filter((m) => m.campanaId === campanaId);
  const byMonth = new Map<string, number>();

  muestras.forEach((m) => {
    const month = m.fechaMuestreo.slice(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0) + 1);
  });

  if (byMonth.size === 0) {
    return [
      { label: "Ene", value: 0 },
      { label: "Feb", value: 0 },
      { label: "Mar", value: 0 },
      { label: "Abr", value: 0 },
      { label: "May", value: 0 },
      { label: "Jun", value: 1 },
    ];
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({
      label: month.slice(5),
      value,
    }));
}

/** Campañas simuladas — listado */
export function getMockCampaignSummaries(): CampanaSummary[] {
  return getDataStore().campanas
    .map(toSummary)
    .sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio));
}

export function getMockCampaignById(id: string): CampanaMonitoreo | null {
  return getDataStore().campanas.find((c) => c.id === id) ?? null;
}

export function getMockCampaignDetail(id: string): CampanaDetail | null {
  const campana = getMockCampaignById(id);
  if (!campana) return null;

  const summary = toSummary(campana);
  const meta = getExtendedMeta(campana.id, campana);
  const ecaResumen = buildEcaResumen(campana.id);

  const estaciones = getDataStore()
    .estaciones.filter((e) => meta.estacionIds.includes(e.id))
    .map((e) => ({
      id: e.id,
      codigo: e.codigo,
      nombre: e.nombre,
      tramo: e.tramo,
      estadoOperativo: e.estadoOperativo,
    }));

  return {
    ...summary,
    objetivo: campana.objetivo,
    descripcion: meta.descripcion,
    estaciones,
    parametros: buildParametrosResumen(campana.id),
    ecaResumen,
    muestrasPorMes: buildMuestrasPorMes(campana.id),
    ecaPorEstado: [
      { label: "Cumple", value: ecaResumen.cumple },
      { label: "Alerta", value: ecaResumen.enAlerta },
      { label: "No cumple", value: ecaResumen.noCumple },
    ],
    createdAt: campana.createdAt,
    updatedAt: campana.updatedAt,
  };
}

export function getMockCampaignStats(): CampaignStats {
  const campanas = getDataStore().campanas;
  return {
    total: campanas.length,
    enCurso: campanas.filter((c) => c.estado === EstadoCampana.EN_CURSO).length,
    planificadas: campanas.filter((c) => c.estado === EstadoCampana.PLANIFICADA).length,
    finalizadas: campanas.filter((c) => c.estado === EstadoCampana.FINALIZADA).length,
    canceladas: campanas.filter((c) => c.estado === EstadoCampana.CANCELADA).length,
  };
}

export function getMockResponsablesOptions() {
  return getDataStore()
    .usuarios.filter((u) => u.activo)
    .map((u) => ({ value: u.id, label: u.nombre }));
}

export function getMockCuencasOptions() {
  return getDataStore().cuencas.map((c) => ({ value: c.id, label: c.nombre }));
}

export function getMockRiosByCuenca(cuencaId: string) {
  return getDataStore()
    .rios.filter((r) => r.cuencaId === cuencaId)
    .map((r) => ({ value: r.id, label: r.nombre }));
}

export function getMockEstacionesByRio(rioId: string) {
  return getDataStore()
    .estaciones.filter((e) => e.rioId === rioId)
    .map((e) => ({ value: e.id, label: `${e.codigo} — ${e.tramo}` }));
}

export function getMockCampaignYearOptions() {
  const years = new Set(
    getDataStore().campanas.map((c) => c.fechaInicio.slice(0, 4))
  );
  return Array.from(years)
    .sort((a, b) => b.localeCompare(a))
    .map((y) => ({ value: y, label: y }));
}

export function getMockCampaignMonthOptions() {
  return [
    { value: "01", label: "Enero" },
    { value: "02", label: "Febrero" },
    { value: "03", label: "Marzo" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Mayo" },
    { value: "06", label: "Junio" },
    { value: "07", label: "Julio" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ];
}

export function createMockCampaign(input: CreateCampanaInput): CampanaSummary {
  const now = MOCK_LAST_UPDATE;
  const id = `camp-${Date.now()}`;
  const codigo = generateCodigo();

  const campana: CampanaMonitoreo = {
    id,
    codigo,
    nombre: input.nombre.trim(),
    rioId: input.rioId,
    cuencaId: input.cuencaId,
    fechaInicio: input.fecha,
    fechaFin: addMonths(input.fecha, 2),
    responsableId: input.responsableId,
    estado: EstadoCampana.PLANIFICADA,
    objetivo: input.objetivo.trim() || "Sin objetivo registrado.",
    createdAt: now,
    updatedAt: now,
    isSimulated: true,
  };

  campaignExtendedMeta.set(id, {
    descripcion: input.descripcion.trim() || "Campaña registrada desde el módulo de gestión.",
    observaciones: input.observaciones.trim(),
    estacionIds:
      input.estacionIds.length > 0
        ? input.estacionIds
        : getDataStore()
            .estaciones.filter((e) => e.rioId === input.rioId)
            .map((e) => e.id),
  });

  getDataStore().campanas.push(campana);
  return toSummary(campana);
}

export function updateMockCampaign(
  id: string,
  input: CreateCampanaInput
): CampanaSummary | null {
  const store = getDataStore();
  const index = store.campanas.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const now = MOCK_LAST_UPDATE;
  const existing = store.campanas[index];
  store.campanas[index] = {
    ...existing,
    nombre: input.nombre.trim(),
    rioId: input.rioId,
    cuencaId: input.cuencaId,
    fechaInicio: input.fecha,
    fechaFin: addMonths(input.fecha, 2),
    responsableId: input.responsableId,
    objetivo: input.objetivo.trim(),
    updatedAt: now,
  };

  campaignExtendedMeta.set(id, {
    descripcion: input.descripcion.trim() || "Campaña actualizada.",
    observaciones: input.observaciones.trim(),
    estacionIds:
      input.estacionIds.length > 0
        ? input.estacionIds
        : store.estaciones.filter((e) => e.rioId === input.rioId).map((e) => e.id),
  });

  return toSummary(store.campanas[index]);
}

export function deleteMockCampaign(id: string): boolean {
  const store = getDataStore();
  const before = store.campanas.length;
  store.campanas = store.campanas.filter((c) => c.id !== id);
  campaignExtendedMeta.delete(id);
  return store.campanas.length < before;
}

/** Campañas asociadas a una estación — Sprint 2C */
export function getMockCampaignsByStation(stationId: string): StationCampaignHistoryItem[] {
  const store = getDataStore();
  const estacion = store.estaciones.find((e) => e.id === stationId);
  if (!estacion) return [];

  const campanasRelacionadas = store.campanas.filter(
    (c) => c.rioId === estacion.rioId || c.cuencaId === estacion.cuencaId
  );

  return campanasRelacionadas
    .map((campana) => ({
      id: campana.id,
      codigo: campana.codigo,
      nombre: campana.nombre,
      fechaInicio: campana.fechaInicio,
      fechaFin: campana.fechaFin,
      estado: campana.estado,
      muestrasEnEstacion: store.muestras.filter(
        (m) => m.estacionId === stationId && m.campanaId === campana.id
      ).length,
    }))
    .sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio));
}

export function getMockCampaignStatusLabel(estado: StationCampaignHistoryItem["estado"]): string {
  return ESTADO_CAMPANA_LABELS[estado];
}

export function getMockMuestrasByCampana(campanaId: string) {
  return getDataStore().muestras.filter((m) => m.campanaId === campanaId);
}

export function getMockCampanasByRio(rioId: string): CampanaMonitoreo[] {
  return getDataStore().campanas.filter((c) => c.rioId === rioId);
}
