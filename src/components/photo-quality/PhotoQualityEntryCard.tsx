"use client";

import Link from "next/link";
import { ArrowRight, Camera } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTag } from "@/components/ui/DataTag";

/**
 * Tarjeta de acceso rápido, no el flujo completo de captura: el asistente de 3 fotos es un
 * wizard de varios pasos que necesita su propia pantalla, no un panel entre widgets del
 * dashboard — por eso mantiene su ruta dedicada (/foto) en vez de incrustarse aquí.
 */

const TIERS = [
  {
    level: "Nivel 1 — offline",
    tone: "caution" as const,
    detail: "Fórmula genérica HydroColor sin calibrar (o la última calibración guardada, sin verificar vigencia). Funciona sin conexión; sin verificación adicional.",
  },
  {
    level: "Nivel 2 — + referencia satelital",
    tone: "neutral" as const,
    detail: "En línea: se suma una escena Sentinel-2 cercana para contrastar, no para corregir.",
  },
  {
    level: "Nivel 3 — calibrado localmente",
    tone: "real" as const,
    detail: "Solo si el servidor confirma calibración vigente con laboratorio (N real y R² declarados).",
  },
];

const SHOTS = [
  { label: "Agua", color: "#55606b" },
  { label: "Cielo", color: "#9fb2c6" },
  { label: "Cartulina gris", color: "#d8d6cf" },
];

export function PhotoQualityEntryCard() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-[var(--hv-foreground-dim)]" strokeWidth={1.5} />
            Foto de Calidad de Agua
          </CardTitle>
          <CardDescription>
            Estima turbidez desde 3 fotos del celular (agua, cielo, cartulina de referencia), con 3
            niveles de confianza explícitos y funcionamiento offline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ol className="flex items-start gap-5">
            {SHOTS.map((shot, i) => (
              <li key={shot.label} className="flex flex-col items-center gap-2 text-center">
                <span
                  className="h-12 w-12 rounded-full ring-1 ring-black/10"
                  style={{ background: shot.color }}
                  aria-hidden
                />
                <span className="hv-num text-[10px] text-[var(--hv-foreground-dim)]">0{i + 1}</span>
                <span className="text-xs text-[var(--hv-foreground-muted)]">{shot.label}</span>
              </li>
            ))}
          </ol>
          <p className="text-[11px] leading-relaxed text-[var(--hv-foreground-dim)]">
            Método HydroColor (Leeuw y Boss, 2018). Los colores de arriba son ilustrativos, no una
            medición.
          </p>
          <Link
            href="/foto"
            className="inline-flex items-center gap-3 rounded-[3px] bg-[var(--hv-ink)] px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--hv-primary-foreground)] transition-opacity hover:opacity-90"
          >
            Abrir módulo de foto
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.6} />
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Niveles de confianza</CardTitle>
          <CardDescription>
            El nivel se decide al estimar, según conexión y calibración disponible — nunca se
            asume el más alto.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ol>
            {TIERS.map((tier, i) => (
              <li
                key={tier.level}
                className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 border-b border-[var(--hv-border)] px-5 py-4 last:border-b-0"
              >
                <span className="hv-num pt-0.5 text-[20px] font-light leading-none text-[var(--hv-ink)]">
                  {i + 1}
                </span>
                <div className="space-y-1.5">
                  <DataTag tone={tier.tone}>{tier.level}</DataTag>
                  <p className="text-xs leading-relaxed text-[var(--hv-foreground-muted)]">{tier.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
