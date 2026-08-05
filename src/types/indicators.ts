/** Motor central de indicadores ambientales — Fase 4.4 */

/** Categorías de indicadores */
export type IndicatorCategory =
  | "water_quality"
  | "environmental_risk"
  | "eca_compliance"
  | "temporal_trend"
  | "station_status"
  | "campaign_status"
  | "data_quality";

/** Clasificación por puntuación 0–100 */
export type IndicatorScoreLevel =
  | "excelente"
  | "bueno"
  | "regular"
  | "deficiente"
  | "critico";

/** Semáforo ambiental */
export type IndicatorTrafficLight = "green" | "yellow" | "orange" | "red";

/** Nivel de importancia operativa */
export type IndicatorImportance = "low" | "medium" | "high" | "critical";

/** Iconos soportados en tarjetas */
export type IndicatorIconKey =
  | "droplets"
  | "shield"
  | "alert"
  | "trend"
  | "map-pin"
  | "clipboard"
  | "database"
  | "activity";

/** Indicador ambiental completo */
export interface Indicator {
  id: string;
  name: string;
  description: string;
  value: number;
  displayValue: string;
  unit: string;
  score: number;
  status: IndicatorScoreLevel;
  statusLabel: string;
  color: string;
  icon: IndicatorIconKey;
  importance: IndicatorImportance;
  category: IndicatorCategory;
  categoryLabel: string;
  updatedAt: string;
  trend: number[];
  trendDirection: "up" | "down" | "stable";
  progressPercent: number;
  trafficLight: IndicatorTrafficLight;
  isSimulated: true;
  source: "mock" | "postgresql" | "google_earth_engine" | "ai";
}

/** Metadatos de categoría */
export interface IndicatorCategoryMeta {
  key: IndicatorCategory;
  label: string;
  description: string;
  icon: IndicatorIconKey;
}

/** Opciones de consulta del centro de indicadores */
export interface IndicatorQueryOptions {
  search: string;
  category: IndicatorCategory | "all";
  status: IndicatorScoreLevel | "all";
  sortBy: "name" | "score" | "importance" | "category";
  sortOrder: "asc" | "desc";
  groupByCategory: boolean;
}

/** Resultado agrupado */
export interface IndicatorGroup {
  category: IndicatorCategory;
  categoryLabel: string;
  indicators: Indicator[];
}

/** Snapshot del motor */
export interface IndicatorsEngineResult {
  indicators: Indicator[];
  groups: IndicatorGroup[];
  totalCount: number;
  averageScore: number;
  evaluatedAt: string;
  isSimulated: true;
}

export const INDICATOR_CATEGORY_LABELS: Record<IndicatorCategory, string> = {
  water_quality: "Calidad del Agua",
  environmental_risk: "Riesgo Ambiental",
  eca_compliance: "Cumplimiento ECA",
  temporal_trend: "Tendencia Temporal",
  station_status: "Estado de Estaciones",
  campaign_status: "Estado de Campañas",
  data_quality: "Calidad de Datos",
};

export const INDICATOR_SCORE_LABELS: Record<IndicatorScoreLevel, string> = {
  excelente: "Excelente",
  bueno: "Bueno",
  regular: "Regular",
  deficiente: "Deficiente",
  critico: "Crítico",
};

export const DEFAULT_INDICATOR_QUERY: IndicatorQueryOptions = {
  search: "",
  category: "all",
  status: "all",
  sortBy: "score",
  sortOrder: "desc",
  groupByCategory: true,
};
