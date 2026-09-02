/**
 * GEE Adapter — fuente de datos Sentinel-2.
 * NO calcula índices espectrales; solo escenas, metadatos y reflectancias.
 */

import { isGeeConfigured, validateGeeConfig } from "@/config/gee.config";
import { SENTINEL2_DEFAULT_COLLECTION } from "@/satellite/catalog/sentinel2-bands.catalog";
import { interpretSclPixelQuality } from "@/satellite/quality/pixel-quality";
import type { ITokenProvider } from "@/services/google-earth-engine/auth/interfaces";
import {
  buildSentinel2ReflectanceExpression,
  buildSentinel2SceneDetailsExpression,
} from "./gee-expression.builder";
import type {
  GeeAdapterStatus,
  GeeReflectanceRecord,
  GeeReflectanceRequest,
  GeeSceneRecord,
  GeeSceneSearchRequest,
} from "./gee.adapter.types";
import { HttpGeeRestClient, type GeeRestClient } from "./gee-rest.client";
import {
  extractBandValuesFromComputePixels,
  extractSceneDetailsFromComputeValue,
  processGeeSurfaceReflectances,
  separateReflectanceAndScl,
  systemTimeStartToAcquisitionDate,
} from "./gee-band.mapper";

function tileFromSceneId(sceneId: string): string | null {
  const parts = sceneId.split("_");
  return parts.length >= 2 ? parts[1] : null;
}

function buildReflectanceRecord(
  request: GeeReflectanceRequest,
  rawAllBands: Record<string, number>,
  acquisitionDate: string
): GeeReflectanceRecord {
  const { reflectanceBands, sclRawValue } = separateReflectanceAndScl(rawAllBands);
  const processed = processGeeSurfaceReflectances(reflectanceBands);
  const pixelQualityStatus = interpretSclPixelQuality(sclRawValue);

  const base: GeeReflectanceRecord = {
    sceneId: request.sceneId ?? null,
    acquisitionDate,
    cloudPercentage: request.sceneCloudPercentage ?? null,
    reflectances: processed.reflectances,
    bandsUsed: Object.keys(processed.reflectances) as GeeReflectanceRecord["bandsUsed"],
    rawBandValues: processed.rawBandValues,
    reflectanceSemanticStatus: processed.semanticStatus,
    scaleEvidence: processed.scaleEvidence,
    pixelQualityStatus,
    sclRawValue,
    spatialRepresentativeness: "point_sampling",
    systemTimeStart: request.sceneSystemTimeStart ?? null,
  };

  if (processed.semanticStatus !== "valid") {
    return {
      ...base,
      reflectances: {},
      bandsUsed: [],
    };
  }

  return base;
}

export class GeeAdapter {
  constructor(
    private readonly tokenProvider: ITokenProvider,
    private readonly restClient: GeeRestClient = new HttpGeeRestClient(),
    private readonly isAuthReady: () => boolean = () => true
  ) {}

  getStatus(): GeeAdapterStatus {
    const configured = isGeeConfigured();
    return {
      isConfigured: configured,
      isLive: configured && this.isAuthReady(),
      authMode: configured ? "service_account" : "simulated",
      message: configured
        ? "Adaptador GEE configurado — consulta Sentinel-2 vía REST."
        : "GEE no configurado — complete variables GOOGLE_*.",
    };
  }

  getConfigurationSummary(): {
    isConfigured: boolean;
    missingEnvKeys: string[];
  } {
    const validation = validateGeeConfig();
    return {
      isConfigured: validation.isValid,
      missingEnvKeys: validation.missingVariables,
    };
  }

  async searchSentinel2Scenes(request: GeeSceneSearchRequest): Promise<GeeSceneRecord[]> {
    if (!isGeeConfigured()) {
      return [];
    }

    const token = await this.tokenProvider.getAccessToken();
    if (token.source === "simulated") {
      return this.buildSimulatedScenes(request);
    }

    const expression = buildSentinel2SceneDetailsExpression(request);
    const response = await this.restClient.computeValue({ expression }, token);
    const details = extractSceneDetailsFromComputeValue(response);

    return details.map((row) => {
      const acquisitionFromSystemTime = row.systemTimeStart !== null;
      const acquisitionDate = acquisitionFromSystemTime
        ? systemTimeStartToAcquisitionDate(row.systemTimeStart)
        : request.endDate;

      return {
        sceneId: row.sceneId,
        systemIndex: row.systemIndex,
        acquisitionDate,
        cloudPercentage: row.cloudPercentage,
        tileId: tileFromSceneId(row.sceneId),
        collection: SENTINEL2_DEFAULT_COLLECTION,
        platform: "sentinel2" as const,
        systemTimeStart: row.systemTimeStart,
        metadataSource: row.cloudPercentage !== null ? "gee_live" : "partial",
        acquisitionFromSystemTime,
      };
    });
  }

  async getReflectanceAtPoint(request: GeeReflectanceRequest): Promise<GeeReflectanceRecord | null> {
    if (!isGeeConfigured()) {
      return null;
    }

    const token = await this.tokenProvider.getAccessToken();
    if (token.source === "simulated") {
      return this.buildSimulatedReflectance(request);
    }

    const acquisitionDate =
      request.sceneSystemTimeStart !== null && request.sceneSystemTimeStart !== undefined
        ? systemTimeStartToAcquisitionDate(request.sceneSystemTimeStart)
        : request.endDate;

    const expression = buildSentinel2ReflectanceExpression({
      latitude: request.latitude,
      longitude: request.longitude,
      startDate: request.startDate,
      endDate: request.endDate,
      cloudCoverMax: request.cloudCoverMax,
      sceneId: request.sceneId,
    });
    const response = await this.restClient.computePixels(
      {
        expression,
        latitude: request.latitude,
        longitude: request.longitude,
        scale: 10,
      },
      token
    );

    const rawAllBands = extractBandValuesFromComputePixels(response);
    if (Object.keys(rawAllBands).length === 0) {
      return null;
    }

    return buildReflectanceRecord(request, rawAllBands, acquisitionDate);
  }

  private buildSimulatedScenes(request: GeeSceneSearchRequest): GeeSceneRecord[] {
    const sceneId = `sim-s2-${request.endDate.replace(/-/g, "")}`;
    return [
      {
        sceneId,
        systemIndex: sceneId,
        acquisitionDate: request.endDate,
        cloudPercentage: 12,
        tileId: "T18LTJ",
        collection: SENTINEL2_DEFAULT_COLLECTION,
        platform: "sentinel2",
        systemTimeStart: Date.parse(`${request.endDate}T12:00:00.000Z`),
        metadataSource: "simulated",
        acquisitionFromSystemTime: true,
      },
    ];
  }

  private buildSimulatedReflectance(request: GeeReflectanceRequest): GeeReflectanceRecord {
    const rawAllBands = { B2: 0.05, B3: 0.08, B4: 0.06, B5: 0.09, B8: 0.25, B11: 0.04, SCL: 6 };
    const acquisitionDate = request.endDate;

    return buildReflectanceRecord(request, rawAllBands, acquisitionDate);
  }
}
