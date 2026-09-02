"use client";

import Link from "next/link";
import { MapPin, Maximize2 } from "lucide-react";
import type { MapCenter, RiverContext } from "@/types/geography";
import type { StationSummary } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import dynamic from "next/dynamic";

const FilteredMonitoringMap = dynamic(
  () =>
    import("@/components/map/FilteredMonitoringMap").then((mod) => mod.FilteredMonitoringMap),
  {
    ssr: false,
    loading: () => (
      <div className="hv-map-frame flex h-[min(520px,55vh)] w-full items-center justify-center rounded-xl border border-[var(--hv-border)] text-sm text-[var(--hv-foreground-muted)]">
        <span className="hv-animate-pulse-soft">Cargando mapa…</span>
      </div>
    ),
  }
);

interface DashboardOverviewMapProps {
  riverContext: RiverContext;
  summaries: StationSummary[];
  mapView: MapCenter;
  recenterToken: number;
  isTransitioning: boolean;
  selectedStationId?: string | null;
  onStationSelect?: (stationId: string) => void;
}

export function DashboardOverviewMap({
  riverContext,
  summaries,
  mapView,
  recenterToken,
  isTransitioning,
  selectedStationId,
  onStationSelect,
}: DashboardOverviewMapProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-[var(--hv-primary)]" />
              Mapa del {riverContext.river.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {summaries.length} puntos de monitoreo · Seleccione un marcador para detalle
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <SimulatedDataIndicator />
            <Link
              href="/mapa"
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--hv-primary)]/30 bg-[var(--hv-sidebar-active-bg)] px-2.5 py-1.5 text-xs font-medium text-[var(--hv-primary)] transition-colors hover:border-[var(--hv-primary)]/50"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Mapa completo
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
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
            heightClass="h-[min(520px,55vh)]"
          />
        </div>
      </CardContent>
    </Card>
  );
}
