"use client";

import { useMemo } from "react";
import type { StationSummary } from "@/types";
import type { EnvironmentalAssessment } from "@/types/rules";
import { ruleEngine } from "@/services/rules";

interface UseEnvironmentalRulesOptions {
  summaries: StationSummary[];
  stationId?: string | null;
}

interface UseEnvironmentalRulesResult {
  assessment: EnvironmentalAssessment | null;
  stationAssessment: EnvironmentalAssessment | null;
  riverAssessment: EnvironmentalAssessment | null;
}

export function useEnvironmentalRules({
  summaries,
  stationId,
}: UseEnvironmentalRulesOptions): UseEnvironmentalRulesResult {
  const riverAssessment = useMemo(
    () => ruleEngine.evaluateRiver(summaries),
    [summaries]
  );

  const stationAssessment = useMemo(() => {
    if (!stationId) return null;
    const summary = summaries.find((s) => s.station.id === stationId);
    return summary ? ruleEngine.evaluateStation(summary) : null;
  }, [summaries, stationId]);

  const assessment = stationAssessment ?? riverAssessment;

  return { assessment, stationAssessment, riverAssessment };
}
