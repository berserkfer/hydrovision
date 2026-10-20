/**
 * PredictionService — orquesta readiness → calibración → validación (ya existentes) y añade
 * una predicción puntual + incertidumbre heurística para la observación satelital más reciente.
 *
 * NO entrena nada nuevo: reutiliza scientificCalibrationService.validate() (readiness,
 * split temporal, regresión lineal, validación) tal cual. Solo agrega:
 *   1. Bloqueo duro de parámetros no ópticamente plausibles (antes de cualquier otro chequeo).
 *   2. Resolución de la observación satelital más reciente (Copernicus → GEE → almacenado).
 *   3. Cálculo del valor predicho + banda de incertidumbre ±RMSE (rotulada como heurística).
 * Nunca fabrica un valor si no hay modelo validado u observación disponible.
 */

import { PARAMETRO_CATALOG_BY_CODIGO } from "@/database/constants/parametros-catalog";
import { getCandidateRelationshipsForParameter } from "@/satellite/catalog/comparability.catalog";
import {
  isOpticallyPlausibleTarget,
  NON_OPTICALLY_PLAUSIBLE_DISCLAIMER,
  OPTICALLY_PLAUSIBLE_MODELING_TARGETS,
} from "@/satellite/config/optically-plausible-parameters.config";
import { predictLinear } from "@/satellite/calibration/linear-regression";
import { isCopernicusIntegrationEnabled } from "@/config/copernicus-integration.config";
import { isGeeIntegrationEnabled } from "@/config/gee-integration.config";
import { isPlanetaryComputerEnabled } from "@/config/planetary-computer.config";
import { applyLiteratureModel } from "@/satellite/literature-models/literature-model-registry";
import type { SatelliteObservation } from "@/satellite/types/satellite-observation.types";
import type { ScientificDatasetAuditReport } from "@/satellite/types/scientific-calibration.types";
import {
  CalibrationValidateInsufficientError,
  scientificCalibrationService,
} from "../calibration/scientific-calibration.service";
import { satelliteService } from "../satellite.service";
import {
  PREDICTION_DISCLAIMERS,
  UNCERTAINTY_HEURISTIC_METHOD_LABEL,
  type PredictionInsufficientPayload,
  type PredictionInsufficientStatus,
  type PredictionLiteratureModelResult,
  type PredictionRequest,
  type PredictionSampleSizeReport,
  type PredictionSuccessResult,
} from "./prediction.types";

export class PredictionInsufficientDataError extends Error {
  readonly payload: PredictionInsufficientPayload;

  constructor(payload: PredictionInsufficientPayload) {
    super(payload.message);
    this.name = "PredictionInsufficientDataError";
    this.payload = payload;
  }
}

function emptySampleSize(
  parameterCode: PredictionRequest["parameterCode"]
): PredictionSampleSizeReport {
  return {
    parameterCode,
    realPairs: 0,
    acceptedRealPairs: 0,
    simulatedPairs: 0,
    trainingSampleCount: null,
    validationSampleCount: null,
  };
}

function sampleSizeFromAudit(
  audit: ScientificDatasetAuditReport,
  parameterCode: PredictionRequest["parameterCode"]
): PredictionSampleSizeReport {
  const coverage = audit.parameterCoverage.find((p) => p.parameterCode === parameterCode);
  return {
    parameterCode,
    realPairs: coverage?.realPairs ?? 0,
    acceptedRealPairs: coverage?.acceptedRealPairs ?? 0,
    simulatedPairs: coverage?.simulatedPairs ?? 0,
    trainingSampleCount: null,
    validationSampleCount: null,
  };
}

function fail(payload: {
  status: PredictionInsufficientStatus;
  message: string;
  stationId: string;
  parameterCode: PredictionRequest["parameterCode"];
  sampleSize: PredictionSampleSizeReport;
  audit?: ScientificDatasetAuditReport;
}): never {
  throw new PredictionInsufficientDataError({ ...payload, scientificStatus: "descriptive_only" });
}

function sortByAcquisitionDateDesc(observations: SatelliteObservation[]): SatelliteObservation[] {
  return [...observations].sort((a, b) => b.acquisitionDate.localeCompare(a.acquisitionDate));
}

interface ResolvedObservation {
  observation: SatelliteObservation;
  provider: "copernicus" | "gee" | "planetary" | "database" | "mock";
}

function providerFromMeta(providerStatus: string, dataSource: "database" | "mock"): ResolvedObservation["provider"] {
  if (providerStatus === "copernicus") return "copernicus";
  if (providerStatus === "gee") return "gee";
  if (providerStatus === "planetary_computer") return "planetary";
  return dataSource === "database" ? "database" : "mock";
}

/**
 * Selección de proveedor para la observación satelital más reciente:
 *  - Con un flag explícito único (useCopernicus=true xor useGee=true) → solo ese proveedor
 *    (con su propio fallback interno a Planetary Computer — ver satellite.service.ts), y
 *    fallback a lo almacenado si nada devuelve datos.
 *  - Sin flags, o con ambos → intenta Copernicus, luego GEE, y siempre intenta Planetary
 *    Computer al final (no requiere configuración, siempre disponible) antes de caer a lo
 *    almacenado. `providerFromMeta` reporta el proveedor REAL que sirvió el dato, nunca el
 *    que se pidió si la respuesta realmente vino de otro (evita atribuir mal el origen).
 * Nunca fabrica una observación: si ningún proveedor devuelve datos, retorna null.
 */
async function resolveLatestObservation(
  request: PredictionRequest
): Promise<ResolvedObservation | null> {
  const explicitCopernicusOnly = request.useCopernicus === true && request.useGee !== true;
  const explicitGeeOnly = request.useGee === true && request.useCopernicus !== true;

  const tryCopernicus = !explicitGeeOnly && isCopernicusIntegrationEnabled();
  const tryGee = !explicitCopernicusOnly && isGeeIntegrationEnabled();

  if (tryCopernicus) {
    const result = await satelliteService.listObservations({
      stationId: request.stationId,
      fechaInicio: request.fechaInicio,
      fechaFin: request.fechaFin,
      useCopernicus: true,
    });
    const sorted = sortByAcquisitionDateDesc(result.observations);
    if (sorted.length > 0) {
      return { observation: sorted[0], provider: providerFromMeta(result.meta.providerStatus, result.meta.dataSource) };
    }
  }

  if (tryGee) {
    const result = await satelliteService.listObservations({
      stationId: request.stationId,
      fechaInicio: request.fechaInicio,
      fechaFin: request.fechaFin,
      useGee: true,
    });
    const sorted = sortByAcquisitionDateDesc(result.observations);
    if (sorted.length > 0) {
      return { observation: sorted[0], provider: providerFromMeta(result.meta.providerStatus, result.meta.dataSource) };
    }
  }

  if (isPlanetaryComputerEnabled()) {
    const result = await satelliteService.listObservations({
      stationId: request.stationId,
      fechaInicio: request.fechaInicio,
      fechaFin: request.fechaFin,
      usePlanetaryComputer: true,
    });
    const sorted = sortByAcquisitionDateDesc(result.observations);
    if (sorted.length > 0) {
      return { observation: sorted[0], provider: providerFromMeta(result.meta.providerStatus, result.meta.dataSource) };
    }
  }

  const stored = await satelliteService.listObservations({
    stationId: request.stationId,
    fechaInicio: request.fechaInicio,
    fechaFin: request.fechaFin,
  });
  const sortedStored = sortByAcquisitionDateDesc(stored.observations);
  if (sortedStored.length === 0) return null;

  return {
    observation: sortedStored[0],
    provider: stored.meta.dataSource === "database" ? "database" : "mock",
  };
}

export class PredictionService {
  async predict(
    request: PredictionRequest
  ): Promise<PredictionSuccessResult | PredictionLiteratureModelResult> {
    const { stationId, parameterCode } = request;

    // 1. Bloqueo duro — antes de CUALQUIER otro chequeo, sin excepción.
    if (!isOpticallyPlausibleTarget(parameterCode)) {
      fail({
        status: "NOT_OPTICALLY_PLAUSIBLE",
        message: NON_OPTICALLY_PLAUSIBLE_DISCLAIMER,
        stationId,
        parameterCode,
        sampleSize: emptySampleSize(parameterCode),
      });
    }

    if (!OPTICALLY_PLAUSIBLE_MODELING_TARGETS.includes(parameterCode)) {
      fail({
        status: "MODELING_TARGET_NOT_ENABLED",
        message:
          `"${parameterCode}" no está habilitado como target de modelado satelital en este proyecto ` +
          `(falta validación exploratoria suficiente o no existe medición de campo equivalente). ` +
          `Parámetros habilitados hoy: ${OPTICALLY_PLAUSIBLE_MODELING_TARGETS.join(", ")}.`,
        stationId,
        parameterCode,
        sampleSize: emptySampleSize(parameterCode),
      });
    }

    const predictorIndex =
      request.predictorIndex ??
      getCandidateRelationshipsForParameter(parameterCode)[0]?.potentialExplanatoryIndices[0];

    if (!predictorIndex) {
      fail({
        status: "INSUFFICIENT_PARAMETER_COVERAGE",
        message: `No hay índice espectral candidato registrado para ${parameterCode} en comparability.catalog.`,
        stationId,
        parameterCode,
        sampleSize: emptySampleSize(parameterCode),
      });
    }

    // 2. Reutiliza readiness + split temporal + regresión lineal + validación existentes.
    let validated: Awaited<ReturnType<typeof scientificCalibrationService.validate>> | null = null;
    let insufficientLocalCalibration: {
      status: PredictionInsufficientStatus;
      message: string;
      sampleSize: PredictionSampleSizeReport;
      audit?: ScientificDatasetAuditReport;
    } | null = null;

    try {
      validated = await scientificCalibrationService.validate({
        stationId,
        parameterCode,
        predictorIndex,
        fechaInicio: request.fechaInicio,
        fechaFin: request.fechaFin,
        useGee: request.useGee,
        useCopernicus: request.useCopernicus,
        // Planetary Computer no requiere configuración — se intenta siempre para este
        // endpoint salvo que el caller pida explícitamente solo GEE o solo Copernicus.
        usePlanetaryComputer: request.usePlanetaryComputer ?? true,
      });
    } catch (error) {
      if (!(error instanceof CalibrationValidateInsufficientError)) throw error;
      insufficientLocalCalibration = {
        status: error.status,
        message: error.payload.message,
        sampleSize: sampleSizeFromAudit(error.payload.audit, parameterCode),
        audit: error.payload.audit,
      };
    }

    if (insufficientLocalCalibration) {
      // 2b. Calibración local insuficiente (N real = 0 o por debajo del umbral exploratorio).
      // Antes de rendirse, intenta un modelo de referencia bibliográfica (ecuación YA
      // publicada y citada — ver literature-model-registry.ts). NUNCA fabrica un modelo: si
      // no existe uno registrado para este parámetro, o no hay reflectancia disponible, cae
      // al mensaje honesto de "insuficiente" de siempre.
      const resolvedForLiterature = await resolveLatestObservation(request);
      const literatureEstimate =
        resolvedForLiterature && resolvedForLiterature.observation.waterSufficiency !== "insufficient"
          ? applyLiteratureModel(parameterCode, resolvedForLiterature.observation.reflectances)
          : null;

      if (literatureEstimate && resolvedForLiterature) {
        const literatureResult: PredictionLiteratureModelResult = {
          status: "PREDICTED_LITERATURE_MODEL",
          stationId,
          parameterCode,
          predictedValue: literatureEstimate.predictedValue,
          unit: literatureEstimate.unit,
          observation: {
            provider: resolvedForLiterature.provider,
            acquisitionDate: resolvedForLiterature.observation.acquisitionDate,
            sceneId: resolvedForLiterature.observation.sceneId,
            predictorValue: literatureEstimate.inputReflectance,
            isSimulated: resolvedForLiterature.observation.isSimulated,
          },
          literatureModel: {
            modelCode: literatureEstimate.modelCode,
            citation: literatureEstimate.citation,
            calibrationContext: literatureEstimate.calibrationContext,
            transferabilityWarning: literatureEstimate.transferabilityWarning,
            formulaDescription: literatureEstimate.formulaDescription,
            calibrationMetrics: literatureEstimate.calibrationMetrics,
          },
          localCalibration: {
            status: insufficientLocalCalibration.status,
            message: insufficientLocalCalibration.message,
            sampleSize: insufficientLocalCalibration.sampleSize,
          },
          isSimulated: resolvedForLiterature.observation.isSimulated,
          scientificStatus: "literature_reference_model",
          disclaimer: literatureEstimate.disclaimer,
        };
        return literatureResult;
      }

      fail({
        status: insufficientLocalCalibration.status,
        message: insufficientLocalCalibration.message,
        stationId,
        parameterCode,
        sampleSize: insufficientLocalCalibration.sampleSize,
        audit: insufficientLocalCalibration.audit,
      });
    }

    if (!validated) {
      // Invariante: si no hubo insufficientLocalCalibration, validate() tuvo que resolver.
      throw new Error("Estado inesperado: calibración ni exitosa ni marcada insuficiente");
    }

    const sampleSize: PredictionSampleSizeReport = {
      ...sampleSizeFromAudit(validated.audit, parameterCode),
      trainingSampleCount: validated.model.trainingSampleCount,
      validationSampleCount: validated.model.validationSampleCount,
    };

    // 3. Observación satelital más reciente — Copernicus priorizado, luego GEE, luego almacenado.
    const resolved = await resolveLatestObservation(request);
    if (!resolved) {
      fail({
        status: "NO_RECENT_OBSERVATION",
        message: `No hay observación satelital disponible para la estación ${stationId} en el rango consultado.`,
        stationId,
        parameterCode,
        sampleSize,
        audit: validated.audit,
      });
    }

    // Un píxel predominantemente terrestre no puede producir un valor de agua.
    if (resolved.observation.waterSufficiency === "insufficient") {
      const fraction = resolved.observation.waterFraction;
      fail({
        status: "NO_WATER_PIXELS",
        message:
          `La ventana satelital de ${resolved.observation.acquisitionDate} no tiene píxeles de agua suficientes ` +
          `(fracción ${fraction === null || fraction === undefined ? "desconocida" : fraction.toFixed(2)}, ` +
          `${resolved.observation.pixelsUsed ?? 0} píxeles válidos). No se emite una predicción.`,
        stationId,
        parameterCode,
        sampleSize,
        audit: validated.audit,
      });
    }

    const predictorValue = resolved.observation.indices[predictorIndex];
    if (predictorValue === undefined || predictorValue === null || !Number.isFinite(predictorValue)) {
      fail({
        status: "NO_PREDICTOR_VALUE",
        message: `El índice ${predictorIndex} no está disponible en la observación satelital más reciente (${resolved.observation.acquisitionDate}).`,
        stationId,
        parameterCode,
        sampleSize,
        audit: validated.audit,
      });
    }

    const predictedValueRaw = predictLinear(
      { coefficientA: validated.model.coefficientA, coefficientB: validated.model.coefficientB },
      predictorValue
    );

    const rmse = validated.model.validationMetrics.rmse;
    const uncertainty = Number.isFinite(rmse)
      ? {
          lower: Number((predictedValueRaw - rmse).toFixed(4)),
          upper: Number((predictedValueRaw + rmse).toFixed(4)),
          method: UNCERTAINTY_HEURISTIC_METHOD_LABEL,
        }
      : null;

    const unit = PARAMETRO_CATALOG_BY_CODIGO[parameterCode]?.unidad ?? "";

    return {
      status: "PREDICTED",
      stationId,
      parameterCode,
      predictorIndex,
      predictedValue: Number(predictedValueRaw.toFixed(4)),
      unit,
      uncertainty,
      observation: {
        provider: resolved.provider,
        acquisitionDate: resolved.observation.acquisitionDate,
        sceneId: resolved.observation.sceneId,
        predictorValue,
        isSimulated: resolved.observation.isSimulated,
      },
      model: {
        modelType: validated.model.modelType,
        coefficientA: validated.model.coefficientA,
        coefficientB: validated.model.coefficientB,
        trainingSampleCount: validated.model.trainingSampleCount,
        validationSampleCount: validated.model.validationSampleCount,
        trainingMetrics: validated.model.trainingMetrics,
        validationMetrics: validated.model.validationMetrics,
        temporalSplit: validated.model.temporalSplit,
      },
      sampleSize,
      isSimulated: resolved.observation.isSimulated || validated.meta.isSimulated,
      scientificStatus: "predicted_exploratory",
      disclaimer: [
        PREDICTION_DISCLAIMERS.exploratory,
        PREDICTION_DISCLAIMERS.uncertainty,
        PREDICTION_DISCLAIMERS.n,
        validated.disclaimer,
      ].join(" "),
    };
  }
}

export const predictionService = new PredictionService();
