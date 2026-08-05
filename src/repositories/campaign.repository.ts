/**
 * Repositorio mock — Campañas de monitoreo.
 * @see src/repositories — capa de infraestructura (Clean Architecture)
 */

import { MOCK_LAST_UPDATE } from "@/config";
import { EstadoCampana } from "@/constants/enums";
import { getDataStore } from "@/data/store-access";
import type { CampanaMonitoreo } from "@/models/monitoring";
import type {
  CampanaDetail,
  CampanaSummary,
  CampaignStats,
  CreateCampanaInput,
} from "@/types/campaign";
import { resolveNombre } from "@/utils";

function countEstaciones(rioId: string): number {
  return getDataStore().estaciones.filter((e) => e.rioId === rioId).length;
}

function countMuestras(campanaId: string): number {
  return getDataStore().muestras.filter((m) => m.campanaId === campanaId).length;
}

function toSummary(campana: CampanaMonitoreo): CampanaSummary {
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
    estacionCount: countEstaciones(campana.rioId),
    muestraCount: countMuestras(campana.id),
    estado: campana.estado,
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

export function getAllCampanaSummaries(): CampanaSummary[] {
  return getDataStore().campanas
    .map(toSummary)
    .sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio));
}

export function getCampanaById(id: string): CampanaMonitoreo | null {
  return getDataStore().campanas.find((c) => c.id === id) ?? null;
}

export function getCampanaDetailById(id: string): CampanaDetail | null {
  const campana = getCampanaById(id);
  if (!campana) return null;

  const summary = toSummary(campana);
  const estaciones = getDataStore().estaciones
    .filter((e) => e.rioId === campana.rioId)
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
    estaciones,
    createdAt: campana.createdAt,
    updatedAt: campana.updatedAt,
  };
}

export function getCampaignStats(): CampaignStats {
  const campanas = getDataStore().campanas;
  return {
    total: campanas.length,
    enCurso: campanas.filter((c) => c.estado === EstadoCampana.EN_CURSO).length,
    planificadas: campanas.filter((c) => c.estado === EstadoCampana.PLANIFICADA).length,
    finalizadas: campanas.filter((c) => c.estado === EstadoCampana.FINALIZADA).length,
    canceladas: campanas.filter((c) => c.estado === EstadoCampana.CANCELADA).length,
  };
}

export function getResponsablesOptions() {
  return getDataStore().usuarios
    .filter((u) => u.activo)
    .map((u) => ({ value: u.id, label: u.nombre }));
}

export function getCuencasOptions() {
  return getDataStore().cuencas.map((c) => ({ value: c.id, label: c.nombre }));
}

export function getRiosByCuenca(cuencaId: string) {
  return getDataStore().rios
    .filter((r) => r.cuencaId === cuencaId)
    .map((r) => ({ value: r.id, label: r.nombre }));
}

export function getAllRiosOptions() {
  return getDataStore().rios.map((r) => ({ value: r.id, label: r.nombre }));
}

export function createCampana(input: CreateCampanaInput): CampanaSummary {
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
    objetivo: input.observaciones.trim() || "Sin observaciones registradas.",
    createdAt: now,
    updatedAt: now,
    isSimulated: true,
  };

  getDataStore().campanas.push(campana);
  return toSummary(campana);
}

export function getCampanasByRio(rioId: string): CampanaMonitoreo[] {
  return getDataStore().campanas.filter((c) => c.rioId === rioId);
}

export function getMuestrasByCampana(campanaId: string) {
  return getDataStore().muestras.filter((m) => m.campanaId === campanaId);
}
