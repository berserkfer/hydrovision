"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTag } from "@/components/ui/DataTag";
import { interpretNdviVigor } from "@/vegetation/ndvi-interpretation";
import { SPECTRAL_INDEX_DEFINITIONS } from "@/satellite/catalog/spectral-indices.catalog";
import { DEFAULT_LAGOON_ALERT_THRESHOLD } from "@/vegetation/config/vegetation-alert.config";

const NDVI_BANDS = [
  { from: -1, to: 0.2, color: "#cfc6ae" },
  { from: 0.2, to: 0.4, color: "#bdbd8c" },
  { from: 0.4, to: 0.6, color: "#8fb596" },
  { from: 0.6, to: 0.8, color: "#5f9169" },
  { from: 0.8, to: 1, color: "#2f5f3f" },
];

/** Guía de lectura del índice: escalas tomadas del propio código, no valores nuevos. */
export function IndexReadingPanel({ index }: { index: "NDVI" | "NDCI" }) {
  const def = SPECTRAL_INDEX_DEFINITIONS[index];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cómo leer el {index}</CardTitle>
        <CardDescription>{def.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="hv-eyebrow text-[9.5px]">Fórmula · Sentinel-2</p>
          <p className="hv-num mt-1.5 text-[13px] text-[var(--hv-ink)]">{def.formulaExpression}</p>
        </div>

        {index === "NDVI" ? (
          <ul className="space-y-0">
            {NDVI_BANDS.map((b) => (
              <li
                key={b.from}
                className="grid grid-cols-[14px_92px_minmax(0,1fr)] items-center gap-3 border-b border-[var(--hv-border)] py-2 text-xs last:border-b-0"
              >
                <span className="h-3 w-3 rounded-[2px]" style={{ background: b.color }} aria-hidden />
                <span className="hv-num text-[11px] text-[var(--hv-foreground-dim)]">
                  {b.from.toFixed(1)} – {b.to.toFixed(1)}
                </span>
                <span className="text-[var(--hv-foreground-muted)]">
                  {interpretNdviVigor((b.from + b.to) / 2).label}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div>
            <p className="hv-eyebrow text-[9.5px]">Umbral por defecto</p>
            <div className="relative mt-3 h-2 rounded-[2px] bg-gradient-to-r from-[#8e9db8] via-[#8fb596] to-[#2f5f3f]">
              <span
                className="absolute -top-1.5 h-5 w-px bg-[var(--hv-ink)]"
                style={{ left: `${((DEFAULT_LAGOON_ALERT_THRESHOLD + 1) / 2) * 100}%` }}
                aria-hidden
              />
            </div>
            <div className="hv-num relative mt-1.5 flex h-4 justify-between text-[10px] text-[var(--hv-foreground-dim)]">
              <span>−1</span>
              <span
                className="absolute -translate-x-1/2 text-[var(--hv-ink)]"
                style={{ left: `${((DEFAULT_LAGOON_ALERT_THRESHOLD + 1) / 2) * 100}%` }}
              >
                {DEFAULT_LAGOON_ALERT_THRESHOLD}
              </span>
              <span>+1</span>
            </div>
          </div>
        )}

        <div className="space-y-2 border-t border-[var(--hv-border)] pt-4">
          <DataTag tone="caution">
            {index === "NDVI" ? "Escala genérica de literatura" : "Umbral configurable, no normativo"}
          </DataTag>
          <p className="text-[11px] leading-relaxed text-[var(--hv-foreground-muted)]">{def.interpretationGuide}</p>
        </div>
      </CardContent>
    </Card>
  );
}
