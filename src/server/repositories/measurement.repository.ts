/**
 * Measurement repository — Sprint 3E
 */

import { getDataStore } from "@/data/store-access";
import { filterActive, markSoftDeleted } from "@/server/lib/soft-delete";
import { ApiError } from "@/server/api/errors";
import type { CreateMeasurementInput } from "@/server/validators/schemas/crud.schemas";

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
    ];

    for (const [codigo, nombre, valor, unidad] of defs) {
      if (valor == null) continue;
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

function allRows(): MeasurementRow[] {
  const merged = [...fromStore(), ...Array.from(customMeasurements.values())];
  const byId = new Map<string, MeasurementRow>();
  merged.forEach((row) => byId.set(row.id, row));
  return filterActive(ENTITY, Array.from(byId.values()));
}

export class MeasurementRepository {
  findAll(): MeasurementRow[] {
    return allRows();
  }

  findById(id: string): MeasurementRow | null {
    return allRows().find((m) => m.id === id) ?? null;
  }

  create(input: CreateMeasurementInput): MeasurementRow {
    const id = `meas-custom-${Date.now()}`;
    const row: MeasurementRow = { id, ...input };
    customMeasurements.set(id, row);
    return row;
  }

  update(id: string, input: Partial<CreateMeasurementInput>): MeasurementRow {
    const current = this.findById(id);
    if (!current) throw ApiError.notFound("Medición", id);
    const next = { ...current, ...input, id };
    customMeasurements.set(id, next);
    return next;
  }

  softDelete(id: string): boolean {
    if (!this.findById(id)) return false;
    markSoftDeleted(ENTITY, id);
    customMeasurements.delete(id);
    return true;
  }
}

export const measurementRepository = new MeasurementRepository();
