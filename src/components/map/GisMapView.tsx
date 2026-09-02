"use client";

import dynamic from "next/dynamic";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { PageContent } from "@/components/layout/PageContent";
import { MapControlPanel } from "@/components/map/filters/MapControlPanel";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MOCK_LAST_UPDATE } from "@/constants/app";
import { useLayerManager } from "@/hooks/useLayerManager";
import { useMapFilters } from "@/hooks/useMapFilters";

const GisMonitoringMap = dynamic(
  () => import("@/components/map/GisMonitoringMap").then((mod) => mod.GisMonitoringMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[32rem] w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-sm text-slate-500">
        <span className="hv-animate-pulse-soft">Cargando mapa GIS…</span>
      </div>
    ),
  }
);

export function GisMapView() {
  const {
    filters,
    riverContext,
    summaries: filteredSummaries,
    mapView,
    recenterToken,
    isTransitioning,
    setFilter,
    resetFilters,
    recenterMap,
  } = useMapFilters();

  const {
    layers,
    toggleLayer,
    setLayerOpacity,
    resetLayers,
    manager,
  } = useLayerManager();

  return (
    <MainLayout>
      <MonitoringHeader
        lastUpdate={MOCK_LAST_UPDATE}
        title="Mapa Interactivo — Layer Manager"
        subtitle={`${riverContext.watershed.name} · Gestor de capas geoespaciales · HydroVision`}
      />

      <PageContent className="">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 hv-animate-fade-in">
            <p className="text-sm text-slate-600">
              Administre capas vectoriales, raster simuladas e índices satelitales. Preparado para
              Google Earth Engine.
            </p>
            <SimulatedDataIndicator />
          </div>

          <Card className="hv-animate-fade-in overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle>{riverContext.mapTitle}</CardTitle>
              <CardDescription>{riverContext.dashboardSubtitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <MapControlPanel
                filters={filters}
                onFilterChange={setFilter}
                onReset={resetFilters}
                onRecenter={recenterMap}
              />
              <div
                className={`transition-opacity duration-300 ${isTransitioning ? "opacity-70" : "opacity-100"}`}
              >
                <GisMonitoringMap
                  summaries={filteredSummaries}
                  mapView={mapView}
                  recenterToken={recenterToken}
                  riverName={riverContext.river.name}
                  riverKey={riverContext.river.id}
                  river={riverContext.river}
                  layers={layers}
                  layerManager={manager}
                  onToggleLayer={toggleLayer}
                  onLayerOpacityChange={setLayerOpacity}
                  onResetLayers={resetLayers}
                  onRecenter={recenterMap}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </MainLayout>
  );
}
