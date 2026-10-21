"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Waves } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { InfoBadge } from "@/components/ui/Badge";
import { DataTag } from "@/components/ui/DataTag";
import { useVegetationIndex } from "@/hooks/useVegetationIndex";
import { VEGETATION_ZONES } from "@/vegetation/config/vegetation-zones.config";
import { DEFAULT_LAGOON_ALERT_THRESHOLD } from "@/vegetation/config/vegetation-alert.config";

const ZONE = VEGETATION_ZONES.lagoon_santa_rosa;

export function LagoonVegetationCard() {
  const [threshold, setThreshold] = useState(DEFAULT_LAGOON_ALERT_THRESHOLD);
  const { data, loading, error, refetch } = useVegetationIndex("lagoon_santa_rosa", { threshold });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Waves className="h-4 w-4 text-[var(--hv-foreground-dim)]" strokeWidth={1.5} />
            Vegetación de laguna — NDCI
          </CardTitle>
          <CardDescription>{ZONE.description}</CardDescription>
        </div>
        <DataTag tone="neutral" className="shrink-0 whitespace-nowrap">Centroide aprox.</DataTag>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="flex items-center gap-2 text-xs text-[var(--hv-foreground-muted)]">
          Umbral de alerta (configurable, no normativo)
          <input
            type="number"
            step="0.01"
            min={-1}
            max={1}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            onBlur={() => refetch()}
            className="w-20 rounded-md border border-[var(--hv-border)] bg-[var(--hv-surface-secondary)] px-2 py-1 text-xs text-[var(--hv-foreground)]"
          />
        </label>

        {loading && <p className="text-sm text-[var(--hv-foreground-muted)]">Consultando Sentinel-2…</p>}

        {!loading && error && <InfoBadge variant="warning">Error al consultar: {error}</InfoBadge>}

        {!loading && !error && data && (
          <>
            {data.alert?.status === "insufficient_data" && (
              <InfoBadge variant="warning">{data.alert.message}</InfoBadge>
            )}

            {data.alert?.status === "alert" && (
              <div className="flex items-start gap-2 rounded-md bg-amber-500/10 p-2 text-xs text-amber-800 ring-1 ring-inset ring-amber-500/30 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{data.alert.message}</span>
              </div>
            )}

            {data.alert?.status === "normal" && (
              <div className="flex items-start gap-2 rounded-md bg-emerald-500/10 p-2 text-xs text-emerald-800 ring-1 ring-inset ring-emerald-500/30 dark:text-emerald-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{data.alert.message}</span>
              </div>
            )}

            {data.found && (
              <p className="text-xs text-[var(--hv-foreground-muted)]">
                Escena del {data.acquisitionDate} · nubosidad {data.cloudPercentage ?? "?"}% ·{" "}
                {data.daysFromReference} días de la fecha de referencia.
                {data.provider ? ` Fuente: ${data.provider}.` : ""}
              </p>
            )}
          </>
        )}

        <p className="flex items-start gap-2 border-t border-[var(--hv-border)] pt-3 text-[11px] leading-relaxed text-[var(--hv-disclaimer-text)]">
          <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rotate-45 bg-amber-500" aria-hidden />
          NDCI es un proxy de clorofila-a sin calibración local — el umbral es un punto de partida
          configurable, no un valor validado con muestreos de campo de esta laguna.
        </p>
      </CardContent>
    </Card>
  );
}
