"use client";

import { Leaf } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { InfoBadge } from "@/components/ui/Badge";
import { DataTag } from "@/components/ui/DataTag";
import { useVegetationIndex } from "@/hooks/useVegetationIndex";
import { VEGETATION_ZONES } from "@/vegetation/config/vegetation-zones.config";

const ZONE = VEGETATION_ZONES.agricultural_dren4000;

export function AgriculturalVegetationCard() {
  const { data, loading, error } = useVegetationIndex("agricultural_dren4000");

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-[var(--hv-foreground-dim)]" strokeWidth={1.5} />
            Vegetación agrícola — NDVI
          </CardTitle>
          <CardDescription>{ZONE.description}</CardDescription>
        </div>
        <DataTag tone="neutral" className="shrink-0 whitespace-nowrap">Centroide aprox.</DataTag>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <p className="text-sm text-[var(--hv-foreground-muted)]">Consultando Sentinel-2…</p>}

        {!loading && error && (
          <InfoBadge variant="warning">Error al consultar: {error}</InfoBadge>
        )}

        {!loading && !error && data && !data.found && (
          <InfoBadge variant="warning">{data.message}</InfoBadge>
        )}

        {!loading && !error && data?.found && (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-[40px] font-light leading-none tracking-[-0.02em] text-[var(--hv-ink)] tabular-nums">
                {data.value?.toFixed(3)}
              </span>
              <span className="text-xs text-[var(--hv-foreground-muted)]">NDVI (adimensional)</span>
            </div>
            {data.interpretation && (
              <InfoBadge variant="default">{data.interpretation.label}</InfoBadge>
            )}
            <p className="text-xs text-[var(--hv-foreground-muted)]">
              Escena del {data.acquisitionDate} · nubosidad {data.cloudPercentage ?? "?"}% · {data.daysFromReference}{" "}
              días de la fecha de referencia.
            </p>
          </>
        )}

        <p className="flex items-start gap-2 border-t border-[var(--hv-border)] pt-3 text-[11px] leading-relaxed text-[var(--hv-disclaimer-text)]">
          <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rotate-45 bg-amber-500" aria-hidden />
          Escala genérica de literatura, no calibrada para la etapa fenológica del arroz en esta zona.
          Solo contexto — no sustituye el muestreo de campo del cultivo.
        </p>
      </CardContent>
    </Card>
  );
}
