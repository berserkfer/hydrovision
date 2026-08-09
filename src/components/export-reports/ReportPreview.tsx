"use client";

import { AlertTriangle, Calendar, Database, MapPin, TestTube } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import type { ExportPreviewDto } from "@/server/reports/report.types";

interface ReportPreviewProps {
  preview: ExportPreviewDto | null;
}

export function ReportPreview({ preview }: ReportPreviewProps) {
  if (!preview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Vista previa</CardTitle>
          <CardDescription>Configure filtros y pulse «Vista previa» para ver el resumen.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const stats = preview.statistics;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Vista previa de exportación</CardTitle>
        <CardDescription>
          {preview.isEmpty
            ? preview.message ?? "Sin registros"
            : `${preview.recordCount} registros listos para exportar`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {preview.isEmpty && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{preview.message}</span>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <PreviewStat icon={Database} label="Registros" value={String(stats.totalRegistros)} />
          <PreviewStat icon={TestTube} label="Mediciones" value={String(stats.totalMediciones)} />
          <PreviewStat icon={MapPin} label="Estaciones" value={String(stats.totalEstaciones)} />
          <PreviewStat
            icon={Calendar}
            label="Rango de fechas"
            value={
              preview.dateRange
                ? `${preview.dateRange.inicio} — ${preview.dateRange.fin}`
                : "—"
            }
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium text-slate-600">Estaciones seleccionadas</p>
            <p className="text-sm text-slate-800">
              {preview.estaciones.length ? preview.estaciones.join(", ") : "Ninguna"}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-slate-600">Parámetros incluidos</p>
            <p className="text-sm text-slate-800">
              {preview.parametros.length ? preview.parametros.join(", ") : "Ninguno"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PreviewStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Database;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
