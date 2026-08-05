/**
 * Repositorio mock — Geografía y estaciones.
 */

import { ALL_STATIONS_VALUE } from "@/constants";
import { getDataStore } from "@/data/store-access";
import {
  buildLegacyGeographicHierarchy,
  buildLegacyStationSummary,
  rioToLegacyGeoRiver,
} from "@/lib/adapters/legacy-adapter";
import { buildStationDetail } from "@/lib/station/station-utils";
import type { StationDetail } from "@/types/station";
import type { GeoRiver, MapCenter, MapFilterState, RiverContext } from "@/types/geography";
import type { StationSummary } from "@/types";

export const GEOGRAPHIC_HIERARCHY = buildLegacyGeographicHierarchy();

export const DEFAULT_MAP_FILTERS: MapFilterState = {
  departmentId: "lambayeque",
  provinceId: "lambayeque-prov",
  districtId: "reque",
  watershedId: "cuenca-reque",
  riverId: "rio-reque",
  stationId: ALL_STATIONS_VALUE,
};

export function findRiverContext(filters: MapFilterState): RiverContext | null {
  const department = GEOGRAPHIC_HIERARCHY.find((d) => d.id === filters.departmentId);
  const province = department?.provinces.find((p) => p.id === filters.provinceId);
  const district = province?.districts.find((d) => d.id === filters.districtId);
  const watershed = district?.watersheds.find((w) => w.id === filters.watershedId);
  const river = watershed?.rivers.find((r) => r.id === filters.riverId);

  if (!department || !province || !district || !watershed || !river) return null;

  return {
    river,
    department,
    province,
    district,
    watershed,
    dashboardSubtitle: `${river.name} · ${district.name}, ${department.name}`,
    mapTitle: `Mapa del ${river.name}`,
  };
}

export function getSummariesForRiver(river: GeoRiver): StationSummary[] {
  return getDataStore().estaciones
    .filter((e) => e.rioId === river.id)
    .map(buildLegacyStationSummary);
}

export function getFilteredSummaries(river: GeoRiver, stationId: string): StationSummary[] {
  const all = getSummariesForRiver(river);
  if (stationId === ALL_STATIONS_VALUE) return all;
  return all.filter((s) => s.station.id === stationId);
}

export function resolveMapView(river: GeoRiver, stationId: string): MapCenter {
  if (stationId === ALL_STATIONS_VALUE) return river.center;
  const station = river.stations.find((s) => s.id === stationId);
  if (!station) return river.center;
  return { latitude: station.latitude, longitude: station.longitude, zoom: 14 };
}

export function getStationDetailById(
  river: GeoRiver,
  riverContext: RiverContext,
  stationId: string
): StationDetail | null {
  const index = river.stations.findIndex((s) => s.id === stationId);
  if (index === -1) return null;
  const summaries = getSummariesForRiver(river);
  const summary = summaries[index];
  if (!summary) return null;
  return buildStationDetail(summary, riverContext, index);
}

export function buildDashboardTitle(riverName: string): string {
  return `HydroVision — Monitoreo del ${riverName}`;
}

export function getDomainStore() {
  return getDataStore();
}

export function getRioById(rioId: string) {
  return getDataStore().rios.find((r) => r.id === rioId) ?? null;
}

export function getEstacionByCodigo(codigo: string, rioId?: string) {
  return getDataStore().estaciones.find(
    (e) => e.codigo === codigo && (!rioId || e.rioId === rioId)
  ) ?? null;
}

export { rioToLegacyGeoRiver };
