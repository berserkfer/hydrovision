"use client";

import type { ImportHistoryRecord } from "@/server/import/import.types";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeaderCell, DataTableRow } from "@/components/ui/DataTable";
import { formatDateOnly } from "@/lib/utils";

interface ImportHistoryProps {
  items: ImportHistoryRecord[];
}

export function ImportHistory({ items }: ImportHistoryProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
        Aún no hay importaciones registradas.
      </p>
    );
  }

  return (
    <DataTable>
      <table className="w-full min-w-[900px] text-left text-sm">
        <DataTableHead>
          <DataTableHeaderCell>Fecha</DataTableHeaderCell>
          <DataTableHeaderCell>Archivo</DataTableHeaderCell>
          <DataTableHeaderCell>Responsable</DataTableHeaderCell>
          <DataTableHeaderCell>Total</DataTableHeaderCell>
          <DataTableHeaderCell>Importados</DataTableHeaderCell>
          <DataTableHeaderCell>Rechazados</DataTableHeaderCell>
          <DataTableHeaderCell>Estado</DataTableHeaderCell>
        </DataTableHead>
        <DataTableBody>
          {items.map((item) => (
            <DataTableRow key={item.id}>
              <DataTableCell>{formatDateOnly(item.startedAt.slice(0, 10))}</DataTableCell>
              <DataTableCell className="font-medium">{item.fileName}</DataTableCell>
              <DataTableCell>{item.responsableNombre}</DataTableCell>
              <DataTableCell>{item.totalRows}</DataTableCell>
              <DataTableCell>{item.importedRows}</DataTableCell>
              <DataTableCell>{item.rejectedRows}</DataTableCell>
              <DataTableCell className="capitalize">{item.status}</DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </table>
    </DataTable>
  );
}
