"use client";

import { useState } from "react";
import { Plus, TestTube2 } from "lucide-react";
import { FilterSelect } from "@/components/map/filters/FilterSelect";
import { SampleFormModal } from "@/components/sampling/SampleFormModal";
import { SampleKpiCards } from "@/components/sampling/SampleKpiCards";
import { SampleTable } from "@/components/sampling/SampleTable";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { Pagination } from "@/components/ui/Pagination";
import { Card } from "@/components/ui/Card";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { MOCK_LAST_UPDATE } from "@/constants/app";
import { getCampanasForSampling } from "@/lib/repositories/sample.repository";
import { useSamples } from "@/hooks/useSamples";
import type { MuestraSummary, SampleStats } from "@/types/sampling";

interface SamplingViewProps {
  initialSamples: MuestraSummary[];
  initialStats: SampleStats;
}

export function SamplingView({ initialSamples, initialStats }: SamplingViewProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editSample, setEditSample] = useState<MuestraSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MuestraSummary | null>(null);

  const {
    samples,
    stats,
    campanaId,
    selectCampana,
    registerSample,
    editSample: updateSample,
    removeSample,
    pagination,
  } = useSamples({ initialSamples, initialStats });

  const campanaOptions = [
    { value: "", label: "Todas las campañas" },
    ...getCampanasForSampling(),
  ];

  const handleFormSubmit = async (
    payload: Parameters<typeof registerSample>[0],
    editId?: string
  ) => {
    if (editId) {
      await updateSample(editId, payload);
    } else {
      await registerSample(payload);
    }
  };

  return (
    <MainLayout>
      <MonitoringHeader
        lastUpdate={MOCK_LAST_UPDATE}
        title="Registro de Muestreos"
        subtitle="Campañas · Estaciones · Muestras ambientales"
      />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 hv-animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-cyan-50 p-2.5 text-cyan-600">
                <TestTube2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-600">
                  Registre muestras por campaña y estación. Clasificación ECA automática.
                </p>
                <SimulatedDataIndicator className="mt-1" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditSample(null);
                setFormOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-cyan-700"
            >
              <Plus className="h-4 w-4" />
              Registrar Muestra
            </button>
          </div>

          <Card className="hv-animate-fade-in">
            <div className="px-5 py-4">
              <FilterSelect
                id="filter-campana-muestreos"
                label="Campaña de monitoreo"
                value={campanaId}
                options={campanaOptions}
                onChange={(v) => void selectCampana(v)}
              />
            </div>
          </Card>

          <div className="hv-animate-fade-in">
            <SampleKpiCards stats={stats} />
          </div>

          <div className="hv-animate-fade-in">
            <SampleTable
              samples={samples}
              onEdit={(s) => {
                setEditSample(s);
                setFormOpen(true);
              }}
              onDelete={setDeleteTarget}
            />
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
              itemLabel="muestras"
            />
          </Card>
        </div>
      </div>

      <SampleFormModal
        open={formOpen}
        mode={editSample ? "edit" : "create"}
        editId={editSample?.id}
        defaultCampanaId={campanaId}
        onClose={() => {
          setFormOpen(false);
          setEditSample(null);
        }}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        title="Eliminar muestra"
        description={`¿Confirma eliminar la muestra ${deleteTarget?.codigoMuestra}?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) void removeSample(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </MainLayout>
  );
}
