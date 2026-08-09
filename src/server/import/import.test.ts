/**
 * Pruebas del módulo de importación — Sprint 3F
 */

import { describe, expect, it } from "vitest";
import { detectColumnMapping } from "@/server/import/column-detector";
import { parseCsvBuffer } from "@/server/import/csv-parser";
import { assertImportFileAllowed, MAX_IMPORT_FILE_BYTES } from "@/server/import/file-security";
import { validateImportRows, type ImportReferenceData } from "@/server/import/import-validator";
import { ApiError } from "@/server/api/errors";

const REFS: ImportReferenceData = {
  stationCodes: new Set(["E-01", "E-02"]),
  stationNames: new Set(["estacion reque"]),
  campaignCodes: new Set(["CAMP-2025-01"]),
  campaignNames: new Set(["campaña seca 2025"]),
  parameterCodes: new Set(["ph", "temperature", "dissolved_oxygen"]),
  parameterNames: new Set(["ph", "temperatura"]),
};

describe("CSV válido", () => {
  it("parsea encabezados y filas", () => {
    const csv = Buffer.from(
      "station_code,campaign,date,parameter,value\nE-01,CAMP-2025-01,2025-03-12,ph,7.2\n",
      "utf-8"
    );
    const parsed = parseCsvBuffer(csv);
    expect(parsed.rowCount).toBe(1);
    expect(parsed.headers).toContain("station_code");
    expect(parsed.rows[0].value).toBe("7.2");
  });
});

describe("Detección de columnas", () => {
  it("mapea encabezados comunes", () => {
    const mapping = detectColumnMapping([
      "station_code",
      "fecha_muestreo",
      "parametro",
      "valor",
    ]);
    expect(mapping.station_code).toBe("station_code");
    expect(mapping.fecha_muestreo).toBe("date");
    expect(mapping.parametro).toBe("parameter");
    expect(mapping.valor).toBe("value");
  });
});

describe("CSV con columnas incorrectas", () => {
  it("marca skip en columnas no reconocidas", () => {
    const mapping = detectColumnMapping(["foo", "bar"]);
    expect(mapping.foo).toBe("skip");
    expect(mapping.bar).toBe("skip");
  });
});

describe("Validación de filas", () => {
  const mapping = detectColumnMapping([
    "station_code",
    "campaign",
    "date",
    "parameter",
    "value",
    "unit",
  ]);

  it("acepta fila válida", () => {
    const summary = validateImportRows(
      [
        {
          station_code: "E-01",
          campaign: "CAMP-2025-01",
          date: "2025-03-12",
          parameter: "ph",
          value: "7.2",
          unit: "—",
        },
      ],
      mapping,
      REFS
    );
    expect(summary.validCount).toBe(1);
    expect(summary.errorCount).toBe(0);
  });

  it("detecta datos faltantes", () => {
    const summary = validateImportRows(
      [{ station_code: "", date: "", parameter: "", value: "" }],
      mapping,
      REFS
    );
    expect(summary.errorCount).toBeGreaterThan(0);
  });

  it("rechaza valores inválidos", () => {
    const summary = validateImportRows(
      [
        {
          station_code: "E-01",
          campaign: "CAMP-2025-01",
          date: "2025-03-12",
          parameter: "ph",
          value: "no-numeric",
          unit: "—",
        },
      ],
      mapping,
      REFS
    );
    expect(summary.errorCount).toBe(1);
  });

  it("rechaza fechas inválidas", () => {
    const summary = validateImportRows(
      [
        {
          station_code: "E-01",
          campaign: "CAMP-2025-01",
          date: "fecha-invalida",
          parameter: "ph",
          value: "7",
          unit: "—",
        },
      ],
      mapping,
      REFS
    );
    expect(summary.errorCount).toBe(1);
  });

  it("rechaza coordenadas inválidas", () => {
    const mapWithCoords = {
      ...mapping,
      latitud: "latitude" as const,
      longitud: "longitude" as const,
    };
    const summary = validateImportRows(
      [
        {
          station_code: "E-01",
          campaign: "CAMP-2025-01",
          date: "2025-03-12",
          parameter: "ph",
          value: "7",
          unit: "—",
          latitud: "999",
          longitud: "0",
        },
      ],
      mapWithCoords,
      REFS
    );
    expect(summary.errorCount).toBe(1);
  });
});

describe("Seguridad de archivos", () => {
  it("rechaza archivo vacío", () => {
    expect(() => assertImportFileAllowed("data.csv", "text/csv", 0)).toThrow(ApiError);
  });

  it("rechaza extensión incompatible", () => {
    expect(() => assertImportFileAllowed("malware.exe", "application/octet-stream", 100)).toThrow(
      ApiError
    );
  });

  it("rechaza tamaño excesivo", () => {
    expect(() =>
      assertImportFileAllowed("big.csv", "text/csv", MAX_IMPORT_FILE_BYTES + 1)
    ).toThrow(ApiError);
  });

  it("acepta csv válido", () => {
    expect(assertImportFileAllowed("datos.csv", "text/csv", 1024)).toBe("csv");
  });
});

describe("Archivo CSV vacío", () => {
  it("lanza error de validación", () => {
    expect(() => parseCsvBuffer(Buffer.from("   ", "utf-8"))).toThrow(ApiError);
  });
});
