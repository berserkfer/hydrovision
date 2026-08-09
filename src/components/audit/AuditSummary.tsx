"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import type { AuditSummary } from "@/server/audit/audit.types";
import { AUDIT_ACTION_LABELS } from "@/server/audit/audit.types";

interface AuditSummaryProps {
  summary: AuditSummary;
}

export function AuditSummary({ summary }: AuditSummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Resumen de auditoría</CardTitle>
        <CardDescription>Trazabilidad agregada del periodo filtrado</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total eventos" value={String(summary.total)} />
          <Stat label="Últimas 24 h" value={String(summary.last24h)} />
          <Stat
            label="Último evento"
            value={summary.lastEventAt ? new Date(summary.lastEventAt).toLocaleString("es-PE") : "—"}
          />
          <Stat label="Tipos de entidad" value={String(Object.keys(summary.byEntity).length)} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(Object.entries(summary.byAction) as Array<[keyof typeof AUDIT_ACTION_LABELS, number]>)
            .filter(([, count]) => count > 0)
            .map(([action, count]) => (
              <span
                key={action}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
              >
                {AUDIT_ACTION_LABELS[action]}: {count}
              </span>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
