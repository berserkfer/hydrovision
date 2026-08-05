"use client";

import { LayoutGrid, Table2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { ParameterCardGrid } from "@/components/parameters/ParameterCard";
import { ParameterChart } from "@/components/parameters/ParameterChart";
import { ParameterFilters } from "@/components/parameters/ParameterFilters";
import { ParameterSummary } from "@/components/parameters/ParameterSummary";
import { ParameterTable } from "@/components/parameters/ParameterTable";
import { Card } from "@/components/ui/Card";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { MOCK_LAST_UPDATE } from "@/constants/app";
import { useParameters } from "@/hooks/useParameters";
import { cn } from "@/lib/utils";
import type {
  ParameterChartData,
  ParameterSummaryStats,
  WaterParameterRecord,
} from "@/types/parameter-management";

interface ParametersViewProps {
  initialRecords: WaterParameterRecord[];
  initialStats: ParameterSummaryStats;
  chartData: ParameterChartData;
  estacionOptions: { value: string; label: string }[];
  campanaOptions: { value: string; label: string }[];
  fechaOptions: string[];
}

export function ParametersView({
  initialRecords,
  initialStats,
  chartData,
  estacionOptions,
  campanaOptions,
  fechaOptions,
}: ParametersViewProps) {
  const {
    records,
    allFiltered,
    stats,
    filters,
    setFilter,
    resetFilters,
    hasActiveFilters,
    viewMode,
    setViewMode,
  } = useParameters({ initialRecords, initialStats });

  return (
    <MainLayout>
      <MonitoringHeader
        lastUpdate={MOCK_LAST_UPDATE}
        title="Parámetros de Calidad del Agua"
        subtitle="Registro, visualización y evaluación ECA · HydroVision"
      />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 hv-animate-fade-in">
            <p className="text-sm text-slate-600">
              Monitoreo fisicoquímico y microbiológico con clasificación automática según ECA.
            </p>
            <SimulatedDataIndicator />
          </div>

          <div className="hv-animate-fade-in">
            <ParameterSummary stats={stats} />
          </div>

          <div className="hv-animate-fade-in">
            <ParameterChart data={chartData} />
          </div>

          <Card className="hv-animate-fade-in">
            <div className="px-5 py-4">
              <ParameterFilters
                filters={filters}
                estacionOptions={estacionOptions}
                campanaOptions={campanaOptions}
                fechaOptions={fechaOptions}
                onFilterChange={setFilter}
                onReset={resetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3 hv-animate-fade-in">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{allFiltered.length}</span> registro(s)
              {hasActiveFilters ? " (filtrados)" : ""}
            </p>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
              <ViewToggle active={viewMode === "table"} onClick={() => setViewMode("table")} icon={Table2} label="Tabla" />
              <ViewToggle active={viewMode === "cards"} onClick={() => setViewMode("cards")} icon={LayoutGrid} label="Tarjetas" />
            </div>
          </div>

          <div className="hv-animate-fade-in">
            {viewMode === "table" ? (
              <ParameterTable records={records} />
            ) : (
              <ParameterCardGrid records={records} />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function ViewToggle({
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
