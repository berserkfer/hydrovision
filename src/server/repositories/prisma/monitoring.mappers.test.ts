/**
 * Pruebas de mappers Prisma → dominio (Prompt 1)
 */

import { describe, expect, it } from "vitest";
import { aggregateMedicionesToParametros } from "@/database/mappers/hydrovision-store.mapper";
import type { Measurement, Muestreo, Parameter } from "@prisma/client";
import { mapCampaignStats, addMonths } from "@/server/repositories/prisma/monitoring.mappers";

describe("aggregateMedicionesToParametros", () => {
  it("agrega mediciones normalizadas al shape plano de dominio", () => {
    const muestreo: Muestreo = {
      id: "m1",
      campanaId: "c1",
      puntoMonitoreoId: "e1",
      codigoMuestra: "E01-20250101",
      fechaMuestreo: new Date("2025-01-01T10:00:00.000Z"),
      responsableId: "usr-investigador",
      clima: "Soleado",
      colorAparente: "Claro",
      estado: "registered",
      observaciones: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const paramPh: Parameter = {
      id: "param-ph",
      codigo: "ph",
      nombre: "pH",
      unidad: "UPH",
      categoryId: null,
      unitId: null,
      descripcion: null,
      estado: "active",
      observaciones: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mediciones: Array<Measurement & { parametro: Parameter }> = [
      {
        id: "med1",
        muestreoId: "m1",
        campanaId: "c1",
        parametroId: "param-ph",
        puntoMonitoreoId: "e1",
        unitId: null,
        valor: 7.2,
        unidad: "UPH",
        cumplimientoEca: null,
        comentario: null,
        fechaMedicion: new Date("2025-01-01T10:00:00.000Z"),
        metodoAnalisis: null,
        laboratorio: null,
        equipoUtilizado: null,
        nivelConfianza: null,
        responsableId: null,
        calidadDato: "valid",
        estado: "active",
        observaciones: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        parametro: paramPh,
      },
    ];

    const result = aggregateMedicionesToParametros([muestreo], mediciones);
    expect(result).toHaveLength(1);
    expect(result[0].ph).toBe(7.2);
    expect(result[0].muestraId).toBe("m1");
    expect(result[0].isSimulated).toBe(false);
  });
});

describe("monitoring.mappers utilities", () => {
  it("calcula addMonths correctamente", () => {
    expect(addMonths("2025-01-15", 2)).toBe("2025-03-15");
  });

  it("mapCampaignStats cuenta estados", () => {
    const stats = mapCampaignStats([
      { estado: "active" } as never,
      { estado: "planned" } as never,
      { estado: "completed" } as never,
    ]);
    expect(stats.total).toBe(3);
    expect(stats.enCurso).toBe(1);
    expect(stats.planificadas).toBe(1);
    expect(stats.finalizadas).toBe(1);
  });
});
