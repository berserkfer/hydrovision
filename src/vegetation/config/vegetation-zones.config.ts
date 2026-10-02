/**
 * Dos aplicaciones del mismo índice espectral (misma escena Sentinel-2, mismo adaptador),
 * cambiando solo el polígono/punto geográfico de análisis. Nunca se mezclan en un solo número.
 *
 * Decisión de diseño documentada: la infraestructura de reflectancia de la plataforma
 * (planetaryAdapter.getReflectanceAtPoint) es puntual ("point_sampling"), no un promedio real
 * sobre un polígono vectorial. Cada zona usa un punto representativo (centroide aproximado)
 * en vez de una parcela/espejo de agua delimitado con precisión catastral — misma limitación
 * ya documentada en el resto de la plataforma (predicción satelital, módulo de foto Nivel 2).
 */

export type VegetationZoneId = "agricultural_dren4000" | "lagoon_santa_rosa";

export interface VegetationZoneConfig {
  id: VegetationZoneId;
  label: string;
  description: string;
  /** NDVI para vegetación terrestre; NDCI (clorofila-a) para la laguna — NDVI está marcado
   * explícitamente como no aplicable a agua en el catálogo de índices de la plataforma. */
  index: "NDVI" | "NDCI";
  centroid: { latitude: number; longitude: number };
  isApproximateCentroid: true;
}

export const VEGETATION_ZONES: Record<VegetationZoneId, VegetationZoneConfig> = {
  agricultural_dren4000: {
    id: "agricultural_dren4000",
    label: "Parcelas agrícolas — entorno del Dren 4000",
    description:
      "Contexto agrícola (calendario de arroz) de los terrenos colindantes al canal del Dren 4000, Santa Rosa, Lambayeque.",
    index: "NDVI",
    centroid: { latitude: -6.8759, longitude: -79.9277 },
    isApproximateCentroid: true,
  },
  lagoon_santa_rosa: {
    id: "lagoon_santa_rosa",
    label: "Laguna de oxidación — Santa Rosa",
    description:
      "Espejo de agua de la laguna de oxidación (puntos P1/P2), como indicador de acumulación de algas o vegetación acuática.",
    index: "NDCI",
    centroid: { latitude: -6.8724, longitude: -79.9231 },
    isApproximateCentroid: true,
  },
};

export function getVegetationZone(zoneId: VegetationZoneId): VegetationZoneConfig {
  return VEGETATION_ZONES[zoneId];
}

export function isVegetationZoneId(value: string | null): value is VegetationZoneId {
  return value === "agricultural_dren4000" || value === "lagoon_santa_rosa";
}
