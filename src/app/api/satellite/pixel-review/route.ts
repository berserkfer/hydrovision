/**
 * GET /api/satellite/pixel-review?days=90[&format=csv]
 * Puntos del Dren 4000 cuyo píxel de agua se ajustó, bloqueó o descartó, para revisar antes de calibrar.
 */

import { NextResponse } from "next/server";
import { runRouteHandler } from "@/server/api/handler";
import { clientKeyFromRequest, satelliteRateLimiter } from "@/server/api/rate-limit";
import { requirePermission } from "@/server/authorization/guards";
import { buildPixelReview, pixelReviewToCsv } from "@/server/satellite/pixel-review.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "STATIONS_VIEW");

    const rate = satelliteRateLimiter.check(clientKeyFromRequest(request));
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: { code: "RATE_LIMITED", message: "Demasiadas peticiones. Intenta en unos segundos." } },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get("days") ?? 90);
    const report = await buildPixelReview({ days: Number.isFinite(days) ? days : 90 });

    if (searchParams.get("format") === "csv") {
      return new NextResponse(pixelReviewToCsv(report), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="revision-pixeles-${report.generatedAt.slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({ success: true, data: report });
  });
}
