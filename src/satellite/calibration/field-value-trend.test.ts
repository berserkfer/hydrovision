/**
 * Tests — tendencia temporal de campo (valor ~ tiempo).
 */

import { describe, expect, it } from "vitest";
import { computeFieldValueTrend, type FieldTrendInputPoint } from "./field-value-trend";

function point(date: string, value: number, id: string): FieldTrendInputPoint {
  return { date, value, sampleId: id, isSimulated: false };
}

describe("computeFieldValueTrend", () => {
  it("insuficiente con solo 2 fechas — aunque 'ajuste perfecto', no es significativo", () => {
    const result = computeFieldValueTrend([
      point("2014-03-01", 10, "a"),
      point("2014-09-01", 20, "b"),
    ]);
    expect(result.status).toBe("INSUFFICIENT_TEMPORAL_DATA");
    expect(result.trend).toBeNull();
    expect(result.forecast).toBeNull();
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("insuficiente con menos del mínimo de puntos aunque haya varias fechas", () => {
    const result = computeFieldValueTrend([
      point("2015-01-01", 10, "a"),
      point("2016-01-01", 12, "b"),
      point("2017-01-01", 14, "c"),
    ]);
    expect(result.status).toBe("INSUFFICIENT_TEMPORAL_DATA");
  });

  it("calcula tendencia y proyección con datos suficientes, siempre con métricas visibles", () => {
    const result = computeFieldValueTrend(
      [
        point("2015-01-01", 10, "a"),
        point("2016-01-01", 12, "b"),
        point("2017-01-01", 14, "c"),
        point("2018-01-01", 16, "d"),
      ],
      90
    );

    expect(result.status).toBe("TREND_AVAILABLE");
    expect(result.trend).not.toBeNull();
    expect(Number.isFinite(result.trend!.metrics.r2)).toBe(true);
    expect(Number.isFinite(result.trend!.metrics.rmse)).toBe(true);
    expect(Number.isFinite(result.trend!.metrics.mae)).toBe(true);
    expect(result.trend!.slopePerYear).toBeGreaterThan(0);
    expect(result.forecast).not.toBeNull();
    expect(result.forecast!.horizonDays).toBe(90);
  });

  it("limita el horizonte de proyección al máximo configurado", () => {
    const result = computeFieldValueTrend(
      [
        point("2015-01-01", 10, "a"),
        point("2016-01-01", 12, "b"),
        point("2017-01-01", 14, "c"),
        point("2018-01-01", 16, "d"),
      ],
      100000
    );
    expect(result.forecast!.horizonDays).toBeLessThanOrEqual(180);
  });
});
