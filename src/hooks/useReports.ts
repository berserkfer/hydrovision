"use client";

import { useCallback, useMemo, useState } from "react";
import { buildEnvironmentalReport, getReportExecutiveStats } from "@/lib/repositories/report.repository";
import type {
  EnvironmentalReportDocument,
  ReportExecutiveStats,
  ReportFilters,
  ReportTabId,
} from "@/types/report-management";
import { DEFAULT_REPORT_FILTERS } from "@/types/report-management";

export function useReports(
  initialStats: ReportExecutiveStats,
  initialReport?: EnvironmentalReportDocument
) {
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_REPORT_FILTERS);
  const [activeTab, setActiveTab] = useState<ReportTabId>("executive");
  const [report, setReport] = useState<EnvironmentalReportDocument>(
    () => initialReport ?? buildEnvironmentalReport(DEFAULT_REPORT_FILTERS)
  );
  const [stats, setStats] = useState(initialStats);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.cuencaId ||
          filters.rioId ||
          filters.estacionId ||
          filters.campanaId ||
          filters.fechaInicio !== DEFAULT_REPORT_FILTERS.fechaInicio ||
          filters.fechaFin !== DEFAULT_REPORT_FILTERS.fechaFin
      ),
    [filters]
  );

  const setFilter = useCallback(<K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "cuencaId") {
        next.rioId = "";
        next.estacionId = "";
      }
      if (key === "rioId") next.estacionId = "";
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_REPORT_FILTERS);
  }, []);

  const generateReport = useCallback(() => {
    const doc = buildEnvironmentalReport(filters);
    setReport(doc);
    setStats(getReportExecutiveStats(filters));
  }, [filters]);

  const showExportNotice = useCallback((format: "pdf" | "excel") => {
    const label = format === "pdf" ? "PDF" : "Excel";
    setExportMessage(
      `Exportación ${label} preparada — generación real disponible en fase posterior. Vista previa lista.`
    );
    setTimeout(() => setExportMessage(null), 4000);
  }, []);

  const printReport = useCallback(() => {
    window.print();
  }, []);

  const activeSection = report.sections[activeTab];

  return {
    filters,
    setFilter,
    resetFilters,
    hasActiveFilters,
    activeTab,
    setActiveTab,
    report,
    activeSection,
    stats,
    generateReport,
    showExportNotice,
    printReport,
    exportMessage,
  };
}
