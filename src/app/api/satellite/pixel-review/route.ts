/**
 * Revisión de píxeles de agua — se calcula en segundo plano y se guarda.
 *
 * GET  /api/satellite/pixel-review[?format=csv]  último resultado guardado + estado del cálculo
 *                                                (no calcula nada: responde al instante)
 * POST /api/satellite/pixel-review               lanza el recálculo en segundo plano ({ days })
 */

import { NextResponse } from "next/server";
import { runRouteHandler } from "@/server/api/handler";
import { ApiError } from "@/server/api/errors";
import { requirePermission } from "@/server/authorization/guards";
import { getJobState, getLatestResult, startJob } from "@/server/jobs/background-jobs";
import {
  PIXEL_REVIEW_JOB,
  buildPixelReview,
  pixelReviewToCsv,
  type PixelReviewReport,
} from "@/server/satellite/pixel-review.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "STATIONS_VIEW");
    const [state, latest] = await Promise.all([
      getJobState(PIXEL_REVIEW_JOB),
      getLatestResult<PixelReviewReport>(PIXEL_REVIEW_JOB),
    ]);

    if (new URL(request.url).searchParams.get("format") === "csv") {
      if (!latest) throw ApiError.notFound("Revisión de píxeles calculada");
      return new NextResponse(pixelReviewToCsv(latest.result), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="revision-pixeles-${latest.computedAt.slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({ success: true, data: { state, latest } });
  });
}

export async function POST(request: Request) {
  return runRouteHandler(async () => {
    const user = await requirePermission(request, "IMPORT_DATA");
    const body = (await request.json().catch(() => ({}))) as { days?: unknown };
    const days = typeof body.days === "number" && Number.isFinite(body.days) ? body.days : 90;

    const { started, state } = await startJob(
      PIXEL_REVIEW_JOB,
      (report) => buildPixelReview({ days, onProgress: report }),
      { requestedBy: user.email || user.id }
    );
    return NextResponse.json({ success: true, data: { started, state } }, { status: started ? 202 : 200 });
  });
}
