"use client";

import type { DashboardStats, StationSummary, TimeSeriesPoint } from "@/types";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContent } from "@/components/layout/PageContent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { ControlCenterHeader } from "@/components/dashboard/control-center/ControlCenterHeader";
import { ControlCenterKpiCards } from "@/components/dashboard/control-center/ControlCenterKpiCards";
import { PredictionDashboard } from "@/components/prediction/PredictionDashboard";
import { EnvironmentalModelPanel } from "@/components/environmental-model/EnvironmentalModelPanel";
import { DashboardOverviewMap } from "@/components/dashboard/control-center/DashboardOverviewMap";
import { WaterResourceStatusCard } from "@/components/dashboard/control-center/WaterResourceStatusCard";
import { WaterQualityTrendChart } from "@/components/dashboard/control-center/WaterQualityTrendChart";
import { RecentAlertsPanel } from "@/components/dashboard/control-center/RecentAlertsPanel";
import { DataFreshnessBar } from "@/components/dashboard/control-center/DataFreshnessBar";
import { StationDetailPanel } from "@/components/station/StationDetailPanel";
import { StationDetailEmpty } from "@/components/station/StationDetailEmpty";
import { AgriculturalVegetationCard } from "@/components/vegetation/AgriculturalVegetationCard";
import { LagoonVegetationCard } from "@/components/vegetation/LagoonVegetationCard";
import { PhotoQualityEntryCard } from "@/components/photo-quality/PhotoQualityEntryCard";
import { useMapFilters } from "@/hooks/useMapFilters";
import { useEnvironmentalRisk } from "@/hooks/useEnvironmentalRisk";
import { useExecutiveDashboard } from "@/hooks/useExecutiveDashboard";

interface DashboardViewProps {
  stats: DashboardStats;
  summaries: StationSummary[];
  timeSeries: TimeSeriesPoint[];
}

export function DashboardView({ stats: _stats, summaries: _summaries, timeSeries }: DashboardViewProps) {
  const {
    riverContext,
    summaries: filteredSummaries,
    filteredStats,
    mapView,
    recenterToken,
    isTransitioning,
    stationDetail,
    selectedStationId,
    selectStation,
    clearStationSelection,
  } = useMapFilters();

  const { assessment: riskAssessment } = useEnvironmentalRisk(filteredSummaries);

  const executive = useExecutiveDashboard({
    stats: filteredStats,
    summaries: filteredSummaries,
    riverContext,
    riskAssessment,
  });

  const activeAlertsCount = filteredStats.alertCount + filteredStats.nonCompliantCount;

  const stationPanel = stationDetail ? (
    <StationDetailPanel detail={stationDetail} onClose={clearStationSelection} />
  ) : (
    <StationDetailEmpty compact />
  );

  const waterStatusDescription = executive?.summary.watershedStatus;

  return (
    <MainLayout>
      {executive && (
        <ControlCenterHeader data={executive.header} evaluatedAt={executive.evaluatedAt} />
      )}

      <PageContent>
        <div className="mx-auto max-w-[1600px]">
          <Tabs defaultValue="calidad-agua" className="space-y-6">
            <TabsList>
              <TabsTrigger value="calidad-agua">Calidad de Agua</TabsTrigger>
              <TabsTrigger value="prediccion-satelital">Predicción Satelital</TabsTrigger>
              <TabsTrigger value="modelo-ambiental">Modelo Ambiental</TabsTrigger>
              <TabsTrigger value="foto-celular">Foto de Celular</TabsTrigger>
              <TabsTrigger value="vegetacion-agricola">Vegetación Agrícola</TabsTrigger>
              <TabsTrigger value="vegetacion-laguna">Vegetación de Laguna</TabsTrigger>
            </TabsList>

            <TabsContent value="calidad-agua" className="space-y-8">
              {executive && (
                <ControlCenterKpiCards
                  stats={filteredStats}
                  kpis={executive.kpis}
                  riskAssessment={riskAssessment}
                  activeAlertsCount={activeAlertsCount}
                />
              )}

              {stationDetail && <div className="xl:hidden">{stationPanel}</div>}

              <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-w-0 space-y-8">
                  <DashboardOverviewMap
                    riverContext={riverContext}
                    summaries={filteredSummaries}
                    mapView={mapView}
                    recenterToken={recenterToken}
                    isTransitioning={isTransitioning}
                    selectedStationId={selectedStationId}
                    onStationSelect={selectStation}
                  />
                  <WaterQualityTrendChart data={timeSeries} />
                </div>

                <aside className="space-y-6">
                  {executive && (
                    <>
                      <WaterResourceStatusCard
                        qualityStatus={executive.header.qualityStatus}
                        description={waterStatusDescription ?? ""}
                        riverName={riverContext.river.name}
                      />
                      <RecentAlertsPanel alerts={executive.alerts} />
                    </>
                  )}
                  <div className="xl:sticky xl:top-6">{stationPanel}</div>
                </aside>
              </div>

              <DataFreshnessBar
                lastUpdate={filteredStats.lastUpdate}
                source="Campo / Sentinel-2 / Sistema (simulado)"
              />
            </TabsContent>

            <TabsContent value="prediccion-satelital">
              <PredictionDashboard />
            </TabsContent>

            <TabsContent value="modelo-ambiental">
              <EnvironmentalModelPanel />
            </TabsContent>

            <TabsContent value="foto-celular">
              <PhotoQualityEntryCard />
            </TabsContent>

            <TabsContent value="vegetacion-agricola">
              <AgriculturalVegetationCard />
            </TabsContent>

            <TabsContent value="vegetacion-laguna">
              <LagoonVegetationCard />
            </TabsContent>
          </Tabs>
        </div>
      </PageContent>
    </MainLayout>
  );
}
