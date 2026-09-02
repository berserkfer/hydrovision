"use client";

import { useCallback, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { PageContent } from "@/components/layout/PageContent";
import { Card } from "@/components/ui/Card";
import { AuditDetail } from "@/components/audit/AuditDetail";
import { AuditFilters } from "@/components/audit/AuditFilters";
import { AuditSummary } from "@/components/audit/AuditSummary";
import { AuditTable } from "@/components/audit/AuditTable";
import { MOCK_LAST_UPDATE } from "@/constants/app";
import { fetchAuditDetail, fetchAuditLogs } from "@/lib/api/audit.client";
import { notifyError } from "@/lib/api/notify";
import type { AuditFilters as AuditFiltersType, AuditLogDetail, AuditLogRecord, AuditSummary as AuditSummaryType } from "@/server/audit/audit.types";

interface AuditViewProps {
  initialItems: AuditLogRecord[];
  initialSummary: AuditSummaryType;
}

export function AuditView({ initialItems, initialSummary }: AuditViewProps) {
  const [filters, setFilters] = useState<AuditFiltersType>({});
  const [items, setItems] = useState(initialItems);
  const [summary, setSummary] = useState(initialSummary);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AuditLogDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);

  const responsables = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((i) => map.set(i.responsableId, i.responsibleUser));
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [items]);

  const handleFilterChange = useCallback(
    <K extends keyof AuditFiltersType>(key: K, value: AuditFiltersType[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const loadList = useCallback(async (nextFilters: AuditFiltersType) => {
    setListLoading(true);
    try {
      const data = await fetchAuditLogs(nextFilters);
      setItems(data.items);
      setSummary(data.summary);
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Error al cargar auditoría");
    } finally {
      setListLoading(false);
    }
  }, []);

  const handleApply = useCallback(() => {
    void loadList(filters);
  }, [filters, loadList]);

  const handleReset = useCallback(() => {
    setFilters({});
    void loadList({});
  }, [loadList]);

  const handleSelect = useCallback(async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const data = await fetchAuditDetail(id);
      setDetail(data);
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Error al cargar detalle");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  return (
    <MainLayout>
      <MonitoringHeader
        lastUpdate={MOCK_LAST_UPDATE}
        title="Auditoría"
        subtitle="Trazabilidad de cambios sobre la información ambiental · HydroVision"
      />

      <PageContent className="space-y-6">
        <Card className="p-4 md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-cyan-600" />
            <h2 className="text-sm font-semibold text-slate-900">Filtros</h2>
          </div>
          <AuditFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
            onApply={handleApply}
            responsables={responsables}
          />
        </Card>

        <AuditSummary summary={summary} />

        <div className="grid gap-6 xl:grid-cols-5">
          <div className="xl:col-span-3">
            {listLoading ? (
              <p className="text-sm text-slate-500">Actualizando registros…</p>
            ) : (
              <AuditTable items={items} selectedId={selectedId} onSelect={handleSelect} />
            )}
          </div>
          <div className="xl:col-span-2">
            <AuditDetail detail={detail} loading={detailLoading} />
          </div>
        </div>
      </PageContent>
    </MainLayout>
  );
}
