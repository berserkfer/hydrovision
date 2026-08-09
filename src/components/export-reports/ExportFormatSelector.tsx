"use client";

import { FileSpreadsheet, FileText, Sheet } from "lucide-react";
import type { ExportFormat } from "@/server/reports/report.types";

interface ExportFormatSelectorProps {
  format: ExportFormat;
  onChange: (format: ExportFormat) => void;
  disabled?: boolean;
}

const FORMATS: Array<{ id: ExportFormat; label: string; description: string; icon: typeof Sheet }> = [
  {
    id: "csv",
    label: "CSV",
    description: "Compatible con Excel y análisis estadístico",
    icon: Sheet,
  },
  {
    id: "xlsx",
    label: "Excel (.xlsx)",
    description: "Libro con hojas: Resumen, Estaciones, Mediciones…",
    icon: FileSpreadsheet,
  },
  {
    id: "pdf",
    label: "PDF",
    description: "Reporte científico con tablas y gráficos",
    icon: FileText,
  },
];

export function ExportFormatSelector({ format, onChange, disabled }: ExportFormatSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {FORMATS.map((item) => {
        const Icon = item.icon;
        const selected = format === item.id;
        return (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(item.id)}
            className={`rounded-xl border p-4 text-left transition ${
              selected
                ? "border-cyan-600 bg-cyan-50 ring-1 ring-cyan-600"
                : "border-slate-200 bg-white hover:border-cyan-300"
            } disabled:opacity-60`}
          >
            <Icon className={`mb-2 h-5 w-5 ${selected ? "text-cyan-700" : "text-slate-500"}`} />
            <p className="text-sm font-semibold text-slate-900">{item.label}</p>
            <p className="mt-1 text-xs text-slate-500">{item.description}</p>
          </button>
        );
      })}
    </div>
  );
}
