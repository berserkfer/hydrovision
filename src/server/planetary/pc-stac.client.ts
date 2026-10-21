/**
 * Cliente STAC de Microsoft Planetary Computer — búsqueda pública de Sentinel-2 L2A.
 * Sin autenticación. Ver planetary-computer.config.ts.
 */

import { PLANETARY_COMPUTER_COLLECTION, PLANETARY_COMPUTER_STAC_URL } from "@/config/planetary-computer.config";
import { TtlCache } from "@/server/cache/ttl-cache";
import { PlanetaryHttpError, planetaryFetch } from "./pc-request-pool";

/** Las búsquedas STAC idénticas se reutilizan durante 10 minutos. */
const stacSearchCache = new TtlCache<StacItem[]>(10 * 60_000, 100);

export interface StacSearchParams {
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  cloudCoverMax?: number;
  limit?: number;
}

/** Bbox pequeño alrededor del punto — STAC opera sobre bbox, no puntos literales */
const POINT_BBOX_DEGREES_BUFFER = 0.0005; // ~50 m en latitudes medias

export function buildStacBbox(latitude: number, longitude: number): [number, number, number, number] {
  return [
    longitude - POINT_BBOX_DEGREES_BUFFER,
    latitude - POINT_BBOX_DEGREES_BUFFER,
    longitude + POINT_BBOX_DEGREES_BUFFER,
    latitude + POINT_BBOX_DEGREES_BUFFER,
  ];
}

export interface StacAsset {
  href: string;
}

export interface StacItem {
  id: string;
  properties: {
    datetime: string;
    "eo:cloud_cover"?: number;
    "s2:processing_baseline"?: string;
    "proj:epsg"?: number;
  };
  assets: Record<string, StacAsset>;
}

interface StacSearchResponse {
  features?: StacItem[];
}

export async function searchSentinel2Items(params: StacSearchParams): Promise<StacItem[]> {
  const cacheKey = JSON.stringify(params);
  const cached = stacSearchCache.get(cacheKey);
  if (cached) return cached;

  const cloudMax = params.cloudCoverMax ?? 30;
  const limit = params.limit ?? 10;

  const response = await planetaryFetch(PLANETARY_COMPUTER_STAC_URL, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      collections: [PLANETARY_COMPUTER_COLLECTION],
      bbox: buildStacBbox(params.latitude, params.longitude),
      datetime: `${params.startDate}T00:00:00Z/${params.endDate}T23:59:59Z`,
      limit,
      query: { "eo:cloud_cover": { lt: cloudMax } },
      sortby: [{ field: "properties.datetime", direction: "desc" }],
    }),
  });

  const data = (await response.json()) as StacSearchResponse;
  const items = data.features ?? [];
  stacSearchCache.set(cacheKey, items);
  return items;
}

/** Un ítem STAC publicado no cambia: se reutiliza 30 min. */
const stacItemCache = new TtlCache<StacItem>(30 * 60_000, 200);

export async function getSentinel2ItemById(itemId: string): Promise<StacItem | null> {
  const cached = stacItemCache.get(itemId);
  if (cached) return cached;
  try {
    const response = await planetaryFetch(
      `https://planetarycomputer.microsoft.com/api/stac/v1/collections/${PLANETARY_COMPUTER_COLLECTION}/items/${itemId}`,
      { cache: "no-store" }
    );
    const item = (await response.json()) as StacItem;
    stacItemCache.set(itemId, item);
    return item;
  } catch (error) {
    // 404 u otro error definitivo: el ítem no existe. Transitorios agotados: sin dato.
    if (error instanceof PlanetaryHttpError || error instanceof Error) return null;
    throw error;
  }
}
