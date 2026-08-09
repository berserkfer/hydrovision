"use client";

import {
  Activity,
  ClipboardList,
  Clock,
  FlaskConical,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { type KpiItem } from "@/components/ui/KpiGrid";
import { formatDate } from "@/lib/utils";
import type { ExecutiveKpiMetrics } from "@/types/executive";

const KPI_ITEMS: readonly KpiItem<ExecutiveKpiMetrics>[] = [
  {
    key: "stations",
    label: "Estaciones",
    icon: MapPin,
    color: "bg-sky-50 text-sky-600",
    getValue: (k) => k.stationCount,
  },
  {
    key: "campaigns",
    label: "Campañas",
    icon: ClipboardList,
    color: "bg-violet-50 text-violet-600",
    getValue: (k) => k.campaignCount,
  },
  {
    key: "samples",
    label: "Muestras",
    icon: FlaskConical,
    color: "bg-indigo-50 text-indigo-600",
    getValue: (k) => k.sampleCount,
  },
  {
    key: "eca",
    label: "Cumplimiento ECA",
    icon: ShieldCheck,
    color: "bg-emerald-50 text-emerald-600",
    getValue: (k) => `${k.ecaCompliancePercent}%`,
  },
  {
    key: "risk",
    label: "Riesgo promedio",
    icon: Activity,
    color: "bg-orange-50 text-orange-600",
    getValue: (k) => `${k.averageRiskIndex}/100`,
  },
  {
    key: "update",
    label: "Última actualización",
    icon: Clock,
    color: "bg-slate-100 text-slate-600",
    getValue: (k) => formatDate(k.lastUpdate).split(",")[0],
  },
];

interface ExecutiveKpiPanelProps {
  kpis: ExecutiveKpiMetrics;
}

export function ExecutiveKpiPanel({ kpis }: ExecutiveKpiPanelProps) {
  return (
    <div className="hv-animate-fade-in">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Indicadores clave
        </h2>
        <span className="text-xs text-slate-400">{kpis.averageRiskLabel}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {KPI_ITEMS.map(({ key, label, icon: Icon, color, getValue }) => (
          <div
            key={key}
            className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold tabular-nums text-slate-900">
                  {getValue(kpis)}
                </p>
                <p className="truncate text-[11px] text-slate-500">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
