import { ComplianceBadge } from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { getComplianceLabel } from "@/lib/eca/classifier";
import type { CriticalParameterRow } from "@/types/environmental-evaluation";

interface CriticalParametersTableProps {
  parameters: CriticalParameterRow[];
}

export function CriticalParametersTable({ parameters }: CriticalParametersTableProps) {
  return (
    <Card className="overflow-hidden border-amber-200/80">
      <CardHeader className="border-b border-amber-100 bg-amber-50/40">
        <CardTitle className="text-base text-amber-900">Parámetros críticos</CardTitle>
        <CardDescription>
          Parámetros en alerta o incumplimiento ECA — {parameters.length} detectado(s)
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0 pb-0 pt-0">
        {parameters.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-emerald-700">
            No hay parámetros críticos. Todos los valores evaluados cumplen ECA.
          </p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Parámetro</th>
                <th className="px-5 py-3 font-semibold">Valor</th>
                <th className="px-5 py-3 font-semibold">Límite ECA</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {parameters.map((row) => (
                <tr key={row.id} className="border-b border-slate-50 bg-amber-50/20">
                  <td className="px-5 py-3 font-medium text-slate-900">{row.parametro}</td>
                  <td className="px-5 py-3 font-mono">
                    {row.valor} <span className="text-xs text-slate-400">{row.unidad}</span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">{row.limiteEca}</td>
                  <td className="px-5 py-3">
                    <ComplianceBadge status={row.estado} label={getComplianceLabel(row.estado)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
