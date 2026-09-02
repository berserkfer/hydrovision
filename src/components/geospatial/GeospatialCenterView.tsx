"use client";

import dynamic from "next/dynamic";
import { Card } from "@/components/ui/Card";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { PageContent } from "@/components/layout/PageContent";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { GeoFilters } from "@/components/geospatial/GeoFilters";
import { GeoLegend } from "@/components/geospatial/GeoLegend";
import { GeoSidebar } from "@/components/geospatial/GeoSidebar";
import { LayerControl } from "@/components/geospatial/LayerControl";
import { MOCK_LAST_UPDATE } from "@/constants/app";
import { useGeospatialCenter } from "@/hooks/useGeospatialCenter";

const GeoMap = dynamic(
  () => import("@/components/geospatial/GeoMap").then((m) => m.GeoMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[28rem] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Cargando mapa…
      </div>
    ),
  }
);

export function GeospatialCenterView() {
  const {
    filters,
    setFilter,
    resetFilters,
    options,
    mapData,
    layers,
    toggleLayer,
    selectedStationId,
    selectedDetail,
    selectStation,
    recenterToken,
    recenter,
  } = useGeospatialCenter();

  return (
    <MainLayout>
      <MonitoringHeader
        lastUpdate={MOCK_LAST_UPDATE}
        title="Centro Geoespacial"
        subtitle="Vista unificada de información ambiental · HydroVision"
      />

      <PageContent className="">
        <div className="mx-auto max-w-[1600px] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 hv-animate-fade-in">
            <p className="text-sm text-slate-600">
              Mapa interactivo con estaciones, cuencas, ríos e índices simulados — preparado para
              Google Earth Engine.
            </p>
            <SimulatedDataIndicator />
          </div>

          <div className="grid gap-4 xl:grid-cols-[280px_1fr_320px] hv-animate-fade-in">
            <Card className="h-fit p-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-800">Filtros y búsqueda</h2>
              <GeoFilters
                filters={filters}
                options={options}
                onFilterChange={setFilter}
                onReset={resetFilters}
                stationCount={mapData.stations.length}
              />
            </Card>

            <div className="relative min-w-0 space-y-2">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={recenter}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Centrar mapa
                </button>
              </div>

              <div className="relative">
                <GeoMap
                  mapData={mapData}
                  layers={layers}
                  selectedStationId={selectedStationId}
                  recenterToken={recenterToken}
                  onStationSelect={selectStation}
                  className="min-h-[32rem]"
                />

                <LayerControl
                  layers={layers}
                  onToggle={toggleLayer}
                  className="absolute right-3 top-3 z-[1000] max-w-[220px]"
                />

                <GeoLegend className="absolute bottom-3 left-3 z-[1000]" />
              </div>
            </div>

            <div className="min-h-[32rem]">
              <GeoSidebar detail={selectedDetail} onClose={() => selectStation(null)} />
            </div>
          </div>
        </div>
      </PageContent>
    </MainLayout>
  );
}
