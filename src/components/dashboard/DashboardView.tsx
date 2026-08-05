"use client";

import type { DashboardStats, StationSummary, TimeSeriesPoint } from "@/types";
import { MainLayout } from "@/components/layout/MainLayout";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { EnvironmentalRiskCard } from "@/components/dashboard/EnvironmentalRiskCard";
import { ModuleStatusPanel } from "@/components/dashboard/ModuleStatusPanel";
import { MonitoringPointsTable } from "@/components/dashboard/MonitoringPointsTable";
import { SatelliteIndicesPreview } from "@/components/dashboard/SatelliteIndicesPreview";
import { SatelliteIndicesSection } from "@/components/dashboard/SatelliteIndicesSection";
import { TemporalChart } from "@/components/dashboard/TemporalChart";
import { EnvironmentalAlertsSection } from "@/components/dashboard/executive/EnvironmentalAlertsSection";
import { EnvironmentalIndicatorsGrid } from "@/components/dashboard/executive/EnvironmentalIndicatorsGrid";
import { ExecutiveHeader } from "@/components/dashboard/executive/ExecutiveHeader";
import { ExecutiveKpiPanel } from "@/components/dashboard/executive/ExecutiveKpiPanel";
import { ExecutiveSummaryPanel } from "@/components/dashboard/executive/ExecutiveSummaryPanel";
import { RecommendedActionsSection } from "@/components/dashboard/executive/RecommendedActionsSection";
import { MapMonitoringSection } from "@/components/map/MapMonitoringSection";
import { StationDetailPanel } from "@/components/station/StationDetailPanel";
import { StationDetailEmpty } from "@/components/station/StationDetailEmpty";
import { useMapFilters } from "@/hooks/useMapFilters";
import { useEnvironmentalRisk } from "@/hooks/useEnvironmentalRisk";
import { useExecutiveDashboard } from "@/hooks/useExecutiveDashboard";
import { useSatelliteIndexEngine } from "@/hooks/useSatelliteIndexEngine";

interface DashboardViewProps {
  stats: DashboardStats;
  summaries: StationSummary[];
  timeSeries: TimeSeriesPoint[];
}

/**
 * Vista principal del dashboard — Fase 4.2 Dashboard Ejecutivo.
 * Conserva todos los componentes previos e integra capa ejecutiva.
 */
export function DashboardView({ stats, summaries, timeSeries }: DashboardViewProps) {
  const {
    filters,
    riverContext,
    summaries: filteredSummaries,
    filteredStats,
    mapView,
    recenterToken,
    isTransitioning,
    stationDetail,
    selectedStationId,
    setFilter,
    selectStation,
    clearStationSelection,
    resetFilters,
    recenterMap,
  } = useMapFilters();

  const { assessment: riskAssessment, indicator: riskIndicator } =
    useEnvironmentalRisk(filteredSummaries);

  const executive = useExecutiveDashboard({
    stats: filteredStats,
    summaries: filteredSummaries,
    riverContext,
    riskAssessment,
  });

  const satelliteIndexSnapshot = useSatelliteIndexEngine(
    riverContext.river.id,
    selectedStationId
  );

  const stationCount = riverContext.river.stations.length;

  const stationPanel = stationDetail ? (
    <StationDetailPanel detail={stationDetail} onClose={clearStationSelection} />
  ) : (
    <StationDetailEmpty />
  );

  return (
    <MainLayout>
      {executive && <ExecutiveHeader data={executive.header} />}

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {executive && (
            <>
              <ExecutiveKpiPanel kpis={executive.kpis} />
              <EnvironmentalIndicatorsGrid cards={executive.parameterCards} />

              <div className="grid gap-6 xl:grid-cols-2">
                <EnvironmentalAlertsSection alerts={executive.alerts} />
                <RecommendedActionsSection actions={executive.actions} />
              </div>
            </>
          )}

          <div className="hv-animate-fade-in transition-opacity duration-300">
            <KpiCards stats={filteredStats} />
          </div>

          {riskIndicator && (
            <div className="hv-animate-fade-in">
              <EnvironmentalRiskCard
                indicator={riskIndicator}
                stationCount={filteredSummaries.length}
                riverName={riverContext.river.name}
              />
            </div>
          )}

          {stationDetail && <div className="xl:hidden">{stationPanel}</div>}

          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <div className="min-w-0 space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <MapMonitoringSection
                  filters={filters}
                  riverContext={riverContext}
                  summaries={filteredSummaries}
                  mapView={mapView}
                  recenterToken={recenterToken}
                  isTransitioning={isTransitioning}
                  selectedStationId={selectedStationId}
                  onStationSelect={selectStation}
                  onFilterChange={setFilter}
                  onReset={resetFilters}
                  onRecenter={recenterMap}
                />
                <TemporalChart data={timeSeries} />
              </div>

              <MonitoringPointsTable
                summaries={filteredSummaries}
                title={`Estaciones — ${riverContext.river.name}`}
                description={`${stationCount} puntos de monitoreo · ${riverContext.watershed.name} · Datos simulados`}
                contentKey={riverContext.river.id}
                selectedStationId={selectedStationId}
                onStationSelect={selectStation}
              />
              <SatelliteIndicesSection
                items={satelliteIndexSnapshot.items}
                riverName={riverContext.river.name}
              />
              <SatelliteIndicesPreview summaries={summaries} />
              <ModuleStatusPanel summaries={summaries} />
            </div>

            <div className="hidden space-y-6 xl:block">
              {executive && <ExecutiveSummaryPanel summary={executive.summary} />}
              {stationPanel}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
