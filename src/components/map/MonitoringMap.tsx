"use client";

import { useMemo } from "react";
import { MapContainer, Marker, Popup, ScaleControl, TileLayer } from "react-leaflet";
import type { StationSummary } from "@/types";
import {
  DEFAULT_MAP_ZOOM,
  LAMBAYEQUE_CENTER,
  MAP_TILE_ATTRIBUTION,
  MAP_TILE_URL,
} from "./map-config";
import { MapLegend } from "./MapLegend";
import { StationPopupContent } from "./StationPopupContent";
import { createStationIcon } from "./station-icon";

import "leaflet/dist/leaflet.css";

interface MonitoringMapProps {
  summaries: StationSummary[];
}

/**
 * Mapa interactivo Leaflet con estaciones P1–P6 del río Reque.
 * Renderizado solo en cliente (importado vía dynamic con ssr: false).
 */
export function MonitoringMap({ summaries }: MonitoringMapProps) {
  const center: [number, number] = [LAMBAYEQUE_CENTER.latitude, LAMBAYEQUE_CENTER.longitude];

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
    <div className="relative h-72 w-full overflow-hidden rounded-lg border border-slate-200">
      <MapContainer
        center={center}
        zoom={DEFAULT_MAP_ZOOM}
        scrollWheelZoom
        zoomControl
        className="h-full w-full"
        aria-label="Mapa de estaciones de monitoreo del río Reque"
      >
        <TileLayer attribution={MAP_TILE_ATTRIBUTION} url={MAP_TILE_URL} />

        {markers.map(({ summary, icon, position }) => (
          <Marker key={summary.station.id} position={position} icon={icon}>
            <Popup>
              <StationPopupContent summary={summary} />
            </Popup>
          </Marker>
        ))}

        {/* Escala métrica en esquina inferior izquierda */}
        <ScaleControl position="bottomleft" imperial={false} />
      </MapContainer>

      {/* Leyenda ECA superpuesta — esquina inferior derecha */}
      <MapLegend className="pointer-events-none absolute bottom-3 right-3 z-[1000]" />
    </div>
  );
}
