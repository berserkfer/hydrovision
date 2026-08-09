"use client";

import { FilterSelect } from "@/components/map/filters/FilterSelect";
import { IMPORT_FIELD_LABELS, type ColumnMapping, type ImportField } from "@/server/import/import.types";

const FIELD_OPTIONS: { value: ImportField; label: string }[] = (
  Object.entries(IMPORT_FIELD_LABELS) as [ImportField, string][]
).map(([value, label]) => ({ value, label }));

interface ColumnMapperProps {
  headers: string[];
  mapping: ColumnMapping;
  onChange: (mapping: ColumnMapping) => void;
}

export function ColumnMapper({ headers, mapping, onChange }: ColumnMapperProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Revise el mapeo automático. Asigne cada columna del archivo al campo correspondiente del sistema.
      </p>
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {headers.map((header) => (
          <div
            key={header}
            className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">{header}</p>
              <p className="text-xs text-slate-500">Columna del archivo</p>
            </div>
            <div className="w-full sm:w-64">
              <FilterSelect
                id={`map-${header}`}
                label="Campo destino"
                hideLabel
                value={mapping[header] ?? "skip"}
                options={FIELD_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                onChange={(v) =>
                  onChange({ ...mapping, [header]: v as ImportField })
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
