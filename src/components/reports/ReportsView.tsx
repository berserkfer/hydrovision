"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { ReportSummary } from "@/components/reports/ReportSummary";
import { ReportViewer } from "@/components/reports/ReportViewer";
import { Card } from "@/components/ui/Card";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { MOCK_LAST_UPDATE } from "@/constants/app";
import { useReports } from "@/hooks/useReports";
import type { EnvironmentalReportDocument, ReportExecutiveStats } from "@/types/report-management";

interface ReportsViewProps {
  initialReport: EnvironmentalReportDocument;
  initialStats: ReportExecutiveStats;
}

export function ReportsView({ initialReport, initialStats }: ReportsViewProps) {
  const {
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
  } = useReports(initialStats, initialReport);

  return (
    <MainLayout>
      <MonitoringHeader
        lastUpdate={MOCK_LAST_UPDATE}
        title="Reportes Ambientales"
        subtitle="Generación de informes científicos · HydroVision"
      />

      <div className="flex-1 overflow-y-auto px-6 py-6 print:overflow-visible print:p-0">
        <div className="mx-auto max-w-7xl space-y-6 print:max-w-none">
          <div className="flex flex-wrap items-center justify-between gap-4 hv-animate-fade-in print:hidden">
            <p className="text-sm text-slate-600">
              Genere reportes ejecutivos y técnicos con tablas, gráficos y conclusiones simuladas.
            </p>
            <SimulatedDataIndicator />
          </div>

          <div className="hv-animate-fade-in print:hidden">
            <ReportSummary stats={stats} />
          </div>

          <Card className="hv-animate-fade-in print:hidden">
            <div className="px-5 py-4">
              <ReportFilters
                filters={filters}
                onFilterChange={setFilter}
                onReset={resetFilters}
                onGenerate={generateReport}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </Card>

          <div className="hv-animate-fade-in">
            <ReportViewer
              report={report}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              activeSection={activeSection}
              onExportPdf={() => showExportNotice("pdf")}
              onExportExcel={() => showExportNotice("excel")}
              onPrint={printReport}
              exportMessage={exportMessage}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
