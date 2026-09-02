"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { PageContent } from "@/components/layout/PageContent";
import { IndicatorsGrid, IndicatorsToolbar } from "@/components/indicators/IndicatorsCenter";
import { Card, CardContent } from "@/components/ui/Card";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { MOCK_LAST_UPDATE } from "@/constants/app";
import { useIndicatorsCenter } from "@/hooks/useIndicatorsCenter";
import { useMapFilters } from "@/hooks/useMapFilters";
import { INDICATOR_SCORE_LABELS } from "@/types/indicators";
import { SCORE_COLORS } from "@/services/indicators";

export function IndicatorsCenterView() {
  const { riverContext, summaries: filteredSummaries, filteredStats } = useMapFilters();

  const {
    result,
    query,
    categories,
    setSearch,
    setCategory,
    setStatus,
    setSortBy,
    toggleSortOrder,
    toggleGroupByCategory,
    resetQuery,
  } = useIndicatorsCenter({
    stats: filteredStats,
    summaries: filteredSummaries,
    riverId: riverContext.river.id,
  });

  return (
    <MainLayout>
      <MonitoringHeader
        lastUpdate={MOCK_LAST_UPDATE}
        title="Centro de Indicadores Ambientales"
        subtitle={`${riverContext.watershed.name} · Environmental Indicators Engine · HydroVision`}
      />

      <PageContent className="">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 hv-animate-fade-in">
            <p className="text-sm text-slate-600">
              Motor central de indicadores — calidad del agua, riesgo, ECA, tendencias y más.
            </p>
            <SimulatedDataIndicator />
          </div>

          <IndicatorsToolbar
            query={query}
            categories={categories}
            totalCount={result.totalCount}
            averageScore={result.averageScore}
            onSearchChange={setSearch}
            onCategoryChange={setCategory}
            onStatusChange={setStatus}
            onSortByChange={setSortBy}
            onToggleSortOrder={toggleSortOrder}
            onToggleGroup={toggleGroupByCategory}
            onReset={resetQuery}
          />

          <Card className="hv-animate-fade-in">
            <CardContent className="py-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Escala de puntuación (0–100)
              </p>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(INDICATOR_SCORE_LABELS) as [keyof typeof INDICATOR_SCORE_LABELS, string][]).map(
                  ([key, label]) => (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white"
                      style={{ backgroundColor: SCORE_COLORS[key] }}
                    >
                      {label}
                    </span>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {query.groupByCategory && result.groups.length > 0 ? (
            <div className="space-y-8">
              {result.groups.map((group) => (
                <IndicatorsGrid
                  key={group.category}
                  indicators={group.indicators}
                  groupLabel={group.categoryLabel}
                />
              ))}
            </div>
          ) : (
            <IndicatorsGrid indicators={result.indicators} />
          )}
        </div>
      </PageContent>
    </MainLayout>
  );
}
