export type ComplianceStatus = "compliant" | "alert" | "non_compliant";

export type WaterParameter =
  | "ph"
  | "turbidity"
  | "conductivity"
  | "dissolvedOxygen"
  | "temperature"
  | "bod5"
  | "cod"
  | "coliforms";

export interface MonitoringStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  riverSegment: string;
  description: string;
}

export interface FieldMeasurement {
  id: string;
  stationId: string;
  sampledAt: string;
  ph?: number;
  turbidity?: number;
  conductivity?: number;
  dissolvedOxygen?: number;
  temperature?: number;
  bod5?: number;
  cod?: number;
  coliforms?: number;
  isSimulated: boolean;
}

export interface SatelliteIndices {
  stationId: string;
  acquiredAt: string;
  source: "landsat8" | "landsat9" | "sentinel2";
  ndwi: number;
  ndvi: number;
  mndwi: number;
  ndti: number;
  cloudCover: number;
  isSimulated: boolean;
}

export interface ComplianceResult {
  status: ComplianceStatus;
  violatedParameters: WaterParameter[];
  alertParameters: WaterParameter[];
}

export interface StationSummary {
  station: MonitoringStation;
  latestMeasurement: FieldMeasurement;
  compliance: ComplianceResult;
  latestIndices?: SatelliteIndices;
}

export interface DashboardStats {
  totalStations: number;
  compliantCount: number;
  alertCount: number;
  nonCompliantCount: number;
  lastUpdate: string;
  isSimulated: boolean;
}

export interface TimeSeriesPoint {
  date: string;
  dissolvedOxygen: number;
  turbidity: number;
  ph: number;
}

/** @deprecated Usar PlatformNavItem en src/platform/modules/types.ts */
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  phase: number;
  available: boolean;
}

export interface EarthEngineIndexRequest {
  stationId: string;
  startDate: string;
  endDate: string;
  indices: ("NDWI" | "NDVI" | "MNDWI" | "NDTI")[];
}

export interface EarthEngineIndexResponse {
  stationId: string;
  results: SatelliteIndices[];
  source: "simulated" | "google_earth_engine";
}

export interface AIRiskAssessment {
  stationId: string;
  assessedAt: string;
  riskScore: number;
  riskCategory: "low" | "medium" | "high";
  modelVersion: string;
  isSimulated: boolean;
}

export * from "./campaign";
export * from "./sampling";
export * from "./station";
export * from "./geography";
export * from "./gee";
export * from "./ai";
export * from "./reports";
export * from "./risk";
export * from "./temporal";
export * from "./executive";
export * from "./layers";
export * from "./indicators";
export * from "./rules";
export * from "./data-provider";
