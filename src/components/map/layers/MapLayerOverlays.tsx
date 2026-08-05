"use client";

import { useEffect, useMemo, useState } from "react";
import { Circle, ImageOverlay, Polygon, Polyline } from "react-leaflet";
import type { LayerManager } from "@/services/layers";
import { generateSimulatedRasterDataUrl } from "@/services/layers";
import type { MapCenter } from "@/types/geography";
import type { GeoRiver } from "@/types/geography";
import type { ManagedLayer, RasterLayer, VectorLayer } from "@/types/layers";
import { LAYER_IDS } from "@/types/layers";
import type { StationSummary } from "@/types";
import { riskEngine } from "@/services/risk";

interface MapLayerOverlaysProps {
  layers: ManagedLayer[];
  manager: LayerManager;
  river: GeoRiver;
  center: MapCenter;
  summaries: StationSummary[];
}

const RISK_COLORS = {
  bajo: "#10b981",
  moderado: "#f59e0b",
  alto: "#f97316",
  muy_alto: "#ef4444",
};

function SimulatedRasterOverlay({
  layer,
  bounds,
}: {
  layer: RasterLayer;
  bounds: [[number, number], [number, number]];
}) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const dataUrl = generateSimulatedRasterDataUrl(
      layer.colorRamp[0],
      layer.colorRamp[1]
    );
    setUrl(dataUrl);
  }, [layer.colorRamp]);

  if (!url) return null;

  return <ImageOverlay url={url} bounds={bounds} opacity={layer.opacity} />;
}

export function MapLayerOverlays({
  layers,
  manager,
  river,
  center,
  summaries,
}: MapLayerOverlaysProps) {
  const vectorGeometries = useMemo(
    () => manager.getVectorGeometries({ river, center }),
    [manager, river, center]
  );

  const rasterBounds = useMemo(() => manager.getRasterBounds(center), [manager, center]);

  const visibleVectors = layers.filter(
    (l): l is VectorLayer => l.kind === "vector" && l.visible
  );
  const visibleRasters = layers.filter(
    (l): l is RasterLayer => l.kind === "raster" && l.visible
  );

  const riskVisible = layers.some(
    (l) => l.id === LAYER_IDS.ENVIRONMENTAL_RISK && l.visible
  );
  const riskOpacity =
    layers.find((l) => l.id === LAYER_IDS.ENVIRONMENTAL_RISK)?.opacity ?? 0.45;

  const stationRisks = useMemo(() => {
    if (!riskVisible) return [];
    return summaries.map((summary) => {
      const assessment = riskEngine.evaluateStation(summary);
      return {
        summary,
        level: assessment.level,
        position: [summary.station.latitude, summary.station.longitude] as [number, number],
      };
    });
  }, [summaries, riskVisible]);

  return (
    <>
      {visibleVectors.map((layer) => {
        const geometry = vectorGeometries.find((g) => g.layerId === layer.id);
        if (!geometry) return null;

        const coords = geometry.coordinates as [number, number][];

        if (layer.geometryType === "polyline") {
          return (
            <Polyline
              key={layer.id}
              positions={coords}
              pathOptions={{
                color: layer.strokeColor,
                weight: 3,
                opacity: layer.opacity,
              }}
            />
          );
        }

        return (
          <Polygon
            key={layer.id}
            positions={coords}
            pathOptions={{
              color: layer.strokeColor,
              fillColor: layer.fillColor,
              fillOpacity: layer.opacity,
              weight: 2,
              opacity: Math.min(1, layer.opacity + 0.3),
            }}
          />
        );
      })}

      {visibleRasters
        .filter((l) => l.id !== LAYER_IDS.ENVIRONMENTAL_RISK)
        .map((layer) => {
          const bounds = rasterBounds.find((b) => b.layerId === layer.id);
          if (!bounds) return null;
          const leafletBounds: [[number, number], [number, number]] = [
            bounds.southWest,
            bounds.northEast,
          ];
          return (
            <SimulatedRasterOverlay
              key={layer.id}
              layer={layer}
              bounds={leafletBounds}
            />
          );
        })}

      {riskVisible &&
        stationRisks.map(({ summary, level, position }) => (
          <Circle
            key={`risk-${summary.station.id}`}
            center={position}
            radius={800}
            pathOptions={{
              color: RISK_COLORS[level],
              fillColor: RISK_COLORS[level],
              fillOpacity: riskOpacity,
              weight: 1,
              opacity: riskOpacity + 0.2,
            }}
          />
        ))}
    </>
  );
}
