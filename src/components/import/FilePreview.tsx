"use client";

import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeaderCell, DataTableRow } from "@/components/ui/DataTable";

interface FilePreviewProps {
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
  columnCount: number;
}

export function FilePreview({ headers, rows, rowCount, columnCount }: FilePreviewProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Filas detectadas" value={String(rowCount)} />
        <Stat label="Columnas" value={String(columnCount)} />
        <Stat label="Vista previa" value={`${rows.length} filas`} />
      </div>

      <DataTable>
        <table className="w-full min-w-[640px] text-left text-sm">
          <DataTableHead>
            {headers.map((h) => (
              <DataTableHeaderCell key={h}>{h}</DataTableHeaderCell>
            ))}
          </DataTableHead>
          <DataTableBody>
            {rows.map((row, idx) => (
              <DataTableRow key={idx}>
                {headers.map((h) => (
                  <DataTableCell key={h}>{row[h] || "—"}</DataTableCell>
                ))}
              </DataTableRow>
            ))}
          </DataTableBody>
        </table>
      </DataTable>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
