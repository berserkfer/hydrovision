/**
 * ScientificCalibrationService — auditoría y calibración exploratoria bajo demanda.
 * Sin persistencia Prisma, sin ML, sin GEE en tests unitarios.
 */

import { isGeeIntegrationEnabled } from "@/config/gee-integration.config";
import { isMonitoringDatabaseEnabled } from "@/config/monitoring-data-source.config";
import { getDataStore } from "@/data/store-access";
import { CANDIDATE_RELATIONSHIPS } from "@/satellite/catalog/comparability.catalog";
import type { SpectralIndexCode } from "@/satellite/catalog/spectral-indices.catalog";
import {
  MIN_EXPLORATORY_READINESS_DISCLAIMER,
} from "@/satellite/config/calibration-readiness.config";
import {
  buildScientificDatasetAuditReport,
  getCalibrationCandidateParameters,
  type AuditContext,
} from "@/satellite/calibration/scientific-dataset-audit";
import {
  evaluateParameterReadiness,
  isReadinessSufficientForCalibration,
} from "@/satellite/calibration/calibration-readiness";
import { runExploratoryCalibration } from "@/satellite/calibration/exploratory-calibration";
import {
  isValidationSuccessful,
  validateCalibrationModel,
  toCalibrationValidationExportRow,
} from "@/satellite/calibration/calibration-model-validation";
import {
  MIN_EXPLORATORY_VALIDATION_DISCLAIMER,
} from "@/satellite/config/calibration-validation.config";
import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";
import type {
  CalibrationAuditResponse,
  CalibrationInsufficientDataResponse,
  CalibrationReadinessResult,
  CalibrationReadinessStatus,
  CalibrationRunRequest,
  CalibrationRunSuccessResponse,
  CalibrationValidateInsufficientResponse,
  CalibrationValidateSuccessResponse,
  ExploratoryValidationStatus,
} from "@/satellite/types/scientific-calibration.types";
import {
  buildScientificFieldSatellitePairs,
} from "../validation/scientific-dataset.builder";
import { fieldSatelliteValidationService } from "../validation/field-satellite-validation.service";

export interface CalibrationQuery {
  stationId: string;
  fechaInicio?: string;
  fechaFin?: string;
  parameterCode?: ParametroCodigoDb;
  useGee?: boolean;
}

export class CalibrationInsufficientDataError extends Error {
  readonly status: CalibrationInsufficientDataResponse["status"];
  readonly payload: CalibrationInsufficientDataResponse;

  constructor(payload: CalibrationInsufficientDataResponse) {
    super(payload.message);
    this.name = "CalibrationInsufficientDataError";
    this.status = payload.status;
    this.payload = payload;
  }
}

export class CalibrationValidateInsufficientError extends Error {
  readonly status: ExploratoryValidationStatus | CalibrationReadinessStatus;
  readonly payload: CalibrationValidateInsufficientResponse;

  constructor(payload: CalibrationValidateInsufficientResponse) {
    super(payload.message);
    this.name = "CalibrationValidateInsufficientError";
    this.status = payload.status;
    this.payload = payload;
  }
}

async function loadAuditContext(query: CalibrationQuery): Promise<AuditContext> {
  if (isMonitoringDatabaseEnabled()) {
    const { prisma } = await import("@/server/db");
    const muestreos = await prisma.muestreo.findMany({
      where: { puntoMonitoreoId: query.stationId },
      select: { id: true, campanaId: true },
    });
    const campaignCount = new Set(muestreos.map((m) => m.campanaId)).size;
    const measurementCount = await prisma.measurement.count({
      where: {
        muestreoId: { in: muestreos.map((m) => m.id) },
        estado: "active",
      },
    });
    return { campaignCount, measurementCount };
  }

  const store = getDataStore();
  const muestras = store.muestras.filter((m) => m.estacionId === query.stationId);
  return {
    campaignCount: new Set(muestras.map((m) => m.campanaId)).size,
    measurementCount: muestras.length,
  };
}

function buildReadinessMap(
  allPairs: ReturnType<typeof buildScientificFieldSatellitePairs>,
  parameterCode?: ParametroCodigoDb
): CalibrationAuditResponse["readiness"] {
  const realAccepted = allPairs.filter(
    (p) => !p.isSimulated && p.qualityStatus === "accepted"
  );

  const candidateParams = parameterCode
    ? [parameterCode]
    : getCalibrationCandidateParameters();

  const perParameter: Partial<Record<ParametroCodigoDb, CalibrationReadinessResult>> = {};
  for (const code of candidateParams) {
    perParameter[code] = evaluateParameterReadiness(realAccepted, code);
  }

  const audit = buildScientificDatasetAuditReport(allPairs);

  return {
    overall: audit.calibrationReadiness,
    ...perParameter,
  } as CalibrationAuditResponse["readiness"];
}

export class ScientificCalibrationService {
  async audit(query: CalibrationQuery): Promise<CalibrationAuditResponse> {
    const validation = await fieldSatelliteValidationService.validate({
      stationId: query.stationId,
      fechaInicio: query.fechaInicio,
      fechaFin: query.fechaFin,
      parameterCode: query.parameterCode,
      useGee: query.useGee,
    });

    const allPairs = buildScientificFieldSatellitePairs(validation.comparisons);
    const context = await loadAuditContext(query);
    const audit = buildScientificDatasetAuditReport(allPairs, context);

    return {
      audit,
      readiness: buildReadinessMap(allPairs, query.parameterCode),
      candidateParameters: getCalibrationCandidateParameters(),
      meta: {
        scientificStatus: "descriptive_only",
        dataSource: validation.meta.dataSource,
        isSimulated: validation.meta.isSimulated,
        geeConnected: isGeeIntegrationEnabled(),
        readinessCriteriaDisclaimer: MIN_EXPLORATORY_READINESS_DISCLAIMER,
      },
    };
  }

  async run(request: CalibrationRunRequest & { stationId: string; useGee?: boolean }) {
    const validation = await fieldSatelliteValidationService.validate({
      stationId: request.stationId,
      fechaInicio: request.fechaInicio,
      fechaFin: request.fechaFin,
      parameterCode: request.parameterCode,
      useGee: request.useGee,
    });

    const allPairs = buildScientificFieldSatellitePairs(validation.comparisons);
    const context = await loadAuditContext({
      stationId: request.stationId,
      fechaInicio: request.fechaInicio,
      fechaFin: request.fechaFin,
    });
    const audit = buildScientificDatasetAuditReport(allPairs, context);

    const result = runExploratoryCalibration({
      pairs: allPairs,
      parameterCode: request.parameterCode,
      predictorIndex: request.predictorIndex,
    });

    const meta = {
      scientificStatus: "exploratory_calibration" as const,
      dataSource: validation.meta.dataSource,
      isSimulated: validation.meta.isSimulated,
      geeConnected: isGeeIntegrationEnabled(),
      readinessCriteriaDisclaimer: MIN_EXPLORATORY_READINESS_DISCLAIMER,
    };

    if (!result.model || !isReadinessSufficientForCalibration(result.readiness.status)) {
      throw new CalibrationInsufficientDataError({
        status: result.readiness.status,
        message:
          result.message ??
          result.readiness.reasons.join("; ") ??
          "INSUFFICIENT_REAL_DATA",
        audit,
        readiness: result.readiness,
        scientificStatus: "descriptive_only",
      });
    }

    const response: CalibrationRunSuccessResponse = {
      model: result.model,
      audit,
      meta: {
        ...meta,
        scientificStatus: "exploratory_calibration",
      },
    };

    return response;
  }

  async validate(
    request: CalibrationRunRequest & { stationId: string; useGee?: boolean }
  ): Promise<CalibrationValidateSuccessResponse> {
    const validation = await fieldSatelliteValidationService.validate({
      stationId: request.stationId,
      fechaInicio: request.fechaInicio,
      fechaFin: request.fechaFin,
      parameterCode: request.parameterCode,
      useGee: request.useGee,
    });

    const allPairs = buildScientificFieldSatellitePairs(validation.comparisons);
    const context = await loadAuditContext({
      stationId: request.stationId,
      fechaInicio: request.fechaInicio,
      fechaFin: request.fechaFin,
    });
    const audit = buildScientificDatasetAuditReport(allPairs, context);
    const isSimulatedDataset = validation.meta.isSimulated || validation.meta.dataSource === "mock";

    if (isSimulatedDataset) {
      throw new CalibrationValidateInsufficientError({
        status: "SIMULATED_DATA",
        message: "Datos simulados — no se ejecuta validación científica sobre mock",
        validation: null,
        audit,
        scientificStatus: "descriptive_only",
      });
    }

    const calibrationResult = runExploratoryCalibration({
      pairs: allPairs,
      parameterCode: request.parameterCode,
      predictorIndex: request.predictorIndex,
    });

    if (!calibrationResult.model || !isReadinessSufficientForCalibration(calibrationResult.readiness.status)) {
      throw new CalibrationValidateInsufficientError({
        status: "INSUFFICIENT_VALIDATION_DATA",
        message:
          calibrationResult.message ??
          calibrationResult.readiness.reasons.join("; ") ??
          "INSUFFICIENT_REAL_DATA",
        validation: null,
        audit,
        scientificStatus: "descriptive_only",
      });
    }

    const validationResult = validateCalibrationModel({
      model: calibrationResult.model,
      pairs: allPairs,
      isSimulatedDataset: false,
    });

    if (!isValidationSuccessful(validationResult.validationStatus)) {
      throw new CalibrationValidateInsufficientError({
        status: validationResult.validationStatus,
        message: validationResult.warnings.join("; ") || validationResult.validationStatus,
        validation: validationResult,
        audit,
        scientificStatus: "descriptive_only",
      });
    }

    return {
      model: calibrationResult.model,
      validation: validationResult,
      audit,
      scientificStatus: "validated_exploratory",
      meta: {
        scientificStatus: "validated_exploratory",
        isSimulated: false,
        dataSource: validation.meta.dataSource,
        geeConnected: isGeeIntegrationEnabled(),
        validationCriteriaDisclaimer: MIN_EXPLORATORY_VALIDATION_DISCLAIMER,
      },
      disclaimer: validationResult.disclaimer,
    };
  }

  toValidationExportRow(
    model: CalibrationValidateSuccessResponse["model"],
    validation: CalibrationValidateSuccessResponse["validation"]
  ) {
    return toCalibrationValidationExportRow(model, validation);
  }

  /** Valida que el índice predictor sea candidato según comparability.catalog */
  isPredictorCandidate(
    parameterCode: ParametroCodigoDb,
    predictorIndex: SpectralIndexCode
  ): boolean {
    return CANDIDATE_RELATIONSHIPS.some(
      (r) =>
        r.fieldParameterCode === parameterCode &&
        r.potentialExplanatoryIndices.includes(predictorIndex)
    );
  }
}

export const scientificCalibrationService = new ScientificCalibrationService();
