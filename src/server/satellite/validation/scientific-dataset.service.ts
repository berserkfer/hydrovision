/**
 * ScientificDatasetService — construye dataset científico bajo demanda.
 * Reutiliza FieldSatelliteValidationService — sin persistencia Prisma.
 */

import { isGeeIntegrationEnabled } from "@/config/gee-integration.config";
import { evaluateParameterReadiness } from "@/satellite/calibration/calibration-readiness";
import {
  buildScientificDatasetQualityReport,
  DATASET_READINESS_PARAMETERS,
  type PairTraceabilityFields,
} from "@/satellite/quality/dataset-quality-metrics";
import { SCIENTIFIC_DATASET_DISCLAIMER } from "@/satellite/types/scientific-dataset.types";
import type {
  ParameterDatasetReadinessSummary,
  ScientificDatasetResponse,
  ScientificFieldSatellitePair,
} from "@/satellite/types/scientific-dataset.types";
import { geeEmpiricalVerificationService } from "@/server/gee/gee-empirical-verification.service";
import {
  buildScientificDatasetSummary,
  buildScientificFieldSatellitePairs,
  evaluateAllComparisonQualities,
  filterPairsByIncludeSimulated,
  toScientificDatasetExportRow,
} from "./scientific-dataset.builder";
import {
  fieldSatelliteValidationService,
  type ValidationQuery,
} from "./field-satellite-validation.service";

export interface DatasetQuery extends ValidationQuery {
  includeSimulated?: boolean;
  includeGeeVerification?: boolean;
}

function buildTraceabilityMap(
  comparisons: Awaited<
    ReturnType<typeof fieldSatelliteValidationService.validate>
  >["comparisons"],
  pairs: ScientificFieldSatellitePair[]
): Map<string, PairTraceabilityFields> {
  const map = new Map<string, PairTraceabilityFields>();

  for (const pair of pairs) {
    const comparison = comparisons.find(
      (c) =>
        c.field.sampleId === pair.fieldSampleId &&
        c.field.parameterCode === pair.parameterCode
    );
    map.set(pair.id, {
      cloudPercentage: comparison?.satellite.cloudPercentage ?? null,
      reflectanceSemanticStatus: comparison?.satellite.reflectanceSemanticStatus ?? null,
      pixelQualityStatus: comparison?.satellite.pixelQualityStatus ?? null,
    });
  }

  return map;
}

function buildParameterReadinessSummaries(
  realAccepted: ScientificFieldSatellitePair[]
): ParameterDatasetReadinessSummary[] {
  return DATASET_READINESS_PARAMETERS.map((parameterCode) => {
    const paramPairs = realAccepted.filter((p) => p.parameterCode === parameterCode);
    const readiness = evaluateParameterReadiness(realAccepted, parameterCode);
    const stations = new Set(paramPairs.map((p) => p.stationId)).size;
    const months = new Set(paramPairs.map((p) => p.fieldDate.slice(0, 7))).size;
    const acceptedRate =
      realAccepted.length > 0 ? paramPairs.length / realAccepted.length : 0;

    return {
      parameterCode,
      realAcceptedPairs: paramPairs.length,
      stations,
      temporalPeriods: months,
      acceptedRate: Number(acceptedRate.toFixed(4)),
      readinessStatus: readiness.status,
      meetsMinimumExploratoryCriteria: readiness.meetsMinimumExploratoryCriteria,
    };
  });
}

export class ScientificDatasetService {
  async buildDataset(query: DatasetQuery): Promise<ScientificDatasetResponse> {
    const includeSimulated = query.includeSimulated ?? false;

    const validation = await fieldSatelliteValidationService.validate({
      stationId: query.stationId,
      fechaInicio: query.fechaInicio,
      fechaFin: query.fechaFin,
      parameterCode: query.parameterCode,
      useGee: query.useGee,
    });

    const allPairs = buildScientificFieldSatellitePairs(
      validation.comparisons,
      validation.matches
    );

    const { included, excludedSimulatedCount } = filterPairsByIncludeSimulated(
      allPairs,
      includeSimulated
    );

    const allQualityStatuses = evaluateAllComparisonQualities(validation.comparisons);

    const summary = buildScientificDatasetSummary(
      allPairs,
      included,
      excludedSimulatedCount,
      allQualityStatuses
    );

    const hasRealPairs = allPairs.some((p) => !p.isSimulated);
    const realAccepted = allPairs.filter(
      (p) => !p.isSimulated && p.qualityStatus === "accepted"
    );

    const traceabilityByPairId = buildTraceabilityMap(validation.comparisons, allPairs);

    const qualityReport = buildScientificDatasetQualityReport({
      pairs: allPairs,
      totalFieldSamples: validation.summary.totalFieldSamples,
      totalSatelliteObservations: validation.summary.totalSatelliteObservations,
      totalCandidateMatches: allPairs.length,
      traceabilityByPairId,
    });

    const parameterReadiness = buildParameterReadinessSummaries(realAccepted);

    const geeVerification =
      query.includeGeeVerification === true
        ? await geeEmpiricalVerificationService.runVerification({
            stationId: query.stationId,
            fechaInicio: query.fechaInicio,
            fechaFin: query.fechaFin,
          })
        : undefined;

    return {
      pairs: included,
      summary,
      meta: {
        scientificStatus: "descriptive_only",
        isSimulated: validation.meta.isSimulated || !hasRealPairs,
        dataSource: validation.meta.dataSource,
        geeConnected: isGeeIntegrationEnabled(),
        geeLive: validation.meta.geeLive,
        includeSimulated,
        disclaimer: SCIENTIFIC_DATASET_DISCLAIMER,
      },
      qualityReport,
      parameterReadiness,
      geeVerification,
    };
  }

  toExportRows(pairs: ScientificFieldSatellitePair[]) {
    return pairs.map(toScientificDatasetExportRow);
  }
}

export const scientificDatasetService = new ScientificDatasetService();
