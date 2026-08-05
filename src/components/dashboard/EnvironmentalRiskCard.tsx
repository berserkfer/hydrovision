"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { SimulatedDataIndicator } from "@/components/ui/SimulatedDataIndicator";
import { ENVIRONMENTAL_RISK_EMOJI } from "@/types/risk";
import type { EnvironmentalIndicator } from "@/types/risk";
import { cn } from "@/lib/utils";

interface EnvironmentalRiskCardProps {
  indicator: EnvironmentalIndicator;
  stationCount: number;
  riverName: string;
}

const LEVEL_BG: Record<EnvironmentalIndicator["level"], string> = {
  bajo: "from-emerald-50/80 to-white",
  moderado: "from-amber-50/80 to-white",
  alto: "from-orange-50/80 to-white",
  muy_alto: "from-red-50/80 to-white",
};

export function EnvironmentalRiskCard({
  indicator,
  stationCount,
  riverName,
}: EnvironmentalRiskCardProps) {
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (indicator.index / 100) * circumference;

  return (
    <Card
      className={cn(
        "overflow-hidden bg-gradient-to-br transition-shadow duration-300 hover:shadow-md hv-animate-fade-in",
        LEVEL_BG[indicator.level]
      )}
    >
      <CardHeader className="border-b border-slate-100/80 bg-white/40">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <span>{ENVIRONMENTAL_RISK_EMOJI[indicator.level]}</span>
              Riesgo Ambiental
            </CardTitle>
            <CardDescription>
              {riverName} · {stationCount} estación(es) · Motor simulado
            </CardDescription>
          </div>
          <SimulatedDataIndicator />
        </div>
      </CardHeader>

      <CardContent className="py-5">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative mx-auto flex h-36 w-36 shrink-0 items-center justify-center sm:mx-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={indicator.ringColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-3xl font-bold tabular-nums", indicator.colorClass)}>
                {Math.round(indicator.index)}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                / 100
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <p
                className={cn(
                  "text-sm font-semibold uppercase tracking-wide",
                  indicator.colorClass
                )}
              >
                {indicator.levelLabel}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {indicator.explanation}
              </p>
            </div>

            {indicator.recommendations.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Recomendaciones
                </p>
                <ul className="mt-2 space-y-1.5">
                  {indicator.recommendations.map((rec) => (
                    <li
                      key={rec.id}
                      className="flex items-start gap-2 text-xs text-slate-600"
                    >
                      <span
                        className={cn(
                          "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                          rec.priority === "high"
                            ? "bg-red-500"
                            : rec.priority === "medium"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        )}
                      />
                      {rec.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
