"use client";

import Link from "next/link";
import { Edit2, Eye, Trash2 } from "lucide-react";
import { ComplianceBadge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getComplianceLabel } from "@/lib/eca/classifier";
import { formatDate } from "@/lib/utils";
import type { MuestraSummary } from "@/types/sampling";

interface SampleTableProps {
  samples: MuestraSummary[];
  onEdit: (sample: MuestraSummary) => void;
  onDelete: (sample: MuestraSummary) => void;
}

export function SampleTable({ samples, onEdit, onDelete }: SampleTableProps) {
  if (samples.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-slate-500">
            No hay muestras registradas. Use &quot;Registrar Muestra&quot; para agregar una.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-slate-50/30">
        <CardTitle>Muestras registradas</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Código</th>
                <th className="px-5 py-3 font-semibold">Fecha</th>
                <th className="px-5 py-3 font-semibold">Estación</th>
                <th className="px-5 py-3 font-semibold">Responsable</th>
                <th className="px-5 py-3 font-semibold">Estado ECA</th>
                <th className="px-5 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {samples.map((sample) => (
                <tr
                  key={sample.id}
                  className="transition-colors hover:bg-cyan-50/40"
                >
                  <td className="px-5 py-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                      {sample.codigoMuestra}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-700">{formatDate(sample.fechaMuestreo)}</td>
                  <td className="px-5 py-3">
                    <span className="font-medium text-slate-900">{sample.estacionCodigo}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{sample.estacionNombre}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-700">{sample.responsableNombre}</td>
                  <td className="px-5 py-3">
                    <ComplianceBadge
                      status={sample.estadoECA}
                      label={getComplianceLabel(sample.estadoECA)}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <ActionButton
                        href={`/muestreos/${sample.id}`}
                        icon={Eye}
                        label="Ver"
                        variant="view"
                      />
                      <ActionButton
                        icon={Edit2}
                        label="Editar"
                        variant="edit"
                        onClick={() => onEdit(sample)}
                      />
                      <ActionButton
                        icon={Trash2}
                        label="Eliminar"
                        variant="delete"
                        onClick={() => onDelete(sample)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionButton({
  href,
  icon: Icon,
  label,
  variant,
  onClick,
}: {
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  variant: "view" | "edit" | "delete";
  onClick?: () => void;
}) {
  const styles = {
    view: "text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800",
    edit: "text-slate-600 hover:bg-slate-100 hover:text-slate-800",
    delete: "text-red-600 hover:bg-red-50 hover:text-red-700",
  };

  const className = `inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${styles[variant]}`;

  if (href) {
    return (
      <Link href={href} className={className} title={label}>
        <Icon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{label}</span>
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className} title={label}>
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
