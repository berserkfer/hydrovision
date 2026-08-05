"use client";

import { MapContainer, Polygon, TileLayer } from "react-leaflet";
import { Crosshair, Minus, Plus } from "lucide-react";
import { MapRecenter } from "@/components/map/MapRecenter";
import { EXPLORER_BASEMAPS } from "@/services/satellite-explorer";
import type { ExplorerBasemapId, ExplorerMapViewport } from "@/services/satellite-explorer";
import { cn } from "@/lib/utils";

import "leaflet/dist/leaflet.css";

interface SatellitePreviewMapProps {
  viewport: ExplorerMapViewport;
  basemapId: ExplorerBasemapId;
  recenterToken: number;
  onBasemapChange: (basemapId: ExplorerBasemapId) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
}

export function SatellitePreviewMap({
  viewport,
  basemapId,
  recenterToken,
  onBasemapChange,
  onZoomIn,
  onZoomOut,
  onRecenter,
}: SatellitePreviewMapProps) {
  const basemap = EXPLORER_BASEMAPS.find((item) => item.id === basemapId) ?? EXPLORER_BASEMAPS[0];
  const center: [number, number] = [viewport.latitude, viewport.longitude];
  const delta = 0.04;
  const studyArea: [number, number][] = [
    [viewport.latitude - delta, viewport.longitude - delta],
    [viewport.latitude - delta, viewport.longitude + delta],
    [viewport.latitude + delta, viewport.longitude + delta],
    [viewport.latitude + delta, viewport.longitude - delta],
  ];

  return (
    <div className="relative h-[28rem] overflow-hidden rounded-xl border border-slate-200 shadow-inner">
      <MapContainer
        center={center}
        zoom={viewport.zoom}
        scrollWheelZoom
        className="h-full w-full"
        aria-label="Vista previa del área de estudio"
      >
        <TileLayer
          key={basemap.id}
          attribution={basemap.attribution}
          url={basemap.url}
        />
        <MapRecenter
          latitude={viewport.latitude}
          longitude={viewport.longitude}
          zoom={viewport.zoom}
          recenterToken={recenterToken}
        />
        <Polygon
          positions={studyArea}
          pathOptions={{
            color: "#0891b2",
            weight: 2,
            fillColor: "#06b6d4",
            fillOpacity: 0.12,
            dashArray: "6 4",
          }}
        />
      </MapContainer>

      <div className="pointer-events-none absolute inset-0 z-[500]">
        <div className="pointer-events-auto absolute left-3 top-3 rounded-lg border border-slate-200 bg-white/95 p-2 shadow-md backdrop-blur-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Área de estudio (simulada)
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-slate-700">
            {viewport.latitude.toFixed(4)}, {viewport.longitude.toFixed(4)}
          </p>
        </div>

        <div className="pointer-events-auto absolute right-3 top-3 flex flex-col gap-1">
          <button
            type="button"
            onClick={onZoomIn}
            className="rounded-md border border-slate-200 bg-white p-2 text-slate-700 shadow-md hover:bg-slate-50"
            aria-label="Acercar"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onZoomOut}
            className="rounded-md border border-slate-200 bg-white p-2 text-slate-700 shadow-md hover:bg-slate-50"
            aria-label="Alejar"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRecenter}
            className="rounded-md border border-slate-200 bg-white p-2 text-slate-700 shadow-md hover:bg-slate-50"
            aria-label="Centrar mapa"
          >
            <Crosshair className="h-4 w-4" />
          </button>
        </div>

        <div className="pointer-events-auto absolute bottom-3 left-3">
          <label className="sr-only" htmlFor="explorer-basemap">
            Mapa base
          </label>
          <select
            id="explorer-basemap"
            value={basemapId}
            onChange={(event) => onBasemapChange(event.target.value as ExplorerBasemapId)}
            className={cn(
              "rounded-md border border-slate-200 bg-white/95 px-3 py-2 text-xs font-medium text-slate-700",
              "shadow-md backdrop-blur-sm outline-none focus:border-cyan-500"
            )}
          >
            {EXPLORER_BASEMAPS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
