import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  variant?: "card" | "panel";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  variant = "card",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        variant === "card" && "py-12",
        variant === "panel" &&
          "min-h-[20rem] rounded-lg border border-dashed border-[var(--hv-border-subtle)] bg-[var(--hv-surface-secondary)] p-6",
        className
      )}
      role="status"
    >
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--hv-surface-secondary)]">
          <Icon className="h-6 w-6 text-[var(--hv-foreground-dim)]" aria-hidden />
        </div>
      )}
      <p className="text-sm font-medium text-[var(--hv-foreground)]">{title}</p>
      {description && (
        <p className="mt-1 max-w-[280px] text-xs text-[var(--hv-foreground-muted)]">
          {description}
        </p>
      )}
    </div>
  );
}
