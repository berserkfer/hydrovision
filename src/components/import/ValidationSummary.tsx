"use client";

import type { ImportValidationSummary } from "@/server/import/import.types";
import { cn } from "@/lib/utils";

interface ValidationSummaryProps {
  summary: ImportValidationSummary;
}

export function ValidationSummary({ summary }: ValidationSummaryProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Badge label="Total" value={summary.totalRows} tone="neutral" />
        <Badge label="Válidos" value={summary.validCount} tone="success" />
        <Badge label="Advertencias" value={summary.warningCount} tone="warning" />
        <Badge label="Errores" value={summary.errorCount} tone="error" />
      </div>

      <p className="text-sm text-slate-600">
        {summary.totalRows} registros encontrados · {summary.validCount} válidos ·{" "}
        {summary.warningCount} con advertencias · {summary.errorCount} con errores
      </p>

      <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2">Fila</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {summary.rows
              .filter((r) => r.status !== "valid")
              .slice(0, 50)
              .map((row) => (
                <tr key={row.rowIndex} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono">{row.rowIndex}</td>
                  <td className="px-3 py-2">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="px-3 py-2 text-slate-600">{row.messages.join(" · ")}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Badge({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "success" | "warning" | "error";
}) {
  const colors = {
    neutral: "border-slate-200 bg-white text-slate-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    error: "border-red-200 bg-red-50 text-red-800",
  };
  return (
    <div className={cn("rounded-lg border px-4 py-3 shadow-sm", colors[tone])}>
      <p className="text-xs uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: "valid" | "warning" | "error" }) {
  if (status === "valid") return null;
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
        status === "warning" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
      )}
    >
      {status === "warning" ? "Advertencia" : "Error"}
    </span>
  );
}
