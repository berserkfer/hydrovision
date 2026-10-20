/**
 * Tipo de punto de monitoreo según su código.
 *
 * Para el Dren 4000: P1 es el efluente de la laguna de oxidación, P2–P5 son
 * efluentes de procesamiento pesquero, P8 es agua de proceso (no descarga) y
 * P6–P10 están en la zona marina. Cualquier otro código se trata como cauce.
 */

import type { MonitoringPointType } from "./resolve";

export function pointTypeForCode(codigo: string): MonitoringPointType | null {
  const n = Number.parseInt(codigo.replace(/\D/g, ""), 10);
  if (!Number.isFinite(n)) return null;
  if (n === 1) return "efluente_ptar";
  if (n >= 2 && n <= 5) return "efluente_pesca";
  if (n === 8) return null;
  if (n >= 6) return "mar";
  return "cauce";
}
