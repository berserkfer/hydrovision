/**
 * Tipos del Satellite Index Engine — Sprint 4
 */

export type IndexCode = "NDWI" | "NDVI" | "MNDWI" | "NDTI" | "NDMI";

export type IndexTrend = "up" | "down" | "stable";

export type IndexStatusLevel = "low" | "normal" | "high" | "critical";

export interface IndexDefinition {
  code: IndexCode;
  name: string;
  description: string;
  formula: string;
  bands: string[];
  interpretationGuide: string;
  expectedRange: { min: number; max: number };
  unit: string;
  visualizationColor: string;
}

export interface IndexCalculationInput {
  stationId: string;
  riverId: string;
  bands?: Record<string, number>;
}

export interface IndexCalculationResult {
  code: IndexCode;
  value: number;
  calculatedAt: string;
  source: "simulated" | "gee";
}

export interface IndexInterpretation {
  status: IndexStatusLevel;
  statusLabel: string;
  message: string;
  color: string;
}

export interface IndexLegendItem {
  label: string;
  color: string;
  range: string;
}

export interface IndexColorScaleStop {
  value: number;
  color: string;
}

export interface IndexTemporalComparison {
  code: IndexCode;
  currentValue: number;
  previousValue: number;
  variation: number;
  variationPercent: number;
  trend: IndexTrend;
  trendLabel: string;
}

export interface IndexDashboardItem {
  definition: IndexDefinition;
  result: IndexCalculationResult;
  interpretation: IndexInterpretation;
  legend: IndexLegendItem[];
  colorScale: IndexColorScaleStop[];
  temporal: IndexTemporalComparison;
}

export interface IndexEngineSnapshot {
  items: IndexDashboardItem[];
  stationId: string;
  riverId: string;
  generatedAt: string;
  source: "simulated" | "gee";
}
