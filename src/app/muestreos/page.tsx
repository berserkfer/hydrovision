import { SamplingView } from "@/components/sampling/SamplingView";
import {
  getAllSampleSummaries,
  getSampleStats,
} from "@/lib/repositories/sample.repository";

export default function MuestreosPage() {
  const initialSamples = getAllSampleSummaries();
  const initialStats = getSampleStats();

  return (
    <SamplingView initialSamples={initialSamples} initialStats={initialStats} />
  );
}
