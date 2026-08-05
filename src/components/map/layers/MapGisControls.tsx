"use client";

import { useEffect, useRef } from "react";
import { useMap, useMapEvents } from "react-leaflet";

interface MapCursorTrackerProps {
  onCoordsChange: (coords: { lat: number; lng: number } | null) => void;
}

export function MapCursorTracker({ onCoordsChange }: MapCursorTrackerProps) {
  useMapEvents({
    mousemove(e) {
      onCoordsChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
    mouseout() {
      onCoordsChange(null);
    },
  });

  return null;
}

interface MiniMapPluginProps {
  mainZoom: number;
}

type LeafletContainer = HTMLElement & { _leaflet_id?: number };

function resetMiniMapContainer(container: LeafletContainer): void {
  container.replaceChildren();
  delete container._leaflet_id;
}

export function MiniMapPlugin({ mainZoom }: MiniMapPluginProps) {
  const map = useMap();
  const miniMapRef = useRef<L.Map | null>(null);
  const syncRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    void import("leaflet").then((L) => {
      if (cancelled) return;

      const container = document.getElementById("hv-minimap-container") as LeafletContainer | null;
      if (!container) return;

      if (miniMapRef.current) {
        miniMapRef.current.remove();
        miniMapRef.current = null;
      }

      resetMiniMapContainer(container);

      const mini = L.map(container, {
        center: map.getCenter(),
        zoom: Math.max(mainZoom - 4, 4),
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
      });

      miniMapRef.current = mini;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mini);

      const rect = L.rectangle(map.getBounds(), {
        color: "#0891b2",
        weight: 2,
        fillOpacity: 0.12,
      }).addTo(mini);

      const sync = () => {
        rect.setBounds(map.getBounds());
        mini.setView(map.getCenter(), Math.max(map.getZoom() - 4, 4));
      };

      syncRef.current = sync;
      map.on("moveend", sync);
      map.on("zoomend", sync);
      sync();
    });

    return () => {
      cancelled = true;

      if (syncRef.current) {
        map.off("moveend", syncRef.current);
        map.off("zoomend", syncRef.current);
        syncRef.current = null;
      }

      if (miniMapRef.current) {
        miniMapRef.current.remove();
        miniMapRef.current = null;
      }

      const container = document.getElementById("hv-minimap-container") as LeafletContainer | null;
      if (container) {
        resetMiniMapContainer(container);
      }
    };
  }, [map, mainZoom]);

  return null;
}
