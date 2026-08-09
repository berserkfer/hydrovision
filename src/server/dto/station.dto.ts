/**
 * DTOs del módulo Estaciones — Sprint 3C
 * Contrato de API independiente de Prisma y componentes UI.
 */

import type { ComplianceStatus } from "@/types";
import type { OperationalStatus } from "@/types/station";
import type { EstadoCampana } from "@/constants/enums";

export interface StationSummaryDto {
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

export interface StationStatsDto {
  total: number;
  activas: number;
  inactivas: number;
  mantenimiento: number;
}

export interface StationFilterOptionDto {
  value: string;
  label: string;
}

export interface StationFilterOptionsDto {
  cuencas: StationFilterOptionDto[];
  rios: StationFilterOptionDto[];
}

export interface StationListResponseDto {
  stations: StationSummaryDto[];
  stats: StationStatsDto;
  filterOptions: StationFilterOptionsDto;
}

export interface StationCampaignHistoryDto {
  id: string;
  codigo: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoCampana;
  muestrasEnEstacion: number;
}

export interface StationMeasurementDto {
  id: string;
  fecha: string;
  ph: number;
  turbidez: number;
  conductividad: number;
  oxigenoDisuelto: number;
  temperatura: number;
  clasificacionEca: ComplianceStatus;
}

export interface StationSatelliteIndexDto {
  fechaAdquisicion: string;
  fuente: string;
  ndwi: number;
  ndvi: number;
  mndwi: number;
  ndti: number;
  coberturaNubosa: number;
}

export interface StationDetailResponseDto {
  station: StationSummaryDto;
  campanas: StationCampaignHistoryDto[];
  mediciones: StationMeasurementDto[];
  indicesSatelitales: StationSatelliteIndexDto;
  parametrosViolados: string[];
  parametrosEnAlerta: string[];
}
