import { StationsView } from "@/components/stations/StationsView";
import {
  getAllStationRecords,
  getStationFilterOptions,
  getStationStats,
} from "@/lib/api/stations.client";

export const dynamic = "force-dynamic";

export default async function EstacionesPage() {
  const [initialStations, initialStats, { cuencas, rios }] = await Promise.all([
    getAllStationRecords(),
    getStationStats(),
    getStationFilterOptions(),
  ]);

  return (
    <StationsView
      initialStations={initialStations}
      initialStats={initialStats}
      cuencaOptions={cuencas}
      rioOptions={rios}
    />
  );
}
