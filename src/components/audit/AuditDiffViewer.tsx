"use client";

import type { AuditAction, AuditDiffField } from "@/server/audit/audit.types";

interface AuditDiffViewerProps {
  diff: AuditDiffField[];
  previousData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  action: AuditAction;
}

export function AuditDiffViewer({ diff, previousData, newData, action }: AuditDiffViewerProps) {
  const changedFields = diff.filter((d) => d.changed);

  if (action === "CREATE" && newData) {
    return (
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Datos creados
        </h3>
        <JsonBlock data={newData} />
      </section>
    );
  }

  if (action === "DELETE" && previousData) {
    return (
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Datos eliminados
        </h3>
        <JsonBlock data={previousData} />
      </section>
    );
  }

  if (changedFields.length === 0) {
    return (
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        No se detectaron diferencias de campos entre versiones.
      </section>
    );
  }

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Comparación de cambios
      </h3>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Campo</th>
              <th className="px-3 py-2 font-medium">Valor anterior</th>
              <th className="px-3 py-2 font-medium">Valor nuevo</th>
            </tr>
          </thead>
          <tbody>
            {changedFields.map((row) => (
              <tr key={row.field} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-800">{row.field}</td>
                <td className="px-3 py-2 text-red-700/90">{row.previous}</td>
                <td className="px-3 py-2 text-emerald-700">{row.next}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function JsonBlock({ data }: { data: Record<string, unknown> }) {
  return (
    <pre className="max-h-64 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
