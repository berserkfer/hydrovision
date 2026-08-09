"use client";

import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
  type AuditLogRecord,
} from "@/server/audit/audit.types";

interface AuditTableProps {
  items: AuditLogRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-50 text-emerald-800",
  UPDATE: "bg-blue-50 text-blue-800",
  DELETE: "bg-red-50 text-red-800",
  IMPORT: "bg-violet-50 text-violet-800",
  EXPORT: "bg-amber-50 text-amber-800",
};

export function AuditTable({ items, selectedId, onSelect }: AuditTableProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
        No hay registros de auditoría para los filtros seleccionados.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th className="px-3 py-2 font-medium">Fecha</th>
            <th className="px-3 py-2 font-medium">Entidad</th>
            <th className="px-3 py-2 font-medium">Registro</th>
            <th className="px-3 py-2 font-medium">Acción</th>
            <th className="px-3 py-2 font-medium">Responsable</th>
            <th className="px-3 py-2 font-medium">Descripción</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const selected = selectedId === item.id;
            return (
              <tr
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`cursor-pointer border-t border-slate-100 transition hover:bg-cyan-50/50 ${
                  selected ? "bg-cyan-50" : "bg-white"
                }`}
              >
                <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                  {new Date(item.timestamp).toLocaleString("es-PE")}
                </td>
                <td className="px-3 py-2 text-slate-800">
                  {AUDIT_ENTITY_LABELS[item.entityType] ?? item.entityType}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-slate-600">{item.entityId}</td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      ACTION_COLORS[item.action] ?? "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {AUDIT_ACTION_LABELS[item.action]}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-700">{item.responsibleUser}</td>
                <td className="max-w-xs truncate px-3 py-2 text-slate-600" title={item.description}>
                  {item.description}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
