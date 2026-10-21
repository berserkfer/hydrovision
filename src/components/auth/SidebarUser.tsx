"use client";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";

interface ContextUser {
  name: string;
  role: string;
  authMode: "session" | "dev-simulated";
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  INVESTIGATOR: "Investigador",
  TECHNICIAN: "Técnico de campo",
  VIEWER: "Consulta",
};

/** Usuario actual (sesión real o simulado de desarrollo) y cierre de sesión. */
export function SidebarUser() {
  const [user, setUser] = useState<ContextUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/context")
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { data?: { user?: ContextUser } } | null) => {
        if (!cancelled) setUser(body?.data?.user ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.assign("/login");
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="min-w-0">
        <p className="truncate text-[12px] font-medium text-[var(--hv-foreground)]">
          {user?.name ?? "—"}
        </p>
        <p className="truncate text-[10px] text-[var(--hv-sidebar-text-muted)]">
          {user ? ROLE_LABEL[user.role] ?? user.role : "Sin sesión"}
          {user?.authMode === "dev-simulated" ? " · simulado (dev)" : ""}
        </p>
      </div>
      {user?.authMode === "session" && (
        <button
          type="button"
          onClick={logout}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          className="shrink-0 rounded-full border border-[var(--hv-border)] p-1.5 text-[var(--hv-foreground-muted)] transition-colors hover:border-[var(--hv-ink)]/40 hover:text-[var(--hv-ink)]"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />
        </button>
      )}
    </div>
  );
}
