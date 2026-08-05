import type { DashboardStats, StationSummary } from "@/types";

/**
 * Deriva KPIs del dashboard a partir de las estaciones filtradas por río.
 */
export function computeStatsFromSummaries(
  summaries: StationSummary[],
  lastUpdate: string
): DashboardStats {
  return {
    totalStations: summaries.length,
    compliantCount: summaries.filter((s) => s.compliance.status === "compliant").length,
    alertCount: summaries.filter((s) => s.compliance.status === "alert").length,
    nonCompliantCount: summaries.filter((s) => s.compliance.status === "non_compliant").length,
    lastUpdate,
    isSimulated: true,
  };
}
