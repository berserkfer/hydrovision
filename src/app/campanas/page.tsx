import { CampaignsView } from "@/components/campaigns/CampaignsView";
import { fetchCampaignsList } from "@/lib/api/campaigns.client";

export const dynamic = "force-dynamic";

export default async function CampanasPage() {
  const { items: initialCampaigns, stats: initialStats } = await fetchCampaignsList({
    pageSize: 500,
  });

  return (
    <CampaignsView initialCampaigns={initialCampaigns} initialStats={initialStats} />
  );
}
