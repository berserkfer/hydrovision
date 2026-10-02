/**
 * Copernicus Adapter — fuente de datos Sentinel-2 vía Copernicus Data Space Ecosystem.
 * NO calcula índices espectrales; solo escenas, metadatos y reflectancias.
 * Mismo contrato de salida que GeeAdapter (GeeSceneRecord/GeeReflectanceRecord) para
 * poder reutilizar satellite-observation.builder.ts sin duplicar el cálculo de índices.
 */

import { isCopernicusConfigured, validateCopernicusConfig } from "@/config/copernicus.config";
import { interpretSclPixelQuality } from "@/satellite/quality/pixel-quality";
import type { ITokenProviderLike } from "./copernicus-token-provider.interface";
import { COPERNICUS_SENTINEL2_REFLECTANCE_SELECT } from "./copernicus-expression.builder";
import { HttpCopernicusRestClient, type CopernicusRestClient } from "./copernicus-rest.client";
import {
  extractBandValuesFromCopernicusProcess,
  extractSceneDetailsFromCatalogSearch,
  processCopernicusSurfaceReflectances,
  separateCopernicusReflectanceAndScl,
  systemTimeStartToAcquisitionDateCopernicus,
} from "./copernicus-band.mapper";
import type {
  CopernicusAdapterStatus,
  CopernicusReflectanceRecord,
  CopernicusReflectanceRequest,
  CopernicusSceneRecord,
  CopernicusSceneSearchRequest,
} from "./copernicus.adapter.types";
import { COPERNICUS_SENTINEL2_L2A_COLLECTION } from "./copernicus-expression.builder";

function tileFromSceneId(sceneId: string): string | null {
  const parts = sceneId.split("_");
  return parts.length >= 2 ? parts[1] : null;
}

function buildReflectanceRecord(
  request: CopernicusReflectanceRequest,
  rawAllBands: Record<string, number>,
  acquisitionDate: string
): CopernicusReflectanceRecord {
  const { reflectanceBands, sclRawValue } = separateCopernicusReflectanceAndScl(rawAllBands);
  const processed = processCopernicusSurfaceReflectances(reflectanceBands);
  const pixelQualityStatus = interpretSclPixelQuality(sclRawValue);

  const base: CopernicusReflectanceRecord = {
    sceneId: request.sceneId ?? null,
    acquisitionDate,
    cloudPercentage: request.sceneCloudPercentage ?? null,
    reflectances: processed.reflectances,
    bandsUsed: Object.keys(processed.reflectances) as CopernicusReflectanceRecord["bandsUsed"],
    rawBandValues: processed.rawBandValues,
    reflectanceSemanticStatus: processed.semanticStatus,
    scaleEvidence: processed.scaleEvidence,
    pixelQualityStatus,
    sclRawValue,
    spatialRepresentativeness: "point_sampling",
    systemTimeStart: request.sceneSystemTimeStart ?? null,
  };

  if (processed.semanticStatus !== "valid") {
    return { ...base, reflectances: {}, bandsUsed: [] };
  }

  return base;
}

export class CopernicusAdapter {
  constructor(
    private readonly tokenProvider: ITokenProviderLike,
    private readonly restClient: CopernicusRestClient = new HttpCopernicusRestClient(),
    private readonly isAuthReady: () => boolean = () => true
  ) {}

  getStatus(): CopernicusAdapterStatus {
    const configured = isCopernicusConfigured();
    return {
      isConfigured: configured,
      isLive: configured && this.isAuthReady(),
      authMode: configured ? "oauth_client_credentials" : "simulated",
      message: configured
        ? "Adaptador Copernicus configurado — consulta Sentinel-2 vía Catalog/Process API."
        : "Copernicus no configurado — complete variables COPERNICUS_CLIENT_ID/COPERNICUS_CLIENT_SECRET.",
    };
  }

  getConfigurationSummary(): { isConfigured: boolean; missingEnvKeys: string[] } {
    const validation = validateCopernicusConfig();
    return { isConfigured: validation.isValid, missingEnvKeys: validation.missingVariables };
  }

  async searchSentinel2Scenes(request: CopernicusSceneSearchRequest): Promise<CopernicusSceneRecord[]> {
    if (!isCopernicusConfigured()) {
      return [];
    }

    const token = await this.tokenProvider.getAccessToken();
    if (token.source === "simulated") {
      return this.buildSimulatedScenes(request);
    }

    const response = await this.restClient.searchCatalog(request, token);
    const details = extractSceneDetailsFromCatalogSearch(response);

    return details
      .sort((a, b) => (b.systemTimeStart ?? 0) - (a.systemTimeStart ?? 0))
      .slice(0, request.limit ?? 20)
      .map((row) => {
        const acquisitionFromSystemTime = row.systemTimeStart !== null;
        const acquisitionDate = acquisitionFromSystemTime
          ? systemTimeStartToAcquisitionDateCopernicus(row.systemTimeStart)
          : request.endDate;

        return {
          sceneId: row.sceneId,
          systemIndex: row.systemIndex,
          acquisitionDate,
          cloudPercentage: row.cloudPercentage,
          tileId: tileFromSceneId(row.sceneId),
          collection: COPERNICUS_SENTINEL2_L2A_COLLECTION,
          platform: "sentinel2" as const,
          systemTimeStart: row.systemTimeStart,
          metadataSource: row.cloudPercentage !== null ? "copernicus_live" : "partial",
          acquisitionFromSystemTime,
        };
      });
  }

  async getReflectanceAtPoint(
    request: CopernicusReflectanceRequest
  ): Promise<CopernicusReflectanceRecord | null> {
    if (!isCopernicusConfigured()) {
      return null;
    }

    const token = await this.tokenProvider.getAccessToken();
    if (token.source === "simulated") {
      return this.buildSimulatedReflectance(request);
    }

    const acquisitionDate =
      request.sceneSystemTimeStart !== null && request.sceneSystemTimeStart !== undefined
        ? systemTimeStartToAcquisitionDateCopernicus(request.sceneSystemTimeStart)
        : request.endDate;

    const response = await this.restClient.process(request, token);
    const rawAllBands = extractBandValuesFromCopernicusProcess(
      response,
      COPERNICUS_SENTINEL2_REFLECTANCE_SELECT
    );

    if (Object.keys(rawAllBands).length === 0) {
      return null;
    }

    return buildReflectanceRecord(request, rawAllBands, acquisitionDate);
  }

  private buildSimulatedScenes(request: CopernicusSceneSearchRequest): CopernicusSceneRecord[] {
    const sceneId = `sim-cdse-s2-${request.endDate.replace(/-/g, "")}`;
    return [
      {
        sceneId,
        systemIndex: sceneId,
        acquisitionDate: request.endDate,
        cloudPercentage: 12,
        tileId: "T18LTJ",
        collection: COPERNICUS_SENTINEL2_L2A_COLLECTION,
        platform: "sentinel2",
        systemTimeStart: Date.parse(`${request.endDate}T12:00:00.000Z`),
        metadataSource: "simulated",
        acquisitionFromSystemTime: true,
      },
    ];
  }

  private buildSimulatedReflectance(
    request: CopernicusReflectanceRequest
  ): CopernicusReflectanceRecord {
    const rawAllBands = { B03: 0.08, B04: 0.06, B05: 0.09, B08: 0.25, B11: 0.04, SCL: 6 };
    return buildReflectanceRecord(request, rawAllBands, request.endDate);
  }
}
