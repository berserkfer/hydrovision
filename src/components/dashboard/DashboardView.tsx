"use client";

import { useState } from "react";
import type { DashboardStats, StationSummary, TimeSeriesPoint } from "@/types";
import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardHero } from "@/components/dashboard/control-center/DashboardHero";
import { ModuleStrip, type DashboardModule } from "@/components/dashboard/ModuleStrip";
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
import { IndexReadingPanel } from "@/components/vegetation/IndexReadingPanel";
import { PhotoQualityEntryCard } from "@/components/photo-quality/PhotoQualityEntryCard";
import { useMapFilters } from "@/hooks/useMapFilters";
import { useEnvironmentalRisk } from "@/hooks/useEnvironmentalRisk";
import { useExecutiveDashboard } from "@/hooks/useExecutiveDashboard";

const MODULES: DashboardModule[] = [
  {
    value: "calidad-agua",
    eyebrow: "Calidad de agua",
    title: "El dren, punto por punto",
    description: "Mapa, estado ECA y alertas de los 10 puntos.",
    tag: { tone: "real", label: "Real 2014 + simulado" },
    glyph: "flow",
  },
  {
    value: "prediccion-satelital",
    eyebrow: "Predicción satelital",
    title: "SST desde Sentinel-2",
    description: "Escena → índice espectral → estimación.",
    tag: { tone: "caution", label: "No calibrado local" },
    glyph: "scene",
  },
  {
    value: "modelo-ambiental",
    eyebrow: "Modelo ambiental",
    title: "Un parámetro desde otros",
    description: "Regresión simple sobre la misma muestra, sin satélite.",
    tag: { tone: "caution", label: "N=10 por matriz" },
    glyph: "matrix",
  },
  {
    value: "foto-celular",
    eyebrow: "Foto de celular",
    title: "Turbidez en campo",
    description: "Agua, cielo y cartulina. Funciona sin conexión.",
    tag: { tone: "neutral", label: "3 niveles de confianza" },
    glyph: "photo",
  },
  {
    value: "vegetacion-agricola",
    eyebrow: "Vegetación agrícola",
    title: "NDVI de cultivos",
    description: "Vigor de los arrozales que drenan al 4000.",
    tag: { tone: "caution", label: "Escala genérica" },
    glyph: "ndvi",
  },
  {
    value: "vegetacion-laguna",
    eyebrow: "Laguna de oxidación",
    title: "NDCI de la laguna",
    description: "Proxy de clorofila-a con umbral de alerta.",
    tag: { tone: "caution", label: "Umbral no normativo" },
    glyph: "ndci",
  },
];

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
  const [tab, setTab] = useState(MODULES[0].value);
  const activeModule = MODULES.find((m) => m.value === tab) ?? MODULES[0];

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto">
        {executive && (
          <DashboardHero data={executive.header} evaluatedAt={executive.evaluatedAt} />
        )}

        <div className="mx-auto max-w-[1600px] px-5 pb-12 md:px-8 lg:px-12">
          <div className="-mt-px pt-6">
            <ModuleStrip modules={MODULES} value={tab} onChange={setTab} />
          </div>

          <div
            role="tabpanel"
            id={`panel-${activeModule.value}`}
            aria-labelledby={`tab-${activeModule.value}`}
            className="hv-animate-fade-in mt-10"
            key={activeModule.value}
          >
            <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-[var(--hv-border)] pb-3">
              <h2 className="text-[26px] font-light tracking-[-0.02em] text-[var(--hv-ink)]">
                {activeModule.title}
              </h2>
              <p className="hv-eyebrow hidden sm:block">{activeModule.eyebrow}</p>
            </div>

            {tab === "calidad-agua" && (
              <div className="space-y-8">
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
              </div>
            )}

            {tab === "prediccion-satelital" && <PredictionDashboard />}
            {tab === "modelo-ambiental" && <EnvironmentalModelPanel />}
            {tab === "foto-celular" && <PhotoQualityEntryCard />}
            {tab === "vegetacion-agricola" && (
              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <AgriculturalVegetationCard />
                <IndexReadingPanel index="NDVI" />
              </div>
            )}
            {tab === "vegetacion-laguna" && (
              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <LagoonVegetationCard />
                <IndexReadingPanel index="NDCI" />
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
