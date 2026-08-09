"use client";

import type { UserStatus } from "@/server/dto/user.dto";

const STYLES: Record<UserStatus, string> = {
  active: "bg-emerald-50 text-emerald-800",
  inactive: "bg-slate-100 text-slate-600",
};

const LABELS: Record<UserStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
