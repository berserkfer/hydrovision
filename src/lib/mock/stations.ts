/**
 * Mock de estaciones de monitoreo — Sprint 2C
 * Deriva datos del almacén unificado sin conectar PostgreSQL.
 */

import { getDataStore } from "@/data/store-access";
import type { HydroVisionDataStore } from "@/models";
import type { MonitoringStationRecord } from "@/types/station-management";
import type { ComplianceStatus } from "@/types";

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

/** Construye el listado completo de estaciones enriquecidas para el módulo de gestión */
export function getMockStations(): MonitoringStationRecord[] {
  const store = getDataStore();

  return store.estaciones.map((estacion) => {
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
  });
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
