"use client";

import { useState } from "react";
import { LayoutGrid, Plus, Table2 } from "lucide-react";
import { CampaignCardGrid } from "@/components/campaigns/CampaignCard";
import { CampaignFilters } from "@/components/campaigns/CampaignFilters";
import { CampaignForm } from "@/components/campaigns/CampaignForm";
import { CampaignKpiCards } from "@/components/campaigns/CampaignKpiCards";
import { CampaignTable } from "@/components/campaigns/CampaignTable";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Card } from "@/components/ui/Card";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { MOCK_LAST_UPDATE } from "@/constants/app";
import { useCampaigns } from "@/hooks/useCampaigns";
import { cn } from "@/lib/utils";
import type { CampanaSummary, CampaignStats } from "@/types/campaign";

interface CampaignsViewProps {
  initialCampaigns: CampanaSummary[];
  initialStats: CampaignStats;
}

export function CampaignsView({ initialCampaigns, initialStats }: CampaignsViewProps) {
  const [formOpen, setFormOpen] = useState(false);

  const {
    campaigns,
    allFiltered,
    stats,
    filters,
    setFilter,
    resetFilters,
    hasActiveFilters,
    createCampaign,
    pagination,
    viewMode,
    setViewMode,
  } = useCampaigns({ initialCampaigns, initialStats });

  return (
    <MainLayout>
      <MonitoringHeader
        lastUpdate={MOCK_LAST_UPDATE}
        title="Campañas de Monitoreo"
        subtitle="Gestión profesional de campañas ambientales · HydroVision"
      />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 hv-animate-fade-in">
            <p className="text-sm text-slate-600">
              Administre campañas de monitoreo de calidad del agua con filtros avanzados y registro simulado.
            </p>
            <div className="flex items-center gap-3">
              <SimulatedDataIndicator />
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-cyan-700"
              >
                <Plus className="h-4 w-4" />
                Nueva Campaña
              </button>
            </div>
          </div>

          <div className="hv-animate-fade-in">
            <CampaignKpiCards stats={stats} />
          </div>

          <Card className="hv-animate-fade-in">
            <div className="space-y-4 px-5 py-4">
              <CampaignFilters
                filters={filters}
                onFilterChange={setFilter}
                onReset={resetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3 hv-animate-fade-in">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{allFiltered.length}</span> campaña(s)
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
              <CampaignTable campaigns={campaigns} />
            ) : (
              <CampaignCardGrid campaigns={campaigns} />
            )}
          </div>

          <Card>
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              startItem={pagination.startItem}
              endItem={pagination.endItem}
              totalItems={pagination.totalItems}
              hasPrev={pagination.hasPrev}
              hasNext={pagination.hasNext}
              onPrev={pagination.prevPage}
              onNext={pagination.nextPage}
              onGoToPage={pagination.goToPage}
              itemLabel="campañas"
            />
          </Card>
        </div>
      </div>

      <CampaignForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={createCampaign}
      />
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
