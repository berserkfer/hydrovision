import type { ComplianceStatus, StationSummary } from "@/types";

/** Estado operativo de la estación de monitoreo */
export type OperationalStatus = "active" | "maintenance" | "offline";

/** Entidad completa de estación (Fase 2.3) */
export interface StationEntity {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  altitude: number;
  river: string;
  watershed: string;
  riverSegment: string;
  installedAt: string;
  operationalStatus: OperationalStatus;
  lastUpdatedAt: string;
  description: string;
  isSimulated: true;
}

/** Medición extendida con parámetros adicionales simulados */
export interface ExtendedMeasurement {
  ph?: number;
  temperature?: number;
  conductivity?: number;
  dissolvedOxygen?: number;
  turbidity?: number;
  totalDissolvedSolids?: number;
  flowRate: number;
  sampledAt: string;
  isSimulated: true;
}

/** Entrada del historial reciente simulado */
export interface StationHistoryEntry {
  date: string;
  status: ComplianceStatus;
  observation: string;
}

/** Configuración visual de un parámetro para barras y sparklines */
export interface ParameterDisplayConfig {
  key: string;
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  icon: "ph" | "temperature" | "conductivity" | "oxygen" | "turbidity" | "tds" | "flow";
  trend: number[];
}

/** Detalle completo de estación para el panel lateral */
export interface StationDetail {
  entity: StationEntity;
  measurement: ExtendedMeasurement;
  compliance: StationSummary["compliance"];
  parameters: ParameterDisplayConfig[];
  history: StationHistoryEntry[];
  latestIndices?: StationSummary["latestIndices"];
}

export const OPERATIONAL_STATUS_LABELS: Record<OperationalStatus, string> = {
  active: "Operativa",
  maintenance: "En mantenimiento",
  offline: "Fuera de línea",
};
