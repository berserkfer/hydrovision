/**
 * Expresiones GEE — SOLO extracción de datos (colección, filtros, selección de bandas).
 * NO contiene fórmulas de índices espectrales.
 */

import { SENTINEL2_DEFAULT_COLLECTION } from "@/satellite/catalog/sentinel2-bands.catalog";

/** Bandas GEE nativas en COPERNICUS/S2_SR_HARMONIZED */
export const GEE_SENTINEL2_BANDS = ["B2", "B3", "B4", "B5", "B8", "B11"] as const;

/** Bandas espectrales + SCL para QC de píxel en point sampling */
export const GEE_SENTINEL2_REFLECTANCE_SELECT = [...GEE_SENTINEL2_BANDS, "SCL"] as const;

export interface SceneSearchParams {
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  cloudCoverMax?: number;
  limit?: number;
}

export interface PointReflectanceParams {
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  cloudCoverMax?: number;
  /** system:index — filtra la escena exacta para reflectancia */
  sceneId?: string;
}

export function buildSentinel2SceneSearchExpression(params: SceneSearchParams): string {
  const cloudMax = params.cloudCoverMax ?? 30;
  const limit = params.limit ?? 20;
  const point = `[${params.longitude}, ${params.latitude}]`;

  return [
    `var col = ee.ImageCollection('${SENTINEL2_DEFAULT_COLLECTION}')`,
    `.filterDate('${params.startDate}', '${params.endDate}')`,
    `.filterBounds(ee.Geometry.Point(${point}))`,
    `.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', ${cloudMax}))`,
    `.sort('system:time_start', false)`,
    `.limit(${limit});`,
    `col`,
  ].join("");
}

/**
 * Metadata de escenas: system:index, system:time_start, CLOUDY_PIXEL_PERCENTAGE alineados.
 */
export function buildSentinel2SceneDetailsExpression(params: SceneSearchParams): string {
  const cloudMax = params.cloudCoverMax ?? 30;
  const limit = params.limit ?? 20;
  const point = `[${params.longitude}, ${params.latitude}]`;

  return [
    `var col = ee.ImageCollection('${SENTINEL2_DEFAULT_COLLECTION}')`,
    `.filterDate('${params.startDate}', '${params.endDate}')`,
    `.filterBounds(ee.Geometry.Point(${point}))`,
    `.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', ${cloudMax}))`,
    `.sort('system:time_start', false)`,
    `.limit(${limit});`,
    `ee.Dictionary({`,
    `'system:index': col.aggregate_array('system:index'),`,
    `'system:time_start': col.aggregate_array('system:time_start'),`,
    `'CLOUDY_PIXEL_PERCENTAGE': col.aggregate_array('CLOUDY_PIXEL_PERCENTAGE')`,
    `})`,
  ].join("");
}

/**
 * Reflectancia en punto + SCL. Si sceneId está presente, filtra system:index.
 */
export function buildSentinel2ReflectanceExpression(params: PointReflectanceParams): string {
  const cloudMax = params.cloudCoverMax ?? 30;
  const point = `[${params.longitude}, ${params.latitude}]`;
  const bands = GEE_SENTINEL2_REFLECTANCE_SELECT.map((b) => `'${b}'`).join(", ");

  const filters = [
    `var col = ee.ImageCollection('${SENTINEL2_DEFAULT_COLLECTION}')`,
    `.filterDate('${params.startDate}', '${params.endDate}')`,
    `.filterBounds(ee.Geometry.Point(${point}))`,
    `.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', ${cloudMax}))`,
  ];

  if (params.sceneId) {
    filters.push(`.filter(ee.Filter.eq('system:index', '${params.sceneId}'))`);
  }

  return [
    ...filters,
    `.sort('system:time_start', false)`,
    `.first()`,
    `.select([${bands}]);`,
    `col`,
  ].join("");
}

/** @deprecated Usar buildSentinel2SceneDetailsExpression para metadata completa */
export function buildSentinel2SceneMetadataExpression(params: SceneSearchParams): string {
  return buildSentinel2SceneDetailsExpression(params);
}
