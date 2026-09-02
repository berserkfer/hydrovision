/**
 * Servicio de predicción de riesgo ambiental — Fase 6.
 */

import type { AIRiskAssessment, FieldMeasurement, SatelliteIndices } from "@/types";

export interface IRiskPredictionService {
  readonly isEnabled: boolean;
  predict(
    stationId: string,
    measurement: FieldMeasurement,
    indices: SatelliteIndices
  ): Promise<AIRiskAssessment>;
}

export class MockRiskPredictionService implements IRiskPredictionService {
  readonly isEnabled = false;

  async predict(
    stationId: string,
    measurement: FieldMeasurement,
    indices: SatelliteIndices
  ): Promise<AIRiskAssessment> {
    await new Promise((r) => setTimeout(r, 50));
    const turbidityFactor = Math.min((measurement.turbidity ?? 0) / 50, 1);
    const doFactor = Math.max(0, (4 - (measurement.dissolvedOxygen ?? 4)) / 4);
    const ndtiFactor = Math.max(0, indices.ndti);
    const riskScore = Number(
      Math.min(1, turbidityFactor * 0.4 + doFactor * 0.35 + ndtiFactor * 0.25).toFixed(3)
    );

    let riskCategory: AIRiskAssessment["riskCategory"] = "low";
    if (riskScore >= 0.65) riskCategory = "high";
    else if (riskScore >= 0.35) riskCategory = "medium";

    return {
      stationId,
      assessedAt: new Date().toISOString(),
      riskScore,
      riskCategory,
      modelVersion: "simulated-heuristic-v0",
      isSimulated: true,
    };
  }
}

export const riskPredictionService: IRiskPredictionService = new MockRiskPredictionService();
