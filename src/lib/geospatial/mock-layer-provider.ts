/**
 * Mock layer provider — Sprint 2H
 */

import { getDataStore } from "@/data/store-access";
import { buildLegacyStationSummary } from "@/lib/adapters/legacy-adapter";
import { getComplianceLabel } from "@/lib/eca/classifier";
import { resolveNombre } from "@/utils";
import type { IGeospatialLayerProvider } from "@/lib/geospatial/layer-provider.interface";
import type {
  GeospatialFilters,
  GeospatialFilterOptions,
  GeospatialMapData,
  GeoPolygonLayer,
  GeoPolylineLayer,
  GeoRasterOverlay,
  GeoStationDetail,
  GeoStationMarker,
  GeoStationStatus,
} from "@/types/geospatial-center";
import type { ComplianceStatus } from "@/types";

function resolveDepartamentoId(cuencaId: string): string {
  const store = getDataStore();
  const cuenca = store.cuencas.find((c) => c.id === cuencaId);
  if (!cuenca) return "";
  const distrito = store.distritos.find((d) => d.id === cuenca.distritoId);
  if (!distrito) return "";
  const provincia = store.provincias.find((p) => p.id === distrito.provinciaId);
  return provincia?.departamentoId ?? "";
}

function resolveDepartamentoNombre(cuencaId: string): string {
  const store = getDataStore();
  const deptId = resolveDepartamentoId(cuencaId);
  return store.departamentos.find((d) => d.id === deptId)?.nombre ?? "—";
}

function mapComplianceToGeoStatus(
  status: ComplianceStatus | "unknown",
  offline: boolean
): GeoStationStatus {
  if (offline) return "unknown";
  if (status === "compliant") return "good";
  if (status === "alert") return "alert";
  if (status === "non_compliant") return "critical";
  return "unknown";
}

function buildAllMarkers(): GeoStationMarker[] {
  const store = getDataStore();
  return store.estaciones.map((estacion) => {
    const summary = buildLegacyStationSummary(estacion);
    const offline = estacion.estadoOperativo === "offline";
    const complianceStatus = offline ? "unknown" : summary.compliance.status;

    return {
      id: estacion.codigo,
      domainId: estacion.id,
      codigo: estacion.codigo,
      nombre: estacion.nombre,
      lat: estacion.coordenadas.latitude,
      lng: estacion.coordenadas.longitude,
      status: mapComplianceToGeoStatus(complianceStatus, offline),
      complianceStatus,
      rioId: estacion.rioId,
      rioNombre: resolveNombre(estacion.rioId, store.rios),
      cuencaId: estacion.cuencaId,
      cuencaNombre: resolveNombre(estacion.cuencaId, store.cuencas),
      departamentoId: resolveDepartamentoId(estacion.cuencaId),
      departamentoNombre: resolveDepartamentoNombre(estacion.cuencaId),
      estadoOperativo: estacion.estadoOperativo,
    };
  });
}

function applyFilters(markers: GeoStationMarker[], filters: GeospatialFilters): GeoStationMarker[] {
  return markers.filter((m) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !m.codigo.toLowerCase().includes(q) &&
        !m.nombre.toLowerCase().includes(q) &&
        !m.rioNombre.toLowerCase().includes(q) &&
        !m.cuencaNombre.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (filters.departamentoId && m.departamentoId !== filters.departamentoId) return false;
    if (filters.cuencaId && m.cuencaId !== filters.cuencaId) return false;
    if (filters.rioId && m.rioId !== filters.rioId) return false;
    if (filters.estado && m.status !== filters.estado) return false;
    return true;
  });
}

function buildRiverLayers(stations: GeoStationMarker[]): GeoPolylineLayer[] {
  const byRiver = new Map<string, GeoStationMarker[]>();
  stations.forEach((s) => {
    const list = byRiver.get(s.rioId) ?? [];
    list.push(s);
    byRiver.set(s.rioId, list);
  });

  return Array.from(byRiver.entries()).map(([rioId, riverStations]) => ({
    id: `river-${rioId}`,
    rioId,
    coordinates: riverStations
      .sort((a, b) => a.lat - b.lat)
      .map((s) => [s.lat, s.lng] as [number, number]),
    color: "#0891b2",
  }));
}

function buildWatershedLayers(stations: GeoStationMarker[]): GeoPolygonLayer[] {
  const cuencaIds = [...new Set(stations.map((s) => s.cuencaId))];
  const store = getDataStore();

  return cuencaIds.map((cuencaId) => {
    const cuencaStations = stations.filter((s) => s.cuencaId === cuencaId);
    const lats = cuencaStations.map((s) => s.lat);
    const lngs = cuencaStations.map((s) => s.lng);
    const minLat = Math.min(...lats) - 0.04;
    const maxLat = Math.max(...lats) + 0.04;
    const minLng = Math.min(...lngs) - 0.05;
    const maxLng = Math.max(...lngs) + 0.05;
    const cuenca = store.cuencas.find((c) => c.id === cuencaId);

    return {
      id: `cuenca-${cuencaId}`,
      cuencaId,
      coordinates: [
        [minLat, minLng],
        [minLat, maxLng],
        [maxLat, maxLng],
        [maxLat, minLng],
      ],
      color: cuenca ? "#6366f1" : "#818cf8",
    };
  });
}

function buildRasterOverlays(
  stations: GeoStationMarker[],
  layerId: GeoRasterOverlay["id"]
): GeoRasterOverlay[] {
  if (stations.length === 0) return [];
  const lats = stations.map((s) => s.lat);
  const lngs = stations.map((s) => s.lng);
  const pad = 0.06;

  return [
    {
      id: layerId,
      southWest: [Math.min(...lats) - pad, Math.min(...lngs) - pad],
      northEast: [Math.max(...lats) + pad, Math.max(...lngs) + pad],
      opacity: layerId === "environmentalRisk" ? 0.25 : 0.2,
      color: layerId === "environmentalRisk" ? "#ef4444" : "#10b981",
    },
  ];
}

function computeCenter(stations: GeoStationMarker[]) {
  if (stations.length === 0) {
    return { lat: -6.7017, lng: -79.9068, zoom: 10 };
  }
  const lat = stations.reduce((s, m) => s + m.lat, 0) / stations.length;
  const lng = stations.reduce((s, m) => s + m.lng, 0) / stations.length;
  return { lat, lng, zoom: stations.length <= 4 ? 11 : 10 };
}

export class MockGeospatialLayerProvider implements IGeospatialLayerProvider {
  readonly providerId = "mock";
  readonly isGeeEnabled = false;

  getFilterOptions(): GeospatialFilterOptions {
    const store = getDataStore();
    return {
      departamentos: store.departamentos.map((d) => ({ value: d.id, label: d.nombre })),
      cuencas: store.cuencas.map((c) => ({ value: c.id, label: c.nombre })),
      rios: store.rios.map((r) => ({ value: r.id, label: r.nombre })),
      estados: [
        { value: "good", label: "Buena" },
        { value: "alert", label: "Alerta" },
        { value: "critical", label: "Crítica" },
        { value: "unknown", label: "Sin información" },
      ],
    };
  }

  getMapData(filters: GeospatialFilters): GeospatialMapData {
    const all = buildAllMarkers();
    const stations = applyFilters(all, filters);

    return {
      stations,
      rivers: buildRiverLayers(stations),
      watersheds: buildWatershedLayers(stations),
      riskOverlays: buildRasterOverlays(stations, "environmentalRisk"),
      satelliteOverlays: buildRasterOverlays(stations, "satelliteIndices"),
      center: computeCenter(stations),
    };
  }

  getStationDetail(stationDomainId: string): GeoStationDetail | null {
    const store = getDataStore();
    const estacion = store.estaciones.find((e) => e.id === stationDomainId);
    if (!estacion) return null;

    const summary = buildLegacyStationSummary(estacion);
    const campana = store.campanas.find((c) => c.rioId === estacion.rioId);
    const indices = store.indicesSatelitales.find((i) => i.estacionId === estacion.id);
    const mediciones = store.muestras.filter((m) => m.estacionId === estacion.id).length;
    const m = summary.latestMeasurement;
    const offline = estacion.estadoOperativo === "offline";

    return {
      id: estacion.id,
      codigo: estacion.codigo,
      nombre: estacion.nombre,
      cuenca: resolveNombre(estacion.cuencaId, store.cuencas),
      rio: resolveNombre(estacion.rioId, store.rios),
      coordenadas: `${estacion.coordenadas.latitude}, ${estacion.coordenadas.longitude}`,
      ultimaCampana: campana?.nombre ?? "—",
      cantidadMediciones: mediciones,
      estadoAmbiental: offline
        ? "Sin información"
        : getComplianceLabel(summary.compliance.status),
      indiceSatelital: indices
        ? `NDVI ${indices.ndvi.toFixed(3)} · NDWI ${indices.ndwi.toFixed(3)}`
        : "NDVI 0.350 · NDWI 0.120 (simulado)",
      parametros: [
        { label: "pH", value: String(m.ph), unit: "—" },
        { label: "Oxígeno disuelto", value: String(m.dissolvedOxygen), unit: "mg/L" },
        { label: "Turbidez", value: String(m.turbidity), unit: "NTU" },
        { label: "Conductividad", value: String(m.conductivity), unit: "µS/cm" },
        { label: "Temperatura", value: String(m.temperature), unit: "°C" },
      ],
      complianceStatus: offline ? "unknown" : summary.compliance.status,
    };
  }
}

export const mockGeospatialLayerProvider = new MockGeospatialLayerProvider();
