"use client";

import Link from "next/link";
import { DataTag } from "@/components/ui/DataTag";
import { MapPin, Maximize2 } from "lucide-react";
import type { MapCenter, RiverContext } from "@/types/geography";
import type { StationSummary } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { cn } from "@/lib/utils";
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
  const isRiverSimulated =
    summaries.length === 0 || summaries.every((s) => s.latestMeasurement.isSimulated);

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
              {summaries.length} puntos de monitoreo · Seleccione un punto en la lista o en el mapa
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isRiverSimulated ? (
              <SimulatedDataIndicator />
            ) : (
              <span role="status" aria-label="Datos reales">
                <DataTag tone="real">Datos reales</DataTag>
              </span>
            )}
            <Link
              href="/mapa"
              className="inline-flex items-center gap-1 rounded-[3px] border border-[var(--hv-ink)]/30 px-2.5 py-1 text-xs font-medium text-[var(--hv-ink)] transition-colors hover:bg-[var(--hv-ink-wash)]"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Mapa completo
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        {/* Selector de puntos — alternativa fiable al clic en el marcador (útil con puntos
            muy cercanos entre sí, como los 10 del Dren 4000, a menos de 1 km entre ellos) */}
        {onStationSelect && summaries.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {summaries.map((s) => (
              <button
                key={s.station.id}
                type="button"
                onClick={() => onStationSelect(s.station.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  selectedStationId === s.station.id
                    ? "border-cyan-500 bg-cyan-500/15 text-cyan-700"
                    : "border-[var(--hv-border)] text-[var(--hv-foreground-muted)] hover:border-cyan-400 hover:text-cyan-700"
                )}
              >
                {s.station.id}
              </button>
            ))}
          </div>
        )}

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
