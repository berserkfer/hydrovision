"use client";

import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportChartButtonProps {
  onExport: () => void;
  className?: string;
}

export function ExportChartButton({ onExport, className }: ExportChartButtonProps) {
  return (
    <button
      type="button"
      onClick={onExport}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5",
        "text-sm font-medium text-slate-700 shadow-sm transition-all duration-200",
        "hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 hover:shadow-md",
        "active:scale-[0.98]",
        className
      )}
    >
      <Download className="h-4 w-4" />
      Exportar gráfico
    </button>
  );
}

interface ExportToastProps {
  visible: boolean;
  onDismiss: () => void;
}

export function ExportToast({ visible, onDismiss }: ExportToastProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[60] flex max-w-sm items-start gap-3 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 shadow-lg shadow-cyan-900/10 hv-animate-fade-in"
      role="status"
      aria-live="polite"
    >
      <Download className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-cyan-900">Exportación simulada</p>
        <p className="mt-0.5 text-xs text-cyan-700">
          El gráfico se exportaría como PNG/PDF en la Fase 5 (Reportes).
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded p-1 text-cyan-600 hover:bg-cyan-100"
        aria-label="Cerrar notificación"
      >
        ×
      </button>
    </div>
  );
}
