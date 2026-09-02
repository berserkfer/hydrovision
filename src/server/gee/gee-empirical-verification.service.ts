/**
 * Verificación empírica GEE/Sentinel-2 — Prompt 11.
 * NO simula éxito cuando GEE no está configurado o falla.
 */

import { isGeeConfigured, validateGeeConfig } from "@/config/gee.config";
import { isGeeIntegrationEnabled, isGeeLiveToken } from "@/config/gee-integration.config";
import { SENTINEL2_DEFAULT_COLLECTION } from "@/satellite/catalog/sentinel2-bands.catalog";
import { POINT_SAMPLING_LIMITATION } from "@/satellite/types/satellite-metadata.types";
import type {
  GeeEmpiricalVerificationReport,
  GeeReflectanceVerificationRecord,
  GeeSceneVerificationRecord,
} from "@/satellite/types/gee-verification.types";
import { getEarthEngineAuthService, getEarthEngineTokenManager } from "@/services/google-earth-engine/auth";
import { GeeAdapter } from "./gee.adapter";
import { systemTimeStartToAcquisitionDate } from "./gee-band.mapper";
import { getDataStore } from "@/data/store-access";
import { prisma } from "@/server/db";
import { isSatelliteDatabaseEnabled } from "@/config/satellite-data-source.config";

export interface GeeVerificationRequest {
  stationId?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

async function resolveStation(stationId?: string): Promise<{
  stationId: string;
  latitude: number;
  longitude: number;
} | null> {
  if (stationId) {
    if (isSatelliteDatabaseEnabled()) {
      const row = await prisma.station.findUnique({
        where: { id: stationId },
        select: { id: true, latitude: true, longitude: true },
      });
      if (row) return { stationId: row.id, latitude: row.latitude, longitude: row.longitude };
    }
    const mock = getDataStore().estaciones.find((e) => e.id === stationId);
    if (mock) {
      return {
        stationId: mock.id,
        latitude: mock.coordenadas.latitude,
        longitude: mock.coordenadas.longitude,
      };
    }
    return null;
  }

  const first = getDataStore().estaciones[0];
  if (!first) return null;
  return {
    stationId: first.id,
    latitude: first.coordenadas.latitude,
    longitude: first.coordenadas.longitude,
  };
}

function defaultDateRange(req?: GeeVerificationRequest): { startDate: string; endDate: string } {
  const endDate = req?.fechaFin ?? new Date().toISOString().slice(0, 10);
  const startDate =
    req?.fechaInicio ??
    new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  return { startDate, endDate };
}

export class GeeEmpiricalVerificationService {
  async runVerification(request: GeeVerificationRequest = {}): Promise<GeeEmpiricalVerificationReport> {
    const executedAt = new Date().toISOString();
    const validation = validateGeeConfig();
    const configSummary = {
      isConfigured: validation.isValid,
      integrationEnabled: isGeeIntegrationEnabled(),
      missingEnvKeys: validation.missingVariables,
    };

    const limitations = [POINT_SAMPLING_LIMITATION];
    const notes: string[] = [];
    const errors: string[] = [];

    if (!isGeeIntegrationEnabled() || !isGeeConfigured()) {
      return {
        status: "GEE_LIVE_UNAVAILABLE",
        liveExecuted: false,
        executedAt,
        collection: SENTINEL2_DEFAULT_COLLECTION,
        stationId: request.stationId ?? null,
        coordinates: null,
        dateRange: null,
        configuration: configSummary,
        scenes: [],
        reflectanceSamples: [],
        limitations,
        errors: configSummary.missingEnvKeys.length
          ? [`Variables faltantes: ${configSummary.missingEnvKeys.join(", ")}`]
          : ["GEE no configurado o integración deshabilitada"],
        spatialRepresentativeness: "point_sampling",
        notes: ["GEE live verification not executed — credenciales no disponibles en entorno"],
      };
    }

    const station = await resolveStation(request.stationId);
    if (!station) {
      return {
        status: "GEE_LIVE_FAILED",
        liveExecuted: false,
        executedAt,
        collection: SENTINEL2_DEFAULT_COLLECTION,
        stationId: request.stationId ?? null,
        coordinates: null,
        dateRange: null,
        configuration: configSummary,
        scenes: [],
        reflectanceSamples: [],
        limitations,
        errors: ["Estación no encontrada para verificación"],
        spatialRepresentativeness: "point_sampling",
        notes: [],
      };
    }

    const { startDate, endDate } = defaultDateRange(request);

    try {
      const auth = getEarthEngineAuthService();
      if (!auth.isInitialized()) {
        await auth.initialize();
      }

      const token = await getEarthEngineTokenManager().getAccessToken();
      if (!isGeeLiveToken(token.source)) {
        return {
          status: "GEE_SIMULATED_ONLY",
          liveExecuted: false,
          executedAt,
          collection: SENTINEL2_DEFAULT_COLLECTION,
          stationId: station.stationId,
          coordinates: { latitude: station.latitude, longitude: station.longitude },
          dateRange: { startDate, endDate },
          configuration: configSummary,
          scenes: [],
          reflectanceSamples: [],
          limitations,
          errors: ["Token GEE simulado — verificación live no ejecutada"],
          spatialRepresentativeness: "point_sampling",
          notes: ["GEE live verification not executed — token no OAuth real"],
        };
      }

      const adapter = new GeeAdapter(getEarthEngineTokenManager());
      const scenesRaw = await adapter.searchSentinel2Scenes({
        latitude: station.latitude,
        longitude: station.longitude,
        startDate,
        endDate,
        cloudCoverMax: 30,
        limit: 5,
      });

      const scenes: GeeSceneVerificationRecord[] = scenesRaw.map((s) => ({
        sceneId: s.sceneId,
        systemIndex: s.systemIndex,
        systemTimeStart: s.systemTimeStart,
        acquisitionDate: s.acquisitionDate,
        cloudPercentage: s.cloudPercentage,
        collection: s.collection,
        tileId: s.tileId,
        indexMatchesSystemIndex: s.sceneId === s.systemIndex,
        acquisitionMatchesSystemTime: s.acquisitionFromSystemTime,
      }));

      const reflectanceSamples: GeeReflectanceVerificationRecord[] = [];

      for (const scene of scenesRaw.slice(0, 2)) {
        const refl = await adapter.getReflectanceAtPoint({
          latitude: station.latitude,
          longitude: station.longitude,
          startDate,
          endDate,
          sceneId: scene.sceneId,
          sceneCloudPercentage: scene.cloudPercentage,
          sceneSystemTimeStart: scene.systemTimeStart,
          cloudCoverMax: 30,
        });

        if (!refl) continue;

        reflectanceSamples.push({
          sceneId: refl.sceneId,
          rawBandValues: refl.rawBandValues,
          reflectanceSemanticStatus: refl.reflectanceSemanticStatus,
          scaleEvidence: refl.scaleEvidence,
          pixelQualityStatus: refl.pixelQualityStatus,
          sclRawValue: refl.sclRawValue,
          indicesBlocked: refl.reflectanceSemanticStatus !== "valid",
        });
      }

      if (scenes.some((s) => s.cloudPercentage === null)) {
        notes.push("Al menos una escena sin CLOUDY_PIXEL_PERCENTAGE — cloudPercentage permanece null");
      }

      if (reflectanceSamples.some((r) => r.scaleEvidence.interpretation === "likely_dn_or_scaled")) {
        notes.push(
          "Valores sugieren escala DN — NO se aplicó /10000; reflectanceSemanticStatus=out_of_range"
        );
      }

      if (reflectanceSamples.some((r) => r.reflectanceSemanticStatus === "unknown")) {
        notes.push("Escala de reflectancia indeterminada — índices bloqueados");
      }

      for (const s of scenes) {
        if (s.systemTimeStart !== null) {
          const derived = systemTimeStartToAcquisitionDate(s.systemTimeStart);
          if (derived !== s.acquisitionDate) {
            errors.push(
              `Discrepancia acquisitionDate vs system:time_start para ${s.sceneId}: ${s.acquisitionDate} vs ${derived}`
            );
          }
        }
      }

      return {
        status: errors.length > 0 ? "GEE_LIVE_FAILED" : "GEE_LIVE_VERIFIED",
        liveExecuted: true,
        executedAt,
        collection: SENTINEL2_DEFAULT_COLLECTION,
        stationId: station.stationId,
        coordinates: { latitude: station.latitude, longitude: station.longitude },
        dateRange: { startDate, endDate },
        configuration: configSummary,
        scenes,
        reflectanceSamples,
        limitations,
        errors,
        spatialRepresentativeness: "point_sampling",
        notes,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(message);
      return {
        status: "GEE_LIVE_FAILED",
        liveExecuted: true,
        executedAt,
        collection: SENTINEL2_DEFAULT_COLLECTION,
        stationId: station.stationId,
        coordinates: { latitude: station.latitude, longitude: station.longitude },
        dateRange: { startDate, endDate },
        configuration: configSummary,
        scenes: [],
        reflectanceSamples: [],
        limitations,
        errors,
        spatialRepresentativeness: "point_sampling",
        notes: ["GEE live verification failed — ver errors"],
      };
    }
  }
}

export const geeEmpiricalVerificationService = new GeeEmpiricalVerificationService();
