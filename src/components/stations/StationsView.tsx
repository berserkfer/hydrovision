"use client";

import { LayoutGrid, Table2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { StationCardGrid } from "@/components/stations/StationCard";
import { StationFilters } from "@/components/stations/StationFilters";
import { StationKpiCards } from "@/components/stations/StationKpiCards";
import { StationTable } from "@/components/stations/StationTable";
import { Card } from "@/components/ui/Card";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { MOCK_LAST_UPDATE } from "@/constants/app";
import { useStations } from "@/hooks/useStations";
import { cn } from "@/lib/utils";
import type { MonitoringStationRecord, StationStats } from "@/types/station-management";

interface StationsViewProps {
  initialStations: MonitoringStationRecord[];
  initialStats: StationStats;
  cuencaOptions: { value: string; label: string }[];
  rioOptions: { value: string; label: string }[];
}

export function StationsView({
  initialStations,
  initialStats,
  cuencaOptions,
  rioOptions,
}: StationsViewProps) {
  const {
    stations,
    allFiltered,
    stats,
    filters,
    setFilter,
    resetFilters,
    hasActiveFilters,
    viewMode,
    setViewMode,
  } = useStations({ initialStations, initialStats });

  return (
    <MainLayout>
      <MonitoringHeader
        lastUpdate={MOCK_LAST_UPDATE}
        title="Estaciones de Monitoreo"
        subtitle="Gestión profesional de puntos de monitoreo · HydroVision"
      />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 hv-animate-fade-in">
            <p className="text-sm text-slate-600">
              Consulte, filtre y explore las estaciones de monitoreo ambiental de la plataforma.
            </p>
            <SimulatedDataIndicator />
          </div>

          <div className="hv-animate-fade-in">
            <StationKpiCards stats={stats} />
          </div>

          <Card className="hv-animate-fade-in">
            <div className="space-y-4 px-5 py-4">
              <StationFilters
                filters={filters}
                cuencaOptions={cuencaOptions}
                rioOptions={rioOptions}
                onFilterChange={setFilter}
                onReset={resetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3 hv-animate-fade-in">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{allFiltered.length}</span> estaciones
              {hasActiveFilters ? " (filtradas)" : ""}
            </p>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
              <ViewToggleButton
                active={viewMode === "table"}
                onClick={() => setViewMode("table")}
                icon={Table2}
                label="Tabla"
              />
              <ViewToggleButton
                active={viewMode === "cards"}
                onClick={() => setViewMode("cards")}
                icon={LayoutGrid}
                label="Tarjetas"
              />
            </div>
          </div>

          <div className="hv-animate-fade-in">
            {viewMode === "table" ? (
              <StationTable stations={stations} />
            ) : (
              <StationCardGrid stations={stations} />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function ViewToggleButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Table2;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "bg-cyan-600 text-white" : "text-slate-600 hover:bg-slate-50"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
