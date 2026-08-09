"use client";

import type { ImportValidationSummary } from "@/server/import/import.types";

interface ImportConfirmationProps {
  summary: ImportValidationSummary;
  fileName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ImportConfirmation({
  summary,
  fileName,
  onConfirm,
  onCancel,
  loading,
}: ImportConfirmationProps) {
  const importable = summary.validCount + summary.warningCount;

  return (
    <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-5">
      <h3 className="text-base font-semibold text-slate-900">Confirmar importación</h3>
      <p className="mt-2 text-sm text-slate-600">
        Se importarán <strong>{importable}</strong> registros válidos/advertidos del archivo{" "}
        <strong>{fileName}</strong>. Los {summary.errorCount} registros con errores serán rechazados.
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Los datos se insertarán en PostgreSQL dentro de una transacción. Ante un error crítico se
        revertirá la operación.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading || importable === 0}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
        >
          {loading ? "Importando…" : "Importar datos"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
