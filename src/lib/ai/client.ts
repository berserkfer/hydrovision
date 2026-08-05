/**
 * Cliente legacy — re-exporta servicios IA (Fase 3.4).
 * @deprecated Importar desde @/services/ai
 */

import { aiModuleConfig } from "@/config";
import { riskPredictionService } from "@/services/ai";
import type { FieldMeasurement, SatelliteIndices } from "@/types";

export const AI_MODULE_STATUS = {
  enabled: aiModuleConfig.enabled,
  message: aiModuleConfig.message,
  plannedVersion: aiModuleConfig.plannedVersion,
};

export async function estimateContaminationRisk(
  stationId: string,
  measurement: FieldMeasurement,
  indices: SatelliteIndices
) {
  return riskPredictionService.predict(stationId, measurement, indices);
}

export function getAIModuleRoadmap(): string[] {
  return [
    "Recopilar dataset etiquetado (campo + satélite)",
    "Feature engineering: índices espectrales + parámetros fisicoquímicos",
    "Entrenar modelo (Random Forest / Gradient Boosting inicial)",
    "Validación cruzada y métricas (AUC, F1, RMSE según target)",
    "Desplegar servicio FastAPI en services/ai-service/",
    "Integrar inferencia en dashboard y mapa",
  ];
}

export {
  riskPredictionService,
  waterQualityAnalyzer,
  recommendationEngine,
} from "@/services/ai";
