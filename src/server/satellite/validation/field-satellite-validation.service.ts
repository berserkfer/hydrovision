/**
 * FieldSatelliteValidationService — enlace descriptivo campo ↔ Sentinel-2.
 * NO calcula regresiones, NO modifica ECA/Risk, NO entrena modelos.
 */

import { isMonitoringDatabaseEnabled } from "@/config/monitoring-data-source.config";
import { isCopernicusIntegrationEnabled } from "@/config/copernicus-integration.config";
import { isPlanetaryComputerEnabled } from "@/config/planetary-computer.config";
import { MATCHING_CRITERIA_SUMMARY } from "@/satellite/config/matching.config";
import { getCandidateRelationshipsForParameter } from "@/satellite/catalog/comparability.catalog";
import {
  matchAllFieldToSatellite,
  type MatchableSatelliteObservation,
} from "@/satellite/matching/field-satellite-matching";
import type { FieldSatelliteMatch } from "@/satellite/types/field-satellite-match.types";
import {
  DESCRIPTIVE_ONLY_DISCLAIMER,
  NO_PREDICTION_DISCLAIMER,
  type FieldSatelliteComparison,
  type FieldSatelliteScientificStatus,
} from "@/satellite/types/field-satellite-comparison.types";
import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";
import type { SatelliteObservation } from "@/satellite/types/satellite-observation.types";
import { satelliteService } from "../satellite.service";
import {
  filterParametersByCode,
  loadFieldMeasurementsForMatching,
} from "./field-measurement.loader";

export interface ValidationQuery {
  stationId: string;
  fechaInicio?: string;
  fechaFin?: string;
  parameterCode?: ParametroCodigoDb;
  useGee?: boolean;
  useCopernicus?: boolean;
  usePlanetaryComputer?: boolean;
}

export interface ValidationSummary {
  totalFieldSamples: number;
  totalSatelliteObservations: number;
  matched: number;
  temporalMismatch: number;
  spatialMismatch: number;
  missingSatellite: number;
  missingField: number;
  insufficientData: number;
  comparisonsGenerated: number;
}

export interface ValidationApiMeta {
  dataSource: "database" | "mock";
  geeConnected: boolean;
  geeLive: boolean;
  copernicusConnected: boolean;
  copernicusLive: boolean;
  planetaryConnected: boolean;
  planetaryLive: boolean;
  isSimulated: boolean;
  matchingCriteria: typeof MATCHING_CRITERIA_SUMMARY;
  scientificStatus: FieldSatelliteScientificStatus;
  disclaimers: string[];
}

export interface ValidationResponse {
  matches: FieldSatelliteMatch[];
  comparisons: FieldSatelliteComparison[];
  summary: ValidationSummary;
  meta: ValidationApiMeta;
}

function observationToMatchable(obs: SatelliteObservation): MatchableSatelliteObservation {
  return {
    observationId: obs.id,
    sceneId: obs.sceneId,
    stationId: obs.stationId,
    acquisitionDate: obs.acquisitionDate,
    isSimulated: obs.isSimulated,
  };
}

function buildComparisons(
  matches: FieldSatelliteMatch[],
  parameters: Awaited<ReturnType<typeof loadFieldMeasurementsForMatching>>["parameters"],
  observations: SatelliteObservation[],
  parameterFilter?: ParametroCodigoDb
): FieldSatelliteComparison[] {
  const comparisons: FieldSatelliteComparison[] = [];
  const filteredParams = filterParametersByCode(parameters, parameterFilter);

  for (const param of filteredParams) {
    const match = matches.find((m) => m.fieldSampleId === param.sampleId);
    if (!match) continue;

    const obs =
      match.satelliteObservationId !== null
        ? observations.find((o) => o.id === match.satelliteObservationId) ?? null
        : null;

    let scientificStatus: FieldSatelliteScientificStatus = "descriptive_only";
    if (match.matchingStatus === "insufficient_data") {
      scientificStatus = "insufficient_data";
    } else if (match.matchingStatus === "missing_satellite" || param.value === null) {
      scientificStatus = "not_available";
    }

    const candidateRelationships = getCandidateRelationshipsForParameter(param.parameterCode).map(
      (c) => ({
        fieldParameterCode: c.fieldParameterCode,
        potentialExplanatoryIndices: c.potentialExplanatoryIndices,
        relationshipKind: "candidate_relationship" as const,
        disclaimer: c.disclaimer,
      })
    );

    comparisons.push({
      stationId: param.stationId,
      field: {
        parameterCode: param.parameterCode,
        value: param.value,
        unit: param.unit,
        date: param.date.slice(0, 10),
        sampleId: param.sampleId,
        sourceType: "field",
        isSimulated: param.isSimulated,
      },
      satellite: {
        acquisitionDate: obs?.acquisitionDate ?? match.satelliteAcquisitionDate,
        sceneId: obs?.sceneId ?? match.satelliteSceneId,
        observationId: obs?.id ?? match.satelliteObservationId,
        indices: obs?.indices ?? {},
        cloudPercentage: obs?.cloudPercentage ?? null,
        reflectanceSemanticStatus: obs?.quality.reflectanceSemanticStatus ?? null,
        pixelQualityStatus: obs?.quality.pixelQualityStatus ?? null,
        spatialRepresentativeness: obs?.quality.spatialRepresentativeness ?? "point_sampling",
        collection: obs?.collection ?? null,
        tileId: obs?.quality.tileId ?? null,
        systemTimeStart: obs?.quality.systemTimeStart ?? null,
        provider: obs?.provider,
        sourceType: "satellite",
        isSimulated: obs?.isSimulated ?? match.isSimulated,
      },
      matching: {
        status: match.matchingStatus,
        temporalDifferenceDays: match.temporalDifferenceDays,
        distanceMeters: match.distanceMeters,
        operationallyCompatible: match.operationallyCompatible,
      },
      candidateRelationships,
      scientificStatus,
      disclaimers: [DESCRIPTIVE_ONLY_DISCLAIMER, NO_PREDICTION_DISCLAIMER],
    });
  }

  return comparisons;
}

function buildSummary(
  matches: FieldSatelliteMatch[],
  fieldSampleCount: number,
  satelliteCount: number,
  comparisonCount: number
): ValidationSummary {
  return {
    totalFieldSamples: fieldSampleCount,
    totalSatelliteObservations: satelliteCount,
    matched: matches.filter((m) => m.matchingStatus === "matched").length,
    temporalMismatch: matches.filter((m) => m.matchingStatus === "temporal_mismatch").length,
    spatialMismatch: matches.filter((m) => m.matchingStatus === "spatial_mismatch").length,
    missingSatellite: matches.filter((m) => m.matchingStatus === "missing_satellite").length,
    missingField: matches.filter((m) => m.matchingStatus === "missing_field").length,
    insufficientData: matches.filter((m) => m.matchingStatus === "insufficient_data").length,
    comparisonsGenerated: comparisonCount,
  };
}

export class FieldSatelliteValidationService {
  async validate(query: ValidationQuery): Promise<ValidationResponse> {
    const fieldData = await loadFieldMeasurementsForMatching({
      stationId: query.stationId,
      fechaInicio: query.fechaInicio,
      fechaFin: query.fechaFin,
      parameterCode: query.parameterCode,
    });

    const observationsResult = await satelliteService.listObservations({
      stationId: query.stationId,
      fechaInicio: query.fechaInicio,
      fechaFin: query.fechaFin,
      useCopernicus: query.useCopernicus,
      useGee: query.useGee,
      usePlanetaryComputer: query.usePlanetaryComputer,
    });
    const observations = observationsResult.observations;
    // satelliteService ya decide y reporta honestamente qué proveedor sirvió el dato
    // (puede no coincidir con lo pedido si ese proveedor no devolvió nada — ver satellite.service.ts).
    const satMeta = observationsResult.meta;

    const matchableObs = observations.map(observationToMatchable);
    const isSimulated =
      fieldData.isSimulated || observations.every((o) => o.isSimulated) || observations.length === 0;

    let matches: FieldSatelliteMatch[] = [];

    if (fieldData.samples.length === 0) {
      matches = [];
    } else if (matchableObs.length === 0) {
      matches = fieldData.samples.map((sample) => ({
        stationId: sample.stationId,
        fieldSampleId: sample.sampleId,
        satelliteObservationId: null,
        satelliteSceneId: null,
        fieldDate: sample.date.slice(0, 10),
        satelliteAcquisitionDate: null,
        temporalDifferenceDays: null,
        distanceMeters: null,
        matchingStatus: "missing_satellite" as const,
        sourceTypeField: "field" as const,
        sourceTypeSatellite: "satellite" as const,
        operationallyCompatible: false,
        isSimulated,
      }));
    } else {
      matches = matchAllFieldToSatellite(fieldData.samples, matchableObs, isSimulated);
    }

    const comparisons = buildComparisons(
      matches,
      fieldData.parameters,
      observations,
      query.parameterCode
    );

    // isSimulated combina campo + satélite: si CUALQUIERA de los dos lados es simulado/ausente,
    // el par completo se reporta como simulado (igual que antes, ahora también cubre Planetary).
    const resolvedIsSimulated = fieldData.isSimulated || satMeta.isSimulated;

    return {
      matches,
      comparisons,
      summary: buildSummary(
        matches,
        fieldData.samples.length,
        observations.length,
        comparisons.length
      ),
      meta: {
        dataSource: isMonitoringDatabaseEnabled() ? "database" : "mock",
        geeConnected: satMeta.geeConnected,
        geeLive: satMeta.geeLive ?? false,
        copernicusConnected: satMeta.copernicusConnected ?? isCopernicusIntegrationEnabled(),
        copernicusLive: satMeta.copernicusLive ?? false,
        planetaryConnected: satMeta.planetaryConnected ?? isPlanetaryComputerEnabled(),
        planetaryLive: satMeta.planetaryLive ?? false,
        isSimulated: resolvedIsSimulated,
        matchingCriteria: MATCHING_CRITERIA_SUMMARY,
        scientificStatus: "descriptive_only",
        disclaimers: [DESCRIPTIVE_ONLY_DISCLAIMER, NO_PREDICTION_DISCLAIMER],
      },
    };
  }
}

export const fieldSatelliteValidationService = new FieldSatelliteValidationService();
