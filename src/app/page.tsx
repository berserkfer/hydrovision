import { DashboardView } from "@/components/dashboard/DashboardView";
import {
  getAggregatedTimeSeries,
  getDashboardStats,
  getStationSummaries,
} from "@/lib/data/simulated";
import { ensureMonitoringDataStoreReady } from "@/server/lib/invalidate-data-store-cache";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await ensureMonitoringDataStoreReady();

  const stats = getDashboardStats();
  const summaries = getStationSummaries();
  const timeSeries = getAggregatedTimeSeries();

  return (
    <DashboardView stats={stats} summaries={summaries} timeSeries={timeSeries} />
  );
}
