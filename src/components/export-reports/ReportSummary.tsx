"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import type { ExportPreviewDto } from "@/server/reports/report.types";

interface ReportSummaryProps {
  preview: ExportPreviewDto | null;
}

export function ReportSummary({ preview }: ReportSummaryProps) {
  if (!preview) return null;

  const s = preview.statistics;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Resumen estadístico</CardTitle>
        <CardDescription>Indicadores calculados sobre los datos filtrados</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatItem label="Cumplimiento ECA" value={`${s.cumplimientoEcaPct}%`} />
          <StatItem label="Total campañas" value={String(s.totalCampanas)} />
          <StatItem label="Total evaluaciones" value={String(s.totalEvaluaciones)} />
          <StatItem label="Valor promedio" value={s.valorPromedio != null ? String(s.valorPromedio) : "—"} />
          <StatItem label="Valor mínimo" value={s.valorMin != null ? String(s.valorMin) : "—"} />
          <StatItem label="Valor máximo" value={s.valorMax != null ? String(s.valorMax) : "—"} />
          <StatItem
            label="Desviación estándar"
            value={s.desviacionEstandar != null ? String(s.desviacionEstandar) : "—"}
          />
        </dl>
      </CardContent>
    </Card>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
