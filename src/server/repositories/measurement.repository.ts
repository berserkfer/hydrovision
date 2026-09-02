/**
 * Measurement repository — mock wide-row fallback + Prisma normalizado
 */

import { getDataStore } from "@/data/store-access";
import { getMonitoringDataSource } from "@/config/monitoring-data-source.config";
import { filterActive, markSoftDeleted } from "@/server/lib/soft-delete";
import { ApiError } from "@/server/api/errors";
import type { CreateMeasurementInput } from "@/server/validators/schemas/crud.schemas";
import {
  measurementPrismaRepository,
  type MeasurementListFilters,
} from "./prisma/measurement.prisma-repository";

const ENTITY = "measurement";

export interface MeasurementRow {
  id: string;
  muestraId: string;
  estacionId: string;
  parametroCodigo: string;
  parametroNombre: string;
  valor: number;
  unidad: string;
  fechaMedicion: string;
  metodoAnalisis?: string;
  laboratorio?: string;
  equipoUtilizado?: string;
  observaciones?: string;
  nivelConfianza?: "high" | "medium" | "low" | "estimated";
}

const customMeasurements = new Map<string, MeasurementRow>();

function fromStore(): MeasurementRow[] {
  const rows: MeasurementRow[] = [];
  const store = getDataStore();

  for (const param of store.parametros) {
    const muestra = store.muestras.find((m) => m.id === param.muestraId);
    if (!muestra) continue;

    const defs: Array<[string, string, number | undefined, string]> = [
      ["ph", "pH", param.ph, "—"],
      ["turbidity", "Turbidez", param.turbidez, "NTU"],
      ["conductivity", "Conductividad", param.conductividad, "µS/cm"],
      ["dissolved_oxygen", "Oxígeno disuelto", param.oxigenoDisuelto, "mg/L"],
      ["temperature", "Temperatura", param.temperatura, "°C"],
      ["bod5", "DBO5", param.dbo5, "mg/L"],
      ["cod", "DQO", param.dqo, "mg/L"],
      ["coliforms", "Coliformes", param.coliformes, "NMP/100mL"],
      ["nitrates", "Nitratos", param.nitratos, "mg/L"],
      ["phosphates", "Fosfatos", param.fosfatos, "mg/L"],
      ["total_dissolved_solids", "Sólidos disueltos", param.solidosDisueltosTotales, "mg/L"],
      ["flow_rate", "Caudal", param.caudal, "m³/s"],
    ];

    for (const [codigo, nombre, valor, unidad] of defs) {
      if (valor == null || valor === 0) continue;
      rows.push({
        id: `meas-${param.muestraId}-${codigo}`,
        muestraId: param.muestraId,
        estacionId: param.estacionId,
        parametroCodigo: codigo,
        parametroNombre: nombre,
        valor,
        unidad,
        fechaMedicion: muestra.fechaMuestreo.slice(0, 10),
        metodoAnalisis: "SM 4500-H+ B",
        laboratorio: "Lab. HydroVision",
        nivelConfianza: "high",
      });
    }
  }

  return rows;
}

function allMockRows(): MeasurementRow[] {
  const merged = [...fromStore(), ...Array.from(customMeasurements.values())];
  const byId = new Map<string, MeasurementRow>();
  merged.forEach((row) => byId.set(row.id, row));
  return filterActive(ENTITY, Array.from(byId.values()));
}

export class MeasurementRepository {
  getDataSource(): "database" | "mock" {
    return getMonitoringDataSource();
  }

  async findAll(filters?: MeasurementListFilters): Promise<MeasurementRow[]> {
    if (this.getDataSource() === "database") {
      return measurementPrismaRepository.findAll(filters);
    }
    let rows = allMockRows();
    if (filters?.muestreoId) {
      rows = rows.filter((r) => r.muestraId === filters.muestreoId);
    }
    if (filters?.parametroCodigo) {
      rows = rows.filter((r) => r.parametroCodigo === filters.parametroCodigo);
    }
    return rows;
  }

  async findById(id: string): Promise<MeasurementRow | null> {
    if (this.getDataSource() === "database") {
      return measurementPrismaRepository.findById(id);
    }
    return allMockRows().find((m) => m.id === id) ?? null;
  }

  async create(input: CreateMeasurementInput): Promise<MeasurementRow> {
    if (this.getDataSource() === "database") {
      return measurementPrismaRepository.create(input);
    }
    const id = `meas-custom-${Date.now()}`;
    const row: MeasurementRow = { id, ...input };
    customMeasurements.set(id, row);
    return row;
  }

  async update(id: string, input: Partial<CreateMeasurementInput>): Promise<MeasurementRow> {
    if (this.getDataSource() === "database") {
      return measurementPrismaRepository.update(id, input);
    }
    const current = await this.findById(id);
    if (!current) throw ApiError.notFound("Medición", id);
    const next = { ...current, ...input, id };
    customMeasurements.set(id, next);
    return next;
  }

  async softDelete(id: string): Promise<boolean> {
    if (this.getDataSource() === "database") {
      return measurementPrismaRepository.softDelete(id);
    }
    if (!(await this.findById(id))) return false;
    markSoftDeleted(ENTITY, id);
    customMeasurements.delete(id);
    return true;
  }
}

export const measurementRepository = new MeasurementRepository();
