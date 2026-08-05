import { StationDetail } from "@/components/stations/StationDetail";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { MOCK_LAST_UPDATE } from "@/constants/app";
import type { StationDetailRecord } from "@/types/station-management";

interface StationDetailViewProps {
  detail: StationDetailRecord;
}

export function StationDetailView({ detail }: StationDetailViewProps) {
  return (
    <MainLayout>
      <MonitoringHeader
        lastUpdate={MOCK_LAST_UPDATE}
        title={`Estación ${detail.station.codigo}`}
        subtitle={`${detail.station.nombre} · ${detail.station.rioNombre}`}
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <StationDetail detail={detail} />
        </div>
      </div>
    </MainLayout>
  );
}
