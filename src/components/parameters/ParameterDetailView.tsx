import { ParameterDetail } from "@/components/parameters/ParameterDetail";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { MOCK_LAST_UPDATE } from "@/constants/app";
import type { ParameterDetailData } from "@/types/parameter-management";

interface ParameterDetailViewProps {
  detail: ParameterDetailData;
}

export function ParameterDetailView({ detail }: ParameterDetailViewProps) {
  return (
    <MainLayout>
      <MonitoringHeader
        lastUpdate={MOCK_LAST_UPDATE}
        title={detail.definition.name}
        subtitle={`Parámetro de calidad del agua · ${detail.definition.unit}`}
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <ParameterDetail detail={detail} />
        </div>
      </div>
    </MainLayout>
  );
}
