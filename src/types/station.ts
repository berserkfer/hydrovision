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
  /** true = dato simulado/demo; false = medición real publicada (ver dren-4000-real-data.ts) */
  isSimulated: boolean;
}

/** Medición extendida — parámetros reales cuando existen, simulados solo para ríos de demo */
export interface ExtendedMeasurement {
  ph?: number;
  temperature?: number;
  conductivity?: number;
  dissolvedOxygen?: number;
  turbidity?: number;
  totalDissolvedSolids?: number;
  totalSuspendedSolids?: number;
  bod5?: number;
  cod?: number;
  coliforms?: number;
  thermotolerantColiforms?: number;
  nitrates?: number;
  phosphates?: number;
  /** No disponible para estaciones sin medición real de caudal (ej. Dren 4000) */
  flowRate?: number;
  sampledAt: string;
  isSimulated: boolean;
}

/** Entrada del historial de la estación — real cuando isSimulated=false */
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
  icon:
    | "ph"
    | "temperature"
    | "conductivity"
    | "oxygen"
    | "turbidity"
    | "tds"
    | "flow"
    | "bod5"
    | "coliforms"
    | "nutrients"
    | "suspendedSolids";
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
  /** id de dominio (ej. "dren-4000-p5") — presente para consultar predicción satelital real */
  domainId?: string;
}

export const OPERATIONAL_STATUS_LABELS: Record<OperationalStatus, string> = {
  active: "Operativa",
  maintenance: "En mantenimiento",
  offline: "Fuera de línea",
};
