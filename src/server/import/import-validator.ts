/**
 * Validador de filas de importación — Sprint 3F
 */

import type {
  ColumnMapping,
  ImportValidationSummary,
  NormalizedImportRow,
  RowValidationResult,
  RowValidationStatus,
} from "./import.types";

export interface ImportReferenceData {
  stationCodes: Set<string>;
  stationNames: Set<string>;
  campaignCodes: Set<string>;
  campaignNames: Set<string>;
  parameterCodes: Set<string>;
  parameterNames: Set<string>;
}

const PARAMETER_ALIASES: Record<string, string> = {
  ph: "ph",
  turbidity: "turbidity",
  turbidez: "turbidity",
  ntu: "turbidity",
  conductivity: "conductivity",
  conductividad: "conductivity",
  dissolved_oxygen: "dissolved_oxygen",
  oxigeno_disuelto: "dissolved_oxygen",
  od: "dissolved_oxygen",
  temperature: "temperature",
  temperatura: "temperature",
  bod5: "bod5",
  dbo5: "bod5",
  cod: "cod",
  dqo: "cod",
  coliforms: "coliforms",
  coliformes: "coliforms",
  nitrates: "nitrates",
  nitratos: "nitrates",
  phosphates: "phosphates",
  fosfatos: "phosphates",
  total_dissolved_solids: "total_dissolved_solids",
  solidos_disueltos: "total_dissolved_solids",
  tds: "total_dissolved_solids",
  flow_rate: "flow_rate",
  caudal: "flow_rate",
};

const VALUE_RANGES: Record<string, { min: number; max: number; label: string }> = {
  ph: { min: 0, max: 14, label: "pH" },
  temperature: { min: -5, max: 50, label: "Temperatura" },
  dissolved_oxygen: { min: 0, max: 25, label: "Oxígeno disuelto" },
  turbidity: { min: 0, max: 10000, label: "Turbidez" },
  conductivity: { min: 0, max: 100000, label: "Conductividad" },
};

function normalizeParamKey(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/\s+/g, "_");
  return PARAMETER_ALIASES[key] ?? key;
}

function parseNumber(raw: string | undefined): number | undefined {
  if (raw == null || raw === "") return undefined;
  const normalized = raw.replace(",", ".").trim();
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
}

function isValidDateString(date?: string): boolean {
  if (!date) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = new Date(`${date}T12:00:00.000Z`);
  return !Number.isNaN(d.getTime());
}

function parseDate(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined;
  const value = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const dmy = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return undefined;
}

export function normalizeRow(
  rowIndex: number,
  raw: Record<string, string>,
  mapping: ColumnMapping
): NormalizedImportRow {
  const normalized: NormalizedImportRow = { rowIndex };
  for (const [column, field] of Object.entries(mapping)) {
    if (field === "skip") continue;
    const value = raw[column]?.trim();
    if (!value) continue;
    switch (field) {
      case "station_code":
        normalized.stationCode = value.toUpperCase();
        break;
      case "station":
        normalized.stationName = value;
        break;
      case "date":
        normalized.date = value;
        break;
      case "parameter":
        normalized.parameter = value;
        break;
      case "value":
        normalized.value = parseNumber(value);
        break;
      case "unit":
        normalized.unit = value;
        break;
      case "latitude":
        normalized.latitude = parseNumber(value);
        break;
      case "longitude":
        normalized.longitude = parseNumber(value);
        break;
      case "campaign":
        normalized.campaign = value;
        break;
      case "observations":
        normalized.observations = value;
        break;
    }
  }
  normalized.date = parseDate(normalized.date) ?? normalized.date;
  return normalized;
}

export function validateImportRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  refs: ImportReferenceData
): ImportValidationSummary {
  const results: RowValidationResult[] = rows.map((row, index) => {
    const normalized = normalizeRow(index + 1, row, mapping);
    const messages: string[] = [];
    let status: RowValidationStatus = "valid";

    const addError = (msg: string) => {
      messages.push(msg);
      status = "error";
    };
    const addWarning = (msg: string) => {
      messages.push(msg);
      if (status !== "error") status = "warning";
    };

    if (!normalized.stationCode && !normalized.stationName) {
      addError("Falta código o nombre de estación");
    } else {
      if (
        normalized.stationCode &&
        refs.stationCodes.size > 0 &&
        !refs.stationCodes.has(normalized.stationCode)
      ) {
        addError(`Estación '${normalized.stationCode}' no existe en el sistema`);
      }
      if (
        normalized.stationName &&
        refs.stationNames.size > 0 &&
        !refs.stationNames.has(normalized.stationName.toLowerCase())
      ) {
        addWarning(`Nombre de estación '${normalized.stationName}' no reconocido`);
      }
    }

    if (!isValidDateString(normalized.date)) {
      addError("Fecha de muestreo obligatoria o inválida");
    }

    if (!normalized.parameter) {
      addError("Parámetro obligatorio");
    } else {
      const paramKey = normalizeParamKey(normalized.parameter);
      const known =
        refs.parameterCodes.has(paramKey) ||
        refs.parameterNames.has(normalized.parameter.toLowerCase());
      if (refs.parameterCodes.size > 0 && !known) {
        addError(`Parámetro '${normalized.parameter}' no existe en el catálogo`);
      }
      normalized.parameter = paramKey;
    }

    if (normalized.value == null) {
      addError("Valor numérico obligatorio o inválido");
    } else {
      const range = VALUE_RANGES[normalized.parameter ?? ""];
      if (range && (normalized.value < range.min || normalized.value > range.max)) {
        addWarning(
          `${range.label} fuera de rango esperado (${range.min}–${range.max}): ${normalized.value}`
        );
      }
    }

    if (normalized.latitude != null && (normalized.latitude < -90 || normalized.latitude > 90)) {
      addError("Latitud inválida (-90 a 90)");
    }
    if (normalized.longitude != null && (normalized.longitude < -180 || normalized.longitude > 180)) {
      addError("Longitud inválida (-180 a 180)");
    }

    if (normalized.campaign) {
      const c = normalized.campaign.toUpperCase();
      const known =
        refs.campaignCodes.has(c) ||
        refs.campaignNames.has(normalized.campaign.toLowerCase());
      if (refs.campaignCodes.size > 0 && !known) {
        addError(`Campaña '${normalized.campaign}' no existe en el sistema`);
      }
    } else if (refs.campaignCodes.size > 0) {
      addWarning("Campaña no especificada; se intentará inferir durante la importación");
    }

    if (!normalized.unit) {
      addWarning("Unidad no especificada");
    }

    return { rowIndex: index + 1, status, messages, normalized };
  });

  return {
    totalRows: results.length,
    validCount: results.filter((r) => r.status === "valid").length,
    warningCount: results.filter((r) => r.status === "warning").length,
    errorCount: results.filter((r) => r.status === "error").length,
    rows: results,
  };
}
