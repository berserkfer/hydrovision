import type {
  IndicatorCategoryMeta,
  IndicatorImportance,
  IndicatorScoreLevel,
  IndicatorTrafficLight,
} from "@/types/indicators";

export function scoreToLevel(score: number): IndicatorScoreLevel {
  if (score >= 85) return "excelente";
  if (score >= 70) return "bueno";
  if (score >= 50) return "regular";
  if (score >= 30) return "deficiente";
  return "critico";
}

export const SCORE_COLORS: Record<IndicatorScoreLevel, string> = {
  excelente: "#10b981",
  bueno: "#22c55e",
  regular: "#f59e0b",
  deficiente: "#f97316",
  critico: "#ef4444",
};

export const TRAFFIC_LIGHT_COLORS: Record<IndicatorTrafficLight, string> = {
  green: "#10b981",
  yellow: "#eab308",
  orange: "#f97316",
  red: "#ef4444",
};

export function scoreToTrafficLight(score: number): IndicatorTrafficLight {
  if (score >= 85) return "green";
  if (score >= 70) return "yellow";
  if (score >= 50) return "orange";
  return "red";
}

export const IMPORTANCE_WEIGHT: Record<IndicatorImportance, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export const INDICATOR_CATEGORIES: readonly IndicatorCategoryMeta[] = [
  {
    key: "water_quality",
    label: "Calidad del Agua",
    description: "Índice compuesto de parámetros fisicoquímicos",
    icon: "droplets",
  },
  {
    key: "environmental_risk",
    label: "Riesgo Ambiental",
    description: "Evaluación del motor de riesgo Fase 4.0",
    icon: "alert",
  },
  {
    key: "eca_compliance",
    label: "Cumplimiento ECA",
    description: "Conformidad con Estándares de Calidad Ambiental",
    icon: "shield",
  },
  {
    key: "temporal_trend",
    label: "Tendencia Temporal",
    description: "Evolución reciente de parámetros clave",
    icon: "trend",
  },
  {
    key: "station_status",
    label: "Estado de Estaciones",
    description: "Operatividad del red de monitoreo",
    icon: "map-pin",
  },
  {
    key: "campaign_status",
    label: "Estado de Campañas",
    description: "Avance de campañas de muestreo",
    icon: "clipboard",
  },
  {
    key: "data_quality",
    label: "Calidad de Datos",
    description: "Integridad y completitud de registros simulados",
    icon: "database",
  },
] as const;
