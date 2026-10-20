import { describe, expect, it } from "vitest";
import {
  buildOpportunity,
  classifyCloudCover,
  projectFutureOverpasses,
  samplingWindow,
} from "@/satellite/opportunities/overpass";

describe("projectFutureOverpasses", () => {
  it("proyecta el ciclo de 5 días dentro del horizonte", () => {
    const result = projectFutureOverpasses(["2026-10-10"], {
      today: "2026-10-20",
      horizonDays: 20,
    });
    expect(result.map((r) => r.date)).toEqual([
      "2026-10-20",
      "2026-10-25",
      "2026-10-30",
      "2026-11-04",
      "2026-11-09",
    ]);
    expect(result.every((r) => r.daysFromToday >= 0 && r.daysFromToday <= 20)).toBe(true);
  });

  it("deduplica fechas cuando varias adquisiciones caen en el mismo ciclo", () => {
    const result = projectFutureOverpasses(["2026-10-10", "2026-10-15"], {
      today: "2026-10-20",
      horizonDays: 10,
    });
    const dates = result.map((r) => r.date);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it("ignora fechas pasadas fuera del horizonte", () => {
    const result = projectFutureOverpasses(["2026-09-01"], {
      today: "2026-10-20",
      horizonDays: 5,
    });
    expect(result.every((r) => r.date >= "2026-10-20")).toBe(true);
  });

  it("sin adquisiciones no inventa pasadas", () => {
    expect(
      projectFutureOverpasses([], { today: "2026-10-20", horizonDays: 14 })
    ).toEqual([]);
  });
});

describe("classifyCloudCover", () => {
  it("clasifica buena, aceptable, mala y desconocida", () => {
    expect(classifyCloudCover(10)).toBe("good");
    expect(classifyCloudCover(30)).toBe("acceptable");
    expect(classifyCloudCover(70)).toBe("poor");
    expect(classifyCloudCover(null)).toBe("unknown");
  });
});

describe("samplingWindow", () => {
  it("calcula ±3 días alrededor de la pasada", () => {
    expect(samplingWindow("2026-10-25", 3)).toEqual({
      from: "2026-10-22",
      to: "2026-10-28",
    });
  });
});

describe("buildOpportunity", () => {
  it("recomienda una fecha con nubosidad buena", () => {
    const opportunity = buildOpportunity(
      { date: "2026-10-25", daysFromToday: 5 },
      15
    );
    expect(opportunity.recommended).toBe(true);
    expect(opportunity.suitability).toBe("good");
    expect(opportunity.window.from).toBe("2026-10-22");
  });

  it("no recomienda sin pronóstico, pero conserva la fecha", () => {
    const opportunity = buildOpportunity(
      { date: "2026-10-25", daysFromToday: 5 },
      null
    );
    expect(opportunity.recommended).toBe(false);
    expect(opportunity.cloudCoverPercent).toBeNull();
  });
});
