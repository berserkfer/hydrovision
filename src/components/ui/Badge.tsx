import type { ComplianceStatus } from "@/types";
import { cn } from "@/lib/utils";

const variants: Record<ComplianceStatus, string> = {
  compliant: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/35 dark:text-emerald-300",
  alert: "bg-amber-500/12 text-amber-800 ring-amber-500/40 dark:text-amber-300",
  non_compliant: "bg-red-500/10 text-red-700 ring-red-500/35 dark:text-red-300",
};

interface BadgeProps {
  status: ComplianceStatus;
  label: string;
  className?: string;
}

export function ComplianceBadge({ status, label, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[3px] px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        variants[status],
        className
      )}
    >
      {label}
    </span>
  );
}

interface InfoBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "warning" | "info";
  className?: string;
}

export function InfoBadge({ children, variant = "default", className }: InfoBadgeProps) {
  const styles = {
    default:
      "bg-[var(--hv-surface-secondary)] text-[var(--hv-foreground-muted)] ring-[var(--hv-border)]",
    warning:
      "bg-[var(--hv-disclaimer-bg)] text-[var(--hv-disclaimer-text)] ring-[var(--hv-disclaimer-border)]",
    info: "bg-transparent text-[var(--hv-ink)] ring-[var(--hv-ink)]/25",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[3px] px-2 py-1 text-[11px] font-medium tracking-[0.02em] ring-1 ring-inset",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
