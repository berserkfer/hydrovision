"use client";

import { useCallback, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ExportFormatSelector } from "@/components/export-reports/ExportFormatSelector";
import { ExportHistory } from "@/components/export-reports/ExportHistory";
import { ReportCharts } from "@/components/export-reports/ReportCharts";
import { ReportFilters } from "@/components/export-reports/ReportFilters";
import { ReportPreview } from "@/components/export-reports/ReportPreview";
import { ReportSummary } from "@/components/export-reports/ReportSummary";
import { MOCK_LAST_UPDATE } from "@/constants/app";
import {
  downloadBlob,
  exportReport,
  fetchExportHistory,
  previewExport,
} from "@/lib/api/reports.client";
import { notifyError, notifySuccess } from "@/lib/api/notify";
import type {
  ExportFilterOptions,
  ExportFormat,
  ExportHistoryRecord,
  ExportPreviewDto,
  ExportReportFilters,
  ExportSections,
} from "@/server/reports/report.types";
import {
  DEFAULT_EXPORT_FILTERS,
  DEFAULT_EXPORT_SECTIONS,
} from "@/server/reports/report.types";

interface ExportReportsViewProps {
  initialHistory: ExportHistoryRecord[];
  filterOptions: ExportFilterOptions;
}

const SECTION_LABELS: Array<{ key: keyof ExportSections; label: string }> = [
  { key: "resumen", label: "Resumen" },
  { key: "estaciones", label: "Estaciones" },
  { key: "mediciones", label: "Mediciones" },
  { key: "graficos", label: "Gráficos" },
  { key: "evaluacion", label: "Evaluación ambiental" },
  { key: "conclusiones", label: "Conclusiones" },
];

export function ExportReportsView({ initialHistory, filterOptions }: ExportReportsViewProps) {
  const [filters, setFilters] = useState<ExportReportFilters>(DEFAULT_EXPORT_FILTERS);
  const [sections, setSections] = useState<ExportSections>(DEFAULT_EXPORT_SECTIONS);
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [preview, setPreview] = useState<ExportPreviewDto | null>(null);
  const [history, setHistory] = useState(initialHistory);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.cuencaId ||
          filters.rioId ||
          filters.estacionId ||
          filters.campanaId ||
          filters.parametroCodigo ||
          filters.categoria ||
          filters.estadoAmbiental
      ),
    [filters]
  );

  const handleFilterChange = useCallback(
    <K extends keyof ExportReportFilters>(key: K, value: ExportReportFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_EXPORT_FILTERS);
    setPreview(null);
  }, []);

  const handlePreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const result = await previewExport(filters);
      setPreview(result);
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Error en vista previa");
    } finally {
      setPreviewLoading(false);
    }
  }, [filters]);

  const refreshHistory = useCallback(async () => {
    const data = await fetchExportHistory();
    setHistory(data.items);
  }, []);

  const handleExport = useCallback(async () => {
    setExportLoading(true);
    try {
      const { blob, fileName, recordCount } = await exportReport({ filters, format, sections });
      downloadBlob(blob, fileName);
      notifySuccess(`Exportación completada (${recordCount} registros)`);
      await refreshHistory();
      if (!preview) {
        const nextPreview = await previewExport(filters);
        setPreview(nextPreview);
      }
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Error al exportar");
    } finally {
      setExportLoading(false);
    }
  }, [filters, format, sections, preview, refreshHistory]);

  const toggleSection = (key: keyof ExportSections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <MainLayout>
      <MonitoringHeader
        lastUpdate={MOCK_LAST_UPDATE}
        title="Exportación y Reportes"
        subtitle="Exporte datos ambientales filtrados para análisis científico e informes técnicos"
      />

      <div className="space-y-6 p-4 md:p-6">
        <Card className="p-4 md:p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Filtros de exportación</h2>
          <ReportFilters
            filters={filters}
            options={filterOptions}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
            onPreview={handlePreview}
            hasActiveFilters={hasActiveFilters}
            loading={previewLoading}
          />
        </Card>

        {previewLoading && <LoadingState message="Calculando vista previa…" />}

        <ReportPreview preview={preview} />
        <ReportSummary preview={preview} />

        {preview && preview.charts.length > 0 && sections.graficos && (
          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Gráficos (datos filtrados)</h2>
            <ReportCharts charts={preview.charts} />
          </div>
        )}

        <Card className="p-4 md:p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Secciones del reporte</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SECTION_LABELS.map(({ key, label }) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={sections[key]}
                  onChange={() => toggleSection(key)}
                  className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                {label}
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Formato de exportación</h2>
          <ExportFormatSelector format={format} onChange={setFormat} disabled={exportLoading} />
          <div className="mt-4">
            <button
              type="button"
              onClick={handleExport}
              disabled={exportLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {exportLoading ? "Generando archivo…" : "Exportar datos"}
            </button>
          </div>
        </Card>

        <ExportHistory items={history} />
      </div>
    </MainLayout>
  );
}
