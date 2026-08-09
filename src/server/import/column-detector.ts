/**
 * Detección automática de columnas — Sprint 3F
 */

import type { ColumnMapping, ImportField } from "./import.types";

const FIELD_ALIASES: Record<Exclude<ImportField, "skip">, string[]> = {
  station_code: [
    "station_code",
    "codigo_estacion",
    "codigo",
    "estacion_codigo",
    "station id",
    "station_id",
    "cod_estacion",
  ],
  station: ["station", "estacion", "station_name", "nombre_estacion", "nombre estacion", "punto"],
  date: ["date", "fecha", "fecha_muestreo", "sample_date", "fecha medicion", "fecha_medicion"],
  parameter: ["parameter", "parametro", "param", "variable", "analito"],
  value: ["value", "valor", "resultado", "measurement", "medicion"],
  unit: ["unit", "unidad", "units"],
  latitude: ["latitude", "latitud", "lat"],
  longitude: ["longitude", "longitud", "lng", "lon"],
  campaign: ["campaign", "campana", "campana_codigo", "campaign_code", "codigo_campana"],
  observations: ["observations", "observaciones", "notas", "comments", "comentario"],
};

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function detectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const usedFields = new Set<ImportField>();

  for (const header of headers) {
    const normalized = normalizeHeader(header);
    let matched: ImportField = "skip";

    for (const [field, aliases] of Object.entries(FIELD_ALIASES) as Array<
      [Exclude<ImportField, "skip">, string[]]
    >) {
      if (usedFields.has(field)) continue;
      const hit = aliases.some(
        (alias) => normalized === alias || normalized.includes(alias) || alias.includes(normalized)
      );
      if (hit) {
        matched = field;
        usedFields.add(field);
        break;
      }
    }

    mapping[header] = matched;
  }

  return mapping;
}

export function suggestMappingForHeader(header: string): ImportField {
  const single = detectColumnMapping([header]);
  return single[header] ?? "skip";
}
