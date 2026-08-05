/** Tipos geográficos para filtros del mapa (Fase 2.2) */

export interface MapCenter {
  latitude: number;
  longitude: number;
  zoom: number;
}

export interface GeoStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  riverSegment: string;
  description: string;
  /** Metadatos Fase 2.3 */
  altitude: number;
  installedAt: string;
  operationalStatus: "active" | "maintenance" | "offline";
}

export interface GeoRiver {
  id: string;
  name: string;
  center: MapCenter;
  stations: GeoStation[];
}

export interface GeoWatershed {
  id: string;
  name: string;
  rivers: GeoRiver[];
}

export interface GeoDistrict {
  id: string;
  name: string;
  watersheds: GeoWatershed[];
}

export interface GeoProvince {
  id: string;
  name: string;
  districts: GeoDistrict[];
}

export interface GeoDepartment {
  id: string;
  name: string;
  provinces: GeoProvince[];
}

/** Valor especial para mostrar todas las estaciones del río seleccionado */
export const ALL_STATIONS_VALUE = "all" as const;

export type MapFilterField =
  | "departmentId"
  | "provinceId"
  | "districtId"
  | "watershedId"
  | "riverId"
  | "stationId";

export interface MapFilterState {
  departmentId: string;
  provinceId: string;
  districtId: string;
  watershedId: string;
  riverId: string;
  /** ID de estación o ALL_STATIONS_VALUE */
  stationId: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface RiverContext {
  river: GeoRiver;
  department: GeoDepartment;
  province: GeoProvince;
  district: GeoDistrict;
  watershed: GeoWatershed;
  dashboardSubtitle: string;
  mapTitle: string;
}
