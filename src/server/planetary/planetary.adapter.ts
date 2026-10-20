/**
 * Planetary Computer Adapter — fuente de datos Sentinel-2 REAL, pública, sin credenciales.
 * NO calcula índices espectrales; solo escenas, metadatos y reflectancias (mismo principio
 * que GeeAdapter/CopernicusAdapter). A diferencia de esos dos, esta fuente SIEMPRE puede
 * intentar una consulta real — no existe "no configurado", solo "falló la red/no hay escena".
 */

import { interpretSclPixelQuality } from "@/satellite/quality/pixel-quality";
import { isPlanetaryComputerEnabled } from "@/config/planetary-computer.config";
import { getSentinel2ItemById, searchSentinel2Items, type StacItem } from "./pc-stac.client";
import { readBandPixelAtPoint, readBandWindowAtPoint } from "./pc-band-reader";
import { assessWaterSufficiency, computeWaterFraction } from "@/satellite/quality/water-fraction";
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
const WATER_FRACTION_WINDOW_SIZE = 3;

/**
 * Fracción de agua en la ventana 3×3 con NDWI. Si no hay ventanas válidas
 * devuelve "unknown" — nunca asume que el píxel es agua.
 */
function computeWaterMetrics(
  greenRaw: number[] | undefined,
  nirRaw: number[] | undefined,
  boaOffset: number
): { waterFraction: number | null; pixelsUsed: number; waterSufficiency: "sufficient" | "insufficient" | "unknown" } {
  if (!greenRaw || !nirRaw || greenRaw.length === 0 || greenRaw.length !== nirRaw.length) {
    return { waterFraction: null, pixelsUsed: 0, waterSufficiency: "unknown" };
  }

  const pixels = greenRaw.map((green, i) => ({
    green: convertDnToReflectance(green, boaOffset),
    nir: convertDnToReflectance(nirRaw[i], boaOffset),
  }));

  const { waterFraction, pixelsUsed } = computeWaterFraction(pixels);
  return {
    waterFraction,
    pixelsUsed,
    waterSufficiency: assessWaterSufficiency(waterFraction, pixelsUsed),
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

      // Cada banda es un asset COG independiente (petición HTTP propia) — leerlas en paralelo
      // en vez de una a una recorta drásticamente la latencia total (antes: hasta 6 lecturas
      // secuenciales por escena, cada una de varios segundos reales contra Azure Blob Storage).
      const bandsToRead = [...REFLECTANCE_BANDS, SCL_BAND] as const;
      const waterWindows: { green?: number[]; nir?: number[] } = {};

      const bandReads = await Promise.all(
        bandsToRead.map(async (band) => {
          const href = resolvedItem.assets[band]?.href;
          if (!href) return null;

          // B03 y B08 se leen como ventana 3×3 para estimar la fracción de agua.
          // El valor puntual sigue siendo el píxel central de esa ventana.
          if (band === "B03" || band === "B08") {
            const window = await readBandWindowAtPoint(
              href,
              request.latitude,
              request.longitude,
              WATER_FRACTION_WINDOW_SIZE
            );
            if (!window) return null;
            const center = window.rawValues[Math.floor(window.rawValues.length / 2)];
            if (center === undefined || !Number.isFinite(center)) return null;
            if (band === "B03") waterWindows.green = window.rawValues;
            else waterWindows.nir = window.rawValues;
            return { band, rawValue: center } as const;
          }

          const pixel = await readBandPixelAtPoint(href, request.latitude, request.longitude);
          return pixel ? ({ band, rawValue: pixel.rawValue } as const) : null;
        })
      );

      const rawAllBands: Record<string, number> = {};
      for (const read of bandReads) {
        if (!read) continue;
        rawAllBands[read.band] =
          read.band === SCL_BAND
            ? read.rawValue // SCL es una clasificación entera, sin escalar
            : convertDnToReflectance(read.rawValue, boaOffset);
      }

      if (Object.keys(rawAllBands).length === 0) return null;

      const { [SCL_BAND]: sclRawValue, ...reflectanceBands } = rawAllBands;
      const processed = processGeeSurfaceReflectances(reflectanceBands, mapCopernicusReflectances);
      const pixelQualityStatus = interpretSclPixelQuality(sclRawValue ?? null);
      const water = computeWaterMetrics(waterWindows.green, waterWindows.nir, boaOffset);
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
}

export const planetaryAdapter = new PlanetaryAdapter();
