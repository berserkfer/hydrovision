import { TemporalAnalysisView } from "@/components/temporal/TemporalAnalysisView";
import { getTemporalStations } from "@/repositories/temporal.repository";

export default function AnalisisTemporalPage() {
  const stations = getTemporalStations();

  return <TemporalAnalysisView stations={stations} />;
}
