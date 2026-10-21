/**
 * Planetary Computer Adapter — fuente de datos Sentinel-2 REAL, pública, sin credenciales.
 * NO calcula índices espectrales; solo escenas, metadatos y reflectancias (mismo principio
 * que GeeAdapter/CopernicusAdapter). A diferencia de esos dos, esta fuente SIEMPRE puede
 * intentar una consulta real — no existe "no configurado", solo "falló la red/no hay escena".
 */

import { interpretSclPixelQuality } from "@/satellite/quality/pixel-quality";
import { isPlanetaryComputerEnabled } from "@/config/planetary-computer.config";
import { reflectanceCache, reflectanceCacheKey } from "./pc-reflectance-cache";
import { getChannelPolygon } from "@/server/satellite/channel/channel-polygon.store";
import { isInsideChannel } from "@/satellite/geo/channel-polygon";
import { getSentinel2ItemById, searchSentinel2Items, type StacItem } from "./pc-stac.client";
import {
  crsToWgs84,
  readBandAtCrsPoints,
  readBandGridAtPoint,
  readBandPixelAtPoint,
  type BandGridReadResult,
} from "./pc-band-reader";
import {
  getCloudMode,
  getWaterSearchRadiusM,
  requiredGridHalfSize,
  selectWaterPixel,
  type PixelGrid,
  type WaterPixelSelectionRecord,
} from "@/satellite/quality/water-pixel-selection";
import { convertDnToReflectance, resolveBoaOffset } from "./pc-band.mapper";
import { mapCopernicusReflectances } from "@/server/copernicus/copernicus-band.mapper";
import { processGeeSurfaceReflectances } from "@/server/gee/gee-band.mapper";
import type {
  PlanetaryAdapterStatus,
  PlanetaryReflectanceRecord,
  PlanetaryReflectanceRequest,
  PlanetarySceneRecord,
  PlanetarySceneSearchRequest,
} from "./planetary.adapter.types";

const REFLECTANCE_BANDS = ["B03", "B04", "B05", "B08", "B11"] as const;
const SCL_BAND = "SCL";
const SENTINEL2_L2A_COLLECTION = "sentinel-2-l2a" as const;

/**
 * Métricas de agua que viajan con la observación, derivadas de la selección del píxel:
 * solo una selección utilizable (píxel del punto o ajustado) es "sufficient". Bloqueos y
 * descartes son "insufficient" (la predicción se bloquea con NO_WATER_PIXELS); sin datos,
 * "unknown" — nunca se asume que el píxel es agua.
 */
function waterMetricsFromSelection(record: WaterPixelSelectionRecord): {
  waterFraction: number | null;
  pixelsUsed: number;
  waterSufficiency: "sufficient" | "insufficient" | "unknown";
} {
  return {
    waterFraction: record.window.waterFraction,
    pixelsUsed: record.window.validPixels,
    waterSufficiency: record.usable ? "sufficient" : record.status === "no_data" ? "unknown" : "insufficient",
  };
}

function tileFromSceneId(sceneId: string): string | null {
  const match = sceneId.match(/_T(\d{2}[A-Z]{3})_/);
  return match ? match[1] : null;
}

function sceneRecordFromStacItem(item: StacItem): PlanetarySceneRecord {
  const timeMs = Date.parse(item.properties.datetime);
  return {
    sceneId: item.id,
    systemIndex: item.id,
    acquisitionDate: item.properties.datetime.slice(0, 10),
    cloudPercentage: item.properties["eo:cloud_cover"] ?? null,
    tileId: tileFromSceneId(item.id),
    collection: SENTINEL2_L2A_COLLECTION,
    platform: "sentinel2",
    systemTimeStart: Number.isFinite(timeMs) ? timeMs : null,
    metadataSource: "planetary_computer_live",
    acquisitionFromSystemTime: true,
  };
}

// Caché de reflectancias: ver pc-reflectance-cache.ts (se reexporta para compatibilidad).
export { clearPlanetaryReflectanceCache } from "./pc-reflectance-cache";

export class PlanetaryAdapter {
  getStatus(): PlanetaryAdapterStatus {
    const enabled = isPlanetaryComputerEnabled();
    return {
      isConfigured: enabled,
      isLive: enabled,
      authMode: "public_no_auth",
      message: enabled
        ? "Microsoft Planetary Computer — catálogo STAC público de Sentinel-2 L2A, sin credenciales."
        : "Integración Planetary Computer deshabilitada por configuración (PLANETARY_COMPUTER_ENABLED=false).",
    };
  }

  async searchSentinel2Scenes(request: PlanetarySceneSearchRequest): Promise<PlanetarySceneRecord[]> {
    if (!isPlanetaryComputerEnabled()) return [];

    try {
      const items = await searchSentinel2Items(request);
      return items.slice(0, request.limit ?? 20).map(sceneRecordFromStacItem);
    } catch {
      // Falla de red/servicio — nunca se fabrica una escena. Lista vacía es la respuesta honesta.
      return [];
    }
  }

  async getReflectanceAtPoint(
    request: PlanetaryReflectanceRequest
  ): Promise<PlanetaryReflectanceRecord | null> {
    if (!isPlanetaryComputerEnabled()) return null;

    const cacheKey = reflectanceCacheKey(request);
    const cached = cacheKey ? reflectanceCache.get(cacheKey) : undefined;
    if (cached) return cached;

    const record = await this.readReflectanceAtPoint(request);
    if (record && cacheKey) reflectanceCache.set(cacheKey, record);
    return record;
  }

  private async readReflectanceAtPoint(
    request: PlanetaryReflectanceRequest
  ): Promise<PlanetaryReflectanceRecord | null> {

    try {
      let item: StacItem | null = null;

      if (request.sceneId) {
        item = await getSentinel2ItemById(request.sceneId);
      } else {
        const items = await searchSentinel2Items(request);
        item = items[0] ?? null;
      }

      if (!item) return null;
      const resolvedItem = item;

      const boaOffset = resolveBoaOffset(resolvedItem.properties["s2:processing_baseline"]);
      const hrefOf = (band: string) => resolvedItem.assets[band]?.href;

      // 1) Selección robusta del píxel de agua: rejillas B03/B08 (10 m) + SCL (20 m) muestreada
      //    en el centro de cada píxel de 10 m. Ver src/satellite/quality/water-pixel-selection.ts.
      const searchRadiusM = getWaterSearchRadiusM();
      const half = requiredGridHalfSize(searchRadiusM);
      const greenHref = hrefOf("B03");
      const nirHref = hrefOf("B08");
      const [greenGrid, nirGrid] = await Promise.all([
        greenHref ? readBandGridAtPoint(greenHref, request.latitude, request.longitude, half) : null,
        nirHref ? readBandGridAtPoint(nirHref, request.latitude, request.longitude, half) : null,
      ]);

      const selection = await this.selectWaterPixelForScene(
        request,
        greenGrid,
        nirGrid,
        hrefOf(SCL_BAND),
        boaOffset,
        searchRadiusM
      );

      // 2) Las demás bandas se leen en el píxel elegido (o en el punto si no se eligió ninguno);
      //    B03/B08/SCL salen de la misma rejilla, sin una segunda lectura.
      const sample = selection.record.adjustedCoordinate ?? selection.record.originalCoordinate;
      const otherBands = REFLECTANCE_BANDS.filter((b) => b !== "B03" && b !== "B08");
      const otherReads = await Promise.all(
        otherBands.map(async (band) => {
          const href = hrefOf(band);
          if (!href) return null;
          const pixel = await readBandPixelAtPoint(href, sample.latitude, sample.longitude);
          return pixel ? ({ band, rawValue: pixel.rawValue } as const) : null;
        })
      );

      const rawAllBands: Record<string, number> = {};
      for (const read of otherReads) {
        if (read) rawAllBands[read.band] = convertDnToReflectance(read.rawValue, boaOffset);
      }
      const cell = selection.sampleCell;
      const greenRaw = greenGrid?.values[cell.row]?.[cell.col];
      const nirRaw = nirGrid?.values[cell.row]?.[cell.col];
      if (greenRaw != null) rawAllBands.B03 = convertDnToReflectance(greenRaw, boaOffset);
      if (nirRaw != null) rawAllBands.B08 = convertDnToReflectance(nirRaw, boaOffset);
      const sclRawValue = selection.sclAtSample;

      if (Object.keys(rawAllBands).length === 0) return null;

      const processed = processGeeSurfaceReflectances(rawAllBands, mapCopernicusReflectances);
      const pixelQualityStatus = interpretSclPixelQuality(sclRawValue ?? null);
      const water = waterMetricsFromSelection(selection.record);
      const acquisitionDate = item.properties.datetime.slice(0, 10);

      const base: PlanetaryReflectanceRecord = {
        sceneId: item.id,
        acquisitionDate,
        cloudPercentage: item.properties["eo:cloud_cover"] ?? null,
        reflectances: processed.reflectances,
        bandsUsed: Object.keys(processed.reflectances) as PlanetaryReflectanceRecord["bandsUsed"],
        rawBandValues: processed.rawBandValues,
        reflectanceSemanticStatus: processed.semanticStatus,
        scaleEvidence: processed.scaleEvidence,
        pixelQualityStatus,
        sclRawValue: sclRawValue ?? null,
        spatialRepresentativeness: "point_sampling",
        systemTimeStart: Date.parse(item.properties.datetime) || null,
        waterFraction: water.waterFraction,
        pixelsUsed: water.pixelsUsed,
        waterSufficiency: water.waterSufficiency,
        waterPixelSelection: selection.record,
      };

      if (processed.semanticStatus !== "valid") {
        return { ...base, reflectances: {}, bandsUsed: [] };
      }

      return base;
    } catch {
      // Nunca se fabrica una reflectancia ante un fallo de red/lectura del COG.
      return null;
    }
  }

  /** Arma la rejilla con máscara SCL, elige el píxel y devuelve el registro trazable. */
  private async selectWaterPixelForScene(
    request: PlanetaryReflectanceRequest,
    greenGrid: BandGridReadResult | null,
    nirGrid: BandGridReadResult | null,
    sclHref: string | undefined,
    boaOffset: number,
    searchRadiusM: number
  ): Promise<{ record: WaterPixelSelectionRecord; sampleCell: { row: number; col: number }; sclAtSample: number | null }> {
    const originalCoordinate = { latitude: request.latitude, longitude: request.longitude };
    const cloudMode = getCloudMode();
    const emptyRecord = (reason: string): WaterPixelSelectionRecord => ({
      status: "no_data",
      usable: false,
      reason,
      originalCoordinate,
      adjustedCoordinate: null,
      adjustmentDistanceM: 0,
      pixelOffset: null,
      searchRadiusM,
      channelCheck: "connected_water_body",
      cloudMode,
      window: { waterPixels: 0, validPixels: 0, contaminatedPixels: 0, waterFraction: null },
      selectedNdwi: null,
      selectedScl: null,
    });

    if (!greenGrid || !nirGrid || greenGrid.values.length !== nirGrid.values.length) {
      const half = greenGrid ? Math.floor(greenGrid.values.length / 2) : 0;
      return { record: emptyRecord("No se pudieron leer las bandas B03/B08 alrededor del punto."), sampleCell: { row: half, col: half }, sclAtSample: null };
    }

    const size = greenGrid.values.length;
    const half = Math.floor(size / 2);
    const centers = greenGrid.cellCenters.flat();
    const sclFlat = sclHref ? await readBandAtCrsPoints(sclHref, centers) : null;
    if (!sclFlat) {
      return { record: emptyRecord("No se pudo leer la banda SCL: sin máscara de calidad no se elige píxel."), sampleCell: { row: half, col: half }, sclAtSample: null };
    }

    const grid: PixelGrid = {
      pixelSizeM: greenGrid.resolutionMeters,
      pixels: greenGrid.values.map((row, r) =>
        row.map((g, c) => {
          const n = nirGrid.values[r]?.[c];
          return {
            green: g == null ? null : convertDnToReflectance(g, boaOffset),
            nir: n == null ? null : convertDnToReflectance(n, boaOffset),
            scl: sclFlat[r * size + c] ?? null,
          };
        })
      ),
    };

    // Con polígono del cauce subido, el píxel de agua debe quedar dentro de él (prioridad sobre
    // la regla de cuerpo de agua conexo).
    const channel = await getChannelPolygon();
    const isInChannel = channel
      ? (dRow: number, dCol: number) => {
          const cell = greenGrid.cellCenters[half + dRow]?.[half + dCol];
          return cell ? isInsideChannel(crsToWgs84(greenGrid.epsg, cell), channel.polygons) : false;
        }
      : undefined;
    const selection = selectWaterPixel(grid, { searchRadiusM, cloudMode, isInChannel });
    const offset = selection.pixelOffset;
    const sampleCell = offset ? { row: half + offset.dRow, col: half + offset.dCol } : { row: half, col: half };
    const adjustedCoordinate = offset
      ? crsToWgs84(greenGrid.epsg, greenGrid.cellCenters[sampleCell.row][sampleCell.col])
      : null;

    return {
      record: {
        status: selection.status,
        usable: selection.usable,
        reason: selection.reason,
        originalCoordinate,
        adjustedCoordinate: adjustedCoordinate
          ? {
              latitude: Number(adjustedCoordinate.latitude.toFixed(7)),
              longitude: Number(adjustedCoordinate.longitude.toFixed(7)),
            }
          : null,
        adjustmentDistanceM: selection.adjustmentDistanceM,
        pixelOffset: selection.pixelOffset,
        searchRadiusM: selection.searchRadiusM,
        channelCheck: selection.channelCheck,
        cloudMode: selection.cloudMode,
        window: selection.window,
        selectedNdwi: selection.selectedNdwi,
        selectedScl: selection.selectedScl,
      },
      sampleCell,
      sclAtSample: sclFlat[sampleCell.row * size + sampleCell.col] ?? null,
    };
  }
}

export const planetaryAdapter = new PlanetaryAdapter();
