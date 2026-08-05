"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Brain,
  ClipboardList,
  Droplets,
  FileText,
  FlaskConical,
  Gauge,
  LayoutDashboard,
  LineChart,
  Map,
  Satellite,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "dashboard", phase: 1, available: true },
  { label: "Campañas", href: "/campanas", icon: "campaigns", phase: 3, available: true },
  { label: "Registro de Muestreos", href: "/muestreos", icon: "sampling", phase: 3, available: true },
  { label: "Análisis Temporal", href: "/analisis-temporal", icon: "temporal", phase: 4, available: true },
  { label: "Mapa interactivo", href: "/mapa", icon: "map", phase: 4, available: true },
  { label: "Indicadores", href: "/indicadores", icon: "indicators", phase: 4, available: true },
  { label: "Monitoreo", href: "/monitoreo", icon: "activity", phase: 3, available: false },
  { label: "Explorador satelital", href: "/satelite", icon: "satellite", phase: 5, available: true },
  { label: "Estadísticas", href: "/estadisticas", icon: "chart", phase: 3, available: false },
  { label: "Reportes PDF", href: "/reportes", icon: "file", phase: 5, available: false },
  { label: "Módulo IA", href: "/ia", icon: "brain", phase: 6, available: false },
];

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
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-slate-950 text-slate-100">
      <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
          <Droplets className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-wide text-white">HydroVision</p>
          <p className="text-[11px] text-slate-400">Río Reque · Perú</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Navegación
        </p>
        {navItems.map((item) => {
          const Icon = icons[item.icon as keyof typeof icons];
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          if (!item.available) {
            return (
              <div
                key={item.href}
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-slate-600"
                title={`Disponible en Fase ${item.phase}`}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-50" />
                <span className="text-sm opacity-50">{item.label}</span>
                <span className="ml-auto rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500">
                  F{item.phase}
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-cyan-500/15 text-cyan-300"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
          Proyecto de tesis
        </p>
        <p className="mt-1 text-xs text-slate-400">Ing. Ambiental · Fase 1</p>
      </div>
    </aside>
  );
}
