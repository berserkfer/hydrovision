import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCampaignOpportunities } from "@/server/satellite/opportunities/opportunity.service";

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.includes("planetarycomputer")) {
      return new Response(
        JSON.stringify({
          features: [
            { id: "S2A_A", properties: { datetime: "2026-10-10T10:00:00Z" }, assets: {} },
            { id: "S2A_B", properties: { datetime: "2026-10-15T10:00:00Z" }, assets: {} },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    if (url.includes("open-meteo")) {
      return new Response(
        JSON.stringify({
          daily: { time: ["2026-10-25"], cloud_cover_mean: [12] },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    return new Response("{}", { status: 200 });
  }) as typeof fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("getCampaignOpportunities", () => {
  it("devuelve null para una estación inexistente", async () => {
    const result = await getCampaignOpportunities("no-existe", 14);
    expect(result).toBeNull();
  });

  it("proyecta pasadas y cruza el pronóstico de nubosidad", async () => {
    const result = await getCampaignOpportunities("dren-4000-p6", 14, "2026-10-20");

    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.station.codigo).toBe("P6");
    expect(result.historyScenes).toBe(2);
    expect(result.opportunities.length).toBeGreaterThan(0);

    const oct25 = result.opportunities.find((o) => o.date === "2026-10-25");
    expect(oct25).toBeDefined();
    expect(oct25?.cloudCoverPercent).toBe(12);
    expect(oct25?.recommended).toBe(true);
    expect(oct25?.window.from).toBe("2026-10-22");
  });

  it("incluye el descargo de que no es una efeméride oficial", async () => {
    const result = await getCampaignOpportunities("dren-4000-p6", 14, "2026-10-20");
    expect(result?.disclaimer).toContain("no de una efeméride orbital oficial");
  });
});
