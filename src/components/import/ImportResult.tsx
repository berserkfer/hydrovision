"use client";

import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface ImportResultProps {
  importedRows: number;
  rejectedRows: number;
  status: string;
  message: string;
  importId: string;
}

export function ImportResult({
  importedRows,
  rejectedRows,
  status,
  message,
  importId,
}: ImportResultProps) {
  const Icon =
    status === "completed" ? CheckCircle2 : status === "partial" ? AlertTriangle : XCircle;
  const tone =
    status === "completed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : status === "partial"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-red-200 bg-red-50 text-red-900";

  return (
    <div className={`rounded-xl border p-5 ${tone}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-6 w-6 shrink-0" />
        <div>
          <h3 className="text-base font-semibold">{message}</h3>
          <p className="mt-1 text-sm opacity-90">
            ID: <span className="font-mono">{importId}</span>
          </p>
          <p className="mt-2 text-sm">
            Importados: <strong>{importedRows}</strong> · Rechazados:{" "}
            <strong>{rejectedRows}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
