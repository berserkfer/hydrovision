import { notFound } from "next/navigation";
import { StationDetailView } from "@/components/stations/StationDetailView";
import { getStationDetailRecord } from "@/lib/repositories/station.repository";

interface EstacionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EstacionDetailPage({ params }: EstacionDetailPageProps) {
  const { id } = await params;
  const detail = getStationDetailRecord(id);

  if (!detail) {
    notFound();
  }

  return <StationDetailView detail={detail} />;
}
