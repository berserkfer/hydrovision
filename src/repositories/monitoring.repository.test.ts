/**
 * Pruebas — serie temporal del dashboard y selección de DATA_SOURCE
 */

import { describe, expect, it, beforeEach } from "vitest";
import { getAggregatedTimeSeries } from "@/repositories/monitoring.repository";
import {
  getMonitoringDataSource,
  isMonitoringDatabaseEnabled,
} from "@/config/monitoring-data-source.config";
import { setDataProvider, resetDataProvider } from "@/data/store-access";
import { mockDataProvider } from "@/providers/mock-data.provider";
import type { HydroVisionDataStore } from "@/models";

function buildStoreWithSamples(): HydroVisionDataStore {
  const base = mockDataProvider.getStore();
  return {
    ...base,
    muestras: [
      {
        id: "m1",
        campanaId: "c1",
        estacionId: "e1",
        codigoMuestra: "E01-20250115",
        fechaMuestreo: "2025-01-15T10:00:00.000Z",
        responsableId: "usr-admin",
        clima: "Soleado",
        colorAparente: "Claro",
        createdAt: "2025-01-15T10:00:00.000Z",
        updatedAt: "2025-01-15T10:00:00.000Z",
        isSimulated: true,
      },
      {
        id: "m2",
        campanaId: "c1",
        estacionId: "e1",
        codigoMuestra: "E01-20250215",
        fechaMuestreo: "2025-02-15T10:00:00.000Z",
        responsableId: "usr-admin",
        clima: "Nublado",
        colorAparente: "Verde",
        createdAt: "2025-02-15T10:00:00.000Z",
        updatedAt: "2025-02-15T10:00:00.000Z",
        isSimulated: true,
      },
    ],
    parametros: [
      {
        id: "p1",
        muestraId: "m1",
        estacionId: "e1",
        ph: 7.2,
        turbidez: 10,
        conductividad: 400,
        oxigenoDisuelto: 6.5,
        temperatura: 24,
        dbo5: 8,
        dqo: 20,
        solidosDisueltosTotales: 300,
        caudal: 2,
        createdAt: "2025-01-15T10:00:00.000Z",
        updatedAt: "2025-01-15T10:00:00.000Z",
        isSimulated: true,
      },
      {
        id: "p2",
        muestraId: "m2",
        estacionId: "e1",
        ph: 7.4,
        turbidez: 12,
        conductividad: 420,
        oxigenoDisuelto: 6.8,
        temperatura: 25,
        dbo5: 8,
        dqo: 20,
        solidosDisueltosTotales: 310,
        caudal: 2.1,
        createdAt: "2025-02-15T10:00:00.000Z",
        updatedAt: "2025-02-15T10:00:00.000Z",
        isSimulated: true,
      },
    ],
  };
}

describe("getAggregatedTimeSeries", () => {
  beforeEach(() => {
    resetDataProvider();
    setDataProvider({
      ...mockDataProvider,
      getStore: () => buildStoreWithSamples(),
    });
  });

  it("agrega promedios mensuales desde muestreos del data store", () => {
    const series = getAggregatedTimeSeries();
    expect(series).toHaveLength(2);
    expect(series[0].date).toBe("2025-01");
    expect(series[0].ph).toBe(7.2);
    expect(series[1].date).toBe("2025-02");
    expect(series[1].dissolvedOxygen).toBe(6.8);
  });

  it("devuelve arreglo vacío si no hay muestreos", () => {
    setDataProvider({
      ...mockDataProvider,
      getStore: () => ({ ...mockDataProvider.getStore(), muestras: [], parametros: [] }),
    });
    expect(getAggregatedTimeSeries()).toEqual([]);
  });
});

describe("monitoring data source config", () => {
  it("expone database o mock según entorno", () => {
    expect(["database", "mock"]).toContain(getMonitoringDataSource());
    expect(typeof isMonitoringDatabaseEnabled()).toBe("boolean");
  });
});
