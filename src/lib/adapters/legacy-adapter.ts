/**
 * Adaptadores de compatibilidad — Modelo de dominio → Tipos legacy (UI).
 * Permite migrar la capa de datos sin modificar componentes existentes.
 */

import { EstadoECA, EstadoEstacion, FuenteSatelital } from "@/constants/enums";
import type {
  ClasificacionECA,
  Estacion,
  IndicesSatelitales,
  ParametrosFisicoquimicos,
  Rio,
} from "@/models";
import type {
  ComplianceResult,
  ComplianceStatus,
  FieldMeasurement,
  MonitoringStation,
  SatelliteIndices,
  StationSummary,
  WaterParameter,
} from "@/types";
import type { GeoDepartment, GeoRiver, GeoStation } from "@/types/geography";
import { classifyMeasurement } from "@/lib/eca/classifier";
import { getDataStore } from "@/data/store-access";

/** Mapeo EstadoECA (dominio) → ComplianceStatus (UI legacy) */
export function toComplianceStatus(estado: EstadoECA): ComplianceStatus {
  return estado as ComplianceStatus;
}

/** Mapeo EstadoEstacion → operationalStatus legacy */
export function toOperationalStatus(
  estado: EstadoEstacion
): GeoStation["operationalStatus"] {
  return estado as GeoStation["operationalStatus"];
}

/** FuenteSatelital → source legacy */
function toSatelliteSource(fuente: FuenteSatelital): SatelliteIndices["source"] {
  const map: Record<FuenteSatelital, SatelliteIndices["source"]> = {
    [FuenteSatelital.LANDSAT_8]: "landsat8",
    [FuenteSatelital.LANDSAT_9]: "landsat9",
    [FuenteSatelital.SENTINEL_2]: "sentinel2",
  };
  return map[fuente];
}

export function estacionToMonitoringStation(estacion: Estacion): MonitoringStation {
  return {
    id: estacion.codigo,
    name: estacion.nombre,
    latitude: estacion.coordenadas.latitude,
    longitude: estacion.coordenadas.longitude,
    riverSegment: estacion.tramo,
    description: estacion.descripcion,
  };
}

export function estacionToGeoStation(estacion: Estacion): GeoStation {
  return {
    id: estacion.codigo,
    name: estacion.nombre,
    latitude: estacion.coordenadas.latitude,
    longitude: estacion.coordenadas.longitude,
    riverSegment: estacion.tramo,
    description: estacion.descripcion,
    altitude: estacion.altitud,
    installedAt: estacion.fechaInstalacion,
    operationalStatus: toOperationalStatus(estacion.estadoOperativo),
  };
}

export function parametrosToFieldMeasurement(
  params: ParametrosFisicoquimicos,
  muestraFecha: string
): FieldMeasurement {
  return {
    id: params.id,
    stationId:
      getDataStore().estaciones.find((e) => e.id === params.estacionId)?.codigo ??
      params.estacionId,
    sampledAt: muestraFecha,
    ph: params.ph,
    turbidity: params.turbidez,
    conductivity: params.conductividad,
    dissolvedOxygen: params.oxigenoDisuelto,
    temperature: params.temperatura,
    bod5: params.dbo5,
    cod: params.dqo,
    coliforms: params.coliformes,
    isSimulated: true,
  };
}

export function indicesToLegacy(indices: IndicesSatelitales): SatelliteIndices {
  const codigo =
    getDataStore().estaciones.find((e) => e.id === indices.estacionId)?.codigo ??
    indices.estacionId;
  return {
    stationId: codigo,
    acquiredAt: indices.fechaAdquisicion,
    source: toSatelliteSource(indices.fuente),
    ndwi: indices.ndwi,
    ndvi: indices.ndvi,
    mndwi: indices.mndwi,
    ndti: indices.ndti,
    cloudCover: indices.coberturaNubosa,
    isSimulated: true,
  };
}

export function clasificacionToCompliance(clasificacion: ClasificacionECA): ComplianceResult {
  const mapParam = (p: string): WaterParameter => p as WaterParameter;
  return {
    status: toComplianceStatus(clasificacion.estado),
    violatedParameters: clasificacion.parametrosViolados.map(mapParam),
    alertParameters: clasificacion.parametrosEnAlerta.map(mapParam),
  };
}

/** Construye StationSummary legacy desde entidades de dominio */
export function buildLegacyStationSummary(estacion: Estacion): StationSummary {
  const muestra = getDataStore().muestras.find((m) => m.estacionId === estacion.id);
  const params = getDataStore().parametros.find((p) => p.estacionId === estacion.id);
  const clasificacion = getDataStore().clasificaciones.find((c) => c.estacionId === estacion.id);
  const indices = getDataStore().indicesSatelitales.find((i) => i.estacionId === estacion.id);

  const measurement =
    params && muestra
      ? parametrosToFieldMeasurement(params, muestra.fechaMuestreo)
      : parametrosToFieldMeasurement(
          getDataStore().parametros[0],
          getDataStore().muestras[0].fechaMuestreo
        );

  const compliance = clasificacion
    ? clasificacionToCompliance(clasificacion)
    : classifyMeasurement(measurement);

  return {
    station: estacionToMonitoringStation(estacion),
    latestMeasurement: measurement,
    compliance,
    latestIndices: indices ? indicesToLegacy(indices) : undefined,
  };
}

/** Construye jerarquía geográfica legacy para filtros del mapa */
export function buildLegacyGeographicHierarchy(): GeoDepartment[] {
  return getDataStore().departamentos.map((dept) => ({
    id: dept.id,
    name: dept.nombre,
    provinces: getDataStore().provincias
      .filter((p) => p.departamentoId === dept.id)
      .map((prov) => ({
        id: prov.id,
        name: prov.nombre,
        districts: getDataStore().distritos
          .filter((d) => d.provinciaId === prov.id)
          .map((dist) => ({
            id: dist.id,
            name: dist.nombre,
            watersheds: getDataStore().cuencas
              .filter((c) => c.distritoId === dist.id)
              .map((cuenca) => ({
                id: cuenca.id,
                name: cuenca.nombre,
                rivers: getDataStore().rios
                  .filter((r) => r.cuencaId === cuenca.id)
                  .map((rio) => rioToLegacyGeoRiver(rio)),
              })),
          })),
      })),
  }));
}

export function rioToLegacyGeoRiver(rio: Rio): GeoRiver {
  const estaciones = getDataStore().estaciones
    .filter((e) => e.rioId === rio.id)
    .map(estacionToGeoStation);

  return {
    id: rio.id,
    name: rio.nombre,
    center: rio.centro,
    stations: estaciones,
  };
}

export function getRequeMonitoringStations(): MonitoringStation[] {
  return getDataStore().estaciones
    .filter((e) => e.rioId === "rio-reque")
    .map(estacionToMonitoringStation);
}
