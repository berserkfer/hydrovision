import { NextResponse } from "next/server";
import { clientKeyFromRequest, satelliteRateLimiter } from "@/server/api/rate-limit";
import {
  DEFAULT_HORIZON_DAYS,
  getCampaignOpportunities,
} from "@/server/satellite/opportunities/opportunity.service";

const MIN_HORIZON = 3;
const MAX_HORIZON = 16;

export async function GET(request: Request) {
  const rate = satelliteRateLimiter.check(clientKeyFromRequest(request));
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, error: "Demasiadas peticiones. Intenta en unos segundos." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const url = new URL(request.url);
  const stationId = url.searchParams.get("stationId");
  const daysParam = Number(url.searchParams.get("days") ?? DEFAULT_HORIZON_DAYS);

  if (!stationId) {
    return NextResponse.json(
      { ok: false, error: "Falta stationId." },
      { status: 400 }
    );
  }

  const days = Number.isFinite(daysParam)
    ? Math.min(Math.max(Math.round(daysParam), MIN_HORIZON), MAX_HORIZON)
    : DEFAULT_HORIZON_DAYS;

  const result = await getCampaignOpportunities(stationId, days);

  if (!result) {
    return NextResponse.json(
      { ok: false, error: `Estación no encontrada: ${stationId}.` },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, ...result });
}
