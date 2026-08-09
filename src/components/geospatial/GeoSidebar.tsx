"use client";

import type { ReactNode } from "react";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { GeoStationDetail } from "@/types/geospatial-center";
import { GEO_STATUS_COLORS } from "@/types/geospatial-center";

interface GeoSidebarProps {
  detail: GeoStationDetail | null;
  onClose: () => void;
}

function statusColor(detail: GeoStationDetail): string {
  if (detail.complianceStatus === "compliant") return GEO_STATUS_COLORS.good;
  if (detail.complianceStatus === "alert") return GEO_STATUS_COLORS.alert;
  if (detail.complianceStatus === "non_compliant") return GEO_STATUS_COLORS.critical;
  return GEO_STATUS_COLORS.unknown;
}

export function GeoSidebar({ detail, onClose }: GeoSidebarProps) {
  if (!detail) {
    return (
      <aside className="h-full">
        <EmptyState
          icon={MapPin}
          variant="panel"
          title="Seleccione una estación en el mapa"
          description="El panel lateral mostrará la ficha ambiental completa."
          className="h-full"
        />
      </aside>
    );
  }

  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Estación</p>
          <h2 className="text-lg font-semibold text-slate-900">{detail.nombre}</h2>
          <p className="font-mono text-xs text-slate-500">{detail.codigo}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Cerrar panel"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <Card className="border-0 bg-slate-50 p-3">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: statusColor(detail) }}
              aria-hidden
            />
            <span className="text-sm font-medium text-slate-800">{detail.estadoAmbiental}</span>
          </div>
        </Card>

        <Section title="Ubicación">
          <InfoRow label="Cuenca" value={detail.cuenca} />
          <InfoRow label="Río" value={detail.rio} />
          <InfoRow label="Coordenadas" value={detail.coordenadas} mono />
        </Section>

        <Section title="Monitoreo">
          <InfoRow label="Última campaña" value={detail.ultimaCampana} />
          <InfoRow label="Mediciones" value={String(detail.cantidadMediciones)} />
        </Section>

        <Section title="Índice satelital (simulado)">
          <p className="text-sm text-slate-700">{detail.indiceSatelital}</p>
        </Section>

        <Section title="Últimos parámetros">
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
            {detail.parametros.map((param) => (
              <li
                key={param.label}
                className="flex items-center justify-between px-3 py-2 text-sm"
              >
                <span className="text-slate-600">{param.label}</span>
                <span className="font-mono font-medium text-slate-900">
                  {param.value}
                  {param.unit !== "—" && (
                    <span className="ml-1 text-xs font-normal text-slate-500">{param.unit}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium text-slate-800 ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}
