"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
}

/**
 * Control global de tema — oscuro (preferido) / claro.
 */
export function ThemeToggle({ className, compact = false }: ThemeToggleProps) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border transition-colors",
        "border-[var(--hv-border)] bg-[var(--hv-surface-secondary)]",
        "text-[var(--hv-foreground-muted)] hover:border-[var(--hv-primary)]/40 hover:text-[var(--hv-primary)]",
        compact ? "px-2.5 py-1.5" : "px-3 py-1.5",
        className
      )}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400" aria-hidden />
      ) : (
        <Moon className="h-4 w-4 text-slate-600" aria-hidden />
      )}
      {!compact && (
        <span className="text-xs font-medium">{isDark ? "Claro" : "Oscuro"}</span>
      )}
      <span className="sr-only">Tema actual: {theme === "dark" ? "oscuro" : "claro"}</span>
    </button>
  );
}
