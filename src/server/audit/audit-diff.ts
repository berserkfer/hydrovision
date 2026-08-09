/**
 * Utilidades de comparación para auditoría — Sprint 3H
 */

import type { AuditDiffField } from "./audit.types";

function serialize(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function computeAuditDiff(
  previous: Record<string, unknown> | null,
  next: Record<string, unknown> | null
): AuditDiffField[] {
  const prev = previous ?? {};
  const neu = next ?? {};
  const keys = new Set([...Object.keys(prev), ...Object.keys(neu)]);
  const fields: AuditDiffField[] = [];

  for (const field of Array.from(keys).sort()) {
    const prevVal = serialize(prev[field]);
    const nextVal = serialize(neu[field]);
    fields.push({
      field,
      previous: prevVal,
      next: nextVal,
      changed: prevVal !== nextVal,
    });
  }

  return fields;
}

export function summarizeDiff(fields: AuditDiffField[]): AuditDiffField[] {
  return fields.filter((f) => f.changed);
}

export function toAuditPayload(data: unknown): Record<string, unknown> | null {
  if (data == null) return null;
  if (typeof data !== "object") return { value: data };
  try {
    return JSON.parse(JSON.stringify(data)) as Record<string, unknown>;
  } catch {
    return { value: String(data) };
  }
}
