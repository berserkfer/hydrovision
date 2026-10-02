/**
 * Construcción de requests Copernicus — SOLO extracción de datos (colección, filtros, bandas).
 * NO contiene fórmulas de índices espectrales (mismo principio que gee-expression.builder.ts).
 */

export const COPERNICUS_SENTINEL2_L2A_COLLECTION = "sentinel-2-l2a" as const;

/** Bandas nativas Sentinel-2 solicitadas al evalscript — mismo set que GEE_SENTINEL2_BANDS */
export const COPERNICUS_SENTINEL2_BANDS = ["B03", "B04", "B05", "B08", "B11"] as const;
export const COPERNICUS_SENTINEL2_REFLECTANCE_SELECT = [
  ...COPERNICUS_SENTINEL2_BANDS,
  "SCL",
] as const;

export interface CopernicusSceneSearchParams {
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  cloudCoverMax?: number;
  limit?: number;
}

export interface CopernicusPointReflectanceParams {
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  cloudCoverMax?: number;
  sceneId?: string;
}

/** Bbox mínimo alrededor de un punto — Process API opera sobre bounds, no puntos literales */
const POINT_BBOX_DEGREES_BUFFER = 0.0001; // ~10 m en latitudes medias

export function buildPointBbox(latitude: number, longitude: number): [number, number, number, number] {
  return [
    longitude - POINT_BBOX_DEGREES_BUFFER,
    latitude - POINT_BBOX_DEGREES_BUFFER,
    longitude + POINT_BBOX_DEGREES_BUFFER,
    latitude + POINT_BBOX_DEGREES_BUFFER,
  ];
}

function toIsoRange(startDate: string, endDate: string): string {
  return `${startDate}T00:00:00Z/${endDate}T23:59:59Z`;
}

/** Body para Sentinel Hub Catalog API (STAC search) — https://sh.dataspace.copernicus.eu/api/v1/catalog/1.0.0/search */
export function buildCatalogSearchBody(params: CopernicusSceneSearchParams): Record<string, unknown> {
  const cloudMax = params.cloudCoverMax ?? 30;
  const limit = params.limit ?? 20;

  return {
    collections: [COPERNICUS_SENTINEL2_L2A_COLLECTION],
    bbox: buildPointBbox(params.latitude, params.longitude),
    datetime: toIsoRange(params.startDate, params.endDate),
    limit,
    query: {
      "eo:cloud_cover": { lt: cloudMax },
    },
  };
}

/** Evalscript v3 — solo selección de bandas nativas, sin normalizedDifference ni fórmulas de índice */
export function buildReflectanceEvalscript(): string {
  const inputBands = COPERNICUS_SENTINEL2_REFLECTANCE_SELECT.map((b) => `"${b}"`).join(", ");
  return [
    "//VERSION=3",
    "function setup() {",
    "  return {",
    `    input: [${inputBands}],`,
    `    output: { bands: ${COPERNICUS_SENTINEL2_REFLECTANCE_SELECT.length}, sampleType: "FLOAT32" }`,
    "  };",
    "}",
    "function evaluatePixel(sample) {",
    `  return [${COPERNICUS_SENTINEL2_REFLECTANCE_SELECT.map((b) => `sample.${b}`).join(", ")}];`,
    "}",
  ].join("\n");
}

/** Body para Process API — https://sh.dataspace.copernicus.eu/api/v1/process */
export function buildProcessRequestBody(params: CopernicusPointReflectanceParams): Record<string, unknown> {
  const cloudMax = params.cloudCoverMax ?? 30;
  const dataFilter: Record<string, unknown> = {
    timeRange: {
      from: `${params.startDate}T00:00:00Z`,
      to: `${params.endDate}T23:59:59Z`,
    },
    maxCloudCoverage: cloudMax,
    mosaickingOrder: "mostRecent",
  };

  return {
    input: {
      bounds: {
        bbox: buildPointBbox(params.latitude, params.longitude),
        properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" },
      },
      data: [
        {
          type: COPERNICUS_SENTINEL2_L2A_COLLECTION,
          dataFilter,
        },
      ],
    },
    output: {
      width: 1,
      height: 1,
      responses: [{ identifier: "default", format: { type: "application/json" } }],
    },
    evalscript: buildReflectanceEvalscript(),
  };
}
