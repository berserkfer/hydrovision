"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  CalendarDays,
  Brain,
  Camera,
  ClipboardList,
  Crosshair,
  Cloud,
  Download,
  FileText,
  FlaskConical,
  Gauge,
  Image,
  LayoutDashboard,
  Leaf,
  LineChart,
  Map,
  Scale,
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
import { InkFlow } from "@/components/ui/InkFlow";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SidebarUser } from "@/components/auth/SidebarUser";

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
  download: Download,
  camera: Camera,
  normative: Scale,
  planner: CalendarDays,
  crosshair: Crosshair,
  users: Users,
} as const;

/** Marca propia: celda de muestra con tres corrientes atravesándola. */
export function HydroVisionMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden fill="none">
      <circle cx="20" cy="20" r="18.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 16.5c4-3 8 3 12.5 0s8.5-3 12.5 0 5 1.5 5.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity=".45" />
      <path d="M3.5 21.5c4.5-3.6 9 3.6 14 0s9-3.6 13.5 0 6 1 6.5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M5.5 26.5c4-2.6 8 2.6 12 0s8-2.6 12 0 4.5 1 5 .6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity=".45" />
    </svg>
  );
}

function NavLinkItem({ item, pathname }: { item: PlatformNavItem; pathname: string }) {
  const Icon = icons[item.icon as keyof typeof icons] ?? Activity;
  const active =
    item.href != null &&
    (pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`)));

  if (item.status !== "active" || !item.href) {
    const badge = item.badge ?? "Próximamente";
    return (
      <div
        className="flex cursor-not-allowed items-center gap-3 px-2 py-1.5 text-[var(--hv-sidebar-text-muted)]"
        title={item.phase ? `Disponible en Fase ${item.phase}` : badge}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center">
          <Icon className="h-[15px] w-[15px] opacity-45" strokeWidth={1.5} />
        </span>
        <span className="hidden truncate text-[12.5px] opacity-60 lg:inline">{item.label}</span>
        <span className="ml-auto hidden text-[9px] uppercase tracking-[0.14em] opacity-70 lg:inline">
          {badge}
        </span>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      title={item.label}
      className={cn(
        "group flex items-center gap-3 px-2 py-1.5 transition-colors",
        active ? "text-[var(--hv-ink)]" : "text-[var(--hv-sidebar-text)] hover:text-[var(--hv-ink)]"
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors",
          active
            ? "bg-[var(--hv-ink)] text-[var(--hv-primary-foreground)]"
            : "group-hover:bg-[var(--hv-ink-wash)]"
        )}
      >
        <Icon className="h-[15px] w-[15px]" strokeWidth={active ? 1.9 : 1.5} />
      </span>
      <span
        className={cn(
          "hidden truncate text-[12.5px] lg:inline",
          active ? "font-medium" : "font-normal"
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-16 shrink-0 flex-col border-r border-[var(--hv-sidebar-border)] lg:w-[248px]">
      <Link
        href="/"
        className="flex flex-col items-center gap-2.5 px-3 pb-5 pt-6 text-[var(--hv-ink)]"
        aria-label="HydroVision — inicio"
      >
        <HydroVisionMark className="h-9 w-9 lg:h-12 lg:w-12" />
        <span className="hidden text-[12px] font-medium tracking-[0.42em] lg:block">HYDROVISION</span>
        <span className="hidden text-[10px] tracking-[0.08em] text-[var(--hv-sidebar-text-muted)] lg:block">
          Dren 4000 · Santa Rosa, Lambayeque
        </span>
      </Link>

      <div className="mx-4 border-t border-[var(--hv-sidebar-border)]" />

      <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-4 lg:px-4" aria-label="Navegación principal">
        {PLATFORM_NAVIGATION.map((section) => {
          if (section.href) {
            // "Inicio" duplica al Dashboard (misma ruta): se omite para no repetir.
            return null;
          }

          return (
            <div key={section.id} className="space-y-0.5">
              <p className="hv-eyebrow hidden px-2 pb-1.5 text-[9.5px] text-[var(--hv-sidebar-text-muted)] lg:block">
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

      <div className="hidden space-y-4 border-t border-[var(--hv-sidebar-border)] px-4 py-4 lg:block">
        <div className="[@media(max-height:860px)]:hidden">
          <p className="hv-eyebrow text-[9.5px]">Corriente de referencia</p>
          <div className="mt-2 h-14 overflow-hidden rounded-[3px] border border-[var(--hv-border)] bg-[var(--hv-surface)]">
            <InkFlow seed={21} density={0.35} outlet={{ x: 0.42, y: 0.62 }} drain={false} animate={false} strength={0.9} />
          </div>
          <p className="mt-1.5 text-[10px] leading-snug text-[var(--hv-sidebar-text-muted)]">
            Textura ilustrativa — no es un dato.
          </p>
        </div>

        <div>
          <p className="hv-eyebrow text-[9.5px]">Origen de los datos</p>
          <ul className="mt-2 space-y-1.5 text-[11px] leading-snug text-[var(--hv-sidebar-text)]">
            <li className="flex items-start gap-2">
              <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--hv-ink)]" aria-hidden />
              <span>
                <strong className="font-medium">Real</strong> · Dren 4000, 2014 (Nizama y Cabrera)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full border-[1.5px] border-amber-500" aria-hidden />
              <span>
                <strong className="font-medium">Simulado</strong> · demostración, otras cuencas
              </span>
            </li>
          </ul>
        </div>

        <div className="flex items-center justify-between gap-2">
          <SidebarUser />
          <ThemeToggle compact />
        </div>
      </div>
    </aside>
  );
}
