import { notFound } from "next/navigation";
import { StationDetailView } from "@/components/stations/StationDetailView";
import { getStationDetailRecord } from "@/lib/api/stations.client";

export const dynamic = "force-dynamic";

interface EstacionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EstacionDetailPage({ params }: EstacionDetailPageProps) {
  const { id } = await params;
  const detail = await getStationDetailRecord(id);

  if (!detail) {
    notFound();
  }

  return <StationDetailView detail={detail} />;
}
