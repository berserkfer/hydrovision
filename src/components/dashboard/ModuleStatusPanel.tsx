import type { StationSummary } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { EARTH_ENGINE_STATUS } from "@/lib/earth-engine/client";
import { AI_MODULE_STATUS } from "@/lib/ai/client";
import { REPORTS_MODULE_STATUS } from "@/lib/reports/pdf";
import { Brain, FileText, Satellite } from "lucide-react";

interface ModuleStatusProps {
  summaries: StationSummary[];
}

export function ModuleStatusPanel({ summaries }: ModuleStatusProps) {
  const avgNdwi =
    summaries.reduce((acc, s) => acc + (s.latestIndices?.ndwi ?? 0), 0) / summaries.length;

  const modules = [
    {
      icon: Satellite,
      title: "Google Earth Engine",
      status: EARTH_ENGINE_STATUS.message,
      metric: `NDWI prom. simulado: ${avgNdwi.toFixed(3)}`,
      phase: 4,
    },
    {
      icon: Brain,
      title: "Inteligencia Artificial",
      status: AI_MODULE_STATUS.message,
      metric: `Versión planificada: ${AI_MODULE_STATUS.plannedVersion}`,
      phase: 6,
    },
    {
      icon: FileText,
      title: "Reportes PDF",
      status: REPORTS_MODULE_STATUS.message,
      metric: "Exportación técnica para tesis",
      phase: 5,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Módulos preparados</CardTitle>
        <CardDescription>Integraciones planificadas por fase</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {modules.map(({ icon: Icon, title, status, metric, phase }) => (
          <div
            key={title}
            className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm">
                <Icon className="h-4 w-4 text-cyan-600" />
              </div>
              <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                Fase {phase}
              </span>
            </div>
            <h4 className="mt-3 text-sm font-semibold text-slate-900">{title}</h4>
            <p className="mt-1 text-xs text-slate-500">{status}</p>
            <p className="mt-2 text-[11px] text-slate-400">{metric}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
