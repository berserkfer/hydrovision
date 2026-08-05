"use client";

import { useMemo } from "react";
import type { DashboardStats, StationSummary } from "@/types";
import type { RiverContext } from "@/types/geography";
import type { ExecutiveDashboardSnapshot } from "@/types/executive";
import type { EnvironmentalRiskAssessment } from "@/types/risk";
import { executiveDashboardEngine } from "@/services/executive";

interface UseExecutiveDashboardInput {
  stats: DashboardStats;
  summaries: StationSummary[];
  riverContext: RiverContext;
  riskAssessment: EnvironmentalRiskAssessment | null;
}

export function useExecutiveDashboard(
  input: UseExecutiveDashboardInput
): ExecutiveDashboardSnapshot | null {
  const { stats, summaries, riverContext, riskAssessment } = input;

  return useMemo(() => {
    if (summaries.length === 0) return null;
    return executiveDashboardEngine.build({
      stats,
      summaries,
      riverContext,
      riskAssessment,
    });
  }, [stats, summaries, riverContext, riskAssessment]);
}
