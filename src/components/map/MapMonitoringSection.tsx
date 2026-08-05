"use client";

import dynamic from "next/dynamic";
import type { MapCenter, MapFilterField, MapFilterState, RiverContext } from "@/types/geography";
import type { StationSummary } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { MapControlPanel } from "@/components/map/filters/MapControlPanel";

const FilteredMonitoringMap = dynamic(
  () =>
    import("@/components/map/FilteredMonitoringMap").then((mod) => mod.FilteredMonitoringMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-sm text-slate-500">
        <span className="hv-animate-pulse-soft">Cargando mapa…</span>
      </div>
    ),
  }
);

interface MapMonitoringSectionProps {
  filters: MapFilterState;
  riverContext: RiverContext;
  summaries: StationSummary[];
  mapView: MapCenter;
  recenterToken: number;
  isTransitioning: boolean;
  selectedStationId?: string | null;
  onStationSelect?: (stationId: string) => void;
  onFilterChange: (field: MapFilterField, value: string) => void;
  onReset: () => void;
  onRecenter: () => void;
}

/**
 * Sección de monitoreo cartográfico: panel de control + mapa interactivo.
 */
export function MapMonitoringSection({
  filters,
  riverContext,
  summaries,
  mapView,
  recenterToken,
  isTransitioning,
  selectedStationId,
  onStationSelect,
  onFilterChange,
  onReset,
  onRecenter,
}: MapMonitoringSectionProps) {
  return (
    <Card className="h-full overflow-hidden transition-shadow duration-300 hover:shadow-md">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="hv-animate-fade-in">{riverContext.mapTitle}</CardTitle>
            <CardDescription className="mt-1">{riverContext.dashboardSubtitle}</CardDescription>
          </div>
          <SimulatedDataIndicator />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <MapControlPanel
          filters={filters}
          onFilterChange={onFilterChange}
          onReset={onReset}
          onRecenter={onRecenter}
        />
        <div
          className={`transition-opacity duration-300 ${isTransitioning ? "opacity-70" : "opacity-100"}`}
        >
          <FilteredMonitoringMap
            summaries={summaries}
            mapView={mapView}
          recenterToken={recenterToken}
          riverName={riverContext.river.name}
          riverKey={riverContext.river.id}
          selectedStationId={selectedStationId}
          onStationSelect={onStationSelect}
        />
        </div>
      </CardContent>
    </Card>
  );
}
