import type { ComplianceStatus } from "@/types";
import { cn } from "@/lib/utils";

const variants: Record<ComplianceStatus, string> = {
  compliant: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30",
  alert: "bg-amber-500/15 text-amber-800 ring-amber-500/30",
  non_compliant: "bg-red-500/15 text-red-700 ring-red-500/30",
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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
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
    default: "bg-slate-500/10 text-slate-600 ring-slate-500/20",
    warning: "bg-amber-500/10 text-amber-700 ring-amber-500/20",
    info: "bg-sky-500/10 text-sky-700 ring-sky-500/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
