"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { CampaignDetailView } from "@/components/campaigns/CampaignDetailView";
import { getCampanaDetailById } from "@/lib/repositories/campaign.repository";

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = use(params);
  const campaign = getCampanaDetailById(id);

  if (!campaign) {
    notFound();
  }

  return <CampaignDetailView campaign={campaign} />;
}
