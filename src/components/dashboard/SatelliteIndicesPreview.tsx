import type { StationSummary } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

interface SatelliteIndicesPreviewProps {
  summaries: StationSummary[];
}

export function SatelliteIndicesPreview({ summaries }: SatelliteIndicesPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Índices espectrales (vista previa)</CardTitle>
        <CardDescription>
          NDWI · NDVI · MNDWI · NDTI — valores simulados · Fase 2/4
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0 pb-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-semibold">Estación</th>
              <th className="px-5 py-3 font-semibold">Fuente</th>
              <th className="px-5 py-3 font-semibold">NDWI</th>
              <th className="px-5 py-3 font-semibold">NDVI</th>
              <th className="px-5 py-3 font-semibold">MNDWI</th>
              <th className="px-5 py-3 font-semibold">NDTI</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map(({ station, latestIndices }) => (
              <tr key={station.id} className="border-b border-slate-50">
                <td className="px-5 py-3 font-semibold text-slate-900">{station.id}</td>
                <td className="px-5 py-3 text-xs uppercase text-slate-500">
                  {latestIndices?.source ?? "—"}
                </td>
                <td className="px-5 py-3 font-mono">{latestIndices?.ndwi.toFixed(3)}</td>
                <td className="px-5 py-3 font-mono">{latestIndices?.ndvi.toFixed(3)}</td>
                <td className="px-5 py-3 font-mono">{latestIndices?.mndwi.toFixed(3)}</td>
                <td className="px-5 py-3 font-mono">{latestIndices?.ndti.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
