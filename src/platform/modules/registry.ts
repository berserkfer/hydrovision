/**
 * Registro de módulos de la plataforma — Sprint 2B
 * Cada módulo es independiente y puede evolucionar sin afectar a los demás.
 */

import type { PlatformModuleDefinition, PlatformModuleId } from "./types";

export const PLATFORM_MODULES: Record<PlatformModuleId, PlatformModuleDefinition> = {
  core: {
    id: "core",
    name: "Core",
    description: "Núcleo de la plataforma: layout, navegación, configuración y providers.",
    version: "2.0.0",
    implemented: true,
    routes: ["/"],
    services: ["providers", "config"],
  },
  "environmental-monitoring": {
    id: "environmental-monitoring",
    name: "Monitoreo Ambiental",
    description: "Dashboard, estaciones, campañas, parámetros, evaluación ECA e índices.",
    version: "1.6.0",
    implemented: true,
    routes: [
      "/",
      "/estaciones",
      "/parametros",
      "/reportes",
      "/evaluacion-ambiental",
      "/centro-geoespacial",
      "/campanas",
      "/muestreos",
      "/indicadores",
      "/analisis-temporal",
      "/mapa",
      "/satelite",
    ],
    services: [
      "services/risk",
      "services/indicators",
      "services/temporal",
      "services/layers",
      "services/gis",
      "services/satellite-index-engine",
      "lib/geospatial",
    ],
  },
  "environmental-technologies": {
    id: "environmental-technologies",
    name: "Tecnologías Ambientales",
    description: "BioBalsa, neblina, humedales y restauración ecosistémica.",
    version: "0.1.0",
    implemented: false,
    routes: [],
    services: [],
  },
  "satellite-observation": {
    id: "satellite-observation",
    name: "Observación Satelital",
    description: "Sentinel-2, Landsat, catálogo de imágenes e índices espectrales.",
    version: "0.5.0",
    implemented: true,
    routes: ["/satelite"],
    services: [
      "services/satellite-explorer",
      "services/google-earth-engine",
      "services/satellite-index-engine",
    ],
  },
  "environmental-intelligence": {
    id: "environmental-intelligence",
    name: "Inteligencia Ambiental",
    description: "Riesgo, predicción y alertas con IA.",
    version: "0.3.0",
    implemented: true,
    routes: ["/indicadores"],
    services: ["services/ai", "services/risk", "services/executive"],
  },
  administration: {
    id: "administration",
    name: "Administración",
    description: "Usuarios, permisos y diagnóstico del sistema.",
    version: "0.2.0",
    implemented: true,
    routes: ["/admin/system-status"],
    services: ["services/google-earth-engine"],
  },
};

export function getPlatformModule(id: PlatformModuleId): PlatformModuleDefinition {
  return PLATFORM_MODULES[id];
}

export function getImplementedModules(): PlatformModuleDefinition[] {
  return Object.values(PLATFORM_MODULES).filter((module) => module.implemented);
}
