import type { StationHistoryEntry } from "@/types/station";
import { getComplianceLabel } from "@/lib/eca/classifier";
import { ComplianceBadge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatShortDate } from "@/lib/utils";

interface StationHistoryCardProps {
  history: StationHistoryEntry[];
}

/**
 * Tarjeta de historial reciente simulado de la estación.
 */
export function StationHistoryCard({ history }: StationHistoryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Historial reciente</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400">
              <th className="px-4 py-2 font-semibold">Fecha</th>
              <th className="px-4 py-2 font-semibold">Estado</th>
              <th className="px-4 py-2 font-semibold">Observación</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry) => (
              <tr
                key={entry.date}
                className="border-b border-slate-50 transition-colors hover:bg-slate-50/60"
              >
                <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                  {formatShortDate(entry.date)}
                </td>
                <td className="px-4 py-2">
                  <ComplianceBadge
                    status={entry.status}
                    label={getComplianceLabel(entry.status)}
                  />
                </td>
                <td className="px-4 py-2 text-slate-500">{entry.observation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
