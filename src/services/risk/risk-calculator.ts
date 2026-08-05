/**
 * RiskCalculator — calcula puntajes de riesgo por parámetro e índice general.
 */

import type {
  EnvironmentalRiskInput,
  EnvironmentalRiskLevel,
  ParameterRiskLevel,
  ParameterRiskScore,
  RiskParameterKey,
} from "@/types/risk";
import { RISK_PARAMETER_THRESHOLDS, type ParameterThreshold } from "./risk-thresholds";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function scoreToParameterLevel(score: number): ParameterRiskLevel {
  if (score <= 20) return "muy_bajo";
  if (score <= 40) return "bajo";
  if (score <= 60) return "moderado";
  if (score <= 80) return "alto";
  return "muy_alto";
}

function scoreToEnvironmentalLevel(index: number): EnvironmentalRiskLevel {
  if (index <= 25) return "bajo";
  if (index <= 50) return "moderado";
  if (index <= 75) return "alto";
  return "muy_alto";
}

function interpolateScore(
  value: number,
  from: number,
  to: number,
  scoreFrom: number,
  scoreTo: number
): number {
  if (from === to) return scoreTo;
  const ratio = clamp((value - from) / (to - from), 0, 1);
  return scoreFrom + ratio * (scoreTo - scoreFrom);
}

function evaluateMaxMode(value: number, t: ParameterThreshold): number {
  const opt = t.optimalMax ?? 0;
  const warn = t.warningMax ?? opt * 1.5;
  const crit = t.criticalMax ?? warn * 1.5;

  if (value <= opt) return interpolateScore(value, 0, opt, 0, 15);
  if (value <= warn) return interpolateScore(value, opt, warn, 15, 45);
  if (value <= crit) return interpolateScore(value, warn, crit, 45, 80);
  return clamp(80 + ((value - crit) / crit) * 20, 80, 100);
}

function evaluateMinMode(value: number, t: ParameterThreshold): number {
  const opt = t.optimalMin ?? 0;
  const warn = t.warningMin ?? opt * 0.7;
  const crit = t.criticalMin ?? warn * 0.5;

  if (value >= opt) return 10;
  if (value >= warn) return interpolateScore(value, warn, opt, 45, 15);
  if (value >= crit) return interpolateScore(value, crit, warn, 80, 45);
  return clamp(80 + ((crit - value) / crit) * 20, 80, 100);
}

function evaluateRangeMode(value: number, t: ParameterThreshold): number {
  const optMin = t.optimalMin ?? 0;
  const optMax = t.optimalMax ?? 0;

  if (value >= optMin && value <= optMax) {
    const mid = (optMin + optMax) / 2;
    const half = (optMax - optMin) / 2 || 1;
    return clamp((Math.abs(value - mid) / half) * 15, 0, 15);
  }

  if (value < optMin) {
    const warn = t.warningMin ?? optMin * 0.9;
    const crit = t.criticalMin ?? warn * 0.85;
    if (value >= warn) return interpolateScore(value, warn, optMin, 45, 15);
    if (value >= crit) return interpolateScore(value, crit, warn, 80, 45);
    return clamp(80 + ((crit - value) / crit) * 20, 80, 100);
  }

  const warn = t.warningMax ?? optMax * 1.1;
  const crit = t.criticalMax ?? warn * 1.2;
  if (value <= warn) return interpolateScore(value, optMax, warn, 15, 45);
  if (value <= crit) return interpolateScore(value, warn, crit, 45, 80);
  return clamp(80 + ((value - crit) / crit) * 20, 80, 100);
}

function getParameterValue(input: EnvironmentalRiskInput, key: RiskParameterKey): number {
  const map: Record<RiskParameterKey, number> = {
    ph: input.ph,
    temperatura: input.temperatura,
    oxigenoDisuelto: input.oxigenoDisuelto,
    conductividad: input.conductividad,
    turbidez: input.turbidez,
    solidosDisueltos: input.solidosDisueltos,
    caudal: input.caudal,
  };
  return map[key];
}

function evaluateParameter(
  input: EnvironmentalRiskInput,
  threshold: ParameterThreshold
): ParameterRiskScore {
  const value = getParameterValue(input, threshold.key);
  let score: number;

  switch (threshold.mode) {
    case "max":
      score = evaluateMaxMode(value, threshold);
      break;
    case "min":
      score = evaluateMinMode(value, threshold);
      break;
    case "range":
      score = evaluateRangeMode(value, threshold);
      break;
  }

  score = Number(clamp(score, 0, 100).toFixed(1));

  return {
    key: threshold.key,
    label: threshold.label,
    unit: threshold.unit,
    value,
    score,
    level: scoreToParameterLevel(score),
  };
}

export class RiskCalculator {
  evaluateParameters(input: EnvironmentalRiskInput): ParameterRiskScore[] {
    return RISK_PARAMETER_THRESHOLDS.map((t) => evaluateParameter(input, t));
  }

  calculateIndex(parameters: ParameterRiskScore[]): number {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const param of parameters) {
      const threshold = RISK_PARAMETER_THRESHOLDS.find((t) => t.key === param.key);
      if (!threshold) continue;
      weightedSum += param.score * threshold.weight;
      totalWeight += threshold.weight;
    }

    return Number((weightedSum / totalWeight).toFixed(1));
  }

  classifyIndex(index: number): EnvironmentalRiskLevel {
    return scoreToEnvironmentalLevel(index);
  }

  getTopRiskContributors(parameters: ParameterRiskScore[], limit = 3): ParameterRiskScore[] {
    return [...parameters].sort((a, b) => b.score - a.score).slice(0, limit);
  }
}

export const riskCalculator = new RiskCalculator();
