"use client";

import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { InkFlow } from "@/components/ui/InkFlow";
import { DataTag, type DataTagTone } from "@/components/ui/DataTag";

export interface DashboardModule {
  value: string;
  eyebrow: string;
  title: string;
  description: string;
  tag: { tone: DataTagTone; label: string };
  glyph: "flow" | "scene" | "matrix" | "photo" | "ndvi" | "ndci";
}

/** Pequeña ilustración por módulo; decorativa, no representa datos. */
function Glyph({ kind, active }: { kind: DashboardModule["glyph"]; active: boolean }) {
  const stroke = active ? "var(--hv-primary-foreground)" : "var(--hv-ink)";
  if (kind === "flow") {
    return (
      <div className="h-full w-full opacity-70">
        <InkFlow
          seed={77}
          density={0.32}
          outlet={{ x: 0.7, y: 0.5 }}
          drain={false}
          animate={false}
          ink={active ? "#f6f4ee" : undefined}
          strength={active ? 0.75 : 0.9}
        />
      </div>
    );
  }
  if (kind === "scene") {
    return (
      <svg viewBox="0 0 120 48" className="h-full w-full" aria-hidden>
        {Array.from({ length: 6 }).map((_, r) =>
          Array.from({ length: 15 }).map((__, c) => (
            <rect
              key={`${r}-${c}`}
              x={c * 8 + 1}
              y={r * 8 + 1}
              width="6"
              height="6"
              fill={stroke}
              opacity={(0.08 + 0.55 * Math.exp(-(((c - 9) / 4) ** 2 + ((r - 3) / 2.2) ** 2))).toFixed(2)}
            />
          ))
        )}
      </svg>
    );
  }
  if (kind === "matrix") {
    const pts = [
      [8, 38], [18, 34], [26, 30], [34, 31], [44, 24], [54, 22], [64, 18], [76, 16], [88, 11], [100, 9],
    ];
    return (
      <svg viewBox="0 0 120 48" className="h-full w-full" aria-hidden>
        <line x1="4" y1="42" x2="112" y2="6" stroke={stroke} strokeWidth="0.8" strokeDasharray="2 3" opacity=".6" />
        {pts.map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="2.2" fill="none" stroke={stroke} strokeWidth="1" />
        ))}
      </svg>
    );
  }
  if (kind === "photo") {
    const swatches = ["#55606b", "#9fb2c6", "#d8d6cf"];
    return (
      <div className="flex h-full items-center gap-2" aria-hidden>
        {swatches.map((c, i) => (
          <span
            key={c}
            className="h-7 w-7 rounded-full ring-1 ring-black/10"
            style={{ background: c, opacity: active ? 0.95 : 1, marginLeft: i === 0 ? 0 : -2 }}
          />
        ))}
      </div>
    );
  }
  const stops =
    kind === "ndvi"
      ? ["#c9b98f", "#b9c08a", "#8fb596", "#5f9169", "#2f5f3f"]
      : ["#8e9db8", "#7fa0a0", "#6f9a83", "#5f9169", "#3f7550"];
  return (
    <div className="flex h-full flex-col justify-center gap-1.5" aria-hidden>
      <div className="flex h-2.5 overflow-hidden rounded-[2px]">
        {stops.map((c) => (
          <span key={c} className="flex-1" style={{ background: c }} />
        ))}
      </div>
      <div className={cn("hv-num flex justify-between text-[9px]", active ? "text-white/60" : "text-[var(--hv-foreground-dim)]")}>
        <span>−1</span>
        <span>0</span>
        <span>+1</span>
      </div>
    </div>
  );
}

interface ModuleStripProps {
  modules: DashboardModule[];
  value: string;
  onChange: (value: string) => void;
}

/**
 * Franja de módulos que funciona como pestañas: la tarjeta activa se entinta de añil.
 * Mantiene la semántica role="tablist" / role="tab" y navegación con flechas.
 */
export function ModuleStrip({ modules, value, onChange }: ModuleStripProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: React.KeyboardEvent, index: number) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + modules.length) % modules.length;
    onChange(modules[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Módulos del Dren 4000"
      className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 min-[1700px]:grid-cols-6"
    >
      {modules.map((m, i) => {
        const active = m.value === value;
        return (
          <button
            key={m.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${m.value}`}
            aria-selected={active}
            aria-controls={`panel-${m.value}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(m.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "group relative flex min-h-[196px] w-[232px] shrink-0 snap-start flex-col rounded-[5px] border p-4 text-left transition-[background-color,border-color,transform] duration-200 ease-out active:scale-[0.985] sm:w-auto",
              active
                ? "border-[var(--hv-ink)] bg-[var(--hv-ink)] text-[var(--hv-primary-foreground)]"
                : "border-[var(--hv-border)] bg-[var(--hv-surface)] text-[var(--hv-foreground)] hover:border-[var(--hv-border-subtle)]"
            )}
          >
            <span
              className={cn(
                "text-[9.5px] font-medium uppercase tracking-[0.18em]",
                active ? "text-white/65" : "text-[var(--hv-foreground-dim)]"
              )}
            >
              {m.eyebrow}
            </span>
            <span
              className={cn(
                "mt-2 text-[21px] font-light leading-[1.12] tracking-[-0.015em]",
                active ? "text-white" : "text-[var(--hv-ink)]"
              )}
            >
              {m.title}
            </span>
            <span
              className={cn(
                "mt-1.5 text-[12px] leading-snug",
                active ? "text-white/72" : "text-[var(--hv-foreground-muted)]"
              )}
            >
              {m.description}
            </span>

            <span className="mt-3 h-10">
              <Glyph kind={m.glyph} active={active} />
            </span>

            <span className="mt-auto flex items-end justify-between gap-2 pt-3">
              <DataTag tone={m.tag.tone} inverted={active}>
                {m.tag.label}
              </DataTag>
              <ArrowRight
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200",
                  active ? "translate-x-0 text-white" : "text-[var(--hv-foreground-dim)] group-hover:translate-x-0.5"
                )}
                strokeWidth={1.4}
                aria-hidden
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}
