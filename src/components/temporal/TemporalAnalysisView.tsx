"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { PageContent } from "@/components/layout/PageContent";
import { ExportChartButton, ExportToast } from "@/components/temporal/ExportChartButton";
import { TemporalComparisonChart } from "@/components/temporal/TemporalComparisonChart";
import { TemporalFiltersBar } from "@/components/temporal/TemporalFiltersBar";
import {
  TemporalStatisticsCards,
  TrendIndicatorPanel,
} from "@/components/temporal/TemporalStatisticsCards";
import { Card } from "@/components/ui/Card";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { MOCK_LAST_UPDATE } from "@/constants/app";
import { useTemporalAnalysis } from "@/hooks/useTemporalAnalysis";
import type { TemporalStationOption } from "@/repositories/temporal.repository";

interface TemporalAnalysisViewProps {
  stations: TemporalStationOption[];
}

export function TemporalAnalysisView({ stations }: TemporalAnalysisViewProps) {
  const {
    filters,
    setFilter,
    resetFilters,
    result,
    exportChart,
    exportToast,
    dismissExportToast,
  } = useTemporalAnalysis({ stations });

  return (
    <MainLayout>
      <MonitoringHeader
        lastUpdate={MOCK_LAST_UPDATE}
        title="Análisis Temporal"
        subtitle="Evolución de la calidad del agua · HydroVision"
      />

      <PageContent className="">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 hv-animate-fade-in">
            <div>
              <p className="text-sm text-slate-600">
                Visualice la evolución temporal de parámetros fisicoquímicos por estación y compare
                periodos.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <SimulatedDataIndicator />
              {result && <ExportChartButton onExport={exportChart} />}
            </div>
          </div>

          <Card className="hv-animate-fade-in">
            <div className="px-5 py-4">
              <TemporalFiltersBar
                stations={stations}
                filters={filters}
                onFilterChange={setFilter}
                onReset={resetFilters}
              />
            </div>
          </Card>

          {result && (
            <>
              <TemporalStatisticsCards result={result} />
              <TemporalComparisonChart result={result} />
              <TrendIndicatorPanel result={result} />
            </>
          )}
        </div>
      </PageContent>

      <ExportToast visible={exportToast} onDismiss={dismissExportToast} />
    </MainLayout>
  );
}
