import type { ComplianceStatus } from "@/types";
import type { OperationalStatus } from "@/types/station";
import type { EstadoCampana } from "@/constants/enums";

/** Registro de estación para listado y filtros — Sprint 2C */
export interface MonitoringStationRecord {
  id: string;
  codigo: string;
  nombre: string;
  rioId: string;
  rioNombre: string;
  cuencaId: string;
  cuencaNombre: string;
  departamentoNombre: string;
  latitud: number;
  longitud: number;
  altitud: number;
  tramo: string;
  estado: OperationalStatus;
  fechaUltimaCampana: string | null;
  clasificacionEca: ComplianceStatus;
  cantidadMediciones: number;
  descripcion: string;
  fechaInstalacion: string;
  ultimaActualizacion: string;
  isSimulated: boolean;
}

export interface StationFilters {
  search: string;
  cuencaId: string;
  rioId: string;
  estado: string;
  clasificacionEca: string;
}

export interface StationStats {
  total: number;
  activas: number;
  inactivas: number;
  mantenimiento: number;
}

export interface StationCampaignHistoryItem {
  id: string;
  codigo: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoCampana;
  muestrasEnEstacion: number;
}

export interface StationMeasurementRecord {
  id: string;
  fecha: string;
  ph?: number;
  turbidez?: number;
  conductividad?: number;
  oxigenoDisuelto?: number;
  temperatura?: number;
  clasificacionEca: ComplianceStatus;
}

export interface StationSatelliteIndexRecord {
  fechaAdquisicion: string;
  fuente: string;
  ndwi: number;
  ndvi: number;
  mndwi: number;
  ndti: number;
  coberturaNubosa: number;
}

export interface StationDetailRecord {
  station: MonitoringStationRecord;
  campanas: StationCampaignHistoryItem[];
  mediciones: StationMeasurementRecord[];
  indicesSatelitales: StationSatelliteIndexRecord;
  parametrosViolados: string[];
  parametrosEnAlerta: string[];
}

export const STATION_STATUS_UI_LABELS: Record<OperationalStatus, string> = {
  active: "Activa",
  maintenance: "Mantenimiento",
  offline: "Inactiva",
};

export const STATION_STATUS_COLORS: Record<OperationalStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30",
  maintenance: "bg-amber-500/15 text-amber-700 ring-amber-500/30",
  offline: "bg-slate-500/15 text-slate-600 ring-slate-500/30",
};
