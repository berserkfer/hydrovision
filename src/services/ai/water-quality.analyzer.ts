/**
 * Analizador de calidad del agua — síntesis multi-parámetro.
 */

import type {
  WaterQualityAnalysisInput,
  WaterQualityAnalysisResult,
} from "@/types/ai";
import { classifyMeasurement } from "@/lib/eca/classifier";

export interface IWaterQualityAnalyzer {
  analyze(input: WaterQualityAnalysisInput): Promise<WaterQualityAnalysisResult>;
}

export class MockWaterQualityAnalyzer implements IWaterQualityAnalyzer {
  async analyze(input: WaterQualityAnalysisInput): Promise<WaterQualityAnalysisResult> {
    const compliance = classifyMeasurement(input.measurement);
    const scoreMap = { compliant: 0.85, alert: 0.55, non_compliant: 0.25 };
    const statusMap = {
      compliant: "good" as const,
      alert: "moderate" as const,
      non_compliant: "poor" as const,
    };

    const findings: string[] = [];
    if (compliance.violatedParameters.length > 0) {
      findings.push(`Parámetros fuera de norma: ${compliance.violatedParameters.join(", ")}`);
    }
    if (compliance.alertParameters.length > 0) {
      findings.push(`Parámetros en alerta: ${compliance.alertParameters.join(", ")}`);
    }
    if (findings.length === 0) findings.push("Todos los parámetros evaluados dentro de rangos ECA.");

    return {
      overallScore: scoreMap[compliance.status],
      status: statusMap[compliance.status],
      keyFindings: findings,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

export const waterQualityAnalyzer: IWaterQualityAnalyzer = new MockWaterQualityAnalyzer();
