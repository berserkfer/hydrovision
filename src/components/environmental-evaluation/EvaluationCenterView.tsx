"use client";

import { FilterSelect } from "@/components/map/filters/FilterSelect";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { CriticalParametersTable } from "@/components/environmental-evaluation/CriticalParametersTable";
import { EnvironmentalCharts } from "@/components/environmental-evaluation/EnvironmentalCharts";
import { EnvironmentalDiagnosis } from "@/components/environmental-evaluation/EnvironmentalDiagnosis";
import { EnvironmentalIndicators } from "@/components/environmental-evaluation/EnvironmentalIndicators";
import { EnvironmentalRecommendations } from "@/components/environmental-evaluation/EnvironmentalRecommendations";
import { EnvironmentalStatusCard } from "@/components/environmental-evaluation/EnvironmentalStatusCard";
import { EnvironmentalSummary } from "@/components/environmental-evaluation/EnvironmentalSummary";
import { Card } from "@/components/ui/Card";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { MOCK_LAST_UPDATE } from "@/constants/app";
import { useEnvironmentalEvaluation } from "@/hooks/useEnvironmentalEvaluation";
import type {
  EnvironmentalEvaluationDocument,
  EnvironmentalEvaluationOptions,
} from "@/types/environmental-evaluation";

interface EvaluationCenterViewProps {
  initialEvaluation: EnvironmentalEvaluationDocument;
  options: EnvironmentalEvaluationOptions;
}

export function EvaluationCenterView({ initialEvaluation, options }: EvaluationCenterViewProps) {
  const { evaluation, filters, setFilter, evaluate } = useEnvironmentalEvaluation(initialEvaluation);

  return (
    <MainLayout>
      <MonitoringHeader
        lastUpdate={MOCK_LAST_UPDATE}
        title="Centro de Evaluación Ambiental"
        subtitle="Panel ejecutivo de decisión · HydroVision"
      />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 hv-animate-fade-in">
            <p className="text-sm text-slate-600">
              Vista consolidada del estado ambiental por estación o campaña — datos simulados.
            </p>
            <SimulatedDataIndicator />
          </div>

          <Card className="hv-animate-fade-in">
            <div className="flex flex-wrap items-end gap-4 px-5 py-4">
              <FilterSelect
                id="eval-estacion"
                label="Estación"
                value={filters.estacionId}
                options={options.estaciones}
                onChange={(v) => setFilter("estacionId", v)}
                className="min-w-[220px] flex-1"
              />
              <FilterSelect
                id="eval-campana"
                label="Campaña"
                value={filters.campanaId}
                options={[{ value: "", label: "Todas" }, ...options.campanas]}
                onChange={(v) => setFilter("campanaId", v)}
                className="min-w-[220px] flex-1"
              />
              <button
                type="button"
                onClick={evaluate}
                className="h-10 rounded-lg bg-cyan-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-cyan-700"
              >
                Evaluar
              </button>
            </div>
          </Card>

          <div className="hv-animate-fade-in">
            <EnvironmentalStatusCard status={evaluation.generalStatus} />
          </div>

          <div className="hv-animate-fade-in">
            <EnvironmentalIndicators indicators={evaluation.indicators} />
          </div>

          <div className="hv-animate-fade-in">
            <EnvironmentalSummary station={evaluation.stationSummary} />
          </div>

          <div className="hv-animate-fade-in">
            <CriticalParametersTable parameters={evaluation.criticalParameters} />
          </div>

          <div className="hv-animate-fade-in">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Tendencia temporal
            </h3>
            <EnvironmentalCharts trends={evaluation.temporalTrends} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2 hv-animate-fade-in">
            <EnvironmentalDiagnosis diagnosis={evaluation.diagnosis} />
            <EnvironmentalRecommendations recommendations={evaluation.recommendations} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
