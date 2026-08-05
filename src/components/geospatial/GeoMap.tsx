"use client";

import { useMemo } from "react";
import {
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  Popup,
  Rectangle,
  ScaleControl,
  TileLayer,
} from "react-leaflet";
import { MAP_TILE_ATTRIBUTION, MAP_TILE_URL } from "@/components/map/map-config";
import { MapRecenter } from "@/components/map/MapRecenter";
import { createGeoStationIcon } from "@/components/geospatial/geo-station-icon";
import { StationPopup } from "@/components/geospatial/StationPopup";
import type {
  GeoLayerState,
  GeospatialMapData,
} from "@/types/geospatial-center";

import "leaflet/dist/leaflet.css";

interface GeoMapProps {
  mapData: GeospatialMapData;
  layers: GeoLayerState[];
  selectedStationId: string | null;
  recenterToken: number;
  onStationSelect: (domainId: string) => void;
  className?: string;
}

export function GeoMap({
  mapData,
  layers,
  selectedStationId,
  recenterToken,
  onStationSelect,
  className = "",
}: GeoMapProps) {
  const center: [number, number] = [mapData.center.lat, mapData.center.lng];

  const layerVisibility = useMemo(
    () => Object.fromEntries(layers.map((l) => [l.id, l.visible])) as Record<string, boolean>,
    [layers]
  );

  const markers = useMemo(
    () =>
      mapData.stations.map((station) => ({
        station,
        icon: createGeoStationIcon(station.status),
        position: [station.lat, station.lng] as [number, number],
      })),
    [mapData.stations]
  );

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-slate-200 shadow-inner ${className}`}
    >
      <MapContainer
        center={center}
        zoom={mapData.center.zoom}
        scrollWheelZoom
        zoomControl
        className="h-full min-h-[28rem] w-full"
        aria-label="Centro Geoespacial HydroVision"
      >
        <TileLayer attribution={MAP_TILE_ATTRIBUTION} url={MAP_TILE_URL} />
        <ScaleControl imperial={false} />

        <MapRecenter
          latitude={mapData.center.lat}
          longitude={mapData.center.lng}
          zoom={mapData.center.zoom}
          recenterToken={recenterToken}
        />

        {layerVisibility.watersheds &&
          mapData.watersheds.map((polygon) => (
            <Polygon
              key={polygon.id}
              positions={polygon.coordinates}
              pathOptions={{
                color: polygon.color,
                weight: 2,
                fillColor: polygon.color,
                fillOpacity: 0.08,
                dashArray: "6 4",
              }}
            />
          ))}

        {layerVisibility.rivers &&
          mapData.rivers.map((river) => (
            <Polyline
              key={river.id}
              positions={river.coordinates}
              pathOptions={{ color: river.color, weight: 4, opacity: 0.85 }}
            />
          ))}

        {layerVisibility.environmentalRisk &&
          mapData.riskOverlays.map((overlay) => (
            <Rectangle
              key={`risk-${overlay.id}`}
              bounds={[overlay.southWest, overlay.northEast]}
              pathOptions={{
                color: overlay.color,
                weight: 1,
                fillColor: overlay.color,
                fillOpacity: overlay.opacity,
              }}
            />
          ))}

        {layerVisibility.satelliteIndices &&
          mapData.satelliteOverlays.map((overlay) => (
            <Rectangle
              key={`sat-${overlay.id}`}
              bounds={[overlay.southWest, overlay.northEast]}
              pathOptions={{
                color: "#059669",
                weight: 1,
                fillColor: overlay.color,
                fillOpacity: overlay.opacity,
                dashArray: "4 6",
              }}
            />
          ))}

        {layerVisibility.stations &&
          markers.map(({ station, icon, position }) => (
            <Marker
              key={station.domainId}
              position={position}
              icon={icon}
              opacity={
                selectedStationId && selectedStationId !== station.domainId ? 0.65 : 1
              }
              eventHandlers={{
                click: () => onStationSelect(station.domainId),
              }}
            >
              <Popup>
                <StationPopup station={station} />
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
