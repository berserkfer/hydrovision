"use client";

import { Activity, ArrowDown, ArrowUp, Minus, TrendingUp } from "lucide-react";
import { KpiGrid, type KpiItem } from "@/components/ui/KpiGrid";
import type { TemporalAnalysisResult } from "@/types/temporal";

interface TemporalStatisticsCardsProps {
  result: TemporalAnalysisResult;
}

const STAT_ITEMS: readonly KpiItem<TemporalAnalysisResult>[] = [
  {
    key: "average",
    label: "Promedio",
    icon: Activity,
    color: "bg-cyan-50 text-cyan-600",
    getValue: (r) => r.currentStats.average,
  },
  {
    key: "maximum",
    label: "Máximo",
    icon: ArrowUp,
    color: "bg-orange-50 text-orange-600",
    getValue: (r) => r.currentStats.maximum,
  },
  {
    key: "minimum",
    label: "Mínimo",
    icon: ArrowDown,
    color: "bg-blue-50 text-blue-600",
    getValue: (r) => r.currentStats.minimum,
  },
  {
    key: "stddev",
    label: "Desv. estándar",
    icon: TrendingUp,
    color: "bg-violet-50 text-violet-600",
    getValue: (r) => r.currentStats.standardDeviation,
  },
];

export function TemporalStatisticsCards({ result }: TemporalStatisticsCardsProps) {
  const unit = result.currentSeries.unit;

  const items = STAT_ITEMS.map((item) => ({
    ...item,
    getValue: (r: TemporalAnalysisResult) => {
      const val = item.getValue(r);
      return unit !== "—" ? `${val} ${unit}` : String(val);
    },
  }));

  return (
    <div className="space-y-3 hv-animate-fade-in">
      <KpiGrid data={result} items={items} columns="4" />
      <p className="text-center text-[11px] text-slate-400">
        {result.currentStats.sampleCount} puntos de monitoreo · Desviación estándar simulada
      </p>
    </div>
  );
}

interface TrendIndicatorPanelProps {
  result: TemporalAnalysisResult;
}

export function TrendIndicatorPanel({ result }: TrendIndicatorPanelProps) {
  const { trend } = result;

  const TrendIcon =
    trend.direction === "improving"
      ? ArrowUp
      : trend.direction === "worsening"
        ? ArrowDown
        : Minus;

  return (
    <div className="grid gap-6 lg:grid-cols-2 hv-animate-fade-in">
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tendencia</p>
        <div className="mt-3 flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              trend.direction === "improving"
                ? "bg-emerald-50 text-emerald-600"
                : trend.direction === "worsening"
                  ? "bg-red-50 text-red-600"
                  : "bg-slate-100 text-slate-600"
            }`}
          >
            <TrendIcon className="h-6 w-6" />
          </div>
          <div>
            <p className={`text-xl font-bold ${trend.colorClass}`}>
              {trend.directionSymbol} {trend.directionLabel}
            </p>
            <p className="text-xs text-slate-500">
              Variación vs periodo anterior: {trend.changePercent > 0 ? "+" : ""}
              {trend.changePercent}%
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-slate-700">{trend.interpretation}</p>
      </div>

      {trend.recommendations.length > 0 && (
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Recomendaciones
          </p>
          <ul className="mt-3 space-y-2">
            {trend.recommendations.map((rec) => (
              <li key={rec.id} className="flex items-start gap-2 text-sm text-slate-600">
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    rec.priority === "high"
                      ? "bg-red-500"
                      : rec.priority === "medium"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                />
                {rec.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
