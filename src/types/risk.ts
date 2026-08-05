/** Nivel de riesgo por parámetro individual (escala de 5) */
export type ParameterRiskLevel =
  | "muy_bajo"
  | "bajo"
  | "moderado"
  | "alto"
  | "muy_alto";

/** Clasificación general del índice de riesgo (escala de 4) */
export type EnvironmentalRiskLevel = "bajo" | "moderado" | "alto" | "muy_alto";

export type RiskParameterKey =
  | "ph"
  | "temperatura"
  | "oxigenoDisuelto"
  | "conductividad"
  | "turbidez"
  | "solidosDisueltos"
  | "caudal";

/** Entrada del motor — 7 parámetros fisicoquímicos */
export interface EnvironmentalRiskInput {
  ph: number;
  temperatura: number;
  oxigenoDisuelto: number;
  conductividad: number;
  turbidez: number;
  solidosDisueltos: number;
  caudal: number;
}

/** Evaluación de un parámetro individual */
export interface ParameterRiskScore {
  key: RiskParameterKey;
  label: string;
  unit: string;
  value: number;
  score: number;
  level: ParameterRiskLevel;
}

/** Recomendación operativa generada automáticamente */
export interface EnvironmentalRecommendation {
  id: string;
  priority: "low" | "medium" | "high";
  text: string;
}

/** Resultado completo del motor de riesgo */
export interface EnvironmentalRiskAssessment {
  index: number;
  level: EnvironmentalRiskLevel;
  levelLabel: string;
  parameters: ParameterRiskScore[];
  explanation: string;
  recommendations: EnvironmentalRecommendation[];
  evaluatedAt: string;
  stationCount: number;
  isSimulated: true;
}

/** Indicador listo para UI (presentación) */
export interface EnvironmentalIndicator {
  index: number;
  level: EnvironmentalRiskLevel;
  levelLabel: string;
  colorClass: string;
  ringColor: string;
  explanation: string;
  recommendations: EnvironmentalRecommendation[];
}

export const PARAMETER_RISK_LABELS: Record<ParameterRiskLevel, string> = {
  muy_bajo: "Muy bajo",
  bajo: "Bajo",
  moderado: "Moderado",
  alto: "Alto",
  muy_alto: "Muy alto",
};

export const ENVIRONMENTAL_RISK_LABELS: Record<EnvironmentalRiskLevel, string> = {
  bajo: "Riesgo Bajo",
  moderado: "Riesgo Moderado",
  alto: "Riesgo Alto",
  muy_alto: "Riesgo Muy Alto",
};

export const ENVIRONMENTAL_RISK_EMOJI: Record<EnvironmentalRiskLevel, string> = {
  bajo: "🟢",
  moderado: "🟡",
  alto: "🟠",
  muy_alto: "🔴",
};
