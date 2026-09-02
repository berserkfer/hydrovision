"use client";

import { useState } from "react";
import { LayoutGrid, Plus, Table2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { PageContent } from "@/components/layout/PageContent";
import { ParameterCardGrid } from "@/components/parameters/ParameterCard";
import { ParameterChart } from "@/components/parameters/ParameterChart";
import { ParameterFilters } from "@/components/parameters/ParameterFilters";
import { ParameterFormModal } from "@/components/parameters/ParameterFormModal";
import { ParameterSummary } from "@/components/parameters/ParameterSummary";
import { ParameterTable } from "@/components/parameters/ParameterTable";
import { Card } from "@/components/ui/Card";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { MOCK_LAST_UPDATE } from "@/constants/app";
import { useParameters } from "@/hooks/useParameters";
import { createParameter } from "@/lib/api/parameters.client";
import { withApiToast } from "@/lib/api/notify";
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
  const [formOpen, setFormOpen] = useState(false);

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

      <PageContent className="">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 hv-animate-fade-in">
            <p className="text-sm text-slate-600">
              Monitoreo fisicoquímico y microbiológico con clasificación automática según ECA.
            </p>
            <div className="flex items-center gap-3">
              <SimulatedDataIndicator />
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-cyan-700"
              >
                <Plus className="h-4 w-4" />
                Nuevo Parámetro
              </button>
            </div>
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
      </PageContent>

      <ParameterFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={async (input) => {
          await withApiToast(() => createParameter(input), {
            success: "Parámetro registrado correctamente",
            error: "No se pudo crear el parámetro",
          });
        }}
      />
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
