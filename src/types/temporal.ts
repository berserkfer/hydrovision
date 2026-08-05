/** Parámetros disponibles para análisis temporal */
export type TemporalParameterKey =
  | "ph"
  | "temperatura"
  | "conductividad"
  | "oxigenoDisuelto"
  | "turbidez"
  | "solidosDisueltos"
  | "caudal";

/** Dirección de tendencia clasificada automáticamente */
export type TrendDirection = "improving" | "stable" | "worsening";

/** Punto de serie histórica */
export interface TemporalDataPoint {
  date: string;
  value: number;
  label: string;
}

/** Serie histórica de un parámetro en un rango */
export interface HistoricalSeriesData {
  stationId: string;
  stationName: string;
  parameter: TemporalParameterKey;
  parameterLabel: string;
  unit: string;
  startDate: string;
  endDate: string;
  points: TemporalDataPoint[];
  isSimulated: true;
}

/** Estadísticas descriptivas de un periodo */
export interface TemporalStatisticsData {
  average: number;
  maximum: number;
  minimum: number;
  standardDeviation: number;
  sampleCount: number;
}

/** Indicador de tendencia para UI */
export interface TrendIndicatorData {
  direction: TrendDirection;
  directionLabel: string;
  directionSymbol: string;
  slope: number;
  changePercent: number;
  colorClass: string;
  interpretation: string;
  recommendations: TemporalRecommendation[];
}

/** Recomendación operativa temporal */
export interface TemporalRecommendation {
  id: string;
  priority: "low" | "medium" | "high";
  text: string;
}

/** Filtros del módulo de análisis temporal */
export interface TemporalAnalysisFilters {
  stationId: string;
  parameter: TemporalParameterKey;
  startDate: string;
  endDate: string;
}

/** Resultado completo del análisis (periodo actual vs anterior) */
export interface TemporalAnalysisResult {
  filters: TemporalAnalysisFilters;
  currentSeries: HistoricalSeriesData;
  previousSeries: HistoricalSeriesData;
  currentStats: TemporalStatisticsData;
  previousStats: TemporalStatisticsData;
  trend: TrendIndicatorData;
  chartData: TemporalChartPoint[];
  evaluatedAt: string;
  isSimulated: true;
}

/** Punto combinado para gráfico comparativo */
export interface TemporalChartPoint {
  date: string;
  label: string;
  current: number | null;
  previous: number | null;
}

export const TREND_DIRECTION_LABELS: Record<TrendDirection, string> = {
  improving: "Mejorando",
  stable: "Estable",
  worsening: "Empeorando",
};

export const TREND_DIRECTION_SYMBOLS: Record<TrendDirection, string> = {
  improving: "↑",
  stable: "→",
  worsening: "↓",
};
