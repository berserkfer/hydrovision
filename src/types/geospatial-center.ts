import type { ComplianceStatus } from "@/types";

export type GeoStationStatus = "good" | "alert" | "critical" | "unknown";

export type GeoLayerId =
  | "stations"
  | "rivers"
  | "watersheds"
  | "environmentalRisk"
  | "satelliteIndices";

export interface GeoLayerState {
  id: GeoLayerId;
  label: string;
  visible: boolean;
  description: string;
  source: "mock" | "gee";
}

export const DEFAULT_GEO_LAYERS: GeoLayerState[] = [
  {
    id: "stations",
    label: "Estaciones",
    visible: true,
    description: "Puntos de monitoreo",
    source: "mock",
  },
  {
    id: "rivers",
    label: "Ríos",
    visible: true,
    description: "Red hidrográfica simulada",
    source: "mock",
  },
  {
    id: "watersheds",
    label: "Cuencas",
    visible: true,
    description: "Límites de cuenca simulados",
    source: "mock",
  },
  {
    id: "environmentalRisk",
    label: "Riesgo Ambiental",
    visible: false,
    description: "Capa raster de riesgo (simulada)",
    source: "mock",
  },
  {
    id: "satelliteIndices",
    label: "Índices Satelitales",
    visible: false,
    description: "NDVI/NDWI simulados — preparado para GEE",
    source: "mock",
  },
];

export interface GeospatialFilters {
  search: string;
  departamentoId: string;
  cuencaId: string;
  rioId: string;
  estado: string;
}

export const DEFAULT_GEOSPATIAL_FILTERS: GeospatialFilters = {
  search: "",
  departamentoId: "",
  cuencaId: "",
  rioId: "",
  estado: "",
};

export interface GeoStationMarker {
  id: string;
  domainId: string;
  codigo: string;
  nombre: string;
  lat: number;
  lng: number;
  status: GeoStationStatus;
  complianceStatus: ComplianceStatus | "unknown";
  rioId: string;
  rioNombre: string;
  cuencaId: string;
  cuencaNombre: string;
  departamentoId: string;
  departamentoNombre: string;
  estadoOperativo: string;
}

export interface GeoStationDetail {
  id: string;
  codigo: string;
  nombre: string;
  cuenca: string;
  rio: string;
  coordenadas: string;
  ultimaCampana: string;
  cantidadMediciones: number;
  estadoAmbiental: string;
  indiceSatelital: string;
  parametros: { label: string; value: string; unit: string }[];
  complianceStatus: ComplianceStatus | "unknown";
}

export interface GeoPolylineLayer {
  id: string;
  rioId: string;
  coordinates: [number, number][];
  color: string;
}

export interface GeoPolygonLayer {
  id: string;
  cuencaId: string;
  coordinates: [number, number][];
  color: string;
}

export interface GeoRasterOverlay {
  id: GeoLayerId;
  southWest: [number, number];
  northEast: [number, number];
  opacity: number;
  color: string;
}

export interface GeospatialMapData {
  stations: GeoStationMarker[];
  rivers: GeoPolylineLayer[];
  watersheds: GeoPolygonLayer[];
  riskOverlays: GeoRasterOverlay[];
  satelliteOverlays: GeoRasterOverlay[];
  center: { lat: number; lng: number; zoom: number };
}

export interface GeospatialFilterOptions {
  departamentos: { value: string; label: string }[];
  cuencas: { value: string; label: string }[];
  rios: { value: string; label: string }[];
  estados: { value: string; label: string }[];
}

export const GEO_STATUS_LABELS: Record<GeoStationStatus, string> = {
  good: "Buena",
  alert: "Alerta",
  critical: "Crítica",
  unknown: "Sin información",
};

export const GEO_STATUS_COLORS: Record<GeoStationStatus, string> = {
  good: "#10b981",
  alert: "#f59e0b",
  critical: "#ef4444",
  unknown: "#94a3b8",
};

export const GEO_LEGEND_ITEMS = [
  { status: "good" as const, emoji: "🟢", label: "Buena" },
  { status: "alert" as const, emoji: "🟡", label: "Alerta" },
  { status: "critical" as const, emoji: "🔴", label: "Crítica" },
  { status: "unknown" as const, emoji: "⚪", label: "Sin información" },
];
