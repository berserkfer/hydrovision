import { DashboardView } from "@/components/dashboard/DashboardView";
import {
  getAggregatedTimeSeries,
  getDashboardStats,
  getStationSummaries,
} from "@/lib/data/simulated";

export default function DashboardPage() {
  const stats = getDashboardStats();
  const summaries = getStationSummaries();
  const timeSeries = getAggregatedTimeSeries();

  return (
    <DashboardView stats={stats} summaries={summaries} timeSeries={timeSeries} />
  );
}
