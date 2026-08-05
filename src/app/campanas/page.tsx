import { CampaignsView } from "@/components/campaigns/CampaignsView";
import {
  getAllCampanaSummaries,
  getCampaignStats,
} from "@/lib/repositories/campaign.repository";

export default function CampanasPage() {
  const initialCampaigns = getAllCampanaSummaries();
  const initialStats = getCampaignStats();

  return (
    <CampaignsView initialCampaigns={initialCampaigns} initialStats={initialStats} />
  );
}
