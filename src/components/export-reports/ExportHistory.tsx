"use client";

import { Download, History } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import type { ExportHistoryRecord } from "@/server/reports/report.types";

interface ExportHistoryProps {
  items: ExportHistoryRecord[];
}

const FORMAT_LABELS: Record<string, string> = {
  csv: "CSV",
  xlsx: "Excel",
  pdf: "PDF",
};

export function ExportHistory({ items }: ExportHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <History className="h-4 w-4 text-cyan-600" />
          Historial de exportaciones
        </CardTitle>
        <CardDescription>Registro de archivos generados con filtros y volumen de datos</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no hay exportaciones registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-slate-500">
                  <th className="pb-2 pr-3 font-medium">Fecha</th>
                  <th className="pb-2 pr-3 font-medium">Formato</th>
                  <th className="pb-2 pr-3 font-medium">Archivo</th>
                  <th className="pb-2 pr-3 font-medium">Responsable</th>
                  <th className="pb-2 pr-3 font-medium">Registros</th>
                  <th className="pb-2 font-medium">Periodo</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-3 text-slate-700">
                      {new Date(item.createdAt).toLocaleString("es-PE")}
                    </td>
                    <td className="py-2 pr-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-medium text-cyan-800">
                        <Download className="h-3 w-3" />
                        {FORMAT_LABELS[item.fileFormat] ?? item.fileFormat}
                      </span>
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs text-slate-600">{item.fileName}</td>
                    <td className="py-2 pr-3 text-slate-700">{item.responsableNombre}</td>
                    <td className="py-2 pr-3 text-slate-700">{item.recordCount}</td>
                    <td className="py-2 text-xs text-slate-600">
                      {item.filters.fechaInicio} — {item.filters.fechaFin}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
