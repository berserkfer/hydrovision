/**
 * Tipos de la plataforma modular HydroVision — Sprint 2B
 */

export type PlatformModuleId =
  | "core"
  | "environmental-monitoring"
  | "environmental-technologies"
  | "satellite-observation"
  | "environmental-intelligence"
  | "administration";

export type NavItemStatus = "active" | "coming_soon" | "in_development";

export interface PlatformModuleDefinition {
  id: PlatformModuleId;
  name: string;
  description: string;
  version: string;
  implemented: boolean;
  routes: string[];
  services?: string[];
}

export interface PlatformNavItem {
  id: string;
  label: string;
  href?: string;
  icon: string;
  status: NavItemStatus;
  badge?: string;
  moduleId: PlatformModuleId;
  phase?: number;
}

export interface PlatformNavGroup {
  id: string;
  label: string;
  moduleId: PlatformModuleId;
  items: PlatformNavItem[];
}

export interface PlatformNavSection {
  id: string;
  label: string;
  emoji: string;
  moduleId?: PlatformModuleId;
  href?: string;
  groups?: PlatformNavGroup[];
}
