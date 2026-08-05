"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface MapRecenterProps {
  latitude: number;
  longitude: number;
  zoom: number;
  /** Incrementar para forzar re-centrado con el botón "Centrar mapa" */
  recenterToken: number;
}

/**
 * Componente auxiliar de react-leaflet que reposiciona el mapa
 * cuando cambian los filtros o el usuario pulsa "Centrar mapa".
 */
export function MapRecenter({ latitude, longitude, zoom, recenterToken }: MapRecenterProps) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([latitude, longitude], zoom, { duration: 0.8 });
  }, [latitude, longitude, zoom, recenterToken, map]);

  return null;
}
