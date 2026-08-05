import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { ReportTableSection } from "@/types/report-management";

interface ReportTableProps {
  section: ReportTableSection;
}

export function ReportTable({ section }: ReportTableProps) {
  if (section.rows.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-slate-50/30 py-3">
        <CardTitle className="text-sm">{section.title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0 pb-0">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
              {section.headers.map((header) => (
                <th key={header} className="px-4 py-2.5 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                {row.cells.map((cell, i) => (
                  <td key={`${row.id}-${i}`} className="px-4 py-2.5 text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

interface ReportTableListProps {
  tables: ReportTableSection[];
}

export function ReportTableList({ tables }: ReportTableListProps) {
  return (
    <div className="space-y-4">
      {tables.map((table) => (
        <ReportTable key={table.title} section={table} />
      ))}
    </div>
  );
}
