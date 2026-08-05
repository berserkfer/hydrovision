import { StationsView } from "@/components/stations/StationsView";
import {
  getAllStationRecords,
  getStationFilterOptions,
  getStationStats,
} from "@/lib/repositories/station.repository";

export default function EstacionesPage() {
  const initialStations = getAllStationRecords();
  const initialStats = getStationStats();
  const { cuencas, rios } = getStationFilterOptions();

  return (
    <StationsView
      initialStations={initialStations}
      initialStats={initialStats}
      cuencaOptions={cuencas}
      rioOptions={rios}
    />
  );
}
