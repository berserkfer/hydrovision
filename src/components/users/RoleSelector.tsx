"use client";

import { APP_ROLE_LABELS, APP_ROLES, type AppRole } from "@/server/authorization/roles";

interface RoleSelectorProps {
  value: AppRole;
  onChange: (role: AppRole) => void;
  disabled?: boolean;
  id?: string;
}

export function RoleSelector({ value, onChange, disabled, id = "user-role" }: RoleSelectorProps) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as AppRole)}
      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-60"
    >
      {APP_ROLES.map((role) => (
        <option key={role} value={role}>
          {APP_ROLE_LABELS[role]}
        </option>
      ))}
    </select>
  );
}
