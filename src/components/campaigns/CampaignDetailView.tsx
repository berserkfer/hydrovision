"use client";

import { CampaignDetail } from "@/components/campaigns/CampaignDetail";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { PageContent } from "@/components/layout/PageContent";
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
      <PageContent className="">
        <div className="mx-auto max-w-7xl">
          <CampaignDetail campaign={campaign} />
        </div>
      </PageContent>
    </MainLayout>
  );
}
