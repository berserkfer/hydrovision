"use client";

import { formatDate } from "@/lib/utils";

interface DataFreshnessBarProps {
  lastUpdate: string;
  source: string;
}

export function DataFreshnessBar({ lastUpdate, source }: DataFreshnessBarProps) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--hv-border)] pt-6 text-xs text-[var(--hv-foreground-dim)]">
      <span>Última actualización: {formatDate(lastUpdate)}</span>
      <span>Fuente: {source}</span>
    </footer>
  );
}
