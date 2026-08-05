"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CampaignFiltersBar } from "@/components/campaigns/CampaignFiltersBar";
import { CampaignFormModal } from "@/components/campaigns/CampaignFormModal";
import { CampaignKpiCards } from "@/components/campaigns/CampaignKpiCards";
import { CampaignList, CampaignListHeader } from "@/components/campaigns/CampaignList";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Card } from "@/components/ui/Card";
import { MOCK_LAST_UPDATE } from "@/constants/app";
import { useCampaigns } from "@/hooks/useCampaigns";
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
  } = useCampaigns({ initialCampaigns, initialStats });

  return (
    <MainLayout>
      <MonitoringHeader
        lastUpdate={MOCK_LAST_UPDATE}
        title="Campañas de Monitoreo"
        subtitle="Gestión de campañas ambientales · HydroVision"
      />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 hv-animate-fade-in">
            <div>
              <p className="text-sm text-slate-600">
                Administre campañas de monitoreo de calidad del agua por cuenca y río.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-cyan-700"
            >
              <Plus className="h-4 w-4" />
              Nueva Campaña
            </button>
          </div>

          <div className="hv-animate-fade-in">
            <CampaignKpiCards stats={stats} />
          </div>

          <Card className="hv-animate-fade-in">
            <div className="space-y-4 px-5 py-4">
              <CampaignFiltersBar
                filters={filters}
                onFilterChange={setFilter}
                onReset={resetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </Card>

          <div className="space-y-4 hv-animate-fade-in">
            <CampaignListHeader totalFiltered={allFiltered.length} />
            <CampaignList campaigns={campaigns} totalFiltered={allFiltered.length} />
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

      <CampaignFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={createCampaign}
      />
    </MainLayout>
  );
}
