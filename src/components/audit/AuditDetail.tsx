"use client";

import { Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { AuditDiffViewer } from "@/components/audit/AuditDiffViewer";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
  type AuditLogDetail,
} from "@/server/audit/audit.types";

interface AuditDetailProps {
  detail: AuditLogDetail | null;
  loading?: boolean;
}

export function AuditDetail({ detail, loading }: AuditDetailProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-slate-500">Cargando detalle…</CardContent>
      </Card>
    );
  }

  if (!detail) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Detalle de auditoría</CardTitle>
          <CardDescription>Seleccione un registro de la tabla para ver el detalle.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4 text-cyan-600" />
          Detalle de auditoría
        </CardTitle>
        <CardDescription>Solo lectura — los registros históricos no pueden modificarse</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-2 sm:grid-cols-2 text-sm">
          <Item label="Fecha y hora" value={new Date(detail.timestamp).toLocaleString("es-PE")} />
          <Item label="Entidad" value={AUDIT_ENTITY_LABELS[detail.entityType] ?? detail.entityType} />
          <Item label="ID registro" value={detail.entityId} mono />
          <Item label="Acción" value={AUDIT_ACTION_LABELS[detail.action]} />
          <Item label="Responsable" value={detail.responsibleUser} />
          <Item label="Descripción" value={detail.description} />
        </dl>

        <AuditDiffViewer
          diff={detail.diff}
          previousData={detail.previousData}
          newData={detail.newData}
          action={detail.action}
        />
      </CardContent>
    </Card>
  );
}

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`text-slate-900 ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
