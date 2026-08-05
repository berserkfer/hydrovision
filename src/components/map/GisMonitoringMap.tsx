"use client";

import { useMemo, useState } from "react";
import { MapContainer, Marker, Popup, ScaleControl, TileLayer } from "react-leaflet";
import type { MapCenter } from "@/types/geography";
import type { GeoRiver } from "@/types/geography";
import type { StationSummary } from "@/types";
import type { ManagedLayer } from "@/types/layers";
import { LAYER_IDS } from "@/types/layers";
import type { LayerManager } from "@/services/layers";
import { MAP_TILE_ATTRIBUTION, MAP_TILE_URL } from "@/components/map/map-config";
import { MapLegend } from "@/components/map/MapLegend";
import { MapRecenter } from "@/components/map/MapRecenter";
import { StationPopupContent } from "@/components/map/StationPopupContent";
import { createStationIcon } from "@/components/map/station-icon";
import { LayerManagerPanel } from "@/components/map/layers/LayerManagerPanel";
import { MapLayerOverlays } from "@/components/map/layers/MapLayerOverlays";
import { MapCursorTracker, MiniMapPlugin } from "@/components/map/layers/MapGisControls";

import "leaflet/dist/leaflet.css";

interface GisMonitoringMapProps {
  summaries: StationSummary[];
  mapView: MapCenter;
  recenterToken: number;
  riverName: string;
  riverKey: string;
  river: GeoRiver;
  layers: ManagedLayer[];
  layerManager: LayerManager;
  onToggleLayer: (layerId: string) => void;
  onLayerOpacityChange: (layerId: string, opacity: number) => void;
  onResetLayers: () => void;
  onRecenter?: () => void;
  selectedStationId?: string | null;
  onStationSelect?: (stationId: string) => void;
}

export function GisMonitoringMap({
  summaries,
  mapView,
  recenterToken,
  riverName,
  riverKey,
  river,
  layers,
  layerManager,
  onToggleLayer,
  onLayerOpacityChange,
  onResetLayers,
  onRecenter,
  selectedStationId,
  onStationSelect,
}: GisMonitoringMapProps) {
  const center: [number, number] = [mapView.latitude, mapView.longitude];
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);

  const stationsVisible = layers.find((l) => l.id === LAYER_IDS.STATIONS)?.visible ?? true;
  const stationsOpacity = layers.find((l) => l.id === LAYER_IDS.STATIONS)?.opacity ?? 1;

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
      className="hv-animate-fade-in relative h-[32rem] w-full overflow-hidden rounded-lg border border-slate-200 shadow-inner"
    >
      <MapContainer
        center={center}
        zoom={mapView.zoom}
        scrollWheelZoom
        zoomControl
        className="h-full w-full"
        aria-label={`Mapa GIS del ${riverName}`}
      >
        <TileLayer attribution={MAP_TILE_ATTRIBUTION} url={MAP_TILE_URL} />

        <MapRecenter
          latitude={mapView.latitude}
          longitude={mapView.longitude}
          zoom={mapView.zoom}
          recenterToken={recenterToken}
        />

        <MapCursorTracker onCoordsChange={setCursorCoords} />
        <MiniMapPlugin mainZoom={mapView.zoom} />

        <MapLayerOverlays
          layers={layers}
          manager={layerManager}
          river={river}
          center={mapView}
          summaries={summaries}
        />

        {stationsVisible &&
          markers.map(({ summary, icon, position }) => (
            <Marker
              key={summary.station.id}
              position={position}
              icon={icon}
              opacity={
                (selectedStationId && selectedStationId !== summary.station.id
                  ? 0.65
                  : 1) * stationsOpacity
              }
              eventHandlers={{
                click: () => onStationSelect?.(summary.station.id),
              }}
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

      <LayerManagerPanel
        layers={layers}
        onToggle={onToggleLayer}
        onOpacityChange={onLayerOpacityChange}
        onReset={onResetLayers}
        className="absolute left-3 top-3 z-[1000]"
      />

      <div
        className="absolute bottom-3 left-16 z-[1000] rounded-md border border-slate-200 bg-white/95 px-2.5 py-1.5 font-mono text-[10px] text-slate-600 shadow-md backdrop-blur-sm"
        aria-live="polite"
      >
        {cursorCoords ? (
          <>
            <span className="text-slate-400">Lat </span>
            {cursorCoords.lat.toFixed(5)}
            <span className="mx-1.5 text-slate-300">|</span>
            <span className="text-slate-400">Lng </span>
            {cursorCoords.lng.toFixed(5)}
          </>
        ) : (
          <span className="text-slate-400">Mueva el cursor sobre el mapa</span>
        )}
      </div>

      <div className="absolute bottom-3 right-3 z-[1000] flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={onRecenter}
          className="rounded-md border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-md backdrop-blur-sm transition-colors hover:bg-slate-50"
        >
          Restablecer vista
        </button>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md">
          <div id="hv-minimap-container" className="h-20 w-28" aria-label="Minimapa" />
          <p className="bg-slate-50 px-2 py-0.5 text-[9px] font-semibold uppercase text-slate-400">
            Minimapa
          </p>
        </div>
      </div>

      {stationsVisible && (
        <MapLegend className="pointer-events-none absolute bottom-14 right-3 z-[1000]" />
      )}
    </div>
  );
}
