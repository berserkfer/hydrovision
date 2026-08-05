"use client";

import { CampaignDetail } from "@/components/campaigns/CampaignDetail";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import type { CampanaDetail } from "@/types/campaign";

interface CampaignDetailViewProps {
  campaign: CampanaDetail;
}

export function CampaignDetailView({ campaign }: CampaignDetailViewProps) {
  return (
    <MainLayout>
      <MonitoringHeader
        lastUpdate={campaign.updatedAt}
        title={campaign.nombre}
        subtitle={`${campaign.codigo} · ${campaign.rioNombre}`}
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <CampaignDetail campaign={campaign} />
        </div>
      </div>
    </MainLayout>
  );
}
