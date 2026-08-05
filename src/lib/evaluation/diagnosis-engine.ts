/**
 * Motor de diagnóstico ambiental simulado — Sprint 2G
 */

import type {
  CriticalParameterRow,
  EnvironmentalDiagnosisResult,
  EnvironmentalGeneralStatus,
  EnvironmentalRecommendationItem,
  EnvironmentalRiskLevel,
  EnvironmentalSemaphore,
} from "@/types/environmental-evaluation";
import { RISK_LEVEL_LABELS, SEMAPHORE_LABELS } from "@/types/environmental-evaluation";

interface DiagnosisInput {
  criticalCount: number;
  alertCount: number;
  turbidity: number;
  dissolvedOxygen: number;
  ecaCompliancePercent: number;
}

function resolveRiskLevel(input: DiagnosisInput): EnvironmentalRiskLevel {
  if (input.criticalCount >= 2 || input.dissolvedOxygen < 4) return "muy_alto";
  if (input.criticalCount >= 1 || input.alertCount >= 2) return "alto";
  if (input.alertCount >= 1 || input.turbidity > 40) return "moderado";
  return "bajo";
}

function resolveSemaphore(risk: EnvironmentalRiskLevel): EnvironmentalSemaphore {
  if (risk === "bajo") return "green";
  if (risk === "moderado") return "yellow";
  return "red";
}

function resolveGeneralState(risk: EnvironmentalRiskLevel, ecaPercent: number): string {
  if (risk === "bajo" && ecaPercent >= 80) return "Estado ambiental favorable";
  if (risk === "moderado") return "Estado ambiental con observaciones";
  if (risk === "alto") return "Estado ambiental en alerta";
  return "Estado ambiental crítico";
}

export function buildGeneralStatus(input: DiagnosisInput, fechaEvaluacion: string): EnvironmentalGeneralStatus {
  const nivelRiesgo = resolveRiskLevel(input);
  const semaforo = resolveSemaphore(nivelRiesgo);

  return {
    estadoGeneral: resolveGeneralState(nivelRiesgo, input.ecaCompliancePercent),
    nivelRiesgo,
    nivelRiesgoLabel: RISK_LEVEL_LABELS[nivelRiesgo],
    semaforo,
    fechaEvaluacion,
  };
}

export function buildAutomaticDiagnosis(
  input: DiagnosisInput,
  criticalParams: CriticalParameterRow[]
): EnvironmentalDiagnosisResult {
  const messages: string[] = [];
  const rules: string[] = [];

  if (input.ecaCompliancePercent >= 85 && input.criticalCount === 0) {
    messages.push("Estado ambiental favorable.");
    rules.push("ECA_COMPLIANCE_OK");
  }

  if (input.alertCount > 0 || input.criticalCount > 0) {
    messages.push("Se recomienda incrementar la frecuencia de monitoreo.");
    rules.push("MONITORING_FREQUENCY");
  }

  const highTurbidity = criticalParams.some((p) =>
    p.parametro.toLowerCase().includes("turbidez")
  );
  if (highTurbidity || input.turbidity > 35) {
    messages.push("Existe riesgo potencial asociado al incremento de turbidez.");
    rules.push("TURBIDITY_RISK");
  }

  if (input.dissolvedOxygen < 5) {
    messages.push("Oxígeno disuelto por debajo del umbral óptimo para vida acuática.");
    rules.push("DO_THRESHOLD");
  }

  if (messages.length === 0) {
    messages.push("Continuar seguimiento.");
    rules.push("ROUTINE_FOLLOWUP");
  }

  return {
    mensaje: messages.join(" "),
    nivelConfianza: 0.87,
    reglasAplicadas: rules,
  };
}

export function buildAutomaticRecommendations(
  risk: EnvironmentalRiskLevel,
  criticalParams: CriticalParameterRow[]
): EnvironmentalRecommendationItem[] {
  const items: EnvironmentalRecommendationItem[] = [];

  if (risk === "bajo") {
    items.push({
      id: "rec-1",
      prioridad: "baja",
      texto: "Continuar monitoreo según plan de campaña establecido.",
    });
    items.push({
      id: "rec-2",
      prioridad: "baja",
      texto: "Mantener registro actualizado de parámetros fisicoquímicos.",
    });
  }

  if (risk === "moderado") {
    items.push({
      id: "rec-3",
      prioridad: "media",
      texto: "Incrementar frecuencia de muestreo a quincenal en la estación evaluada.",
    });
    items.push({
      id: "rec-4",
      prioridad: "media",
      texto: "Revisar tendencias históricas de parámetros en alerta.",
    });
  }

  if (risk === "alto" || risk === "muy_alto") {
    items.push({
      id: "rec-5",
      prioridad: "alta",
      texto: "Realizar inspección de fuentes contaminantes aguas arriba.",
    });
    items.push({
      id: "rec-6",
      prioridad: "alta",
      texto: "Activar protocolo de alerta ambiental y notificar al responsable de campaña.",
    });
  }

  if (criticalParams.some((p) => p.parametro.includes("Turbidez"))) {
    items.push({
      id: "rec-7",
      prioridad: "media",
      texto: "Evaluar eventos de escorrentía recientes como posible causa de turbidez elevada.",
    });
  }

  if (items.length === 0) {
    items.push({
      id: "rec-default",
      prioridad: "baja",
      texto: "Continuar seguimiento rutinario del ecosistema acuático.",
    });
  }

  return items;
}

export { SEMAPHORE_LABELS };
