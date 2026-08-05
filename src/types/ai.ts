import type { FieldMeasurement, SatelliteIndices } from "./index";

export interface WaterQualityAnalysisInput {
  stationId: string;
  measurement: FieldMeasurement;
  indices?: SatelliteIndices;
}

export interface WaterQualityAnalysisResult {
  overallScore: number;
  status: "good" | "moderate" | "poor" | "critical";
  keyFindings: string[];
  evaluatedAt: string;
}

export interface Recommendation {
  id: string;
  priority: "low" | "medium" | "high";
  title: string;
  description: string;
  actionType: "monitoring" | "intervention" | "report";
}

export interface RecommendationContext {
  stationId: string;
  riskScore: number;
  complianceStatus: string;
}
