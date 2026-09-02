"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Brain,
  ClipboardList,
  Cloud,
  Droplets,
  FileText,
  FlaskConical,
  Gauge,
  Image,
  LayoutDashboard,
  Leaf,
  LineChart,
  Map,
  Satellite,
  Settings,
  TreePine,
  Upload,
  Users,
  Waves,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORM_NAVIGATION } from "@/platform/modules";
import type { PlatformNavItem } from "@/platform/modules";

const icons = {
  dashboard: LayoutDashboard,
  campaigns: ClipboardList,
  sampling: FlaskConical,
  temporal: LineChart,
  map: Map,
  indicators: Gauge,
  activity: Activity,
  satellite: Satellite,
  chart: BarChart3,
  file: FileText,
  brain: Brain,
  parameters: FlaskConical,
  leaf: Leaf,
  cloud: Cloud,
  waves: Waves,
  tree: TreePine,
  image: Image,
  settings: Settings,
  upload: Upload,
  users: Users,
} as const;

function NavLinkItem({ item, pathname }: { item: PlatformNavItem; pathname: string }) {
  const Icon = icons[item.icon as keyof typeof icons] ?? Activity;
  const active =
    item.href != null &&
    (pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`)));

  if (item.status !== "active" || !item.href) {
    const badge = item.badge ?? "Próximamente";
    return (
      <div
        key={item.id}
        className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-[var(--hv-sidebar-text-muted)]"
        title={item.phase ? `Disponible en Fase ${item.phase}` : badge}
      >
        <Icon className="h-4 w-4 shrink-0 opacity-50" />
        <span className="text-sm opacity-50">{item.label}</span>
        <span className="ml-auto rounded bg-[var(--hv-surface-secondary)] px-1.5 py-0.5 text-[10px] text-[var(--hv-sidebar-text-muted)]">
          {badge}
        </span>
      </div>
    );
  }

  return (
    <Link
      key={item.id}
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-[var(--hv-sidebar-active-bg)] text-[var(--hv-sidebar-active-text)] ring-1 ring-[var(--hv-primary)]/20"
          : "text-[var(--hv-sidebar-text)] hover:bg-[var(--hv-surface-secondary)] hover:text-[var(--hv-foreground)]"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-[var(--hv-sidebar-border)] bg-[var(--hv-sidebar-bg)]">
      <div className="flex items-center gap-3 border-b border-[var(--hv-sidebar-border)] px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--hv-sidebar-active-bg)] text-[var(--hv-primary)]">
          <Droplets className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-wide text-[var(--hv-foreground)]">HydroVision</p>
          <p className="text-[11px] text-[var(--hv-sidebar-text-muted)]">Plataforma Modular · Perú</p>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4" aria-label="Navegación principal">
        {PLATFORM_NAVIGATION.map((section) => {
          if (section.href) {
            const active = pathname === section.href;
            return (
              <Link
                key={section.id}
                href={section.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--hv-sidebar-active-bg)] text-[var(--hv-sidebar-active-text)]"
                    : "text-[var(--hv-sidebar-text)] hover:bg-[var(--hv-surface-secondary)]"
                )}
              >
                <span aria-hidden>{section.emoji}</span>
                {section.label}
              </Link>
            );
          }

          return (
            <div key={section.id} className="space-y-1">
              <p className="flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--hv-sidebar-text-muted)]">
                <span aria-hidden>{section.emoji}</span>
                {section.label}
              </p>
              {section.groups?.flatMap((group) =>
                group.items.map((item) => (
                  <NavLinkItem key={item.id} item={item} pathname={pathname} />
                ))
              )}
            </div>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-[var(--hv-sidebar-border)] p-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--hv-sidebar-text-muted)]">
          Proyecto de tesis
        </p>
        <p className="text-xs text-[var(--hv-sidebar-text-muted)]">Ing. Ambiental · MVP</p>
        <div className="flex items-center gap-3 rounded-xl border border-[var(--hv-border)] bg-[var(--hv-surface-secondary)] px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 text-xs font-bold text-white">
            FC
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--hv-foreground)]">Fernando Chumpen</p>
            <p className="text-[11px] text-[var(--hv-sidebar-text-muted)]">Investigador</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
