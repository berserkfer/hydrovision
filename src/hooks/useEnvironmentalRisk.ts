"use client";

import { useMemo } from "react";
import type { StationSummary } from "@/types";
import type { EnvironmentalIndicator, EnvironmentalRiskAssessment } from "@/types/risk";
import { riskEngine } from "@/services/risk";

interface UseEnvironmentalRiskResult {
  assessment: EnvironmentalRiskAssessment | null;
  indicator: EnvironmentalIndicator | null;
}

export function useEnvironmentalRisk(summaries: StationSummary[]): UseEnvironmentalRiskResult {
  return useMemo(() => {
    const assessment = riskEngine.evaluateRiver(summaries);
    if (!assessment) {
      return { assessment: null, indicator: null };
    }
    return {
      assessment,
      indicator: riskEngine.toIndicator(assessment),
    };
  }, [summaries]);
}
