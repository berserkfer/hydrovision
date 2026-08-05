"use client";

import { useMemo } from "react";
import { MapContainer, Marker, Popup, ScaleControl, TileLayer } from "react-leaflet";
import type { MapCenter } from "@/types/geography";
import type { StationSummary } from "@/types";
import { MAP_TILE_ATTRIBUTION, MAP_TILE_URL } from "./map-config";
import { MapLegend } from "./MapLegend";
import { MapRecenter } from "./MapRecenter";
import { StationPopupContent } from "./StationPopupContent";
import { createStationIcon } from "./station-icon";

import "leaflet/dist/leaflet.css";

interface FilteredMonitoringMapProps {
  summaries: StationSummary[];
  mapView: MapCenter;
  recenterToken: number;
  riverName: string;
  riverKey: string;
  selectedStationId?: string | null;
  onStationSelect?: (stationId: string) => void;
}

/**
 * Mapa Leaflet con soporte de filtros geográficos (Fase 2.2).
 */
export function FilteredMonitoringMap({
  summaries,
  mapView,
  recenterToken,
  riverName,
  riverKey,
  selectedStationId,
  onStationSelect,
}: FilteredMonitoringMapProps) {
  const center: [number, number] = [mapView.latitude, mapView.longitude];

  const markers = useMemo(
    () =>
      summaries.map((summary) => ({
        summary,
        icon: createStationIcon(summary.compliance.status),
        position: [summary.station.latitude, summary.station.longitude] as [number, number],
      })),
    [summaries]
  );

  return (
    <div
      key={riverKey}
      className="hv-animate-fade-in relative h-72 w-full overflow-hidden rounded-lg border border-slate-200 shadow-inner transition-shadow duration-300 hover:shadow-md"
    >
      <MapContainer
        center={center}
        zoom={mapView.zoom}
        scrollWheelZoom
        zoomControl
        className="h-full w-full"
        aria-label={`Mapa de estaciones de monitoreo del ${riverName}`}
      >
        <TileLayer attribution={MAP_TILE_ATTRIBUTION} url={MAP_TILE_URL} />

        <MapRecenter
          latitude={mapView.latitude}
          longitude={mapView.longitude}
          zoom={mapView.zoom}
          recenterToken={recenterToken}
        />

        {markers.map(({ summary, icon, position }) => (
          <Marker
            key={summary.station.id}
            position={position}
            icon={icon}
            eventHandlers={{
              click: () => onStationSelect?.(summary.station.id),
            }}
            opacity={selectedStationId && selectedStationId !== summary.station.id ? 0.65 : 1}
          >
            <Popup>
              <StationPopupContent summary={summary} />
              {onStationSelect && (
                <button
                  type="button"
                  onClick={() => onStationSelect(summary.station.id)}
                  className="mt-2 w-full rounded-md bg-cyan-600 px-2 py-1 text-xs font-medium text-white hover:bg-cyan-700"
                >
                  Ver detalle completo
                </button>
              )}
            </Popup>
          </Marker>
        ))}

        <ScaleControl position="bottomleft" imperial={false} />
      </MapContainer>

      <MapLegend className="pointer-events-none absolute bottom-3 right-3 z-[1000]" />
    </div>
  );
}
