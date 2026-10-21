import { describe, expect, it } from "vitest";
import type { SatelliteObservation } from "@/satellite/types/satellite-observation.types";
import type { WaterPixelSelectionRecord } from "@/satellite/quality/water-pixel-selection";
import { buildPixelReview, pixelReviewToCsv } from "./pixel-review.service";

function selection(overrides: Partial<WaterPixelSelectionRecord>): WaterPixelSelectionRecord {
  return {
    status: "center_water",
    usable: true,
    reason: "El píxel del punto es agua.",
    originalCoordinate: { latitude: -6.87, longitude: -79.93 },
    adjustedCoordinate: { latitude: -6.87, longitude: -79.93 },
    adjustmentDistanceM: 0,
    pixelOffset: { dRow: 0, dCol: 0 },
    searchRadiusM: 30,
    channelCheck: "connected_water_body",
    cloudMode: "strict",
    window: { waterPixels: 9, validPixels: 9, contaminatedPixels: 0, waterFraction: 1 },
    selectedNdwi: 0.5,
    selectedScl: 6,
    ...overrides,
  };
}

function obs(date: string, sel?: WaterPixelSelectionRecord): SatelliteObservation {
  return {
    id: `planetary-x-${date}`,
    stationId: "x",
    acquisitionDate: date,
    sceneId: `S2A_${date}`,
    cloudPercentage: 10,
    provider: "planetary",
    isSimulated: false,
    ...(sel ? { waterPixelSelection: sel } : {}),
  } as unknown as SatelliteObservation;
}

describe("buildPixelReview", () => {
  it("lista ajustados, bloqueados y puntos sin escenas", async () => {
    const report = await buildPixelReview({}, {
      now: () => new Date("2026-10-21T12:00:00Z"),
      channelName: async () => null,
      listObservations: async ({ stationId = "" }) => {
        if (stationId.endsWith("p1")) {
          return [
            obs("2026-10-09", selection({ status: "adjusted", adjustmentDistanceM: 10, pixelOffset: { dRow: 0, dCol: 1 } })),
            obs("2026-10-04", selection({ status: "discarded_clouds", usable: false, adjustedCoordinate: null, reason: "Nubes" })),
          ];
        }
        if (stationId.endsWith("p2")) return [obs("2026-10-09", selection({}))];
        if (stationId.endsWith("p3")) return [obs("2026-10-09")]; // proveedor sin selección
        return [];
      },
    });

    expect(report.summary.adjusted).toBe(1);
    expect(report.summary.discarded_clouds).toBe(1);
    expect(report.summary.center_water).toBe(1);
    expect(report.summary.not_evaluated).toBe(1);
    expect(report.stationsWithoutScenes.map((s) => s.codigo)).toEqual(["P4", "P5", "P6", "P7", "P8", "P9", "P10"]);

    const adjusted = report.rows.find((r) => r.status === "adjusted")!;
    expect(adjusted).toMatchObject({ codigo: "P1", adjustmentDistanceM: 10, provider: "planetary", usable: true });

    const csv = pixelReviewToCsv(report);
    expect(csv.split("\n")[0]).toContain("distancia_ajuste_m");
    expect(csv).toContain("discarded_clouds");
  });

  it("no inventa filas si el proveedor falla", async () => {
    const report = await buildPixelReview({}, {
      now: () => new Date("2026-10-21T12:00:00Z"),
      channelName: async () => null,
      listObservations: async () => {
        throw new Error("timeout");
      },
    });
    expect(report.rows).toHaveLength(0);
    expect(report.stationsWithoutScenes).toHaveLength(10);
  });
});
