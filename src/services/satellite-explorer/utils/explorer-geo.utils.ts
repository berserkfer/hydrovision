/**
 * Resuelve viewport del explorador según filtros geográficos
 */

import { ALL_STATIONS_VALUE } from "@/constants/filters";
import { GEOGRAPHIC_HIERARCHY } from "@/repositories/geography.repository";
import type { ExplorerMapViewport } from "../types/satellite-explorer.types";

export function resolveExplorerViewport(
  watershedId: string,
  riverId: string,
  stationId: string
): ExplorerMapViewport {
  for (const department of GEOGRAPHIC_HIERARCHY) {
    for (const province of department.provinces) {
      for (const district of province.districts) {
        for (const watershed of district.watersheds) {
          if (watershed.id !== watershedId) continue;

          const river = watershed.rivers.find((item) => item.id === riverId);
          if (!river) continue;

          if (stationId !== ALL_STATIONS_VALUE) {
            const station = river.stations.find((item) => item.id === stationId);
            if (station) {
              return {
                latitude: station.latitude,
                longitude: station.longitude,
                zoom: 14,
              };
            }
          }

          return {
            latitude: river.center.latitude,
            longitude: river.center.longitude,
            zoom: river.center.zoom ?? 12,
          };
        }
      }
    }
  }

  return { latitude: -6.7017, longitude: -79.9068, zoom: 12 };
}

export function getExplorerFilterOptions(
  watershedId: string,
  riverId: string
): {
  watersheds: Array<{ value: string; label: string }>;
  rivers: Array<{ value: string; label: string }>;
  stations: Array<{ value: string; label: string }>;
} {
  const watersheds: Array<{ value: string; label: string }> = [];
  const rivers: Array<{ value: string; label: string }> = [];
  const stations: Array<{ value: string; label: string }> = [
    { value: ALL_STATIONS_VALUE, label: "Todos los puntos" },
  ];
  const watershedSeen = new Set<string>();

  for (const department of GEOGRAPHIC_HIERARCHY) {
    for (const province of department.provinces) {
      for (const district of province.districts) {
        for (const watershed of district.watersheds) {
          if (!watershedSeen.has(watershed.id)) {
            watershedSeen.add(watershed.id);
            watersheds.push({ value: watershed.id, label: watershed.name });
          }

          if (watershed.id === watershedId) {
            for (const river of watershed.rivers) {
              if (!rivers.some((item) => item.value === river.id)) {
                rivers.push({ value: river.id, label: river.name });
              }

              if (river.id === riverId) {
                for (const station of river.stations) {
                  if (!stations.some((item) => item.value === station.id)) {
                    stations.push({ value: station.id, label: station.name });
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return { watersheds, rivers, stations };
}
