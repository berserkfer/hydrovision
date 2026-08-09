import { SamplingView } from "@/components/sampling/SamplingView";
import { fetchSamplesList } from "@/lib/api/samples.client";

export const dynamic = "force-dynamic";

export default async function MuestreosPage() {
  const { items: initialSamples, stats: initialStats } = await fetchSamplesList({
    pageSize: 500,
  });

  return (
    <SamplingView initialSamples={initialSamples} initialStats={initialStats} />
  );
}
