/**
 * Mock de estaciones de monitoreo — Sprint 2C / 3E
 * Deriva datos del almacén unificado sin conectar PostgreSQL.
 */

import { MOCK_LAST_UPDATE } from "@/config";
import { getDataStore } from "@/data/store-access";
import type { HydroVisionDataStore } from "@/models";
import { filterActive, markSoftDeleted } from "@/server/lib/soft-delete";
import type { CreateStationInput } from "@/server/validators/schemas/crud.schemas";
import type { MonitoringStationRecord } from "@/types/station-management";
import type { ComplianceStatus } from "@/types";

const ENTITY = "station";
const stationOverlay = new Map<string, Partial<MonitoringStationRecord>>();
const customStations = new Map<string, MonitoringStationRecord>();

function resolveDepartamentoNombre(
  store: HydroVisionDataStore,
  cuencaId: string
): string {
  const cuenca = store.cuencas.find((c) => c.id === cuencaId);
  if (!cuenca) return "—";
  const distrito = store.distritos.find((d) => d.id === cuenca.distritoId);
  if (!distrito) return "—";
  const provincia = store.provincias.find((p) => p.id === distrito.provinciaId);
  if (!provincia) return "—";
  const departamento = store.departamentos.find((d) => d.id === provincia.departamentoId);
  return departamento?.nombre ?? "—";
}

function resolveUltimaCampana(
  store: HydroVisionDataStore,
  estacionId: string,
  rioId: string
): string | null {
  const campanasRio = store.campanas
    .filter((c) => c.rioId === rioId)
    .sort((a, b) => b.fechaFin.localeCompare(a.fechaFin));

  const campanaConMuestra = campanasRio.find((campana) =>
    store.muestras.some((m) => m.estacionId === estacionId && m.campanaId === campana.id)
  );

  if (campanaConMuestra) return campanaConMuestra.fechaFin;

  const ultimaMuestra = store.muestras
    .filter((m) => m.estacionId === estacionId)
    .sort((a, b) => b.fechaMuestreo.localeCompare(a.fechaMuestreo))[0];

  return ultimaMuestra?.fechaMuestreo.slice(0, 10) ?? campanasRio[0]?.fechaFin ?? null;
}

function mapEstadoOperativo(
  estado: HydroVisionDataStore["estaciones"][0]["estadoOperativo"]
): MonitoringStationRecord["estado"] {
  return estado as MonitoringStationRecord["estado"];
}

function mapClasificacionEca(estacionId: string, store: HydroVisionDataStore): ComplianceStatus {
  const clasificacion = store.clasificaciones.find((c) => c.estacionId === estacionId);
  if (!clasificacion) return "compliant";
  return clasificacion.estado as ComplianceStatus;
}

function mapStoreStation(
  estacion: HydroVisionDataStore["estaciones"][0],
  store: HydroVisionDataStore
): MonitoringStationRecord {
  const rio = store.rios.find((r) => r.id === estacion.rioId);
  const cuenca = store.cuencas.find((c) => c.id === estacion.cuencaId);
  const medicionesCount = store.muestras.filter((m) => m.estacionId === estacion.id).length;

  return {
    id: estacion.id,
    codigo: estacion.codigo,
    nombre: estacion.nombre,
    rioId: estacion.rioId,
    rioNombre: rio?.nombre ?? "—",
    cuencaId: estacion.cuencaId,
    cuencaNombre: cuenca?.nombre ?? "—",
    departamentoNombre: resolveDepartamentoNombre(store, estacion.cuencaId),
    latitud: estacion.coordenadas.latitude,
    longitud: estacion.coordenadas.longitude,
    altitud: estacion.altitud,
    tramo: estacion.tramo,
    estado: mapEstadoOperativo(estacion.estadoOperativo),
    fechaUltimaCampana: resolveUltimaCampana(store, estacion.id, estacion.rioId),
    clasificacionEca: mapClasificacionEca(estacion.id, store),
    cantidadMediciones: medicionesCount,
    descripcion: estacion.descripcion,
    fechaInstalacion: estacion.fechaInstalacion,
    ultimaActualizacion: estacion.ultimaActualizacion,
    isSimulated: true,
  };
}

/** Construye el listado completo de estaciones enriquecidas para el módulo de gestión */
export function getMockStations(): MonitoringStationRecord[] {
  const store = getDataStore();
  const fromStore = store.estaciones.map((estacion) => mapStoreStation(estacion, store));
  const extras = Array.from(customStations.values());
  const merged = [...fromStore, ...extras].map((station) => ({
    ...station,
    ...stationOverlay.get(station.id),
  }));
  return filterActive(ENTITY, merged);
}

export function getMockStationById(stationId: string): MonitoringStationRecord | null {
  return getMockStations().find((s) => s.id === stationId) ?? null;
}

export function getMockStationFilterOptions() {
  const stations = getMockStations();
  const cuencas = Array.from(
    new Map(stations.map((s) => [s.cuencaId, { value: s.cuencaId, label: s.cuencaNombre }])).values()
  );
  const rios = Array.from(
    new Map(stations.map((s) => [s.rioId, { value: s.rioId, label: s.rioNombre }])).values()
  );
  return { cuencas, rios };
}

export function createMockStation(input: CreateStationInput): MonitoringStationRecord {
  const store = getDataStore();
  const rio = store.rios.find((r) => r.id === input.rioId);
  const cuenca = store.cuencas.find((c) => c.id === input.cuencaId);
  const id = `station-${Date.now()}`;
  const now = MOCK_LAST_UPDATE.slice(0, 10);

  const record: MonitoringStationRecord = {
    id,
    codigo: input.codigo,
    nombre: input.nombre,
    rioId: input.rioId,
    rioNombre: rio?.nombre ?? "—",
    cuencaId: input.cuencaId,
    cuencaNombre: cuenca?.nombre ?? "—",
    departamentoNombre: resolveDepartamentoNombre(store, input.cuencaId),
    latitud: input.latitud,
    longitud: input.longitud,
    altitud: input.altitud,
    tramo: input.tramo,
    estado: input.estado ?? "active",
    fechaUltimaCampana: null,
    clasificacionEca: "compliant",
    cantidadMediciones: 0,
    descripcion: input.descripcion ?? "",
    fechaInstalacion: now,
    ultimaActualizacion: MOCK_LAST_UPDATE,
    isSimulated: true,
  };

  customStations.set(id, record);
  return record;
}

export function updateMockStation(
  id: string,
  input: Partial<CreateStationInput>
): MonitoringStationRecord | null {
  const current = getMockStationById(id);
  if (!current) return null;

  const store = getDataStore();
  const rio = input.rioId ? store.rios.find((r) => r.id === input.rioId) : null;
  const cuenca = input.cuencaId ? store.cuencas.find((c) => c.id === input.cuencaId) : null;

  const next: MonitoringStationRecord = {
    ...current,
    ...input,
    rioNombre: rio?.nombre ?? current.rioNombre,
    cuencaNombre: cuenca?.nombre ?? current.cuencaNombre,
    departamentoNombre: input.cuencaId
      ? resolveDepartamentoNombre(store, input.cuencaId)
      : current.departamentoNombre,
    ultimaActualizacion: MOCK_LAST_UPDATE,
  };

  if (customStations.has(id)) {
    customStations.set(id, next);
  } else {
    stationOverlay.set(id, next);
  }
  return next;
}

export function softDeleteMockStation(id: string): boolean {
  if (!getMockStationById(id)) return false;
  markSoftDeleted(ENTITY, id);
  return true;
}

export function mockStationCodigoExists(codigo: string, excludeId?: string): boolean {
  return getMockStations().some((s) => s.codigo === codigo && s.id !== excludeId);
}
