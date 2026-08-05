"use client";

import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import type { ExecutiveSummaryData } from "@/types/executive";
import { ENVIRONMENTAL_RISK_EMOJI } from "@/types/risk";
import { cn } from "@/lib/utils";

interface ExecutiveSummaryPanelProps {
  summary: ExecutiveSummaryData;
}

export function ExecutiveSummaryPanel({ summary }: ExecutiveSummaryPanelProps) {
  return (
    <Card className="hv-animate-fade-in overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="h-4 w-4 text-cyan-600" />
          Resumen Ejecutivo
        </CardTitle>
        <CardDescription>Síntesis automática de la cuenca</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 py-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Estado de la cuenca
          </p>
          <p className={cn("mt-1 text-sm font-semibold", summary.watershedStatusColor)}>
            {summary.watershedStatus}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Parámetros críticos
          </p>
          <ul className="mt-2 space-y-1">
            {summary.criticalParameters.map((param) => (
              <li key={param} className="flex items-center gap-2 text-xs text-slate-600">
                <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />
                {param}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Estaciones en alerta
          </p>
          {summary.alertStations.length === 0 ? (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ninguna estación en alerta
            </p>
          ) : (
            <ul className="mt-2 max-h-24 space-y-1 overflow-y-auto">
              {summary.alertStations.map((s) => (
                <li key={s.id} className="text-xs text-slate-600">
                  {s.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-red-50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase text-red-400">Fuera ECA</p>
            <p className="text-xl font-bold text-red-600">{summary.nonCompliantCount}</p>
          </div>
          <div className="rounded-lg bg-orange-50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase text-orange-400">Riesgo</p>
            <p className="text-sm font-bold text-orange-700">
              {summary.riskLevel ? ENVIRONMENTAL_RISK_EMOJI[summary.riskLevel] : "⚪"}{" "}
              {summary.riskIndex}/100
            </p>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Recomendaciones prioritarias
          </p>
          <ul className="mt-2 space-y-2">
            {summary.priorityRecommendations.map((rec) => (
              <li key={rec.id} className="flex items-start gap-2 text-xs text-slate-600">
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
      </CardContent>
    </Card>
  );
}
